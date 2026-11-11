import { useMemo } from 'react';
import { CHOKEPOINTS, CONFLICTS, EVENTS, SANCTIONS, SNAPSHOT_DATE } from '../data';
import { STATUS_COLOR, datasetCounts } from '../lib/selectors';
import { useStore } from '../store';
import { fmtDate, fmtNum, useT } from '../i18n';
import type { L } from '../types';
import { ConflictLink, Empty, Section, Src } from './bits';
import HistoryCharts from './HistoryCharts';

interface Stat { v: string; l: L; def: L; d: string; s: string[] }

/** Overview metrics. Every number states its definition, coverage, source and reference date. */
export default function Dashboard() {
  const tierOpen = useStore((s) => s.tierOpen);
  const setTierOpen = useStore((s) => s.setTierOpen);
  const { t, tl, lang } = useT();
  const view = useStore((s) => s.view);
  const select = useStore((s) => s.select);
  const counts = useMemo(() => datasetCounts(CONFLICTS), []);

  const stats: Stat[] = [
    {
      v: String(counts.active), l: ['Aktive konflikter i datasettet', 'Active conflicts in the dataset'],
      def: [`Poster med status «aktiv» i dette kuraterte datasettet, pluss ${counts.ceasefire} med våpenhvile og ${counts.flashpoints} spenningspunkter. Dette er ikke en totaltelling av verdens konflikter: referanselisten fører 48 rader, der én rad kan samle flere konflikter.`, `Records with status “active” in this curated dataset, plus ${counts.ceasefire} under ceasefire and ${counts.flashpoints} flashpoints. Not a total count of the world’s conflicts: the reference list holds 48 rows, and one row can group several conflicts.`],
      d: SNAPSHOT_DATE, s: ['wikiList'],
    },
    {
      v: String(counts.countries), l: ['Berørte land og områder', 'Countries and territories affected'],
      def: ['Land og områder som står oppført under minst én aktiv konflikt i datasettet. Global dekning.', 'Countries and territories listed under at least one active conflict in the dataset. Global coverage.'],
      d: SNAPSHOT_DATE, s: ['wikiList'],
    },
    {
      v: lang === 'no' ? '117,8 mill.' : '117.8 m', l: ['Tvangsfordrevne i verden', 'Forcibly displaced worldwide'],
      def: ['UNHCR Global Trends: personer fordrevet av konflikt, vold og forfølgelse ved utgangen av 2025 — 68,7 millioner internt fordrevne og 41,6 millioner flyktninger. Første nedgang på ti år. Fordrivelsen i Iran og Libanon i 2026 kommer i tillegg.', 'UNHCR Global Trends: people displaced by conflict, violence and persecution at the end of 2025 — 68.7 million internally displaced and 41.6 million refugees. The first fall in a decade. Displacement in Iran and Lebanon in 2026 comes on top.'],
      d: '2025-12-31', s: ['unhcrGT', 'unhcrNordic', 'tocGT'],
    },
    {
      v: lang === 'no' ? 'ca. 20 %' : 'c. 20%', l: ['Trafikk i Hormuz mot førkrigsnivå', 'Hormuz traffic v. pre-war level'],
      def: ['Skipstrafikk gjennom Hormuzstredet som andel av nivået før 28. februar 2026, ifølge Lloyd’s List Intelligence gjengitt av The National.', 'Ship traffic through the Strait of Hormuz as a share of the level before 28 February 2026, per Lloyd’s List Intelligence as reported by The National.'],
      d: '2026-11-08', s: ['national1108'],
    },
    {
      v: '−40 %', l: ['Suez-passeringer mot før krisen', 'Suez transits v. pre-crisis'],
      def: ['Passeringer gjennom Suezkanalen i de fire ukene til 23. august 2026, målt mot en tilsvarende periode før houthi-angrepene begynte (Lloyd’s List Intelligence).', 'Suez Canal transits in the four weeks to 23 August 2026, against an equivalent period before the Houthi attacks began (Lloyd’s List Intelligence).'],
      d: '2026-08-23', s: ['lli0827'],
    },
    {
      v: '128', l: ['Skipshendelser i Golfen (IMO)', 'Ship incidents in the Gulf (IMO)'],
      def: ['Bekreftede hendelser med handelsfartøy i Persiabukta, Hormuzstredet og Omanbukta siden krigsutbruddet, med 24 drepte sjøfolk. IMOs telling, gjengitt av en interesseorganisasjon.', 'Confirmed incidents involving merchant vessels in the Persian Gulf, the Strait of Hormuz and the Gulf of Oman since the war began, with 24 seafarers killed. IMO count, relayed by an advocacy organisation.'],
      d: '2026-11-04', s: ['uani1104'],
    },
    {
      v: String(SANCTIONS.length), l: ['Sanksjonsregimer i datasettet', 'Sanctions regimes in the dataset'],
      def: ['Større regimer som er lagt inn her. Ikke et fullstendig register: EU alene fører over 40 regimer.', 'Major regimes loaded here. Not a complete register: the EU alone lists more than 40 regimes.'],
      d: SNAPSHOT_DATE, s: ['euSanc', 'ofac', 'unSanc'],
    },
  ];

  const escalations = useMemo(() => EVENTS.filter((e) => e.type === 'escalation').sort((a, b) => b.d.localeCompare(a.d)).slice(0, 6), []);
  const latest = useMemo(() => EVENTS.slice().sort((a, b) => b.d.localeCompare(a.d)).slice(0, 8), []);
  const tierMax = Math.max(...Object.values(counts.byTier), 1);
  const humanConflicts = useMemo(() => CONFLICTS.filter((c) => c.figs.some((f) => f.v !== null)), []);

  return (
    <article>
      <header className="p-head">
        <div className="p-kicker">{t('snapshot')}: {fmtDate(SNAPSHOT_DATE, lang)} · {t('notRealtime')}</div>
        <h2>{t('overview')}</h2>
      </header>
      {view === 'history' && <HistoryCharts />}

      <div className="stats">
        {stats.map((st, i) => (
          <div className="stat" key={i}>
            <div className="stat-v">{st.v}</div>
            <div className="stat-l">{tl(st.l)}</div>
            <details>
              <summary>{t('definition')}</summary>
              <p>{tl(st.def)}</p>
              <p className="meta">{t('asOf')} {fmtDate(st.d, lang)} <Src ids={st.s} /></p>
            </details>
          </div>
        ))}
      </div>

      {/* Collapsed by default: four bars take a lot of the panel for a
          distribution most readers glance at once. The totals above already
          carry the headline, so this opens when it is wanted. */}
      <details className="sec foldsec" open={tierOpen} onToggle={(e) => setTierOpen((e.target as HTMLDetailsElement).open)}>
        <summary><h3>{t('byTier')}</h3></summary>
        <div className="bars">
          {([4, 3, 2, 1] as const).map((tier) => (
            <div className="bar" key={tier}>
              <span className="bar-l">{t(`tierShort${tier}`)}</span>
              <span className="bar-t"><span className="bar-f" style={{ width: `${(counts.byTier[tier] / tierMax) * 100}%`, background: STATUS_COLOR[`tier${tier}`] }} /></span>
              <span className="bar-v">{counts.byTier[tier]}</span>
            </div>
          ))}
        </div>
        <p className="note">{t('rowNote')} <Src ids={['wikiList']} /></p>
      </details>

      {(view === 'trade' || view === 'energy') && (
        <Section title={t('chokeTable')}>
          <table className="tbl">
            <thead><tr><th /><th>2023</th><th>Q2 2026</th></tr></thead>
            <tbody>
              {CHOKEPOINTS.filter((c) => c.oil2023 !== null || c.oil2q26 !== null).map((c) => (
                <tr key={c.id}>
                  <td><button type="button" className="linklike" onClick={() => select({ kind: 'chokepoint', id: c.id })}>{tl(c.name)}</button></td>
                  <td>{c.oil2023 === null ? '–' : fmtNum(c.oil2023, lang, 1)}</td>
                  <td className={c.oil2q26 !== null && c.oil2023 !== null ? (c.oil2q26 < c.oil2023 ? 'down' : 'up') : ''}>{c.oil2q26 === null ? '–' : fmtNum(c.oil2q26, lang, 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">{t('oilFlow')}. <Src ids={['eia', 'steo']} /></p>
        </Section>
      )}

      {view === 'human' && (
        <Section title={t('humanFigs')}>
          {humanConflicts.length ? humanConflicts.map((c) => <ConflictLink key={c.id} id={c.id} />) : <Empty>{t('naData')}</Empty>}
        </Section>
      )}

      <Section title={t('recentEsc')}>
        <ul className="evlist">
          {escalations.map((e, i) => (
            <li key={i}>
              <time dateTime={e.d}>{fmtDate(e.d, lang)}</time>{' '}
              {e.conflict ? <button type="button" className="linklike" onClick={() => select({ kind: 'conflict', id: e.conflict! })}>{tl(e.t)}</button> : tl(e.t)} <Src ids={e.s} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('recentAll')}>
        <ul className="evlist">
          {latest.map((e, i) => (
            <li key={i}>
              <time dateTime={e.d}>{fmtDate(e.d, lang)}</time>{' '}
              {e.conflict ? <button type="button" className="linklike" onClick={() => select({ kind: 'conflict', id: e.conflict! })}>{tl(e.t)}</button> : tl(e.t)} <Src ids={e.s} />
            </li>
          ))}
        </ul>
      </Section>
    </article>
  );
}
