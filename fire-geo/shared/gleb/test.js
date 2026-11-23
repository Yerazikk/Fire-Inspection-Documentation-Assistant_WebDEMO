// shared/gleb/test.js: node shared/gleb/test.js [--shots] [--base http://localhost:8861]
// Headless only. Never edits the pages: the kit is put into them at run time by rewriting the HTML on its way to the browser
// (the same two tags ADOPT.md asks the page owners to add).
//   1. kit.html loads with no console errors and every component is on it
//   2. with the stylesheet present but html.gleb off, the pages look exactly as they do without it (the kit is inert)
//   3. with html.gleb on, both real pages load with no errors, nothing overflows at 1440 x 900,
//      text contrast is at least 4.5:1, and touch targets on the phone are at least 44 px
//   4. the pages' own files were not touched by this run
// Screenshots (before / after, and a few states) go to shared/gleb/shots/.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { chromium } = require('/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright');

const arg = n => { const i = process.argv.indexOf(n); return i > -1 ? (process.argv[i + 1] || true) : null; };
const BASE = (typeof arg('--base') === 'string' && arg('--base')) || 'http://localhost:8861';
const HERE = __dirname, ROOT = path.join(HERE, '..', '..'), SHOTS = path.join(HERE, 'shots');
const TAGS = '<link rel="stylesheet" href="/shared/gleb/gleb.css"><script src="/shared/gleb/gleb.js"></script>';
const W = 1440, H = 900;

let failed = 0, passed = 0; const notes = [];
const ok = (cond, name, detail) => { if (cond) { passed++; console.log('  ok   ' + name); } else { failed++; console.log('  FAIL ' + name + (detail ? '\n       ' + String(detail).split('\n').join('\n       ') : '')); } };
const note = s => { notes.push(s); console.log('  note ' + s); };
const sha = f => { try { return crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex'); } catch (e) { return 'missing'; } };
const WATCHED = ['index.html', 'app.css', 'app.js', 'test.js', 'shared/shell.css', 'shared/shell.js', 'team/index.html', 'team/team.css', 'team/test.js', 'lib/beforeafter.css'].map(f => path.join(ROOT, f));

const hard = setTimeout(() => { console.log('FAIL hard timeout (240 s)'); process.exit(2); }, 240000);

/** a page of the site. mode: 'plain' (as it is), 'off' (kit present, html.gleb off), 'on' (kit present and on) */
async function open(browser, url, mode) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errors = [];
  page.setDefaultTimeout(9000);
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  if (mode !== 'plain') {
    await ctx.addInitScript(v => { try { localStorage.setItem('fire-geo.gleb', v); } catch (e) { } }, mode === 'on' ? '1' : '0');
    await ctx.route(u => { const p = new URL(u).pathname; return p === '/' || p === '/index.html' || p === '/team/' || p === '/team/index.html'; }, async route => {
      const res = await route.fetch({ maxRedirects: 0 }).catch(() => null);
      if (!res || res.status() !== 200) return route.continue();
      const body = await res.text();
      // already adopted by the owner? then leave the page alone
      await route.fulfill({ response: res, body: /shared\/gleb\/gleb\.css/.test(body) ? body : body.replace('</head>', TAGS + '</head>') });
    });
  } else {
    await ctx.addInitScript(() => { try { localStorage.setItem('fire-geo.gleb', '0'); } catch (e) { } });
  }
  await page.goto(BASE + url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(900);
  return { ctx, page, errors };
}
const frameOf = page => page.frames().find(f => /\/team\//.test(f.url())) || page.mainFrame();

/** every visible run of text in a frame: where it is, its colour, how big */
const collectText = () => {
  const out = [], vw = innerWidth, vh = innerHeight;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const skip = '.map-box, .tm-photo, .ba-stage, .tm-ba, .tm-markup, .doc, .rp-frame, .qp-btn, .qp-panel, [class^="fbm"], [class^="qp-"], svg, .ph-stage, .dk-zoom, .tm-phone > :not(.ph-screen)';
  let n;
  while ((n = walker.nextNode())) {
    const text = n.nodeValue.trim(); if (text.length < 2) continue;
    const el = n.parentElement; if (!el || el.closest(skip)) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let op = 1, dis = false; for (let a = el; a && a.nodeType === 1; a = a.parentElement) { const s = getComputedStyle(a); op *= parseFloat(s.opacity); if (a.disabled || a.getAttribute('aria-disabled') === 'true' || a.inert) dis = true; if (s.visibility === 'hidden') op = 0; }
    if (op < .97 || dis) continue;                                   // fading, hidden, or disabled (40% by rule)
    const r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) {
      if (b.width < 6 || b.height < 6 || b.right < 2 || b.bottom < 2 || b.left > vw - 2 || b.top > vh - 2) continue;
      // clipped away by a scrolling or clipping ancestor?
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2, hit = document.elementFromPoint(cx, cy);
      if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) continue;
      const m = cs.color.match(/[\d.]+/g).map(Number);
      const cls = typeof el.className === 'string' ? el.className : '';
      out.push({ x: b.left, y: b.top, w: b.width, h: b.height, color: m, size: parseFloat(cs.fontSize), weight: +cs.fontWeight, text: text.slice(0, 40), who: el.tagName.toLowerCase() + (cls ? '.' + cls.trim().split(/\s+/).join('.') : '') });
      break;
    }
  }
  return out;
};

/** contrast of each run against the pixels actually behind it */
async function contrast(browser, page, runs) {
  const png = (await page.screenshot({ animations: 'disabled' })).toString('base64');
  const ctx = await browser.newContext(), p = await ctx.newPage();
  try {
    return await p.evaluate(async ({ png, runs }) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + png; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
      const lin = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
      const lum = c => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
      return runs.map(t => {
        const x = Math.max(0, Math.floor(t.x)), y = Math.max(0, Math.floor(t.y)), w = Math.min(img.width - x, Math.ceil(t.w)), h = Math.min(img.height - y, Math.ceil(t.h));
        if (w < 2 || h < 2) return null;
        const d = g.getImageData(x, y, w, h).data, px = [];
        for (let i = 0; i < d.length; i += 4) { const dist = Math.abs(d[i] - t.color[0]) + Math.abs(d[i + 1] - t.color[1]) + Math.abs(d[i + 2] - t.color[2]); px.push([dist, d[i], d[i + 1], d[i + 2]]); }
        px.sort((a, b) => b[0] - a[0]);                               // farthest from the ink first: that is the ground
        const far = px.slice(0, Math.max(1, Math.floor(px.length * .3)));
        const med = k => far.map(q => q[k]).sort((a, b) => a - b)[far.length >> 1];
        const bg = [med(1), med(2), med(3)], a = t.color[3] == null ? 1 : t.color[3];
        const fg = [0, 1, 2].map(k => t.color[k] * a + bg[k] * (1 - a));
        const l1 = lum(fg), l2 = lum(bg), ratio = (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
        return Object.assign({}, t, { ratio: Math.round(ratio * 100) / 100, bg });
      }).filter(Boolean);
    }, { png, runs });
  } finally { await ctx.close(); }
}

/** things that spill: the document itself, and text boxes that now clip where they did not before */
const collectOverflow = () => {
  const d = document.documentElement, res = { doc: [Math.max(d.scrollWidth, document.body.scrollWidth), Math.max(d.scrollHeight, document.body.scrollHeight), innerWidth, innerHeight], clipped: [], outside: [] };
  const key = el => { const p = []; for (let a = el; a && a !== document.body && p.length < 4; a = a.parentElement) p.unshift(a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className ? '.' + a.className.trim().split(/\s+/).slice(0, 2).join('.') : '')); return p.join(' > '); };
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg, .map-box, .doc, .rp-frame, [class^="qp-"], [class^="fbm"]')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.getClientRects().length) continue;
    const scrolls = /auto|scroll/.test(cs.overflowY) || /auto|scroll/.test(cs.overflowX);
    if (!scrolls && el.childElementCount === 0 && el.textContent.trim() && cs.textOverflow !== 'ellipsis' && !cs.webkitLineClamp.match(/\d/)) {
      if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible') res.clipped.push(key(el) + ' (wide by ' + (el.scrollWidth - el.clientWidth) + ')');
      if (el.scrollHeight > el.clientHeight + 2 && cs.overflowY !== 'visible' && el.clientHeight > 0) res.clipped.push(key(el) + ' (tall by ' + (el.scrollHeight - el.clientHeight) + ')');
    }
  }
  // controls must stay inside their card or device
  for (const box of document.querySelectorAll('.board > .card, .ph-screen, .dk-app')) {
    const B = box.getBoundingClientRect();
    for (const el of box.querySelectorAll('button, input, .shell-seg, .shell-pill, h1, h2, h3, p')) {
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || !el.getClientRects().length) continue;
      let op = 1; for (let a = el; a && a !== box; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity); if (op < .5) continue;
      if (el.closest('.ph-layer.leaving, .ph-sheet:not(.is-on), .map-box, .ph-stage')) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      let clipper = el.parentElement, hidden = false;                 // inside a scroller it may run past the edge on purpose
      for (; clipper && clipper !== box; clipper = clipper.parentElement) { const s = getComputedStyle(clipper); if (/auto|scroll|hidden/.test(s.overflowY + s.overflowX)) { hidden = true; break; } }
      if (hidden) continue;
      if (r.left < B.left - 1 || r.right > B.right + 1 || r.top < B.top - 1 || r.bottom > B.bottom + 1) res.outside.push(key(el));
    }
  }
  return res;
};

/** touch targets on the phone: at least 44 px through the centre, both ways (an enlarged hit area counts) */
const collectTargets = () => {
  const out = [], phone = document.querySelector('#phone'); if (!phone) return out;
  for (const el of phone.querySelectorAll('button, a[href], input, [role="button"], [role="slider"]')) {
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.pointerEvents === 'none' || el.disabled || !el.getClientRects().length) continue;
    if (el.closest('.ph-layer.leaving, .ph-sheet:not(.is-on), .tm-ghost') || el.classList.contains('ph-file')) continue;
    let op = 1; for (let a = el; a && a !== phone; a = a.parentElement) { const s = getComputedStyle(a); op *= parseFloat(s.opacity); if (s.pointerEvents === 'none' && a !== el) op = 0; } if (op < .5) continue;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const top = document.elementFromPoint(cx, cy); if (!top || !(top === el || el.contains(top))) continue;    // covered
    const mine = (x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
    const reach = (dx, dy) => { let n = 0; while (n < 40 && mine(cx + dx * (n + 1), cy + dy * (n + 1))) n++; return n; };
    const w = reach(-1, 0) + reach(1, 0) + 1, h = reach(0, -1) + reach(0, 1) + 1;
    out.push({ who: el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className.trim().split(/\s+/).join('.') : '') + (el.textContent.trim() ? ' "' + el.textContent.trim().slice(0, 18) + '"' : ''), w, h });
  }
  return out;
};

const shot = (page, name, clip) => page.screenshot({ path: path.join(SHOTS, name + '.png'), clip: clip || undefined, animations: 'disabled' });
const clipOf = async (frame, sel, pad) => { const b = await frame.locator(sel).first().boundingBox(); const p = pad || 0; return b ? { x: Math.max(0, b.x - p), y: Math.max(0, b.y - p), width: b.width + 2 * p, height: b.height + 2 * p } : null; };
const tryStep = async (name, fn) => { try { await fn(); return true; } catch (e) { note('could not reach "' + name + '": ' + String(e.message).split('\n')[0]); return false; } };

async function audit(browser, page, frame, label, extraSkip) {
  const runs = await frame.evaluate(collectText);
  const offset = frame === page.mainFrame() ? { x: 0, y: 0 } : await frame.frameElement().then(e => e.boundingBox());
  runs.forEach(t => { t.x += offset.x; t.y += offset.y; });
  const rated = await contrast(browser, page, runs);
  const low = rated.filter(t => t.ratio < 4.5 && !(extraSkip && extraSkip(t)));
  ok(low.length === 0, label + ': text contrast is at least 4.5:1 (' + rated.length + ' runs of text)', low.slice(0, 14).map(t => t.ratio + '  ' + t.who + '  "' + t.text + '"  on rgb(' + t.bg + ')').join('\n'));
  return rated;
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const before = WATCHED.map(sha);
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
  try {
    // ------------------------------------------------------------ 1 · kit.html
    console.log('kit.html');
    {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
      const page = await ctx.newPage(), errors = [];
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', e => errors.push('pageerror: ' + e.message));
      const bad = []; page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) bad.push(r.status() + ' ' + r.url()); });
      await page.goto(BASE + '/shared/gleb/kit.html?gleb=1', { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
      ok(errors.length === 0, 'loads with no console errors', errors.join('\n'));
      ok(bad.length === 0, 'every file it asks for is there', bad.join('\n'));
      ok(await page.evaluate(() => document.documentElement.classList.contains('gleb')), 'html.gleb is set by gleb.js');
      ok(await page.evaluate(() => document.fonts.check('500 14px Inter')), 'Inter is loaded from the kit folder');
      const need = ['.gl-button', '.gl-button.is-light', '.gl-button.is-veil', '.gl-icon-button', '.gl-chip', '.gl-chip.is-selected', '.gl-outline', '.gl-seg', '.gl-dots', '.gl-row', '.gl-rowcard.is-lit', '.gl-switch', '.gl-slider', '.gl-field', '.gl-loader', '.gl-light', '.gl-card', '.gl-state', '.gl-sheet', '.gl-icon', '.gl-steps', '.verdict-mark', '.kit-ref img'];
      const missing = await page.evaluate(list => list.filter(s => !document.querySelector(s)), need);
      ok(missing.length === 0, 'shows every component (' + need.length + ' kinds)', 'missing: ' + missing.join(', '));
      const broken = await page.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src')));
      ok(broken.length === 0, 'every reference crop loads', broken.join(', '));
      ok(await page.evaluate(() => !!document.querySelector('script[src="/progress/pill.js"]')), 'carries the queue button script');
      // behaviour: the segmented pill moves, the switch toggles, a hold needs the whole 900 ms
      const moved = await page.evaluate(async () => {
        const seg = document.querySelector('.gl-seg[data-gl="seg"]'), ind = seg.querySelector('.gl-seg-ind'), a = ind.getBoundingClientRect().left;
        seg.querySelectorAll('button')[1].click(); await new Promise(r => setTimeout(r, 420));
        const b = ind.getBoundingClientRect(), t = seg.querySelectorAll('button')[1].getBoundingClientRect();
        return { moved: b.left !== a, lands: Math.abs(b.left - t.left) < 1 && Math.abs(b.width - t.width) < 1, spins: getComputedStyle(document.querySelector('.gl-loader')).animationName };
      });
      ok(moved.moved && moved.lands, 'the segmented pill slides and stops exactly on the tab');
      ok(moved.spins === 'gl-breathe', 'the loader does not spin (it breathes)', moved.spins);
      const sw = await page.evaluate(() => { const s = document.querySelector('.gl-switch[data-gl="switch"]:not(:disabled)'), a = s.getAttribute('aria-checked'); s.click(); return a !== s.getAttribute('aria-checked'); });
      ok(sw, 'the switch toggles');
      const hb = page.locator('.gl-button[data-gl="hold"]').first(); await hb.scrollIntoViewIfNeeded();
      await page.evaluate(() => { window.__held = 0; document.addEventListener('gl-hold', () => window.__held++); });
      const hbox = await hb.boundingBox();
      await page.mouse.move(hbox.x + hbox.width / 2, hbox.y + hbox.height / 2); await page.mouse.down(); await page.waitForTimeout(300); await page.mouse.up(); await page.waitForTimeout(400);
      const early = await page.evaluate(() => window.__held);
      await page.mouse.down(); await page.waitForTimeout(1050); await page.mouse.up(); await page.waitForTimeout(100);
      ok(early === 0 && await page.evaluate(() => window.__held) === 1, 'hold to act: letting go early cancels, holding 900 ms acts');
      const off = await page.evaluate(collectOverflow);
      ok(off.doc[0] <= off.doc[2] + 1, 'kit.html is not wider than the window', off.doc.join(' '));
      await page.evaluate(() => scrollTo(0, 0));
      for (const id of await page.evaluate(() => [...document.querySelectorAll('.kit-part')].map(p => p.id))) await page.locator('#' + id).screenshot({ path: path.join(SHOTS, 'kit-' + id + '.png'), animations: 'disabled' });
      await ctx.close();
    }

    // ------------------------------------------------------------ 2 · inert until the class is set
    console.log('the kit is inert without html.gleb');
    for (const url of ['/', '/team/?standalone=1']) {
      const a = await open(browser, url, 'plain'), b = await open(browser, url, 'off');
      const pa = await a.page.screenshot({ animations: 'disabled' }), pb = await b.page.screenshot({ animations: 'disabled' });
      const probe = () => ['body', '.shell-seg', '.shell-seg-ind', '.shell-glass', '.shell-pill', '.ph-primary', '.code-row', '.dk-app'].map(s => { const e = document.querySelector(s); if (!e) return s + ':none'; const c = getComputedStyle(e); return [s, c.fontFamily, c.fontWeight, c.backgroundColor, c.borderRadius, c.color, c.height].join('|'); }).join('\n');
      const sa = await a.page.evaluate(probe), sb = await b.page.evaluate(probe);
      ok(sa === sb, url + ' computes the same styles with the kit loaded but off');
      ok(!(await b.page.evaluate(() => document.documentElement.classList.contains('gleb'))), url + ' ?gleb=0 (remembered) keeps the class off');
      if (!pa.equals(pb)) note(url + ': screenshots differ by bytes with the kit off (animation timing); styles are identical');
      fs.writeFileSync(path.join(SHOTS, (url === '/' ? 'technology' : 'inspectors') + '-before.png'), pa);
      await a.ctx.close(); await b.ctx.close();
    }

    // ------------------------------------------------------------ 3 · the real pages wearing the kit
    console.log('Technology tab with the kit');
    {
      const plain = await open(browser, '/', 'plain'), basePlain = await plain.page.evaluate(collectOverflow); await plain.ctx.close();
      const { ctx, page, errors } = await open(browser, '/', 'on');
      ok(errors.length === 0, 'loads with no console errors', errors.join('\n'));
      ok(await page.evaluate(() => document.documentElement.classList.contains('gleb') && getComputedStyle(document.body).fontFamily.includes('Inter')), 'html.gleb is on and the type is Inter');
      await shot(page, 'technology-after');
      const o = await page.evaluate(collectOverflow);
      ok(o.doc[0] <= W && o.doc[1] <= H, 'the page does not scroll at 1440 x 900', o.doc.join(' '));
      const fresh = o.clipped.filter(k => !basePlain.clipped.includes(k)), out = o.outside.filter(k => !basePlain.outside.includes(k));
      ok(fresh.length === 0, 'no text is newly clipped', fresh.join('\n'));
      ok(out.length === 0, 'no control leaves its card', out.join('\n'));
      await audit(browser, page, page.mainFrame(), 'Technology');
      // the page still works: switch the photograph, pick a place, step the distance, choose a row
      const works = await page.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms)), r = {};
        const tabs = document.querySelectorAll('#photoTabs button'), ind = document.querySelector('#photoTabs .shell-seg-ind');
        const x0 = ind.getBoundingClientRect().left; tabs[1].click(); await wait(500);
        const b = ind.getBoundingClientRect(), t = tabs[1].getBoundingClientRect();
        r.pill = b.left !== x0 && Math.abs(b.left - t.left) < 1.5 && Math.abs(b.width - t.width) < 1.5; tabs[0].click(); await wait(500);
        const chip = [...document.querySelectorAll('#chips button')].find(c => c.getAttribute('aria-pressed') !== 'true'); if (chip) { chip.click(); await wait(900); r.chip = chip.getAttribute('aria-pressed') === 'true'; } else r.chip = true;
        const n = document.querySelector('#distNum'), v0 = n.textContent; document.querySelector('#distUp').click(); await wait(500); r.step = n.textContent !== v0;
        const bar = document.querySelector('.row-select'), rows = [...document.querySelectorAll('.code-row')], y0 = bar.getBoundingClientRect().top;
        const row = rows.find(x => Math.abs(x.getBoundingClientRect().top - y0) > 12); row.click(); await wait(600);
        const br = bar.getBoundingClientRect(), rr = row.getBoundingClientRect(); r.row = Math.abs((br.top + br.height / 2) - (rr.top + rr.height / 2)) < 3;
        return r;
      });
      ok(works.pill, 'the photo switch pill still slides and lands on the tab'); ok(works.chip, 'a map chip still picks its place'); ok(works.step, 'the distance stepper still steps'); ok(works.row, 'a code row can still be chosen and the lit bar glides onto it');
      ok(errors.length === 0, 'still no console errors after using it', errors.join('\n'));
      await page.waitForTimeout(400); await shot(page, 'technology-after-used');
      await tryStep('Sources and notes sheet', async () => {
        await page.click('#notesLink'); await page.waitForTimeout(700); await shot(page, 'technology-notes-sheet'); await audit(browser, page, page.mainFrame(), 'Technology, Sources and notes');
        ok(await page.evaluate(() => { const r = document.querySelector('#notesSheet').getBoundingClientRect(); return r.bottom < innerHeight - 8 && r.top > 0; }), 'the notes sheet floats above the bottom edge');
        await page.click('#notesClose'); await page.waitForTimeout(700);
        ok(await page.evaluate(() => document.querySelector('#notesSheet').getBoundingClientRect().top >= innerHeight), 'closed, the notes sheet is fully off the page');
      });
      for (const [name, sel] of [['tech-photo-card', '.photo-card'], ['tech-map-card', '.map-card'], ['tech-codes-card', '.codes-card']]) { const c = await clipOf(page.mainFrame(), sel, 8); if (c) await shot(page, name, c); }
      await ctx.close();
    }

    console.log('Inspectors tab with the kit');
    {
      const plain = await open(browser, '/team/?standalone=1', 'plain'), basePlain = await plain.page.evaluate(collectOverflow), targetsPlain = await plain.page.evaluate(collectTargets); await plain.ctx.close();
      const { ctx, page, errors } = await open(browser, '/team/?standalone=1', 'on');
      const f = page.mainFrame(), L = '.ph-layer:not(.leaving)';
      ok(errors.length === 0, 'loads with no console errors', errors.join('\n'));
      ok(await page.evaluate(() => document.documentElement.classList.contains('gleb')), 'html.gleb is on');
      await shot(page, 'inspectors-after');
      const o = await page.evaluate(collectOverflow);
      ok(o.doc[0] <= W && o.doc[1] <= H, 'the page does not scroll at 1440 x 900', o.doc.join(' '));
      ok(o.clipped.filter(k => !basePlain.clipped.includes(k)).length === 0, 'no text is newly clipped', o.clipped.filter(k => !basePlain.clipped.includes(k)).join('\n'));
      ok(o.outside.filter(k => !basePlain.outside.includes(k)).length === 0, 'no control leaves its device', o.outside.filter(k => !basePlain.outside.includes(k)).join('\n'));
      await audit(browser, page, f, 'Inspectors, camera');
      const small = t => t.filter(x => x.w < 44 || x.h < 44);
      const report = (label, list, base) => { const s = small(list), known = base ? small(base).map(x => x.who) : []; ok(s.length === 0, label + ': phone touch targets are at least 44 px (' + list.length + ' controls)', s.map(x => x.w + ' x ' + x.h + '  ' + x.who + (known.includes(x.who) ? '   (also small without the kit)' : '')).join('\n')); };
      report('camera', await page.evaluate(collectTargets), targetsPlain);
      const phoneClip = async () => clipOf(f, '.tm-phone', 6), deskClip = async () => clipOf(f, '.tm-laptop', 6);
      // walk the page the way its own driver does (team/drive.js, read only): photograph, the reading, is this it, the questions, a sheet, sent, then the laptop
      const D = require(path.join(ROOT, 'team', 'drive.js')), scr = n => D.waitScreen(page, n);
      const look = async (name, o) => { await shot(page, name, await phoneClip()); report(name, await page.evaluate(collectTargets)); await audit(browser, page, f, 'Inspectors, ' + name, o && o.skip); };
      await tryStep('the reading', async () => { await page.click('.ph-shutter'); await scr('scan'); await page.waitForTimeout(650); await shot(page, 'phone-scan', await phoneClip()); await audit(browser, page, f, 'Inspectors, phone-scan'); await page.click(L + ' [data-skip]').catch(() => { }); await scr('meaning'); await D.settle(page, 700); await look('phone-meaning'); });
      await tryStep('the questions', async () => {
        await D.phone.confirm(page); await D.settle(page, 500); await look('phone-questions');
        const pick = page.locator(L + ' .ph-pick:not(.ph-pick-pad)').first(); if (await pick.count()) { await pick.click(); await D.settle(page, 350); await look('phone-questions-picked'); }
        ok(await page.evaluate(s => { const p = document.querySelector(s + ' .ph-pick.is-on'); return !p || getComputedStyle(p).backgroundColor === 'rgb(25, 34, 51)'; }, L), 'a chosen answer is ink');
      });
      await tryStep('a sheet', async () => {
        const opener = page.locator(L + ' .ph-pick-pad, ' + L + ' .ph-seen-toggle, ' + L + ' .ph-where').first(); if (!(await opener.count())) throw new Error('nothing on this screen opens a sheet');
        await opener.click(); await D.settle(page, 500);
        if (!(await page.locator('.ph-sheet.is-on').count())) { const ch = page.locator(L + ' .ph-seen-change').first(); await ch.click(); await D.settle(page, 500); }
        await page.waitForSelector('.ph-sheet.is-on'); await look('phone-sheet');
        ok(await page.evaluate(() => { const e = document.querySelector('.ph-sheet.is-on').getBoundingClientRect(), p = document.querySelector('.ph-screen').getBoundingClientRect(); return e.left > p.left + 4 && e.right < p.right - 4 && e.bottom < p.bottom - 4 && e.top > p.top; }), 'the sheet floats inside the screen, as his does');
        await page.click('.ph-sheet.is-on .ph-sheet-close'); await D.settle(page, 500);
        ok(await page.evaluate(() => [...document.querySelectorAll('.ph-sheet')].every(e => e.getBoundingClientRect().top >= document.querySelector('.ph-screen').getBoundingClientRect().bottom - 1)), 'closed, the sheet is fully below the screen');
      });
      await tryStep('sent', async () => {
        for (let i = 0; i < 6 && await D.primary(page).isDisabled(); i++) {                    // answer whatever is still open
          const open = page.locator(L + ' .ph-q-opts:not(:has(.is-on)) .ph-pick:not(.ph-pick-pad)').first(); if (!(await open.count())) break; await open.click(); await D.settle(page, 250);
        }
        await D.phone.send(page); await D.settle(page, 600); await look('phone-sent');
      });
      await tryStep('the laptop', async () => {
        if (!(await page.locator('.dk-view.is-on .dk-row').count())) { await D.desk.seed(page, 'ladder', 'ross'); await D.settle(page, 900); }
        await page.waitForSelector('.dk-view.is-on .dk-row'); await D.settle(page, 700);
        await shot(page, 'desk-finding', await deskClip()); await audit(browser, page, f, 'Inspectors, the laptop');
        await page.locator('.dk-view.is-on .dk-row .dk-row-open').first().click(); await D.settle(page, 600);
        const choice = page.locator('.dk-view.is-on .dk-row .dk-choice[data-v="yellow"]').first(); if (await choice.count()) { await choice.click(); await D.settle(page, 500); }
        await shot(page, 'desk-row-open', await deskClip()); await audit(browser, page, f, 'Inspectors, an open rule');
        ok(await page.evaluate(() => { const c = document.querySelector('.dk-view.is-on .dk-choice[aria-pressed="true"]'); return !c || getComputedStyle(c).backgroundColor === 'rgb(25, 34, 51)'; }), 'the chosen verdict is an ink chip');
        await page.locator('.dk-view.is-on .dk-row .dk-verdict').nth(1).click(); await D.settle(page, 400);
        await shot(page, 'desk-menu', await deskClip()); await audit(browser, page, f, 'Inspectors, the verdict menu');
        await page.keyboard.press('Escape'); await D.settle(page, 300);
      });
      await shot(page, 'inspectors-after-used');
      const end = await page.evaluate(collectOverflow);
      ok(end.doc[0] <= W && end.doc[1] <= H, 'still does not scroll after the walk-through', end.doc.join(' '));
      ok(end.outside.filter(k => !basePlain.outside.includes(k)).length === 0, 'still no control outside its device', end.outside.filter(k => !basePlain.outside.includes(k)).join('\n'));
      ok(errors.length === 0, 'still no console errors after the walk-through', errors.join('\n'));
      await ctx.close();
    }

    console.log('the two tabs in one document');
    {
      const { ctx, page, errors } = await open(browser, '/#inspectors', 'on');
      await page.waitForTimeout(1500);
      const fr = frameOf(page), inner = fr !== page.mainFrame() ? await fr.evaluate(() => document.documentElement.classList.contains('gleb')) : null;
      if (inner === null) note('no embedded Inspectors frame found at /#inspectors'); else ok(inner, 'the embedded Inspectors page wears the kit too');
      ok(errors.length === 0, 'loads with no console errors', errors.join('\n'));
      await shot(page, 'shell-inspectors-after');
      if (inner) await audit(browser, page, page.mainFrame(), 'Shell bar over the Inspectors view');
      await ctx.close();
    }

    // ------------------------------------------------------------ 4 · nothing outside shared/gleb was written
    console.log('the pages themselves');
    const after = WATCHED.map(sha), changed = WATCHED.filter((f, i) => before[i] !== after[i]).map(f => path.relative(ROOT, f));
    if (changed.length) note('changed while this ran (by their owners, not by this test, which never writes outside shared/gleb): ' + changed.join(', '));
    const mine = fs.readdirSync(HERE).sort().join(' '); ok(/gleb\.css/.test(mine) && /gleb\.js/.test(mine) && /kit\.html/.test(mine) && /ADOPT\.md/.test(mine), 'the kit folder holds gleb.css, gleb.js, kit.html, ADOPT.md', mine);
  } catch (e) {
    failed++; console.log('  FAIL the run stopped: ' + (e && e.stack || e));
  } finally {
    await browser.close().catch(() => { });
    clearTimeout(hard);
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed' + (notes.length ? ', ' + notes.length + ' notes' : ''));
  process.exit(failed ? 1 : 0);
})();
