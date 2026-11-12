# Areas of control in Ukraine

Status on 13 November 2026.

The front line OCHA republishes (ISW/CTP) does not say which side of it is
whose, and the atlas never infers that. Areas of control therefore come from a
separate layer whose publisher labels the sides. `src/lib/control.ts` loads it
from the reader's browser, validates it (projection, extent, and a plausible
total area), and draws it as published. Nothing is bundled, interpolated or
derived from the line.

## What is switched on: ISW/CTP assessed control (with permission)

Source: ISW's public web map **"Assessed Control of Terrain in Ukraine"**
(ArcGIS item `9f04944a2fe84edab9da31750c2b15eb`, owner
`gbarros_understandingwar`), which carries the day's layers as embedded
feature collections, each feature with a `pub_date`. On 13 November 2026 it
was published 12 November 2026.

The item's own licence text: *"This geodata is the exclusive intellectual
property of the Institute for the Study of War (ISW). You may not use this
geodata without the written consent of ISW."*

**Permission:** ISW has consented to use in this atlas **for non-commercial
purposes only** (reported by the site owner on 13 November 2026). Keep ISW's
written reply on file; it is the consent the licence requires.

How the permission is enforced in code (`src/lib/control.ts`):

- The layer is used only while `COMMERCIAL` (`src/lib/entitlement.ts`) is
  false — that is, while neither billing nor any ad network is live. Turning
  either on switches the ISW layer off and the map falls back to OCHA.
- `VITE_ISW_CONTROL=off` (repository variable) switches it off without a code
  change, should ISW withdraw consent.
- Credit on the map and in the legend: "ISW and AEI's Critical Threats
  Project", with the publication date and "with permission, non-commercial".

What is drawn, as ISW labels it:

| ISW layer | Drawn as |
|---|---|
| Assessed Russian-Controlled Terrain | solid red: control (≈112,700 km² on 12 Nov 2026) |
| Assessed Russian Advances | light red, dashed edge: inside the forward line, not controlled |
| Assessed Russian Infiltration Areas | faint orange, dotted edge: presence, not control |
| Russian-controlled Ukrainian Territory Before Feb 24, 2022 | dark dashed outline only (already inside the controlled area) |
| Claimed Russian Territory | **not drawn**: a party's claim ISW could not verify |

Polygons are simplified to about 80 m in the browser (ISW's layer has about
40,000 vertices), validated (extent, projection, plausible area) and never
altered otherwise.

## Fallback: UN OCHA, HNRP 2026 planning units

Used when the ISW layer is switched off, cannot be reached or fails
validation.

`gis.unocha.org/.../ukr_hnrp_2026_uoa_poly/FeatureServer/2`

OCHA's Humanitarian Needs and Response Plan 2026 divides Ukraine into units
of analysis by distance from the front line. Four of them OCHA labels as
occupied territory (`adm1_en = 'OT'`, codes `UAOT_*`): 0–20 km, 21–50 km,
51+ km occupied after 2022, and 51+ km occupied before 2022. Together about
87,800 km². Only these four are drawn. One further unit carries no label and
is left out rather than guessed at (by its size it may well be Crimea, which
the atlas already shows as occupied from its own oblast-level records).

The units were drawn against OCHA's front line of **2 July 2025** (the service
`ukr_hnrp_2026_frontline_20250702`). They are older than the line on the map,
and the interface says so: the strip between the red area and today's line is
change since July 2025, which neither source labels, so it is left uncoloured.

Same publisher and same terms question as the front line: published openly by
OCHA; OCHA's HNRP content is published under CC BY 4.0 on
humanitarianaction.info, but the GIS service itself states no licence.
Commercial redistribution should be confirmed with OCHA Ukraine before
monetisation, as for the front line.

## Not used

- **DeepStateMap** — geometry not used anywhere; needs an agreement.
- **Deriving sides from the OCHA line** — not done, by rule.
