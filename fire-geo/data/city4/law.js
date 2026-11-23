// City 4 for fire-geo: the City of Berkeley. Proposed data, in the shapes data/law.js and lib/codes.js use.
// Nothing here is loaded by the app yet. See HANDOFF.md for how to wire it in. The documents read are saved
// under sources/ (PDF and text), and the page images used to check the redlines are under work/pages/.
//
// Read on 2026-11-22, all on the City of Berkeley's own site (berkeleyca.gov):
//   Ordinance 7,991-N.S.  new BMC ch. 19.49, the Berkeley Wildland-Urban Interface Code (2025 California WUI Code
//                         with local amendments). Second reading adopted 2 Dec 2025 (annotated agenda, item 41).
//   Ordinance 7,990-N.S.  BMC ch. 19.48 repealed and reenacted, the Berkeley Fire Code (2025 California Fire Code
//                         with local amendments). Second reading adopted 2 Dec 2025 (item 40). In force 1 Jan 2026.
//   The texts are the second-reading packets. They are redlines: underlined words are Berkeley's additions and
//   struck words are deletions. Every quote below was checked against the page image, so no struck word is quoted.
//
// `status` on a source: 'read' = opened and read · 'blocked' = the site refused automated access ·
// 'secondary' = not an official source, used only for a statement marked as not verified.
// On a row: `words: 'quote'` = `requires` is the ordinance's own words inside curly quotes ·
// 'quote+paraphrase' = quotes joined by this file's plain words · 'paraphrase' = no quotable text (for example an absence).
(function (root) {
'use strict';

const SRC = {
  wuiOrd:  { short: 'Berkeley Ord. 7,991-N.S.', label: 'City of Berkeley Ordinance 7,991-N.S. (BMC ch. 19.49, Berkeley WUI Code), second reading packet of 2 Dec 2025', url: 'https://berkeleyca.gov/sites/default/files/documents/2025-12-02%20Item%2041%20Adoption%20of%20and%20Amendments.pdf', status: 'read', read: '2026-11-22' },
  fireOrd: { short: 'Berkeley Ord. 7,990-N.S.', label: 'City of Berkeley Ordinance 7,990-N.S. (BMC ch. 19.48, Berkeley Fire Code), second reading packet of 2 Dec 2025', url: 'https://berkeleyca.gov/sites/default/files/documents/2025-12-02%20Item%2040%20Adoption%20of%20the%202025%20California%20Fire.pdf', status: 'read', read: '2026-11-22' },
  minutes: { short: 'Council record 2 Dec 2025', label: 'Berkeley City Council annotated agenda, 2 Dec 2025: items 40 and 41 adopted', url: 'https://berkeleyca.gov/sites/default/files/city-council-meetings/2025-12-02%20Annotated%20Agenda%20-%20Council.pdf', status: 'read', read: '2026-11-22' },
  guide:   { short: 'FireSafe Berkeley guide', label: 'Berkeley Fire Department, FireSafe Berkeley Landscape Guide (2026)', url: 'https://berkeleyca.gov/sites/default/files/2026-06/FireSafe%20Berkeley%20Landscape%20Guide_2026_ADA.pdf', status: 'read', read: '2026-11-22' },
  plan:    { short: 'EMBER rollout plan', label: 'Berkeley City Council, 17 Jun 2025, item 43c: EMBER implementation plan', url: 'https://berkeleyca.gov/sites/default/files/documents/2025-06-17%20Item%2043c%20EMBER%20Implementation%20Plan.pdf', status: 'read', read: '2026-11-22' },
  ord7959: { short: 'Berkeley Ord. 7,959-N.S.', label: 'City of Berkeley Ordinance 7,959-N.S. (the first Zone 0 text, in the 2022-edition Berkeley Fire Code), second reading packet of 17 Jun 2025', url: 'https://berkeleyca.gov/sites/default/files/documents/2025-06-17%20Item%2043a%20Modification%20and%20Adoption.pdf', status: 'read', read: '2026-11-22' },
  gis:     { short: 'Berkeley fire map', label: 'City of Berkeley Community GIS Portal: Fire and Emergency Services layers', url: 'https://www.arcgis.com/apps/webappviewer/index.html?id=2c7dfafbb1f64e159f4fdf28a52f51c6', status: 'read', read: '2026-11-22' },
  codeSite: { short: 'Berkeley code site', label: 'Berkeley Municipal Code online, ch. 19.48 and 19.49', url: 'https://berkeley.municipal.codes/BMC/19.49', status: 'blocked', read: '2026-11-22' },
  stateZ0: { short: 'State Zone 0 rule', label: 'State Board of Forestry Zone 0 regulation: status from a law-firm summary, not from the Board', url: 'https://bbklaw.com/resources/la090926-california-board-of-forestry-adopts-emergency-zone-0-regulations-under-ab-3074', status: 'secondary', read: '2026-11-22' },
};

const WUI = 'BMC § 19.49.070 · Ord. 7,991-N.S.';
const FIRE9 = 'BMC § 19.48.060 · Ord. 7,990-N.S.';
const FIRE11 = 'BMC § 19.48.080 · Ord. 7,990-N.S.';

// ------------------------------------------------------------------ the ordinance's own words
const Q_Z0 = '“Maintain all areas within five (5) horizonal [sic] feet of any structure, outbuildings, attached deck or stairs, and the area under attached decks and stairs free of vegetative and non-vegetative combustible material.” “This includes but is not limited to shrubs, vegetative ground cover, climbing vines …”';
const Q_Z0_WHERE = '“Effective January 1, 2026 the Grizzly Peak Mitigation Area and Panoramic Mitigation Area shall be subject to 604.3.2 in addition to 604.3.1”';
const Q_Z0_TREES = '“Existing trees and shrubs are permitted in Zone Zero if” they are “Maintained free of dead material” and the crown keeps “Five feet (5’) of horizontal clearance from the sides of any Building”.';
const Q_LADDER = '“Maintain trees to remove Ladder Fuels so that foliage, twigs, or branches are greater than 6’ feet above the ground or surface fuels.” “Where shrubs or small trees are located below or within a tree\'s drip line, the lowest tree branch shall be a minimum of three times the height of the understory shrubs or 6 feet, whichever is greater.”';
const Q_WHO = '“Within the locally designated Very High Fire Hazard Severity Zone a person who owns, leases, controls, operates, or maintains lands shall at all times:”';
const Q_VERT = '“Vertical Spacing: Limb trees by removing hanging bark, debris and branches that are within six feet (6 ft.) of the ground.” “Create horizontal and vertical spacing among shrubs and trees using the “Fuel Separation” method, the “Continuous Tree Canopy” method or a combination of both to achieve defensible space clearance requirements.”';
const Q_SHRUB = '“Remove contiguous vegetation without adequate fuel separation to prevent spread to the structure.” “Maintain horizontal spacing between shrubs.” “Flat or mild slope (less than 20%): Two times the height of the shrub.” “Mild to moderate slope (20-40%): Four times the height of the shrub” “Moderate to steep slope (greater than 40%): Six times the height of the shrub”';
const Q_HAZARD = '“Remove vegetative and combustible material capable of transmitting fire to a structure as determined by the Fire Code Official.” “Dead and dying woody surface fuels and aerial fuels shall be removed.”';
const Q_ROAD = '“The code official is authorized to require areas within 10 feet (3048 mm) on each side of portions of fire apparatus access roads and driveways to be cleared of nonfire-smart vegetation growth.”';
const Q_PLAN = '“Violations focus on the most critical items and do not result in penalties if addressed within the agreed timeline, and many compliance plans may take a few years to achieve.” “Implement the plan according to the agreed upon schedule, typically beginning with priority actions within 60 days.”';
const Q_MARINA = '“An automatic sprinkler system shall be installed in all structures located in the Berkeley Marina Area in accordance with NFPA 13 standards.”';
const Q_HOTEL = '“This section shall apply to every hotel in which the rooms used for sleeping are located above the ground floor, if the hotel was built prior to 1992, and also meets one of the following two conditions:” “The height of the hotel is three or more stories or two stories plus an inhabited basement … or the hotel contains 20 or more rooms, or regularly accommodates 20 or more residential occupants.”';
const Q_HOTEL_DEF = '“Hotel” means “any building, including motels, dormitories, rooming houses, Greek houses and congregate residences, which contain six or more rooms” let for sleeping.';
const Q_HIGHRISE = '“every existing high-rise … shall be provided with an approved automatic sprinkler system conforming to NFPA 13.” “The compliance schedule shall not exceed 12 years for completion of the automatic sprinkler system retrofit.”';
const Q_HEAD = '“In the sleeping units of the building, only residential or quick response sprinkler heads shall be used.”';

// ------------------------------------------------------------------ rows
// Existing keys (ladder-reach, hazard-veg, roadside, required-system, remodel-triggers, out-of-service) carry the
// same meaning as in data/law.js, so the same row morphs. `isNew: true` marks rows that exist only in Berkeley.
// `zone` says where the row has force: 'mitigation' = the two mitigation areas · 'very-high' = the locally
// designated Very High zone (which contains both mitigation areas) · 'wui' = Berkeley's mapped WUI areas · 'city'.
// There is no `canopy` row: Berkeley's text has no trunk-diameter rule.
const rows = {
  ladder: [
    { key: 'zone-zero', isNew: true, label: 'Zone 0', title: 'Nothing that burns within', value: 5, unit: 'ft', rule: 'zoneZero', zone: 'mitigation', words: 'quote',
      requires: Q_Z0 + ' ' + Q_Z0_WHERE + ' ' + Q_Z0_TREES,
      cite: 'Berkeley WUI Code § 604.3.2(1)(a) · ' + WUI, sec: '§ 604.3.2(1)(a)', code: 'BMC § 19.49.070',
      applies: 'Within 5 ft of the structure the hedge itself has to go, not only its lower tier. The Ross Valley towns have no rule like this.',
      open: 'The measured distance from the foliage to the wall, and whether the parcel is in the Grizzly Peak or Panoramic Mitigation Area.',
      say: '{To} bans anything that burns within {to} ft of a structure, in its two mitigation areas. {From} has no such zone.',
      source: SRC.wuiOrd, status: 'read' },
    { key: 'ladder-reach', label: 'Ladder fuels', title: 'Ladder fuels cleared to', value: 30, unit: 'ft', rule: 'ladderReachBerkeley', zone: 'very-high', words: 'quote',
      requires: Q_WHO + ' “Zone 1: 5 to 30 feet from any structure:” ' + Q_LADDER,
      cite: 'Berkeley WUI Code § 604.3.1(5)(c), (d) · ' + WUI, sec: '§ 604.3.1(5)', code: 'BMC § 19.49.070',
      applies: 'The direct basis for the finding. Same 30 ft as the Ross Valley, but with a measure: the lowest branch at 3 times the hedge height, or 6 ft.',
      open: 'The distance to the structure, the hedge height and the height of the lowest branch above it. The photograph gives none of them.',
      extra: 'a measured standard: 3 times the shrub height, or 6 ft', sayExtra: 'In {toName} the ladder-fuel rule comes with a measure: the lowest branch at 3 times the hedge height, or 6 ft.',
      source: SRC.wuiOrd, status: 'read' },
    { key: 'vertical-spacing', isNew: true, label: 'Limbing and spacing', title: 'Trees limbed up and spaced from shrubs, out to', value: 100, unit: 'ft', rule: 'verticalSpacing', zone: 'very-high', words: 'quote',
      requires: '“For both Zones 1 and 2:” ' + Q_VERT,
      cite: 'Berkeley WUI Code § 604.3.1(7)(d), (e) · ' + WUI, sec: '§ 604.3.1(7)(d), (e)', code: 'BMC § 19.49.070',
      applies: 'A hedge that reaches into the canopy has no vertical spacing. Berkeley asks for that spacing out to 100 ft. The Ross Valley ladder-fuel rule stops at 30 ft.',
      open: 'Whether the taller plants are trees with branches under 6 ft, and which spacing method the owner relies on. This is the app’s reading of (7)(e): an inspector should confirm it.',
      say: '{To} asks for vertical spacing between shrubs and trees out to {to} ft. {From} stops at 30 ft.',
      source: SRC.wuiOrd, status: 'read' },
    { key: 'shrub-spacing', isNew: true, label: 'Hedge gaps', title: 'Gaps between shrubs, by slope', value: null, unit: '', rule: 'shrubSpacing', zone: 'very-high', words: 'quote',
      requires: Q_SHRUB,
      cite: 'Berkeley WUI Code § 604.3.1(5)(a), (7)(f) · ' + WUI, sec: '§ 604.3.1(7)(f)', code: 'BMC § 19.49.070',
      applies: 'A continuous hedge has no gaps. Berkeley sets the gap as a multiple of the shrub height. The Ross Valley text gives no spacing number.',
      open: 'The slope of the ground and the hedge height. Shrubs “maintained as trees” follow the tree rules instead.',
      turns: 'the slope: gaps of 2, 4 or 6 times the hedge height',
      source: SRC.wuiOrd, status: 'read' },
    { key: 'hazard-veg', label: 'Hazardous vegetation', title: 'Hazardous vegetation cleared to', value: 100, unit: 'ft', rule: 'hazardVegBerkeley', zone: 'very-high', words: 'quote',
      requires: '“Zone 2: 30 to 100 feet from any structure” “For both Zones 1 and 2:” ' + Q_HAZARD,
      cite: 'Berkeley WUI Code § 604.3.1(7)(a), (b) · ' + WUI, sec: '§ 604.3.1(7)(a), (b)', code: 'BMC § 19.49.070',
      applies: 'Reaches the dead and yellowed material along the wall. Dead woody fuel “shall be removed”. Other material is the official’s call.',
      open: 'Whether the dry material is dead, and whether the official finds the rest can carry fire to the structure.',
      extra: 'no extension to 200 ft', sayExtra: 'In {toName} the zones stop at 100 ft. There is no extension to 200 ft.',
      source: SRC.wuiOrd, status: 'read' },
    { key: 'roadside', label: 'Roadside', title: 'Roadside clearing, each side', value: 10, unit: 'ft', rule: 'roadside', zone: 'wui', words: 'quote',
      requires: Q_ROAD + ' Exception: “Single specimens of trees, ornamental vegetative fuels or cultivated ground cover … provided they do not form a means of readily transmitting fire.”',
      cite: 'Berkeley WUI Code Appendix A § A102.2 · BMC § 19.49.090 · Ord. 7,991-N.S.', sec: '§ A102.2', code: 'BMC § 19.49.090',
      applies: 'The same 10 ft as the Ross Valley. This is the state appendix as written: Berkeley did not change it.',
      open: 'Whether it is invoked here. The photograph establishes no road-clearance violation.',
      source: SRC.wuiOrd, status: 'read' },
    { key: 'compliance-plan', isNew: true, label: 'Time to comply', title: 'Inspection ends in a plan', value: null, unit: '', rule: 'judgement', zone: 'mitigation', words: 'quote',
      requires: Q_PLAN,
      cite: 'Berkeley Fire Department, FireSafe Berkeley Landscape Guide (2026), p. 17. Department guidance, not code text.', sec: 'Guide p. 17', code: 'Berkeley Fire Department',
      applies: 'In Berkeley a first finding leads to a written plan with dates, and the penalty follows only if the plan is missed.',
      open: 'The plan and dates agreed for this property.', turns: 'the compliance plan agreed with the inspector',
      source: SRC.guide, status: 'read' },
  ],
  sprinkler: [
    { key: 'required-system', label: 'Required in new buildings', title: 'Sprinklers required in new buildings', value: null, unit: '', rule: 'judgement', zone: 'city', words: 'quote+paraphrase',
      requires: 'Berkeley adds no rule that every new building is sprinklered: the state code decides. It adds four cases of its own. ' + Q_MARINA + ' Also every building “used for storage of commercial motor vehicles”, every story without the listed wall openings, and buildings made into “public self-storage” since 19 August 1982. Berkeley struck the state size limits from the garage and windowless-story rules.',
      cite: 'Berkeley Fire Code §§ 903.2.10.1, 903.2.11.1, 903.2.22, 903.2.23 · ' + FIRE9, sec: '§§ 903.2.10.1 to 903.2.23', code: 'BMC § 19.48.060',
      applies: 'Whether this system is a required one turns on state law or on one of the four local cases, not on a blanket local rule as in the Ross Valley.',
      open: 'The building’s use and location, and what state law required when it was built.', turns: 'whether state law or one of Berkeley’s four local cases required this system',
      extra: 'no local rule for all new buildings', sayExtra: '{To} has no local rule that every new building is sprinklered. State law decides, plus four local cases.',
      source: SRC.fireOrd, status: 'read' },
    { key: 'remodel-triggers', label: 'Required in existing buildings', title: 'Sprinklers required in existing buildings', value: null, unit: '', rule: 'judgement', zone: 'city', words: 'quote+paraphrase',
      requires: 'No trigger by floor area added. Berkeley requires a retrofit by building type. Older hotels: ' + Q_HOTEL + ' ' + Q_HOTEL_DEF + ' High-rises: ' + Q_HIGHRISE,
      cite: 'Berkeley Fire Code §§ 1103.5.6, 1114.27 · ' + FIRE11, sec: '§§ 1103.5.6, 1114.27', code: 'BMC § 19.48.080',
      applies: 'A painted head in an older dormitory, rooming house or high-rise sits in a system the city ordered in. Maintaining it is not optional.',
      open: 'The building’s type, height, room count and year built.', turns: 'the building’s type and age',
      extra: 'retrofit by building type, not by remodel', sayExtra: 'In {toName} the trigger is the building type, not a remodel: older hotels and dormitories, and every existing high-rise.',
      source: SRC.fireOrd, status: 'read' },
    { key: 'out-of-service', label: 'Out of service', title: 'Taking the head out of service', value: null, unit: '', rule: 'judgement', zone: 'city', words: 'paraphrase',
      requires: 'Not amended in Berkeley. The state section applies as written. The Ross Valley sentence that extends it to residential sprinkler systems is not in Berkeley’s ordinance. The state wording itself was not re-read.',
      cite: 'California Fire Code § 901.7, unamended (BMC § 19.48.060 lists no change to § 901)', sec: '§ 901.7', code: 'California Fire Code',
      applies: 'Governs the replacement work once the head is isolated, on the state’s terms only.',
      open: 'Whether the system is a required one, and what the fire code official requires while it is down.', turns: 'whether the system is a required one',
      source: SRC.fireOrd, status: 'read' },
    { key: 'replacement-head', isNew: true, label: 'Replacement head', title: 'Which head may replace it', value: null, unit: '', rule: 'judgement', zone: 'city', words: 'quote',
      requires: Q_HEAD + ' This applies in hotels retrofitted under § 1103.5.6.',
      cite: 'Berkeley Fire Code § 1103.5.6.2 · ' + FIRE11, sec: '§ 1103.5.6.2', code: 'BMC § 19.48.080',
      applies: 'If the painted head is in a sleeping room of a retrofitted hotel or dormitory, the new head must be a residential or quick response type.',
      open: 'Whether this is a sleeping unit in a building retrofitted under § 1103.5.6.', turns: 'whether this is a sleeping room in a retrofitted hotel or dormitory',
      source: SRC.fireOrd, status: 'read' },
  ],
};

// ------------------------------------------------------------------ verdict rules
// Same signature as RULES in lib/codes.js: (row, c) -> { verdict, why }.
// c = { d, zone, scope }: d is the assumed distance to the structure in feet. zone is where the pin is:
// 'mitigation' | 'very-high' | 'high' | 'none' | 'unknown' (see zones.js: test mitigation first).
// In words:
//   zoneZero            in a mitigation area: red at 5 ft or less, green beyond. Elsewhere in Berkeley: green,
//                       because Zone 0 is not required there. Zone unknown: yellow.
//   ladderReachBerkeley beyond 30 ft: green. Within 30 ft: red in the Very High zone (mitigation areas included),
//                       yellow elsewhere (the section is written for the Very High zone).
//   verticalSpacing     beyond 100 ft: green. Within 100 ft: red in the Very High zone, yellow elsewhere.
//   shrubSpacing        beyond 100 ft: green. Within: yellow, it depends on the slope.
//   hazardVegBerkeley   beyond 100 ft: green (no 200 ft extension). Within: yellow.
//   roadside, judgement as in lib/codes.js.
const inVeryHigh = z => z === 'mitigation' || z === 'very-high';
const verdictRules = {
  zoneZero(row, c) {
    if (c.zone === 'unknown' || c.zone == null) return { verdict: 'yellow', why: 'Depends on whether the parcel is in a mitigation area.' };
    if (c.zone !== 'mitigation') return { verdict: 'green', why: 'Zone 0 is required only in the two mitigation areas.' };
    if (c.d <= row.value) return { verdict: 'red', why: 'Inside Zone 0 at ' + c.d + ' ft. No shrubs within ' + row.value + ' ft.' };
    return { verdict: 'green', why: 'Outside Zone 0 at ' + c.d + ' ft.' };
  },
  ladderReachBerkeley(row, c) {
    const reach = row.value;
    if (c.d > reach) return { verdict: 'green', why: 'Outside Zone 1 at ' + c.d + ' ft. The ladder-fuel rule ends at ' + reach + ' ft.' };
    if (inVeryHigh(c.zone)) return { verdict: 'red', why: 'Inside ' + reach + ' ft at ' + c.d + ' ft. Lowest branch must clear 3 times the hedge, or 6 ft.' };
    if (c.zone === 'unknown' || c.zone == null) return { verdict: 'yellow', why: 'Inside ' + reach + ' ft. Depends on the parcel’s zone.' };
    return { verdict: 'yellow', why: 'Inside ' + reach + ' ft, outside the Very High zone. Depends on state defensible-space law.' };
  },
  verticalSpacing(row, c) {
    if (c.d > row.value) return { verdict: 'green', why: 'Past ' + row.value + ' ft. Zone 2 ends there.' };
    if (inVeryHigh(c.zone)) return { verdict: 'red', why: 'Inside ' + row.value + ' ft at ' + c.d + ' ft. Shrubs and trees need vertical spacing.' };
    if (c.zone === 'unknown' || c.zone == null) return { verdict: 'yellow', why: 'Inside ' + row.value + ' ft. Depends on the parcel’s zone.' };
    return { verdict: 'yellow', why: 'Outside the Very High zone. Depends on state defensible-space law.' };
  },
  shrubSpacing(row, c) {
    if (c.d > 100) return { verdict: 'green', why: 'Past 100 ft. Zone 2 ends there.' };
    if (!inVeryHigh(c.zone)) return { verdict: 'yellow', why: 'Depends on the parcel’s zone: the spacing rule is written for the Very High zone.' };
    return { verdict: 'yellow', why: 'Depends on ' + row.turns + '.' };
  },
  hazardVegBerkeley(row, c) {
    if (c.d > row.value) return { verdict: 'green', why: 'Past ' + row.value + ' ft. Berkeley has no extension to 200 ft.' };
    if (!inVeryHigh(c.zone)) return { verdict: 'yellow', why: 'Depends on the parcel’s zone: the section is written for the Very High zone.' };
    return { verdict: 'yellow', why: 'Depends on whether the dry material is dead. Dead woody fuel must go.' };
  },
  roadside() { return { verdict: 'yellow', why: 'Depends on whether the official invokes roadside clearing.' }; },
  judgement(row) { return { verdict: 'yellow', why: 'Depends on ' + row.turns + '.' }; },
};

// One line for the overall verdict on the ladder photo, in the voice of overallLine() in lib/codes.js.
function overallLine(c, verdict) {
  if (c.zone === 'mitigation' && c.d <= 5) return 'Inside Zone 0. Within 5 ft the hedge itself has to go.';
  if (inVeryHigh(c.zone) && c.d <= 30) return 'Ladder fuel inside 30 ft, in the Very High zone.';
  if (inVeryHigh(c.zone) && c.d <= 100) return 'Past 30 ft, but Berkeley asks for spacing out to 100 ft.';
  if (inVeryHigh(c.zone)) return 'Past 100 ft at ' + c.d + ' ft. Berkeley’s zones end there.';
  if (c.zone === 'unknown' || c.zone == null) return 'The parcel’s zone is not known. The inspector decides.';
  return 'Outside the Very High zone. Berkeley’s local rules do not reach this parcel.';
}

// Labels for the "Mapped zone" fact, by zone.
const zoneLabels = {
  mitigation: 'In a mitigation area: Zone 0 required',
  'very-high': 'Very High zone: Zones 1 and 2, no Zone 0',
  high: 'High zone: state rules, no local zones',
  none: 'Flatlands: outside the hazard zones',
  unknown: 'Not on the Berkeley fire map',
};

const city = {
  id: 'berkeley', name: 'City of Berkeley', short: 'Berkeley', inSentence: 'Berkeley', kind: 'Incorporated city', carried: true,
  agency: 'Berkeley Fire Department', agencyCite: 'Berkeley Fire Code § 103.1 · BMC § 19.48.020',
  fireCode: { value: '2025 California Fire Code', cite: 'BMC § 19.48.010 · Ord. 7,990-N.S.', was: { value: '2022 California Fire Code', until: '31 Dec 2025', cite: 'Ord. 7,959-N.S.' } },
  wuiCode: { value: '2025 California WUI Code', cite: 'BMC § 19.49.010 · Ord. 7,991-N.S.' },
  adopted: [
    { what: 'Berkeley Fire Code', cite: 'BMC ch. 19.48', ordinance: 'Ord. 7,990-N.S.', firstReading: '10 Nov 2025', adopted: '2 Dec 2025', inForce: '1 Jan 2026', base: '2025 California Fire Code', source: SRC.fireOrd, record: SRC.minutes, status: 'read',
      note: '§ 19.48.010(C): “This Chapter will become effective on January 1, 2026.”' },
    { what: 'Berkeley Wildland-Urban Interface Code', cite: 'BMC ch. 19.49', ordinance: 'Ord. 7,991-N.S.', firstReading: '10 Nov 2025', adopted: '2 Dec 2025', inForce: '1 Jan 2026', base: '2025 California WUI Code', source: SRC.wuiOrd, record: SRC.minutes, status: 'read',
      note: 'The ordinance has no effective-date clause of its own. § 604.3.2 says “Effective January 1, 2026”, and the Fire Department’s guide says the rules “took effect on January 1, 2026”. The staff report misprints the number once as 9,991: the ordinance and the council record say 7,991.' },
    { what: 'First Zone 0 text (EMBER)', cite: 'Berkeley Fire Code § 4907.6, 2022 edition', ordinance: 'Ord. 7,959-N.S.', adopted: '17 Jun 2025', inForce: 'Zone 0 from 1 Jan 2026', base: '2022 California Fire Code', source: SRC.ord7959, status: 'read',
      note: 'Superseded on 1 Jan 2026 by ch. 19.49, which carries the Zone 0 text forward as § 604.3.2.' },
  ],
  source: SRC.wuiOrd, sources: [SRC.wuiOrd, SRC.fireOrd, SRC.minutes, SRC.guide, SRC.gis],
  allSources: SRC,
  pin: [-122.25823, 37.89515],               // a house lot off Creston Road, inside the Grizzly Peak Mitigation Area
  pins: {                                      // every one is a building centroid from OpenStreetMap, checked against zones.js
    mitigation: { at: [-122.25823, 37.89515], zone: 'mitigation', where: 'off Creston Road, Grizzly Peak Mitigation Area' },
    panoramic:  { at: [-122.25114, 37.86835], zone: 'mitigation', where: 'near Warring Street, Panoramic Mitigation Area' },
    veryHigh:   { at: [-122.26206, 37.89285], zone: 'very-high', where: 'off Regal Road, Very High zone, outside the mitigation areas' },
    high:       { at: [-122.26179, 37.88199], zone: 'high', where: 'near Euclid Avenue, High zone' },
    flat:       { at: [-122.28296, 37.86597], zone: 'none', where: 'central Berkeley flatlands' },
  },
  zoneLabels,
  rows, verdictRules, overallLine,
  differs: 'In Berkeley’s hill mitigation areas nothing that burns may stand within 5 ft of a house and trees and shrubs must be spaced out to 100 ft, while in Ross the same hedge only has to lose its ladder fuels within 30 ft.',
  differsBy: {
    ladder: 'Berkeley bans anything that burns within 5 ft of a structure and asks for spacing out to 100 ft. The Ross Valley rule is ladder fuels within 30 ft.',
    sprinkler: 'Berkeley has no local rule for all new buildings. It orders retrofits by building type: older hotels, dormitories and every high-rise.',
  },
  pending: {
    text: 'The state’s own Zone 0 rule is not in force for existing homes. The Board of Forestry is reported to have adopted an emergency regulation on 19 Aug 2026. Its approval and effective date were not verified.',
    status: 'not verified', source: SRC.stateZ0,
    local: 'Berkeley’s council asked for a report within 90 days of the state’s final rule, on how the state and local rules differ (council record, 2 Dec 2025, item 41).', localSource: SRC.minutes,
  },
  disclosure: 'A demonstration. Each verdict is this app’s reading of the cited text, and the inspector decides. Yellow rows are judgement calls: inspectors may read them differently.',
};

if (typeof window !== 'undefined') window.FIREGEO_CITY4 = city;
if (typeof module !== 'undefined' && module.exports) module.exports = city;
root.FIREGEO_CITY4 = city;
})(typeof window !== 'undefined' ? window : globalThis);
