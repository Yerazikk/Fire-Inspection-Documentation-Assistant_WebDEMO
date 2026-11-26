// FireGeo.codes: for a photo, a place and an assumed distance, the statewide rows, the local rows, a verdict per
// row and one overall verdict, plus the one-line difference between two pin states. No DOM. Needs window.FIREGEO_LAW
// (data/law.js) and window.FireExamples (examples/).
//
// Nothing about any one photograph is written here. The list of photographs, the rules that judge their rows and
// the reason under the verdict headline all come from the examples; this file is the machinery that runs them.
(function (root) {
'use strict';
const LAW = root.FIREGEO_LAW, EX = root.FireExamples;

const VERDICT = {
  red:    { word: 'Violation', shape: 'square' },
  yellow: { word: 'Inspector’s call', shape: 'triangle' },
  green:  { word: 'Compliant', shape: 'circle' },
};
const RANK = { green: 0, yellow: 1, red: 2 };
const DISTANCE = { min: 0, max: 150, step: 1, default: 20, unit: 'ft' };
// The photographs, in the order examples/index.js lists them: the tab strip and the phone's camera follow it.
const PHOTOS = EX.photos();
// The photograph decides which set of rows is read. Anything unknown falls back to the first one.
const photoId = id => (PHOTOS.some(p => p.id === id) ? id : PHOTOS[0].id);
const place = id => LAW.places[id] || LAW.places.marin;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- verdict rules
// Each returns { verdict, why }. `row` is the merged row (value, turns ...), `c` = { d, scope, zone, place }.
// scope is the Ross Valley answer ('in' | 'out' | 'unknown' the mapped zones). zone is Berkeley's, where the text
// is written for named zones: 'mitigation' | 'very-high' | 'high' | 'none' | 'unknown'.
//
// Only the two rules every example may use are here. A rule that reads one photograph's section belongs with that
// photograph, in examples/<id>/example.js, and is merged in below; two examples may not define the same name.
const SHARED_RULES = {
  // Which ordinance carries the state chapter. It is carried in all five places, so the row is not a finding
  // against the owner; it says which code the citation is written under, and what it was before 2026.
  carried(row) { return { verdict: 'green', why: row.was ? 'Carried here. Before 2026, the ' + row.was.value + '.' : 'Carried here, chapter 6 included.' }; },
  // Any row whose answer depends on a fact or a judgement the photograph cannot settle: `turns` says which.
  judgement(row) { return { verdict: 'yellow', why: 'Depends on ' + row.turns + '.' }; },
};
const RULES = Object.assign({}, SHARED_RULES, EX.rules());

function codeOf(key, placeId) { const k = (LAW.short[key] || {}).code; return !k ? '' : typeof k === 'string' ? k : (k[placeId] || ''); }
// A row is one definition (shared by every place that has it) plus what `by[place]` changes. A place may change the
// value, the words and the citation, and also the name, the section number, the rule that judges it and what it
// depends on (Berkeley does: the same meaning sits in a different section and is judged by zone).
function buildRow(def, layer, placeId, c) {
  const by = layer === 'local' ? def.by[placeId] : null;
  const row = {
    key: def.key, layer, label: (by && by.label) || def.label, title: (by && by.title) || def.title || def.label,
    sec: (by && by.sec) || (LAW.short[def.key] || {}).sec || '', code: (by && by.code) || codeOf(def.key, placeId),
    value: by && by.value != null ? by.value : (def.value != null ? def.value : null), unit: def.unit || '',
    cite: (by && by.cite) || def.cite || '',
    requires: (by && by.requires) || def.requires || '', applies: (by && by.applies) || def.applies || '',
    open: (by && by.open) || def.open || '', turns: (by && by.turns) || def.turns || '',
    was: (by && by.was) || null, extra: (by && by.extra) || '', source: (by && by.source) || def.source || null,
    phrase: def.phrase || null, quiet: (by && by.quiet) || def.quiet || null,
    brief: (by && by.brief) || null, citeShort: (by && by.citeShort) || null,       // the part of the text and of the citation the main view shows; null = all of it
  };
  const out = RULES[(by && by.rule) || def.rule](row, c);
  row.verdict = out.verdict; row.word = VERDICT[out.verdict].word; row.why = out.why;
  delete row.turns;
  return row;
}

// The reason under the verdict headline: five or six plain words, no citation. The example says it, because only
// the example knows what its finding turns on; a null from it (ladder, where the place carries nothing) falls
// through to the generic line, and so does an example that declares none.
function overallLine(photo, P, c, verdict, tally, rows) {
  const line = (EX.get(photo) || {}).law.overallLine;
  const said = typeof line === 'function' ? line(P, c, verdict, rows) : line || null;
  if (said) return said;
  if (!P.carried) return P.notCovered || (P.short + ' is not covered here.');
  return '';
}

function evaluate(q) {
  const photo = photoId(q.photo), P = place(q.place);
  const d = Math.max(DISTANCE.min, Math.min(DISTANCE.max, Math.round(q.distance == null ? DISTANCE.default : q.distance)));
  const scope = q.scope || 'unknown', zone = q.zone || null, c = { d, scope, zone, place: P.id }, defs = LAW.rows[photo];
  const state = defs.state.map(def => buildRow(def, 'state', null, { d, scope: 'unknown', zone: null, place: null }));
  const local = P.carried ? defs.local.filter(def => def.by[P.id]).map(def => buildRow(def, 'local', P.id, c)) : [];
  const all = state.concat(local), tally = { red: 0, yellow: 0, green: 0 };
  let worst = 'green', decidedBy = all.length ? all[0].key : '';
  all.forEach(r => { tally[r.verdict]++; });
  // the local row decides a tie, because it is the one that changes with the place
  local.concat(state).forEach(r => { if (RANK[r.verdict] > RANK[worst]) { worst = r.verdict; decidedBy = r.key; } });
  if (worst === 'green' && all.length) decidedBy = (local[0] || state[0]).key;
  const facts = [{ key: 'agency', label: 'Fire agency', value: P.agency, cite: P.agencyCite || '', was: null }];
  if (P.carried) {
    facts.push({ key: 'fire-code', label: 'Fire code', value: P.fireCode.value, cite: P.fireCode.cite, was: P.fireCode.was || null });
    facts.push({ key: 'wui-code', label: 'WUI code', value: P.wuiCode.value, cite: P.wuiCode.cite, was: null });
    facts.push({ key: 'zone', label: 'Mapped zone', value: q.hazardLabel || ({ in: 'In a mapped hazard zone', out: 'Outside the mapped zones', unknown: 'Not on the Ross Valley Fire map' })[scope], cite: P.zoneSource || 'Ross Valley Fire map', was: null });
  }
  return {
    photo, place: P.id, distance: d, scope, zone, carried: !!P.carried, placeInfo: P,
    state, stateNote: defs.stateNote || null, local, facts,
    overall: { verdict: worst, word: VERDICT[worst].word, tally, decidedBy, line: overallLine(photo, P, c, worst, tally, all) },
    sources: P.sources || [],
  };
}

// ---------------------------------------------------------------- the one-line difference
// What changed when the pin moved from one place to another: at most one short sentence, in plain words, with no
// citation and no history in it. '' when the place is the same (a change of mapped zone is said by the headline reason).
const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => (v[k] != null ? v[k] : ''));
function diff(q) {
  const photo = photoId(q.photo), A = place(q.from.place), B = place(q.to.place);
  if (A.id === B.id) return '';
  if (!B.carried) return B.onlyState || ('Only statewide rules for ' + B.short + '.');
  const To = cap(B.inSentence), Poss = To + '’s';
  // The map moved to its other region (Ross Valley <-> Berkeley): row-by-row arithmetic would miss the point, so the
  // place arrived in says its own rule. Berkeley's sentence is written out; the Ross Valley ones are filled in.
  if ((A.region || 'rossvalley') !== (B.region || 'rossvalley')) {
    if (B.across && B.across[photo]) return B.across[photo];
    // {reach} in a template is the ladder-fuel distance where the pin landed; only that example's sentence uses it.
    const ladder = LAW.rows.ladder || { local: [] };
    const reach = ((ladder.local.find(d => d.key === 'ladder-reach') || { by: {} }).by[B.id] || {}).value;
    return fill((LAW.across || {})[photo] || '', { To, toName: B.inSentence, reach });
  }
  if (!A.carried) return Poss + ' own rules apply.';
  let value = '', added = '', dropped = '', extra = '';
  LAW.rows[photo].local.forEach(def => {
    const x = def.by[A.id], y = def.by[B.id], name = def.diffName || def.label.toLowerCase();
    if (y && !x) { if (!added) added = To + ' adds a ' + name + ' rule.'; return; }
    if (x && !y) { if (!dropped) dropped = To + ' has no ' + name + ' rule.'; return; }
    if (!x || !y) return;
    if (!value && x.value != null && y.value != null && x.value !== y.value && def.say) value = fill(def.say, { Poss, To, to: y.value, from: x.value });
    if (!extra && x.exceptions != null && y.exceptions != null && x.exceptions !== y.exceptions && def.sayExtraChange) extra = fill(def.sayExtraChange, { Poss, To, to: y.exceptions, from: x.exceptions });
  });
  return value || added || dropped || extra || 'Same rules, under ' + B.inSentence + '’s own code.';
}

// Local § 603.3.1 names the fuel management zones. Used as the caption under the distance control.
function zoneFor(d) {
  if (d <= 5) return { id: 'zone0', label: 'Zone 0 · 0 to 5 ft' };
  if (d <= 30) return { id: 'zone1', label: 'Zone 1 · 5 to 30 ft' };
  if (d <= 100) return { id: 'zone2', label: 'Zone 2 · 30 to 100 ft' };
  return { id: 'beyond', label: 'Past 100 ft' };
}

root.FireGeo = root.FireGeo || {};
root.FireGeo.codes = { VERDICT, DISTANCE, PHOTOS, place, evaluate, diff, zoneFor, disclosure: LAW.disclosure, sources: LAW.sources };
})(typeof window !== 'undefined' ? window : globalThis);
