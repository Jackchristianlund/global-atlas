import { useEffect, useMemo } from 'react';
import { ATTACKS } from '../data/attacks';
import { EVENTS, EVENT_COLOR } from '../data';
import { ACTOR, ACTORS, PLACES } from '../data/territory';
import { SOURCES } from '../data/sources';
import { BAB_EL_MANDEB, RED_SEA_BBOX, YEMEN_SITES } from '../data/yemen/explorer';
import { HISTORY_MONTHS, monthDate, type HistoryMonth } from '../lib/frontlineHistory';
import { km, padBbox, type ChangedStretch } from '../lib/frontDiff';
import { ageInDays } from '../lib/frontline';
import { snapshotYears, territoryFeatures } from '../lib/territory';
import { COMPARE_THRESHOLD_KM, SNAPSHOT_YEAR, useStore, type CompareKey } from '../store';
import { SNAPSHOT_DATE } from '../data/sources';
import { fmtDate, fmtNum, useT } from '../i18n';
import { Section } from './bits';

/**
 * The regional explorers: what the map of Ukraine and the map of Yemen show,
 * how to read them, and the tools that only make sense for one of them.
 *
 * They sit at the top of the conflict's own panel rather than floating over
 * the map, so they appear exactly when the reader has chosen that war and
 * not before — progressive disclosure, with no new layer switched on behind
 * the reader's back.
 */

/** A source as a link, with publisher and date beside it. */
function SrcLink({ id, label }: { id: string; label?: string }) {
  const { lang } = useT();
  const s = SOURCES[id];
  if (!s) return null;
  return (
    <a className="srclink" href={s.url} target="_blank" rel="noopener noreferrer">
      {label ?? s.title}<small>{s.publisher} · {fmtDate(s.date, lang)}</small>
    </a>
  );
}

const MONTH_FMT = (m: HistoryMonth, lang: 'no' | 'en') =>
  new Intl.DateTimeFormat(lang === 'no' ? 'nb-NO' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(monthDate(m) + 'T12:00:00Z'));

/** The nearest curated Ukrainian place to a stretch, for naming it. */
function nearestPlace(s: ChangedStretch): { name: string; km: number } | null {
  const mid = s.path[Math.floor(s.path.length / 2)];
  let best: { name: string; km: number } | null = null;
  for (const p of PLACES) {
    if (p.region !== 'ukraine') continue;
    const d = km(mid, p.at);
    if (!best || d < best.km) best = { name: p.name, km: d };
  }
  return best && best.km < 90 ? best : null;
}

function FrontCompare() {
  const { t, lang } = useT();
  const pair = useStore((s) => s.frontCompare);
  const st = useStore((s) => s.frontCompareState);
  const setPair = useStore((s) => s.setFrontCompare);
  const frameArea = useStore((s) => s.frameArea);
  const current = useStore((s) => s.frontline.set.meta.assessmentDate);
  const a = pair?.a ?? 1;
  const b = pair?.b ?? 'now';
  const opts: { v: CompareKey; label: string }[] = [
    ...HISTORY_MONTHS.map((m) => ({ v: m as CompareKey, label: MONTH_FMT(m, lang) })),
    { v: 'now', label: `${t('cmpf_now')} (${fmtDate(current, lang)})` },
  ];
  const parse = (v: string): CompareKey => (v === 'now' ? 'now' : (Number(v) as HistoryMonth));
  const run = (na: CompareKey, nb: CompareKey) => setPair({ a: na, b: nb });

  return (
    <div className="fcmp">
      <div className="fcmp-pick">
        <label>
          <span><i className="sw line dashed" style={{ borderTopColor: '#FFC24D' }} />{t('cmpf_from')}</span>
          <select value={String(a)} onChange={(e) => run(parse(e.target.value), b)}>
            {opts.map((o) => <option key={String(o.v)} value={String(o.v)}>{o.label}</option>)}
          </select>
        </label>
        <label>
          <span><i className="sw line" style={{ background: '#5CE1FF' }} />{t('cmpf_to')}</span>
          <select value={String(b)} onChange={(e) => run(a, parse(e.target.value))}>
            {opts.map((o) => <option key={String(o.v)} value={String(o.v)}>{o.label}</option>)}
          </select>
        </label>
      </div>
      <div className="fcmp-actions">
        <button type="button" className="btn" onClick={() => run(a, b)} disabled={st.status === 'loading'}>
          {pair ? t('cmpf_rerun') : t('cmpf_run')}
        </button>
        {pair && <button type="button" className="mini" onClick={() => setPair(null)}>{t('cmpf_stop')}</button>}
      </div>
      {st.status === 'loading' && <p className="meta">{t('fl_h_loading')}</p>}
      {st.status === 'unavailable' && <p className="fl-warn">{t('cmpf_unavailable')} ({st.reason})</p>}
      {st.status === 'ready' && (
        <div className="fcmp-out">
          {st.diff.stretches.length === 0 ? (
            <p>{t('cmpf_none').replace('{km}', String(COMPARE_THRESHOLD_KM))}</p>
          ) : (
            <>
              <p className="fcmp-sum">
                <b>{fmtNum(st.diff.changedKm, lang)} km</b> {t('cmpf_changed')} · {t('cmpf_max')} <b>≈{fmtNum(st.diff.maxShiftKm, lang, 1)} km</b>
              </p>
              <button type="button" className="mini" onClick={() => st.diff.bbox && frameArea(padBbox(st.diff.bbox, 0.15))}>⌖ {t('cmpf_frameAll')}</button>
              <ol className="fcmp-list">
                {st.diff.stretches.filter((x) => x.of === 'b').slice(0, 6).map((x, i) => {
                  const near = nearestPlace(x);
                  return (
                    <li key={i}>
                      <button type="button" className="rowbtn" onClick={() => frameArea(padBbox(x.bbox, 0.6, 0.15))}>
                        <span>{near ? `${t('cmpf_near')} ${near.name}` : t('cmpf_stretch')}</span>
                        <small>{fmtNum(x.lengthKm, lang)} km · ≤{fmtNum(x.maxKm, lang, 1)} km</small>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
          <p className="note">{t('cmpf_note').replace('{km}', String(COMPARE_THRESHOLD_KM))}</p>
        </div>
      )}
      {!pair && <p className="note">{t('cmpf_hint')}</p>}
    </div>
  );
}

/** What the labelled control layer is, where it came from, and how old it is. */
function ControlStatus() {
  const { t, lang } = useT();
  const control = useStore((s) => s.control);
  const load = useStore((s) => s.loadControl);
  useEffect(() => { void load(); }, [load]);
  if (control.status === 'loading' || control.status === 'idle') return <small>{t('fl_h_loading')}</small>;
  if (control.status === 'unavailable') return <small className="fl-warn">{t('ctl_off')} ({control.reason})</small>;
  const L = control.layer;
  const src = L.source === 'isw' ? SOURCES.iswControl : SOURCES.ochaHnrpOt;
  return (
    <small>
      {L.source === 'isw' ? 'ISW / CTP' : 'UN OCHA, HNRP 2026'} · {L.current ? t('ctl_fetched') : t('ctl_lineOf')}{' '}
      <a href={src?.url} target="_blank" rel="noopener noreferrer">{fmtDate(L.asOf, lang)}</a> · ≈{fmtNum(L.areaKm2, lang)} km²
      {!L.current && <> {t('ctl_older')}</>}
    </small>
  );
}

export function UkraineExplorer() {
  const { t, lang } = useT();
  const meta = useStore((s) => s.frontline.set.meta);
  const tier = useStore((s) => s.frontline.set.tier);
  const age = ageInDays(meta.assessmentDate, SNAPSHOT_DATE);
  return (
    <div className="rx">
      <Section title={t('rx_read')}>
        <ul className="rx-key">
          <li>
            <i className="sw fl-sw" />
            <div>
              <b>{t('rx_fl')}</b> — ISW / CTP, {t('rx_via')} OCHA · {t('fl_assessed')}{' '}
              <a href={SOURCES.ochaFlNow.url} target="_blank" rel="noopener noreferrer">{fmtDate(meta.assessmentDate, lang)}</a>
              {Number.isFinite(age) && age > 0 ? ` (${age} ${t('fl_age')})` : ''} · {tier === 'live' ? t('fl_live') : t('fl_bundled')}
              <small>{t('fl_unlabelled')}. {t('rx_notLive')}</small>
            </div>
          </li>
          <li><i className="sw box" style={{ background: 'rgba(214,69,61,.75)', outline: '1px solid #9E2A24' }} /><div><b>{t('ctl_title')}</b><ControlStatus /></div></li>
          <li><i className="sw box" style={{ background: 'rgba(214,69,61,.3)' }} /><div><b>{t('lg_terrOcc')} ({t('ctl_oblast')})</b><small>{t('rx_ctlShare')}</small></div></li>
          <li><i className="sw line dashed" style={{ borderTopColor: '#FFFFFF' }} /><div><b>{t('rx_partial')}</b><small>{t('rx_partialNote')}</small></div></li>
          <li><i className="sw line dashed" style={{ borderTopColor: '#FFC24D' }} /><div><b>{t('rx_older')}</b></div></li>
          <li><i className="sw line" style={{ background: '#5CE1FF' }} /><div><b>{t('rx_newer')}</b></div></li>
          <li><i className="sw box" style={{ background: 'rgba(255,92,168,.55)' }} /><div><b>{t('rx_diff')}</b><small>{t('rx_diffNote').replace('{km}', String(COMPARE_THRESHOLD_KM))}</small></div></li>
        </ul>
        <p className="note">{t('rx_noInfer')}</p>
      </Section>
      <Section title={t('cmpf_title')}><FrontCompare /></Section>
      <Section title={t('rx_sources')}>
        <div className="srclinks">
          <SrcLink id="ochaFlNow" />
          <SrcLink id="ochaFlHistory" />
          <SrcLink id="iswMaps" />
          <SrcLink id="ctpUkr1016" />
        </div>
      </Section>
    </div>
  );
}

export function YemenExplorer() {
  const { t, tl, lang } = useT();
  const year = useStore((s) => s.year);
  const setYear = useStore((s) => s.setYear);
  const select = useStore((s) => s.select);
  const frameArea = useStore((s) => s.frameArea);
  const layers = useStore((s) => s.layers);
  const toggleLayer = useStore((s) => s.toggleLayer);
  const units = useMemo(() => territoryFeatures(year).filter((f) => f.properties.region === 'yemen'), [year]);
  const actors = ACTORS.filter((a) => a.region === 'yemen');
  const years = snapshotYears('yemen');
  const events = useMemo(() => {
    const ev = EVENTS.filter((e) => e.conflict === 'yem').map((e) => ({ d: e.d, title: tl(e.t), color: EVENT_COLOR[e.type], attack: null as string | null }));
    const at = ATTACKS.filter((a) => a.iso === 'YEM').map((a) => ({ d: a.d, title: tl(a.title), color: '#00D9FF', attack: a.id }));
    return [...ev, ...at].sort((x, y) => y.d.localeCompare(x.d));
  }, [tl]);

  const showShipping = () => {
    if (!layers.routes) toggleLayer('routes');
    if (!layers.chokepoints) toggleLayer('chokepoints');
    frameArea(RED_SEA_BBOX);
  };

  return (
    <div className="rx">
      <div className="rx-limit" role="note">
        <b>{t('ry_limitTitle')}</b>
        <p>{t('ry_limit')}</p>
      </div>
      <Section title={t('ry_actors')}>
        <ul className="rx-actors">
          {actors.map((a) => {
            const held = units.filter((u) => u.properties.record.actor === a.id);
            const contested = held.filter((u) => u.properties.record.status !== 'control').length;
            return (
              <li key={a.id}>
                <button type="button" className="rowbtn" onClick={() => select({ kind: 'actor', id: a.id })}>
                  <i className="sw box" style={{ background: a.color }} />
                  <span><b>{a.short}</b> <small>{tl(a.name)} · {t(`ak_${a.kind}` as 'ak_government')}</small></span>
                  <small className="rx-n">{held.length} {t('ry_gov')}{contested ? ` · ${contested} ${t('ry_contested')}` : ''}</small>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="note">{t('ry_contestedNote')}</p>
      </Section>
      <Section title={t('ry_assess')}>
        <div className="chips">
          {years.map((y) => (
            <button key={y} type="button" className={`chip${y === year || (y === SNAPSHOT_YEAR && year === SNAPSHOT_YEAR) ? ' on' : ''}`} onClick={() => setYear(y)} aria-pressed={y === year}>
              {y}
            </button>
          ))}
        </div>
        <ul className="rx-units">
          {units.map((u) => {
            const r = u.properties.record;
            const a = ACTOR[r.actor];
            return (
              <li key={u.properties.id}>
                <button type="button" className="rowbtn" onClick={() => select({ kind: 'territory', id: u.properties.id })}>
                  <i className="sw box" style={{ background: a?.color ?? '#888', opacity: r.status === 'control' ? 1 : 0.55 }} />
                  <span>{u.properties.unitName}</span>
                  <small>{r.status === 'control' ? a?.short : `${t('ry_contested')}: ${a?.short ?? ''}${r.with ? ` / ${ACTOR[r.with]?.short ?? ''}` : ''}`} · {fmtDate(r.d, lang)}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </Section>
      <Section title={t('ry_red')}>
        <div className="rx-btns">
          <button type="button" className="btn" onClick={() => select({ kind: 'chokepoint', id: 'bab' })}>⌖ Bab el-Mandeb</button>
          <button type="button" className="btn" onClick={showShipping}>{t('ry_shipping')}</button>
          <button type="button" className="mini" onClick={() => frameArea(BAB_EL_MANDEB.bbox)}>{t('ry_frameStrait')}</button>
        </div>
      </Section>
      <Section title={t('ry_places')}>
        {(['port', 'city'] as const).map((kind) => (
          <div key={kind} className="rx-sites">
            <h4>{kind === 'port' ? t('ry_ports') : t('ry_cities')}</h4>
            <div className="chips">
              {YEMEN_SITES.filter((x) => x.kind === kind).map((x) => (
                <button
                  key={x.id} type="button" className="chip"
                  title={x.note ? tl(x.note) : undefined}
                  onClick={() => (x.place ? select({ kind: 'place', id: x.place }) : frameArea([x.at[1] - 0.25, x.at[0] - 0.2, x.at[1] + 0.25, x.at[0] + 0.2]))}
                >
                  {x.name}{x.place ? ' •' : ''}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="note">{t('ry_placesNote')}</p>
      </Section>
      <Section title={t('ry_events')}>
        <ul className="rx-events">
          {events.map((e, i) => (
            <li key={i}>
              <button
                type="button" className="rowbtn" style={{ ['--c' as string]: e.color }}
                onClick={() => (e.attack ? select({ kind: 'attack', id: e.attack }) : setYear(Number(e.d.slice(0, 4))))}
              >
                <time dateTime={e.d}>{fmtDate(e.d, lang)}</time>
                <span>{e.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={t('rx_sources')}>
        <div className="srclinks">
          <SrcLink id="ajYemenMaps" />
          <SrcLink id="wikiYem2026" />
          <SrcLink id="gbYemAdm2" />
        </div>
      </Section>
    </div>
  );
}
