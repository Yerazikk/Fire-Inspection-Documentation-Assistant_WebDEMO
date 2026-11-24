// team/phone.js: the field inspector's phone. Take the photo, the app reads it, add a note, one question, send.
// Every action is a single tap: nothing is pressed and held.
//   camera -> the app scans the photo -> "Add a note" (the app's suggestions, the first already chosen)
//   -> the one or two things only a person on site can answer -> sent.
// The screens are laid out for a phone of 390 x 844. On the stage the whole device is drawn at one scale.
// The photograph is ONE element (the stage) that lives across screens and glides to its new size and crop. It is
// shown clean: what the app found is marked only while it scans, and is gone when the scan ends.
// A question always has its answer control on the screen with it: the common answer is the main path, the exception
// is a quiet text button, and a small drawing shows what the words refer to. What is asked is content in flow.js.
window.TeamPhone = (function () {
  'use strict';
  const U = window.TeamUI, { h, icon, rise, anim, swapText, crossfade, sym } = U;
  const D = window.TeamData, F = window.TeamFlow, P = window.TeamPhoto;
  // The photographs this app can take, in the order the shared list gives them (team/adapter.js scenes, from
  // lib/codes.js PHOTOS). The camera opens on the sprinkler: that is where the demonstration begins.
  const SCENES = () => { const list = D.scenes ? D.scenes() : []; return list.length ? list : ['sprinkler', 'ladder', 'daisy']; };
  const S = { scene: 'sprinkler', loc: null, screen: '', photo: null, custom: false, note: null, answers: {}, sent: [], run: 0 };
  const hooks = { send: null, screen: null };
  let root, view, layers, file, sheetEl, sheetIn, veilEl, onPicked = null, typeInto = null;
  const clamp = (a, v, b) => Math.max(a, Math.min(b, v));

  // ---------------------------------------------------------------- one rhythm for every screen (px, at 390 x 844)
  const M = 16;                     // side margin
  const PILL = { top: 24, h: 32, gap: 22 };   // the scene switch: its gap under the status bar, its height, the gap to the picture under it
  const VIEW_TOP = PILL.top + PILL.h + PILL.gap;   // where the picture starts on the camera and scan screens (the same on both, so it does not move)
  const BAR = 144;                  // the camera's control bar. The shutter's centre sits 85 px above the bottom of the display (its ring 37 px more), and the picture ends 22 px above the ring: the same gap as between the scene switch and the picture
  const LAYOUT = {
    camera: (W, H) => ({ x: M, y: VIEW_TOP, w: W - 2 * M, h: H - VIEW_TOP - BAR, r: 28 }),     // under the scene switch, down to the control bar
    scan: (W, H) => LAYOUT.camera(W, H),
    note: (W, H) => ({ x: M, y: 64, w: W - 2 * M, h: clamp(110, H - 560, 210), r: 22 }),
    questions: W => ({ x: W - M - 54, y: 6, w: 54, h: 54, r: 14 }),
  };
  const St = { el: null, plates: null, scan: null, box: null, layout: '', rect: null, view: null };
  function usePhoto() { const sc = D.scene(S.scene); S.photo = { src: sc.photo, aspect: sc.aspect }; St.view = { focus: F.FOCUS[S.scene] }; setPhoto(S.photo); }
  function buildStage() {
    St.plates = h('div', { class: 'ph-plates' }); St.scan = h('div', { class: 'ph-scan' });
    St.el = h('div', { class: 'ph-stage snap', 'data-layout': 'camera' }, St.plates, St.scan);
    return St.el;
  }
  /** put the stage where this screen wants it; the frame and the image plate both travel there */
  function place(layout, v, snap) {
    const r = LAYOUT[layout](view.clientWidth, view.clientHeight);
    St.layout = layout; St.rect = r; if (v) St.view = v;
    if (snap) { St.el.classList.add('snap'); requestAnimationFrame(() => requestAnimationFrame(() => St.el.classList.remove('snap'))); }
    St.el.dataset.layout = layout;
    Object.assign(St.el.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px', borderRadius: r.r + 'px' });
    if (St.box) St.box.px(r.w, r.h, St.view);
    return r;
  }
  /** show a photograph on the stage; a different one fades in over the old, in place */
  function setPhoto(photo) {
    if (St.box && St.box.src === photo.src) { if (St.rect) St.box.px(St.rect.w, St.rect.h, St.view); return; }
    const old = St.box, box = P.photoBox(photo.src, photo.aspect, 'ph-photo');
    St.plates.append(box.el); St.box = box;
    if (St.rect) box.px(St.rect.w, St.rect.h, St.view);
    // a different photograph replaces the old one: the old leaves, then the new arrives
    if (old) { const out = anim(old.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: 'ease-in', fill: 'forwards' }); anim(box.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 170, delay: 100, easing: 'ease-out', fill: 'backwards' }); if (out) out.onfinish = () => old.el.remove(); else old.el.remove(); }
  }

  // ---------------------------------------------------------------- screens: one layer of words at a time
  function show(name, spec) {
    const old = layers.lastElementChild, wasGone = St.el.classList.contains('gone');
    const layer = h('div', { class: 'ph-layer', 'data-screen': name }, spec.head, spec.body, spec.actions);
    const r = spec.layout ? place(spec.layout, spec.view, !S.screen || wasGone) : St.rect;
    if (name === 'sent') St.el.classList.add('gone'); else if (wasGone) requestAnimationFrame(() => St.el.classList.remove('gone'));
    layer.style.setProperty('--body-top', (spec.top != null ? spec.top : r.y + r.h + 12) + 'px');
    layers.append(layer);
    // Every action is a single tap now, so the second tap of a double tap must not land on the screen that follows
    // ("Use this note" and "Send" sit in the same place): a new screen takes presses once it has arrived.
    if (old) { layer.classList.add('is-new'); setTimeout(() => layer.classList.remove('is-new'), 360); }
    S.screen = name; root.dataset.screen = name;
    if (old) { old.inert = true; old.classList.add('leaving'); const a = anim(old, [{ opacity: 1 }, { opacity: 0 }], { duration: 100, easing: 'ease-in', fill: 'forwards' }); if (a) a.onfinish = () => old.remove(); else old.remove(); }
    rise([spec.head, spec.body, spec.actions].filter(Boolean), old ? 110 : 0);      // the old screen's words leave first; then this one's arrive, once
    U.syncAllSegs(root); U.soft();
    if (hooks.screen) hooks.screen(name);
    return layer;
  }
  const backBtn = fn => sym('back', 'Back', fn, 'ph-back', 20);
  const primaryBtn = (label, fn, ic) => { const b = h('button', { class: 'ph-primary', type: 'button', onclick: () => b.act && b.act() }, ic ? icon(ic, 20) : null, h('span', { class: 'ph-primary-label', text: label })); b.act = fn; return b; };
  const plainBtn = (label, fn, ic, cls) => h('button', { class: 'ph-btn ' + (cls || ''), type: 'button', onclick: fn }, ic ? icon(ic, 16) : null, h('span', { text: label }));

  // ---- 1. take the photo. The scene switch sits above the picture; the picture is clean; the controls are low.
  /** Back at the camera after a send: it opens on the scene that has not been sent yet. A scene chosen by hand stands until the next send. */
  function nextScene() { if (!S.auto) return; S.auto = false; const left = SCENES().find(id => !S.sent.some(f => f.scene === id)); if (left) S.scene = left; }
  function camera() {
    nextScene();
    S.run++; S.custom = false; S.note = null; S.answers = {}; typeInto = null;
    endScan(true); usePhoto();
    const lens = U.seg(SCENES().map(id => ({ id, label: D.scene(id).short })), S.scene, v => { S.scene = v; S.auto = false; usePhoto(); }, 'ph-lens');
    lens.setAttribute('aria-label', 'Which scene is in front of the camera');
    if (window.Shell && window.Shell.rail) window.Shell.rail(lens);      // more scenes than the switch is wide: it becomes a rail
    const actions = h('div', { class: 'ph-actions ph-actions-camera' },
      sym('image', 'Choose a photo', () => pick(ownPhoto), 'ph-round', 22),
      h('button', { class: 'ph-shutter', type: 'button', 'aria-label': 'Take the photo', onclick: scan }, h('i')),
      S.sent.length ? plainBtn('Sent ' + S.sent.length, sentScreen, null, 'ph-sentlink') : h('span', { class: 'ph-spacer', 'aria-hidden': 'true' }));
    show('camera', { head: h('div', { class: 'ph-head ph-head-camera', style: { paddingTop: PILL.top + 'px', height: VIEW_TOP + 'px' } }, lens), actions, layout: 'camera', view: St.view });
  }
  function ownPhoto(p) { S.custom = true; S.photo = p; S.note = null; S.answers = {}; St.view = { focus: [50, 50] }; setPhoto(p); scan(); }

  // ---- 2. the app reads the photo. The picture goes dim; one line of light travels from the top to the bottom; what it
  // finds comes back to full brightness in a rounded window with its name; the finding has the red rim and a white
  // tag, so it is the clearest thing. At the end every mark leaves at once.
  const hit = (a, b) => !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]);
  function windows(r) {
    if (S.custom || !St.box) return [];
    const g = St.box.geom, ann = D.scene(S.scene).annotations, pad = 8;
    return (F.SCAN[S.scene] || []).map(spec => {
      const a = ann[spec.ix]; if (!a) return null;
      // the region is a fraction of the photograph: mapped through where the photograph is drawn, kept inside the frame
      const x0 = Math.max(pad, g.left + a.box[0] / 100 * g.width), y0 = Math.max(pad, g.top + a.box[1] / 100 * g.height);
      const x1 = Math.min(r.w - pad, g.left + (a.box[0] + a.box[2]) / 100 * g.width), y1 = Math.min(r.h - pad, g.top + (a.box[1] + a.box[3]) / 100 * g.height);
      if (x1 - x0 < 28 || y1 - y0 < 28) return null;
      const img = h('img', { src: S.photo.src, alt: '', draggable: 'false', style: { left: (g.left - x0) + 'px', top: (g.top - y0) + 'px', width: g.width + 'px', height: g.height + 'px' } });
      const el = h('div', { class: 'ph-win' + (spec.finding ? ' is-finding' : ''), style: { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px' } }, img);
      const tag = h('span', { class: 'ph-win-tag' + (spec.finding ? ' is-finding' : '') }, spec.finding ? h('i', { class: 'verdict-mark', 'data-verdict': 'red', 'aria-hidden': 'true' }) : null, h('span', { text: spec.label }));
      return { spec, el, tag, box: [x0, y0, x1, y1] };
    }).filter(Boolean);
  }
  /** each tag goes beside its own window, wholly inside the picture, on no other window and no other tag */
  function placeTags(wins, r) {
    const taken = [], order = wins.slice().sort((a, b) => (b.spec.finding ? 1 : 0) - (a.spec.finding ? 1 : 0));
    for (const w of order) {
      const tw = w.tag.offsetWidth, th = w.tag.offsetHeight, [x0, y0, x1, y1] = w.box, gap = 6, inset = 8;
      const inX = x => clamp(6, x, r.w - tw - 6);
      const spots = [[x0, y0 - th - gap], [x1 - tw, y0 - th - gap], [inX(x0), y0 - th - gap], [x0, y1 + gap], [x1 - tw, y1 + gap], [inX(x0), y1 + gap], [x0 - tw - gap, y0], [x1 + gap, y0], [x0 - tw - gap, y1 - th], [x0 + inset, y0 + inset], [x0 + inset, y1 - th - inset]].filter(q => x1 - x0 >= tw + 2 * inset || q[0] < x0 || q[0] >= x1 || q[1] < y0 || q[1] >= y1);
      const others = wins.filter(o => o !== w).map(o => o.box);
      const fits = (p, own) => p[0] >= 6 && p[1] >= 6 && p[0] + tw <= r.w - 6 && p[1] + th <= r.h - 6 && !others.concat(taken).some(b => hit([p[0], p[1], p[0] + tw, p[1] + th], b)) && (own || true);
      let p = spots.find(q => fits(q));
      if (!p) { if (!w.spec.finding) { w.el.remove(); w.tag.remove(); w.gone = true; continue; } p = [inX(x0), clamp(6, y0 - th - gap, r.h - th - 6)]; }      // no clean place for a side note: it is left out; the finding always has its tag
      w.tag.style.left = p[0] + 'px'; w.tag.style.top = p[1] + 'px'; taken.push([p[0], p[1], p[0] + tw, p[1] + th]);
    }
  }
  /**
   * The marks belong to the scan. When it ends (or is skipped) every one of them leaves in a single move: the dimming,
   * the windows, the tags and the line start together, take the same 250 ms on the same curve, and the photograph is
   * clean again in one beat. Nothing lingers after the rest.
   */
  const SCAN_OUT = 250;
  function endScan(now) {
    const L = St.scan; if (!L) return; const kids = [...L.children];
    L.getAnimations({ subtree: true }).forEach(a => a.pause());          // the line stops where it is, and fades there with the rest
    L.classList.remove('is-on');
    if (now || U.reduced() || !kids.length) { L.getAnimations({ subtree: true }).forEach(a => a.cancel()); L.replaceChildren(); return; }
    kids.forEach(k => k.animate([{ opacity: getComputedStyle(k).opacity }, { opacity: 0 }], { duration: SCAN_OUT, easing: 'ease-out', fill: 'forwards' }));
    setTimeout(() => kids.forEach(k => k.remove()), SCAN_OUT + 20);
  }
  function scan() {
    const run = ++S.run, custom = S.custom, names = custom ? [F.SCAN_STEPS[0]] : F.SCAN_STEPS, st = U.steps(names, 'ph-steps');
    // the same way out whether it finished or was skipped: the marks leave together, then the next screen comes
    const go = () => { if (run !== S.run) return; const next = ++S.run; endScan(); setTimeout(() => { if (S.run === next) note(); }, U.reduced() ? 0 : SCAN_OUT + 10); };
    const skip = h('button', { class: 'ph-skip', type: 'button', 'data-skip': '', text: U.reduced() ? 'Continue' : 'Skip', onclick: go }), said = h('p', { class: 'ph-small ph-scan-said' });
    show('scan', { body: h('div', { class: 'ph-body ph-body-scan' }, st.el, skip, said), layout: 'scan', view: St.view });
    const r = St.rect, L = St.scan, veil = h('i', { class: 'ph-scan-veil' }), line = h('i', { class: 'ph-scan-line' }), wins = windows(r);
    L.replaceChildren(veil, ...wins.map(w => w.el), ...wins.map(w => w.tag), line); placeTags(wins, r);
    for (let i = wins.length - 1; i >= 0; i--) if (wins[i].gone) wins.splice(i, 1);
    const lit = w => { w.el.classList.add('is-lit'); w.tag.classList.add('is-lit'); };
    L.classList.add('is-on');
    if (U.reduced()) { wins.filter(w => w.spec.finding).forEach(lit); st.done(); if (custom) said.textContent = F.SCAN_NONE; return; }   // reduced motion: the final still
    const T = custom ? 1100 : 1750, t0 = 220, later = (ms, fn) => setTimeout(() => { if (run === S.run) fn(); }, ms);
    line.animate([{ transform: 'translateY(-3px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .03 }, { transform: 'translateY(' + (r.h - 2) + 'px)', opacity: 1, offset: .97 }, { transform: 'translateY(' + r.h + 'px)', opacity: 0 }], { duration: T, delay: t0, easing: 'linear', fill: 'both' });
    wins.forEach(w => later(t0 + clamp(.05, w.box[3] / r.h, 1) * T, () => lit(w)));        // lit as the line clears it
    st.run(0);
    if (custom) { later(t0 + T, () => { st.done(); said.textContent = F.SCAN_NONE; }); later(t0 + T + 900, go); return; }
    later(t0 + T * .4, () => st.run(1)); later(t0 + T, () => st.run(2)); later(t0 + T + 420, () => st.done()); later(t0 + T + 760, go);
  }

  // ---- 3. "Add a note": the app's suggestions, the first already chosen. Each has a pencil; "Something else" is the person's own words.
  const grow = (b, m) => [Math.max(0, b[0] - m), Math.max(0, b[1] - m), Math.min(100, b[2] + 2 * m), Math.min(100, b[3] + 2 * m)];
  function note() {
    const custom = S.custom, R = custom ? null : F.READING[S.scene];
    if (!S.note) S.note = { app: custom ? [] : [R.text].concat(R.alternatives), words: {}, pick: custom ? 'own' : 0, own: '' };
    const N = S.note, textOf = i => N.words[i] != null ? N.words[i] : N.app[i];
    const list = h('div', { class: 'ph-opts', role: 'radiogroup', 'aria-label': 'The note' });
    const current = () => (N.pick === 'own' ? N.own : textOf(N.pick)).replace(/\s+/g, ' ').trim();
    const use = primaryBtn(custom ? 'Next' : 'Use this note', () => { if (pens.current) pens.current.done(true); if (current()) questions(); });
    const own = h('textarea', { class: 'ph-field ph-own-text', rows: '3', placeholder: 'Write what is wrong', 'aria-label': 'What is wrong, in your own words' }); own.value = N.own;
    own.addEventListener('input', () => { N.own = own.value; sync(); });
    const rows = {}, pens = { current: null };
    function row(i, text) {
      const t = h('span', { class: 'ph-opt-text', text }), isOwn = i === 'own', X = rows[i] = { t };
      const choose = () => { if (X.pen && X.pen.on) return; N.pick = i; sync(); if (isOwn) own.focus(); };
      // the pencil: the words stay and become editable where they are; the pencil turns into the tick in the same spot
      X.pen = isOwn ? null : U.pencil(t, { cls: 'ph-opt-edit', size: 17, group: pens, onStart: () => X.el.classList.add('is-editing'), onEnd: () => { X.el.classList.remove('is-editing'); U.soft(); },
        onSave: v => { if (v === N.app[i]) delete N.words[i]; else N.words[i] = v; N.pick = i; sync(); } });                 // the edited option becomes the chosen one
      X.undo = isOwn ? null : sym('undo', 'Undo', e => { e.stopPropagation(); if (X.pen.on) X.pen.done(false); delete N.words[i]; crossfade(t, () => { t.textContent = N.app[i]; }); sync(); }, 'ph-opt-undo', 16);
      X.el = h('div', { class: 'ph-opt', role: 'radio', tabindex: '0', 'data-i': String(i), onclick: choose }, t, h('i', { class: 'ph-tick' }, icon('check', 17)), X.undo, X.pen && X.pen.btn);
      X.el.addEventListener('keydown', e => { if ((X.pen && X.pen.on) || e.target !== X.el) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
      return X.el;
    }
    N.app.forEach((t, i) => list.append(row(i, textOf(i)))); if (!custom) list.append(row('own', 'Something else'));
    function sync() {
      for (const k in rows) { const X = rows[k], on = String(N.pick) === k; X.el.classList.toggle('is-on', on); X.el.setAttribute('aria-checked', String(on)); if (X.undo) X.undo.hidden = N.words[k] == null; }
      own.classList.toggle('show', N.pick === 'own'); use.disabled = !current(); U.soft();
    }
    const head = h('div', { class: 'ph-head' }, backBtn(camera), h('h1', { text: 'Add a note' }));
    const body = h('div', { class: 'ph-body tm-softscroll' }, custom ? h('p', { class: 'ph-plain', text: F.UNKNOWN_PHOTO }) : null, list, own);
    St.view = custom ? { focus: [50, 50] } : { region: grow(D.scene(S.scene).annotations.find(a => a.finding).box, { sprinkler: 15, daisy: 16, ladder: 12, firedoor: 18 }[S.scene] || 12) };
    show('note', { head, body, actions: h('div', { class: 'ph-actions' }, use), layout: 'note', view: St.view });
    sync();
    if (custom) requestAnimationFrame(() => own.focus({ preventScroll: true }));
    N.text = current;
  }

  // ---- 4. the question. The answer control is on the screen with it.
  function keypad(press) {
    const key = (label, v, aria) => h('button', { class: 'ph-key', type: 'button', 'aria-label': aria || label, onclick: () => press(v) }, v === 'del' ? icon('del', 24) : label);
    return h('div', { class: 'ph-keys' }, '123456789'.split('').map(d => key(d, d)), h('span'), key('0', '0'), key('', 'del', 'Delete'));
  }
  function question(q) {
    const a = S.answers[q.id] || (S.answers[q.id] = {}), en = q.entry || null, year = !!en && en.digits === 4 && !en.unit;
    let typed = a.typed || '';
    const pic = q.picture ? P.drawing(q.picture) : null;
    const boxes = year ? [0, 1, 2, 3].map(() => h('span', { class: 'ph-digit shell-num' })) : null, value = !en || year ? null : h('span', { class: 'ph-entry-value shell-num' });
    const entry = !en ? null : h('div', { class: 'ph-entry ' + (year ? 'is-boxes' : 'is-field'), tabindex: '0', role: 'textbox', 'aria-label': en.name }, boxes || [value, h('span', { class: 'ph-entry-unit', text: en.unit })]);
    const padWrap = !en ? null : h('div', { class: 'ph-padwrap', hidden: !en.always }, keypad(press));
    const opts = (q.options || []).map(o => h('button', { class: 'ph-pick', type: 'button', 'data-id': o.id, 'aria-pressed': 'false', onclick: () => { if (a.pick === o.id) delete a.pick; else { a.pick = o.id; clear(); clearText(); } openPad(false); sync(); } }, h('span', { class: 'ph-pick-text', text: o.label })));
    const cant = !q.cant ? null : h('button', { class: 'ph-cant', type: 'button', 'aria-pressed': 'false', onclick: () => { if (a.pick === q.cant.id) delete a.pick; else { a.pick = q.cant.id; clear(); } openPad(false); sync(); } }, icon('check', 16), h('span', { text: q.cant.label }));
    const cam = q.photo ? sym('camera', q.photo.label, () => openPhoto(q, sync), 'ph-attach', 21) : null;
    // Some answers are not on the list. `write` gives the question a line to type into: taking it clears the taps,
    // and tapping an option clears what was written, so there is only ever one answer.
    const wr = q.write ? h('input', { class: 'ph-write', type: 'text', value: a.text || '', placeholder: q.write.placeholder || 'Write an answer', 'aria-label': q.write.label || q.ask, maxlength: '80',
      oninput: e => { a.text = e.target.value; if (a.text) { delete a.pick; clear(); } sync(); } }) : null;
    const say = h('p', { class: 'ph-q-say' });
    function clear() { typed = ''; a.typed = ''; delete a.value; a.unlikely = false; }
    function clearText() { if (a.text) { delete a.text; if (wr) wr.value = ''; } }
    /** a key was pressed, on the screen or on a keyboard. The typed numbers always show in the entry display. */
    function press(k) {
      if (!en) return;
      if (k === 'del') typed = typed.slice(0, -1); else if (typed.length < en.digits && !(year && !typed.length && k === '0')) typed += k; else return;
      a.typed = typed; const n = +typed, full = typed.length > 0 && (!year || typed.length === 4), inside = n >= en.min && n <= en.max();
      if (full && (inside || year)) a.value = n; else delete a.value;      // a year outside the likely range is asked about, and kept if the person leaves it
      a.unlikely = !!(year && full && !inside);
      if (typed) delete a.pick;
      sync();
    }
    function openPad(on) { if (!en || en.always || padWrap.hidden === !on) return; U.reveal(padWrap, on); el.classList.toggle('is-typing', on);      // while the keys are out the drawing is smaller, so the whole screen still fits
      if (on) setTimeout(() => { if (padWrap.isConnected) padWrap.scrollIntoView({ block: 'nearest', behavior: U.reduced() ? 'auto' : 'smooth' }); }, 270); }
    if (entry) {
      entry.addEventListener('click', () => openPad(true));
      entry.addEventListener('focus', () => { if (U.keys.on) openPad(true); });
    }
    function sync() {                                              // only what changed is touched
      const active = !!en && (!!en.always || !padWrap.hidden), full = !!en && typed.length === en.digits;
      if (boxes) boxes.forEach((b, i) => { const t = typed[i] || ''; if (b.textContent !== t) b.textContent = t; b.classList.toggle('is-caret', active && i === Math.min(typed.length, 3) && a.pick !== q.cant.id && !(full && i === 3 && a.value != null)); });
      else if (entry) { const t = typed || en.open; if (value.textContent !== t) value.textContent = t; entry.classList.toggle('is-empty', !typed); entry.classList.toggle('is-active', active); }
      if (entry) { entry.classList.toggle('is-set', a.value != null); entry.classList.toggle('is-off', a.pick === q.cant.id); }
      opts.forEach(b => { const on = a.pick === b.dataset.id; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      if (cant) cant.setAttribute('aria-pressed', String(a.pick === q.cant.id));
      const line = !en ? ((a.pick && (!q.cant || a.pick !== q.cant.id) && q.say) ? q.say(a.pick) : '')
        : year && a.unlikely ? en.wrong : a.value != null && q.say ? q.say(a.value) : (en.help || '');
      if (say.textContent !== line) { if (say.textContent && line) swapText(say, line, { size: false }); else say.textContent = line; }
      say.classList.toggle('is-wrong', !!(year && a.unlikely));
      if (pic) pic.set({ digits: typed });
      if (cam) { const src = a.photo ? 'url("' + a.photo.src + '")' : ''; if (cam.style.backgroundImage !== src) cam.style.backgroundImage = src; cam.classList.toggle('is-done', !!a.photo); cam.setAttribute('aria-label', a.photo ? 'Photo added. Change it' : q.photo.label); cam.title = cam.getAttribute('aria-label'); }
    }
    const el = h('section', { class: 'ph-q' + (en ? '' : ' is-tap') + (q.write ? ' has-write' : ''), 'data-q': q.id },
      pic ? h('div', { class: 'ph-q-pic' }, pic.el) : null, h('h2', { class: 'ph-q-ask', text: q.ask }),
      opts.length ? h('div', { class: 'ph-q-opts' }, opts) : null, wr, entry, say, padWrap,
      cant || cam ? h('div', { class: 'ph-q-foot' }, cant, cam) : null);
    const onKey = e => {                                           // a real keyboard types into the same display
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!en) return;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); openPad(true); press(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
      else if (e.key === 'Enter' && e.target === entry) { e.preventDefault(); openPad(false); const send = layers.querySelector('.ph-layer:not(.leaving) .ph-primary'); if (send) send.focus(); }
    };
    sync();
    return { el, entry, onKey };
  }
  function questions() {
    const custom = S.custom, qs = custom ? [] : F.questions(S.scene), noteText = S.note.text();
    const blocks = qs.map(question);
    const head = h('div', { class: 'ph-head ph-head-q' }, backBtn(note), h('h1', { text: !qs.length ? 'Ready to send' : qs.length === 1 ? 'One question' : 'A few questions' }));
    const body = h('div', { class: 'ph-body ph-body-q tm-softscroll' }, !qs.length ? h('p', { class: 'ph-note-plain', text: noteText }) : null, blocks.map(b => b.el));
    const send = primaryBtn('Send to the senior inspector', doSend, 'send');      // one tap sends; the item is then in the Sent list
    St.view = { focus: custom ? [50, 50] : F.FOCUS[S.scene] };
    show('questions', { head, body, actions: h('div', { class: 'ph-actions' }, send), layout: 'questions', view: St.view, top: 70 });
    typeInto = blocks[0] ? blocks[0].onKey : null;
    if (blocks[0] && U.keys.on) blocks[0].entry.focus({ preventScroll: true });
  }
  function doSend() {
    S.auto = true;                                                // the next time the camera opens it moves to the scene not sent yet
    if (S.screen !== 'questions') return;
    const custom = S.custom, sc = custom ? null : D.scene(S.scene), N = S.note, text = N.text();
    const finding = {
      id: 'f' + Date.now().toString(36) + S.sent.length, at: new Date(), scene: custom ? 'custom' : S.scene, loc: Object.assign({}, S.loc), place: S.loc.place,
      title: custom ? 'Photo with a note' : sc.short, photo: { src: S.photo.src, aspect: S.photo.aspect }, focus: custom ? [50, 50] : F.FOCUS[S.scene],
      note: { text, appText: custom ? '' : N.app[0], changed: custom || text !== N.app[0] },
      asked: custom ? [] : F.asked(S.scene, S.answers), readings: custom ? [] : F.readings(S.scene, null),     // what the app read goes to the senior inspector as it is
      facts: custom ? {} : F.facts(S.scene, S.answers, null), state: 'sent',
    };
    S.sent.unshift(finding);
    const from = St.el.getBoundingClientRect();
    St.el.classList.add('gone');                                   // the picture leaves with the parcel
    sentScreen(true);
    if (hooks.send) hooks.send(finding, from);
  }

  // ---- 5. sent items, with their state
  const stateWord = s => s === 'reviewed' ? 'Reviewed' : 'Sent';
  const whereLine = f => D.place(f.place).short + ' · ' + U.clock(f.at);
  function sentRow(f) {
    const b = P.photoBox(f.photo.src, f.photo.aspect, 'ph-sent-thumb'); b.pct(1, { focus: f.focus });
    return h('li', { class: 'ph-sent', 'data-id': f.id, 'data-state': f.state }, b.el,
      h('div', { class: 'ph-sent-text' }, h('b', { text: f.title }), h('span', { class: 'ph-small ph-sent-where', text: whereLine(f) })),
      h('span', { class: 'ph-state', 'data-state': f.state }, h('i', { class: 'ph-state-mark' }, icon('check', 12)), h('span', { class: 'ph-state-text', text: stateWord(f.state) })));
  }
  function sentScreen(fresh) {
    S.run++;
    const head = h('div', { class: 'ph-head' }, fresh === true ? null : backBtn(camera), h('h1', { text: 'Sent' }));
    const body = h('div', { class: 'ph-body ph-body-sent tm-softscroll' }, h('ul', { class: 'ph-sentlist' }, S.sent.map(sentRow)));
    show('sent', { head, body, actions: h('div', { class: 'ph-actions' }, primaryBtn('Next photo', camera, 'camera')), top: 64 });
  }
  /** the senior published (or undid it): the item's state changes in place */
  function markReviewed(id, on) {
    const f = S.sent.find(x => x.id === id); if (!f) return; const state = on === false ? 'sent' : 'reviewed'; f.state = state;
    const row = layers.querySelector('.ph-sent[data-id="' + id + '"]');
    if (row && row.dataset.state !== state) { row.dataset.state = state; const st = row.querySelector('.ph-state'); st.dataset.state = state; swapText(st.querySelector('.ph-state-text'), stateWord(state), { size: false }); if (state === 'reviewed') U.pop(st.querySelector('.ph-state-mark')); }
  }
  /** kept for a finding whose place changes after it was sent, and for the place the next photo is taken in */
  function moved(f) { const n = layers.querySelector('.ph-layer:not(.leaving) .ph-sent[data-id="' + f.id + '"] .ph-sent-where'); if (n) swapText(n, whereLine(f), { size: false }); }
  function setLoc(loc) { S.loc = loc; }

  // ---------------------------------------------------------------- the sheet for one extra photo (rises from the bottom)
  function openSheet(label, nodes) {
    const put = () => { sheetIn.replaceChildren(...nodes.flat().filter(Boolean)); sheetEl.setAttribute('aria-label', label); sheetIn.scrollTop = 0; sheetEl.classList.add('is-on'); veilEl.classList.add('is-on'); sheetEl.inert = false; U.soft(); };
    if (sheetEl.classList.contains('is-on') && !U.reduced()) { sheetEl.classList.remove('is-on'); setTimeout(put, 240); } else put();   // new content: the sheet dips and rises with it
  }
  function closeSheet() { sheetEl.classList.remove('is-on'); veilEl.classList.remove('is-on'); sheetEl.inert = true; }
  /** one optional extra photo: a short prompt, what it should look like, one camera button */
  function openPhoto(q, done) {
    const ph = q.photo, a = S.answers[q.id] || (S.answers[q.id] = {});
    const take = () => pick(p => { a.photo = p; check(); });
    const ask = () => openSheet(ph.prompt, [h('h2', { text: ph.prompt }), h('p', { class: 'ph-small', text: 'It should look something like this:' }),
      h('div', { class: 'ph-shot' }, h('div', { class: 'ph-shot-tile', 'data-picture': ph.picture }, P.drawing(ph.picture).el)), h('p', { class: 'ph-shot-callout', text: ph.callout }), ph.safety ? h('p', { class: 'ph-small ph-shot-safety', text: ph.safety }) : null,
      sym('camera', 'Take the photo', take, 'ph-camera-big is-ink', 30), plainBtn('Can’t do this one', closeSheet, null, 'ph-btn-quiet')]);
    const check = () => {
      const b = P.photoBox(a.photo.src, a.photo.aspect, 'ph-shot-photo'); b.pct(ph.picture === 'both' ? 300 / 190 : 200 / 236, { focus: [50, 50] });
      openSheet('Your photo', [h('h2', { text: 'Does yours look like this?' }),
        h('div', { class: 'ph-shot two' }, h('div', { class: 'ph-shot-tile', 'data-picture': ph.picture }, P.drawing(ph.picture).el), h('div', { class: 'ph-shot-tile', 'data-picture': ph.picture }, b.el)),
        h('div', { class: 'ph-shot-caps' }, h('span', { class: 'ph-small', text: 'Like this' }), h('span', { class: 'ph-small', text: 'Your photo' })),
        h('div', { class: 'ph-shot-acts' }, primaryBtn('Looks good', closeSheet, 'check'), sym('camera', 'Take it again', take, 'ph-round', 22))]);
      done();
    };
    if (a.photo) check(); else ask();
  }

  // ---------------------------------------------------------------- choosing a picture from the device
  function pick(cb) { onPicked = cb; file.value = ''; file.click(); }
  function loadPicked(src, cb) { const im = new Image(); im.onload = () => cb({ src, aspect: im.naturalWidth / im.naturalHeight || 1 }); im.onerror = () => { }; im.src = src; }

  function mount(el, loc) {
    root = el; S.loc = loc || D.pin('ross');
    file = h('input', { type: 'file', accept: 'image/*', class: 'ph-file', tabindex: '-1', 'aria-hidden': 'true' });
    file.addEventListener('change', () => { const f = file.files && file.files[0]; if (f && onPicked) loadPicked(URL.createObjectURL(f), onPicked); });
    layers = h('div', { class: 'ph-layers' });
    view = h('div', { class: 'ph-view' }, layers, buildStage());
    veilEl = h('div', { class: 'ph-veil', onclick: closeSheet });
    sheetIn = h('div', { class: 'ph-sheet-in tm-softscroll' }); sheetEl = h('div', { class: 'ph-sheet', role: 'dialog' }, sym('close', 'Close', closeSheet, 'ph-sheet-close', 18), sheetIn); sheetEl.inert = true;
    root.append(h('div', { class: 'ph-status', 'aria-hidden': 'true' }, h('span', { class: 'shell-num', text: '9:41' }), h('span', { class: 'ph-status-r' }, h('i', { class: 'ph-sig' }), h('i', { class: 'ph-batt' }))), view, veilEl, sheetEl, file);
    St.scan.addEventListener('click', () => { const b = layers.querySelector('.ph-layer:not(.leaving) [data-skip]'); if (b) b.click(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && sheetEl.classList.contains('is-on')) { closeSheet(); return; }
      // numbers typed while nothing else has the focus go to the question on the phone
      const t = e.target, free = t === document.body || root.contains(t);
      if (free && S.screen === 'questions' && typeInto && !sheetEl.classList.contains('is-on') && !(t.closest && t.closest('textarea, input, [contenteditable]'))) typeInto(e);
    });
    camera();
  }
  /** "Start over": back to an empty phone, without reloading the page */
  function reset() { S.run++; closeSheet(); S.sent = []; S.auto = false; S.scene = 'sprinkler'; S.screen = ''; endScan(true); layers.replaceChildren(); St.el.classList.remove('gone'); camera(); }

  return {
    mount, reset, state: S, markReviewed, setLoc, moved, stage: St,
    onSend(fn) { hooks.send = fn; }, onScreen(fn) { hooks.screen = fn; },
    relayout() { if (St.layout && !St.el.classList.contains('gone')) place(St.layout, St.view, true); U.syncAllSegs(root); },
    /** a hook for tests and screenshots only, with nothing in the interface: act as if the camera returned this picture */
    picked(src) { if (onPicked) loadPicked(src, onPicked); },
  };
})();
