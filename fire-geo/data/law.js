// The code rows this page shows, keyed by meaning, with where every statement comes from.
//
// Read NOTES.md first. In short: the repo's jurisdictions.js (kept untouched beside this file) was taken from the
// online code libraries, which lagged. The adopting ordinances say something else for Fairfax and the county, and
// the ordinances are the law. So this file follows the ordinances, each read on 2026-11-22:
//
//   Ross          RMC ch. 14.04 (Ord. 732, 2025) and ch. 14.16, downloaded from the Town's Title 14 page.
//   San Anselmo   SAMC Title 3 ch. 3 art. 8 and art. 10, as introduced in the Town Council packet of 28 Oct 2025
//                 (ordinance numbers and the adoption date are from the repo's jurisdictions.js).
//   Fairfax       Ord. 899 (FMC ch. 8.04) and Ord. 900 (FMC ch. 8.06), adopted 5 Nov 2025, in force 1 Jan 2026.
//   County        New Marin County Code ch. 16.16, first reading 4 Nov 2025, in force 1 Jan 2026 (number not confirmed).
//
// `status` on a source: 'read' = opened and read for this file · 'blocked' = the site refused automated access ·
// 'repo' = taken from the repo's jurisdictions.js / content.js / the inspector's .md files, not re-read at the source.
// Text inside curly quotes is the ordinance's own words. Nothing here is invented; gaps are stated as gaps.
window.FIREGEO_LAW = (function () {
'use strict';

const SRC = {
  rossPage:   { short: 'Ross Title 14', label: 'Town of Ross Municipal Code, Title 14: Fire Prevention', url: 'https://www.townofrossca.gov/administration/page/title-14-fire-prevention', status: 'read' },
  saCode:     { short: 'San Anselmo code', label: 'San Anselmo Municipal Code, Title 3 ch. 3: Fire Prevention', url: 'https://library.municode.com/ca/san_anselmo/codes/code_of_ordinances?nodeId=TIT3PUSA_CH3FIPR', status: 'blocked' },
  saPacket:   { short: 'Council packet 28 Oct 2025', label: 'San Anselmo Town Council packet, 28 Oct 2025: both ordinances as introduced', url: 'https://d3n9y02raazwpg.cloudfront.net/sananselmo-ca/85f6cfbb-f8cb-11ef-ab6a-005056a89546-f1987086-fb22-4848-a7a9-9d73f32a105d-1761245911.pdf', status: 'read' },
  ffCode:     { short: 'Fairfax code ch. 8.04', label: 'Fairfax Municipal Code, ch. 8.04', url: 'https://codelibrary.amlegal.com/codes/fairfax/latest/fairfax_ca/0-0-0-2144', status: 'blocked' },
  ff899:      { short: 'Fairfax Ord. 899', label: 'Fairfax Ordinance 899 (fire code), staff report of 5 Nov 2025', url: 'https://storage.googleapis.com/proudcity/fairfaxca/2025/10/4ed1e6c8-item-4.-2025-fire-code-update.pdf', status: 'read' },
  ff900:      { short: 'Fairfax Ord. 900', label: 'Fairfax Ordinance 900 (WUI code)', url: 'https://storage.googleapis.com/proudcity/fairfaxca/2025/12/7202d79b-ordinance-900-2025-wildland-urban-interface-wui-code-updates.pdf', status: 'read' },
  marinOrd:   { short: 'County ordinance 4 Nov 2025', label: 'Marin County fire code ordinance, first reading 4 Nov 2025', url: 'https://marin.granicus.com/MetaViewer.php?view_id=33&event_id=4089&meta_id=1405092', status: 'read' },
  marinStaff: { short: 'County staff report', label: 'Marin County staff report, 4 Nov 2025', url: 'https://marin.granicus.com/MetaViewer.php?view_id=33&event_id=4089&meta_id=1405090', status: 'read' },
  rvfdMap:    { short: 'Ross Valley Fire map', label: 'Ross Valley Fire Department: WUI and fire hazard maps', url: 'https://www.rossvalleyfire.gov/wildland-urban-interface-maps', status: 'read' },
  cfc:        { short: 'California Fire Code', label: '2025 California Fire Code (ICC)', url: 'https://codes.iccsafe.org/content/CAFC2025P1', status: 'blocked' },
  cfc7:       { short: 'CFC ch. 7, up.codes', label: '2025 California Fire Code ch. 7 (Fire and Smoke Protection Features), read on up.codes', url: 'https://up.codes/viewer/california/ca-fire-code-2025/chapter/7/fire-and-smoke-protection-features', status: 'read' },
  cfc6:       { short: 'CFC ch. 6, up.codes', label: '2025 California Fire Code ch. 6 (Building Services and Systems), read on up.codes', url: 'https://up.codes/viewer/california/ca-fire-code-2025/chapter/6/building-services-and-systems', status: 'read' },
  cwuic:      { short: 'California WUI Code', label: '2025 California Wildland-Urban Interface Code (ICC)', url: 'https://codes.iccsafe.org/content/CAWUIC2025P1', status: 'blocked' },
  repo:       { short: 'Repo data', label: 'Repo data (monday/jurisdictions.js, sprinkler.md)', url: '', status: 'repo' },
};

// ------------------------------------------------------------------ places
const places = {
  ross: {
    id: 'ross', name: 'Town of Ross', short: 'Ross', inSentence: 'Ross', kind: 'Incorporated town', carried: true,
    agency: 'Ross Valley Fire Department', agencyShort: 'Ross Valley Fire', agencyCite: 'RMC § 14.04.020',
    fireCode: { value: '2025 California Fire Code', cite: 'RMC § 14.04.010 · Ord. 732', was: null },
    wuiCode: { value: '2025 California WUI Code', cite: 'RMC ch. 14.16' },
    sources: [SRC.rossPage],
  },
  san_anselmo: {
    id: 'san_anselmo', name: 'Town of San Anselmo', short: 'San Anselmo', inSentence: 'San Anselmo', kind: 'Incorporated town', carried: true,
    agency: 'Ross Valley Fire Department', agencyShort: 'Ross Valley Fire', agencyCite: 'SAMC § 3-3.802',
    fireCode: { value: '2025 California Fire Code', cite: 'SAMC § 3-3.801 · Ord. 2025-1194', was: null },
    wuiCode: { value: '2025 California WUI Code', cite: 'SAMC § 3-3.1001 · Ord. 2025-1195' },
    sources: [SRC.saCode, SRC.saPacket],
  },
  fairfax: {
    id: 'fairfax', name: 'Town of Fairfax', short: 'Fairfax', inSentence: 'Fairfax', kind: 'Incorporated town', carried: true,
    agency: 'Ross Valley Fire Department', agencyShort: 'Ross Valley Fire', agencyCite: 'FMC § 8.04.020',
    fireCode: { value: '2025 California Fire Code', cite: 'FMC § 8.04.010 · Ord. 899', was: { value: '2022 California Fire Code', until: '31 Dec 2025', cite: 'Ord. 873' } },
    wuiCode: { value: '2025 California WUI Code', cite: 'FMC § 8.06.010 · Ord. 900' },
    sources: [SRC.ffCode, SRC.ff900, SRC.ff899],
  },
  marin: {
    id: 'marin', name: 'Unincorporated Marin County', short: 'Unincorporated', inSentence: 'the county', kind: 'Outside any town limit', carried: true,
    agency: 'Marin County Fire, or a local district', agencyShort: 'County or district fire agency', agencyCite: 'MCC § 16.16.020',
    agencyNote: 'Several agencies cover unincorporated land in this valley. Confirm the agency from the address before a notice is issued.',
    fireCode: { value: '2025 California Fire Code', cite: 'MCC § 16.16.010 · Ord. not confirmed', was: { value: '2022 California Fire Code', until: '31 Dec 2025', cite: 'Ord. 3775' } },
    wuiCode: { value: '2025 California WUI Code', cite: 'MCC § 16.16.050' },
    sources: [SRC.marinOrd, SRC.marinStaff],
  },
  // Named on the map, not carried: the honest answer there is "not this demonstration", not a wrong table.
  sleepy_hollow: {
    id: 'sleepy_hollow', name: 'Sleepy Hollow Fire Protection District', short: 'Sleepy Hollow', inSentence: 'Sleepy Hollow', kind: 'Unincorporated · fire protection district', carried: false,
    agency: 'Sleepy Hollow FPD, served by Ross Valley Fire', agencyShort: 'Sleepy Hollow fire district', agencyCite: '',
    why: 'The district has its own fire code, Ordinance 2025-04. Its text was not loaded for this demonstration.',
    sources: [SRC.rvfdMap],
  },
  san_rafael: {
    id: 'san_rafael', name: 'City of San Rafael', short: 'San Rafael', inSentence: 'San Rafael', kind: 'Incorporated city', carried: false,
    agency: 'San Rafael Fire Department', agencyShort: 'San Rafael Fire', agencyCite: 'repo data',
    why: 'San Rafael adopts its own fire code. This demonstration carries Ross, San Anselmo, Fairfax and unincorporated Marin only.',
    sources: [],
  },
  larkspur: {
    id: 'larkspur', name: 'City of Larkspur', short: 'Larkspur', inSentence: 'Larkspur', kind: 'Incorporated city', carried: false,
    agency: 'Central Marin Fire Department', agencyShort: 'Central Marin Fire', agencyCite: 'repo data',
    why: 'Larkspur adopts its own fire code. This demonstration carries Ross, San Anselmo, Fairfax and unincorporated Marin only.',
    sources: [],
  },
};

// ------------------------------------------------------------------ rows
// One definition per MEANING. `by` holds what differs per place; anything not in `by[place]` is shared.
// `rule` names the verdict rule in lib/codes.js. `say` builds the one-line difference when a value changes.
// Placeholders: {To} {From} = place names at the start of a sentence · {toName} {fromName} = mid-sentence ·
// {to} {from} = the two values · {was} {until} = the earlier value and its last day.
const Q_LADDER = '“Ladder fuels shall be removed within 30 feet of the structure.”';
const Q_HAZARD = '“Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet when topographic or combustible vegetative types necessitate removal as determined by the Fire Code Official.”';
const canopy = n => '“When required by the Fire Code Official, cut and remove trees that are ' + n + '" of diameter or less at breast height, or four feet, six inches above ground, to achieve canopy separation within 30 feet of the structure.”';
const Q_ROAD = '“The Fire Code Official is authorized to cause areas within 10 feet (3048 cm) on each side of portions of highways, fire apparatus access roads … and driveways … to be cleared of flammable vegetation and other combustible growth.”';
const Q_ROAD_ENTRY = ' The county adds: “The Fire Code Official is authorized to enter upon private property to carry out this work.”';
const Q_9032 = '“An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures.”';
const Q_6132 = ' The Town WUI Code § 613.2 requires one “in all occupancies, in new buildings, and substantial remodels.”';
const Q_REMODEL = 'Sprinklers “in all buildings in excess of 3,000 sq. ft. which have ten per cent (10%) or more floor area added within any 36 month period”, and in all buildings with “fifty per cent (50%) or more floor area added, or any ‘substantial remodel’ … within any 36 month period.”';
// ---- the daisy chain. 2025 CFC ch. 6 was reorganised: the electrical sections are §§ 603.x, and the numbers they
// carried in earlier editions now address other subjects (§ 605 is Fuel-Fired Appliances). Read on up.codes
// 2026-11-23; the ICC site is blocked, so the operative sentences are quoted and nothing else is inferred.
const Q_TAP_DIRECT = '“Relocatable power taps and current taps shall be directly connected to a permanently installed receptacle.”';
const Q_TAP_EX = ' Two exceptions: up to five taps may be connected together for temporary use supplying electronic equipment in a Group A occupancy or a Group B meeting room, and taps used for 90 days or less to test the performance of the devices.';
const Q_TAP_LIST = 'Relocatable power taps shall be listed to UL 1363, and current taps to UL 498A.';
const Q_TAP_INSTALL = 'Relocatable power tap cords shall not extend through walls, ceilings or floors, under doors or floor coverings, nor be subject to environmental or physical damage.';
const Q_CORD = '“Extension cords shall not be a substitute for permanent wiring and shall be listed and labeled in accordance with UL 817. Extension cords shall not be affixed to structures, extended through walls, ceilings or floors, or under doors or floor coverings, nor shall such cords be subject to environmental damage or physical impact. Extension cords shall be used only with portable appliances. Extension cords marked for indoor use shall not be used outdoors.”';
const Q_ABATE = '“Conditions that constitute an electrical shock or fire hazard shall be abated.”';
const Q_PENALTY = '“Persons who shall violate a provision of this code or shall fail to comply with any of the requirements thereof or who shall erect, install, alter repair or do work in violation of the approved construction documents or directive of the Fire Code Official, or of a permit or certificate used under provisions of this code, shall be guilty of a misdemeanor, punishable by a fine of not more than $500 dollars or by imprisonment not exceeding 180 days, or both such fine and imprisonment. Each day that a violation continues after due notice has been served shall be deemed a separate offense.”';

// ---- the fire door. 2025 CFC ch. 7, read on up.codes 2026-11-23; the ICC site is blocked. § 705 is Door and
// Window Openings: how an opening protective is kept once it is in. None of the four Ross Valley ordinances
// writes anything into chapter 7, so these four sections are the state text as printed, carried by each town's
// own code. Berkeley is the exception and adds a sentence to § 705.2.5 (data/city4/law.js).
// The two legends in § 705.2.2 are set with an em dash in the code. Nothing on this page uses one, so the legend
// words are given without it; the sentence they sit in is quoted as it stands.
const Q_DOOR_BLOCK = '“Opening protectives in fire-resistance-rated assemblies shall be inspected and maintained in accordance with NFPA 80.” “Fire doors and smoke and draft control doors shall not be blocked, obstructed, or otherwise made inoperable.” “Fusible links shall be replaced promptly whenever fused or damaged. Opening protectives and smoke and draft control doors shall not be modified.”';
const Q_DOOR_LATCH = '“Swinging fire doors shall close from the full-open position and latch automatically.”';
const Q_DOOR_HOLD = '“Hold-open devices and automatic door closers, where provided, shall be maintained. During the period that such device is out of service for repairs, the door it operates shall remain in the closed position.”';
const Q_DOOR_SIGN = '“Where required by the fire code official, a sign shall be permanently displayed on or near each fire door in letters not less than 1 inch (25 mm) high”. The legend is “FIRE DOOR” and then “DO NOT BLOCK” on a door designed to be kept normally open, or “KEEP CLOSED” on one designed to be kept normally closed.';

const Q_9017 = '“Where a required fire protection system is out of service, the fire department and the fire code official shall be notified immediately and, where required by the fire code official, the building shall be either evacuated or an approved fire watch shall be provided … This section shall also apply to residential fire sprinkler systems.”';

const rows = {
  ladder: {
    state: [
      { key: 'state-defensible', label: 'Defensible space', title: 'Defensible space, state law', value: null, unit: '', rule: 'stateDefensible',
        cite: 'Pub. Resources Code § 4290 · Gov. Code §§ 51175–51189',
        requires: 'Defensible space around buildings in State Responsibility Areas (PRC § 4290, 14 CCR § 1270) and in WUI areas and very high fire hazard severity zones of Local Responsibility Areas (Gov. Code §§ 51175–51189).',
        applies: 'State law sets the duty. It does not give the 30 ft ladder-fuel distance: that comes from each local ordinance.',
        open: 'The responsibility-area classification of the parcel.', source: SRC.repo },
    ],
    stateNote: '',
    local: [
      { key: 'ladder-reach', label: 'Ladder fuels', title: 'Ladder fuels cleared to', unit: 'ft', rule: 'ladderReach', requires: Q_LADDER,
        applies: 'The direct basis for the finding. Inside the reach, removing the lower tier answers the section.',
        open: 'The measured distance from the vegetation to the structure. The photograph cannot give it.',
        phrase: ['within ', ' ft'], say: '{Poss} ladder-fuel distance is {to} ft, not {from} ft.',
        sayWas: 'Until {until} {To} cleared ladder fuels to {was} ft.',
        by: {
          ross:        { value: 30, cite: 'Town WUI Code § 604.6(7) · RMC ch. 14.16', source: SRC.rossPage },
          san_anselmo: { value: 30, cite: 'Town WUI Code § 604.6(7) · SAMC § 3-3.1002', source: SRC.saPacket },
          fairfax:     { value: 30, cite: 'Town WUI Code § 604.6(7) · FMC § 8.06.011', source: SRC.ff900,
                         was: { value: 100, unit: 'ft', until: '31 Dec 2025', cite: 'CFC § 4907.4(7) as added by FMC § 8.04.100 · Ord. 873 (2022)' } },
          marin:       { value: 30, cite: 'WUI Code § 604.6(7) · MCC § 16.16.060', source: SRC.marinOrd },
        } },
      { key: 'hazard-veg', label: 'Hazardous vegetation', title: 'Hazardous vegetation cleared to', unit: 'ft', rule: 'hazardVeg', requires: Q_HAZARD,
        applies: 'Reaches the dead and yellowed material along the retaining wall even where the 30 ft ladder-fuel rule does not.',
        open: 'Whether the hedge and the dry material are hazardous vegetation. The photograph cannot establish moisture or combustibility.',
        phrase: ['within ', ' ft'], say: '{Poss} clearing distance is {to} ft, not {from} ft.',
        by: {
          ross:        { value: 100, cite: 'Town WUI Code § 604.6(1) · RMC ch. 14.16', source: SRC.rossPage },
          san_anselmo: { value: 100, cite: 'Town WUI Code § 604.6(1) · SAMC § 3-3.1002', source: SRC.saPacket },
          fairfax:     { value: 100, cite: 'Town WUI Code § 604.6(1) · FMC § 8.06.011', source: SRC.ff900 },
          marin:       { value: 100, cite: 'WUI Code § 604.6(1) · MCC § 16.16.060', source: SRC.marinOrd },
        } },
      { key: 'canopy', label: 'Canopy trees', title: 'Trees out for canopy separation, up to', unit: 'in.', rule: 'canopy',
        applies: 'The upper tier is tall shrubs or small trees. If the official asks for canopy separation, this sets which stems can be required out.',
        open: 'Whether canopy separation is required on this property.',
        phrase: ['', ' in. or less'], say: '{Poss} tree limit is {to} in., not {from} in.',
        by: {
          ross:        { value: 8, requires: canopy(8), cite: 'Town WUI Code § 604.6(8) · RMC ch. 14.16', source: SRC.rossPage },
          san_anselmo: { value: 8, requires: canopy(8), cite: 'Town WUI Code § 604.6(8) · SAMC § 3-3.1002', source: SRC.saPacket },
          fairfax:     { value: 8, requires: canopy(8), cite: 'Town WUI Code § 604.6(8) · FMC § 8.06.011', source: SRC.ff900 },
          marin:       { value: 6, requires: canopy(6), cite: 'WUI Code § 604.6(8) · MCC § 16.16.060', source: SRC.marinOrd },
        } },
      { key: 'roadside', label: 'Roadside', title: 'Roadside clearing, each side', unit: 'ft', rule: 'roadside',
        applies: 'The vegetation borders a paved road, so roadside clearing may apply alongside the defensible-space finding.',
        open: 'Whether it is invoked here. The photograph establishes no road-clearance violation.',
        phrase: ['', ' ft each side'], say: '{Poss} roadside strip is {to} ft, not {from} ft.',
        by: {
          ross:        { value: 10, requires: Q_ROAD, cite: 'Town WUI Code § 604.7 · RMC ch. 14.16', source: SRC.rossPage },
          san_anselmo: { value: 10, requires: Q_ROAD, cite: 'Town WUI Code § 604.7 · SAMC § 3-3.1002', source: SRC.saPacket },
          fairfax:     { value: 10, requires: Q_ROAD, cite: 'Town WUI Code § 604.7 · FMC § 8.06.011', source: SRC.ff900 },
          marin:       { value: 10, requires: Q_ROAD + Q_ROAD_ENTRY, cite: 'WUI Code § 604.7 · MCC § 16.16.060', source: SRC.marinOrd,
                         extra: 'entry onto private property', sayExtra: 'For roadside clearing {toName} may enter private property.' },
        } },
      { key: 'brush-nuisance', label: 'Dry brush nuisance', title: 'Dry brush as a nuisance', diffName: 'dry-brush', unit: '', rule: 'judgement', value: null,
        requires: 'Dry brush, dead trees and bushes that are a fire menace are a public nuisance, abated on notice (§ 8.24.020) with costs assessed (§ 8.24.030).',
        applies: 'A second route for the dry material along the wall, through the municipal code instead of the WUI code.',
        open: 'Whether the dry material is a fire menace.', turns: 'whether the dry material is a fire menace',
        by: { fairfax: { cite: 'FMC ch. 8.24', source: SRC.repo } } },
      { key: 'fire-hazard', label: 'Fire-hazard vegetation', title: 'Vegetation that is a fire hazard', diffName: 'fire-hazard', unit: '', rule: 'judgement', value: null,
        requires: '“No person who has any ownership or possessory interest in or control of a parcel of land shall allow to exist thereon any hazardous rubbish or weeds, trees, or other vegetation, which constitutes a fire hazard.”',
        applies: 'The county states the duty for any parcel, in the fire code itself, whatever the mapped zone.',
        open: 'Whether the vegetation is found to be a fire hazard.', turns: 'whether the vegetation is found to be a fire hazard',
        by: { marin: { cite: 'CFC § 325.5.2 as added by MCC § 16.16.040', source: SRC.marinOrd } } },
    ],
  },

  sprinkler: {
    state: [
      { key: 'maintenance', label: 'Working order', title: 'Systems kept in working order', value: null, unit: '', rule: 'maintenance',
        cite: 'California Fire Code § 901.6',
        requires: 'Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced.',
        applies: 'Paint contamination capable of affecting operation is a maintenance deficiency. The inspector confirmed it and specified replacement.',
        open: '', source: SRC.repo },
      { key: 'itm-standard', label: 'Maintenance standard', title: 'Maintained to the adopted standard', value: null, unit: '', rule: 'judgement',
        cite: 'California Fire Code § 903.5 · NFPA 25 § 5.2.1.1.1',
        requires: 'Inspection, testing and maintenance of automatic sprinkler systems to the adopted standards. NFPA 25 calls for replacing sprinklers with disqualifying paint. Title 19 § 904 references the California-amended 2013 edition; later editions ask whether the paint is detrimental to performance.',
        applies: 'The coating has to be assessed under whichever edition is enforced.',
        open: 'Which edition the authority having jurisdiction enforces.', turns: 'which NFPA 25 edition the authority enforces', source: SRC.repo },
      { key: 'residential', label: 'Residential code', title: 'Painting a sprinkler, residential code', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Residential Code § R309.3.2.6',
        requires: 'Painting, caulking or modifying sprinklers is prohibited, and affected sprinklers must be replaced.',
        applies: 'The most direct basis for replacement, if this building is governed by the residential code.',
        open: 'The occupancy and building classification, which the photograph does not establish.', turns: 'the occupancy, which the photograph cannot show', source: SRC.repo },
    ],
    stateNote: 'The duty to replace is state law. What changes with the place is the adopting ordinance and whether the local rule made this a required system.',
    local: [
      { key: 'required-system', label: 'Required in new buildings', title: 'Sprinklers required in new buildings', unit: '', rule: 'judgement', value: null,
        applies: 'If the local rule required this system, maintaining it is not optional, and § 901.7 applies when the head comes out.',
        open: 'Whether this building was built or substantially remodelled under the local rule.', turns: 'whether the building was built under this rule',
        sayExtraChange: '{To} lists {to} exceptions, not {from}.',
        by: {
          ross:        { requires: Q_9032 + Q_6132 + ' Two exceptions: small Group U and small agricultural buildings.', exceptions: 2, cite: 'CFC § 903.2.1 as added by RMC § 14.04.100', source: SRC.rossPage },
          san_anselmo: { requires: Q_9032 + Q_6132 + ' Two exceptions: small Group U and small agricultural buildings.', exceptions: 2, cite: 'CFC § 903.2.1 as added by SAMC § 3-3.810', source: SRC.saPacket },
          fairfax:     { requires: Q_9032 + Q_6132 + ' Two exceptions: small Group U and small agricultural buildings.', exceptions: 2, cite: 'CFC § 903.2.1 as added by FMC § 8.04.100', source: SRC.ff899 },
          marin:       { requires: Q_9032 + ' Five exceptions, among them small detached structures beside an unsprinklered house, canopies, and small Group B or M buildings.', exceptions: 5, cite: 'CFC § 903.2.1 as added by MCC § 16.16.040', source: SRC.marinOrd },
        } },
      { key: 'remodel-triggers', label: 'Required on remodel', title: 'Sprinklers required on remodel', unit: '', rule: 'judgement', value: null,
        applies: 'A system the owner believes is voluntary may be a required one. That changes the weight of the maintenance finding.',
        open: 'The building’s permit history for the last 36 months.', turns: 'the building’s permit history',
        by: {
          ross:        { requires: Q_REMODEL, cite: 'CFC §§ 903.2.2, 903.2.2.1 as added by RMC § 14.04.100', source: SRC.rossPage },
          san_anselmo: { requires: Q_REMODEL, cite: 'CFC §§ 903.2.2, 903.2.2.1 as added by SAMC § 3-3.810', source: SRC.saPacket },
          fairfax:     { requires: Q_REMODEL, cite: 'CFC §§ 903.2.2, 903.2.2.1 as added by FMC § 8.04.100', source: SRC.ff899 },
          marin:       { requires: Q_REMODEL + ' In the county the 10% rule applies “in other than R-3 occupancies”.', cite: 'CFC §§ 903.2.2, 903.2.2.1 as added by MCC § 16.16.040', source: SRC.marinOrd,
                         extra: 'the 10% rule applies in other than R-3 occupancies', sayExtra: 'In {toName} the 10% remodel rule applies “in other than R-3 occupancies”.' },
        } },
      { key: 'out-of-service', label: 'Out of service', title: 'Taking the head out of service', unit: '', rule: 'judgement', value: null, requires: Q_9017,
        applies: 'Governs the replacement work itself, once the head is isolated. The last sentence is the local amendment.',
        open: 'Whether the system is a required one, and what the Fire Code Official requires while it is down.', turns: 'whether the system is a required one',
        by: {
          ross:        { cite: 'CFC § 901.7 as amended by RMC § 14.04.100', source: SRC.rossPage },
          san_anselmo: { cite: 'CFC § 901.7 as amended by SAMC § 3-3.810', source: SRC.saPacket },
          fairfax:     { cite: 'CFC § 901.7 as amended by FMC § 8.04.100', source: SRC.ff899 },
          marin:       { cite: 'CFC § 901.7 as amended by MCC § 16.16.040', source: SRC.marinOrd },
        } },
    ],
  },
  // =========================================================================
  // DAISY CHAIN — one relocatable power tap plugged into another
  //
  // Unlike the other two photographs, the rule here is statewide text, and it reads the same in every town: the
  // California Fire Code's electrical chapter, adopted whole. What changes at a town line is which ordinance
  // carries that chapter, which edition was in force before 1 Jan 2026, whether the town amended chapter 6 at
  // all, and what a violation of it costs. Those are the three local rows.
  // =========================================================================
  daisy: {
    state: [
      { key: 'tap-direct', label: 'Power taps', title: 'Taps plugged straight into a receptacle', value: null, unit: '', rule: 'tapDirect',
        cite: '2025 California Fire Code § 603.5.2', requires: Q_TAP_DIRECT + Q_TAP_EX,
        applies: 'The direct basis for the finding. The photograph shows one power tap plugged into another, and another tap is not a permanently installed receptacle.',
        open: 'Whether either exception is in play: the occupancy and the use of the room, which the photograph does not establish, and whether this is a 90-day performance test.',
        source: SRC.cfc6 },
      { key: 'tap-listing', label: 'Tap listing', title: 'Taps listed to a standard', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Fire Code § 603.5.1', requires: Q_TAP_LIST,
        applies: 'A separate requirement from the connection one. An unlisted tap is a finding of its own, whatever it is plugged into.',
        open: 'Whether either tap carries the mark. No listing mark is legible in the photograph.',
        turns: 'whether either tap carries a listing mark', source: SRC.cfc6 },
      { key: 'tap-install', label: 'Where the cords run', title: 'Cords not run through or under', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Fire Code § 603.5.3', requires: Q_TAP_INSTALL,
        applies: 'The cords lie loose across a carpeted floor. On top of a floor covering is not under one, but a cord crossing open floor raises the damage half of the same sentence.',
        open: 'Whether the cords are open to physical damage where they cross the floor, and whether any of them runs on under a door or a covering outside the frame.',
        turns: 'whether the cords are open to damage', source: SRC.cfc6 },
      { key: 'cords', label: 'Extension cords', title: 'Cords not standing in for wiring', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Fire Code § 603.6', requires: Q_CORD,
        applies: 'Cords leave the frame in three directions. If one of them is carrying a fixed load in place of an outlet that should have been installed, this section is the finding rather than the tap one.',
        open: 'What is on the far end of each cord, and how long the arrangement has stood.',
        turns: 'what the cords leaving the frame are feeding', source: SRC.cfc6 },
    ],
    stateNote: 'The rule is state text and it reads the same in all five places. Chapter 6 was reorganised in the 2025 edition: these sections were numbered § 605.x before it, and § 605 now addresses fuel-fired appliances. What changes with the place is the ordinance that carries the chapter, the edition in force before 1 Jan 2026, and what a violation costs.',
    local: [
      { key: 'ch6-amend', label: 'Chapter 6 amendments', title: 'Local changes to chapter 6', diffName: 'chapter 6', unit: '', rule: 'judgement', value: null,
        requires: '§ 605.11.3 Required conduit. “All wiring that may contain electrical potential when the alternate service disconnect has been activated, (such as the wiring between the solar arrays and the DC electrical disconnect on a photovoltaic system) shall be completely contained in metal conduit.” § 605.11.4 Disconnect. “The electrical service disconnect for the alternative power supply shall be located within eight feet from the electrical service disconnect on the same or an adjacent exterior wall. The disconnect shall be accessible to emergency personnel from the exterior without the use of ladders or other special equipment.” § 605.11.5 adds a permanent red warning sign at the main disconnect. San Anselmo is the only one of the four that writes anything into chapter 6 at all.',
        applies: 'Nothing in it touches power taps. It is on screen because it is the one place in this valley where a chapter 6 citation may not be the state text as printed: read the local chapter before citing, not only the state one.',
        open: 'The ordinance numbers these into § 605.11, which in the 2025 edition is part of Fuel-Fired Appliances. Read as introduced in the Council packet of 28 Oct 2025; confirm the numbering against the adopted ordinance.',
        turns: 'nothing here; the amendment is about solar supply',
        by: { san_anselmo: { cite: 'SAMC § 3-3.810 · Ord. 2025-1194', code: 'SAMC § 3-3.810', sec: '§§ 605.11.3–605.11.5', source: SRC.saPacket } } },
      { key: 'penalties', label: 'Penalties', title: 'What a violation carries', diffName: 'penalty', unit: '', rule: 'judgement', value: null,
        requires: Q_PENALTY,
        applies: 'The same clause, amended into chapter 1 at a different section number in every town, and not to the same figures.',
        open: 'Whether the official proceeds criminally or by administrative citation.',
        turns: 'whether the official cites criminally or administratively',
        by: {
          ross:        { sec: '§ 113.4', cite: 'CFC § 113.4 as amended by RMC § 14.04.100 · Ord. 732', code: 'RMC § 14.04.140', source: SRC.rossPage,
                         applies: 'Ross amends this into § 113.4 and prints the clause above word for word.' },
          san_anselmo: { sec: '§§ 109.4, 111.4', cite: 'CFC §§ 109.4, 111.4 as amended by SAMC § 3-3.810 · penalties at SAMC § 3-3.812', code: 'SAMC § 3-3.812', source: SRC.saPacket,
                         requires: '§ 109.4 is amended by specifying “[offense = misdemeanor] [amount $500.00] [Number of days =90]”, where the other three say 180 days. § 111.4 fines are set at “Not less than [$500.00] not more than [$1,500.00]”. SAMC § 3-3.812 adds an administrative route: “The first citation, within a 12-month period, for violations of the Fire Code and any amendments adopted herein shall be treated as a Civil Penalty payable directly to the Ross Valley Fire Department and is set at $150 plus the actual costs of all inspections required to gain compliance”.',
                         applies: 'The one town of the four that does not simply reprint the clause: 90 days rather than 180, a fine range, and a $150 first citation.',
                         extra: 'an administrative citation at $150 for a first offence',
                         sayExtra: '{To} can take this administratively: $150 for a first citation in 12 months.',
                         open: 'Whether the first-citation route is used here, and what the inspection costs come to.' },
          fairfax:     { sec: '§ 113.4', cite: 'CFC § 113.4 as amended by FMC § 8.04.100 · Ord. 899', code: 'FMC § 8.04.100', source: SRC.ff899,
                         applies: 'The same section number as Ross, and the same clause but for two words: Fairfax prints “Persons who violate” and “who erect”.' },
          marin:       { sec: '§ 110.4', cite: 'CFC § 110.4 as amended by MCC § 16.16.040 · Ord. 3837', code: 'MCC § 16.16.040', source: SRC.marinOrd,
                         applies: 'The clause above word for word, but the county amends it into § 110.4, not § 113.4. Cite the number this county uses.' },
        } },
    ],
  },
  // =========================================================================
  // FIRE DOOR — held open by a wedge
  //
  // Like the power taps, the rule is statewide text adopted whole, and it reads the same in the four Ross Valley
  // places: none of their ordinances touches chapter 7. The photograph settles the first section by itself (the
  // wedge is in it). The other three are about what the door does, and only someone standing at it can say.
  // =========================================================================
  firedoor: {
    state: [
      { key: 'door-blocked', label: 'Fire doors', title: 'Not blocked, obstructed or made inoperable', value: null, unit: '', rule: 'doorBlocked',
        cite: '2025 California Fire Code § 705.2', requires: Q_DOOR_BLOCK,
        applies: 'The direct basis for the finding. A wedge driven under the leaf holds the door off its latch, and a fire door that cannot swing shut has been made inoperable.',
        open: 'The door’s rating and the assembly it protects. Both are on the label, and no label is legible in the photograph.',
        source: SRC.cfc7 },
      { key: 'door-latch', label: 'Closing and latching', title: 'Closes from full open and latches', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Fire Code § 705.2.4', requires: Q_DOOR_LATCH,
        applies: 'What the door must do once the wedge is gone. Taking the wedge out answers § 705.2 only if the door then travels the whole way and the latch engages on its own.',
        open: 'Whether it closes from the full-open position and latches without a hand on it. Only someone at the door can try it.',
        turns: 'whether the door closes and latches on its own', source: SRC.cfc7 },
      { key: 'door-closer', label: 'Closer', title: 'The closer kept in working order', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Fire Code § 705.2.3', requires: Q_DOOR_HOLD,
        applies: 'A closer arm is fitted at the head of this door. If it has failed, the wedge may be standing in for it, and the section says the door is to be kept closed until it is repaired.',
        open: 'Whether the closer still works, and whether the wedge is there because it does not.',
        turns: 'whether the closer still works', source: SRC.cfc7 },
      { key: 'door-sign', label: 'Sign', title: 'A sign on or near the door', value: null, unit: '', rule: 'judgement',
        cite: '2025 California Fire Code § 705.2.2', requires: Q_DOOR_SIGN,
        applies: 'The second correction, and the one that is not owed everywhere: the sign is owed where the fire code official requires it, and which of the two legends belongs here depends on whether the door is kept normally open or normally closed.',
        open: 'Whether the official requires a sign on this door, and which legend it carries.',
        turns: 'whether the official requires a sign here', source: SRC.cfc7 },
    ],
    stateNote: 'The rule is state text and it reads the same in the four Ross Valley places: not one of their ordinances writes anything into chapter 7. Berkeley does, and adds a sentence to § 705.2.5 about doors held open on fusible links. What else changes with the place is the ordinance that carries the chapter and what a violation costs.',
    local: [],
  },
};

// The same penalty clause stands behind any fire code citation, so the fire-door photograph carries the row the
// power-tap one defines. The row and its map of places are copied rather than shared, because the Berkeley join
// below writes a by.berkeley into the row of whichever photograph it is joining.
const penaltiesRow = rows.daisy.local.find(r => r.key === 'penalties');
rows.firedoor.local.push(Object.assign({}, penaltiesRow, { by: Object.assign({}, penaltiesRow.by) }));

// Short citations for the one-line rows: the section number (the same in every town) and the local code that
// carries it (this is the part that changes at a town line). The full citation stays on each row as `cite`.
const WUI = { ross: 'RMC ch. 14.16', san_anselmo: 'SAMC § 3-3.1002', fairfax: 'FMC § 8.06.011', marin: 'MCC § 16.16.060' };
const FIRE = { ross: 'RMC § 14.04.100', san_anselmo: 'SAMC § 3-3.810', fairfax: 'FMC § 8.04.100', marin: 'MCC § 16.16.040' };
const PEN = { ross: 'RMC § 14.04.140', san_anselmo: 'SAMC § 3-3.812', fairfax: 'FMC § 8.04.100', marin: 'MCC § 16.16.040' };
const short = {
  'state-defensible': { sec: 'PRC § 4290', code: 'Gov. Code §§ 51175–51189' },
  'ladder-reach': { sec: '§ 604.6(7)', code: WUI }, 'hazard-veg': { sec: '§ 604.6(1)', code: WUI }, 'canopy': { sec: '§ 604.6(8)', code: WUI }, 'roadside': { sec: '§ 604.7', code: WUI },
  'brush-nuisance': { sec: 'ch. 8.24', code: { fairfax: 'Fairfax Municipal Code' } }, 'fire-hazard': { sec: '§ 325.5.2', code: { marin: 'MCC § 16.16.040' } },
  'maintenance': { sec: '§ 901.6', code: 'California Fire Code' }, 'itm-standard': { sec: '§ 903.5', code: 'NFPA 25 § 5.2.1.1.1' }, 'residential': { sec: '§ R309.3.2.6', code: 'Residential Code' },
  'required-system': { sec: '§ 903.2.1', code: FIRE },
  'tap-direct': { sec: '§ 603.5.2', code: 'California Fire Code' }, 'tap-listing': { sec: '§ 603.5.1', code: 'UL 1363 · UL 498A' },
  'tap-install': { sec: '§ 603.5.3', code: 'California Fire Code' }, 'cords': { sec: '§ 603.6', code: 'California Fire Code' },
  'ch6-amend': { sec: '§§ 605.11.3–605.11.5', code: { san_anselmo: 'SAMC § 3-3.810' } },
  'door-blocked': { sec: '§ 705.2', code: 'California Fire Code' }, 'door-latch': { sec: '§ 705.2.4', code: 'California Fire Code' },
  'door-closer': { sec: '§ 705.2.3', code: 'California Fire Code' }, 'door-sign': { sec: '§ 705.2.2', code: 'California Fire Code' },
  'smoke-doors': { sec: '§ 705.2.5', code: { berkeley: 'BMC § 19.48.050' } },
  'penalties': { sec: '§ 113.4', code: PEN }, 'remodel-triggers': { sec: '§§ 903.2.2, 903.2.2.1', code: FIRE }, 'out-of-service': { sec: '§ 901.7', code: FIRE },
};

const disclosure = 'A demonstration. Each verdict is this app’s reading of the cited text, and the inspector decides. Yellow rows are judgement calls: inspectors may read them differently.';

// ------------------------------------------------------------------ Berkeley, the fifth place
// Every word of law, every citation and every source for Berkeley is in data/city4/law.js (window.FIREGEO_CITY4),
// prepared by a researcher from the City's own ordinances and checked by data/city4/tools/check.js against the
// downloaded text. This block only joins those rows to the ones above, by meaning, and adds how each is shown on one
// line. If that file is not loaded there are four places and nothing below runs.
//
// Rows that already exist (ladder-reach, hazard-veg, roadside, required-system, remodel-triggers, out-of-service) get
// a by.berkeley entry, so the same row stays on screen and changes. Rows only Berkeley has are added as new
// definitions, placed so that both the Ross Valley order and the Berkeley order (5 ft, 30 ft, 100 ft) read naturally.
// There is no canopy row for Berkeley: its text has no trunk-diameter rule.
const C4 = (typeof window !== 'undefined' ? window : globalThis).FIREGEO_CITY4;
// Answers when the map moves between the two regions: one plain sentence about the place arrived in.
const across = { ladder: 'In {toName} the rule is ladder fuels within {reach} ft.', sprinkler: '{To} requires sprinklers in every new building.', daisy: 'In {toName} the same state chapter 6 applies, under its own ordinance.', firedoor: 'In {toName} the same state chapter 7 applies, under its own ordinance.' };
if (C4) {
  places.berkeley = {
    id: 'berkeley', name: C4.name, short: C4.short, inSentence: C4.inSentence, kind: C4.kind, carried: true, region: 'berkeley', zoneModel: 'berkeley',
    agency: C4.agency, agencyShort: 'Berkeley Fire', agencyCite: C4.agencyCite, fireCode: C4.fireCode, wuiCode: C4.wuiCode,
    sources: C4.sources, adopted: C4.adopted, pending: C4.pending, zoneSource: 'City of Berkeley fire map',
    // 'In parts of': Zone 0 is required in the two mitigation areas only, not in all of the hills (§ 604.3.2).
    across: {
      ladder: 'In parts of Berkeley’s hills nothing that burns may stand within 5 ft of the house.',
      sprinkler: 'In Berkeley sprinkler retrofits go by building type.',
      daisy: 'Berkeley carries the same state chapter 6, under its own fire code.',
      firedoor: 'Berkeley is the one place here that writes into chapter 7.',
    },
  };
  // The Berkeley picture also shows land past the city limit (Albany, Kensington, Oakland, the regional park).
  places.east_bay = {
    id: 'east_bay', name: 'Outside the Berkeley city limit', short: 'Outside Berkeley', inSentence: 'this side of the limit', kind: 'Another city, or county land', carried: false, region: 'berkeley',
    agency: 'Another fire agency', agencyShort: 'Another fire agency', agencyCite: '',
    why: 'On this map only the City of Berkeley is carried. Past its limit another city’s or the county’s code applies, and that text was not loaded for this demonstration.',
    notCovered: 'Outside the Berkeley city limit.', onlyState: 'Only statewide rules past the city limit.', sources: [],
  };
  // How each Berkeley row is shown on one line. label / title only where they differ from the shared row. turns is
  // shortened where the researcher's phrase would not fit the one-line reason; the full sentence stays in "open".
  // brief: [first words, last words] of the one passage of the row's text that is shown on the main view. It is cut
  // out of the researcher's text as it stands, so it is always a verbatim part of it; the whole text is in the sheet.
  // sec: the section number as far as its subsection, for the one-line row (three rules sit in § 604.3.1(7); the
  // letters are in the full citation, which the chosen rule shows).
  const SHOW = {
    'zone-zero':        { phrase: ['clear within ', ' ft'], diffName: 'Zone 0', sec: '§ 604.3.2(1)', brief: ['“Maintain all areas within five', 'combustible material.”'] },
    'ladder-reach':     { brief: ['“Where shrubs or small trees', 'whichever is greater.”'] },
    'vertical-spacing': { label: 'Tree and shrub spacing', phrase: ['within ', ' ft'], diffName: 'tree-spacing', sec: '§ 604.3.1(7)', brief: ['“Create horizontal and vertical spacing', 'clearance requirements.”'] },
    'shrub-spacing':    { label: 'Gaps between shrubs', diffName: 'shrub-gap', sec: '§ 604.3.1(7)', brief: ['“Flat or mild slope', 'Six times the height of the shrub”'] },
    'hazard-veg':       { sec: '§ 604.3.1(7)', brief: ['“Remove vegetative and combustible material', 'shall be removed.”'] },
    'roadside':         { brief: ['“The code official is authorized', 'vegetation growth.”'] },
    'compliance-plan':  { quiet: 'Guide p. 17', diffName: 'time-to-comply', brief: ['“Violations focus on', 'few years to achieve.”'] },
    'required-system':  { turns: 'whether state law or a local rule required this system', sec: '§ 903.2, four cases', brief: ['Berkeley adds no rule', 'four cases of its own.'] },
    'remodel-triggers': { label: 'Required in existing buildings', title: 'Sprinklers required in existing buildings', brief: ['No trigger by floor area added.', 'by building type.'] },
    'out-of-service':   { brief: ['Not amended in Berkeley.', 'applies as written.'] },
    'replacement-head': { turns: 'whether this is a sleeping room in a retrofitted hotel', diffName: 'replacement-head', brief: ['“In the sleeping units', 'shall be used.”'] },
    'smoke-doors':      { diffName: 'smoke-door', sec: '§ 705.2.5', brief: ['“Doors required for fire and smoke separation', 'with fusible links.”'] },
  };
  const cut = (text, ends) => { if (!ends) return null; const i = text.indexOf(ends[0]), j = i < 0 ? -1 : text.indexOf(ends[1], i); return j < 0 ? null : text.slice(i, j + ends[1].length); };
  const AFTER = { 'vertical-spacing': 'ladder-reach', 'shrub-spacing': 'vertical-spacing' };   // new rows that sit after a named row; zone-zero goes first, the rest last
  for (const photo of ['ladder', 'sprinkler', 'firedoor']) {
    const defs = rows[photo].local;
    C4.rows[photo].forEach(r => {
      const show = SHOW[r.key] || {};
      let def = defs.find(d => d.key === r.key);
      if (!def) {
        def = { key: r.key, label: show.label || r.label, title: r.title, unit: r.unit || '', rule: r.rule, value: null, phrase: show.phrase || null, diffName: show.diffName || null, quiet: show.quiet || null, by: {} };
        if (r.key === 'zone-zero') defs.unshift(def);
        else if (AFTER[r.key]) defs.splice(defs.findIndex(d => d.key === AFTER[r.key]) + 1, 0, def);
        else defs.push(def);
      }
      const by = { value: r.value, cite: r.cite, requires: r.requires, applies: r.applies, open: r.open, source: r.source, rule: r.rule, sec: show.sec || r.sec, code: r.code, words: r.words, zone: r.zone };
      by.citeShort = r.cite.replace(/ · Ord\. [\d,]+-N\.S\.$/, '');                                  // the main view names the code section; the ordinance number is in the sheet
      const brief = cut(r.requires, show.brief); if (brief) by.brief = brief;
      if (r.extra) by.extra = r.extra;
      if (show.turns || r.turns) by.turns = show.turns || r.turns;
      if (def.by.ross && (show.label || r.label) !== def.label) by.label = show.label || r.label;      // a shared row whose name differs here
      if (def.by.ross && (show.title || r.title) !== (def.title || def.label)) by.title = show.title || r.title;
      def.by.berkeley = by;
    });
  }

}

return { places, rows, short, sources: SRC, disclosure, across };
})();
