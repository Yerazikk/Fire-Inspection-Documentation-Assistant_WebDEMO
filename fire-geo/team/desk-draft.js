// team/desk-draft.js: what comes after the finding is approved.
//   How to fix it    the corrections, each with its before and after and the owner's steps. Tick the ones to use,
//                    change the instructions (the pencil), ask for a rewrite, set one aside, or write one of your own.
//   For the file     the same finding in technical language, as a document page, for the record.
//   For the owner    the owner's page as they will see it: a website, shown in a browser window at desktop width.
//                    It is the last step and the thing that is published, so its Publish button sits on the window
//                    and goes with it when the page is enlarged. Sending is not connected; it says so at that moment.
// Each draft is ONE document (doc.js): the whole page is typed into as one piece, like a page in a word processor.
// Pictures, citations, quoted code, generated numbering and the date are protected pieces inside it.
// The first drafts are prepared from the source files (drafts.js). The model is only asked when the inspector asks
// for a rewrite or writes a correction of their own (POST /api/team/draft); what comes back has already been
// checked on the server against the sources. One set of words: a step typed over on the owner's page is the same
// step under "How to fix it" and in the file document.
window.TeamDraft = (function () {
  'use strict';
  const U = window.TeamUI, { h, icon, btn, sym, swapText, reveal } = U, D = window.TeamData, F = window.TeamFlow, P = window.TeamPhoto, TD = window.TeamDrafts;
  const B = TD.build(window.CONTENT || {}, D.tidy);
  const STAND = { required: 'Required', alternative: 'Alternative', own: 'Your own' };
  // the standing of a correction in the owner's words. Only what the source data gives: required (the inspector's
  // preferred correction), an alternative that needs the inspector's approval, or the inspector's own.
  const OWNER_STAND = { required: 'what the inspector asked for', alternative: 'another way, ask your inspector first', own: 'from your inspector' };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const RANK = { required: 0, alternative: 1, own: 2 };
  const EXAMPLES = { solution: ['Make it shorter', 'Use simpler words', 'Say what stays', 'Say where to look'] };
  const val = r => r.cur != null ? r.cur : r.base;
  const ref = base => ({ base, cur: null });
  const clean = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const word = v => D.VERDICT()[v].word;
  /** put children into an element: lists are opened out and missing pieces are left out (append() alone would write "null") */
  const fill = (el, ...kids) => { el.append(...kids.flat(Infinity).filter(k => k != null && k !== false)); return el; };
  /** "What is wrong" for the owner: two or three short sentences from the owner report in the sources */
  function problemShort(scene) {
    const o = ((window.CONTENT || {})[scene] || {}).owner || {}, T = s => D.tidy(TD.strip(s)), out = TD.sentences(T(o.intro || '')).slice(0, 3);
    const why = (o.qa || []).find(q => /dangerous/i.test(q.q)), more = why && why.a[1] ? TD.sentences(T(why.a[1]))[0] : '';
    if (more && out.length < 3 && out.join(' ').length + more.length <= 280) out.push(more);
    return out.join(' ');
  }

  function attach(V, api) {
    const f = V.f, scene = f.scene, binds = [], panes = {}, parts = {};
    const M = { problem: ref(problemShort(scene)), phone: ref('###-###-####'), ownN: 0, open: null, pos: .5 };      // phone: a slot, written as hash marks; the real product fills it from the agency's record
    // The date the correction is due is the senior inspector's decision. It starts at the inspection date plus the
    // days the source gives for this finding (30 for the hedge); where the source gives none (the sprinkler) it
    // starts at 30 days too, which is this prototype's own starting value. Both drafts show the one date.
    const DAY = 86400000, day0 = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()), CHOICES = [7, 14, 30, 60];
    const srcDays = +(((B.deadline(scene).resident || '').match(/(\d+)\s*days?/) || [])[1] || 0);
    M.due = { days: srcDays || 30, date: null, fromSource: !!srcDays };
    const fmtDate = x => x.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const dueDate = () => { if (M.due.date) return M.due.date; const s = day0(new Date(f.at)); return new Date(s.getFullYear(), s.getMonth(), s.getDate() + M.due.days); };      // counted on the calendar: a day is not always 24 hours (the clocks change)
    const dueDays = () => Math.round((day0(dueDate()) - day0(new Date(f.at))) / DAY);
    const daysText = n => n + (n === 1 ? ' day' : ' days');
    M.sols = D.solutions(scene).map(s => ({ id: s.id, kind: 'prepared', sol: s, standing: s.standing, use: s.standing === 'required', off: false, title: ref(s.title), plain: ref(s.plain), steps: B.ownerSteps(scene, s.id, V.ev.rows).map(x => ref(x.text)), regions: [], treat: 'remove', rewrites: 0 }));
    const chosen = () => M.sols.filter(s => s.use && !s.off).sort((a, b) => RANK[a.standing] - RANK[b.standing]);
    /** "Option 2": a correction's number among those included, the required one first. None when only one is included. The same number on the laptop's list, the owner's page and the file document. */
    const option = s => { const list = chosen(); return list.length > 1 ? list.indexOf(s) + 1 : 0; };
    const prefix = s => { const n = option(s); return n > 0 ? 'Option ' + n + ': ' : ''; };      // "Option 1: Remove the lower tier of bushes" is one heading line
    const touch = () => { syncAll(); api.changed(); };

    // ---- words that can be changed. One reference, shown in as many places as it is used.
    /** in a list of short items (a correction's instructions): turned into text boxes by that card's pencil */
    function words(tag, cls, r) {
      const el = h(tag, { class: cls + ' tm-inplace', 'data-edit': '', text: val(r) });
      el.addEventListener('blur', () => { if (!el.isContentEditable) return; const t = clean(el.textContent); if (!t) el.textContent = val(r); else if (t !== val(r)) { el.textContent = t; r.cur = t === r.base ? null : t; touch(); } });
      el.addEventListener('keydown', e => { if (!el.isContentEditable) return; e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); } else if (e.key === 'Escape') { e.preventDefault(); el.textContent = val(r); el.blur(); } else if ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'z' && !e.shiftKey && clean(el.textContent) === val(r)) e.preventDefault(); });      // nothing of its own left to undo: the browser's undo would reach into another text
      binds.push({ el, r, live: false });
      return el;
    }
    function editing(scope, on) {
      scope.classList.toggle('is-editing', on);
      scope.querySelectorAll('[data-edit]').forEach(el => { if (on) { el.setAttribute('contenteditable', 'plaintext-only'); if (!el.isContentEditable) el.setAttribute('contenteditable', 'true'); } else el.removeAttribute('contenteditable'); });
    }
    /** the pencil: every instruction in its card becomes a text box; the same button, as a tick, ends it */
    function pencil(scope) {
      const b = sym('pencil', 'Change wording', () => { const on = !scope.classList.contains('is-editing'); if (!on && scope.contains(document.activeElement) && document.activeElement.isContentEditable) document.activeElement.blur(); editing(scope, on); b.dataset.glyph = on ? 'b' : 'a'; b.setAttribute('aria-label', on ? 'Done' : 'Change wording'); b.title = on ? 'Done' : 'Change wording'; b.setAttribute('aria-pressed', String(on)); if (on) { const first = scope.querySelector('.dk-card-steps [data-edit]'); if (first) first.focus({ preventScroll: true }); } }, '', 16);
      b.append(icon('check', 16)); b.dataset.glyph = 'a'; b.setAttribute('aria-pressed', 'false'); return b;
    }
    function refresh(skip) {
      for (let i = binds.length - 1; i >= 0; i--) {
        const x = binds[i]; if (x.el.isConnected) x.live = true; else if (x.live) { binds.splice(i, 1); continue; }
        if (x.el !== skip && document.activeElement !== x.el) swapText(x.el, val(x.r));
      }
    }
    function fillSteps(ol, s, cls) {
      if (ol.stepsOf === s.steps) return; ol.stepsOf = s.steps;
      ol.replaceChildren(...s.steps.map(r => h('li', null, words('span', cls, r))));
      const scope = ol.closest('.is-editing'); if (scope) editing(scope, true);
    }

    // ---- a draft can be opened large, over most of the window, to read and edit it properly. It is the same live page:
    // it grows from where it sits and goes back the same way (the close symbol, Escape, or a press outside it).
    // It keeps clear of the bottom of the tab, where the queue and feedback buttons sit in the corners.
    const bigs = [];
    function enlarger(frame) {
      let hole = null, layer = null, moved = -1e9;      // moved: when it last began to grow or shrink. A second press while it is still moving (a double click) does nothing.
      const still = () => performance.now() - moved > 330;
      const b = sym('expand', 'Enlarge', () => { if (still()) { if (hole) close(); else open(); } }, 'dk-big-btn', 16);
      const px = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      const spot = () => { const x = Math.round(innerWidth * .04), top = Math.round(innerHeight * .035), bottom = Math.max(Math.round(innerHeight * .045), 66); return { left: x, top, width: innerWidth - 2 * x, height: innerHeight - top - bottom }; };
      const esc = e => { if (e.key === 'Escape' && !(document.activeElement && document.activeElement.isContentEditable)) { e.stopPropagation(); close(); } };
      const refit = () => { if (hole) Object.assign(frame.style, px(spot())); };
      const behind = on => { const m = document.querySelector('.tm-main'); if (m) m.inert = on; };      // what is under the page cannot be reached while it is open
      const face = (name, label) => { b.replaceChildren(icon(name, 16)); b.setAttribute('aria-label', label); b.title = label; };
      /** the reader's place in the page, kept across the move: as a share of the way down, since the lines break differently at the other width */
      const place = () => { const sc = frame.querySelector('.tm-softscroll'), room = sc ? sc.scrollHeight - sc.clientHeight : 0, at = room > 0 ? sc.scrollTop / room : 0; return () => { if (sc) sc.scrollTop = at * Math.max(0, sc.scrollHeight - sc.clientHeight); }; };
      function open() {
        const from = frame.getBoundingClientRect(), to = spot(), back = place(); moved = performance.now();
        hole = h('div', { class: 'dk-big-hole', style: { width: from.width + 'px', height: from.height + 'px' } }); frame.replaceWith(hole);
        const veil = h('div', { class: 'dk-big-veil', onclick: () => close() });
        layer = h('div', { class: 'dk-big-layer gl-scope' }, veil, frame); document.body.append(layer); behind(true);
        frame.classList.add('is-big'); Object.assign(frame.style, px(to));
        U.anim(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); const grow = U.anim(frame, [px(from), px(to)], { duration: 300, easing: U.FLAT });
        back(); if (grow) grow.onfinish = () => { back(); U.soft(); };
        face('close', 'Close'); U.refocus(b);
        document.addEventListener('keydown', esc, true); window.addEventListener('resize', refit); setTimeout(U.soft, 330);
      }
      function close(now) {
        if (!hole || (now !== true && !still())) return;
        const H0 = hole, L0 = layer, from = frame.getBoundingClientRect(), to = H0.getBoundingClientRect(), back = place(); hole = null; layer = null; moved = now === true ? moved : performance.now();
        document.removeEventListener('keydown', esc, true); window.removeEventListener('resize', refit);
        const done = () => { frame.getAnimations().forEach(a => a.cancel()); frame.classList.remove('is-big'); frame.removeAttribute('style'); if (H0.isConnected) H0.replaceWith(frame); else frame.remove(); L0.remove(); behind(false); back(); face('expand', 'Enlarge'); U.refocus(b); U.soft(); };
        if (now === true || !H0.isConnected) { done(); return; }
        U.anim(L0.firstChild, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out', fill: 'forwards' });
        const a = U.anim(frame, [px(from), px(to)], { duration: 300, easing: U.FLAT, fill: 'forwards' }); if (a) a.onfinish = done; else done();
      }
      bigs.push(close);
      return b;
    }

    // ---- asking for a rewrite. Named steps while it works; what could not be used is said in place.
    async function request(body) {
      const full = Object.assign({ scene, place: V.loc.place, facts: f.facts }, body);
      try {
        const r = await fetch('/api/team/draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(full) }), j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || 'failed'); return j;
      } catch (e) {                                           // no server behind the page: the same small rewrite, done here
        if (body.target === 'own') { const o = TD.builtinOwn(body.instruction); return { title: o.title, steps: o.steps, removed: [], note: 'The writing help could not be reached. These are your words with two standard steps.' }; }
        const r = TD.builtin(body.target, body.current, body.instruction, B.extras(scene, body.solution));
        return Object.assign({ removed: [], note: 'The writing help could not be reached. This is a simpler rewrite.' + (r.note ? ' ' + r.note : '') }, body.target === 'problem' ? { text: r.text } : { title: r.title, steps: r.steps });
      }
    }
    /** the small form under a correction: say what should be different, or press an example */
    function askForm(host, o) {
      if (!host.hidden) { reveal(host, false); return; }
      const input = h('input', { class: 'dk-input', type: 'text', placeholder: o.placeholder, 'aria-label': o.placeholder, maxlength: '300' });
      const go = btn(o.go, () => run(input.value), 'is-solid'), note = h('p', { class: 'dk-ask-note', hidden: true }), st = U.steps(o.steps, 'dk-ask-steps'); st.el.hidden = true;
      const chips = h('div', { class: 'tm-btns' }, (o.examples || []).map(x => btn(x, () => { input.value = x; run(x); })));
      const row = h('div', { class: 'dk-ask-row' }, input, go, sym('close', 'Close', () => reveal(host, false), '', 16));
      async function run(text) {
        text = clean(text); if (text.length < 2) { input.focus(); return; }
        row.inert = true; chips.inert = true; note.hidden = true; st.el.hidden = false; st.run(0);
        const t0 = Date.now(), t1 = setTimeout(() => st.run(1), 450);
        const j = await request(o.body(text));
        clearTimeout(t1); st.run(o.steps.length - 1); await U.wait(Math.max(350, 900 - (Date.now() - t0))); st.done(); await U.wait(250);
        row.inert = false; chips.inert = false; st.el.hidden = true;
        const left = (j.removed || []).length ? 'Left out, because it is not in the sources: ' + j.removed.join(' ') : '';
        const said = [j.note, left].filter(Boolean).join(' ');
        if (o.apply(j, text) === false) { note.textContent = said || 'Nothing changed.'; note.hidden = false; return; }
        if (said) { note.textContent = said; note.hidden = false; input.value = ''; } else reveal(host, false);
        U.soft();
      }
      input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); run(input.value); } });
      host.replaceChildren(row, chips, st.el, note); reveal(host, true); input.focus({ preventScroll: true });
    }

    // ---------------------------------------------------------------- step 2: how to fix it
    // The pictures are the corrections, so they are large. A list on the left (name, standing, the tick), and beside
    // it the before / after of the correction being looked at, with the owner's steps. Two separate things: which one
    // is LOOKED AT (a click on its row; the row takes the chosen surface) and which are TICKED to use (the check at
    // the right, its own control). Passing the pointer over a row changes nothing. On arrival the required correction
    // is looked at and already ticked.
    const snapshot = s => ({ title: s.title.cur, plain: s.plain.cur, steps: s.steps });
    const isChanged = s => s.rewrites > 0 || s.title.cur != null || s.plain.cur != null || s.steps.some(r => r.cur != null);
    /** the part of the photograph a correction changes, for its small picture in the list */
    function changed(s) {
      const pts = (s.sol && s.sol.outline || []).reduce((a, c) => a.concat(c.points), []); if (!pts.length) return { focus: f.focus };
      const xs = pts.map(q => q[0] * 100), ys = pts.map(q => q[1] * 100), x0 = Math.min(...xs), y0 = Math.min(...ys), g = 8;
      return { region: [Math.max(0, x0 - g), Math.max(0, y0 - g), Math.min(100, Math.max(...xs) - x0 + 2 * g), Math.min(100, Math.max(...ys) - y0 + 2 * g)] };
    }
    function rowNode(s) {
      const C = s.ui = s.ui || {};
      const thumb = P.photoBox(s.sol ? (s.sol.after || s.sol.before) : f.photo.src, s.sol ? s.sol.aspect : f.photo.aspect, 'dk-fix-thumb'); thumb.pct(1, changed(s));
      C.use = h('button', { class: 'dk-use', type: 'button', role: 'checkbox', 'aria-checked': String(s.use), 'aria-label': 'Use this correction', title: 'Use this correction', onclick: e => { e.stopPropagation(); s.use = !s.use; touch(); } }, h('span', { class: 'tm-box' }, icon('check', 14)));
      C.name = h('b', { class: 'dk-fix-name', text: prefix(s) + val(s.title) });
      C.row = h('div', { class: 'dk-fix-row', role: 'option', tabindex: '0', 'aria-selected': 'false', onclick: () => look(s.id) }, thumb.el, h('div', { class: 'dk-fix-text' }, C.name, h('span', { class: 'dk-fix-stand', text: STAND[s.standing] })), C.use);
      C.row.addEventListener('keydown', e => {
        if (e.target !== C.row) return; const on = M.sols.filter(x => !x.off), i = on.indexOf(s);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); on[(i + (e.key === 'ArrowDown' ? 1 : on.length - 1)) % on.length].ui.row.focus({ preventScroll: true }); }      // the arrows move along the list
        else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); look(s.id); }                                                                                    // Enter or Space looks at it
      });
      return C.row;
    }
    /** the large view of one correction: its before / after (or, for the inspector's own, the plan on the photo) and the steps */
    function paneNode(s) {
      const C = s.ui, big = h('div', { class: 'dk-big' }); let extra = null;
      big.style.setProperty('--a', String(s.sol ? s.sol.aspect : f.photo.aspect));      // the large picture keeps the photograph's own shape
      if (s.kind === 'own') extra = ownPlan(s, big);
      else { const FG = window.FireGeo, fsol = FG && FG.beforeAfter && FG.solutions.get ? FG.solutions.get(s.sol.photo, s.id) : null; if (fsol && fsol.after) { C.ba = FG.beforeAfter(big, { solution: fsol, base: D.ROOT, position: M.pos, caption: false }); big.addEventListener('ba:change', e => { if (e.detail && e.detail.position != null) M.pos = e.detail.position; }); } else P.correctionView(big, s.sol, { frame: s.sol.aspect, position: M.pos }); }
      C.steps = h('ol', { class: 'dk-card-steps' }); C.ask = h('div', { class: 'dk-ask', hidden: true });
      C.pane = h('div', { class: 'dk-detail-pane' + ((s.sol ? s.sol.aspect : f.photo.aspect) > 1.1 ? ' is-wide' : ''), 'data-kind': s.kind });
      C.backAll = sym('undo', 'Undo', () => { if (s.prev) { s.steps = s.prev.steps; s.prev = null; s.rewrites = 0; } s.title.cur = null; s.plain.cur = null; s.steps.forEach(r => { r.cur = null; }); touch(); }, '', 16);
      const rewrite = btn('Ask for a rewrite', () => askForm(C.ask, { placeholder: 'What should be different?', go: 'Rewrite', examples: EXAMPLES.solution, steps: ['Reading the steps', 'Rewriting them', 'Checking against the sources'],
        body: text => ({ target: 'solution', solution: s.kind === 'prepared' ? s.id : 'a', instruction: text, current: { title: val(s.title), steps: s.steps.map(val) } }),
        apply: j => { const now = (j.steps || []).map(clean).filter(Boolean); if (!now.length || now.join('|') === s.steps.map(val).join('|')) return false; if (!s.prev) s.prev = snapshot(s); s.steps = now.map(t => ref(t)); if (j.title && s.kind === 'own') s.title.cur = j.title; s.rewrites++; touch(); } }), 'is-quiet');
      const drop = s.kind === 'own' ? sym('trash', 'Delete', () => { M.sols.splice(M.sols.indexOf(s), 1); M.open = null; touch(); }, '', 16) : btn('Don’t use this one', () => { s.off = true; s.use = false; M.open = null; touch(); }, 'is-quiet');
      fill(C.pane, h('div', { class: 'dk-big-wrap' }, big, extra), h('div', { class: 'dk-side tm-softscroll' }, words('h3', 'dk-card-title', s.title), h('p', { class: 'dk-card-stand', text: STAND[s.standing] }), s.kind === 'prepared' ? words('p', 'dk-card-plain', s.plain) : null,
        h('div', { class: 'dk-card-stepshead' }, h('h4', { class: 'shell-label', text: 'Steps for the owner' }), h('div', { class: 'tm-btns' }, pencil(C.pane), C.backAll)), C.steps, h('div', { class: 'tm-btns' }, rewrite, drop), C.ask));
      fillSteps(C.steps, s, 'dk-step'); C.backAll.hidden = s.kind === 'own' || !isChanged(s);
      return C.pane;
    }
    /** look at a correction: its large view replaces the one that was there (the old one out, then the new one in) */
    function look(id) {
      const X = parts.fix; if (!X || M.open === id) return; M.open = id; markRows();
      const s = M.sols.find(x => x.id === id), next = id === 'new' ? X.newPane : s ? (s.ui.pane || paneNode(s)) : null, old = X.detail.firstElementChild;
      if (!next || next === old) return;
      const put = () => { X.detail.replaceChildren(next); U.anim(next, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' }); if (s && s.ui.ba && s.ui.ba.set) s.ui.ba.set(M.pos == null ? .5 : M.pos); U.syncAllSegs(next); U.soft(); };
      const out = old && U.anim(old, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'ease-out', fill: 'forwards' });
      if (out) out.onfinish = () => { out.cancel(); put(); }; else put();
    }
    function markRows() { M.sols.forEach(s => { if (s.ui && s.ui.row) { const on = s.id === M.open; s.ui.row.classList.toggle('is-on', on); s.ui.row.setAttribute('aria-selected', String(on)); } }); if (parts.fix) parts.fix.mine.classList.toggle('is-on', M.open === 'new'); }
    /** the inspector's own correction has no picture: the area is marked on the photograph instead, as a plan */
    function ownPlan(s, view) {
      const mk = P.markup(view, { photo: f.photo.src, aspect: f.photo.aspect, frame: f.photo.aspect, view: { contain: true }, regions: s.regions, treat: s.treat, onChange: r => { s.regions = r; touch(); } });
      const seg = U.seg(Object.keys(P.TREAT).map(id => ({ id, label: P.TREAT[id] })), s.treat, v => { s.treat = v; mk.setTreat(v); }, 'dk-treat');
      const fa = (D.scene(scene).annotations.find(a => a.finding) || {}).box;
      return h('div', { class: 'dk-plan' }, h('p', { class: 'dk-plan-say', text: 'No picture can be made for this one.' }),
        h('div', { class: 'tm-btns' }, seg, fa ? btn('Mark where the problem is', () => mk.add(fa.slice(), s.treat)) : null, sym('undo', 'Undo', () => mk.undo(), '', 16)));
    }
    function fixPane() {
      const list = h('div', { class: 'dk-fix-rows', role: 'listbox', 'aria-label': 'Corrections' }), offList = h('div', { class: 'dk-off-list' }), detail = h('div', { class: 'dk-detail' });
      const offBox = h('div', { class: 'dk-off', hidden: true }, h('h4', { class: 'shell-label', text: 'Not used' }), offList);
      const ask = h('div', { class: 'dk-ask' }), newPane = h('div', { class: 'dk-detail-pane', 'data-kind': 'new' }, h('div', { class: 'dk-new' }, h('h3', { class: 'dk-card-title', text: 'Your own correction' }), ask));
      const mine = btn('Write my own', () => { look('new'); if (ask.hidden || !ask.firstChild) { ask.hidden = true; askForm(ask, { placeholder: 'Your correction, in one sentence', go: 'Write it up', steps: ['Reading your sentence', 'Writing the steps', 'Checking against the sources'],
        body: text => ({ target: 'own', instruction: text, current: {} }),
        apply: (j, text) => { const steps = (j.steps || []).map(clean).filter(Boolean); if (!steps.length) return false; const s = { id: 'own' + (++M.ownN), kind: 'own', sol: null, standing: 'own', use: true, off: false, title: ref(clean(j.title) || text), plain: ref(''), steps: steps.map(t => ref(t)), regions: [], treat: 'remove', rewrites: 0 }; M.sols.push(s); M.note = (j.removed || []).length ? 'Left out, because it is not in the sources: ' + j.removed.join(' ') : ''; touch(); look(s.id); } }); } }, 'dk-mine', 'plus');
      parts.fix = { list, offBox, offList, detail, newPane, mine };
      return h('section', { class: 'dk-pane', 'data-step': 'fix' }, h('div', { class: 'dk-fix' }, h('div', { class: 'dk-fix-list tm-softscroll' }, h('h2', { class: 'dk-h', text: 'How to fix it' }), list, mine, offBox), detail));
    }
    /** "Fix by": the date in words, a few usual choices counted from the inspection, or any date from the calendar. It sits beside the step's button, always in view. */
    function dueControl() {
      if (parts.due) return parts.due.el;
      const dueText = h('b', { class: 'dk-due-date' }), dueNote = h('span', { class: 'dk-due-note' });
      const chips = CHOICES.map(n => { const b = btn(daysText(n), () => { M.due.days = n; M.due.date = null; touch(); }, 'dk-due-chip'); b.setAttribute('aria-pressed', 'false'); return b; });
      const input = h('input', { class: 'dk-due-input', type: 'date', 'aria-label': 'Fix by: pick a date', tabindex: '-1' });
      input.addEventListener('change', () => { const p = (input.value || '').split('-').map(Number); if (p.length !== 3 || !p[0]) return; const x = new Date(p[0], p[1] - 1, p[2]); if (x < day0(new Date(f.at))) { syncDue(); return; } M.due.date = x; M.due.days = null; touch(); });
      const cal = sym('calendar', 'Pick a date', () => { try { input.showPicker(); } catch (e) { input.focus(); } }, '', 16);
      const el = h('div', { class: 'dk-due', role: 'group', 'aria-label': 'Fix by' }, h('p', { class: 'dk-due-line' }, h('span', { class: 'dk-due-label', text: 'Fix by' }), dueText, dueNote), h('div', { class: 'tm-btns' }, chips, h('span', { class: 'dk-due-pick' }, cal, input)));
      parts.due = { el, text: dueText, note: dueNote, chips, input }; syncDue();
      return el;
    }
    function syncDue() {
      const X = parts.due; if (!X) return; const x = dueDate(), n = dueDays(), two = v => String(v).padStart(2, '0'), s = day0(new Date(f.at));
      swapText(X.text, fmtDate(x), { size: false }); swapText(X.note, daysText(n) + ' from the inspection', { size: false });
      X.chips.forEach((b, i) => { const on = M.due.date == null && M.due.days === CHOICES[i]; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      X.input.value = x.getFullYear() + '-' + two(x.getMonth() + 1) + '-' + two(x.getDate()); X.input.min = s.getFullYear() + '-' + two(s.getMonth() + 1) + '-' + two(s.getDate());
    }
    function syncFix() {
      syncDue();
      const X = parts.fix, on = M.sols.filter(s => !s.off), off = M.sols.filter(s => s.off);
      U.keyed(X.list, on, { key: s => s.id, create: rowNode, update: (n, s) => { const C = s.ui; C.use.setAttribute('aria-checked', String(s.use)); n.classList.toggle('is-used', s.use); swapText(C.name, prefix(s) + val(s.title), { size: false }); if (C.pane) { fillSteps(C.steps, s, 'dk-step'); C.backAll.hidden = s.kind === 'own' || !isChanged(s); } } });
      U.keyed(X.offList, off, { key: s => s.id, create: s => h('div', { class: 'dk-off-row' }, h('span', { text: val(s.title) }), sym('undo', 'Undo', () => { s.off = false; touch(); look(s.id); }, '', 16)) });
      if (X.offBox.hidden === !!off.length) reveal(X.offBox, !!off.length);
      if (M.open !== 'new' && !on.some(s => s.id === M.open)) { M.open = null; if (on[0]) look(on[0].id); else X.detail.replaceChildren(); }   // always one in view: the required one first
      markRows();
    }

    // ---------------------------------------------------------------- reading a draft back into the data
    // A draft is one document (doc.js). What is typed is read back from the page a moment after each change: the
    // paragraphs of "What is wrong", each option's name and its list of steps, the contact number, a rule's
    // considerations. The page itself is never rebuilt while it is being typed into.
    const paras = t => String(t || '').split(/\n{2,}/).map(clean).filter(Boolean);
    const shownCount = s => s.shown == null ? Math.min(4, s.steps.length) : Math.min(s.shown, s.steps.length);      // the owner's page gives the first four steps, and as many as the senior makes of them there; the file document has them all
    function put(r, t) { const v = t === r.base ? null : t, was = r.cur == null ? null : r.cur; if (was === v) return false; r.cur = v; return true; }
    /** the steps as they stand in the owner's list: the same references where the words are the same, new ones for what was added */
    function stepsFrom(s, texts) {
      const n = shownCount(s), head = s.steps.slice(0, n), tail = s.steps.slice(n);
      if (texts.length === head.length) { let moved = false; head.forEach((r, i) => { if (texts[i] !== val(r) && put(r, texts[i])) moved = true; }); return moved; }
      let a = 0; while (a < head.length && a < texts.length && val(head[a]) === texts[a]) a++;
      let z = 0; while (z < head.length - a && z < texts.length - a && val(head[head.length - 1 - z]) === texts[texts.length - 1 - z]) z++;
      s.steps = [...head.slice(0, a), ...texts.slice(a, texts.length - z).map(t => ref(t)), ...head.slice(head.length - z), ...tail]; s.shown = texts.length;
      return true;
    }

    // ---------------------------------------------------------------- step 4, the last: the owner's page, a website in a browser window.
    // It is what gets published, so the Publish button is on it (and stays on it when the page is enlarged).
    // Protected pieces: the photograph, each before and after, the "Option N:" numbering, the standing of a
    // correction, the date, the label of the contact number and the rule line. Everything else is typed into.
    /** a correction's picture: the whole photograph at its own shape, never cropped; its switch under it */
    function figure(s) {
      const a = s.kind === 'own' ? f.photo.aspect : s.sol.aspect, fig = h('div', { class: 'rp-fig' }); fig.style.setProperty('--a', String(a));
      let under = null;
      if (s.kind === 'own') s.plan = P.beforeAfter(fig, { before: f.photo.src, after: '', aspect: f.photo.aspect, frame: a, view: { contain: true }, regions: s.regions, position: .5, tags: { before: 'Now', after: 'Plan, not a photo' } });
      else under = P.correctionView(fig, s.sol, { frame: a }).tools;
      return fill(h('div', { class: 'rp-figwrap' }), fig, under);
    }
    function ownerBlocks() {
      const pl = D.place(V.loc.place), list = chosen(), red = api.violations(), out = [], X = parts.owner;
      out.push({ key: 'agency', tag: 'p', cls: 'rp-agency', text: pl.agency });
      out.push({ key: 'title', tag: 'h1', cls: 'rp-title', text: 'From your fire inspection' });
      out.push({ key: 'photo', island: true, sig: 'photo', build: () => X.photo });
      out.push({ key: 'h-problem', tag: 'h2', text: 'What is wrong' });
      paras(val(M.problem)).forEach(t => out.push({ key: 'problem', tag: 'p', cls: 'rp-text', text: t, bound: true }));
      if (list.length || red.length) out.push({ key: 'h-fix', tag: 'h2', text: list.length > 1 ? 'Options for how to fix it' : 'How to fix it' });
      if (list.length > 1) out.push({ key: 'pick', tag: 'p', cls: 'rp-text rp-pick', text: 'Pick one of these.' });
      if (!list.length) out.push({ key: 'none', island: true, tag: 'p', cls: 'rp-text', text: red.length ? 'No correction has been chosen yet.' : 'The inspector did not record a violation.' });
      list.forEach(s => {
        const k = 'sol-' + s.id;
        out.push({ key: k + '-head', tag: 'h3', cls: 'rp-sol-title', lead: prefix(s), leadCls: 'rp-optn', text: val(s.title), bound: true });
        out.push({ key: k + '-stand', island: true, tag: 'p', cls: 'rp-opt', text: cap(OWNER_STAND[s.standing]) });
        out.push({ key: k + '-fig', island: true, sig: s.kind === 'own' ? JSON.stringify(s.regions) : '', build: () => figure(s), patch: () => { if (s.plan) s.plan.update({ regions: s.regions }); } });
        s.steps.slice(0, shownCount(s)).forEach(r => out.push({ key: k + '-steps', tag: 'li', list: 'ol', listCls: 'rp-steps', text: val(r), bound: true }));
      });
      if (list.length) {                                          // one definite date, said plainly; it is changed with the control under "How to fix it"
        out.push({ key: 'h-when', island: true, tag: 'h2', text: 'Fix this by ' + fmtDate(dueDate()) });
        out.push({ key: 'when', tag: 'p', cls: 'rp-text', text: 'That is ' + daysText(dueDays()) + ' from the inspection.' });
      }
      out.push({ key: 'contact', tag: 'p', cls: 'rp-text rp-contact', lead: 'Questions? Call ' + pl.agency + ' at ', text: val(M.phone) + '.', bound: true });
      if (red.length) out.push({ key: 'law', island: true, tag: 'p', cls: 'rp-law', text: 'Required by ' + red.map(st => st.r.cite).join('; ') + '.' });
      return out;
    }
    function ownerRead(blocks) {
      const of = k => blocks.filter(b => !b.island && b.key === k); let moved = false;
      if (put(M.problem, of('problem').map(b => clean(b.text)).filter(Boolean).join('\n\n'))) moved = true;
      const tel = of('contact').map(b => clean(b.text)).join(' ').replace(/\.$/, ''); if (tel && put(M.phone, tel)) moved = true;
      chosen().forEach(s => {
        const head = of('sol-' + s.id + '-head')[0]; if (head && clean(head.text) && put(s.title, clean(head.text))) moved = true;
        const items = of('sol-' + s.id + '-steps').filter(b => b.tag === 'li').map(b => clean(b.text));
        if (blocks.some(b => b.key === 'sol-' + s.id + '-steps') && stepsFrom(s, items)) moved = true;
      });
      if (moved) { syncAll(); api.changed(); }
    }
    function ownerPane() {
      const page = h('div', { class: 'rp-page' }), X = parts.owner = { page };
      const photo = P.photoBox(f.photo.src, f.photo.aspect, 'rp-photo'); photo.pct(f.photo.aspect, { contain: true }); photo.el.style.setProperty('--a', String(f.photo.aspect)); X.photo = photo.el;      // the whole photograph, at its own shape
      X.doc = window.TeamDoc.create(page, { pCls: 'rp-text', onChange: ownerRead, onSettle: settle });
      X.addr = h('span', { class: 'rp-addr' });
      X.pubBtn = h('button', { class: 'dk-primary', type: 'button', onclick: () => api.publish(true) }, h('span', { class: 'dk-primary-label', text: 'Publish' }));
      X.act = h('div', { class: 'rp-act' }, X.pubBtn);                                      // floats at the bottom right of the window
      X.undo = sym('undo', 'Undo', () => api.publish(false), '', 16);
      X.done = h('div', { class: 'rp-done', role: 'status', hidden: true }, h('i', { class: 'rp-done-mark', 'aria-hidden': 'true' }, icon('check', 13)),      // the line at the foot of the window, once published
        h('p', { class: 'rp-done-text' }, h('b', { text: 'Published' }), ' ', h('span', { text: 'Sending to the owner is not connected yet. Nothing has left this computer.' })), X.undo);
      const win = h('div', { class: 'rp-window' }, h('div', { class: 'rp-bar' }, h('span', { class: 'dk-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), X.addr, h('span')), h('div', { class: 'rp-scroll tm-softscroll tm-thinscroll' }, page), X.act, X.done);
      win.firstChild.lastChild.replaceWith(enlarger(win));
      return h('section', { class: 'dk-pane', 'data-step': 'owner' }, h('div', { class: 'dk-pane-fixed' }, win));
    }
    function syncOwner() {
      const X = parts.owner, pl = D.place(V.loc.place);
      swapText(X.addr, pl.agency + ' · your inspection', { size: false });
      X.doc.update(ownerBlocks());                                                           // waits if the page is being typed into; settle() calls again
      syncPublish();
    }
    /**
     * One click publishes. The button leaves, and then a line at the foot of the same window says what happened, with
     * Undo: nothing is sent from here, and it says so. The line takes its own height, so it never covers the page.
     */
    function syncPublish() {
      const X = parts.owner; if (!X) return;
      const on = !!V.published; X.pubBtn.disabled = !on && api.violations().length > 0 && !chosen().length;      // a violation with no correction chosen is not ready to go out
      if (X.pubOn === on) return;
      const first = X.pubOn == null; X.pubOn = on;
      if (first || U.reduced() || !X.act.offsetParent && !X.done.offsetParent) { X.act.hidden = on; X.done.hidden = !on; U.soft(); return; }
      if (on) {
        const out = U.anim(X.act, [{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: 'ease-in', fill: 'forwards' });
        const then = () => { if (out) out.cancel(); if (X.pubOn !== true) return; X.act.hidden = true; reveal(X.done, true); U.refocus(X.undo); setTimeout(U.soft, 280); };
        if (out) out.onfinish = then; else then();
      } else {
        reveal(X.done, false);
        setTimeout(() => { if (X.pubOn !== false) return; X.act.hidden = false; U.anim(X.act, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }); U.refocus(X.pubBtn); U.soft(); }, 210);
      }
    }

    // ---------------------------------------------------------------- step 3: the file document
    // A plain office document, the kind that is printed and filed: a white Letter page on a grey desk, one ordinary
    // typeface, bold headings, "Label: value" lines, the photograph as a figure with a caption, a page number at the
    // foot. Nothing of the app's own look is inside the page. Verdicts are written as words. Citations, quoted code,
    // what the app read and the lines the app works out are protected, and look like the rest of the text.
    const VW = { red: 'Violation', yellow: 'To be determined by the inspector', green: 'Compliant' };
    const plainRead = st => [st.r.lead, st.r.why, st.r.applies].filter(Boolean).join(' ');
    function stepList(s, box) { box = box || h('div', { class: 'wd-steps' }, h('ol', { class: 'wd-list' })); box.firstChild.replaceChildren(...s.steps.map(r => h('li', { text: val(r) }))); return box; }
    function fileBlocks() {
      const pl = D.place(V.loc.place), rec = B.record(scene), rows = api.rows(), red = rows.filter(st => st.verdict === 'red'), out = [], when = B.deadline(scene), list = chosen(), day = fmtDate(new Date(f.at));
      const text = x => x ? (Array.isArray(x.text) ? x.text.join(' ') : x.text) : '';
      const T = (key, t, o) => { if (t) out.push(Object.assign({ key, tag: 'p', cls: 'wd-p', text: t }, o)); };                       // a paragraph that is typed into
      const I = (key, t, cls, tag) => { if (t) out.push({ key, island: true, tag: tag || 'p', cls: cls || 'wd-p', text: t }); };       // protected text
      const H = (key, t) => out.push({ key, tag: 'h2', cls: 'wd-h', text: t });
      T('letter', pl.agency, { cls: 'wd-letter' });
      out.push({ key: 'tel', tag: 'p', cls: 'wd-letter-line', lead: 'Telephone: ', text: val(M.phone), bound: true });
      T('title', rec.title, { tag: 'h1', cls: 'wd-title' });
      I('status', 'Inspection of ' + day + '. ' + (red.length ? 'Violation recorded.' : 'No violation recorded.'));
      out.push({ key: 'fig1', island: true, sig: 'fig1', build: () => h('figure', { class: 'wd-fig' }, h('img', { src: f.photo.src, alt: '', draggable: 'false' }), h('figcaption', { text: 'Figure 1. ' + f.title + ', as photographed on ' + day + '.' })) });
      H('h-place', 'Location');
      T('place', pl.name + '. ' + D.zoneText(V.loc) + '. Fire agency: ' + pl.agency + '.' + (pl.agencyNote ? ' ' + pl.agencyNote : ''));
      (V.ev.adopted || []).filter(a => a.key !== 'agency').forEach(a => I('ad-' + a.key, a.label + ': ' + a.value + (a.cite ? ' (' + a.cite + ')' : '') + '.'));
      H('h-field', 'Field notes');
      T('note', 'Note: ' + f.note.text + (f.note.changed && f.note.appText ? ' The field inspector wrote this. The app had read: ' + f.note.appText : ''));
      f.asked.forEach(a => I('asked-' + a.id, a.ask + ' ' + (a.answered ? a.text + (a.estimate ? ' (estimated on site, not measured)' : '') + '.' : 'Not answered.')));
      f.readings.forEach(r => I('read-' + r.id, r.label + ': ' + r.value + ' (read from the photo by the app).'));
      F.callouts(scene, f.facts, new Date().getFullYear()).forEach((c, i) => T('call-' + i, c.text));
      H('h-rules', 'Applicable code sections');
      rows.filter(st => st.verdict !== 'green').forEach(st => {
        const r = st.r, k = 'row-' + st.key;
        I(k + '-t', r.title + (r.value ? ' ' + r.value + (r.unit ? ' ' + r.unit : '') : ''), 'wd-sub', 'h3');
        I(k + '-v', 'Finding: ' + VW[st.verdict] + '.');
        I(k + '-c', 'Citation: ' + r.cite + '.');
        I(k + '-r', r.requires, 'wd-quote');
        out.push({ key: k + '-a', tag: 'p', cls: 'wd-p', lead: 'Considerations: ', text: api.reading(st), bound: true });
        if (r.open) T(k + '-o', 'Still to confirm: ' + r.open);
        if (st.manual && r.verdict !== st.verdict) I(k + '-m', 'Set by the senior inspector. The app read this as: ' + VW[r.verdict] + '.');
      });
      const greens = rows.filter(st => st.verdict === 'green'); if (greens.length) I('greens', 'Compliant: ' + greens.map(st => st.r.label + ' (' + st.r.cite + ')').join('; ') + '.');
      if (rec.observed || rec.hazard) { H('h-find', 'Findings'); T('rec-o', rec.observed ? 'Observed condition: ' + text(rec.observed) : ''); T('rec-h', rec.hazard ? 'Hazard: ' + text(rec.hazard) : ''); }
      H('h-fix', 'Required corrections');
      list.forEach(s => {
        const k = 'sol-' + s.id, t = s.kind === 'prepared' ? B.technical(scene, s.id) : null;
        I(k + '-t', prefix(s) + val(s.title) + ' (' + (s.kind === 'own' ? 'the senior inspector’s own recommendation' : s.sol.standingText) + ')', 'wd-sub', 'h3');
        I(k + '-sl', 'Steps given to the owner:');
        out.push({ key: k + '-steps', island: true, sig: JSON.stringify(s.steps.map(val)), build: () => stepList(s), patch: n => stepList(s, n) });
        if (t) { T(k + '-w', 'Where: ' + t.where); T(k + '-c', 'Change: ' + t.change); T(k + '-h', 'Method: ' + t.how.join(' ')); T(k + '-k', 'Retain: ' + t.keep); T(k + '-y', 'Basis: ' + t.why); T(k + '-l', t.limit ? 'Limit: ' + t.limit : ''); }
        else I(k + '-p', (s.regions.length ? s.regions.length + (s.regions.length > 1 ? ' areas' : ' area') + ' marked on the photograph (' + s.regions.map(r => P.TREAT[r.treat].toLowerCase()).join(', ') + ').' : 'No area was marked on the photograph.') + ' No picture was generated.');
        if (s.rewrites) I(k + '-v', 'The owner’s steps were rewritten at the senior inspector’s request.');
      });
      if (!list.length) I('sol-none', red.length ? 'No correction has been chosen.' : 'None. No violation recorded.');
      if (list.length) {
        I('due', 'Correction due: ' + fmtDate(dueDate()) + ' (' + daysText(dueDays()) + ' from the inspection).');
        T('when', M.due.fromSource && when.internal ? 'Basis for the timeframe: ' + when.internal : 'The source material gives no timeframe for this finding. The date was set by the senior inspector.');
      }
      if (rec.reinspection || rec.reinspectionList.length) { H('h-rec', 'Reinspection'); T('rec-r', [text(rec.reinspection)].concat(rec.reinspectionList).filter(Boolean).join(' ')); }
      if (rec.notAcceptable || rec.limits.length) { H('h-lim', 'Limits of this record'); T('rec-n', rec.notAcceptable ? 'Not acceptable: ' + rec.notAcceptable : ''); T('rec-l', rec.limits.length ? 'Not established by the photograph: ' + rec.limits.join(' ') : ''); }
      return out;
    }
    function fileRead(blocks) {
      const of = k => blocks.filter(b => !b.island && b.key === k); let moved = false;
      api.rows().forEach(st => { const b = of('row-' + st.key + '-a'); if (!b.length) return; const t = b.map(x => clean(x.text)).filter(Boolean).join(' '), v = !t || t === plainRead(st) ? null : t; if ((st.words == null ? null : st.words) !== v) { st.words = v; api.syncRow(st); moved = true; } });
      const tel = of('tel').map(b => clean(b.text)).join(' '); if (tel && put(M.phone, tel)) moved = true;
      if (moved) { syncAll(); api.changed(); }
      paginateSoon();
    }
    // Pages. The sheet is drawn as Letter pages (8.5 x 11, one-inch margins) with a strip of desk between them. A block
    // that would run over the foot of a page is moved to the top of the next one by space above it; the text stays one
    // flow and is never split up, so the caret is not disturbed. Each page has its number at the foot.
    let pageRaf = 0;
    const paginateSoon = () => { if (!pageRaf) pageRaf = requestAnimationFrame(() => { pageRaf = 0; paginate(); }); };
    function paginate() {
      const X = parts.file; if (!X || !X.sheet.isConnected) return; const pw = X.sheet.clientWidth; if (!pw) return;
      const H = pw * 11 / 8.5, m = pw / 8.5, gap = 18, room = H - 2 * m, blocks = X.doc.blocks();
      for (const b of blocks) if (b.style.paddingTop) b.style.paddingTop = '';
      let page = 0;
      for (const b of blocks) {
        const top = b.offsetTop, hgt = b.offsetHeight;
        if (top + hgt <= page * (H + gap) + H - m + .5) continue;
        if (hgt <= room) { page++; b.style.paddingTop = Math.max(0, page * (H + gap) + m - top) + 'px'; } else while (top + hgt > page * (H + gap) + H - m) page++;
      }
      const pages = page + 1; X.body.style.minHeight = (pages * H + (pages - 1) * gap) + 'px';
      while (X.leaves.length < pages) { const leaf = h('div', { class: 'wd-leaf', 'aria-hidden': 'true' }), foot = h('div', { class: 'wd-foot', 'aria-hidden': 'true' }); X.leaves.push([leaf, foot]); X.sheet.prepend(leaf); X.sheet.append(foot); }
      while (X.leaves.length > pages) X.leaves.pop().forEach(n => n.remove());
      X.leaves.forEach((pair, i) => { pair[0].style.top = (i * (H + gap)) + 'px'; pair[0].style.height = H + 'px'; pair[1].style.top = (i * (H + gap) + H - m * .66) + 'px'; const t = 'Page ' + (i + 1) + ' of ' + pages; if (pair[1].textContent !== t) pair[1].textContent = t; });
      X.pages = pages; U.soft();
    }
    function filePane() {
      const body = h('div', { class: 'wd-body' }), X = parts.file = { body, leaves: [], pages: 1 };
      X.sheet = h('div', { class: 'wd-sheet' }, body);
      X.doc = window.TeamDoc.create(body, { pCls: 'wd-p', onChange: fileRead, onSettle: settle });
      const plain = () => X.doc.blocks().map(b => (b.innerText || b.textContent).replace(/[ \t]*\n[ \t]*/g, '\n').trim()).filter(Boolean).join('\n\n');
      const copy = btn('Copy', async () => { const t = plain(); try { await navigator.clipboard.writeText(t); } catch (e) { const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = t; document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) { /* nothing more to try */ } ta.remove(); } swapText(copy.lastChild, 'Copied', { size: false }); setTimeout(() => swapText(copy.lastChild, 'Copy', { size: false }), 1400); }, null, 'copy');
      const print = btn('Print', () => { let p = document.getElementById('tmPrint'); if (!p) { p = h('div', { id: 'tmPrint' }); document.body.append(p); } const c = body.cloneNode(true); c.removeAttribute('contenteditable'); c.style.minHeight = ''; c.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable')); c.querySelectorAll('[style]').forEach(n => { n.style.paddingTop = ''; }); p.replaceChildren(h('div', { class: 'wd-sheet' }, c)); window.print(); }, null, 'print');
      X.tools = [copy, print];                              // Copy and Print sit beside the step's button at the bottom, not in a bar over the page
      const frame = h('div', { class: 'doc-frame' }, h('div', { class: 'doc-scroll tm-softscroll tm-thinscroll' }, X.sheet)); frame.prepend(enlarger(frame));
      if (window.ResizeObserver) new ResizeObserver(paginateSoon).observe(X.sheet);
      return h('section', { class: 'dk-pane', 'data-step': 'file' }, h('div', { class: 'dk-pane-fixed' }, frame));
    }
    function syncFile() { parts.file.doc.update(fileBlocks()); paginateSoon(); }

    const BUILD = { fix: fixPane, file: filePane, owner: ownerPane }, SYNC = { fix: syncFix, file: syncFile, owner: syncOwner };
    function syncAll(skip) { for (const id in panes) SYNC[id](); refresh(skip); U.soft(); }
    /** a draft has been left: steps that were left empty go, and everything is brought up to date (a draft is not touched while it is being typed into) */
    function settle() { let moved = false; M.sols.forEach(s => { const n = shownCount(s), keep = s.steps.filter((r, i) => i >= n || clean(val(r))); if (keep.length !== s.steps.length) { s.shown = n - (s.steps.length - keep.length); s.steps = keep; moved = true; } }); syncAll(); if (moved) api.changed(); }
    return {
      model: M, chosen, due: () => ({ date: dueDate(), days: dueDays(), text: fmtDate(dueDate()) }), setDue: n => { M.due.days = n; M.due.date = null; touch(); }, docs: () => ({ owner: parts.owner && parts.owner.doc, file: parts.file && parts.file.doc }),
      pane(step) { if (!panes[step]) { panes[step] = BUILD[step](); SYNC[step](); refresh(); } return panes[step]; },
      shown(step) { bigs.forEach(c => c(true)); if (panes[step]) { SYNC[step](); refresh(); U.syncAllSegs(panes[step]); U.soft(); if (step === 'file') paginateSoon(); } },
      ready: step => step !== 'fix' || chosen().length > 0,
      sync: () => syncAll(),
      published() { syncPublish(); },
      /** put an enlarged draft back at once (the finding is being left) */
      shut() { bigs.forEach(c => c(true)); },
      /** what sits beside the step's button at the bottom (Copy and Print for the file document) */
      tools: step => (step === 'file' && parts.file ? parts.file.tools : step === 'fix' ? [dueControl()] : []),
    };
  }
  return { attach };
})();
