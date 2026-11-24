// Finds what changed between a photograph and each of its "after" pictures, and writes the contours that
// "Show what changed" draws. Written for the daisy chain; the fire door is drawn the same way, so it takes the
// scene as its first argument.
//
//   node tools/daisy-outline.js                     the daisy chain  > data/outlines-daisy.json
//   node tools/daisy-outline.js firedoor            the fire door
//   node tools/daisy-outline.js firedoor --write    merges the result into data/outlines.js
//
// tools/register.js cannot be used here. It fits an "after" image onto the photograph by matching a few hundred
// small patches between them, and that needs most of the frame to be unchanged. These pictures are redrawn whole
// by the model from the same frame, so the two agree in composition but not pixel for pixel, and there is no
// sub-pixel transform to recover: the alignment is the identity by construction.
//
// So the contour is found the direct way. Both pictures are drawn into a canvas at a small working size, the
// per-pixel difference is blurred (which throws away the model's per-pixel noise and keeps whole objects that have
// appeared or gone), thresholded, and the largest connected blob is taken. Its convex hull, simplified, is the
// outline. A hull rather than the true boundary on purpose: the page draws a smooth closed curve through the
// midpoints of the points it is given (lib/beforeafter.js contourPath), so a ragged boundary buys nothing.
const fs = require('fs'), path = require('path');

const GEO = path.join(__dirname, '..');
const PLAYWRIGHT = path.join(GEO, '..', 'node_modules', 'playwright');
const WRITE = process.argv.includes('--write');
const W = 224;                              // working width; the blur radius below is in these pixels

// Two of the three are marked by hand, because the thing worth circling is not the biggest thing that changed.
// In correction A the plug also leaves the grey strip in the middle of the frame, and in C both strips vanish from
// the floor; a difference finds those, and they are not the point. What the inspector and the owner need to see is
// WHERE THE POWER NOW COMES FROM: the free socket of the receptacle that was always there, and the new receptacle.
//
// `ellipse` is in fractions of the frame and is the shape BEFORE lib/solutions.js simpleShape() opens it out. That
// function enlarges any shape narrower than 0.42 by up to 2.4x about its centre, so the radii here are the ones
// wanted on screen divided by 2.4. `reveal` is where the before/after divider has to sit for the circle to be on
// the after side at all: the outline is drawn inside the clip, so a mark near the left edge is invisible until the
// divider moves there. Measured off the pictures by cropping them, like the annotation boxes in content.js.
const MANUAL = {
  'daisy-a': { ellipse: { cx: 0.105, cy: 0.0875, rx: 0.025, ry: 0.026 }, labelAt: [0.30, 0.175], reveal: 0.02,
               note: 'the free socket of the receptacle that was already there' },
  'daisy-c': { ellipse: { cx: 0.895, cy: 0.1125, rx: 0.027, ry: 0.023 }, labelAt: [0.66, 0.225],
               note: 'the receptacle the electrician added' },
};
const ring = (e, n) => Array.from({ length: n }, (_, i) => {
  const t = i / n * Math.PI * 2;
  return [+(e.cx + e.rx * Math.cos(t)).toFixed(4), +(e.cy + e.ry * Math.sin(t)).toFixed(4)];
});

const SCENES = {
  daisy: {
    before: 'assets/daisychain.jpg',
    jobs: [
      { key: 'daisy-a', after: 'assets/after/daisy-a-direct.jpg',      label: 'same outlet' },
      { key: 'daisy-b', after: 'assets/after/daisy-b-one-tap.jpg',     label: 'one strip' },
      { key: 'daisy-c', after: 'assets/after/daisy-c-receptacles.jpg', label: 'new outlet' },
    ],
  },
  // The fire door. Both pictures close the door, so the difference is the whole leaf and not only the wedge;
  // that is the right thing to circle here, because the door being shut IS the correction.
  firedoor: {
    before: 'assets/firedoor.png',
    jobs: [
      { key: 'firedoor-a', after: 'assets/after/firedoor-a-closed.jpg', label: 'the door, shut' },
      { key: 'firedoor-b', after: 'assets/after/firedoor-b-sign.jpg',   label: 'shut, and a sign on it' },
    ],
  },
};
const SCENE = SCENES[process.argv[2]] ? process.argv[2] : 'daisy';
const JOBS = SCENES[SCENE].jobs;
const BEFORE = SCENES[SCENE].before;

const dataUrl = rel => {
  const b = fs.readFileSync(path.join(GEO, rel));
  const mime = /\.jpe?g$/i.test(rel) ? 'image/jpeg' : 'image/png';
  return 'data:' + mime + ';base64,' + b.toString('base64');
};

// Everything below runs in the page: it needs a real image decoder and a canvas, and the repo has no image library.
function findContour([beforeUrl, afterUrl, W]) {
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  return Promise.all([load(beforeUrl), load(afterUrl)]).then(([A, B]) => {
    const H = Math.round(W * A.naturalHeight / A.naturalWidth);
    const grab = img => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
    const a = grab(A), b = grab(B);

    // luminance difference
    const diff = new Float32Array(W * H);
    for (let i = 0, p = 0; i < diff.length; i++, p += 4) {
      const la = 0.299 * a[p] + 0.587 * a[p + 1] + 0.114 * a[p + 2];
      const lb = 0.299 * b[p] + 0.587 * b[p + 1] + 0.114 * b[p + 2];
      diff[i] = Math.abs(la - lb);
    }
    // separable box blur, twice: the model's noise is per-pixel, a removed object is not
    const blur = (src, r) => {
      const tmp = new Float32Array(W * H), out = new Float32Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W) { s += src[y * W + xx]; n++; } }
        tmp[y * W + x] = s / n;
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, n = 0;
        for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H) { s += tmp[yy * W + x]; n++; } }
        out[y * W + x] = s / n;
      }
      return out;
    };
    const sm = blur(blur(diff, 3), 3);

    // threshold at the 88th percentile of the blurred difference, floored so a near-identical pair finds nothing
    const sorted = Float32Array.from(sm).sort();
    const cut = Math.max(10, sorted[Math.floor(sorted.length * 0.88)]);
    const on = new Uint8Array(W * H);
    for (let i = 0; i < sm.length; i++) on[i] = sm[i] >= cut ? 1 : 0;

    // largest connected blob, 4-neighbour flood
    const seen = new Int32Array(W * H).fill(-1);
    let best = [], id = 0;
    for (let i = 0; i < on.length; i++) {
      if (!on[i] || seen[i] >= 0) continue;
      const stack = [i], blob = []; seen[i] = id;
      while (stack.length) {
        const p = stack.pop(); blob.push(p);
        const x = p % W, y = (p / W) | 0;
        if (x > 0 && on[p - 1] && seen[p - 1] < 0) { seen[p - 1] = id; stack.push(p - 1); }
        if (x < W - 1 && on[p + 1] && seen[p + 1] < 0) { seen[p + 1] = id; stack.push(p + 1); }
        if (y > 0 && on[p - W] && seen[p - W] < 0) { seen[p - W] = id; stack.push(p - W); }
        if (y < H - 1 && on[p + W] && seen[p + W] < 0) { seen[p + W] = id; stack.push(p + W); }
      }
      if (blob.length > best.length) best = blob;
      id++;
    }
    if (best.length < W * H * 0.004) return { error: 'the two pictures barely differ: blob ' + best.length + ' px' };

    // convex hull (monotone chain) of the blob, then keep at most 14 points by dropping the shallowest corners
    const pts = best.map(p => [p % W, (p / W) | 0]).sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
    const half = src => { const h = []; for (const p of src) { while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop(); h.push(p); } h.pop(); return h; };
    let hull = half(pts).concat(half(pts.slice().reverse()));
    while (hull.length > 14) {
      let worst = 1, area = Infinity;
      for (let i = 0; i < hull.length; i++) {
        const A2 = Math.abs(cross(hull[(i - 1 + hull.length) % hull.length], hull[i], hull[(i + 1) % hull.length]));
        if (A2 < area) { area = A2; worst = i; }
      }
      hull.splice(worst, 1);
    }
    const cx = hull.reduce((s, p) => s + p[0], 0) / hull.length, cy = hull.reduce((s, p) => s + p[1], 0) / hull.length;
    return {
      points: hull.map(p => [+(p[0] / W).toFixed(4), +(p[1] / H).toFixed(4)]),
      centre: [+(cx / W).toFixed(4), +(cy / H).toFixed(4)],
      share: +(best.length / (W * H)).toFixed(4),
      size: [W, H],
      beforeSize: [A.naturalWidth, A.naturalHeight], afterSize: [B.naturalWidth, B.naturalHeight],
    };
  });
}

(async () => {
  const { chromium } = require(path.join(GEO, 'tools', 'playwright'))();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = {};
  for (const job of JOBS) {
    const m = MANUAL[job.key];
    const r = await page.evaluate(findContour, [dataUrl(BEFORE), dataUrl(job.after), W]);
    if (r.error && !m) { console.error(job.key + ': ' + r.error); continue; }
    if (m) {
      out[job.key] = {
        align: { sx: 1, sy: 1, dx: 0, dy: 0 },
        fit: { size: r.size || [W, 0], matches: 0, inliersX: 0, inliersY: 0, rmsPx: 0, how: 'marked by hand (tools/daisy-outline.js MANUAL): ' + m.note },
        beforeSize: r.beforeSize, afterSize: r.afterSize,
        reveal: m.reveal != null ? m.reveal : null,
        contours: [{ label: job.label, labelAt: m.labelAt, areaShare: +(Math.PI * m.ellipse.rx * m.ellipse.ry * 5.76).toFixed(4), points: ring(m.ellipse, 12) }],
      };
      console.log(job.key + ': marked by hand, ' + m.note);
      continue;
    }
    // the label sits inside the picture, clear of the shape's own centre
    const [cx, cy] = r.centre;
    // The outline and its label are drawn on the AFTER side only, clipped at the divider, which rests at 42%.
    // A label centred left of about 60% has its first words cut off by that edge, so it is kept to the right of it.
    const labelAt = [Math.min(0.80, Math.max(0.62, cx)), cy < 0.5 ? Math.min(0.88, cy + 0.17) : Math.max(0.12, cy - 0.17)];
    out[job.key] = {
      align: { sx: 1, sy: 1, dx: 0, dy: 0 },
      fit: { size: r.size, matches: 0, inliersX: 0, inliersY: 0, rmsPx: 0, how: 'difference, not registration (tools/daisy-outline.js)' },
      beforeSize: r.beforeSize, afterSize: r.afterSize,
      contours: [{ label: job.label, labelAt, areaShare: r.share, points: r.points }],
    };
    console.log(job.key + ': ' + r.points.length + ' points, ' + (r.share * 100).toFixed(1) + '% of the frame changed');
  }
  await browser.close();

  const json = JSON.stringify(out, null, 0);
  if (!WRITE) { fs.writeFileSync(path.join(GEO, 'data', 'outlines-daisy.json'), JSON.stringify(out, null, 1)); console.log('\nwrote data/outlines-daisy.json (run with --write to merge into data/outlines.js)'); return; }

  const f = path.join(GEO, 'data', 'outlines.js');
  let s = fs.readFileSync(f, 'utf8');
  const m = s.match(/^(window\.FIREGEO_OUTLINES = )(\{[\s\S]*\});?\s*$/m);
  if (!m) throw new Error('could not find the assignment in data/outlines.js');
  const all = JSON.parse(m[2]);
  Object.assign(all, out);
  s = s.replace(m[0], m[1] + JSON.stringify(all) + ';');
  fs.writeFileSync(f, s);
  console.log('\nmerged into data/outlines.js (' + Object.keys(all).length + ' entries)');
})();
