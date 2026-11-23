// FireGeo.beforeAfter(el, { solution, base, position, caption, tags, outline, shown }): the inspection photograph and
// the proposed "after" picture under one draggable divider. Left of the divider is BEFORE. Dragging is direct (no
// easing while held); arrow keys work. The "after" picture is drawn through `solution.align`, so it sits exactly on
// the photograph even though the generator returned a slightly different size.
//
// "Show what changed" is a switch under the picture, OFF by default. On: a clean white outline draws on around the
// change, pulses once, gets its label on a leader, and everything outside it on the after side eases about 30%
// darker (one even-odd path from the same geometry as the outline, so it follows the shape exactly). Off is the
// reverse. The switch keeps its state when the correction is swapped.
//   outline: 'toggle' (default: show the switch) | 'on' (always shown, no switch) | 'off' (never)
//   shown:   the switch's first state in 'toggle' mode (default false)
//   switch:  false = 'toggle' mode without the built-in button: the page has its own and calls outline(on)
//   caption: false leaves out the two-line caption under the picture · tags: { before, after } sets the tag words
// Returns { set, get, outline(on?), update({ solution, position, shown }), destroy, el }.
// Events on `el`: 'ba:change' { position } and 'ba:outline' { on }.
(function (root) {
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.append(n); return n; };
const clamp01 = v => Math.max(0, Math.min(1, v));

// A closed, smooth path through the contour points (quadratic segments through the midpoints). viewBox is 0..1000.
// The curve passes through the midpoints, so a leader that starts on a midpoint touches the line.
function contourPath(pts) {
  const P = pts.map(p => [p[0] * 1000, p[1] * 1000]), n = P.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(P[n - 1], P[0]), d = 'M' + m[0].toFixed(1) + ' ' + m[1].toFixed(1);
  for (let i = 0; i < n; i++) { const q = mid(P[i], P[(i + 1) % n]); d += 'Q' + P[i][0].toFixed(1) + ' ' + P[i][1].toFixed(1) + ' ' + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
  return d + 'Z';
}

function beforeAfter(host, opts) {
  let sol = opts.solution, pos = clamp01(opts.position == null ? 0.5 : opts.position), W = 0, held = false, tween = 0, slot = 0, token = 0;
  const base = opts.base || '', mode = opts.outline === 'on' || opts.outline === 'off' ? opts.outline : 'toggle';
  let shown = mode === 'on' ? true : mode === 'off' ? false : !!opts.shown, hasOutline = false, marks = [];
  host.classList.add('ba'); host.replaceChildren();
  const stage = el('div', 'ba-stage', host); stage.style.aspectRatio = String(sol.aspect);
  const before = el('img', 'ba-img ba-before', stage); before.alt = 'Inspection photograph'; before.draggable = false; before.decoding = 'async'; before.src = base + sol.before;
  const clip = el('div', 'ba-clip', stage), inner = el('div', 'ba-clip-inner', clip);
  const afters = [el('img', 'ba-img ba-after', inner), el('img', 'ba-img ba-after', inner)];
  afters.forEach(a => { a.alt = ''; a.draggable = false; a.decoding = 'async'; });
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ba-outline'); svg.setAttribute('viewBox', '0 0 1000 1000'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true'); inner.append(svg);
  const callouts = el('div', 'ba-callouts', inner);
  const words = opts.tags || {};
  const tagBefore = el('span', 'ba-tag ba-tag-before', stage); tagBefore.textContent = words.before || 'Before';
  const tagAfter = el('span', 'ba-tag ba-tag-after', stage); tagAfter.textContent = words.after || 'After';
  const handle = el('div', 'ba-handle', stage);
  handle.tabIndex = 0; handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', 'Before and after divider'); handle.setAttribute('aria-valuemin', '0'); handle.setAttribute('aria-valuemax', '100'); handle.setAttribute('aria-orientation', 'horizontal');
  el('span', 'ba-grip', handle).innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M5 3.5 2 7l3 3.5M9 3.5 12 7l-3 3.5"/></svg>';
  if (opts.caption !== false) { const cap = el('div', 'ba-caption', host); cap.innerHTML = '<b>Before</b><b>After</b><span>inspection photograph</span><span>proposed, illustrative</span>'; }
  // the switch: a labelled pill with a square check, blue when on
  let toggle = null;
  if (mode === 'toggle' && opts.switch !== false) {
    const tools = el('div', 'ba-tools', host); toggle = el('button', 'shell-pill ba-toggle', tools); toggle.type = 'button';
    el('span', 'ba-check', toggle).setAttribute('aria-hidden', 'true'); toggle.append('Show what changed');
    toggle.addEventListener('click', () => setShown(!shown));
  }

  function placeAfter(img, s) { const a = s.align; img.style.width = (a.sx * 100) + '%'; img.style.height = (a.sy * 100) + '%'; img.style.left = (a.dx * 100) + '%'; img.style.top = (a.dy * 100) + '%'; img.alt = 'Proposed result: ' + s.title; }
  function drawOutline(s) {
    svg.replaceChildren(); callouts.replaceChildren(); marks = [];
    const list = mode === 'off' ? [] : (s.outline || []); hasOutline = list.length > 0;
    // the spotlight: one path that covers the picture with the outlined regions cut out of it (even-odd)
    const holes = list.map(c => contourPath(c.points)).join('');
    if (holes) { const dim = document.createElementNS(NS, 'path'); dim.setAttribute('class', 'ba-dim'); dim.setAttribute('fill-rule', 'evenodd'); dim.setAttribute('d', 'M0 0H1000V1000H0Z' + holes); svg.append(dim); }
    list.forEach(c => {
      const line = document.createElementNS(NS, 'path'); line.setAttribute('class', 'ba-outline-line'); line.setAttribute('d', contourPath(c.points)); line.setAttribute('pathLength', '1'); svg.append(line);
      const lead = document.createElementNS(NS, 'path'); lead.setAttribute('class', 'ba-outline-line ba-leader'); lead.setAttribute('d', 'M' + (c.anchor[0] * 1000).toFixed(1) + ' ' + (c.anchor[1] * 1000).toFixed(1) + 'L' + (c.labelAt[0] * 1000).toFixed(1) + ' ' + (c.labelAt[1] * 1000).toFixed(1)); svg.append(lead);
      const tag = el('span', 'ba-callout', callouts); tag.textContent = c.label; tag.style.left = (c.labelAt[0] * 100) + '%'; tag.style.top = (c.labelAt[1] * 100) + '%';
      marks.push({ c, lead, tag });
    });
    if (toggle) toggle.hidden = !hasOutline;
    placeCallouts();
  }
  // Keep each label inside the picture, and end its leader at the label's real centre (same geometry for both).
  function placeCallouts() {
    if (!W) return;
    marks.forEach(m => { const half = m.tag.offsetWidth / 2 + 6, x = Math.max(half, Math.min(W - half, m.c.labelAt[0] * W)); m.tag.style.left = x + 'px';
      m.lead.setAttribute('d', 'M' + (m.c.anchor[0] * 1000).toFixed(1) + ' ' + (m.c.anchor[1] * 1000).toFixed(1) + 'L' + (x / W * 1000).toFixed(1) + ' ' + (m.c.labelAt[1] * 1000).toFixed(1)); });
  }
  function paintShown() { stage.classList.toggle('is-drawn', shown && hasOutline); if (toggle) toggle.setAttribute('aria-pressed', String(shown)); }
  function setShown(on, quiet) {
    if (mode !== 'toggle') return shown; on = !!on; if (on === shown) return shown;
    shown = on; paintShown(); if (!quiet) host.dispatchEvent(new CustomEvent('ba:outline', { detail: { on: shown } })); return shown;
  }
  function apply() {
    const x = pos * W;
    clip.style.transform = 'translate3d(' + x + 'px,0,0)'; inner.style.transform = 'translate3d(' + (-x) + 'px,0,0)'; handle.style.transform = 'translate3d(' + x + 'px,0,0)';
    handle.setAttribute('aria-valuenow', String(Math.round(pos * 100))); handle.setAttribute('aria-valuetext', Math.round(pos * 100) + '% before, ' + Math.round((1 - pos) * 100) + '% after');
    tagBefore.classList.toggle('is-hidden', x < tagBefore.offsetWidth + 14); tagAfter.classList.toggle('is-hidden', W - x < tagAfter.offsetWidth + 14);
  }
  function set(p, quiet) { const v = clamp01(p); if (v === pos && W) { return; } pos = v; apply(); if (!quiet) host.dispatchEvent(new CustomEvent('ba:change', { detail: { position: pos } })); }
  function glide(to) {                                              // a tap away from the handle: it travels there, plain ease-out
    cancelAnimationFrame(tween); const from = pos, t0 = performance.now(), reduce = root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return set(to);
    (function step(now) { const k = Math.min(1, (now - t0) / 180), e = 1 - Math.pow(1 - k, 3); set(from + (to - from) * e); if (k < 1) tween = requestAnimationFrame(step); })(t0);
  }
  function show(s, instant) {
    const mine = ++token, next = afters[1 - slot], cur = afters[slot];
    placeAfter(next, s);
    // swap the picture, then let the outline for the new correction draw on again if the switch is on
    const began = performance.now();
    const done = () => { if (mine !== token) return; const left = instant ? 0 : 170 - (performance.now() - began); if (left > 0) { setTimeout(done, left); return; }      // the outline that is leaving finishes fading first
      next.classList.add('on'); cur.classList.remove('on'); slot = 1 - slot; stage.classList.remove('is-drawn'); drawOutline(s); stage.classList.remove('is-swapping'); if (toggle) toggle.setAttribute('aria-pressed', String(shown)); requestAnimationFrame(() => requestAnimationFrame(() => { if (mine === token) paintShown(); })); };
    if (!instant) stage.classList.add('is-swapping');
    next.onload = done; next.onerror = done;
    const src = base + s.after;
    if (next.getAttribute('src') === src && next.complete) done(); else next.src = src;
  }

  // ---- pointer: direct while held
  let startX = 0, moved = false, grabOffset = 0;
  const posAt = e => (e.clientX - stage.getBoundingClientRect().left - grabOffset) / (W || 1);
  stage.addEventListener('pointerdown', e => {
    if (e.button) return; e.preventDefault(); cancelAnimationFrame(tween);
    const r = stage.getBoundingClientRect(), near = Math.abs(e.clientX - r.left - pos * W) <= 24;
    held = true; moved = false; startX = e.clientX; grabOffset = near ? e.clientX - r.left - pos * W : 0;
    stage.classList.add('is-held'); stage.setPointerCapture(e.pointerId); handle.focus({ preventScroll: true });
    if (!near) glide(posAt(e));
  });
  stage.addEventListener('pointermove', e => { if (!held) return; if (!moved && Math.abs(e.clientX - startX) < 3) return; moved = true; cancelAnimationFrame(tween); set(posAt(e)); });
  const up = e => { if (!held) return; held = false; stage.classList.remove('is-held'); try { stage.releasePointerCapture(e.pointerId); } catch (_) {} };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  handle.addEventListener('keydown', e => {
    const step = e.shiftKey ? 0.1 : 0.01; let v = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = pos - step; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = pos + step;
    else if (e.key === 'Home') v = 0; else if (e.key === 'End') v = 1; else if (e.key === 'PageDown') v = pos - 0.1; else if (e.key === 'PageUp') v = pos + 0.1;
    if (v == null) return; e.preventDefault(); cancelAnimationFrame(tween); set(v);
  });

  const measure = () => { const w = stage.clientWidth; if (!w || w === W) { if (w) apply(); return; } W = w; apply(); placeCallouts(); };
  const ro = root.ResizeObserver ? new ResizeObserver(measure) : null; if (ro) ro.observe(stage); else root.addEventListener('resize', measure);
  show(sol, true); measure();

  return {
    el: stage, set: p => set(p), get: () => pos,
    outline(on) { return on === undefined ? shown : setShown(on); },      // read or set the "Show what changed" switch
    update(o) { if (o.position != null) set(o.position, true); if (o.shown != null) setShown(o.shown, true); if (o.solution && o.solution !== sol) { sol = o.solution; if (base + sol.before !== before.getAttribute('src')) { before.src = base + sol.before; stage.style.aspectRatio = String(sol.aspect); } show(sol, false); } },
    destroy() { cancelAnimationFrame(tween); if (ro) ro.disconnect(); host.replaceChildren(); },
  };
}
root.FireGeo = root.FireGeo || {};
root.FireGeo.beforeAfter = beforeAfter;
})(window);
