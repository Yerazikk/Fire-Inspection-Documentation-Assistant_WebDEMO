// node test_ai.js [port] — drives one inspection to its documents and checks
// that the per-entry record, the report and the notice are really drafted:
// structured, grounded in the code library, and editable in place.
//
// The record assertions exist because of a real bug: the record screen used to
// render window.AI[kind] — fixture text keyed only by the kind of entry — so
// every note-only entry claimed the owner had cleaned the gutters, whatever the
// inspector had typed. These tests fail if that ever comes back.
//
// Needs the server running with a GEMINI_API_KEY. Without a key it still runs,
// and asserts the fallback path instead (template text, clearly marked).
const PORT = process.argv[2] || 8956;

(async () => {
  let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const { chromium } = require('playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 960 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const hold = async (sel, ms) => { const bb = await p.locator(sel).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); };

  const status = await (await fetch(`http://localhost:${PORT}/api/ai/status`)).json();
  // Whether drafting is really live is decided by the first document that comes
  // back, not by whether a key is configured: a key whose daily quota is spent
  // falls back exactly like no key at all, and the fallback path is worth
  // testing either way.
  let live = null;
  console.log(`-- key ${status.key ? 'present' : 'absent'} · ${status.codes} code sections`);
  ok(status.codes >= 15, 'the server exposes a code library');

  await p.goto(`http://localhost:${PORT}/`);
  await p.waitForSelector('#addr');

  // one stop, one violation entry with a spoken memo
  await p.fill('#addr', 'Ridgecrest'); await p.waitForSelector('#sugg [data-i]'); await p.keyboard.press('Enter');
  await p.waitForSelector('.srow'); await p.click('.srow .t');
  await p.waitForSelector('#newEntry'); await p.click('#newEntry');
  await p.waitForSelector('#shutter'); await p.click('#shutter');
  await p.waitForTimeout(400); await hold('#pill', 2600); await p.waitForTimeout(600);
  await p.click('#submit');
  await p.waitForSelector('#save', { timeout: 200000 });
  ok(true, 'entry scanned and record drafted');

  // --- the record is drafted from the note, not keyed off the entry kind ---
  const rec = await p.evaluate(() => ({
    source: S.rec.ai.source,
    memo: S.rec.memo,
    first: S.rec.ai.summary[0][1],
    blob: JSON.stringify(S.rec.ai).toLowerCase(),
    fixture: JSON.stringify(window.AI[S.rec.kindRaw] || {}),
    codes: (S.rec.ai.codes || []).map(c => c.c),
  }));
  live = rec.source === 'ai';
  console.log(`-- record source: ${rec.source}${live ? '' : ' (fallback path under test)'}`);
  if (live) {
    ok(rec.first !== JSON.parse(rec.fixture).summary[0][1], 'the record is not the window.AI fixture text');
    // The spoken memo is MEMOS.violation — ladder fuels within 30 ft.
    ok(/ladder|fuel|clearance|vegetation/.test(rec.blob), 'the record reflects the note that was actually recorded');
    ok(rec.codes.length > 0, 'the record cites the code library');
    ok(!/gutters were cleaned last week/i.test(rec.blob), 'no fixture text leaked into the record');
  } else {
    ok(/Template/.test(await p.textContent('.edcard[data-key="summary"] h4')), 'a template record says so on its face');
  }
  // --- a typed building-code note routes to the building corpus -----------
  // Same screen, a note about a sprinkler rather than vegetation. The code
  // library is picked per entry, so this must come back with sprinkler
  // sections and no defensible-space reasoning.
  if (live) {
    await p.click('[data-back]');
    const conf = await p.locator('.confirm').count();
    if (conf) await p.click('.confirm [data-i="2"]'); else await p.waitForSelector('#newEntry');
    await p.waitForSelector('#newEntry'); await p.click('#newEntry');
    await p.waitForSelector('#noteOnly'); await p.click('#noteOnly'); await p.waitForTimeout(900);
    await p.click('#pill'); await p.waitForTimeout(600);
    await p.fill('#memo', 'Sprinkler head in the back storage room is painted over');
    await p.click('#submit');
    await p.waitForSelector('#save', { timeout: 200000 });
    const b2 = await p.evaluate(() => JSON.stringify(S.rec.ai).toLowerCase());
    ok(/sprinkler/.test(b2), 'a sprinkler note produces a sprinkler record');
    ok(!/gutters were cleaned last week/i.test(b2), 'the note fixture text is gone for good');
    ok(!/defensible space|ladder fuel|oleander/.test(b2), 'a building finding is not grounded in vegetation code');
    await p.click('#save'); await p.waitForSelector('#newEntry');
    // back to the violation entry for the document run below
    await p.click('.entry >> nth=0'); await p.waitForSelector('#save', { timeout: 20000 });
  }

  // include two recommendations so the notice has options to carry
  await p.click('#openDeck'); await p.waitForSelector('#bYes');
  await p.click('#bYes'); await p.waitForTimeout(400); await p.click('#bYes'); await p.waitForTimeout(400);
  await p.click('#deckDone'); await p.waitForSelector('#save');
  await p.click('#save'); await p.waitForSelector('#finish');

  // Finish → the wrap-up card drafts both documents for real
  await p.click('#finish'); await p.waitForSelector('.wrap');
  ok(/Drafting/i.test(await p.locator('#wgo').textContent()), 'the wrap-up card reports it is drafting, not pretending');
  await p.waitForSelector('#wgo:not([disabled])', { timeout: 200000 });
  const wrapText = await p.locator('.wdocs').textContent();
  ok(/sections/.test(wrapText) || /template/.test(wrapText), 'the wrap-up card reports what each document actually came back as');
  await p.click('#wgo'); await p.waitForSelector('#docs');

  // ---- internal report ----
  await p.click('[data-go="report"]'); await p.waitForSelector('.edcard', { timeout: 200000 });
  const rSecs = await p.locator('.card.edcard').count();
  ok(rSecs >= 4, `report rendered as ${rSecs} editable sections`);
  const rText = await p.locator('#view').textContent();
  live = (await p.evaluate(() => S.report[S.cur].status)) === 'ok';
  console.log(`-- drafting is ${live ? 'LIVE' : 'FALLING BACK: ' + await p.evaluate(() => S.report[S.cur].error)}`);
  ok(/Marin County Code|4907\.2|1299\.03|4291/.test(rText), 'the report cites real sections from the code library');
  ok(!(await p.locator('.chip.red').count()), 'no citation outside the code library');
  ok(/Drafted/.test(rText) && /Source/.test(rText), 'the report says when it was drafted and by what');
  ok(live ? !/not about this property/i.test(rText) : /not.{0,4}about this property/i.test(rText),
    live ? 'the report is a real draft, not the template fallback' : 'the fallback says plainly that it is not about this property');
  ok((await p.locator('#refresh').count()) <= 1, 'at most one Refresh button, so it is reachable');

  // editable in place, and the edit lands in the document object
  const before = await p.locator('.card.edcard .ed').first().textContent();
  await p.locator('.card.edcard [data-edit]').first().click();
  await p.locator('.card.edcard .ed').first().fill('Edited by the inspector during review.');
  await p.locator('.card.edcard [data-edit]').first().click();
  const stored = await p.evaluate(() => { const d = S.report[S.cur].doc; const s = d.sections[0]; return s.body || (s.items && s.items[0]) || (s.fields && s.fields[0].value); });
  ok(stored === 'Edited by the inspector during review.' && before !== stored, 'editing a report section writes through to the document');
  ok((await p.locator('.revert').count()) === 1, 'an edited section offers Revert');

  // export produces a real file
  const dl = p.waitForEvent('download', { timeout: 10000 }).catch(() => null);
  await p.click('#export');
  const file = await dl;
  ok(!!file && /report-40-ridgecrest.*\.txt/.test(file.suggestedFilename()), 'Export writes a real file' + (file ? ' (' + file.suggestedFilename() + ')' : ''));

  // ---- notice to owner ----
  await p.click('[data-back]'); await p.waitForSelector('#docs');
  await p.click('[data-go="notice"]'); await p.waitForSelector('.mail', { timeout: 200000 });
  const nText = await p.locator('.mail').textContent();
  ok((await p.locator('.mail .msec').count()) >= 3, 'the notice renders as editable sections inside the letter');
  ok(/Option 1:/.test(nText), 'the options the inspector approved appear in the notice');
  ok(!/the app inserts|this brief|section plan/i.test(nText), 'no prompt instructions leaked into the letter');
  if (live) {
    ok(/November 17|10 days/.test(nText), 'the notice states the real Marin correction window, not a generic 45 days');
    ok(!/45 days/.test(nText), 'the stale 45-day window is gone');
  }
  ok(!/§|CCR|Fire Code/.test(await p.locator('.mail .msec .dlist, .mail .msec p').first().textContent()), 'the opening of the letter is in plain language, without code citations');

  // attaching documents leaves the draft stale and offers Refresh
  await p.click('.slot.cta[data-go="kb"], .ctl[data-go="kb"]');
  await p.waitForSelector('#attach:not([disabled])', { timeout: 20000 });
  await p.click('#attach'); await p.waitForSelector('.mail');
  ok((await p.locator('#refresh').count()) === 1, 'attaching documents marks the notice stale and offers Refresh');

  // hold to send, and the result is visible
  await p.waitForTimeout(200);
  await hold('#send', 1300); await p.waitForTimeout(300);
  ok(/Sent to/.test(await p.locator('#view').textContent()), 'sending the notice is visible in the UI afterwards');

  ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await p.screenshot({ path: 'ai-notice.png', fullPage: false });
  await b.close();
  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
