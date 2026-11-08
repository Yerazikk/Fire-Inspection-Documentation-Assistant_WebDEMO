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
//   - `domain` is 'vegetation' or 'building'. It decides which backbone and
//     which numeric tables are sent: a note about a painted sprinkler should
//     not drag in the defensible-space corpus, and vice versa.
//   - `provenance` is 'transcribed' when the text was read off a primary
//     source, 'unverified' when it states the requirement correctly as far as
//     the author knew but was NOT transcribed. Unverified entries are citable
//     — otherwise the building-code half of the app could not work — but they
//     are reported in `doc.audit.unsourcedCitations` so the UI can caveat them,
//     and every one of them is a task: replace with transcribed text.

const meta = {
  jurisdiction: 'Marin County, California (unincorporated) — Marin County Fire Department',
  localChapter: 'Marin County Code Chapter 16.16 (fire code), local amendments at § 16.16.040',
  // The ordinance read for this file adopts the 2019 CFC / 2018 IFC / 2018 IWUIC.
  // Marin re-adopts on the triennial cycle, so this is the edition to re-check first.
  edition: '2019 California Fire Code as adopted and amended by Marin County Code ch. 16.16',
  editionCaveat: 'Marin adopts the California Fire Code on the triennial cycle. The ordinance transcribed here adopts the 2019 CFC; confirm whether a later adopting ordinance (2022 or 2025 CFC) supersedes it before a notice goes to hearing.',
  retrieved: '2026-11-07',
  // The building-code half of this corpus is NOT transcribed. Section numbers
  // and requirements are stated as accurately as they were known to the author
  // and were sanity-checked against the 2019 CFC chapter structure, but the
  // operative text was not read off a primary source: codes.iccsafe.org
  // refuses automated access and the mirrors available did not carry the
  // section text. Every such entry carries provenance: 'unverified'.
  provenanceCaveat: 'The vegetation corpus was transcribed from primary sources. The building and fire-protection corpus was not: its section numbers and requirements are stated to the best of the author’s knowledge and must be verified against the adopted California Fire Code before any citation drawn from it goes on an enforceable notice.',
  sources: [
    'Ordinance of the Marin County Board of Supervisors repealing and re-establishing Marin County Code ch. 16.16 (marin.granicus.com) — transcribed verbatim',
    'Cal. Code Regs. tit. 14 §§ 1299.02–1299.04 (law.cornell.edu)',
    'Public Resources Code § 4291 (codes.findlaw.com)',
    'CAL FIRE Office of the State Fire Marshal, 2023 Property Inspection Guide',
    'California Board of Forestry and Fire Protection Zone 0 rulemaking, adopted 2026-08-19',
    'Building / fire-protection sections (CFC chs. 3, 5, 6, 7, 9, 10; NFPA 10, 13, 25, 72): NOT TRANSCRIBED — see provenanceCaveat and the provenance flag on each entry.',
  ],
};

// ---------------------------------------------------------------------------
// The codes themselves.
// ---------------------------------------------------------------------------

const codes = [
  // ---- Local: Marin County Code ch. 16.16, amending CFC ch. 49 ----
  {
    id: 'mc-4907-2',
    domain: 'vegetation',
    provenance: 'transcribed',
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
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3 (added by Marin County Code § 16.16.040)',
    title: 'Clearance of brush or vegetative growth from structures',
    status: 'current',
    tags: ['defensible-space', 'zone2', 'clearance'],
    text: 'Any person owning, leasing, controlling, operating or maintaining any building and/or lands in, upon, or adjoining any hazardous fire area shall at all times maintain defensible space around and adjacent to such building by removing and clearing away all combustible material for a distance not less than 100 feet from all portions of the structure. Distances may be increased or decreased by the fire code official based on site specific analysis of local conditions.\nException: Single specimens of trees, ornamental vegetative fuels or cultivated ground cover, such as green grass, ivy, succulents or similar plants used as ground cover, provided that they do not form a means of readily transmitting fire.',
  },
  {
    id: 'mc-322-6-3-1',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.1 (Marin County Code § 16.16.040)',
    title: 'Tree clearance from chimney outlet',
    status: 'current',
    tags: ['chimney', 'tree-limb'],
    text: 'Remove that portion of any tree that extends within 10 feet of the outlet of any chimney or stovepipe.',
  },
  {
    id: 'mc-322-6-3-2',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.2 (Marin County Code § 16.16.040)',
    title: 'Dead material in vegetation adjacent to buildings',
    status: 'current',
    tags: ['dead-vegetation', 'tree-limb'],
    text: 'Maintain any tree, shrub, or other plant adjacent to or overhanging any building free of dead limbs, branches or other combustible material.',
  },
  {
    id: 'mc-322-6-3-3',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.3 (Marin County Code § 16.16.040)',
    title: 'Roof and gutter maintenance',
    status: 'current',
    tags: ['roof-gutter'],
    text: 'Maintain the roof of any structure and roof gutters free of leaves, needles, or other combustible materials.',
  },
  {
    id: 'mc-322-6-3-4',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.4 (Marin County Code § 16.16.040)',
    title: 'Limbing of trees near buildings and roadways',
    status: 'current',
    tags: ['limbing', 'ladder-fuel', 'tree-limb', 'driveway'],
    text: 'Maintain trees within 100 feet of any building or structure, or within 10 feet of any portion of any highway, street, alley, or driveway which is improved or used for vehicle travel, so that leafy foliage, twigs or branches are above 5 feet of the ground.',
  },
  {
    id: 'mc-322-6-3-5',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 322.6.3.5 (Marin County Code § 16.16.040)',
    title: 'Vertical clearance over roof surfaces',
    status: 'current',
    tags: ['tree-limb', 'roof-gutter'],
    text: 'Maintain 5 feet of vertical clearance between roof surfaces and portions of trees overhanging any building or structure.',
  },
  {
    id: 'mc-322-6-2',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code §§ 322.6.2.2–322.6.2.3 (Marin County Code § 16.16.040)',
    title: 'Parcel abatement by parcel size',
    status: 'current',
    tags: ['parcel-abatement', 'grass', 'vacant-land'],
    text: 'Parcels one acre or less (43,560 square feet) shall require abatement of the entire parcel. Parcels over one acre may be required to provide 30-foot fuel breaks along the perimeter of the property line and/or 100 feet from adjacent structures; parcels 10 acres or more shall additionally provide a 30-foot cross break dividing the parcel into approximately 5-acre sections.',
  },
  {
    id: 'mc-4908',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 4908 (added by Marin County Code § 16.16.040)',
    title: 'Fire hazard reduction from roadways',
    status: 'current',
    tags: ['driveway', 'access'],
    text: 'The Fire Code Official is authorized to cause areas within 10 feet on each side of portions of highways, fire apparatus access roads (improved or unimproved), and driveways which are improved, designed, or ordinarily used for vehicular traffic to be cleared of flammable vegetation and other combustible growth. Corrective action, if necessary, shall be the same as the actions required in § 4907.2.',
  },
  {
    id: 'mc-4906-2',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 4906.2 (as amended by Marin County Code § 16.16.040)',
    title: 'Application — where vegetation management is required',
    status: 'current',
    tags: ['applicability'],
    text: 'Buildings and structures in the following areas shall maintain the required hazardous vegetation and fuel management: (1) all unincorporated lands designated by the State Board of Forestry and Fire Protection as State Responsibility Area (SRA), including moderate, high and very-high Fire Hazard Severity Zones; (2) land designated Very-High Fire Hazard Severity Zone by cities and other local agencies; (3) land designated Wildland-Urban Interface Fire Area by cities and other local agencies.',
  },
  {
    id: 'mc-4907-1',
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'Local',
    citation: 'California Fire Code § 4907.1 (as amended by Marin County Code § 16.16.040)',
    title: 'Defensible space — general',
    status: 'current',
    tags: ['defensible-space', 'applicability'],
    text: 'Defensible space will be maintained around all buildings and structures in State Responsibility Area as required in Public Resources Code § 4290 and the SRA Fire Safe Regulations, 14 CCR § 1270. Buildings and structures within the Wildland-Urban Interface Area as designated by the local enforcing agency and within Very-High Fire Hazard Severity Zones of local responsibility areas shall maintain defensible space as outlined in Government Code §§ 51175–51189 and any local ordinance or standard published by the Fire Code Official.',
  },
  {
    id: 'mc-322-7',
    domain: 'vegetation',
    provenance: 'transcribed',
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
    domain: 'vegetation',
    provenance: 'transcribed',
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
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'State',
    citation: 'Government Code §§ 51175–51189 (incl. § 51182)',
    title: 'Defensible space in Very High Fire Hazard Severity Zones (local responsibility area)',
    status: 'current',
    tags: ['defensible-space', 'applicability'],
    text: 'Imposes the defensible-space duties of PRC § 4291 on owners of buildings and structures in Very High Fire Hazard Severity Zones within local responsibility areas. This is the authority Marin County Code § 16.16.040 points to for LRA parcels; cite it rather than PRC § 4291 where the parcel is in an LRA VHFHSZ rather than the SRA.',
  },
  {
    id: 'ccr-1299-03',
    domain: 'vegetation',
    provenance: 'transcribed',
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
    domain: 'vegetation',
    provenance: 'transcribed',
    scope: 'State',
    citation: '14 CCR § 1299.04',
    title: 'Additional clearance',
    status: 'current',
    tags: ['clearance', 'applicability'],
    text: 'A fire expert designated by the Director may require more than 100 feet of defensible space, but cannot require clearance beyond the property line. Further guidance is contained in the Board of Forestry’s General Guidelines for Creating Defensible Space and in the Property Inspection Guide.',
  },
  {
    id: 'zone0',
    domain: 'vegetation',
    provenance: 'transcribed',
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

  // -------------------------------------------------------------------------
  // BUILDING AND FIRE-PROTECTION CODE
  //
  // provenance: 'unverified' on every entry below. Section numbers follow the
  // 2019 CFC (which tracks the 2018 IFC) chapter structure and the
  // requirements are stated as accurately as they were known, but none of this
  // text was transcribed from a primary source. Verify before enforcement.
  // -------------------------------------------------------------------------

  // ---- Fire protection systems: general (CFC ch. 9) ----
  {
    id: 'cfc-901-6',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 901.6',
    title: 'Inspection, testing and maintenance of fire protection systems',
    status: 'current',
    tags: ['fire-protection-system', 'sprinkler', 'alarm', 'extinguisher', 'standpipe', 'maintenance'],
    text: 'Fire detection, alarm and extinguishing systems shall be maintained in an operative condition at all times, and shall be replaced or repaired where defective. Non-required fire protection systems and equipment shall be inspected, tested and maintained or removed. Systems shall be inspected, tested and maintained in accordance with the referenced standards listed in Table 901.6.1.',
  },
  {
    id: 'cfc-901-6-2',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 901.6.2',
    title: 'Records of inspection, testing and maintenance',
    status: 'current',
    tags: ['fire-protection-system', 'records', 'maintenance', 'sprinkler', 'alarm'],
    text: 'Records of all system inspections, tests and maintenance required by the referenced standards shall be maintained on the premises for a minimum of three years and shall be made available to the fire code official on request.',
  },
  {
    id: 'cfc-901-7',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 901.7',
    title: 'Systems out of service',
    status: 'current',
    tags: ['fire-protection-system', 'sprinkler', 'alarm', 'impairment', 'out-of-service'],
    text: 'Where a required fire protection system is out of service, the fire department and the fire code official shall be notified immediately and, where required, the building shall be either evacuated or an approved fire watch shall be provided for all occupants left unprotected by the shutdown until the system is returned to service. Where utilized, fire watches shall be provided with at least one approved means for notification of the fire department.',
  },

  // ---- Automatic sprinkler systems ----
  {
    id: 'cfc-903-5',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 903.5',
    title: 'Testing and maintenance of automatic sprinkler systems',
    status: 'current',
    tags: ['sprinkler', 'maintenance', 'fire-protection-system', 'painted-sprinkler'],
    text: 'Sprinkler systems shall be tested and maintained in accordance with NFPA 25. Where a sprinkler system is found not to be in an operative condition it shall be repaired or replaced.',
  },
  {
    id: 'cfc-903-4',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 903.4',
    title: 'Sprinkler system supervision and alarms',
    status: 'current',
    tags: ['sprinkler', 'alarm', 'monitoring', 'fire-protection-system'],
    text: 'Valves controlling the water supply for automatic sprinkler systems, pumps, tanks, water levels and temperatures, critical air pressures and waterflow switches on all sprinkler systems shall be electrically supervised by a listed fire alarm control unit. Sprinkler waterflow alarms shall be transmitted to an approved central station, remote supervising station or proprietary supervising station.',
  },
  {
    id: 'cfc-903-3-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 903.3.3',
    title: 'Obstructed sprinkler discharge',
    status: 'current',
    tags: ['sprinkler', 'obstruction', 'storage', 'clearance'],
    text: 'The required height of ceiling clearance below sprinklers shall be maintained so that the discharge pattern of the sprinkler is not obstructed. Storage, furnishings, decorations, partitions and equipment shall not obstruct the discharge of a sprinkler.',
  },
  {
    id: 'nfpa13-painting',
    domain: 'building',
    provenance: 'unverified',
    scope: 'Standard',
    citation: 'NFPA 13 (referenced by California Fire Code Table 901.6.1), sprinkler protection and condition',
    title: 'Sprinklers shall not be painted, coated or altered',
    status: 'current',
    tags: ['sprinkler', 'painted-sprinkler', 'maintenance', 'fire-protection-system'],
    text: 'Sprinklers shall not be altered in any respect or have any type of ornamentation, paint or coating applied after shipment from the place of manufacture. Factory-applied paint or coating is applied by the manufacturer as part of the listing; field-applied paint is not. Painted or coated sprinklers, and sprinklers whose heat-responsive element or deflector has been obstructed or loaded, shall be replaced rather than cleaned, because paint insulates the heat-responsive element and delays or prevents operation.',
  },
  {
    id: 'nfpa25-sprinkler-condition',
    domain: 'building',
    provenance: 'unverified',
    scope: 'Standard',
    citation: 'NFPA 25 (referenced by California Fire Code Table 901.6.1), inspection of sprinklers',
    title: 'Sprinkler condition — replacement on inspection',
    status: 'current',
    tags: ['sprinkler', 'painted-sprinkler', 'maintenance', 'fire-protection-system', 'corrosion'],
    text: 'Sprinklers shall be inspected from the floor level annually. Any sprinkler that shows signs of paint, coating, corrosion, physical damage, leakage, loading, or that has been installed in the wrong orientation, shall be replaced. Sprinklers shall not be cleaned of paint or coating in place. A clearance of not less than 18 inches shall be maintained below sprinkler deflectors.',
  },

  // ---- Portable fire extinguishers ----
  {
    id: 'cfc-906-1',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 906.1',
    title: 'Portable fire extinguishers — where required',
    status: 'current',
    tags: ['extinguisher', 'fire-protection-system'],
    text: 'Portable fire extinguishers shall be installed in new and existing Group A, B, E, F, H, I, M, R-1, R-2, R-4 and S occupancies; within 30 feet of commercial cooking equipment and of areas where flammable or combustible liquids are stored, used or dispensed; in areas presenting a special hazard; and where otherwise required by the code.',
  },
  {
    id: 'cfc-906-2',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 906.2',
    title: 'Portable fire extinguishers — general requirements',
    status: 'current',
    tags: ['extinguisher', 'maintenance', 'fire-protection-system', 'records'],
    text: 'Portable fire extinguishers shall be selected, installed and maintained in accordance with NFPA 10 and the following: the extinguisher shall have an approved service tag showing the month and year of the last service and the identity of the servicing agency; extinguishers shall be serviced at intervals not exceeding one year, or when specifically indicated by an inspection; and extinguishers with a gross weight not exceeding 40 pounds shall be installed so that the top is not more than 5 feet above the floor.',
  },
  {
    id: 'cfc-906-6',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 906.6',
    title: 'Extinguishers to be unobstructed and unobscured',
    status: 'current',
    tags: ['extinguisher', 'obstruction', 'signage'],
    text: 'Portable fire extinguishers shall be located in conspicuous places where they will be readily accessible and immediately available in the event of fire. Extinguishers shall not be obstructed or obscured from view. In rooms or areas in which visual obstruction cannot be completely avoided, means shall be provided to indicate the extinguisher location.',
  },

  // ---- Fire alarm and detection ----
  {
    id: 'cfc-907-8',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 907.8',
    title: 'Fire alarm system inspection, testing and maintenance',
    status: 'current',
    tags: ['alarm', 'detector', 'maintenance', 'fire-protection-system', 'records'],
    text: 'Fire alarm, smoke detection, and emergency voice/alarm communication systems and their components shall be inspected, tested and maintained in accordance with NFPA 72, and shall be maintained in an operative condition at all times. Systems shall be tested at least annually. Devices and appliances shall be replaced where defective, and shall not be obstructed, painted or covered.',
  },
  {
    id: 'cfc-907-9',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 907.9',
    title: 'Fire alarm systems out of service',
    status: 'current',
    tags: ['alarm', 'out-of-service', 'impairment'],
    text: 'Where required fire alarm systems are out of service for more than four hours in a 24-hour period, the fire code official shall be notified and the building shall be evacuated or an approved fire watch shall be provided for all occupants left unprotected until the system has been returned to service.',
  },

  // ---- Means of egress (CFC ch. 10) ----
  {
    id: 'cfc-1013-1',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1013.1',
    title: 'Exit signs — where required',
    status: 'current',
    tags: ['exit-sign', 'egress', 'signage'],
    text: 'Exits and exit access doorways shall be marked by an approved exit sign readily visible from any direction of egress travel. Access to exits shall be marked by readily visible exit signs in cases where the exit or the path of egress travel is not immediately visible to the occupants. Intervening means of egress doors within exits shall be marked by exit signs. Exit sign placement shall be such that any point in an exit access corridor or exit passageway is within 100 feet, or the listed viewing distance for the sign, whichever is less, from the nearest visible exit sign.',
  },
  {
    id: 'cfc-1013-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1013.3',
    title: 'Exit sign illumination',
    status: 'current',
    tags: ['exit-sign', 'egress', 'illumination', 'signage'],
    text: 'Exit signs shall be internally or externally illuminated. The face of an exit sign illuminated from an external source shall have an intensity of not less than 5 footcandles. Internally illuminated signs shall provide equivalent luminance and shall be listed for the purpose.',
  },
  {
    id: 'cfc-1013-6-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1013.6.3',
    title: 'Exit sign power source',
    status: 'current',
    tags: ['exit-sign', 'egress', 'illumination', 'emergency-power'],
    text: 'Exit signs shall be illuminated at all times. To ensure continued illumination for a duration of not less than 90 minutes in case of primary power loss, the sign illumination means shall be connected to an emergency power system.',
  },
  {
    id: 'cfc-1008-2',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1008.2',
    title: 'Means of egress illumination level',
    status: 'current',
    tags: ['egress', 'illumination', 'emergency-power'],
    text: 'The means of egress shall be illuminated at all times the building space served by the means of egress is occupied. The means of egress illumination level shall be not less than 1 footcandle at the walking surface.',
  },
  {
    id: 'cfc-1008-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1008.3',
    title: 'Emergency power for means of egress illumination',
    status: 'current',
    tags: ['egress', 'illumination', 'emergency-power'],
    text: 'The power supply for means of egress illumination shall normally be provided by the premises electrical supply. In the event of power supply failure, an emergency electrical system shall automatically illuminate aisles, corridors, exit stairways, exit passageways and exit discharge for a duration of not less than 90 minutes.',
  },
  {
    id: 'cfc-1031-2',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1031.2',
    title: 'Reliability of the means of egress',
    status: 'current',
    tags: ['egress', 'obstruction', 'exit-door', 'maintenance'],
    text: 'Required exit accesses, exits and exit discharges shall be continuously maintained free from obstructions or impediments to full instant use in the case of fire or other emergency where the areas served by such exits are occupied. Security devices affecting means of egress shall be subject to approval of the fire code official.',
  },
  {
    id: 'cfc-1031-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1031.3',
    title: 'Maintenance of egress illumination, signs and hardware',
    status: 'current',
    tags: ['egress', 'exit-sign', 'illumination', 'maintenance', 'exit-door'],
    text: 'Illumination, exit signs, guards, egress doors, door hardware, panic hardware and emergency lighting serving the means of egress shall be maintained in an operable condition. Exit signs and emergency lighting shall be tested in accordance with the requirements of the fire code official and shall be repaired or replaced where found defective.',
  },
  {
    id: 'cfc-1010-1-9',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1010.1.9',
    title: 'Egress door operations — locks and latches',
    status: 'current',
    tags: ['exit-door', 'egress', 'lock', 'obstruction'],
    text: 'Egress doors shall be readily openable from the egress side without the use of a key or special knowledge or effort. The unlatching of any door or leaf shall not require more than one operation. Manually operated flush bolts and surface bolts are not permitted on means of egress doors.',
  },
  {
    id: 'cfc-1010-1-10',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1010.1.10',
    title: 'Panic and fire exit hardware',
    status: 'current',
    tags: ['exit-door', 'egress', 'lock', 'panic-hardware'],
    text: 'Doors serving a Group A or E occupancy with an occupant load of 50 or more, and doors serving high-hazard occupancies, shall not be provided with a latch or lock unless it is panic hardware or fire exit hardware. The actuating portion of the releasing device shall extend at least one-half of the door leaf width, and shall release when a force of not more than 15 pounds is applied in the direction of egress travel.',
  },
  {
    id: 'cfc-1004-1',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 1004.1',
    title: 'Occupant load — overcrowding',
    status: 'current',
    tags: ['occupant-load', 'egress', 'overcrowding'],
    text: 'The number of occupants shall not exceed the occupant load determined in accordance with this section. Overcrowding or admittance of any person beyond the approved occupant load is prohibited, and the fire code official may cause the event or occupancy to be stopped until the condition is corrected. Where required, the approved occupant load shall be posted in a conspicuous place near the main exit.',
  },

  // ---- Fire-resistance-rated construction and opening protectives ----
  {
    id: 'cfc-703-1',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 703.1',
    title: 'Maintenance of fire-resistance-rated construction',
    status: 'current',
    tags: ['fire-rated', 'fire-door', 'penetration', 'maintenance'],
    text: 'The required fire-resistance rating of fire-resistance-rated construction, including walls, firestops, shaft enclosures, partitions, smoke barriers, floors, fire-resistive coatings and sprayed fire-resistant materials applied to structural members and joint systems, shall be maintained. Such elements shall be properly repaired, restored or replaced where damaged, altered, breached or penetrated.',
  },
  {
    id: 'cfc-705-2',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 705.2',
    title: 'Fire doors and smoke barrier doors — obstruction and closing',
    status: 'current',
    tags: ['fire-door', 'fire-rated', 'obstruction', 'maintenance', 'exit-door'],
    text: 'Fire doors and smoke barrier doors shall not be blocked or obstructed, or otherwise made inoperable. Hold-open devices and automatic door closers, where provided, shall be maintained functional. Openings protected by fire doors shall not have signs, curtains, drapes, decorations or similar objects installed that would interfere with the operation of the door. Doors shall not be wedged, tied or otherwise held open.',
  },

  // ---- Premises identification and access ----
  {
    id: 'cfc-505-1',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 505.1',
    title: 'Address identification',
    status: 'current',
    tags: ['address', 'signage', 'access'],
    text: 'New and existing buildings shall be provided with approved address identification. The address identification shall be legible and placed in a position that is visible from the street or road fronting the property. Address identification characters shall contrast with their background. Numbers shall be a minimum of 4 inches high with a minimum stroke width of 0.5 inch. Where access is by means of a private road and the building address cannot be viewed from the public way, a monument, pole or other approved sign or means shall be used to identify the structure.',
  },
  {
    id: 'cfc-912-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 912.3',
    title: 'Fire department connections — access and obstruction',
    status: 'current',
    tags: ['fdc', 'sprinkler', 'standpipe', 'obstruction', 'access'],
    text: 'Immediate access to fire department connections shall be maintained at all times and without obstruction by fences, bushes, trees, walls or any other fixed or moveable object. A working space of not less than 36 inches in width, 36 inches in depth and 78 inches in height shall be provided and maintained in front of and to the sides of wall-mounted fire department connections.',
  },
  {
    id: 'cfc-507-5-4',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 507.5.4',
    title: 'Obstruction of fire hydrants and water supply equipment',
    status: 'current',
    tags: ['hydrant', 'obstruction', 'access'],
    text: 'Unobstructed access to fire hydrants shall be maintained at all times. A 3-foot clear space shall be maintained around the circumference of fire hydrants. The fire code official shall not be deterred or hindered from gaining immediate access to fire protection equipment or fire hydrants.',
  },

  // ---- Housekeeping, storage and electrical ----
  {
    id: 'cfc-304-1',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 304.1',
    title: 'Waste accumulation prohibited',
    status: 'current',
    tags: ['housekeeping', 'storage', 'combustible-waste'],
    text: 'Combustible waste material creating a fire hazard shall not be allowed to accumulate in buildings or structures or upon premises. Accumulations of wastepaper, wood, hay, straw, weeds, litter or combustible or flammable waste or rubbish shall not be permitted to remain on a roof or in any court, yard, vacant lot, alley, parking lot, open space, or beneath a grandstand, bleacher, pier, wharf, manufactured home, recreational vehicle or other similar structure.',
  },
  {
    id: 'cfc-315-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 315.3',
    title: 'Indoor storage — orderly piles and required clearances',
    status: 'current',
    tags: ['storage', 'housekeeping', 'sprinkler', 'clearance', 'obstruction'],
    text: 'Storage shall be maintained 2 feet or more below the ceiling in non-sprinklered areas of buildings, or 18 inches or more below sprinkler head deflectors in sprinklered areas of buildings. Storage shall be maintained orderly, in stable piles, and shall not obstruct the means of egress, exits, exit enclosures, equipment access or fire protection equipment. Clearance from heating appliances and electrical panels shall be maintained.',
  },
  {
    id: 'cfc-605-4',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 605.4',
    title: 'Extension cords and multiplug adapters',
    status: 'current',
    tags: ['electrical', 'housekeeping'],
    text: 'Extension cords and flexible cords shall not be a substitute for permanent wiring. Extension cords shall not be affixed to structures, extended through walls, ceilings, floors, under doors or floor coverings, or be subject to environmental or physical damage. Extension cords shall be plugged directly into an approved receptacle, power tap or multiplug extension cord and, except for approved multiplug extension cords, shall serve only one portable appliance. Relocatable power taps shall be directly connected to a permanently installed receptacle.',
  },
  {
    id: 'cfc-605-3',
    domain: 'building',
    provenance: 'unverified',
    scope: 'State',
    citation: 'California Fire Code § 605.3',
    title: 'Working space and clearance at electrical equipment',
    status: 'current',
    tags: ['electrical', 'clearance', 'obstruction', 'storage'],
    text: 'A working space of not less than 30 inches in width, 36 inches in depth and 78 inches in height shall be provided in front of electrical service equipment. Where the electrical service equipment is wider than 30 inches, the working space shall be not less than the width of the equipment. Storage of materials shall not be located within the designated working space.',
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

// The building-code equivalents. Same contract: these are the only numbers the
// model may write for a building finding. Same caveat as the corpus — these
// were not transcribed from a primary source, so verify before enforcement.
const buildingTables = {
  sprinklers: {
    citation: 'California Fire Code §§ 903.3.3, 315.3; NFPA 13 and NFPA 25 as referenced by Table 901.6.1',
    clearance: 'Minimum 18 in. clear below sprinkler deflectors; storage no closer than 18 in. below deflectors in sprinklered areas, and no closer than 24 in. below the ceiling in non-sprinklered areas.',
    condition: 'A sprinkler showing paint, coating, corrosion, loading, leakage or physical damage is replaced, not cleaned. Field-applied paint on a sprinkler is a defect in itself, regardless of how the system tests.',
    testing: 'Sprinkler systems inspected, tested and maintained per NFPA 25; records kept on the premises a minimum of 3 years.',
  },
  extinguishers: {
    citation: 'California Fire Code §§ 906.2, 906.9; NFPA 10',
    service: 'Serviced at intervals not exceeding 1 year, with an approved service tag showing month, year and servicing agency.',
    mounting: 'Gross weight 40 lb or less: top not more than 5 ft above the floor. Over 40 lb: top not more than 3.5 ft above the floor. In both cases the bottom is at least 4 in. above the floor.',
    travel: 'Maximum travel distance to a Class A extinguisher is 75 ft. Within 30 ft of commercial cooking equipment and of flammable or combustible liquid storage.',
  },
  egress: {
    citation: 'California Fire Code §§ 1008.2, 1008.3, 1013.1, 1013.3, 1013.6.3, 1010.1.9',
    illumination: 'Means of egress illuminated to not less than 1 footcandle at the walking surface whenever the space is occupied.',
    emergencyPower: 'Egress illumination and exit sign illumination both backed by emergency power for not less than 90 minutes.',
    exitSignSpacing: 'No point in an exit access corridor or exit passageway more than 100 ft — or the sign’s listed viewing distance, whichever is less — from the nearest visible exit sign.',
    exitSignIllumination: 'Externally illuminated exit sign face: not less than 5 footcandles.',
    doorOperation: 'Unlatching an egress door requires not more than one operation, with no key or special knowledge. Panic hardware releases at not more than 15 lb of force in the direction of travel.',
  },
  access: {
    citation: 'California Fire Code §§ 505.1, 507.5.4, 912.3, 605.3',
    address: 'Address numbers not less than 4 in. high with a stroke width of not less than 0.5 in., contrasting with their background, visible from the street fronting the property.',
    hydrant: '3 ft clear space maintained around the circumference of a fire hydrant.',
    fdc: 'Fire department connection working space not less than 36 in. wide, 36 in. deep and 78 in. high, kept clear at all times.',
    electrical: 'Working space in front of electrical service equipment not less than 30 in. wide, 36 in. deep and 78 in. high, with no storage inside it.',
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
  // Building and fire-protection violations do not run through the vegetation
  // abatement machinery above: there is no 10-day Notice to Abate, no tax lien.
  // NOT TRANSCRIBED — verify against the adopted administrative chapter before
  // any of this goes on a notice.
  buildingViolation: {
    citation: 'California Fire Code ch. 1 Division II (administration), as adopted by Marin County Code ch. 16.16',
    text: 'A condition in violation of the fire code is cited in a written notice of violation identifying the section violated, the condition found, and a date by which the condition must be corrected. The correction period is set by the fire code official according to the hazard: an immediate life-safety hazard — a blocked or locked exit, a fire protection system out of service, overcrowding — is corrected before the premises may continue to be occupied, and may be accompanied by an order to stop use or vacate. Lesser violations are given a stated correction period followed by reinspection. Failure to correct by the stated date is grounds for reinspection fees, administrative citation, and referral for prosecution. Appeals of an order, decision or determination of the fire code official are heard by the Appeal Officer.',
    unverified: true,
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

  // ---- building and fire-protection ----
  sprinkler: /sprinkler|sprink|deflector|riser|wet pipe|dry pipe|head(?:s)? (?:painted|blocked)/i,
  'painted-sprinkler': /paint|painted|coated|coating|spray(?:ed)?|ornament/i,
  alarm: /alarm|smoke detector|detector|pull station|horn|strobe|annunciator|notification appliance/i,
  detector: /detector|smoke head|heat detector|duct detector/i,
  extinguisher: /extinguisher|fire ?ext|abc unit|co2 unit|service tag/i,
  standpipe: /standpipe|hose (?:valve|cabinet)|fire hose/i,
  'exit-sign': /exit sign|exit light|egress sign|illuminated sign/i,
  egress: /egress|exit|corridor|aisle|stairwell|stairway|exit way|path of travel|hallway/i,
  'exit-door': /exit door|egress door|door (?:is )?(?:locked|blocked|chained|wedged)|chained|padlock|dead ?bolt/i,
  lock: /lock|locked|chain|padlock|bolt|secured shut/i,
  'panic-hardware': /panic (?:hardware|bar)|crash bar|fire exit hardware/i,
  illumination: /illuminat|lighting|light (?:is )?out|footcandle|dark|emergency light/i,
  'emergency-power': /emergency (?:power|light|generator)|battery|backup power|90 min/i,
  obstruction: /block|blocked|obstruct|blocking|stored in front|in the way|impede/i,
  'fire-door': /fire door|smoke (?:door|barrier)|self.clos|closer|hold.open|wedge/i,
  'fire-rated': /fire.rated|rated (?:wall|assembly|ceiling)|firestop|penetration|rated assembly/i,
  penetration: /penetration|hole|unsealed|conduit through|open (?:wall|ceiling)/i,
  electrical: /electrical|panel|breaker|extension cord|power ?(?:strip|tap)|outlet|wiring|junction box/i,
  storage: /storage|stored|stacked|boxes|pallet|clutter|piled/i,
  housekeeping: /housekeep|rubbish|trash|waste|debris indoors|combustible waste|grease/i,
  'combustible-waste': /rubbish|trash|waste|cardboard|wastepaper/i,
  address: /address|house number|unit number|numbers (?:are )?(?:missing|faded)|signage at street/i,
  hydrant: /hydrant|fdc|fire department connection/i,
  fdc: /fdc|fire department connection|siamese/i,
  'occupant-load': /occupan(?:t|cy) load|overcrowd|capacity|too many people/i,
  overcrowding: /overcrowd|over capacity|exceeds capacity/i,
  maintenance: /maintain|maintenance|inoperative|out of service|not working|defective|broken|expired|overdue|past due|tag/i,
  'out-of-service': /out of service|shut ?off|disabled|impair|turned off|valve closed/i,
  impairment: /impair|out of service|shut ?down|disabled/i,
  records: /record|log|tag|certificate|last (?:service|test|inspect)|documentation/i,
  signage: /sign|signage|placard|posted|marking/i,
  clearance: /clearance|clear space|too close|within \d+ ?(?:in|ft)|18 ?in|36 ?in/i,
  access: /access|blocked access|driveway|approach|reach the/i,
  'fire-protection-system': /sprinkler|alarm|standpipe|extinguisher|fire pump|suppression|hood system|fire protection/i,
  corrosion: /corrod|corrosion|rust|rusted/i,
};

// Which half of the corpus a note is about. A note about a painted sprinkler
// should not drag in the defensible-space backbone, and a note about an
// oleander hedge should not drag in means-of-egress. Where a note touches both
// — or neither, so the guess would be arbitrary — both are sent.
const DOMAIN_HINTS = {
  building: /sprinkler|alarm|detector|extinguisher|standpipe|exit|egress|corridor|aisle|stair|door|lock|chain|padlock|panic|illuminat|emergency light|footcandle|fire ?door|firestop|rated (?:wall|assembly)|penetration|electrical|panel|breaker|extension cord|power ?(?:strip|tap)|outlet|wiring|storage|stored|stacked|pallet|clutter|rubbish|trash|waste|cardboard|address|house number|hydrant|fdc|fire department connection|occupan(?:t|cy) load|overcrowd|riser|deflector|service tag|out of service|hood|suppression|fire pump|ceiling|wall|room|office|kitchen|basement|garage|stairwell|hallway/i,
  vegetation: /vegetat|hedge|shrub|tree|branch|limb|canopy|brush|grass|weed|ivy|oleander|juniper|broom|ground ?cover|litter|duff|needle|leaf|leaves|gutter|roof|chimney|defensible|zone ?[012]|firewood|wood ?pile|propane|lot|parcel|slope|clearance to (?:bare )?soil|mow|prune|trim|limbing/i,
};

// Always sent, per domain: the applicability backbone. Without these the model
// has no authority to hang a finding on. Keyed by domain so a building note is
// not grounded in defensible space, or the reverse.
const ALWAYS = {
  vegetation: ['mc-4907-2', 'mc-322-6-3', 'prc-4291', 'ccr-1299-03', 'mc-4906-2'],
  building: ['cfc-901-6', 'cfc-1031-2', 'cfc-1031-3'],
};

function tagsFor(text) {
  const found = new Set();
  for (const [tag, re] of Object.entries(TAG_HINTS)) if (re.test(text || '')) found.add(tag);
  return [...found];
}

/**
 * Which halves of the corpus a note touches. Both when it touches both, and
 * both when it touches neither — an arbitrary guess is worse than a wider
 * prompt.
 * @param {string} text
 * @returns {Array<'vegetation'|'building'>}
 */
function domainsFor(text) {
  const hit = Object.entries(DOMAIN_HINTS).filter(([, re]) => re.test(text || '')).map(([d]) => d);
  return hit.length ? hit : ['vegetation', 'building'];
}

/**
 * Pick the codes relevant to some free text (the concatenated inspector notes).
 * @param {string} text
 * @param {{mode?: 'all'|'relevant', domains?: Array<string>}} opts
 *   'all' sends the whole corpus; `domains` overrides the sniffed domains.
 * @returns {Array} code entries
 */
function select(text, opts = {}) {
  if ((opts.mode || 'relevant') === 'all') return codes.slice();
  const domains = opts.domains && opts.domains.length ? opts.domains : domainsFor(text);
  const tags = new Set(tagsFor(text));
  const always = new Set(domains.flatMap(d => ALWAYS[d] || []));
  return codes.filter(c => domains.includes(c.domain) && (always.has(c.id) || c.tags.some(t => tags.has(t))));
}

/** Render code entries as the grounding block that goes into the prompt. */
function pack(list) {
  return list.map(c => {
    const flag = c.status === 'current' ? '' : `\n  STATUS: ${c.status} — may be described as upcoming, must NOT be cited as a present violation.`;
    const src = c.provenance === 'unverified'
      ? '\n  SOURCE: not transcribed from a primary source. Cite it normally; the app flags it for verification.'
      : '';
    // The citation is labelled and quoted on its own line because the model is
    // asked to copy it verbatim: when it ran together with the title, the model
    // helpfully copied both and the citation came back with the title appended.
    return [
      `[${c.id}] ${c.scope}${flag}${src}`,
      `  CITATION (copy this string exactly, nothing appended): "${c.citation}"`,
      `  TITLE: ${c.title}`,
      `  ${c.text.replace(/\n/g, '\n  ')}`,
    ].join('\n');
  }).join('\n\n');
}

/** The ids of the codes in `list` whose text was never source-verified. */
function unsourced(list) {
  return list.filter(c => c.provenance === 'unverified').map(c => c.citation);
}

/**
 * Render the numeric standards block for the domains in play. Sending the
 * defensible-space spacing tables alongside a painted-sprinkler finding is how
 * a model ends up quoting "3 x the height of the lower fuel" at a sprinkler.
 * @param {Array<string>} [domains]  defaults to both
 */
function packTables(domains) {
  const want = domains && domains.length ? domains : ['vegetation', 'building'];
  const out = [];
  if (want.includes('vegetation')) out.push(packVegetationTables());
  if (want.includes('building')) out.push(packBuildingTables());
  return out.join('\n\n');
}

function packBuildingTables() {
  const b = buildingTables;
  const block = (head, obj) => [`${head} (${obj.citation})`]
    .concat(Object.entries(obj).filter(([k]) => k !== 'citation').map(([, v]) => `  ${v}`))
    .join('\n');
  return [
    block('SPRINKLERS AND SPRINKLER CLEARANCE', b.sprinklers),
    '',
    block('PORTABLE FIRE EXTINGUISHERS', b.extinguishers),
    '',
    block('MEANS OF EGRESS, EXIT SIGNS AND DOORS', b.egress),
    '',
    block('PREMISES IDENTIFICATION, HYDRANTS, FDC AND ELECTRICAL', b.access),
  ].join('\n');
}

function packVegetationTables() {
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

module.exports = {
  meta, codes, tables, buildingTables, procedure,
  select, pack, packTables, packProcedure, tagsFor, domainsFor, unsourced,
};
