import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';
import { AmbientLight, Color, DirectionalLight, Group, Mesh, MeshLambertMaterial, MeshPhongMaterial, SphereGeometry, TextureLoader } from 'three';
import earthUrl from '../assets/earth-blue-marble.jpg';
import topoUrl from '../assets/earth-topology.png';
import skyUrl from '../assets/night-sky.png';
import waterUrl from '../assets/earth-water.jpg';
import cloudsUrl from '../assets/clouds-alpha.jpg';
import {
  ALL_ROUTES, ANCHOR, BODY_ANCHOR, CHOKEPOINT, CHOKEPOINTS, CONFLICT, CONFLICTS, DISPUTED, ENERGY_SITES, EVENTS, EVENT_COLOR, LINKS, ORG, PIPELINES,
  REL_COLOR, RELATIONS, ROUTE, ROUTES, SANCTIONS, SCENARIO, SITE, countryName, loadWorld, type CountryFeature,
} from '../data';
import { densify, greatCircle, haversineKm, unwrapLongitudes, type LatLng } from '../lib/geo';
import { STATUS_COLOR, displayStatus, eventsInYear, membersAt, yearOf } from '../lib/selectors';
import { traceLinks } from '../lib/trace';
import { buildHydro, setHydroOpacity } from '../lib/hydro';
import { buildFrontMesh, type FrontMesh } from '../lib/frontmesh';
import { REGION_FOR_CONFLICT, belligerentColors, changedUnits, contactLines, frontsOfRegion, lighten, placesOfRegion, regionsWithData, territoryById, territoryFeatures, unitFill, type TerritoryFeature } from '../lib/territory';
import { ACTOR, REGION } from '../data/territory';
import { visibleConflicts } from '../lib/visible';
import { SNAPSHOT_YEAR, useStore } from '../store';
import { FLOW, flowWeight, flowsAt } from '../lib/displacement';
import { frontlinePaths } from '../lib/frontline';
import { ATTACK, CATEGORY_COLOR, attacksUpTo } from '../lib/attacks';
import { EMPTY, binAt, binIndex, binResolution, binSummary, loadIncidents, pointsUpTo, type Incidents, type Point } from '../lib/incidents';
import { fmtDate, fmtNum, pick, tr } from '../i18n';
import type { ImpactLink, Iso, Route, Selection } from '../types';

interface Marker { key: string; kind: 'conflict' | 'chokepoint' | 'site' | 'disputed' | 'event' | 'front' | 'place' | 'attack'; lat: number; lng: number; color: string; label: string; cls: string; op: number; go: () => void }
interface Arc { id: string; s: LatLng; e: LatLng; color: string; dash: number; gap: number; time: number; label: string; w?: number; flow?: string }
/**
 * globe.gl measures a path's stroke in angular degrees, so a line that reads
 * well zoomed in all but disappears at globe distance, and one tuned for globe
 * distance becomes a smear up close. This converts a wanted width in CSS
 * pixels into the angular width that produces it at the current altitude, so a
 * front line carries the same visual weight wherever the camera is.
 *
 * Derived from the camera: a feature of arc length R·θ at distance R·(1+alt)
 * subtends θ/(1+alt) radians, and the viewport maps 2·tan(fov/2) radians onto
 * its height.
 */
const GLOBE_FOV_HALF = (25 * Math.PI) / 180;
function strokeForPx(px: number, altitude: number, viewportH: number): number {
  const radiansPerPx = (2 * Math.tan(GLOBE_FOV_HALF)) / Math.max(viewportH, 1);
  const theta = px * radiansPerPx * (1 + Math.max(altitude, 0.02));
  return (theta * 180) / Math.PI;
}

/** A path point as [lat, lng, altitude]. */
type PathPt = [number, number, number];

/**
 * Altitudes for the path layer. The control polygons are extruded to 0.015
 * above the surface, so anything meant to be read against them has to clear
 * that: a line drawn lower is not faint, it is inside the slab and invisible.
 */
const PATH_ALT = { route: 0.011, contact: 0.019, frontline: 0.024, terr: 0.019 } as const;

/** Lifts a flat path to a given altitude. */
function lift(pts: LatLng[], alt: number): PathPt[] {
  return pts.map(([lat, lng]) => [lat, lng, alt] as PathPt);
}

interface PathD { id: string; pts: PathPt[]; color: string; stroke: number; dash: number; gap: number; time: number; label: string }
interface Ring { lat: number; lng: number; color: string; max: number; speed: number; period: number }

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
const hasWebGL = () => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

const ROUTE_COLOR: Record<Route['kind'], string> = { sea: '#00D9FF', lng: '#7BE0C3', oil: '#FFD23F', rail: '#C9A2FF', pipeline: '#FF9B42' };
/** The unit a named front sits inside, so clicking it opens that territory. */
function frontUnit(frontId: string, year: number): string | null {
  const f = frontsOfRegion(Object.keys(REGION).find((r) => frontsOfRegion(r).some((x) => x.id === frontId)) ?? '').find((x) => x.id === frontId);
  if (!f) return null;
  let best: { id: string; d: number } | null = null;
  for (const t of territoryFeatures(year)) {
    if (t.properties.region !== f.region) continue;
    const [la, ln] = t.properties.centroid;
    const d = (la - f.at[0]) ** 2 + (ln - f.at[1]) ** 2;
    if (!best || d < best.d) best = { id: t.properties.id, d };
  }
  return best?.id ?? null;
}

const DENSE: Record<string, LatLng[]> = Object.fromEntries(ALL_ROUTES.map((r) => [r.id, densify(r.pts, r.kind === 'pipeline' || r.kind === 'rail' ? 400 : 220)]));

export default function GlobeView() {
  const s = useStore();
  const compareYear = useStore((x) => x.compareYear);
  const searchQuery = useStore((x) => x.searchQuery);
  const searchHits = useStore((x) => x.searchHits);
  const setIncidentState = useStore((x) => x.setIncidentState);
  const showIncidentBin = useStore((x) => x.showIncidentBin);
  const { lang, layers, layerOpacity, sel, year, view, orgId, compare, scenarioId, lowPower, statusOn, typeFilter, trace } = s;
  const select = s.select;
  const showDisputed = s.showDisputed;
  const globe = useRef<GlobeMethods | undefined>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const frontMesh = useRef<FrontMesh | null>(null);
  // The camera altitude, for line weights that hold their width on screen.
  const globeAlt = useStore((st) => st.globeView.altitude);
  const [world, setWorld] = useState<CountryFeature[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [hover, setHover] = useState<Iso | null>(null);
  const [ready, setReady] = useState(false);
  const interacted = useRef(false);
  const hud = useRef<HTMLDivElement>(null);
  const clouds = useRef<Mesh | null>(null);
  const hydro = useRef<Group | null>(null);
  const webgl = useMemo(hasWebGL, []);
  // Own surface material so relief and ocean glint can be tuned; the library still applies the day texture and bump map to it.
  const surface = useMemo(() => new MeshPhongMaterial({ bumpScale: 7, shininess: 18, specular: new Color('#2f4a66') }), []);

  useEffect(() => {
    let live = true;
    setError(false);
    loadWorld().then((w) => live && setWorld(w)).catch(() => live && setError(true));
    return () => { live = false; };
  }, [attempt]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const anchor = useCallback((code: string): LatLng | null => {
    if (ANCHOR[code]) return ANCHOR[code];
    if (BODY_ANCHOR[code]) return BODY_ANCHOR[code];
    return world?.find((f) => f.properties.iso === code)?.properties.centroid ?? null;
  }, [world]);

  // ── Scene setup ──────────────────────────────────────────────────────────
  const onReady = useCallback(() => {
    const g = globe.current;
    if (!g) return;
    const c = g.controls();
    c.minDistance = 118;
    c.maxDistance = 560;
    c.enableDamping = true;
    c.dampingFactor = 0.12;
    c.rotateSpeed = 0.6;
    c.zoomSpeed = 0.8;
    c.addEventListener('start', () => { interacted.current = true; c.autoRotate = false; });

    // Surface: relief + ocean specular so water catches the key light and land stays matte.
    new TextureLoader().load(waterUrl, (tex) => { surface.specularMap = tex; surface.needsUpdate = true; });

    // Lighting: soft fill plus a key light that rides with the camera (upper left),
    // giving the sphere depth from every angle. Decorative — not the real sun.
    const fill = new AmbientLight(0xaebbd0, 1.75);
    const key = new DirectionalLight(0xfff4e2, 2.5);
    // Rim light: a cool, weak light from behind and below the camera. It catches
    // the limb of the sphere and separates it from the sky, which is what makes
    // the globe sit in space rather than float as a flat disc. Kept dim on
    // purpose — a bright rim reads as a glow effect and makes the map harder to
    // read, which is the opposite of the point.
    const rim = new DirectionalLight(0x8fb6e8, 0.85);
    g.lights([fill, key, rim]);
    const cam = g.camera();
    const placeKey = () => {
      key.position.copy(cam.position).applyAxisAngle(cam.up, -0.8);
      key.position.y += cam.position.length() * 0.5;
      rim.position.copy(cam.position).applyAxisAngle(cam.up, 2.5);
      rim.position.y -= cam.position.length() * 0.35;
    };
    placeKey();
    c.addEventListener('change', placeKey);

    // Drifting cloud layer (decorative density map, not weather data).
    new TextureLoader().load(cloudsUrl, (tex) => {
      const mesh = new Mesh(
        new SphereGeometry(g.getGlobeRadius() * 1.004, 72, 72),
        new MeshLambertMaterial({ color: 0xffffff, alphaMap: tex, transparent: true, opacity: 0.42, depthWrite: false }),
      );
      mesh.visible = !useStore.getState().lowPower;
      clouds.current = mesh;
      g.scene().add(mesh);
    });

    // Rivers and lakes: bundled Natural Earth geometry, two draw calls, no tiles.
    hydro.current = buildHydro(g.getGlobeRadius());
    hydro.current.visible = useStore.getState().layers.hydro;
    g.scene().add(hydro.current);

    // The sourced front line, as its own screen-space stroke. It sits above
    // the extruded control polygons, which reach 0.015, so it reads against
    // them instead of being buried inside them.
    {
      const st = useStore.getState();
      frontMesh.current?.dispose();
      frontMesh.current = buildFrontMesh(
        frontlinePaths(st.frontline.set).map((f) => ({ id: f.id, coords: f.coords })),
        {
          globeRadius: g.getGlobeRadius(), altitude: 0.024,
          width: 2.6, casing: 6.4,
          color: '#FFFFFF', casingColor: '#060B14',
          opacity: st.layers.sourceline ? st.layerOpacity.sourceline : 0,
        },
      );
      frontMesh.current.setResolution(size.w, size.h);
      g.scene().add(frontMesh.current.group);
    }

    // Entrance: start far out, then settle onto the opening view.
    // Centred so the active fronts are all legible on arrival rather than
    // squashed against the limb: Ukraine sits in the upper third, with the
    // Middle East, the Sahel and the Horn still square to the camera.
    const rest = { lat: 36, lng: 33, altitude: size.w < 700 ? 2.9 : 2.15 };
    if (useStore.getState().lowPower) g.pointOfView(rest, 0);
    else {
      g.pointOfView({ lat: 8, lng: -4, altitude: 4.6 }, 0);
      window.setTimeout(() => { if (!interacted.current) g.pointOfView(rest, 2400); }, 80);
    }
    setReady(true);
  }, [size.w, surface]);

  // Slow cloud drift; paused in reduced-graphics mode.
  useEffect(() => {
    if (clouds.current) clouds.current.visible = !lowPower;
    if (hydro.current) {
      hydro.current.visible = layers.hydro;
      setHydroOpacity(hydro.current, layerOpacity.hydro);
    }
    frontMesh.current?.setOpacity(layers.sourceline ? layerOpacity.sourceline : 0);
    // Line2 converts its pixel width through the viewport size, so a resize
    // that is not passed on leaves the stroke the wrong weight.
    frontMesh.current?.setResolution(size.w, size.h);
    if (lowPower) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (clouds.current) clouds.current.rotation.y += (now - last) * 0.0000045;
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [lowPower, ready, layers.hydro, layerOpacity.hydro]);

  // Camera HUD + label density by zoom level (direct DOM writes: no React re-render per frame).
  // ── Incident layer (UCDP GED, fetched on demand) ─────────────────────────
  const [inc, setInc] = useState<Incidents>(EMPTY);
  const [incBusy, setIncBusy] = useState(false);
  const [binRes, setBinRes] = useState(2);
  const [zoomLevel, setZoomLevel] = useState(1);
  useEffect(() => {
    if (!layers.incidents || inc.n > 0 || incBusy) return;
    setIncBusy(true);
    loadIncidents(import.meta.env.BASE_URL).then((d) => { setInc(d); setIncBusy(false); });
  }, [layers.incidents, inc.n, incBusy]);
  useEffect(() => { setIncidentState({ status: inc.status, n: inc.n, busy: incBusy, reason: inc.reason }); }, [inc, incBusy, setIncidentState]);

  const incPoints: Point[] = useMemo(
    () => (layers.incidents && inc.n ? pointsUpTo(inc, year) : []),
    [layers.incidents, inc, year],
  );

  const onZoom = useCallback((pov: { lat: number; lng: number; altitude: number }) => {
    setBinRes((r) => { const next = binResolution(pov.altitude); return next === r ? r : next; });
    // 1 = whole Earth, 2 = regional, 3 = local. Drives which markers appear.
    setZoomLevel((z) => { const next = pov.altitude > 1.6 ? 1 : pov.altitude > 0.65 ? 2 : 3; return next === z ? z : next; });
    // Report the camera so the detailed map can open on the same ground.
    useStore.getState().setGlobeView({ lat: pov.lat, lng: pov.lng, altitude: pov.altitude });
    const el = hud.current;
    if (el) {
      const ns = pov.lat >= 0 ? 'N' : 'S';
      const ew = pov.lng >= 0 ? 'E' : 'W';
      const km = Math.round((pov.altitude * 6371) / 10) * 10;
      el.textContent = `${Math.abs(pov.lat).toFixed(1).padStart(4, '0')}°${ns}  ${Math.abs(pov.lng).toFixed(1).padStart(5, '0')}°${ew}  ·  ${km.toLocaleString('nb-NO')} km`;
    }
    wrap.current?.toggleAttribute('data-near', pov.altitude < 0.7);
  }, []);

  // Keep the globe centred in the space between the floating side panels.
  const offset: [number, number] = size.w > 1180 ? [-69, 0] : size.w > 880 ? [-44, 0] : [0, 0];

  useEffect(() => {
    const g = globe.current;
    if (!g || !ready) return;
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 2));
    const c = g.controls();
    c.autoRotate = !lowPower && !interacted.current && sel === null;
    c.autoRotateSpeed = 0.28;
  }, [ready, lowPower, sel]);

  // ── Camera follows the selection ─────────────────────────────────────────
  useEffect(() => {
    const g = globe.current;
    if (!g || !ready) return;
    let at: LatLng | null = null;
    let altitude = 1.5;
    if (sel?.kind === 'conflict') { at = CONFLICT[sel.id]?.at ?? null; altitude = 1.25; }
    else if (sel?.kind === 'chokepoint') { at = CHOKEPOINT[sel.id]?.at ?? null; altitude = 0.9; }
    else if (sel?.kind === 'site') { at = SITE[sel.id]?.at ?? null; altitude = 0.75; }
    else if (sel?.kind === 'country') { at = anchor(sel.id); altitude = 1.6; }
    else if (sel?.kind === 'route') { const p = DENSE[sel.id]; at = p ? p[Math.floor(p.length / 2)] : null; altitude = 2.2; }
    else if (sel?.kind === 'org') { const m = membersAt(ORG[sel.id], year)[0]; at = m ? anchor(m) : null; altitude = 2.4; }
    else if (sel?.kind === 'territory') {
      const t = territoryById(sel.id, year);
      if (t) { at = t.properties.centroid; altitude = Math.max(0.45, (REGION[t.properties.region]?.altitude ?? 0.9) * 0.62); }
    } else if (sel?.kind === 'attack') {
      const a = ATTACK[sel.id];
      // Close in for an exact location, stay higher where the source only gave
      // a city or a region: the camera should not imply precision the data lacks.
      if (a) { at = a.at; altitude = a.precision === 'exact' ? 0.35 : a.precision === 'district' ? 0.5 : a.precision === 'city' ? 0.7 : 1.4; }
    } else if (sel?.kind === 'flow') {
      // Frame the corridor: the midpoint of the great circle, pulled back far
      // enough that both ends stay on screen.
      const f = FLOW[sel.id];
      const a = f ? anchor(f.from) : null, b = f ? anchor(f.to) : null;
      if (a && b) {
        const arc = greatCircle(a, b, 3);
        at = arc[1] ?? a;
        altitude = Math.min(3.2, Math.max(1.3, haversineKm(a, b) / 4200));
      }
    } else if (sel?.kind === 'actor') {
      const a = ACTOR[sel.id];
      const r = a ? REGION[a.region] : null;
      if (r) { at = r.at; altitude = r.altitude; }
    }
    if (at) g.pointOfView({ lat: at[0], lng: at[1], altitude }, 1100);
    else if (!sel) {
      // Back to the overview: ease out to the resting distance, keeping the current bearing.
      const pov = g.pointOfView();
      if (pov.altitude < 1.7) g.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: 2.3 }, 1300);
    }
  }, [sel, ready, anchor, year]);

  useEffect(() => {
    const g = globe.current;
    if (!g || !ready) return;
    if (s.disputedId) { const d = DISPUTED.find((x) => x.id === s.disputedId); if (d) g.pointOfView({ lat: d.at[0], lng: d.at[1], altitude: 0.9 }, 900); }
  }, [s.disputedId, ready]);

  // Coming back from the detailed map: pick up where that view was looking.
  const mapMode = useStore((x) => x.mapMode);
  useEffect(() => {
    const g = globe.current;
    if (!g || !ready || mapMode !== 'globe') return;
    const v = useStore.getState().globeView;
    const now = g.pointOfView();
    if (Math.abs(now.lat - v.lat) < 0.01 && Math.abs(now.lng - v.lng) < 0.01 && Math.abs(now.altitude - v.altitude) < 0.01) return;
    g.pointOfView({ lat: v.lat, lng: v.lng, altitude: v.altitude }, 700);
  }, [mapMode, ready]);

  useEffect(() => {
    const g = globe.current;
    if (!g || !ready || !s.incidentBin) return;
    const [lat, lng] = s.incidentBin.at;
    // Stay at the current height: the bin's size is the zoom level's own, so
    // flying closer would silently change what the user is looking at.
    g.pointOfView({ lat, lng, altitude: Math.min(g.pointOfView().altitude, 1.2) }, 800);
  }, [s.incidentBin, ready]);

  useEffect(() => {
    const g = globe.current;
    if (!g || !ready || view !== 'scenario') return;
    const cp = SCENARIO[scenarioId]?.chokepoint;
    const at = cp ? CHOKEPOINT[cp].at : ([45, 60] as LatLng);
    g.pointOfView({ lat: at[0], lng: at[1], altitude: 2.0 }, 900);
  }, [scenarioId, view, ready]);

  // ── Derived sets for country colouring ───────────────────────────────────
  const activeLinks: ImpactLink[] = useMemo(() => {
    if (!layers.links) return [];
    if (sel?.kind === 'conflict') return LINKS.filter((l) => l.conflict === sel.id);
    if (sel?.kind === 'chokepoint') { const at = CHOKEPOINT[sel.id].at; const same = (p: LatLng) => p[0] === at[0] && p[1] === at[1]; return LINKS.filter((l) => same(l.from.at) || same(l.to.at)); }
    if (sel?.kind === 'country') return LINKS.filter((l) => l.from.iso === sel.id || l.to.iso === sel.id);
    if (sel) return [];
    if (view === 'human') return LINKS.filter((l) => l.type === 'displacement');
    if (view === 'trade') return LINKS.filter((l) => l.type === 'shipping' || l.type === 'trade');
    if (view === 'energy') return LINKS.filter((l) => l.type === 'energy' || l.type === 'supply');
    return [];
  }, [layers.links, sel, view]);

  const tint = useMemo(() => {
    const m = new Map<Iso, string>();
    if (layers.alliances && orgId && ORG[orgId]) for (const c of membersAt(ORG[orgId], year)) m.set(c, hexA(ORG[orgId].color, 0.4 * layerOpacity.alliances));
    if (sel?.kind === 'org' && ORG[sel.id]) for (const c of membersAt(ORG[sel.id], year)) m.set(c, hexA(ORG[sel.id].color, 0.45));
    const cp = sel?.kind === 'chokepoint' ? CHOKEPOINT[sel.id] : view === 'scenario' && SCENARIO[scenarioId]?.chokepoint ? CHOKEPOINT[SCENARIO[scenarioId].chokepoint as string] : null;
    if (cp) for (const e of cp.exposed) m.set(e.iso, 'rgba(255,155,66,0.42)');
    for (const l of activeLinks) if (l.to.iso && l.kind !== 'potential') m.set(l.to.iso, hexA(REL_COLOR[l.type], 0.3));
    if (sel?.kind === 'conflict') {
      // Where the sides are on record, show them: painting the invader and the
      // invaded the same colour tells the reader nothing about the war. The
      // countries without a recorded side keep the neutral "involved" tint.
      const sides = belligerentColors(sel.id, 0.34);
      for (const c of CONFLICT[sel.id].iso) m.set(c, sides.get(c) ?? 'rgba(255,69,69,0.34)');
      for (const [iso, color] of sides) m.set(iso, color);
    }
    if (sel?.kind === 'country') {
      for (const r of RELATIONS) if ((r.a === sel.id || r.b === sel.id) && yearOf(r.since) <= year) m.set(r.a === sel.id ? r.b : r.a, hexA(REL_COLOR[r.type], 0.34));
      m.set(sel.id, 'rgba(0,217,255,0.42)');
    }
    if (compare) m.set(compare, 'rgba(255,155,66,0.5)');
    return m;
  }, [layers.alliances, layerOpacity.alliances, orgId, year, sel, view, scenarioId, activeLinks, compare]);

  // Territory polygons sit just above the country layer; the markers float above both.
  const territories = useMemo(() => (layers.territories ? territoryFeatures(year) : []), [layers.territories, year]);
  const polygons = useMemo(() => [...(world ?? []), ...territories], [world, territories]);
  const isTerr = (f: object): f is TerritoryFeature => (f as TerritoryFeature).properties.kind === 'territory';

  const capColor = useCallback((f: object) => {
    if (isTerr(f)) {
      const { record, id } = f.properties;
      const on = sel?.kind === 'territory' && sel.id === id;
      const actorOn = sel?.kind === 'actor' && (sel.id === record.actor || sel.id === record.with);
      // Lighter on the globe than on the regional map: at this distance the
      // fill is context for where a war is, and the sourced front line is the
      // thing being shown. A selected unit still lifts clear of the rest.
      return unitFill(record, 0.72 * layerOpacity.territories * (on || actorOn ? 2.1 : 1));
    }
    const code = (f as CountryFeature).properties.iso;
    return tint.get(code) ?? (hover === code ? 'rgba(0,217,255,0.16)' : 'rgba(120,170,230,0.03)');
  }, [tint, hover, sel, layerOpacity.territories]);

  const polyAlt = useCallback((f: object) => {
    if (isTerr(f)) return sel?.kind === 'territory' && sel.id === f.properties.id ? 0.019 : 0.015;
    return tint.has((f as CountryFeature).properties.iso) ? 0.012 : 0.006;
  }, [tint, sel]);

  const stroke = useCallback((f: object) => {
    if (isTerr(f)) {
      // A brightened version of the actor's own colour rather than the colour
      // itself: a red edge on a red fill is no edge at all, and two neighbours
      // held by the same actor need a visible seam between them.
      const a = ACTOR[f.properties.record.actor];
      return lighten(a?.color ?? '#9FB3C8', 0.55, 0.88 * layerOpacity.territories);
    }
    return layers.borders ? `rgba(175,215,255,${0.42 * layerOpacity.borders})` : 'rgba(0,0,0,0)';
  }, [layers.borders, layerOpacity.borders, layerOpacity.territories]);

  // The raised edge of each zone. Dark rather than coloured, so the slab reads
  // as a thickness and not as a second, brighter band of the actor's colour.
  const sideColor = useCallback((f: object) => (
    isTerr(f) ? `rgba(4,8,16,${0.5 * layerOpacity.territories})` : 'rgba(0,0,0,0)'
  ), [layerOpacity.territories]);

  const polyLabel = useCallback((f: object) => {
    if (isTerr(f)) {
      const { record, unitName } = f.properties;
      const a = ACTOR[record.actor];
      const w = record.with ? ` / ${pick(ACTOR[record.with].name, lang)}` : '';
      // The share and the assessment date belong on the hover, not two clicks
      // away: an assessment without its date is the one thing this dataset
      // never shows anywhere else.
      const share = record.share ? `${esc(pick(record.share, lang))} \u00b7 ` : '';
      return `<div class="tip"><b>${esc(unitName)}</b><br>${esc(pick(a.name, lang))}${esc(w)}`
        + `<br><small>${share}${esc(tr('lastVerified', lang))} ${esc(fmtDate(record.d, lang))}</small></div>`;
    }
    return `<div class="tip">${esc(countryName((f as CountryFeature).properties.iso, lang))}</div>`;
  }, [lang]);

  // ── Markers (DOM buttons: crisp, keyboard-focusable, easy to hit) ────────
  const markers: Marker[] = useMemo(() => {
    const out: Marker[] = [];
    for (const c of visibleConflicts(CONFLICTS, { year, snapshotYear: SNAPSHOT_YEAR, layers, statusOn, typeFilter })) {
      const ds = displayStatus(c, year, SNAPSHOT_YEAR);
      const op = ds === 'flashpoint' ? layerOpacity.flashpoints : layerOpacity.conflicts;
      // A conflict whose front line is actually drawn gets a ring rather than
      // a disc. Its marker sits by definition on the ground the line crosses,
      // and a solid dot buries the very thing it is pointing at.
      const drawn = layers.sourceline && REGION_FOR_CONFLICT[c.id] === 'ukraine';
      out.push({ key: `conflict:${c.id}`, kind: 'conflict', lat: c.at[0], lng: c.at[1], color: STATUS_COLOR[ds], label: pick(c.name, lang), cls: `st-${ds}${drawn ? ' mk-ring' : ''}`, op, go: () => select({ kind: 'conflict', id: c.id }) });
    }
    if (layers.chokepoints) for (const c of CHOKEPOINTS) out.push({ key: `chokepoint:${c.id}`, kind: 'chokepoint', lat: c.at[0], lng: c.at[1], color: '#00D9FF', label: pick(c.name, lang), cls: '', op: layerOpacity.chokepoints, go: () => select({ kind: 'chokepoint', id: c.id }) });
    if (layers.energy) for (const e of ENERGY_SITES) out.push({ key: `site:${e.id}`, kind: 'site', lat: e.at[0], lng: e.at[1], color: '#FF9B42', label: e.name, cls: `sk-${e.kind}`, op: layerOpacity.energy, go: () => select({ kind: 'site', id: e.id }) });
    // Front and place markers are city-scale detail. At the global view they
    // pile into an unreadable knot over exactly the countries the reader came
    // to look at, and they bury the sourced front line underneath them, since
    // markers are HTML and always paint above the globe. They arrive at the
    // second zoom level, once there is room.
    if (layers.fronts && zoomLevel >= 2) {
      for (const r of regionsWithData(year)) {
        for (const f of frontsOfRegion(r).filter((x) => yearOf(x.d) <= year)) {
          out.push({
            key: `front:${f.id}`, kind: 'front', lat: f.at[0], lng: f.at[1], color: '#FFFFFF',
            label: `${pick(f.name, lang)} \u2014 ${tr('terr_fronts', lang)}`, cls: '', op: layerOpacity.fronts,
            go: () => select({ kind: 'territory', id: frontUnit(f.id, year) ?? '' }),
          });
        }
        for (const p of placesOfRegion(r).filter((x) => yearOf(x.d) <= year)) {
          out.push({
            key: `place:${p.id}`, kind: 'place', lat: p.at[0], lng: p.at[1],
            color: p.actor ? ACTOR[p.actor]?.color ?? '#EAF2FF' : '#EAF2FF',
            label: p.name, cls: '', op: layerOpacity.fronts,
            go: () => select({ kind: 'place', id: p.id }),
          });
        }
      }
    }
    if (layers.borders) for (const d of DISPUTED) out.push({ key: `disputed:${d.id}`, kind: 'disputed', lat: d.at[0], lng: d.at[1], color: '#B8C7DA', label: `${tr('disputed', lang)}: ${pick(d.name, lang)}`, cls: '', op: layerOpacity.borders, go: () => showDisputed(d.id) });
    if (layers.events) {
      eventsInYear(EVENTS, year).forEach((e, i) => {
        const at = e.at ?? (e.conflict ? CONFLICT[e.conflict]?.at : undefined);
        if (!at) return;
        // Same reasoning: timeline events cluster on the conflicts they belong
        // to, so at the global view they only hide what they point at.
        if (zoomLevel < 2) return;
        out.push({
          key: `event:${e.d}:${i}`, kind: 'event', lat: at[0], lng: at[1], color: EVENT_COLOR[e.type],
          label: `${e.d}: ${pick(e.t, lang)}`, cls: '', op: layerOpacity.events,
          go: () => { if (e.conflict) select({ kind: 'conflict', id: e.conflict }); },
        });
      });
    }
    // Documented incidents. At the global view these would crowd the Earth, so
    // only the largest-category markers show until the camera comes down; the
    // rest appear with zoom, which is what the three-level design asks for.
    if (layers.attacks) {
      for (const a of attacksUpTo(year)) {
        // Incidents are the third level of detail. At the global view even
        // the large ones sit directly on the front line they belong to and
        // hide it, so none of them show until the camera comes down.
        if (zoomLevel < 2) continue;
        out.push({
          key: `attack:${a.id}`, kind: 'attack', lat: a.at[0], lng: a.at[1], color: CATEGORY_COLOR[a.category],
          label: `${fmtDate(a.d, lang)} \u00b7 ${pick(a.title, lang)}`,
          cls: `at-${a.category}${a.precision === 'exact' ? '' : ' approx'}`,
          op: layerOpacity.attacks,
          go: () => select({ kind: 'attack', id: a.id }),
        });
      }
    }
    return out;
  }, [year, layers, layerOpacity, statusOn, typeFilter, lang, select, showDisputed, zoomLevel]);


  const makeEl = useCallback((d: object) => {
    const m = d as Marker;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `mk mk-${m.kind} ${m.cls}`;
    b.dataset.key = m.key;
    b.style.setProperty('--c', m.color);
    b.dataset.op = String(m.op);
    b.style.opacity = String(m.op);
    b.style.pointerEvents = 'auto';
    b.title = m.label;
    b.setAttribute('aria-label', m.label);
    b.innerHTML = `<i></i><span>${esc(m.label)}</span>`;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); m.go(); });
    return b;
  }, []);
  const vis = useCallback((el: HTMLElement, on: boolean) => { el.style.opacity = on ? (el.dataset.op ?? '1') : '0'; el.style.pointerEvents = on ? 'auto' : 'none'; }, []);

  const selKey = s.disputedId ? `disputed:${s.disputedId}` : sel && sel.kind !== 'country' && sel.kind !== 'route' && sel.kind !== 'org' ? `${sel.kind}:${sel.id}` : '';
  useEffect(() => {
    const root = wrap.current;
    if (!root) return;
    // One pass sets both states: selected, and dimmed-because-it-does-not-match
    // the search. Markers created in the same tick appear slightly later, so the
    // pass runs again shortly afterwards.
    const searching = searchQuery.length > 0;
    const apply = () => root.querySelectorAll<HTMLElement>('.mk').forEach((el) => {
      const key = el.dataset.key ?? '';
      el.classList.toggle('on', key === selKey);
      el.classList.toggle('off', searching && !searchHits.has(key));
    });
    apply();
    const id = window.setTimeout(apply, 120);
    return () => window.clearTimeout(id);
  }, [selKey, markers, searchQuery, searchHits]);

  // ── Arcs: only the relationships of the current selection, never everything at once ──
  const arcs: Arc[] = useMemo(() => {
    const out: Arc[] = [];
    for (const l of activeLinks) {
      const style = l.kind === 'observed' ? { dash: 0.55, gap: 0.2, time: lowPower ? 0 : 2600 } : l.kind === 'assessed' ? { dash: 0.14, gap: 0.1, time: lowPower ? 0 : 5200 } : { dash: 0.03, gap: 0.05, time: 0 };
      out.push({ id: l.id, s: l.from.at, e: l.to.at, color: hexA(REL_COLOR[l.type], (l.kind === 'potential' ? 0.55 : 0.95) * layerOpacity.links), ...style, label: `${pick(l.from.label, lang)} → ${pick(l.to.label, lang)}: ${tr(`r_${l.type}`, lang)} (${tr(`o_${l.kind}`, lang)})` });
    }
    if (sel?.kind === 'country') {
      const here = anchor(sel.id);
      if (here) {
        for (const r of RELATIONS) {
          if ((r.a !== sel.id && r.b !== sel.id) || yearOf(r.since) > year) continue;
          const other = anchor(r.a === sel.id ? r.b : r.a);
          if (other) out.push({ id: r.id, s: here, e: other, color: hexA(REL_COLOR[r.type], layerOpacity.links), dash: r.type === 'defense' ? 1 : 0.2, gap: r.type === 'defense' ? 0 : 0.12, time: 0, label: `${pick(r.name, lang)} (${tr(`r_${r.type}`, lang)})` });
        }
        for (const g of SANCTIONS) {
          if (yearOf(g.since) > year) continue;
          if (g.target === sel.id) for (const by of g.by) { const p = anchor(by); if (p) out.push({ id: `${g.id}-${by}`, s: p, e: here, color: hexA(REL_COLOR.sanction, layerOpacity.links), dash: 0.08, gap: 0.06, time: lowPower ? 0 : 6000, label: `${pick(g.name, lang)} · ${by}` }); }
          else if (g.by.includes(sel.id)) { const p = anchor(g.target); if (p) out.push({ id: `${g.id}-out`, s: here, e: p, color: hexA(REL_COLOR.sanction, layerOpacity.links), dash: 0.08, gap: 0.06, time: lowPower ? 0 : 6000, label: pick(g.name, lang) }); }
        }
        if (compare) { const o = anchor(compare); if (o) out.push({ id: 'cmp', s: here, e: o, color: '#EAF2FF', dash: 1, gap: 0, time: 0, label: `${countryName(sel.id, lang)} – ${countryName(compare, lang)}` }); }
      }
    }
    // Independent layers: every sanctions regime / displacement link, regardless of selection.
    if (layers.sanctions) {
      for (const g of SANCTIONS) {
        if (yearOf(g.since) > year) continue;
        const tgt = anchor(g.target);
        if (!tgt) continue;
        for (const by of g.by) {
          const p = anchor(by);
          if (p) out.push({ id: `L-${g.id}-${by}`, s: p, e: tgt, color: hexA(REL_COLOR.sanction, 0.8 * layerOpacity.sanctions), dash: 0.08, gap: 0.07, time: lowPower ? 0 : 7000, label: `${pick(g.name, lang)} · ${by}` });
        }
      }
    }
    if (layers.displacement) {
      for (const l of LINKS) {
        if (l.type !== 'displacement') continue;
        out.push({ id: `L-${l.id}`, s: l.from.at, e: l.to.at, color: hexA(REL_COLOR.displacement, 0.9 * layerOpacity.displacement), dash: 0.5, gap: 0.25, time: lowPower ? 0 : 3200, label: `${pick(l.from.label, lang)} → ${pick(l.to.label, lang)}: ${tr('r_displacement', lang)}` });
      }
      // Sourced refugee corridors: origin → country of asylum. Weight ranks them
      // against each other; the figure itself is only ever read from the panel.
      // A selected corridor stays drawn even when the timeline sits before its
      // figure: the panel states the figure's own date, so the line is not a
      // claim about the year on the slider.
      const shown = flowsAt(year);
      if (sel?.kind === 'flow' && FLOW[sel.id] && !shown.some((f) => f.id === sel.id)) shown.push(FLOW[sel.id]);
      for (const f of shown) {
        const a = anchor(f.from), b = anchor(f.to);
        if (!a || !b) continue;
        const isSel = sel?.kind === 'flow' && sel.id === f.id;
        out.push({
          id: `L-${f.id}`, flow: f.id, s: a, e: b,
          color: isSel ? '#F3E8FF' : hexA(REL_COLOR.displacement, 0.88 * layerOpacity.displacement),
          dash: 0.42, gap: 0.3, time: lowPower ? 0 : 4200,
          w: flowWeight(f.people) * (isSel ? 1.5 : 1),
          label: `${countryName(f.from, lang)} → ${countryName(f.to, lang)}: ${fmtNum(f.people, lang)} · ${pick(f.basis, lang)}`,
        });
      }
    }
    const seen = new Map<string, Arc>();
    for (const a of out) if (!seen.has(a.id.replace(/^L-/, ''))) seen.set(a.id.replace(/^L-/, ''), a);
    return [...seen.values()];
  }, [activeLinks, sel, compare, year, lang, lowPower, anchor, layers.sanctions, layers.displacement, layerOpacity.links, layerOpacity.sanctions, layerOpacity.displacement]);

  // ── Paths: sea lanes, land corridors, pipelines ──────────────────────────
  // Quantised so a continuous zoom does not rebuild every path on every frame.
  const altStep = Math.round(globeAlt * 6) / 6;

  const paths: PathD[] = useMemo(() => {
    const out: PathD[] = [];
    // Line weights that stay the same on screen at any altitude. The altitude
    // is quantised by the caller, so this rebuilds a handful of times across a
    // zoom rather than on every frame.
    const contactW = strokeForPx(2.6, altStep, size.h);
    const sc = view === 'scenario' ? SCENARIO[scenarioId] : null;
    const base = new Set(sc?.detours.map((d) => d.base));
    const alt = new Set(sc?.detours.map((d) => d.alt));
    const selCp = sel?.kind === 'chokepoint' ? sel.id : null;
    const add = (r: Route) => {
      const rop = r.kind === 'pipeline' ? layerOpacity.energy : layerOpacity.routes;
      const isSel = sel?.kind === 'route' && sel.id === r.id;
      const through = selCp !== null && r.via.includes(selCp);
      let color = hexA(ROUTE_COLOR[r.kind], 0.8 * rop);
      let strokeW = r.kind === 'pipeline' ? 0.22 : r.kind === 'rail' ? 0.2 : 0.26;
      let dash = r.kind === 'pipeline' ? 1 : r.kind === 'rail' ? 0.012 : 0.035;
      let gap = r.kind === 'pipeline' ? 0 : r.kind === 'rail' ? 0.012 : 0.02;
      let time = r.kind === 'pipeline' || r.kind === 'rail' || lowPower ? 0 : 90000;
      if (sc) {
        if (base.has(r.id)) { color = 'rgba(255,69,69,0.95)'; strokeW = 0.4; dash = 0.012; gap = 0.012; time = 0; }
        else if (alt.has(r.id)) { color = 'rgba(0,217,255,1)'; strokeW = 0.5; }
        else color = hexA(ROUTE_COLOR[r.kind], 0.18);
      } else if (isSel || through) { color = isSel ? '#FFFFFF' : hexA(ROUTE_COLOR[r.kind], rop); strokeW = 0.5; }
      else if (selCp !== null) color = hexA(ROUTE_COLOR[r.kind], 0.22 * rop);
      out.push({ id: r.id, pts: lift(DENSE[r.id], PATH_ALT.route), color, stroke: strokeW, dash, gap, time, label: `${pick(r.name, lang)} · ${tr(`rk_${r.kind}`, lang)}${r.kind === 'pipeline' ? '' : ` · ${tr('illustrative', lang)}`}` });
    };
    if (layers.routes) for (const r of ROUTES) if (view !== 'energy' || r.kind === 'oil' || r.kind === 'lng') add(r);
    if (layers.energy) for (const p of PIPELINES) add(p);
    if (sel?.kind === 'route' && !out.some((p) => p.id === sel.id) && ROUTE[sel.id]) add(ROUTE[sel.id]);
    // The derived line of contact: the stretches of administrative border where
    // the units on either side are held by different actors, in the selected
    // year. It is read out of the topology rather than drawn, and it is only as
    // current as the older of the two assessments it sits between — which is
    // the date the label and the panel both show.
    if (layers.territories && layers.fronts) {
      for (const c of contactLines(year)) {
        const sel2 = sel?.kind === 'territory' || sel?.kind === 'actor';
        const hot = sel?.kind === 'actor' && (sel.id === c.a || sel.id === c.b);
        out.push({
          id: c.id, pts: lift(unwrapLongitudes(c.coords), PATH_ALT.contact),
          color: hot ? '#FFFFFF' : `rgba(255,214,120,${(sel2 && !hot ? 0.45 : 0.92) * layerOpacity.fronts})`,
          stroke: hot ? contactW * 1.35 : contactW, dash: 0, gap: 0, time: 0,
          label: `${esc(tr('ct_line', lang))}: ${esc(pick(ACTOR[c.a].name, lang))} \u2014 ${esc(pick(ACTOR[c.b].name, lang))} \u00b7 ${esc(fmtDate(c.d, lang))}`,
        });
      }
    }
    // The sourced front line. This one is not derived from anything of ours: it
    // is OCHA's republication of the ISW/CTP assessment, drawn at the source's
    // own vertices. It is deliberately styled apart from the derived contact
    // line above — a casing under a thin bright line, no glow — because the two
    // say different things and must not be mistaken for each other.
    // When two assessments are being compared, ring the units that differ so the
    // change is visible on the globe and not only in the list.
    if (layers.territories && compareYear !== null) {
      const regions = new Set(territoryFeatures(year).map((t) => t.properties.region));
      const changed = new Set<string>();
      for (const r of regions) for (const id of changedUnits(r, compareYear, year)) changed.add(id);
      for (const t of territoryFeatures(year)) {
        if (!changed.has(t.properties.id)) continue;
        (t.geometry.coordinates as number[][][][]).forEach((poly, i) => {
          const pts = poly[0].map(([lng, lat]) => [lat, lng] as LatLng);
          if (pts.length < 4) return;
          out.push({
            id: `chg:${t.properties.id}:${i}`, pts: lift(unwrapLongitudes(pts), PATH_ALT.terr),
            color: '#C9A2FF', stroke: 0.55, dash: 0.05, gap: 0.025, time: lowPower ? 0 : 5000,
            label: `${esc(t.properties.unitName)} \u00b7 ${esc(tr('cmp_changes', lang))} ${compareYear} \u2192 ${year}`,
          });
        });
      }
    }
    // Dashed edge on every contested or partially held unit: the approximate line
    // between actors, drawn on real administrative geography.
    if (layers.territories && layers.fronts) {
      for (const t of territoryFeatures(year)) {
        const { record, id } = t.properties;
        if (record.status === 'control') continue;
        const rings = (t.geometry.coordinates as number[][][][]);
        rings.forEach((poly, i) => {
          const pts = poly[0].map(([lng, lat]) => [lat, lng] as LatLng);
          if (pts.length < 4) return;
          out.push({
            id: `terr:${id}:${i}`, pts: lift(unwrapLongitudes(pts), PATH_ALT.terr), color: `rgba(255,255,255,${0.75 * layerOpacity.fronts})`,
            stroke: 0.3, dash: 0.03, gap: 0.03, time: 0,
            label: `${esc(t.properties.unitName)} \u2014 ${tr('terr_with', lang)}`,
          });
        });
      }
    }
    return out;
  }, [layers.routes, layers.energy, layers.territories, layers.fronts, layerOpacity.routes, layerOpacity.energy, layerOpacity.fronts, view, scenarioId, sel, lang, lowPower, year, compareYear]);

  // ── Cinematic staged reveal of connection arcs on selection ──────────────
  const [reveal, setReveal] = useState(1e9);
  const revealKey = sel ? `${sel.kind}:${sel.id}` : '';
  useEffect(() => {
    if (!revealKey || lowPower) { setReveal(1e9); return; }
    setReveal(0);
    const id = window.setInterval(() => setReveal((r) => (r > 80 ? (window.clearInterval(id), r) : r + 2)), 140);
    return () => window.clearInterval(id);
  }, [revealKey, lowPower]);

  // ── Trace mode: show only the followed chain, hop by hop ─────────────────
  const traceArcs: Arc[] = useMemo(
    () =>
      traceLinks(trace).map((l, i, all) => ({
        id: `t:${l.id}`,
        s: l.from.at,
        e: l.to.at,
        color: i === all.length - 1 ? '#FFFFFF' : 'rgba(170,220,255,0.85)',
        dash: 0.42,
        gap: 0.14,
        time: lowPower ? 0 : 1500,
        label: `${tr('trace_step', lang)} ${i + 1}: ${pick(l.from.label, lang)} → ${pick(l.to.label, lang)} (${tr(`r_${l.type}`, lang)})`,
      })),
    [trace, lang, lowPower],
  );
  const shownArcs = trace.length ? traceArcs : reveal >= arcs.length ? arcs : arcs.slice(0, reveal);

  useEffect(() => {
    const g = globe.current;
    if (!g || !ready || !trace.length) return;
    const last = traceLinks(trace).at(-1);
    if (!last) return;
    const [mid] = greatCircle(last.from.at, last.to.at, 2);
    const altitude = Math.min(2.2, Math.max(0.55, 0.45 + haversineKm(last.from.at, last.to.at) / 5200));
    g.pointOfView({ lat: mid[0], lng: mid[1], altitude }, 1100);
  }, [trace, ready]);

  // ── Pulse rings ──────────────────────────────────────────────────────────
  const rings: Ring[] = useMemo(() => {
    const out: Ring[] = [];
    if (sel?.kind === 'conflict') { const c = CONFLICT[sel.id]; out.push({ lat: c.at[0], lng: c.at[1], color: STATUS_COLOR[displayStatus(c, year, SNAPSHOT_YEAR)], max: 5, speed: 2.2, period: 900 }); }
    if (sel?.kind === 'chokepoint') { const c = CHOKEPOINT[sel.id]; out.push({ lat: c.at[0], lng: c.at[1], color: '#00D9FF', max: 4, speed: 2, period: 900 }); }
    if (view === 'scenario') { const cp = SCENARIO[scenarioId]?.chokepoint; if (cp) out.push({ lat: CHOKEPOINT[cp].at[0], lng: CHOKEPOINT[cp].at[1], color: '#FF4545', max: 6, speed: 2.4, period: 800 }); }
    const head = traceLinks(trace).at(-1);
    if (head) out.push({ lat: head.to.at[0], lng: head.to.at[1], color: '#FFFFFF', max: 4, speed: 2.2, period: 900 });
    if (!lowPower && layers.conflicts && year === SNAPSHOT_YEAR)
      for (const c of CONFLICTS) if (c.status === 'active' && c.tier === 4 && statusOn.tier4 && (typeFilter === 'all' || typeFilter === c.type) && !(sel?.kind === 'conflict' && sel.id === c.id)) out.push({ lat: c.at[0], lng: c.at[1], color: STATUS_COLOR.tier4, max: 3, speed: 1.1, period: 2200 });
    return out;
  }, [sel, view, scenarioId, lowPower, layers.conflicts, year, statusOn.tier4, typeFilter, trace]);
  const ringColor = useCallback((d: object) => { const c = (d as Ring).color; return (t: number) => hexA(c === '#B3122E' ? '#FF3355' : c, Math.max(0, 0.9 * (1 - t))); }, []);

  // ── Incident bins ────────────────────────────────────────────────────────
  // Colour follows the deaths the source attributes to the bin, on a log scale:
  // a handful of bins carry thousands of deaths and would otherwise flatten
  // every other bin to the same colour.
  const binColor = useCallback((pts: Point[]) => {
    const { deaths } = binSummary(inc, pts);
    const t = Math.min(1, Math.log10(1 + deaths) / 3.2);
    const r = Math.round(255), g = Math.round(214 - 174 * t), b = Math.round(120 - 95 * t);
    return `rgba(${r},${g},${b},${(0.3 + 0.52 * t) * layerOpacity.incidents})`;
  }, [inc, layerOpacity.incidents]);

  // globe.gl hands back { points, sumWeight, center: { lat, lng } }.
  const clickBin = useCallback((d: object) => {
    const b = d as { points: Point[]; center: { lat: number; lng: number } };
    if (!b.points?.length) return;
    showIncidentBin({ at: [b.center.lat, b.center.lng], ...binSummary(inc, b.points) });
  }, [inc, showIncidentBin]);

  // Height as well as colour, on the same log scale. Colour alone saturates:
  // once a bin is deep red, a bin with ten times the deaths looks identical.
  // Raising the prism gives that range somewhere else to go, and the floor
  // keeps every bin above the country polygons so all of them stay clickable.
  const binHeight = useCallback((d: object) => {
    const { deaths } = binSummary(inc, (d as { points: Point[] }).points);
    const t = Math.min(1, Math.log10(1 + deaths) / 3.2);
    return 0.0095 + 0.055 * t;
  }, [inc]);

  const binLabel = useCallback((d: object) => {
    const b = d as { points: Point[] };
    const sum = binSummary(inc, b.points);
    const deaths = sum.unknown ? `${fmtNum(sum.deaths, lang)} (+${sum.unknown} ${tr('inc_unknown', lang).toLowerCase()})` : fmtNum(sum.deaths, lang);
    return `<div class="tip"><b>${fmtNum(sum.events, lang)} ${esc(tr('inc_events', lang).toLowerCase())}</b><br>${esc(tr('inc_deaths', lang))}: ${esc(deaths)}<br>${esc(sum.from ?? '')} – ${esc(sum.to ?? '')}</div>`;
  }, [inc, lang]);

  // The same bins the globe draws, indexed by H3 cell. A click arrives at the
  // polygon layer first, so the bin is looked up from the click's own
  // coordinates rather than from whatever was last hovered.
  const bins = useMemo(() => binIndex(incPoints, binRes), [incPoints, binRes]);

  const clickPoly = useCallback((f: object, _e: MouseEvent, c?: { lat: number; lng: number }) => {
    if (c && layers.incidents && bins.size) {
      const b = binAt(bins, c.lat, c.lng, binRes);
      if (b) return clickBin(b);
    }
    if (isTerr(f)) return select({ kind: 'territory', id: f.properties.id });
    select({ kind: 'country', id: (f as CountryFeature).properties.iso });
  }, [select, layers.incidents, bins, binRes, clickBin]);
  const hoverPoly = useCallback((f: object | null) => setHover(f && !isTerr(f) ? (f as CountryFeature).properties.iso : null), []);
  const clickPath = useCallback((p: object) => select({ kind: 'route', id: (p as PathD).id } as Selection), [select]);
  const clickArc = useCallback((a: object) => { const f = (a as Arc).flow; if (f) select({ kind: 'flow', id: f }); }, [select]);

  return (
    <div className={`globe${trace.length ? ' tracing' : ''}`} ref={wrap} data-picking={s.picking ? '1' : undefined}>
      {!webgl ? (
        <div className="globe-msg">{tr('noWebgl', lang)}</div>
      ) : (
        <Globe
          ref={globe}
          width={size.w}
          height={size.h}
          onGlobeReady={onReady}
          onZoom={onZoom}
          globeOffset={offset}
          globeMaterial={surface}
          backgroundColor="rgba(0,0,0,0)"
          backgroundImageUrl={lowPower ? null : skyUrl}
          globeImageUrl={earthUrl}
          bumpImageUrl={lowPower ? null : topoUrl}
          showAtmosphere
          atmosphereColor="#6fd0ff"
          atmosphereAltitude={0.22}
          rendererConfig={{ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' }}
          polygonsData={polygons}
          polygonCapColor={capColor}
          polygonSideColor={sideColor}
          polygonStrokeColor={stroke}
          polygonAltitude={polyAlt}
          polygonCapCurvatureResolution={4}
          polygonsTransitionDuration={0}
          polygonLabel={polyLabel}
          onPolygonClick={clickPoly}
          onPolygonHover={hoverPoly}
          hexBinPointsData={incPoints}
          hexBinPointLat={(d: object) => (d as Point).lat}
          hexBinPointLng={(d: object) => (d as Point).lng}
          hexBinResolution={binRes}
          hexBinMerge={false}
          hexMargin={0.14}
          hexAltitude={binHeight}
          hexTopColor={(d: object) => binColor((d as { points: Point[] }).points)}
          hexSideColor={(d: object) => binColor((d as { points: Point[] }).points)}
          hexLabel={binLabel}
          onHexClick={clickBin}
          hexTransitionDuration={0}
          arcsData={shownArcs}
          arcStartLat={(d: object) => (d as Arc).s[0]}
          arcStartLng={(d: object) => (d as Arc).s[1]}
          arcEndLat={(d: object) => (d as Arc).e[0]}
          arcEndLng={(d: object) => (d as Arc).e[1]}
          arcColor={(d: object) => (d as Arc).color}
          arcStroke={(d: object) => (d as Arc).w ?? 0.42}
          onArcClick={clickArc}
          arcAltitudeAutoScale={0.38}
          arcDashLength={(d: object) => (d as Arc).dash}
          arcDashGap={(d: object) => (d as Arc).gap}
          arcDashAnimateTime={(d: object) => (d as Arc).time}
          arcLabel={(d: object) => `<div class="tip">${esc((d as Arc).label)}</div>`}
          arcsTransitionDuration={0}
          pathsData={paths}
          pathPoints={(d: object) => (d as PathD).pts}
          pathPointLat={(p: PathPt) => p[0]}
          pathPointLng={(p: PathPt) => p[1]}
          pathPointAlt={(p: PathPt) => p[2]}
          pathColor={(d: object) => (d as PathD).color}
          pathStroke={(d: object) => (d as PathD).stroke}
          pathDashLength={(d: object) => (d as PathD).dash}
          pathDashGap={(d: object) => (d as PathD).gap}
          pathDashAnimateTime={(d: object) => (d as PathD).time}
          pathLabel={(d: object) => `<div class="tip">${esc((d as PathD).label)}</div>`}
          pathTransitionDuration={0}
          pathResolution={1}
          onPathClick={clickPath}
          ringsData={rings}
          ringLat={(d: object) => (d as Ring).lat}
          ringLng={(d: object) => (d as Ring).lng}
          ringColor={ringColor}
          ringMaxRadius={(d: object) => (d as Ring).max}
          ringPropagationSpeed={(d: object) => (d as Ring).speed}
          ringRepeatPeriod={(d: object) => (d as Ring).period}
          ringAltitude={0.016}
          htmlElementsData={markers}
          htmlLat={(d: object) => (d as Marker).lat}
          htmlLng={(d: object) => (d as Marker).lng}
          htmlAltitude={0.02}
          htmlElement={makeEl}
          htmlElementVisibilityModifier={vis}
          htmlTransitionDuration={0}
        />
      )}
      <div className="vignette" aria-hidden />
      {webgl && <div className="hud" ref={hud} aria-hidden />}
      {webgl && !world && !error && <div className="globe-msg" role="status">{tr('loadingBorders', lang)}</div>}
      {error && (
        <div className="globe-msg" role="alert">
          {tr('loadError', lang)} <button className="btn" onClick={() => setAttempt((a) => a + 1)}>{tr('retry', lang)}</button>
        </div>
      )}
    </div>
  );
}
