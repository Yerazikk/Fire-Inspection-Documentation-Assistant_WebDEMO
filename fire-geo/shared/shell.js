// fire-geo shell.
//
// 1. Fills <header class="shell-bar" data-shell="technology|inspectors"> with the brand and the two-tab sliding pill.
// 2. On the shell page (the one that has <div class="shell-views">) the two tabs are VIEWS INSIDE ONE DOCUMENT. Both
//    are loaded ahead of time and kept alive. A switch is instant: the two crossfade, the pill slides with a plain
//    ease-out, the address changes with history.pushState, and each view is exactly as it was left. Nothing reloads.
//    The Technology view is this page's own content. The Inspectors view is /team/?embedded=1 in an iframe that is
//    created once (during idle time after first paint) and never destroyed.
// 3. Inside that iframe this same file runs in "embedded" mode: it hides the page's own bar (the parent shows the
//    nav) and tells the page when it is hidden so it can pause its loops. See API.md, "Being embedded".
// 4. Shell.seg / Shell.tabs / Shell.watch: sliding-pill tabs for use inside a page.
(function () {
'use strict';
const TABS = [{ id: 'technology', label: 'Technology', href: '/' }, { id: 'inspectors', label: 'Inspectors', href: '/#inspectors' }];
const reduced = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const FLAT = 'cubic-bezier(.22,1,.36,1)';
const params = new URLSearchParams(location.search);
let framed = false; try { framed = window.top !== window.self && !!(window.top.Shell && window.top.Shell.views); } catch (_) {}
const embedded = params.get('embedded') === '1' || framed;
if (embedded) document.documentElement.classList.add('shell-embedded');

// Put the raised pill under the tab that is `.on`. Call it after you change `.on`. The first call places it with no
// motion; later calls let the CSS transition carry it. It is never re-placed part way: only the target changes.
// The thumb sits ABOVE the labels and carries its own copy of them, in the chosen colour, clipped to its shape and
// held still while it slides. So each label changes colour exactly at the thumb's edge: no label is ever half one
// colour and half the other, and nothing has to be timed.
function cover(el, ind, on, x) {
  const tabs = [...el.querySelectorAll(':scope > a, :scope > button')];
  let over = ind.querySelector(':scope > .shell-seg-over'); if (!over) { over = document.createElement('span'); over.className = 'shell-seg-over'; over.setAttribute('aria-hidden', 'true'); ind.append(over); }
  tabs.forEach(t => { t.style.transition = 'none'; t.style.color = ''; });
  const cs = getComputedStyle(on), other = tabs.find(t => t !== on);
  over.style.color = cs.color; over.style.font = cs.font; over.style.letterSpacing = cs.letterSpacing;
  if (other) on.style.color = getComputedStyle(other).color;      // the real label under the thumb keeps the plain colour: the thumb's copy is the one that is seen
  if (over.childElementCount !== tabs.length || tabs.some((t, i) => over.children[i].textContent !== t.textContent)) over.replaceChildren(...tabs.map(t => { const s = document.createElement('span'); s.textContent = t.textContent; return s; }));
  tabs.forEach((t, i) => { const s = over.children[i].style; s.left = (t.offsetLeft - ind.offsetLeft) + 'px'; s.top = (t.offsetTop - ind.offsetTop) + 'px'; s.width = t.offsetWidth + 'px'; s.height = t.offsetHeight + 'px'; });
  over.style.transform = 'translateX(' + (-x) + 'px)';
}
function seg(el, instant) {
  const on = el.querySelector(':scope > .on'), ind = el.querySelector(':scope > .shell-seg-ind');
  if (!on || !ind) return;
  const first = instant || !ind.dataset.placed, x = on.offsetLeft, w = on.offsetWidth;
  if (!w) return;                                                   // not laid out yet (hidden view): try again when shown
  if (first) ind.style.transition = 'none';
  cover(el, ind, on, x);
  if (ind.dataset.placed && +ind.dataset.x === x && +ind.dataset.w === w) { if (first) { void ind.offsetWidth; ind.style.transition = ''; } return; }
  ind.style.width = w + 'px'; ind.style.transform = 'translateX(' + x + 'px)';
  ind.dataset.placed = '1'; ind.dataset.x = x; ind.dataset.w = w;
  if (first) { void ind.offsetWidth; ind.style.transition = ''; }
}
// Wire a .shell-seg of <button data-value>: click or arrow keys choose, the pill slides, onChange(value) fires.
function tabs(el, onChange) {
  const btns = [...el.querySelectorAll(':scope > button')];
  el.setAttribute('role', 'tablist');
  const choose = (b, focus) => { if (b.classList.contains('on')) return; btns.forEach(o => { o.classList.toggle('on', o === b); o.setAttribute('aria-selected', String(o === b)); o.tabIndex = o === b ? 0 : -1; }); seg(el); if (focus) b.focus(); onChange(b.dataset.value); };
  btns.forEach(b => { b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(b.classList.contains('on'))); b.tabIndex = b.classList.contains('on') ? 0 : -1;
    b.addEventListener('click', () => choose(b));
    b.addEventListener('keydown', e => { const i = btns.indexOf(b); if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); choose(btns[(i + 1) % btns.length], true); } if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); choose(btns[(i + btns.length - 1) % btns.length], true); } }); });
  seg(el, true);
  return { set(value) { const b = btns.find(o => o.dataset.value === value); if (b) choose(b); } };
}
const watched = new Set();
function watch(el) { watched.add(el); }
const replace = () => watched.forEach(el => seg(el));
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(replace, 80); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(replace);

// ------------------------------------------------------------------ the two views in one document
const host = embedded ? null : document.querySelector('.shell-views');
let nav = null, rightSlot = null;
const views = host ? (function () {
  const els = {}; host.querySelectorAll(':scope > .shell-view').forEach(v => { els[v.dataset.view] = v; });
  let current = null;
  const fromAddress = () => (/^#inspectors(\?|$)/.test(location.hash) ? 'inspectors' : 'technology');
  const frame = () => (els.inspectors ? els.inspectors.querySelector(':scope > iframe') : null);
  // Tell the embedded page whether it is on screen, so it can pause its loops while hidden.
  function tell(visible) {
    const f = frame(); if (!f) return;
    try { const w = f.contentWindow, d = w.document; if (!d || !d.documentElement) return;
      d.documentElement.classList.add('shell-embedded'); d.documentElement.classList.toggle('shell-hidden', !visible);
      w.dispatchEvent(new w.CustomEvent('shell:visibility', { detail: { visible } })); } catch (_) {}
  }
  // Buttons the embedded page keeps in its own (hidden) bar are shown here, in the one visible bar.
  function adopt() {
    const f = frame(), group = rightSlot && rightSlot.querySelector('[data-for="inspectors"]'); if (!f || !group) return;
    let theirs = []; try { const bar = f.contentWindow.document.querySelector('.shell-bar'); theirs = bar ? [...bar.querySelectorAll('button, a.shell-pill')] : []; } catch (_) {}
    group.replaceChildren(...theirs.map(orig => { const b = document.createElement('button'); b.type = 'button'; b.className = 'shell-pill'; b.textContent = orig.textContent.trim(); if (orig.title) b.title = orig.title; b.addEventListener('click', () => orig.click()); return b; }));
  }
  function mount() {                                                // created once, never destroyed
    const v = els.inspectors; if (!v || frame()) return;
    const f = document.createElement('iframe'); f.title = 'Inspectors';
    const extra = location.hash.replace(/^#inspectors\??/, '');
    f.addEventListener('load', () => { tell(current === 'inspectors'); adopt(); });
    f.src = '/team/?embedded=1' + (/^[\w=&%.~+-]+$/.test(extra) ? '&' + extra : '');
    v.append(f);
  }
  function show(id, opt) {
    if (!els[id]) id = 'technology';
    if (id === current) return;
    const previous = current; current = id;
    if (id === 'inspectors') mount();
    for (const k in els) { const on = k === id; els[k].classList.toggle('on', on); if (on) els[k].removeAttribute('inert'); else els[k].setAttribute('inert', ''); }
    document.body.dataset.view = id;
    if (nav) { nav.querySelectorAll('a').forEach(a => { const on = a.dataset.tab === id; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); seg(nav, !previous); }
    if (rightSlot) rightSlot.querySelectorAll('.shell-right-group').forEach(g => { g.hidden = g.dataset.for !== id; });
    if (previous && !(opt && opt.push === false)) history.pushState({ view: id }, '', id === 'inspectors' ? '/#inspectors' : '/');
    tell(id === 'inspectors');
    window.dispatchEvent(new CustomEvent('shell:view', { detail: { view: id, previous } }));
    replace();
  }
  window.addEventListener('popstate', () => show(fromAddress(), { push: false }));
  return { show, mount, frame, current: () => current, fromAddress };
})() : null;

function build(bar) {
  if (embedded) { bar.setAttribute('aria-hidden', 'true'); return; }      // the parent page shows the nav; shell.css hides this bar
  const current = views ? views.fromAddress() : (bar.dataset.shell || 'technology'), keep = [...bar.childNodes];
  const brand = document.createElement('a'); brand.className = 'shell-brand'; brand.href = '/'; brand.innerHTML = 'Fire code by location<span>Ross Valley</span>';
  nav = document.createElement('nav'); nav.className = 'shell-nav shell-seg'; nav.setAttribute('aria-label', 'Views');
  const ind = document.createElement('span'); ind.className = 'shell-seg-ind'; nav.append(ind);
  TABS.forEach(t => {
    const a = document.createElement('a'); a.href = t.href; a.textContent = t.label; a.dataset.tab = t.id;
    if (t.id === current) { a.className = 'on'; a.setAttribute('aria-current', 'page'); }
    a.addEventListener('click', e => { if (!views || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); views.show(t.id); });
    nav.append(a);
  });
  rightSlot = document.createElement('div'); rightSlot.className = 'shell-bar-right'; rightSlot.setAttribute('data-shell-right', '');
  if (views) {                                                      // one group of controls per view; only the current one shows
    const mine = document.createElement('div'); mine.className = 'shell-right-group'; mine.dataset.for = bar.dataset.shell || 'technology'; keep.forEach(n => mine.append(n));
    const theirs = document.createElement('div'); theirs.className = 'shell-right-group'; theirs.dataset.for = mine.dataset.for === 'technology' ? 'inspectors' : 'technology'; theirs.hidden = true;
    rightSlot.append(mine, theirs);
    brand.addEventListener('click', e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); views.show('technology'); });
  } else keep.forEach(n => rightSlot.append(n));
  bar.replaceChildren(brand, nav, rightSlot);
  seg(nav, true); watch(nav);
  if (views) {
    host.classList.add('shell-instant'); views.show(current, { push: false });
    requestAnimationFrame(() => requestAnimationFrame(() => host.classList.remove('shell-instant')));
    // load the other view ahead of time, once the first one has painted and the page is idle
    const later = () => (window.requestIdleCallback ? requestIdleCallback(() => views.mount(), { timeout: 1500 }) : setTimeout(() => views.mount(), 400));
    if (params.get('solo') === '1') return;                         // testing flag: do not preload the other view
    if (document.readyState === 'complete') later(); else window.addEventListener('load', later, { once: true });
  }
}
// The quiet words after the brand say which part of the map is on screen. They change in place: out, then in.
function where(text) {
  const el = document.querySelector('.shell-brand > span'); if (!el || el.__text === text || (el.__text == null && el.textContent === text)) return;
  el.__text = text;
  if (reduced.matches || !el.animate) { el.textContent = text; return; }
  if (el.__fade) el.__fade.cancel();
  el.__fade = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, easing: FLAT });
  el.__fade.onfinish = () => { el.textContent = el.__text; el.__fade = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: FLAT }); el.__fade.onfinish = () => { el.__fade = null; }; };
}
// Soft edges for a scroll area (shell.css .soft-scroll). The fade at an edge grows with how much is hidden past it, up
// to 28 px, so it eases in as you scroll and is gone when you reach the end.
function softScroll(el) {
  if (!el || el.__soft) return; el.__soft = true; el.classList.add('soft-scroll');
  const paint = () => { const top = Math.min(28, Math.max(0, el.scrollTop)), bottom = Math.min(28, Math.max(0, el.scrollHeight - el.clientHeight - el.scrollTop)); el.style.setProperty('--soft-top', top.toFixed(1) + 'px'); el.style.setProperty('--soft-bottom', bottom.toFixed(1) + 'px'); el.classList.toggle('is-soft', top > 0.5 || bottom > 0.5); };
  el.addEventListener('scroll', paint, { passive: true }); window.addEventListener('resize', paint);
  if (window.ResizeObserver) { const ro = new ResizeObserver(paint); ro.observe(el); [...el.children].forEach(c => ro.observe(c)); }
  if (window.MutationObserver) new MutationObserver(() => requestAnimationFrame(paint)).observe(el, { childList: true, subtree: true });
  paint(); return paint;
}
window.Shell = { seg, tabs, watch, build, reduced, FLAT, TABS, views, embedded, where, softScroll };
const bar = document.querySelector('.shell-bar[data-shell]');
if (bar) build(bar);
})();
