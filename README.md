# Global Atlas

An interactive geopolitical atlas: territorial control, sourced front line
geometry, documented incidents and displacement, on a 3D globe and a detailed
regional map. Norwegian by default, English alongside.

## Running it

```
npm install
npm run dev
```

Node 20 or newer. `npm run typecheck` and `npx vitest run` before any change
you intend to keep.

## What is in here

| | |
|---|---|
| Globe | react-globe.gl on three.js |
| Regional map | MapLibre GL JS, loaded on demand |
| Admin units | 151 units as a shared-arc topology, so neighbours agree on borders |
| Front line | OCHA's republication of the ISW/CTP assessment, live where reachable |
| Base map | Natural Earth 10m plus a settlement gazetteer, bundled |

## The rules this project is built on

They are not decoration. Every map of a war is a claim about the world, and
these are the limits on what this one is allowed to claim.

- **Nothing is invented.** Not a front line, not a control share, not a
  casualty figure, not an event. Where a source is silent the map is silent.
- **Every assessment carries its date and its author**, on screen rather than
  in a footnote, and nothing is called real time unless the source supports it.
- **What the source does not say, the app does not say.** The front line layer
  records which side holds which ground only where the source does — and the
  OCHA layer does not, so neither does the map.
- **A unit is not a holding.** An oblast partly occupied is drawn partly, in
  proportion to the share the source states.
- **Observed, assessed and hypothetical stay apart**, and correlation is never
  quietly promoted to causation.
- **Licences are recorded as they are, including when they are unresolved.**

## Data and licensing

| Source | Licence |
|---|---|
| OCHA / ISW / CTP front line | Attribution required. **Commercial redistribution rights unresolved.** |
| Natural Earth | Public domain |
| Countries States Cities | ODbL |
| OpenStreetMap via OpenFreeMap | ODbL |
| Noto Sans, IBM Plex, Saira Condensed | OFL |

`docs/FRONTLINE.md` sets out the front line pipeline, what was verified and
how, and the blockers that remain. The commercial licence is a launch blocker,
not a detail: it must be settled in writing before any paid tier ships.
