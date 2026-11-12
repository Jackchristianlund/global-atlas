# Sudan: the state that was missing

## The defect

Sudan's war is fought in Kordofan. Until this change, the atlas could not show
that correctly, because its administrative geometry predated the ground.

Natural Earth's 1:10m admin-1 layer — the source for every other country here —
carries **17 Sudanese states and no West Kordofan**. The state was created in
2013 out of North and South Kordofan. Natural Earth never split it, so the
polygon labelled *South Kordofan* still covered Babanusa, El Fula, En Nahud and
the Heglig oilfield: the main front of the current war, the capital of the state
the RSF took in December 2025, and the processing plant nearly all South
Sudanese crude passes through.

The consequence was not a cosmetic one. The atlas said those places were held by
the army, because South Kordofan's control record says the army holds Kadugli.
They are not. They are in West Kordofan, and the RSF holds almost all of it.

Natural Earth's ISO codes for Sudan are wrong in other places too: Central
Darfur is tagged `SD-DE`, and Eastern and Southern Darfur share `SD-DS`.

## The fix

Sudan now comes from **geoBoundaries gbOpen SDN ADM1 (CC BY 3.0 IGO, boundary
year 2020)**, which carries all 18 states with correct ISO 3166-2 codes,
including West Kordofan as `SD-GK`. `scripts/build-admin1.mjs` takes an
`OVERRIDE` map of countries whose geometry does not come from Natural Earth;
every unit in the override file is kept, so the unit whitelist does not have to
list a state before it can appear.

**Abyei is excluded.** geoBoundaries carries it as a nineteenth unit with no ISO
code, because no single state administers it: it is held jointly under the 2005
protocol and claimed by both Sudan and South Sudan. Filing it under either would
be a claim the atlas has no source for, so the build skips any unit without an
ISO code and logs that it did.

Sudan's outer border touches no other admin-1 unit in this dataset, so replacing
its geometry does not pull a shared border apart anywhere.

`tests/territory.test.ts` now checks that Babanusa, El Fula and Heglig resolve to
`SD-GK`, Kadugli to `SD-KS` and El Obeid to `SD-KN`. A wrong boundary is
invisible until something is placed on it; this places something on it.

## West Kordofan's control record

`contested`, RSF primary, army second, as of 9 November 2026.

| Date | Event |
|---|---|
| 1 Dec 2025 | RSF takes the army's 22nd Infantry Division in Babanusa after a two-year siege, giving it near-total control of the state |
| 8 Dec 2025 | RSF takes the Heglig area when the army's 90th Brigade withdraws |
| 12 Dec 2025 | Tripartite deal brokered by President Kiir: South Sudanese forces take over securing the Heglig facility itself |
| 7–8 Nov 2026 | Army and Joint Force take Iyal Bakhit and Umm Marahik, advancing on Al-Khuwei |

The Babanusa takeover is sourced to the Centre for Information Resilience, which
geolocated the video and matched it to satellite imagery, rather than to either
side's claim.

## Why this war reaches past Sudan

Two chains, both from the UN human rights office's July 2026 finding that looted
gold and gum arabic bankroll the war:

- **Gum arabic.** Sudan supplied 70–80% of world exports of crude gum arabic
  before the war, and Kordofan about half of Sudan's production. It binds soft
  drinks, confectionery, cosmetics and pharmaceuticals and has no simple
  substitute. The UN finds the RSF redirects significant quantities from West
  Kordofan and Darfur through South Sudan to Mombasa, so the supply chain runs
  through ground a party to the war holds.
- **South Sudan's oil.** Nearly all South Sudanese crude passes through Heglig.
  Juba now pays the RSF about $4 of the $11 charged per barrel for passage,
  deducted from the share that went to Khartoum before the war. A neighbouring
  country's budget is tied to a party in Sudan's war.

Gold is recorded as a figure rather than a link: 28 tonnes officially exported
via Port Sudan in 2024, about $1.6bn, 48.5% of Sudan's exports. The sources
retrieved do not name a destination country, so the atlas does not either.

## What is still missing

- South Kordofan's record predates the reported sieges of Kadugli and Dilling
  and has not been refreshed against a current source.
- The RSF's parallel government is described in the conflict summary but has no
  seat on the map, because no dated source for it was retrieved.
- Casualty figures remain a range from 150,000 to over 400,000, because no
  authoritative count exists.

## Verification

`scripts/shots-sdn.mjs` opens Sudan on the detail map and probes which unit is
painted under Babanusa, Heglig, Kadugli, El Obeid and El Fasher, so the fix is
confirmed by what the map actually renders rather than by the data alone.
