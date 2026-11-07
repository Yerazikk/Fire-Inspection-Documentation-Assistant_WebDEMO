// Hard-coded demo content. The oleander case (V2) is the live demo location; the others carry history only.
window.CONFIG = {
  dept: 'Fire Prevention Bureau', unit: 'Vegetation Management Unit',
  inspector: { name: 'D. Alvarez', badge: 'VM-214', email: 'vegetation@cityfire.gov', phone: '(510) 555-0142' },
  // Headquarters. Every route starts here, from this real coordinate.
  station: { name: 'Dept. HQ', addr: '250 Frank H. Ogawa Plaza, Oakland, CA', lat: 37.80612, lon: -122.27247 },
  correctionDays: 45, appealDays: 15, localCode: 'Municipal Fire Code §4907.4', portal: 'Accela Citizen Access',
};

// The seeded typeahead entries. Addresses typed by hand are geocoded for real
// (see geo.js) and appended to this list at runtime. lat/lon are real points on
// the named Oakland streets — the router snaps each to the road network, so the
// legs between them are genuine drives. x,y are only for the stylised fallback
// map and the parcel sketch, and are derived from lat/lon below.
window.ADDRESSES = [
  { id: 'a1', addr: '123 Placeholder St', where: 'Upper Rockridge, Oakland, CA', lat: 37.84543, lon: -122.23182, owner: { name: 'M. Okafor', email: 'm.okafor@example.com' }, demo: true },
  { id: 'a2', addr: '2210 Moraga Ave', where: 'North Oakland, CA', lat: 37.82884, lon: -122.24587, owner: { name: 'R. Chen', email: 'r.chen@example.com' } },
  { id: 'a3', addr: '77 Alvarado Pl', where: 'Claremont, Oakland, CA', lat: 37.86203, lon: -122.23270, owner: { name: 'S. Patel', email: 's.patel@example.com' } },
  { id: 'a4', addr: '5150 Broadway Ter', where: 'North Oakland, CA', lat: 37.83810, lon: -122.24705, owner: { name: 'J. Romero', email: 'j.romero@example.com' } },
  { id: 'a5', addr: '418 Skyline Crest Rd', where: 'Oakland Hills, CA', lat: 37.80502, lon: -122.17911, owner: { name: 'A. Lindqvist', email: 'a.lindqvist@example.com' } },
  { id: 'a6', addr: '9 Canyon View Ct', where: 'Montclair, Oakland, CA', lat: 37.83165, lon: -122.19564, owner: { name: 'T. Nguyen', email: 't.nguyen@example.com' } },
];

// lat/lon → the 0–100 map space the fallback map and parcel sketch draw in.
window.BBOX = { lat0: 37.88, lat1: 37.78, lon0: -122.30, lon1: -122.16 };
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
  upload: { boxes: [
    { label: 'Roofline', box: [8, 22, 84, 14], tone: 'cyan' }, { label: 'Gutter · north side', box: [8, 36, 84, 6], tone: 'cyan' }, { label: 'Deck · wood', box: [20, 60, 60, 22], tone: 'cyan' },
  ], issue: { label: 'Compliant · gutters clear', box: [8, 34, 84, 10], tone: 'green' } },
};

window.STREAM = [
  { t: 'Reading capture', d: 'GPS lock · heading 312°' }, { t: 'Resolving parcel', d: 'VHFHSZ · last inspected Jun 2025' },
  { t: 'Recognising elements', d: 'vegetation, structure, utilities' }, { t: 'Estimating heights', d: 'pole and hedge line as scale' },
  { t: 'Checking the memo against the scene', d: 'ladder fuel · 30 ft zone' }, { t: 'Matching code library', d: 'CFC §4906 · PRC §4291 · 14 CCR §1299.03' },
  { t: 'Drafting the record', d: 'severity · estimates · recommendations' },
];

// AI output templates per entry kind. {memo} is the inspector's note.
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
      { scope: 'State', c: '2025 California Fire Code, Ch. 49 §4906', t: 'Vegetation management in WUI Fire Areas.' },
      { scope: 'State', c: 'PRC §4291 · Gov. Code §51182', t: '100 ft defensible space; intensified 5–30 ft; ember-resistant 0–5 ft.' },
      { scope: 'State', c: '14 CCR §1299.03', t: 'Vertical clearance 3× lower fuel height; horizontal spacing by slope.' },
      { scope: 'Local', c: 'Municipal Fire Code §4907.4', t: '30-ft defensible space; limb trees ≥ 6 ft; no contiguous vegetation to the structure.' },
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
    codes: [{ scope: 'State', c: 'PRC §4291 (ember-resistant zone)', t: 'Checked · meets.' }, { scope: 'Local', c: 'Municipal Fire Code §4907.4', t: 'Checked · meets.' }], recs: [],
  },
  upload: {
    summary: [['Observed', 'Roof and north gutter free of needles and leaves; no branches within 10 ft of the roofline.'], ['Result', 'Meets roof and gutter clearance.']],
    severity: { level: 'Compliant', score: 0, why: 'No corrective action for this item.' }, category: ['Roof and gutters'], estimates: [['Branch distance to roof', '> 10 ft']],
    codes: [{ scope: 'Local', c: 'Municipal Fire Code §4907.4', t: 'Checked · meets.' }], recs: [],
  },
  note: {
    summary: [['Note', 'Owner reports the north gutters were cleaned last week; not verified by photo today.'], ['Follow-up', 'Verify at reinspection or ask the owner for a photo.']],
    severity: { level: 'Note', score: 0, why: 'Informational; no determination made.' }, category: ['Owner statement', 'Follow-up'], estimates: [],
    codes: [], recs: [],
  },
};
window.MEMOS = { violation: 'Ladder fuels are required to be removed within 30 ft of homes per CA FC 2025 and local municipal code', compliance: 'Retaining wall base is clear, this side is compliant', upload: 'Roof and gutters clear, compliant', note: 'Owner says the north gutters were cleaned last week, verify at reinspection' };

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
};
// Previous days for the Days screen (address ids per day)
window.DAYS = [
  { label: 'Yesterday', date: '2026-11-04', stops: ['a6'] },
  { label: 'Oct 28, 2026', date: '2026-10-28', stops: ['a2'] },
  { label: 'Oct 21, 2026', date: '2026-10-21', stops: ['a3'] },
  { label: 'Oct 14, 2026', date: '2026-10-14', stops: ['a4'] },
];
