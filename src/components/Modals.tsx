import { useEffect, useMemo, useState } from 'react';
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force';
import { CHOKEPOINT, CONFLICT, ORG, ORGS, ROUTE, SITE, SNAPSHOT_DATE, SOURCES, countryName } from '../data';
import { REGISTRY } from '../data/live';
import { edgesOf, otherEnd, type GraphEdge, type NodeRef } from '../lib/graph';
import { membersAt } from '../lib/selectors';
import { useStore } from '../store';
import { Advertise, Pricing } from './Commerce';
import { fmtDate, fmtNum, pick as pickL, useT } from '../i18n';
import type { L, Selection } from '../types';
import { SourceList, Src } from './bits';

const M: { h: L; p: L }[] = [
  {
    h: ['Hva dette er', 'What this is'],
    p: [
      `Global Atlas er et kuratert øyeblikksbilde satt sammen ${fmtDate(SNAPSHOT_DATE, 'no')}. Hver påstand bærer sin egen kilde og dato. Ingenting i appen er sanntidsdata, og appen henter ingenting fra nettet mens den kjører.`,
      `Global Atlas is a curated snapshot compiled on ${fmtDate(SNAPSHOT_DATE, 'en')}. Every statement carries its own source and date. Nothing in the app is real-time data, and the app fetches nothing from the network while running.`,
    ],
  },
  {
    h: ['Intensitetsnivåer', 'Intensity tiers'],
    p: [
      'Fargene for intensitet følger radene i Wikipedias liste over pågående væpnede konflikter, som selv tilskriver nivåene ACLED-data: mørk rød 10 000+ drepte per år, rød 1 000–9 999, oransje 100–999, gul 1–99. Én rad kan samle en hel konfliktfamilie (for eksempel «Arab–Israeli / Iran–Israel proxy wars»), og da gjelder nivået familien, ikke den enkelte fronten. Lilla markerer spenningspunkter uten bekreftet pågående krigføring, blå våpenhvile eller fredsprosess. Fargene påstår aldri mer enn kilden: de er en klassifisering, ikke en måling.',
      'The intensity colours follow the rows of Wikipedia’s list of ongoing armed conflicts, which itself attributes the tiers to ACLED data: dark red 10,000+ deaths a year, red 1,000–9,999, orange 100–999, yellow 1–99. One row can group a whole conflict family (for instance “Arab–Israeli / Iran–Israel proxy wars”), in which case the tier describes the family, not the individual front. Purple marks flashpoints without confirmed active warfare, blue a ceasefire or peace process. The colours never claim more than the source: they are a classification, not a measurement.',
    ],
  },
  {
    h: ['Kildetyper og merking', 'Source types and labelling'],
    p: [
      'Hver opplysning er merket «Bekreftet» (rapportert av en navngitt kilde), «Vurdering» (anslag eller analyse) eller «Mulig risiko» (ikke inntruffet). Tall oppgis med hvem som har telt og hvordan. Der datasettet mangler noe, står det «Ikke tilgjengelig» i stedet for et anslag. Flere poster bygger på Wikipedia-artikler; de er sekundærkilder redigert av frivillige og er merket slik i kildelisten.',
      'Every item is labelled “Confirmed” (reported by a named source), “Assessment” (estimate or analysis) or “Possible risk” (not occurred). Figures state who counted and how. Where the dataset lacks something, it says “Not available” instead of guessing. Several records draw on Wikipedia articles; these are volunteer-edited secondary sources and are labelled as such in the source list.',
    ],
  },
  {
    h: ['Grenser og omstridte områder', 'Borders and disputed areas'],
    p: [
      'Basiskartet er Natural Earth (1:110m), som tegner faktisk kontroll: Krim framstår som del av Russland og Golanhøydene som del av Israel. Det er en egenskap ved kartgrunnlaget, ikke et standpunkt. Grå markører forklarer elleve slike områder, og ingen omstridt grense presenteres som avgjort. Historiske grenser er ikke modellert: tidslinjen viser dagens grenser også for tidligere år.',
      'The base map is Natural Earth (1:110m), which draws de facto control: Crimea appears as part of Russia and the Golan Heights as part of Israel. That is a property of the base data, not a position. Grey markers explain eleven such areas, and no disputed border is presented as settled. Historical borders are not modelled: the timeline shows today’s borders for earlier years too.',
    ],
  },
  {
    h: ['Grunnkartet', 'The base map'],
    p: [
      'Grunnkartet er uavhengig av konfliktdataene og leverer bare terreng, veier, steder og navn \u00e5 lese vurderingene mot. Et skarpere grunnkart gj\u00f8r ikke vurderingene over det mer presise enn kildene deres. Stilene Konfliktkart, Standardkart og Terreng bruker OpenFreeMap p\u00e5 OpenStreetMap-data under ODbL, som tillater kommersiell bruk med kildeangivelse. Satellitt og Hybrid krever en leverand\u00f8r med lisens og st\u00e5r som ferdige adaptere som sier hva som mangler. Elver og innsj\u00f8er p\u00e5 kloden er Natural Earth, som er fri bruk og ligger i appen, s\u00e5 de virker uten nett.',
      'The base map is independent of the conflict data and supplies only terrain, roads, settlements and names to read the assessments against. A sharper base map does not make the assessments on top of it more precise than their sources. The Conflict map, Standard map and Terrain styles use OpenFreeMap on OpenStreetMap data under ODbL, which permits commercial use with attribution. Satellite and Hybrid need a licensed provider and are present as finished adapters that say what is missing. The rivers and lakes on the globe are Natural Earth, free to use and bundled with the app, so they work without a network.',
    ],
  },
  {
    h: ['Kontaktlinjer og geometri', 'Lines of contact and geometry'],
    p: [
      'Den administrative geometrien er en topologi: hver grense er lagret \u00e9n gang som en bue begge naboene viser til. Derfor er naboenheter enige om linjen mellom seg \u2013 ingen hull \u2013 og grensen mellom to ulikt kontrollerte enheter kan leses rett ut av dataene. Kontaktlinjen er utledet av kontrollvurderingen, ikke kartlagt i felt. Den f\u00f8lger administrative grenser, fordi det er oppl\u00f8sningen vurderingene har, og den dateres av den eldste av de to vurderingene den ligger mellom. Der en enhet ikke er vurdert det \u00e5ret, tegnes ingen linje mot den: grensen til et blankt omr\u00e5de er ingen front.',
      'The administrative geometry is a topology: each border is stored once as an arc that both neighbours reference. Neighbouring units therefore agree on the line between them \u2013 no gaps \u2013 and the boundary between two differently-held units can be read straight out of the data. The line of contact is derived from the control assessment, not mapped in the field. It follows administrative borders, because that is the resolution the assessments have, and it is dated by the older of the two assessments it sits between. Where a unit is unassessed for that year, no line is drawn against it: the boundary of a blank area is not a front.',
    ],
  },
  {
    h: ['Sammenlikning av to vurderinger', 'Comparing two assessments'],
    p: [
      'Bare \u00e5r som faktisk har en datert vurdering kan velges. Et \u00e5r uten vurdering ville vist \u00abingen endring\u00bb n\u00e5r det egentlig betyr at ingen har sett etter. Listen viser bare det de to postene selv er uenige om, og skiller mellom \u00e5 skifte hender, \u00e5 endre kontrollkategori og \u00e5 bli vurdert for f\u00f8rste gang. Mellomliggende endringer konstrueres ikke: forskjellen gjelder de to datoene, ikke veien mellom dem.',
      'Only years that actually have a dated assessment can be chosen. A year without one would show \u201cno change\u201d when what it really means is that nobody looked. The list shows only what the two records themselves differ on, and separates changing hands from changing control category and from being assessed for the first time. Intermediate changes are not constructed: the difference is between the two dates, not the path between them.',
    ],
  },
  {
    h: ['Hendelser og angrep', 'Conflict events and attacks'],
    p: [
      'Et kuratert utvalg dokumenterte hendelser, ikke et register over alle. Hver post holder hendelsesdatoen atskilt fra publiseringsdatoen og oppgir hvor n\u00f8yaktig kilden plasserer hendelsen \u2013 n\u00f8yaktig sted, bydel, by eller region. Der kildene oppgir ulike tall, st\u00e5r hvert tall med sin egen kilde i stedet for at ett velges eller at de sl\u00e5s sammen. En p\u00e5stand fra en part i konflikten merkes som p\u00e5stand, ikke som faktum. Et angrepssted sier hvor noe skjedde, ikke hvem som kontrollerer omr\u00e5det, og et angrep leses ikke som et vellykket framrykk.',
      'A curated selection of documented events, not a register of all of them. Each record keeps the date of the event separate from the date it was reported and states how precisely the source places it \u2013 exact site, district, city or region. Where sources give different figures, each figure appears with its own source rather than one being chosen or the two being merged. A claim by a party to the conflict is marked as a claim, not as fact. An attack location says where something happened, not who controls the area, and a strike is not read as a successful advance.',
    ],
  },
  {
    h: ['Georgia, Kaukasus og Tsjetsjenia', 'Georgia, the Caucasus and Chechnya'],
    p: [
      'Abkhasia og S\u00f8r-Ossetia vises som faktiske administrasjoner p\u00e5 internasjonalt anerkjent georgisk territorium, med russiske baser oppgitt. De er bevisst tegnet annerledes enn russisk-okkupert ukrainsk territorium: rettslig stilling, milit\u00e6r situasjon og politiske ordninger er ikke de samme, og det st\u00e5r i omr\u00e5defanen. Tsjetsjenia vises som delrepublikk i Den russiske f\u00f8derasjonen med den blekeste fyllfargen i datasettet, slik at den historisk omstridte regionen kan vises uten \u00e5 bli fargelagt som okkupert omr\u00e5de. Geometrien er Natural Earths egne utbryterpolygoner, ikke tegnet for h\u00e5nd.',
      'Abkhazia and South Ossetia are shown as de facto administrations on internationally recognised Georgian territory, with the Russian bases stated. They are deliberately drawn differently from Russian-occupied Ukrainian territory: the legal position, the military situation and the political arrangements are not the same, and the region panel says so. Chechnya is shown as a constituent republic of the Russian Federation with the palest fill in the dataset, so that a historically contested region can be shown without being coloured as occupied territory. The geometry is Natural Earth\u2019s own breakaway polygons, not drawn by hand.',
    ],
  },
  {
    h: ['Hendelseslaget (UCDP GED)', 'The incident layer (UCDP GED)'],
    p: [
      'Laget viser enkelthendelser fra UCDP Georeferenced Event Dataset, samlet i ruter med oppl\u00f8sning etter kamerah\u00f8yde. En rute er en ansamling av hendelser, ikke en vurdering av kontroll \u2013 territoriell kontroll er et annet lag med andre kilder. Fargen f\u00f8lger antall drepte kilden tilskriver rutens hendelser. Hendelser uten anslag telles for seg og leses aldri som null drepte. Laget er kumulativt til og med \u00e5ret p\u00e5 tidslinjen. ACLED-hendelser inng\u00e5r ikke, fordi vilk\u00e5rene ikke tillater redistribusjon av r\u00e5data. Uten en lokal ingest er laget tomt, og sidepanelet sier hvilken kommando som fyller det.',
      'The layer shows individual events from the UCDP Georeferenced Event Dataset, gathered into bins whose resolution follows the camera height. A bin is a cluster of events, not an assessment of control \u2013 territorial control is a separate layer from separate sources. Colour follows the deaths the source attributes to the bin\u2019s events. Events with no estimate are counted separately and never read as zero deaths. The layer is cumulative up to and including the year on the timeline. ACLED events are excluded, because its terms do not permit redistributing raw data. Without a local ingest the layer is empty, and the sidebar says which command fills it.',
    ],
  },
  {
    h: ['Fluktkorridorer', 'Displacement corridors'],
    p: [
      'Korridorene er tall UNHCR har publisert for en oppgitt dato og et oppgitt grunnlag. Grunnlagene er ikke like \u2013 registrerte flyktninger, ankomne siden en startdato, planleggingstall fra en responsplan \u2013 og tall med ulikt grunnlag legges aldri sammen, heller ikke for samme land. Hvert panel oppgir sitt eget grunnlag og sin egen dato. En korridor krysser alltid en grense; internt fordrevne telles for seg og tegnes ikke som bue. En korridor vises f\u00f8rst fra det \u00e5ret tallet gjelder. Linjetykkelsen rangerer korridorene mot hverandre etter kvadratroten av antallet og er ingen m\u00e5lestokk.',
      'Corridors are counts UNHCR published for a stated date on a stated basis. The bases differ \u2013 registered refugees, arrivals since a start date, planning figures from a response plan \u2013 and figures on different bases are never added together, not even for the same country. Each panel states its own basis and date. A corridor always crosses a border; internally displaced people are counted separately and are not drawn as arcs. A corridor appears only from the year its figure refers to. Line weight ranks corridors against each other by the square root of the count and is not a measuring scale.',
    ],
  },
  {
    h: ['Territoriell kontroll gjennom tid', 'Territorial control over time'],
    p: [
      'Hver kontrollpost har en dato for n\u00e5r vurderingen ble kontrollert og, der det er dokumentert, en dato for n\u00e5r ordningen begynte. Tidslinjen velger den siste vurderingen som gjaldt det \u00e5ret. Finnes ingen kildebelagt vurdering for et omr\u00e5de det \u00e5ret, tegnes omr\u00e5det ikke \u2013 dagens kart projiseres aldri bakover. \u00abSist kontrollert\u00bb viser datoen til den nyeste vurderingen som faktisk tegnes.',
      'Every control record carries the date its assessment was verified and, where documented, the date the arrangement began. The timeline picks the latest assessment in force for that year. Where no sourced assessment exists for a unit in that year, the unit is not drawn \u2013 today\u2019s map is never projected backwards. \u201cLast verified\u201d shows the date of the most recent record actually drawn.',
    ],
  },
  {
    h: ['Handelsruter', 'Trade routes'],
    p: [
      'Sjøruter og landkorridorer er håndtegnede, illustrative korridorer, ikke AIS-spor, og appen viser aldri levende skipsposisjoner. Oljevolumer gjennom knutepunktene er EIAs publiserte anslag for 2023 og 2. kvartal 2026. Avstander i Scenariolaben regnes langs de illustrative korridorene og er merket deretter.',
      'Sea routes and land corridors are hand-drawn, illustrative corridors, not AIS tracks, and the app never shows live vessel positions. Oil volumes through the chokepoints are the EIA’s published estimates for 2023 and Q2 2026. Distances in Scenario Lab are measured along the illustrative corridors and labelled accordingly.',
    ],
  },
  {
    h: ['Dekning og begrensninger', 'Coverage and limitations'],
    p: [
      'Datasettet dekker 44 konflikter og spenningspunkter, 11 organisasjoner, 7 sanksjonsregimer, 10 knutepunkter, 27 ruter og rørledninger og 66 tidslinjehendelser. Det er et utvalg: referanselisten fører 48 konfliktrader, og bare et mindretall er beskrevet i dybden her. Handelspartnere per land, samlede fordrivelses- og tapstall for flere konflikter og hendelser etter 9. november 2026 er ikke lagt inn. Arkitekturen for løpende datainnhenting (ACLED, UCDP, UNHCR, IMF PortWatch) er beskrevet i dokumentasjonen, men ikke bygget.',
      'The dataset covers 44 conflicts and flashpoints, 11 organisations, 7 sanctions regimes, 10 chokepoints, 27 routes and pipelines and 66 timeline events. It is a selection: the reference list holds 48 conflict rows, and only a minority are described in depth here. Bilateral trade partners, aggregate displacement and casualty totals for several conflicts, and events after 9 November 2026 are not loaded. The architecture for continuous ingestion (ACLED, UCDP, UNHCR, IMF PortWatch) is described in the documentation but not built.',
    ],
  },
];

function MethodModal() {
  const { t, tl } = useT();
  return (
    <>
      <h2>{t('m_title')}</h2>
      {M.map((m, i) => (
        <section className="sec" key={i}><h3>{tl(m.h)}</h3><p>{tl(m.p)}</p></section>
      ))}
      <section className="sec">
        <h3>{t('sources')}</h3>
        <SourceList ids={Object.keys(SOURCES)} />
      </section>
    </>
  );
}

export function DataPanel() {
  const { t, lang } = useT();
  const setModal = useStore((s) => s.setModal);
  const ORDER = { integrated: 0, connector_ready: 1, planned: 2 } as const;
  const rows = REGISTRY.slice().sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name));
  return (
    <>
      <h2>{t('ds_title')}</h2>
      <p className="note">{t('ds_note')}</p>
      <p><button type="button" className="btn" onClick={() => setModal('method')}>{t('open_method')}</button></p>
      <div className="dslist">
        {rows.map((r) => (
          <section className={`dcard st-${r.status}`} key={r.id}>
            <header>
              <h3>{r.name}</h3>
              <span className={`badge ds-${r.status}`}>{t(r.status === 'integrated' ? 'ds_integrated' : r.status === 'connector_ready' ? 'ds_connector' : 'ds_planned')}</span>
            </header>
            <dl className="kv wide">
              <div><dt>{t('ds_providers')}</dt><dd>{r.providers.join(' → ')}</dd></div>
              <div><dt>{t('ds_vintage')}</dt><dd>{r.vintage}</dd></div>
              <div><dt>{t('ds_license')}</dt><dd>{r.license}</dd></div>
              <div><dt>{t('ds_cadence')}</dt><dd>{r.cadence}</dd></div>
              <div><dt>{t('ds_access')}</dt><dd>{r.access}</dd></div>
              {r.retrieved_at && (
                <div><dt>{t('ds_retrieved')}</dt><dd>{fmtDate(r.retrieved_at.slice(0, 10), lang)} · {fmtNum(r.record_count ?? 0, lang)} {t('ds_records')}</dd></div>
              )}
              {r.blocked_reason && <div className="full"><dt>{t('ds_blocked')}</dt><dd>{r.blocked_reason}</dd></div>}
              {r.unmapped.length > 0 && (
                <div className="full"><dt>{t('ds_unmapped')} ({r.unmapped.length})</dt><dd className="meta">{r.unmapped.slice(0, 10).join('; ')}{r.unmapped.length > 10 ? ' …' : ''}</dd></div>
              )}
            </dl>
            <a className="meta" href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a>
          </section>
        ))}
      </div>
    </>
  );
}

const ET_FALLBACK = new Set(['membership', 'party', 'exposure', 'passes', 'located']);

function EdgeRow({ e, me, onGo }: { e: GraphEdge; me: NodeRef; onGo: (ref: NodeRef) => void }) {
  const { t, tl, lang } = useT();
  const o = otherEnd(e, me);
  const name =
    o.kind === 'country' ? countryName(o.id, lang)
    : o.kind === 'org' ? ORG[o.id]?.short ?? o.id
    : o.kind === 'conflict' ? pickL(CONFLICT[o.id].name, lang)
    : o.kind === 'chokepoint' ? pickL(CHOKEPOINT[o.id].name, lang)
    : o.kind === 'route' ? pickL(ROUTE[o.id].name, lang)
    : SITE[o.id]?.name ?? o.id;
  const typeLabel = ET_FALLBACK.has(e.type) ? t(`et_${e.type}` as 'et_membership') : t(`r_${e.type}` as 'r_defense');
  return (
    <li className={`link o-${e.kind}`}>
      <div className="link-head"><strong>{name}</strong></div>
      <div className="link-tags">
        <span className="tag">{typeLabel}</span>
        <span className={`badge o-${e.kind}`}>{t(`o_${e.kind}`)}</span>
        <span className="meta">{t('conf')}: {t(`conf_${e.confidence}`)}</span>
        {(e.from || e.to) && <span className="meta">{t('g_period')}: {e.from ?? '…'}–{e.to ?? ''}</span>}
        <Src ids={e.s} />
      </div>
      <p><span className="lbl">{t('evidence')}:</span> {tl(e.evidence)}</p>
      <p><span className="lbl">{t('derivation')}:</span> {tl(e.derivation)}</p>
      <button type="button" className="mini" onClick={() => onGo(o)}>{t('goto')}</button>
    </li>
  );
}

interface NodeD extends SimulationNodeDatum { id: string; type: 'org' | 'country'; color: string; label: string }

function NetworkModal() {
  const { t, tl, lang } = useT();
  const { year, select, setModal, setOrg } = useStore();
  const [selNode, setSelNode] = useState<NodeRef | null>(null);

  const graph = useMemo(() => {
    const orgs = ORGS.filter((o) => o.id !== 'un');
    const nodes: NodeD[] = orgs.map((o) => ({ id: `o:${o.id}`, type: 'org', color: o.color, label: o.short }));
    const seen = new Set<string>();
    const links: (SimulationLinkDatum<NodeD> & { color: string })[] = [];
    for (const o of orgs) {
      for (const m of membersAt(o, year)) {
        const id = `c:${m}`;
        if (!seen.has(id)) { seen.add(id); nodes.push({ id, type: 'country', color: '#9FB3C8', label: countryName(m, lang) }); }
        links.push({ source: `o:${o.id}`, target: id, color: o.color });
      }
    }
    const sim = forceSimulation(nodes)
      .force('link', forceLink<NodeD, SimulationLinkDatum<NodeD>>(links).id((d) => d.id).distance(46).strength(0.4))
      .force('charge', forceManyBody().strength((d) => ((d as NodeD).type === 'org' ? -420 : -26)))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide<NodeD>().radius((d) => (d.type === 'org' ? 30 : 7)))
      .stop();
    sim.tick(260);
    return { nodes, links };
  }, [year, lang]);

  const xs = graph.nodes.map((d) => d.x ?? 0);
  const ys = graph.nodes.map((d) => d.y ?? 0);
  const pad = 40;
  const vb = `${Math.min(...xs) - pad} ${Math.min(...ys) - pad} ${Math.max(...xs) - Math.min(...xs) + pad * 2} ${Math.max(...ys) - Math.min(...ys) + pad * 2}`;

  const pick = (n: NodeD) => {
    const [kind, id] = n.id.split(':');
    setSelNode({ kind: kind === 'o' ? 'org' : 'country', id });
  };
  const go = (ref: NodeRef) => {
    const sel: Selection =
      ref.kind === 'org' ? { kind: 'org', id: ref.id }
      : ref.kind === 'country' ? { kind: 'country', id: ref.id }
      : ref.kind === 'conflict' ? { kind: 'conflict', id: ref.id }
      : ref.kind === 'chokepoint' ? { kind: 'chokepoint', id: ref.id }
      : ref.kind === 'route' ? { kind: 'route', id: ref.id }
      : { kind: 'site', id: ref.id };
    if (ref.kind === 'org') setOrg(ref.id);
    select(sel);
    setModal(null);
  };
  const order = { observed: 0, assessed: 1, potential: 2 } as const;
  const edges = selNode ? edgesOf(selNode, year).slice().sort((a, b) => order[a.kind] - order[b.kind]) : [];
  const selName = selNode ? (selNode.kind === 'org' ? ORG[selNode.id]?.short ?? selNode.id : countryName(selNode.id, lang)) : '';

  return (
    <>
      <h2>{t('network')} · {year}</h2>
      <p className="note">{t('networkHint')}</p>
      <svg className="net" viewBox={vb} role="img" aria-label={t('network')}>
        {graph.links.map((l, i) => {
          const a = l.source as NodeD;
          const b = l.target as NodeD;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={l.color} strokeOpacity={0.28} strokeWidth={1} />;
        })}
        {graph.nodes.map((n) => (
          <g key={n.id} transform={`translate(${n.x},${n.y})`} className={`node ${n.type}`} onClick={() => pick(n)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && pick(n)}>
            <circle r={n.type === 'org' ? 17 : 4.5} fill={n.type === 'org' ? n.color : '#8DA2BC'} fillOpacity={n.type === 'org' ? 0.92 : 0.8} stroke="#070B14" strokeWidth={1} />
            {n.type === 'org' ? <text dy={4} textAnchor="middle">{n.label}</text> : <title>{n.label}</title>}
          </g>
        ))}
      </svg>
      <div className="chips">
        {ORGS.filter((o) => o.id !== 'un').map((o) => <span key={o.id} className="chip static" style={{ borderColor: o.color }}>{o.short}<small>{tl(o.name)}</small></span>)}
      </div>
      <section className="sec mt">
        <h3>{t('graph_edges')}{selNode ? `: ${selName} (${edges.length})` : ''}</h3>
        {!selNode && <p className="note">{t('graph_pick')}</p>}
        {selNode && (
          <>
            <p><button type="button" className="btn" onClick={() => go(selNode)}>{t('goto')}: {selName}</button></p>
            <ul className="links">{edges.map((e) => <EdgeRow key={e.id} e={e} me={selNode} onGo={go} />)}</ul>
          </>
        )}
      </section>
    </>
  );
}

export default function Modals() {
  const { t } = useT();
  const { modal, setModal } = useStore();
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, setModal]);
  if (!modal) return null;
  return (
    <div className="overlay" onClick={() => setModal(null)}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="mini modal-x" onClick={() => setModal(null)} aria-label={t('close')}>✕</button>
        <div className="modal-scroll">{modal === 'method' ? <MethodModal /> : modal === 'data' ? <DataPanel /> : modal === 'pricing' ? <Pricing /> : modal === 'advertise' ? <Advertise /> : <NetworkModal />}</div>
      </div>
    </div>
  );
}
