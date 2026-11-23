// The two inspections, as structured content.
//
// Every word here is lifted from monday/ladderfuel.md and monday/sprinkler.md
// — the inspector's gold-standard analyses — reflowed into fields the page can lay
// out, never rewritten into new claims. No code citation, measurement,
// deadline, manufacturer or model appears anywhere that is not in those files.
//
// The one addition is ladder-fuel Solution C, a low-fuel landscape in place of
// the hedge. It is not in the source file; it is a proposal, and it is tagged
// `alt` so it can never be mistaken for the inspector's correction.
//
// Tags carry the evidentiary standing of a statement through to the page:
//   confirmed — the inspector determined it
//   observed  — the AI read it off the photograph
//   verify    — it cannot be settled from the evidence available

window.CONTENT = {

// ===========================================================================
// LADDER FUEL
// ===========================================================================
ladder: {
  tab: 'Ladder Fuel',
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
},

// ===========================================================================
// PAINTED SPRINKLER
// ===========================================================================
sprinkler: {
  tab: 'Painted Sprinkler',
  title: 'Fire Sprinkler Head — Paint Contamination',
  status: 'Failed — inspector confirmed',
  meta: [
    ['Inspection type', 'Fire and life safety inspection'],
    ['Category', 'Automatic fire sprinkler system / fire protection equipment'],
    ['Location', 'Ceiling-mounted sprinkler head at the photographed location'],
    ['Compliance deadline', 'To be established by the authority having jurisdiction'],
  ],

  photo: 'assets/sprinkler.png',
  aspect: 428 / 710,

  note: 'sprinkler head painted over',
  noteFix: 'replace the sprinkler head',
  noteWhy: 'The inspector identified this as a failed fire-sprinkler inspection finding and specified replacement as the appropriate correction.',

  summary: 'A conspicuous white coating, uneven and noticeably thicker in places, is visible along both curved arms of the sprinkler frame and portions of the central assembly. Its appearance is consistent with paint applied during ceiling maintenance or repainting.',
  primary: 'Replace the affected fire sprinkler head with a new, properly listed sprinkler installed by qualified personnel. The sprinkler shall not be restored to service by scraping, sanding or painting over.',

  annotations: [
    { box: [42.5, 44.8, 17, 13.1], tone: 'red', label: 'Paint on frame and body',
      note: 'Uneven white material along both curved frame arms and around the central assembly, consistent with field-applied paint. This is the finding.' },
    { box: [42.5, 57.7, 14.7, 6.8], tone: 'cyan', label: 'Deflector — no heavy paint',
      note: 'Predominantly metallic grey. Nothing in this photograph establishes that water distribution is affected; that remains for the inspector to determine.' },
    { box: [65.1, 43.2, 12.5, 11.5], tone: 'cyan', label: 'Trim staining — cosmetic',
      note: 'Small yellow-brown spots on the escutcheon. Cosmetic, and distinct from the coating on the functional assembly — not part of this finding.' },
  ],
  annotationCaption: 'The finding is the coating on the functional assembly. Surrounding cosmetic conditions are marked separately so they are not read into the violation.',

  solutions: [
    {
      id: 'a',
      badge: 'required', badgeText: 'Required correction · inspector confirmed',
      title: 'Replace the painted sprinkler head',
      lede: 'The correction the inspector specified. There is no acceptable substitute.',
      plain: 'The painted sprinkler is taken out and a new, unpainted one is fitted in the same place.',
      image: 'assets/generated/sprinkler-a-replacement.png',
      where: 'The ceiling-mounted sprinkler head in the centre of the image — the assembly with two white-coated curved frame arms and a metallic deflector beneath them.',
      change: 'Remove and replace the affected sprinkler head.',
      how: [
        'Contact a qualified fire sprinkler contractor.',
        'Have the contractor identify the existing sprinkler’s manufacturer, model, operating characteristics and system requirements.',
        'Select an appropriate listed replacement sprinkler.',
        'Have the contractor arrange any required system isolation and impairment precautions.',
        'Replace the affected sprinkler in accordance with manufacturer instructions and applicable installation standards.',
        'Restore the system and complete required inspections and testing.',
        'Provide the necessary documentation to the inspector.',
      ],
      keep: 'The surrounding ceiling finish, unless access or repair is necessary. The existing sprinkler piping and system components that are serviceable and compatible. The surrounding architectural features. The trim assembly if it is compatible, properly installed and permitted for reuse.',
      why: 'A properly selected new sprinkler eliminates the uncertainty created by field-applied paint contamination and restores a listed sprinkler assembly intended to operate according to its design specifications.',
      imageNote: 'The visualisation shows a generic unpainted pendent sprinkler. It carries no brand, model or marking, because the correct replacement cannot be specified until the existing sprinkler is identified.',
    },
  ],

  extras: [
    {
      title: 'Inspect nearby sprinkler heads for similar contamination',
      badgeText: 'Supplementary',
      where: 'The photograph shows only one sprinkler head. Other sprinklers are outside the frame.',
      body: 'Determine whether other sprinkler heads in the same area were exposed to paint during the same maintenance or repainting work. Inspect nearby heads, look for overspray on frames, release elements and deflectors, document additional affected sprinklers, and replace any that fail the applicable inspection requirements.',
      why: 'Paint contamination may occur across multiple sprinklers during ceiling painting. Checking adjacent devices can identify additional deficiencies without replacing unaffected components unnecessarily.',
      limit: 'Do not conclude that multiple sprinklers are painted based on this single photograph.',
    },
    {
      title: 'Protect fire sprinklers during future painting',
      badgeText: 'Preventive',
      where: 'The grey ceiling surrounding the sprinkler assembly.',
      body: 'Inform painters and maintenance personnel that sprinkler components must not be painted. Use appropriate protective methods during future painting in accordance with applicable safety and manufacturer requirements. Ensure temporary protection does not remain on sprinklers after work is completed, and inspect sprinklers following maintenance or repainting.',
      why: 'Preventing paint contamination reduces the likelihood of compromised fire protection equipment and repeat inspection violations.',
      limit: 'Preventive measures do not resolve the existing painted sprinkler condition. Replacement remains the identified corrective action.',
    },
  ],

  // Stated plainly so no "creative alternative" can be read in.
  notAcceptable: {
    title: 'Not acceptable as corrections',
    body: 'The sprinkler shall not be restored to service by scraping, sanding, solvent-cleaning or painting over. None of these establishes that the sprinkler will function as designed, and attempting them can damage sensitive components. There is no cheaper alternative to offer here, and presenting one beside a repair that is actually required would be a safety problem, not a convenience.',
  },

  identification: {
    verdict: 'Unconfirmed',
    verdictBody: 'No manufacturer name, model number, sprinkler identification number (SIN) or temperature rating is readable in this photograph. The AI cannot identify this sprinkler, and will not guess at one.',
    clues: [
      ['Type and orientation', 'Pendent, recessed', 'The assembly drops through a circular ceiling opening behind a trim ring, with the deflector facing downward.', 'high'],
      ['Frame', 'Two-arm cast frame', 'Two curved arms descend from the central body to the deflector — the common pendent frame form.', 'high'],
      ['Deflector', 'Toothed circular deflector', 'Visible and predominantly metallic. Its tine pattern is a model characteristic, but it is not resolved well enough here to read.', 'moderate'],
      ['Release element', 'Not determinable', 'The photograph does not establish whether the element is a glass bulb or a solder link, nor its condition.', 'none'],
      ['Temperature rating', 'Not determinable', 'No colour-coded bulb or stamped link rating is legible.', 'none'],
      ['Manufacturer / SIN', 'Not determinable', 'No casting, stamp or printed marking is readable at this resolution and angle.', 'none'],
      ['Age, recall status', 'Not determinable', 'Installation date, maintenance history and service condition are unknown.', 'none'],
    ],
    // Where identification normally lives on a pendent sprinkler. Reference
    // information about the equipment class, not a reading of this unit.
    markings: [
      ['Frame arm', 'Manufacturer name or logo, cast into the arm.'],
      ['Deflector face', 'Sprinkler identification number (SIN) and model, stamped — usually the single most useful marking.'],
      ['Wrench boss / body hex', 'Listing marks, year of manufacture, and often the K-factor.'],
      ['Release element', 'Temperature rating — bulb colour on a glass-bulb sprinkler, or a stamped figure on a solder link.'],
      ['Escutcheon', 'Trim model and the sprinkler families it is listed with. Removing it exposes the body stamp.'],
    ],
    tempKey: [
      ['Orange', '135 °F', '#e8762c'],
      ['Red', '155 °F', '#c8372d'],
      ['Yellow', '175 °F', '#e3b505'],
      ['Green', '200 °F', '#3f8f4a'],
      ['Blue', '286 °F', '#2f6fb0'],
    ],
    tempNote: 'General reference for glass-bulb sprinklers. Nothing here was read from this photograph.',
    evidence: [
      'A square-on close-up of the deflector face under raking light, close enough to read a stamped SIN.',
      'A photograph of the frame arm casting showing the manufacturer’s name or mark.',
      'The escutcheon removed, exposing the sprinkler body and its stamp.',
      'The release element photographed clearly enough to determine bulb or link, and its colour or stamped rating.',
      'The system’s as-built records, original installation submittal, or the sprinkler contractor’s inventory.',
    ],
    spec: 'Specify the replacement as a procedure, not a product. The contractor establishes the existing sprinkler’s manufacturer, SIN, K-factor, temperature rating, response type and orientation, then selects a listed replacement compatible with the existing system and consistent with the applicable installation standard. No product should be named until that identification is complete.',
  },

  analysis: [
    {
      h: 'Inspector input — what the photograph shows',
      blocks: [
        { t: 'p', tag: 'observed', v: 'The photograph shows a ceiling-mounted automatic fire sprinkler head installed in a flat, grey-painted ceiling. A single pendent-type sprinkler is positioned near the centre of the photograph, extending downward from a circular ceiling opening.' },
        { t: 'h', v: 'Sprinkler assembly' },
        { t: 'ul', v: [
          'A circular white outer trim ring surrounding the sprinkler opening.',
          'A darker metallic inner ring or recessed trim component.',
          'A sprinkler frame consisting of two curved metal arms extending downward from the central sprinkler body.',
          'A small, circular, toothed metal deflector mounted at the lower end of the assembly.',
          'A central element connecting the sprinkler body and deflector assembly.',
        ] },
        { t: 'h', v: 'Apparent paint contamination' },
        { t: 'p', v: 'A conspicuous white coating is visible along both curved arms of the sprinkler frame and portions of the central assembly. The coating appears uneven and noticeably thicker around portions of the frame, consistent with paint applied during ceiling maintenance or repainting. The central sprinkler body also has areas of white material surrounding darker metallic components. The deflector at the bottom appears predominantly metallic grey, without obvious heavy paint coverage.' },
        { t: 'p', tag: 'verify', v: 'The exact extent of paint contamination on the release mechanism, internal components and deflector cannot be determined from this image.' },
        { t: 'h', v: 'Surrounding ceiling and trim' },
        { t: 'p', v: 'The surrounding ceiling has a relatively uniform grey finish. The circular white trim ring contains several small yellow-brown spots or stains, and there is visible white material around its outer edge, consistent with paint or finishing material at the ceiling opening. These surrounding cosmetic conditions should be distinguished from the apparent coating on the functional sprinkler assembly.' },
        { t: 'h', v: 'Visibility limitations' },
        { t: 'ul', tag: 'verify', v: [
          'No manufacturer name or model number is readable.',
          'The sprinkler identification number (SIN) is not visible.',
          'The temperature rating cannot be determined.',
          'The type and condition of the heat-responsive release element cannot be confidently established.',
          'The installation date, maintenance history and service condition are unknown.',
          'The photograph does not establish whether the sprinkler is operational.',
        ] },
      ],
    },
    {
      h: 'Fire behaviour and risk assessment',
      blocks: [
        { t: 'p', v: 'Automatic fire sprinklers are designed to respond to heat from a developing fire. Most conventional sprinklers use a heat-sensitive element that releases when exposed to temperatures reaching its specified operating threshold, allowing water to discharge through the sprinkler and strike the deflector, which distributes it across the protected area. Paint applied to sprinkler components after manufacture can interfere with these functions.' },
        { t: 'h', v: '1 — Delayed activation' },
        { t: 'p', v: 'Paint deposited on a heat-responsive element can alter its response to heat. Depending on the design and the extent of contamination, the sprinkler could activate later than intended — allowing additional time for the fire to grow, increased heat and smoke production, greater risk to occupants and property, and reduced effectiveness of early suppression.' },
        { t: 'p', tag: 'verify', v: '<b>Photo-specific.</b> White coating is visible on the sprinkler frame, but the photograph does not clearly establish whether the heat-responsive element itself is coated. Delayed activation is a potential failure mechanism, not a confirmed functional failure.' },
        { t: 'h', v: '2 — Interference with mechanical release' },
        { t: 'p', v: 'Paint may bond adjacent components together or interfere with the movement of the release assembly. If it restricts the movement of internal or external components, the sprinkler may fail to open as intended — meaning the affected sprinkler does not discharge, fire control is reduced in the area it protects, and the fire grows further before other sprinklers activate or firefighters intervene.' },
        { t: 'p', tag: 'verify', v: '<b>Photo-specific.</b> The visible white material surrounds parts of the frame and central assembly, but the photograph does not establish whether paint has bonded the release mechanism or water seal. Mechanical impairment must not be presented as confirmed from the image.' },
        { t: 'h', v: '3 — Altered water distribution' },
        { t: 'p', v: 'Paint or other material accumulating on the deflector may alter the intended distribution of water, producing uneven coverage or reducing suppression effectiveness.' },
        { t: 'p', tag: 'observed', v: '<b>Photo-specific.</b> The deflector appears predominantly metallic and is not visibly covered by heavy paint. Disrupted water distribution is a possible consequence of paint contamination generally; this particular deflector is not shown to be obstructed.' },
        { t: 'h', v: 'Overall fire and life-safety risk' },
        { t: 'kv', v: [
          ['Confirmed condition', 'Painted-over sprinkler head, as identified by the inspector.'],
          ['Primary risk', 'The sprinkler may not activate or distribute water as designed during a fire.'],
          ['Potential consequences', 'Delayed or unsuccessful fire suppression; increased flame spread and smoke production; greater danger to building occupants; increased property damage; additional risk to responding firefighters.'],
          ['What is not established', 'The photograph does not establish that the sprinkler has already failed, that the entire system is inoperable, or that immediate evacuation is necessary. The inspector must determine deficiency classification and urgency.'],
        ] },
      ],
    },
    {
      h: 'Applicable fire codes',
      framework: 'Framework: 2025 California Fire Code and the water-based fire protection maintenance standards California separately incorporates.',
      codes: [
        { cite: '2025 California Fire Code<br>§ 901.6',
          requires: 'Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced.',
          applies: 'Paint contamination capable of affecting operation is a maintenance deficiency. The sprinkler must be evaluated and corrected.',
          open: '' },
        { cite: '2025 California Fire Code<br>§§ 901.6.1, 903.5',
          requires: 'The inspection, testing and maintenance framework for fire protection systems, automatic sprinklers included.',
          applies: 'This sprinkler is part of a water-based system, so those adopted standards and the California amendments govern its maintenance.',
          open: '' },
        { cite: 'NFPA 25<br>§ 5.2.1.1.1',
          requires: 'Replacement of sprinklers carrying disqualifying paint contamination. The wording differs by edition; Title 19 § 904 references the California-amended 2013 edition, and later editions distinguish paint detrimental to performance.',
          applies: 'The coating has to be assessed under whichever edition is actually enforced here.',
          open: 'Which edition the authority having jurisdiction enforces.' },
        { cite: '2025 California Residential Code<br>§ R309.3.2.6',
          requires: 'Painting, caulking or modifying sprinklers is prohibited, and affected sprinklers must be replaced.',
          applies: 'The most direct basis for requiring replacement — if this building is governed by the residential code.',
          open: 'The occupancy and building classification, which the photograph does not establish.' },
      ],
      conclusion: 'Inspector-confirmed finding: a painted sprinkler head requiring replacement. Confirm the occupancy, applicable code, adopted edition and jurisdiction-specific amendments before issuing the violation.',
    },
    {
      h: 'Internal inspection record',
      blocks: [
        { t: 'h', v: 'Observed condition' },
        { t: 'p', v: 'An automatic pendent fire sprinkler head exhibits apparent white paint contamination on its exposed frame arms and portions of the central assembly. The coating appears irregular and is visibly present on components of the sprinkler assembly rather than being limited to the surrounding ceiling finish. The inspector has confirmed that the sprinkler head has been painted over.' },
        { t: 'h', v: 'Hazard description' },
        { t: 'p', v: 'Nonmanufacturer-applied paint on sprinkler components may interfere with the sprinkler’s heat-responsive activation mechanism, mechanical release or intended water distribution. Such interference may delay or prevent proper operation during a fire, compromising suppression effectiveness and occupant safety.' },
        { t: 'h', v: 'Applicable codes' },
        { t: 'ul', v: [
          '2025 California Fire Code § 901.6 — inspection, testing and maintenance.',
          '2025 California Fire Code § 901.6.1 — standards.',
          '2025 California Fire Code § 903.5 — automatic sprinkler system inspection, testing and maintenance.',
          'Applicable California NFPA 25 provisions concerning painted sprinklers.',
          '2025 California Residential Code § R309.3.2.6, if applicable.',
        ] },
        { t: 'p', tag: 'verify', v: 'Final citations subject to jurisdiction and occupancy verification.' },
        { t: 'h', v: 'Required corrective action' },
        { t: 'p', v: 'Replace the affected fire sprinkler head with a new, properly listed sprinkler of the appropriate characteristics. Replacement shall be performed by appropriately qualified and licensed fire sprinkler personnel as required by California law. The replacement shall be compatible with the existing system and satisfy applicable manufacturer requirements, listing criteria and installation standards. The sprinkler shall not be restored to service by scraping, sanding, painting over, or otherwise attempting to remove the paint. Inspect nearby sprinklers for similar contamination where appropriate.' },
        { t: 'h', v: 'Reinspection requirements' },
        { t: 'p', v: 'The inspector shall verify that:' },
        { t: 'ul', v: [
          'The painted sprinkler has been replaced.',
          'The replacement sprinkler is appropriate for the system and installation.',
          'No disqualifying paint contamination is present.',
          'The sprinkler and associated trim are correctly installed.',
          'Required restoration, inspection and testing procedures have been completed.',
          'Any documented impairment of the sprinkler system has been resolved.',
          'Required contractor documentation has been provided.',
        ] },
      ],
    },
  ],

  owner: {
    title: 'Fire safety inspection — sprinkler replacement required',
    sub: 'Finding: painted fire sprinkler head',
    intro: 'One of the fire sprinklers in your ceiling has paint on parts of its metal assembly. The paint may stop it working properly in a fire.',
    todo: 'Have the painted sprinkler head replaced by a qualified fire sprinkler professional.',
    keep: 'In most cases only this one sprinkler needs replacing, not the whole system.',
    when: 'By the deadline specified in your official fire inspection report.',
    dont: 'Do not scrape, sand or clean the paint off yourself — it can damage the sprinkler and does not make it safe to rely on.',
    qa: [
      { q: 'What did we find?', a: ['One of the fire sprinklers installed in your ceiling has paint on parts of its metal assembly.', 'Fire sprinklers are designed to automatically release water when exposed to sufficient heat from a fire. The paint may interfere with the sprinkler’s ability to operate properly.'] },
      { q: 'Why is this dangerous?', a: ['A fire sprinkler needs to respond quickly and correctly when a fire occurs. Paint can interfere with the parts that allow a sprinkler to activate.', 'Depending on where the paint is located, it may cause the sprinkler to activate late, interfere with its opening mechanism, or affect how water is distributed. This means the affected sprinkler may not provide the fire protection it was designed to provide.'] },
      { q: 'What do you need to do?', a: ['<b>Have the painted sprinkler head replaced by a qualified fire sprinkler professional.</b>', 'The new sprinkler must be appropriate for your existing system and installed according to applicable fire safety requirements.'], image: true },
      { q: 'Can you just remove the paint?', a: ['<b>No. Do not attempt to scrape, sand or clean the paint off the sprinkler head yourself.</b>', 'Trying to remove the paint can damage sensitive components and does not establish that the sprinkler will function correctly. The inspector’s required correction is replacement.'] },
      { q: 'Do you have to replace the entire sprinkler system?', a: ['<b>Not necessarily.</b>', 'The photographed condition identifies one affected sprinkler head. In most cases an individual sprinkler can be replaced without replacing the entire system, provided the existing system is otherwise serviceable and the replacement is compatible. Your sprinkler contractor can determine whether any additional work is necessary.'] },
      { q: 'When must this be completed?', a: ['Please complete the replacement by the deadline specified in your official fire inspection report. If the sprinkler system is found to be impaired, additional safety measures may be required until protection is restored.'] },
      { q: 'What happens next?', a: ['After the sprinkler has been replaced: have your contractor confirm that the replacement was properly installed; obtain documentation of the completed work and any required testing; submit the documentation to your inspector if requested. The inspector will determine whether the violation has been corrected.', 'If you have questions about the correction, contact your fire prevention inspector before beginning the work.'] },
    ],
  },

  uncertainty: [
    ['Is the sprinkler painted over?', 'The photograph shows apparent white coating on the frame. The inspector confirms that it is painted.', 'Confirm the official violation.'],
    ['Is the white coating factory-applied?', 'Its irregular appearance suggests field-applied paint, but the photograph alone cannot prove its origin.', 'Determine whether the coating is an approved manufacturer finish or unauthorised paint.'],
    ['Is paint present on the heat-sensitive element?', 'Not clearly established from the photograph.', 'Inspect the release element and affected components.'],
    ['Is the deflector painted?', 'The deflector appears predominantly metallic, without obvious heavy coating.', 'Determine whether any contamination affects water distribution.'],
    ['Is the sprinkler currently inoperable?', 'The photograph cannot establish operational failure.', 'Determine impairment status and any required immediate protections.'],
    ['Does the sprinkler need replacement?', 'The inspector explicitly specifies replacement for this example.', 'Approve the required correction and verify completion.'],
    ['What model is the sprinkler?', 'No readable identification markings are visible.', 'Identify the manufacturer, SIN, temperature rating, response type and other relevant characteristics.'],
    ['Is the sprinkler expired or recalled?', 'Neither condition can be determined from the image.', 'Check model information, applicable age-based testing requirements, recalls and maintenance history if warranted.'],
    ['Is there corrosion?', 'Small yellow-brown spots are visible on the surrounding trim, but corrosion of the sprinkler itself is not established.', 'Determine whether there is a separate corrosion deficiency.'],
    ['Must the entire system be replaced?', 'No evidence establishes a system-wide defect.', 'Determine whether additional sprinklers or components require correction.'],
    ['Is this a residential or commercial system?', 'The photograph does not identify occupancy or system type.', 'Confirm the building classification and applicable installation standard.'],
    ['Which code edition applies?', 'California has current fire code provisions and separately incorporated fire protection maintenance requirements.', 'Verify the legally applicable edition and any local amendments.'],
    ['How urgent is replacement?', 'Fire protection deficiencies may require prompt correction, but a specific deadline cannot be inferred from the image.', 'Establish correction deadline, deficiency classification and impairment procedures if needed.'],
    ['Is the sprinkler correctly installed?', 'The photograph is insufficient to verify all installation and compatibility requirements.', 'Confirm installation requirements and acceptance of the replacement.'],
    ['Is the violation resolved?', 'A new photograph can show removal of the painted sprinkler, but cannot alone prove proper restoration or testing.', 'Review documentation and approve closure of the finding.'],
  ],

  final: [
    ['Primary finding', 'Painted fire sprinkler head — inspector-confirmed violation.'],
    ['Primary cause', 'Apparent nonmanufacturer-applied paint contamination on exposed sprinkler components.'],
    ['Primary risk', 'Potential interference with sprinkler activation, mechanical release or water distribution during a fire.'],
    ['Required corrective action', 'Replace the affected sprinkler head with an appropriate listed replacement installed by qualified personnel.'],
    ['Supplementary recommendation', 'Inspect nearby sprinklers for similar paint contamination.'],
    ['Inspector discretion', 'Required for code applicability, identification of the affected sprinkler, deficiency severity, compliance deadline, additional corrective measures, and final approval.'],
    ['Final status', 'Noncompliant — sprinkler replacement required.'],
  ],
},
};
