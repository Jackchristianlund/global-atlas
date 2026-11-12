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

## High-resolution imagery with no subscription: Esri, free tier

ArcGIS Location Platform comes with a commercial deployment licence and a
monthly free tier that includes 2,000,000 basemap tiles. New accounts start
with pay-as-you-go **disabled**, so usage beyond the free tier stops the
service rather than producing a bill. That makes it the one option that is
both licensed for commercial use and free at this atlas's traffic.

It needs an account in your name, which only you can create:

1. Create an ArcGIS Location Platform account at location.arcgis.com and leave
   pay-as-you-go off.
2. Create an API key (developer credentials) with the **basemap** privilege
   only. Restrict it to the referrer `https://jackchristianlund.github.io/*`:
   the key ships in the page, as every browser map key does, and the referrer
   restriction is what stops others from using it.
3. In the GitHub repository: Settings → Secrets and variables → Actions.
   Add the **secret** `VITE_SATELLITE_KEY` with the key, and the **variable**
   `VITE_SATELLITE_PROVIDER` with the value `esri`.
4. Re-run the "Deploy to Pages" workflow (or push anything). Satellite and
   Hybrid then use Esri World Imagery, sub-metre in most populated areas, with
   "Powered by Esri" and its data providers credited on the map, and the
   non-commercial notice disappears.

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
