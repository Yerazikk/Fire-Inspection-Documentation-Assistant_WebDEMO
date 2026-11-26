// examples/sprinkler/example.js — a painted fire sprinkler head.
//
// The photograph: a ceiling-mounted sprinkler with paint on its arms and body (assets/sprinkler.png). The
// inspector confirmed the contamination and specified replacement by a licensed contractor.
//
// Why it is here: the duty is STATE law and reads the same everywhere, so the verdict is red in all five places.
// What the place changes is the adopting ordinance, whether the local rule made this a required system, and what
// § 901.7 asks while the head is out. It is the clearest case of "same photograph, different citation".
//
// Words: monday/sprinkler.md, the inspector's gold-standard analysis, reflowed, never rewritten.
(function (root) {
'use strict';
const EX = root.FireExamples, SRC = root.FIREGEO_LAWBASE.sources, FIRE = root.FIREGEO_LAWBASE.FIRE;

// ============================================================= 1. what the inspector found
// window.CONTENT.sprinkler: the inspection record, as structured content. Tags carry the evidentiary
// standing of a statement through to the page: confirmed / observed / verify (see examples/README.md).
const content = {
  tab: 'Sprinkler',
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
};

// ============================================================= 2. the law
const Q_9032 = '“An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures.”';
const Q_6132 = ' The Town WUI Code § 613.2 requires one “in all occupancies, in new buildings, and substantial remodels.”';
const Q_REMODEL = 'Sprinklers “in all buildings in excess of 3,000 sq. ft. which have ten per cent (10%) or more floor area added within any 36 month period”, and in all buildings with “fifty per cent (50%) or more floor area added, or any ‘substantial remodel’ … within any 36 month period.”';
const Q_9017 = '“Where a required fire protection system is out of service, the fire department and the fire code official shall be notified immediately and, where required by the fire code official, the building shall be either evacuated or an approved fire watch shall be provided … This section shall also apply to residential fire sprinkler systems.”';

const law = {
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

  // The one-line form of each row: the section number, and the local code that carries it.
  short: {
  'maintenance': { sec: '§ 901.6', code: 'California Fire Code' }, 'itm-standard': { sec: '§ 903.5', code: 'NFPA 25 § 5.2.1.1.1' }, 'residential': { sec: '§ R309.3.2.6', code: 'Residential Code' },
  'required-system': { sec: '§ 903.2.1', code: FIRE },
  'remodel-triggers': { sec: '§§ 903.2.2, 903.2.2.1', code: FIRE }, 'out-of-service': { sec: '§ 901.7', code: FIRE },
  },

  // One plain sentence when the map moves to the other region. {To} {toName} = the place arrived in.
  across: '{To} requires sprinklers in every new building.',

  overallLine: 'A painted head must be replaced.',

  // The verdict rules this example's rows name. Each returns { verdict, why }: `row` is the merged row,
  // `c` is { d, scope, zone, place }. A rule reads only what the cited text says.
  rules: {
    // California Fire Code § 901.6: the inspector confirmed the painted head and specified replacement.
    maintenance() { return { verdict: 'red', why: 'Inspector confirmed the head is painted. It must be replaced.' }; },
  },
};

// ============================================================= 3. the field app (the phone)
// The rules this follows (Andrew, 22 Nov): the app answers everything it can, and the person is asked
// only what a photograph cannot tell. A question must be about THIS photograph and what is in it.
const field = {
  // what the app thinks the inspector is reporting, and the other readings on offer
  reading: {
    text: 'This sprinkler has paint on it.',
    alternatives: ['The ring around the sprinkler has brown spots.', 'The paint is only on the ring around it, not on the sprinkler.'],
    source: 'content.js sprinkler.summary, annotations[0..2]; sprinkler.md "Surrounding ceiling and trim"',
  },

  // what the scan lights up: the finding, and at most one thing beside it that matters. `ix` names a
  // content annotation by its index; the region itself is read from that annotation, never written here.
  scan: [{ ix: 2, label: 'Stains on the ring' }, { ix: 0, label: 'Paint on the sprinkler', finding: true }],

  // what the app reads off the photo: answers already filled in. The first option is the app's own
  // reading; the others are what a tap on "Change" offers.
  seen: [
    { id: 'paint', label: 'Paint', options: [{ id: 'arms', label: 'On the metal arms and the middle' }, { id: 'all', label: 'All over it' }, { id: 'ring', label: 'Only on the ring around it' }], source: 'content.js sprinkler.summary; annotations[0]' },
    { id: 'plate', label: 'Bottom plate', options: [{ id: 'clean', label: 'No heavy paint' }, { id: 'painted', label: 'Painted too' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js sprinkler.annotations[1]; uncertainty "Is the deflector painted?"' },
  ],

  // the questions: one screen, at most three, answered by tapping. Fewer is better. None is fine.
  questions: [
    {
      id: 'year', ask: 'What year is stamped on the sprinkler?', picture: 'block',
      entry: { name: 'Year, four numbers', digits: 4, min: 1950, max: () => new Date().getFullYear(), always: true, wrong: 'That year looks unlikely. Check the four numbers.' },      // min..max is the range taken without a question (this app's own choice, not from the sources). Outside it the app asks once; the person may still keep the year.
      cant: { id: 'cant', label: 'I can’t see a year' },
      say: () => 'The senior inspector will check its age.',
      photo: { label: 'Add a close photo', prompt: 'Take a close photo of the sprinkler.', picture: 'closeup', callout: 'Fill the picture with the sprinkler', safety: 'Don’t touch the sprinkler.' },
      source: 'content.js sprinkler.identification.markings[2] (year of manufacture on the wrench boss), .clues[6], .evidence[0]; uncertainty "Is the sprinkler expired or recalled?". The sources give no age limit, so none is stated.',
    },
  ],

  /** the phone's answers as plain facts for the code rows. a = answers, c = corrected readings. */
  facts(a, c, h) {
    const f = {}; const { seen } = h;
    const y = a.year || {};
    if (y.value != null) { f.year = y.value; if (y.unlikely) f.yearUnlikely = true; } else if (y.pick === 'cant') f.yearCant = true;
    for (const k of ['paint', 'plate']) if (c[k] && c[k] !== seen('sprinkler').find(s => s.id === k).options[0].id) f[k] = c[k];
    return f;
  },

  /** the one or two things the senior inspector should act on: a short line and a full sentence. */
  callouts(f, ctx) {
    const out = []; const thisYear = ctx.thisYear;
    if (f.year && f.yearUnlikely) out.push({ short: 'Year typed on site: ' + f.year + '. It looks unlikely; check the stamp.', text: 'The year typed on site is ' + f.year + '. That looks unlikely for a sprinkler in service. The app asked the field inspector to check the four numbers, and they kept them. Read the stamp again before relying on it.' });
    else if (f.year) out.push({ short: 'Year on the sprinkler: ' + f.year + '.', text: 'Made in ' + f.year + ', about ' + (thisYear - f.year) + ' years ago. Check its age against the testing rules and the model against the recall list. The app has neither list.' });
    else if (f.yearCant) out.push({ short: 'Year not recorded: out of reach.', text: 'The year could not be read on site. Look for it in the building’s sprinkler records.' });
    else out.push({ short: 'Year not recorded.', text: 'The year was not given. The age of this sprinkler is not known.' });
    if (f.plate === 'painted' || f.paint === 'all') out.push({ short: 'More paint than the app saw.', text: 'The field inspector says the paint goes further than the app saw.' });
    return out;
  },

  /** what those answers do to this example's rows on the senior inspector's desk (team/adapter.js). */
  apply(f, ctx) {
    const { lead } = ctx;
    if (f.paint === 'all') lead('maintenance', 'The field inspector says the paint is all over the sprinkler.');
    else if (f.paint === 'ring') lead('maintenance', 'The field inspector says the paint is only on the ring around the sprinkler.');
    if (f.plate === 'painted') { lead('maintenance', 'The field inspector says the bottom plate is painted too.'); lead('itm-standard', 'The field inspector says the bottom plate is painted too.'); }
  },
};

// ============================================================= 4. the owner's numbered steps
// One list per correction, keyed by the correction id. Each step is one concrete action and says where
// to stop or what must stay; the second item is where the step comes from in the content above.
const ownerSteps = {
  a: [
    ['Call a qualified fire sprinkler contractor. This is not a job to do yourself.', 'solutions[a].how[0]; owner.todo'],
    ['Do not scrape, sand or clean the paint off. It can damage the sprinkler and does not make it safe.', 'notAcceptable.body; owner.dont'],
    ['The contractor works out exactly which sprinkler you have and fits a matching new one in the same place.', 'solutions[a].how[1], [2], [4]'],
    ['The contractor keeps the system safe while the old head is out, then tests it.', 'solutions[a].how[3], [5]'],
    ['In most cases only this one head has to be replaced, not the whole system. The ceiling and the pipes stay as they are.', 'owner.keep; solutions[a].keep'],
    ['Keep the contractor’s paperwork and give it to your inspector if asked.', 'solutions[a].how[6]; owner.qa "What happens next?"'],
  ],
};

EX.define({
  id: 'sprinkler', tab: 'Sprinkler', title: 'Painted sprinkler head',
  photo: 'assets/sprinkler.png', aspect: 428 / 710,
  usesDistance: false,
  zoom: 15,
  content, law, field, ownerSteps,
  emphasis: [
    'shall be installed and maintained in all newly constructed buildings or structures',
    'in all occupancies, in new buildings, and substantial remodels',
    'in excess of 3,000 sq. ft.', 'ten per cent (10%) or more floor area added', 'fifty per cent (50%) or more floor area added', 'within any 36 month period', '‘substantial remodel’',
    'shall be notified immediately', 'evacuated', 'approved fire watch', 'shall also apply to residential fire sprinkler systems',
    'kept in operative condition', 'repaired or replaced',
    'replacing sprinklers with disqualifying paint', 'detrimental to performance',
    'is prohibited', 'must be replaced',
    'Two exceptions', 'Five exceptions', 'other than R-3 occupancies',
  ],
});
})(typeof window !== 'undefined' ? window : globalThis);
