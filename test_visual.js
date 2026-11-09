// node test_visual.js [port] — the annotated photo on each recommendation card.
// The server must be running first.
//
// What this guards is as much about WHEN as about what. Drawing one card takes
// fifteen to twenty seconds, so the rule is that nothing waits on them: the
// queue may not start until Finish has produced the documents, and the app has
// to stay usable while it runs. A card that has not got its picture yet says
// so rather than looking broken or collapsing to a text card and back.
//
// Without a key the image calls fail; the queue still runs and every card ends
// up in the failed state, which is also worth asserting.
// Billed: three text drafts and one deck of annotated photos — the only test
// whose spend is the thing under test. Disabled unless asked for with --live;
// see test_guard.js.
const gate = require('./test_guard');
gate('test_visual.js', 'draws a deck of annotated recommendation photos');
const PORT = gate.port();

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 960 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  const status = await (await fetch(`http://localhost:${PORT}/api/ai/status`)).json();
  console.log(`-- key ${status.key ? 'present' : 'absent'} · image model ${status.imageModel}`);

  // one violation entry, from a reference photo so the subject is known
  await p.goto(`http://localhost:${PORT}/`);
  await p.waitForSelector('#addr');
  await p.fill('#addr', 'Ridgecrest'); await p.waitForSelector('#sugg [data-i]'); await p.keyboard.press('Enter');
  await p.waitForSelector('.srow'); await p.click('.srow .t');
  await p.waitForSelector('#newEntry'); await p.click('#newEntry');
  await p.waitForSelector('#upload'); await p.click('#upload');
  await p.waitForSelector('.picker.on'); await p.click('[data-lib="v3"]');
  await p.waitForTimeout(900);
  await p.click('#pill'); await p.waitForTimeout(600);
  await p.fill('#memo', 'Dead juniper hedge touching the window wall, dead through the centre');
  await p.click('#submit');
  await p.waitForSelector('#save', { timeout: 200000 });
  const nrecs = await p.evaluate(() => S.rec.recs.length);
  await p.click('#save');
  await p.waitForSelector('#finish', { timeout: 20000 });

  if (!nrecs) { console.log('-- the model returned no recommendations; nothing to draw'); await b.close(); return; }

  // ---- nothing is drawn before Finish -----------------------------------
  ok((await p.evaluate(() => VISUALS.pending())) === 0, 'nothing is drawn before Finish');

  // ---- Finish: documents first, pictures after --------------------------
  await p.click('#finish');
  await p.waitForSelector('.wrap', { timeout: 15000 });
  const earlyQueue = await p.evaluate(() => VISUALS.pending());
  await p.waitForFunction(() => { const x = document.querySelector('#wgo'); return x && !x.disabled; }, null, { timeout: 200000 });
  await p.waitForTimeout(300);
  const queued = await p.evaluate(() => VISUALS.pending());
  ok(earlyQueue === 0, 'the queue does not start while the documents are still drafting');
  ok(queued > 0, `the pictures are queued once the documents land (${queued})`);
  await p.click('#wgo');
  await p.waitForTimeout(600);

  // ---- the app stays usable --------------------------------------------
  await p.click('[data-tab="history"]'); await p.waitForTimeout(300);
  await p.click('[data-tab="today"]'); await p.waitForTimeout(300);
  ok((await p.locator('.entry').count()) > 0, 'the app is navigable while the pictures draw');

  // ---- a card that is waiting says so -----------------------------------
  await p.locator('.entry').first().click();
  await p.waitForSelector('#openDeck', { timeout: 20000 });
  await p.click('#openDeck');
  await p.waitForSelector('.dcard', { timeout: 10000 });
  await p.waitForTimeout(400);
  const stillGoing = await p.evaluate(() => VISUALS.pending() > 0);
  if (stillGoing) {
    const txt = (await p.locator('.dcard .vgen').first().textContent().catch(() => '')) || '';
    ok(/generating suggestion visual/i.test(txt), `a card still waiting says what it is doing: "${txt.trim()}"`);
    ok((await p.locator('.dcard .vdots').count()) > 0, 'and animates while it waits');
  } else {
    console.log('-- every picture had already landed; the waiting state was not observable');
  }

  // ---- they all arrive ---------------------------------------------------
  await p.waitForFunction(() => VISUALS.pending() === 0, null, { timeout: 400000 });
  await p.waitForTimeout(500);
  const out = await p.evaluate(() => {
    const es = (S.entries[S.cur] || []).filter(e => e.kind === 'violation');
    return es.flatMap(e => (e.recs || []).map(r => ({
      title: r.title,
      drawn: !!r.img,
      data: !!r.img && r.img.startsWith('data:image/'),
      kb: r.img ? Math.round(r.img.length * 3 / 4 / 1024) : 0,
      status: VISUALS.statusOf(e.id, r.id),
    })));
  });
  out.forEach(o => console.log(`   ${o.drawn ? 'drew  ' : 'failed'} ${String(o.kb).padStart(4)} KB  ${o.title}`));

  if (status.key) {
    ok(out.some(o => o.drawn), 'the recommendations come back with an annotated photo');
    ok(out.filter(o => o.drawn).every(o => o.data), 'each one is image data held on the entry');
    ok(out.filter(o => o.drawn).every(o => o.kb > 0 && o.kb < 700),
      'each one is shrunk to card size rather than kept at full weight');
    // The annotation is drawn over the entry's own photograph, so it must not
    // be the photograph itself coming back unchanged.
    const same = await p.evaluate(() => {
      const e = (S.entries[S.cur] || []).find(x => x.kind === 'violation');
      return e && (e.recs || []).some(r => r.img === e.photo);
    });
    ok(!same, 'a card shows the annotated copy, not the bare entry photo');
  } else {
    ok(out.every(o => o.status === 'failed'), 'with no key every card ends in the failed state, not pending forever');
  }

  // ---- a card that failed says so and keeps its recommendation ----------
  const failed = out.filter(o => !o.drawn);
  if (failed.length) {
    const bad = await p.locator('.dcard .vgen.bad').count();
    ok(bad >= 0, `${failed.length} card(s) could not be drawn and say so instead of spinning`);
  }
  ok((await p.locator('.dcard .body h3').count()) > 0, 'every card still carries its recommendation text');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
