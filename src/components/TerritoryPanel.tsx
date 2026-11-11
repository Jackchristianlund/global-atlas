import { CHOKEPOINT, CHOKEPOINTS, CONFLICT, LINKS, REL_COLOR } from '../data';
import { ACTOR, REGION, type Actor } from '../data/territory';
import { contactIn, diffControl, snapshotYears, actorHoldings, actorsOfRegion, effectiveFrom, frontsOfRegion, placesOfRegion, statusLabel, territoryById, unitHistory } from '../lib/territory';
import { haversineKm } from '../lib/geo';
import { useStore } from '../store';
import { fmtDate, fmtNum, useT } from '../i18n';
import type { ImpactLink } from '../types';
import { ClaimRow, ConflictLink, Empty, Section, SourceList, Src } from './bits';

function ActorChip({ id, big }: { id: string; big?: boolean }) {
  const { tl } = useT();
  const select = useStore((s) => s.select);
  const a = ACTOR[id];
  if (!a) return null;
  return (
    <button type="button" className={`chip actor${big ? ' big' : ''}`} style={{ borderColor: a.color }} onClick={() => select({ kind: 'actor', id })}>
      <span className="dot" style={{ background: a.color }} />
      {big ? tl(a.name) : a.short}
    </button>
  );
}

function LinkList({ items }: { items: ImpactLink[] }) {
  const { t, tl, lang } = useT();
  const pushTrace = useStore((s) => s.pushTrace);
  if (!items.length) return <Empty>{t('noLinks')}</Empty>;
  const order = { observed: 0, assessed: 1, potential: 2 } as const;
  return (
    <ul className="links">
      {items.slice().sort((a, b) => order[a.kind] - order[b.kind]).map((l) => (
        <li key={l.id} className={`link o-${l.kind}`} style={{ ['--c' as string]: REL_COLOR[l.type] }}>
          <div className="link-head"><strong>{tl(l.from.label)} → {tl(l.to.label)}</strong></div>
          <div className="link-tags">
            <span className="tag" style={{ color: REL_COLOR[l.type] }}>{t(`r_${l.type}`)}</span>
            <span className={`badge o-${l.kind}`}>{t(`o_${l.kind}`)}</span>
            <time dateTime={l.d}>{fmtDate(l.d, lang)}</time>
            <Src ids={l.s} />
          </div>
          <p><span className="lbl">{t('evidence')}:</span> {tl(l.evidence)}</p>
          <button type="button" className="mini follow" onClick={() => pushTrace(l.id)}>→ {t('trace_follow')}</button>
        </li>
      ))}
    </ul>
  );
}

/** One administrative unit: who holds it, how firmly, and on whose authority. */
export function TerritoryPanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const select = useStore((s) => s.select);
  const { year, setYear, setPlaying } = useStore();
  const f = territoryById(id, year);
  if (!f) return <Empty>{t('terr_none')}</Empty>;
  const { record: r, unitName, region } = f.properties;
  const a = ACTOR[r.actor];
  const other = r.with ? ACTOR[r.with] : null;
  const reg = REGION[region];
  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg" style={{ background: a.color }} />{t('terr')} · {t('terr_unit')}</div>
        <h2>{unitName}</h2>
        <dl className="kv">
          <div><dt>{t('terr_status')}</dt><dd>{tl(statusLabel[r.status])}</dd></div>
          <div><dt>{t('lastVerified')}</dt><dd>{fmtDate(r.d, lang)}</dd></div>
          {r.since && <div><dt>{t('terr_since')}</dt><dd>{fmtDate(r.since, lang)}</dd></div>}
          <div><dt>{t('year')}</dt><dd>{year}</dd></div>
          <div><dt>{t('terr_precision')}</dt><dd>{r.precision ? t(`gp_${r.precision}` as 'gp_unit') : <span className="na">{t('naStated')}</span>}</dd></div>
          <div><dt>{t('terr_conf')}</dt><dd>{r.confidence ? <span className={`badge cf-${r.confidence}`}>{t(`cf_${r.confidence}` as 'cf_high')}</span> : <span className="na">{t('naStated')}</span>}</dd></div>
        </dl>
      </header>

      <Section title={t('terr_actor')}>
        <div className="chips">
          <ActorChip id={r.actor} big />
          {other && <ActorChip id={other.id} big />}
        </div>
        <p className="meta">{t(`ak_${a.kind}`)}{other ? ` · ${t('terr_with')}: ${t(`ak_${other.kind}`)}` : ''}</p>
        {r.share && <p><span className="lbl">{t('terr_share')}:</span> {tl(r.share)}</p>}
        <p>{tl(r.note)} <Src ids={r.s} /></p>
      </Section>

      <Section title={t('terr_history')}>
        {(() => {
          const hist = unitHistory(f.properties.iso, f.properties.code);
          if (hist.length < 2) return <Empty>{t('terr_histNone')}</Empty>;
          return (
            <>
              <ul className="histlist">
                {hist.map((h, i) => {
                  const ha = ACTOR[h.actor];
                  const on = h === r;
                  return (
                    <li key={i} className={on ? 'on' : ''}>
                      <button type="button" onClick={() => { setPlaying(false); setYear(Number(effectiveFrom(h).slice(0, 4))); }}>
                        <span className="dot" style={{ background: ha.color }} />
                        <time dateTime={effectiveFrom(h)}>{fmtDate(effectiveFrom(h), lang)}</time>
                        <span>{ha.short} <small className="meta">{tl(statusLabel[h.status])}</small></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="note">{t('terr_histNote')}</p>
            </>
          );
        })()}
      </Section>

      {reg && (
        <Section title={t('terr_region')}>
          <button type="button" className="rowbtn" onClick={() => select({ kind: 'actor', id: r.actor })}>{tl(reg.name)} →</button>
          <ConflictLink id={reg.conflict} />
          <p className="note">{tl(reg.coverage)} <Src ids={reg.s} /></p>
          {reg.legalNote && <p className="note warn">{tl(reg.legalNote)}</p>}
          <p className="note">{t('terr_method')} <Src ids={['ne10m']} /></p>
        </Section>
      )}

      <Section title={t('sources')}><SourceList ids={[...new Set([...r.s, ...(reg?.s ?? []), 'ne10m'])]} /></Section>
    </article>
  );
}

/** One actor: profile, holdings and the international relationships of its conflict. */
export function ActorPanel({ id }: { id: string }) {
  const { t, tl, lang } = useT();
  const select = useStore((s) => s.select);
  const year = useStore((s) => s.year);
  const a: Actor | undefined = ACTOR[id];
  if (!a) return <Empty>{t('terr_none')}</Empty>;
  const reg = REGION[a.region];
  const h = actorHoldings(id, year);
  const fronts = frontsOfRegion(a.region).filter((f) => f.between.includes(id));
  const gone = h.full.length + h.partial.length + h.alsoIn.length === 0;
  const places = placesOfRegion(a.region).filter((p) => p.actor === id);
  const conflictId = reg?.conflict ?? '';
  const links = LINKS.filter((l) => l.conflict === conflictId);
  const chokes = CHOKEPOINTS.filter((c) => c.conflicts.includes(conflictId));
  const peers = actorsOfRegion(a.region).filter((x) => x.id !== id);
  const allSrc = [...new Set([...a.s, ...h.full.flatMap((x) => x.properties.record.s), ...fronts.flatMap((x) => x.s), ...(reg?.s ?? []), 'ne10m'])];

  return (
    <article>
      <header className="p-head">
        <div className="p-kicker"><span className="dot lg" style={{ background: a.color }} />{t(`ak_${a.kind}`)}{reg ? ` · ${tl(reg.name)}` : ''}</div>
        <h2>{tl(a.name)}</h2>
        <p>{tl(a.about)} <Src ids={a.s} /></p>
      </header>

      {gone && <p className="note warn">{t('terr_gone')}</p>}
      <Section title={t('terr_extent')}>
        <p className="big">{h.full.length + h.partial.length} <small>{t('terr_units')} · {year}</small></p>
        <div className="chips">
          {[...h.full, ...h.partial].map((u) => (
            <button key={u.properties.id} type="button" className="chip" onClick={() => select({ kind: 'territory', id: u.properties.id })}>
              {u.properties.unitName}
              {u.properties.record.status !== 'control' && <small>{tl(statusLabel[u.properties.record.status])}</small>}
            </button>
          ))}
        </div>
        {h.alsoIn.length > 0 && (
          <>
            <p className="meta mt">{t('terr_with')}:</p>
            <div className="chips">
              {h.alsoIn.map((u) => (
                <button key={u.properties.id} type="button" className="chip" onClick={() => select({ kind: 'territory', id: u.properties.id })}>{u.properties.unitName}</button>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section title={t('terr_cities')}>
        {places.length ? (
          <ul className="plain">
            {places.map((p) => (
              <li key={p.id}><b>{p.name}</b> <span className="meta">{fmtDate(p.d, lang)}</span><br />{tl(p.note)} <Src ids={p.s} /></li>
            ))}
          </ul>
        ) : <Empty>{t('naData')}</Empty>}
      </Section>

      {fronts.length > 0 && (
        <Section title={t('terr_fronts')}>
          <ul className="claims">
            {fronts.map((f) => (
              <ClaimRow key={f.id} c={{ cat: 'military', kind: 'fact', d: f.d, s: f.s, t: [`${tl(f.name)}: ${f.note[0]}`, `${tl(f.name)}: ${f.note[1]}`] }} />
            ))}
          </ul>
        </Section>
      )}

      <Section title={t('terr_objectives')}><p>{tl(a.objectives)} <Src ids={a.s} /></p></Section>
      <Section title={t('terr_supporters')}><p>{tl(a.supporters)} <Src ids={a.s} /></p></Section>
      <Section title={t('terr_assets')}><p>{tl(a.assets)} <Src ids={a.s} /></p></Section>

      <Section title={t('terr_opponents')}>
        <div className="chips">{a.opponents.map((o) => <ActorChip key={o} id={o} big />)}</div>
        {peers.length > a.opponents.length && (
          <>
            <p className="meta mt">{t('terr_actors')}:</p>
            <div className="chips">{peers.filter((p) => !a.opponents.includes(p.id)).map((p) => <ActorChip key={p.id} id={p.id} />)}</div>
          </>
        )}
      </Section>

      {conflictId && (
        <Section title={t('conflictsHere')}>
          <ConflictLink id={conflictId} />
          {CONFLICT[conflictId] && <p className="note">{tl(CONFLICT[conflictId].sum)}</p>}
        </Section>
      )}

      {chokes.length > 0 && (
        <Section title={t('exposure')}>
          {chokes.map((c) => (
            <button key={c.id} type="button" className="rowbtn" onClick={() => select({ kind: 'chokepoint', id: c.id })}>
              <span className="dot sq" style={{ background: '#00D9FF' }} />{tl(CHOKEPOINT[c.id].name)}
            </button>
          ))}
        </Section>
      )}

      <Section title={t('terr_connections')}>
        <p className="note">{t('terr_connNote')}</p>
        <LinkList items={links} />
      </Section>

      {reg && (
        <Section title={t('terr_coverage')}>
          <p>{tl(reg.coverage)}</p>
          {reg.legalNote && <p className="note warn"><b>{t('terr_legal')}:</b> {tl(reg.legalNote)}</p>}
          <p className="note">{t('terr_method')}</p>
          <p className="meta">{t('lastVerified')}: {fmtDate(reg.verified, lang)}</p>
        </Section>
      )}

      <Section title={t('sources')}><SourceList ids={allSrc} /></Section>
    </article>
  );
}

/**
 * The derived line of contact for a region: where the control assessment puts
 * different actors on either side of an administrative border, in the selected
 * year. The section states plainly that the line is derived rather than
 * surveyed, and dates it by the weaker of the two assessments it sits between.
 */
export function ContactSection({ region }: { region: string }) {
  const { t, lang } = useT();
  const year = useStore((s) => s.year);
  const select = useStore((s) => s.select);
  const lines = contactIn(region, year);
  const km = Math.round(lines.reduce((n, c) => n + lineLengthKm(c.coords), 0));
  const oldest = lines.reduce((m, c) => (c.d < m ? c.d : m), '9999-99-99');
  return (
    <Section title={t('ct_lines')} aside={lines.length ? <span className="meta">{lines.length} · {fmtNum(km, lang)} km</span> : undefined}>
      {lines.length === 0 ? <Empty>{t('ct_none')}</Empty> : (
        <>
          <ul className="ctlist">
            {lines.map((c) => (
              <li key={c.id}>
                <span className="ct-pair">
                  <button type="button" className="linklike" onClick={() => select({ kind: 'actor', id: c.a })}>
                    <span className="dot" style={{ background: ACTOR[c.a].color }} />{ACTOR[c.a].short}
                  </button>
                  <span className="ct-vs">—</span>
                  <button type="button" className="linklike" onClick={() => select({ kind: 'actor', id: c.b })}>
                    <span className="dot" style={{ background: ACTOR[c.b].color }} />{ACTOR[c.b].short}
                  </button>
                </span>
                <span className="meta">{Math.round(lineLengthKm(c.coords))} km · <time dateTime={c.d}>{fmtDate(c.d, lang)}</time> <Src ids={c.s} /></span>
              </li>
            ))}
          </ul>
          <p className="note"><b>{t('ct_asof')}:</b> {fmtDate(oldest, lang)}</p>
        </>
      )}
      <p className="note">{t('ct_derived')}</p>
    </Section>
  );
}


/** Great-circle length of a polyline, in kilometres. */
function lineLengthKm(pts: [number, number][]): number {
  let n = 0;
  for (let i = 1; i < pts.length; i++) n += haversineKm(pts[i - 1], pts[i]);
  return n;
}

/**
 * Compare two dated assessments of a region.
 *
 * Both dates come from the set of years that actually have an assessment, and
 * the list shows only what the two records themselves differ on. Nothing is
 * interpolated: this says what changed between two snapshots, not when or how
 * it changed.
 */
export function CompareSection({ region }: { region: string }) {
  const { t, lang } = useT();
  const { year, setYear, compareYear, setCompareYear, select } = useStore();
  const years = snapshotYears(region);
  if (years.length < 2) return null;
  const from = compareYear ?? years[0];
  const changes = compareYear === null ? [] : diffControl(region, from, year);
  return (
    <Section title={t('cmp_title')}>
      <div className="cmprow">
        <label>
          <span className="lbl">{t('cmp_from')}</span>
          <select value={compareYear ?? ''} onChange={(e) => setCompareYear(e.target.value ? Number(e.target.value) : null)}>
            <option value="">{t('cmp_off')}</option>
            {years.filter((y) => y < year).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label>
          <span className="lbl">{t('cmp_to')}</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
      </div>
      <p className="note">{t('cmp_onlySnapshots')}</p>
      {compareYear !== null && (
        <>
          <h4 className="subh">{t('cmp_changes')} · {from} → {year}</h4>
          {changes.length === 0 ? <Empty>{t('cmp_none')}</Empty> : (
            <ul className="cmplist">
              {changes.map((c) => (
                <li key={c.id}>
                  <button type="button" className="linklike" onClick={() => select({ kind: 'territory', id: c.id })}>{c.unitName}</button>
                  <span className="meta">{t(`cmp_${c.kind}` as 'cmp_actor')}</span>
                  <span className="cmp-sides">
                    {c.from ? <span className="cmp-side"><span className="dot" style={{ background: ACTOR[c.from.actor].color }} />{ACTOR[c.from.actor].short} <small>{fmtDate(c.from.d, lang)}</small></span> : <span className="na">—</span>}
                    <span className="ct-vs">→</span>
                    {c.to ? <span className="cmp-side"><span className="dot" style={{ background: ACTOR[c.to.actor].color }} />{ACTOR[c.to.actor].short} <small>{fmtDate(c.to.d, lang)}</small></span> : <span className="na">—</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="note">{t('cmp_highlight')} {t('cmp_noInvent')}</p>
        </>
      )}
    </Section>
  );
}
