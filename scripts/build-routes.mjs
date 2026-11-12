/**
 * Recomputes the sea, oil and LNG routes over a published maritime network.
 *
 * They were hand-placed waypoints, honestly labelled illustrative. That is
 * better than pretending, but it is still a line somebody drew by eye: it does
 * not know where the water is, and it cannot tell you that closing the Red Sea
 * adds eight thousand kilometres.
 *
 * These are shortest paths over the 2025 Eurostat maritime network, with the
 * canal and strait constraints each route is defined by. That makes them
 * computed geometry over published data rather than drawing — but it is still
 * a model of a plausible voyage, NOT observed traffic. Nothing here says how
 * many ships actually sail a lane; the app must not claim otherwise.
 *
 * Land corridors (rail) are untouched. A rail network is a different dataset
 * and they stay marked schematic.
 */
import { writeFileSync } from 'node:fs';
import { seaRoute } from 'searoute-ts';
const { ROUTES } = await import('/tmp/trade.mjs');

/** This project's chokepoint ids to the network's passage names. */
const PASSAGE = {
  bab: 'babelmandeb',
  hormuz: 'ormuz',
  suez: 'suez',
  malacca: 'malacca',
  panama: 'panama',
  gibraltar: 'gibraltar',
  bosporus: 'bosporus',
  // Not a passage in the network; it lies on the way and constrains nothing.
  taiwanstrait: null,
  // "Around the Cape" is defined by what it avoids, not by a gate it passes.
  cape: null,
};

/** Routes defined by avoiding something rather than passing through it. */
const AVOID = {
  'asia-eu-cape': ['suez'],
  'gulf-eu-cape': ['suez'],
  'brazil-china': ['suez', 'panama'],
  // Lombok is the deep-draft alternative to Malacca; the network does not name
  // it, so the route is defined the way a master would define it: not Malacca.
  'gulf-asia-lombok': ['malacca'],
};

const out = {};
const report = [];

for (const r of ROUTES) {
  if (r.kind === 'rail') continue;
  const [aLat, aLng] = r.pts[0];
  const [bLat, bLng] = r.pts[r.pts.length - 1];

  const via = r.via.map((v) => PASSAGE[v]).filter(Boolean);
  const restrictions = AVOID[r.id] ?? [];

  try {
    const res = seaRoute([aLng, aLat], [bLng, bLat], {
      units: 'km',
      returnPassages: true,
      ...(via.length ? { via } : {}),
      ...(restrictions.length ? { restrictions } : {}),
    });
    const coords = res.geometry.coordinates;
    // Back to [lat, lng], which is what the globe and the panels use.
    const pts = coords.map(([lon, lat]) => [Math.round(lat * 1e4) / 1e4, Math.round(lon * 1e4) / 1e4]);
    out[r.id] = {
      pts,
      km: Math.round(res.properties.length ?? 0),
      passages: res.properties.passages ?? [],
    };
    report.push(`${r.id.padEnd(18)} ${String(pts.length).padStart(4)} pts  ${String(out[r.id].km).padStart(6)} km  ${(out[r.id].passages.join('+') || '-')}`);
  } catch (e) {
    report.push(`${r.id.padEnd(18)} FAILED: ${e.message}`);
  }
}

writeFileSync('src/data/routes.computed.json', JSON.stringify({
  meta: {
    method: 'shortest path over a published maritime network',
    network: 'Eurostat maritime network 2025 (marnet), via searoute-ts',
    networkLicence: 'MIT (library); Eurostat network as published',
    computed: new Date().toISOString().slice(0, 10),
    // The sentence that keeps this honest.
    notTraffic: 'A computed voyage, not observed traffic. No claim is made about how many ships sail a lane.',
  },
  routes: out,
}));

console.log(report.join('\n'));
console.log(`\n${Object.keys(out).length} routes computed`);
