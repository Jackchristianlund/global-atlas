# GLOBAL ATLAS — status report

Snapshot date in the dataset: **2026-11-11**. Each record carries its own assessment date; the snapshot date is when the set was assembled.
Nothing in the application is real-time, and the interface says so in the header.

## What is built

**Preserved.** The 3D Earth, dark identity, layout, typography, camera controls,
globe animations, country selection, relationship system, alliances, trade
routes, search and information panels are the existing ones. The Version 1
conflict markers were restored from the original CSS — flat dots with a simple
glow and dark edge, labels on hover or selection, a white outline on the
selected marker — not a new design resembling them.

**Territorial control** is a primary layer, on by default, drawn as
semi-transparent polygons on real administrative geography (Natural Earth 1:10m
admin-1, plus Natural Earth's own breakaway polygons for Abkhazia and South
Ossetia). 151 units across Yemen, Ukraine, Syria, Sudan, Libya, DR Congo,
Israel and the Palestinian territories, Georgia and Chechnya. A unit split
between actors is marked contested rather than guessing a line inside it;
Ukraine carries the source's own stated percentage per oblast.

**Territorial control over time.** Every control record carries the date its
assessment was verified and, where documented, the date the arrangement began.
The timeline picks the latest assessment in force for the selected year; a unit
with no sourced assessment for that year is not drawn. The unit panel lists the
control history with clickable years.

**Georgia, the Caucasus and Chechnya** (§6.3, §6.4). Abkhazia and South Ossetia
are a category of their own — de facto administration on internationally
recognised Georgian territory — with the Russian 7th and 4th bases, the 2008
recognition and the 49-year basing agreements recorded. Chechnya is a
constituent republic of Russia with the palest fill in the dataset. Both regions
carry explicit legal notes separating them from occupied Ukraine, and tests
enforce that separation.

**Black Sea context** (§6.5). The Montreux regime on the Bosporus and
Dardanelles: free merchant passage, tonnage and 21-day limits on non-riparian
warships, the February 2022 closure to belligerents, the transit-charge rate
rise to $6.70 per net tonne from July 2026, and Turkey's continued refusal to
open the straits to NATO warships. Three cause-and-effect links tie Caucasus
presence, the straits, grain exports and NATO naval access together.

**Conflict events and attacks** (§9, §10). A curated layer of individual
documented incidents. Each record keeps the event date separate from the
publication date, states location precision (exact, district, city, region),
names documented actors and targets, and carries a verification status —
confirmed, attributed, disputed or unreported. Where sources give different
casualty figures, each figure is kept with its own source rather than merged:
the 7 November 2026 Kyiv strike carries both "five injured" (Ukrinform, quoting
the mayor) and "at least six" (Kyiv Independent), and is marked disputed.
Markers are squares for approximate locations and circles for exact ones.

**Recent developments** (§17). Period filters (24 hours, 7, 30, 90 days, a year,
the whole dataset) plus filters by country, conflict and category. The window is
measured from the snapshot date, not the reader's clock, and the panel says so.
Clicking an entry flies the camera to it.

**Incident layer (UCDP GED)** — event-level data, hex-binned with resolution
following camera height, cumulative to the timeline year. Empty in this build
(see blockers) and the sidebar says which command fills it.

**Displacement corridors** — 17 UNHCR corridors as arcs, each with its own
counting basis and date. Corridors on different bases are never summed;
internally displaced people are counted separately and never drawn as arcs.

**Three levels of detail** (§11). Marker visibility, hex-bin resolution and
territorial geometry all follow camera height. The global view stays clean:
individual incident markers below the top categories appear only from the
regional level down.

**Free and Pro** (§21) and **advertising** (§22) are scaffolded, not activated.
See "Commercial status" below.

## Ukraine and Yemen depth (this phase)

Built in the priority order asked for.

**1. Territorial control.** All 27 oblasts, with Crimea and Sevastopol under Ukraine where they are
internationally recognised. Every record now carries `precision` (whole unit, split with a stated
share, or presence only) and `confidence` (high where a named monitor gives a dated figure). Shares
refreshed to the 30 October 2026 measurement: Luhansk ~98.7%, Donetsk ~79.7%, Zaporizhzhia ~75.8%,
Kherson ~72.1%, about 19% of Ukraine in all. Where an earlier assessment in this dataset disagreed
on Kherson, the record says so and gives the reason rather than quietly overwriting it. Yemen's 21
records carry the same two fields.

**2. Lines of contact.** The administrative geometry was rebuilt as a topology
(`scripts/build-admin1.mjs`): each border is stored once as an arc both neighbours reference. Doing
it the old way — simplifying each unit on its own — had pulled shared borders apart, so neighbours
disagreed on the line between them and a line of contact could not be derived at all. Ukraine now
has seven stretches totalling about 870 km for 2026; Yemen has eleven. Each is dated by the older of
the two assessments it sits between and labelled as derived rather than surveyed.

**3. Incident markers.** Nine sourced Ukraine incidents across six categories, event date kept
separate from publication date. Pokrovsk and Vovchansk are marked disputed because Russian
announcements and Ukrainian reporting conflicted; Gerasimov's claim to hold half of Kostiantynivka
is recorded as a claim by a party and is deliberately not categorised as a territorial change.

**4. Historical comparison.** Two dated assessments can be set against each other. Only years with a
real assessment are offered — Ukraine has 2014, 2022 and 2026 — because offering every year would
show "no change" for years nobody assessed. Changed units are ringed on the globe, and the list
separates changing hands from changing category from being assessed for the first time.

**5. City explorer.** Sixteen Ukrainian places including every city the brief names. Each shows
control for the year on the timeline, dated control history, incidents within 40 km (stated as
proximity, not as "in"), and sources. Pokrovsk and Kostiantynivka carry no controlling actor because
the sources do not settle one.

**Not built.** District-level control polygons. The geometry could carry them, but there is no
sourced district-level assessment in this dataset, and drawing them would be unsupported precision.
DeepStateMap's own geometry is not used anywhere and would need an agreement with the rights
holder; the published oblast percentages measured from it are cited with that measurement basis
stated.

## Base map and detailed map (this phase)

No renderer migration. The globe stays on react-globe.gl; MapLibre was added
alongside it for the close-in view, which is the simplest architecture that
delivers the detail asked for.

**Rivers and lakes on the globe.** Natural Earth 1:50m, 993 rivers and 247
lakes, bundled (237 kB). Public domain, no tile server, no key, works offline.
Drawn as two line meshes rather than one object per feature, so the globe stays
smooth with every conflict layer above it.

**Detailed map.** A MapLibre pane, lazily loaded (1 MB in its own chunk) so the
globe is unaffected for anyone who never opens it. Every overlay on it —
control polygons, the derived line of contact, incidents, places, the Version 1
conflict markers — is built from the same data the globe draws. No geometry was
created for this view.

**Shared camera.** The globe reports where it is looking; the map opens on the
same ground at the same scale, and back again. The conversion solves where the
camera's field-of-view ray actually meets the sphere; the naive version that
matches the horizon angle hands the map a continental zoom while the globe is
showing a city. Year, layers, opacity and selection are shared state already.

**Five styles.** Conflict map (default, muted so the overlays stay loudest),
Standard and Terrain run on OpenFreeMap over OpenStreetMap data under ODbL —
commercial use permitted with attribution, no key, no bill. Satellite and Hybrid
need a licensed provider and ship as finished adapters: set `VITE_SATELLITE_URL`
and they switch on. Until then the app says what is missing rather than
borrowing someone else's tiles.

**Degradation.** The map starts on a local base and draws all conflict layers
regardless, with a notice explaining a missing basemap. A browser without WebGL2
gets a plain explanation instead of a blank pane; the globe needs only WebGL1
and keeps working.

**Two bugs found and fixed while verifying.** MapLibre loads its geometry worker
as a separate file that the bundler was not emitting: layers and sources were
all in place and nothing drew. And a style object with a present-but-undefined
`glyphs` key fails validation, which stops the map loading at all.

**Not verified here.** This build environment reaches only GitHub and the package
registries, so no tile provider could be contacted and live basemap rendering
was never seen. What was verified: the map mounts, the worker loads, all
overlays render on the offline base at the right coordinates, style and density
controls work, and the camera round-trips exactly (48.6°N 36.5°E before and
after a globe → map → globe trip).

**Costs.** Nothing is paid today. OpenFreeMap is free and has no key. A satellite
licence is the only cost this phase would add, and it is optional.

## Visual polish and regional explorers (13 November 2026)

No renderer change: react-globe.gl for the globe, MapLibre for the detailed map.

**The globe as centrepiece.** The resting distance is solved from the space
between the panels (`src/lib/framing.ts`) instead of a fixed altitude: about
30% larger on a 1600×900 desktop and 32% on 2560×1311, never taller than the
stage. It re-centres when a panel is folded or the right panel widens. The
right panel is compact (340 px) for the overview and widens (420 px) when
something is selected. The camera read-out moved to the top right, out from
under the south pole. The compact legend can be folded to one line.

**Readability.** The smallest text moved up a step (10→11 px, 11→12 px). Long
timeline titles get a wider card and the full title in a popover above the
strip; the strip can be filtered by event type.

**Ukraine.** A regional explorer opens in the conflict panel: how to read the
map (assessed line, control summary and its share, partial/contested units as
uncertainty, comparison colours), clickable sources with assessment dates, and
a **comparison of any two monthly front lines** (January–November 2026, or the
current line). The comparison measures where the two lines are more than 3 km
apart — twice the service's generalisation — highlights those stretches and
frames the map on them, with a list of stretches to step through. It reports
how far the line moved, never who gained ground: the source does not label
sides. The derived oblast-border "contact line" is no longer drawn for the year
the sourced ISW/CTP line covers. On the tile base map, the bundled urban fill
and duplicate names are hidden, so the vector map's own roads and labels read
cleanly; labels are a step larger with firmer halos, and roads on the conflict
style a few shades darker.

**Yemen.** A regional explorer states the limitation first — no licensed
control geometry, governorate-level assessments only, districts are
administrative — then the three parties with their governorate counts, every
governorate's dated assessment, the assessment years (2014, 2025, 2026), ports
and cities (Ras Isa and As-Salif added with sources), Bab el-Mandeb and a
Red Sea shipping view, and the documented events. All 333 districts are drawn
as thin dashed reference lines (CSO/OCHA 2021, CC BY 3.0 IGO) with names at
close zoom. The derived governorate-border contact line is **never** drawn for
Yemen: an administrative border is not a front.

**Imagery.** Shaded relief from the open AWS Terrain Tiles on the vector styles.
Satellite and Hybrid now work: by default on EOX Sentinel-2 cloudless 2016,
labelled with its capture years and its non-commercial service terms; with a
key, on MapTiler, Esri, Mapbox or Stadia (`docs/IMAGERY.md`). Hybrid lays
OpenFreeMap's roads and names over the imagery.

**Exploration.** Quick links to Ukraine and Yemen beside the globe/map switch;
the selected conflict's units outlined on the map; search suggestions before
typing, arrow-key navigation, and city results from the bundled gazetteer;
shareable links (`#v=…&m=map&c=…&z=…&y=…&s=…&l=…&st=…&fc=…`) that restore
view, camera, year, selection, layers, style and comparison; a "Share view"
button; a short crossfade into the map; on phones the map-style controls fold
away and conflict framing uses the real screen width.

**Not done, and why.** No district-level control for Yemen (no licensed
source). The monthly front lines are fetched live, not bundled (see
`src/data/frontline/history/README.md`). Live deployment and real-browser
verification of this build need the changes pushed to `main`.

## Labelled areas of control in Ukraine (13 November 2026)

The map now draws occupied territory from a source that labels the sides:
UN OCHA's HNRP 2026 planning units marked "OT", drawn against the front line
of 2 July 2025 (four units, about 87,800 km²). They are fetched live and
validated (projection, extent, plausible area), shown in red with their date,
and the Ukrainian oblast tint drops to a trace wherever they are drawn. The
strip between the July 2025 area and today's line is left uncoloured and the
legend says why. ISW/CTP's current "assessed Russian-controlled territory"
layer is wired up behind `VITE_ISW_CONTROL_URL` and stays off until ISW grants
permission; `docs/CONTROL.md` has the request. The deploy workflow now passes
the imagery provider and key from the repository settings, so high-resolution
Esri imagery (free tier, commercial licence) switches on by adding a key —
see `docs/IMAGERY.md`.

**Update, 13 November 2026, later:** ISW has granted permission for
non-commercial use. The map now draws ISW/CTP's own assessed control of
terrain (published 12 November 2026, ≈112,700 km²), with assessed advances and
infiltration areas as separate, lighter uncertainty layers and the pre-2022
occupation as an outline. The layer switches itself off if billing or ads go
live; OCHA's labelled units remain the fallback. See `docs/CONTROL.md`.

**Follow-up, 13 November 2026, evening:** the globe also draws ISW/CTP
control and advances (coarsened to ~1 km), fetched only once the reader is
close over Ukraine or has the war selected — the overview never downloads it.
Measured on the live site: the app loads in about 1 s (1.1 MB of script,
compressed); ISW's layer is 4.1 MB, about 0.9 s to fetch and 16 ms to parse,
paid only when Ukraine is in view. Comparison stretches are named from the
gazetteer's Ukrainian cities. Phone fixes from testing the live site at
390 px: the page can no longer be dragged sideways onto the closed drawers,
the globe settles on its resting view even if the window changes size during
the entrance, and the map credits sit on one line. Frame rates could not be
measured reliably in the automated browser, which throttles background tabs.

## Faster start, image export, recent changes, Red Sea shipping (13 November 2026, night)

- **Faster start.** The page shell, panels and timeline no longer wait for the
  globe: the globe (with three.js) and the dialogs are separate chunks.
  Script needed before first paint: 402 KB compressed, down from 1,177 KB.
- **Download image.** "⤓ Last ned bilde" beside the view switch saves a PNG of
  the globe or map as it is on screen, with a title, the date it describes
  and "ikke sanntid", the key for what is drawn, and every source credited on
  screen (ISW's non-commercial credit when its polygons are shown). The globe's
  HTML markers are drawn into the picture so it keeps the conflict dots.
- **Recent changes (Ukraine).** One click for "front line: last month" (OCHA's
  latest month line at least four weeks old, against today's) and, with ISW
  on, "control since 31 May" (ISW's last clean archive day). ISW does not date
  individual advance areas, so shorter windows such as "last week" are not
  offered; the panel says so.
- **Red Sea / Bab el-Mandeb.** Eleven dated attacks on merchant ships
  (November 2023 – August 2026), each with its source. Positions are
  UKMTO's stated distance and bearing from a port, converted and labelled as
  "position at sea, a few nautical miles uncertain"; one that would land
  ashore is put in the strait and says so. Unknown attackers stay unknown;
  the Tihamah attack (11 August 2026) is marked disputed. The Yemen explorer
  lists them by date. This is a selection, not a register: JMIC counted 123
  incidents up to September 2025.
- **Sudan.** No control polygons added. See `docs/CONTROL.md` → Sudan.

## Data sources and licensing

| Source | Use | Licence / access | Status |
| --- | --- | --- | --- |
| Natural Earth (1:110m, 1:10m admin-1, 10m disputed areas) | Base map, administrative and breakaway geometry | Public domain | Integrated |
| Our World in Data mirrors of UCDP/PRIO and SIPRI | Historical deaths and military expenditure series | CC BY | Integrated |
| UCDP Georeferenced Event Dataset | Incident layer | Free with citation (UCDP terms) | Connector built, blocked here |
| ACLED | Event-level conflict data | Redistribution of raw events not permitted | Connector built; snapshots stay server-side, aggregates only |
| UNHCR Refugee Data Finder | Displacement totals and corridors | CC BY 4.0 IGO | Connectors built, blocked here |
| World Bank WDI | Indicators | CC BY 4.0 | Connector built, blocked here |
| IMF PortWatch | Chokepoint transits | Open | Connector built, blocked here |
| UN Comtrade | Trade statistics | Open tier, rate-limited | Connector built, blocked here |
| EIA / STEO | Chokepoint oil volumes | US government, public domain | Integrated |
| News and reference sources (Reuters, Al Jazeera, Ukrinform, Kyiv Independent, ISW/CTP, Carnegie, Wikipedia and others) | Curated conflict, territorial and incident records | Cited per record; Wikipedia labelled as a volunteer-edited secondary source | Integrated |

Every dataset's licence, attribution, cadence, vintage, retrieval time, row
count, version history and unmapped entities are listed in the application's own
dataset panel. **Commercial clearance has not been obtained for any source.**
That is a pre-launch task, not a completed one — see blockers.

## Blockers

1. **Network allowlist.** This build environment reaches only GitHub and package
   registries. Six connectors (UCDP GED, ACLED, UNHCR population, UNHCR flows,
   World Bank, PortWatch, Comtrade) are fully written and blocked here, not
   stubbed. `npm run ingest` where outbound HTTPS is open fills them, including
   the incident layer. ACLED additionally needs `ACLED_API_KEY` and `ACLED_EMAIL`.
2. **Commercial data rights are unverified.** Several sources permit free public
   use but say nothing clear about advertising- or subscription-supported
   commercial use. This must be settled per source before any paid tier goes
   live. ACLED's terms already rule out redistributing raw events.
3. **No accounts, no payments, no server.** `BILLING_ENABLED` is false. There is
   no payment provider, no account system and no server-side entitlement
   validation. The tier switch in the pricing panel is a preview of the two
   tiers, not a purchase.
4. **Historical borders are not modelled.** Control is dated, but borders are
   always drawn as they are today, and the timeline says so when scrubbed back.
5. **DeepStateMap, Liveuamap and Conflict Radar 360** were used as design
   references only. No data, tiles or geometry were taken from them, and no
   access terms were assumed. Street-level frontline geometry comparable to
   DeepStateMap would need a licensed source; the current layer works at
   administrative-unit resolution and says so.
6. **PostgreSQL/PostGIS** is not used. The snapshot store is file-based and
   append-only with sha256 versioning; the schema is described in
   `docs/ARCHITECTURE.md`.

## Next steps for public deployment

1. Obtain written commercial clearance per source, and record it in the dataset
   registry alongside the licence field that already exists.
2. Run `npm run ingest` on infrastructure with open outbound HTTPS; schedule it
   per source cadence; keep ACLED server-side.
3. Build accounts and server-side entitlement validation before wiring a payment
   provider. Do not enable billing until 1 and 3 are done.
4. Expand the curated incident set and keep the event-date/publication-date and
   verification discipline as it grows.
5. Measure audience before publishing any audience figure on the advertising
   page, which currently states that none are available.

## Tests

301 tests across 26 files (272 before this phase, all still passing; the one
existing assertion that satellite was unavailable was updated to the new
default). Earlier description: 146 tests across 15 files. They cover geometry, selectors, the server ingest
pipeline, the relationship graph, tracing, SSR and DOM rendering, territorial
control and its time series, displacement corridors, the UCDP event pipeline,
the attacks dataset, and the Free/Pro rules — including that no essential
conflict data or source citation is gated, that gated features are ones that
actually exist, and that no audience figures are invented.
