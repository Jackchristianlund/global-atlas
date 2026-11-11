import { REL_COLOR, countryName } from '../data';
import { TOTALS, type Flow } from '../data/displacement';
import { FLOW, corridorSum, flowsAt, flowsFrom, flowsTo } from '../lib/displacement';
import { SNAPSHOT_YEAR, useStore } from '../store';
import { fmtDate, fmtNum, useT } from '../i18n';
import type { Iso } from '../types';
import { ConflictLink, CountryChip, Empty, Section, SourceList, Src } from './bits';

/** One corridor as a row: who, how many, on what basis, when, from where. */
function FlowRow({ f, side }: { f: Flow; side: 'from' | 'to' | 'both' }) {
  const { tl, lang } = useT();
  const select = useStore((s) => s.select);
  const other = side === 'from' ? f.to : f.from;
  return (
    <li className="flowrow">
      <button type="button" className="flowrow-btn" onClick={() => select({ kind: 'flow', id: f.id })}>
        <span className="flowrow-head">
          {side === 'both'
            ? <>{countryName(f.from, lang)} <span className="flowarrow">→</span> {countryName(f.to, lang)}</>
            : <>{side === 'from' ? <span className="flowarrow">→</span> : <span className="flowarrow">←</span>} {countryName(other, lang)}</>}
        </span>
        <strong className="flowrow-n">{fmtNum(f.people, lang)}</strong>
      </button>
      <p className="flowrow-basis">{tl(f.basis)} · <time dateTime={f.d}>{fmtDate(f.d, lang)}</time> <Src ids={f.s} /></p>
    </li>
  );
}

function FlowList({ items, side }: { items: Flow[]; side: 'from' | 'to' | 'both' }) {
  const { t } = useT();
  if (!items.length) return <Empty>{t('flowNone')}</Empty>;
  return <ul className="flowlist">{items.map((f) => <FlowRow key={f.id} f={f} side={side} />)}</ul>;
}

/** The panel for a single corridor. */
export function FlowPanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const year = useStore((s) => s.year);
  const f = FLOW[id];
  if (!f) return <Empty>{t('naData')}</Empty>;
  const siblings = flowsFrom(f.from, Math.max(year, SNAPSHOT_YEAR)).filter((x) => x.id !== f.id);
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg" style={{ background: REL_COLOR.displacement }} />{t('flow')}</div>
        <h2>{countryName(f.from, lang)} <span className="flowarrow">→</span> {countryName(f.to, lang)}</h2>
        <p className="flownum">{fmtNum(f.people, lang)}</p>
        <p className="note">{tl(f.basis)} · <time dateTime={f.d}>{fmtDate(f.d, lang)}</time> <Src ids={f.s} /></p>
      </header>
      <Section title={t('sum')}><p>{tl(f.note)}</p></Section>
      <Section title={t('flowOrigin')}><div className="chips"><CountryChip iso={f.from} /></div></Section>
      <Section title={t('flowHost')}><div className="chips"><CountryChip iso={f.to} /></div></Section>
      {f.conflict ? <Section title={t('v_conflict')}><ul className="plain"><ConflictLink id={f.conflict} /></ul></Section> : null}
      {siblings.length ? <Section title={t('flowOther')}><FlowList items={siblings} side="from" /></Section> : null}
      <Section title={t('method')}><p className="note">{t('flowBasisNote')}</p><p className="note">{t('flowIdpNote')}</p></Section>
      <Section title={t('sources')}><SourceList ids={f.s} /></Section>
    </article>
  );
}

/** Corridors in and out of a country, for the country panel. */
export function CountryFlows({ iso }: { iso: Iso }) {
  const { t, lang } = useT();
  const year = useStore((s) => s.year);
  const out = flowsFrom(iso, year);
  const into = flowsTo(iso, year);
  if (!out.length && !into.length) return null;
  const so = corridorSum(out), si = corridorSum(into);
  return (
    <>
      {out.length ? (
        <Section title={t('flowOut')} aside={<span className="meta">{t('flowSum')}: {fmtNum(so.people, lang)} · {so.n} {t('flowCount')}</span>}>
          <FlowList items={out} side="from" />
        </Section>
      ) : null}
      {into.length ? (
        <Section title={t('flowIn')} aside={<span className="meta">{t('flowSum')}: {fmtNum(si.people, lang)} · {si.n} {t('flowCount')}</span>}>
          <FlowList items={into} side="to" />
        </Section>
      ) : null}
    </>
  );
}

/** The displacement overview shown in the humanitarian view. */
export function DisplacementOverview() {
  const { t, tl, lang } = useT();
  const year = useStore((s) => s.year);
  const flows = flowsAt(year);
  const sum = corridorSum(flows);
  return (
    <>
      <Section title={t('flowTotals')}>
        <ul className="figs">
          {TOTALS.map((x) => (
            <li key={x.id} className="fig">
              <div className="fig-l">{tl(x.label)}</div>
              <div className="fig-v">{tl(x.value)}</div>
              <div className="fig-m">{tl(x.basis)} <span className="meta">{fmtDate(x.d, lang)}</span> <Src ids={x.s} /></div>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t('flows')} aside={<span className="meta">{sum.n} {t('flowCount')}</span>}>
        <FlowList items={flows} side="both" />
        <p className="note">{t('flowWeightNote')}</p>
        <p className="note">{t('flowBasisNote')}</p>
      </Section>
    </>
  );
}
