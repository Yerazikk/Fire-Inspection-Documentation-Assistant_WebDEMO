// team/desk.js: the senior inspector's laptop. One finding at a time, one way forward:
//   Finding  ->  How to fix it  ->  For the file  ->  For the owner
// The owner's page is the last step and the thing that is published, so its Publish button is on that page.
// The photograph and the field inspector's note stay in place on the left through every step. This file owns the
// frame (what was received, the steps, the breadcrumb) and step 1, the rules. Steps 2 to 4 are in desk-draft.js.
// At rest a rule is one line: verdict, name, citation. The line opens in place for the rule's own words, what the
// app thinks and what is still to confirm. Pressing the verdict turns it, where it stands, into the system's small
// two-part switch, Violation | Clear, and the name moves aside to make room. The list is sorted red, yellow, green ONCE,
// when the finding opens, from the app's own verdicts. After that every row stays where it is: changing a verdict
// changes that row's mark and word in place, and the counts, and nothing moves under the pointer.
// The place is kept in state (Ross on this tab). relocate() re-reads the open finding for another place and patches it
// where it stands; nothing on this tab calls it now that the map is gone.
window.TeamDesk = (function () {
  'use strict';
  const U = window.TeamUI, { h, icon, anim, swapText, crossfade, rise, btn, sym, reveal, refocus } = U, D = window.TeamData, F = window.TeamFlow, P = window.TeamPhoto;
  const STEPS = [['finding', 'Finding'], ['fix', 'How to fix it'], ['file', 'For the file'], ['owner', 'For the owner']];
  const WORD = { review: 'To review', fix: 'Fixes to choose', draft: 'Draft ready', published: 'Published' };
  const ORDER = ['red', 'yellow', 'green'];
  const views = new Map(), hooks = { published: null, select: null };
  let root, panes, listEl, mainEl, emptyEl, zoomEl, tog = null, current = null, seedN = 0;
  const vd = () => D.VERDICT();
  const word = v => vd()[v].word;

  // ---------------------------------------------------------------- what was received. Shown only once there is more than one.
  function itemNode(f) {
    const b = P.photoBox(f.photo.src, f.photo.aspect, 'dk-item-thumb'); b.pct(4 / 3, { focus: f.focus });
    return h('li', { class: 'dk-item', 'data-key': f.id, 'data-state': 'review' }, h('button', { class: 'dk-item-btn', type: 'button', onclick: () => select(f.id) }, b.el, h('span', { class: 'dk-item-title', text: f.title }), h('span', { class: 'dk-item-state', text: WORD.review })));
  }
  const itemOf = id => listEl.querySelector('.dk-item[data-key="' + id + '"]');
  function setItem(V) {
    const s = V.published ? 'published' : !V.approved ? 'review' : V.flow[V.reached] === 'fix' ? 'fix' : 'draft'; V.state = s;
    const n = itemOf(V.f.id); if (n && n.dataset.state !== s) { n.dataset.state = s; swapText(n.querySelector('.dk-item-state'), WORD[s], { size: false }); }
  }
  const syncRail = () => { panes.dataset.rail = views.size >= 2 ? 'on' : 'off'; };
  /** a finding is on its way from the phone: make its place, and say where the photograph should land */
  function reserve(f) {
    if (views.has(f.id)) return null;
    const V = buildView(f), item = itemNode(f); views.set(f.id, V);
    V.el.classList.add('is-arriving'); item.classList.add('is-arriving');
    const others = [...listEl.children], first = U.tops(others); listEl.prepend(item); U.glide(others, first);
    mainEl.append(V.el); syncRail();
    if (!current) { select(f.id); return V.photo.el; }                 // the first one lands straight in the open finding
    return item.querySelector('.dk-item-thumb');
  }
  function land(f) {
    const V = views.get(f.id), item = itemOf(f.id); if (!V) return;
    if (item) item.classList.remove('is-arriving');
    if (V.el.classList.contains('is-arriving')) { V.el.classList.remove('is-arriving'); if (current === f.id) rise(V.el.querySelectorAll('[data-rise]')); }
  }
  function select(id) {
    const V = views.get(id); if (!V || current === id) return;
    closeToggle(true);
    const old = current && views.get(current); current = id;
    if (old) { old.el.classList.remove('is-on'); old.el.inert = true; }
    V.el.classList.add('is-on'); V.el.inert = false; emptyEl.classList.remove('is-on');
    listEl.querySelectorAll('.dk-item').forEach(n => { const on = n.dataset.key === id; n.classList.toggle('is-on', on); n.firstChild.setAttribute('aria-current', on ? 'true' : 'false'); });
    requestAnimationFrame(() => placeCrumb(V, true));
    if (hooks.select) hooks.select(V.f);
  }

  // ---------------------------------------------------------------- the photograph, enlarged from where it sits
  function zoom(fromEl, photo, o) {
    if (zoomEl.firstChild) return;
    const opt = o || {}, R = root.getBoundingClientRect(), a = fromEl.getBoundingClientRect(), pad = 44;
    const w = Math.min(R.width - pad * 2, (R.height - pad * 2) * photo.aspect), hgt = w / photo.aspect;
    const to = { left: (R.width - w) / 2, top: (R.height - hgt) / 2, width: w, height: hgt }, from = { left: a.left - R.left, top: a.top - R.top, width: a.width, height: a.height };
    const box = P.photoBox(photo.src, photo.aspect, 'dk-zoom-box'), px = g => ({ left: g.left + 'px', top: g.top + 'px', width: g.width + 'px', height: g.height + 'px' });
    const p0 = P.fit(from.width, from.height, photo.aspect, opt.view || { focus: [50, 50] }), p1 = P.fit(to.width, to.height, photo.aspect, { contain: true });
    Object.assign(box.el.style, px(to)); Object.assign(box.plate.style, px(p1));
    const veil = h('div', { class: 'dk-zoom-veil' }), x = sym('close', 'Close', null, 'dk-zoom-x');
    zoomEl.append(veil, box.el, x); zoomEl.classList.add('is-on'); fromEl.style.visibility = 'hidden';
    const T = { duration: 300, easing: U.FLAT };
    anim(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' }); anim(box.el, [px(from), px(to)], T); anim(box.plate, [px(p0), px(p1)], T);
    let closing = false;
    const close = () => {                                   // the exact reverse, with no overshoot
      if (closing) return; closing = true; document.removeEventListener('keydown', key, true);
      const done = () => { fromEl.style.visibility = ''; zoomEl.replaceChildren(); zoomEl.classList.remove('is-on'); refocus(opt.back); };
      anim(veil, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out', fill: 'forwards' }); anim(box.plate, [px(p1), px(p0)], Object.assign({ fill: 'forwards' }, T));
      const z = anim(box.el, [px(to), px(from)], Object.assign({ fill: 'forwards' }, T)); if (z) z.onfinish = done; else done();
    };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', key, true); veil.onclick = close; box.el.onclick = close; x.onclick = close; refocus(x);
  }

  // ---------------------------------------------------------------- the left column: photograph, note, where, what was recorded
  const townLine = V => { const z = D.zoneText(V.loc); return D.place(V.loc.place).short + (z ? ' · ' + z : ''); };
  function recorded(V, notes) {
    const f = V.f, out = notes.map(n => h('p', { class: 'dk-rec-note', text: n.text }));
    const shot = a => { const b = P.photoBox(a.photo.src, a.photo.aspect, 'dk-rec-shot'); b.pct(4 / 3, { focus: [50, 50] }); const open = sym('expand', 'Enlarge', () => zoom(b.el, a.photo, { back: open }), 'dk-rec-enlarge', 16); return h('dd', { class: 'dk-rec-photo' }, b.el, open); };
    if (f.asked.length) out.push(h('h4', { class: 'shell-label', text: 'Asked on site' }), h('dl', { class: 'dk-rec-list' }, f.asked.map(a => [h('dt', { text: a.ask }), h('dd', { class: a.answered ? '' : 'is-none', text: a.answered ? a.text + (a.estimate ? ', estimated' : '') : 'Not answered' }), a.photo ? shot(a) : null])));
    if (f.readings.length) out.push(h('h4', { class: 'shell-label', text: 'Read from the photo by the app' }), h('dl', { class: 'dk-rec-list is-pairs' }, f.readings.map(r => [h('dt', { text: r.label }), h('dd', { text: r.value + (r.changed ? ' (corrected on site)' : '') })])));
    return out;
  }
  function context(V) {
    const f = V.f, box = P.photoBox(f.photo.src, f.photo.aspect, 'dk-photo-img'); box.pct(4 / 3, { focus: f.focus }); V.photo = box;
    const notes = f.scene === 'custom' ? [] : F.callouts(f.scene, f.facts, new Date().getFullYear());
    const more = h('div', { class: 'dk-recorded', hidden: true }, recorded(V, notes));
    const toggle = btn('What the field inspector recorded', () => { const open = more.hidden; toggle.setAttribute('aria-expanded', String(open)); toggle.classList.toggle('is-open', open); reveal(more, open); }, 'is-quiet dk-recorded-toggle', 'chevD');
    toggle.setAttribute('aria-expanded', 'false');
    const enlarge = sym('expand', 'Enlarge', () => zoom(box.el, f.photo, { view: { focus: f.focus }, back: enlarge }), 'dk-enlarge', 17);
    V.town = h('p', { class: 'dk-town', text: townLine(V) });
    return h('aside', { class: 'dk-context tm-softscroll' }, h('div', { class: 'dk-photo' }, box.el, enlarge), h('p', { class: 'dk-note', 'data-rise': '', text: f.note.text }),
      h('div', { class: 'dk-meta', 'data-rise': '' }, V.town, notes[0] ? h('p', { class: 'dk-fieldline', text: notes[0].short }) : null, f.asked.length || f.readings.length ? toggle : null, more));
  }

  // ---------------------------------------------------------------- step 1: the rules
  /** what a closed row shows of the citation: the section, and for a local rule the town's own chapter */
  function citeParts(r) {
    if (r.layer === 'state') return ['', r.citeShort || r.cite];
    const m = /(?:·|as added by|as amended by)\s*([^·]+)$/.exec(r.cite), local = m ? m[1].trim() : r.cite;
    return [m && r.citeShort ? r.citeShort + ' · ' : '', local];
  }
  const reading = st => st.words != null ? st.words : [st.r.lead, st.r.why, st.r.applies].filter(Boolean).join(' ');
  const sorted = V => [...V.rows.values()].sort((a, b) => D.RANK[a.verdict] - D.RANK[b.verdict] || a.r.order - b.r.order);
  const violations = V => [...V.rows.values()].filter(st => st.verdict === 'red');
  function heading(V) { return V.f.scene === 'custom' ? 'No rules attached' : 'Rules that apply in ' + D.place(V.loc.place).inSentence; }
  function gapText(V) {
    if (V.f.scene === 'custom') return 'The app could not read this photo, so it attached no rules.';
    if (V.ev.missing) return 'The rules did not load.';
    if (!V.ev.carried) return 'The local rules for ' + D.place(V.loc.place).short + ' are not in the app. Only state law is listed.';
    return '';
  }
  function mkRow(V, r) {
    const st = { key: r.key, r, verdict: r.verdict, manual: false, words: null, built: false };
    const c = citeParts(r);
    st.mark = U.verdictMark(r.verdict, word(r.verdict));
    st.vbtn = h('button', { class: 'dk-verdict', type: 'button', 'aria-expanded': 'false', onclick: () => openToggle(V, st) }, st.mark);
    st.name = h('span', { class: 'dk-row-name', text: r.label });
    st.citeSec = h('span', { class: 'dk-cite-sec', text: c[0] }); st.citeLocal = h('span', { class: 'dk-cite-local', text: c[1] });
    st.openBtn = h('button', { class: 'dk-row-open', type: 'button', 'aria-expanded': 'false', onclick: () => toggleRow(V, st) }, st.name, h('span', { class: 'dk-row-cite' }, st.citeSec, st.citeLocal), h('span', { class: 'dk-row-more' }, h('span', { text: 'Details' }), icon('chevD', 14)));
    st.body = h('div', { class: 'dk-row-body', hidden: true });
    st.node = h('li', { class: 'dk-row', 'data-verdict': r.verdict, 'data-key': r.key }, h('div', { class: 'dk-row-line' }, st.vbtn, st.openBtn), st.body);
    st.node.addEventListener('keydown', e => {                      // 1 2 3 or R Y G set the verdict of the row that has the focus
      if (e.target.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      const v = { 1: 'red', 2: 'yellow', 3: 'green', r: 'red', y: 'yellow', g: 'green' }[e.key.toLowerCase()];
      if (v) { e.preventDefault(); pick(V, st, v); }
    });
    V.rows.set(r.key, st);
    return st;
  }
  function buildBody(V, st) {
    st.built = true;
    st.rule = h('p', { class: 'dk-rule' }); st.citeFull = h('p', { class: 'dk-cite-full' });
    st.read = h('p', { class: 'dk-read', text: reading(st) });
    st.backBtn = sym('undo', 'Undo', () => { st.words = null; crossfade(st.read, () => { st.read.textContent = reading(st); }); syncRow(V, st); changed(V); }, '', 16);
    st.readTools = h('div', { class: 'tm-btns dk-read-tools' }, U.pencil(st.read, { onSave: t => { st.words = t; syncRow(V, st); changed(V); } }).btn, st.backBtn);
    st.confirmText = h('span'); st.confirm = h('p', { class: 'dk-confirm' }, h('i', { class: 'verdict-mark', 'data-verdict': 'yellow', 'aria-hidden': 'true' }), st.confirmText);
    st.was = h('p', { class: 'dk-was' });
    st.body.append(h('h4', { class: 'shell-label', text: 'The rule says' }), st.rule, st.citeFull, h('h4', { class: 'shell-label', text: 'Considerations' }), h('div', { class: 'dk-read-row' }, st.read, st.readTools), st.confirm, st.was);
    syncRow(V, st);
  }
  /** bring one row in line with its state. Only what differs is touched, so it is safe to call at any time. */
  function syncRow(V, st) {
    const r = st.r, v = st.verdict, node = st.node, c = citeParts(r);
    if (node.dataset.verdict !== v) { node.dataset.verdict = v; st.mark.dataset.v = v; st.mark.firstChild.dataset.verdict = v; swapText(st.mark.lastChild, word(v), { size: false, instant: node.classList.contains('is-deciding') }); }      // under the open switch the word is not seen: it is simply changed
    swapText(st.name, r.label, { size: false }); swapText(st.citeSec, c[0], { size: false }); swapText(st.citeLocal, c[1], { size: false });
    st.vbtn.setAttribute('aria-label', word(v) + '. ' + r.label + '. Press to change.');
    if (!st.built) return;
    if (st.ruleText !== r.requires) { st.ruleText = r.requires; if (st.rule.textContent) crossfade(st.rule, () => D.fillRule(st.rule, r.requires)); else D.fillRule(st.rule, r.requires); }
    swapText(st.citeFull, r.cite);
    if (!st.read.isContentEditable) swapText(st.read, reading(st));
    st.backBtn.hidden = st.words == null;
    const open = r.open ? 'Still to confirm: ' + r.open : ''; st.confirm.hidden = !open; if (open) swapText(st.confirmText, open);
    const was = r.was ? 'Until ' + r.was.until + ': ' + r.was.value + (r.was.unit ? ' ' + r.was.unit : '') + (r.was.cite ? ' (' + D.tidy(r.was.cite) + ')' : '') + '.' : ''; st.was.hidden = !was; if (was && st.was.textContent !== was) st.was.textContent = was;
  }
  /** the inspector chooses a verdict */
  function pick(V, st, v) { closeToggle(true); st.manual = v !== st.r.verdict; setVerdict(V, st, v); if (v !== 'yellow') { const nx = advance(V, st); refocus(nx ? nx.openBtn : V.nextBtn); } }
  /** the next rule that still needs a decision: the next undecided row below this one, else the first one above it */
  function nextUndecided(V, st) {
    const order = [...V.rowsEl.children].map(n => V.rows.get(n.dataset.key)).filter(Boolean), i = order.indexOf(st), need = x => x.verdict === 'yellow';
    return order.slice(i + 1).find(need) || order.slice(0, i).find(need) || null;
  }
  /**
   * A rule was decided: its row closes and the next one to decide opens, in the same move, so the senior can work
   * straight down the list. When every rule is decided nothing opens. Rows never change places.
   */
  function advance(V, st) {
    const nx = nextUndecided(V, st);
    if (nx) { if (V.open !== nx.key) toggleRow(V, nx, true); }      // opening it closes whichever row was open
    else if (V.open === st.key) toggleRow(V, st);
    return nx;
  }
  function setVerdict(V, st, v) { const was = st.verdict; st.verdict = v; syncRow(V, st); if (was !== v) tally(V); changed(V); }      // the row stays where it is
  /** keep a row that was opened in view: the list scrolls to it calmly */
  function follow(sc, node) {
    const s = sc.getBoundingClientRect(), n = node.getBoundingClientRect(); let d = 0;
    if (n.top < s.top + 6) d = n.top - s.top - 10; else if (n.bottom > s.bottom - 6) d = Math.min(n.top - s.top - 10, n.bottom - s.bottom + 12);
    if (Math.abs(d) < 1) return;
    cancelAnimationFrame(sc.followRaf);
    const from = sc.scrollTop, to = Math.max(0, Math.min(sc.scrollHeight - sc.clientHeight, from + d)), t0 = performance.now();
    if (U.reduced()) { sc.scrollTop = to; return; }
    const step = now => { const k = Math.min(1, (now - t0) / 340), e = 1 - Math.pow(1 - k, 4); sc.scrollTop = from + (to - from) * e; if (k < 1) sc.followRaf = requestAnimationFrame(step); };
    sc.followRaf = requestAnimationFrame(step);
  }
  function tally(V) {
    const n = { red: 0, yellow: 0, green: 0 }; V.rows.forEach(st => { n[st.verdict]++; });
    V.tally.querySelectorAll('.dk-tally-n').forEach(el => swapText(el.lastChild, String(n[el.dataset.v]), { size: false }));
    V.tally.setAttribute('aria-label', ORDER.map(v => n[v] + ' ' + word(v)).join(', ')); V.tally.hidden = !V.rows.size;
  }
  function toggleRow(V, st, guided) {
    const open = V.open !== st.key, was = V.open && V.open !== st.key ? V.rows.get(V.open) : null;
    if (was) { was.node.classList.remove('is-open'); was.openBtn.setAttribute('aria-expanded', 'false'); reveal(was.body, false); }
    if (open && !st.built) buildBody(V, st);
    V.open = open ? st.key : null;
    st.node.classList.toggle('is-open', open); st.openBtn.setAttribute('aria-expanded', String(open)); reveal(st.body, open);
    // opened by hand, the whole row is brought into view; opened by the guided pass, only as far as its heading needs
    if (open) setTimeout(() => { if (V.open === st.key) follow(V.scroll, guided ? st.node.firstChild : st.node); }, 280);
  }
  // ---- the verdict, pressed: it turns, where it stands, into the system's own two-part switch (the same sunken
  // capsule and raised pill as the tabs at the top, at a small size): Violation | Clear.
  // Opened from "Inspector's call" neither side is chosen and there is no thumb (the yellow mark belongs to the closed
  // label and leaves with it). Opened from a decided row the pill is on its side. The name and the citation
  // move right to make room, so nothing is covered and the row keeps its height. Choosing a side puts the pill
  // there, the switch turns back into the plain verdict, and the row glides to its place. Escape or a press
  // elsewhere closes it unchanged, the way it opened.
  function openToggle(V, st) {
    if (tog) { const same = tog.st === st; closeToggle(); if (same) return; }
    const b = st.vbtn, line = b.parentNode, cur = st.verdict === 'yellow' ? null : st.verdict;
    const opt = v => h('button', { class: v === cur ? 'on' : '', type: 'button', role: 'radio', 'data-value': v, 'aria-checked': String(v === cur), tabindex: '-1', onclick: () => choose(v) },
      h('i', { class: 'verdict-mark', 'data-verdict': v, 'aria-hidden': 'true' }), h('span', { 'data-label': word(v), text: word(v) }));
    const ind = h('span', { class: 'shell-seg-ind' });
    const el = h('div', { class: 'shell-seg tm-seg dk-toggle', role: 'radiogroup', 'aria-label': 'Verdict: ' + st.r.label, tabindex: '0' }, ind, opt('red'), opt('green'));      // the two choices and nothing else
    Object.assign(el.style, { left: b.offsetLeft + 'px', top: (b.offsetTop + (b.offsetHeight - 32) / 2) + 'px' });
    line.append(el);
    const T = tog = { V, st, el, ind, at: cur, full: el.offsetWidth, busy: false };
    /** the raised pill goes under a side: from "not decided" it appears there, from the other side it slides */
    T.thumb = (v, instant) => {
      const n = el.querySelector('[data-value="' + v + '"]'), fresh = instant || T.at == null;
      if (fresh) ind.style.transition = 'none';
      ind.style.width = n.offsetWidth + 'px'; ind.style.transform = 'translateX(' + n.offsetLeft + 'px)'; ind.style.opacity = '1';
      if (fresh) { void ind.offsetWidth; ind.style.transition = ''; if (!instant) anim(ind, [{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }); }
      T.at = v; el.classList.add('is-chosen');
      el.querySelectorAll('button').forEach(o => { const on = o.dataset.value === v; o.classList.toggle('on', on); o.setAttribute('aria-checked', String(on)); });
    };
    if (cur) T.thumb(cur, true); else ind.style.opacity = '0';
    // room for it: the name and the citation glide right by what the switch needs beyond the verdict's own column
    st.openBtn.style.marginLeft = Math.max(0, T.full + 12 - (st.openBtn.offsetLeft - b.offsetLeft)) + 'px';
    b.setAttribute('aria-expanded', 'true'); st.node.classList.add('is-deciding');
    // It grows from the verdict's own box. The verdict's word leaves first; only then do the switch's words arrive:
    // the capsule changes shape all the while, but two different texts are never readable in the same place.
    anim(el, [{ width: b.offsetWidth + 'px' }, { width: T.full + 'px' }], { duration: 250, easing: U.FLAT });
    for (const k of el.children) anim(k, [{ opacity: 0 }, { opacity: 0, offset: .4 }, { opacity: k === ind && !cur ? 0 : 1 }], { duration: 250, easing: 'ease-out' });
    anim(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 90, easing: 'ease-in', fill: 'forwards' }) || (b.style.opacity = '0');
    // Pressing a side chooses it. Pressing the side that is already this row's verdict takes the decision back: the
    // pill lifts away and the row returns to the app's own verdict. That is the one way to undo a verdict.
    function choose(v) {
      if (T.busy || tog !== T) return; T.busy = true;
      let undo = false;
      if (v === st.verdict) { if (st.manual) { ind.style.opacity = '0'; el.querySelectorAll('button').forEach(o => { o.classList.remove('on'); o.setAttribute('aria-checked', 'false'); }); el.classList.remove('is-chosen'); v = st.r.verdict; undo = true; } else { closeToggle(); return; } }
      else T.thumb(v);
      setTimeout(() => commit(T, v, undo), U.reduced() ? 0 : 290);
    }
    el.addEventListener('keydown', e => {
      e.stopPropagation(); if (T.busy) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); T.thumb('red'); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); T.thumb('green'); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (T.at == null) closeToggle(); else choose(T.at); }
      else if (e.key === 'Escape') { e.preventDefault(); closeToggle(); }
      else if (e.key === 'Tab') closeToggle(true);
    });
    refocus(el);
  }
  /** the switch turns back into the plain verdict, and the name glides back: the exact reverse of how it opened */
  function closeToggle(instant, then) {
    const T = tog; if (!T) { if (then) then(); return; }
    tog = null; const st = T.st, b = st.vbtn, el = T.el, had = el === document.activeElement || el.contains(document.activeElement);
    const done = () => { el.remove(); b.getAnimations().forEach(a => a.cancel()); b.style.opacity = ''; st.node.classList.remove('is-deciding'); b.setAttribute('aria-expanded', 'false'); if (had) refocus(b); if (then) then(); };
    st.openBtn.style.marginLeft = '';
    if (instant || U.reduced() || !el.isConnected) { done(); return; }
    el.inert = true;
    // the reverse: the switch's words leave first, then the verdict's word arrives, while the capsule shrinks to it
    for (const k of el.children) anim(k, [{ opacity: getComputedStyle(k).opacity }, { opacity: 0 }], { duration: 90, easing: 'ease-in', fill: 'forwards' });
    anim(b, [{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 110, easing: 'ease-out', fill: 'both' });
    anim(el, [{ width: el.offsetWidth + 'px', opacity: 1 }, { width: b.offsetWidth + 'px', opacity: 1, offset: .6 }, { width: b.offsetWidth + 'px', opacity: 0 }], { duration: 250, easing: U.FLAT, fill: 'forwards' }).onfinish = done;
  }
  /** a side was chosen: the verdict changes under the switch and the switch closes. The row keeps its place. */
  function commit(T, v, undo) {
    if (tog !== T) return;
    const st = T.st, V = T.V, moved = st.verdict !== v, decided = !undo && v !== 'yellow';
    st.manual = v !== st.r.verdict;
    st.verdict = v; syncRow(V, st);
    const nx = decided ? advance(V, st) : null;      // one move: the switch closes, this row closes, the next opens. An undo stays where it is.
    closeToggle(false, () => { if (moved) tally(V); changed(V); if (decided) refocus(nx ? nx.openBtn : V.nextBtn); });
  }
  function findingPane(V) {
    V.heading = h('h2', { class: 'dk-h', text: heading(V) });
    V.tally = h('div', { class: 'dk-tally', role: 'img' }, ORDER.map(v => h('span', { class: 'dk-tally-n', 'data-v': v }, h('i', { class: 'verdict-mark', 'data-verdict': v, 'aria-hidden': 'true' }), h('b', { class: 'shell-num', text: '0' }))));
    V.gap = h('p', { class: 'dk-gap', text: gapText(V) });
    V.rowsEl = h('ol', { class: 'dk-rows', 'data-rise': '' }, sorted(V).map(st => st.node));
    V.scroll = h('div', { class: 'dk-pane-scroll tm-softscroll' }, h('div', { class: 'dk-rules-head', 'data-rise': '' }, V.heading, V.tally), V.gap, V.rowsEl);
    return h('section', { class: 'dk-pane is-on', 'data-step': 'finding' }, V.scroll);
  }

  // ---------------------------------------------------------------- the steps, the breadcrumb, the one button at the bottom
  const label = id => STEPS.find(s => s[0] === id)[1];
  function crumbs(V) {
    V.crumbMark = h('i', { class: 'dk-crumb-mark', 'aria-hidden': 'true' }); V.crumbBtns = {};
    const ol = h('ol', { class: 'dk-crumbs-list' }, V.flow.map((id, i) => { const b = V.crumbBtns[id] = h('button', { class: 'dk-crumb', type: 'button', 'data-step': id, onclick: () => go(V, id) }, h('span', { text: label(id) }), id === 'owner' ? h('i', { class: 'dk-crumb-tick', 'aria-hidden': 'true' }, icon('check', 13)) : null); return h('li', null, i ? h('i', { class: 'dk-crumb-sep', 'aria-hidden': 'true', text: '›' }) : null, b); }), V.crumbMark);
    return h('nav', { class: 'dk-crumbs', 'aria-label': 'Steps', 'data-rise': '', hidden: V.flow.length < 2 }, ol);
  }
  function placeCrumb(V, instant) {
    const b = V.crumbBtns[V.step], m = V.crumbMark; if (!b || !b.offsetWidth) return;
    if (instant || !m.dataset.placed) m.style.transition = 'none';
    m.style.width = b.offsetWidth + 'px'; m.style.transform = 'translateX(' + b.offsetLeft + 'px)';
    if (m.style.transition) { void m.offsetWidth; m.style.transition = ''; } m.dataset.placed = '1';
  }
  function syncFlow(V) {
    const at = V.flow.indexOf(V.step), noFix = V.approved && !violations(V).length;
    V.flow.forEach((id, i) => {
      const b = V.crumbBtns[id], skipped = id === 'fix' && noFix, state = i === at ? 'current' : skipped ? 'skipped' : i <= V.reached ? 'done' : 'todo';
      b.dataset.state = state; b.disabled = state !== 'done'; if (i === at) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    placeCrumb(V);
    // the one button: Approve the finding, then on through the steps. Every one is a single click. The last step has
    // no button here: its Publish button is on the owner's page itself (desk-draft.js).
    const s = V.step, single = V.flow.length === 1, last = s === 'owner';
    const text = s === 'finding' ? (!V.approved ? 'Approve' : single ? 'Reviewed' : violations(V).length ? 'Next: how to fix it' : 'Next: for the file') : s === 'fix' ? 'Next: for the file' : 'Next: for the owner';
    if (V.nextBtn.hidden) { if (!last) V.nextBtn.lastChild.textContent = text; }      // out of sight: nothing to swap
    else if (!last) swapText(V.nextBtn.lastChild, text, { size: false });
    V.nextBtn.hidden = last;
    V.nextBtn.disabled = (single && V.approved) || (V.draft && !V.draft.ready(s));
    setItem(V);
  }
  function go(V, step) {
    if (step === V.step || V.flow.indexOf(step) < 0) return;
    if (!V.panes[step]) { V.panes[step] = V.draft.pane(step); V.stepsEl.append(V.panes[step]); void V.panes[step].offsetWidth; }
    V.step = step; V.reached = Math.max(V.reached, V.flow.indexOf(step)); V.movedAt = performance.now();
    for (const id in V.panes) { const on = id === step; V.panes[id].classList.toggle('is-on', on); V.panes[id].inert = !on; }
    if (V.draft) V.draft.shown(step);
    V.el.dataset.step = step; V.footSlot.replaceChildren(...(V.draft && V.draft.tools ? V.draft.tools(step) : [])); syncFlow(V); U.soft();
  }
  function forward(V) {
    const s = V.step;
    if (s === 'finding') {
      V.approved = true;
      if (V.flow.length === 1) { publish(V, true); syncFlow(V); return; }
      go(V, violations(V).length ? 'fix' : 'file');
    } else if (s === 'fix') go(V, 'file'); else if (s === 'file') go(V, 'owner');
  }
  function publish(V, on) {
    V.published = on; V.el.dataset.published = on ? '1' : '0';
    const c = V.crumbBtns.owner; if (c) { if (on) c.setAttribute('aria-label', label('owner') + ', published'); else c.removeAttribute('aria-label'); }
    if (V.draft) V.draft.published(on); setItem(V); if (hooks.published) hooks.published(V.f.id, on);
  }
  /** something the later steps depend on changed (a verdict, wording, the place) */
  function changed(V) { if (V.draft) V.draft.sync(); syncFlow(V); }

  function buildView(f) {
    const V = { f, loc: Object.assign({}, f.loc), rows: new Map(), step: 'finding', reached: 0, approved: false, published: false, open: null, state: 'review', panes: {} };
    V.ev = f.scene === 'custom' ? { rows: [], carried: true, missing: false } : D.evaluate(f.scene, V.loc, f.facts);
    V.flow = (window.TeamDraft && f.scene !== 'custom' ? STEPS : STEPS.slice(0, 1)).map(s => s[0]);
    V.ev.rows.forEach(r => mkRow(V, r));
    V.panes.finding = findingPane(V);
    V.stepsEl = h('div', { class: 'dk-steps' }, V.panes.finding);
    // one click; the breadcrumb leads back. The button stays in one place from step to step, so the second click of a double click is not taken as the next step's.
    V.nextBtn = h('button', { class: 'dk-primary', type: 'button', onclick: () => { if (performance.now() - (V.movedAt || -1e9) > 360) forward(V); } }, h('span', { class: 'dk-primary-label', text: 'Approve' }));
    V.el = h('article', { class: 'dk-view', 'aria-label': f.title }, crumbs(V), h('div', { class: 'dk-work tm-softscroll' }, context(V), V.stepsEl), h('div', { class: 'dk-foot', 'data-rise': '' }, V.footSlot = h('div', { class: 'dk-foot-slot tm-btns' }), V.nextBtn));
    V.el.inert = true; V.el.dataset.step = 'finding';
    V.api = { zoom, go: s => go(V, s), changed: () => syncFlow(V), violations: () => violations(V), rows: () => sorted(V), reading, citeParts, syncRow: st => syncRow(V, st), publish: on => { publish(V, on); syncFlow(V); } };
    V.draft = V.flow.length > 1 ? window.TeamDraft.attach(V, V.api) : null;
    tally(V); syncFlow(V);
    return V;
  }

  // ---------------------------------------------------------------- the pin moved: the open finding is somewhere else now
  function relocate(loc) {
    const V = current && views.get(current); if (!V || !loc) return null;
    const was = V.loc; V.loc = Object.assign({}, loc); V.f.loc = V.loc; V.f.place = loc.place;
    if (was.place === loc.place && was.scope === loc.scope && was.label === loc.label) return null;
    swapText(V.town, townLine(V), { size: false });
    if (V.f.scene !== 'custom') {
      const ev = V.ev = D.evaluate(V.f.scene, V.loc, V.f.facts), keep = new Set();
      for (const r of ev.rows) {
        keep.add(r.key); const st = V.rows.get(r.key);
        if (!st) { mkRow(V, r); continue; }
        st.r = r;
        if (!st.manual) st.verdict = r.verdict;                    // what the inspector chose stays
      }
      for (const k of [...V.rows.keys()]) if (!keep.has(k)) { if (V.open === k) V.open = null; V.rows.delete(k); }
      // the same rows, patched where they stand; they glide to the new order; rows that exist only here rise in, the others fade out
      U.keyed(V.rowsEl, sorted(V), { key: st => st.key, create: st => st.node, update: (n, st) => syncRow(V, st) });
      swapText(V.heading, heading(V), { size: false }); swapText(V.gap, gapText(V)); tally(V);
    }
    changed(V);
    return V.f;
  }

  function reset() {
    views.forEach(V => { if (V.draft) V.draft.shut(); }); document.querySelectorAll('.dk-big-layer').forEach(n => n.remove());
    closeToggle(true); views.clear(); current = null; listEl.replaceChildren(); mainEl.querySelectorAll('.dk-view').forEach(n => n.remove());
    zoomEl.replaceChildren(); zoomEl.classList.remove('is-on'); emptyEl.classList.add('is-on'); syncRail();
  }
  /** a hook for tests and screenshots only, with nothing in the interface: a finding as the phone would send it */
  function seed(scene, place, o) {
    const opt = o || {}, sc = D.scene(scene), loc = typeof place === 'string' ? D.pin(place) : place, R = F.READING[scene];
    const f = { id: 'seed' + (++seedN), at: opt.at ? new Date(opt.at) : new Date(), scene, loc, place: loc.place, title: sc.short, photo: { src: sc.photo, aspect: sc.aspect }, focus: F.FOCUS[scene], note: { text: opt.note || R.text, appText: R.text, changed: !!opt.note },
      asked: F.asked(scene, opt.answers), readings: F.readings(scene, opt.changes), facts: F.facts(scene, opt.answers, opt.changes), state: 'sent' };
    reserve(f); land(f); return f;
  }
  function mount(el) {
    root = el;
    listEl = h('ul', { class: 'dk-list' });
    emptyEl = h('div', { class: 'dk-empty is-on' }, h('h2', { text: 'Nothing received yet.' }), h('p', { text: 'Findings sent from the phone arrive here.' }));
    mainEl = h('div', { class: 'dk-main' }, emptyEl);
    panes = h('div', { class: 'dk-panes', 'data-rail': 'off' }, h('aside', { class: 'dk-rail', 'aria-label': 'Received' }, h('div', { class: 'dk-rail-in tm-softscroll' }, listEl)), mainEl);
    zoomEl = h('div', { class: 'dk-zoom' });
    root.append(h('div', { class: 'dk-bar' }, h('span', { class: 'dk-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('b', { text: 'Inspections' })), panes, zoomEl);
    document.addEventListener('pointerdown', e => { if (tog && !tog.el.contains(e.target) && !tog.st.vbtn.contains(e.target)) closeToggle(); }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tog) closeToggle(); });
  }
  return {
    mount, reserve, land, select, relocate, reset, seed, zoom, STEPS,
    view: () => current && views.get(current), views,
    relayout() { const V = current && views.get(current); if (V) placeCrumb(V, true); },
    onPublished(fn) { hooks.published = fn; }, onSelect(fn) { hooks.select = fn; },
  };
})();
