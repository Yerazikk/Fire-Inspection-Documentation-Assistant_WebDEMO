// team/drafts.js: the words the senior inspector's drafting desk starts from, and the guard on rewritten words.
// Loaded by the page (window.TeamDrafts) and by team/api.js in node, so both sides use one copy.
//
//   build(CONTENT, tidy)  the drafts prepared from the source files: the problem in plain language, the owner's
//                         numbered steps per correction, the technical wording, the timeframe, the grounding text.
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
  // Written from the source content for someone who has never heard the term "ladder fuel". Each step is one
  // concrete action and says where to stop or what must stay. The second item is where the step comes from.
  const OWNER_STEPS = {
    ladder: {
      a: [
        ['Find the low, clipped green hedge that grows directly under the tall flowering plants. In your photo it is the dense green row along the roadside.', 'solutions[a].how[0], .where; owner.qa "What do you need to do?"'],
        ['Remove that low hedge. It is the only row that has to come out.', 'solutions[a].how[1], .plain; owner.keep'],
        ['Leave the tall plants above it, the stone wall and the rest of your landscaping where they are.', 'solutions[a].keep; owner.keep'],
        ['Take the cut branches off the property, and clear away dead leaves and plant debris along the wall.', 'solutions[a].how[2]; owner.todo'],
        ['When you finish there should be open space between the ground and the bottom of the tall plants.', 'solutions[a].how[3]; owner.qa "What do you need to do?"'],
        ['If you are not sure which bushes to remove, contact your fire prevention inspector before you start.', 'owner.qa "What happens after the work is done?"'],
      ],
      b: [
        ['Ask your inspector first. This option only counts if the inspector approves it.', 'solutions[b].limit'],
        ['Find the places where the low hedge and the tall plants nearly touch.', 'solutions[b].how[0]'],
        ['Cut only the lowest branches off the tall plants to open a gap. Ask your inspector how high you may cut, and stop there.', 'solutions[b].how[1], [2]'],
        ['Trim the low hedge down so its top sits well below the branches above it.', 'solutions[b].plain, .change'],
        ['Keep the healthy upper parts of the tall plants. Do not prune so hard that the plants are damaged.', 'solutions[b].keep'],
        ['If cutting cannot open a clear gap, the low hedge has to come out instead.', 'solutions[b].how[3]'],
      ],
      c: [
        ['Ask your inspector first. The plants, the spacing and the materials all need approval before you plant.', 'solutions[c].limit, .how[3]'],
        ['Remove the low hedge under the tall plants, as in the required correction.', 'solutions[c].how[0]'],
        ['Cover the cleared strip with gravel or stone.', 'solutions[c].how[1]'],
        ['Plant only low plants, far enough apart that they do not touch each other or reach the tall plants above.', 'solutions[c].how[2]'],
        ['Leave the tall plants and the stone wall where they are.', 'solutions[c].keep'],
      ],
    },
    sprinkler: {
      a: [
        ['Call a qualified fire sprinkler contractor. This is not a job to do yourself.', 'solutions[a].how[0]; owner.todo'],
        ['Do not scrape, sand or clean the paint off. It can damage the sprinkler and does not make it safe.', 'notAcceptable.body; owner.dont'],
        ['The contractor works out exactly which sprinkler you have and fits a matching new one in the same place.', 'solutions[a].how[1], [2], [4]'],
        ['The contractor keeps the system safe while the old head is out, then tests it.', 'solutions[a].how[3], [5]'],
        ['In most cases only this one head has to be replaced, not the whole system. The ceiling and the pipes stay as they are.', 'owner.keep; solutions[a].keep'],
        ['Keep the contractor’s paperwork and give it to your inspector if asked.', 'solutions[a].how[6]; owner.qa "What happens next?"'],
      ],
    },
    // One correction now, so one list. The owner’s page shows the first four steps, so the sign is in them:
    // the wedge and the sign are what this finding ends as, and the owner should not have to scroll for half of it.
    firedoor: {
      a: [
        ['Take the wedge out from under the door, and take it out of the building: left beside the door it will be back under it by the afternoon.', 'solutions[a].change, .how[0]; owner.todo'],
        ['Let the door close on its own from fully open, and listen for the latch. A door resting against the frame without latching has not closed.', 'solutions[a].how[1], [2]; owner.qa “What do you need to do?”'],
        ['Ask your inspector whether this door also needs a sign. Not every one does.', 'solutions[a].how[5]; solutions[a].lede, .limit'],
        ['Where it does, fix a permanent sign to the face of the door in letters at least an inch high, where someone about to prop it open will read it.', 'solutions[a].how[7], [8]; solutions[a].where'],
        ['Settle which words it takes: KEEP CLOSED for a door meant to stay shut, DO NOT BLOCK for one meant to stand open.', 'solutions[a].how[6]'],
        ['If the door does not close or does not latch, say so: the door is then kept closed until the closer is repaired.', 'solutions[a].how[3]; owner.qa “The door does not close properly. Now what?”'],
        ['Do not swap the wedge for a hook, a chair or a bin. Anything holding it open is the same problem.', 'owner.dont'],
        ['Apart from the sign, nothing has to be bought. The door, the frame and the arm at the top all stay as they are.', 'solutions[a].keep; owner.keep'],
      ],
    },
    daisy: {
      a: [
        ['Switch both power strips off before you move anything.', 'solutions[a].how[0]; owner.qa "What do you need to do?"'],
        ['Find the cream-coloured plug in the last socket on the right of the white strip. That is the lower strip’s cord.', 'solutions[a].where; owner.qa "What do you need to do?"'],
        ['Pull it out and plug the lower strip straight into a wall socket instead.', 'solutions[a].change, .how[2]; owner.todo'],
        ['Do not put an extension lead between the strip and the wall. That is the same problem with one more part in it.', 'notAcceptable.body; owner.dont'],
        ['Check that neither strip is now fed by the other, and that each one goes straight to a wall socket.', 'solutions[a].how[3]'],
        ['Move the cords so they are not walked on, trapped under furniture, or run under a door or the carpet.', 'solutions[a].how[5]'],
        ['You can keep both strips and everything plugged into them. Nothing has to be thrown away.', 'solutions[a].keep; owner.keep'],
      ],
      b: [
        ['Ask your inspector first. This option only counts if the inspector approves it.', 'solutions[b].limit'],
        ['Add up what is plugged into both strips, and check the total against the rating printed on the strip you want to keep.', 'solutions[b].how[0], [1]'],
        ['If it all fits, move everything onto that one strip and take the other one out of the room.', 'solutions[b].how[2]; solutions[b].plain'],
        ['Plug the strip you kept straight into a wall socket.', 'solutions[b].change'],
        ['If it does not all fit, this option is closed: use the required correction, or have more sockets installed.', 'solutions[b].how[3]'],
      ],
      c: [
        ['Ask your inspector first, and use a licensed electrician. This usually needs a permit.', 'solutions[c].limit; solutions[c].how[0], [1]'],
        ['Have the electrician check the circuit and what is already on it.', 'solutions[c].how[0]'],
        ['Have new wall sockets installed where the equipment actually sits.', 'solutions[c].how[1]; solutions[c].plain'],
        ['Plug the equipment into the new sockets and take away the strips you no longer need.', 'solutions[c].how[2]'],
        ['Any strip you keep goes straight into a wall socket of its own.', 'solutions[c].how[3]; solutions[c].keep'],
        ['This is not required to clear the violation. Moving one plug does that, at no cost.', 'solutions[c].limit'],
      ],
    },
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

    /** the owner's numbered steps for one correction, with one line added where the place's code rows call for it */
    function ownerSteps(scene, sid, rows) {
      const list = ((OWNER_STEPS[scene] || {})[sid] || []).map(x => ({ text: x[0], source: x[1] }));
      if (scene === 'sprinkler' && sid === 'a' && (rows || []).some(r => r.key === 'out-of-service')) {
        const i = list.findIndex(x => /keeps the system safe/.test(x.text));
        if (i >= 0) list[i] = { text: list[i].text + ' The fire department has to be told when a required system is switched off.', source: list[i].source + '; code row "out-of-service"' };
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

  return { build, guard, inventory, foreign, builtin, builtinOwn, sentences, clean, strip, OWNER_STEPS };
});
