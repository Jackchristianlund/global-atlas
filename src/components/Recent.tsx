import { useMemo, useState } from 'react';
import { CONFLICTS, SNAPSHOT_DATE, countryName } from '../data';
import { CATEGORIES, attacksIn, since, type Period } from '../lib/attacks';
import { useStore } from '../store';
import { fmtDate, useT } from '../i18n';
import type { AttackCategory } from '../data/attacks';
import { Section } from './bits';
import { AttackList } from './AttackPanel';

const PERIODS: Period[] = ['24h', '7d', '30d', '90d', '1y', 'all'];

/**
 * Recent Developments: the documented incidents, filtered by window, country,
 * conflict and category. The window is measured from the snapshot date, which
 * the panel states, because the dataset is a snapshot and not a live feed.
 */
export default function Recent() {
  const { t, tl, lang } = useT();
  const year = useStore((s) => s.year);
  const [period, setPeriod] = useState<Period>('1y');
  const [iso, setIso] = useState<string>('');
  const [conflict, setConflict] = useState<string>('');
  const [category, setCategory] = useState<AttackCategory | 'all'>('all');

  const until = `${year}-12-31` < SNAPSHOT_DATE ? `${year}-12-31` : SNAPSHOT_DATE;
  const items = useMemo(
    () => attacksIn({ period, until, iso: (iso || null) as never, conflict: conflict || null, category }),
    [period, until, iso, conflict, category],
  );
  const countries = useMemo(() => Array.from(new Set(attacksIn().map((a) => a.iso))).sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang))), [lang]);
  const conflicts = useMemo(() => {
    const ids = new Set(attacksIn().map((a) => a.conflict));
    return CONFLICTS.filter((c) => ids.has(c.id));
  }, []);

  return (
    <>
      <Section title={t('rd_period')}>
        <div className="chips periods">
          {PERIODS.map((p) => (
            <button key={p} type="button" className={`chip${period === p ? ' on' : ''}`} aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {t(`pd_${p}` as 'pd_7d')}
            </button>
          ))}
        </div>
        <p className="note">
          {t('rd_snapshotNote')} {period !== 'all' && <>({fmtDate(since(period, until), lang)} – {fmtDate(until, lang)})</>}
        </p>
      </Section>
      <Section title={t('filters')}>
        <div className="rdfilters">
          <select value={iso} onChange={(e) => setIso(e.target.value)} aria-label={t('country')}>
            <option value="">{t('country')}: {t('pd_all')}</option>
            {countries.map((c) => <option key={c} value={c}>{countryName(c, lang)}</option>)}
          </select>
          <select value={conflict} onChange={(e) => setConflict(e.target.value)} aria-label={t('v_conflict')}>
            <option value="">{t('v_conflict')}: {t('pd_all')}</option>
            {conflicts.map((c) => <option key={c.id} value={c.id}>{tl(c.name)}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value as AttackCategory | 'all')} aria-label={t('at_cat')}>
            <option value="all">{t('at_cat')}: {t('pd_all')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`ac_${c}` as 'ac_clash')}</option>)}
          </select>
        </div>
      </Section>
      <Section title={`${t('rd_title')} · ${items.length}`}>
        <AttackList items={items} />
        <p className="note">{t('at_curated')}</p>
      </Section>
    </>
  );
}
