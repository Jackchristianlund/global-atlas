# Imagery, relief and base-map licensing

Status on 13 November 2026. Nothing here adds a paid subscription; the
commercial options are configured but switched off until someone supplies a
key under a plan they have chosen.

## What ships switched on

| Layer | Source | Licence | Commercial use |
|---|---|---|---|
| Vector base maps (Conflict, Standard, Terrain, and roads/names in Hybrid) | OpenFreeMap, OpenStreetMap data | ODbL 1.0, attribution | Permitted with attribution |
| Shaded relief (Terrain strong, Conflict and Standard subtle) | Mapzen Terrain Tiles on AWS Open Data (SRTM, GMTED2010, ETOPO1 and others) | Open data; attribution required per the Tilezen attribution notes | Permitted with attribution |
| Satellite and Hybrid imagery, default | EOX Sentinel-2 cloudless **2016**, hosted WMTS | Data CC BY 4.0; EOX's hosted tile service is free for **non-commercial** use | **Not** through EOX's hosted service. The 2016 data itself is CC BY 4.0 and could be self-hosted commercially |
| Yemen districts | CSO / OCHA Yemen via geoBoundaries (2021) | CC BY 3.0 IGO | Permitted with attribution |
| City search | Natural Earth populated places | Public domain | Yes |

The imagery default is labelled on the map every time it is shown: provider,
capture years (2016–2017, **before the 2022 invasion**), 10 m resolution, and
that it is non-commercial. A satellite view on a war map is read as current
unless it says otherwise.

## Switching to a commercial imagery provider

Set two build-time variables (see `.env.example`):

```
VITE_SATELLITE_PROVIDER=maptiler   # or esri, mapbox, stadia
VITE_SATELLITE_KEY=<key>
```

The adapter in `src/map/styles.ts` (`imageryProvider`) then uses that
provider's high-DPI tiles (512 px or @2x) and its attribution, and the
non-commercial notice disappears. Each needs an account and a plan whose terms
cover the intended use:

- **MapTiler Cloud** — satellite tiles; the free plan is non-commercial, paid
  plans permit commercial use. Attribution required.
- **Esri World Imagery** through **ArcGIS Location Platform** — commercial and
  revenue-generating apps are permitted under a Location Platform
  subscription with an access token; "Powered by Esri" attribution required.
  The tokenless public World Imagery endpoint is not for commercial use.
- **Mapbox Satellite** — commercial use under Mapbox's terms with an access
  token.
- **Stadia Maps Alidade Satellite** — commercial use on Stadia's paid plans.

Before enabling monetisation, confirm the chosen plan's terms for
advertising- or subscription-funded use, and record it alongside the other
dataset licences.

## Why not Google

Google's map tiles have terms of their own and are not used here; nothing in
the app borrows another provider's tiles without a configured key.
