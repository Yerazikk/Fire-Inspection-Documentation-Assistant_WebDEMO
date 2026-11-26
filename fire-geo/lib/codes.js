// FireGeo.codes: for a photo, a place and an assumed distance, the statewide rows, the local rows, a verdict per
// row and one overall verdict, plus the one-line difference between two pin states. No DOM. Needs window.FIREGEO_LAW
// (data/law.js) and window.CONTENT (data/content.js). The rules below read only what the cited rows say.
(function (root) {
'use strict';
const LAW = root.FIREGEO_LAW, CONTENT = root.CONTENT || {};

const VERDICT = {
  red:    { word: 'Violation', shape: 'square' },
  yellow: { word: 'Inspector’s call', shape: 'triangle' },
  green:  { word: 'Compliant', shape: 'circle' },
};
const RANK = { green: 0, yellow: 1, red: 2 };
const DISTANCE = { min: 0, max: 150, step: 1, default: 20, unit: 'ft' };
const PHOTOS = [
  { id: 'ladder', tab: 'Ladder fuel', title: 'Ladder fuel under a canopy', finding: (CONTENT.ladder || {}).title || '', photo: 'assets/ladderfuel.jpg', aspect: 820 / 1474, usesDistance: true },
  { id: 'sprinkler', tab: 'Sprinkler', title: 'Painted sprinkler head', finding: (CONTENT.sprinkler || {}).title || '', photo: 'assets/sprinkler.png', aspect: 428 / 710, usesDistance: false },
  { id: 'daisy', tab: 'Wires', title: 'Power strip in a power strip', finding: (CONTENT.daisy || {}).title || '', photo: 'assets/daisychain.jpg', aspect: 1086 / 1448, usesDistance: false },
  { id: 'firedoor', tab: 'Fire door', title: 'Fire door held open by a wedge', finding: (CONTENT.firedoor || {}).title || '', photo: 'assets/firedoor.png', aspect: 576 / 762, usesDistance: false },
];
// The photograph decides which set of rows is read. Anything unknown falls back to the first one.
const photoId = id => (PHOTOS.some(p => p.id === id) ? id : PHOTOS[0].id);
const place = id => LAW.places[id] || LAW.places.marin;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- verdict rules
// Each returns { verdict, why }. `row` is the merged row (value, turns ...), `c` = { d, scope, zone, place }.
// scope is the Ross Valley answer ('in' | 'out' | 'unknown' the mapped zones). zone is Berkeley's, where the text
// is written for named zones: 'mitigation' | 'very-high' | 'high' | 'none' | 'unknown'.
const inVeryHigh = z => z === 'mitigation' || z === 'very-high';     // the two mitigation areas lie inside the Very High zone
const noZone = z => z == null || z === 'unknown';
const RULES = {
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
  // California Fire Code § 901.6: the inspector confirmed the painted head and specified replacement.
  maintenance() { return { verdict: 'red', why: 'Inspector confirmed the head is painted. It must be replaced.' }; },
  // 2025 CFC § 603.5.2: a tap goes into a permanently installed receptacle, and another tap is not one. The
  // photograph shows the connection itself, so this is as settled as the painted head — the two exceptions
  // (a Group A or B meeting room, a 90-day test) are facts about the room, and they sit in the row's `open`.
  tapDirect() { return { verdict: 'red', why: 'One power tap is plugged into another. Confirmed.' }; },
  // 2025 CFC § 705.2: a fire door is not to be blocked, obstructed or otherwise made inoperable. The wedge under
  // the leaf is in the photograph, so this is as settled as the painted head and the chained taps. What the door
  // does once the wedge is out is a different section, and that row is a judgement.
  doorBlocked() { return { verdict: 'red', why: 'A wedge holds this fire door open. Confirmed.' }; },
  // Which ordinance carries the state chapter. It is carried in all five places, so the row is not a finding
  // against the owner; it says which code the citation is written under, and what it was before 2026.
  carried(row) { return { verdict: 'green', why: row.was ? 'Carried here. Before 2026, the ' + row.was.value + '.' : 'Carried here, chapter 6 included.' }; },
  // Any row whose answer depends on a fact or a judgement the photograph cannot settle: `turns` says which.
  judgement(row) { return { verdict: 'yellow', why: 'Depends on ' + row.turns + '.' }; },

  // ---- Berkeley WUI Code (BMC ch. 19.49), read in data/city4/law.js. § 604.3.1 is written for "the locally
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
};

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

// The reason under the verdict headline: five or six plain words, no citation.
function overallLine(photo, P, c, verdict, tally, rows) {
  if (photo === 'sprinkler') return 'A painted head must be replaced.';
  if (photo === 'daisy') return 'A tap fed from a tap.';
  if (photo === 'firedoor') return 'A fire door wedged open.';
  if (!P.carried) return P.notCovered || (P.short + ' is not covered here.');
  if (P.zoneModel === 'berkeley') {                    // Zone 0 to 5 ft (mitigation areas), Zone 1 to 30 ft, Zone 2 to 100 ft, all in the Very High zone
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
    const reach = ((LAW.rows.ladder.local.find(d => d.key === 'ladder-reach') || { by: {} }).by[B.id] || {}).value;
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
