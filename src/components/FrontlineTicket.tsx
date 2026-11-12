import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useT, fmtDate } from '../i18n';
import { ageInDays } from '../lib/frontline';
import { HISTORY_MONTHS, HISTORY_YEAR, monthDate } from '../lib/frontlineHistory';
import { SNAPSHOT_DATE } from '../data/sources';

/**
 * The provenance of the front line, on screen rather than in a tooltip.
 *
 * Collapsed to one line by default. A line on a war map is worth nothing
 * without its date and its author, so both stay visible at all times — but the
 * licence note, the generalization and the fallback reason are detail, and a
 * seven-line box sitting over the map is not the place for detail. One click
 * opens it.
 */
/**
 * Scrubbing the published monthly series.
 *
 * A percentage says Russia holds about four fifths of Donetsk oblast. This
 * says where the line was in March and where it is now, which is a different
 * kind of knowing. Each month is fetched when it is asked for; the current
 * line stays on screen in white underneath, so the two can be read together.
 */
function MonthScrub() {
  const { t, lang } = useT();
  const month = useStore((s) => s.frontMonth);
  const state = useStore((s) => s.frontMonthState);
  const setMonth = useStore((s) => s.setFrontMonth);

  return (
    <div className="fl-scrub">
      <div className="fl-scrub-head">
        <span>{t('fl_history')}</span>
        <button type="button" className="mini" onClick={() => setMonth(null)} disabled={month === null}>
          {t('fl_now')}
        </button>
      </div>
      <div className="fl-months" role="group" aria-label={t('fl_history')}>
        {HISTORY_MONTHS.map((m) => (
          <button
            key={m}
            type="button"
            className={m === month ? 'on' : ''}
            onClick={() => setMonth(m)}
            aria-pressed={m === month}
            title={fmtDate(monthDate(m), lang)}
          >
            {m}
          </button>
        ))}
      </div>
      <p className="fl-scrub-note">
        {state.status === 'loading' && t('fl_h_loading')}
        {state.status === 'ready' && `${state.line.label} ${HISTORY_YEAR} \u00b7 ${state.line.vertices} ${t('fl_h_points')}`}
        {state.status === 'unavailable' && <span className="fl-warn">{t('fl_h_off')}</span>}
        {state.status === 'idle' && t('fl_h_hint')}
      </p>
    </div>
  );
}

export default function FrontlineTicket() {
  const { t, lang } = useT();
  const on = useStore((s) => s.layers.sourceline);
  const frontline = useStore((s) => s.frontline);
  const load = useStore((s) => s.loadFrontline);
  const [open, setOpen] = useState(false);

  // Ask the service once, from the reader's browser. The workspace this was
  // built in cannot reach gis.unocha.org; a browser generally can.
  useEffect(() => { void load(); }, [load]);

  if (!on) return null;
  const { meta, tier } = frontline.set;
  const age = ageInDays(meta.assessmentDate, SNAPSHOT_DATE);

  return (
    <aside className={`fl-ticket${open ? ' open' : ''}`} aria-label={t('fl_title')}>
      <button type="button" className="fl-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <i className="sw line fl-sw" />
        <strong>{t('fl_title')}</strong>
        <span className="fl-date">{fmtDate(meta.assessmentDate, lang)}</span>
        <span className={`fl-tier ${tier}`}>{tier === 'live' ? t('fl_live') : t('fl_bundled')}</span>
        <span className="fl-caret" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="fl-body">
          <MonthScrub />
          <dl className="fl-rows">
            <div><dt>{t('fl_assessed')}</dt><dd>{fmtDate(meta.assessmentDate, lang)}{Number.isFinite(age) && age > 0 ? ` · ${age} ${t('fl_age')}` : ''}</dd></div>
            <div><dt>{t('sources')}</dt><dd>ISW / CTP · OCHA</dd></div>
            <div><dt>{t('fl_generalized')}</dt><dd>≈{meta.toleranceMetresApprox?.main ?? '—'} m</dd></div>
          </dl>
          <p className="fl-note">{t('fl_unlabelled')}.</p>
          {frontline.note ? <p className="fl-warn">{t('fl_offline')}</p> : null}
          <p className="fl-warn">{t('fl_licence')}.</p>
        </div>
      )}
    </aside>
  );
}
