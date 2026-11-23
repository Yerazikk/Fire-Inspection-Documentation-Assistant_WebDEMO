// FireGeo.solutions: the corrections for each photograph, ready for the before / after stage. No DOM.
// Words come from data/content.js (the inspector's analyses). Image alignment and the contour of what changes
// come from data/outlines.js, which tools/register.js measures offline.
(function (root) {

// The measured contour is exact but busy. Andrew asked for a simpler shape (2026-11-22): draw the convex hull of the
// measured region, reduced to a few evenly spaced points, which the component rounds into one calm closed curve.
function simpleShape(pts) {
  if (!pts || pts.length < 4) return pts || [];
  const p = pts.map(q => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  const hull = lo.slice(0, -1).concat(up.slice(0, -1));
  // walk the hull and keep N points at equal distances along it
  const N = 10, seg = hull.map((q, i) => { const r = hull[(i + 1) % hull.length]; return Math.hypot(r[0] - q[0], r[1] - q[1]); }), total = seg.reduce((a, b) => a + b, 0), out = [];
  for (let k = 0; k < N; k++) { let d = total * k / N, i = 0; while (d > seg[i]) { d -= seg[i]; i++; } const q = hull[i], r = hull[(i + 1) % hull.length], t = seg[i] ? d / seg[i] : 0; out.push([q[0] + (r[0] - q[0]) * t, q[1] + (r[1] - q[1]) * t]); }
  return roomy(out);
}
// Give the shape some room so it frames the whole thing that changed, not just its tightest edge: pad every shape a little,
// and grow small ones (the sprinkler) until they span at least 42% of the picture width. Clamped to the picture.
function roomy(pts) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const w = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0])), h = Math.max(...pts.map(p => p[1])) - Math.min(...pts.map(p => p[1]));
  const k = Math.max(1.12, Math.min(2.4, 0.42 / Math.max(w, 1e-6), 0.5 / Math.max(h, 1e-6)) > 1.12 && w < 0.42 ? Math.min(2.4, 0.42 / w) : 1.12);
  const c = v => Math.max(0.015, Math.min(0.985, v));
  return pts.map(p => [c(cx + (p[0] - cx) * k), c(cy + (p[1] - cy) * k)]);
}
// The drawn curve passes through the MIDPOINTS between consecutive points (see contourPath in beforeafter.js), not the points
// themselves, so the leader must start from one of those midpoints to touch the line.
function nearest(points, to) { if (!points.length) return to; const mids = points.map((q, i) => { const r = points[(i + 1) % points.length]; return [(q[0] + r[0]) / 2, (q[1] + r[1]) / 2]; }); if (!to) return mids[0]; let best = mids[0], bd = Infinity; for (const q of mids) { const d = Math.hypot(q[0] - to[0], q[1] - to[1]); if (d < bd) { bd = d; best = q; } } return best; }
'use strict';
const C = root.CONTENT || {}, O = root.FIREGEO_OUTLINES || {};
const AFTER = { 'assets/generated/ladder-a-remove-hedge.png': 'assets/after/ladder-a-remove-hedge.jpg', 'assets/generated/ladder-b-prune-separation.png': 'assets/after/ladder-b-prune-separation.jpg', 'assets/generated/ladder-c-low-fuel-redesign.png': 'assets/after/ladder-c-low-fuel-redesign.jpg', 'assets/generated/sprinkler-a-replacement.png': 'assets/after/sprinkler-a-replacement.jpg' };
const plain = s => String(s || '').replace(/\s+—\s+/g, ' · ').replace(/—/g, ' · ');     // no em dashes on screen

function build(photo) {
  const ex = C[photo]; if (!ex) return [];
  return (ex.solutions || []).map(sn => {
    const m = O[photo + '-' + sn.id] || {};
    return {
      id: sn.id, photo, title: sn.title, plain: sn.plain || '', lede: plain(sn.lede),
      standing: sn.badge === 'required' ? 'required' : 'alternative',
      standingText: plain(sn.badgeText),
      limit: sn.limit || null, imageNote: sn.imageNote || null,
      before: ex.photo, after: AFTER[sn.image] || sn.image,
      aspect: ex.aspect,
      align: m.align || { sx: 1, sy: 1, dx: 0, dy: 0 },
      outline: (m.contours || []).map(c => { const points = simpleShape(c.points); return { points, label: c.label, labelAt: c.labelAt, anchor: nearest(points, c.labelAt || c.anchor) }; }),
    };
  });
}
const cache = {};
const list = photo => cache[photo] || (cache[photo] = build(photo));
const get = (photo, id) => list(photo).find(s => s.id === id) || null;

root.FireGeo = root.FireGeo || {};
root.FireGeo.solutions = { list, get };
})(typeof window !== 'undefined' ? window : globalThis);
