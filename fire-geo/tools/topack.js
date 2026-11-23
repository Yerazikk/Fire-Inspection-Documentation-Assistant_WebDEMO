// Re-encode a generated PNG as a JPEG the page can afford to ship.
//
//   node tools/topack.js tools/work/daisy-a-direct.png assets/after/daisy-a-direct.jpg [maxWidth] [quality]
//
// The model returns a ~2 MB PNG; the other "after" pictures in assets/ are ~490 KB JPEGs, and three more PNGs
// would be most of the weight of the whole site. There is no image library in this repo, so the encode goes
// through the headless browser that is already a dev dependency (Playwright): draw to a canvas, read it back as
// a JPEG. Lossy and deliberately so — these are illustrations, not evidence.
const fs = require('fs'), path = require('path');

const PLAYWRIGHT = path.join(__dirname, '..', '..', 'node_modules', 'playwright');
const [, , src, dst, maxW = '1200', quality = '0.86'] = process.argv;

if (!src || !dst) { console.error('usage: node tools/topack.js <src.png> <dst.jpg> [maxWidth] [quality]'); process.exit(1); }
if (!fs.existsSync(src)) { console.error('no such file: ' + src); process.exit(1); }

(async () => {
  const { chromium } = require(PLAYWRIGHT);
  const b64 = fs.readFileSync(src).toString('base64');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const out = await page.evaluate(async ([data, mw, q]) => {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = 'data:image/png;base64,' + data; });
    const scale = Math.min(1, mw / img.naturalWidth);
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/jpeg', q), w: c.width, h: c.height, fromW: img.naturalWidth, fromH: img.naturalHeight };
  }, [b64, Number(maxW), Number(quality)]);
  await browser.close();

  const buf = Buffer.from(out.url.split(',')[1], 'base64');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, buf);
  const was = fs.statSync(src).size;
  console.log(`${path.basename(src)} ${out.fromW}x${out.fromH} ${Math.round(was / 1024)} KB`
    + ` → ${path.basename(dst)} ${out.w}x${out.h} ${Math.round(buf.length / 1024)} KB`);
})();
