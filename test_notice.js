// node test_notice.js [port] — who the notice to the owner goes to.
//
// Most properties come with an owner on the assessor roll and the notice
// addresses itself. An address geocoded on the spot does not, and before this
// the screen simply said the notice could not be sent: the recipient was a
// fact about the property rather than a field on the letter. It is a control
// now — the owner on file, a demo inbox, or an address typed in — and three
// things about that are worth holding still:
//
//   the gate     Hold to send turns on a deliverable address and at least one
//                approved option, and on nothing else.
//   the focus    Typing an address must not re-render the screen out from
//                under the field, and the address must survive the re-renders
//                that other controls do cause.
//   the gesture  The keyboard retracting as the inspector reaches for Send
//                drops the bar towards a finger that has not moved. The hold
//                has to live through that.
//   the exit     A completed send closes the letter; who it went to is on the
//                notice when it is opened again.
//
// Costs nothing: the document is the built-in template, so no model is called.
const { spawn } = require('child_process');
const PORT = Number(process.argv[2] || 8957);
const path = require('path');

// One property, one violation with an option included, and a template document
// dropped straight into the notice state — the screen under test, without the
// inspection that would normally reach it.
function seed(blankOwner) {
  const id = 'a1', a = addrOf(id);
  if (blankOwner) a.owner = { name: 'Owner of record', email: '' };
  S.route = [id]; S.cur = id; S.done.add(id); S.tab = 'today';
  S.entries[id] = [{ id: 'e1', n: 1, kind: 'violation', time: '10:12', note: 'Ladder fuels under the eave.', memo: 'Ladder fuels under the eave.',
    recs: [{ id: 'r1', title: 'Limb up to 6 ft', text: 'Remove the lower branches.', decision: 'in' }], ai: { summary: [['What', 'Ladder fuels']] } }];
  const ctx = DRAFTS.context('notice', a, entriesOf(id), { attachments: [] });
  S.notice[id] = { ver: 0, status: 'ready', doc: DRAFTS.fallback('notice', ctx, null), error: null, at: '10:20',
    attached: new Set(), kbDone: true, own: [], draft: false, sent: false, to: null, other: false };
  S.ver[id] = 0; go('location'); go('notice');
}

(async () => {
  let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const srv = spawn(process.execPath, [path.join(__dirname, 'serve.js'), String(PORT)], { stdio: 'ignore' });
  const done = code => { try { srv.kill(); } catch (_) {} process.exit(code); };
  try {
    const { chromium } = require('playwright');
    const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 960 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' }); await p.waitForSelector('#addr');

    // ---- an address with nobody on the roll ------------------------------
    await p.evaluate(seed, true); await p.waitForSelector('.mail');
    ok((await p.locator('#toPick').count()) === 1, 'the To: line is a control, not a label');
    ok(/No owner is on file/.test(await p.textContent('#view')), 'the screen says nobody is on the roll');
    ok(await p.locator('#send').isDisabled(), 'hold to send is greyed until a recipient is set');
    ok((await p.locator('#toPick option').allTextContents()).some(t => /test@gmail\.com/.test(t)), 'the demo inbox is one of the choices');

    await p.selectOption('#toPick', 'test@gmail.com'); await p.waitForTimeout(150);
    ok(!(await p.locator('#send').isDisabled()), 'choosing the demo inbox arms hold to send');
    ok(/to test@gmail\.com/.test(await p.textContent('.sub')), 'the header names the recipient');

    // ---- an address typed in --------------------------------------------
    await p.selectOption('#toPick', '__other'); await p.waitForTimeout(200);
    ok((await p.locator('#toCustom').count()) === 1, '“Another address…” opens a text box');
    ok(await p.locator('#send').isDisabled(), 'an empty box does not send');
    await p.fill('#toCustom', 'someone@else');
    ok(await p.locator('#send').isDisabled(), 'a half-typed address does not send');
    await p.fill('#toCustom', 'someone@else.org'); await p.waitForTimeout(50);
    ok(!(await p.locator('#send').isDisabled()), 'a complete address does');
    ok((await p.evaluate(() => document.activeElement.id)) === 'toCustom', 'typing does not cost the field its focus');

    // Attaching a document re-renders the screen and must not undo the choice.
    await p.evaluate(() => { noticeState().attached.add(KB[0].id); render(); }); await p.waitForTimeout(100);
    ok((await p.inputValue('#toCustom')) === 'someone@else.org', 'the typed address survives a re-render');
    ok(!/changed since this draft/i.test(await p.textContent('#view')), 'attaching a document does not stale the draft');

    // ---- the hold, across the keyboard dropping --------------------------
    await p.waitForTimeout(600);
    const bb = await p.locator('#send').boundingBox();
    await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
    await p.mouse.down(); await p.waitForTimeout(1100); await p.mouse.up(); await p.waitForTimeout(700); // the letter slides out over half a second
    ok((await p.locator('.mail').count()) === 0 && (await p.locator('#toMap').count()) === 1, 'a completed send closes the letter back to the address');
    await p.click('[data-go="notice"]'); await p.waitForSelector('.mail');
    ok(/Sent to someone@else\.org/.test(await p.textContent('#view')), 'the notice goes to the typed address');

    // ---- the ordinary case is untouched ----------------------------------
    await p.reload(); await p.waitForSelector('#addr'); await p.evaluate(seed, false); await p.waitForSelector('.mail');
    ok(!/No owner is on file/.test(await p.textContent('#view')), 'an owner on the roll draws no banner');
    ok(!(await p.locator('#send').isDisabled()), 'and sends without anything being chosen');
    ok((await p.inputValue('#toPick')) === 'm.okafor@example.com', 'the roll address is the one selected');

    ok(errs.length === 0, 'no page errors' + (errs.length ? ': ' + errs.join(' | ') : ''));
    await b.close();
  } catch (e) { ok(false, 'ran: ' + e.message); }
  console.log(fails ? `\n${fails} FAILED` : '\nnotice recipient: all good');
  done(fails ? 1 : 0);
})();
