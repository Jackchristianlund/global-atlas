import { useEffect, useMemo } from 'react';
import { CONFLICTS, EVENTS, EVENT_COLOR } from '../data';
import { conflictsAt, eventsInYear } from '../lib/selectors';
import { regionsWithData } from '../lib/territory';
import { FIRST_YEAR, SNAPSHOT_YEAR, useStore } from '../store';
import { fmtDate, useT } from '../i18n';

export default function Timeline() {
  const { t, tl, lang } = useT();
  const { year, setYear, playing, setPlaying, view, select } = useStore();
  const events = useMemo(() => eventsInYear(EVENTS, year), [year]);
  const n = useMemo(() => conflictsAt(CONFLICTS, year).length, [year]);
  const terr = useMemo(() => regionsWithData(year).length, [year]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const y = useStore.getState().year;
      if (y >= SNAPSHOT_YEAR) { setPlaying(false); return; }
      setYear(y + 1);
    }, 1200);
    return () => window.clearInterval(id);
  }, [playing, setYear, setPlaying]);

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
        <span className="tl-count meta">{t('conflictsIn')} {year}: {n} · {t('terr')}: {terr} · {t('evInView')}: {events.length}</span>
      </div>
      {year < SNAPSHOT_YEAR && <p className="note tl-note">{t('bordersToday')}</p>}
      <div className="tl-events" role="list" aria-label={`${t('eventsIn')} ${year}`}>
        {events.length === 0 && <span className="meta">{t('noEvents')}</span>}
        {events.map((e, i) => (
          <button
            key={i} type="button" role="listitem" className="ev" style={{ ['--c' as string]: EVENT_COLOR[e.type] }}
            onClick={() => e.conflict && select({ kind: 'conflict', id: e.conflict })}
            disabled={!e.conflict}
            title={tl(e.t)}
          >
            <time dateTime={e.d}>{fmtDate(e.d, lang)}</time>
            <span>{tl(e.t)}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
