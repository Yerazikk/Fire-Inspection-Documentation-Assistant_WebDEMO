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
//   - `provenance` is 'transcribed' when the text was read off a source,
//     'unverified' when it states the requirement correctly as far as the
//     author knew but was NOT transcribed. Unverified entries are citable
//     — otherwise the building-code half of the app could not work — but they
//     are reported in `doc.audit.unsourcedCitations` so the UI can caveat them,
//     and every one of them is a task: replace with transcribed text.
//   - `sourceDoc` keys into `meta.sourceDocs` and says WHICH source. This
//     matters more than it looks: provenance alone cannot tell you that an
//     entry was faithfully transcribed from an ordinance that has since been
//     repealed. `kind: 'primary'` is the signed or publishing authority;
//     anything else is a mirror and is reported in
//     `doc.audit.mirroredCitations`. When a source document goes out of force,
//     every entry pointing at it is suspect — see `meta.superseded`.
//   - `edition` is the code edition the entry belongs to, in words. It is
//     emitted next to every citation (see `pack`) and must never be inferred:
//     if the edition is not known, the string says so.
//   - `sourceNote` records a defect in the source — a typo, a bad internal
//     cross-reference. Transcribe the text as found and note it here; do not
//     silently correct an adopted code.

const meta = {
  jurisdiction: 'Marin County, California (unincorporated) — Marin County Fire Department',
  localChapter: 'Marin County Code ch. 16.16, repealed and re-established by Ordinance No. 3837, § III (2025). Fire Code amendments at § 16.16.040; Wildland-Urban Interface Code amendments at § 16.16.060; hearings and appeals at § 16.16.065; penalties at § 16.16.070.',
  ordinance: 'Marin County Ordinance No. 3837, § III (2025)',
  effective: '2026-01-01',
  edition: '2025 California Fire Code (based on the 2024 International Fire Code) and 2025 California Wildland-Urban Interface Code (based on the 2024 IWUIC), as adopted and amended by Marin County Code ch. 16.16 (Ord. No. 3837), effective 1 January 2026',
  editionCaveat: 'Marin County adopted Ordinance No. 3837 on 9 December 2025, repealing the former ch. 16.16 and adopting the 2025 California Fire Code and 2025 California Wildland-Urban Interface Code effective 1 January 2026. Inspections conducted before that date were governed by Ordinance No. 3775 (adopted 15 November 2022) under the prior edition and the prior section numbering; a notice written on a pre-2026 inspection must cite the edition that applied at the time.',

  // What Ord. 3837 did to the numbering this corpus used to carry. Kept because
  // the app holds inspection history predating 2026-01-01, and because a model
  // trained on the older code will reach for the old numbers.
  superseded: {
    note: 'Ord. 3837 moved Exterior Fire Hazard Control from CFC § 322 to CFC § 325, and deleted the CFC ch. 49 amendments: those WUI duties are now in the Wildland-Urban Interface Code at §§ 604.6–604.7 (MCC § 16.16.060). None of the left-hand citations below exist in the code now in force — they are listed so they can be recognised, never cited.',
    map: {
      'CFC § 322.6.2.2–322.6.2.3': 'CFC § 325.6.2.2–325.6.2.3',
      'CFC § 322.6.3': 'CFC § 325.6.3',
      'CFC § 322.6.3.1–322.6.3.5': 'CFC § 325.6.3.1–325.6.3.5',
      'CFC § 322.7–322.8': 'CFC § 325.7–325.8',
      'CFC § 322.9.1': 'CFC § 325.9.1',
      'CFC § 322.9.3': 'CFC § 325.9.3 (and § 325.9.3.1, exigent circumstances)',
      'CFC § 322.9.4': 'CFC § 325.9.4',
      'CFC § 322.10': 'CFC § 325.10',
      'CFC § 4906.2': 'no direct successor located in Ord. 3837 — applicability now rests on CFC § 325.6, GC §§ 51175–51189 and PRC § 4291',
      'CFC § 4907.1': 'no direct successor located in Ord. 3837 — see CFC § 325.6 and WUI Code § 604.6',
      'CFC § 4907.2': 'WUI Code § 604.6 (substantively changed: 30 ft → 100 ft, max 150 ft → 200 ft)',
      'CFC § 4908': 'WUI Code § 604.7, and CFC § 325.6.1 for street clearance',
      'MCC § 16.16.055': 'MCC § 16.16.065 (hearings and appeals)',
      'MCC § 16.16.060 (penalties)': 'MCC § 16.16.070 (penalties); § 16.16.060 is now the WUI Code amendments / authority to arrest',

      // Building corpus: nine numbers that were written against the 2019 CFC
      // and do not mean what they used to in the 2025 edition. Several are not
      // merely renumbered — the old number now addresses a different subject,
      // which is worse than a dead reference.
      'CFC § 901.6.2 (records)': 'CFC § 901.6.3 (§ 901.6.2 is now Integrated Testing)',
      'CFC § 907.9 (alarms out of service)': 'CFC § 901.7 (any system out of service); § 907.9 is now Where Required in Existing Buildings',
      'CFC § 1031.2 (egress reliability)': 'CFC § 1032.2 (§ 1031 is now Emergency Escape and Rescue Openings)',
      'CFC § 1031.3 (egress maintenance)': 'CFC §§ 1032.4, 1032.10',
      'CFC § 1010.1.9 (door operations)': 'CFC §§ 1010.2, 1010.2.1, 1010.2.4',
      'CFC § 1010.1.10 (panic hardware)': 'CFC § 1010.2.8',
      'CFC § 912.3 (FDC access)': 'CFC §§ 912.4, 912.4.2 (§ 912.3 is now Fire Hose Threads)',
      'CFC § 605.3 (electrical working space)': 'CFC § 603.4 (§ 605.3 is now Chimneys and Vents)',
      'CFC § 605.4 (extension cords)': 'CFC § 603.6 (§ 605.4 is now Fuel Oil Storage Systems)',
    },
  },

  // A defect in the source, recorded rather than guessed at.
  localSectionAmbiguity: 'The codified chapter numbers two consecutive but different sections "16.16.060": the amendments to the 2024 IWUIC, and "Authority to arrest and issue citations". The WUI Code citations in this file use § 16.16.060 as the source prints it. Confirm the correct subsection against the signed ordinance before an enforceable notice. Separately, CFC § 325.10 and MCC § 16.16.070(c) both cross-reference "§ 16.16.055" for the appeal process, but the hearings and appeals procedure is codified at § 16.16.065; § 16.16.065 is treated as operative here.',

  retrieved: '2026-11-07',

  // Where each entry's text came from. `provenance` says whether anyone read a
  // source at all; `sourceDoc` says which, and `kind` says how far that source
  // is from the signed instrument. Only 'primary' is unflagged in the UI.
  sourceDocs: {
    'mcc-16.16-ord3837': {
      title: 'Marin County Code ch. 16.16 as re-established by Ordinance No. 3837, § III (2025)',
      where: 'gocodebook.com — "Marin County Municipal Code Ch. 16.16", text as of 2026-10-04',
      kind: 'mirror',
      read: '2026-11-07',
      note: 'Municipal-code mirror, not the signed ordinance. Operative text transcribed verbatim, including the typographical and cross-reference errors noted on individual entries. Confirm against the signed ordinance on file with the Marin County Fire Marshal before an enforceable notice.',
    },
    'cfc-2025-upcodes': {
      title: '2025 California Fire Code (California Code of Regulations, Title 24, Part 9), as adopted by MCC § 16.16.040',
      where: 'up.codes/viewer/california/ca-fire-code-2025 — chapters 3, 5, 6, 7, 9 and 10',
      kind: 'mirror',
      read: '2026-11-08',
      note: 'Code-viewer mirror, not the Building Standards Commission publication. Operative text transcribed verbatim, section by section, including the bracketed California Code of Regulations Title 19 passages the code itself prints. Verifying against this edition corrected nine section numbers that had been written against the 2019 CFC — see meta.superseded.map. Confirm against the BSC publication of Title 24 Part 9 before an enforceable notice.',
    },
    'prc-4291': { title: 'Public Resources Code § 4291', where: 'codes.findlaw.com', kind: 'mirror', read: '2026-11-06' },
    'ccr-1299': { title: 'Cal. Code Regs. tit. 14 §§ 1299.02–1299.04', where: 'law.cornell.edu', kind: 'mirror', read: '2026-11-06' },
    'calfire-pig': { title: 'CAL FIRE Office of the State Fire Marshal, 2023 Property Inspection Guide', where: 'fire.ca.gov', kind: 'primary', read: '2026-11-06' },
    'bof-zone0': { title: 'California Board of Forestry and Fire Protection Zone 0 rulemaking, adopted 2026-08-19', where: 'bof.fire.ca.gov', kind: 'primary', read: '2026-11-06' },
    'gc-51175': { title: 'Government Code §§ 51175–51189', where: 'leginfo.legislature.ca.gov', kind: 'mirror', read: '2026-11-06' },
  },

  // The building and fire-protection half of this corpus is NOT transcribed.
  // Section numbers and requirements were stated to the best of the author's
  // knowledge against the chapter structure of the model code; the operative
  // text was not read off any source. Every such entry is provenance:
  // 'unverified'. Ord. 3837 moves the statewide baseline to the 2025 CFC /
  // 2024 IFC, so these need re-checking against that edition, not merely
  // relabelling.
  provenanceCaveat: 'Every entry in this file except the two NFPA standards was transcribed verbatim from the source named on it (meta.sourceDocs). All of those sources are mirrors rather than signed or official publications, so each citation is reported in doc.audit.mirroredCitations and flagged for confirmation: local sections against the signed Ordinance No. 3837 on file with the Marin County Fire Marshal, state fire code sections against the Building Standards Commission publication of Title 24 Part 9. NFPA 13 and NFPA 25 remain untranscribed and are reported in doc.audit.unsourcedCitations.',
  sources: [
    'Marin County Code ch. 16.16 as re-established by Ordinance No. 3837, § III (2025), effective 2026-01-01 — transcribed verbatim from the gocodebook.com municipal-code mirror, text as of 2026-10-04',
    'Cal. Code Regs. tit. 14 §§ 1299.02–1299.04 (law.cornell.edu)',
    'Public Resources Code § 4291 (codes.findlaw.com)',
    'Government Code §§ 51175–51189 (leginfo.legislature.ca.gov)',
    'CAL FIRE Office of the State Fire Marshal, 2023 Property Inspection Guide',
    'California Board of Forestry and Fire Protection Zone 0 rulemaking, adopted 2026-08-19',
    'Building / fire-protection sections (2025 CFC chs. 3, 5, 6, 7, 9, 10; NFPA 10, 13, 25, 72): NOT TRANSCRIBED — see provenanceCaveat and the provenance flag on each entry.',
  ],
};

// ---------------------------------------------------------------------------
// The codes themselves.
// ---------------------------------------------------------------------------

const codes = [
  // ---- Local: Marin County Code ch. 16.16 (Ord. 3837), amending CFC ch. 3 ----
  //
  // Ord. 3837 moved Exterior Fire Hazard Control from CFC § 322 to CFC § 325
  // and deleted the ch. 49 amendments entirely: the WUI vegetation duties that
  // were CFC §§ 4906.2, 4907.1, 4907.2 and 4908 now live in the Wildland-Urban
  // Interface Code at §§ 604.6 and 604.7 (MCC § 16.16.060). See meta.superseded.
  {
    id: 'mc-325-6',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6 (added by Marin County Code § 16.16.040)',
    title: 'General abatement requirements',
    status: 'current',
    tags: ['defensible-space', 'applicability', 'parcel-abatement'],
    text: 'The provisions of this section shall govern the abatement of combustible material creating a fire hazard upon premises (reference Government Code 51175-51189 and Public Resources Code 4291). County Fire shall develop minimum abatement standards for land in residential, business, industrial areas, or land which is unused or vacant, in rural or rural residential areas, or regardless of the area in which the property is located. Such standards shall be approved by the Board of Supervisors and may be modified periodically as circumstances dictate.',
  },
  {
    id: 'mc-325-3',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code §§ 325.3–325.3.2 (added by Marin County Code § 16.16.040)',
    title: 'Public nuisance — weeds, dead trees and rubbish; seasonal and recurrent',
    status: 'current',
    tags: ['parcel-abatement', 'dead-vegetation', 'grass', 'combustible-waste', 'housekeeping'],
    // Matters procedurally: a nuisance already declared seasonal and recurrent
    // is abated every year with no further hearing, and § 325.9.2 notice for it
    // is a post card with no hearing at all. See procedure.seasonalNotice.
    text: [
      '325.3 Public nuisance. The Board of Supervisors, Fire Chief or his/her designee may declare that all hazardous fire areas, including any combustible materials and dead trees, upon private property or streets in this jurisdiction and all rubbish on private property or streets in this jurisdiction are public nuisances. Such weed nuisance is seasonal and recurrent.',
      '325.3.1 Weeds and rubbish. The Board hereby declares that all dead trees or weeds growing upon private property or streets in this jurisdiction and all rubbish on private property or streets in this jurisdiction are public nuisances. Such weed nuisance is seasonal and recurrent.',
      '325.3.2 Seasonal and recurrent nuisance. If the nuisance is seasonal and recurrent, the Board of Supervisors shall so declare. Thereafter, such seasonable and recurring weeds shall be abated every year without any further hearing.',
    ].join('\n'),
  },
  {
    id: 'mc-325-5-2',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code §§ 325.5.1–325.5.2 (added by Marin County Code § 16.16.040)',
    title: 'Abatement of hazard — parcels to be maintained free of hazardous vegetation',
    status: 'current',
    tags: ['parcel-abatement', 'dead-vegetation', 'defensible-space'],
    text: '325.5.1 Weeds, dead trees and rubbish to be destroyed or removed. Parcels are to be maintained free of hazardous vegetation and rubbish.\n325.5.2 Prohibition. No person who has any ownership or possessory interest in or control of a parcel of land shall allow to exist thereon any hazardous rubbish or weeds, trees, or other vegetation, which constitutes a fire hazard.',
  },
  {
    id: 'mc-325-6-1',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.1 (added by Marin County Code § 16.16.040)',
    title: 'Clearance of brush or vegetative growth from street',
    status: 'current',
    tags: ['driveway', 'access', 'clearance'],
    text: 'The fire code official is authorized to require, within 10 feet on each side and 15 feet in height of fire apparatus roads and driveways, to be abated of flammable vegetation and other combustible growth.\nException: Single specimens of trees, ornamental vegetative fuels or cultivated ground cover, such as green grass, ivy succulents or similar plants used a ground cover, provided that they do not form a means of readily transmitting fire and not lower than 15 feet vertical clearance in height from the roadway surface.',
  },
  {
    id: 'mc-325-6-2',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code §§ 325.6.2–325.6.2.3 (added by Marin County Code § 16.16.040)',
    title: 'Clearance from parcels — abatement by parcel size',
    status: 'current',
    tags: ['parcel-abatement', 'grass', 'vacant-land', 'dead-vegetation'],
    // The source gives one acre as "43,530 square feet" in 325.6.2.2 and
    // "43,560 square feet" in 325.6.2.3. 43,560 is the correct figure; the
    // discrepancy is in the adopted text and is transcribed as found.
    sourceNote: 'The adopted text states 43,530 sq ft in § 325.6.2.2 and 43,560 sq ft in § 325.6.2.3 for the same one-acre threshold. Transcribed as found; do not silently correct on a notice.',
    text: [
      '325.6.2 Clearance of brush, vegetative growth and combustible material from parcels. All parcels declared a public nuisance by the Board of Supervisors shall be cleared entirely of combustible material. If the fire code official determines this impractical, the provisions of Section 325.6.2 may be used.',
      '325.6.2.1 Remove from parcel all dead trees vegetative growth and rubbish that are deemed a fire hazard.',
      '325.6.2.2 Parcels one acre or less (43,530 square feet) shall require abatement of the entire parcel.',
      '325.6.2.3 Parcels over one acre (43,560 square feet) may be required to comply with the following requirements:',
      '  1. Parcels shall provide 30-foot fuel breaks along the perimeter of the property line, and/or 100-feet from adjacent structures.',
      '  2. In addition to the above provisions (Item 1) parcels 10 acres or more shall provide a 30-foot cross break to divide the parcel into approximately 5-acre sections.',
    ].join('\n'),
  },
  {
    id: 'mc-325-6-3',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.3 (added by Marin County Code § 16.16.040)',
    title: 'Clearance of brush or vegetative growth from structures',
    status: 'current',
    tags: ['defensible-space', 'zone2', 'clearance'],
    text: 'Any person owning, leasing, controlling, operating or maintaining any building and/or lands in, upon, or adjoining any hazardous fire area shall at all times maintain defensible space around and adjacent to such building by removing and clearing away all combustible material for a distance not less than 100 feet from all portions of the structure. Distances may be increased or decreased by the fire code official based on site specific analysis of local conditions.\nException: Single specimens of trees ornamental vegetative fuels or cultivated ground cover, such as green grass, ivy succulents or similar plants used a ground cover, provided that they do not form a means of readily transmitting fire.',
  },
  {
    id: 'mc-325-6-3-1',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.3.1 (Marin County Code § 16.16.040)',
    title: 'Tree clearance from chimney outlet',
    status: 'current',
    tags: ['chimney', 'tree-limb'],
    text: 'Remove that portion of any tree that extends within 10 feet of the outlet of any chimney or stovepipe.',
  },
  {
    id: 'mc-325-6-3-2',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.3.2 (Marin County Code § 16.16.040)',
    title: 'Dead material in vegetation adjacent to buildings',
    status: 'current',
    tags: ['dead-vegetation', 'tree-limb'],
    text: 'Maintain any tree, shrub, or other plant adjacent to or overhanging any building free of dead limbs, branches or other combustible material.',
  },
  {
    id: 'mc-325-6-3-3',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.3.3 (Marin County Code § 16.16.040)',
    title: 'Roof and gutter maintenance',
    status: 'current',
    tags: ['roof-gutter'],
    text: 'Maintain the roof of any structure and roof gutters free of leaves, needle, or other combustible materials.',
  },
  {
    id: 'mc-325-6-3-4',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.3.4 (Marin County Code § 16.16.040)',
    title: 'Limbing of trees near buildings and roadways',
    status: 'current',
    tags: ['limbing', 'ladder-fuel', 'tree-limb', 'driveway'],
    text: 'Maintain trees within 100 feet of any building or structure or within 10 feet of any portion of any highway, street, ally, or driveway which is improved or used for vehicle travel or other vehicular purposes, so that leafy foliage, twigs or branches are above 5 feet of the ground.',
  },
  {
    id: 'mc-325-6-3-5',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.6.3.5 (Marin County Code § 16.16.040)',
    title: 'Vertical clearance over roof surfaces',
    status: 'current',
    tags: ['tree-limb', 'roof-gutter'],
    text: 'Maintain 5 feet of vertical clearance between roof surfaces and portions of trees overhanging any building or structure.',
  },
  {
    id: 'mc-325-7',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code §§ 325.7–325.8, 325.9.8.2 (Marin County Code § 16.16.040)',
    title: 'Vegetation Management Plan',
    status: 'current',
    tags: ['vmp', 'alternative'],
    text: [
      '325.7 Vegetation Management Plan. A Vegetation Management Plan shall be prepared by the applicant/property owner when required by the fire code official.',
      '325.8 Cost. The cost of the Vegetation Management Plan preparation and review shall be the responsibility of the applicant/property owner.',
      '325.9.8.2 Vegetation Management Plans. In lieu of vegetation abatement the fire code official may allow the property owner to submit a Vegetation Management Plan for the property. The plan shall be specific to the property and shall describe ways to minimize, mitigate and/or eliminate potential for loss from wildfire exposure. The plan shall be developed by the property owner and approved by the Fire Department, and the property shall be verified as compliant with the plan throughout the year. Verification of compliance shall be completed by a third-party individual or firm knowledgeable in such matters and approved by the Fire Department each year.',
    ].join('\n'),
  },
  {
    id: 'mc-325-9-8-1',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code § 325.9.8.1 (Marin County Code § 16.16.040)',
    title: 'Alternate mitigation — firebreaks and fuel-breaks',
    status: 'current',
    tags: ['alternative', 'parcel-abatement', 'vacant-land'],
    sourceNote: 'The adopted text cross-references "Section 321.9.1"; no § 321.9.1 exists in the chapter and the abatement order is at § 325.9.1. Transcribed as found.',
    text: 'In lieu of ordering abatement as provided in Section 321.9.1, the fire code official of this jurisdiction may order the preparation of firebreaks/fuel-breaks around parcels of property where combustible weeds, crops, or brush are present. In determining the proper width for firebreaks/fuel breaks, the fire code official shall consider the height of the growth, weather condition, topography, and the accessibility to the property of fire protection equipment. The procedure set forth in Section 325.9 for the abatement of weeds and rubbish shall apply to the preparation of firebreaks/fuel-breaks.',
  },
  {
    id: 'mc-325-11',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Fire Code as amended by MCC § 16.16.040 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Fire Code §§ 325.11–325.12 (Marin County Code § 16.16.040)',
    title: 'Violation penalties and failure to comply',
    status: 'current',
    tags: ['maintenance', 'signage'],
    text: [
      '325.11 Violation penalties. Persons who shall violate a provision of this code or shall fail to comply with any of the requirements thereof or who shall erect, install, alter, repair or do work in violation of the approved construction documents or directive of the fire code official, or of a permit or certificate used under provisions of this code, shall be subject to the criminal sanctions set forth in Health and Safety Code section 13871. Each day that a violation continues after such due notice has been served shall be deemed a separate offense.',
      '325.12 Failure to comply. Any person who shall continue any work after having been served with a stop work order, except such work as that person is directed to perform to remove a violation or unsafe condition, shall be liable to a fine of not less than 500 dollars or not more than 5,000 dollars.',
    ].join('\n'),
  },

  // ---- Local: Wildland-Urban Interface Code, amended at MCC § 16.16.060 ----
  //
  // This is where the old CFC § 4907.2 / § 4908 duties went. Note the change in
  // the headline distance: § 4907.2 required clearance within 30 ft of
  // structures, up to 150 ft; § 604.6 requires 100 ft, up to 200 ft.
  {
    id: 'iwuic-604-6',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Wildland-Urban Interface Code (2024 IWUIC) as amended by MCC § 16.16.060 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Wildland-Urban Interface Code § 604.6 (added by Marin County Code § 16.16.060)',
    title: 'Fire Hazard Reduction',
    status: 'current',
    tags: ['defensible-space', 'ladder-fuel', 'dead-vegetation', 'tree-limb', 'roof-gutter', 'chimney', 'limbing', 'zone1', 'zone2', 'spacing'],
    sourceNote: 'Item 9 of the adopted text refers to "the 2021 International Wildland-Urban Interface Code", while MCC § 16.16.050 adopts the 2025 California WUI Code / 2024 IWUIC. Transcribed as found. Also see meta.localSectionAmbiguity: the source numbers two sections § 16.16.060.',
    text: [
      'Any person who owns, leases, controls or maintains any building or structure, vacant lands, open space, and/or lands within specific Wildland Urban Interface areas of the jurisdiction of the Marin County Fire Department, shall comply with the following:',
      '1. Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet when topographic or combustible vegetative types necessitate removal as determined by the Fire Code Official.',
      '2. Remove accumulated dead vegetation on the property.',
      '3. Cut and remove tree limbs that overhang wood decks and roofs.',
      '4. Remove that portion of any tree which extends within 10 feet of any chimney or stovepipe, roof surfaces and roof gutters',
      '5. Clean any leaves and needles from roof and gutters.',
      '6. Cut and remove growth less than 3-inches in diameter, from the ground up to a height of 10 feet, provided that no crown shall be raised to a point so as to remove branches from more than the lower one-third of the tree’s total height.',
      '7. Ladder fuels shall be removed within 30 feet of the structure.',
      '8. When required by the Fire Code Official, cut and remove trees that are 6" of diameter or less at breast height, or four feet, six inches above ground, to achieve canopy separation within 30 feet of the structure.',
      '9. Vegetation clearance requirements for new construction and substantial remodels in Wildland-Urban Interface Areas shall be in accordance with the 2021 International Wildland-Urban Interface Code, as amended by the County of Marin.',
      'EXCEPTION 1: When approved by the Fire Code Official, single specimens of trees, ornamental shrubbery or similar plants, or plants used as ground covers, provided that they do not form a means of rapidly transmitting fire from the native growth to any structure.',
      'EXCEPTION 2: When approved by the Fire Code Official, grass and other vegetation located more than 30 feet (9144 mm) from buildings or structures less than 18 inches (457 mm) in height above the ground need not be removed where necessary to stabilize soil, and prevent erosion.',
    ].join('\n'),
  },
  {
    id: 'iwuic-604-7',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'mcc-16.16-ord3837',
    edition: '2025 California Wildland-Urban Interface Code (2024 IWUIC) as amended by MCC § 16.16.060 (Ord. 3837)',
    scope: 'Local',
    citation: 'California Wildland-Urban Interface Code § 604.7 (added by Marin County Code § 16.16.060)',
    title: 'Fire Hazard Reduction from Roadways',
    status: 'current',
    tags: ['driveway', 'access', 'clearance'],
    text: 'The Fire Code Official is authorized to cause areas within 10 feet (3048 cm) on each side of portions of highways, fire apparatus access roads (improved or unimproved), and driveways (improved or unimproved), which are improved, designed, or ordinarily used for vehicular traffic to be cleared of flammable vegetation and other combustible growth. Corrective action, if necessary, shall be the same as the actions required in section 604.6. The Fire Code Official is authorized to enter upon private property to carry out this work.\nEXCEPTION 1: When approved by the Fire Code Official, single specimens of trees, ornamental shrubbery or similar plants, or plants used as ground covers, provided that they do not form a means of rapidly transmitting fire from the native growth to any structure.',
  },

  // ---- State ----
  {
    id: 'prc-4291',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'prc-4291',
    edition: 'Public Resources Code § 4291, current through 2026',
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
    sourceDoc: 'gc-51175',
    edition: 'Government Code §§ 51175–51189, current through 2026',
    scope: 'State',
    citation: 'Government Code §§ 51175–51189 (incl. § 51182)',
    title: 'Defensible space in Very High Fire Hazard Severity Zones (local responsibility area)',
    status: 'current',
    tags: ['defensible-space', 'applicability'],
    text: 'Imposes the defensible-space duties of PRC § 4291 on owners of buildings and structures in Very High Fire Hazard Severity Zones within local responsibility areas. This is the authority California Fire Code § 325.6, as added by Marin County Code § 16.16.040, points to for LRA parcels (alongside PRC § 4291); cite it rather than PRC § 4291 where the parcel is in an LRA VHFHSZ rather than the SRA.',
  },
  {
    id: 'ccr-1299-03',
    domain: 'vegetation',
    provenance: 'transcribed',
    sourceDoc: 'ccr-1299',
    edition: 'Cal. Code Regs. tit. 14 § 1299.03, current through 2026',
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
    sourceDoc: 'ccr-1299',
    edition: 'Cal. Code Regs. tit. 14 § 1299.04, current through 2026',
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
    sourceDoc: 'bof-zone0',
    edition: 'PRC § 4291(a)(1)(A); 14 CCR Zone 0 regulations adopted 2026-08-19',
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
  // BUILDING AND FIRE-PROTECTION CODE — 2025 California Fire Code
  //
  // Transcribed verbatim from the 2025 CFC, section by section. Previously
  // every entry here was provenance: 'unverified', written against the 2019
  // CFC from memory. Verifying them against the edition actually in force
  // turned up NINE wrong section numbers, not just stale wording — see
  // meta.superseded.map. The two NFPA entries remain unverified: NFPA 13 and
  // NFPA 25 are not in the California Fire Code and were not reachable.
  //
  // California substitutes its own administrative regime for NFPA 10 on
  // portable extinguishers: CCR Title 19, Division 1, Chapter 3. Where that
  // matters (inspection frequency, sizing, travel distance) the CCR text is
  // quoted alongside the CFC section, as the code itself prints it.
  // -------------------------------------------------------------------------

  // ---- Fire protection systems: general (CFC ch. 9) ----
  {
    id: 'cfc-901-6',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 901.6, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 901.6',
    title: 'Inspection, testing and maintenance of fire protection systems',
    status: 'current',
    tags: ['fire-protection-system', 'maintenance', 'sprinkler', 'alarm', 'extinguisher', 'records'],
    text: 'Fire protection and life safety systems shall be maintained in an operative condition at all times, and shall be replaced or repaired where defective. Nonrequired fire protection and life safety systems and equipment shall be inspected, tested and maintained or removed in accordance with Section 901.8.\nAll fire alarm systems, fire detection systems, automatic sprinkler or extinguishing systems, communication systems, and all other equipment, material or systems required by these regulations shall be maintained in an operable condition at all times in accordance with this code and California Code of Regulations, Title 19, Division 1. Upon disruption or diminishment of the fire protective qualities of such equipment, material or systems, immediate action shall be instituted to affect a reestablishment of such equipment, material or systems to their original normal and operational condition.',
  },
  {
    id: 'cfc-901-6-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 901.6.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 901.6.1',
    title: 'Standards for inspection, testing and maintenance',
    status: 'current',
    tags: ['fire-protection-system', 'maintenance', 'records'],
    text: 'Fire protection systems shall be inspected, tested and maintained in accordance with the referenced standards listed in Table 901.6.1 and California Code of Regulations, Title 19, Division 1, Chapters 3 and 5.',
  },
  {
    id: 'cfc-901-6-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 901.6.3, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 901.6.3',
    title: 'Records of inspection, testing and maintenance',
    status: 'current',
    tags: ['records', 'maintenance', 'fire-protection-system'],
    // The five-year retention is California's, from CCR Title 19, and is
    // longer than the three years the model code would give. Quoted because
    // this is the number an inspector asks an owner for.
    text: 'Records of all system inspections, tests and maintenance shall be maintained in accordance with Section 110.3.\n[California Code of Regulations, Title 19, Division 1, § 904.1(b)] Records of all inspections shall be retained on the premises by the building or system owner for a period of five years after the next required inspection.\n[California Code of Regulations, Title 19, Division 1, § 904.2(c)] Records of all testing and maintenance shall be retained on the premises by the building or system owner for a period of five years after the next required test or maintenance.\n[California Code of Regulations, Title 19, Division 1, § 904.2(j)] It is the responsibility of the contractor, company or licensee to provide a written report of the test and maintenance results to the building owner and the local fire authority having jurisdiction at the completion of the testing and maintenance.',
  },
  {
    id: 'cfc-901-7',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 901.7, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 901.7',
    title: 'Systems out of service',
    status: 'current',
    tags: ['out-of-service', 'impairment', 'fire-protection-system', 'sprinkler', 'alarm', 'maintenance'],
    // This is the section for ANY fire protection system out of service,
    // alarms included. The old corpus cited § 907.9 for alarms; in the 2025
    // CFC § 907.9 is "Where Required in Existing Buildings and Structures".
    text: 'Where a required fire protection system is out of service, the fire department and the fire code official shall be notified immediately and, where required by the fire code official, the building shall be either evacuated or an approved fire watch shall be provided for all occupants left unprotected by the shutdown until the fire protection system has been returned to service.\nWhere utilized, fire watches shall be provided with not less than one approved means for notification of the fire department and their only duty shall be to perform constant patrols of the protected premises and keep watch for fires.\nException: Facilities with an approved notification and impairment management program. The notification and impairment program for water-based fire protection systems shall comply with California NFPA 25.',
  },

  // ---- Automatic sprinkler systems (CFC ch. 9) ----
  {
    id: 'cfc-903-5',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 903.5, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 903.5',
    title: 'Testing and maintenance of automatic sprinkler systems',
    status: 'current',
    tags: ['sprinkler', 'maintenance', 'records', 'fire-protection-system'],
    text: 'Automatic sprinkler systems shall be inspected, tested and maintained in accordance with Section 901.',
  },
  {
    id: 'cfc-903-4',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 903.4, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 903.4',
    title: 'Sprinkler system supervision and alarms',
    status: 'current',
    tags: ['sprinkler', 'alarm', 'out-of-service', 'fire-protection-system'],
    text: 'Automatic sprinkler system supervision and alarms shall comply with Sections 903.4.1 through 903.4.3.',
  },
  {
    id: 'cfc-903-3-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 903.3.3, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 903.3.3',
    title: 'Obstructed locations',
    status: 'current',
    tags: ['sprinkler', 'obstruction', 'clearance', 'storage'],
    // The 18-in. figure an inspector reaches for is NOT in this section: it is
    // the storage ceiling clearance at § 315.3.1. This section gives 3 ft to
    // the top of piles of combustible fibres.
    text: 'Automatic sprinklers shall be installed with regard to obstructions that will delay activation or obstruct the water distribution pattern and shall be in accordance with the applicable automatic sprinkler system standard that is being used. Automatic sprinklers shall be installed in or under covered kiosks, displays, booths, concession stands or equipment that exceeds 4 feet (1219 mm) in width. Not less than a 3-foot (914 mm) clearance shall be maintained between automatic sprinklers and the top of piles of combustible fibers.\nException: Kitchen equipment under exhaust hoods protected with a fire-extinguishing system in accordance with Section 904.',
  },
  {
    id: 'nfpa13-painting',
    domain: 'building',
    provenance: 'unverified',
    edition: 'UNCONFIRMED — NFPA 13 is a referenced standard, not part of the California Fire Code, and was not reachable. Text not transcribed.',
    scope: 'Standard',
    citation: 'NFPA 13 (sprinkler installation), as referenced by California Fire Code Table 901.6.1',
    title: 'Sprinklers shall not be painted, coated or altered',
    status: 'current',
    tags: ['sprinkler', 'painted-sprinkler', 'maintenance'],
    text: 'A sprinkler that has been painted, coated or otherwise altered in the field, other than by the manufacturer, is to be replaced rather than cleaned. Field-applied paint on a sprinkler is a defect in itself, independent of how the system performs on test. NOT TRANSCRIBED — verify against the adopted edition of NFPA 13 before citing on an enforceable notice.',
  },
  {
    id: 'nfpa25-sprinkler-condition',
    domain: 'building',
    provenance: 'unverified',
    edition: 'UNCONFIRMED — NFPA 25 is a referenced standard (California edition per CCR Title 19), not part of the California Fire Code, and was not reachable. Text not transcribed.',
    scope: 'Standard',
    citation: 'NFPA 25 (inspection, testing and maintenance of water-based systems), California edition as referenced by California Fire Code § 901.6.1 and CCR Title 19, Division 1, Chapter 5',
    title: 'Sprinkler condition — replacement on inspection',
    status: 'current',
    tags: ['sprinkler', 'painted-sprinkler', 'corrosion', 'maintenance', 'records'],
    text: 'A sprinkler showing signs of paint, coating, corrosion, loading, physical damage or leakage is to be replaced. NOT TRANSCRIBED — verify against the adopted California edition of NFPA 25 before citing on an enforceable notice. The inspection, testing and maintenance frequencies themselves are set by CCR Title 19, Division 1, § 904(a)(1).',
  },

  // ---- Portable fire extinguishers (CFC ch. 9 + CCR tit. 19 div. 1 ch. 3) ----
  {
    id: 'cfc-906-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 906.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 906.1',
    title: 'Portable fire extinguishers — where required',
    status: 'current',
    tags: ['extinguisher', 'fire-protection-system'],
    text: 'Portable fire extinguishers shall be installed in all of the following locations:\n1. In new and existing Group A, B, E, F, H, I, L, M, R-1, R-2, R-2.1, R-2.2, R-3.1, R-4 and S occupancies.\n2. Within 30 feet (9144 mm) distance of travel from commercial cooking equipment and from domestic cooking equipment in Group I-1; I-2, Condition 1; and R-2 college dormitory occupancies.\n3. In areas where flammable or combustible liquids are stored, used or dispensed.\n4. On each floor of structures under construction, except Group R-3 occupancies, in accordance with Section 3306.6.\n5. Where required by the sections indicated in Table 906.1.\n6. Special-hazard areas, including but not limited to laboratories, computer rooms and generator rooms, where required by the fire code official.\n7. Large and small family day-care homes shall be equipped with a portable fire extinguisher having a minimum 2-A:10-B:C rating.\n8. Where required by California Code of Regulations, Title 19, Division 1.\n9. Within 30 feet (9144 mm) of domestic cooking equipment located in a Group I-2.',
  },
  {
    id: 'cfc-906-2',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 906.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 906.2',
    title: 'Portable fire extinguishers — general requirements',
    status: 'current',
    tags: ['extinguisher', 'maintenance', 'records', 'signage'],
    // California does NOT run extinguishers off NFPA 10: § 906.2 points at CCR
    // Title 19, Division 1, Chapter 3, and the inspection interval there is
    // MONTHLY by the owner, not annual. The old corpus said "serviced at
    // intervals not exceeding 1 year", which is the maintenance interval, not
    // the inspection one, and cited NFPA 10 for it.
    text: 'Portable fire extinguishers shall be selected, installed and maintained in accordance with this section and California Code of Regulations, Title 19, Division 1, Chapter 3.\n[California Code of Regulations, Title 19, Division 1, § 574.1] Fire extinguishers shall be manually inspected when initially placed in service. Thereafter, extinguishers shall be manually inspected at least monthly by the building owner, occupant or his/her authorized agent, or electronically monitored. Fire extinguishers shall be inspected at more frequent intervals when circumstances require, as determined by the Authority Having Jurisdiction.\n[California Code of Regulations, Title 19, Division 1, § 574.2] Manual inspection of extinguishers shall include a check of at least the following items: located in designated place; no obstruction to access or visibility; operating instructions on nameplate legible and facing outward; safety seals and tamper indicators not broken or missing; examine for obvious physical damage, corrosion, leakage or clogged nozzle; pressure gauge reading or indicator in the operable range or position; fullness determined by weighing or hefting.',
  },
  {
    id: 'cfc-906-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 906.3 and Table 906.3(1), as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 906.3 and Table 906.3(1)',
    title: 'Portable fire extinguishers — size and distribution',
    status: 'current',
    tags: ['extinguisher', 'clearance', 'access'],
    text: 'The size and distribution of portable fire extinguishers shall be in accordance with Sections 906.3.1 through 906.3.4.\nTable 906.3(1), Fire extinguishers for Class A fire hazards: minimum-rated single extinguisher 2-A for Light (Low) Hazard and Ordinary (Moderate) Hazard occupancies and 4-A for Extra (High) Hazard; maximum floor area per unit of A 3,000 sq ft (Light), 1,500 sq ft (Ordinary), 1,000 sq ft (Extra); maximum floor area for extinguisher 11,250 sq ft in all three; maximum distance of travel to extinguisher 75 feet in all three.',
  },
  {
    id: 'cfc-906-6',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 906.6, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 906.6',
    title: 'Extinguishers to be unobstructed and unobscured',
    status: 'current',
    tags: ['extinguisher', 'obstruction', 'access', 'signage'],
    text: 'Portable fire extinguishers shall not be obstructed or obscured from view. In rooms or areas in which visual obstruction cannot be completely avoided, means shall be provided to indicate the locations of extinguishers.',
  },
  {
    id: 'cfc-906-9',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 906.9.1–906.9.3, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 906.9.1–906.9.3',
    title: 'Extinguisher installation height and floor clearance',
    status: 'current',
    tags: ['extinguisher', 'clearance', 'access'],
    // The mounting heights the old corpus attributed to § 906.2.
    text: '906.9.1 Extinguishers weighing 40 pounds or less. Portable fire extinguishers having a gross weight not exceeding 40 pounds (18 kg) shall be installed so that their tops are not more than 5 feet (1524 mm) above the floor.\n906.9.2 Extinguishers weighing more than 40 pounds. Hand-held portable fire extinguishers having a gross weight exceeding 40 pounds (18 kg) shall be installed so that their tops are not more than 3.5 feet (1067 mm) above the floor.\n906.9.3 Floor clearance. The clearance between the floor and the bottom of installed hand-held portable fire extinguishers shall be not less than 4 inches (102 mm).',
  },

  // ---- Fire alarm and detection (CFC ch. 9) ----
  {
    id: 'cfc-907-8',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 907.8–907.8.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 907.8–907.8.2',
    title: 'Fire alarm system inspection, testing and maintenance',
    status: 'current',
    tags: ['alarm', 'detector', 'maintenance', 'records', 'fire-protection-system'],
    text: '907.8.1 Maintenance required. Where required for compliance with the provisions of this code, devices, equipment, systems, conditions, arrangements, levels of protection or other features shall thereafter be continuously maintained in accordance with applicable NFPA requirements or as directed by the fire code official.\n907.8.2 Testing. Testing shall be performed in accordance with the schedules in NFPA 72 or more frequently where required by the fire code official. Records of testing shall be maintained.\nException: Devices or equipment that are inaccessible because of safety considerations shall be tested during scheduled shutdowns where approved by the fire code official, but not less than every 18 months.',
  },

  // ---- Means of egress: illumination and exit signs (CFC ch. 10) ----
  {
    id: 'cfc-1013-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 1013.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 1013.1',
    title: 'Exit signs — where required',
    status: 'current',
    tags: ['exit-sign', 'egress', 'signage'],
    text: 'Exits and exit access doors shall be marked by an approved exit sign readily visible from any direction of egress travel. The path of egress travel to exits and within exits shall be marked by readily visible exit signs to clearly indicate the direction of egress travel in cases where the exit or the path of egress travel is not immediately visible to the occupants. Intervening means of egress doors within exits shall be marked by exit signs. Exit sign placement shall be such that any point in an exit access corridor or exit passageway is within 100 feet (30 480 mm) or the listed viewing distance of the sign, whichever is less, from the nearest visible exit sign.',
  },
  {
    id: 'cfc-1013-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 1013.3, 1013.6.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 1013.3, 1013.6.2',
    title: 'Exit sign illumination',
    status: 'current',
    tags: ['exit-sign', 'illumination', 'signage'],
    // The 5-footcandle figure is § 1013.6.2, not § 1013.3.
    text: '1013.3 Illumination. Exit signs shall be internally or externally illuminated.\nException: Tactile signs required by Section 1013.4 need not be provided with illumination.\n1013.6.2 Exit sign illumination. The face of an exit sign illuminated from an external source shall have an intensity of not less than 5 footcandles (54 lux).',
  },
  {
    id: 'cfc-1013-6-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 1013.6.3, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 1013.6.3',
    title: 'Exit sign power source',
    status: 'current',
    tags: ['exit-sign', 'emergency-power', 'illumination'],
    text: 'Exit signs shall be illuminated at all times. To ensure continued illumination for a duration of not less than 90 minutes in case of primary power loss, the sign illumination means shall be connected to an emergency power system provided from storage batteries, unit equipment or an on-site generator. The installation of the emergency power system shall be in accordance with Section 1203. Group I-2 exit sign illumination shall not be provided by unit equipment batteries only.\nException: Approved exit sign illumination types that provide continuous illumination independent of external power sources for a duration of not less than 90 minutes, in case of primary power loss, are not required to be connected to an emergency electrical system.',
  },
  {
    id: 'cfc-1008-2',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 1008.2, 1008.2.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 1008.2, 1008.2.1',
    title: 'Means of egress illumination level',
    status: 'current',
    tags: ['illumination', 'egress'],
    // The 1-footcandle figure is § 1008.2.1, not § 1008.2.
    text: '1008.2 Illumination required. The means of egress serving a room or space shall be illuminated at all times that the room or space is occupied.\n1008.2.1 Illumination level under normal power. The means of egress illumination level shall be not less than 1 footcandle (11 lux) at the walking surface. Along exit access stairways, exit stairways and at their required landings, the illumination level shall be not less than 10 footcandles (108 lux) at the walking surface when the stairway is in use.',
  },
  {
    id: 'cfc-1008-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 1008.3, 1008.3.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 1008.3, 1008.3.2',
    title: 'Emergency power for means of egress illumination',
    status: 'current',
    tags: ['emergency-power', 'illumination', 'egress'],
    text: '1008.3 Illumination required by an emergency electrical system. An emergency electrical system shall be provided to automatically illuminate, in the event of a power supply failure, rooms or spaces that require two or more exits or access to exits, and the other areas listed in that section.\n1008.3.2 Illumination level under emergency power. Emergency lighting facilities shall be arranged to provide initial illumination that is not less than an average of 1 footcandle (11 lux) and a minimum at any point of 0.1 footcandle (1 lux) measured along the path of egress at floor level. Illumination levels shall be permitted to decline to 0.6 footcandle (6 lux) average and a minimum at any point of 0.06 footcandle (0.6 lux) at the end of the emergency lighting time duration. A maximum-to-minimum illumination uniformity ratio of 40 to 1 shall not be exceeded.',
  },

  // ---- Maintenance of the means of egress (CFC ch. 10, Section 1032) ----
  //
  // Section 1032 is where egress maintenance lives in the 2025 CFC. The old
  // corpus cited §§ 1031.2 and 1031.3 for this; in the 2025 CFC Section 1031
  // is Emergency Escape and Rescue Openings, an unrelated subject.
  {
    id: 'cfc-1032-2',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 1032.1–1032.3, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 1032.1–1032.3',
    title: 'Reliability and obstruction of the means of egress',
    status: 'current',
    tags: ['egress', 'obstruction', 'exit-door', 'storage', 'maintenance', 'access'],
    text: '1032.1 General. The means of egress for buildings or portions thereof shall be maintained in accordance with this section.\n1032.2 Reliability. Required exit accesses, exits and exit discharges shall be continuously maintained free from obstructions or impediments to full instant use in the case of fire or other emergency where the building area served by the means of egress is occupied. An exit or exit passageway shall not be used for any purpose that interferes with a means of egress.\n1032.3 Obstructions. A means of egress shall be free from obstructions that would prevent its use, including the accumulation of snow and ice.\n[California Code of Regulations, Title 19, Division 1, § 3.11] No person shall install, place or permit the installation or placement of any bed, chair, equipment, concession, turnstile, ticket office or anything whatsoever, in any manner which would block or obstruct the required width of any exit. No person shall install, place or permit the installation or placement of any storage material of any kind in any exit regardless of the required width of such exit.',
  },
  {
    id: 'cfc-1032-4',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 1032.4, 1032.10, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 1032.4, 1032.10',
    title: 'Maintenance of exit signs and emergency lighting',
    status: 'current',
    tags: ['exit-sign', 'illumination', 'emergency-power', 'maintenance', 'signage', 'egress'],
    text: '1032.4 Exit signs. Exit signs shall be installed and maintained in accordance with the building code that was in effect at the time of construction and the applicable provisions in Section 1104. Decorations, furnishings, equipment or adjacent signage that impairs the visibility of exit signs, creates confusion or prevents identification of the exit shall not be allowed.\n1032.10 Emergency lighting equipment inspection and testing. Emergency lighting shall be maintained in accordance with Section 110 and shall be inspected and tested in accordance with Sections 1032.10.1 and 1032.10.2.',
  },

  // ---- Egress doors (CFC ch. 10) ----
  //
  // Renumbered in the 2025 CFC: door operations moved from § 1010.1.9 to
  // § 1010.2, and panic hardware from § 1010.1.10 to § 1010.2.8.
  {
    id: 'cfc-1010-2',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 1010.2, 1010.2.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 1010.2, 1010.2.1',
    title: 'Egress door operations — one motion to unlatch',
    status: 'current',
    tags: ['exit-door', 'egress', 'lock', 'maintenance'],
    text: '1010.2 Door operations. Except as specifically permitted by this section, egress doors shall be readily openable from the egress side without the use of a key or special knowledge or effort.\n1010.2.1 Unlatching. The unlatching of any door or leaf for egress shall require not more than one motion in a single linear or rotational direction to release all latching and all locking devices. Manual bolts are not permitted.',
  },
  {
    id: 'cfc-1010-2-4',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 1010.2.4, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 1010.2.4',
    title: 'Locks and latches — where permitted on egress doors',
    status: 'current',
    tags: ['exit-door', 'lock', 'egress', 'signage'],
    text: 'Locks and latches shall be permitted to prevent operation of doors only where one of the listed conditions exists, including places of detention or restraint; certain Group R-2.1 and I-2 clinical conditions; and, in buildings in occupancy Group A having an occupant load of 300 or less, Groups B, F, M and S, and in places of religious worship, main exterior or main tenant doors equipped with key-operated locking devices from the egress side, provided that the locking device is readily distinguishable as locked, a readily visible durable sign is posted on the egress side on or adjacent to the door stating "THIS DOOR TO REMAIN UNLOCKED WHEN THIS SPACE IS OCCUPIED" in letters 1 inch (25 mm) high on a contrasting background, and the use of the key-operated locking device is revocable by the fire code official for due cause.',
  },
  {
    id: 'cfc-1010-2-8',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 1010.2.8, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 1010.2.8',
    title: 'Panic and fire exit hardware',
    status: 'current',
    tags: ['panic-hardware', 'exit-door', 'egress', 'lock'],
    text: 'Panic and fire exit hardware is required on the doors and in the occupancies listed in Sections 1010.2.8 through 1010.2.8.4, including refrigeration machinery rooms and rooms with electrical equipment, and shall be installed in accordance with § 1010.2.8.3.',
  },

  // ---- Occupant load (CFC ch. 10) ----
  {
    id: 'cfc-1004-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 1004.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 1004.1',
    title: 'Design occupant load — overcrowding',
    status: 'current',
    tags: ['occupant-load', 'overcrowding', 'egress'],
    text: 'In determining means of egress requirements, the number of occupants for whom means of egress facilities are provided shall be determined in accordance with this section.\n[California Code of Regulations, Title 19, Division 1, § 3.27] Overcrowding. The number of occupants of any building, structure or portion thereof, shall not exceed the permitted or posted capacity.',
  },

  // ---- Fire-resistance-rated construction and opening protectives (CFC ch. 7) ----
  {
    id: 'cfc-703-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 703.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 703.1',
    title: 'Maintaining protection of fire-resistance-rated construction',
    status: 'current',
    tags: ['fire-rated', 'penetration', 'maintenance'],
    text: 'Materials and firestop systems used to protect membrane and through penetrations in fire-resistance-rated construction and construction installed to resist the passage of smoke shall be maintained. The materials and firestop systems shall be securely attached to or bonded to the construction being penetrated with no openings visible through or into the cavity of the construction. Where the system design number is known, the system shall be inspected to the listing criteria and manufacturer’s installation instructions.',
  },
  {
    id: 'cfc-705-2',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 705.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 705.2',
    title: 'Fire doors and smoke barrier doors — inspection and maintenance',
    status: 'current',
    tags: ['fire-door', 'obstruction', 'maintenance', 'fire-rated'],
    text: 'Opening protectives in fire-resistance-rated assemblies shall be inspected and maintained in accordance with NFPA 80. Opening protectives in smoke barriers shall be inspected and maintained in accordance with NFPA 80 and NFPA 105. Openings in smoke partitions shall be inspected and maintained in accordance with NFPA 105. Fire doors and smoke and draft control doors shall not be blocked, obstructed, or otherwise made inoperable. Fusible links shall be replaced promptly whenever fused or damaged. Opening protectives and smoke and draft control doors shall not be modified.',
  },

  // ---- Fire service features: premises identification, hydrants, FDC (CFC chs. 5, 9) ----
  {
    id: 'cfc-505-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code § 505.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code § 505.1',
    title: 'Address identification',
    status: 'current',
    tags: ['address', 'signage', 'access'],
    text: 'New and existing buildings shall be provided with approved address identification. The address identification shall be legible and placed in a position that is visible from the street or road fronting the property. Address identification characters shall contrast with their background. Address numbers shall be Arabic numbers or alphabetical letters. Numbers shall not be spelled out. Each character shall be not less than 4 inches (102 mm) high with a minimum stroke width of 1/2 inch (12.7 mm). Where required by the fire code official, address identification shall be provided in additional approved locations to facilitate emergency response. Where access is by means of a private road and the building cannot be viewed from the public way, a monument, pole or other sign or means shall be used to identify the structure. Address identification shall be maintained.',
  },
  {
    id: 'cfc-507-5-4',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 507.5.4, 507.5.5, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 507.5.4, 507.5.5',
    title: 'Obstruction of and clear space around fire hydrants',
    status: 'current',
    tags: ['hydrant', 'obstruction', 'access', 'clearance'],
    // The 3-ft figure is § 507.5.5, not § 507.5.4.
    text: '507.5.4 Obstruction. Unobstructed access to fire hydrants shall be maintained at all times. The fire department shall not be deterred or hindered from gaining immediate access to fire protection equipment or fire hydrants.\n507.5.5 Clear space around hydrants. A 3-foot (914 mm) clear space shall be maintained around the circumference of fire hydrants, except as otherwise required or approved.',
  },
  {
    id: 'cfc-912-4',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 912.4, 912.4.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 912.4, 912.4.2',
    title: 'Fire department connections — access and clear space',
    status: 'current',
    tags: ['fdc', 'hydrant', 'obstruction', 'access', 'clearance'],
    // The old corpus cited § 912.3 for this; § 912.3 is Fire Hose Threads.
    text: '912.4 Access. Immediate access to fire department connections shall be maintained at all times and without obstruction by fences, bushes, trees, walls or any other fixed or moveable object. Access to fire department connections shall be approved by the fire code official.\n912.4.2 Clear space around connections. A working space of not less than 36 inches (914 mm) in width, 36 inches (914 mm) in depth and 78 inches (1981 mm) in height shall be provided and maintained in front of and to the sides of wall-mounted fire department connections and around the circumference of free-standing fire department connections, except as otherwise required or approved by the fire code official.',
  },

  // ---- Housekeeping, storage and electrical (CFC chs. 3, 6) ----
  {
    id: 'cfc-304-1',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 304.1, 304.1.2, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 304.1, 304.1.2',
    title: 'Waste accumulation prohibited',
    status: 'current',
    tags: ['housekeeping', 'combustible-waste', 'storage'],
    text: '304.1 Waste accumulation prohibited. Combustible waste material creating a fire hazard shall not be allowed to accumulate in buildings or structures or upon premises.\n304.1.2 Waste material. Accumulations of wastepaper, wood, hay, straw, weeds, litter or combustible or flammable waste or rubbish of any type shall not be permitted to remain on a roof or in any court, yard, vacant lot, alley, parking lot, open space, or beneath a grandstand, bleacher, pier, wharf, manufactured home, recreational vehicle or other similar structure.\n[California Code of Regulations, Title 19, Division 1, § 3.07(a)] Clearances. General. No combustible material shall be placed or stored within 10 feet of any building or structure.',
  },
  {
    id: 'cfc-315-3',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 315.3, 315.3.1, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 315.3, 315.3.1',
    title: 'Storage in buildings — orderly piles and ceiling clearance',
    status: 'current',
    tags: ['storage', 'clearance', 'sprinkler', 'housekeeping', 'obstruction'],
    // This is the real home of the 18-in. and 2-ft figures. The old corpus
    // attributed them to § 315.3 and to NFPA 13.
    text: '315.3 Storage in buildings. Storage of materials in buildings shall be orderly and stacks shall be stable. Storage of combustible materials shall be separated from heaters or heating devices by distance or shielding so that ignition cannot occur.\n315.3.1 Ceiling clearance. Storage shall be maintained 2 feet (610 mm) or more below the ceiling in nonsprinklered areas of buildings or not less than 18 inches (457 mm) below sprinkler deflectors in sprinklered areas of buildings.\nExceptions: The 2-foot (610 mm) ceiling clearance is not required for storage along walls in nonsprinklered areas of buildings. The 18-inch (457 mm) ceiling clearance is not required for storage along walls in areas of buildings equipped with an automatic sprinkler system in accordance with Section 903.3.1.1, 903.3.1.2 or 903.3.1.3.',
  },
  {
    id: 'cfc-603-6',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 603.5, 603.6, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 603.5, 603.6',
    title: 'Extension cords, relocatable power taps and current taps',
    status: 'current',
    tags: ['electrical', 'housekeeping'],
    // The old corpus cited § 605.4 for this; in the 2025 CFC § 605.4 is Fuel
    // Oil Storage Systems.
    text: '603.5 Relocatable power taps and current taps. The construction and use of current taps and relocatable power taps shall be in accordance with the California Electrical Code and this code.\n603.6 Extension cords. Extension cords shall not be a substitute for permanent wiring and shall be listed and labeled in accordance with UL 817. Extension cords shall not be affixed to structures, extended through walls, ceilings or floors, or under doors or floor coverings, nor shall such cords be subject to environmental damage or physical impact. Extension cords shall be used only with portable appliances. Extension cords marked for indoor use shall not be used outdoors.',
  },
  {
    id: 'cfc-603-4',
    domain: 'building',
    provenance: 'transcribed',
    sourceDoc: 'cfc-2025-upcodes',
    edition: '2025 California Fire Code §§ 603.2, 603.4, as adopted by MCC § 16.16.040 (Ord. 3837)',
    scope: 'State',
    citation: 'California Fire Code §§ 603.2, 603.4',
    title: 'Working space and clearance at electrical equipment',
    status: 'current',
    tags: ['electrical', 'clearance', 'obstruction', 'storage'],
    // The old corpus cited § 605.3 for this; in the 2025 CFC § 605.3 is
    // Chimneys and Vents. The dimensions themselves were right.
    text: '603.2 Abatement of unsafe conditions and electrical hazards. Conditions that constitute an electrical shock or fire hazard shall be abated.\n603.4 Working space and clearances. Working space around electrical equipment shall be provided in accordance with Section 110.26 of the California Electrical Code for electrical equipment rated 1,000 volts or less, and Section 110.32 of the California Electrical Code for electrical equipment rated over 1,000 volts. The minimum required working space shall be not less than 30 inches (762 mm) in width, 36 inches (914 mm) in depth and 78 inches (1981 mm) in height in front of electrical service equipment. Where the electrical service equipment is wider than 30 inches (762 mm), the minimum working space shall be not less than the width of the equipment. Storage of materials shall not be located within the designated working space.',
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
    limbing: 'Remove tree branches to at least 6 ft from the ground. Marin WUI Code § 604.6(6) allows limbing up to 10 ft but no more than the lower one-third of the tree’s total height; Marin CFC § 325.6.3.4 requires foliage above 5 ft within 100 ft of a structure. Marin WUI Code § 604.6(7) requires ladder fuels removed within 30 ft of the structure.',
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

/// The building-code equivalents. Same contract: these are the only numbers the
// model may write for a building finding. Every figure here was read off the
// 2025 California Fire Code section named in its citation — see
// meta.sourceDocs['cfc-2025-upcodes']. Where a number could not be verified it
// is not stated; `verify` says what is missing instead.
const buildingTables = {
  sprinklers: {
    citation: 'California Fire Code §§ 903.3.3, 315.3.1, 901.6.1, 901.6.3; CCR Title 19, Division 1, §§ 904(a)(1), 904.1(b), 904.2(c)',
    clearance: 'Storage maintained not less than 18 in. below sprinkler deflectors in sprinklered areas, and 2 ft or more below the ceiling in nonsprinklered areas (CFC § 315.3.1). Not less than 3 ft between automatic sprinklers and the top of piles of combustible fibers (CFC § 903.3.3).',
    testing: 'Sprinkler systems inspected, tested and maintained in accordance with CFC § 901 and, in California, the frequencies in CCR Title 19, Division 1, § 904(a)(1), which adopts NFPA 25 as published in the 2013 California Edition.',
    records: 'Records of inspections retained on the premises by the owner for five years after the next required inspection, and records of testing and maintenance for five years after the next required test or maintenance (CCR Title 19, Division 1, §§ 904.1(b), 904.2(c)).',
    verify: 'The condition rule — that a sprinkler showing paint, coating, corrosion, loading, leakage or physical damage is replaced rather than cleaned — comes from NFPA 13 and NFPA 25, which are referenced standards and were NOT transcribed. Do not quote a clause number for it.',
  },
  extinguishers: {
    citation: 'California Fire Code §§ 906.1, 906.2, 906.3, 906.6, 906.9.1–906.9.3 and Table 906.3(1); CCR Title 19, Division 1, §§ 574.1, 574.2',
    // California runs extinguishers off CCR Title 19, Division 1, Chapter 3 —
    // not NFPA 10 — and the owner's inspection there is MONTHLY.
    inspection: 'Manually inspected when first placed in service and at least monthly thereafter by the owner, occupant or authorised agent, or electronically monitored (CCR Title 19, Division 1, § 574.1). The monthly check covers location, access and visibility, legible outward-facing instructions, intact seals and tamper indicators, physical damage, corrosion, leakage or clogged nozzle, gauge in the operable range, and fullness by weighing or hefting (§ 574.2).',
    mounting: 'Gross weight 40 lb or less: top not more than 5 ft above the floor (CFC § 906.9.1). Over 40 lb: top not more than 3.5 ft above the floor (§ 906.9.2). In both cases the bottom is not less than 4 in. above the floor (§ 906.9.3).',
    travel: 'Maximum distance of travel to a Class A extinguisher is 75 ft in Light, Ordinary and Extra Hazard occupancies alike (CFC Table 906.3(1)). Extinguishers required within 30 ft distance of travel from commercial cooking equipment, and in areas where flammable or combustible liquids are stored, used or dispensed (CFC § 906.1).',
    obstruction: 'Shall not be obstructed or obscured from view; where visual obstruction cannot be avoided, means provided to indicate the location (CFC § 906.6).',
    verify: 'The annual maintenance interval and the service-tag content are in CCR Title 19, Division 1, Chapter 3 and were NOT transcribed. Say that an extinguisher is overdue only from the tag the inspector actually read, and do not state the interval as a code figure.',
  },
  egress: {
    citation: 'California Fire Code §§ 1008.2, 1008.2.1, 1008.3, 1008.3.2, 1013.1, 1013.3, 1013.6.2, 1013.6.3, 1010.2, 1010.2.1, 1010.2.4, 1010.2.8, 1032.2, 1032.3',
    illumination: 'Means of egress illuminated whenever the room or space is occupied (CFC § 1008.2), to not less than 1 footcandle at the walking surface, and not less than 10 footcandles along exit access stairways, exit stairways and their landings when in use (§ 1008.2.1).',
    emergencyPower: 'Exit sign illumination continued for not less than 90 minutes on primary power loss, from storage batteries, unit equipment or an on-site generator (CFC § 1013.6.3). Under emergency power, egress illumination provides initially not less than an average of 1 footcandle and a minimum of 0.1 footcandle along the path of egress at floor level, declining to not less than 0.6 footcandle average and 0.06 footcandle minimum at the end of the duration, with a maximum-to-minimum uniformity ratio not exceeding 40 to 1 (§ 1008.3.2).',
    exitSignSpacing: 'No point in an exit access corridor or exit passageway more than 100 ft — or the sign’s listed viewing distance, whichever is less — from the nearest visible exit sign (CFC § 1013.1).',
    exitSignIllumination: 'Exit signs internally or externally illuminated (CFC § 1013.3); an externally illuminated face has an intensity of not less than 5 footcandles (§ 1013.6.2).',
    doorOperation: 'Egress doors readily openable from the egress side without a key, special knowledge or effort (CFC § 1010.2). Unlatching requires not more than one motion in a single linear or rotational direction to release all latching and locking devices; manual bolts are not permitted (§ 1010.2.1). Key-operated locking on a main door, where § 1010.2.4 permits it at all, requires the sign "THIS DOOR TO REMAIN UNLOCKED WHEN THIS SPACE IS OCCUPIED" in letters 1 in. high on a contrasting background.',
    reliability: 'Required exit accesses, exits and exit discharges continuously maintained free from obstructions or impediments to full instant use while the area served is occupied (CFC § 1032.2); a means of egress free from obstructions that would prevent its use (§ 1032.3).',
    verify: 'The force required to release panic hardware is in CFC § 1010.1.3 (Forces to Unlatch and Open Doors), which was NOT transcribed. Do not state a pound figure for it.',
  },
  access: {
    citation: 'California Fire Code §§ 505.1, 507.5.4, 507.5.5, 912.4, 912.4.2, 603.2, 603.4, 603.6',
    address: 'Address characters not less than 4 in. high with a stroke width of not less than 1/2 in., contrasting with their background, legible and visible from the street or road fronting the property; Arabic numbers or alphabetical letters, not spelled out (CFC § 505.1).',
    hydrant: 'Unobstructed access to fire hydrants maintained at all times (CFC § 507.5.4), with a 3 ft clear space around the circumference (§ 507.5.5).',
    fdc: 'Immediate access to fire department connections maintained at all times without obstruction by fences, bushes, trees, walls or any other fixed or moveable object (CFC § 912.4), with a working space of not less than 36 in. wide, 36 in. deep and 78 in. high in front of and to the sides of wall-mounted connections (§ 912.4.2).',
    electrical: 'Working space in front of electrical service equipment not less than 30 in. wide, 36 in. deep and 78 in. high — and not less than the equipment width where that exceeds 30 in. — with no storage inside it (CFC § 603.4). Extension cords are not a substitute for permanent wiring, are not affixed to structures or run through walls, ceilings, floors, under doors or under floor coverings, and are used only with portable appliances (§ 603.6).',
  },
};

// ---------------------------------------------------------------------------
// Procedure — the dates and consequences a notice to the owner turns on.
// Transcribed from Ord. 3837; the windows are much shorter than a generic
// "45 days to correct" would suggest. Every block names its edition, because
// these are the numbers that go on a legal instrument.
// ---------------------------------------------------------------------------

const procedure = {
  abatementNotice: {
    citation: 'California Fire Code § 325.9.1 (added by Marin County Code § 16.16.040)',
    edition: '2025 CFC as amended by MCC § 16.16.040 (Ord. 3837)',
    sourceDoc: 'mcc-16.16-ord3837',
    correctionDays: 10,
    text: 'The County fire code official may order the abatement of weeds, trees, and rubbish as described in Sections 304.1 and 325.2. On making the order, the fire code official mails a copy of the notice to the owner of the affected property as the owner and address appear on the current and last county equalized assessment roll as of July 1 of each calendar year, or as the address is known to the jurisdiction. As an alternative to mailing, the notice may be posted upon the affected property and published in the jurisdiction, not less than ten (10) days prior to the date of the abatement hearing. Copies of the notice shall be headed with the words "Notice to Abate Hazardous Vegetation/Combustible Material" in letters at least one inch high. The notice is headed "NOTICE TO ABATE WEEDS, DEAD TREES, BRUSH AND RUBBISH" and notifies the owner to remove the weeds, dead trees, brush and rubbish within ten (10) days from the date of the notice. On failure to do so, the Marin County Fire Department will remove it and the cost of the abatement, including administrative costs, will be collected as property taxes and will be a lien on the property until paid. The lien may prevent sale of the property, and on payment it is the owner’s responsibility to obtain a release of lien from the Fire Department and file it at the County Recorder’s Office. The notice also states that the Board of Supervisors has declared such conditions a public nuisance and that weeds constitute a seasonal and recurring nuisance, and gives a time, date and place to appear before the Fire Chief or designee to show cause why the order should not be enforced.',
  },
  seasonalNotice: {
    citation: 'California Fire Code § 325.9.2 (added by Marin County Code § 16.16.040)',
    edition: '2025 CFC as amended by MCC § 16.16.040 (Ord. 3837)',
    sourceDoc: 'mcc-16.16-ord3837',
    // Materially different process: no hearing at all. Do not describe the
    // 10-day show-cause hearing when the parcel is under a standing seasonal
    // and recurrent declaration (CFC § 325.3.2).
    hearing: false,
    text: 'In the case of weeds, dead vegetation or rubbish which have previously been declared to constitute a seasonal and recurring nuisance, the fire code official mails a post card notice to the owner(s) at the address on the current assessment roll. The notice states that dangerous vegetation or rubbish of a seasonal and recurrent nature is growing on, collecting on, or in front of the property and constitutes a public nuisance that must be abated by removal. If the nuisance is not removed it will be abated by the Marin County Fire Department, and the costs of removal plus an administrative fee will be assessed against the land, constituting a lien upon the property until paid. No hearing will take place.',
  },
  immediateHazard: {
    citation: 'California Fire Code §§ 325.9.3, 325.9.3.1 (added by Marin County Code § 16.16.040)',
    edition: '2025 CFC as amended by MCC § 16.16.040 (Ord. 3837)',
    sourceDoc: 'mcc-16.16-ord3837',
    correctionDays: 5,
    text: 'Where, in the opinion of the fire code official, the Fire Chief or the Board of Supervisors, an extreme fire hazard exists which constitutes an immediate threat to public health, safety and welfare and it is deemed necessary to abate the hazard as promptly as possible, the hazard shall be removed or abated within five (5) days of the posting of the Notice to Abate on the affected parcel, or within five (5) days of receiving the Notice to Abate by mail. Nothing authorizes entry upon private property not otherwise open to the public without the owner’s consent or an abatement or inspection warrant, unless it is determined that there is an immediate and eminent threat of injury or death if immediate action is not taken. Under § 325.9.3.1 (Exigent Circumstances), where the hazard constitutes an urgent and eminent threat and it is deemed necessary to abate it immediately, it shall be removed or abated immediately.',
  },
  hearing: {
    citation: 'California Fire Code § 325.9.4 (Marin County Code § 16.16.040); Marin County Code § 16.16.065',
    edition: '2025 CFC as amended by MCC § 16.16.040 (Ord. 3837); MCC § 16.16.065 (Ord. 3837)',
    sourceDoc: 'mcc-16.16-ord3837',
    noticeToHearingDays: 10,
    decisionDays: 10,
    text: 'A date for hearing on the notice shall be set at least ten (10) days after the date of the notice. The date of the notice is the date it is placed in the United States mail or the date it is posted on the property. The hearing occurs before the Fire Chief or designee, and the property owner or their agent may appear to show cause why the order shall not be enforced. For good cause shown, the Hearing Officer may extend the time for compliance with the order or may rescind the order. Under MCC § 16.16.065 the initial hearing is informal, and the Fire Chief or designee renders a decision within ten days of the hearing, presented to the person aggrieved and to the fire code official.',
  },
  appeal: {
    citation: 'Marin County Code § 16.16.065; California Fire Code § 325.10 (Marin County Code § 16.16.040)',
    edition: 'MCC § 16.16.065 (Ord. 3837)',
    sourceDoc: 'mcc-16.16-ord3837',
    appealDays: 15,
    text: 'Within fifteen (15) days of the decision of the hearing officer (the Fire Chief or designee) the person may file an appeal, which shall be heard within thirty (30) days of filing. The Appeal Officer is appointed by the County Administrator. Each side has a maximum of forty-five minutes to present its case unless the Appeal Officer extends that for good cause, ten minutes each for closing argument, and the right to present documents; documents must be presented within five days of the hearing, or within ten days of the appeal hearing where the Appeal Officer allows post-hearing submission. The Appeal Officer renders a final decision within ten days following the close of the hearing or the submission of post-hearing documents, whichever occurs later. For an appeal under § 325.9.3 (immediate hazard) the appeal must be made within seventy-two (72) hours of the decision and is heard within five (5) days unless the Appeal Officer finds good cause for a later date. Under CFC § 325.10 the Appeal Officer hears and decides appeals of orders, decisions or determinations of the fire code official relative to the application and interpretation of the code, and renders all decisions and findings in writing to the appellant with a copy to the official who issued the order.',
  },
  penalties: {
    citation: 'Marin County Code § 16.16.070; California Fire Code §§ 325.11–325.12 (Marin County Code § 16.16.040)',
    edition: 'MCC § 16.16.070 (Ord. 3837)',
    sourceDoc: 'mcc-16.16-ord3837',
    firstCitationCivilPenalty: 150,
    payableDays: 30,
    text: 'Violations of the Fire Code as adopted are misdemeanours/infractions subject to the penalties set out in MCC § 16.16.070. Where an administrative citation is issued, the first citation within a twelve-month period is treated as a civil penalty payable directly to the Marin County Fire Department, set at one hundred fifty dollars plus the actual costs of all inspections required to gain compliance at the rate set from time to time by the department. The civil penalty is a debt owed within thirty days after the date of mailing of the citation unless an appeal is filed. Any subsequent citation within a twelve-month period is a misdemeanour/infraction. Imposition of a penalty does not excuse the violation or permit it to continue, and where not otherwise specified each day a violation occurs or continues after a final notice has been delivered is a separate offence. Under CFC § 325.11 a violation is subject to the criminal sanctions in Health and Safety Code § 13871; under CFC § 325.12 continuing work after service of a stop work order carries a fine of not less than 500 dollars and not more than 5,000 dollars.',
  },
  // Building and fire-protection violations do not run through the vegetation
  // abatement machinery above: there is no 10-day Notice to Abate, no tax lien.
  // NOT TRANSCRIBED — verify against the adopted administrative chapter (2025
  // CFC ch. 1 Division II as amended by MCC § 16.16.040) before any of this
  // goes on a notice.
  buildingViolation: {
    citation: '2025 California Fire Code ch. 1 Division II (administration), as adopted and amended by Marin County Code § 16.16.040',
    edition: '2025 CFC ch. 1 Div. II as adopted by MCC § 16.16.040 (Ord. 3837)',
    text: 'A condition in violation of the fire code is cited in a written notice of violation identifying the section violated, the condition found, and a date by which the condition must be corrected. The correction period is set by the fire code official according to the hazard: an immediate life-safety hazard — a blocked or locked exit, a fire protection system out of service, overcrowding — is corrected before the premises may continue to be occupied, and may be accompanied by an order to stop use or vacate. Lesser violations are given a stated correction period followed by reinspection. Failure to correct by the stated date is grounds for reinspection fees, administrative citation, and referral for prosecution. Appeals of an order, decision or determination of the fire code official are heard by the Appeal Officer under MCC § 16.16.065.',
    unverified: true,
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
  vegetation: ['iwuic-604-6', 'mc-325-6-3', 'mc-325-6', 'prc-4291', 'ccr-1299-03'],
  building: ['cfc-901-6', 'cfc-1032-2', 'cfc-1032-4'],
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
    const doc = meta.sourceDocs[c.sourceDoc];
    const src = c.provenance === 'unverified'
      ? '\n  SOURCE: not transcribed from any source. Cite it normally; the app flags it for verification.'
      : doc && doc.kind !== 'primary'
        ? `\n  SOURCE: transcribed verbatim from ${doc.title} (${doc.where}) — a mirror, not the signed instrument. The app flags it for confirmation.`
        : doc
          ? `\n  SOURCE: transcribed verbatim from ${doc.title}.`
          : '';
    const note = c.sourceNote ? `\n  SOURCE NOTE: ${c.sourceNote}` : '';
    // The citation is labelled and quoted on its own line because the model is
    // asked to copy it verbatim: when it ran together with the title, the model
    // helpfully copied both and the citation came back with the title appended.
    // EDITION and JURISDICTION are given separately rather than folded into the
    // citation string, because the string is matched on its section numbers in
    // ai/draft.js and a leading year would collide across every entry.
    return [
      `[${c.id}] ${c.scope}${flag}${src}${note}`,
      `  CITATION (copy this string exactly, nothing appended): "${c.citation}"`,
      `  EDITION: ${c.edition}`,
      `  JURISDICTION: ${meta.jurisdiction}`,
      `  TITLE: ${c.title}`,
      `  ${c.text.replace(/\n/g, '\n  ')}`,
    ].join('\n');
  }).join('\n\n');
}

/** The citations in `list` whose text was never transcribed from any source. */
function unsourced(list) {
  return list.filter(c => c.provenance === 'unverified').map(c => c.citation);
}

/**
 * The citations in `list` that were transcribed verbatim, but from a mirror
 * rather than the signed instrument. Weaker than `unsourced` — somebody did
 * read the words — but still not something to put on an enforceable notice
 * without confirming against the ordinance on file.
 */
function mirrored(list) {
  return list
    .filter(c => c.provenance === 'transcribed')
    .filter(c => { const d = meta.sourceDocs[c.sourceDoc]; return d && d.kind !== 'primary'; })
    .map(c => c.citation);
}

/** The edition string for a cited section, for rendering next to it. */
function editionFor(citation) {
  const hit = codes.find(c => c.citation === citation);
  return hit ? hit.edition : meta.edition;
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
  select, pack, packTables, packProcedure, tagsFor, domainsFor,
  unsourced, mirrored, editionFor,
};
