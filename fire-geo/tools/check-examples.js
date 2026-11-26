// node tools/check-examples.js            every example
// node tools/check-examples.js daisy       one of them
//
// The standard an example has to meet to be a good one, checked. This is the half of examples/README.md that can
// be mechanised: it will not tell you whether the law was read correctly, but it will tell you that a row has no
// source, that a question has no provenance, that a correction has no steps, that the scan points at an
// annotation that is not there, or that a picture is missing from disk.
//
// Exit 0 and "ready" when an example passes. A GAP has to be filled before it ships. A note is allowed but worth
// a look. A todo is a gap that is already known and written down in ACCEPTED below, with the reason it is still
// open: it does not fail the run, and nothing may be added to that list without a reason beside it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));

// ---------------------------------------------------------------- load everything the way a page does
const w = {}, ctx = vm.createContext({ window: w, globalThis: w, console, Proxy });
const run = f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
for (const f of ['data/jurisdictions.js', 'data/lawbase.js', 'examples/registry.js', 'examples/common.js', 'examples/index.js']) run(f);
for (const f of w.FireExamples.files()) run(f);
for (const f of ['data/content.js', 'data/hazard.js', 'data/city4/law.js', 'data/city4/boundary.js', 'data/city4/zones.js',
  'data/law.js', 'data/outlines.js', 'lib/geo.js', 'lib/codes.js', 'lib/emphasis.js', 'lib/solutions.js',
  'team/adapter.js', 'team/flow.js', 'team/drafts.js']) run(f);
const EX = w.FireExamples, LAW = w.FIREGEO_LAW, codes = w.FireGeo.codes, solutions = w.FireGeo.solutions;
const OUT = w.FIREGEO_OUTLINES || {};
const PLACES = ['ross', 'san_anselmo', 'fairfax', 'marin'];

// Gaps that are known, deliberate and already recorded. Each needs a reason, and a reason that will come to an
// end: "we have not written it yet" is one, "it does not apply to this photograph" means the check is wrong and
// belongs here as neither.
const ACCEPTED = {
  // The fire-door record was built from one supplied photograph and never carried as far as the other three: the
  // analysis stops after the risk section and there is no closing summary. Writing either means new prose about
  // a real fire door, which is the inspector's to write, not this repo's to invent.
  firedoor: ['content.analysis: at least three sections', 'content.final: the summary rows of the record'],
};

let gaps = 0, notes = 0, todos = 0, checked = 0;
let id = '';
const gap = (what, detail) => {
  if ((ACCEPTED[id] || []).includes(what)) { todos++; console.log('  todo  ' + what + '  [known, see ACCEPTED in this file]'); return; }
  gaps++; console.log('  GAP   ' + what + (detail ? '  [' + detail + ']' : ''));
};
const note = (what, detail) => { notes++; console.log('  note  ' + what + (detail ? '  [' + detail + ']' : '')); };
const need = (cond, what, detail) => { checked++; if (!cond) gap(what, detail); };
const want = (cond, what, detail) => { checked++; if (!cond) note(what, detail); };
const onDisk = p => fs.existsSync(path.join(ROOT, p));
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------- the checks
function check(ex) {
  id = ex.id;
  console.log('\n' + id + '  —  ' + (ex.title || '(no title)'));

  // ---- 1. the photograph
  need(/^[a-z][a-z0-9]*$/.test(ex.id), 'the id is one lower-case word', ex.id);
  need(ex.tab && words(ex.tab) <= 3, 'a tab name of three words at most', ex.tab);
  need(!!ex.title, 'a title: what the photograph shows, in a few words');
  need(!!ex.photo && onDisk(ex.photo), 'the photograph is on disk', ex.photo);
  need(typeof ex.aspect === 'number' && ex.aspect > 0, 'aspect is the picture\'s width / height', String(ex.aspect));
  need(typeof ex.zoom === 'number' && ex.zoom >= 5 && ex.zoom <= 40, 'zoom: how far the phone pulls back (5 to 40)', String(ex.zoom));
  need(typeof ex.usesDistance === 'boolean', 'usesDistance is said either way');

  // ---- 2. the inspection record
  const c = ex.content || {};
  for (const k of ['tab', 'title', 'status', 'photo', 'aspect', 'summary', 'primary', 'note', 'annotationCaption'])
    need(!!c[k], 'content.' + k + ' is written');
  need(c.photo === ex.photo, 'content.photo is the same picture as the manifest', c.photo + ' vs ' + ex.photo);
  need(Array.isArray(c.meta) && c.meta.length >= 3, 'content.meta: at least three lines of inspection detail');
  const ann = c.annotations || [];
  need(ann.length >= 2, 'at least two annotations: the finding, and what is beside it');
  need(ann.filter(a => a.tone === 'red').length === 1, 'exactly one annotation is the finding (tone: red)', ann.filter(a => a.tone === 'red').length + ' are');
  ann.forEach((a, i) => {
    need(Array.isArray(a.box) && a.box.length === 4 && a.box.every(n => typeof n === 'number' && n >= 0 && n <= 100),
      'annotation ' + i + ' box is [left, top, width, height] in percent');
    need(!!a.label && !!a.note, 'annotation ' + i + ' has a label and a note');
  });
  const sols = c.solutions || [];
  need(sols.length >= 1, 'at least one correction');
  need((sols[0] || {}).badge === 'required', 'the first correction is the inspector\'s own (badge: required)');
  sols.forEach(sn => {
    for (const k of ['id', 'title', 'lede', 'plain', 'where', 'change', 'keep', 'why'])
      need(!!sn[k], 'correction ' + sn.id + ': ' + k + ' is written');
    need(Array.isArray(sn.how) && sn.how.length >= 2, 'correction ' + sn.id + ': how, in at least two steps');
    need(sn.badge === 'required' || !!sn.limit, 'correction ' + sn.id + ': an alternative says its limit');
  });
  need(Array.isArray(c.analysis) && c.analysis.length >= 3, 'content.analysis: at least three sections');
  const o = c.owner || {};
  for (const k of ['title', 'sub', 'intro', 'todo', 'keep', 'when'])
    need(!!o[k], 'owner.' + k + ' is written');
  need(Array.isArray(o.qa) && o.qa.length >= 4, 'the owner\'s page answers at least four questions');
  (o.qa || []).forEach(q => need(!!q.q && Array.isArray(q.a) && q.a.length >= 1, 'every owner question has an answer', q.q));
  need(Array.isArray(c.uncertainty) && c.uncertainty.length >= 4, 'at least four open questions in content.uncertainty');
  (c.uncertainty || []).forEach(u => need(Array.isArray(u) && u.length === 3, 'each uncertainty is [question, what is known, what to settle]', String(u && u[0])));
  need(Array.isArray(c.final) && c.final.length >= 4, 'content.final: the summary rows of the record');

  // ---- 3. the law
  const law = ex.law || {};
  need((law.state || []).length + (law.local || []).length >= 1, 'at least one code row');
  need(!!law.overallLine, 'overallLine: the reason under the verdict, five or six plain words');
  need(!!law.across, 'across: one sentence for when the map moves to the other region');
  const allRows = (law.state || []).concat(law.local || []);
  allRows.forEach(def => {
    const where = 'row ' + def.key;
    need(!!def.key && !!def.label && !!def.rule, where + ': key, label and rule');
    need(!!(law.short || {})[def.key] || Object.keys(def.by || {}).every(p => (def.by[p] || {}).sec),
      where + ': a one-line form in law.short, or a sec on every place');
    if (def.by) need(Object.keys(def.by).length >= 1, where + ': `by` names at least one place');
    const faces = def.by ? Object.keys(def.by).map(p => Object.assign({}, def, def.by[p])) : [def];
    faces.forEach(f => {
      need(!!f.requires && f.requires.length > 40, where + ': the requirement in the code\'s own words');
      need(!!f.applies, where + ': how it applies to THIS photograph');
      need(!!f.source && ['read', 'blocked', 'repo'].includes((f.source || {}).status), where + ': a source with a status');
    });
    if (def.rule === 'judgement') need(!!def.turns || Object.keys(def.by || {}).some(p => (def.by[p] || {}).turns),
      where + ': a judgement row says what it turns on (`turns`)');
  });
  want((law.emphasis || ex.emphasis || []).length > 0, 'no key phrases marked in the quoted text (`emphasis`)');

  // Every rule a row names has to exist, here or among the shared two, or nothing below can run.
  const KNOWN = Object.keys(EX.rules()).concat(['judgement', 'carried']);
  let rulesOk = true;
  allRows.forEach(def => {
    const names = [def.rule].concat(Object.keys(def.by || {}).map(pl => (def.by[pl] || {}).rule)).filter(Boolean);
    names.forEach(n => { checked++; if (!KNOWN.includes(n)) { rulesOk = false; gap('row ' + def.key + ': no such verdict rule "' + n + '"'); } });
    if (!def.rule) rulesOk = false;
  });

  // every verdict this example can produce, through the real machinery
  let rows = 0, yellows = 0;
  if (!rulesOk) note('the verdicts and the field answers were not driven: fix the rows above first');
  else {
  for (const place of PLACES.concat(['san_rafael', 'berkeley'])) for (const scope of ['in', 'out', 'unknown']) for (const d of [3, 20, 60, 120]) {
    const ev = codes.evaluate({ photo: ex.id, place, scope, distance: d, zone: place === 'berkeley' ? 'mitigation' : null });
    const line = ev.overall.line;
    need(words(line) <= 6 && !/§|Ord\.|20\d\d/.test(line), 'the reason under the verdict is six words at most, with no citation', line);
    for (const r of ev.state.concat(ev.local)) {
      rows++;
      need(!!r.verdict && !!r.why, 'row ' + r.key + ' gets a verdict and a reason at ' + place);
      need(r.why.length <= 70, 'row ' + r.key + ': the reason is 70 characters at most', r.why);
      need(!/—/.test(r.why + r.requires + r.applies + r.label + r.cite), 'row ' + r.key + ': nothing uses an em dash');
      if (r.verdict === 'yellow') { yellows++; need(/[Dd]epends on|[Tt]urns on/.test(r.why), 'yellow row ' + r.key + ' says what it depends on', r.why); }
      if (r.value != null) need(Array.isArray(r.phrase) && r.phrase.length === 2, 'row ' + r.key + ' has a value, so it needs the phrase that ties it to the name');
    }
  }
  const stateRows = JSON.stringify(codes.evaluate({ photo: ex.id, place: 'ross', scope: 'in', distance: 20 }).state);
  need(stateRows === JSON.stringify(codes.evaluate({ photo: ex.id, place: 'san_rafael', scope: 'unknown', distance: 3 }).state),
    'the statewide rows read the same in every place');
  }

  // ---- 4. the field app
  const field = ex.field || {};
  need(!!(field.reading || {}).text, 'field.reading.text: what the app thinks is being reported');
  need(((field.reading || {}).alternatives || []).length >= 1, 'field.reading offers at least one other reading');
  need(!!(field.reading || {}).source, 'field.reading names its source in the content');
  const scan = field.scan || [];
  need(scan.length >= 1 && scan.length <= 3, 'the scan lights between one and three things', String(scan.length));
  need(scan.filter(s => s.finding).length === 1, 'exactly one of them is the finding');
  scan.forEach(s => {
    need(typeof s.ix === 'number' && !!ann[s.ix], 'the scan points at an annotation that exists (ix ' + s.ix + ')');
    need(!('box' in s), 'the scan reads its region from the annotation, never its own box');
    need(!!s.label, 'each scan mark has a label in plain words');
  });
  need((scan.find(s => s.finding) || {}).ix === ann.findIndex(a => a.tone === 'red'), 'the scan\'s finding is the red annotation');
  const seen = field.seen || [];
  need(seen.length >= 2, 'field.seen: at least two readings the app fills in itself');
  seen.forEach(s => {
    need(!!s.id && !!s.label, 'reading ' + s.id + ': an id and a label');
    need((s.options || []).length >= 2, 'reading ' + s.id + ': the app\'s own reading first, and something to change it to');
    need(!!s.source, 'reading ' + s.id + ': where it comes from');
  });
  const qs = field.questions || [];
  need(qs.length <= 3, 'at most three questions on the one screen', String(qs.length));
  want(qs.length >= 1, 'no questions at all: allowed, but is there really nothing only the person there knows?');
  qs.forEach(q => {
    need(!!q.id && !!q.ask, 'question ' + q.id + ': an id and the question itself');
    need(/\?$/.test(q.ask || ''), 'question ' + q.id + ' ends in a question mark', q.ask);
    need(!!q.options || !!q.entry || !!q.write, 'question ' + q.id + ': something to tap, type or write');
    need(!!q.cant, 'question ' + q.id + ': a way out for someone who cannot tell');
    need(!!q.source, 'question ' + q.id + ': where it comes from, and why it is asked');
  });
  need(typeof field.facts === 'function', 'field.facts: the answers as plain facts for the rows');
  need(typeof field.callouts === 'function', 'field.callouts: what the senior inspector should act on');
  need(typeof field.apply === 'function', 'field.apply: what those answers do to the rows');

  // the field app, driven: no answer at all, then each question answered each way
  const combos = [{}].concat(...qs.map(q => ((q.options || []).concat(q.cant ? [q.cant] : [])).map(opt => ({ [q.id]: { pick: opt.id } }))));
  for (const answers of (rulesOk ? combos : [])) {
    const f = w.TeamFlow.facts(ex.id, answers, {});
    const outs = w.TeamFlow.callouts(ex.id, f, new Date().getFullYear());
    need(Array.isArray(outs) && outs.length >= 1, 'every set of answers produces at least one callout', JSON.stringify(answers));
    outs.forEach(x => {
      need(!!x.short && !!x.text, 'each callout has a short line and a full sentence');
      need(x.short.length <= 90, 'the short line stays short (90 characters)', x.short);
      need(!/undefined|NaN|null/.test(x.short + x.text), 'no callout leaks undefined into its words', x.short);
    });
  }

  // ---- 5. the owner's steps and the corrections' pictures
  const steps = ex.ownerSteps || {};
  sols.forEach(sn => {
    const list = steps[sn.id] || [];
    need(list.length >= 3, 'correction ' + sn.id + ': at least three numbered steps for the owner');
    list.forEach((s, i) => {
      need(Array.isArray(s) && s.length === 2 && !!s[0] && !!s[1], 'correction ' + sn.id + ' step ' + (i + 1) + ': the step and where it comes from');
      need(words(s[0]) <= 45, 'correction ' + sn.id + ' step ' + (i + 1) + ' is one plain instruction', s[0]);
      need(!/§|NFPA|CFC/.test(s[0] || ''), 'the owner\'s steps carry no section numbers', s[0]);
    });
  });
  for (const s of solutions.list(ex.id)) {
    need(onDisk(s.before), 'correction ' + s.id + ': the before picture is on disk', s.before);
    need(onDisk(s.after), 'correction ' + s.id + ': the after picture is on disk', s.after);
    const o2 = OUT[ex.id + '-' + s.id];
    if (!o2) want(false, 'correction ' + s.id + ': no contour in data/outlines.js, so "Show what changed" is hidden for it');
    else {
      need((o2.contours || []).length >= 1, 'correction ' + s.id + ': the contour has at least one shape');
      need(!!o2.fit, 'correction ' + s.id + ': the outline says how it was arrived at (fit)');
      if ((o2.fit.how || '') === '') need(o2.fit.rmsPx <= 0.6, 'correction ' + s.id + ': a registered pair fits to 0.6 px', String(o2.fit.rmsPx));
      s.outline.forEach(cn => {
        need(cn.points.length >= 6 && cn.points.length <= 16, 'correction ' + s.id + ': the drawn shape is 6 to 16 points', String(cn.points.length));
        need(cn.points.every(p => p[0] >= 0 && p[0] <= 1 && p[1] >= 0 && p[1] <= 1), 'correction ' + s.id + ': the shape is inside the picture');
        need(!!cn.label, 'correction ' + s.id + ': the shape is labelled');
      });
    }
  }

  if (rulesOk) console.log('  ' + rows + ' rows judged, ' + yellows + ' of them the inspector\'s call; ' + combos.length + ' sets of field answers');
}

// ---------------------------------------------------------------- run
const list = EX.all().filter(e => !only.length || only.includes(e.id));
if (!list.length) { console.log('no such example: ' + only.join(', ') + '\nthere are: ' + EX.ids().join(', ')); process.exit(1); }
console.log('checking ' + list.length + ' of ' + EX.ids().length + ' examples against examples/README.md');
for (const ex of list) check(ex);

// the pipeline's own joints, once
console.log('\nthe pipeline');
id = '';
need(EX.ids().length === new Set(EX.ids()).size, 'no two examples share an id');
need(Object.keys(w.CONTENT).join() === EX.ids().join(), 'window.CONTENT carries every example, in tab order');
need(codes.PHOTOS.map(p => p.id).join() === EX.ids().join(), 'the tab strip is the example list, in order');
need(Object.keys(LAW.rows).join() === EX.ids().join(), 'every example has a row set');
if (w.TeamData) need(w.TeamData.scenes().every(s => EX.has(s)), 'the phone only offers examples that exist');
for (const e of EX.all()) for (const k of Object.keys(e.law.rules || {}))
  need(!['judgement', 'carried'].includes(k), 'an example does not redefine a shared rule name (' + k + ')');

console.log('\n' + checked + ' checks · ' + gaps + ' gaps · ' + todos + ' known todos · ' + notes + ' notes');
console.log(gaps ? '\nnot ready: fill the gaps above.' : '\nready.');
process.exit(gaps ? 1 : 0);
