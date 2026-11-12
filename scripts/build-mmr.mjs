/**
 * Builds Myanmar's township layer.
 *
 * WHY TOWNSHIPS. Myanmar's war is not fought along a front line and it is not
 * decided at state level: control changes township by township, and the state a
 * township sits in says almost nothing about who runs it. The atlas therefore
 * refuses to colour Myanmar's states (see NO_CONTROL in src/data/territory.ts)
 * and uses the 330 townships instead — the same unit every source counts in.
 *
 * GEOMETRY. geoBoundaries gbOpen MMR ADM3, CC BY 4.0, built from The Myanmar
 * Analytics Project / USAID. Nothing here is drawn by hand. Townships carry no
 * state field in the source, so each is joined to the ADM1 unit that contains
 * its area-weighted centroid; the join is required to place all 330 with no
 * fallback, and the script fails if it cannot.
 *
 * WHAT IS NOT HERE. No national control map. No source assigns every township
 * to an actor at a current date, so the atlas does not either. The named layers
 * live in src/data/mmr.ts and cover only what is documented.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SRC = process.argv[2] || '/home/claude/dl/mmr-adm';
const OUT = new URL('../src/data/mmr/', import.meta.url);

/** Rounded to 4 decimals: ~11 m, under a third of a pixel at the map's z11 ceiling. */
const r4 = (n) => Math.round(n * 1e4) / 1e4;

/** Douglas-Peucker on a ring, in degrees. */
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let far = -1, fd = 0;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let d;
      if (len === 0) d = (px - ax) ** 2 + (py - ay) ** 2;
      else {
        let t = ((px - ax) * dx + (py - ay) * dy) / len;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        d = (px - (ax + t * dx)) ** 2 + (py - (ay + t * dy)) ** 2;
      }
      if (d > fd) { fd = d; far = i; }
    }
    if (fd > tol * tol && far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  const out = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

const ringsOf = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

/** Area-weighted centroid of the largest ring: the shoelace centroid. */
function centroid(g) {
  let best = null, ba = -1;
  for (const poly of ringsOf(g)) {
    const r = poly[0];
    let a = 0, cx = 0, cy = 0;
    for (let i = 0; i < r.length - 1; i++) {
      const [x0, y0] = r[i], [x1, y1] = r[i + 1];
      const f = x0 * y1 - x1 * y0;
      a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
    }
    if (Math.abs(a) < 1e-12) continue;
    a *= 0.5;
    if (Math.abs(a) > ba) { ba = Math.abs(a); best = [cx / (6 * a), cy / (6 * a)]; }
  }
  if (best) return best;
  const r = ringsOf(g)[0][0];
  return [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
}

/** Ray casting, holes subtracted. */
function inside([x, y], g) {
  let hit = false;
  for (const poly of ringsOf(g)) {
    for (let ri = 0; ri < poly.length; ri++) {
      const r = poly[ri];
      let c = false;
      for (let i = 0; i < r.length - 1; i++) {
        const [x0, y0] = r[i], [x1, y1] = r[i + 1];
        if ((y0 > y) !== (y1 > y) && x < x0 + ((y - y0) / (y1 - y0)) * (x1 - x0)) c = !c;
      }
      if (ri === 0) { if (c) hit = true; } else if (c) hit = false;
    }
  }
  return hit;
}

/** Shoelace area in square degrees: used only to drop specks. */
function ringArea(r) {
  let a = 0;
  for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return Math.abs(a / 2);
}

const adm3 = JSON.parse(readFileSync(`${SRC}/adm3.geojson`, 'utf8'));
const adm1 = JSON.parse(readFileSync(`${SRC}/adm1.geojson`, 'utf8'));
const meta = JSON.parse(readFileSync(`${SRC}/meta.json`, 'utf8'));

/** geoBoundaries spells two ADM1 units differently from every source that writes about them. */
const STATE_NAME = { Saigang: 'Sagaing', Tanitharyi: 'Tanintharyi' };

const states = adm1.features.map((f) => ({
  name: STATE_NAME[f.properties.shapeName] || f.properties.shapeName,
  geom: f.geometry,
}));
const stateIdx = new Map(states.map((s, i) => [s.name, i]));

const TOL = 0.003;        // ~330 m
const MIN_AREA = 2e-5;    // ~0.25 km2: specks that cannot be seen at any zoom this map reaches

const townships = [];
let srcVerts = 0, outVerts = 0, dropped = 0;

for (const f of adm3.features) {
  const name = f.properties.shapeName;
  const g = f.geometry;
  const c = centroid(g);
  const si = states.findIndex((s) => inside(c, s.geom));
  if (si < 0) throw new Error(`township outside every state: ${name} at ${c}`);

  const polys = [];
  for (const poly of ringsOf(g)) {
    const rings = [];
    for (let ri = 0; ri < poly.length; ri++) {
      const raw = poly[ri];
      srcVerts += raw.length;
      if (ringArea(raw) < MIN_AREA) { dropped++; continue; }
      let s = simplify(raw, TOL).map(([x, y]) => [r4(x), r4(y)]);
      // Simplification can collapse a ring; a polygon needs four points closed.
      if (s.length < 4) { dropped++; continue; }
      const first = s[0], last = s[s.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) s.push([first[0], first[1]]);
      rings.push(s);
      outVerts += s.length;
    }
    if (rings.length) polys.push(rings);
  }
  if (!polys.length) throw new Error(`township simplified away entirely: ${name}`);
  townships.push({ n: name, s: si, c: [r4(c[0]), r4(c[1])], g: polys });
}

if (townships.length !== 330) throw new Error(`expected 330 townships, built ${townships.length}`);

const byState = {};
for (const t of townships) byState[states[t.s].name] = (byState[states[t.s].name] || 0) + 1;
if (byState.Rakhine !== 17) throw new Error(`Rakhine should have 17 townships, has ${byState.Rakhine}`);

/** Extent of the country, for framing the detail map. */
const bbox = [180, 90, -180, -90];
for (const t of townships)
  for (const poly of t.g)
    for (const [x, y] of poly[0]) {
      if (x < bbox[0]) bbox[0] = x;
      if (y < bbox[1]) bbox[1] = y;
      if (x > bbox[2]) bbox[2] = x;
      if (y > bbox[3]) bbox[3] = y;
    }

/** Two township names occur twice. Recorded so the name lookup can refuse to guess. */
const seen = new Map();
for (const t of townships) seen.set(t.n, (seen.get(t.n) || 0) + 1);
const ambiguous = [...seen.entries()].filter(([, n]) => n > 1).map(([n]) => n).sort();

const out = {
  meta: {
    unit: 'township',
    count: townships.length,
    source: meta.boundarySource,
    boundaryYear: meta.boundaryYear,
    licence: meta.boundaryLicense,
    attribution: 'geoBoundaries (CC BY 4.0) · The Myanmar Analytics Project / USAID',
    sourceUrl: 'https://www.geoboundaries.org/',
    simplifiedToleranceDeg: TOL,
    note: 'Administrative geography only. Carries no claim about who controls a township.',
    bbox,
    ambiguous,
  },
  states: states.map((s) => s.name),
  t: townships,
};

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('townships.json', OUT), JSON.stringify(out));
const bytes = JSON.stringify(out).length;
console.log(
  `townships ${townships.length}  states ${states.length}  ` +
  `vertices ${srcVerts} -> ${outVerts} (${(100 * outVerts / srcVerts).toFixed(1)}%)  ` +
  `rings dropped ${dropped}  ${(bytes / 1024).toFixed(0)} KiB`,
);
console.log('bbox', bbox.map((n) => n.toFixed(2)).join(', '), ' ambiguous names:', ambiguous.join(', ') || 'none');
console.log('per state:', Object.entries(byState).map(([k, v]) => `${k} ${v}`).join(', '));
