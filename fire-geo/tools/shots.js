// node tools/shots.js [round-name]
// Headless screenshots of every state into shots/<round>/, plus slow-motion frames of a line crossing and contact
// sheets, for the art-direction rounds. Uses the running server (PORT env, default 8861). Never opens a window.
const { chromium } = require('/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROUND = process.argv[2] || 'round', OUT = path.join(__dirname, '..', 'shots', ROUND), BASE = 'http://localhost:' + (process.env.PORT || 8861);
fs.mkdirSync(OUT, { recursive: true });
const killer = setTimeout(() => { console.log('hard timeout'); process.exit(1); }, 280000);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SA_FLATS = '-122.5620,37.9746', SAN_RAFAEL = '-122.5350,38.0000', SLEEPY = '-122.5760,38.0040';

(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
  const errors = [];
  try {
    const open = async (ctxOpt, q) => { const ctx = await b.newContext(ctxOpt), p = await ctx.newPage(); p.on('pageerror', e => errors.push(q + ' ' + e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(q + ' ' + m.text()); }); await p.goto(BASE + '/' + q); await p.waitForFunction(() => document.body.dataset.ready === '1'); return { ctx, p }; };
    const sheet = async (name, files, cols, w, pageW) => {           // a contact sheet made in the browser itself
      const ctx = await b.newContext({ viewport: { width: pageW || 1800, height: 900 } }), p = await ctx.newPage();
      const html = '<body style="margin:0;background:#cfd3da;font:600 12px ui-rounded,system-ui;display:grid;grid-template-columns:repeat(' + cols + ',' + w + 'px);gap:8px;padding:8px">' + files.map(f => '<figure style="margin:0"><img src="data:image/png;base64,' + fs.readFileSync(path.join(OUT, f)).toString('base64') + '" style="width:' + w + 'px;display:block"><figcaption style="padding:2px 0 4px">' + f.replace('.png', '') + '</figcaption></figure>').join('') + '</body>';
      await p.setContent(html); await sleep(300); await p.screenshot({ path: path.join(OUT, name), fullPage: true }); await ctx.close(); console.log('sheet', name);
    };
    const desk = { viewport: { width: 1440, height: 900 } };

    // ---- 1. every state at 1440 x 900
    const states = [];
    for (const photo of ['ladder', 'sprinkler']) for (const [tag, pin] of [['ross', 'ross'], ['sananselmo', 'san_anselmo'], ['fairfax', 'fairfax'], ['county', 'marin'], ['sa-flats', SA_FLATS], ['sanrafael', SAN_RAFAEL], ['sleepy', SLEEPY]]) states.push([photo + '-' + tag, '?photo=' + photo + '&pin=' + pin]);
    for (const d of [20, 60, 120]) states.push(['ladder-ross-d' + d, '?pin=ross&d=' + d]);
    for (const [sol, pos] of [['a', 0.5], ['a', 0.12], ['a', 0.9], ['b', 0.35], ['c', 0.3]]) states.push(['ladder-fix-' + sol + '-' + Math.round(pos * 100), '?pin=ross&sol=' + sol + '&pos=' + pos]);
    states.push(['sprinkler-fix-a-30', '?photo=sprinkler&pin=ross&pos=0.3']);
    states.push(['ladder-row-roadside-county', '?pin=marin&sel=roadside']);
    for (const [name, q] of states) { const { ctx, p } = await open(desk, q); await sleep(1500); await p.screenshot({ path: path.join(OUT, name + '.png') }); await ctx.close(); }
    console.log('states', states.length);
    await sheet('_sheet-places.png', states.slice(0, 14).map(s => s[0] + '.png'), 3, 900, 2760);
    await sheet('_sheet-controls.png', states.slice(14).map(s => s[0] + '.png'), 3, 900, 2760);

    // ---- 2. the photo card alone, larger, for the divider and the outlines
    const crops = [];
    for (const [sol, pos, photo] of [['a', 0.5, 'ladder'], ['a', 0.1, 'ladder'], ['b', 0.3, 'ladder'], ['c', 0.25, 'ladder'], ['a', 0.3, 'sprinkler']]) {
      const { ctx, p } = await open({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }, '?photo=' + photo + '&sol=' + sol + '&pos=' + pos); await sleep(1700);
      const name = 'photo-' + photo + '-' + sol + '-' + Math.round(pos * 100) + '.png'; await p.locator('.photo-card').screenshot({ path: path.join(OUT, name) }); crops.push(name); await ctx.close();
    }
    await sheet('_sheet-photo.png', crops, 5, 400, 2060);

    // ---- 3. phone width, full page
    const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }, mob = [];
    for (const [name, q] of [['m-ladder-ross', '?pin=ross'], ['m-ladder-fairfax', '?pin=fairfax'], ['m-sprinkler-county', '?photo=sprinkler&pin=marin'], ['m-ladder-sanrafael', '?pin=' + SAN_RAFAEL]]) { const { ctx, p } = await open(phone, q); await sleep(1500); await p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true }); mob.push(name + '.png'); await ctx.close(); }
    await sheet('_sheet-phone.png', mob, 4, 390, 1620);

    // ---- 4. a line crossing, frame by frame. Page time and animation time are both slowed to a tenth, so a
    //         screenshot every 60 ms of real time is a 6 ms step of the motion.
    const cross = async (tag, fromPin, toPin, frames) => {
      const { ctx, p } = await open(desk, '?pin=' + fromPin); await sleep(1200);
      const cdp = await ctx.newCDPSession(p); await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 });
      await p.evaluate(() => { const real = performance.now.bind(performance), t0 = real(); performance.now = () => t0 + (real() - t0) * 0.1; const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(() => cb(performance.now())); });
      const names = [];
      await p.evaluate(to => { const q = to.split(',').map(Number); const pin = isNaN(q[0]) ? FireGeo.geo.pins[to] : q; APP.setPin(pin[0], pin[1]); }, toPin);
      for (let i = 0; i < frames; i++) { const n = 'x-' + tag + '-' + String(i).padStart(2, '0') + '.png'; await p.locator('#codesCard').screenshot({ path: path.join(OUT, n) }); names.push(n); await sleep(40); }
      await ctx.close(); return names;
    };
    await sheet('_sheet-cross-sa-fairfax.png', await cross('sa-ff', 'san_anselmo', 'fairfax', 12), 6, 430, 2640);
    await sheet('_sheet-cross-fairfax-county.png', await cross('ff-co', 'fairfax', 'marin', 12), 6, 430, 2640);
    await sheet('_sheet-cross-ross-sanrafael.png', await cross('ro-sr', 'ross', SAN_RAFAEL, 12), 6, 430, 2640);

    // ---- 5. a fast back-and-forth scrub over the Ross / San Anselmo line, caught at real speed
    { const { ctx, p } = await open(desk, '?pin=ross'); await sleep(1000); const names = [];
      await p.evaluate(() => { let k = 0; window.__scrub = setInterval(() => { const a = k++ % 2 ? [-122.5580, 37.9650] : [-122.5610, 37.9755]; APP.setPin(a[0], a[1]); }, 70); });
      for (let i = 0; i < 10; i++) { const n = 's-scrub-' + String(i).padStart(2, '0') + '.png'; await p.screenshot({ path: path.join(OUT, n), clip: { x: 350, y: 56, width: 1090, height: 790 } }); names.push(n); await sleep(23); }
      await p.evaluate(() => clearInterval(window.__scrub)); await ctx.close();
      await sheet('_sheet-scrub.png', names, 5, 520, 2660); }
    console.log(errors.length ? 'ERRORS ' + errors.slice(0, 5).join(' | ') : 'no page errors in any state');
  } finally { await b.close(); clearTimeout(killer); }
})();
