import { useMemo } from 'react';
import {
  ALL_ROUTES, CHOKEPOINT, CHOKEPOINTS, CONFLICT, CONFLICTS, COUNTRY_CODES, DISPUTED, EVENTS, LINKS, ORG, ORGS, RELATIONS, REL_COLOR, ROUTE, SANCTIONS, SITE, countryName,
} from '../data';
import { STATUS_COLOR, compareCountries, conflictsAt, displayStatus, membersAt, orgsOf, relationsOf, routeLengthNm, sanctionsOf } from '../lib/selectors';
import { SNAPSHOT_YEAR, useStore } from '../store';
import { fmtDate, fmtNum, useT } from '../i18n';
import type { ClaimCat, ImpactLink, Iso } from '../types';
import { ClaimRow, ConflictLink, CountryChip, Empty, FigRow, Section, SourceList, Src } from './bits';
import { NO_TERRITORY, REGIONS } from '../data/territory';
import { REGION_FOR_CONFLICT, actorsOfRegion, hasDetail, regionSummary } from '../lib/territory';
import Dashboard from './Dashboard';
import TraceSection from './TraceSection';
import { ActorPanel, TerritoryPanel } from './TerritoryPanel';
import { ExtSeries } from './DataBits';
import { CountryFlows, DisplacementOverview, FlowPanel } from './DisplacementPanel';
import { AttackPanel } from './AttackPanel';
import PlacePanel from './PlacePanel';
import { Ad } from './Commerce';
import { CompareSection, ContactSection } from './TerritoryPanel';
import Recent from './Recent';
import ScenarioLab from './ScenarioLab';

const CATS: ClaimCat[] = ['escalation', 'ceasefire', 'military', 'human', 'geo', 'econ'];

function LinkCard({ l }: { l: ImpactLink }) {
  const { t, tl, lang } = useT();
  const pushTrace = useStore((s) => s.pushTrace);
  return (
    <li className={`link o-${l.kind}`} style={{ ['--c' as string]: REL_COLOR[l.type] }}>
      <div className="link-head">
        <strong>{tl(l.from.label)} → {tl(l.to.label)}</strong>
      </div>
      <div className="link-tags">
        <span className="tag" style={{ color: REL_COLOR[l.type] }}>{t(`r_${l.type}`)}</span>
        <span className={`badge o-${l.kind}`}>{t(`o_${l.kind}`)}</span>
        <span className="meta">{t('conf')}: {t(`conf_${l.confidence}`)}</span>
        <time dateTime={l.d}>{fmtDate(l.d, lang)}</time>
        <Src ids={l.s} />
      </div>
      <p><span className="lbl">{t('evidence')}:</span> {tl(l.evidence)}</p>
      <p><span className="lbl">{t('mechanism')}:</span> {tl(l.mechanism)}</p>
      <button type="button" className="mini follow" onClick={() => pushTrace(l.id)}>→ {t('trace_follow')}</button>
    </li>
  );
}

function Links({ items }: { items: ImpactLink[] }) {
  const { t } = useT();
  if (!items.length) return <Empty>{t('noLinks')}</Empty>;
  const order = { observed: 0, assessed: 1, potential: 2 } as const;
  return <ul className="links">{items.slice().sort((a, b) => order[a.kind] - order[b.kind]).map((l) => <LinkCard key={l.id} l={l} />)}</ul>;
}

function ConflictPanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const year = useStore((s) => s.year);
  const select = useStore((s) => s.select);
  const openDetail = useStore((s) => s.openDetail);
  const c = CONFLICT[id];
  const ds = displayStatus(c, year, SNAPSHOT_YEAR);
  const events = EVENTS.filter((e) => e.conflict === id).sort((a, b) => b.d.localeCompare(a.d));
  const links = LINKS.filter((l) => l.conflict === id);
  const allSources = useMemo(() => Array.from(new Set([...c.s, ...c.claims.flatMap((x) => x.s), ...c.figs.flatMap((x) => x.s), ...links.flatMap((x) => x.s)])), [c, links]);
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg" style={{ background: STATUS_COLOR[ds] }} />{t(`t_${c.type}`)} · ID {c.id}</div>
        <h2>{tl(c.name)}</h2>
        <dl className="kv">
          <div><dt>{t('status')}</dt><dd>{t(`st_${c.status}`)}</dd></div>
          <div><dt>{t('started')}</dt><dd>{fmtDate(c.start, lang)}</dd></div>
          {c.end && <div><dt>{t('ended')}</dt><dd>{fmtDate(c.end, lang)}</dd></div>}
          <div><dt>{t('lastVerified')}</dt><dd>{fmtDate(c.verified, lang)}</dd></div>
        </dl>
      </header>
      {hasDetail(c.id, c.iso) && (
        <button
          type="button"
          className="opendetail"
          onClick={() => openDetail(c.iso, c.at, REGION_FOR_CONFLICT[c.id])}
        >
          {t('openDetail')}
          <span>{t('openDetailSub')}</span>
        </button>
      )}
      <Section title={t('sum')}><p>{tl(c.sum)} <Src ids={c.s} /></p></Section>
      <Section title={t('intensityBasis')}>
        {c.tier && c.row ? (
          <div className="tierbox" style={{ ['--c' as string]: STATUS_COLOR[`tier${c.tier}`] }}>
            <div className="tier-l"><span className="dot lg" style={{ background: STATUS_COLOR[`tier${c.tier}`] }} />{t(`tier${c.tier}`)}</div>
            <div className="tier-row">{t('rowLabel')}: <em>{c.row.name}</em></div>
            <div className="tier-nums"><span>2025: <b>{c.row.f25}</b></span><span>2026: <b>{c.row.f26}</b></span> <Src ids={['wikiList']} /></div>
            <p className="note">{t('rowNote')}</p>
          </div>
        ) : (
          <Empty>{t('noTier')}</Empty>
        )}
      </Section>
      <Section title={t('terr')}>
        {(() => {
          const reg = REGIONS.find((r) => r.conflict === id);
          if (!reg) {
            const no = NO_TERRITORY.find((n) => n.conflict === id);
            return <Empty>{no ? tl(no.reason) : t('terr_noneWhy')}</Empty>;
          }
          const sum = regionSummary(reg.id, year);
          return (
            <>
              <p className="meta">{sum.units} {t('terr_units')} · {year} · {t('lastVerified')} {fmtDate(sum.asOf || reg.verified, lang)}</p>
              <div className="chips">
                {actorsOfRegion(reg.id).filter((a) => sum.byActor.has(a.id)).map((a) => {
                  const e = sum.byActor.get(a.id);
                  return (
                    <button key={a.id} type="button" className="chip actor" style={{ borderColor: a.color }} onClick={() => select({ kind: 'actor', id: a.id })}>
                      <span className="dot" style={{ background: a.color }} />{a.short}
                      {e && <small>{e.control + e.partial + e.contested} {t('terr_units')}</small>}
                    </button>
                  );
                })}
              </div>
              <p className="note">{tl(reg.coverage)} <Src ids={reg.s} /></p>
              <ContactSection region={reg.id} />
              <CompareSection region={reg.id} />
            </>
          );
        })()}
      </Section>
      <Section title={t('involved')}><div className="chips">{c.iso.map((i) => <CountryChip key={i} iso={i} />)}</div></Section>
      <Section title={t('causes')}><p>{tl(c.causes)}</p></Section>
      <Section title={t('parties')}><p>{tl(c.parties)}</p></Section>
      {CATS.map((cat) => {
        const rows = c.claims.filter((x) => x.cat === cat).sort((a, b) => b.d.localeCompare(a.d));
        const figs = cat === 'human' ? c.figs : [];
        if (!rows.length && !figs.length) return cat === 'human' || cat === 'econ' || cat === 'military' ? <Section key={cat} title={t(`c_${cat}`)}><Empty>{t('naData')}</Empty></Section> : null;
        return (
          <Section key={cat} title={t(`c_${cat}`)}>
            {figs.length > 0 && <ul className="figs">{figs.map((f, i) => <FigRow key={i} f={f} />)}</ul>}
            {rows.length > 0 && <ul className="claims">{rows.map((x, i) => <ClaimRow key={i} c={x} />)}</ul>}
          </Section>
        );
      })}
      <Section title={t('connections')}><Links items={links} /></Section>
      {events.length > 0 && (
        <Section title={t('relatedEvents')}>
          <ul className="evlist">{events.map((e, i) => <li key={i}><time dateTime={e.d}>{fmtDate(e.d, lang)}</time> {tl(e.t)} <Src ids={e.s} /></li>)}</ul>
        </Section>
      )}
      <Section title={t('sources')}><SourceList ids={allSources} /></Section>
    </article>
  );
}

function ComparePanel({ a, b }: { a: Iso; b: Iso }) {
  const { t, tl, lang } = useT();
  const year = useStore((s) => s.year);
  const cmp = compareCountries(a, b, year, { orgs: ORGS, rels: RELATIONS, regs: SANCTIONS, conflicts: CONFLICTS });
  const [na, nb] = [countryName(a, lang), countryName(b, lang)];
  const orgList = (list: typeof cmp.sharedOrgs) => list.length ? <div className="chips">{list.map((o) => <span key={o.id} className="chip static" style={{ borderColor: o.color }}>{o.short}<small>{t(`kind_${o.kind}`)}</small></span>)}</div> : <Empty>{t('none')}</Empty>;
  return (
    <div className="cmp">
      <h3 className="cmp-title"><span className="a">{na}</span> ↔ <span className="b">{nb}</span> <small>{year}</small></h3>
      <h4>{t('shared')}</h4>{orgList(cmp.sharedOrgs)}
      <h4>{t('only')} {na}</h4>{orgList(cmp.onlyA)}
      <h4>{t('only')} {nb}</h4>{orgList(cmp.onlyB)}
      <h4>{t('between')}: {t('treaties')}</h4>
      {cmp.treaties.length ? <ul className="plain">{cmp.treaties.map((r) => <li key={r.id}><b>{tl(r.name)}</b> ({t(`r_${r.type}`)}, {fmtDate(r.since, lang)}). {tl(r.note)} <Src ids={r.s} /></li>)}</ul> : <Empty>{t('none')}</Empty>}
      <h4>{t('between')}: {t('sanctions')}</h4>
      {cmp.sanctions.length ? <ul className="plain">{cmp.sanctions.map((r) => <li key={r.id}><b>{tl(r.name)}</b>. {tl(r.note)} <Src ids={r.s} /></li>)}</ul> : <Empty>{t('none')}</Empty>}
      <h4>{t('between')}: {t('conflictsHere')}</h4>
      {cmp.conflicts.length ? cmp.conflicts.map((c) => <ConflictLink key={c.id} id={c.id} />) : <Empty>{t('none')}</Empty>}
    </div>
  );
}

function CountryPanel({ code }: { code: Iso }) {
  const { t, tl, lang } = useT();
  const { year, compare, picking, setCompare, setPicking, setModal } = useStore();
  const orgs = orgsOf(ORGS, code, year);
  const rels = relationsOf(RELATIONS, code, year);
  const euM = membersAt(ORG.eu, year);
  const sanc = sanctionsOf(SANCTIONS, code, year, euM);
  const conflicts = conflictsAt(CONFLICTS, year).filter((c) => c.iso.includes(code));
  const links = LINKS.filter((l) => l.from.iso === code || l.to.iso === code);
  const exposure = CHOKEPOINTS.flatMap((cp) => cp.exposed.filter((e) => e.iso === code).map((e) => ({ cp, e })));
  const disputed = code === 'TWN' ? 'd-taiwan' : code === 'XKX' ? 'd-kosovo' : code === 'ESH' ? 'd-wsahara' : code === 'PSE' ? 'd-palestine' : code === 'XNC' ? 'd-ncyprus' : code === 'XSL' ? 'd-somaliland' : null;
  const names = useMemo(() => COUNTRY_CODES.map((c) => [c, countryName(c, lang)] as const).sort((x, y) => x[1].localeCompare(y[1], lang === 'no' ? 'nb' : 'en')), [lang]);
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker">{t('country')} · {code} · {year}</div>
        <h2>{countryName(code, lang)}</h2>
        {disputed && <p className="note warn">{tl(DISPUTED.find((d) => d.id === disputed)!.note)}</p>}
      </header>
      <Section title={t('compare')}>
        {compare ? (
          <>
            <ComparePanel a={code} b={compare} />
            <button type="button" className="btn" onClick={() => setCompare(null)}>{t('compareEnd')}</button>
          </>
        ) : (
          <div className="cmp-pick">
            <button type="button" className={`btn${picking ? ' on' : ''}`} aria-pressed={picking} onClick={() => setPicking(!picking)}>{t('compare')}</button>
            {picking && (
              <>
                <p className="note">{t('comparePick')}</p>
                <select id="cmp-select" value="" onChange={(e) => e.target.value && setCompare(e.target.value)} aria-label={t('compare')}>
                  <option value="">{t('chooseCountry')}</option>
                  {names.filter(([c]) => c !== code).map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                </select>
              </>
            )}
          </div>
        )}
      </Section>
      <Section title={t('memberships')} aside={<button type="button" className="mini" onClick={() => setModal('network')}>{t('network')}</button>}>
        {orgs.length ? (
          <ul className="plain">
            {orgs.map((o) => {
              const m = o.members.find((x) => x.iso === code)!;
              return <li key={o.id}><span className="dot" style={{ background: o.color }} /><b>{o.short}</b> <span className="meta">{t(`kind_${o.kind}`)} · {m.from}–</span><br />{tl(o.note)} <Src ids={o.s} /></li>;
            })}
          </ul>
        ) : <Empty>{t('noMemberships')}</Empty>}
        <p className="note">{tl(ORG.un.note)} <Src ids={ORG.un.s} /></p>
      </Section>
      <Section title={t('treaties')}>
        {rels.length ? <ul className="plain">{rels.map((r) => <li key={r.id}><span className="dot" style={{ background: REL_COLOR[r.type] }} /><b>{tl(r.name)}</b> <span className="meta">{t(`r_${r.type}`)} · {fmtDate(r.since, lang)}</span><br />{countryName(r.a === code ? r.b : r.a, lang)}. {tl(r.note)} <Src ids={r.s} /></li>)}</ul> : <Empty>{t('noTreaties')}</Empty>}
      </Section>
      <Section title={t('sanctions')}>
        {sanc.targetOf.length + sanc.imposing.length === 0 && <Empty>{t('noSanctions')}</Empty>}
        {sanc.targetOf.length > 0 && <ul className="plain">{sanc.targetOf.map((r) => <li key={r.id}><span className="meta">{t('sancTarget')}:</span> <b>{tl(r.name)}</b> ({r.by.join(', ')}; {fmtDate(r.since, lang)}). {tl(r.note)} <Src ids={r.s} /></li>)}</ul>}
        {sanc.imposing.length > 0 && <ul className="plain">{sanc.imposing.map((r) => <li key={r.id}><span className="meta">{t('sancBy')}:</span> <b>{tl(r.name)}</b> <Src ids={r.s} /></li>)}</ul>}
      </Section>
      <Section title={t('conflictsHere')}>{conflicts.length ? conflicts.map((c) => <ConflictLink key={c.id} id={c.id} />) : <Empty>{t('noConflictsHere')}</Empty>}</Section>
      <Section title={t('exposure')}>
        {exposure.length === 0 && links.length === 0 && <Empty>{t('noExposure')}</Empty>}
        {exposure.length > 0 && <ul className="plain">{exposure.map(({ cp, e }, i) => <li key={i}><b>{tl(cp.name)}:</b> {tl(e.t)} <Src ids={e.s} /></li>)}</ul>}
        {links.length > 0 && <Links items={links} />}
      </Section>
      <CountryFlows iso={code} />
      <Section title={t('ext_title')}><ExtSeries code={code} /></Section>
      <Section title={t('partners')}><Empty>{t('partnersNa')}</Empty></Section>
    </article>
  );
}

function ChokepointPanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const select = useStore((s) => s.select);
  const cp = CHOKEPOINT[id];
  const via = ALL_ROUTES.filter((r) => r.via.includes(id));
  const at = cp.at;
  const links = LINKS.filter((l) => (l.from.at[0] === at[0] && l.from.at[1] === at[1]) || (l.to.at[0] === at[0] && l.to.at[1] === at[1]));
  const max = Math.max(cp.oil2023 ?? 0, cp.oil2q26 ?? 0, 1);
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg sq" style={{ background: '#00D9FF' }} />{t('l_chokepoints')} · {fmtNum(Math.abs(at[0]), lang, 1)}°{at[0] >= 0 ? 'N' : 'S'} {fmtNum(Math.abs(at[1]), lang, 1)}°{at[1] >= 0 ? 'E' : 'W'}</div>
        <h2>{tl(cp.name)}</h2>
      </header>
      <Section title={t('importance')}><p>{tl(cp.importance)} <Src ids={cp.s.slice(0, 1)} /></p></Section>
      <Section title={t('oilFlow')}>
        {cp.oil2023 === null && cp.oil2q26 === null ? <Empty>{t('noEstimate')}</Empty> : (
          <div className="bars">
            {([['2023', cp.oil2023, 'eia'], ['Q2 2026', cp.oil2q26, 'steo']] as const).map(([label, v, src]) => (
              <div className="bar" key={label}>
                <span className="bar-l">{label}</span>
                <span className="bar-t"><span className="bar-f" style={{ width: `${((v ?? 0) / max) * 100}%` }} /></span>
                <span className="bar-v">{v === null ? '–' : fmtNum(v, lang, 1)}</span>
                <Src ids={[src]} />
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title={t('currentStatus')}><ul className="claims">{cp.status.map((c, i) => <ClaimRow key={i} c={c} />)}</ul></Section>
      <Section title={t('regions')}><p>{tl(cp.regions)}</p></Section>
      <Section title={t('commodities')}><p>{tl(cp.commodities)}</p></Section>
      <Section title={t('exposedCountries')}>
        {cp.exposed.length ? <ul className="plain">{cp.exposed.map((e, i) => <li key={i}><CountryChip iso={e.iso} /> {tl(e.t)} <Src ids={e.s} /></li>)}</ul> : <Empty>{t('naData')}</Empty>}
      </Section>
      <Section title={t('nearbyConflicts')}>{cp.conflicts.length ? cp.conflicts.map((c) => <ConflictLink key={c} id={c} />) : <Empty>{t('none')}</Empty>}</Section>
      <Section title={`${t('routesVia')} ${tl(cp.name)}`}>
        {via.length ? via.map((r) => <button key={r.id} type="button" className="rowbtn" onClick={() => select({ kind: 'route', id: r.id })}>{tl(r.name)}</button>) : <Empty>{t('none')}</Empty>}
      </Section>
      <Section title={t('connections')}><Links items={links} /></Section>
      <Section title={t('sources')}><SourceList ids={cp.s} /></Section>
    </article>
  );
}

function RoutePanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const select = useStore((s) => s.select);
  const r = ROUTE[id];
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker">{t(`rk_${r.kind}`)}{r.kind !== 'pipeline' && <> · <span className="badge k-assessment">{t('illustrative')}</span></>}</div>
        <h2>{tl(r.name)}</h2>
        <p className="note warn">{tl(r.note)}</p>
      </header>
      <Section title={t('length')}><p className="big">{fmtNum(routeLengthNm(r), lang)} <small>{r.kind === 'sea' || r.kind === 'oil' || r.kind === 'lng' ? t('nm') : `nm · ${fmtNum(routeLengthNm(r) * 1.852, lang)} km`}</small></p></Section>
      {r.status && <Section title={t('currentStatus')}><ul className="claims"><ClaimRow c={r.status} /></ul></Section>}
      <Section title={t('passes')}>
        {r.via.length ? r.via.map((v) => <button key={v} type="button" className="rowbtn" onClick={() => select({ kind: 'chokepoint', id: v })}>{tl(CHOKEPOINT[v].name)}</button>) : <Empty>{t('none')}</Empty>}
      </Section>
      {r.s.length > 0 && <Section title={t('sources')}><SourceList ids={r.s} /></Section>}
    </article>
  );
}

function SitePanel({ id }: { id: string }) {
  const { t, tl } = useT();
  const e = SITE[id];
  return (
    <article>
      <header className="p-head"><div className="p-kicker">{t(`sk_${e.kind}`)}</div><h2>{e.name}</h2><CountryChip iso={e.iso} /></header>
      <Section title={t('sum')}><p>{tl(e.note)} <Src ids={e.s} /></p></Section>
      <Section title={t('currentStatus')}>{e.status ? <ul className="claims"><ClaimRow c={e.status} /></ul> : <Empty>{t('naData')}</Empty>}</Section>
      <Section title={t('sources')}><SourceList ids={e.s} /></Section>
    </article>
  );
}

function OrgPanel({ id }: { id: string }) {
  const { t, tl } = useT();
  const year = useStore((s) => s.year);
  const o = ORG[id];
  const mem = membersAt(o, year);
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg" style={{ background: o.color }} />{t(`kind_${o.kind}`)} · {o.founded}</div>
        <h2>{tl(o.name)}</h2>
        <p className="note">{tl(o.note)} <Src ids={o.s} /></p>
      </header>
      <Section title={`${t('members')} ${year}: ${mem.length || '–'}`}>
        {mem.length ? <div className="chips">{mem.map((m) => <CountryChip key={m} iso={m} />)}</div> : <Empty>{id === 'un' ? tl(o.note) : t('none')}</Empty>}
      </Section>
      <Section title={t('sources')}><SourceList ids={o.s} /></Section>
    </article>
  );
}

function DisputedPanel({ id }: { id: string }) {
  const { t, tl } = useT();
  const d = DISPUTED.find((x) => x.id === id)!;
  return (
    <article>
      <header className="p-head"><div className="p-kicker">{t('disputed')}</div><h2>{tl(d.name)}</h2></header>
      <Section title={t('sum')}><p>{tl(d.note)}</p><p className="note"><Src ids={['ne', 'un']} /></p></Section>
    </article>
  );
}

/** What one clicked cluster of UCDP events holds. */
function IncidentPanel() {
  const { t, td, lang } = useT();
  const year = useStore((x) => x.year);
  const b = useStore((x) => x.incidentBin)!;
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg" style={{ background: '#FFB04A' }} />{t('inc_title')}</div>
        <h2>{fmtNum(b.events, lang)} {t('inc_events').toLowerCase()}</h2>
        <p className="note">{t('inc_upTo')} {year}</p>
      </header>
      <Section title={t('inc_deaths')}>
        <p className="flownum">{fmtNum(b.deaths, lang)}</p>
        {b.unknown > 0 && <p className="note">{t('inc_unknown')}: {fmtNum(b.unknown, lang)}</p>}
      </Section>
      <Section title={t('inc_span')}>
        <p>{b.from && b.to ? <>{fmtDate(b.from, lang)} – {fmtDate(b.to, lang)}</> : <Empty>{t('naData')}</Empty>}</p>
      </Section>
      <Section title={t('inc_type')}>
        {b.types.length ? (
          <ul className="plain">
            {b.types.map(([k, n]) => <li key={k}><b>{td('tov_', k)}</b> <span className="meta">{fmtNum(n, lang)}</span></li>)}
          </ul>
        ) : <Empty>{t('naData')}</Empty>}
      </Section>
      <Section title={t('inc_where')}>
        {b.countries.length ? (
          <ul className="plain">
            {b.countries.map(([iso, n]) => (
              <li key={iso}><CountryChip iso={iso as Iso} /> <span className="meta">{fmtNum(n, lang)} {t('inc_events').toLowerCase()}</span></li>
            ))}
          </ul>
        ) : <Empty>{t('naData')}</Empty>}
      </Section>
      <Section title={t('method')}>
        <p className="note">{t('inc_note')}</p>
        <p className="note">{t('inc_cum')}</p>
      </Section>
      <Section title={t('sources')}><SourceList ids={['ucdpGed', 'ucdp']} /></Section>
    </article>
  );
}

export default function RightPanel() {
  const { t } = useT();
  const { sel, view, select, disputedId, showDisputed, incidentBin, showIncidentBin, rightOpen, setRightOpen } = useStore();
  const hasSel = sel !== null || disputedId !== null || incidentBin !== null;
  let body;
  if (incidentBin) body = <IncidentPanel />;
  else if (disputedId) body = <DisputedPanel id={disputedId} />;
  else if (sel?.kind === 'conflict') body = <ConflictPanel id={sel.id} />;
  else if (sel?.kind === 'country') body = <CountryPanel code={sel.id} />;
  else if (sel?.kind === 'chokepoint') body = <ChokepointPanel id={sel.id} />;
  else if (sel?.kind === 'route') body = <RoutePanel id={sel.id} />;
  else if (sel?.kind === 'site') body = <SitePanel id={sel.id} />;
  else if (sel?.kind === 'org') body = <OrgPanel id={sel.id} />;
  else if (sel?.kind === 'territory') body = <TerritoryPanel id={sel.id} />;
  else if (sel?.kind === 'actor') body = <ActorPanel id={sel.id} />;
  else if (sel?.kind === 'flow') body = <FlowPanel id={sel.id} />;
  else if (sel?.kind === 'attack') body = <AttackPanel id={sel.id} />;
  else if (sel?.kind === 'place') body = <PlacePanel id={sel.id} />;
  else body = view === 'scenario' ? <ScenarioLab />
    : view === 'human' ? <><Dashboard /><DisplacementOverview /></>
    : view === 'conflict' ? <><Dashboard /><Recent /></>
    : <Dashboard />;
  return (
    <aside className={`panel right${rightOpen ? ' open' : ''}`} aria-label={t('panel')}>
      <div className="panel-bar">
        {hasSel ? <button type="button" className="mini" onClick={() => { showDisputed(null); showIncidentBin(null); select(null); }}>← {t('overview')}</button> : <span className="panel-title">{view === 'scenario' ? t('v_scenario') : t('overview')}</span>}
        <button type="button" className="mini only-mobile" onClick={() => setRightOpen(false)} aria-label={t('close')}>✕</button>
      </div>
      <div className="panel-scroll" key={`${sel?.kind}:${sel?.id}:${disputedId}:${incidentBin?.at.join()}:${view}`}><TraceSection />{body}<Ad slot="right" /></div>
    </aside>
  );
}
