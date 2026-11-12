# Front line data pipeline — implementation report

Date of this report: 11 November 2026.

## What the renderer is

Unchanged, and deliberately so. The global view is react-globe.gl on three.js;
the regional view is MapLibre GL JS, loaded on demand. Neither was replaced.
CesiumJS was not adopted: the existing pair already covers the 3D globe and the
detailed regional vector map, and swapping renderers would have put 180 tests
and every existing layer at risk for no capability this task needed.

## Whether real front line geometry was loaded

**Yes.** This is the part that previously did not exist.

| | |
|---|---|
| Service | `gis.unocha.org/server/rest/services/Hosted/UKR_Front_Line/FeatureServer/0` |
| Layer | `Front Line`, `esriGeometryPolyline` |
| Publisher | UN OCHA |
| Assessed by | Institute for the Study of War and AEI's Critical Threats Project |
| Assessment date | **4 November 2026** (all features share it) |
| Retrieved | 11 November 2026 |
| Source CRS | EPSG:3857, converted to EPSG:4326 |
| Features | 8 polylines |
| Vertices bundled | 440 |
| Fields available | `objectid`, `date`, `source` — and nothing else |

The main segment, objectid 395, runs from 31.513 E / 46.580 N on the Black Sea
coast to 36.178 E / 50.402 N north of Kharkiv: the length of the Ukrainian
front. The remaining seven are short segments along the northern border in
Sumy and north Kharkiv oblasts.

### How it was obtained, and the honest caveat

The build workspace cannot reach `gis.unocha.org`: the egress proxy answers 403
to CONNECT for that host, as it does for `atlas.geospatial.wfp.org`,
`api.deepstatemap.live` and `understandingwar.org`. Its own documentation says
not to route around a policy denial, so it was not routed around.

The geometry was instead read through the fetch tool, which reaches the service
directly. Every array was checked back against the service afterwards: the
vertex counts match the service's own counts for all eight features, and
indices 50, 150 and 250 of the main segment were re-read from the service and
compared vertex by vertex. They match exactly.

The bundled copy is the **service's own generalized output** — Douglas-Peucker
performed server-side via `maxAllowableOffset`, 0.012° (≈1.3 km) on the main
segment and 0.003° (≈330 m) on the northern ones. It is not a redrawing, not an
interpolation and not a smoothing of an unknown line. The tolerance is recorded
in the file and shown in the interface.

## How it reaches the map

Two tiers, in order:

1. **Live.** The application queries the service from the reader's browser at
   `maxAllowableOffset=0.001` (≈110 m) and `geometryPrecision=5`. The browser
   is not behind this workspace's proxy, so for most readers this is the tier
   that will serve.
2. **Bundled.** The 11 November snapshot above, so the layer is never empty.

There is no third tier. If the live query fails, or returns geometry that fails
validation, the bundle is used **and the interface says so** — the provenance
ticket switches from "Fetched live from the source" to "Stored copy" and adds a
line explaining why. Nothing is ever interpolated to fill a gap.

Validation a live feed must pass before it is drawn:

- every coordinate finite, and a plausible lon/lat rather than metres;
- every vertex inside Ukraine's bounding box;
- no jump over 40 km between consecutive vertices;
- at least two vertices per part.

The bbox check is the one that earns its place: a service that quietly answers
in EPSG:3857 returns numbers that are perfectly valid and put the front line in
the Gulf of Guinea. There is a test for exactly that case.

## What the data does not say, and is not made to say

The layer carries a date and a source. **It does not label which side of any
segment is whose.** The application therefore does not either: no segment has
an actor, and the interface states plainly that the source does not label
sides. Assigning actors would have been invention dressed as detail.

It is an assessed line of contact, not a real-time military position, and it is
not presented as one. `realtime` is `false` in the metadata and the interface
shows the assessment date and its age in days next to the line.

## Territorial control polygons

Unchanged in substance — they remain 151 administrative units carrying sourced
control records with precision and confidence — but their **rendering** changed
in response to §5 of the brief.

Painted at a flat 45% opacity, an oblast tint asserts that every settlement in
Donetsk oblast is held by one actor. At city zoom, with the sourced front line
running visibly through the same oblast, the map contradicted itself. The tint
is now interpolated by zoom: 0.45 at z4, 0.30 at z7, 0.12 at z9, 0.06 at z11.
It reads as the regional summary it is, and the sourced line carries the
message where the reader has zoomed in to look. **The polygons and their shares
do not change with zoom — only the opacity does.**

District-level control was not added. No sourced district-level assessment is
available, and subdividing oblasts to make the map look more precise would be
precision without evidence.

## Yemen

**Blocked, and not faked.** OCHA's hosted service directory carries roughly 230
services; none covers Yemen. There is no areas-of-control or front line service
for Yemen on that server, and ACLED's district-level control assessment cannot
be redistributed under its terms. The adapter is generic — it takes any ArcGIS
polyline or polygon service, or any GeoJSON FeatureCollection — so Yemen needs
a source, not code. Its 2021 ACLED assessment is not presented as current.

Also worth stating: Yemen does not have a continuous front line, and the brief
is right that administrative district boundaries are not military frontlines.
Whatever source is eventually licensed, it should be drawn as the discontinuous
set of controlled areas it is.

## Graphics

The base map upgrade shipped earlier this week stands: five styles (Conflict,
Standard, Terrain, Satellite, Hybrid), MapLibre vector tiles, high-DPI support,
smooth 3D→2D handover with camera state preserved.

**What is not verified:** live tile rendering. Tile providers are unreachable
from this workspace, so the regional map starts on a bundled fallback style and
draws every conflict layer over it regardless, with a notice saying the base map
needs network. The screenshots in this round therefore show the front line over
a blank base — the line is real, the missing roads and terrain are a network
limitation of the build environment, not of the code. Satellite and hybrid
styles additionally need `VITE_SATELLITE_URL`; no imagery was scraped.

## Licensing — the blocker that matters commercially

| Source | Status |
|---|---|
| OCHA / ISW / CTP front line | **Attribution required** to OCHA, ISW and CTP. **Commercial redistribution rights NOT established.** |
| DeepStateMap | Not used. No geometry taken. Commercial API needs an agreement with the rights holder. |
| Natural Earth | Public domain. |
| OpenFreeMap / OSM | ODbL, attributed. |
| ACLED | Terms do not permit redistributing raw events. Aggregates only. |

ISW publishes its own terms on `understandingwar.org`, which this environment
cannot reach, so the exact licence could not be read first-hand and is recorded
as `unverified` rather than guessed. The interface says so on the map, not in a
footnote.

**This is a pre-launch blocker.** The $3.99 tier must not go live against this
layer until ISW/CTP confirm commercial terms in writing. The code states the
position rather than hiding it: `licence: 'unverified'`, with a test asserting
that the string stays that way.

## Tests

180 passing across 16 files, up from 148. The 32 new ones cover Web Mercator
conversion, Esri→GeoJSON for paths and rings, ArcGIS error payloads, projection
and bbox validation, implausible vertex jumps, query construction, snapshot
provenance and licence state, live/bundled fallback on network error, HTTP
error, and validation failure, and staleness arithmetic.

### A defect the tests found

Two, in fact.

1. The loader chose between GeoJSON and Esri parsing by asking whether
   `features` was non-empty. Both response shapes have a `features` array, so
   an `f=json` answer was passed through unconverted. It now tests what is
   inside: GeoJSON geometry carries a `type`, Esri geometry carries `paths` or
   `rings`.

2. Chasing that failure surfaced something worse and unrelated. Earlier
   `tsc -b` runs had emitted 55 compiled `.js` files next to their `.ts`
   sources. Vite resolves `.js` ahead of `.ts`, so **tests and production
   builds were silently running stale compiled copies** of every module
   imported without an extension. The files are deleted, `noEmit` is set so
   `tsc -b` can never do it again, and `src/**/*.js` is ignored. The build
   warning changed from naming `countries.js` to `countries.ts` the moment it
   was fixed, which is how the problem was confirmed rather than assumed.

## Remaining blockers

1. **ISW/CTP commercial licence** — unresolved; blocks the paid tier.
2. **Yemen control geometry** — no authorised source found; adapter ready.
3. **Live tile rendering** — unverified from this environment.
4. **Satellite imagery key** — `VITE_SATELLITE_URL` unset.

## Next, if this is the direction

`UKR_Front_Line_FLC` and `ukr_hnrp_2026_frontline_20250702` exist on the same
server. If they carry dated snapshots, they are the natural basis for the
historical comparison that sits fourth on the priority list — real geometry at
two dates rather than two percentages.

---

# Addendum, 11 November 2026 — why the base map was empty

Tested in a real Chrome, against the published artifact, rather than inferred.

**A published artifact cannot reach any external host.** Not the tile provider,
not OCHA, not github.com, not example.com. Every cross-origin fetch fails
immediately. This was checked from the artifact's own frame origin
(`*.frame.claudeusercontent.com`), not through claude.ai, so it is the sandbox
and not a page-level policy.

Three consequences, all of which were being papered over:

1. **No tile provider will ever serve this map in an artifact.** The five map
   styles are not broken; they are unreachable by design. A sharper online base
   map works only when the app is self-hosted — `npm run dev` or any static
   host — where the styles load normally.
2. **The live front line tier never fires in an artifact.** It falls back to the
   bundled snapshot every time, and the ticket says "Stored copy", which is
   correct but means the 110 m live geometry only reaches self-hosted readers.
3. **The interface fonts were never loading.** The page asked
   fonts.googleapis.com for IBM Plex and Saira Condensed; the request failed
   silently and every reader saw system fallbacks. This had been true for the
   whole project and was invisible from the build environment.

## What changed as a result

The detail now travels with the app instead of being fetched.

| Bundled | Source | Licence | Size |
|---|---|---|---|
| Urban footprints, major roads, railways | Natural Earth 10m | public domain | — |
| 684 ranked settlements | Natural Earth 10m | public domain | — |
| 14,731 settlements | Countries States Cities database | ODbL | — |
| Map label glyphs, subset to the characters used | Noto Sans | OFL | 185 KB |
| Interface typefaces, subset | IBM Plex, Saira Condensed | OFL | 215 KB |

The glyphs are inlined in the bundle and handed to MapLibre as blob URLs
through `transformRequest`, because the artifact host serves neither `.pbf` nor
`.bin`. Subsetting the font to the characters that actually occur in the
bundled place names took the glyph payload from 417 KB to 185 KB; nothing
renders differently, because the dropped glyphs were never going to be asked
for.

The geographic pack is 3.0 MB raw, 457 KB gzipped, and loads with the regional
map chunk rather than on first paint. Coordinates are rounded to 3 decimals and
lines simplified at 0.004° — below what the map's zoom range can resolve.

This is highway and settlement scale. It is not street level, and the interface
says so rather than implying otherwise.

## Conflict to detailed map

Selecting a conflict now offers **Open detailed map**, which switches view and
frames the conflict from the administrative units that carry control records
for it — not from a country bounding box, which would frame the Sahara for a
city siege. A conflict with no control geometry and no bundled detail is not
offered the button at all, because the view would be empty.

## Tests

189 passing across 17 files. New coverage: conflict framing from control
records, the fit-to-bbox zoom and its clamps, refusal to guess an extent for an
unknown country, that glyph requests are answered in memory and
non-glyph URLs pass through untouched, and that the bundled base declares its licence
and its scale.

---

# Addendum, 12 November 2026 — trade routes

The sea, oil and LNG lanes were hand-placed waypoints, labelled illustrative.
Honest, but a line drawn by eye does not know where the water is, and it cannot
tell you what closing the Red Sea costs.

They are now shortest paths over the **2025 Eurostat maritime network**,
computed with `searoute-ts` (MIT), each subject to the canal and strait
constraints that define it: a Suez route is required through Suez, a Cape route
is blocked from it, and the Lombok alternative is defined the way a master
would define it — not through Malacca.

| route | computed | passages |
|---|---|---|
| Asia–Europe via Suez | 19,510 km | Malacca, Bab-el-Mandeb, Suez, Gibraltar, Dover |
| Asia–Europe via the Cape | 26,220 km | Malacca, Dover |
| Gulf–Europe via Suez | 11,930 km | Hormuz, Bab-el-Mandeb, Suez, Gibraltar |
| Gulf–Europe via the Cape | 20,776 km | Hormuz, Dover |

The Cape diversion is a third further on the Asia–Europe run and three quarters
further from the Gulf. Those are the numbers that make a chokepoint mean
something, and they can be checked: Shanghai–Rotterdam via Suez is usually
quoted near 10,500 nautical miles, about 19,400 km.

**What this is not.** A computed voyage says where a ship could reasonably
sail. It says nothing about how many do. There is no AIS, no traffic density
and no tonnage here, and the app does not imply any: the method line and the
"not measured traffic" note travel with the data.

Land corridors keep their hand-placed waypoints and keep saying so. A rail
network is a different dataset; drawing one by eye and calling it computed
would be worse than admitting the sketch.

**On the map**, that distinction is now carried by the line itself — solid for
computed geometry, dashed for a schematic corridor — and stated in the legend,
so a reader can tell them apart without being told. The lanes also hold a
constant width on screen at any altitude and sit on a dark casing, because at
globe distance the old 0.26° stroke came to about one and a half pixels and
simply vanished.
