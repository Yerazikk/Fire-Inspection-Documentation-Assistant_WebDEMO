// Small dependency-free image helpers for the offline tools (node + zlib only).
// PNG decode (8-bit grey / RGB / RGBA / palette, non-interlaced), PNG encode (RGBA), resampling and blur.
// JPEG input is first converted to PNG with macOS `sips`, which ships with the system.
'use strict';
const zlib = require('zlib'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, depth = 0, ctype = 0, interlace = 0, plte = null, trns = null; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString('latin1', off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; interlace = data[12]; }
    else if (type === 'PLTE') plte = data; else if (type === 'tRNS') trns = data; else if (type === 'IDAT') idat.push(data); else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (depth !== 8 || interlace) throw new Error('only 8-bit non-interlaced PNG is supported (got depth ' + depth + ', interlace ' + interlace + ')');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype], stride = w * ch, raw = zlib.inflateSync(Buffer.concat(idat));
  const px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[dst + x - ch] : 0, b = y ? px[dst - stride + x] : 0, c = x >= ch && y ? px[dst - stride + x - ch] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      px[dst + x] = v & 255;
    }
  }
  const out = new Uint8Array(w * h * 4);
  for (let i = 0, n = w * h; i < n; i++) {
    let r, g, b, a = 255;
    if (ctype === 2) { r = px[i * 3]; g = px[i * 3 + 1]; b = px[i * 3 + 2]; }
    else if (ctype === 6) { r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2]; a = px[i * 4 + 3]; }
    else if (ctype === 0) { r = g = b = px[i]; }
    else if (ctype === 4) { r = g = b = px[i * 2]; a = px[i * 2 + 1]; }
    else { const k = px[i]; r = plte[k * 3]; g = plte[k * 3 + 1]; b = plte[k * 3 + 2]; a = trns && k < trns.length ? trns[k] : 255; }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
  }
  return { w, h, data: out };
}

let CRC = null;
function crc32(buf) {
  if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
  let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0;
}
function encodePNG(img) {
  const { w, h, data } = img, raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const chunk = (type, body) => { const len = Buffer.alloc(4); len.writeUInt32BE(body.length); const td = Buffer.concat([Buffer.from(type, 'latin1'), body]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))]);
}

// Load any image macOS can read. Non-PNG files are converted into `workDir` first (the source is never modified).
function load(file, workDir) {
  let src = file;
  if (!/\.png$/i.test(file)) { src = path.join(workDir, path.basename(file).replace(/\.[^.]+$/, '') + '.src.png'); execFileSync('/usr/bin/sips', ['-s', 'format', 'png', file, '--out', src], { stdio: 'ignore' }); }
  return decodePNG(fs.readFileSync(src));
}
const save = (file, img) => fs.writeFileSync(file, encodePNG(img));

// Float RGB planes (0..255) at w x h, sampled from `img` through a mapping of normalised coordinates:
// output (u, v) in 0..1 reads the source at (u * ax + bx, v * ay + by), also 0..1. Area-averaged when shrinking.
function sample(img, w, h, map) {
  const m = map || { ax: 1, bx: 0, ay: 1, by: 0 }, out = new Float32Array(w * h * 3), cover = new Uint8Array(w * h);
  const fx = Math.max(1, Math.round(img.w * m.ax / w)), fy = Math.max(1, Math.round(img.h * m.ay / h));   // taps per output pixel
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let j = 0; j < fy; j++) for (let i = 0; i < fx; i++) {
      const u = ((x + (i + 0.5) / fx) / w) * m.ax + m.bx, v = ((y + (j + 0.5) / fy) / h) * m.ay + m.by;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
      const sx = Math.min(img.w - 1, u * img.w | 0), sy = Math.min(img.h - 1, v * img.h | 0), k = (sy * img.w + sx) * 4;
      r += img.data[k]; g += img.data[k + 1]; b += img.data[k + 2]; n++;
    }
    const o = (y * w + x) * 3; if (n) { out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; cover[y * w + x] = 1; }
  }
  return { w, h, rgb: out, cover };
}
const grey = p => { const g = new Float32Array(p.w * p.h); for (let i = 0; i < g.length; i++) g[i] = 0.299 * p.rgb[i * 3] + 0.587 * p.rgb[i * 3 + 1] + 0.114 * p.rgb[i * 3 + 2]; return g; };

// Box blur (run three times it is close to a Gaussian). `arr` holds `ch` interleaved channels.
function blur(arr, w, h, ch, radius, passes = 3) {
  let a = Float32Array.from(arr), b = new Float32Array(arr.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) for (let c = 0; c < ch; c++) {
      let s = 0, n = 0; for (let x = -radius; x <= radius; x++) if (x >= 0 && x < w) { s += a[(y * w + x) * ch + c]; n++; }
      for (let x = 0; x < w; x++) { b[(y * w + x) * ch + c] = s / n; const add = x + radius + 1, sub = x - radius; if (add < w) { s += a[(y * w + add) * ch + c]; n++; } if (sub >= 0) { s -= a[(y * w + sub) * ch + c]; n--; } }
    }
    for (let x = 0; x < w; x++) for (let c = 0; c < ch; c++) {
      let s = 0, n = 0; for (let y = -radius; y <= radius; y++) if (y >= 0 && y < h) { s += b[(y * w + x) * ch + c]; n++; }
      for (let y = 0; y < h; y++) { a[(y * w + x) * ch + c] = s / n; const add = y + radius + 1, sub = y - radius; if (add < h) { s += b[(add * w + x) * ch + c]; n++; } if (sub >= 0) { s -= b[(sub * w + x) * ch + c]; n--; } }
    }
  }
  return a;
}
function toImage(p) { const d = new Uint8Array(p.w * p.h * 4); for (let i = 0; i < p.w * p.h; i++) { d[i * 4] = p.rgb[i * 3]; d[i * 4 + 1] = p.rgb[i * 3 + 1]; d[i * 4 + 2] = p.rgb[i * 3 + 2]; d[i * 4 + 3] = 255; } return { w: p.w, h: p.h, data: d }; }
function drawPolyline(img, pts, rgb, closed, thick = 1) {
  const put = (x, y) => { for (let dy = -thick; dy <= thick; dy++) for (let dx = -thick; dx <= thick; dx++) { const X = Math.round(x) + dx, Y = Math.round(y) + dy; if (X < 0 || Y < 0 || X >= img.w || Y >= img.h) continue; const k = (Y * img.w + X) * 4; img.data[k] = rgb[0]; img.data[k + 1] = rgb[1]; img.data[k + 2] = rgb[2]; img.data[k + 3] = 255; } };
  const n = pts.length; for (let i = 0; i < (closed ? n : n - 1); i++) { const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n], steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); for (let s = 0; s <= steps; s++) put(x0 + (x1 - x0) * s / steps, y0 + (y1 - y0) * s / steps); }
}
module.exports = { decodePNG, encodePNG, load, save, sample, grey, blur, toImage, drawPolyline };
