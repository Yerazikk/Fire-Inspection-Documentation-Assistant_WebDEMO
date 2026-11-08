// node test_photo.js [port] — photo input for an entry, in Chrome via Playwright.
// The server must be running first.
//
// What this is guarding: `photo` on an entry used to be one of three sentinel
// strings, and 'upload' drew a grey panel captioned with a filename that was
// never there. These tests say a photo is now a photo — one the browser
// decoded, upright, size-capped, and carried through to the saved entry.
const fs = require('fs'), os = require('os'), path = require('path');
const PORT = process.argv[2] || 8956;

// A phone photo as a phone writes one: landscape pixels with Orientation=6
// saying "display this rotated a quarter turn", and a DateTimeOriginal. Bands
// of colour mark the edges so a wrong rotation is something a test can see
// rather than something only a human would notice. The pixels are encoded by
// the browser under test, which keeps this file free of an image dependency.
async function phonePhoto(p) {
  const bytes = await p.evaluate(async () => {
    const W = 2400, H = 1800, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#22362c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#dc2828'; g.fillRect(0, 0, 150, H);         // becomes the TOP edge
    g.fillStyle = '#285adc'; g.fillRect(W - 150, 0, 150, H);   // becomes the BOTTOM edge
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
    return [...new Uint8Array(await blob.arrayBuffer())];
  });
  return withExif(Buffer.from(bytes), 6);
}

// Splice a minimal APP1/TIFF block carrying Orientation and DateTimeOriginal
// in after SOI, so the test does not need an EXIF library to write one.
function withExif(jpeg, orientation) {
  const date = Buffer.from('2026:10:14 08:41:07\0', 'ascii');
  const ifd0Entries = 2, exifEntries = 1;
  const ifd0Len = 2 + ifd0Entries * 12 + 4;
  const exifLen = 2 + exifEntries * 12 + 4;
  const dateOff = 8 + ifd0Len + exifLen;
  const tiff = Buffer.alloc(dateOff + date.length);
  tiff.write('MM', 0, 'ascii'); tiff.writeUInt16BE(42, 2); tiff.writeUInt32BE(8, 4);
  let o = 8;
  tiff.writeUInt16BE(ifd0Entries, o); o += 2;
  tiff.writeUInt16BE(0x0112, o); tiff.writeUInt16BE(3, o + 2); tiff.writeUInt32BE(1, o + 4); tiff.writeUInt16BE(orientation, o + 8); o += 12;
  tiff.writeUInt16BE(0x8769, o); tiff.writeUInt16BE(4, o + 2); tiff.writeUInt32BE(1, o + 4); tiff.writeUInt32BE(8 + ifd0Len, o + 8); o += 12;
  tiff.writeUInt32BE(0, o); o += 4;
  tiff.writeUInt16BE(exifEntries, o); o += 2;
  tiff.writeUInt16BE(0x9003, o); tiff.writeUInt16BE(2, o + 2); tiff.writeUInt32BE(date.length, o + 4); tiff.writeUInt32BE(dateOff, o + 8); o += 12;
  tiff.writeUInt32BE(0, o);
  date.copy(tiff, dateOff);

  const app1 = Buffer.concat([Buffer.from([0xFF, 0xE1, 0, 0]), Buffer.from('Exif\0\0', 'ascii'), tiff]);
  app1.writeUInt16BE(app1.length - 2, 2);
  return Buffer.concat([jpeg.slice(0, 2), app1, jpeg.slice(2)]);
}

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 960 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

  // get to the camera on a property
  await p.goto(`http://localhost:${PORT}/`);
  await p.waitForSelector('#addr');
  await p.fill('#addr', 'Ridgecrest');
  await p.waitForSelector('#sugg [data-i]');
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  await p.locator('.srow >> nth=0').click();
  await p.waitForSelector('#newEntry');
  await p.click('#newEntry');
  await p.waitForSelector('#upload');

  // ---- the picker --------------------------------------------------------
  await p.click('#upload');
  await p.waitForSelector('.picker.on');
  const tiles = await p.locator('.pk-i').count();
  ok(tiles === (await p.evaluate(() => PHOTOLIB.length)), 'every reference photo is offered');
  ok(0 === await p.evaluate(() => [...document.querySelectorAll('.pk-i img')].filter(i => !i.complete || i.naturalWidth === 0).length),
    'every reference thumbnail resolves to a file that exists');

  // ---- a real file off the device ---------------------------------------
  await p.setInputFiles('#file', 'public/assets/v4.jpg');
  await p.waitForFunction(() => S.draft && S.draft.photoMeta, null, { timeout: 15000 });
  let m = await p.evaluate(() => S.draft.photoMeta);
  ok(/^data:image\/jpeg;base64,/.test(m.src), 'a chosen file becomes image data, not a sentinel string');
  ok(m.origin === 'file' && m.name === 'v4.jpg', 'the filename it came from is kept');
  ok(await p.evaluate(() => { const i = document.querySelector('.vf img'); return !!i && i.naturalWidth > 0 && i.src.startsWith('data:'); }),
    'the viewfinder shows the chosen photo');

  // ---- a sideways, oversized phone photo --------------------------------
  const f = path.join(os.tmpdir(), 'fi3-IMG_4821.jpg');
  fs.writeFileSync(f, await phonePhoto(p));
  await p.click('#retake'); await p.waitForTimeout(400);
  await p.click('#upload'); await p.waitForSelector('.picker.on');
  await p.setInputFiles('#file', f);
  await p.waitForFunction(() => S.draft && S.draft.photoMeta, null, { timeout: 20000 });
  m = await p.evaluate(() => S.draft.photoMeta);
  ok(m.h > m.w, `a landscape file tagged Orientation=6 is stored upright (${m.w}x${m.h})`);
  ok(Math.max(m.w, m.h) === 1600, 'the longest edge is capped at 1600 px');
  ok(m.bytes < m.sourceBytes, `re-encoded smaller than the original (${Math.round(m.sourceBytes / 1024)} KB → ${Math.round(m.bytes / 1024)} KB)`);
  ok(m.exifTaken === true && new Date(m.taken).getHours() === 8, 'the shutter time comes from EXIF, not the file date');
  const band = await p.evaluate(() => {
    const i = document.querySelector('.vf img'), c = document.createElement('canvas');
    c.width = i.naturalWidth; c.height = i.naturalHeight;
    const g = c.getContext('2d'); g.drawImage(i, 0, 0);
    const px = (x, y) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3);
    return { top: px(c.width >> 1, 20), bottom: px(c.width >> 1, c.height - 20) };
  });
  ok(band.top[0] > 150 && band.bottom[2] > 150, 'the rotation is baked into the pixels, not applied twice');
  fs.unlinkSync(f);

  // ---- a file the browser cannot decode ---------------------------------
  await p.click('#retake'); await p.waitForTimeout(400);
  await p.click('#upload'); await p.waitForSelector('.picker.on');
  await p.setInputFiles('#file', { name: 'IMG_2041.HEIC', mimeType: 'image/heic', buffer: Buffer.from('not a heic') });
  await p.waitForSelector('#pkErr:not([hidden])', { timeout: 8000 }).catch(() => {});
  ok(/HEIC/i.test((await p.locator('#pkErr').textContent()).trim()), 'a file the browser cannot open says so, in the picker');

  // ---- a reference photo all the way to a saved entry --------------------
  await p.click('[data-lib="v3"]');
  await p.waitForTimeout(900);
  ok((await p.evaluate(() => S.draft.photoMeta.src)) === 'assets/v3.jpg', 'a reference photo is picked by its own path');
  await p.click('#pill'); await p.waitForTimeout(700);
  await p.fill('#memo', 'Juniper hedge is dead through the centre and touching the window wall');
  await p.click('#submit');
  await p.waitForSelector('#save', { timeout: 90000 });
  // Boxes over a photo must describe THAT photo. Either the model read it and
  // drew them, or there are none — the percentages hand-measured against
  // original.jpg must never be drawn over a different picture.
  const scan = await p.evaluate(() => S.rec.scan);
  ok(scan === null || scan.source === 'model',
    scan ? `the boxes came from the photograph (${(scan.boxes || []).length + (scan.issue ? 1 : 0)} of them)`
         : 'no boxes, rather than boxes measured against a different photo');
  if (scan) {
    const all = (scan.boxes || []).concat(scan.issue ? [scan.issue] : []);
    ok(all.every(x => x.box.every(v => v >= 0 && v <= 100) && x.box[0] + x.box[2] <= 100.5 && x.box[1] + x.box[3] <= 100.5),
      'every box lies inside the frame');
    ok(all.every(x => x.label && x.label.length <= 48), 'every box carries a label that fits on it');
  }
  ok((await p.evaluate(() => S.rec.photo)) === 'assets/v3.jpg', 'the record carries the photo');
  await p.click('#save');
  await p.waitForTimeout(1200);
  ok(await p.evaluate(() => { const i = document.querySelector('.entry .th img'); return !!i && i.naturalWidth > 0; }),
    'the saved entry lists a real thumbnail');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
