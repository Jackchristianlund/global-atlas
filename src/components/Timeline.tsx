import { useEffect, useMemo, useState } from 'react';
import { CONFLICTS, EVENTS, EVENT_COLOR } from '../data';
import { conflictsAt, eventsInYear } from '../lib/selectors';
import { regionsWithData } from '../lib/territory';
import { FIRST_YEAR, SNAPSHOT_YEAR, useStore } from '../store';
import { fmtDate, useT } from '../i18n';
import type { EventType } from '../types';

const TYPES: EventType[] = ['escalation', 'ceasefire', 'alliance', 'sanction', 'trade', 'political'];

/**
 * Card width from the title's length: short titles keep the standard card, a
 * long one gets up to half again, so two lines hold most titles whole instead
 * of cutting them at "Hormuzstredet blir i praksis…".
 */
export function cardWidth(title: string): number {
  return Math.round(Math.min(320, Math.max(220, 120 + title.length * 2.6)));
}

interface Pop { text: string; date: string; color: string; x: number; y: number; open: boolean }

export default function Timeline() {
  const { t, tl, lang } = useT();
  const { year, setYear, playing, setPlaying, view, select, eventsCollapsed, setCollapsed } = useStore();
  const [types, setTypes] = useState<Set<EventType>>(() => new Set(TYPES));
  const all = useMemo(() => eventsInYear(EVENTS, year), [year]);
  const events = useMemo(() => all.filter((e) => types.has(e.type)), [all, types]);
  const n = useMemo(() => conflictsAt(CONFLICTS, year).length, [year]);
  const terr = useMemo(() => regionsWithData(year).length, [year]);
  // The full title, above the strip. Fixed-positioned so the strip's own
  // horizontal scroll cannot clip it.
  const [pop, setPop] = useState<Pop | null>(null);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const y = useStore.getState().year;
      if (y >= SNAPSHOT_YEAR) { setPlaying(false); return; }
      setYear(y + 1);
    }, 1200);
    return () => window.clearInterval(id);
  }, [playing, setYear, setPlaying]);

  const toggleType = (k: EventType) => setTypes((prev) => {
    const next = new Set(prev);
    if (next.has(k)) next.delete(k); else next.add(k);
    // Never filter to nothing: switching off the last type turns them all back on.
    return next.size ? next : new Set(TYPES);
  });

  const showPop = (el: HTMLElement, text: string, date: string, color: string, open: boolean) => {
    const r = el.getBoundingClientRect();
    setPop({ text, date, color, open, x: Math.min(Math.max(8, r.left), window.innerWidth - 368), y: r.top - 8 });
  };

  return (
    <footer className={`tl${view === 'history' ? ' tall' : ''}`} aria-label={t('period')}>
      <div className="tl-row">
        <button type="button" className="btn play" onClick={() => { if (year >= SNAPSHOT_YEAR && !playing) setYear(FIRST_YEAR); setPlaying(!playing); }} aria-pressed={playing}>
          {playing ? '❚❚ ' + t('pause') : '▶ ' + t('play')}
        </button>
        <span className="tl-year">{year}</span>
        <input
          type="range" min={FIRST_YEAR} max={SNAPSHOT_YEAR} step={1} value={year}
          onChange={(e) => { setPlaying(false); setYear(Number(e.target.value)); }}
          aria-label={t('year')} list="tl-ticks"
        />
        <datalist id="tl-ticks">{Array.from({ length: SNAPSHOT_YEAR - FIRST_YEAR + 1 }, (_, i) => <option key={i} value={FIRST_YEAR + i} />)}</datalist>
        {year !== SNAPSHOT_YEAR && <button type="button" className="mini" onClick={() => { setPlaying(false); setYear(SNAPSHOT_YEAR); }}>{t('today')}</button>}
        {/* Filter the strip by kind of event. Every type starts on; the
            filter only narrows what the strip shows, never the data. */}
        <div className="tl-types" role="group" aria-label={t('tl_types')}>
          {TYPES.map((k) => (
            <button
              key={k} type="button" className={types.has(k) ? 'on' : ''} aria-pressed={types.has(k)}
              style={{ ['--c' as string]: EVENT_COLOR[k] }} onClick={() => toggleType(k)}
            >
              <i aria-hidden="true" />{t(`ev_${k}` as 'ev_escalation')}
            </button>
          ))}
        </div>
        <span className="tl-count meta">{t('conflictsIn')} {year}: {n} · {t('terr')}: {terr} · {t('evInView')}: {events.length}</span>
        {/* The event strip is a third of the timeline's height. Folded, the
            year control stays and the map gets the rows back. */}
        <button
          type="button" className="mini fold" aria-expanded={!eventsCollapsed}
          onClick={() => setCollapsed('events', !eventsCollapsed)}
          aria-label={eventsCollapsed ? t('showEvents') : t('hideEvents')} title={eventsCollapsed ? t('showEvents') : t('hideEvents')}
        >{eventsCollapsed ? '▴' : '▾'}</button>
      </div>
      {year < SNAPSHOT_YEAR && <p className="note tl-note">{t('bordersToday')}</p>}
      {!eventsCollapsed && <div className="tl-events" role="list" aria-label={`${t('eventsIn')} ${year}`} onScroll={() => setPop(null)}>
        {events.length === 0 && <span className="meta">{t('noEvents')}</span>}
        {events.map((e, i) => {
          const title = tl(e.t);
          return (
            <button
              key={i} type="button" role="listitem" className="ev"
              style={{ ['--c' as string]: EVENT_COLOR[e.type], ['--evw' as string]: `${cardWidth(title)}px` }}
              onClick={() => e.conflict && select({ kind: 'conflict', id: e.conflict })}
              onMouseEnter={(ev) => showPop(ev.currentTarget, title, e.d, EVENT_COLOR[e.type], !!e.conflict)}
              onFocus={(ev) => showPop(ev.currentTarget, title, e.d, EVENT_COLOR[e.type], !!e.conflict)}
              onMouseLeave={() => setPop(null)}
              onBlur={() => setPop(null)}
              disabled={!e.conflict}
              aria-label={`${fmtDate(e.d, lang)}: ${title}`}
            >
              <time dateTime={e.d}>{fmtDate(e.d, lang)}</time>
              <span>{title}</span>
            </button>
          );
        })}
      </div>}
      {pop && (
        <div className="ev-pop" role="tooltip" style={{ left: pop.x, top: pop.y, transform: 'translateY(-100%)', ['--c' as string]: pop.color }}>
          <time>{fmtDate(pop.date, lang)}</time>
          {pop.text}
          {pop.open && <small>{t('tl_openConflict')}</small>}
        </div>
      )}
    </footer>
  );
}
