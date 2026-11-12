# Myanmar at township level

## Why Myanmar is not drawn like the rest of the atlas

Everywhere else the atlas assigns control to first-level administrative units —
oblasts, governorates, states. For Myanmar that unit is useless. Sagaing Region
holds the army's garrison towns and the countryside that surrounds them, and
colouring the whole region either way would be false. Every source that counts
Myanmar counts townships: there are 330, and they are the unit the junta's own
decrees, the resistance's claims and the monitors' tallies all use.

So Myanmar's states stay uncoloured (the `NO_CONTROL` note in
`src/data/territory.ts` still applies) and the detail map carries 330 townships
instead.

## What is drawn, and what each mark asserts

| Layer | Townships | Mark | Asserts |
|---|---:|---|---|
| ULA/AA administration | 15 | filled | an authority that runs courts, schools and health services |
| Wa (UWSA), self-rule since 1989 | 4 | filled | constitutional self-administration, not an active front |
| Wa townships of unclear status | 2 | filled grey | the sources disagree about who runs them |
| Mongla (NDAA, Special Region 4) | 1 | filled | administration under the 1989 ceasefire |
| Martial law (junta decree) | 55 | dashed outline | a legal status declared by the state — **not** control |

Fills and outlines are styled apart on purpose. A fill says somebody
administers the ground. A dashed outline says the state has declared a legal
status over it, which in several places marks ground the army has lost:
14 of the 55 martial-law townships are the ones the Arakan Army administers.

**60 of 330 townships carry a layer. The other 270 carry none.** That is the
finding, not a gap in the work. No source assigns every township to an actor at
a current date, and BTI's 2026 review says plainly that the rival claims are
hard to verify. Clicking an unlayered township says so in as many words.

## How the 55 martial-law townships were arrived at

No single report lists today's 55. The arithmetic closes exactly across three
independent sources:

| Date | Change | Total |
|---|---|---:|
| 23 Apr 2026 | order names 60 townships | 60 |
| 22 Jul 2026 | Falam and one neighbouring Chin township removed | 58 |
| 18 Oct 2026 | Nganzun, Kyaukme and Hsipaw removed | 55 |

IMNA enumerated 59 of the April 60. ISP-Myanmar's per-state breakdown accounts
for the 60th as the single Mandalay township, and DMG names that township as
Nganzun when it is removed in October. DMG's own October article states 55 and
enumerates 54, so the list here is the April order minus the five removals
rather than DMG's enumeration.

Reports differ on whether the second Chin township removed in July was Tedim or
Tonzang. The five Chin townships that remain are the same either way, so the
disagreement does not reach the map.

Four townships are spelled differently in the boundary data than in the
reporting: Depayin/Tabayin, Htilin/Tilin, Momeik/Mongmit, Nganzun/Ngazun.

## How the 15 ULA/AA townships were arrived at

Three independent routes give the same answer, which is why this layer is drawn
as administration rather than as a contested front:

1. The Arakan Army's township-by-township capture record.
2. ISP-Myanmar's finding that the ULA/AA holds 92.6% of Rakhine plus Paletwa.
3. The junta's own martial-law decree, which covers all of Rakhine **except**
   Sittwe, Kyaukpyu and Munaung — the three townships the AA does not hold.

17 Rakhine townships minus those three is 14, plus Paletwa in Chin is 15, which
is the total DMG states.

## The 21% figure

The widely quoted "the junta controls 21%" is **the BBC's study from late
2024**, not a 2026 measurement. It is repeated through 2026 by CFR, SAC-M and
ISP-Myanmar, and several secondary websites attribute it to a 2026 UN Security
Council briefing. No UN document saying it could be verified, and the trackers
that converge on ~21% are resting on the BBC's mapping. The atlas attributes it
to the BBC and dates it 2024, next to ISP-Myanmar's own 38% resistance figure
from end-2025 — a different method, so the two are not two points on one curve.

## Geometry

geoBoundaries `gbOpen` MMR ADM3, **CC BY 4.0**, built from The Myanmar Analytics
Project / USAID, boundary year 2019, 330 units. Built by `scripts/build-mmr.mjs`:

- townships carry no state field in the source, so each is joined to the ADM1
  unit containing its area-weighted centroid; the build fails if any township
  does not land in exactly one state (all 330 do, with no fallback);
- Douglas-Peucker at 0.003° (~330 m), coordinates rounded to 4 decimals
  (~11 m), rings under ~0.25 km² dropped: 95,948 vertices to 43,599, 777 KiB;
- **Htantabin** (Yangon and Bago) and **Minhla** (Bago and Magway) occur twice.
  `township()` in `src/lib/mmr.ts` throws on an ambiguous name rather than
  taking the first match, and a test walks every name in every layer through it.

## Beyond the border

Two named sites carry the chains that leave Myanmar, both tied to a township the
sources name:

- **Panwa–Chipwi, Kachin.** The KIA took the belt in October 2024. Two thirds of
  the terbium and dysprosium processed in China originates in Myanmar, and 98%
  of the world's heavy rare-earth separation happens in China. The terbium price
  move and the UN's count of new mining sites come from trade-press reporting
  and are labelled as such, not as audited production data.
- **Myawaddy, Kayin.** KK Park was raided in October 2025 with 2,000+ detained;
  C4ADS then found 14 of 21 known compounds in the township had built out over
  the same period, and the business moved to smaller sites and on into Cambodia.

## Verification

`scripts/shots-mmr.mjs` opens Myanmar on the detail map and checks that every
layer exists and renders, that Rakhine shows the AA fill and the martial-law
outline on the same ground, that the popup opens and is styled as a panel, and
that the control switch turns the layers off **and back on**.

That last check found a pre-existing defect: `paint()` bails out when MapLibre is
mid-style-update, and a control layer switched off and straight back on stayed
hidden, because the second paint arrived during the style update the first one
caused. It never retried. `RegionMap` now repaints once the map goes idle. The
bug affected the existing control layer on every conflict, not only Myanmar.

## What would make this better

- A licensed, current, township-level control assessment. ISP-Myanmar maps one;
  publishing their geometry needs their agreement, which has not been sought.
- Northern Shan changed hands repeatedly under Chinese mediation in 2025–26
  (Mogok and Momeik returned to the army, the MNDAA out of Lashio). Stitching
  that together from news reports of varying dates would be guesswork, so the
  map carries only the martial-law decree there.
- Kayah, Kayin and Sagaing are where the resistance holds the most ground and
  where the least is documented by name.
