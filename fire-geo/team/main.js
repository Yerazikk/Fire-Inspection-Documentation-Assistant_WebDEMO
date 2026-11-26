// team/main.js: puts the phone and the laptop on the page and links them live.
// Findings on this tab are taken in Ross, inside its mapped zone. How the codes change with the place is the
// Technology tab's subject; here the place is kept in state and read by the rules, the owner's page and the file.
//   phone -> desk          what the field inspector sends travels across the gap and arrives at the top of the inbox
//   desk  -> phone         when the senior inspector publishes, the phone's sent item changes to "Reviewed"
// Nothing here depends on the page being reloaded: "Start over" resets the three parts itself, and all state lives
// in memory, so the page can sit hidden inside the shell (see /shared/shell.js) and be exactly as it was left.
(function () {
  'use strict';
  const U = window.TeamUI, { h, anim } = U, P = window.TeamPhoto, D = window.TeamData, Phone = window.TeamPhone, Desk = window.TeamDesk;
  const narrow = window.matchMedia('(max-width: 1179px)'), body = document.body;
  const start = D.pin('ross');

  Phone.mount(document.getElementById('phone'), start);
  Desk.mount(document.getElementById('desk'));

  // ---- one device at a time on a narrow screen (a real phone shows the phone alone)
  let unseen = 0;
  const badge = h('i', { class: 'tm-badge shell-num' });
  const sw = U.seg([{ id: 'phone', label: 'Phone' }, { id: 'desk', node: h('span', { class: 'tm-switch-desk' }, 'Laptop', badge) }], 'phone', v => {
    body.dataset.dev = v;
    if (v === 'desk') { unseen = 0; badge.textContent = ''; badge.classList.remove('is-on'); } else Desk.shut();
    requestAnimationFrame(again);
  }, 'tm-devseg');
  document.getElementById('tmSwitch').append(sw);

  // ---- the parcel: the photograph itself leaves the phone and lands in the inbox. One straight, calm travel.
  function travel(f, from, target, done) {
    const to = target ? target.getBoundingClientRect() : { width: 0 };
    if (U.reduced() || !to.width || !from.width || document.documentElement.classList.contains('shell-hidden')) { done(); return; }
    const box = P.photoBox(f.photo.src, f.photo.aspect, 'tm-parcel'), px = g => ({ left: g.left + 'px', top: g.top + 'px', width: g.width + 'px', height: g.height + 'px' });
    const a = { left: from.left, top: from.top, width: from.width, height: from.height }, b = { left: to.left, top: to.top, width: to.width, height: to.height };
    const p0 = P.fit(a.width, a.height, f.photo.aspect, { focus: f.focus }), p1 = P.fit(b.width, b.height, f.photo.aspect, { focus: f.focus });
    Object.assign(box.el.style, px(b)); Object.assign(box.plate.style, px(p1));
    document.body.append(box.el);
    const T = { duration: 760, easing: U.SOFT };
    anim(box.plate, [px(p0), px(p1)], T);
    const k = anim(box.el, [Object.assign({ borderRadius: '16px' }, px(a)), Object.assign({ borderRadius: '10px' }, px(b))], T);
    k.onfinish = () => { done(); box.el.remove(); };
  }
  Phone.onSend((f, from) => {
    const target = Desk.reserve(f), hidden = narrow.matches && body.dataset.dev !== 'desk';      // where the photograph lands on the laptop
    if (hidden) {                                             // the laptop is not on screen: the parcel goes to its tab
      unseen++; const tab = sw.querySelector('button[data-value="desk"]');
      travel(f, from, tab, () => { Desk.land(f); badge.textContent = String(unseen); badge.classList.add('is-on'); U.pop(badge); });
      return;
    }
    travel(f, from, target, () => Desk.land(f));
  });
  Desk.onPublished((id, on) => Phone.markReviewed(id, on));

  // ---- the stage: the two devices as a pair, each in its true shape. One scale for the whole phone (390 x 844);
  // a 16 : 10 screen for the laptop, as tall as the phone when the window is wide enough.
  const stage = document.getElementById('tmStage'), mainEl = stage.parentNode;
  const FIT = { capH: 26, padBottom: 58, padX: 24, gap: 40, lidV: 11 + 12 + 14, lidX: 20 + 32, minScale: .5, wide: 1.6, square: 1.42 };
  /**
   * One height for both devices. The phone takes it at its true 390 : 844 (one scale for the whole device); the laptop
   * is exactly as tall, lid to base, and as wide as a 16 : 10 screen needs. In a narrow window the laptop's screen may
   * be a little squarer (down to FIT.square); past that, both devices scale down together. Neither is ever taller.
   */
  function fit() {
    const vars = ['--ph-scale', '--ph-w', '--ph-h', '--lap-w', '--lap-h'];
    if (narrow.matches) { vars.forEach(k => stage.style.removeProperty(k)); return; }
    const H = mainEl.clientHeight - FIT.capH - FIT.padBottom, W = mainEl.clientWidth - FIT.padX * 2;
    const widest = (W - FIT.gap - FIT.lidX + FIT.lidV * FIT.square) / (844 * FIT.square + 390);       // the largest scale at which the squarest laptop still fits beside the phone
    const s = Math.max(FIT.minScale, Math.min(1, H / 844, widest)), phW = 390 * s, phH = 844 * s;
    const lapH = phH, lapW = Math.min(W - phW - FIT.gap, (lapH - FIT.lidV) * FIT.wide + FIT.lidX);
    const px = v => (Math.round(v * 100) / 100) + 'px';
    stage.style.setProperty('--ph-scale', String(Math.round(s * 10000) / 10000)); stage.style.setProperty('--ph-w', px(phW)); stage.style.setProperty('--ph-h', px(phH));
    stage.style.setProperty('--lap-w', px(lapW)); stage.style.setProperty('--lap-h', px(lapH));
  }
  function again() { fit(); Phone.relayout(); Desk.relayout(); U.syncAllSegs(document); }
  function reset() {
    unseen = 0; badge.textContent = ''; badge.classList.remove('is-on');
    document.querySelectorAll('.tm-parcel').forEach(n => n.remove());
    Desk.reset(); Phone.reset();
    if (narrow.matches) sw.segSet('phone');
  }
  document.getElementById('tmReset').addEventListener('click', reset);
  window.addEventListener('afterprint', () => { const p = document.getElementById('tmPrint'); if (p) p.replaceChildren(); });
  narrow.addEventListener('change', again);
  window.addEventListener('resize', () => { clearTimeout(again.t); again.t = setTimeout(again, 90); });
  window.addEventListener('shell:visibility', e => { if (e.detail && e.detail.visible) requestAnimationFrame(again); });   // shown again inside the shell
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
  requestAnimationFrame(again);

  again();
  window.Team = { Phone, Desk, UI: U, Data: D, Flow: window.TeamFlow, Drafts: window.TeamDrafts, reset, fit };
})();
