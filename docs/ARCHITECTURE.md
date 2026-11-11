# Arkitektur / Architecture

## I dag: frontend med kuratert øyeblikksbilde

```
React 19 + TypeScript + Vite
├── react-globe.gl / three.js   3D-kloden (WebGL)
├── world-atlas (Natural Earth) landpolygoner, TopoJSON → GeoJSON ved lasting
├── zustand                     tilstand (visning, lag, valg, år, språk)
├── d3-force                    nettverksgrafen
└── src/data/*.ts               kuratert, kildebelagt datasett (ingen nettverkskall)
```

Designvalg:

- **Datasett som kode.** Hver post er typet (`src/types.ts`), og dataintegriteten håndheves av tester: unike id-er, alle kildereferanser finnes, gyldige ISO-koder, kryssreferanser løses, ingen dato etter øyeblikksbildet, medlemstall som stemmer (NATO 32, EU 27, AU 55 …).
- **Ytelse.** Landpolygonene lastes dovent (egen chunk), markører er DOM-elementer (skarpe, fokuserbare, billige), buer tegnes bare for gjeldende valg – aldri alle relasjoner samtidig – og «redusert grafikk» slås på automatisk på små/svake enheter (lavere pixel ratio, ingen stjernehimmel/animasjon).
- **Antimeridianen.** Alle korridorer gjøres kontinuerlige i lengdegrad (`unwrapLongitudes`) og fortettes langs storsirkler (`densify`), så Stillehavsruter ikke tegnes «feil vei».
- **Flerspråklighet.** Alle strenger er `[norsk, engelsk]`-par; norsk er standard.

## Fase 2 (bygget): ingest-tjeneste med filbasert versjonslager

`server/src/`: `normalize.ts` (navn→ISO3, regioner/historiske stater klassifiseres, ukjente rapporteres),
`validate.ts` (CSV, koordinater inkl. (0,0)-avvisning, år- og datokontroll med rulleringsvern),
`dedup.ts` (kilde-id eller stabil hash; aldri fusjon på tvers av kilder), `store.ts` (append-only
versjonshistorikk, sha256, `latest.json`, metadataoppdatering uten ny versjon), `http.ts` (timeout,
én retry, 429-respekt), `connectors/` (OWID-speil + UCDP-API, ACLED, UNHCR, Verdensbanken,
IMF PortWatch, Comtrade), `publish.ts` (kompakte utdrag + registry til frontend), `serve.ts`
(REST med ETag/304), `cli.ts` (`ingest`/`publish`/`serve`/`status`).

## Neste steg: database og løpende drift (ikke bygget)

```
                       ┌────────────────────────────┐
  ACLED API ──────────▶│  Ingest-jobber (Node/TS,   │
  UCDP API ───────────▶│  cron): normaliser, datér, │──▶ PostgreSQL + PostGIS
  UNHCR API ──────────▶│  kildemerk hver rad        │        │
  IMF PortWatch ──────▶└────────────────────────────┘        ▼
  (EIA, Comtrade …)                              REST/GraphQL-API med cache
                                                 └──▶ samme frontend, samme typer
```

- **Skjema**: tabellene speiler dagens TypeScript-typer; geometri i PostGIS (`geography`), kilder i egen tabell med FK fra hver påstand, `verified_at` per rad.
- **Kilder og nøkler**: se `.env.example`. ACLED og UCDP krever registrering; UNHCR og IMF PortWatch er åpne.
- **Prinsipp**: innhentingen fyller de samme feltene som det kuraterte settet – med kilde, dato og metode per rad – slik at frontenden ikke endres. Felter uten data forblir `null` og vises som «Ikke tilgjengelig».
- **Oppdateringstakt**: ACLED ukentlig, UCDP årlig (GED-kandidatdata månedlig), UNHCR halvårlig, PortWatch daglig. Dashboardet skal da vise per-kilde ferskhet i stedet for én øyeblikksbilde-dato.

## Teststrategi

- `tests/geo.test.ts` – geodesi (haversine mot kjent avstand, antimeridian, fortetting, enheter, centroider).
- `tests/selectors.test.ts` – tidslinjelogikk, medlemskap per år, sanksjonsekspansjon (EU→medlemmer), sammenligning, omvei-beregning, søk.
- `tests/data.test.ts` – dataintegritet (se over) og at basiskartet laster med ISO-koder.

Kjør alt med `npm test`.
