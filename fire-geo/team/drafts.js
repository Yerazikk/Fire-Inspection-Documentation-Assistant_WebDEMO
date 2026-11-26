// team/drafts.js: the words the senior inspector's drafting desk starts from, and the guard on rewritten words.
// Loaded by the page (window.TeamDrafts) and by team/api.js in node, so both sides use one copy.
//
//   build(CONTENT, tidy)  the drafts prepared from the source files: the problem in plain language, the owner's
//                         numbered steps per correction, the technical wording, the timeframe, the grounding text.
//                         The steps themselves are written with their photograph (examples/<id>/example.js).
//   guard(reply, allowed) strips any sentence that carries a section number, a measurement, a number or a deadline
//                         that is not in the supplied material. Runs on the server before a model reply reaches the page.
//   builtin(...)          a small rewrite with no model behind it: shorten, simplify, add what stays, add where to look.
//                         Used when the local AI cannot be reached, and by the test switch.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TeamDrafts = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const sentences = t => String(t || '').split(/(?<=[.!?]["”’)]?)\s+(?=[A-Z“"‘(0-9])/).map(s => s.trim()).filter(Boolean);
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // ---------------------------------------------------------------- prepared owner steps
  // Written for someone who has never heard the term "ladder fuel". Each step is one concrete action and says
  // where to stop or what must stay; the second item is where the step comes from in that example's content.
  // They live with their photograph, in examples/<id>/example.js under `ownerSteps`, keyed by correction id.
  const ownerStepsFor = scene => {
    const EX = (typeof window !== 'undefined' ? window : globalThis).FireExamples;
    const all = EX ? EX.ownerSteps() : {};
    return all[scene] || {};
  };

  function build(C, tidy) {
    tidy = tidy || strip;
    const T = s => tidy(strip(s));
    const sol = (scene, sid) => ((C[scene] || {}).solutions || []).find(s => s.id === sid) || null;
    const blockAfter = (scene, heading) => {
      for (const sec of (C[scene].analysis || [])) { const b = sec.blocks || []; const i = b.findIndex(x => x.t === 'h' && x.v === heading); if (i >= 0 && b[i + 1]) return b[i + 1]; }
      return null;
    };
    const meta = (scene, key) => { const m = (C[scene].meta || []).find(x => x[0] === key); return m ? T(m[1]) : ''; };

    /** the timeframe, exactly as far as the sources state it */
    function deadline(scene) {
      const o = C[scene].owner || {}, when = T(o.when || ''), days = (when.match(/(\d+)\s*days?/) || [])[1];
      const b = blockAfter(scene, 'Compliance deadline');
      const internal = b ? T(b.v) : (meta(scene, 'Compliance deadline') || meta(scene, 'Referenced timeframe'));
      const resident = days ? 'Within ' + days + ' days. Follow the deadline on your official inspection notice.' : when;
      const sentence = days ? 'Do this within ' + days + ' days. Follow the deadline on your official inspection notice.' : when.replace(/^By /, 'Do this by ');
      return { resident, sentence, internal, tag: 'verify' };
    }

    /** "The problem, in plain language": assembled from the owner report in content.js, sentence by sentence */
    function problem(scene) {
      const o = C[scene].owner || {}, parts = [];
      const add = (text, source) => { if (text) parts.push({ text: T(text), source }); };
      add(o.intro, 'owner.intro');
      const why = (o.qa || []).find(q => /dangerous/i.test(q.q));
      if (why && why.a[1]) add(why.a[1], 'owner.qa "Why is this dangerous?"');
      add(o.todo, 'owner.todo');
      if (o.dont) add(o.dont, 'owner.dont');
      add(o.keep, 'owner.keep');
      add(deadline(scene).sentence, 'owner.when');
      return { text: parts.map(p => p.text).join(' '), parts };
    }

    /**
     * The owner's numbered steps for one correction, with the lines the place's code rows and the field
     * inspector's answers call for. The owner's page shows the first four, so anything the field inspector
     * has actually found is put among them and the conditional line it answers is taken out.
     */
    function ownerSteps(scene, sid, rows, facts) {
      const list = ((ownerStepsFor(scene))[sid] || []).map(x => ({ text: x[0], source: x[1] })), f = facts || {};
      if (scene === 'sprinkler' && sid === 'a' && (rows || []).some(r => r.key === 'out-of-service')) {
        const i = list.findIndex(x => /keeps the system safe/.test(x.text));
        if (i >= 0) list[i] = { text: list[i].text + ' The fire department has to be told when a required system is switched off.', source: list[i].source + '; code row "out-of-service"' };
      }
      // The door was tried on site and it failed: the prepared list only says "if it does not close, say so", and
      // the owner is owed the repair itself. The conditional step goes and the work takes its place, high enough up
      // to be on the owner's page, because a door that will not shut is not corrected by taking the wedge out.
      if (scene === 'firedoor' && sid === 'a' && (f.latch === 'slow' || f.latch === 'no')) {
        const cond = list.findIndex(x => /does not close or does not latch/.test(x.text));
        if (cond >= 0) list.splice(cond, 1);
        const at = list.findIndex(x => /listen for the latch/.test(x.text));
        const add = f.latch === 'slow' ? [
          ['Your inspector has already tried that on site: with the wedge out the door swings shut, but the latch does not catch. A door resting against its frame without latching is not closed, so this is the second thing to put right.',
           'field answer "With the wedge out, does it close and latch by itself?" = it shuts but does not latch; solutions[a].how[2], [3]'],
          ['Have the latch and the strike plate on the frame seen to, so the bolt drops in on its own with nobody touching the door. Then try it again from fully open and listen for the click. Until it latches, keep the door shut and do not prop it.',
           'solutions[a].how[3]; owner.qa “The door does not close properly. Now what?”; code row "door-latch"'],
        ] : [
          ['Your inspector has already tried that on site: with the wedge out the door does not shut by itself. The arm across the top of the door, the closer, is what should be shutting it, and it is not.',
           'field answer "With the wedge out, does it close and latch by itself?" = it does not shut on its own; owner.qa “What did we find?”'],
          ['Have the closer repaired or replaced, then watch the door close from fully open and listen for the latch. Until it is repaired the door is kept closed: not propped, not left ajar.',
           'solutions[a].how[3]; owner.qa “The door does not close properly. Now what?”; code rows "door-closer", "door-latch"'],
        ];
        list.splice(at >= 0 ? at + 1 : list.length, 0, ...add.map(x => ({ text: x[0], source: x[1] })));
      }
      return list;
    }

    /** the technical wording of a correction, for the internal document */
    function technical(scene, sid) {
      const s = sol(scene, sid); if (!s) return null;
      return { title: T(s.title), where: T(s.where), change: T(s.change), how: s.how.map(T), keep: T(s.keep), why: T(s.why), limit: T(s.limit || '') };
    }

    /** the internal record: the vetted paragraphs of the source analysis, each with the standing content.js gives it */
    function record(scene) {
      const pick = h => { const b = blockAfter(scene, h); return b ? { text: Array.isArray(b.v) ? b.v.map(T) : T(b.v), tag: b.tag || '' } : null; };
      const c = C[scene];
      return {
        title: T(c.title), status: T(c.status), meta: (c.meta || []).map(m => [m[0], T(m[1])]),
        observed: pick('Observed condition'), hazard: pick('Hazard description'), reinspection: pick('Reinspection requirements'),
        reinspectionList: (() => { for (const sec of (c.analysis || [])) { const b = sec.blocks || []; const i = b.findIndex(x => x.t === 'h' && x.v === 'Reinspection requirements'); if (i >= 0) { const ul = b.slice(i + 1).find(x => x.t === 'ul'); return ul ? ul.v.map(T) : []; } } return []; })(),
        notAcceptable: c.notAcceptable ? T(c.notAcceptable.body) : '',
        limits: (c.analysis[0].blocks.find(x => x.t === 'ul' && x.tag === 'verify') || { v: [] }).v.map(T),
      };
    }

    /** what a rewrite may add: where to look, and what stays, in the owner report's own words */
    function extras(scene, sid) {
      const o = C[scene].owner || {}, s = sol(scene, sid), what = (o.qa || []).find(q => /need to do/i.test(q.q));
      return { keep: T(o.keep || ''), where: what && what.a[1] ? sentences(T(what.a[1]))[0] : (s ? T(s.where) : '') };
    }

    /** everything a rewrite may draw on for one finding in one place. Nothing outside this text may be added. */
    function material(scene, sid, rows, place) {
      const c = C[scene], o = c.owner || {}, s = sid ? sol(scene, sid) : null, L = [];
      L.push('FINDING: ' + T(c.title) + '. ' + T(c.summary));
      const rec = record(scene);
      if (rec.hazard) L.push('WHY IT MATTERS: ' + rec.hazard.text);
      L.push('REQUIRED CORRECTION: ' + T(c.primary));
      if (c.notAcceptable) L.push('NOT ACCEPTABLE: ' + T(c.notAcceptable.body));
      L.push('OWNER REPORT, PLAIN WORDING: ' + [o.intro, o.todo, o.keep, o.dont, o.when].filter(Boolean).map(T).join(' '));
      (o.qa || []).forEach(q => L.push('Q: ' + T(q.q) + ' A: ' + q.a.map(T).join(' ')));
      (c.solutions || []).forEach(x => {
        if (s && x.id !== s.id) return;
        L.push('CORRECTION "' + T(x.title) + '" (' + T(x.badgeText) + '): ' + T(x.plain) + ' Where: ' + T(x.where) + ' Change: ' + T(x.change) + ' Steps: ' + x.how.map(T).join(' ') + ' Keep: ' + T(x.keep) + ' Why: ' + T(x.why) + (x.limit ? ' Limit: ' + T(x.limit) : ''));
      });
      (c.extras || []).forEach(x => L.push('ALSO: ' + T(x.title) + '. ' + T(x.body) + (x.limit ? ' ' + T(x.limit) : '')));
      if (place) L.push('PLACE: ' + place.name + '. Fire agency: ' + place.agency + '.');
      (rows || []).forEach(r => L.push('CODE ' + r.cite + ': ' + r.requires + ' How it applies: ' + (r.analysis || r.applies || '') + (r.open ? ' Open: ' + r.open : '')));
      L.push('TIMEFRAME: ' + deadline(scene).internal + ' ' + deadline(scene).resident);
      return L.join('\n');
    }

    return { problem, ownerSteps, technical, record, deadline, extras, material };
  }

  // ---------------------------------------------------------------- the guard
  const UNITS = [['ft', /^(?:feet|foot|ft\.?)$/i], ['in', /^(?:inch(?:es)?|in\.)$/i], ['day', /^days?$/i], ['week', /^weeks?$/i], ['month', /^months?$/i], ['year', /^years?$/i], ['hour', /^hours?$/i], ['pct', /^(?:percent|per cent|%)$/i], ['degF', /^(?:°\s?F|degrees?)$/i], ['yd', /^yards?$/i], ['m', /^(?:meters?|metres?|m)$/i], ['cm', /^cm$/i], ['sqft', /^sq\.?\s?ft\.?$/i]];
  const UNIT_RE = '(feet|foot|ft\\.?|inch(?:es)?|in\\.|days?|weeks?|months?|years?|hours?|percent|per cent|%|°\\s?F|degrees?|yards?|meters?|metres?|cm|sq\\.?\\s?ft\\.?)';
  const WORDNUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, ninety: 90, hundred: 100 };
  const unitOf = u => { const m = UNITS.find(x => x[1].test(u)); return m ? m[0] : u.toLowerCase(); };
  const num = s => s.replace(/,/g, '').replace(/\.$/, '');
  function inventory(text) {
    const t = String(text || ''), numbers = new Set(), pairs = new Set(), sections = new Set();
    for (const m of t.matchAll(/\d+(?:[.,]\d+)*/g)) numbers.add(num(m[0]));
    for (const m of t.matchAll(new RegExp('(\\d+(?:[.,]\\d+)*)[\\s-]*' + UNIT_RE + '(?![a-z])', 'gi'))) pairs.add(num(m[1]) + '|' + unitOf(m[2]));
    for (const m of t.matchAll(new RegExp('\\b(' + Object.keys(WORDNUM).join('|') + ')[\\s-]+' + UNIT_RE + '(?![a-z])', 'gi'))) { numbers.add(String(WORDNUM[m[1].toLowerCase()])); pairs.add(WORDNUM[m[1].toLowerCase()] + '|' + unitOf(m[2])); }
    for (const m of t.matchAll(/§+\s*([A-Za-z]?[\d][\w.()\-]*)/g)) sections.add(m[1].replace(/[.,;:]+$/, ''));
    return { numbers, pairs, sections, text: t.toLowerCase() };
  }
  /** what in one sentence is not in the supplied material */
  function foreign(sentence, allowed) {
    const out = [], s = String(sentence);
    for (const m of s.matchAll(/§+\s*([A-Za-z]?[\d][\w.()\-]*)/g)) if (!allowed.sections.has(m[1].replace(/[.,;:]+$/, ''))) out.push(m[0]);
    if (/§/.test(s) && !/§+\s*[A-Za-z]?\d/.test(s)) out.push('§');
    const paired = new Set();
    for (const m of s.matchAll(new RegExp('(\\d+(?:[.,]\\d+)*)[\\s-]*' + UNIT_RE + '(?![a-z])', 'gi'))) { paired.add(m.index); if (!allowed.pairs.has(num(m[1]) + '|' + unitOf(m[2]))) out.push(m[0]); }
    for (const m of s.matchAll(/\d+(?:[.,]\d+)*/g)) if (!paired.has(m.index) && !allowed.numbers.has(num(m[0]))) out.push(m[0]);
    for (const m of s.matchAll(new RegExp('\\b(' + Object.keys(WORDNUM).join('|') + ')[\\s-]+' + UNIT_RE + '(?![a-z])', 'gi'))) if (!allowed.pairs.has(WORDNUM[m[1].toLowerCase()] + '|' + unitOf(m[2]))) out.push(m[0]);
    for (const m of s.matchAll(/\b(?:January|February|March|April|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|tonight|next week|next month|immediately|right away|as soon as possible|a (?:day|week|month|year)|per (?:day|week|month|year))\b/gi)) if (!allowed.text.includes(m[0].toLowerCase())) out.push(m[0]);
    for (const m of s.matchAll(/\b(?:NFPA|CFC|CRC|RMC|FMC|SAMC|MCC|PRC|Title \d+|Ordinance|Ord\.)\b/g)) if (!allowed.text.includes(m[0].toLowerCase())) out.push(m[0]);
    return out;
  }
  const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').replace(/\s*[—–]\s*/g, ', ').replace(/\s+/g, ' ').trim().slice(0, n);
  /**
   * reply: { title?, text?, steps? } as a model wrote it. allowedText: the supplied material plus the draft being
   * rewritten plus the inspector's own request. Returns the reply with every offending sentence removed, and the
   * list of what was removed. Throws when nothing usable is left.
   */
  function guard(reply, allowedText, fallbackTitle) {
    const allowed = inventory(allowedText), removed = [], out = {};
    const keep = text => sentences(clean(text, 1400)).filter(s => { const bad = foreign(s, allowed); if (bad.length) { removed.push({ sentence: s, because: bad }); return false; } return true; }).join(' ');
    if (reply.title != null) { const t = clean(reply.title, 90).replace(/[.]+$/, ''); out.title = t && !foreign(t, allowed).length ? t : (fallbackTitle || ''); if (t && out.title !== t) removed.push({ sentence: t, because: foreign(t, allowed) }); }
    if (reply.text != null) { out.text = keep(reply.text); if (!out.text) throw new Error('nothing left after the guard'); }
    if (reply.steps != null) {
      if (!Array.isArray(reply.steps)) throw new Error('steps must be a list');
      out.steps = reply.steps.slice(0, 9).map(s => keep(typeof s === 'string' ? s : (s && s.text) || '')).filter(Boolean);
      if (!out.steps.length) throw new Error('nothing left after the guard');
    }
    out.removed = removed;
    return out;
  }

  // ---------------------------------------------------------------- the built-in rewrite (no model)
  const SIMPLE = [['vegetation', 'plants'], ['accumulated ', ''], ['debris', 'waste'], ['approximately', 'about'], ['professional', 'contractor'], ['assembly', 'parts'], ['mechanism', 'part'], ['prior to', 'before'], ['located', 'found'], ['beneath', 'under'], ['retain', 'keep'], ['directly ', ''], ['landscaping', 'planting']];
  const simplify = s => SIMPLE.reduce((t, p) => t.replace(new RegExp('\\b' + p[0], 'gi'), m => m[0] === m[0].toUpperCase() && p[1] ? cap(p[1]) : p[1]), s).replace(/\s+/g, ' ').replace(/ ([.,])/g, '$1').trim();
  const ACTION = /remove|replace|keep|leave|do not|deadline|within|follow|contact|call\b|take|clear/i;
  function builtin(target, cur, instruction, extra) {
    const want = String(instruction || '').toLowerCase(), ex = extra || {};
    const shorter = /short|brief|concise|fewer|less|trim|tight/.test(want), simpler = /simpl|plain|easy|easier|clear/.test(want);
    const keep = /keep|stay|leave|upper|remain/.test(want), where = /which|where|what bush|point|exact/.test(want);
    const out = { removed: [] };
    if (target === 'problem') {
      let s = sentences(cur.text);
      if (shorter) s = s.filter((x, i) => i === 0 || ACTION.test(x));
      if (simpler) s = s.map(simplify);
      if (keep && ex.keep && !s.join(' ').includes(ex.keep)) s.push(ex.keep);
      if (where && ex.where && !s.join(' ').includes(ex.where)) s.splice(1, 0, ex.where);
      out.text = s.join(' ');
      out.changed = out.text !== cur.text;
    } else {
      let steps = (cur.steps || []).slice();
      if (shorter) steps = steps.map(x => sentences(x)[0] || x);
      if (simpler) steps = steps.map(simplify);
      if (keep && ex.keep && !steps.join(' ').includes(ex.keep)) steps.push(ex.keep);
      if (where && ex.where && !steps.join(' ').includes(ex.where)) steps.splice(1, 0, ex.where);
      out.title = cur.title; out.steps = steps;
      out.changed = steps.join('|') !== (cur.steps || []).join('|');
    }
    if (!out.changed) out.note = 'Nothing changed. Without the writing help, a rewrite can only make the words shorter or simpler, or add what stays and where to look.';
    return out;
  }
  /** a first draft of the inspector's own recommendation, with no model: their sentence, then the two limits */
  function builtinOwn(idea) {
    const s = clean(idea, 300).replace(/[.!?]+$/, ''), words = s.split(' ');
    return {
      title: cap(words.slice(0, 7).join(' ')) + (words.length > 7 ? '' : ''),
      steps: [cap(s) + '.', 'Change only the area marked in the picture. Leave everything else as it is.', 'If you are not sure where to stop, contact your fire prevention inspector before you start.'],
      removed: [],
    };
  }

  /**
   * A photograph the inspector added themselves, in the shape the drafting chain expects of an example.
   *
   * Everything else on this tab is grounded in examples/<id>/example.js: the code rows with their quoted text, the
   * citations, the prepared corrections, the owner's wording. A photograph off someone's phone has none of that,
   * and nothing here invents any: the entry carries the field inspector's note and what the senior inspector has
   * written about the problem, and that is the whole of the supplied material. The guard then does what it always
   * does, and because the material holds no section number, measurement or deadline, any the model reaches for is
   * taken straight back out. So the steps are practical wording about this photograph and never a statement of law.
   *
   * @param {object} f  { title, note, problem } the finding as both devices have it
   */
  function customContent(f) {
    const title = clean((f && f.title) || '', 120) || 'Photograph with a note';
    const note = clean((f && f.note) || '', 1200);
    const problem = clean((f && f.problem) || '', 2400);
    const said = [note, problem === note ? '' : problem].filter(Boolean).join(' ');
    return {
      tab: 'Added photo', title, status: 'Added by the inspector', meta: [], photo: '', aspect: 1,
      note, noteFix: '', noteWhy: '', summary: said, primary: problem || note,
      annotations: [], annotationCaption: '', solutions: [], extras: [],
      analysis: [{ h: 'What was recorded', blocks: [{ t: 'h', v: 'Observed condition' }, { t: 'p', v: said }] }],
      // no `when`: there is no source deadline behind this one, so the date is only ever the one the senior sets
      owner: { title, sub: '', intro: problem || note, todo: '', keep: '', when: '', qa: [] },
      uncertainty: [], final: '',
    };
  }

  // OWNER_STEPS stays on the export (team/test.js reads it whole) but is now assembled from the examples.
  return { build, guard, inventory, foreign, builtin, builtinOwn, customContent, sentences, clean, strip,
    get OWNER_STEPS() { const EX = (typeof window !== 'undefined' ? window : globalThis).FireExamples; return EX ? EX.ownerSteps() : {}; } };
});
