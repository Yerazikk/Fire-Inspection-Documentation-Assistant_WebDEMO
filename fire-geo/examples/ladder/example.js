// examples/ladder/example.js — ladder fuel under a canopy.
//
// The photograph: a clipped hedge directly beneath a row of tall flowering shrubs on a roadside bank
// (assets/ladderfuel.jpg). The finding is the continuity between the two layers, not the size of either plant.
// The inspector confirmed it and specified removing the lower tier.
//
// Why it is here: this is the one finding whose VERDICT changes with the place. The 30 ft ladder-fuel rule is
// local text — each Ross Valley ordinance adds it as WUI Code § 604.6(7), Berkeley writes its own at § 604.3.1 —
// and whether it bites depends on the mapped hazard zone under the pin and the assumed distance. It is also the
// only example that uses the distance control.
//
// Words: monday/ladderfuel.md, the inspector's gold-standard analysis, reflowed, never rewritten. Law: the four
// adopting ordinances (data/lawbase.js names them) read 2026-11-22, and data/city4/law.js for Berkeley.
(function (root) {
'use strict';
const EX = root.FireExamples, SRC = root.FIREGEO_LAWBASE.sources, WUI = root.FIREGEO_LAWBASE.WUI;

// ============================================================= 1. what the inspector found
// window.CONTENT.ladder: the inspection record, as structured content. Tags carry the evidentiary
// standing of a statement through to the page: confirmed / observed / verify (see examples/README.md).
const content = {
  tab: 'Ladder fuel',
  title: 'Ladder Fuel — Inadequate Vertical Separation',
  status: 'Noncompliant — inspector confirmed',
  meta: [
    ['Inspection type', 'Defensible space / vegetation management'],
    ['Category', 'Hazardous vegetation / vertical fuel continuity'],
    ['Location', 'Landscaped strip bordering the roadway'],
    ['Referenced timeframe', '30 days — confirm against the formal notice'],
  ],

  photo: 'assets/ladderfuel.jpg',
  aspect: 820 / 1474,

  note: 'remove ladder fuels within 30 ft of a structure',
  noteFix: 'Hey, remove the lower tier of bushes and leave the upper tier to resolve the issue.',
  noteWhy: 'The inspector explained that fire can travel from the ground into the taller vegetation and potentially affect both the nearby structure and the evacuation route.',

  summary: 'A dense, continuous lower-tier hedge sits directly beneath a row of taller ornamental shrubs with little visible vertical separation between the layers. That arrangement gives fire a path from ground level up into the upper canopy.',
  primary: 'Remove the lower tier of shrubs beneath the taller ornamental vegetation to interrupt the continuous vertical fuel pathway. Retain the upper vegetation where permitted.',

  // Boxes are [left, top, width, height] as percentages of the displayed
  // image — the same shape ai/draft.js normalizeScan() produces for the app's
  // scan overlay. Authored against the photograph, not model-guessed.
  annotations: [
    { box: [0, 22.5, 74, 33], tone: 'cyan', label: 'Oleander canopy — retained',
      note: 'Tall flowering ornamental shrubs, consistent in appearance with oleander. The inspector recommends keeping this layer.' },
    { box: [0, 55.5, 74, 10.5], tone: 'red', label: 'Lower hedge — ladder fuel',
      note: 'A dense, horizontally continuous clipped hedge whose upper surface meets or closely approaches the lower branches of the vegetation above it. This is the finding.' },
    { box: [0, 64.5, 70, 17], tone: 'cyan', label: 'Ground fuel and debris',
      note: 'Low ornamental plants and succulents along the stone retaining wall, some with brown, yellowed or dried foliage, plus scattered leaf litter.' },
  ],
  annotationCaption: 'There is little visible vertical separation between the lower hedge and the canopy above it. That continuity — not the size of either plant — is the condition the correction has to break.',

  solutions: [
    {
      id: 'a',
      badge: 'required', badgeText: 'Inspector-preferred · required correction',
      title: 'Remove the lower tier of bushes',
      lede: 'The correction the inspector specified.',
      plain: 'Take out the low hedge under the tall plants. The tall plants stay.',
      image: 'assets/generated/ladder-a-remove-hedge.png',
      where: 'The dense, horizontally continuous green hedge extending across the left of the photograph, directly beneath the taller flowering vegetation.',
      change: 'Remove the lower tier of bushes that forms the continuous hedge beneath the upper vegetation.',
      how: [
        'Identify the continuous row of low-growing shrubs beneath the taller ornamental vegetation.',
        'Remove the lower shrub layer responsible for connecting the ground-level vegetation to the upper foliage.',
        'Remove the cut plant material from the property.',
        'Verify that the remaining landscaping does not provide a continuous vertical fuel pathway.',
      ],
      keep: 'Retain the taller ornamental vegetation where permitted and consistent with the inspector’s approved correction. Preserve the stone retaining wall and unaffected landscaping.',
      why: 'Removing the lower hedge interrupts the connection between low-level vegetation and taller plants, reducing the potential for a fire originating in the lower vegetation to spread upward into the upper canopy.',
    },
    {
      id: 'b',
      badge: 'alt', badgeText: 'Alternative — requires inspector approval',
      title: 'Selective pruning to increase vertical separation',
      lede: 'Raise the canopy instead of removing the hedge.',
      plain: 'Cut the low branches off the tall plants and trim the hedge right down, leaving a clear gap between them.',
      image: 'assets/generated/ladder-b-prune-separation.png',
      where: 'The lower branches of the tall ornamental vegetation and any remaining shrubs immediately beneath them.',
      change: 'Where permitted, raise or selectively thin the lower branches of the taller vegetation and reduce the height or density of adjoining lower plants.',
      how: [
        'Identify locations where the lower and upper vegetation layers nearly touch.',
        'Determine the required separation under the applicable local standard.',
        'Selectively prune lower branches while maintaining plant health.',
        'Reduce or remove lower vegetation where pruning alone cannot achieve adequate clearance.',
      ],
      keep: 'Keep healthy portions of the taller vegetation when allowed. Avoid excessive pruning that could damage the plants or create an unstable canopy.',
      why: 'Creating vertical separation makes it more difficult for flames from lower vegetation to reach the upper canopy.',
      limit: 'Because the inspector specifically recommended removing the lower tier, pruning alone must not be presented as an equally acceptable correction. The inspector must determine whether this alternative fully satisfies the violation.',
    },
    {
      id: 'c',
      badge: 'alt', badgeText: 'Alternative — requires inspector approval',
      title: 'Low-fuel landscape in place of the hedge',
      lede: 'Carries out the required removal, then replants the band at low fuel load.',
      plain: 'Take out the hedge and replace it with gravel and a few well-spaced low plants.',
      image: 'assets/generated/ladder-c-low-fuel-redesign.png',
      proposal: true,
      where: 'The band occupied by the continuous hedge, between the stone retaining wall and the base of the taller vegetation.',
      change: 'Remove the continuous hedge as in the required correction, then replace that band with noncombustible gravel and widely spaced low plantings rather than leaving it bare.',
      how: [
        'Carry out the removal described in the required correction.',
        'Cover the cleared band with noncombustible gravel or stone.',
        'Replant with low-growing species set far enough apart that they do not form a continuous horizontal or vertical run of fuel.',
        'Confirm with the inspector that the finished arrangement meets the applicable separation requirements before planting.',
      ],
      keep: 'The taller ornamental vegetation where permitted, and the stone retaining wall.',
      why: 'It achieves the same break in vertical continuity as the required correction while giving the owner a maintained planting bed instead of bare ground, which is easier to keep clear over time.',
      limit: 'This option is not in the inspection record. It is a proposal built on top of the inspector’s correction, and the species, spacing and materials would all have to be approved before any of it counts as compliance.',
    },
  ],

  // Supplementary, and not illustrable on its own.
  extras: [
    {
      title: 'Remove accumulated dead vegetation and debris',
      badgeText: 'Supplementary maintenance',
      where: 'The smaller ornamental plants along the stone retaining wall and the scattered plant material near the roadway.',
      body: 'Remove loose, accumulated vegetative debris along the retaining wall and road edge. Inspect the small ornamental plants for dead interior growth, and prune or remove dead material where appropriate. Maintain the area to prevent future accumulation.',
      why: 'Removing dead or accumulated combustible material reduces the amount of fuel available to support ignition and surface-level fire spread.',
      limit: 'This action supplements the primary ladder fuel correction. Removing debris alone would not resolve the dense lower hedge beneath the taller vegetation.',
    },
  ],

  analysis: [
    {
      h: 'Inspector input — what the photograph shows',
      blocks: [
        { t: 'p', tag: 'observed', v: 'The photograph shows a densely vegetated landscaped area bordering the left side of a paved residential roadway.' },
        { t: 'h', v: 'Upper vegetation' },
        { t: 'p', v: 'A continuous row of tall, dense, evergreen ornamental shrubs or small trees extends along the left side of the image, with elongated narrow leaves and clusters of light-coloured flowers. Its appearance is consistent with oleander, although the species cannot be confirmed from this photograph alone. The taller vegetation forms a thick upper canopy, with foliage extending toward the lower vegetation layers.' },
        { t: 'h', v: 'Lower vegetation' },
        { t: 'p', v: 'Directly beneath the taller plants is a dense, horizontally continuous hedge, trimmed to a relatively uniform height and extending along much of the landscaped roadside. Its upper surface appears to meet or closely approach the lower branches and foliage of the taller vegetation. There is little visible vertical separation between these two layers. This continuous arrangement is the primary concern.' },
        { t: 'h', v: 'Ground-level vegetation' },
        { t: 'p', v: 'Below the hedge, several smaller ornamental plants and succulents grow along a stone retaining wall. Some contain brown, yellowed or apparently dried foliage. Scattered leaves and plant debris are visible along the base of the wall and the edge of the road.' },
        { t: 'h', v: 'Surrounding environment' },
        { t: 'ul', v: [
          'A paved roadway runs directly beside the landscaped area.',
          'The vegetation is elevated above the roadway on a stone retaining wall.',
          'Residential buildings are visible farther along the road.',
          'Utility poles and overhead electrical lines are present.',
          'The full distance between the vegetation and nearby structures cannot be determined from the photograph.',
          'The building the inspector describes as being behind the vegetation is largely obscured or outside the photograph.',
        ] },
        { t: 'h', v: 'Primary visual finding' },
        { t: 'p', tag: 'observed', v: 'The dense lower hedge and taller vegetation form a vertically connected fuel arrangement. The lower hedge sits directly beneath the upper vegetation, creating a potential pathway for fire to spread from the lower plants into the taller vegetation.' },
      ],
    },
    {
      h: 'Fire behaviour and risk assessment',
      blocks: [
        { t: 'h', v: 'Primary hazard: vertical fire spread through ladder fuels' },
        { t: 'p', v: 'Ladder fuels are combustible materials that provide a pathway for fire to spread vertically from surface-level vegetation into taller shrubs or tree canopies. In this photograph the lower hedge creates a continuous band of combustible vegetation directly beneath the upper plants.' },
        { t: 'h', v: 'Potential fire progression' },
        { t: 'ol', v: [
          '<b>Ignition.</b> A wildfire ember, discarded smoking material, or another ignition source could ignite susceptible vegetation or accumulated dry debris.',
          '<b>Fire spreads through the lower hedge.</b> Because the hedge is dense and relatively continuous, flames may spread along the vegetation, depending on fuel moisture, wind and other conditions.',
          '<b>Vertical flame extension.</b> Flames and heat from the burning hedge could reach the lower branches and foliage of the taller vegetation.',
          '<b>Upper vegetation involvement.</b> Fire could spread into the taller vegetation, resulting in increased flame height, radiant heat and potentially additional ember production.',
          '<b>Exposure to surroundings.</b> Burning vegetation could create hazardous conditions near the neighbouring structures and roadway identified by the inspector.',
        ] },
        { t: 'h', v: 'Risk to nearby structures' },
        { t: 'p', tag: 'verify', v: 'The inspector identified a structure behind the vegetation. If the vegetation ignites, fire spreading into the upper canopy could increase heat exposure to the structure and potentially contribute to ignition. The actual structure-to-vegetation separation cannot be measured using this photograph.' },
        { t: 'h', v: 'Risk to evacuation and emergency access' },
        { t: 'p', tag: 'verify', v: 'The vegetation directly borders a paved roadway. If ignited, flames, radiant heat and smoke could affect conditions along the road, potentially interfering with evacuation or emergency response. The photograph alone does not establish that the road is an officially designated evacuation route or that its physical clearance is currently inadequate — the evacuation concern comes from the inspector’s field assessment.' },
        { t: 'h', v: 'Overall risk assessment' },
        { t: 'kv', v: [
          ['Inspector-confirmed condition', 'Ladder fuel hazard requiring correction.'],
          ['Primary mechanism', 'Vertical fire spread from lower vegetation into taller vegetation.'],
          ['Potential consequences', 'Increased fire intensity, greater exposure to nearby structures, and unsafe conditions along the adjacent roadway.'],
          ['Severity', 'Correction required based on the inspector’s finding. A numerical risk rating or predicted flame height cannot be established from the photograph alone.'],
        ] },
      ],
    },
    {
      // Since the page gained the jurisdiction map, the table that is actually
      // rendered comes from jurisdictions.js — the enforceable section depends
      // on which town the pin is in. What survives here is the `conclusion`,
      // which the map section prints underneath its own table. The rows below
      // stay as the inspector's original, jurisdiction-neutral reading.
      h: 'Applicable fire codes',
      framework: 'Framework: 2025 California Fire Code, 2025 California Wildland-Urban Interface Code, and applicable local amendments.',
      codes: [
        { cite: 'Ross Valley FD — defensible space<br>Zone 1 · about 5 to 30 ft from structures',
          requires: 'Remove dead or hazardous vegetation. Maintain spacing between shrubs and trees. Reduce ladder fuels that let fire move vertically into taller vegetation.',
          applies: 'The lower hedge sits directly beneath taller vegetation — exactly the vertical fuel continuity this is written to address.',
          open: 'The measured distance to the structure, which decides whether this zone or Zone 2 governs.' },
        { cite: 'Ross Valley FD — defensible space<br>Zone 2 · about 30 to 100 ft',
          requires: 'Reduce continuous fuel loads. Provide horizontal and vertical separation between shrubs and trees. Remove accumulated dead vegetation.',
          applies: 'Governs instead of Zone 1 if the vegetation turns out to be more than 30 ft from the structure.',
          open: 'The same measurement.' },
        { cite: 'Marin County Fire Code<br>§ 604.6(7)',
          requires: 'Removal of ladder fuels within 30 feet of structures.',
          applies: 'The most direct basis for this finding — removing the lower tier answers it squarely.',
          open: 'Whether a Ross Valley town or district ordinance governs instead. Do not cite this unless Marin County is the jurisdiction.' },
        { cite: 'Ross Valley FD<br>roadway vegetation clearance',
          requires: 'Vegetation clearance along roadways, to keep emergency access and evacuation routes usable.',
          applies: 'The vegetation borders a paved road, so roadside clearance rules may apply on top of the defensible-space finding.',
          open: 'Whether they do. No road-clearance violation is established by the photograph.' },
      ],
      conclusion: 'The arrangement is consistent with an inspector-confirmed ladder fuel condition. The enforceable citation must be chosen from the property’s address, responsible fire jurisdiction, adopted code edition and local amendments.',
    },
    {
      h: 'Internal inspection record',
      blocks: [
        { t: 'h', v: 'Observed condition' },
        { t: 'p', v: 'A dense, continuous lower-tier hedge is present beneath a row of taller ornamental shrubs or small trees. The lower hedge extends into or immediately below the upper vegetation, creating insufficient vertical separation between vegetation layers. Additional low-growing ornamental plants and scattered vegetative debris are present along the stone retaining wall.' },
        { t: 'h', v: 'Hazard description' },
        { t: 'p', v: 'The observed configuration constitutes a ladder fuel condition capable of facilitating vertical fire spread from lower vegetation into the taller canopy. Fire originating within the lower hedge could extend upward into adjacent taller vegetation, potentially increasing fire intensity and exposing nearby structures and the adjoining roadway to hazardous fire conditions. The inspector has identified the area as being within the applicable 30-foot structural clearance area and as presenting a potential evacuation-route concern.' },
        { t: 'h', v: 'Applicable code' },
        { t: 'p', tag: 'verify', v: 'Locally adopted defensible-space and hazardous vegetation management requirements. Exact local code section to be confirmed based on jurisdiction.' },
        { t: 'h', v: 'Required correction' },
        { t: 'p', v: 'Remove the lower tier of shrubs beneath the taller ornamental vegetation to interrupt the continuous vertical fuel pathway. Retain the upper vegetation where permitted, provided that the completed treatment meets applicable vegetation separation and defensible-space requirements. Remove accumulated dead vegetation and plant debris as necessary.' },
        { t: 'h', v: 'Compliance deadline' },
        { t: 'p', tag: 'verify', v: 'Inspector’s referenced reporting timeframe: 30 days. The actual deadline must be confirmed and calculated from the formal inspection notice.' },
        { t: 'h', v: 'Reinspection requirements' },
        { t: 'p', v: 'The inspector shall verify that:' },
        { t: 'ul', v: [
          'The lower-tier ladder fuel has been adequately removed or modified.',
          'Sufficient vertical separation has been established.',
          'The retained upper vegetation does not maintain the prohibited fuel pathway.',
          'Accumulated dead vegetation has been appropriately addressed.',
          'Any applicable structural and roadway-clearance requirements have been satisfied.',
        ] },
      ],
    },
  ],

  owner: {
    title: 'Fire safety inspection — vegetation correction required',
    sub: 'Finding: remove ladder fuels',
    intro: 'There is a row of shorter bushes growing directly beneath taller plants, close enough that fire could climb from one into the other. This is called a ladder fuel.',
    todo: 'Remove the lower row of bushes beneath the taller plants, and clear away accumulated dead leaves and plant debris.',
    keep: 'You may be able to keep the taller plants. You do not need to remove all your landscaping.',
    when: '30 days in this example — follow the deadline on your official inspection notice.',
    qa: [
      { q: 'What did we find?', a: ['There is a row of shorter bushes growing directly beneath taller plants.', 'The shorter bushes and taller plants are very close together, creating a pathway that can allow fire to spread upward. This is known as a <b>ladder fuel</b>.'] },
      { q: 'Why is this dangerous?', a: ['Imagine a fire starting in the smaller bushes. Because the taller plants are directly above them, the flames could climb from the smaller bushes into the taller vegetation, much like climbing a ladder.', 'Once the taller vegetation catches fire, the flames may become larger and more dangerous. This can threaten nearby buildings and create dangerous conditions along the road during an evacuation.'] },
      { q: 'What do you need to do?', a: ['<b>Remove the lower row of bushes beneath the taller plants.</b>', 'In your inspection photograph, this is the dense green hedge growing directly below the larger flowering plants along the roadside. The goal is to create an open separation between the ground-level vegetation and the taller plants.', 'You should also remove accumulated dead leaves and plant debris from the surrounding area.'], image: true },
      { q: 'Do you have to remove all your plants?', a: ['<b>No. You may be able to keep the taller plants.</b>', 'The recommended correction is to remove the lower tier of bushes while keeping the upper tier, provided the remaining vegetation meets the applicable fire safety requirements. You do not need to remove all your landscaping simply because it is near a structure.', 'If you would prefer to prune or modify the vegetation instead of removing the lower row, contact your inspector to determine whether that approach would be acceptable.'] },
      { q: 'When must this be completed?', a: ['The inspection example specifies a 30-day correction period. Please follow the deadline on your official inspection notice.'] },
      { q: 'What happens after the work is done?', a: ['Once the lower vegetation has been removed and the required separation established, the corrected area can be reviewed. Your inspector will determine whether the fire safety concern has been resolved.', 'If you are unsure which bushes should be removed, contact your fire prevention inspector before beginning the work.'] },
    ],
  },

  uncertainty: [
    ['Is there a ladder fuel condition?', 'The photograph shows continuous lower vegetation directly beneath taller vegetation. The inspector has confirmed the condition.', 'Confirm the official finding and extent of required correction.'],
    ['Are the upper plants oleander?', 'The tall flowering vegetation resembles oleander, but species identification is not certain.', 'Confirm species if relevant to the corrective requirements.'],
    ['Is the vegetation within 30 feet of a structure?', 'The inspector identifies this as the applicable inspection condition. The photograph alone cannot verify the distance.', 'Confirm the structure location, measured distance, and applicable defensible-space zone.'],
    ['Must the entire lower hedge be removed?', 'The inspector’s preferred correction is to remove the lower tier.', 'Determine the exact extent of removal necessary for compliance.'],
    ['Can pruning replace removal?', 'Pruning may create vertical separation, but may not fully resolve this configuration.', 'Decide whether a proposed alternative is acceptable.'],
    ['Can the upper vegetation remain?', 'The inspector specifically recommends keeping the upper tier.', 'Confirm that the remaining plants meet local requirements.'],
    ['Is the roadway an evacuation route?', 'It is visibly a paved road, and the inspector identifies an evacuation concern.', 'Confirm its access designation and whether separate clearance requirements apply.'],
    ['Are roadside-clearance requirements violated?', 'The photograph does not show reliable road width or overhead clearance measurements.', 'Measure or inspect the relevant clearances before issuing an additional violation.'],
    ['Is dead vegetation present?', 'Brown or dry-looking material and scattered debris are visible.', 'Determine which material requires removal and whether additional dead growth is concealed inside the plants.'],
    ['What is the correct fire code citation?', 'Applicable defensible-space requirements exist, but the exact property jurisdiction is unknown.', 'Select and approve the enforceable local code provision.'],
    ['What is the required deadline?', 'The inspector described a 30-day period in this example.', 'Confirm the official deadline and whether extensions or approved alternatives are available.'],
    ['Is the violation resolved after removal?', 'A follow-up photograph can show whether the vegetation arrangement has changed.', 'Verify all applicable requirements and approve closure of the finding.'],
  ],

  final: [
    ['Primary finding', 'Ladder fuel condition identified and confirmed by the inspector.'],
    ['Primary cause', 'Insufficient vertical separation between the continuous lower hedge and taller ornamental vegetation.'],
    ['Preferred corrective action', 'Remove the lower tier of bushes while preserving the upper vegetation where permitted.'],
    ['Secondary recommendation', 'Remove accumulated dead vegetation and plant debris.'],
    ['Inspector discretion', 'Required for final code selection, correction boundaries, acceptable alternatives, compliance deadline, and reinspection approval.'],
    ['Final status', 'Noncompliant — pending corrective action and inspector approval.'],
  ],
};

// ============================================================= 2. the law
const Q_LADDER = '“Ladder fuels shall be removed within 30 feet of the structure.”';
const Q_HAZARD = '“Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet when topographic or combustible vegetative types necessitate removal as determined by the Fire Code Official.”';
const canopy = n => '“When required by the Fire Code Official, cut and remove trees that are ' + n + '" of diameter or less at breast height, or four feet, six inches above ground, to achieve canopy separation within 30 feet of the structure.”';
const Q_ROAD = '“The Fire Code Official is authorized to cause areas within 10 feet (3048 cm) on each side of portions of highways, fire apparatus access roads … and driveways … to be cleared of flammable vegetation and other combustible growth.”';
const Q_ROAD_ENTRY = ' The county adds: “The Fire Code Official is authorized to enter upon private property to carry out this work.”';

// Berkeley's two mitigation areas lie inside its Very High zone, and 'unknown' means the map has no layer here.
const inVeryHigh = z => z === 'mitigation' || z === 'very-high';
const noZone = z => z == null || z === 'unknown';

const law = {
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

  // The one-line form of each row: the section number, and the local code that carries it.
  short: {
  'state-defensible': { sec: 'PRC § 4290', code: 'Gov. Code §§ 51175–51189' },
  'ladder-reach': { sec: '§ 604.6(7)', code: WUI }, 'hazard-veg': { sec: '§ 604.6(1)', code: WUI }, 'canopy': { sec: '§ 604.6(8)', code: WUI }, 'roadside': { sec: '§ 604.7', code: WUI },
  'brush-nuisance': { sec: 'ch. 8.24', code: { fairfax: 'Fairfax Municipal Code' } }, 'fire-hazard': { sec: '§ 325.5.2', code: { marin: 'MCC § 16.16.040' } },
  },

  // One plain sentence when the map moves to the other region. {To} {toName} = the place arrived in.
  across: 'In {toName} the rule is ladder fuels within {reach} ft.',

  // Berkeley: Zone 0 to 5 ft (mitigation areas), Zone 1 to 30 ft, Zone 2 to 100 ft, all in the Very High zone.
  // Null where the place carries nothing, so lib/codes.js says that in its own words instead.
  overallLine(P, c, verdict, rows) {
    if (!P.carried) return null;
    if (P.zoneModel === 'berkeley') {
      if (c.zone === 'mitigation' && c.d <= 5) return 'Inside Zone 0, within 5 ft.';
      if (!inVeryHigh(c.zone)) return 'Outside the Very High zone.';
      if (c.d <= 30) return 'Ladder fuel within 30 ft.';
      if (c.d <= 100) return 'Past 30 ft. Spacing still applies.';
      return 'Past 100 ft. Zones end there.';
    }
    const reach = (rows.find(r => r.key === 'ladder-reach') || {}).value || 30;
    if (verdict === 'red') return 'Ladder fuel within ' + reach + ' ft.';
    if (c.d > reach) return 'Outside the ' + reach + ' ft rule.';
    if (c.scope === 'out') return 'Outside the mapped hazard zones.';
    return 'Hazard zone not mapped here.';
  },

  // The verdict rules this example's rows name. Each returns { verdict, why }: `row` is the merged row,
  // `c` is { d, scope, zone, place }. A rule reads only what the cited text says.
  rules: {
    // Local § 604.6(7). The reach is the row's own value. It applies to land in the mapped WUI areas and hazard zones.
    ladderReach(row, c) {
      const reach = row.value;
      if (c.d > reach) return { verdict: 'green', why: 'Outside the ' + reach + ' ft reach at ' + c.d + ' ft.' };
      if (c.scope === 'in') return { verdict: 'red', why: 'Inside the ' + reach + ' ft reach at ' + c.d + ' ft. Confirmed.' };
      if (c.scope === 'out') return { verdict: 'yellow', why: 'Inside ' + reach + ' ft, outside the mapped zones. Depends on the parcel.' };
      return { verdict: 'yellow', why: 'Inside ' + reach + ' ft. Depends on the parcel’s zone, not mapped here.' };
    },
    // Local § 604.6(1): 100 ft, up to 200 ft "as determined by the Fire Code Official". Always a judgement.
    hazardVeg(row, c) {
      if (c.d > row.value) return { verdict: 'yellow', why: 'Past ' + row.value + ' ft. Depends on the official extending it to 200 ft.' };
      return { verdict: 'yellow', why: 'Depends on whether the dry material is hazardous vegetation.' };
    },
    // Local § 604.6(8): only "when required by the Fire Code Official", and only within 30 ft.
    canopy(row, c) {
      if (c.d > 30) return { verdict: 'green', why: 'Asked for only within 30 ft. This is ' + c.d + ' ft.' };
      return { verdict: 'yellow', why: 'Depends on whether the official requires canopy separation here.' };
    },
    // Local § 604.7: "is authorized to cause ... to be cleared". A power, not a standing duty.
    roadside() { return { verdict: 'yellow', why: 'Depends on whether the official invokes roadside clearing.' }; },
    stateDefensible() { return { verdict: 'yellow', why: 'Depends on the parcel’s responsibility area and zone.' }; },
    // ---- Berkeley WUI Code (BMC ch. 19.49), read in data/city4/law.js, joined to these rows in data/law.js.
    // designated Very High Fire Hazard Severity Zone"; § 604.3.2 adds Zone 0 in the two mitigation areas only.
    // § 604.3.2(1)(a): nothing combustible within 5 ft of a structure.
    zoneZero(row, c) {
      if (noZone(c.zone)) return { verdict: 'yellow', why: 'Depends on whether the parcel is in a mitigation area.' };
      if (c.zone !== 'mitigation') return { verdict: 'green', why: 'Zone 0 is required only in the two mitigation areas.' };
      if (c.d <= row.value) return { verdict: 'red', why: 'Inside Zone 0 at ' + c.d + ' ft. No shrubs within ' + row.value + ' ft.' };
      return { verdict: 'green', why: 'Outside Zone 0 at ' + c.d + ' ft.' };
    },
    // § 604.3.1(5)(c), (d): Zone 1 reaches 30 ft, and § 604.3.1(4) applies it inside 5 ft as well.
    ladderReachBerkeley(row, c) {
      const reach = row.value;
      if (c.d > reach) return { verdict: 'green', why: 'Outside the ' + reach + ' ft reach at ' + c.d + ' ft.' };
      if (inVeryHigh(c.zone)) return { verdict: 'red', why: 'Inside the ' + reach + ' ft reach at ' + c.d + ' ft. Confirmed.' };
      if (noZone(c.zone)) return { verdict: 'yellow', why: 'Inside ' + reach + ' ft. Depends on the parcel’s zone.' };
      return { verdict: 'yellow', why: 'Inside ' + reach + ' ft, outside the Very High zone. Depends on the parcel.' };
    },
    // § 604.3.1(7)(d), (e): limbing and spacing in Zones 1 and 2, out to 100 ft. (e) lets the owner use the "Fuel
    // Separation" method, the "Continuous Tree Canopy" method or both, so whether this hedge fails it is the
    // inspector's call. That was decided for 30 to 100 ft; it is applied inside 30 ft too, where the ladder-fuel row
    // already carries the confirmed finding, so no verdict here rests on an unsettled reading.
    verticalSpacing(row, c) {
      if (c.d > row.value) return { verdict: 'green', why: 'Past ' + row.value + ' ft. Zone 2 ends there.' };
      if (inVeryHigh(c.zone)) return { verdict: 'yellow', why: 'Depends on whether the inspector accepts the continuous canopy method.' };
      if (noZone(c.zone)) return { verdict: 'yellow', why: 'Inside ' + row.value + ' ft. Depends on the parcel’s zone.' };
      return { verdict: 'yellow', why: 'Outside the Very High zone. Depends on the parcel.' };
    },
    // § 604.3.1(7)(f): gaps between shrubs of 2, 4 or 6 times their height, by slope.
    shrubSpacing(row, c) {
      if (c.d > 100) return { verdict: 'green', why: 'Past 100 ft. Zone 2 ends there.' };
      if (!inVeryHigh(c.zone)) return { verdict: 'yellow', why: noZone(c.zone) ? 'Depends on the parcel’s zone.' : 'Outside the Very High zone. Depends on the parcel.' };
      return { verdict: 'yellow', why: 'Depends on ' + row.turns + '.' };
    },
    // § 604.3.1(7)(a), (b): 100 ft, and no extension to 200 ft (§ 604.3 stops at "up to 100 feet").
    hazardVegBerkeley(row, c) {
      if (c.d > row.value) return { verdict: 'green', why: 'Past ' + row.value + ' ft. Berkeley has no extension to 200 ft.' };
      if (!inVeryHigh(c.zone)) return { verdict: 'yellow', why: noZone(c.zone) ? 'Depends on the parcel’s zone.' : 'Outside the Very High zone. Depends on the parcel.' };
      return { verdict: 'yellow', why: 'Depends on whether the dry material is dead woody fuel.' };
    },
  },
};

// ============================================================= 3. the field app (the phone)
// The rules this follows (Andrew, 22 Nov): the app answers everything it can, and the person is asked
// only what a photograph cannot tell. A question must be about THIS photograph and what is in it.
const field = {
  // what the app thinks the inspector is reporting, and the other readings on offer
  reading: {
    text: 'The low bushes grow right up into the tall plants. Fire could climb from one to the other.',
    alternatives: ['There are dead leaves and dry plants along the wall.', 'The plants grow right next to the road.'],
    source: 'content.js ladder.summary, owner.intro, annotations[2]; ladderfuel.md "Risk to evacuation and emergency access"',
  },

  // what the scan lights up: the finding, and at most one thing beside it that matters. `ix` names a
  // content annotation by its index; the region itself is read from that annotation, never written here.
  scan: [{ ix: 0, label: 'Tall plants' }, { ix: 1, label: 'Bushes reach the tall plants', finding: true }],

  // what the app reads off the photo: answers already filled in. The first option is the app's own
  // reading; the others are what a tap on "Change" offers.
  seen: [
    { id: 'touch', label: 'Low bushes', options: [{ id: 'touch', label: 'Reach the tall plants' }, { id: 'gap', label: 'There is a gap' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js ladder.summary, annotationCaption' },
    { id: 'plant', label: 'Tall plants', options: [{ id: 'oleander', label: 'Look like oleander' }, { id: 'other', label: 'Something else' }, { id: 'unsure', label: 'Not sure' }], source: 'ladderfuel.md "Upper vegetation" (consistent with oleander, not confirmed)' },
    { id: 'dry', label: 'Dry leaves', options: [{ id: 'some', label: 'Some, along the wall' }, { id: 'lots', label: 'A lot' }, { id: 'none', label: 'None' }], source: 'content.js ladder.annotations[2]; ladderfuel.md "Ground-level vegetation"' },
    { id: 'beside', label: 'Next to it', options: [{ id: 'road', label: 'A road' }, { id: 'driveway', label: 'A driveway' }, { id: 'neither', label: 'Neither' }], source: 'ladderfuel.md "Surrounding environment" (a paved roadway runs directly beside it)' },
  ],

  // the questions: one screen, at most three, answered by tapping. Fewer is better. None is fine.
  questions: [
    {
      id: 'distance', ask: 'How far are the bushes from the building?', picture: 'gap',
      options: [{ id: 'under10', label: 'Under 10 ft' }, { id: '10to30', label: '10 to 30 ft' }, { id: 'over30', label: 'Over 30 ft' }],
      entry: { name: 'Distance in feet', digits: 3, unit: 'ft', min: 0, max: () => 999, open: 'Or type the distance', help: 'A long step is about 3 ft.' },
      cant: { id: 'unsure', label: 'Not sure' },
      photo: { label: 'Add a photo with the building', prompt: 'Take a photo of the bushes and the building.', picture: 'both', callout: 'Bushes and building, both in the picture' },
      source: 'FireGeo code row "ladder-reach" (data/law.js); content.js ladder.uncertainty "Is the vegetation within 30 feet of a structure?"; ladderfuel.md "Surrounding environment". The step length is a rule of thumb written for this prototype, not from the sources.',
    },
  ],

  /** the phone's answers as plain facts for the code rows. a = answers, c = corrected readings. */
  facts(a, c, h) {
    const f = {}; const { DISTANCE, seen } = h;
    const d = a.distance || {};
    if (d.value != null) f.distance = { kind: 'exact', feet: d.value };
    else if (DISTANCE[d.pick]) f.distance = { kind: 'estimate', bucket: d.pick, label: DISTANCE[d.pick].label, feet: DISTANCE[d.pick].feet };
    else if (d.pick === 'unsure') f.distance = { kind: 'unsure' };
    for (const k of ['touch', 'dry', 'beside', 'plant']) if (c[k] && c[k] !== seen('ladder').find(s => s.id === k).options[0].id) f[k] = c[k];
    return f;
  },

  /** the one or two things the senior inspector should act on: a short line and a full sentence. */
  callouts(f, ctx) {
    const out = [];
    const d = f.distance;
    if (!d || d.kind === 'unsure') out.push({ short: 'Distance to the building not recorded.', text: 'The distance to the building is not known. The rule for plants near a building depends on it.' });
    else if (d.kind === 'estimate') out.push({ short: 'Bushes ' + d.label.toLowerCase() + ' from the building, estimated.', text: 'The distance is an estimate (' + d.label.toLowerCase() + '). Measure it before citing the distance rule.' });
    else out.push({ short: 'Bushes ' + d.feet + ' ft from the building.', text: 'The field inspector gives the distance as ' + d.feet + ' ft.' });
    if (f.touch === 'gap') out.push({ short: 'A gap between the two layers, the field inspector says.', text: 'The field inspector says there is a gap between the two layers. The app saw none.' });
    return out;
  },

  /** what those answers do to this example's rows on the senior inspector's desk (team/adapter.js). */
  apply(f, ctx) {
    const { rows, by, lead, D, call, known, dist, used } = ctx;
    // Which rows depend on the distance: ask the shared logic at both ends of its range.
    const near = {}, far = {}, lo = call(D.min), hi = call(D.max);
    (lo.state || []).concat(lo.local || []).forEach(r => { near[r.key] = r; });
    (hi.state || []).concat(hi.local || []).forEach(r => { far[r.key] = r; });
    for (const r of rows) {
      const a = near[r.key], b = far[r.key];
      if (!a || !b || a.verdict === b.verdict) continue;
      r.dependsOnDistance = true;
      if (!known) {
        r.verdict = 'yellow'; r.why = 'Depends on the distance, which the field inspector did not give.';
        if (!r.open) r.open = 'The distance from the bushes to the building.';
        if (dist && dist.kind === 'unsure') r.lead = 'The field inspector was not sure of the distance.';
      } else if (dist.kind === 'exact') {
        if (/distance/i.test(r.open)) r.open = '';
        r.why = r.why.replace(new RegExp(' at ' + used + ' ft\\b'), ' at ' + dist.feet + ' ft, as the field inspector gives it');
      } else {
        // an estimate decides the row, but no exact figure is quoted for it
        r.why = r.why.replace(new RegExp(' at ' + used + ' ft\\b'), ', by the field inspector’s estimate (' + dist.label.toLowerCase() + ')').replace(new RegExp('This is ' + used + ' ft\\.'), 'By the field inspector’s estimate it is farther (' + dist.label.toLowerCase() + ').');
        if (/distance/i.test(r.open)) r.open = 'A measured distance. This one is an estimate.';
      }
    }
    if (f.touch === 'gap') lead('ladder-reach', 'The field inspector says there is a gap between the two layers.');
    if (f.dry === 'none') lead('hazard-veg', 'The field inspector sees no dry leaves or dead plants.');
    else if (f.dry === 'lots') lead('hazard-veg', 'The field inspector says there is a lot of dry material.');
    if (f.beside === 'neither') {
      lead('roadside', 'The field inspector says there is no road or driveway next to it.');
      if (by.roadside) { by.roadside.verdict = 'green'; by.roadside.why = 'No road or driveway next to it, by the field inspector’s report.'; by.roadside.open = ''; }
    } else if (f.beside === 'driveway') lead('roadside', 'The field inspector says it is a driveway, not a road.');
  },
};

// ============================================================= 4. the owner's numbered steps
// One list per correction, keyed by the correction id. Each step is one concrete action and says where
// to stop or what must stay; the second item is where the step comes from in the content above.
const ownerSteps = {
  a: [
    ['Find the low, clipped green hedge that grows directly under the tall flowering plants. In your photo it is the dense green row along the roadside.', 'solutions[a].how[0], .where; owner.qa "What do you need to do?"'],
    ['Remove that low hedge. It is the only row that has to come out.', 'solutions[a].how[1], .plain; owner.keep'],
    ['Leave the tall plants above it, the stone wall and the rest of your landscaping where they are.', 'solutions[a].keep; owner.keep'],
    ['Take the cut branches off the property, and clear away dead leaves and plant debris along the wall.', 'solutions[a].how[2]; owner.todo'],
    ['When you finish there should be open space between the ground and the bottom of the tall plants.', 'solutions[a].how[3]; owner.qa "What do you need to do?"'],
    ['If you are not sure which bushes to remove, contact your fire prevention inspector before you start.', 'owner.qa "What happens after the work is done?"'],
  ],
  b: [
    ['Ask your inspector first. This option only counts if the inspector approves it.', 'solutions[b].limit'],
    ['Find the places where the low hedge and the tall plants nearly touch.', 'solutions[b].how[0]'],
    ['Cut only the lowest branches off the tall plants to open a gap. Ask your inspector how high you may cut, and stop there.', 'solutions[b].how[1], [2]'],
    ['Trim the low hedge down so its top sits well below the branches above it.', 'solutions[b].plain, .change'],
    ['Keep the healthy upper parts of the tall plants. Do not prune so hard that the plants are damaged.', 'solutions[b].keep'],
    ['If cutting cannot open a clear gap, the low hedge has to come out instead.', 'solutions[b].how[3]'],
  ],
  c: [
    ['Ask your inspector first. The plants, the spacing and the materials all need approval before you plant.', 'solutions[c].limit, .how[3]'],
    ['Remove the low hedge under the tall plants, as in the required correction.', 'solutions[c].how[0]'],
    ['Cover the cleared strip with gravel or stone.', 'solutions[c].how[1]'],
    ['Plant only low plants, far enough apart that they do not touch each other or reach the tall plants above.', 'solutions[c].how[2]'],
    ['Leave the tall plants and the stone wall where they are.', 'solutions[c].keep'],
  ],
};

EX.define({
  id: 'ladder', tab: 'Ladder fuel', title: 'Ladder fuel under a canopy',
  photo: 'assets/ladderfuel.jpg', aspect: 820 / 1474,
  usesDistance: true,            // the only example that does: the map shows the distance control for it
  zoom: 12,                      // how far the phone pulls back from the finding's own box
  content, law, field, ownerSteps,
  // The "Sources and notes" sheet, under "Statewide rules". `there` is true on the Berkeley map.
  statewideNote: there => (there
    ? 'The 30 ft ladder-fuel rule is local text here too: Berkeley writes it into § 604.3.1 of its own WUI Code.'
    : 'The 30 ft ladder-fuel rule is local text: each Ross Valley ordinance adds it as § 604.6 to the 2025 California WUI Code.')
    + ' The state chapter itself could not be opened at codes.iccsafe.org, so no state distance is shown.',
  // The key portions marked inside this example's quoted requirements (lib/emphasis.js). The words are never
  // changed: each phrase is a literal part of a text above, or a pattern that matches one.
  emphasis: [
    'shall be removed within 30 feet of the structure',
    'within 100 feet of structures', 'up to 200 feet', 'as determined by the Fire Code Official',
    'When required by the Fire Code Official', /trees that are \d+" of diameter or less/, 'canopy separation within 30 feet of the structure',
    'within 10 feet (3048 cm) on each side', 'cleared of flammable vegetation', 'enter upon private property',
    'public nuisance', 'abated on notice', 'costs assessed', 'constitutes a fire hazard',
    'State Responsibility Areas', 'very high fire hazard severity zones',
  ],
});
})(typeof window !== 'undefined' ? window : globalThis);
