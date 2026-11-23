// team/desk-draft.js: what comes after the finding is approved.
//   How to fix it    the corrections, each with its before and after and the owner's steps. Tick the ones to use,
//                    change the instructions (the pencil), ask for a rewrite, set one aside, or write one of your own.
//   For the file     the same finding in technical language, as a document page, for the record.
//   For the owner    the owner's page as they will see it: a website, shown in a browser window at desktop width.
//                    It is the last step and the thing that is published, so its Publish button sits on the window
//                    and goes with it when the page is enlarged. Sending is not connected; it says so at that moment.
// The two drafts are documents: click in the text and type. Citations, pictures and the before / after are fixed.
// The first drafts are prepared from the source files (drafts.js). The model is only asked when the inspector asks
// for a rewrite or writes a correction of their own (POST /api/team/draft); what comes back has already been
// checked on the server against the sources. One set of words: a step edited here changes on the owner's page too.
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
    const M = { problem: ref(problemShort(scene)), deadline: ref(B.deadline(scene).resident), doc: {}, ownN: 0, open: null, pos: .5 };
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
    /**
     * In a document (the two drafts): click and type. It saves as you type; clicking away or Escape keeps the edit.
     * Undo (Cmd or Ctrl + Z; with Shift, redo) steps back through what was typed into THIS text and nothing else, and
     * the page keeps that history itself. The browser's own undo runs through every text on the page, including steps
     * that are out of sight, and forgets a text once it has been moved (as Enlarge does), so it is not used here.
     */
    function direct(tag, cls, r, multi) {
      const el = h(tag, { class: cls + ' tm-direct', contenteditable: 'plaintext-only', spellcheck: 'true', text: val(r) });
      if (!el.isContentEditable) el.setAttribute('contenteditable', 'true');
      const tidy = t => t.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
      const keep = t => { r.cur = !t || t === r.base ? null : t; syncAll(el); api.changed(); };
      const H = { past: [], future: [], now: val(r), kind: '', at: 0 };
      /** step to another state of this text; the caret goes to where the change was */
      const put = t => {
        const a = H.now; let i = 0, j = 0;
        while (i < a.length && i < t.length && a[i] === t[i]) i++;
        while (j < a.length - i && j < t.length - i && a[a.length - 1 - j] === t[t.length - 1 - j]) j++;
        el.textContent = t; H.now = t; H.at = 0;
        const n = el.firstChild, s = getSelection(); if (n && s) { try { s.collapse(n, Math.min(n.length, t.length - j)); } catch (e) { /* no caret to place */ } }
        keep(tidy(t));
      };
      const undo = () => { if (H.past.length) { H.future.push(H.now); put(H.past.pop()); } };
      const redo = () => { if (H.future.length) { H.past.push(H.now); put(H.future.pop()); } };
      el.addEventListener('focus', () => { const t = el.innerText; if (t !== H.now) { H.past = []; H.future = []; H.now = t; } H.at = 0; });      // changed from elsewhere since: its history starts again here
      el.addEventListener('beforeinput', e => { if (e.inputType === 'historyUndo') { e.preventDefault(); undo(); } else if (e.inputType === 'historyRedo') { e.preventDefault(); redo(); } });
      el.addEventListener('input', e => {
        const t = el.innerText, kind = /^delete/.test(e.inputType || '') ? 'out' : /^insert(Text|CompositionText)$/.test(e.inputType || '') ? 'in' : 'other';
        if (t !== H.now) {                                    // a run of typing is one step back; a pause, a paste or a change of direction starts the next
          if (kind === 'other' || kind !== H.kind || Date.now() - H.at > 700) { H.past.push(H.now); if (H.past.length > 200) H.past.shift(); }
          H.future = []; H.now = t; H.kind = kind; H.at = Date.now();
        }
        keep(tidy(t));
      });
      el.addEventListener('blur', () => { if (!clean(el.textContent)) { r.cur = null; el.textContent = val(r); H.now = el.innerText; H.at = 0; syncAll(); } });      // emptied: its own words come back
      el.addEventListener('keydown', e => {
        e.stopPropagation(); const key = (e.key || '').toLowerCase(), mod = (e.metaKey || e.ctrlKey) && !e.altKey;
        if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        else if (mod && key === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 'Escape' || (e.key === 'Enter' && !multi)) { e.preventDefault(); el.blur(); }
      });
      el.addEventListener('paste', e => { e.preventDefault(); const t = (e.clipboardData || window.clipboardData).getData('text/plain'); document.execCommand('insertText', false, multi ? t : t.replace(/\s+/g, ' ')); });
      el.addEventListener('keyup', e => e.stopPropagation());
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
    function fillSteps(ol, s, cls, how, most) {
      if (ol.stepsOf === s.steps) return; ol.stepsOf = s.steps;
      ol.replaceChildren(...s.steps.slice(0, most || 99).map(r => h('li', null, how === 'direct' ? direct('span', cls, r) : words('span', cls, r))));
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
    function syncFix() {
      const X = parts.fix, on = M.sols.filter(s => !s.off), off = M.sols.filter(s => s.off);
      U.keyed(X.list, on, { key: s => s.id, create: rowNode, update: (n, s) => { const C = s.ui; C.use.setAttribute('aria-checked', String(s.use)); n.classList.toggle('is-used', s.use); swapText(C.name, prefix(s) + val(s.title), { size: false }); if (C.pane) { fillSteps(C.steps, s, 'dk-step'); C.backAll.hidden = s.kind === 'own' || !isChanged(s); } } });
      U.keyed(X.offList, off, { key: s => s.id, create: s => h('div', { class: 'dk-off-row' }, h('span', { text: val(s.title) }), sym('undo', 'Undo', () => { s.off = false; touch(); look(s.id); }, '', 16)) });
      if (X.offBox.hidden === !!off.length) reveal(X.offBox, !!off.length);
      if (M.open !== 'new' && !on.some(s => s.id === M.open)) { M.open = null; if (on[0]) look(on[0].id); else X.detail.replaceChildren(); }   // always one in view: the required one first
      markRows();
    }

    // ---------------------------------------------------------------- step 4, the last: the owner's page, a website in a browser window.
    // It is what gets published, so the Publish button is on it (and stays on it when the page is enlarged).
    function ownerSol(s) {
      const fig = h('div', { class: 'rp-fig' }), ol = h('ol', { class: 'rp-steps' }); let under = null;
      if (s.kind === 'own') s.plan = P.beforeAfter(fig, { before: f.photo.src, after: '', aspect: f.photo.aspect, frame: 4 / 3, view: { focus: f.focus }, regions: s.regions, position: .5, tags: { before: 'Now', after: 'Plan, not a photo' } });
      else under = P.correctionView(fig, s.sol, { frame: 4 / 3 }).tools;                 // the "Show what changed" switch goes under the picture
      const num = h('span', { class: 'rp-optn', text: prefix(s) });
      const el = h('section', { class: 'rp-sol' }, h('div', { class: 'rp-sol-head' }, h('h3', { class: 'rp-sol-title' }, num, direct('span', 'rp-sol-name', s.title)), h('p', { class: 'rp-opt', text: cap(OWNER_STAND[s.standing]) })),
        h('div', { class: 'rp-figwrap' }, fig, under), ol); el.steps = ol; el.num = num;
      return el;
    }
    function ownerPane() {
      const page = h('div', { class: 'rp-page' }), X = parts.owner = { page };
      const photo = P.photoBox(f.photo.src, f.photo.aspect, 'rp-photo'); photo.pct(3, { focus: f.focus });           // the photograph, clean. 3 : 1, the shape .rp-photo has in desk.css
      X.agency = h('p', { class: 'rp-agency' }); X.fixHead = h('h2', { text: 'How to fix it' }); X.pick = h('p', { class: 'rp-text rp-pick', text: 'Pick one of these.', hidden: true }); X.addr = h('span', { class: 'rp-addr' }); X.sols = h('div', { class: 'rp-sols' }); X.none = h('p', { class: 'rp-text' }); X.contact = h('p', { class: 'rp-text' }); X.law = h('p', { class: 'rp-law' });
      fill(page, X.agency, h('h1', { class: 'rp-title', text: 'From your fire inspection' }), photo.el, h('h2', { text: 'What is wrong' }), direct('p', 'rp-text', M.problem, true),
        X.fixHead, X.pick, X.none, X.sols, h('h2', { text: 'Fix by' }), direct('p', 'rp-text', M.deadline, true), h('h2', { text: 'Questions' }), X.contact, X.law);
      X.pubBtn = h('button', { class: 'dk-primary', type: 'button', onclick: () => api.publish(true) }, h('span', { class: 'dk-primary-label', text: 'Publish' }));
      X.act = h('div', { class: 'rp-act' }, X.pubBtn);                                      // floats at the bottom right of the window
      X.undo = sym('undo', 'Undo', () => api.publish(false), '', 16);
      X.done = h('div', { class: 'rp-done', role: 'status', hidden: true }, h('i', { class: 'rp-done-mark', 'aria-hidden': 'true' }, icon('check', 13)),      // the line at the foot of the window, once published
        h('p', { class: 'rp-done-text' }, h('b', { text: 'Published' }), ' ', h('span', { text: 'Sending to the owner is not connected yet. Nothing has left this computer.' })), X.undo);
      const win = h('div', { class: 'rp-window' }, h('div', { class: 'rp-bar' }, h('span', { class: 'dk-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), X.addr, h('span')), h('div', { class: 'rp-scroll tm-softscroll tm-thinscroll' }, page), X.act, X.done);
      win.firstChild.lastChild.replaceWith(enlarger(win));
      return h('section', { class: 'dk-pane', 'data-step': 'owner' }, h('div', { class: 'dk-pane-fixed' }, win));      // nothing above it: the breadcrumb says which step this is, and the page is edited by clicking and typing
    }
    function syncOwner() {
      const X = parts.owner, pl = D.place(V.loc.place), list = chosen(), red = api.violations();
      swapText(X.agency, pl.agency, { size: false }); swapText(X.addr, pl.agency + ' · your inspection', { size: false });
      swapText(X.fixHead, list.length > 1 ? 'Options for how to fix it' : 'How to fix it', { size: false }); X.pick.hidden = list.length < 2;
      U.keyed(X.sols, list, { key: s => s.id, create: ownerSol, update: (n, s) => { swapText(n.num, prefix(s), { size: false }); fillSteps(n.steps, s, 'rp-step', 'direct', 4); if (s.plan) s.plan.update({ regions: s.regions }); } });
      const none = list.length ? '' : red.length ? 'No correction has been chosen yet.' : 'The inspector did not record a violation.';
      X.none.hidden = !none; if (none) swapText(X.none, none);
      swapText(X.contact, pl.agency + '. The phone number is not on file.');
      const law = red.length ? 'Required by ' + red.map(st => st.r.cite).join('; ') + '.' : ''; X.law.hidden = !law; if (law) swapText(X.law, law);
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

    // ---------------------------------------------------------------- step 3: the file document, a page
    const rowRef = st => ({ get base() { return [st.r.lead, st.r.why, st.r.applies].filter(Boolean).join(' '); }, get cur() { return st.words; }, set cur(v) { st.words = v; api.syncRow(st); } });
    function docBlocks() {
      const pl = D.place(V.loc.place), rec = B.record(scene), rows = api.rows(), red = rows.filter(st => st.verdict === 'red'), out = [], when = B.deadline(scene);
      const add = (key, tag, text, o) => { if (text || (o && (o.ref || o.photo))) out.push(Object.assign({ key, tag, text: text || '' }, o)); };
      const text = x => x ? (Array.isArray(x.text) ? x.text.join(' ') : x.text) : '';
      add('photo', 'p', '', { photo: true });
      add('title', 'h2', rec.title);
      add('status', 'p', (red.length ? 'Violation recorded' : 'No violation recorded') + ' · ' + new Date(f.at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), { fixed: true, cls: 'doc-status' });
      add('h-place', 'h3', 'Place');
      add('place', 'p', pl.name + '. ' + D.zoneText(V.loc) + '. Fire agency: ' + pl.agency + '.' + (pl.agencyNote ? ' ' + pl.agencyNote : ''));
      (V.ev.adopted || []).filter(a => a.key !== 'agency').forEach(a => add('ad-' + a.key, 'p', a.label + ': ' + a.value + (a.cite ? ' (' + a.cite + ')' : '') + '.', { fixed: true, cls: 'doc-fact' }));
      add('h-field', 'h3', 'From the field');
      add('note', 'p', 'Note: ' + f.note.text + (f.note.changed && f.note.appText ? ' The field inspector wrote this. The app had read: ' + f.note.appText : ''));
      f.asked.forEach(a => add('asked-' + a.id, 'p', a.ask + ' ' + (a.answered ? a.text + (a.estimate ? ' (estimated on site, not measured)' : '') + '.' : 'Not answered.'), { fixed: true, cls: 'doc-fact' }));
      f.readings.forEach(r => add('read-' + r.id, 'p', r.label + ': ' + r.value + ' (read from the photo by the app).', { fixed: true, cls: 'doc-fact' }));
      F.callouts(scene, f.facts, new Date().getFullYear()).forEach((c, i) => add('call-' + i, 'p', c.text));
      add('h-rules', 'h3', 'Rules');
      rows.filter(st => st.verdict !== 'green').forEach(st => {
        const r = st.r, k = 'row-' + st.key;
        add(k + '-t', 'h4', word(st.verdict) + ': ' + r.title + (r.value ? ' ' + r.value + (r.unit ? ' ' + r.unit : '') : ''), { verdict: st.verdict });
        add(k + '-c', 'p', r.cite, { fixed: true, cls: 'doc-cite' });
        add(k + '-r', 'p', r.requires, { rule: true });
        add(k + '-a', 'p', '', { ref: st.docRef || (st.docRef = rowRef(st)) });
        if (r.open) add(k + '-o', 'p', 'Still to confirm: ' + r.open);
        if (st.manual && r.verdict !== st.verdict) add(k + '-m', 'p', 'Set by the senior inspector. The app read this as ' + word(r.verdict) + '.', { fixed: true, cls: 'doc-fact' });
      });
      const greens = rows.filter(st => st.verdict === 'green'); if (greens.length) add('greens', 'p', 'Clear: ' + greens.map(st => st.r.label + ' (' + st.r.cite + ')').join('; ') + '.', { fixed: true, cls: 'doc-fact' });
      add('h-fix', 'h3', 'Corrections');
      const list = chosen();
      list.forEach(s => {
        const k = 'sol-' + s.id, t = s.kind === 'prepared' ? B.technical(scene, s.id) : null;
        add(k + '-t', 'h4', prefix(s) + val(s.title) + ' (' + (s.kind === 'own' ? 'the senior inspector’s own recommendation' : s.sol.standingText) + ')');
        if (s.kind === 'prepared') add(k + '-o', 'p', 'The owner’s steps in full: ' + s.steps.map((r, i) => (i + 1) + '. ' + val(r)).join(' '), { fixed: true, cls: 'doc-fact' });
        if (t) { add(k + '-w', 'p', 'Where: ' + t.where); add(k + '-c', 'p', 'Change: ' + t.change); add(k + '-h', 'p', 'Method: ' + t.how.join(' ')); add(k + '-k', 'p', 'Retain: ' + t.keep); add(k + '-y', 'p', 'Basis: ' + t.why); add(k + '-l', 'p', t.limit ? 'Limit: ' + t.limit : ''); }
        else { add(k + '-s', 'p', 'Steps as written for the owner: ' + s.steps.map(val).join(' '), { fixed: true }); add(k + '-p', 'p', (s.regions.length ? s.regions.length + (s.regions.length > 1 ? ' areas' : ' area') + ' marked on the photograph (' + s.regions.map(r => P.TREAT[r.treat].toLowerCase()).join(', ') + ').' : 'No area was marked on the photograph.') + ' No picture was generated.', { fixed: true, cls: 'doc-fact' }); }
        if (s.rewrites) add(k + '-v', 'p', 'The owner’s steps were rewritten at the senior inspector’s request.', { fixed: true, cls: 'doc-fact' });
      });
      if (!list.length) add('sol-none', 'p', red.length ? 'No correction has been chosen.' : 'None. No violation recorded.', { fixed: true });
      add('h-when', 'h3', 'Timeframe'); add('when', 'p', when.internal); add('when-owner', 'p', 'As told to the owner: ' + val(M.deadline), { fixed: true, cls: 'doc-fact' });
      add('h-rec', 'h3', 'Record');
      add('rec-o', 'p', rec.observed ? 'Observed condition: ' + text(rec.observed) : ''); add('rec-h', 'p', rec.hazard ? 'Hazard: ' + text(rec.hazard) : '');
      add('rec-r', 'p', rec.reinspection || rec.reinspectionList.length ? 'Reinspection: ' + [text(rec.reinspection)].concat(rec.reinspectionList).filter(Boolean).join(' ') : '');
      add('rec-n', 'p', rec.notAcceptable ? 'Not acceptable: ' + rec.notAcceptable : ''); add('rec-l', 'p', rec.limits.length ? 'Not established by the photograph: ' + rec.limits.join(' ') : '');
      return out;
    }
    function docNode(b) {
      if (b.photo) { const ph = P.photoBox(f.photo.src, f.photo.aspect, 'doc-photo'); ph.pct(4 / 3, { focus: f.focus }); return ph.el; }
      if (b.tag !== 'p') return h(b.tag, { class: 'doc-' + b.tag, 'data-verdict': b.verdict }, b.verdict ? h('i', { class: 'verdict-mark', 'data-verdict': b.verdict, 'aria-hidden': 'true' }) : null, h('span', { text: b.text }));
      if (b.rule) { const p = h('p', { class: 'doc-rule' }); D.fillRule(p, b.text); p.said = b.text; return p; }
      if (b.fixed) return h('p', { class: 'doc-p is-fixed ' + (b.cls || ''), text: b.text });
      return direct('p', 'doc-p ' + (b.cls || ''), b.ref || (M.doc[b.key] = M.doc[b.key] || ref(b.text)), true);
    }
    function docUpdate(n, b) {
      if (b.photo) return;
      if (b.tag !== 'p') { n.dataset.verdict = b.verdict || ''; if (n.firstChild.dataset) n.firstChild.dataset.verdict = b.verdict; swapText(n.lastChild, b.text, { size: false }); }
      else if (b.rule) { if (n.said !== b.text) { n.said = b.text; U.crossfade(n, () => D.fillRule(n, b.text)); } }
      else if (b.fixed) swapText(n, b.text);
      else if (!b.ref) M.doc[b.key].base = b.text;            // the words under an edit stay; Undo returns to these
    }
    function filePane() {
      const doc = h('div', { class: 'doc-page' }), X = parts.file = { doc, first: true };
      const plain = () => [...doc.children].filter(n => !n.classList.contains('doc-photo')).map(n => n.innerText.trim()).filter(Boolean).join('\n\n');
      const copy = btn('Copy', async () => { const t = plain(); try { await navigator.clipboard.writeText(t); } catch (e) { const ta = h('textarea', { style: { position: 'fixed', opacity: '0' } }); ta.value = t; document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) { /* nothing more to try */ } ta.remove(); } swapText(copy.lastChild, 'Copied', { size: false }); setTimeout(() => swapText(copy.lastChild, 'Copy', { size: false }), 1400); }, null, 'copy');
      const print = btn('Print', () => { let p = document.getElementById('tmPrint'); if (!p) { p = h('div', { id: 'tmPrint' }); document.body.append(p); } const c = doc.cloneNode(true); c.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable')); p.replaceChildren(c); window.print(); }, null, 'print');
      X.tools = [copy, print];                              // Copy and Print sit beside the step's button at the bottom, not in a bar over the page
      const frame = h('div', { class: 'doc-frame' }, h('div', { class: 'doc-scroll tm-softscroll tm-thinscroll' }, doc)); frame.prepend(enlarger(frame));
      return h('section', { class: 'dk-pane', 'data-step': 'file' }, h('div', { class: 'dk-pane-fixed' }, frame));
    }
    function syncFile() { const X = parts.file; U.keyed(X.doc, docBlocks(), { key: b => b.key, create: docNode, update: docUpdate, enter: !X.first }); X.first = false; }

    const BUILD = { fix: fixPane, file: filePane, owner: ownerPane }, SYNC = { fix: syncFix, file: syncFile, owner: syncOwner };
    function syncAll(skip) { for (const id in panes) SYNC[id](); refresh(skip); U.soft(); }
    return {
      model: M, chosen,
      pane(step) { if (!panes[step]) { panes[step] = BUILD[step](); SYNC[step](); refresh(); } return panes[step]; },
      shown(step) { bigs.forEach(c => c(true)); if (panes[step]) { SYNC[step](); refresh(); U.syncAllSegs(panes[step]); U.soft(); } },
      ready: step => step !== 'fix' || chosen().length > 0,
      sync: () => syncAll(),
      published() { syncPublish(); },
      /** put an enlarged draft back at once (the finding is being left) */
      shut() { bigs.forEach(c => c(true)); },
      /** what sits beside the step's button at the bottom (Copy and Print for the file document) */
      tools: step => (step === 'file' && parts.file ? parts.file.tools : []),
    };
  }
  return { attach };
})();
