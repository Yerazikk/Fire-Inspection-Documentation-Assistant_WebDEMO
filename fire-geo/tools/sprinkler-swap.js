// node tools/sprinkler-swap.js [--write]
// Andrew sent a new, wider and sharper photograph of the same painted sprinkler (team-input/sprinkler-new.png).
// This finds the OLD photograph inside the NEW one (one scale and a shift: the old picture is a crop of the same
// shot), reports the fit, moves the annotation boxes of data/content.js onto the new picture, and makes the new
// "after" picture by putting only the replaced head from the existing after picture into the new photograph, under
// a soft mask, with its exposure matched to the photograph around it. Nothing is generated: every pixel is from the
// new photograph or from the existing after picture.  Without --write it only measures and writes previews in
// tools/work/. With --write it installs the files (the old ones are kept as *.old.*).
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const L = require('./imglib.js'), ROOT = path.join(__dirname, '..'), WORK = path.join(__dirname, 'work'), WRITE = process.argv.includes('--write');
const A = f => path.join(ROOT, f);
if (!fs.existsSync(A('assets/sprinkler.old.png'))) fs.copyFileSync(A('assets/sprinkler.png'), A('assets/sprinkler.old.png'));
if (!fs.existsSync(A('assets/after/sprinkler-a-replacement.old.jpg'))) fs.copyFileSync(A('assets/after/sprinkler-a-replacement.jpg'), A('assets/after/sprinkler-a-replacement.old.jpg'));
const oldImg = L.load(A('assets/sprinkler.old.png'), WORK), newImg = L.load(A('team-input/sprinkler-new.png'), WORK), aftImg = L.load(A('assets/after/sprinkler-a-replacement.old.jpg'), WORK);
const OW = oldImg.w, OH = oldImg.h, NW = newImg.w, NH = newImg.h;
const plane = (img, w, h) => L.grey(L.sample(img, w, h));
// zero-mean normalised correlation of the old picture (drawn at w x h) laid on the new one at (x, y); `step` thins the samples
function ncc(Ng, nw, nh, Og, w, h, x, y, step) {
  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let j = 0; j < h; j += step) { const yy = y + j; if (yy < 0 || yy >= nh) return -1; for (let i = 0; i < w; i += step) { const xx = x + i; if (xx < 0 || xx >= nw) return -1; const a = Og[j * w + i], b = Ng[yy * nw + xx]; n++; sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b; } }
  const va = saa - sa * sa / n, vb = sbb - sb * sb / n; return va > 0 && vb > 0 ? (sab - sa * sb / n) / Math.sqrt(va * vb) : -1;
}
// The old picture is wider than the new one is (landscape against portrait), so it cannot lie wholly inside it. What the
// two share is the middle: the search lays the MIDDLE of the old picture (60% of its width, 80% of its height) on the new one.
const F = { x0: 0.2, y0: 0.1, x1: 0.8, y1: 0.9 }, CW = OW * (F.x1 - F.x0), CH = OH * (F.y1 - F.y0), cropMap = { ax: F.x1 - F.x0, bx: F.x0, ay: F.y1 - F.y0, by: F.y0 };
const crop = (w, h) => L.grey(L.sample(oldImg, w, h, cropMap));
// coarse: everything at one third size, every scale from 0.7 to 2.4
const K = 3, nw3 = Math.round(NW / K), nh3 = Math.round(NH / K), N3 = plane(newImg, nw3, nh3); let best = { c: -2 };
for (let s = 0.70; s <= 2.4001; s += 0.025) { const w = Math.round(CW * s / K), h = Math.round(CH * s / K); if (w > nw3 || h > nh3 || w < 12) continue; const O = crop(w, h);
  for (let y = 0; y <= nh3 - h; y++) for (let x = 0; x <= nw3 - w; x++) { const c = ncc(N3, nw3, nh3, O, w, h, x, y, 2); if (c > best.c) best = { c, s, x: x * K, y: y * K }; } }
console.log('coarse: scale', best.s.toFixed(3), 'middle of the old picture at', best.x, best.y, 'correlation', best.c.toFixed(3));
// fine: full size, scale to 0.003, position to the pixel
const Ng = plane(newImg, NW, NH); let fine = { c: -2 };
for (let s = best.s - 0.04; s <= best.s + 0.0401; s += 0.003) { const w = Math.round(CW * s), h = Math.round(CH * s); if (w > NW || h > NH) continue; const O = crop(w, h);
  for (let y = best.y - 5; y <= best.y + 5; y++) for (let x = best.x - 5; x <= best.x + 5; x++) { const c = ncc(Ng, NW, NH, O, w, h, x, y, 1); if (c > fine.c) fine = { c, s: w / CW, sy: h / CH, cx: x, cy: y, cw: w, ch: h }; } }
// residual: grey difference after matching gain and offset, in grey levels (0..255), over the shared middle
{ const O = crop(fine.cw, fine.ch); let n = 0, sa = 0, sb = 0, saa = 0, sab = 0; for (let j = 0; j < fine.ch; j++) for (let i = 0; i < fine.cw; i++) { const a = O[j * fine.cw + i], b = Ng[(fine.cy + j) * NW + fine.cx + i]; n++; sa += a; sb += b; saa += a * a; sab += a * b; }
  const g = (sab - sa * sb / n) / (saa - sa * sa / n), o = (sb - g * sa) / n; let e = 0; for (let j = 0; j < fine.ch; j++) for (let i = 0; i < fine.cw; i++) { const d = g * O[j * fine.cw + i] + o - Ng[(fine.cy + j) * NW + fine.cx + i]; e += d * d; } fine.rms = Math.sqrt(e / n); }
fine.x = Math.round(fine.cx - F.x0 * OW * fine.s); fine.y = Math.round(fine.cy - F.y0 * OH * fine.sy); fine.w = Math.round(OW * fine.s); fine.h = Math.round(OH * fine.sy);
console.log('fit: the old picture covers x ' + fine.x + ' to ' + (fine.x + fine.w) + ', y ' + fine.y + ' to ' + (fine.y + fine.h) + ' of the new one (' + NW + ' x ' + NH + '; it runs past the sides): scale ' + fine.s.toFixed(4) + ' new pixels per old pixel, correlation ' + fine.c.toFixed(4) + ', residual ' + fine.rms.toFixed(2) + ' grey levels rms over the shared middle');
const S = fine.s, SY = fine.sy, TX = fine.x, TY = fine.y;
// ---- the annotation boxes: [left, top, width, height] in percent of the picture
const mapBox = b => [(TX + b[0] / 100 * OW * S) / NW * 100, (TY + b[1] / 100 * OH * SY) / NH * 100, b[2] / 100 * OW * S / NW * 100, b[3] / 100 * OH * SY / NH * 100].map(v => +v.toFixed(1));
const srcFile = A('data/content.js'); let src = fs.readFileSync(srcFile, 'utf8'); const i0 = src.indexOf('\nsprinkler: {'), body = src.slice(i0); let boxes = 0;
const moved = body.replace(/box: \[([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\]/g, (m, a, b, c, d) => { const nb = mapBox([+a, +b, +c, +d]); boxes++; console.log('  box [' + [a, b, c, d].join(', ') + '] -> [' + nb.join(', ') + ']'); return 'box: [' + nb.join(', ') + ']'; });
// ---- the new "after": the new photograph, with the replaced head from the existing after picture
const w = {}; new Function('window', fs.readFileSync(A('data/outlines.js'), 'utf8'))(w); const rec = w.FIREGEO_OUTLINES['sprinkler-a'], al = rec.align;
const poly = rec.contours[0].points.map(p => [TX + p[0] * OW * S, TY + p[1] * OH * SY]);          // the measured change, in new-picture pixels
const inPoly = (x, y) => { let hit = false; for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) { const a = poly[i], b = poly[k]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit; } return hit; };
let mask = new Float32Array(NW * NH); for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) mask[y * NW + x] = inPoly(x + .5, y + .5) ? 1 : 0;
const grow = L.blur(mask, NW, NH, 1, 9, 2); for (let i = 0; i < mask.length; i++) mask[i] = grow[i] > 0.04 ? 1 : 0;                  // widen by about 9 px so the whole head and its shadow are inside
const soft = L.blur(mask, NW, NH, 1, 5, 3), ring = L.blur(mask, NW, NH, 1, 16, 2);                                                 // feathered edge; and a band around it for the exposure
// the existing after picture, drawn in the new photograph's frame (through its registration on the old photograph)
const warp = L.sample(aftImg, NW, NH, { ax: NW / (OW * S) / al.sx, bx: (-TX / (OW * S) - al.dx) / al.sx, ay: NH / (OH * SY) / al.sy, by: (-TY / (OH * SY) - al.dy) / al.sy });
const gain = [1, 1, 1], sumN = [0, 0, 0], sumA = [0, 0, 0]; let rn = 0;
for (let i = 0; i < NW * NH; i++) if (ring[i] > 0.03 && mask[i] === 0 && warp.cover[i]) { rn++; for (let c = 0; c < 3; c++) { sumN[c] += newImg.data[i * 4 + c]; sumA[c] += warp.rgb[i * 3 + c]; } }
for (let c = 0; c < 3; c++) gain[c] = sumN[c] / sumA[c];
const out = { w: NW, h: NH, data: new Uint8Array(newImg.data) }; let seam = 0, sn = 0;
for (let i = 0; i < NW * NH; i++) { const m = warp.cover[i] ? soft[i] : 0; if (m <= 0) continue; for (let c = 0; c < 3; c++) { const a = Math.min(255, warp.rgb[i * 3 + c] * gain[c]), b = newImg.data[i * 4 + c]; out.data[i * 4 + c] = Math.round(b + (a - b) * m); if (m > 0.02 && m < 0.2) { seam += Math.abs(a - b); sn++; } } }
console.log('composite: exposure gain per channel ' + gain.map(v => v.toFixed(3)).join(', ') + ' from ' + rn + ' ring pixels; mean difference between the two pictures where the mask begins: ' + (seam / sn).toFixed(1) + ' grey levels');
L.save(path.join(WORK, 'sprinkler-new-after.png'), out);
{ const o = { w: NW, h: NH, data: new Uint8Array(newImg.data) }; L.drawPolyline(o, [[TX, TY], [TX + fine.w, TY], [TX + fine.w, TY + fine.h], [TX, TY + fine.h]], [255, 40, 40], true, 1); body.replace(/box: \[([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\]/g, (m, a, b, c, d) => { const nb = mapBox([+a, +b, +c, +d]), x = nb[0] / 100 * NW, y = nb[1] / 100 * NH, ww = nb[2] / 100 * NW, hh = nb[3] / 100 * NH; L.drawPolyline(o, [[x, y], [x + ww, y], [x + ww, y + hh], [x, y + hh]], [40, 90, 255], true, 1); return m; }); L.save(path.join(WORK, 'sprinkler-new-boxes.png'), o); }
console.log('previews: tools/work/sprinkler-new-after.png, tools/work/sprinkler-new-boxes.png (red: where the old picture sits; blue: the moved boxes)');
if (WRITE) {
  fs.copyFileSync(A('team-input/sprinkler-new.png'), A('assets/sprinkler.png'));
  execFileSync('/usr/bin/sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '93', path.join(WORK, 'sprinkler-new-after.png'), '--out', A('assets/after/sprinkler-a-replacement.jpg')], { stdio: 'ignore' });
  fs.writeFileSync(srcFile, src.slice(0, i0) + moved);
  fs.writeFileSync(A('assets/sprinkler.json'), JSON.stringify({ photo: 'assets/sprinkler.png', size: [NW, NH], aspect: +(NW / NH).toFixed(4), replaces: 'assets/sprinkler.old.png (343 x 263), a crop of the same photograph', oldInNew: { x: TX, y: TY, w: fine.w, h: fine.h, scale: +S.toFixed(4), correlation: +fine.c.toFixed(4), residualGrey: +fine.rms.toFixed(2) }, after: 'assets/after/sprinkler-a-replacement.jpg: this photograph with only the replaced head taken from the earlier after picture (soft mask, exposure matched). Illustrative.', boxesMoved: boxes, tool: 'tools/sprinkler-swap.js' }, null, 1) + '\n');
  console.log('installed: assets/sprinkler.png (' + NW + ' x ' + NH + '), the new after picture, ' + boxes + ' boxes in data/content.js, assets/sprinkler.json');
}
