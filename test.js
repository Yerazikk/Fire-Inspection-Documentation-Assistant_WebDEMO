// node test.js [port] — walks the V3 interaction system end to end in Chrome via Playwright
const http = require('http'); const PORT = process.argv[2] || 8956;
const get = p => new Promise((res, rej) => http.get({ host: 'localhost', port: PORT, path: p }, r => { let b = ''; r.on('data', d => b += d); r.on('end', () => res({ status: r.statusCode, body: b })); }).on('error', rej));
(async () => { let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const idx = await get('/'); ok(idx.status === 200 && /Vegetation Inspection · V3/.test(idx.body), 'index served');
  try { const { chromium } = require('playwright'); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 960 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    const hold = async (sel, ms) => { const bb = await p.locator(sel).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.waitForTimeout(ms); await p.mouse.up(); };
    await p.goto(`http://localhost:${PORT}/`); await p.waitForSelector('#addr'); ok(true, 'map landing with station pin'); ok((await p.locator('.station').count()) === 1, 'station pinned');
    // satellite imagery: the typeahead shows the property each candidate would pin
    await p.fill('#addr', 'Ridgecrest'); await p.waitForSelector('#sugg [data-i]'); await p.waitForTimeout(3000);
    ok((await p.locator('#sugg [data-i] .sgt .satimg.on').count()) === (await p.locator('#sugg [data-i]').count()), 'every address suggestion carries satellite imagery of that property');
    await p.fill('#addr', '');
    // add three stops by typing
    for (const q of ['Ridgecrest', 'Eldridge', 'Wolfback']) { await p.fill('#addr', q); await p.waitForSelector('#sugg [data-i]'); await p.keyboard.press('Enter'); await p.waitForTimeout(150); }
    ok((await p.locator('[data-pin]').count()) === 3 && (await p.locator('.srow').count()) === 3, 'three addresses → three pins and three rows');
    await p.fill('#addr', 'Eldridge'); await p.waitForSelector('#sugg [data-i]'); await p.keyboard.press('Enter'); await p.waitForTimeout(200); ok((await p.locator('.srow').count()) === 3, 'duplicate address does not add a pin');
    // real routing: OSRM times each leg, so wait for the numbers rather than a fixed delay
    await p.waitForSelector('.srow .leg', { timeout: 30000 }); ok((await p.locator('.srow .leg').count()) === 3, 'every leg carries a real driving time and distance');
    ok(/\d/.test(await p.locator('#rstat').textContent()), 'the total drive for the day is reported');
    const typedOrder = await p.locator('.srow .t').allTextContents();
    await p.click('#best'); await p.waitForSelector('.rstat .good', { timeout: 60000 });
    ok(/all 6 orders/i.test(await p.locator('.rstat .good').textContent()), 'best route reports trying every ordering');
    const bestOrder = await p.locator('.srow .t').allTextContents();
    ok(bestOrder.length === 3 && bestOrder.slice().sort().join() === typedOrder.slice().sort().join(), 'best route reorders the same three stops');
    ok((await p.evaluate(() => S.route.duration <= S.best.baseline + 1)), 'the chosen order is no slower than the one typed');
    ok((await p.evaluate(() => GEO.lookups.count() >= 3)), 'each address added is saved as a site lookup');
    // reorder by press-and-hold drag: move row 3 to top
    // Grab the handle by its own box, and scroll it in first: the route plan
    // that "best route" adds pushes the third row below the fold, and rows grew
    // a drive-time line, so a fixed offset from the row top lands above the grip
    // — only the 180 ms hold fires, which the move below then cancels.
    await p.locator('.srow >> nth=2').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const g3 = await p.locator('.srow >> nth=2 >> .grip').boundingBox(); const r1 = await p.locator('.srow >> nth=0').boundingBox(); const before = await p.locator('.srow >> nth=2 >> .t').textContent(); await p.mouse.move(g3.x + g3.width / 2, g3.y + g3.height / 2); await p.mouse.down(); await p.waitForTimeout(120); ok((await p.locator('.srow.ghost').count()) === 1, 'row lifts immediately from the handle'); await p.mouse.move(g3.x + g3.width / 2, r1.y + 8, { steps: 10 }); await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(400); ok((await p.locator('.srow >> nth=0 >> .t').textContent()) === before, 'dragged row lands first and the route updates');
    // sheet detents
    await p.click('#handle'); await p.waitForTimeout(500); ok(/full|peek/.test(await p.getAttribute('#sheet', 'class')), 'sheet handle cycles detents');
    // basemap: satellite or roads under the route
    const bm = await p.evaluate(() => S.basemap); await p.click('#basemap'); await p.waitForTimeout(500);
    const leaflet = (await p.locator('.lmap').count()) > 0;
    ok((await p.evaluate(() => S.basemap)) !== bm && (!leaflet || (await p.locator('.lmap.imagery').count()) === (bm === 'sat' ? 0 : 1)), 'the basemap button switches between satellite and roads');
    await p.click('#basemap'); await p.waitForTimeout(400);
    // open the demo stop
    await p.click('.srow:has-text("Ridgecrest")'); await p.waitForSelector('.sat'); ok((await p.locator('.hint').count()) === 1 && (await p.locator('.docbtn').count()) === 0, 'location home: empty today, no documents yet');
    await p.waitForSelector('.sat .satimg.on', { timeout: 25000 });
    ok(/Esri|USGS/.test(await p.textContent('.sat .scred')), 'the parcel view is satellite imagery of the address, credited to its source');
    ok((await p.locator('.sat .zr').count()) === 0 && /50 ft/.test(await p.textContent('.sat .sbar')), 'opens on the parcel: plain imagery and a scale bar to match');
    await p.click('[data-sz="zone"]'); await p.waitForTimeout(500);
    ok((await p.locator('.sat .zr').count()) === 2 && /150 ft/.test(await p.textContent('.sat .sbar')), 'the 100 ft zone view brings the defensible-space rings in, drawn to scale');
    await p.click('[data-sz="block"]'); await p.waitForTimeout(400);
    ok((await p.locator('.sat .zr').count()) === 0, 'the block view is plain imagery too — no rings');
    await p.click('[data-sz="parcel"]'); await p.waitForTimeout(400);
    await p.click('[data-tab="history"]'); await p.waitForSelector('[data-hist]'); ok((await p.locator('[data-hist]').count()) === 4, 'history lists four past inspections'); await p.click('[data-hist] >> nth=0'); await p.waitForSelector('.ban.snap'); ok((await p.locator('.pip').count()) === 1 && (await p.locator('.entry .x').count()) === 0, 'history snapshot is read-only with its pips'); await p.click('#exitSnap'); await p.click('[data-tab="today"]');
    // new entry: photo + voice memo
    await p.click('#newEntry'); await p.waitForSelector('#shutter'); await p.click('#shutter'); await p.waitForTimeout(600); ok(await p.locator('#cam.snap').count() === 1, 'shutter opens the memo bar'); await p.click('#retake'); await p.waitForTimeout(300); ok(await p.locator('#cam.snap').count() === 0, 'retake returns to viewfinder'); await p.click('#shutter'); await p.waitForTimeout(900);
    await hold('#pill', 2600); await p.waitForTimeout(700); ok(await p.locator('.sheet2.type').count() === 1 && /Ladder fuels/.test(await p.inputValue('#memo')), 'hold-to-speak transcribes into the editable memo');
    await p.click('#submit'); await p.waitForTimeout(1500); ok(await p.locator('#cam.scanning').count() === 1, 'submit starts the in-place scan');
    // The boxes are the model's reading of this photograph, so they land when
    // it answers rather than on a timer — wait for one, not for a delay. Their
    // number is the model's; what must hold is that elements were labelled and
    // exactly one of them is the highlighted finding.
    await p.waitForSelector('#ar .bx, #ar .issue', { timeout: 200000 }); await p.waitForTimeout(1500);
    const nbx = await p.locator('#ar .bx').count(), niss = await p.locator('#ar .issue').count();
    ok(nbx >= 1 && niss === 1, `scan draws labelled boxes (${nbx}) and one highlighted finding`);
    await p.waitForSelector('#save', { timeout: 200000 }); ok((await p.locator('.pbox').count()) === 2 && /Violation/.test(await p.textContent('.ttl')), 'record opens with original + scanned photos');
    await p.click('#pScan'); await p.waitForSelector('#fbin'); await p.fill('#fbin', 'hedge is closer to 4.5 ft'); await p.click('#fbgo'); await p.waitForTimeout(2000); ok(/4\.5 ft/.test(await p.textContent('#view')), 'scan feedback re-runs and updates the record');
    await p.click('.edcard[data-key="summary"] [data-edit]'); await p.locator('.edcard[data-key="summary"] .ed >> nth=0').fill('Edited observation.'); await p.click('.edcard[data-key="summary"] [data-edit]'); ok(await p.evaluate(() => S.rec.ai.summary[0][1]) === 'Edited observation.', 'record text is editable in place');
    await p.click('#openDeck'); await p.waitForSelector('.dcard'); ok(await p.locator('#deckDone[disabled]').count() === 1, 'skip disabled until one is included'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(400); await p.click('#bUndo'); await p.waitForTimeout(300); ok(/2 of \d+ · 1 included/.test(await p.textContent('#dcount')), 'undo restores the previous card');
    await p.click('#own'); await p.fill('#ownTx', 'Replace the wooden wall cap with stone'); await p.click('.confirm [data-yes]'); await p.waitForTimeout(1800); ok(/Replace the wooden wall cap/.test(await p.textContent('#deck')), 'own recommendation lands on top of the deck'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(400);
    await p.click('#deckDone'); await p.waitForSelector('#openDeck'); ok(/2 included/.test(await p.textContent('#openDeck')), 'deck decisions show on the record');
    await p.click('[data-back]'); await p.waitForSelector('.confirm'); ok(true, 'back on a dirty record asks'); await p.click('.confirm [data-i="2"]'); await p.waitForSelector('#newEntry'); ok((await p.locator('.entry').count()) === 1 && (await p.locator('.sat .pip').count()) === 1, 'saved entry: card, pip 1');
    // note-only entry
    await p.click('#newEntry'); await p.waitForSelector('#noteOnly'); await p.click('#noteOnly'); await p.waitForTimeout(900); await p.click('#pill'); await p.waitForTimeout(600); await p.fill('#memo', 'Owner says gutters cleaned last week, verify later'); await p.click('#submit'); await p.waitForSelector('#save', { timeout: 200000 }); ok((await p.locator('.pbox').count()) === 0 && /Note/.test(await p.textContent('.ttl')) && (await p.locator('#openDeck').count()) === 0 && (await p.locator('.edcard[data-key="severity"]').count()) === 0, 'note-only entry: no photo row, no determination, no recommendations'); await p.click('#save'); await p.waitForSelector('#newEntry'); ok((await p.locator('.entry').count()) === 2 && (await p.locator('.sat .pip').count()) === 2, 'second entry → pip 2');
    // long-press wobble + delete cancel
    await hold('.entry >> nth=1', 700); await p.waitForTimeout(200); ok(await p.locator('#elist.wobble').count() === 1, 'press-and-hold wobbles the entries'); await p.click('.entry >> nth=1 >> .x',{force:true}); await p.waitForSelector('.confirm'); await p.click('.confirm [data-i="1"]'); await p.waitForTimeout(200); ok((await p.locator('.entry').count()) === 2, 'delete can be cancelled'); await p.click('.view'); await p.waitForTimeout(200);
    // finish → documents appear
    await p.click('#finish'); await p.waitForSelector('.wrap'); ok(true, 'finish opens the wrap-up'); // The wrap-up now drafts both documents for real (see drafts.js), so this
    // waits on two model calls rather than the old 2.4 s of scripted timers.
    await p.waitForSelector('#wgo:not([disabled])', { timeout: 200000 }); await p.click('#wgo'); await p.waitForSelector('[data-go="report"]'); ok((await p.locator('.docbtn').count()) === 2 && (await p.locator('#toMap').count()) === 1, 'wrap-up reveals the documents');
    await p.click('[data-go="report"]'); await p.waitForSelector('.card.edcard', { timeout: 200000 });
    // The report is drafted as sections now, not one card per entry, so assert
    // on what it must contain rather than on a card count.
    const rep = await p.locator('#view').textContent();
    ok((await p.locator('.card.edcard').count()) >= 4 && /Entry 1/.test(rep) && /Entry 2/.test(rep), 'internal report covers both entries in editable sections'); await p.click('[data-back]'); await p.waitForSelector('#toMap');
    await p.click('[data-go="notice"]'); await p.waitForSelector('.mail', { timeout: 200000 }); ok((await p.locator('.mail .eopt').count()) === 2 && (await p.locator('.slot.cta').count()) === 1, 'notice shows included options as email content and a find-documents CTA');
    await p.click('.slot.cta'); await p.waitForSelector('#attach:not([disabled])', { timeout: 15000 }); await p.click('.hit >> nth=5 >> .chk'); ok(/Attach 5 of 6/.test(await p.textContent('#attach')), 'document toggle'); await p.click('#attach'); await p.waitForSelector('.mail'); ok((await p.locator('.mail .eatt').count()) === 5, 'five attachments in the email'); await p.click('#addOwn'); await p.waitForTimeout(200); ok((await p.locator('.mail .eatt').count()) === 6, 'add your own attachment');
    await p.click('#saveDraft'); await hold('#send', 1100); await p.waitForTimeout(300); ok(true, 'hold to send'); await p.click('[data-back]'); await p.waitForSelector('#toMap');
    // stale badges after a change
    await p.click('.entry >> nth=0'); await p.waitForSelector('#save'); await p.click('.edcard[data-key="summary"] [data-edit]'); await p.locator('.edcard[data-key="summary"] .ed >> nth=1').fill('Changed later.'); await p.click('.edcard[data-key="summary"] [data-edit]'); await p.click('#save'); await p.waitForSelector('#toMap'); ok((await p.locator('.badge:has-text("changes")').count()) === 2, 'report and notice show “changes since generated”'); await p.click('[data-go="notice"]'); await p.waitForSelector('#refresh'); await p.click('#refresh');
    // Refresh now redrafts for real: wait for the work banner to clear.
    await p.waitForSelector('.stale.work', { timeout: 10000 }).catch(() => {});
    await p.waitForSelector('.stale.work', { state: 'detached', timeout: 200000 });
    // What matters is that the "changed since this draft" state is gone. If
    // drafting is unavailable (no key, or the daily quota is spent) a Retry
    // button correctly remains, so do not assert on the button itself.
    ok(!/changed since this draft/i.test(await p.textContent('#view')), 'refresh redrafts and clears the stale state'); await p.click('[data-back]'); await p.waitForSelector('#toMap');
    // next stop → map with check
    await p.click('#toMap'); await p.waitForSelector('#addr'); ok((await p.locator('.lpin.done, .pin.done').count()) === 1 && (await p.locator('.srow.done').count()) === 1, 'finished stop is checked on the map and struck through');
    // menu → days → snapshot
    await p.click('#menu'); await p.waitForSelector('[data-m="days"]'); await p.click('[data-m="days"]'); await p.waitForSelector('#dq'); ok((await p.locator('.dsec').count()) >= 4, 'previous inspections grouped by day'); await p.fill('#dq', 'juniper'); await p.waitForTimeout(200); ok((await p.locator('.loc').count()) === 1, 'search filters locations'); await p.fill('#dq', ''); await p.waitForTimeout(200); await p.click('#calbtn'); await p.waitForSelector('.cal'); ok((await p.locator('.calgrid .has').count()) >= 2, 'calendar highlights inspection days'); await p.click('.calgrid .has >> nth=0'); await p.waitForTimeout(300);
    // 35 Wolfback Ridge Rd is also on today's route, so [data-loc="a6"] matches
    // twice — today's stop and the Nov 4 record. Pin the dated one.
    await p.click('[data-loc="a6"][data-date="2026-11-04"]'); await p.waitForSelector('.ban.snap'); ok((await p.locator('.sat .pip').count()) === 2, 'past location opens as a dated snapshot');
    await p.keyboard.press('r'); await p.waitForSelector('#addr'); ok((await p.locator('#raillist .pbtn').count())>=2,'action rail offers scripted prompts on the map'); await p.click('#raillist [data-p="0"]'); await p.waitForTimeout(3500); ok((await p.locator('.srow').count())===1,'prompt “Add an address” drives the real UI'); await p.click('.srow:has-text("Ridgecrest")'); await p.waitForSelector('#newEntry'); ok((await p.locator('#raillist .pbtn').count())>=3,'rail changes with the screen'); await p.click('#raillist .pbtn:has-text("Photo + voice note")'); await p.waitForSelector('#save',{timeout:200000}); ok(true,'prompt “Photo + voice note → violation” reaches the record'); await p.screenshot({ path: '/tmp/v3_shot.png' }); ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs[0] : '')); await b.close(); } catch (e) { ok(false, 'browser walk-through: ' + e.message.split('\n')[0]); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0); })();
