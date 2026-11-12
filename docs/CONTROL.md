# Areas of control in Ukraine

Status on 13 November 2026.

The front line OCHA republishes (ISW/CTP) does not say which side of it is
whose, and the atlas never infers that. Areas of control therefore come from a
separate layer whose publisher labels the sides. `src/lib/control.ts` loads it
from the reader's browser, validates it (projection, extent, and a plausible
total area), and draws it as published. Nothing is bundled, interpolated or
derived from the line.

## What is switched on: UN OCHA, HNRP 2026 planning units

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

## What is ready but switched off: ISW/CTP assessed control

ISW and AEI's Critical Threats Project publish "Assessed Russian-controlled
Ukrainian Territory" as polygon layers on a public ArcGIS service — the same
analysts as the front line, updated almost daily. This is the source that
would give a current, DeepStateMap-like picture.

No reuse licence is published for it. Media that republish ISW maps do so with
ISW's permission. So the adapter exists and is off. It switches on, ahead of
the OCHA layer, when the build is given the layer URL:

```
Settings → Secrets and variables → Actions → Variables
VITE_ISW_CONTROL_URL = https://services5.arcgis.com/<org>/ArcGIS/rest/services/<service>/FeatureServer/<layer>
```

Set it only once ISW has agreed in writing, and use the stable layer URL ISW
names in that agreement (their public layers are rotated by date).

### A request you can send (press@understandingwar.org)

> Subject: Permission to display ISW-CTP assessed control of terrain in a
> non-commercial online atlas
>
> I run Global Atlas (https://jackchristianlund.github.io/global-atlas/), a
> free, non-commercial atlas of armed conflicts with every layer dated and
> sourced. It already shows the ISW-CTP front line as republished by UN OCHA,
> credited to ISW and AEI's Critical Threats Project.
>
> I would like to display your "Assessed Russian-controlled Ukrainian
> Territory" layer, fetched live from your ArcGIS service in the reader's
> browser, unaltered, with the assessment date and the credit "Institute for
> the Study of War and AEI's Critical Threats Project" on the map and a link
> to understandingwar.org. Nothing would be resold or stored beyond the
> browser's cache.
>
> Could you confirm whether this is permitted, which layer URL you would like
> us to use, and the attribution you require? If a commercial version is
> launched later, I will ask again before it does.

## Not used

- **DeepStateMap** — geometry not used anywhere; needs an agreement.
- **Deriving sides from the OCHA line** — not done, by rule.
