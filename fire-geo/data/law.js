// The code rows this page shows, keyed by meaning, collected from the examples and joined to the fifth place.
//
// The rows themselves live with the photograph they judge, in examples/<id>/example.js, next to that example's
// content, its field questions and its owner steps. The shared half — the places, the documents they were read
// in, the local code that carries each section — is in data/lawbase.js. This file is the join: it collects what
// the examples declare, adds Berkeley's rows to the ones they match by meaning, and hands the lot to lib/codes.js.
//
// Load order: data/lawbase.js, the three data/city4 files, examples/*, then this. Read NOTES.md for the law
// itself and examples/README.md for how a row is written.
window.FIREGEO_LAW = (function () {
'use strict';
const W = typeof window !== 'undefined' ? window : globalThis;
const BASE = W.FIREGEO_LAWBASE, EX = W.FireExamples;
const SRC = BASE.sources, places = BASE.places, disclosure = BASE.disclosure;

// ------------------------------------------------------------------ rows, collected from the examples
// One definition per MEANING. `by` holds what differs per place; anything not in `by[place]` is shared.
// `rule` names a verdict rule the example defines. `say` builds the one-line difference when a value changes.
// Placeholders: {To} {From} = place names at the start of a sentence · {toName} {fromName} = mid-sentence ·
// {to} {from} = the two values · {was} {until} = the earlier value and its last day.
const rows = EX.lawRows();
// Short citations for the one-line rows: the section number (the same in every town) and the local code that
// carries it (this is the part that changes at a town line). The full citation stays on each row as `cite`.
const short = EX.lawShort();
// One plain sentence when the map moves between the two regions, per photograph.
const across = EX.lawAcross();

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
  // Whichever photographs the researcher wrote Berkeley rows for, and that are still carried as examples.
  for (const photo of Object.keys(C4.rows)) {
    if (!rows[photo]) continue;
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
