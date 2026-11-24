# fire-geo: where the legal content comes from

Read on 2026-11-22. `status` words used below and in `data/law.js`: **read** = I opened the document and read the
text · **not loaded** = the site refused automated access (bot challenge or 403), so nothing was read there ·
**repo** = taken from the repo's `monday/` files and not re-read at the source.

Since the declutter pass none of this is on the main screen. It is here, and behind the one "Sources and notes"
button on the page (§ 10 lists what moved there). Berkeley, the fifth place, is § 9.

## 1. The headline: the repo data is out of date, and the page follows the ordinances

`monday/jurisdictions.js` says Fairfax is on the 2022 California Fire Code and clears ladder fuels to 100 ft, and
that the county is on the 2022 code. That was true until 31 Dec 2025. The adopting ordinances say:

| Place | In force since 1 Jan 2026 | Read where |
|---|---|---|
| Fairfax | **Ord. 899**: FMC ch. 8.04 "deleted in its entirety and replaced", adopts the 2025 California Fire Code and 2024 IFC. **Ord. 900**: FMC ch. 8.06, adopts the 2025 California WUI Code and 2024 IWUIC. § 604.6(7): "Ladder fuels shall be removed within **30 feet** of the structure." Both adopted 5 Nov 2025, effective "30 days following its adoption … or January 1, 2026, whichever is later". | Town of Fairfax site: Ord. 900 PDF, the 5 Nov 2025 staff report with Ord. 899 and its redline, the adoption notice of 7 Nov 2025, the news post of 6 Nov 2025 |
| Fairfax before | Ord. 873 (2022): CFC § 4907.4(7) as added by FMC § 8.04.100, "Ladder fuels shall be removed within **100 feet** of the structure." | The redline inside the same staff report |
| County | New Marin County Code ch. 16.16 (chapters 16.16 and 16.17 repealed and merged): 2025 California Fire Code, 2025 California WUI Code. § 604.6(7) 30 ft. § 604.6(8) trees "6\" of diameter or less". § 604.7 adds entry onto private property. "in full force and effective January 1, 2026". | Marin County Board of Supervisors, 4 Nov 2025: staff report and the ordinance text (marin.granicus.com) |
| Ross | Ord. 732 (2025): RMC ch. 14.04, 2025 California Fire Code and 2024 IFC. RMC ch. 14.16: 2025 California WUI Code. § 604.6(7) 30 ft. | The two chapter files on the Town's Title 14 page (the link Andrew gave) |
| San Anselmo | SAMC Title 3 ch. 3 art. 8 (fire code, § 3-3.801 on) and art. 10 (WUI code, § 3-3.1001 on): 2025 codes. § 604.6(7) 30 ft. | Town Council packet of 28 Oct 2025 (first reading of both ordinances, full text) |

The Ross Valley Fire Department's own page (the WUI maps link Andrew gave) says the same: "the Towns of San Anselmo,
Fairfax, and Ross, and unincorporated Sleepy Hollow, have adopted the 2025 California Fire Code and the 2025
California Wildland Urban Interface Code with amendments."

So the page shows the law as adopted. For Fairfax and the county it says in place what the rule was before
("100 ft until 31 Dec 2025", "Until 31 Dec 2025: 2022 California Fire Code · Ord. 873"). The towns now share one
template on purpose: both staff reports say the Marin fire agencies met to write "standard ordinance language".

Other things in the repo data that the ordinances contradict (none of these are repeated on the page):

- "San Anselmo is the only one of the three with these explicit remodel triggers." Ross (§ 14.04.100), Fairfax
  (Ord. 899) and the county all carry the same §§ 903.2.2 and 903.2.2.1.
- "the county says 6 inches where all three towns say 8. A tree the towns would leave can be required out here."
  The direction is reversed. The towns can require trees up to 8 in. out, the county only up to 6 in.
- The repo's "unincorporated" pin (-122.5760, 38.0040) is inside the Sleepy Hollow Fire Protection District, which
  has its own code (Ordinance 2025-04) and is served by Ross Valley Fire. The county shortcut here is a different
  point (-122.6050, 37.9690), and Sleepy Hollow is named on the map as "not carried".
- Fairfax "Vegetation Management Plan for landscape modifications" (§ 4906.3) and the Fairfax "entry power" on
  roadsides (§ 4907.5) are 2022 text. Ord. 900 has neither. The county's 2025 text does keep the entry power.
- For a vegetation finding in Ross the nuisance route is RMC § 14.16.040 (WUI code), not § 14.04.120 (fire code).
  Enforcement rows are not shown on the page.

`data/jurisdictions.js` and `data/content.js` are byte-for-byte copies of the repo files (`test.js` checks). The
page takes the basemap, the town polygons, the shortcut pins and the corrections from them. It takes the code rows
from `data/law.js`.

## 2. Every statement on the page, and its source

### Local rows, ladder fuel photo (`data/law.js` → `rows.ladder.local`)

| Row | Words | Ross | San Anselmo | Fairfax | County |
|---|---|---|---|---|---|
| ladder-reach, 30 ft | "Ladder fuels shall be removed within 30 feet of the structure." | read (ch. 14.16) | read (packet) | read (Ord. 900) | read (ordinance text) |
| hazard-veg, 100 ft | "Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet when topographic or combustible vegetative types necessitate removal as determined by the Fire Code Official." | read | read | read | read |
| canopy, 8 in. / 6 in. | "When required by the Fire Code Official, cut and remove trees that are 8\" [county: 6\"] of diameter or less at breast height … to achieve canopy separation within 30 feet of the structure." | read | read | read | read |
| roadside, 10 ft | "The Fire Code Official is authorized to cause areas within 10 feet (3048 cm) on each side of portions of highways, fire apparatus access roads … and driveways … to be cleared of flammable vegetation and other combustible growth." County adds the entry sentence. Trimmed with "…", not reworded. | read | read | read | read |
| brush-nuisance | FMC ch. 8.24, dry brush as a public nuisance | | | **repo** (Fairfax code library not loaded) | |
| fire-hazard | CFC § 325.5.2 as added by MCC § 16.16.040: "No person … shall allow to exist thereon any hazardous rubbish or weeds, trees, or other vegetation, which constitutes a fire hazard." | | | | read |

### Local rows, sprinkler photo

| Row | Words | Source |
|---|---|---|
| required-system | § 903.2.1 as added locally: "An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures." Towns list two exceptions, the county five. Town WUI Code § 613.2 quoted for the three towns. | read in all four |
| remodel-triggers | §§ 903.2.2, 903.2.2.1 (10% in buildings over 3,000 sq ft, 50% or substantial remodel, any 36 months). County: "In other than R-3 occupancies". | read in all four |
| out-of-service | § 901.7 as amended, ending "This section shall also apply to residential fire sprinkler systems." Trimmed with "…". | read in all four |

### Statewide rows

| Row | Words | Source |
|---|---|---|
| maintenance, CFC § 901.6 | "Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced." | **repo** (`sprinkler.md`, `jurisdictions.js`). codes.iccsafe.org: not loaded |
| itm-standard, CFC § 903.5 and NFPA 25 § 5.2.1.1.1 | maintenance to the adopted standards; Title 19 § 904 references the California-amended 2013 NFPA 25; later editions ask about paint "detrimental" to performance | **repo** |
| residential, 2025 CRC § R309.3.2.6 | painting, caulking or modifying sprinklers prohibited; affected sprinklers replaced | **repo** |
| state-defensible, PRC § 4290 and Gov. Code §§ 51175–51189 | defensible space in State Responsibility Areas and in WUI areas and very high fire hazard severity zones of Local Responsibility Areas | **repo** (the wording is the repo's county row). leginfo.legislature.ca.gov: not loaded. No distance is stated on the page, because none was verified |

The note under the ladder photo's statewide block ("The 30 ft rule is local text: every ordinance here adds
§ 604.6 …") is verified: all four ordinances say "Section 604.6 is hereby added". The state chapter 6 itself was
not read.

### Facts above the local rows

Agency, fire code, WUI code with their sections: Ross **read** (§§ 14.04.010, 14.04.020, ch. 14.16; "Ord. 732
(2025)" from the chapter's editor's note). Fairfax **read** (§§ 8.04.010, 8.04.020, 8.06.010; Ord. 899, 900).
San Anselmo sections **read** in the packet; the ordinance numbers 2025-1194 and 2025-1195 and the adoption date
are **repo** (the packet has a blank number and schedules adoption for 10 Nov 2025). County sections **read**; the
ordinance number is **not confirmed** (the text says "ORDINANCE NO. XXXX"), and I did not find the record of the
18 Nov 2025 vote. The inspector's `ladderfuel.md` already cites the county rule as "Section 604.6(7)", which is the
new numbering.

Not carried: Sleepy Hollow (named from the Ross Valley Fire map; its Ordinance 2025-04 page at shfpd.org returned
404), San Rafael and Larkspur (agency names are the repo's).

## 3. What would not load

| Source | Result |
|---|---|
| codes.iccsafe.org/content/CAFC2025P1 and CAWUIC2025P1 (state codes) | 403 to the fetch tool. Not retried in a browser. State text on the page is the repo's, labelled "not re-read" |
| codelibrary.amlegal.com (Fairfax ch. 8.04) | 403 and a "verify you are not a bot" page, also in headless Chrome. Stopped there. The Fairfax ordinances were read on townoffairfaxca.gov instead. A search result suggests this page still showed the 2022 text |
| library.municode.com (San Anselmo) | same bot check. The packet with both ordinances was read instead |
| leginfo.legislature.ca.gov (PRC § 4291, Gov. Code § 51182) | same bot check |
| shfpd.org/about-us/fire-code | 404 |
| Marin County Ord. 3775 PDF (2022) | 403. The 2022 county rows are not used |

The documents I did read are saved as text in `sources/text/` (the downloads are in `sources/<name>/`).

## 4. Verdict logic

Mark: red square "Violation" · yellow triangle "Inspector's call" · green circle "Clear". The overall verdict is
the worst row. Inputs: photo, place, assumed distance `d` (ladder photo only, 0 to 150 ft, default 20), and `scope`:
whether the pin is `in` a mapped fire hazard zone or WUI area, `out` of them, or `unknown` (no layer for that place).

| Row | Rule, and why |
|---|---|
| ladder-reach | d > 30 → green (outside the stated reach). d ≤ 30 and scope `in` → red (the inspector confirmed the ladder fuel). d ≤ 30 and scope `out` or `unknown` → yellow: § 604.6 is written for "lands within specific Wildland Urban Interface areas", so it turns on the parcel's designation |
| hazard-veg | yellow. d ≤ 100: is the dry material "hazardous vegetation". d > 100: only if the official extends the reach to 200 ft |
| canopy | d ≤ 30 → yellow ("When required by the Fire Code Official"). d > 30 → green |
| roadside | yellow ("is authorized to": a power, and the photograph shows no road-clearance violation) |
| brush-nuisance, fire-hazard, state-defensible | yellow, each says what it depends on |
| maintenance | red (the inspector confirmed the painted head and specified replacement) |
| itm-standard, residential, required-system, remodel-triggers, out-of-service | yellow (NFPA 25 edition; occupancy; whether the system is a required one; permit history) |

Expected values, as tested in `test.js`:

| Photo | Place, zone | 20 ft | 60 ft | 120 ft |
|---|---|---|---|---|
| Ladder | Ross (all Moderate zone) | red | yellow (30 ft row green) | yellow |
| Ladder | San Anselmo, in a zone | red | yellow | yellow |
| Ladder | San Anselmo, outside the zones | yellow (30 ft row yellow) | yellow (30 ft row green) | yellow |
| Ladder | Fairfax, in a zone | red | yellow | yellow |
| Ladder | Unincorporated | yellow | yellow | yellow |
| Ladder | San Rafael, Larkspur, Sleepy Hollow | yellow (statewide row only) | yellow | yellow |
| Sprinkler | anywhere | red | red | red |

The boundary is inclusive: 30 ft is red, 31 ft is green. The ladder photo is never green overall, because the hedge
borders a road and the roadside power is always the official's call. Rows do turn green.

## 5. The map

- Basemap and town limits: the repo's (`rossvalley.jpg`, OpenStreetMap polygons). Checked against the Ross Valley
  Fire map's own "Jurisdictional Boundary" layer: 99.0 to 99.5% of sampled points agree.
- Hazard zones and WUI areas: **real**, from the public ArcGIS web map embedded on the Ross Valley Fire page Andrew
  linked (item `d89835e0e7f345aea879327830d3605c`, "Fire Hazard Severity Zones (FHSZ) & Wildland Urban Interface
  (WUI) Maps for the Ross Valley", last modified 2026-07-09). Layers `Fairfax_Merge` (High, Moderate, WUI),
  `SanAnselmo_Merge` (Moderate, WUI), `MRN_FireJurisdictions_RVFD` ("Ross Moderate": the whole town) and the
  Sleepy Hollow district outline. `tools/build-hazard.js` simplifies them to about 6 m and writes `data/hazard.js`.
  Share of each town inside a mapped polygon: Ross 100% (by the layer's definition), Fairfax 98.5%, San Anselmo 75%.
- The map has no WUI layer of its own for Ross, and no layers for county land outside Sleepy Hollow. There the page
  says "Not on the Ross Valley Fire map" and the 30 ft row is yellow.
- In the Sleepy Hollow layer the legend labels "High" and "WUI" are swapped by the map's own renderer. Sleepy Hollow
  is not carried, so this does not reach a verdict. Only its outline is drawn.
- Simplified polygons are not parcel data. The sheet says "Read the parcel on that map before citing."
- **How the zones are drawn (changed in the declutter pass).** They were a 45 degree hatch. Andrew reported a pin in
  central San Anselmo (-122.5692, 37.9820) that read "Outside the mapped zones" while the map looked hatched there.
  The hit test and the drawing agreed: that point is outside every polygon, and no hatch was drawn at it (checked
  three ways: `isPointInFill` on the drawn shape, the pixel difference with the zone layer switched off, and the
  hit-test grid laid over the picture). What looked like hatching was the basemap: the street grid in central San
  Anselmo runs on the same diagonal. So the zones are now a soft tint with a fine stipple, which cannot be mistaken
  for streets. `test.js` samples a grid over the three towns (22,287 points) and compares the hit test with the drawn
  shape: no disagreement away from an edge.
- One real fault was found on the way: `tools/build-hazard.js` dropped the one hole in the source polygons (Fairfax,
  Moderate zone, about 10,465 m² at -122.58716, 37.99374). It is kept now (`hazardZones[].holes`). That point is still
  inside the WUI polygon, so no verdict changed. San Anselmo is still 75.2% inside a mapped polygon.

## 6. The before / after pictures

- `tools/register.js` matches about 200 to 250 small patches between each generated "after" image and the photograph
  and fits scale and shift per axis. Ladder images: the generator returned 768 × 1376 for an 820 × 1474 photograph,
  about 0.9% zoomed in and 1.5 px shifted. Residual after registration: 0.3 px at half size. Sprinkler: 1.1% wider,
  1.8% shorter, residual 0.4 px. The page draws the after image through that fit, so the divider lines up.
- The outline is the largest connected region where the registered pair differs after a blur, closed, opened,
  traced along pixel edges, simplified and smoothed (54 to 66 points; 24 for the sprinkler). I checked each on
  `tools/work/<id>-outline.png` and `-outline-after.png`. Labels are hand-placed in clear space.
- Weak spot: for correction C (low-fuel landscape) the generated image also rebuilds the stone wall and removes the
  foreground succulents, which the correction does not ask for. The outline shows that, because it is measured.

## 7. Questions for Andrew

1. **Fairfax and the county.** The page follows the 2025 ordinances, so the towns agree on 30 ft and the big
   30 → 100 contrast is history. If you want the old contrast on screen as "before 2026", it needs a second, clearly
   dated data set. Ross's and San Anselmo's pre-2026 text was not collected.
2. **The mapped-zone rule.** I read § 604.6 as reaching land in the mapped hazard zones and WUI areas, and made the
   30 ft row yellow outside them. An inspector should confirm that reading.
3. **Default distance.** 20 ft, because the inspector's note says "within 30 ft". At 60 ft every place is yellow.
4. **County ordinance number and the 18 Nov 2025 vote** are not confirmed. San Anselmo's ordinance numbers are the repo's.
5. **State text.** Nothing from the two ICC links could be read. Someone with a browser session there should check
   the three statewide sprinkler rows and say whether the state WUI code has a ladder-fuel provision of its own.
6. **Correction C's picture** changes more than the correction describes. Regenerate it, or keep it as is.

## 8. Rebuilding the generated files

```
node tools/build-hazard.js      # data/hazard.js from sources/rvfd-gis/ (the layer downloads)
node tools/register.js          # data/outlines.js + tools/work/*.png  (needs macOS sips for the JPEG)
node tools/shots.js <name>      # every state, crossings and contact sheets into shots/<name>/
node tools/corridor-fetch.js    # the corridor's OpenStreetMap data, cached in tools/work/corridor-osm/ (asks nothing twice)
node tools/corridor-draw.js     # assets/corridor.jpg + .json, data/corridor.js
node tools/sprinkler-swap.js    # measures the new sprinkler photograph against the old one (--write installs)
node test.js                    # 144 checks with the Gleb kit on (the default)
node test.js --plain            # the same with the kit off
node data/city4/tools/check.js  # the researcher's own check of the Berkeley handoff (run from data/city4; test.js runs it too)
```

## 9. Berkeley, the fifth place

Andrew asked for one more city with a meaningfully different fire code, after noticing that the three Ross Valley
towns barely differ. A researcher chose the City of Berkeley and prepared `data/city4/` (see its `HANDOFF.md`):
Ordinance 7,991-N.S. (BMC ch. 19.49, the Berkeley WUI Code) and Ordinance 7,990-N.S. (BMC ch. 19.48, the Berkeley
Fire Code), second readings adopted 2 Dec 2025, in force 1 Jan 2026, read on berkeleyca.gov. I re-read § 604.3.1 and
§ 604.3.2 in the saved text (`data/city4/sources/item41-2025-12-02.txt`) before wiring it in. The handoff's own
check (`tools/check.js`, 861 checks, every quoted passage found in the downloaded text) passes and is run by `test.js`.

**The contrast, in one sentence.** In Berkeley's two hill mitigation areas the 5 ft next to a house must be kept
free of anything that burns (§ 604.3.2(1)(a), "Zone 0"), which the Ross Valley towns do not ask of an existing
property, and Berkeley's zones run out to 100 ft with spacing rules the Ross Valley text does not have.

**What is the same, and is not shown as a difference:** the code edition (2025, in force the same day), the 30 ft
edge of the ladder-fuel rule, the 10 ft roadside strip. Berkeley has no plant ban.

**Where the rules have force.** § 604.3.1 opens "Within the locally designated Very High Fire Hazard Severity Zone",
and § 604.3.2 applies to "the Grizzly Peak Mitigation Area and Panoramic Mitigation Area". So the verdict in
Berkeley depends on which of three mapped zones the pin is in (the City's own map service, layers 2, 3 and 4,
simplified to about 6 m): a mitigation area, the Very High zone, or the High zone. The mitigation areas lie inside
the Very High zone, so they are tested first. Outside all three is the flatlands.

| Row | Rule |
|---|---|
| zone-zero (5 ft) | In a mitigation area: red at 5 ft or less, green beyond. Elsewhere in Berkeley: green, "Zone 0 is required only in the two mitigation areas" |
| ladder-reach (30 ft) | Beyond 30 ft: green. Within 30 ft: red in the Very High zone (mitigation areas included), yellow outside it |
| vertical-spacing (100 ft) | Beyond 100 ft: green. Within: **yellow at every distance**, "Depends on whether the inspector accepts the continuous canopy method" |
| shrub-spacing | Beyond 100 ft: green. Within: yellow (the gap is 2, 4 or 6 times the shrub height, by slope) |
| hazard-veg (100 ft) | Beyond 100 ft: green (Berkeley has no extension to 200 ft). Within: yellow |
| roadside, compliance-plan, and the four sprinkler rows | yellow, each says what it depends on |

Expected overall verdict on the ladder photo, as tested in `test.js` (22 cases):

| Zone | 3 ft | 20 ft | 60 ft | 120 ft |
|---|---|---|---|---|
| Mitigation area | red, "Inside Zone 0, within 5 ft." | red, "Ladder fuel within 30 ft." | yellow, "Past 30 ft. Spacing still applies." | yellow, "Past 100 ft. Zones end there." |
| Very High zone | red (ladder row; Zone 0 row green) | red | yellow | yellow |
| High zone | yellow, "Outside the Very High zone." | yellow | yellow | yellow |
| Flatlands | yellow | yellow | yellow | yellow |
| Ross, for comparison | red | red | yellow | yellow |

Boundaries are inclusive: 5 ft is inside Zone 0, 30 ft is inside the ladder-fuel reach, 100 ft is inside Zone 2.
The sprinkler photo is red in Berkeley as everywhere (the statewide maintenance row); its four local rows are yellow.

**Where I departed from the handoff, and why.**

1. *The spacing row is never red.* The handoff made it red inside 100 ft in the Very High zone. The coordinator
   decided it is the inspector's call between 30 and 100 ft, because (7)(e) lets the owner use the "Fuel Separation"
   method, the "Continuous Tree Canopy" method or both. I applied the same reading inside 30 ft: it is the same
   sentence of the ordinance, and the handoff's own note on that row says "an inspector should confirm it". The
   overall verdict inside 30 ft does not change, because the ladder-fuel row is red there on its own. The handoff's
   `verdictRules` in `data/city4/law.js` are untouched (its check still tests them); the app's rules are in
   `lib/codes.js`.
2. *Shorter sentences.* The handoff's headline and difference sentences run to two sentences and up to 150
   characters. The page keeps the declutter rule: a headline of six words at most and one plain difference sentence.
   The meaning is the handoff's; the words are shorter ("Inside Zone 0, within 5 ft.").
3. *Coming back from Berkeley* the sentence says what the place arrived in asks for ("In Ross the rule is ladder
   fuels within 30 ft."), not what it lacks. Ross's code does name Zone 0, as a zone to be drawn on the vegetation
   plan for new construction and substantial remodels (§ 603.3.1), so "Ross has no Zone 0" would be too strong. What
   Ross does not have is a standing duty on an existing property to keep those 5 ft clear: its § 604.6 list has none.
4. *Outside the Very High zone* the handoff's reason was "Depends on state defensible-space law". In the flatlands
   that law may not apply either, so the reason there is "Depends on the parcel", as in the Ross Valley.
5. *What the main view shows of each rule.* The handoff's texts are long (several quoted passages each). The chosen
   rule shows one passage, cut out of the handoff's text word for word (`brief`), and the citation without the
   ordinance number (`citeShort`). The whole text and the full citation are in the sheet. Three rows sit in
   § 604.3.1(7); the one-line row shows the subsection and the chosen rule shows the letters.
6. *"Tree and shrub spacing"* instead of the handoff's "Limbing and spacing": plainer.
7. *"In parts of Berkeley's hills nothing that burns may stand within 5 ft of the house."* The sentence first
   proposed said "In Berkeley's hills". Zone 0 is required in the two mitigation areas only, and most of the hills
   are outside them (the High zone, and part of the Very High zone), so the sentence says "In parts of".

**One statement is not verified** and is shown only in the sheet, marked as such: that the State Board of Forestry
adopted an emergency Zone 0 regulation on 19 Aug 2026. The researcher took it from a law firm's summary, not from
the Board. It supports no verdict.

**The compliance-plan row** ("Time to comply") is Berkeley Fire Department guidance (FireSafe Berkeley Landscape
Guide, 2026, p. 17), not code text. The row's citation says so.

**The map.** Berkeley's picture (`data/city4/basemap.jpg`) was drawn by the researcher from OpenStreetMap data,
because the tile server refused the requests. It is lighter than the Ross Valley tiles (white streets on pale
blocks), so it gets a firmer version of the same grey treatment. Both pictures share one ground scale, so they sit
in one coordinate system: Berkeley's top-left corner is at world pixel (4768, 2070). The three zones are told apart
in ink alone: a plain tint for High, dots for Very High, a darker tint with a denser dot for the mitigation areas,
each with its edge drawn. Everything is clipped to the city limit. `test.js` compares the drawn zones with the hit
test at 37,857 grid points: no disagreement away from an edge. Past the city limit the picture also shows Albany,
Kensington, Oakland and the regional park: there the panel says "Outside Berkeley · not covered here" and shows
only the statewide rows. No other city's rules are made up.

**The trip.** Ross to the Berkeley pin is 27.7 km at a bearing of 106 degrees (recomputed in `lib/geo.js`). The
Berkeley pill flies there in one camera move of about 1.4 s: it pulls back to about a quarter scale, travels
east-southeast and comes down on Berkeley, with the pin gliding along as the one thing to watch. There is no picture
of the land between (San Rafael, the Bay, Richmond), so the ground there is plain and nothing is located on the way:
the panel changes once, on landing. A Ross Valley pill flies back, and a trip can be turned round in mid-air.

## 10. What the declutter pass took off the main view, and where it went

Andrew: "too much text, too dense, too complex. needs to look future forward, clean, sleek". The main view now
shows the verdict with a reason of six words at most, one line per rule (verdict mark, name and value as one
phrase, a quiet section number), and for the ONE chosen rule its reason, citation and the ordinance's words.
Words on screen at 1440 × 900 went from 443 to 136 (Ross) and 193 (Berkeley, which has three more rules).

Removed outright (nothing replaces them): the sentence under the distance control; the helper card and every other
how-to sentence; the "At the pin …" line under the map; the "Here" label over the town name; the two standing tags
under the correction name (`standing` is still in the data); the captions under the photograph.

Moved behind the one "Sources and notes" button (a sheet), and kept in this file:

- the status of every source ("read on 22 Nov 2026", "this site would not open", "from the project notes, not
  re-read at the source") and the links to the documents;
- the history: what Fairfax and the county enforced until 31 Dec 2025 (§ 1);
- for the chosen rule: how it applies to this photograph, and what is still to confirm;
- the statewide note: the 30 ft ladder-fuel rule is local text, and the state chapter could not be opened;
- the map note: the dotted areas are simplified from the fire agency's map, "Read the parcel on that map before
  citing", and the © OpenStreetMap credit in full (the map itself carries a small "© OpenStreetMap" in its corner);
- the statement that this is a demonstration: "A demonstration. Each verdict is this app's reading of the cited
  text, and the inspector decides. Yellow rows are judgement calls: inspectors may read them differently.", and that
  the distance to the building is assumed and the "after" pictures are illustrations.

## 11. The map between the two regions (the corridor)

Andrew found the first trip to Berkeley "cheap": it pulled back to a quarter scale over plain ground. It now slides
over one continuous map. `assets/corridor.jpg` (3160 x 1976, 453 KB) covers everything a trip can pass over: the Ross
Valley, San Rafael, the Bay with the Richmond-San Rafael Bridge, Richmond, El Cerrito, Albany and Berkeley, with a
margin (world pixels -700..7200 by -760..4180, lon -122.672..-122.178, lat 37.807..38.051), at 0.4 picture pixels per
world pixel.

- **How it was made.** The same way as the Berkeley picture (`data/city4/HANDOFF.md`): OpenStreetMap vector data
  through the Overpass API, because the tile server refuses automated requests. Five queries, 53 MB of JSON, a generic
  client name, each answer cached under `tools/work/corridor-osm/` with its query beside it (OSM base timestamp
  2026-11-23T06:40Z): main roads, rail, coastline and town names; lakes, woods, parks and open space; built-up land;
  ordinary streets in two halves, geometry only. `tools/corridor-draw.js` draws it on a canvas in headless Chrome in
  the Berkeley picture's palette. The sea is found by drawing the coastline on a mask and flooding from four points of
  open water; the script refuses to write if any of fifteen known land and water points comes out wrong.
- **Registration.** Same Web Mercator maths as `lib/geo.js`, so both regional pictures sit on it exactly. `test.js`
  checks where things are drawn (the same coordinate lands on the same screen point through either layer, to under half
  a pixel) and what is drawn (the water in each regional picture overlaps the corridor's best with no shift at all).
- **What the drawing does not match.** The Ross Valley picture is made of map tiles in a richer style: hill shading,
  icons, many more names, every path. The corridor has none of those, so as the Ross Valley dissolves into it the
  shading and small names go. Names are not baked in: seventeen towns and two bays are drawn by the page in its own
  label style, only while pulled back, and never at the same time as a region's own names. Creeks narrower than about
  35 m are not flooded as sea. Minor streets are hairlines.
- **The trip.** One transform on one world container. A fly-to curve (van Wijk and Nuij) with its pull-back tuned to
  0.52 of the regional scale, 1.8 s, eased at both ends. The corridor is decoded when the page is idle and drawn once
  into a canvas with the page's map treatment baked in, so nothing is fetched, decoded or rastered during a trip. If
  the pill is pressed before that, it shows it is working and the trip starts when the picture is ready. Measured
  (`test.js`, this machine): 110 frames in 1.83 s, median 16.7 ms, worst 16.8 ms, none over 20 ms, the same on the
  way back and when turned round in mid-air.

## 12. The new sprinkler photograph

Andrew sent a wider, sharper photograph of the same painted sprinkler (`team-input/sprinkler-new.png`, 428 x 710,
upright). `tools/sprinkler-swap.js` did the swap.

- **Is it the same shot?** Yes, but the old picture is not a crop of it: the old one is wider than the new one is. Its
  middle was found in the new picture at 1.414 new pixels per old pixel, with a correlation of 0.912 and a residual of
  11.9 grey levels over the shared middle (the new file is sharper and differently compressed, so it is not higher).
  The old frame covers x -22 to 463, y 184 to 557 of the new picture.
- **Boxes.** The three annotation boxes were moved through that fit and checked on an overlay
  (`tools/work/sprinkler-new-boxes.png`): they sit on the frame arms, the deflector and the stained trim.
- **The "after".** No image was generated. The new after picture is the new photograph with only the replaced head
  taken from the earlier after picture (drawn through both registrations), under a soft mask about 9 px wider than the
  measured change, with its exposure matched to the photograph around it (gain 1.08 to 1.10 per channel). At 100% I
  could not see a seam. It is still labelled "After · illustrative". The pair registers to 0.2 px, and the outline was
  measured again.
- The old files are kept: `assets/sprinkler.old.png`, `assets/after/sprinkler-a-replacement.old.jpg`.
  `data/content.js` now differs from the repo snapshot in four lines: the picture's shape and the three boxes.

## 13. The daisy chain, the third photograph

Added 2026-11-23. A field photograph (`assets/daisychain.png`, 517 x 377) of two relocatable power taps on a
carpeted floor. Unlike the other two it has **no `monday/*.md` analysis behind it**: there is no inspector's
gold-standard write-up to reflow, so every statement in `data/content.js` under `daisy` is either read off the
photograph or quoted from the code text below, and everything the photograph cannot settle is tagged `verify`.

### What the photograph shows, and how that was established

The direction of the chain is the one thing that had to be right, and it is not obvious at a glance. The
photograph was enlarged in three places and read: the cream supply cord leaving the **right-hand end of the lower
cream six-outlet tap** curves up across the carpet and ends in a cream right-angle cord cap occupying the
**last outlet of the upper white BELKIN tap**. So the lower tap is the downstream device. The Belkin's own cord
leaves its left-hand end and goes out of frame; where it ends is not shown and is not claimed.

### Where the law comes from

| Section | What it says | Read where |
|---|---|---|
| **CFC § 603.5.2** | "Relocatable power taps and current taps shall be directly connected to a permanently installed receptacle." Two exceptions: up to five taps connected together for temporary use supplying electronic equipment in a Group A occupancy or a Group B meeting room; and taps used for 90 days or less to test the performance of the devices. | up.codes, 2025 California Fire Code ch. 6, read 2026-11-23 (`SRC.cfc6`). The ICC site is still blocked (§ 3). |
| **CFC § 603.5.1** | Relocatable power taps listed to UL 1363, current taps to UL 498A. | the same |
| **CFC § 603.5.3** | Tap cords not run through walls, ceilings or floors, under doors or floor coverings, nor subject to environmental or physical damage. | the same |
| **CFC § 603.6** | Extension cords are not a substitute for permanent wiring, listed to UL 817, used only with portable appliances. | the same, and transcribed independently in `../ai/codes.js` (`cfc-603-6`, read 2026-11-08) |
| **CFC § 603.2** | "Conditions that constitute an electrical shock or fire hazard shall be abated." | `../ai/codes.js` (`cfc-603-4`) |

**Chapter 6 was renumbered in the 2025 edition.** These sections carried § 605.x numbers before it, and § 605 is
now Fuel-Fired Appliances. `../ai/codes.js` `meta.superseded.map` records the two that matter: § 605.3 (electrical
working space) is now § 603.4, and § 605.4 (extension cords) is now § 603.6. The 2022 section number for the
direct-connection rule was **not** read, so where Fairfax and the county were on the 2022 edition the row says so
and stops there rather than guessing a number.

### What changes at a town line, and what does not

This is the first photograph where the rule itself is the same everywhere: it is state text, adopted whole. The
local layer is therefore about *carriage and consequence*, not about the requirement:

| | Carries chapter 6 | Amends chapter 6 | Penalty clause |
|---|---|---|---|
| Ross | RMC § 14.04.010 · Ord. 732 | no | CFC **§ 113.4** as amended by RMC § 14.04.140 |
| San Anselmo | SAMC § 3-3.801 · Ord. 2025-1194 | **yes** — adds §§ 605.11.3–605.11.5 (PV conduit, disconnect, warning sign) | CFC **§§ 109.4, 111.4**, penalties at SAMC § 3-3.812 |
| Fairfax | FMC § 8.04.010 · Ord. 899 (2022 CFC until 31 Dec 2025, Ord. 873) | no | CFC **§ 113.4** as amended by FMC § 8.04.100 |
| Unincorporated | MCC § 16.16.010 · Ord. 3837 (2022 CFC until 31 Dec 2025, Ord. 3775) | no | CFC **§ 110.4** as amended by MCC § 16.16.040 |
| Berkeley | BMC § 19.48.010 · Ord. 7,990-N.S. (2022 CFC until 31 Dec 2025) | not read | not read |

Three different section numbers for the same penalty clause, and San Anselmo is different again on the figures:
§ 109.4 is amended to [misdemeanor] [$500.00] [90 days] where the others say 180 days, § 111.4 fines are set at
not less than $500.00 and not more than $1,500.00, and SAMC § 3-3.812 adds an administrative route — a first
citation in any 12 months is a **$150 civil penalty** payable to Ross Valley Fire plus the actual cost of the
inspections needed to gain compliance.

**A defect in a source, recorded not corrected.** San Anselmo's ordinance numbers its photovoltaic amendments into
§ 605.11, which in the 2025 edition is part of Fuel-Fired Appliances rather than the electrical section. It was
read as introduced in the Council packet of 28 Oct 2025. The row says this and asks for the adopted ordinance to be
checked; the numbering is not silently corrected here.

### The verdict

`tapDirect` in `lib/codes.js` returns **red** in every place, from the statewide row: the photograph shows the
connection itself, so it is as settled as the painted head. The two § 603.5.2 exceptions turn on the occupancy and
on how long the arrangement has stood, and the photograph establishes neither, so they sit in the row's `open` and
in `uncertainty` rather than softening the verdict. The three local rows are the inspector's call except
`carries-ch6`, which is green: it is not a finding against anyone, it says which code the citation is written
under. The headline reason is "A tap fed from a tap." (six words, as the others).

### The photograph

`assets/daisychain.jpg` (1086 x 1448), supplied 2026-11-23, with the untouched original beside it as
`assets/daisychain-src.png`. It replaced two earlier attempts and is better than either: upright like the other two
inspections, and it carries the whole chain in one frame, which is the thing the first photograph could not do.

Read off it: a wall receptacle at the top left, a **duplex**, with a thick grey cord in its **lower** socket and the
**upper socket empty**. That grey cord runs down to a dark grey tap lying against the cabinet plinth, so that tap is
correctly supplied. A pale cord is plugged into one of the grey tap's sockets and runs down the carpet to a pale
tap in the foreground, with a lit red switch and a plug-in transformer in it. So the pale tap is fed by the grey
tap rather than by the wall, and that one connection is the finding.

**An earlier pass extended a different photograph by outpainting, and that is gone.** It was recorded here as such
while it stood; it is recorded here as removed now. No generated frame stands in for the inspector's photograph.

The annotation boxes in `data/content.js` were measured by cropping and enlarging this photograph, not placed by a
model: a model's boxes for the earlier frame sat about four per cent too high, and that is why they are measured.

### What the corrections actually are

Two earlier passes got this wrong. The first drew a **second wall receptacle appearing in the wall** for the
required correction, as though the answer to a daisy chain were an electrician. It is not. The receptacle in the
photograph is a duplex and its upper socket is empty, so the correction is to use the socket that is already there.

The three are now named as the inspector asked for them, and they follow the order the published guidance gives,
which was checked rather than assumed
([NFPA](https://www.nfpa.org/news-blogs-and-articles/blogs/2018/04/20/nfpa-1-electrical-fire-safety-and-relocatable-power-taps-power-strips-firecodefridays),
[Office of Compliance](https://www.ocwr.gov/wp-content/uploads/2016/09/fastfacts_power_strips.pdf)):

1. **Plug both power strips directly into the same wall outlet.** Required. Free, and needs nothing but a minute.
2. **Replace both strips with one longer power strip.** The guidance puts it as one bigger tap of adequate rating
   and reach rather than two in a row. Needs the ratings, which the photograph does not give.
3. **Install an additional permanent electrical outlet.** The permanent fix, and the only one needing an
   electrician. Tagged a proposal, and it says in terms that it is not required to clear the violation.

Pictures 1 and 2 are drawn by `tools/daisy-scene.js` through `../ai/visual.js` (the app's own Gemini path, model
and key) and packed by `tools/topack.js`. Picture 3 was supplied rather than generated.

### Why the contours are found differently, and why two are drawn by hand

`tools/register.js` fits an "after" image onto the photograph by matching a few hundred small patches, which needs
most of the frame unchanged pixel for pixel. These pictures are redrawn whole from the same frame: they agree in
composition but not pixel for pixel, and there is no sub-pixel transform to recover, so the alignment is the
identity by construction. `tools/daisy-outline.js` finds the shape by difference instead: both pictures into a
canvas at 224 px wide, the luminance difference blurred twice, thresholded at the 88th percentile, largest
connected blob, convex hull simplified to at most 14 points.

That is right for correction 2, where what changed is the floor. It is **wrong** for 1 and 3, because the biggest
difference is not the thing worth looking at: in 1 the plug also leaves the grey strip in the middle of the frame,
and in 3 both strips vanish from the carpet. What the inspector and the owner need to see is where the power now
comes from. So those two are marked by hand in the tool's `MANUAL` table, as a small ellipse on the free socket of
the receptacle that was always there, and on the receptacle the electrician added.

Two mechanics matter when marking by hand. `lib/solutions.js` `simpleShape()` opens out any shape narrower than
0.42 of the frame by up to 2.4x about its centre, so the radii in `MANUAL` are the ones wanted on screen divided by
2.4. And the outline is drawn **inside the clip**, on the after side only, so a mark near the left edge is
invisible at the divider's resting position of 42%. `MANUAL` therefore carries `reveal`, a divider position the
switch travels to when it is turned on; correction 1 uses 0.02, and `app.js` moves the divider before drawing.
`data/outlines.js` records on each entry whether it came from a difference or was marked by hand.

### On the Inspectors tab

`team/flow.js` says a third finding type needs one more entry in `READING`, `SCAN`, `SEEN` and `QUESTIONS` and
nothing else, and that held. The phone carries a third lens, **Strips**.

The two questions are chosen the way the others were: the app answers what it can see, and the person is asked
only what the photograph cannot tell. For a daisy chain the rule needs no measurement at all — a tap fed from a
tap is the violation and the picture shows it — so the only open facts are **the two exceptions in § 603.5.2**,
and both are things only the person standing in the room knows:

- **"What is this room used for?"** An office or work room, a meeting room, a hall or function room. The exception
  covers a Group A occupancy or a Group B meeting room.
- **"How long has it been plugged in like this?"** The other exception covers 90 days, and only for testing the
  performance of the devices themselves. The callout says so, so a recent setup is never read as a free pass.

**The answer moves the verdict.** In `team/adapter.js`, a meeting or function room turns the `tap-direct` row from
red to yellow — not cleared, but the inspector's reading rather than a settled fact, which is what yellow means
everywhere else on this page. An office or work room leaves it red and says why. A cord reported running under a
door or the carpet turns `tap-install` red, because that is the plain words of § 603.5.3 and the field inspector
can see it where the camera could not. Sent from the phone as a work room the senior's screen reads **Violation,
1 red and 4 of the inspector's call**; as a meeting room, **Inspector's call, 0 red and 5**.

Three fixes fell out of this.

- The question screen **assumed every question carried a number to type** (`q.entry`) and threw on one answered by
  tapping alone, although `flow.js` lists `entry` as one control among several. `phone.js` now builds the display,
  the keypad and the number keys only where there is something to type.
- With those gone the layout did not close up: the empty reply line and the foot still reserved their height, so
  the taps and "Not sure" sat a band apart for no reason. `.ph-q.is-tap` collapses both.
- Neither question is always answerable from the three taps, so both carry a **written answer** (`q.write`). Typing
  clears the taps and tapping clears what was typed, so there is only ever one answer. A written room is carried
  through as `room: 'written'` with the words, and it turns the finding yellow in the same way a meeting room does,
  because it is then the inspector's reading of what was written.

Neither question carries a photo prompt: there is nothing a second picture of this would add.

### The diagram on the owner's page

`assets/daisychain-load.jpg`, supplied 2026-11-23. It shows several taps chained together with the devices on them
coloured by how much they draw, every one of them leading back through a single wall socket. It explains the
**mechanism**, which a photograph of a floor cannot: the problem is not the number of sockets, it is that the whole
load returns through one cord and one pair of contacts.

It sits under "What is wrong" on the owner's page (`team/desk-draft.js` `ownerBlocks`), as an island block with its
own caption, and it is captioned as a general diagram and never as a picture of the owner's room. Its origin is not
established — it was supplied for this demonstration — so it carries no source line and makes no claim to be one.
Any finding can take one: `owner.diagram` in `data/content.js` is `{ src, alt, caption }` and the owner's page adds
the block when it is there.
