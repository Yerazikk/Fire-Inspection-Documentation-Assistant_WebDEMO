// The places, the documents they were read in, and the local code that carries each section. Everything here is
// shared by every example; what one photograph alone is judged by lives in examples/<id>/example.js.
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
//
// An example that cites a document no row cites yet adds it to SRC below, with its status, and nowhere else.
window.FIREGEO_LAWBASE = (function () {
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

// Short citations for the one-line rows: the local code that carries a section (this is the part that changes at a
// town line). Each example's `law.short` names which of these its rows use. The full citation stays on each row.
const WUI = { ross: 'RMC ch. 14.16', san_anselmo: 'SAMC § 3-3.1002', fairfax: 'FMC § 8.06.011', marin: 'MCC § 16.16.060' };
const FIRE = { ross: 'RMC § 14.04.100', san_anselmo: 'SAMC § 3-3.810', fairfax: 'FMC § 8.04.100', marin: 'MCC § 16.16.040' };
const PEN = { ross: 'RMC § 14.04.140', san_anselmo: 'SAMC § 3-3.812', fairfax: 'FMC § 8.04.100', marin: 'MCC § 16.16.040' };

const disclosure = 'A demonstration. Each verdict is this app’s reading of the cited text, and the inspector decides. Yellow rows are judgement calls: inspectors may read them differently.';

return { sources: SRC, places, WUI, FIRE, PEN, disclosure };
})();
