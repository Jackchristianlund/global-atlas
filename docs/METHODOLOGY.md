# Metode, dekning og begrensninger / Methodology, coverage and limitations

*(Norsk først, English below.)*

## Norsk

### Øyeblikksbilde
Datasettet ble satt sammen **9. november 2026** fra åpne kilder. Hver påstand, hvert tall og hver statuslinje har egne kildereferanser og en egen dato. Appen gjør ingen nettverkskall under kjøring; «datagrundighet»-indikatoren i toppfeltet viser øyeblikksbildets dato og sier uttrykkelig «ikke sanntid».

### Intensitetsnivåer
Fargeskalaen følger radene i Wikipedias *List of ongoing armed conflicts*, som selv tilskriver nivåene ACLED-kuraterte data:

| Nivå | Farge | Drepte per år |
|---|---|---|
| 4 | mørk rød | 10 000+ |
| 3 | rød | 1 000–9 999 |
| 2 | oransje | 100–999 |
| 1 | gul | 1–99 |

Lilla = spenningspunkt uten bekreftet pågående krigføring. Blå = våpenhvile eller fredsprosess. Én rad i referanselisten kan samle en hel konfliktfamilie (f.eks. «Arab–Israeli / Iran–Israel proxy wars» eller «Afghanistan conflicts»); nivået og dødstallene gjelder da familien, ikke den enkelte fronten på kartet. Konfliktpanelet viser alltid hvilken rad nivået er hentet fra. Fargene er en klassifisering fra kilden, ikke en egen måling.

### Merking av utsagn
- **Bekreftet**: rapportert av en navngitt kilde, med dato.
- **Vurdering**: anslag, analyse eller omstridt påstand (f.eks. anklager én part avviser). Teksten sier hvem som hevder og hvem som benekter.
- **Mulig risiko**: ikke inntruffet; varsler som Crisis Groups månedlige konfliktvarsler.

Tall oppgis med hvem som har telt og hvordan, og spenn beholdes når kildene spriker (f.eks. Sudans dødstall 150 000–400 000+). Mangler noe, står det «Ikke tilgjengelig».

### Grenser og omstridte områder
Basiskartet er Natural Earth 1:110m (offentlig eiendom), som tegner **faktisk kontroll**: Krim som del av Russland, Golan som del av Israel, Kashmir etter kontrolllinjene. Dette er en egenskap ved kartgrunnlaget, ikke et standpunkt. Elleve omstridte områder har egne markører med forklaring (Krim, okkuperte deler av Ukraina, Golan, Vestbredden/Gaza, Kashmir, Vest-Sahara, Taiwan, Kosovo, Nord-Kypros, Somaliland, Abkhasia/Sør-Ossetia). Historiske grenser er ikke modellert; tidslinjen sier dette ved valg av tidligere år, og konfliktmarkører i tidligere år farges nøytralt «historisk» i stedet for å projisere dagens status bakover.

### Allianser
Datasettet skiller bindende gjensidige forsvarspakter (NATO art. 5, CSTO art. 4, AES, enkelte bilaterale traktater) fra sikkerhetssamarbeid (SCO, AUKUS), økonomisk/politisk samarbeid (EU, BRICS, ASEAN, AU, GCC) og partnerskap uten forsvarsklausul (USA–Israel, USA–Taiwan, Russland–Iran). Økonomisk medlemskap tegnes aldri som militærallianse. Medlemskap er datert, slik at tidslinjen viser riktig medlemsmasse per år; midlertidige AU-suspensjoner etter kupp er ikke sporet.

### Handel og energi
Sjøruter og landkorridorer er **håndtegnede, illustrative korridorer** – ikke AIS-spor – og appen viser aldri levende skipsposisjoner. Oljevolumer per knutepunkt er EIAs publiserte anslag (2023-brief og STEO august 2026 for 2. kv. 2026). Statuslinjer (Hormuz ~20 % av førkrigsnivå; Suez −40 %) siteres fra Lloyd's List Intelligence med dato.

### Årsak og virkning
Hver kobling i utforskeren er en egen datarad med belegg, mekanisme, dato, kilder og sikkerhet, merket **observert / vurdert / mulig**. Geografisk nærhet skaper aldri en kobling alene; f.eks. er houthienes Rødehavs-angrep knyttet til Gaza-krigen fordi de selv erklærte koblingen, ikke fordi områdene ligger nær hverandre.

### Scenariolaben
Alle scenarier er merket HYPOTETISK. Beregningene er ren geometri langs de illustrative korridorene (storsirkeldistanser, konstant fart), med forutsetningene listet og uten sannsynligheter eller prognoser. Det laben ikke kan si noe om, listes under «Det datasettet ikke kan si noe om».

### Kjente begrensninger
- Utvalg, ikke totaltelling: 44 konflikter/spenningspunkter mot 48 rader i referanselisten; bare et mindretall er beskrevet i dybden.
- Flere poster bygger på Wikipedia-artikler (sekundærkilde, frivillig redigert) – merket i kilderegisteret. Primærkilder (EIA, UNHCR, FN, ISW, Lloyd's List, Crisis Group) er brukt der de var tilgjengelige i innsamlingen.
- Verifiseringsdatoen varierer per post (eldste: Afghanistan–Pakistan, 3. mai 2026; de fleste: oktober–november 2026).
- Handelspartnere per land, sammenlagte tapstall for flere konflikter og alt etter 9. november 2026 mangler.

## English

### Snapshot
The dataset was compiled on **9 November 2026** from open sources. Every statement, figure and status line carries its own source references and date. The app makes no network calls at runtime; the data-freshness indicator shows the snapshot date and explicitly says "not real-time".

### Intensity tiers
Colours follow the rows of Wikipedia's *List of ongoing armed conflicts*, which attributes its tiers to ACLED-curated data: dark red 10,000+ deaths/year; red 1,000–9,999; orange 100–999; yellow 1–99. Purple = flashpoint without confirmed warfare; blue = ceasefire/peace process. One row may group a conflict family; the tier then describes the family, not the single front, and the conflict panel always names the row used. The colours are a classification taken from the source, not a measurement of ours.

### Statement labelling
**Confirmed** (named source, dated), **Assessment** (estimate, analysis or contested claim — the text names who alleges and who denies), **Possible risk** (not occurred). Figures state who counted and how; ranges are kept when sources disagree; gaps are shown as "Not available".

### Borders
The base map (Natural Earth 1:110m, public domain) draws de facto control. Eleven disputed areas carry explanatory markers. Historical borders are not modelled; earlier years show neutral "historic" markers rather than projecting today's status backwards.

### Trade, energy, cause-and-effect, scenarios
Routes are hand-drawn illustrative corridors, never live ship positions. Chokepoint oil volumes are published EIA estimates (2023; Q2 2026). Every impact link records evidence, mechanism, date, confidence and sources, labelled observed/assessed/potential; proximity alone never creates a link. Scenario Lab is marked HYPOTHETICAL, lists its assumptions, computes geometry only, and states what it cannot tell.

### Known limitations
A selection, not a census; several records rely on Wikipedia (labelled as such); verification dates vary by record; bilateral trade statistics and post-snapshot events are absent.

## Fase 3: sporing av koblinger (tillegg)

Sporingen følger kjeden ett dokumentert hopp av gangen. Neste hopp er bare de koblingene som starter
der den gjeldende ender; ingen kobling oppstår av at to ting ligger nær hverandre eller skjedde samtidig.
Hvert hopp beholder sin egen klassifisering (observert / vurdert / mulig), sitt eget belegg og sin egen
kilde, og kjeden som helhet legger ikke til en sterkere påstand enn delene. En kjede av tre observerte
koblinger er altså tre dokumenterte sammenhenger etter hverandre, ikke et bevis for én årsakskjede.

## Fase 2: eksterne datasett (tillegg)

- Integrerte serier vises alltid med attribusjon, årgang og hentetidspunkt ved tallet, og datasettpanelet i appen viser lisens, tilgang, oppdateringstakt, radantall, versjonshistorikk og entiteter som ikke lot seg ISO-kode (holdt utenfor landkoblinger, aldri gjettet).
- OWID-speilene av UCDP/PRIO og SIPRI er historiske årganger (til 2018/2020) og brukes som serier, ikke som dagens status. UCDP-landfilen utelater Syria – det står i kildens egen README og gjengis i appen.
- Grafmotoren avleder kanter deterministisk fra kildebelagte poster (medlemskap, avtaler, sanksjoner, parter, eksponering, geografi, årsak–virkning). Ingen kant oppstår av nærhet alene, og hver kant bærer belegg, avledning, kilde, periode og konfidens.
- ACLED-vilkårene tillater ikke redistribusjon av rådata; kobling finnes, men data blir i så fall liggende server-side og bare aggregater kan publiseres.

## Fluktkorridorer / Displacement corridors (tillegg)

**Norsk.** Korridorene er tall UNHCR har publisert for en oppgitt dato og et oppgitt grunnlag. Grunnlagene
er ikke like: noen tall er registrerte flyktninger, noen er ankomne siden en startdato, noen er
planleggingstall fra en responsplan. Derfor bærer hver korridor sitt eget grunnlag og sin egen dato, og
tall med ulikt grunnlag legges aldri sammen – heller ikke når de gjelder samme land. En korridor krysser
alltid en grense. Internt fordrevne er talt for seg og tegnes ikke som bue; Sudans 9,1 millioner internt
fordrevne står som eget tall med begrunnelsen skrevet ut. En korridor vises først fra det året tallet
gjelder; å bære et tall fra 2026 bakover til 2022 ville gitt feil bilde av året på tidslinjen. Det eneste
unntaket er en korridor du selv har valgt: den blir stående tegnet, og panelet oppgir tallets egen dato.
Linjetykkelsen rangerer korridorene mot hverandre etter kvadratroten av antallet; den er ingen målestokk,
og tallet leses i panelet.

**English.** Corridors are counts UNHCR published for a stated date on a stated basis. The bases differ:
some are registered refugees, some are arrivals since a start date, some are planning figures from a
response plan. Each corridor therefore carries its own basis and date, and figures on different bases are
never added together, not even for the same country. A corridor always crosses a border. Internally
displaced people are counted separately and are not drawn as arcs; Sudan's 9.1 million IDPs appear as a
figure of their own with that reason written out. A corridor appears only from the year its figure refers
to, because carrying a 2026 count back to 2022 would misstate the year on the slider. The one exception is
a corridor you have selected: it stays drawn, and the panel states the figure's own date. Line weight ranks
corridors against each other by the square root of the count; it is not a measuring scale, and the figure
is read from the panel.

## Territoriell kontroll gjennom tid / Territorial control over time (tillegg)

**Norsk.** Hver kontrollpost har en dato for når vurderingen ble kontrollert og, der det er dokumentert, en
dato for når ordningen begynte. Tidslinjen velger den siste vurderingen som gjaldt det året. Finnes ingen
kildebelagt vurdering for et område det året, tegnes området ikke – appen gjetter ikke bakover. «Sist
kontrollert» viser datoen til den nyeste vurderingen som faktisk tegnes, slik at et historisk år aldri
merkes med dagens dato. Grensene tegnes alltid som i dag; historiske grenser er ikke modellert, og det står
på tidslinjen når du går bakover.

**English.** Every control record carries the date its assessment was verified and, where documented, the
date the arrangement began. The timeline picks the latest assessment in force for that year. Where no
sourced assessment exists for a unit in that year, the unit is not drawn: the app does not project today's
map backwards. "Last verified" shows the date of the most recent record actually drawn, so a historical
year is never stamped with today's date. Borders are always drawn as they are today; historical borders are
not modelled, and the timeline says so when you scrub back.

## Hendelseslaget / The incident layer (tillegg)

**Norsk.** Laget viser enkelthendelser fra UCDP Georeferenced Event Dataset, samlet i H3-ruter med
oppløsning etter kamerahøyde. En rute er en ansamling av hendelser, ikke en vurdering av kontroll:
territoriell kontroll er et annet lag med andre kilder, og de to skal ikke leses inn i hverandre. Fargen
følger antall drepte kilden tilskriver rutens hendelser, på logaritmisk skala, fordi noen få ruter ellers
ville gjort alle andre like. Hendelser der kilden ikke oppgir noe anslag telles for seg og leses aldri som
null drepte. Laget er kumulativt til og med året på tidslinjen. Over et tak på 220 000 punkter vises de
nyeste, og det oppgis — alternativet, å tynne jevnt, ville stilltiende fjernet reelle hendelser fra alle
perioder. ACLED-hendelser inngår ikke: vilkårene tillater ikke redistribusjon av rådata, så de blir
liggende server-side. Uten en lokal ingest er laget tomt, og appen sier hvorfor i stedet for å vise noe.

**English.** The layer shows individual events from the UCDP Georeferenced Event Dataset, gathered into H3
bins whose resolution follows the camera height. A bin is a cluster of events, not an assessment of
control: territorial control is a separate layer from separate sources, and the two must not be read into
each other. Colour follows the deaths the source attributes to the bin's events, on a log scale, because a
few bins would otherwise flatten every other one. Events for which the source gives no estimate are
counted separately and never read as zero deaths. The layer is cumulative up to and including the year on
the timeline. Above a cap of 220,000 points the most recent are shown and the window is stated — thinning
evenly would quietly drop real incidents from every period. ACLED events are excluded: its terms do not
permit redistributing raw data, so they stay server-side. Without a local ingest the layer is empty, and
the app says why rather than showing something.
