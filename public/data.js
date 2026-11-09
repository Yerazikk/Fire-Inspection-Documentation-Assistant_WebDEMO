// Hard-coded demo content. The oleander case (a1) is the live demo location; the others carry history only.
window.CONFIG = {
  dept: 'Marin County Fire Department', unit: 'Vegetation Management Unit',
  inspector: { name: 'D. Alvarez', badge: 'VM-214', email: 'vegetation@marinfire.example.gov', phone: '(415) 555-0142' },
  // Headquarters. Every route starts here, from this real coordinate — Marin
  // County Fire's station on Castle Rock Ave in Woodacre.
  station: { name: 'Marin County Fire HQ', addr: '33 Castle Rock Ave, Woodacre, CA', lat: 38.00715, lon: -122.63599 },
  // Windows and citations transcribed from Marin County Code ch. 16.16 as
  // re-established by Ordinance No. 3837, §III (2025), effective 2026-01-01
  // (see ai/codes.js for the verbatim text and the source). They are much
  // shorter than a generic "45 days":
  //   correctionDays — CFC §325.9.1 as added by MCC §16.16.040: the Notice to
  //     Abate requires removal within 10 days of the date of the notice.
  //     §325.9.3 drops that to 5 days for an immediate hazard, and §325.9.3.1
  //     to immediately in exigent circumstances.
  //   appealDays — MCC §16.16.065: 15 days to appeal the Hearing Officer's
  //     decision. This is NOT 15 days from the notice; the informal hearing
  //     before the Fire Chief comes first. 72 hours for an immediate hazard.
  //   Both windows survived the re-adoption unchanged; the section numbers did
  //   not. Ord. 3837 moved §322.x to §325.x and appeals from §16.16.055 to
  //   §16.16.065 — do not resurrect the old numbers.
  correctionDays: 10, appealDays: 15,
  codeEdition: '2025 California Fire Code and 2025 California Wildland-Urban Interface Code, as adopted and amended by Marin County Code ch. 16.16 (Ord. No. 3837), effective 1 January 2026',
  localCode: 'California Wildland-Urban Interface Code §604.6 (Marin County Code §16.16.060)',
  portal: 'Accela Citizen Access',
};

// The seeded typeahead entries. Addresses typed by hand are geocoded for real
// (see geo.js) and appended to this list at runtime. These ten are real houses
// in the Marin County wildland-urban interface, geocoded to their true
// coordinates: the router snaps each to the road network so the legs between
// them are genuine drives, and sat.js frames satellite imagery on the same
// point, so the picture is the actual property. Owners are invented.
// x,y are only for the stylised fallback map, and are derived from lat/lon below.
window.ADDRESSES = [
  { id: 'a1', addr: '29 Ridgecrest Rd', where: 'Kentfield, CA', lat: 37.94179, lon: -122.55726, owner: { name: 'M. Okafor', email: 'm.okafor@example.com' }, demo: true },
  { id: 'a2', addr: '90 Eldridge Ave', where: 'Mill Valley, CA', lat: 37.91263, lon: -122.54800, owner: { name: 'R. Chen', email: 'r.chen@example.com' } },
  { id: 'a3', addr: '250 Madrone Ave', where: 'Baltimore Canyon, Larkspur, CA', lat: 37.93157, lon: -122.54500, owner: { name: 'S. Patel', email: 's.patel@example.com' } },
  { id: 'a4', addr: '40 Idlewood Rd', where: 'Kent Woodlands, Kentfield, CA', lat: 37.94690, lon: -122.56282, owner: { name: 'J. Romero', email: 'j.romero@example.com' } },
  { id: 'a5', addr: '60 Via Los Altos', where: 'Tiburon, CA', lat: 37.90442, lon: -122.50405, owner: { name: 'A. Lindqvist', email: 'a.lindqvist@example.com' } },
  { id: 'a6', addr: '99 Cloud View Rd', where: 'Sausalito, CA', lat: 37.85255, lon: -122.48725, owner: { name: 'T. Nguyen', email: 't.nguyen@example.com' } },
  { id: 'a7', addr: '45 Scenic Ave', where: 'San Anselmo, CA', lat: 37.97820, lon: -122.57490, owner: { name: 'K. Abiodun', email: 'k.abiodun@example.com' } },
  { id: 'a8', addr: '310 Butterfield Rd', where: 'San Anselmo, CA', lat: 37.99695, lon: -122.57637, owner: { name: 'P. Castellanos', email: 'p.castellanos@example.com' } },
  { id: 'a9', addr: '120 Bolinas Rd', where: 'Fairfax, CA', lat: 37.98515, lon: -122.59020, owner: { name: 'L. Moreau', email: 'l.moreau@example.com' } },
  { id: 'a10', addr: '150 Belvedere Ave', where: 'Belvedere Island, Belvedere, CA', lat: 37.86867, lon: -122.46673, owner: { name: 'H. Yamada', email: 'h.yamada@example.com' } },
];

// lat/lon → the 0–100 map space the fallback map draws in. Marin County, from
// Novato down to the Golden Gate.
window.BBOX = { lat0: 38.04, lat1: 37.83, lon0: -122.67, lon1: -122.43 };
window.toMapXY = (lat, lon) => {
  const b = window.BBOX;
  return { x: Math.max(-20, Math.min(120, (lon - b.lon0) / (b.lon1 - b.lon0) * 100)),
           y: Math.max(-20, Math.min(120, (lat - b.lat0) / (b.lat1 - b.lat0) * 100)) };
};
window.placeXY = a => { const p = window.toMapXY(a.lat, a.lon); a.x = p.x; a.y = p.y; return a; };
[window.CONFIG.station, ...window.ADDRESSES].forEach(window.placeXY);

// Scan boxes in viewfinder % for the demo photo
window.SCAN = {
  violation: { boxes: [
    { label: 'Canopy · oleander ≈ 14 ft', box: [3, 26, 74, 26], tone: 'cyan' },
    { label: 'Hedge ≈ 5 ft', box: [3, 59, 60, 9], tone: 'cyan' },
    { label: 'Ground cover ≈ 1.5 ft', box: [3, 69, 68, 18], tone: 'cyan' },
    { label: 'Residence', box: [68, 61, 29, 8], tone: 'cyan' },
  ], issue: { label: 'Violation · no gap, hedge touches canopy', box: [3, 54.5, 66, 3.5], tone: 'red' } },
  compliance: { boxes: [
    { label: 'Canopy · oleander ≈ 14 ft', box: [3, 26, 74, 28], tone: 'cyan' },
    { label: 'Hedge ≈ 5 ft', box: [3, 59, 66, 9], tone: 'cyan' },
    { label: 'Ground cover ≈ 1.5 ft', box: [3, 69, 68, 18], tone: 'cyan' },
  ], issue: { label: 'Compliant · retaining wall base clear', box: [3, 86, 68, 6], tone: 'green' } },
};

window.STREAM = [
  { t: 'Reading capture', d: 'GPS lock · heading 312°' }, { t: 'Resolving parcel', d: 'VHFHSZ · last inspected Jun 2025' },
  { t: 'Recognising elements', d: 'vegetation, structure, utilities' }, { t: 'Estimating heights', d: 'pole and hedge line as scale' },
  { t: 'Checking the memo against the scene', d: 'ladder fuel · 30 ft zone' }, { t: 'Matching code library', d: 'WUI §604.6 · CFC §325.6 · PRC §4291 · 14 CCR §1299.03' },
  { t: 'Drafting the record', d: 'severity · estimates · recommendations' },
];

// Fallback text, used only when the drafting server is unavailable (no key, or
// offline). The real report and notice are drafted per property from the
// inspector's notes and ai/codes.js — see drafts.js and ai/prompts.js. These
// strings are generic by design: they are not findings about any property.
window.AI = {
  violation: {
    summary: [
      ['Observed', 'Continuous ladder fuel within 30 ft of an occupied residence.'],
      ['Layers', 'Ground cover and succulents → clipped hedge (≈ 5 ft) → unpruned oleander canopy (≈ 14 ft).'],
      ['Separation', 'None. No vertical or horizontal gap between any two layers.'],
      ['Fire path', 'Surface fire climbs the hedge into the canopy, then reaches the roofline and the overhead conductors.'],
      ['Exposure', 'Wood-shingle residence ≈ 22 ft downslope; retaining wall and driveway edge carry fuel to the street.'],
    ],
    severity: { level: 'Moderate-High', score: 72, why: 'Continuous ladder to canopy within Zone 1, downslope structure, conductors overhead.' },
    category: ['Ladder fuel', 'Zone 1 (5–30 ft)', 'Vertical clearance', 'Horizontal continuity'],
    estimates: [['Canopy height', '≈ 14 ft'], ['Hedge height', '≈ 5 ft'], ['Vertical gap', '0 ft (required ≥ 15 ft, 3 × 5 ft)'], ['Canopy base', '≈ 4 ft (required ≥ 6 ft)'], ['Hedge run', '≈ 40 ft unbroken'], ['Distance to structure', '≈ 22 ft'], ['Slope', '≈ 25 % · spacing class 20–40 %']],
    codes: [
      { scope: 'Local', c: 'California Fire Code §325.6 (added by Marin County Code §16.16.040)', t: 'Governs abatement of combustible material creating a fire hazard upon premises, referencing Gov. Code §§51175–51189 and PRC §4291.' },
      { scope: 'State', c: 'PRC §4291 · Gov. Code §§51175–51189', t: '100 ft of defensible space, intensified between 5 and 30 ft, with an ember-resistant zone within 5 ft (Zone 0 regulations adopted Aug 2026, phased in — not yet enforceable).' },
      { scope: 'State', c: '14 CCR §1299.03', t: 'Zone 1 to 30 ft and Zone 2 from 30 to 100 ft; vertical clearance 3× the lower fuel height, horizontal spacing by slope.' },
      { scope: 'Local', c: 'California Wildland-Urban Interface Code §604.6 (Marin County Code §16.16.060)', t: 'Cut and remove hazardous vegetation and ground coverings within 100 ft of structures, up to 200 ft where topography or fuel type requires; remove growth under 3 in. diameter from the ground to 10 ft, but no more than the lower one-third of the tree; ladder fuels removed within 30 ft of the structure.' },
    ],
    recs: [
      { id: 's1', img: 'assets/s1.png', title: 'Raise the canopy', text: 'Trim the oleander branches up to 10 ft and cut the hedge down to 3 ft, so there is open space between the hedge and the canopy.' },
      { id: 's2', img: 'assets/s2.png', title: 'Drop the middle layer', text: 'Cut the hedge down to 2 ft and clear the ground cover 3 ft back from it, so nothing carries fire up into the canopy.' },
      { id: 's3', img: 'assets/s3.png', title: 'Break the hedge into islands', text: 'Cut 10-ft gaps through the hedge and keep each section’s lowest branches 6 ft off the ground.' },
      { id: 's4', img: 'assets/s4.png', title: 'Replace the oleander', text: 'Remove the oleander and hedge; plant low, spaced plants no taller than 3 ft, 2 ft apart, on a gravel bed.' },
      { id: 's5', img: 'assets/s5.png', title: 'Harden the base', text: 'Strip the ivy and leaf litter, lay 3 in. of gravel with the succulents 2 ft apart, and clear dead wood inside the oleander. Pair with one of the others.' },
    ],
  },
  compliance: {
    summary: [['Observed', 'Retaining-wall base and planting bed are clear of leaf litter and dead material.'], ['Condition', 'Succulents spaced on bare soil; no ladder from the bed into the hedge.'], ['Result', 'Meets the ember-resistant base requirement for this side of the property.']],
    severity: { level: 'Compliant', score: 0, why: 'No corrective action for this item.' },
    category: ['Zone 0 (0–5 ft)', 'Surface fuel'], estimates: [['Litter depth', '< 1 in.'], ['Plant spacing', '≈ 2 ft']],
    codes: [{ scope: 'State', c: 'PRC §4291 (ember-resistant zone)', t: 'Checked · meets.' }, { scope: 'Local', c: 'California Wildland-Urban Interface Code §604.6 (Marin County Code §16.16.060)', t: 'Checked · meets.' }], recs: [],
  },
  note: {
    summary: [['Note', 'Owner reports the north gutters were cleaned last week; not verified by photo today.'], ['Follow-up', 'Verify at reinspection or ask the owner for a photo.']],
    severity: { level: 'Note', score: 0, why: 'Informational; no determination made.' }, category: ['Owner statement', 'Follow-up'], estimates: [],
    codes: [], recs: [],
  },
};
// There are no canned memos here any more. `MEMOS` used to hold one sentence
// per entry kind, which holding the mic typed out word by word on a timer; the
// microphone is now really opened and the recording really transcribed (see
// public/voice.js), so a fixture in that path would be a fabricated quotation
// of the inspector. If voice is unavailable the keyboard opens and says why.

// Reference photos that ship with the app, offered alongside the device's own
// photo library so an entry can be built without a camera to hand. The last two
// are not vegetation; they are kept because an inspection turns up building
// items too.
window.PHOTOLIB = [
  { id: 'v1', src: 'assets/v1.jpg', label: 'Leaf litter against siding' },
  { id: 'v2', src: 'assets/v2.jpg', label: 'Firewood under a deck' },
  { id: 'v3', src: 'assets/v3.jpg', label: 'Dead hedge at the wall' },
  { id: 'v4', src: 'assets/v4.jpg', label: 'Limb over the roof' },
  { id: 'v5', src: 'assets/v5.jpg', label: 'Driveway under canopy' },
  { id: 'v6', src: 'assets/v6.jpg', label: 'Propane tank overgrown' },
  { id: 'v6s', src: 'assets/v6.png', label: 'Sprinkler head' },
  { id: 'v7', src: 'assets/v7.png', label: 'Blocked exit door' },
];

window.KB = [
  { id: 'k1', title: 'Vertical clearance standard', src: '14 CCR §1299.03 · Figure 3', why: 'matches "ladder fuel"', size: '1 p · diagram' },
  { id: 'k2', title: 'Horizontal spacing by slope', src: 'CAL FIRE spacing table', why: 'slope ≈ 25 % → 20–40 % class', size: '1 p · table' },
  { id: 'k3', title: 'Fire-smart plant list', src: 'Dept. landscape guidance', why: 'oleander, privet, ivy present', size: '4 p · list' },
  { id: 'k4', title: 'Zone 0 ember-resistant zone guidance', src: 'Board of Forestry · 2025', why: 'bed meets the retaining wall', size: '2 p' },
  { id: 'k5', title: 'How to self-report with photos', src: 'Vegetation Management Unit', why: 'closes the case without a fee', size: '1 p' },
  { id: 'k6', title: 'Reinspection and fee schedule', src: 'Master Fee Schedule · FY 26', why: 'required with every notice', size: '1 p' },
];
window.KB_INDEX = ['defensible-space/zones.pdf', 'defensible-space/vertical-clearance.fig3', 'spacing/slope-table-2023.csv', 'plants/fire-prone-list.json', 'plants/fire-smart-list.json', 'zone0/bof-rulemaking-2025.pdf', 'process/self-report-photos.md', 'process/fee-schedule-fy26.pdf', 'process/appeals.md', 'roofs/class-a-assemblies.pdf', 'vents/ember-resistant-vents.pdf', 'access/driveway-clearance.md', 'address/visibility-4in.md', 'firewood/storage-30ft.md'];

// History: past inspections per address (snapshots). Entries are lightweight.
window.HISTORY = {
  a1: [{ date: '2025-06-12', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Defensible space maintained on all sides.', geo: [58, 46], time: '09:50' }] },
       { date: '2024-06-20', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Firewood stacked against the north wall.', geo: [30, 40], time: '11:12' }, { n: 2, kind: 'compliance', note: 'Roof clear.', geo: [62, 30], time: '11:20' }] },
       { date: '2023-07-03', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Hedge limbed to 6 ft after last year’s notice.', geo: [40, 58], time: '10:05' }, { n: 2, kind: 'note', note: 'Owner asked about ember-resistant vents.', geo: [50, 34], time: '10:15' }] },
       { date: '2022-06-15', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Ladder fuel under the oleander on the street side.', geo: [36, 60], time: '13:40' }] }],
  a2: [{ date: '2026-10-28', outcome: '1 violation · open', entries: [{ n: 1, kind: 'violation', note: 'Grass over 4 in. along the east fence.', geo: [70, 60], time: '14:05' }] },
       { date: '2025-10-30', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Grass mowed; fence line clear.', geo: [70, 60], time: '14:20' }] },
       { date: '2024-11-02', outcome: '2 violations · corrected', entries: [{ n: 1, kind: 'violation', note: 'Grass over 4 in. along the east fence.', geo: [70, 60], time: '09:30' }, { n: 2, kind: 'violation', note: 'Leaf litter in the north gutter.', geo: [48, 26], time: '09:38' }] }],
  a3: [{ date: '2026-10-21', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Propane tank clearance maintained.', geo: [40, 52], time: '10:30' }] },
       { date: '2025-10-23', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Woodpile within 10 ft of the propane tank.', geo: [40, 52], time: '10:10' }] },
       { date: '2024-10-17', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'All clearances met.', geo: [52, 44], time: '11:00' }] }],
  a4: [{ date: '2026-10-14', outcome: 'Compliant', entries: [{ n: 1, kind: 'note', note: 'New owner; sent welcome packet.', geo: [50, 50], time: '15:10' }] },
       { date: '2025-10-09', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Juniper hedge against the garage wall.', geo: [28, 48], time: '15:40' }, { n: 2, kind: 'compliance', note: 'Address numbers visible from the street.', geo: [60, 84], time: '15:48' }] }],
  a5: [{ date: '2025-11-06', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Roof and gutters clear; deck free of debris.', geo: [56, 40], time: '12:15' }] }],
  a6: [{ date: '2026-11-04', outcome: '2 violations · open', entries: [{ n: 1, kind: 'violation', note: 'Juniper against the deck.', geo: [36, 64], time: '09:10' }, { n: 2, kind: 'violation', note: 'Dead pine limbs over the roof.', geo: [60, 28], time: '09:25' }] },
       { date: '2025-11-05', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Dead pine limbs over the roof.', geo: [60, 28], time: '09:40' }] },
       { date: '2024-11-07', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Deck perimeter clear.', geo: [36, 64], time: '09:55' }] },
       { date: '2023-11-09', outcome: '3 violations · corrected', entries: [{ n: 1, kind: 'violation', note: 'Juniper against the deck.', geo: [36, 64], time: '08:50' }, { n: 2, kind: 'violation', note: 'Firewood under the deck.', geo: [40, 70], time: '08:58' }, { n: 3, kind: 'violation', note: 'Grass over 4 in. at the road edge.', geo: [50, 88], time: '09:05' }] }],
  a7: [{ date: '2026-10-07', outcome: '1 violation · open', entries: [{ n: 1, kind: 'violation', note: 'Bay laurel limbs overhang the carport roof.', geo: [52, 30], time: '11:20' }] },
       { date: '2025-10-09', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Chimney spark arrester fitted and clear.', geo: [52, 30], time: '11:05' }] }],
  a8: [{ date: '2026-09-30', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Driveway clearance 14 ft; address numbers reflective.', geo: [46, 78], time: '13:25' }] },
       { date: '2025-10-02', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Broom thicket along the creek bank within 30 ft.', geo: [24, 62], time: '13:40' }] },
       { date: '2024-10-04', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Creek bank cleared and replanted low.', geo: [24, 62], time: '14:00' }] }],
  a9: [{ date: '2026-10-02', outcome: '2 violations · open', entries: [{ n: 1, kind: 'violation', note: 'Eucalyptus bark litter piled against the fence.', geo: [68, 52], time: '08:45' }, { n: 2, kind: 'violation', note: 'Propane tank with grass to the base.', geo: [34, 44], time: '08:58' }] },
       { date: '2025-10-06', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Eucalyptus bark litter piled against the fence.', geo: [68, 52], time: '09:10' }] }],
  a10: [{ date: '2026-09-23', outcome: 'Compliant', entries: [{ n: 1, kind: 'compliance', note: 'Terraced beds gravelled; no fuel within 5 ft of the wall.', geo: [44, 56], time: '15:05' }, { n: 2, kind: 'note', note: 'Owner planning to re-roof in Class A next spring.', geo: [56, 32], time: '15:12' }] },
       { date: '2025-09-25', outcome: '1 violation · corrected', entries: [{ n: 1, kind: 'violation', note: 'Ivy climbing the north elevation to the eaves.', geo: [30, 38], time: '15:20' }] }],
};
// Previous days for the Days screen (address ids per day)
window.DAYS = [
  { label: 'Yesterday', date: '2026-11-04', stops: ['a6'] },
  { label: 'Oct 28, 2026', date: '2026-10-28', stops: ['a2'] },
  { label: 'Oct 21, 2026', date: '2026-10-21', stops: ['a3'] },
  { label: 'Oct 14, 2026', date: '2026-10-14', stops: ['a4'] },
  { label: 'Oct 7, 2026', date: '2026-10-07', stops: ['a7'] },
  { label: 'Oct 2, 2026', date: '2026-10-02', stops: ['a9'] },
  { label: 'Sep 30, 2026', date: '2026-09-30', stops: ['a8'] },
  { label: 'Sep 23, 2026', date: '2026-09-23', stops: ['a10'] },
];
