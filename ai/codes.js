// The fire-code corpus the AI is grounded in. Server-side only — never shipped
// to the browser.
//
// Every entry here was transcribed from a primary source, and `meta.sources`
// says which. Nothing in this file is paraphrased from memory: if a value could
// not be read off the source document it is not here, and `status` says so.
//
// HOW TO MAINTAIN THIS FILE
//   - `text` is the operative requirement, trimmed to what an inspector acts on.
//     Keep it close to the source wording; this is what the model cites from.
//   - `tags` drive selection (see `select` below). Add tags freely; the matcher
//     ignores ones nothing looks for.
//   - When a code changes, bump `meta.edition` / `meta.retrieved` and fix
//     `status` on the entries affected. The notice pins `meta.edition`, because
//     codes change between inspection and hearing.
//   - `status: 'current'` may be cited as an enforceable requirement.
//     `status: 'adopted-pending'` may be mentioned as upcoming, never cited as
//     a violation. The prompt enforces that distinction; see ai/prompts.js.

const meta = {
  jurisdiction: 'Marin County, California (unincorporated) — Marin County Fire Department',
  localChapter: 'Marin County Code Chapter 16.16 (fire code), local amendments at § 16.16.040',
  // The ordinance read for this file adopts the 2019 CFC / 2018 IFC / 2018 IWUIC.
  // Marin re-adopts on the triennial cycle, so this is the edition to re-check first.
  edition: '2019 California Fire Code as adopted and amended by Marin County Code ch. 16.16',
  editionCaveat: 'Marin adopts the California Fire Code on the triennial cycle. The ordinance transcribed here adopts the 2019 CFC; confirm whether a later adopting ordinance (2022 or 2025 CFC) supersedes it before a notice goes to hearing.',
  retrieved: '2026-11-07',
  sources: [
    'Ordinance of the Marin County Board of Supervisors repealing and re-establishing Marin County Code ch. 16.16 (marin.granicus.com) — transcribed verbatim',
    'Cal. Code Regs. tit. 14 §§ 1299.02–1299.04 (law.cornell.edu)',
    'Public Resources Code § 4291 (codes.findlaw.com)',
    'CAL FIRE Office of the State Fire Marshal, 2023 Property Inspection Guide',
    'California Board of Forestry and Fire Protection Zone 0 rulemaking, adopted 2026-08-19',
  ],
};

// ---------------------------------------------------------------------------
// The codes themselves.
// ---------------------------------------------------------------------------

const codes = [
  // ---- Local: Marin County Code ch. 16.16, amending CFC ch. 49 ----
  {
    id: 'mc-4907-2',
    scope: 'Local',
    citation: 'California Fire Code § 4907.2 (added by Marin County Code § 16.16.040)',
    title: 'Fire Hazard Reduction',
    status: 'current',
    tags: ['defensible-space', 'ladder-fuel', 'dead-vegetation', 'tree-limb', 'roof-gutter', 'chimney', 'limbing', 'zone1'],
    text: [
      'Any person who owns, leases, controls or maintains any building or structure, vacant lands, open space, and/or lands within specific Wildland Urban Interface areas of the jurisdiction of the Marin County Fire Department shall comply with the following:',
      '1. Cut and remove all fire prone vegetation within 30 feet of structures, up to 150 feet when topographic or combustible vegetative types necessitate removal as determined by the Fire Code Official.',
      '2. Remove accumulated dead vegetation on the property.',
      '3. Cut and remove tree limbs that overhang wood decks and roofs.',
      '4. Remove that portion of any tree which extends within 10 feet of any chimney or stovepipe, roof surfaces and roof gutters.',
      '5. Clean any leaves and needles from roof and gutters.',
      '6. Cut and remove growth less than 3 inches in diameter, from the ground up to a maximum height of 10 feet, provided that no crown shall be raised to a point so as to remove branches from more than the lower one-third of the tree’s total height.',
      '7. Vegetation clearance requirements for new construction and substantial remodels in Wildland-Urban Interface Areas shall be in accordance with the 2018 International Wildland-Urban Interface Code as amended by the County of Marin.',
      'EXCEPTION 1: When approved by the Fire Code Official, single specimens of trees, ornamental shrubbery or similar plants used as ground covers, provided that they do not form a means of rapidly transmitting fire from the native growth to any structure.',
      'EXCEPTION 2: When approved by the Fire Code Official, grass and other vegetation located more than 30 feet from buildings or structures and less than 18 inches in height above the ground need not be removed where necessary to stabilize soil and prevent erosion.',
    ].join('\n'),
  },
  {
    id: 'mc-322-6-3',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3 (added by Marin County Code § 16.16.040)',
    title: 'Clearance of brush or vegetative growth from structures',
    status: 'current',
    tags: ['defensible-space', 'zone2', 'clearance'],
    text: 'Any person owning, leasing, controlling, operating or maintaining any building and/or lands in, upon, or adjoining any hazardous fire area shall at all times maintain defensible space around and adjacent to such building by removing and clearing away all combustible material for a distance not less than 100 feet from all portions of the structure. Distances may be increased or decreased by the fire code official based on site specific analysis of local conditions.\nException: Single specimens of trees, ornamental vegetative fuels or cultivated ground cover, such as green grass, ivy, succulents or similar plants used as ground cover, provided that they do not form a means of readily transmitting fire.',
  },
  {
    id: 'mc-322-6-3-1',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.1 (Marin County Code § 16.16.040)',
    title: 'Tree clearance from chimney outlet',
    status: 'current',
    tags: ['chimney', 'tree-limb'],
    text: 'Remove that portion of any tree that extends within 10 feet of the outlet of any chimney or stovepipe.',
  },
  {
    id: 'mc-322-6-3-2',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.2 (Marin County Code § 16.16.040)',
    title: 'Dead material in vegetation adjacent to buildings',
    status: 'current',
    tags: ['dead-vegetation', 'tree-limb'],
    text: 'Maintain any tree, shrub, or other plant adjacent to or overhanging any building free of dead limbs, branches or other combustible material.',
  },
  {
    id: 'mc-322-6-3-3',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.3 (Marin County Code § 16.16.040)',
    title: 'Roof and gutter maintenance',
    status: 'current',
    tags: ['roof-gutter'],
    text: 'Maintain the roof of any structure and roof gutters free of leaves, needles, or other combustible materials.',
  },
  {
    id: 'mc-322-6-3-4',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.4 (Marin County Code § 16.16.040)',
    title: 'Limbing of trees near buildings and roadways',
    status: 'current',
    tags: ['limbing', 'ladder-fuel', 'tree-limb', 'driveway'],
    text: 'Maintain trees within 100 feet of any building or structure, or within 10 feet of any portion of any highway, street, alley, or driveway which is improved or used for vehicle travel, so that leafy foliage, twigs or branches are above 5 feet of the ground.',
  },
  {
    id: 'mc-322-6-3-5',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.5 (Marin County Code § 16.16.040)',
    title: 'Vertical clearance over roof surfaces',
    status: 'current',
    tags: ['tree-limb', 'roof-gutter'],
    text: 'Maintain 5 feet of vertical clearance between roof surfaces and portions of trees overhanging any building or structure.',
  },
  {
    id: 'mc-322-6-2',
    scope: 'Local',
    citation: 'California Fire Code §§ 322.6.2.2–322.6.2.3 (Marin County Code § 16.16.040)',
    title: 'Parcel abatement by parcel size',
    status: 'current',
    tags: ['parcel-abatement', 'grass', 'vacant-land'],
    text: 'Parcels one acre or less (43,560 square feet) shall require abatement of the entire parcel. Parcels over one acre may be required to provide 30-foot fuel breaks along the perimeter of the property line and/or 100 feet from adjacent structures; parcels 10 acres or more shall additionally provide a 30-foot cross break dividing the parcel into approximately 5-acre sections.',
  },
  {
    id: 'mc-4908',
    scope: 'Local',
    citation: 'California Fire Code § 4908 (added by Marin County Code § 16.16.040)',
    title: 'Fire hazard reduction from roadways',
    status: 'current',
    tags: ['driveway', 'access'],
    text: 'The Fire Code Official is authorized to cause areas within 10 feet on each side of portions of highways, fire apparatus access roads (improved or unimproved), and driveways which are improved, designed, or ordinarily used for vehicular traffic to be cleared of flammable vegetation and other combustible growth. Corrective action, if necessary, shall be the same as the actions required in § 4907.2.',
  },
  {
    id: 'mc-4906-2',
    scope: 'Local',
    citation: 'California Fire Code § 4906.2 (as amended by Marin County Code § 16.16.040)',
    title: 'Application — where vegetation management is required',
    status: 'current',
    tags: ['applicability'],
    text: 'Buildings and structures in the following areas shall maintain the required hazardous vegetation and fuel management: (1) all unincorporated lands designated by the State Board of Forestry and Fire Protection as State Responsibility Area (SRA), including moderate, high and very-high Fire Hazard Severity Zones; (2) land designated Very-High Fire Hazard Severity Zone by cities and other local agencies; (3) land designated Wildland-Urban Interface Fire Area by cities and other local agencies.',
  },
  {
    id: 'mc-4907-1',
    scope: 'Local',
    citation: 'California Fire Code § 4907.1 (as amended by Marin County Code § 16.16.040)',
    title: 'Defensible space — general',
    status: 'current',
    tags: ['defensible-space', 'applicability'],
    text: 'Defensible space will be maintained around all buildings and structures in State Responsibility Area as required in Public Resources Code § 4290 and the SRA Fire Safe Regulations, 14 CCR § 1270. Buildings and structures within the Wildland-Urban Interface Area as designated by the local enforcing agency and within Very-High Fire Hazard Severity Zones of local responsibility areas shall maintain defensible space as outlined in Government Code §§ 51175–51189 and any local ordinance or standard published by the Fire Code Official.',
  },
  {
    id: 'mc-322-7',
    scope: 'Local',
    citation: 'California Fire Code §§ 322.7–322.8, 322.9.8.2 (Marin County Code § 16.16.040)',
    title: 'Vegetation Management Plan',
    status: 'current',
    tags: ['vmp', 'alternative'],
    text: 'A Vegetation Management Plan shall be prepared by the applicant/property owner when required by the fire code official, at the owner’s cost. In lieu of vegetation abatement the property owner may submit a Vegetation Management Plan specific to the property describing ways to minimize, mitigate and/or eliminate potential loss from wildfire exposure. The plan shall be developed and approved by the Fire Department, and compliance shall be verified each year by an approved third party.',
  },

  // ---- State ----
  {
    id: 'prc-4291',
    scope: 'State',
    citation: 'Public Resources Code § 4291',
    title: 'Defensible space around structures in the State Responsibility Area',
    status: 'current',
    tags: ['defensible-space', 'zone0', 'zone1', 'zone2', 'roof-gutter', 'chimney', 'dead-vegetation'],
    text: [
      '(a) A person who owns, leases, controls, operates, or maintains a building or structure in the state responsibility area shall at all times do all of the following:',
      '(1)(A) Maintain defensible space of 100 feet from each side and from the front and rear of the structure, but not beyond the property line. The intensity of fuels management may vary within the 100-foot perimeter, with more intense fuel reductions being utilized between 5 and 30 feet around the structure, and an ember-resistant zone being required within 5 feet of the structure.',
      '(1)(B) Greater distances may be required by state law or local ordinance. Fuel modification beyond the property line is permitted only as needed to maintain the 100 feet of defensible space, and requires the adjacent landowner’s consent.',
      '(2) Remove that portion of a tree that extends within 10 feet of the outlet of a chimney or stovepipe.',
      '(3) Maintain a tree, shrub, or other plant adjacent to or overhanging a building free of dead or dying wood.',
      '(4) Maintain the roof of a structure free of leaves, needles, or other vegetative materials.',
      '(i) For purposes of this section, a structure for the purpose of an ember-resistant zone shall include any attached deck.',
    ].join('\n'),
  },
  {
    id: 'gc-51182',
    scope: 'State',
    citation: 'Government Code §§ 51175–51189 (incl. § 51182)',
    title: 'Defensible space in Very High Fire Hazard Severity Zones (local responsibility area)',
    status: 'current',
    tags: ['defensible-space', 'applicability'],
    text: 'Imposes the defensible-space duties of PRC § 4291 on owners of buildings and structures in Very High Fire Hazard Severity Zones within local responsibility areas. This is the authority Marin County Code § 16.16.040 points to for LRA parcels; cite it rather than PRC § 4291 where the parcel is in an LRA VHFHSZ rather than the SRA.',
  },
  {
    id: 'ccr-1299-03',
    scope: 'State',
    citation: '14 CCR § 1299.03',
    title: 'Defensible space requirements — Zone 1 and Zone 2',
    status: 'current',
    tags: ['defensible-space', 'zone1', 'zone2', 'ladder-fuel', 'spacing', 'grass', 'firewood', 'propane'],
    text: [
      'Defensible space is required to be maintained at all times whenever flammable vegetative conditions exist. One hundred feet of defensible space clearance shall be maintained in two distinct zones.',
      'Zone 1 extends 30 feet from the building or structure, or to the property line, whichever is closer. Remove all dead and dying vegetation and branches overhanging roofs; relocate firewood piles outside the zone unless fire-resistant covered; eliminate flammable items near combustible structures.',
      'Zone 2 extends from 30 to 100 feet from the building or structure, not beyond the property line. Create horizontal and vertical spacing among shrubs and trees using the Fuel Separation method, the Continuous Tree Canopy method, or a combination of both. Remove dead woody fuels. Loose surface litter is permitted to a maximum depth of three inches. Cut grasses to a maximum height of four inches. Maintain 10 feet of clearance around wood piles.',
      'In both zones, outbuildings and LPG tanks require 10 feet of clearance to bare mineral soil. Measures shall minimize soil erosion, particularly on slopes.',
    ].join('\n'),
  },
  {
    id: 'ccr-1299-04',
    scope: 'State',
    citation: '14 CCR § 1299.04',
    title: 'Additional clearance',
    status: 'current',
    tags: ['clearance', 'applicability'],
    text: 'A fire expert designated by the Director may require more than 100 feet of defensible space, but cannot require clearance beyond the property line. Further guidance is contained in the Board of Forestry’s General Guidelines for Creating Defensible Space and in the Property Inspection Guide.',
  },
  {
    id: 'zone0',
    scope: 'State',
    citation: 'PRC § 4291(a)(1)(A) ember-resistant zone; 14 CCR Zone 0 regulations adopted 2026-08-19',
    title: 'Zone 0 — ember-resistant zone, 0 to 5 feet',
    // Deliberately not 'current'. Adopted by the Board of Forestry on
    // 2026-08-19 with phased compliance; may be described as coming, must not
    // be written up as a violation today.
    status: 'adopted-pending',
    tags: ['zone0', 'ember'],
    text: 'An ember-resistant zone within 5 feet of the structure, including any attached deck, is required by PRC § 4291(a)(1)(A). The implementing regulations were adopted by the Board of Forestry and Fire Protection on 19 August 2026 with phased compliance — roughly three years for removal of combustible materials, firewood, ladder fuels and clearing under decks, and three to five years for under-eave treatment, attached combustible fences and gates, and outbuildings. Under PRC § 4291(g), the requirement takes effect for new structures after the regulations and guidance document are in place, and for existing structures three years after that date. Treat Zone 0 as an advisory recommendation, not an enforceable violation, until the effective dates pass.',
  },
];

// ---------------------------------------------------------------------------
// Numeric standards the model must not invent. Quoting a number for spacing or
// clearance is only allowed from here.
// ---------------------------------------------------------------------------

const tables = {
  verticalClearance: {
    citation: '14 CCR § 1299.03 (Fuel Separation); CAL FIRE Property Inspection Guide',
    rule: 'Vertical clearance between the top of a lower fuel and the lowest branches of the fuel above it = 3 x the height of the lower fuel.',
    example: 'A 5 ft shrub under a tree requires 3 x 5 = 15 ft of clearance to the lowest tree branch.',
    limbing: 'Remove tree branches to at least 6 ft from the ground. Marin CFC § 4907.2(6) allows limbing up to 10 ft but no more than the lower one-third of the tree’s total height; Marin CFC § 322.6.3.4 requires foliage above 5 ft within 100 ft of a structure.',
  },
  horizontalSpacing: {
    citation: 'CAL FIRE Property Inspection Guide (Fuel Separation chart); 14 CCR § 1299.03',
    rule: 'Minimum horizontal spacing between fuels, measured between the outer edges of the canopies, scales with slope.',
    rows: [
      { slope: '0–20 % (flat to mild)', shrubSpacing: '2 x the height of the shrub', treeMinimum: '10 ft between tree canopies' },
      { slope: '20–40 % (mild to moderate)', shrubSpacing: '4 x the height of the shrub', treeMinimum: '20 ft between tree canopies' },
      { slope: 'over 40 % (moderate to steep)', shrubSpacing: '6 x the height of the shrub', treeMinimum: '30 ft between tree canopies' },
    ],
    bounds: 'The Fuel Separation method requires spacing of fuels from 4 ft to 40 ft in all directions, horizontally and vertically, based on slope, fuel type and fuel size. Fuels of similar type growing in groups no larger than 10 ft in total foliage width are treated as a single plant.',
  },
  continuousTreeCanopy: {
    citation: 'CAL FIRE Property Inspection Guide',
    rule: 'The Continuous Tree Canopy method requires removal of surface fuels greater than 3 inches in height and removal of lower tree limbs a minimum of 6 ft and up to 15 ft. For trees smaller than 18 ft, remove the lower one-third of the limbs. Slope and fire danger determine limb removal at the upper end of the scale.',
  },
  misc: {
    citation: '14 CCR § 1299.03',
    grass: 'Grasses and forbs cut to a maximum height of 4 inches.',
    litter: 'Loose surface litter permitted to a maximum depth of 3 inches.',
    firewood: '10 ft of clearance around wood piles; firewood relocated outside Zone 1 unless fire-resistant covered.',
    lpg: 'LPG tanks and outbuildings: 10 ft of clearance to bare mineral soil.',
  },
};

// ---------------------------------------------------------------------------
// Procedure — the dates and consequences a notice to the owner turns on.
// These are the real Marin windows, and they are much shorter than a generic
// "45 days to correct" would suggest.
// ---------------------------------------------------------------------------

const procedure = {
  abatementNotice: {
    citation: 'California Fire Code § 322.9.1 (Marin County Code § 16.16.040)',
    correctionDays: 10,
    text: 'The fire code official mails the notice to the owner as shown on the current county equalized assessment roll, or posts it on the property and publishes it not less than 10 days before the abatement hearing. The notice is headed "Notice to Abate Hazardous Vegetation/Combustible Material" in letters at least one inch high, and notifies the owner to remove the weeds, dead trees, brush and rubbish within 10 days from the date of the notice. On failure, the Marin County Fire Department removes it and the cost of abatement including administrative costs is collected as property taxes and is a lien on the property until paid.',
  },
  immediateHazard: {
    citation: 'California Fire Code § 322.9.3 (Marin County Code § 16.16.040)',
    correctionDays: 5,
    text: 'Where the fire code official, Fire Chief or Board of Supervisors finds an extreme fire hazard constituting an immediate threat to public health, safety and welfare, the hazard shall be abated within 5 days of posting of the Notice to Abate on the parcel, or within 5 days of receiving it by mail. Under § 322.9.35, an urgent and imminent threat shall be abated immediately.',
  },
  hearing: {
    citation: 'California Fire Code § 322.9.4; Marin County Code § 16.16.055',
    text: 'A hearing date is set at least 10 days after the date of the notice, before the Fire Chief or designee, where the owner or their agent may show cause why the order should not be enforced. For good cause the Hearing Officer may extend the time for compliance or rescind the order. The Fire Chief or designee renders a decision within 10 days of the hearing.',
  },
  appeal: {
    citation: 'Marin County Code § 16.16.055',
    appealDays: 15,
    text: 'Within 15 days of the Hearing Officer’s decision the person may file an appeal, which shall be heard within 30 days of filing. The Appeal Officer is appointed by the County Administrator and renders a final decision within 10 days following the close of the hearing or the submission of post-hearing documents, whichever is later. For an appeal under § 322.9.3 (immediate hazard) the appeal must be made within 72 hours and is heard within 5 days.',
  },
  penalties: {
    citation: 'Marin County Code § 16.16.060',
    text: 'A first administrative citation within a 12-month period is a civil penalty of $150 plus the actual cost of all inspections required to gain compliance, owed to the Marin County Fire Department within 30 days of the date of mailing unless an appeal is filed under § 16.16.055. Subsequent citations within 12 months are misdemeanors/infractions. Each day a violation continues after a final notice has been delivered is a separate offense.',
  },
  appealsOfficer: {
    citation: 'California Fire Code § 322.10 (Marin County Code § 16.16.040)',
    text: 'An Appeal Officer appointed by the County Administrator hears and decides appeals of orders, decisions or determinations of the fire code official relative to the application and interpretation of the code, and renders all decisions and findings in writing to the appellant.',
  },
};

// ---------------------------------------------------------------------------
// Selection + packing. `select` keeps the prompt small by sending only the
// codes a given set of entries could plausibly touch; `pack` renders them.
// ---------------------------------------------------------------------------

// Words in an inspector's note that imply a tag. Cheap, transparent, and easy
// to extend — add a row rather than reaching for anything cleverer.
const TAG_HINTS = {
  'ladder-fuel': /ladder|continuous|hedge|shrub|understor|brush|broom|juniper|oleander|ivy|ground ?cover/i,
  spacing: /spacing|spaced|gap|separation|continuous|slope|canopy/i,
  'tree-limb': /limb|branch|overhang|overhead|canopy|bough|bay laurel|eucalyptus|pine/i,
  'roof-gutter': /roof|gutter|eave|needle|leaf litter|leaves|downspout|shingle/i,
  chimney: /chimney|stovepipe|flue|spark arrest/i,
  'dead-vegetation': /dead|dying|dry|desiccat|brown|litter|debris|duff|bark/i,
  grass: /grass|weed|annual|mow|forb|4 in|four inch/i,
  firewood: /firewood|wood ?pile|woodpile|log|cord/i,
  propane: /propane|lpg|tank|outbuilding|shed/i,
  driveway: /driveway|road|street|access|turnaround|apparatus/i,
  'parcel-abatement': /vacant|lot|parcel|acre|open space|undeveloped/i,
  zone0: /zone ?0|ember|within 5 ft|immediate zone|under ?deck|attached deck|fence/i,
  zone1: /zone ?1|30 ?f|thirty f/i,
  zone2: /zone ?2|100 ?f|hundred f/i,
  limbing: /limb|prune|trim|raise the canopy|6 ?ft|six f/i,
  vmp: /vegetation management plan|vmp|management plan/i,
};

// Always sent: the applicability and defensible-space backbone. Without these
// the model has no authority to hang a finding on.
const ALWAYS = ['mc-4907-2', 'mc-322-6-3', 'prc-4291', 'ccr-1299-03', 'mc-4906-2'];

function tagsFor(text) {
  const found = new Set();
  for (const [tag, re] of Object.entries(TAG_HINTS)) if (re.test(text || '')) found.add(tag);
  return [...found];
}

/**
 * Pick the codes relevant to some free text (the concatenated inspector notes).
 * @param {string} text
 * @param {{mode?: 'all'|'relevant'}} opts  'all' sends the whole corpus.
 * @returns {Array} code entries
 */
function select(text, opts = {}) {
  if ((opts.mode || 'relevant') === 'all') return codes.slice();
  const tags = new Set(tagsFor(text));
  return codes.filter(c => ALWAYS.includes(c.id) || c.tags.some(t => tags.has(t)));
}

/** Render code entries as the grounding block that goes into the prompt. */
function pack(list) {
  return list.map(c => {
    const flag = c.status === 'current' ? '' : `\n  STATUS: ${c.status} — may be described as upcoming, must NOT be cited as a present violation.`;
    return `[${c.id}] ${c.scope} · ${c.citation} — ${c.title}${flag}\n  ${c.text.replace(/\n/g, '\n  ')}`;
  }).join('\n\n');
}

/** Render the numeric standards block. */
function packTables() {
  const t = tables;
  const rows = t.horizontalSpacing.rows.map(r => `    ${r.slope}: ${r.shrubSpacing}; ${r.treeMinimum}`).join('\n');
  return [
    `VERTICAL CLEARANCE (${t.verticalClearance.citation})`,
    `  ${t.verticalClearance.rule}`,
    `  Example: ${t.verticalClearance.example}`,
    `  Limbing: ${t.verticalClearance.limbing}`,
    ``,
    `HORIZONTAL SPACING (${t.horizontalSpacing.citation})`,
    `  ${t.horizontalSpacing.rule}`,
    rows,
    `  ${t.horizontalSpacing.bounds}`,
    ``,
    `CONTINUOUS TREE CANOPY (${t.continuousTreeCanopy.citation})`,
    `  ${t.continuousTreeCanopy.rule}`,
    ``,
    `OTHER LIMITS (${t.misc.citation})`,
    `  ${t.misc.grass}`,
    `  ${t.misc.litter}`,
    `  ${t.misc.firewood}`,
    `  ${t.misc.lpg}`,
  ].join('\n');
}

/** Render the procedural block — deadlines, hearings, penalties. */
function packProcedure() {
  return Object.entries(procedure)
    .map(([k, p]) => `${k.toUpperCase()} (${p.citation})\n  ${p.text}`)
    .join('\n\n');
}

module.exports = { meta, codes, tables, procedure, select, pack, packTables, packProcedure, tagsFor };
