// node tools/register.js [job id ...]
//
// For each correction: (1) work out how the generated "after" image has to be scaled and shifted so that it sits
// exactly on the inspection photograph (the generator returns a slightly different size and crop), and
// (2) difference the two registered images to find what the correction changes, and trace that region as a
// clean closed contour. Writes data/outlines.js and debug pictures into tools/work/ (look at them: the contour
// has to sit on the real change). Nothing here runs in the browser.
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./imglib');
const ROOT = path.join(__dirname, '..'), WORK = path.join(__dirname, 'work'), GEN = path.join(ROOT, 'src-monday', 'monday', 'assets', 'generated');
fs.mkdirSync(WORK, { recursive: true });

// roi: where a change may count, in 0..1 of the photograph [x0, y0, x1, y1]. It only trims generator noise far
// from the correction (sky, road); the contour itself always comes from the measured difference.
// labels: text is from the correction's own description in the example, shortened. labelAt is hand-placed in clear
// space after looking at tools/work/<id>-outline.png; the leader runs to the nearest point of the contour.
const JOBS = [
  { id: 'ladder-a', before: 'assets/ladderfuel.jpg', after: 'ladder-a-remove-hedge.png', W: 410, blurR: 5, thresh: 46, maskR: 5, openR: 4, minArea: 0.012, keep: 1,
    roi: [0, 0.50, 0.80, 0.76], labels: [{ text: 'lower tier removed', labelAt: [0.745, 0.765] }] },
  { id: 'ladder-b', before: 'assets/ladderfuel.jpg', after: 'ladder-b-prune-separation.png', W: 410, blurR: 5, thresh: 25, maskR: 7, openR: 5, minArea: 0.010, keep: 1,
    roi: [0, 0.445, 0.72, 0.615], labels: [{ text: 'tiers separated', labelAt: [0.745, 0.765] }] },
  { id: 'ladder-c', before: 'assets/ladderfuel.jpg', after: 'ladder-c-low-fuel-redesign.png', W: 410, blurR: 5, thresh: 44, maskR: 6, openR: 9, minArea: 0.012, keep: 1,
    roi: [0, 0.50, 0.80, 0.90], labels: [{ text: 'low-fuel planting', labelAt: [0.745, 0.80] }] },
  // The sprinkler photograph was replaced by a wider, sharper one of the same sprinkler (tools/sprinkler-swap.js). Its
  // "after" is that photograph with only the replaced head put in, so it is read from assets/after/, not from the generator.
  { id: 'sprinkler-a', before: 'assets/sprinkler.png', after: 'sprinkler-a-replacement.png', afterFile: 'assets/after/sprinkler-a-replacement.jpg', W: 428, blurR: 3, thresh: 40, maskR: 3, openR: 0, minArea: 0.004, keep: 1,
    roi: [0.30, 0.40, 0.72, 0.67], labels: [{ text: 'new unpainted head', labelAt: [0.70, 0.70] }] },
];

// ---------------------------------------------------------------- registration
function matchPatches(gb, ga, W, H, opt) {
  const { step, half, search, minVar } = opt, out = [];
  for (let cy = half + search; cy < H - half - search; cy += step) for (let cx = half + search; cx < W - half - search; cx += step) {
    let mb = 0, n = 0; for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) { mb += gb[(cy + y) * W + cx + x]; n++; } mb /= n;
    let vb = 0; for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) { const d = gb[(cy + y) * W + cx + x] - mb; vb += d * d; }
    if (vb / n < minVar) continue;                                  // flat patch: nothing to lock onto
    let best = -2, bx = 0, by = 0, second = -2;
    for (let dy = -search; dy <= search; dy++) for (let dx = -search; dx <= search; dx++) {
      let ma = 0; for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) ma += ga[(cy + dy + y) * W + cx + dx + x]; ma /= n;
      let va = 0, cov = 0; for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) { const a = ga[(cy + dy + y) * W + cx + dx + x] - ma, b = gb[(cy + y) * W + cx + x] - mb; va += a * a; cov += a * b; }
      const s = cov / Math.sqrt(va * vb + 1e-6);
      if (s > best) { if (Math.abs(dx - bx) > 2 || Math.abs(dy - by) > 2) second = best; best = s; bx = dx; by = dy; } else if (s > second && (Math.abs(dx - bx) > 2 || Math.abs(dy - by) > 2)) second = s;
    }
    if (best > 0.82 && best - second > 0.06 && Math.abs(bx) < search && Math.abs(by) < search) out.push({ x: cx, y: cy, dx: bx, dy: by, s: best });
  }
  return out;
}
const median = a => { const s = Float64Array.from(a).sort(); return s.length ? s[s.length >> 1] : 0; };
function fitAxis(pos, to) {                                         // to = a * pos + b, robustly
  let a = 1, b = median(to.map((t, i) => t - pos[i])), inl = pos.map(() => true), tol = 3;
  for (let it = 0; it < 8; it++) {
    inl = pos.map((p, i) => Math.abs(a * p + b - to[i]) <= tol);
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; pos.forEach((p, i) => { if (!inl[i]) return; n++; sx += p; sy += to[i]; sxx += p * p; sxy += p * to[i]; });
    if (n < 6) break; const den = n * sxx - sx * sx; if (Math.abs(den) < 1e-6) break;
    a = (n * sxy - sx * sy) / den; b = (sy - a * sx) / n; tol = Math.max(1.0, tol * 0.75);
  }
  const res = pos.map((p, i) => a * p + b - to[i]).filter((_, i) => inl[i]);
  return { a, b, inliers: res.length, rms: Math.sqrt(res.reduce((s, r) => s + r * r, 0) / Math.max(1, res.length)) };
}

// ---------------------------------------------------------------- region → contour
function components(mask, W, H) {
  const lab = new Int32Array(W * H), sizes = [0]; let n = 0; const stack = [];
  for (let i = 0; i < W * H; i++) { if (!mask[i] || lab[i]) continue; n++; let size = 0; lab[i] = n; stack.push(i);
    while (stack.length) { const k = stack.pop(), x = k % W, y = (k / W) | 0; size++;
      if (x > 0 && mask[k - 1] && !lab[k - 1]) { lab[k - 1] = n; stack.push(k - 1); } if (x < W - 1 && mask[k + 1] && !lab[k + 1]) { lab[k + 1] = n; stack.push(k + 1); }
      if (y > 0 && mask[k - W] && !lab[k - W]) { lab[k - W] = n; stack.push(k - W); } if (y < H - 1 && mask[k + W] && !lab[k + W]) { lab[k + W] = n; stack.push(k + W); } }
    sizes.push(size); }
  return { lab, sizes };
}
function outerLoop(lab, id, W, H) {                                 // follow the pixel edges round one component
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H && lab[y * W + x] === id, next = new Map();
  const add = (x0, y0, x1, y1) => { const k = x0 + ',' + y0; if (!next.has(k)) next.set(k, []); next.get(k).push([x1, y1]); };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { if (!inside(x, y)) continue;
    if (!inside(x, y - 1)) add(x, y, x + 1, y); if (!inside(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!inside(x, y + 1)) add(x + 1, y + 1, x, y + 1); if (!inside(x - 1, y)) add(x, y + 1, x, y); }
  let best = null, bestArea = 0;
  for (const [k0] of next) { while (next.get(k0) && next.get(k0).length) {
    const loop = []; let k = k0;
    for (;;) { const list = next.get(k); if (!list || !list.length) break; const p = list.pop(); loop.push(p); k = p[0] + ',' + p[1]; if (k === k0) break; }
    let a = 0; for (let i = 0, j = loop.length - 1; i < loop.length; j = i++) a += loop[j][0] * loop[i][1] - loop[i][0] * loop[j][1];
    if (Math.abs(a) > bestArea) { bestArea = Math.abs(a); best = loop; } } }
  return best;
}
function simplify(pts, tol) {                                       // Douglas-Peucker on a closed loop
  const n = pts.length; if (n < 8) return pts;
  let far = 0, fd = 0; for (let i = 1; i < n; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > fd) { fd = d; far = i; } }
  const dp = seg => { const keep = new Uint8Array(seg.length); keep[0] = keep[seg.length - 1] = 1; const st = [[0, seg.length - 1]];
    while (st.length) { const [a, b] = st.pop(); let w = 0, at = -1; const dx = seg[b][0] - seg[a][0], dy = seg[b][1] - seg[a][1], len = Math.hypot(dx, dy) || 1e-9;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((seg[i][0] - seg[a][0]) * dy - (seg[i][1] - seg[a][1]) * dx) / len; if (d > w) { w = d; at = i; } }
      if (w > tol && at > 0) { keep[at] = 1; st.push([a, at], [at, b]); } }
    return seg.filter((_, i) => keep[i]); };
  const a = dp(pts.slice(0, far + 1)), b = dp(pts.slice(far).concat([pts[0]]));
  return a.concat(b.slice(1, -1));
}
const chaikin = pts => { const out = []; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; out.push([p[0] * 0.75 + q[0] * 0.25, p[1] * 0.75 + q[1] * 0.25], [p[0] * 0.25 + q[0] * 0.75, p[1] * 0.25 + q[1] * 0.75]); } return out; };

// ---------------------------------------------------------------- one job
function run(job) {
  const before = L.load(path.join(ROOT, job.before), WORK), after = L.load(job.afterFile ? path.join(ROOT, job.afterFile) : path.join(GEN, job.after), WORK);
  const W = job.W, H = Math.round(W * before.h / before.w);
  const pb = L.sample(before, W, H), pa0 = L.sample(after, W, H);
  const m = matchPatches(L.grey(pb), L.grey(pa0), W, H, { step: Math.round(W / 26), half: Math.max(6, Math.round(W / 55)), search: Math.round(W * 0.045), minVar: 60 });
  const fx = fitAxis(m.map(p => p.x), m.map(p => p.x + p.dx)), fy = fitAxis(m.map(p => p.y), m.map(p => p.y + p.dy));
  const map = { ax: fx.a, bx: fx.b / W, ay: fy.a, by: fy.b / H };
  const pa = L.sample(after, W, H, map);
  // global tone offset between the two pictures, so a slightly warmer render does not read as a change everywhere
  const off = [0, 1, 2].map(c => { const d = []; for (let i = 0; i < W * H; i += 7) if (pa.cover[i]) d.push(pa.rgb[i * 3 + c] - pb.rgb[i * 3 + c]); return median(d); });
  const bb = L.blur(pb.rgb, W, H, 3, job.blurR), ba = L.blur(pa.rgb, W, H, 3, job.blurR);
  const diff = new Float32Array(W * H), mask = new Float32Array(W * H), [x0, y0, x1, y1] = job.roi;
  for (let i = 0; i < W * H; i++) { const dr = ba[i * 3] - bb[i * 3] - off[0], dg = ba[i * 3 + 1] - bb[i * 3 + 1] - off[1], db = ba[i * 3 + 2] - bb[i * 3 + 2] - off[2]; diff[i] = Math.sqrt(dr * dr + dg * dg + db * db);
    const u = (i % W + 0.5) / W, v = (((i / W) | 0) + 0.5) / H; mask[i] = pa.cover[i] && diff[i] > job.thresh && u >= x0 && u <= x1 && v >= y0 && v <= y1 ? 1 : 0; }
  // close narrow slits (grow, then shrink back) so a shadow line that happens to match does not split the region
  const grown = L.blur(mask, W, H, 1, job.maskR, 2); for (let i = 0; i < W * H; i++) grown[i] = grown[i] > 0.22 ? 1 : 0;
  const soft = L.blur(grown, W, H, 1, job.maskR, 2), bin = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) bin[i] = soft[i] > 0.72 ? 1 : 0;
  if (job.openR) {                                                  // drop thin tails narrower than about openR (shrink, then grow back)
    const thin = L.blur(Float32Array.from(bin), W, H, 1, job.openR, 2); for (let i = 0; i < W * H; i++) thin[i] = thin[i] > 0.74 ? 1 : 0;
    const back = L.blur(thin, W, H, 1, job.openR, 2); for (let i = 0; i < W * H; i++) bin[i] = back[i] > 0.26 ? 1 : 0;
  }
  const { lab, sizes } = components(bin, W, H);
  const order = sizes.map((s, i) => [s, i]).slice(1).sort((a, b) => b[0] - a[0]).filter(([s]) => s / (W * H) >= job.minArea).slice(0, job.keep);
  const contours = order.map(([size, id], k) => {
    let loop = outerLoop(lab, id, W, H); loop = simplify(loop, 1.6); loop = chaikin(chaikin(loop)); loop = simplify(loop, 0.45);
    const points = loop.map(([x, y]) => [+(x / W).toFixed(4), +(y / H).toFixed(4)]), lb = job.labels[k] || job.labels[0];
    let anchor = points[0], ad = 9; for (const p of points) { const d = Math.hypot((p[0] - lb.labelAt[0]) * (W / H), p[1] - lb.labelAt[1]); if (d < ad) { ad = d; anchor = p; } }
    return { label: lb.text, labelAt: lb.labelAt, anchor, areaShare: +(size / (W * H)).toFixed(4), points };
  });
  // ---- debug pictures
  const o = L.toImage(pb); for (const c of contours) { L.drawPolyline(o, c.points.map(([x, y]) => [x * W, y * H]), [255, 40, 200], true, 1); L.drawPolyline(o, [[c.anchor[0] * W, c.anchor[1] * H], [c.labelAt[0] * W, c.labelAt[1] * H]], [70, 103, 245], false, 0); }
  L.save(path.join(WORK, job.id + '-outline.png'), o);
  const oa = L.toImage(pa); for (const c of contours) L.drawPolyline(oa, c.points.map(([x, y]) => [x * W, y * H]), [255, 40, 200], true, 1);
  L.save(path.join(WORK, job.id + '-outline-after.png'), oa);
  const split = L.toImage(pb), bands = 6; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x / (W / bands)) | 0) % 2) { const k = (y * W + x) * 4; split.data[k] = pa.rgb[(y * W + x) * 3]; split.data[k + 1] = pa.rgb[(y * W + x) * 3 + 1]; split.data[k + 2] = pa.rgb[(y * W + x) * 3 + 2]; }
  L.save(path.join(WORK, job.id + '-split.png'), split);
  const heat = { w: W, h: H, data: new Uint8Array(W * H * 4) }; for (let i = 0; i < W * H; i++) { const v = Math.min(255, diff[i] * 2.2); heat.data[i * 4] = v; heat.data[i * 4 + 1] = bin[i] ? 200 : v * 0.4; heat.data[i * 4 + 2] = v * 0.4; heat.data[i * 4 + 3] = 255; }
  L.save(path.join(WORK, job.id + '-diff.png'), heat);
  const align = { sx: +(1 / map.ax).toFixed(5), sy: +(1 / map.ay).toFixed(5), dx: +(-map.bx / map.ax).toFixed(5), dy: +(-map.by / map.ay).toFixed(5) };
  console.log(job.id.padEnd(12), 'matches', String(m.length).padStart(4), '| x: scale', fx.a.toFixed(4), 'shift', fx.b.toFixed(2) + 'px', 'inl', fx.inliers, 'rms', fx.rms.toFixed(2), '| y: scale', fy.a.toFixed(4), 'shift', fy.b.toFixed(2) + 'px', 'inl', fy.inliers, 'rms', fy.rms.toFixed(2), '| tone', off.map(v => v.toFixed(0)).join(','), '| regions', contours.map(c => c.areaShare + ' (' + c.points.length + ' pts)').join(' '));
  return { align, fit: { size: [W, H], matches: m.length, inliersX: fx.inliers, inliersY: fy.inliers, rmsPx: +Math.max(fx.rms, fy.rms).toFixed(2) }, beforeSize: [before.w, before.h], afterSize: [after.w, after.h], contours };
}

const only = process.argv.slice(2), outFile = path.join(ROOT, 'data', 'outlines.js');
let all = {}; if (only.length && fs.existsSync(outFile)) { const w = {}; new Function('window', fs.readFileSync(outFile, 'utf8'))(w); all = w.FIREGEO_OUTLINES || {}; }
for (const job of JOBS) if (!only.length || only.includes(job.id)) all[job.id] = run(job);
fs.writeFileSync(outFile, '// Generated by tools/register.js: how each "after" image registers on the inspection photograph, and the contour of\n// what the correction changes (found by differencing the registered pair). x and y are 0..1 of the photograph. Do not edit by hand.\nwindow.FIREGEO_OUTLINES = ' + JSON.stringify(all) + ';\n');
console.log('wrote', path.relative(ROOT, outFile), fs.statSync(outFile).size, 'bytes');
