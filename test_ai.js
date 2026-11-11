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
// Billed: one live transcription, six text drafts and two decks of generated
// photos. Disabled unless asked for with --live; see test_guard.js.
const gate = require('./test_guard');
gate('test_ai.js', 'drafts four records, a report and a notice');
const PORT = gate.port();

(async () => {
  let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const { chromium } = require('playwright');
  // The first entry's note is dictated, and the microphone is real, so the
  // browser gets a fake capture device playing test_memo.wav — a spoken
  // inspection note about ladder fuels within 30 ft. That recording is what
  // the record below has to reflect.
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-file-for-fake-audio-capture=' + require('path').join(__dirname, 'test_memo.wav')] });
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
  await p.waitForTimeout(400); await hold('#pill', 6200); await p.waitForSelector('.sheet2.type', { timeout: 60000 }); await p.waitForTimeout(400);
  const dictated = await p.inputValue('#memo');
  ok(/ladder fuel/i.test(dictated), 'the dictated note is a transcript of the recording: ' + JSON.stringify(dictated.slice(0, 60)));
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
    // The dictated memo, transcribed above: ladder fuels within 30 ft.
    ok(/ladder|fuel|clearance|vegetation/.test(rec.blob), 'the record reflects the note that was actually recorded');
    ok(rec.codes.length > 0, 'the record cites the code library');
    ok(!/gutters were cleaned last week/i.test(rec.blob), 'no fixture text leaked into the record');
  } else {
    ok(/Template/.test(await p.textContent('.edcard[data-key="summary"] h4')), 'a template record says so on its face');
  }
  // --- the photograph is evidence, not a yes/no flag ----------------------
  // The prompt used to say "photograph on file: yes (not provided to you)" and
  // then ask the model to write up a scene it had never seen. These assertions
  // say the picture now reaches it, and that what comes back is about that
  // picture: a reference photo whose subject appears in no note, no fixture
  // and no other prompt text, so only reading it can produce the words.
  if (live) {
    await p.click('[data-back]');
    const c0 = await p.locator('.confirm').count();
    if (c0) await p.click('.confirm [data-i="2"]'); else await p.waitForSelector('#newEntry');
    await p.waitForSelector('#newEntry'); await p.click('#newEntry');
    await p.waitForSelector('#upload'); await p.click('#upload');
    await p.waitForSelector('.picker.on');
    await p.click('[data-lib="v4"]');                      // a limb on the roof, gutters full of leaves
    await p.waitForTimeout(900);
    await p.click('#pill'); await p.waitForTimeout(600);
    await p.fill('#memo', '');                             // no note at all: the photo is the only evidence
    await p.click('#submit');
    await p.waitForSelector('#save', { timeout: 200000 });

    const seen = await p.evaluate(() => ({
      blob: JSON.stringify(S.rec.ai).toLowerCase(),
      scan: S.rec.scan,
      memo: S.rec.memo,
    }));
    ok(seen.memo === '', 'the entry really was saved with no note');
    ok(/roof|gutter|limb|branch|leaf|leaves|chimney|debris/.test(seen.blob),
      'with no note, the record still describes what is in the photograph');
    ok(!!seen.scan && seen.scan.source === 'model', 'the scan boxes were drawn by the model from the image');
    if (seen.scan) {
      const all = (seen.scan.boxes || []).concat(seen.scan.issue ? [seen.scan.issue] : []);
      ok(all.length >= 2, `the model pointed at ${all.length} things in the frame`);
      ok(all.every(x => x.box[0] + x.box[2] <= 100.5 && x.box[1] + x.box[3] <= 100.5), 'every box lies inside the frame');
      ok(all.some(x => x.box[2] < 90 || x.box[3] < 90), 'the boxes point at things, not the whole frame');
    }
    // The fixture boxes belong to assets/original.jpg and nothing else.
    ok(JSON.stringify(seen.scan) !== JSON.stringify(await p.evaluate(() => SCAN.violation)),
      'the hand-measured fixture boxes are not reused on a different photo');
    ok(!seen.scan || !((seen.scan.boxes || []).concat(seen.scan.issue || []).some(x => /not measured|\bft\b/.test(x.label) && !/≈/.test(x.label))),
      'no box states a distance as fact — a photograph cannot measure one');
  }

  // --- a photograph that contradicts the note is not quietly agreed with ---
  // The failure this guards: the model boxed the obstruction, saw it, and then
  // wrote "clear and unobstructed · Compliant" because the note said so. A
  // blocked exit signed off as compliant is the most costly thing this tool
  // could produce, so the disagreement has to reach the inspector's screen.
  if (live) {
    await p.click('[data-back]');
    const c1 = await p.locator('.confirm').count();
    if (c1) await p.click('.confirm [data-i="2"]'); else await p.waitForSelector('#newEntry');
    await p.waitForSelector('#newEntry'); await p.click('#newEntry');
    await p.waitForSelector('#upload'); await p.click('#upload');
    await p.waitForSelector('.picker.on');
    await p.click('[data-lib="v7"]');                      // an exit door piled with stored material
    await p.waitForTimeout(900);
    await p.click('#pill'); await p.waitForTimeout(600);
    await p.fill('#memo', 'Rear exit door checked, clear and unobstructed, compliant');
    await p.click('#submit');
    await p.waitForSelector('#save', { timeout: 200000 });

    const c = await p.evaluate(() => ({
      level: S.rec.ai.severity.determination, note: S.rec.ai.photoNote,
      scan: S.rec.scan, blob: JSON.stringify(S.rec.ai.summary).toLowerCase(),
      flagged: !!document.querySelector('.pdiff'),
    }));
    ok(c.level === 'Compliant', 'the determination still follows the inspector, not the model');
    ok(!!c.note && /block|obstruct|against the|piled|stacked|stored|debris|material/i.test(c.note),
      `the disagreement is recorded: "${(c.note || '(empty)').slice(0, 90)}"`);
    ok(c.flagged, 'and it is on the record screen where the inspector will see it');
    ok(/plastic|material|debris|packaging|stored|obstruct|piled|stack/.test(c.blob),
      'the summary describes the frame rather than restating the note');
    const red = c.scan && (c.scan.boxes || []).concat(c.scan.issue ? [c.scan.issue] : []).some(x => x.tone === 'red');
    ok(red, 'the obstruction is boxed red, not marked compliant because the note said so');
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
  // Either heading, depending on whether the finding has alternatives at all:
  // a single required correction is not labelled as one option out of one.
  ok(/Option 1:|What has to be done:/.test(nText), 'the corrections the inspector approved appear in the notice');
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
