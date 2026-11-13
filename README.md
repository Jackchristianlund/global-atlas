# Global Atlas

An interactive geopolitical atlas of the world's armed conflicts: territorial
control, sourced front-line geometry, documented attacks (including on
shipping), displacement and trade chokepoints, on a 3D globe and a detailed
regional map. Norwegian by default, English alongside.

Live: <https://jackchristianlund.github.io/global-atlas/>

Non-commercial. No ads, no paid tier switched on; see *Licensing* below for
why that matters.

## Running it

```
npm install
npm run dev
```

Node 22. Before keeping a change: `npm run typecheck` and `npm test`.
`npm run build` is what the deploy runs.

## What is in here

| | |
|---|---|
| Globe | react-globe.gl on three.js, loaded after the page shell |
| Regional map | MapLibre GL JS, loaded on demand; bundled base detail and Myanmar's townships load after it |
| Admin units | 151 units as a shared-arc topology, so neighbours agree on borders |
| Ukraine front line | OCHA's republication of ISW/CTP's line of contact, live where reachable, bundled copy refreshed weekly |
| Ukraine control | ISW/CTP assessed control, advances and infiltration (with permission, non-commercial); OCHA's labelled units as fallback; ISW's May 2026 archive for change over time |
| Yemen | Explorer with districts (geoBoundaries), sites and the Red Sea |
| Ship attacks | Dated attacks in the Red Sea, Bab el-Mandeb, Gulf of Aden, Hormuz and the Gulf, positioned from UKMTO's stated distance and bearing |
| Export | PNG of the current view with key, sources and date |
| Base map | OpenFreeMap vector tiles; Natural Earth 10m and a settlement gazetteer bundled for offline |

## The rules this project is built on

They are not decoration. Every map of a war is a claim about the world, and
these are the limits on what this one is allowed to claim.

- **Nothing is invented.** Not a front line, not a control share, not a
  casualty figure, not an event, not an attacker. Where a source is silent the
  map is silent.
- **Every assessment carries its date and its author**, on screen rather than
  in a footnote, and nothing is called real time unless the source supports it.
- **What the source does not say, the app does not say.** The OCHA line does
  not label sides, so the map does not infer control from it.
- **Precision is stated, not implied.** A position at sea worked out from
  "30 nm southwest of Al Hudaydah" is labelled as such; a region is drawn as a
  region.
- **Observed, assessed and hypothetical stay apart**, and correlation is never
  quietly promoted to causation.
- **Licences are recorded as they are, including when they are unresolved.**

## Automation

- `.github/workflows/pages.yml` builds and deploys to GitHub Pages on every
  push to `main`.
- `.github/workflows/refresh-frontline.yml` runs on Mondays: it fetches the
  current OCHA/ISW line, validates it, refuses anything older or dated in the
  future, runs the tests, commits and redeploys
  (`scripts/refresh-frontline.ts`).

## Licensing

| Source | Licence |
|---|---|
| ISW/CTP control of terrain (Ukraine) | **Permission for non-commercial use only.** Switched off automatically if billing or ads go live (`COMMERCIAL` in `src/lib/entitlement.ts`) |
| OCHA / ISW / CTP front line | Attribution required; commercial redistribution unresolved |
| Natural Earth | Public domain |
| Countries States Cities | ODbL |
| OpenStreetMap via OpenFreeMap | ODbL |
| geoBoundaries (Yemen districts) | CC BY 3.0 IGO |
| EOX Sentinel-2 cloudless 2016 imagery | Hosted service free for non-commercial use |
| Noto Sans, IBM Plex, Saira Condensed | OFL |

Before any paid tier or advertising: settle commercial terms in writing for
every source marked above. `docs/CONTROL.md`, `docs/FRONTLINE.md` and
`docs/IMAGERY.md` set out each case; `docs/STATUS.md` is the running log.

## Layout

```
src/            app (React + zustand store in src/store.ts)
src/data/       curated, sourced datasets (sources.ts lists every source)
src/lib/        data adapters and pure logic (ArcGIS, control, front line, …)
src/map/        the MapLibre map and its layers
scripts/        data build scripts, the weekly refresh, two QA scripts
tests/          vitest
docs/           methodology, licensing and status
```
