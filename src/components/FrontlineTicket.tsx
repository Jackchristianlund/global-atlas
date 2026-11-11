import { useEffect } from 'react';
import { useStore } from '../store';
import { useT, fmtDate } from '../i18n';
import { ageInDays } from '../lib/frontline';
import { SNAPSHOT_DATE } from '../data/sources';

/**
 * The provenance of the front line, on screen rather than in a tooltip.
 *
 * A line on a war map is worth nothing without its date and its author, so
 * both are stated here, along with whether this copy came from the service
 * just now or from the bundle, and how old the assessment is. The licence
 * line is deliberately blunt: the commercial right to redistribute this
 * geometry has not been established, and that has to be visible to whoever is
 * deciding whether to charge for the product.
 */
export default function FrontlineTicket() {
  const { t, lang } = useT();
  const on = useStore((s) => s.layers.sourceline);
  const frontline = useStore((s) => s.frontline);
  const load = useStore((s) => s.loadFrontline);

  // Ask the service once, from the reader's browser. The workspace this was
  // built in cannot reach gis.unocha.org; a browser generally can.
  useEffect(() => { void load(); }, [load]);

  if (!on) return null;
  const { meta, tier } = frontline.set;
  const age = ageInDays(meta.assessmentDate, SNAPSHOT_DATE);

  return (
    <aside className="fl-ticket" aria-label={t('fl_title')}>
      <div className="fl-head">
        <i className="sw line fl-sw" />
        <strong>{t('fl_title')}</strong>
        <span className={`fl-tier ${tier}`}>{tier === 'live' ? t('fl_live') : t('fl_bundled')}</span>
      </div>
      <dl className="fl-rows">
        <div><dt>{t('fl_assessed')}</dt><dd>{fmtDate(meta.assessmentDate, lang)}{Number.isFinite(age) && age > 0 ? ` · ${age} ${t('fl_age')}` : ''}</dd></div>
        <div><dt>{t('sources')}</dt><dd>ISW / CTP · OCHA</dd></div>
        <div><dt>{t('fl_generalized')}</dt><dd>≈{meta.toleranceMetresApprox?.main ?? '—'} m</dd></div>
      </dl>
      <p className="fl-note">{t('fl_unlabelled')}.</p>
      {frontline.note ? <p className="fl-warn">{t('fl_offline')}</p> : null}
      <p className="fl-warn">{t('fl_licence')}.</p>
    </aside>
  );
}
