// examples/registry.js — the one list of worked examples, and the tables the rest of the app reads from it.
//
// An "example" is one photograph carried all the way through the product: what the inspector found, the code it is
// judged by, what the phone asks in the field, what the senior inspector's desk starts from, and the corrections.
// Before this file each of those lived in a different module and adding a fifth photograph meant finding eleven
// places. Now one file under examples/<id>/ holds all of it and the modules below read it:
//
//   lib/codes.js      photos()  rules()  overallLine()        the tabs, the verdict rules, the headline reason
//   data/law.js       lawRows()  lawShort()  lawAcross()      the code rows, keyed by photograph
//   data/content.js   content()                               window.CONTENT, the inspection records
//   lib/emphasis.js   phrases()                               the key portions marked in a quoted requirement
//   team/flow.js      table('reading'|'scan'|'seen'|'questions'), facts(), callouts()
//   team/adapter.js   apply()                                 what the field inspector's answers do to a row
//   team/drafts.js    ownerSteps()                            the owner's numbered steps per correction
//   team/phone.js     get(id).zoom                            how far the cropped photograph is pulled back
//
// Nothing here holds a word of law, a verdict or a correction. It only collects and hands on what the examples say.
// examples/README.md is the process for adding one; tools/check-examples.js is the standard it has to meet.
(function (root) {
'use strict';

const byId = {}, order = [];

/** Register one example. Called once by each examples/<id>/example.js, in the order examples/index.js loads them. */
function define(ex) {
  if (!ex || !ex.id) throw new Error('examples: an example must have an id');
  if (byId[ex.id]) throw new Error('examples: two examples share the id "' + ex.id + '"');
  ex.law = ex.law || {}; ex.field = ex.field || {};
  byId[ex.id] = ex; order.push(ex.id);
  return ex;
}

const ids = () => order.slice();
const all = () => order.map(id => byId[id]);
const get = id => byId[id] || null;
const has = id => !!byId[id];

// ---------------------------------------------------------------- the tables the app reads
/** lib/codes.js PHOTOS: one entry per example, in order. The tab strip and the phone's camera follow this list. */
const photos = () => all().map(e => ({
  id: e.id, tab: e.tab, title: e.title, finding: (e.content || {}).title || '',
  photo: e.photo, aspect: e.aspect, usesDistance: !!e.usesDistance,
}));

/** window.CONTENT: the inspection record of every example, keyed by id (data/content.js binds it). */
const content = () => { const o = {}; for (const e of all()) o[e.id] = e.content; return o; };

/** data/law.js `rows`: the code rows of every example, keyed by photograph. */
const lawRows = () => {
  const o = {};
  for (const e of all()) o[e.id] = { state: e.law.state || [], stateNote: e.law.stateNote || '', local: e.law.local || [] };
  return o;
};
/** data/law.js `short`: the section number and the local code that carries it, for the one-line rows. */
const lawShort = () => Object.assign({}, ...all().map(e => e.law.short || {}));
/** data/law.js `across`: what to say when the map moves to the other region, per photograph. */
const lawAcross = () => { const o = {}; for (const e of all()) if (e.law.across) o[e.id] = e.law.across; return o; };
/** lib/codes.js RULES: the verdict rules the examples' rows name. Two examples must not define the same rule name. */
function rules() {
  const o = {};
  for (const e of all()) for (const k of Object.keys(e.law.rules || {})) {
    if (o[k]) throw new Error('examples: two examples define the verdict rule "' + k + '"');
    o[k] = e.law.rules[k];
  }
  return o;
}
/** lib/emphasis.js: the key phrases of this example's quoted text, in no particular order. */
const phrases = () => [].concat(...all().map(e => e.emphasis || []));

// ---------------------------------------------------------------- the inspector side
/** One of the phone's four content tables (reading, scan, seen, questions), keyed by example id. */
const table = key => { const o = {}; for (const e of all()) if (e.field[key] != null) o[e.id] = e.field[key]; return o; };
/** team/flow.js facts(): the phone's answers as plain facts for the code rows. {} when the example has no hook. */
const facts = (id, answers, changes, helpers) => { const f = get(id); return f && f.field.facts ? f.field.facts(answers || {}, changes || {}, helpers || {}) || {} : {}; };
/** team/flow.js callouts(): the one or two things the senior inspector should act on. [] when there is no hook. */
const callouts = (id, f, ctx) => { const e = get(id); return e && e.field.callouts ? e.field.callouts(f || {}, ctx || {}) || [] : []; };
/** team/adapter.js: what the field inspector's answers do to this example's rows. Mutates through ctx. */
const apply = (id, f, ctx) => { const e = get(id); if (e && e.field.apply) e.field.apply(f || {}, ctx); };
/** team/drafts.js OWNER_STEPS: the owner's numbered steps, per correction, keyed by example id. */
const ownerSteps = () => { const o = {}; for (const e of all()) if (e.ownerSteps) o[e.id] = e.ownerSteps; return o; };

// ---------------------------------------------------------------- loading
// The ids, in the order the tabs show them. examples/index.js sets this and pulls each file in; the node suites
// (test.js, team/test.js, team/api.js) read files() instead and run them in their own context.
let IDS = [];
const setIds = list => { IDS = list.slice(); return IDS; };
const files = () => IDS.map(id => 'examples/' + id + '/example.js');

root.FireExamples = {
  define, ids, all, get, has,
  photos, content, lawRows, lawShort, lawAcross, rules, phrases,
  table, facts, callouts, apply, ownerSteps,
  setIds, files, get IDS() { return IDS.slice(); },
};
})(typeof window !== 'undefined' ? window : globalThis);
