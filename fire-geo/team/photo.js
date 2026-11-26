// team/photo.js: everything that shows a photograph or a drawing.
//   photoBox      one photograph in a frame, cropped to a focus point or a region, with marks locked to the image
//   beforeAfter   the divider: inspection photograph on the left, proposed result on the right, change outlined.
//                 The "after" is either a registered image (FireGeo.solutions: after, align, outline) or the same
//                 photograph with a schematic mark-up (the inspector's own recommendation).
//   markup        drag on the photograph to mark the area a recommendation changes
//   drawing       small line drawings that show the field inspector where to look
window.TeamPhoto = (function () {
  'use strict';
  const { h, svg, anim, icon, FLAT } = window.TeamUI;
  let uid = 0;

  // ---- how a photograph sits in a frame. Sizes are in the frame's own units; the result is the image plate's box.
  function fit(fw, fh, aspect, view) {
    const v = view || {}, cover = Math.max(fw, fh * aspect);
    let pw;
    if (v.contain) pw = Math.min(fw, fh * aspect);
    else if (v.region) pw = Math.max(cover, Math.min(fw / (v.region[2] / 100), fh * aspect / (v.region[3] / 100)));
    else pw = cover * (v.zoom || 1);
    const ph = pw / aspect, c = v.region ? [v.region[0] + v.region[2] / 2, v.region[1] + v.region[3] / 2] : (v.focus || [50, 50]);
    let left = fw / 2 - c[0] / 100 * pw, top = fh / 2 - c[1] / 100 * ph;
    left = pw >= fw ? Math.min(0, Math.max(fw - pw, left)) : (fw - pw) / 2;
    top = ph >= fh ? Math.min(0, Math.max(fh - ph, top)) : (fh - ph) / 2;
    return { left, top, width: pw, height: ph };
  }
  function photoBox(src, aspect, cls) {
    const img = h('img', { src, alt: '', draggable: 'false' }), over = h('div', { class: 'tm-over' });
    const plate = h('div', { class: 'tm-plate' }, img, over), el = h('div', { class: 'tm-photo ' + (cls || '') }, plate);
    const box = {
      el, plate, img, over, aspect, src, geom: null,
      /** lay out in pixels (animatable: the frame and the plate both move in px, so the image never distorts) */
      px(w, hgt, view) { const g = fit(w, hgt, box.aspect, view); Object.assign(plate.style, { left: g.left + 'px', top: g.top + 'px', width: g.width + 'px', height: g.height + 'px' }); box.geom = g; return g; },
      /** lay out in per cent of a frame with a known aspect ratio (for frames whose size the layout decides) */
      pct(frameAspect, view) {
        const W = frameAspect * 1000, g = fit(W, 1000, box.aspect, view);
        Object.assign(plate.style, { left: (g.left / W * 100) + '%', top: (g.top / 10) + '%', width: (g.width / W * 100) + '%', height: (g.height / 10) + '%' });
        box.geom = g; return g;
      },
    };
    return box;
  }
  /** a marked region. `a` is a content.js annotation; the label sits a fixed distance from its box, never on the outline */
  function mark(a, label, at) {
    return h('div', { class: 'tm-mark' + (a.finding ? ' finding' : ''), 'data-at': at || 'above-start', 'data-ix': a.ix, style: { left: a.box[0] + '%', top: a.box[1] + '%', width: a.box[2] + '%', height: a.box[3] + '%' } },
      h('span', { class: 'tm-mark-label' }, a.finding ? h('i', { class: 'verdict-mark', 'data-verdict': 'red', 'aria-hidden': 'true' }) : null, label));
  }

  // ---------------------------------------------------------------- before / after
  const TREAT = { remove: 'Remove', thin: 'Thin out', replace: 'Replace' };
  function regionNode(r) {
    return h('div', { class: 'tm-hatch', 'data-treat': r.treat, style: { left: r.box[0] + '%', top: r.box[1] + '%', width: r.box[2] + '%', height: r.box[3] + '%' } }, h('span', { class: 'tm-hatch-label', text: TREAT[r.treat] || r.treat }));
  }
  function beforeAfter(el, o) {
    el.classList.add('tm-ba'); el.style.aspectRatio = String(o.frame);
    const A = photoBox(o.before, o.aspect, 'tm-ba-layer tm-ba-after'), B = photoBox(o.before, o.aspect, 'tm-ba-layer tm-ba-before');
    const top = h('div', { class: 'tm-ba-top' }), outline = svg('svg', { class: 'tm-ba-outline', viewBox: '0 0 1000 1000', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const labels = h('div', { class: 'tm-ba-labels' }), regions = h('div', { class: 'tm-ba-regions' });
    top.append(outline, labels); A.over.append(regions);
    const tagB = h('span', { class: 'tm-ba-tag before' }), tagA = h('span', { class: 'tm-ba-tag after' });
    B.el.append(tagB); A.el.append(tagA);
    const handle = h('button', { type: 'button', class: 'tm-ba-handle', role: 'slider', 'aria-label': 'Before and after divider', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-orientation': 'horizontal' }, icon('chevL', 12), icon('chevR', 12));
    const div = h('div', { class: 'tm-ba-div' }, h('i', { class: 'tm-ba-line' }), handle);
    el.append(A.el, B.el, top, div);
    let p = .5, afterImg = null, cur = {};
    const layout = () => { const g = A.pct(o.frame, o.view); B.pct(o.frame, o.view); for (const k of ['left', 'top', 'width', 'height']) top.style[k] = A.plate.style[k]; return g; };
    layout();
    const set = (v, quiet) => {
      p = Math.max(0, Math.min(1, v)); el.style.setProperty('--p', (p * 100).toFixed(2) + '%');
      handle.setAttribute('aria-valuenow', String(Math.round(p * 100))); handle.setAttribute('aria-valuetext', Math.round(p * 100) + ' per cent before');
      if (!quiet) el.dispatchEvent(new CustomEvent('ba:change', { detail: { position: p } }));
    };
    // Direct: the divider is under the pointer. One move per frame, against a rect measured once at the start of the
    // drag. A pointer reports faster than the screen repaints, and each of those reports was both forcing a layout
    // (getBoundingClientRect) and re-clipping a layer the size of the photograph, several times per painted frame.
    let dragRect = null, raf = 0, pendX = 0;
    const apply = () => { raf = 0; const r = dragRect || el.getBoundingClientRect(); set((pendX - r.left) / r.width); };
    const at = e => { pendX = e.clientX; if (!raf) raf = requestAnimationFrame(apply); };
    div.addEventListener('pointerdown', e => { if (e.button > 0) return; div.setPointerCapture(e.pointerId); el.classList.add('dragging'); dragRect = el.getBoundingClientRect(); at(e); e.preventDefault(); handle.focus({ preventScroll: true }); });
    div.addEventListener('pointermove', e => { if (div.hasPointerCapture(e.pointerId)) at(e); });
    const drop = e => { if (div.hasPointerCapture(e.pointerId)) div.releasePointerCapture(e.pointerId); el.classList.remove('dragging'); dragRect = null; };
    div.addEventListener('pointerup', drop); div.addEventListener('pointercancel', drop);
    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? .1 : .01; let v = null;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = p - step; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = p + step; else if (e.key === 'Home') v = 0; else if (e.key === 'End') v = 1;
      if (v != null) { e.preventDefault(); e.stopPropagation(); set(v); }
    });
    function update(n) {
      // the "after" image: registered on the photograph by FireGeo's alignment; a new one fades in over the old
      if ('after' in n && n.after !== cur.after) {
        const old = afterImg;
        if (n.after) {
          const al = n.align || { sx: 1, sy: 1, dx: 0, dy: 0 };
          afterImg = h('img', { class: 'tm-ba-afterimg', src: n.after, alt: '', draggable: 'false', style: { left: (al.dx * 100) + '%', top: (al.dy * 100) + '%', width: (al.sx * 100) + '%', height: (al.sy * 100) + '%' } });
          A.plate.insertBefore(afterImg, A.over);
          if (old) { const a = anim(afterImg, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' }); if (a) a.onfinish = () => old.remove(); else old.remove(); }
        } else { afterImg = null; if (old) old.remove(); }
        cur.after = n.after;
      }
      if ('outline' in n) {
        outline.replaceChildren(...(n.outline || []).map(c => svg('polygon', { points: c.points.map(q => (q[0] * 1000).toFixed(1) + ',' + (q[1] * 1000).toFixed(1)).join(' ') })));
        labels.replaceChildren(...(n.outline || []).filter(c => c.label).map(c => { const pts = c.points, cx = pts.reduce((s, q) => s + q[0], 0) / pts.length, y0 = Math.min(...pts.map(q => q[1])); return h('span', { class: 'tm-ba-label', text: c.label, style: { left: (cx * 100) + '%', top: (y0 * 100) + '%' } }); }));
      }
      if ('regions' in n) regions.replaceChildren(...(n.regions || []).map(regionNode));
      if (n.tags) { tagB.textContent = n.tags.before; tagA.textContent = n.tags.after; }
      if (n.view) { o.view = n.view; layout(); }
    }
    update({ after: o.after || '', align: o.align, outline: o.outline || [], regions: o.regions || [], tags: o.tags || { before: 'Before · inspection photograph', after: 'After · proposed, illustrative' } });
    set(o.position == null ? .5 : o.position, true);
    return { el, set, get: () => p, update, handle };
  }

  /**
   * The before / after for a correction that has a generated "after" image. This is the Technology tab's own
   * component (FireGeo.beforeAfter: same divider, same registered image, same contour of what changes). A tall
   * photograph is shown through a window on the part that changes, so the change is large enough to read in a card.
   * `sol` is a TeamData solution. If the shared component did not load, this tab's divider shows the same data.
   */
  function correctionView(el, sol, o) {
    const FG = window.FireGeo, opt = o || {}, tall = sol.aspect < 1, frame = tall ? (opt.frame || 4 / 3) : sol.aspect;
    const ys = (sol.outline || []).reduce((a, c) => a.concat(c.points.map(q => q[1])), []), cy = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : .5;
    const win = sol.aspect / frame, top = Math.max(0, Math.min(1 - win, cy - win / 2));   // the window, as a share of the photograph's height
    el.classList.add('tm-crop'); el.style.aspectRatio = String(frame);
    const fsol = FG && FG.beforeAfter && FG.solutions && FG.solutions.get ? FG.solutions.get(sol.photo, sol.id) : null;
    if (fsol && fsol.after) {
      const host = h('div', { class: 'tm-crop-host' }); el.append(host);
      host.style.top = (-top / win * 100) + '%';
      host.style.setProperty('--tm-wt', (top * 100) + '%'); host.style.setProperty('--tm-wb', ((top + win) * 100) + '%');
      // the shared component keeps its own "Show what changed" switch (off by default); team.css places it inside the window
      const ba = FG.beforeAfter(host, { solution: fsol, base: window.TeamData.ROOT, position: opt.position == null ? .5 : opt.position, caption: false });
      return { el, shared: true, set: ba.set, get: ba.get, handle: host.querySelector('[role=slider]'), tools: host.querySelector('.ba-tools') };      // tools: the "Show what changed" switch, to be placed under the window by the caller
    }
    const inner = h('div', { class: 'tm-crop-own' }); el.append(inner);
    const mine = beforeAfter(inner, { before: sol.before, after: sol.after, aspect: sol.aspect, frame, view: { focus: [50, (top + win / 2) * 100] }, align: sol.align, outline: sol.outline, position: opt.position });
    return { el, shared: false, set: mine.set, get: mine.get, handle: mine.handle };
  }

  // ---------------------------------------------------------------- mark-up: drag on the photograph
  function markup(el, o) {
    el.classList.add('tm-markup'); el.style.aspectRatio = String(o.frame);
    const box = photoBox(o.photo, o.aspect, 'tm-ba-layer'), layer = h('div', { class: 'tm-ba-regions' }), ghost = h('div', { class: 'tm-hatch drawing' });
    box.over.append(layer); el.append(box.el); box.pct(o.frame, o.view);
    let regions = (o.regions || []).slice(), treat = o.treat || 'remove', start = null;
    const draw = () => layer.replaceChildren(...regions.map(regionNode));
    const pt = e => { const r = box.plate.getBoundingClientRect(); return [Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100))]; };
    const rect = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])];
    const show = b => Object.assign(ghost.style, { left: b[0] + '%', top: b[1] + '%', width: b[2] + '%', height: b[3] + '%' });
    el.addEventListener('pointerdown', e => { if (e.button > 0) return; el.setPointerCapture(e.pointerId); start = pt(e); ghost.dataset.treat = treat; show(rect(start, start)); box.over.append(ghost); e.preventDefault(); });
    el.addEventListener('pointermove', e => { if (start) show(rect(start, pt(e))); });           // direct: the box follows the hand
    const end = e => {
      if (!start) return; const b = rect(start, pt(e)); start = null; ghost.remove();
      if (b[2] >= 3 && b[3] >= 2) { regions.push({ box: b.map(v => +v.toFixed(1)), treat }); draw(); if (o.onChange) o.onChange(regions.slice()); }
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { start = null; ghost.remove(); });
    draw();
    return {
      el, regions: () => regions.slice(), setTreat(t) { treat = t; },
      /** keyboard and test path: add a region given in per cent of the photograph */
      add(b, t) { regions.push({ box: b, treat: t || treat }); draw(); if (o.onChange) o.onChange(regions.slice()); },
      undo() { regions.pop(); draw(); if (o.onChange) o.onChange(regions.slice()); },
      clear() { regions = []; draw(); if (o.onChange) o.onChange([]); },
    };
  }

  // ---------------------------------------------------------------- drawings
  // One simple sprinkler, drawn the same way everywhere, with its parts named in everyday words where they are
  // used: the metal block at the top, the glass tube in the middle, the metal arms, the flat plate at the bottom.
  function sprinkler(x, y, s, on) {
    const g = svg('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')' });
    const teeth = []; for (let i = 0; i < 18; i++) { const t = i / 18 * Math.PI * 2, c = Math.cos(t), k = Math.sin(t); teeth.push(svg('line', { x1: 60 * c, y1: 178 + 9.5 * k, x2: 68 * c, y2: 178 + 11 * k, class: 'dw-thin' })); }
    g.append(
      svg('ellipse', { cx: 0, cy: 5, rx: 72, ry: 9, class: 'dw-shape' }), svg('ellipse', { cx: 0, cy: 7.5, rx: 46, ry: 5.5, class: 'dw-dark' }),
      svg('rect', { x: -28, y: 10, width: 56, height: 38, rx: 6, class: 'dw-shape' + (on === 'block' ? ' is-on' : '') }),
      svg('path', { d: 'M-20 48C-52 72 -50 136 -12 160M20 48C52 72 50 136 12 160', class: 'dw-arm' }),
      svg('rect', { x: -7, y: 50, width: 14, height: 112, rx: 7, class: 'dw-shape' }),
      svg('rect', { x: -13, y: 160, width: 26, height: 10, rx: 3, class: 'dw-shape' }),
      svg('g', null, teeth), svg('ellipse', { cx: 0, cy: 178, rx: 60, ry: 9.5, class: 'dw-shape' }));
    return g;
  }
  /**
   * Where the year is: the metal block at the top, lit, with a small example of what a stamped year looks like.
   * Once a year is typed the example gives way to an echo of it. The typing itself happens in the entry boxes.
   */
  function block() {
    const root = svg('svg', { class: 'tm-draw', viewBox: '0 0 330 140', role: 'img', 'aria-label': 'Drawing of a ceiling sprinkler. The year is stamped on the metal block at the top.' });
    const stamp = svg('text', { x: 236, y: 61, class: 'dw-stamp is-example', 'text-anchor': 'middle', text: '1998' }), cap = svg('text', { x: 236, y: 22, class: 'dw-note', 'text-anchor': 'middle', text: 'for example' });
    root.append(svg('rect', { x: 10, y: 0, width: 150, height: 10, class: 'dw-ceiling' }), sprinkler(84, 4, .7, 'block'),
      svg('path', { d: 'M106 26L166 50', class: 'dw-lead' }), svg('circle', { cx: 106, cy: 26, r: 3.5, class: 'dw-dot' }),
      svg('rect', { x: 166, y: 30, width: 140, height: 46, rx: 9, class: 'dw-plate' }), stamp, cap,
      svg('text', { x: 236, y: 100, class: 'dw-label is-big', 'text-anchor': 'middle', text: 'on the metal block' }), svg('text', { x: 236, y: 118, class: 'dw-label is-big', 'text-anchor': 'middle', text: 'at the top' }));
    return { el: root, set(s) { const d = String(s.digits || ''); stamp.textContent = d || '1998'; stamp.classList.toggle('is-example', !d); cap.textContent = d ? 'what you typed' : 'for example'; } };
  }
  /** what to measure: from the bushes to the building */
  function gap() {
    const root = svg('svg', { class: 'tm-draw', viewBox: '0 0 330 110', role: 'img', 'aria-label': 'Drawing: the distance to measure is from the bushes to the wall of the building.' });
    root.append(svg('line', { x1: 14, y1: 92, x2: 316, y2: 92, class: 'dw-line' }),
      svg('ellipse', { cx: 48, cy: 48, rx: 26, ry: 34, class: 'dw-plant' }), svg('ellipse', { cx: 82, cy: 54, rx: 22, ry: 28, class: 'dw-plant' }), svg('rect', { x: 20, y: 68, width: 92, height: 24, rx: 10, class: 'dw-hedge' }),
      svg('path', { d: 'M236 92V40h66v52zM228 44l41-34 41 34', class: 'dw-shape' }), svg('rect', { x: 260, y: 62, width: 18, height: 30, class: 'dw-thin dw-nofill' }),
      svg('path', { d: 'M118 80H230M118 80l9-6M118 80l9 6M230 80l-9-6M230 80l-9 6', class: 'dw-measure' }),
      svg('text', { x: 174, y: 68, class: 'dw-label is-big is-on', 'text-anchor': 'middle', text: 'this far' }),
      svg('text', { x: 66, y: 106, class: 'dw-note', 'text-anchor': 'middle', text: 'bushes' }), svg('text', { x: 269, y: 106, class: 'dw-note', 'text-anchor': 'middle', text: 'building' }));
    return { el: root, set() { } };
  }
  /** what a close photo should look like: the sprinkler fills the picture */
  function closeup() {
    const root = svg('svg', { class: 'tm-draw', viewBox: '0 0 200 236', role: 'img', 'aria-label': 'Drawing: the sprinkler fills the picture, edge to edge.' });
    root.append(svg('rect', { x: 6, y: 6, width: 188, height: 224, rx: 18, class: 'dw-frame' }), sprinkler(100, 18, 1.08));
    return { el: root, set() { } };
  }
  /** what the second hedge photo should look like: the bushes and the building in one picture */
  function both() {
    const root = svg('svg', { class: 'tm-draw', viewBox: '0 0 300 190', role: 'img', 'aria-label': 'Drawing: the bushes and the building are both in the picture.' });
    root.append(svg('rect', { x: 6, y: 6, width: 288, height: 178, rx: 18, class: 'dw-frame' }), svg('line', { x1: 22, y1: 152, x2: 278, y2: 152, class: 'dw-line' }),
      svg('ellipse', { cx: 74, cy: 96, rx: 34, ry: 46, class: 'dw-plant' }), svg('ellipse', { cx: 118, cy: 104, rx: 28, ry: 38, class: 'dw-plant' }), svg('rect', { x: 36, y: 122, width: 112, height: 30, rx: 12, class: 'dw-hedge' }),
      svg('path', { d: 'M190 152V86h74v66zM180 90l47-40 47 40', class: 'dw-shape' }), svg('rect', { x: 216, y: 114, width: 22, height: 38, class: 'dw-thin dw-nofill' }),
      svg('text', { x: 92, y: 174, class: 'dw-label', 'text-anchor': 'middle', text: 'bushes' }), svg('text', { x: 227, y: 174, class: 'dw-label', 'text-anchor': 'middle', text: 'building' }));
    return { el: root, set() { } };
  }
  /** where the rating label is: along the hinge edge of the leaf, and a second one on the frame */
  function doorlabel() {
    const root = svg('svg', { class: 'tm-draw', viewBox: '0 0 330 140', role: 'img', 'aria-label': 'Drawing of a door in its frame. The rating label is on the hinge edge of the door, and a second one on the metal it hangs in.' });
    root.append(
      svg('rect', { x: 18, y: 10, width: 104, height: 120, rx: 3, class: 'dw-shape' }),                 // the leaf
      svg('rect', { x: 18, y: 10, width: 9, height: 120, class: 'dw-shape is-on' }),                    // the hinge edge, lit
      svg('rect', { x: 10, y: 10, width: 8, height: 120, rx: 2, class: 'dw-thin dw-nofill' }),          // the frame
      svg('circle', { cx: 108, cy: 74, r: 4.5, class: 'dw-dot' }),                                      // the handle
      svg('path', { d: 'M27 44L166 52', class: 'dw-lead' }), svg('circle', { cx: 27, cy: 44, r: 3.5, class: 'dw-dot' }),
      svg('rect', { x: 166, y: 32, width: 140, height: 44, rx: 9, class: 'dw-plate' }),
      svg('text', { x: 236, y: 62, class: 'dw-stamp', 'text-anchor': 'middle', text: '90 MIN' }),
      svg('text', { x: 236, y: 24, class: 'dw-note', 'text-anchor': 'middle', text: 'for example' }),
      svg('text', { x: 236, y: 102, class: 'dw-label is-big', 'text-anchor': 'middle', text: 'on the hinge edge' }),
      svg('text', { x: 236, y: 120, class: 'dw-label is-big', 'text-anchor': 'middle', text: 'and on the metal' }));
    return { el: root, set() { } };
  }
  /** what the close photo of the label should look like: the label fills the picture */
  function doorshot() {
    const root = svg('svg', { class: 'tm-draw', viewBox: '0 0 200 236', role: 'img', 'aria-label': 'Drawing: the rating label fills the picture, edge to edge.' });
    root.append(svg('rect', { x: 6, y: 6, width: 188, height: 224, rx: 18, class: 'dw-frame' }),
      svg('rect', { x: 34, y: 74, width: 132, height: 88, rx: 8, class: 'dw-plate' }),
      svg('text', { x: 100, y: 112, class: 'dw-stamp', 'text-anchor': 'middle', text: '90 MIN' }),
      svg('text', { x: 100, y: 140, class: 'dw-note', 'text-anchor': 'middle', text: 'fire door' }));
    return { el: root, set() { } };
  }
  const DRAW = { block, gap, closeup, both, doorlabel, doorshot };
  const drawing = name => (DRAW[name] || closeup)();

  return { fit, photoBox, mark, beforeAfter, correctionView, markup, drawing, TREAT };
})();
