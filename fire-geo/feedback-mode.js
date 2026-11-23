/* ============================================================
   FEEDBACK MODE — drop-in annotation layer for any prototype page.

   <script src="/feedback-mode.js"></script>            (that is all)
   (optional) /vendor/html2canvas.min.js next to it enables box screenshots.

   · A small "Feedback" pill sits bottom-right. Press it (or press F twice
     quickly) to enter the mode. Press again or Esc to leave.
   · In the mode, click-drag anywhere draws a red box. When you release, a
     note box appears next to it: type what is going on there. Enter saves,
     Shift+Enter is a newline, Esc cancels.
   · Tap an existing box to edit its note or delete it. Drag a box's corner
     handle to resize.
   · A box is ANCHORED TO THE CONTENT it was drawn around, not to a spot on
     the screen: it remembers the element under it (a selector path and a
     text fingerprint) and its offset inside that element. When the page or
     an inner panel scrolls, or a sheet lifts, the box follows the content.
     When that content is not on screen (another screen, another thought),
     the box hides instead of sitting over something else, and comes back
     the moment its content does.
   · Each saved box also keeps a SCREENSHOT of what was inside it at the time
     it was drawn. The side panel (right) lists every box on this page with
     its thumbnail, note and whether it is on this screen; tap to edit.
   · Persistence: POST /api/feedback {kind:'box', …} when the page's server
     offers it (see feedback-api.js; screenshots land in feedback-shots/),
     always mirrored to localStorage. GET /api/feedback → { boxes } reloads.
   ============================================================ */
(function () {
  'use strict';
  if (window.__feedbackMode) return;
  const PAGE = location.pathname;   // path only: a box drawn at /?world=x must still show at / (the anchor decides whether it is on screen)
  const samePage = b => ((b && b.page) || '').split('?')[0] === PAGE;
  const LS_KEY = 'feedback-boxes:' + PAGE;
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  const FONT = 'ui-rounded,-apple-system,BlinkMacSystemFont,"SF Pro Rounded",system-ui,sans-serif';

  /* ---------------- styles ---------------- */
  const css = document.createElement('style');
  css.textContent = `
  .fbm-btn{position:fixed;right:22px;bottom:22px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px 0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.9);
    background:rgba(255,255,255,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 2px 6px rgba(60,64,72,.08),0 12px 32px rgba(60,64,72,.12);
    font:650 12.5px/1 ${FONT};color:#3a3d42;cursor:pointer;user-select:none;-webkit-user-select:none;transition:transform .12s cubic-bezier(.34,1.45,.64,1),background .2s,color .2s}
  .fbm-btn:active{transform:scale(.96)}
  .fbm-btn i{width:12px;height:12px;border:2px solid #d9413a;border-radius:3px;display:inline-block;box-sizing:border-box}
  .fbm-btn .fbm-count{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#d9413a;color:#fff;font-size:11px;display:inline-flex;align-items:center;justify-content:center}
  .fbm-btn .fbm-count:empty{display:none}
  .fbm-btn.on{background:#d9413a;color:#fff;border-color:#d9413a}
  .fbm-btn.on i{border-color:#fff}
  .fbm-btn.on .fbm-count{background:#fff;color:#d9413a}
  .fbm-hint{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:2147483000;height:34px;padding:0 14px;border-radius:999px;background:rgba(30,32,36,.88);color:#fff;
    font:600 12.5px/34px ${FONT};pointer-events:none;opacity:0;transition:opacity .25s}
  .fbm-hint.on{opacity:1}
  .fbm-layer{position:absolute;left:0;top:0;width:100%;z-index:2147482000;pointer-events:none}
  html.fbm-mode .fbm-layer{pointer-events:auto;cursor:crosshair}
  html.fbm-mode{cursor:crosshair}
  .fbm-box{position:absolute;border:2px solid #d9413a;background:rgba(217,65,58,.08);border-radius:4px;box-sizing:border-box;pointer-events:none;display:none}
  html.fbm-mode .fbm-box.here{display:block;pointer-events:auto;cursor:pointer}
  .fbm-box.drawing{display:block;pointer-events:none;background:rgba(217,65,58,.12)}
  .fbm-box.lit{box-shadow:0 0 0 4px rgba(217,65,58,.25)}
  .fbm-box .fbm-n{position:absolute;left:-2px;top:-22px;height:20px;min-width:20px;padding:0 6px;border-radius:10px 10px 10px 2px;background:#d9413a;color:#fff;font:700 11px/20px ${FONT};display:flex;align-items:center;justify-content:center}
  .fbm-box .fbm-h{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;border-radius:50%;background:#fff;border:2px solid #d9413a;cursor:nwse-resize;box-sizing:border-box}
  .fbm-box.empty{border-style:dashed}
  .fbm-pop{position:absolute;z-index:2147483100;width:280px;padding:10px 10px 8px;border-radius:14px;background:rgba(255,255,255,.97);border:1px solid rgba(217,65,58,.35);box-shadow:0 6px 18px rgba(60,64,72,.1),0 28px 64px rgba(60,64,72,.16);
    font:500 13px/1.45 ${FONT};color:#3a3d42;box-sizing:border-box}
  .fbm-pop textarea{width:100%;min-height:74px;resize:vertical;border:1px solid rgba(58,61,66,.14);border-radius:10px;padding:8px 10px;font:inherit;color:inherit;outline:none;box-sizing:border-box;background:#fff}
  .fbm-pop textarea:focus{border-color:#d9413a;box-shadow:0 0 0 3px rgba(217,65,58,.12)}
  .fbm-pop .fbm-row{display:flex;gap:6px;align-items:center;margin-top:8px}
  .fbm-pop .fbm-row small{color:rgba(58,61,66,.5);font-size:11px;margin-right:auto}
  .fbm-pop button{height:30px;padding:0 12px;border-radius:999px;border:1px solid rgba(58,61,66,.12);background:#fff;font:650 12px/1 ${FONT};color:#3a3d42;cursor:pointer}
  .fbm-pop button.save{background:#d9413a;border-color:#d9413a;color:#fff}
  .fbm-pop button.del{color:#b8302a}
  .fbm-pop .fbm-target{font-size:11px;color:rgba(58,61,66,.5);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fbm-pop img.fbm-shot{display:block;width:100%;max-height:120px;object-fit:cover;object-position:top;border-radius:8px;margin-bottom:8px;border:1px solid rgba(58,61,66,.1)}
  /* ---- side panel: every box on this page ---- */
  .fbm-panel{position:fixed;right:22px;top:84px;bottom:76px;z-index:2147483000;width:290px;display:none;flex-direction:column;border-radius:18px;background:rgba(255,255,255,.92);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
    border:1px solid rgba(255,255,255,.9);box-shadow:0 2px 6px rgba(60,64,72,.08),0 12px 32px rgba(60,64,72,.12);font:500 12.5px/1.4 ${FONT};color:#3a3d42;overflow:hidden}
  html.fbm-mode .fbm-panel{display:flex}
  .fbm-panel .fbm-ph{padding:12px 14px 8px;font:700 10.5px/1 ${FONT};letter-spacing:.1em;text-transform:uppercase;color:rgba(58,61,66,.5);display:flex;justify-content:space-between;align-items:center}
  .fbm-panel .fbm-ph b{color:#d9413a}
  .fbm-panel .fbm-list{overflow:auto;padding:0 8px 10px;flex:1}
  .fbm-panel .fbm-empty{padding:18px 14px;color:rgba(58,61,66,.5);line-height:1.5}
  .fbm-item{display:flex;gap:10px;align-items:flex-start;padding:8px;border-radius:12px;cursor:pointer;position:relative}
  .fbm-item:hover{background:rgba(217,65,58,.07)}
  .fbm-item.lit{background:rgba(217,65,58,.1)}
  .fbm-item .fbm-th{flex:none;width:86px;height:64px;border-radius:8px;background:#f1f0ed;border:1px solid rgba(58,61,66,.1);overflow:hidden;position:relative}
  .fbm-item .fbm-th img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  .fbm-item .fbm-th .n{position:absolute;left:-1px;top:-1px;height:18px;min-width:18px;padding:0 5px;border-radius:8px 4px 8px 2px;background:#d9413a;color:#fff;font:700 10.5px/18px ${FONT};text-align:center}
  .fbm-item .fbm-th .ph{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(58,61,66,.35);font-size:10px}
  .fbm-item .t{min-width:0;flex:1}
  .fbm-item .t .txt{font-weight:600;color:#3a3d42;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
  .fbm-item .t .txt.none{color:rgba(58,61,66,.45);font-weight:500}
  .fbm-item .t small{display:block;color:rgba(58,61,66,.5);font-size:11px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fbm-item .t .where{display:inline-block;margin-top:5px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:2px 7px;border-radius:999px;background:#e6f4e7;color:#2e7d32}
  .fbm-item .t .where.off{background:rgba(58,61,66,.08);color:rgba(58,61,66,.55)}
  @media (max-width:900px){.fbm-panel{width:220px}}
  `;
  document.head.appendChild(css);

  /* ---------------- dom ---------------- */
  const layer = document.createElement('div'); layer.className = 'fbm-layer';
  const btn = document.createElement('button'); btn.className = 'fbm-btn'; btn.type = 'button'; btn.title = 'Feedback mode (F F)';
  btn.innerHTML = '<i></i><span>Feedback</span><span class="fbm-count"></span>';
  const hint = document.createElement('div'); hint.className = 'fbm-hint'; hint.textContent = 'Drag to draw a box · tap a box to edit · Esc to leave';
  const panel = document.createElement('div'); panel.className = 'fbm-panel';
  panel.innerHTML = '<div class="fbm-ph"><span>Feedback on this page</span><b class="fbm-pc"></b></div><div class="fbm-list"></div>';
  const listEl = panel.querySelector('.fbm-list');
  const mount = () => { document.body.appendChild(layer); document.body.appendChild(btn); document.body.appendChild(hint); document.body.appendChild(panel); sizeLayer(); };
  const sizeLayer = () => { layer.style.height = Math.max(document.documentElement.scrollHeight, innerHeight) + 'px'; };
  if (document.body) mount(); else addEventListener('DOMContentLoaded', mount);
  addEventListener('resize', sizeLayer);

  /* ---------------- state ---------------- */
  let boxes = {};            // id → { id, page, anchor:{path,text,dx,dy,aw,ah}, x,y,w,h, text, shot, context, at, savedAt, vw }
  let on = false, api = null;
  const els = {};
  const countEl = () => btn.querySelector('.fbm-count');
  const renderCount = () => { const n = Object.keys(boxes).length; countEl().textContent = n ? String(n) : ''; panel.querySelector('.fbm-pc').textContent = n ? String(n) : ''; };
  const order = () => Object.values(boxes).sort((a, b) => a.at.localeCompare(b.at)).map(b => b.id);

  /* ---------------- persistence ---------------- */
  const saveLocal = () => { try { const slim = {}; for (const id in boxes) { const b = { ...boxes[id] }; if (b.shot && b.shot.startsWith('data:') && b.shot.length > 60000) delete b.shot; slim[id] = b; } localStorage.setItem(LS_KEY, JSON.stringify(slim)); } catch {} };
  async function push(box, del) {
    saveLocal();
    if (api === false) return;
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(del ? { kind: 'box', id: box.id, page: PAGE, delete: true } : { kind: 'box', ...box, shot: box.shot && !box.shot.startsWith('data:') ? box.shot.split('?')[0] : box.shot }) });
      api = r.ok;
      if (r.ok) { const j = await r.json(); if (j.shot) { box.shot = j.shot; saveLocal(); renderPanel(true); } }
    } catch { api = false; }
  }
  async function load() {
    try { const s = localStorage.getItem(LS_KEY); if (s) boxes = JSON.parse(s) || {}; } catch {}
    try {
      const r = await fetch('/api/feedback'); if (!r.ok) throw 0;
      const fb = await r.json(); api = true;
      if (fb.boxes) { boxes = {}; Object.values(fb.boxes).filter(samePage).forEach(b => boxes[b.id] = b); saveLocal(); }
    } catch { api = api === true ? true : false; }
    Object.values(boxes).forEach(b => draw(b)); renderCount(); renderPanel(true); tick();
  }

  /* ---------------- screenshots (html2canvas, if present) ---------------- */
  let h2c = null;
  function loadH2C() {
    if (h2c) return h2c;
    h2c = new Promise(res => {
      if (window.html2canvas) return res(window.html2canvas);
      const s = document.createElement('script'); s.src = '/vendor/html2canvas.min.js';
      s.onload = () => res(window.html2canvas || null); s.onerror = () => res(null); document.head.appendChild(s);
    });
    return h2c;
  }
  // a static copy of the page as it is right now: canvases become images, scripts go, inner
  // scroll positions are kept so the server renders exactly what is on screen
  function snapshotHTML() {
    const liveAll = [...document.querySelectorAll('*')];
    const clone = document.documentElement.cloneNode(true);
    const cloneAll = [clone, ...clone.querySelectorAll('*')];   // document.querySelectorAll includes <html>; the clone must too, or every index is off by one
    liveAll.forEach((e, i) => {
      const c = cloneAll[i]; if (!c) return;
      if (e.tagName === 'CANVAS') { const img = document.createElement('img'); try { img.src = e.toDataURL('image/png'); } catch {} img.setAttribute('style', e.getAttribute('style') || ''); img.className = e.className; if (e.id) img.id = e.id; img.width = e.width; img.height = e.height; c.replaceWith(img); return; }
      if ((e.scrollTop || e.scrollLeft) && e !== document.documentElement && e !== document.body) c.setAttribute('data-fbm-scroll', e.scrollTop + ',' + e.scrollLeft);
      if (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA') { c.setAttribute('value', e.value); if (e.tagName === 'TEXTAREA') c.textContent = e.value; }
    });
    clone.querySelectorAll('script, .fbm-layer, .fbm-btn, .fbm-hint, .fbm-panel, .fbm-pop').forEach(e => e.remove());
    clone.classList.remove('fbm-mode');
    const base = document.createElement('base'); base.href = location.origin + '/'; clone.querySelector('head').prepend(base);
    // freeze: no entrance transitions or animations may replay in the snapshot, and no filters/masks that need time
    const freeze = document.createElement('style'); freeze.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;transition-delay:0s!important}'; clone.querySelector('head').appendChild(freeze);
    // opacity set by animations in flight is baked from computed style for the elements that matter most
    // bake the computed opacity / transform / filter of every element: with animations frozen, anything that
    // fades or slides in via CSS (the phone wrapper, sheet modules) would otherwise sit at its start state
    liveAll.forEach((e, i) => { const c = cloneAll[i]; if (!c || !c.style || e.tagName === 'CANVAS') return; const cs = getComputedStyle(e); c.style.opacity = cs.opacity; if (cs.transform !== 'none') c.style.transform = cs.transform; if (cs.filter !== 'none') c.style.filter = cs.filter; if (cs.visibility !== 'visible') c.style.visibility = cs.visibility; });
    const restore = document.createElement('script'); restore.textContent = "document.querySelectorAll('[data-fbm-scroll]').forEach(function(e){var v=e.getAttribute('data-fbm-scroll').split(',');e.scrollTop=+v[0];e.scrollLeft=+v[1];});";
    clone.querySelector('body').appendChild(restore);
    return '<!doctype html>' + clone.outerHTML;
  }
  async function captureServer(box) {
    if (api === false) return null;
    try {
      const r = await fetch('/api/feedback/shot', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: box.id, box: { x: box.x, y: box.y, w: box.w, h: box.h }, vw: innerWidth, vh: innerHeight, scrollX, scrollY, html: snapshotHTML() }) });
      if (!r.ok) return null;
      const j = await r.json(); return j.shot ? j.shot + '?t=' + Date.now() : null;
    } catch { return null; }
  }
  async function capture(box) {
    const server = await captureServer(box); if (server) return server;
    const fn = await loadH2C(); if (!fn) return null;
    try {
      const pad = 6;
      const canvas = await fn(document.body, {
        x: box.x - pad, y: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2, scrollX: 0, scrollY: 0,
        scale: Math.min(2, Math.max(1, 600 / Math.max(box.w, box.h))), useCORS: true, logging: false, backgroundColor: null,
        ignoreElements: el => el.classList && (el.classList.contains('fbm-layer') || el.classList.contains('fbm-btn') || el.classList.contains('fbm-hint') || el.classList.contains('fbm-panel') || el.classList.contains('fbm-pop')),
      });
      return canvas.toDataURL('image/jpeg', .82);
    } catch (e) { return null; }
  }

  /* ---------------- anchoring: what the box was drawn around ---------------- */
  const SKIP = /^(HTML|BODY)$/;
  function selectorFor(el) {
    const parts = [];
    for (let e = el, i = 0; e && !SKIP.test(e.tagName) && i < 8; e = e.parentElement, i++) {
      if (e.id) { parts.unshift('#' + CSS.escape(e.id)); break; }
      let s = e.tagName.toLowerCase();
      const d = e.dataset || {};
      if (d.key) s += `[data-key="${d.key}"]`;
      else if (d.act) s += `[data-act="${d.act}"]`;
      else if (d.app) s += `[data-app="${d.app}"]`;
      else if (d.id) s += `[data-id="${d.id}"]`;
      else if (d.title) s += `[data-title="${d.title}"]`;
      else {
        const cls = [...e.classList].filter(c => !/^(in|on|now|enter|swap|sun|full|lifted|expandable|sel|hint|drawing|here|lit)$/.test(c)).slice(0, 2);
        if (cls.length) s += '.' + cls.map(c => CSS.escape(c)).join('.');
        const sib = e.parentElement ? [...e.parentElement.children].filter(x => x.tagName === e.tagName) : [e];
        if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(e) + 1})`;
      }
      parts.unshift(s);
    }
    return parts.join(' > ');
  }
  const fingerprint = el => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const pageRect = el => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  // sample a 3×3 grid inside the box; for each hit walk up to the first ancestor that covers
  // most of the box; keep the SMALLEST such element — the thing the box is really around
  function pickAnchor(x, y, w, h) {
    const area = w * h;
    const cands = new Map();
    layer.style.pointerEvents = 'none';
    for (const fx of [.2, .5, .8]) for (const fy of [.2, .5, .8]) {
      const el = document.elementFromPoint(x + w * fx - scrollX, y + h * fy - scrollY);
      if (!el || SKIP.test(el.tagName)) continue;
      for (let e = el, i = 0; e && !SKIP.test(e.tagName) && i < 12; e = e.parentElement, i++) {
        const r = pageRect(e);
        const ix = Math.max(0, Math.min(x + w, r.x + r.w) - Math.max(x, r.x)), iy = Math.max(0, Math.min(y + h, r.y + r.h) - Math.max(y, r.y));
        if ((ix * iy) / area >= .6) { const a = r.w * r.h; const c = cands.get(e) || { e, a, n: 0 }; c.n++; cands.set(e, c); break; }
      }
    }
    layer.style.pointerEvents = '';
    if (!cands.size) return null;
    // smallest element wins; ties go to the one hit most often
    const best = [...cands.values()].sort((p, q) => (p.a - q.a) || (q.n - p.n))[0].e;
    const r = pageRect(best);
    return { path: selectorFor(best), text: fingerprint(best), dx: Math.round(x - r.x), dy: Math.round(y - r.y), aw: Math.round(r.w), ah: Math.round(r.h), big: r.w * r.h > area * 12 };
  }
  function resolve(box) {
    const a = box.anchor; if (!a || !a.path) return null;
    let el = null; try { el = document.querySelector(a.path); } catch { el = null; }
    if (!el) return null;
    // a box drawn over a large container, a canvas, or anything without its own text (the field,
    // the page background) is only "here" while the app shows the same screen it was drawn on —
    // otherwise it would float over whatever comes next
    if ((a.big || !a.text || el.tagName === 'CANVAS') && box.context && box.context.focus !== undefined) {
      const now = context(); if (now.focus !== box.context.focus || (now.fse || null) !== (box.context.fse || null) || !!now.full !== !!box.context.full) return null;
    }
    if (a.text && fingerprint(el).slice(0, 40) !== a.text.slice(0, 40)) return null;
    const r = pageRect(el);
    if (!r.w || !r.h) return null;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .05) return null;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(pcs.overflowY) || /(auto|scroll|hidden)/.test(pcs.overflow)) {
        const pr = pageRect(p);
        const bx = r.x + a.dx, by = r.y + a.dy;
        if (by + box.h < pr.y + 4 || by > pr.y + pr.h - 4 || bx + box.w < pr.x || bx > pr.x + pr.w) return null;
      }
      if (+pcs.opacity < .05 || pcs.visibility === 'hidden') return null;
    }
    return { x: Math.round(r.x + a.dx), y: Math.round(r.y + a.dy) };
  }
  function context() {
    const c = { url: location.href };
    try { const P = window.planets; if (P) { const s = P.state(); c.world = P.world; c.focus = s.id; c.full = s.full; c.fse = P.fse().open ? P.fse().kind : null; c.title = P.title(); } } catch {}
    return c;
  }

  /* ---------------- boxes ---------------- */
  function draw(box) {
    let el = els[box.id];
    if (!el) {
      el = document.createElement('div'); el.className = 'fbm-box'; el.dataset.id = box.id;
      el.innerHTML = '<span class="fbm-n"></span><span class="fbm-h"></span>';
      el.addEventListener('click', e => { e.stopPropagation(); if (!drawing) openPop(box.id); });
      el.querySelector('.fbm-h').addEventListener('pointerdown', e => startResize(e, box.id));
      layer.appendChild(el); els[box.id] = el;
    }
    el.style.width = box.w + 'px'; el.style.height = box.h + 'px';
    el.classList.toggle('empty', !box.text);
    el.querySelector('.fbm-n').textContent = order().indexOf(box.id) + 1;
    el.title = box.text || 'No note yet — tap to add';
    place(box);
  }
  function place(box) {
    const el = els[box.id]; if (!el) return false;
    const pos = box.anchor ? resolve(box) : { x: box.x, y: box.y };
    if (!pos) { el.classList.remove('here'); return false; }
    el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; el.classList.add('here');
    box.x = pos.x; box.y = pos.y;
    return true;
  }
  let lastKey = '';
  function tick() {
    if (on) {
      const here = [];
      for (const b of Object.values(boxes)) if (place(b)) here.push(b.id);
      if (pop) { const b = boxes[pop.dataset.id]; if (b && !pop.dataset.panel && !els[b.id].classList.contains('here')) closePop(); else if (b) placePop(b.id); }
      const key = here.join(',') + '|' + Object.keys(boxes).length;
      if (key !== lastKey) { lastKey = key; renderPanel(); }
      sizeLayer();
    }
    requestAnimationFrame(tick);
  }
  function renderPanel(force) {
    if (!on && !force) return;
    const ids = order();
    if (!ids.length) { listEl.innerHTML = '<div class="fbm-empty">No boxes yet. Drag over anything on this page to draw one.</div>'; return; }
    listEl.innerHTML = ids.map((id, i) => {
      const b = boxes[id]; const here = els[id] && els[id].classList.contains('here');
      const shot = b.shot ? `<img src="${b.shot}" alt="">` : '<span class="ph">no shot</span>';
      const where = (b.anchor && b.anchor.text) || (b.context && b.context.title) || 'page';
      return `<div class="fbm-item ${pop && pop.dataset.id === id ? 'lit' : ''}" data-id="${id}"><div class="fbm-th">${shot}<span class="n">${i + 1}</span></div>
        <div class="t"><div class="txt ${b.text ? '' : 'none'}">${(b.text || 'No note yet').replace(/</g, '&lt;')}</div><small title="${where.replace(/"/g, '&quot;')}">${where.replace(/</g, '&lt;').slice(0, 60)}</small><span class="where ${here ? '' : 'off'}">${here ? 'on this screen' : 'other screen'}</span></div></div>`;
    }).join('');
  }
  listEl.addEventListener('click', e => { const it = e.target.closest('.fbm-item'); if (!it) return; e.stopPropagation(); const id = it.dataset.id; const here = els[id] && els[id].classList.contains('here'); if (here) { els[id].scrollIntoView({ block: 'center', behavior: 'smooth' }); els[id].classList.add('lit'); setTimeout(() => els[id] && els[id].classList.remove('lit'), 1200); } openPop(id, false, !here); lastKey = '~'; });
  panel.addEventListener('pointerdown', e => e.stopPropagation());
  listEl.addEventListener('mouseover', e => { const it = e.target.closest('.fbm-item'); if (it && els[it.dataset.id]) els[it.dataset.id].classList.add('lit'); });
  listEl.addEventListener('mouseout', e => { const it = e.target.closest('.fbm-item'); if (it && els[it.dataset.id]) els[it.dataset.id].classList.remove('lit'); });
  function remove(id) { const b = boxes[id]; if (!b) return; delete boxes[id]; if (els[id]) { els[id].remove(); delete els[id]; } Object.values(boxes).forEach(draw); renderCount(); lastKey = '~'; push(b, true); closePop(); renderPanel(true); }

  /* ---------------- drawing ---------------- */
  let drawing = null, ghost = null;
  layer.addEventListener('pointerdown', e => {
    if (!on || e.button !== 0 || e.target.closest('.fbm-box, .fbm-pop')) return;
    closePop();
    drawing = { x0: e.pageX, y0: e.pageY };
    ghost = document.createElement('div'); ghost.className = 'fbm-box drawing'; layer.appendChild(ghost);
    layer.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  layer.addEventListener('pointermove', e => {
    if (!drawing || !ghost) return;
    const x = Math.min(drawing.x0, e.pageX), y = Math.min(drawing.y0, e.pageY), w = Math.abs(e.pageX - drawing.x0), h = Math.abs(e.pageY - drawing.y0);
    Object.assign(ghost.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  });
  layer.addEventListener('pointerup', async e => {
    if (!drawing) return;
    const x = Math.min(drawing.x0, e.pageX), y = Math.min(drawing.y0, e.pageY), w = Math.abs(e.pageX - drawing.x0), h = Math.abs(e.pageY - drawing.y0);
    drawing = null; if (ghost) { ghost.remove(); ghost = null; }
    if (w < 8 || h < 8) return;
    const anchor = pickAnchor(x, y, w, h);
    const box = { id: uid(), page: PAGE, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), text: '',
      anchor, target: anchor ? { path: anchor.path, text: anchor.text } : { path: 'page', text: '' }, context: context(), at: new Date().toISOString(), vw: innerWidth };
    boxes[box.id] = box; draw(box); renderCount(); openPop(box.id, true);
    // the screenshot is taken right away, while the content is exactly what was boxed
    capture(box).then(shot => { if (shot && boxes[box.id]) { box.shot = shot; if (pop && pop.dataset.id === box.id) { const img = pop.querySelector('img.fbm-shot'); if (img) img.src = shot; } renderPanel(true); if (box.text) push(box); } });
  });
  layer.addEventListener('pointercancel', () => { drawing = null; if (ghost) { ghost.remove(); ghost = null; } });

  /* ---------------- resizing ---------------- */
  function startResize(e, id) {
    e.stopPropagation(); e.preventDefault();
    const b = boxes[id];
    const move = ev => { b.w = Math.max(12, Math.round(ev.pageX - b.x)); b.h = Math.max(12, Math.round(ev.pageY - b.y)); draw(b); };
    const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); capture(b).then(shot => { if (shot) { b.shot = shot; } push(b); renderPanel(true); }); if (pop && pop.dataset.id === id) placePop(id); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  }

  /* ---------------- the note popover ---------------- */
  let pop = null;
  function placePop(id) {
    const b = boxes[id]; if (!pop || !b) return;
    const W = 280, H = pop.offsetHeight || 150, margin = 10;
    if (pop.dataset.panel) { pop.style.left = (scrollX + innerWidth - 22 - 290 - margin - W) + 'px'; pop.style.top = (scrollY + 84) + 'px'; return; }
    const pageW = document.documentElement.scrollWidth;
    let left = b.x + b.w + margin, top = b.y;
    const panelLeft = on ? scrollX + innerWidth - 22 - 290 - margin : Infinity;
    if (left + W > Math.min(pageW - 8, panelLeft)) left = b.x - W - margin;
    if (left < 8) { left = Math.max(8, Math.min(b.x, pageW - W - 8)); top = b.y + b.h + margin; }
    top = Math.max(scrollY + 8, Math.min(top, scrollY + innerHeight - H - 8));
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }
  function openPop(id, fresh, fromPanel) {
    const b = boxes[id]; if (!b) return;
    closePop();
    pop = document.createElement('div'); pop.className = 'fbm-pop'; pop.dataset.id = id; if (fromPanel) pop.dataset.panel = '1';
    const where = (b.anchor && b.anchor.path) || 'page';
    pop.innerHTML = `<div class="fbm-target" title="${where.replace(/"/g, '&quot;')}">${fromPanel ? 'Not on this screen · ' : ''}${where}${b.anchor && b.anchor.text ? ' · “' + b.anchor.text.slice(0, 40).replace(/</g, '&lt;') + '”' : ''}</div>
      ${fromPanel && b.shot ? `<img class="fbm-shot" src="${b.shot}" alt="">` : ''}
      <textarea placeholder="What is going on in this box? What should change?"></textarea>
      <div class="fbm-row"><small>Enter saves · Shift+Enter newline</small><button type="button" class="del">Delete</button><button type="button" class="save">Save</button></div>`;
    const ta = pop.querySelector('textarea'); ta.value = b.text || '';
    pop.addEventListener('pointerdown', e => e.stopPropagation());
    pop.addEventListener('click', e => e.stopPropagation());
    pop.querySelector('.save').addEventListener('click', () => saveNote(id, ta.value));
    pop.querySelector('.del').addEventListener('click', () => remove(id));
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(id, ta.value); }
      if (e.key === 'Escape') { e.stopPropagation(); if (fresh && !ta.value.trim()) remove(id); else closePop(); }
    });
    layer.appendChild(pop); placePop(id); ta.focus(); renderPanel(true);
  }
  function saveNote(id, text) { const b = boxes[id]; if (!b) return; b.text = text.trim(); b.savedAt = new Date().toISOString(); if (!b.text) { remove(id); return; } draw(b); push(b); closePop(); renderPanel(true); }
  function closePop() { if (pop) { pop.remove(); pop = null; } }

  /* ---------------- mode toggle ---------------- */
  function setMode(v) {
    on = v; document.documentElement.classList.toggle('fbm-mode', on); btn.classList.toggle('on', on); hint.classList.toggle('on', on);
    if (!on) closePop(); else { renderPanel(true); loadH2C(); } lastKey = '~'; sizeLayer();
  }
  btn.addEventListener('click', () => setMode(!on));
  let lastF = 0;
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && on) { if (pop) closePop(); else setMode(false); }
    if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(INPUT|TEXTAREA)$/.test((e.target.tagName || '')) && !e.target.isContentEditable) {
      const t = Date.now(); if (t - lastF < 350) { setMode(!on); lastF = 0; } else lastF = t;
    }
  }, true);

  load();
  window.__feedbackMode = { snapshot: snapshotHTML, on: () => on, set: setMode, boxes: () => Object.values(boxes), visible: () => Object.values(boxes).filter(b => els[b.id] && els[b.id].classList.contains('here')).map(b => b.id), remove, page: PAGE };
})();
