// team/ui.js: the small set of moves every screen in this tab is built from. Rules they encode (STYLE.md):
// change only what changed; things that exist glide to their new place; content that changes in place crossfades
// with no blank frame and no height jump; sliding pills use a plain ease-out; entrances play once; nothing spins.
window.TeamUI = (function () {
  'use strict';
  const FLAT = 'cubic-bezier(.22,1,.36,1)', SOFT = 'cubic-bezier(.4,0,.2,1)';
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => mq.matches;
  const state = { scale: 1 };                           // the two devices are scaled to fit the window

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, ...kids) {
    const el = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) { const v = attrs[k]; if (v == null || v === false) continue; if (k === 'text') el.textContent = v; else el.setAttribute(k, v); }
    for (const kid of kids.flat(Infinity)) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  // ---- A focus ring is for the keyboard only: clicking or tapping never leaves an outline behind.
  // keys.on says which the person is using. With the pointer, <html> has the class tm-pointer (rings are off in CSS)
  // and, after a click, nothing keeps the focus except a text that is being typed into. Any key brings rings back.
  const keys = { on: false }, rootEl = document.documentElement;
  const texty = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.getAttribute('role') === 'textbox');
  document.addEventListener('keydown', e => { if (e.key !== 'Shift' && e.key !== 'Meta' && e.key !== 'Control' && e.key !== 'Alt') { keys.on = true; rootEl.classList.remove('tm-pointer'); } }, true);
  document.addEventListener('pointerdown', () => { keys.on = false; rootEl.classList.add('tm-pointer'); }, true);
  document.addEventListener('click', () => { if (keys.on) return; const a = document.activeElement; if (a && a !== document.body && !texty(a) && a.blur) a.blur(); });
  /** give an element the focus only when the person is using the keyboard, so no ring appears after a click */
  const refocus = el => { if (keys.on && el && el.focus) el.focus({ preventScroll: true }); };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const frame = () => new Promise(r => requestAnimationFrame(() => r()));

  // ---- motion primitives
  function anim(el, frames, opts) { if (reduced() || !el || !el.animate) return null; return el.animate(frames, opts); }
  /** text and cards: fade in and rise 8 px, once */
  function rise(els, delay) { (els.nodeType ? [els] : [...els]).forEach((e, i) => anim(e, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: FLAT, delay: (delay || 0) + i * 40, fill: 'backwards' })); }
  /** small objects: pop from 86 % with one slight overshoot */
  function pop(els, delay) { (els.nodeType ? [els] : [...els]).forEach((e, i) => anim(e, [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.34,1.3,.64,1)', delay: (delay || 0) + i * 45, fill: 'backwards' })); }

  /**
   * Replace an element's content in place. The old content leaves first (it fades out), then the change is made and
   * the new content arrives (it fades in): two different texts are never readable in the same spot. A height change
   * is eased. A second change that comes while the old content is still leaving is made at the same moment.
   */
  const OUT = 90, IN = 150;
  function crossfade(el, mutate, opts) {
    const o = opts || {};
    if (el.tmSwap) { el.tmSwap.queue.push(mutate); return; }
    const seen = () => { for (let p = el; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (+s.opacity === 0 || s.visibility === 'hidden') return false; } return true; };
    if (o.instant || reduced() || !el.isConnected || !el.offsetParent || !seen()) { mutate(); return; }      // nothing to see: just make the change
    const S = el.tmSwap = { queue: [mutate] }, h0 = el.offsetHeight;
    const land = () => {
      if (el.tmSwap !== S) return; el.tmSwap = null; el.tmText = null; S.queue.forEach(fn => fn());
      if (!el.isConnected) return;
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: IN, easing: 'ease-out' });
      const h1 = el.offsetHeight;
      if (o.size !== false && Math.abs(h0 - h1) > 1) { const prev = el.style.overflow; el.style.overflow = 'hidden'; el.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 220, easing: FLAT }).onfinish = () => { el.style.overflow = prev; }; }
    };
    const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT, easing: 'ease-in', fill: 'forwards' });
    out.onfinish = () => { out.cancel(); land(); }; out.oncancel = land;
  }
  /** replace a text. What it is about to say counts as what it says, so asking twice changes nothing. */
  function swapText(el, text, opts) {
    if ((el.tmText != null ? el.tmText : el.textContent) === text) return false;
    el.tmText = text; crossfade(el, () => { el.textContent = text; }, opts); if (!el.tmSwap) el.tmText = null;
    return true;
  }

  /**
   * Generated text arrives word by word: each word fades in and rises 6 px, 60 ms apart. Plays once.
   * Returns a function that finishes it at once (for when the reader starts to edit the words).
   */
  function wordFade(el, text) {
    if (reduced()) { el.textContent = text; return () => { }; }
    const words = text.match(/\S+\s*/g) || []; el.textContent = '';
    words.forEach((w, i) => { const s = document.createElement('span'); s.textContent = w; s.style.cssText = 'display:inline-block;white-space:pre'; el.append(s); s.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'ease-out', delay: i * 60, fill: 'backwards' }); });
    const done = () => { if (el.firstElementChild) el.textContent = el.textContent; };
    const t = setTimeout(done, words.length * 60 + 340);
    return () => { clearTimeout(t); done(); };
  }

  /** animate a box from its old height to its new one around a change (for content that grows or shrinks) */
  function resize(el, mutate) {
    if (reduced() || !el.isConnected) { mutate(); return; }
    const h0 = el.offsetHeight; mutate(); const h1 = el.offsetHeight;
    if (Math.abs(h0 - h1) > 1) { const prev = el.style.overflow; el.style.overflow = 'hidden'; el.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 250, easing: FLAT }).onfinish = () => { el.style.overflow = prev; }; }
  }

  // ---- FLIP: things that already exist glide to their new place. Interruptible: a second change starts from
  // wherever each element is on screen at that moment.
  const tops = els => { const m = new Map(); for (const e of els) { const r = e.getBoundingClientRect(); m.set(e, [r.left, r.top]); } return m; };
  function glide(els, first, opts) {
    const o = opts || {};
    for (const e of els) {
      const was = first.get(e); if (!was) continue;
      e.getAnimations().forEach(a => { if (a.id === 'tm-glide') a.cancel(); });
      const r = e.getBoundingClientRect(), k = e.offsetWidth ? r.width / e.offsetWidth || 1 : 1, dx = (was[0] - r.left) / k, dy = (was[1] - r.top) / k;   // k: the scale the device is drawn at
      if (reduced() || (Math.abs(dx) < .5 && Math.abs(dy) < .5)) continue;
      const a = e.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: o.duration || 340, easing: FLAT });
      a.id = 'tm-glide';
    }
  }
  function flip(els, mutate, opts) { const list = [...els], first = tops(list); mutate(); glide(list, first, opts); }
  /** move a node without tearing it down (keeps focus and running animations where the browser can) */
  function move(parent, node, before) {
    if (node.nextSibling === before && node.parentNode === parent) return;
    if (parent.moveBefore && node.parentNode === parent) { try { parent.moveBefore(node, before); return; } catch (e) { /* fall through */ } }
    const hadFocus = node.contains(document.activeElement) ? document.activeElement : null;
    parent.insertBefore(node, before);
    if (hadFocus && keys.on && document.activeElement !== hadFocus) hadFocus.focus({ preventScroll: true });
  }

  /**
   * Keyed list update. Nodes whose key is still present are kept (same node) and glide to their new place; new keys
   * are created and rise in once; keys that are gone fade out in place while the rest close up.
   */
  function keyed(box, items, o) {
    const have = new Map();
    for (const n of [...box.children]) if (n.dataset && n.dataset.key != null && !n.classList.contains('tm-leaving')) have.set(n.dataset.key, n);
    const kept = [...have.values()], first = tops(kept), made = [];
    const want = items.map(it => {
      const k = String(o.key(it)); let n = have.get(k);
      if (n) have.delete(k); else { n = o.create(it); n.dataset.key = k; made.push(n); }
      if (o.update) o.update(n, it);
      return n;
    });
    have.forEach(n => {                                   // gone: lift out of the flow where it stands, fade, remove
      const op = n.offsetParent || box;
      Object.assign(n.style, { position: 'absolute', left: n.offsetLeft + 'px', top: n.offsetTop + 'px', width: n.offsetWidth + 'px', margin: '0', pointerEvents: 'none' });
      n.classList.add('tm-leaving'); n.removeAttribute('data-key'); if (n.parentNode !== op && op.contains(n)) { /* stays where it is */ }
      const a = anim(n, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
      if (a) a.onfinish = () => n.remove(); else n.remove();
    });
    let ref = box.firstElementChild;
    const skip = () => { while (ref && (ref.classList.contains('tm-leaving') || ref.classList.contains('tm-ghost') || (o.pinned && o.pinned(ref)))) ref = ref.nextElementSibling; };
    skip();
    for (const n of want) { if (n === ref) { ref = ref.nextElementSibling; skip(); continue; } move(box, n, ref); }
    glide(kept.filter(n => n.isConnected && !n.classList.contains('tm-leaving')), first);
    if (o.enter !== false) made.forEach((n, i) => rise(n, i * 40));
    return want;
  }

  // ---- sliding-pill tabs: the shared shell's primitive (.shell-seg, Shell.tabs), so both tabs of the site move alike.
  // Plain ease-out, lands exactly on the tab. A pill that has not been laid out yet is placed without motion.
  function segSync(el) {
    if (!window.Shell || !el.offsetWidth) return;
    const first = !el.dataset.tmPlaced; el.dataset.tmPlaced = '1';
    window.Shell.seg(el, first);
  }
  function seg(options, value, onChange, cls) {
    const el = h('div', { class: 'shell-seg tm-seg ' + (cls || '') }, h('span', { class: 'shell-seg-ind' }),
      options.map(o => h('button', { type: 'button', 'data-value': o.id, class: o.id === value ? 'on' : '', title: o.title, 'aria-label': o.aria }, o.node || o.label)));
    let quiet = false;
    const ctl = window.Shell ? window.Shell.tabs(el, v => { if (!quiet && onChange) onChange(v); }) : { set() { } };
    if (window.Shell) window.Shell.watch(el);
    /** choose a tab from code. silent = move the pill without calling onChange */
    el.segSet = (v, silent) => { quiet = !!silent; try { ctl.set(v); } finally { quiet = false; } };
    el.segValue = () => (el.querySelector(':scope > button.on') || { dataset: {} }).dataset.value;
    return el;
  }
  function syncAllSegs(root) { (root || document).querySelectorAll('.tm-seg').forEach(segSync); }

  // ---- named steps: what is being done, ticking off one by one. The running step is alive. Nothing spins.
  function steps(names, cls) {
    const el = h('div', { class: 'tm-steps ' + (cls || ''), role: 'status' }, names.map(n => h('div', { class: 'tm-step', 'data-state': 'todo' }, h('i', { class: 'tm-step-dot' }), h('span', { text: n }), h('b', { class: 'tm-step-line' }))));
    const rows = [...el.children];
    return {
      el,
      run(i) { rows.forEach((r, j) => { r.dataset.state = j < i ? 'done' : j === i ? 'run' : 'todo'; }); },
      done() { rows.forEach(r => { r.dataset.state = 'done'; }); },
    };
  }

  // ---- progress ring: fills as you go; closes with a check
  function ring(size, cls) {
    const r = size / 2 - 3, c = 2 * Math.PI * r;
    const fg = svg('circle', { class: 'tm-ring-fg', cx: size / 2, cy: size / 2, r, 'stroke-dasharray': c.toFixed(2), 'stroke-dashoffset': c.toFixed(2) });
    const tick = svg('path', { class: 'tm-ring-tick', d: 'M' + (size * .32) + ' ' + (size * .52) + ' l' + (size * .13) + ' ' + (size * .13) + ' l' + (size * .24) + ' -' + (size * .26) });
    const el = svg('svg', { class: 'tm-ring ' + (cls || ''), width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, 'aria-hidden': 'true' },
      svg('circle', { class: 'tm-ring-bg', cx: size / 2, cy: size / 2, r }), fg, tick);
    return { el, set(f) { const k = Math.max(0, Math.min(1, f)); fg.setAttribute('stroke-dashoffset', (c * (1 - k)).toFixed(2)); el.classList.toggle('full', k >= 1); } };
  }
  /** the one calm flourish at the end of a multi-step task: a soft band of light crosses the card, left to right */
  function sweep(el) {
    if (reduced()) return;
    const s = h('i', { class: 'tm-sweep' }); el.appendChild(s);
    s.animate([{ transform: 'translateX(-120%)' }, { transform: 'translateX(320%)' }], { duration: 900, easing: SOFT }).onfinish = () => s.remove();
  }

  // ---- edit text in place: the same node becomes editable, so nothing around it moves
  function editable(el, onCommit, opts) {
    const o = opts || {}; let before = null;
    el.tabIndex = 0; el.setAttribute('role', 'textbox'); el.classList.add('tm-edit'); if (o.label) el.setAttribute('aria-label', o.label);
    const start = () => {
      if (el.isContentEditable || el.dataset.locked) return;
      before = el.textContent; el.setAttribute('contenteditable', 'plaintext-only'); if (!el.isContentEditable) el.setAttribute('contenteditable', 'true');
      el.classList.add('editing'); if (o.onStart) o.onStart();
    };
    const stop = commit => {
      if (!el.isContentEditable) return;
      el.setAttribute('contenteditable', 'false'); el.classList.remove('editing');
      const text = el.textContent.replace(/\s+/g, ' ').trim();
      if (!commit || (!text && !o.allowEmpty)) { el.textContent = before; if (o.onCancel) o.onCancel(); return; }
      el.textContent = text; if (text !== before) onCommit(text, before); else if (o.onCancel) o.onCancel();
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('focus', () => { if (o.editOnFocus) start(); });
    el.addEventListener('keydown', e => {
      if (!el.isContentEditable) { if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); e.stopPropagation(); start(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } return; }
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); stop(false); el.blur(); }
    });
    el.addEventListener('keyup', e => { if (el.isContentEditable) e.stopPropagation(); });
    el.addEventListener('input', () => { if (o.onInput) o.onInput(el.textContent); });
    el.addEventListener('blur', () => stop(true));
    return { start, stop };
  }


  // ---- plain labelled buttons, and the two moves the laptop uses everywhere
  /** a button that says what it does. cls: is-quiet (text only), is-solid (the main action of a small group) */
  function btn(label, fn, cls, ic) { return h('button', { class: 'tm-btn ' + (cls || ''), type: 'button', onclick: fn }, ic ? icon(ic, 14) : null, h('span', { text: label })); }
  /** a common action as a symbol: one line icon in a round button, with its name for screen readers and on hover */
  function sym(name, label, fn, cls, size) { return h('button', { class: 'tm-sym gl-icon-button ' + (cls || ''), type: 'button', 'aria-label': label, title: label, onclick: fn }, icon(name, size || 18)); }
  /** open or close a block in place: its height and opacity ease, from wherever they are at that moment */
  function reveal(el, open) {
    const from = el.hidden ? 0 : el.offsetHeight;
    el.getAnimations().forEach(a => { if (a.id === 'tm-reveal') a.cancel(); });
    if (reduced() || !el.isConnected) { el.hidden = !open; return; }
    el.hidden = false; const full = el.offsetHeight, to = open ? full : 0;
    if (Math.abs(from - to) < 1) { el.hidden = !open; return; }
    el.style.overflow = 'hidden';
    const a = el.animate([{ height: from + 'px', opacity: from ? 1 : 0 }, { height: to + 'px', opacity: open ? 1 : 0 }], { duration: open ? 260 : 200, easing: FLAT });
    a.id = 'tm-reveal'; a.onfinish = () => { el.style.overflow = ''; if (!open) el.hidden = true; };
  }
  /**
   * The pencil beside a short text. Pressing it makes those words editable where they stand: the same words, the same
   * type, a caret at the end. The pencil turns into a tick in the same spot; the tick, or Enter, keeps the change and
   * turns back. Escape puts the words back. Emptying them and confirming is a cancel.
   * o: { onSave(text, before), onStart(), onEnd(changed), cls, size, group }  group: { current } shared by pencils of
   * which only one may be open; starting another confirms the one that was open.
   */
  function pencil(el, o) {
    const size = o.size || 16, S = { on: false };
    const b = S.btn = sym('pencil', 'Change wording', e => { e.stopPropagation(); if (S.on) done(true); else start(); }, o.cls || '', size);
    b.append(icon('check', size)); b.dataset.glyph = 'a';
    let before = '';
    function start() {
      if (o.group && o.group.current && o.group.current !== S) o.group.current.done(true);
      before = el.textContent; S.on = true; if (o.group) o.group.current = S;
      el.classList.add('tm-inplace'); el.setAttribute('contenteditable', 'plaintext-only'); if (!el.isContentEditable) el.setAttribute('contenteditable', 'true');
      b.dataset.glyph = 'b'; b.setAttribute('aria-label', 'Done'); b.title = 'Done'; if (o.onStart) o.onStart();
      el.focus({ preventScroll: true });
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });       // stays clear of an on-screen keyboard
      el.onkeydown = e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(true); } else if (e.key === 'Escape') { e.preventDefault(); done(false); } else if ((e.metaKey || e.ctrlKey) && (e.key || '').toLowerCase() === 'z' && !e.shiftKey && el.textContent === before) e.preventDefault(); };      // back at its own words: the browser's undo would reach into some other text
      el.onkeyup = e => e.stopPropagation(); el.onclick = e => e.stopPropagation();
    }
    function done(keep) {
      if (!S.on) return; const v = el.textContent.replace(/\s+/g, ' ').trim(); S.on = false; if (o.group && o.group.current === S) o.group.current = null;
      el.removeAttribute('contenteditable'); el.onkeydown = el.onkeyup = el.onclick = null;
      b.dataset.glyph = 'a'; b.setAttribute('aria-label', 'Change wording'); b.title = 'Change wording';
      const changed = !!(keep && v && v !== before); el.textContent = changed ? v : before;
      if (o.onEnd) o.onEnd(changed); if (changed) o.onSave(v, before);
    }
    S.start = start; S.done = done;
    return S;
  }

  // ---- soft scroll edges: content fades out where it passes under the top or bottom edge of a scroll area, only on a
  // side that has more to scroll. One utility for every scroll area (class tm-softscroll, see team.css). The fade
  // grows with the distance scrolled, so it eases in as scrolling starts and out as it reaches an end.
  const SOFT_EDGE = 28;
  function softOne(el) {
    const top = Math.max(0, Math.min(SOFT_EDGE, el.scrollTop)), bottom = Math.max(0, Math.min(SOFT_EDGE, el.scrollHeight - el.clientHeight - el.scrollTop));
    if (el.ssTop !== top) { el.ssTop = top; el.style.setProperty('--ss-top', top + 'px'); }
    if (el.ssBottom !== bottom) { el.ssBottom = bottom; el.style.setProperty('--ss-bottom', bottom + 'px'); }
  }
  let softRaf = 0;
  /** bring every soft scroll edge up to date on the next frame (call it after content changes; scrolling does it itself) */
  function soft() { if (softRaf) return; softRaf = requestAnimationFrame(() => { softRaf = 0; document.querySelectorAll('.tm-softscroll').forEach(softOne); }); }
  document.addEventListener('scroll', e => { const t = e.target; if (t && t.classList && t.classList.contains('tm-softscroll')) { if (!t.ssRaf) t.ssRaf = requestAnimationFrame(() => { t.ssRaf = 0; softOne(t); }); } }, true);
  for (const ev of ['click', 'keyup', 'input', 'pointerup']) document.addEventListener(ev, () => { soft(); setTimeout(soft, 320); }, true);
  window.addEventListener('resize', soft);

  // ---- thin monochrome icons (no emoji)
  const ICONS = {
    back: 'M15 5l-7 7 7 7', pin: 'M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0113 0C18.5 15.4 12 21 12 21zM12 8.3a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6z',
    camera: 'M4 8h3l1.6-2.5h6.8L17 8h3v11H4zM12 10.5a3.2 3.2 0 100 6.4 3.2 3.2 0 000-6.4z', image: 'M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 3-3 5 5M9 9.2a1.2 1.2 0 100 .01',
    check: 'M5 12.5l4.5 4.5L19 7.5', pencil: 'M4 20l1-4L16.5 4.5l3 3L8 19zM14.5 6.5l3 3', spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
    send: 'M4 12l16-7-6 16-2.5-6.5z', close: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', undo: 'M8 7l-4 4 4 4M4 11h10a5 5 0 010 10h-2',
    doc: 'M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5', phone: 'M8 2.5h8a1.5 1.5 0 011.5 1.5v16a1.5 1.5 0 01-1.5 1.5H8A1.5 1.5 0 016.5 20V4A1.5 1.5 0 018 2.5zM10.5 19h3',
    alert: 'M12 4l9 15.5H3zM12 10v4.5M12 17.2v.3', chevL: 'M14 6l-6 6 6 6', chevD: 'M6 9.5l6 6 6-6', back2: 'M20 12H5M11 6l-6 6 6 6', del: 'M4 6h13a3 3 0 013 3v6a3 3 0 01-3 3H4l-3-6zM9 9.5l5 5M14 9.5l-5 5', chevR: 'M10 6l6 6-6 6', expand: 'M5 9V5h4M19 9V5h-4M5 15v4h4M19 15v4h-4',
    calendar: 'M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4', copy: 'M9 9h10v11H9zM5 15V4h10', print: 'M7 8V4h10v4M7 17H4v-7h16v7h-3M7 14h10v6H7z', trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13', open: 'M12 6v6l4 2',
  };
  function icon(name, size) {
    const s = size || 18;
    return svg('svg', { class: 'tm-icon', width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, svg('path', { d: ICONS[name] || '' }));
  }
  /** the verdict mark: a small shape in its colour (the shared shell draws the shape) with the word beside it */
  function verdictMark(v, word, cls) {
    return h('span', { class: 'tm-vmark ' + (cls || ''), 'data-v': v }, h('i', { class: 'verdict-mark', 'data-verdict': v, 'aria-hidden': 'true' }), word != null ? h('span', { class: 'tm-vword', text: word }) : null);
  }
  const clock = d => { const t = d || new Date(); return t.getHours() + ':' + String(t.getMinutes()).padStart(2, '0'); };

  return { FLAT, SOFT, reduced, state, h, svg, wait, frame, anim, rise, pop, crossfade, swapText, wordFade, resize, flip, glide, tops, move, keyed, seg, segSync, syncAllSegs, steps, ring, sweep, editable, icon, verdictMark, clock, btn, sym, reveal, pencil, keys, refocus, soft };
})();
