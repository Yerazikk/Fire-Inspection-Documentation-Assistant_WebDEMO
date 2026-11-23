// node monday/tools/check.js [--shots]
//
// Drives monday/index.html from the filesystem — the way it is actually opened
// — and asserts the things that would quietly rot: an image that does not
// resolve, a tab that reloads, a slider that drifts out of register, a console
// error nobody saw. --shots also writes screenshots to monday/tools/shots/ so
// the overlay boxes can be checked against the photographs by eye.
//
// Free: no API calls, nothing billed.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const PAGE = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
const SHOTS = path.join(__dirname, 'shots');

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const shots = process.argv.includes('--shots');
  if (shots) fs.mkdirSync(SHOTS, { recursive: true });

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto(PAGE);
  await p.waitForSelector('.ba .after[src]');
  await p.waitForTimeout(400);

  // ---- both tabs exist and both panels were built up front ----------------
  const tabs = await p.$$eval('.tab', ts => ts.map(t => t.textContent));
  ok(tabs.length === 2, `exactly two tabs (${tabs.join(' · ')})`);
  ok((await p.$$('[role=tabpanel]')).length === 2, 'both panels are built at load');

  // ---- every image resolves ----------------------------------------------
  const bad = await p.$$eval('img', is => is.filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src')));
  ok(bad.length === 0, bad.length ? `broken images: ${bad.join(', ')}` : 'every image resolves');
  const nimg = await p.$$eval('img', is => is.length);
  console.log(`-- ${nimg} images on the page`);

  // ---- the slider's two layers register ----------------------------------
  const reg = await p.$$eval('.ba', bas => bas.map(ba => {
    const [a, bf] = [ba.querySelector('.after'), ba.querySelector('.before')];
    const ra = a.getBoundingClientRect(), rb = bf.getBoundingClientRect();
    return {
      same: Math.abs(ra.width - rb.width) < 1 && Math.abs(ra.height - rb.height) < 1,
      drift: Math.abs(a.naturalWidth / a.naturalHeight - bf.naturalWidth / bf.naturalHeight),
    };
  }));
  ok(reg.every(r => r.same), 'before and after layers occupy the same box');
  ok(reg.every(r => r.drift < 0.05), `source aspects match within 5% (max ${Math.max(...reg.map(r => r.drift)).toFixed(3)})`);

  // ---- the annotation toggle ---------------------------------------------
  const vis = () => p.$eval('[role=tabpanel]:not([hidden]) .shot .ann', a => getComputedStyle(a).opacity);
  ok((await vis()) === '1', 'annotations are on by default');
  await p.click('[role=tabpanel]:not([hidden]) .toggle');
  await p.waitForTimeout(300);
  ok((await vis()) === '0', 'the toggle hides the annotations');
  await p.click('[role=tabpanel]:not([hidden]) .toggle');
  await p.waitForTimeout(300);
  ok((await vis()) === '1', 'the toggle brings them back');

  // The overlay is drawn in one pass off the figure's measured width, so it is
  // there as soon as the layout settles.
  await p.waitForSelector('[role=tabpanel]:not([hidden]) .ar g.issue', { timeout: 10000 });
  const nbox = await p.$$eval('[role=tabpanel]:not([hidden]) .ar g', g => g.length);
  ok(nbox >= 3, `${nbox} hazard boxes drawn on the photograph`);
  ok((await p.$$eval('[role=tabpanel]:not([hidden]) .ar g.issue', g => g.length)) === 1,
    'exactly one box is marked as the finding itself');
  const labs = await p.$$eval('[role=tabpanel]:not([hidden]) .ar text.lab', t => t.map(x => x.textContent));
  ok(labs.length === nbox && labs.every(t => t && t.trim()),
    `every box resolved its label (${labs.join(' · ')})`);
  // Labels are absolutely placed; none may be drawn off the photograph.
  const off = await p.$eval('[role=tabpanel]:not([hidden]) .ar', ar => {
    const W = ar.clientWidth;
    return [...ar.querySelectorAll('text.lab')].filter(t => {
      const b = t.getBBox();
      return b.x < -2 || b.x + b.width > W + 2;
    }).map(t => t.textContent);
  });
  ok(off.length === 0, off.length ? `labels off the frame: ${off.join(', ')}` : 'every label sits inside the frame');

  // ---- dragging the handle moves the reveal ------------------------------
  const pos = () => p.$eval('[role=tabpanel]:not([hidden]) .ba', ba => ba.style.getPropertyValue('--pos'));
  // The mouse is driven in viewport coordinates, so the slider has to be on
  // screen and settled before its box is measured.
  await (await p.$('[role=tabpanel]:not([hidden]) .ba')).scrollIntoViewIfNeeded();
  await p.waitForTimeout(250);
  const box = await p.$eval('[role=tabpanel]:not([hidden]) .ba', ba => { const r = ba.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(box.x + box.w * 0.5, box.y + box.h * 0.5);
  await p.mouse.down();
  await p.mouse.move(box.x + box.w * 0.82, box.y + box.h * 0.5, { steps: 8 });
  await p.mouse.up();
  const dragged = parseFloat(await pos());
  ok(dragged > 70 && dragged < 95, `dragging moves the reveal (${dragged.toFixed(1)}%)`);

  // ---- and so do the arrow keys ------------------------------------------
  await p.focus('[role=tabpanel]:not([hidden]) .grip');
  await p.keyboard.press('Home');
  ok(parseFloat(await pos()) === 0, 'Home takes the reveal to the original');
  await p.keyboard.press('ArrowRight');
  ok(parseFloat(await pos()) === 2, 'ArrowRight steps the reveal');

  // ---- every correction is on the line, each with its own comparison ------
  const cards = await p.$$('[role=tabpanel]:not([hidden]) .scard');
  ok(cards.length === 3, `${cards.length} corrections on the ladder fuel tab`);
  const srcs = await p.$$eval('[role=tabpanel]:not([hidden]) .scard .ba .after', i => i.map(x => x.getAttribute('src')));
  ok(srcs.length === 3 && new Set(srcs).size === 3, 'each correction shows its own after-image');
  ok((await p.$$eval('[role=tabpanel]:not([hidden]) .scard .ba .after', i => i.every(x => x.complete && x.naturalWidth > 0))),
    'every after-image resolves');
  const oneLine = await p.$$eval('[role=tabpanel]:not([hidden]) .scard', c2 => {
    const tops = c2.map(x => Math.round(x.getBoundingClientRect().top));
    return tops.every(t => Math.abs(t - tops[0]) < 2);
  });
  ok(oneLine, 'the corrections sit on one line');
  ok((await p.$eval('[role=tabpanel]:not([hidden]) .scard .warn', w => w.textContent)).includes('Limitation'),
    'a correction that is not the required one carries its limitation');
  ok((await p.$$eval('[role=tabpanel]:not([hidden]) .scard .warn', w => w.some(x => x.textContent.includes('Not from the inspection record')))),
    'the proposal that is not in the record says so');

  // ---- the masthead is gone and no status pill is shown ------------------
  ok((await p.$$('.mast')).length === 0, 'no masthead bar');
  ok((await p.$$('[role=tabpanel]:not([hidden]) .head .pill')).length === 0, 'no status pill on the finding');

  // ---- the photograph appears clean first, then annotated ----------------
  const figs = await p.$$eval('[role=tabpanel]:not([hidden]) .shot', sh => sh.map(x => !!x.querySelector('.ar')));
  ok(figs.length === 2 && figs[0] === false && figs[1] === true,
    'the clean photograph comes first, the annotated one second');

  if (shots) await p.screenshot({ path: path.join(SHOTS, 'ladder-top.png'), clip: { x: 0, y: 0, width: 1440, height: 1000 } });

  // ---- accordions ---------------------------------------------------------
  const dets = await p.$$('[role=tabpanel]:not([hidden]) details');
  for (const d of dets) await d.evaluate(x => x.open = true);
  await p.waitForTimeout(200);
  ok(dets.length >= 4, `${dets.length} analysis sections, all openable`);

  // ---- tab switch does not reload ----------------------------------------
  await p.evaluate(() => { window.__stillHere = true; });
  await p.click('#tab-sprinkler');
  await p.waitForTimeout(350);
  ok(await p.evaluate(() => window.__stillHere === true), 'switching tabs does not reload the page');
  ok(await p.$eval('#panel-sprinkler', x => !x.hidden) && await p.$eval('#panel-ladder', x => x.hidden),
    'the sprinkler panel is shown and the ladder panel hidden');

  // ---- the sprinkler tab's identification section -------------------------
  const idtext = await p.$eval('#panel-sprinkler .verdict', v => v.textContent);
  ok(/Unconfirmed/.test(idtext), 'identification is stated as unconfirmed');
  ok((await p.$$('#panel-sprinkler .diagram svg')).length === 1, 'the marking-location diagram is drawn');
  ok((await p.$$('#panel-sprinkler .ticks li')).length >= 4, 'the evidence-required checklist is present');

  // No invented product may appear anywhere on the page.
  const words = await p.evaluate(() => document.body.innerText);
  const brands = ['Tyco', 'Viking', 'Reliable', 'Victaulic', 'Globe', 'Senju', 'TY-FRB', 'TY3251'];
  const hit = brands.filter(b2 => words.includes(b2));
  ok(hit.length === 0, hit.length ? `invented product identification on the page: ${hit.join(', ')}` : 'no manufacturer or model is named anywhere');

  if (shots) {
    await p.screenshot({ path: path.join(SHOTS, 'sprinkler-top.png'), clip: { x: 0, y: 0, width: 1440, height: 1000 } });
    // Each panel has to be the visible one before its photograph can be shot.
    for (const [name, tab, sel] of [
      ['ladder-shot', '#tab-ladder', '#panel-ladder [role=tabpanel]:not([hidden]) .shot.on .ann'],
      ['sprinkler-shot', '#tab-sprinkler', '#panel-sprinkler [role=tabpanel]:not([hidden]) .shot.on .ann'],
      ['sprinkler-ident', '#tab-sprinkler', '#panel-sprinkler .ident'],
    ]) {
      await p.click(tab);
      await p.waitForTimeout(250);
      const h = await p.$(sel);
      if (h) { await h.scrollIntoViewIfNeeded(); await p.waitForTimeout(150); await h.screenshot({ path: path.join(SHOTS, name + '.png') }); }
    }
  }

  // ---- narrow layout ------------------------------------------------------
  await p.setViewportSize({ width: 768, height: 1024 });
  await p.waitForTimeout(300);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ok(overflow <= 1, `no horizontal overflow at 768px (${overflow}px)`);

  ok(errs.length === 0, errs.length ? `console errors: ${errs.slice(0, 3).join(' | ')}` : 'no console errors');

  await b.close();
  console.log(fails ? `\n${fails} failed` : '\nall good');
  process.exit(fails ? 1 : 0);
})();
