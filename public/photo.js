// Photo input for an entry.
//
// Before this, `photo` on an entry was one of three sentinel strings: null for
// a note, 'assets/original.jpg' for the shutter, and the literal 'upload',
// which rendered a grey panel captioned IMG_2041.HEIC. Now it is an image
// source — a data URL for a file off the device, or an assets/ path for one of
// the reference photos — so every place that already did img(e.photo) shows
// the real picture with no further change.
//
// Two constraints shape this. A phone photo is 3–12 MB and the entry holds it
// for the life of the session, so each file is drawn down to a capped JPEG
// before it is kept. And a phone photo is almost always stored sideways with
// an EXIF tag saying which way is up, so the tag is read and baked into the
// pixels — nothing downstream applies a rotation.
window.PHOTO = (() => {
  const MAX_EDGE = 1600;             // longest side in px; the record view is 820 CSS px
  const QUALITY = 0.82;
  const MAX_BYTES = 40 * 1024 * 1024;
  const MODEL_EDGE = 1024;           // what goes to the model; Gemini tiles at 768
  const MODEL_QUALITY = 0.8;

  // ---- EXIF --------------------------------------------------------------
  // Two tags are wanted. Orientation, to bake the rotation in. And
  // DateTimeOriginal, because the moment the shutter fired is evidence and the
  // moment the file was picked is not.
  function readExif(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xFFD8) return {};   // not a JPEG
    let off = 2;
    while (off + 4 <= v.byteLength) {
      if (v.getUint8(off) !== 0xFF) break;
      const marker = v.getUint8(off + 1);
      if (marker === 0xDA || marker === 0xD9) break;                // start of scan: headers are done
      const size = v.getUint16(off + 2);
      if (marker === 0xE1 && off + 10 <= v.byteLength && v.getUint32(off + 4) === 0x45786966) {
        try { return readTiff(v, off + 10); } catch (e) { return {}; }
      }
      if (size < 2) break;
      off += 2 + size;
    }
    return {};
  }

  function readTiff(v, base) {
    const le = v.getUint16(base) === 0x4949;                        // 'II' little-endian, 'MM' big
    const u16 = o => v.getUint16(o, le), u32 = o => v.getUint32(o, le);
    if (u16(base + 2) !== 0x002A) return {};
    const out = {};
    const str = (e, type, count) => {
      if (type !== 2 || count < 19) return null;
      const p = count > 4 ? base + u32(e + 8) : e + 8;
      let s = '';
      for (let k = 0; k < 19 && p + k < v.byteLength; k++) s += String.fromCharCode(v.getUint8(p + k));
      return s;
    };
    const walk = dir => {
      if (dir + 2 > v.byteLength) return;
      const n = u16(dir);
      for (let i = 0; i < n; i++) {
        const e = dir + 2 + i * 12;
        if (e + 12 > v.byteLength) return;
        const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
        if (tag === 0x0112) out.orientation = u16(e + 8);
        else if (tag === 0x8769) walk(base + u32(e + 8));            // the Exif sub-IFD, where the date lives
        else if (tag === 0x9003) out.taken = str(e, type, count) || out.taken;
        else if (tag === 0x0132 && !out.taken) out.taken = str(e, type, count) || out.taken;
      }
    };
    walk(base + u32(base + 4));
    return out;
  }

  // 'YYYY:MM:DD HH:MM:SS' — EXIF's own format, and not one Date parses.
  function exifDate(s) {
    const m = s && s.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    return isNaN(d) ? null : d;
  }

  // ---- decode ------------------------------------------------------------
  // The decoder applies the Orientation tag itself — that has been the default
  // for <img> since Chrome 81, and createImageBitmap is asked for it
  // explicitly. So what comes back here is already upright, and rotating it
  // again by hand would turn a portrait photo back onto its side. The tag is
  // still read above, but only to report what the camera recorded.
  async function decode(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (e) { /* HEIC, or a corrupt file — fall through to <img> */ }
    }
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, img });
        // Safari decodes HEIC here; Chrome and Firefox do not, and land on onerror.
        img.onerror = () => reject(new Error('unreadable'));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---- downscale ---------------------------------------------------------
  function render(src) {
    const iw = src.width, ih = src.height;
    if (!iw || !ih) throw new Error('unreadable');
    const scale = Math.min(1, MAX_EDGE / Math.max(iw, ih));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(iw * scale));
    c.height = Math.max(1, Math.round(ih * scale));
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(src.img || src, 0, 0, c.width, c.height);
    if (src.close) src.close();
    return c;
  }

  const fmtBytes = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

  /**
   * Take a File from an <input type="file"> and give back something an entry
   * can hold: a downscaled, upright data URL plus what is known about where
   * it came from.
   *
   * Rejects with a message fit to show the inspector — an unreadable HEIC is
   * the common case on Chrome, and silence there would look like a bug.
   */
  async function fromFile(file) {
    if (!file) throw new Error('no file');
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)) {
      throw new Error('That is not an image file.');
    }
    if (file.size > MAX_BYTES) throw new Error(`That photo is ${fmtBytes(file.size)} — the limit is ${fmtBytes(MAX_BYTES)}.`);

    // EXIF lives in the first APP1 segment, so the head of the file is enough
    // — no reason to pull 12 MB through an ArrayBuffer to read two tags.
    const tags = readExif(await file.slice(0, 131072).arrayBuffer());
    let decoded;
    try {
      decoded = await decode(file);
    } catch (e) {
      throw new Error(/\.hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)
        ? 'This browser cannot open HEIC photos. Export it as JPEG and try again.'
        : 'That image could not be opened.');
    }

    const canvas = render(decoded);
    const src = canvas.toDataURL('image/jpeg', QUALITY);
    const shot = exifDate(tags.taken);
    return {
      src,
      name: file.name,
      origin: 'file',
      w: canvas.width,
      h: canvas.height,
      bytes: Math.round((src.length - src.indexOf(',') - 1) * 3 / 4),
      sourceBytes: file.size,
      taken: (shot || new Date(file.lastModified || Date.now())).toISOString(),
      exifTaken: !!shot,
    };
  }

  /**
   * The same photo, sized for the model rather than for the screen.
   *
   * Gemini tiles an image at 768 px, so sending the full 1600 px entry photo
   * buys nothing and costs tokens on every draft. This re-renders whatever the
   * entry holds — a data URL from the device, or an assets/ path — down to one
   * tile-and-a-bit, and hands back the base64 the inlineData part wants.
   *
   * @returns {Promise<{mimeType: string, data: string, w: number, h: number}|null>}
   */
  async function forModel(src) {
    const u = await fit(src, MODEL_EDGE, MODEL_QUALITY);
    return u ? { mimeType: 'image/jpeg', data: u.src.slice(u.src.indexOf(',') + 1), w: u.w, h: u.h } : null;
  }

  /**
   * Re-encode any image source — a data URL, an assets/ path — to a JPEG data
   * URL no larger than `edge` on its longest side. Returns null rather than
   * throwing if the browser cannot decode it.
   *
   * Used for what goes to a model, and for what comes back: a generated
   * annotation lands as a 2 MB PNG, and an entry holds one per recommendation
   * for the life of the session.
   */
  async function fit(src, edge, quality) {
    if (!src) return null;
    let img;
    try {
      img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('unreadable'));
        i.src = src;
      });
    } catch (e) { return null; }
    if (!img.naturalWidth || !img.naturalHeight) return null;
    const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', quality);
    return { src: url, w: c.width, h: c.height, bytes: Math.round((url.length - url.indexOf(',') - 1) * 3 / 4) };
  }

  /** One of the reference photos in assets/, described by data.js. */
  function fromLibrary(id) {
    const p = (window.PHOTOLIB || []).find(x => x.id === id);
    if (!p) throw new Error('no such reference photo');
    return { src: p.src, name: p.src.split('/').pop(), origin: 'library', label: p.label, taken: null };
  }

  /** The caption under the viewfinder: where this photo came from, in one line. */
  function caption(meta) {
    if (!meta) return '';
    if (meta.origin === 'library') return meta.label + ' · reference photo';
    const bits = [meta.name];
    if (meta.taken) {
      const d = new Date(meta.taken);
      const today = new Date().toDateString() === d.toDateString();
      bits.push((today ? 'today' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })) +
        ' ' + d.toTimeString().slice(0, 5) + (meta.exifTaken ? '' : ' · file time'));
    }
    if (meta.w) bits.push(meta.w + '×' + meta.h);
    return bits.join(' · ');
  }

  return { fromFile, fromLibrary, forModel, fit, caption, fmtBytes, MAX_EDGE };
})();
