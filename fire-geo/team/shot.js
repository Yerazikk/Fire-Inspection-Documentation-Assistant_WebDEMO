// team/shot.js: screenshots of both devices and both findings.
//   node team/shot.js      writes /shots/team-*.png (or team/shots/ if that folder is not there)
// Headless, own scratch server, drafting on the test switch. TEAM_NEXT=1 shoots the staged files.
// Besides the screens it makes three kinds of sheet: the scan in four moments per scene, the verdict switch in four
// states on a short and a long rule name beside the top tab pill, each with the kit on and off.
process.env.TEAM_DRAFT_FAKE = '1';
const fs = require('fs'), path = require('path'), D = require('./drive.js');
const OUT = fs.existsSync(path.join(__dirname, '..', 'shots')) ? path.join(__dirname, '..', 'shots') : path.join(__dirname, 'shots');
const kill = setTimeout(() => { console.log('SHOT TIMEOUT'); process.exit(2); }, 420000);
(async () => {
  let browser, server; const made = [];
  try {
    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
    server = await require('./serve.js').start(8894, process.env.TEAM_NEXT === '1'); browser = await D.launch({ bars: true });      // with scrollbars drawn, as in a real window
    const URL = 'http://localhost:8894/team/', tb = label => '.tm-btn:has(span:text-is("' + label + '"))';
    const snap = async (page, name, clip) => { await page.screenshot(Object.assign({ path: path.join(OUT, 'team-' + name + '.png') }, clip ? { clip } : {})); made.push(name); };
    const rect = (page, sel, pad) => page.evaluate(([s, p]) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: Math.max(0, r.left - p), y: Math.max(0, r.top - p), width: r.width + 2 * p, height: r.height + 2 * p }; }, [sel, pad || 0]);
    /** lay several captures side by side, each with a caption under it, and save the sheet */
    const sheet = async (name, title, cells) => {
      const pg = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      await pg.setContent('<body style="margin:0;padding:28px;background:#e9ecf1;font:600 14px ui-rounded,system-ui,sans-serif;color:#262a31"><h1 style="font:650 18px ui-rounded,system-ui;margin:0 0 18px">' + title + '</h1><div style="display:flex;flex-wrap:wrap;gap:22px;align-items:flex-end">' + cells.map(c => '<figure style="margin:0"><img style="display:block;border-radius:10px;max-height:' + (c.h || 620) + 'px" src="data:image/png;base64,' + c.buf.toString('base64') + '"><figcaption style="margin-top:8px;color:#6b7280">' + c.cap + '</figcaption></figure>').join('') + '</div></body>');
      await pg.waitForTimeout(250); const b = await pg.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight })); await pg.setViewportSize({ width: Math.max(600, b.w), height: Math.max(300, b.h) }); await pg.waitForTimeout(150);
      await pg.screenshot({ path: path.join(OUT, 'team-' + name + '.png') }); made.push(name); await pg.close();
    };

    for (const look of ['on', 'off']) {
      const q = look === 'off' ? '?gleb=0' : '', tag = look === 'off' ? '-kit-off' : '';
      // ---- the scan, four moments per scene
      for (const scene of ['sprinkler', 'ladder']) {
        const s = await D.open(browser, URL + q), page = s.page; await D.phone.scene(page, scene); const clip = await rect(page, '.tm-phone', 6), cells = [];
        await page.click('.ph-shutter'); await D.waitScreen(page, 'scan');
        for (const [ms, cap] of [[330, 'Start: the picture goes dim, the line enters'], [620, 'Early: what it has passed stays dim, except what it found'], [800, 'Late: each thing found is lit in a window with its name'], [520, 'Resolved: what it found is lit; then all of it leaves in one fade']]) { await page.waitForTimeout(ms); cells.push({ buf: await page.screenshot({ clip }), cap }); }
        await sheet('scan-' + (scene === 'ladder' ? 'hedge' : scene) + tag, 'The scan, ' + (scene === 'ladder' ? 'hedge' : 'sprinkler') + (look === 'off' ? ' (kit off)' : ''), cells); await s.ctx.close();
      }
      // ---- the verdict switch: four states, a short and a long rule name, beside the top tab pill
      { const s = await D.open(browser, URL + q), page = s.page; await D.desk.seed(page, 'sprinkler', 'ross'); await page.waitForTimeout(500); const cells = [{ buf: await page.screenshot({ clip: await rect(page, '.shell-nav', 14) }), cap: 'The top tabs, for comparison', h: 70 }];
        for (const [key, name] of [['residential', 'short name'], ['required-system', 'long name']]) {
          const row = '.dk-row[data-key="' + key + '"]', clip = async () => rect(page, row, 6);
          await page.click(row + ' .dk-verdict'); await D.settle(page, 400); cells.push({ buf: await page.screenshot({ clip: await clip() }), cap: name + ': not decided, open', h: 70 });
          await page.evaluate(() => { const t = document.querySelector('.dk-toggle'); t.focus(); }); await page.keyboard.press('ArrowLeft'); await D.settle(page, 330); await page.evaluate(() => document.activeElement.blur()); cells.push({ buf: await page.screenshot({ clip: await clip() }), cap: name + ': pill on Violation', h: 70 });
          await page.evaluate(() => { document.querySelector('.dk-toggle').focus(); }); await page.keyboard.press('ArrowRight'); await D.settle(page, 330); await page.evaluate(() => document.activeElement.blur()); cells.push({ buf: await page.screenshot({ clip: await clip() }), cap: name + ': pill on Compliant', h: 70 });
          await page.click('.dk-toggle button[data-value="green"]'); await page.waitForTimeout(400); cells.push({ buf: await page.screenshot({ clip: await clip() }), cap: name + ': closing', h: 70 }); await D.settle(page, 900);
        }
        await sheet('verdict-switch' + tag, 'The verdict switch' + (look === 'off' ? ' (kit off)' : ''), cells); await s.ctx.close(); }
      // ---- the phone, screen by screen
      { const s = await D.open(browser, URL + q), page = s.page, clip = await rect(page, '.tm-phone', 6), cells = [], add = async cap => cells.push({ buf: await page.screenshot({ clip }), cap });
        await add('Camera'); await D.phone.shoot(page); await add('Add a note'); await page.click(D.LAYER + ' .ph-opt[data-i="1"] .ph-opt-edit'); await D.settle(page, 200); await add('The pencil: editing a note'); await page.keyboard.press('Escape'); await page.click(D.LAYER + ' .ph-opt[data-i="0"]');
        await D.phone.confirm(page); await add('The year'); await D.phone.type(page, 1996); await add('The year, typed'); await page.click(D.LAYER + ' .ph-attach'); await D.settle(page, 450); await add('An extra photo'); await page.click('.ph-sheet .ph-btn-quiet'); await D.settle(page, 380);
        await D.phone.send(page); await add('Sent'); await D.phone.next(page); await D.phone.scene(page, 'ladder'); await D.settle(page, 300); await add('Camera, hedge'); await D.phone.shoot(page); await D.phone.confirm(page); await add('The distance'); await D.phone.type(page, 14); await add('The distance, typed');
        await sheet('phone-screens' + tag, 'The phone, screen by screen' + (look === 'off' ? ' (kit off)' : ''), cells); await s.ctx.close(); }
    }

    // ---- the laptop, step by step, at 1440 x 900 and at 1800 x 1100, kit on; and the finding with the kit off
    for (const [w, hgt] of [[1440, 900], [1800, 1100]]) {
      const s = await D.open(browser, URL, { width: w, height: hgt }), page = s.page, t = w + '-';
      await snap(page, t + '01-rest');
      await D.phone.run(page, 'ladder', { pick: '10to30' }); await D.settle(page, 900); await snap(page, t + '02-finding');
      await D.desk.open(page, 'ladder-reach'); await snap(page, t + '03-rule-open'); await D.desk.open(page, 'ladder-reach');
      await D.desk.approve(page); await D.settle(page, 500); await snap(page, t + '04-corrections');
      await page.click('.dk-view.is-on .dk-fix-row:nth-child(3)'); await D.settle(page, 500); await snap(page, t + '05-another-correction');
      await page.click('.dk-view.is-on ' + tb('Write my own')); await D.settle(page, 400); await page.fill('.dk-view.is-on .dk-new .dk-input', 'Move the hedge back from the road'); await page.click('.dk-view.is-on .dk-new ' + tb('Write it up')); await page.waitForTimeout(2300); await page.click('.dk-view.is-on .dk-detail ' + tb('Mark where the problem is')); await D.settle(page, 300); await snap(page, t + '06-own-correction');
      await D.desk.next(page); await snap(page, t + '07-for-the-file');
      await page.evaluate(() => { document.querySelector('.dk-view.is-on .doc-scroll').scrollTop = 420; }); await D.settle(page, 250); await snap(page, t + '08-for-the-file-scrolled');
      await page.click('.dk-view.is-on .doc-frame > [aria-label="Enlarge"]'); await D.settle(page, 500); await snap(page, t + '08-for-the-file-enlarged'); await page.mouse.click(8, 8); await D.settle(page, 500);
      await D.desk.next(page); await snap(page, t + '09-for-the-owner');
      await page.evaluate(() => { document.querySelector('.dk-view.is-on .rp-scroll').scrollTop = 560; }); await D.settle(page, 250); await snap(page, t + '10-for-the-owner-options');
      await page.click('.dk-view.is-on .rp-act ' + tb('Email')); await D.settle(page, 450); await snap(page, t + '10b-the-email'); await page.keyboard.press('Escape'); await D.settle(page, 450);
      await page.evaluate(() => { document.querySelector('.dk-view.is-on .rp-scroll').scrollTop = 0; }); await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 500); await snap(page, t + '11-for-the-owner-enlarged');
      await page.evaluate(() => { document.querySelector('.rp-window.is-big .rp-scroll').scrollTop = 760; }); await D.settle(page, 250); await snap(page, t + '12-for-the-owner-enlarged-options');
      await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.mouse.click(8, 8); await D.settle(page, 500);
      await D.desk.publish(page); await snap(page, t + '13-published');
      await D.phone.next(page); await D.phone.scene(page, 'sprinkler'); await D.phone.run(page, 'sprinkler', {}); await page.click('.dk-item:nth-child(1) .dk-item-btn'); await D.settle(page, 500); await D.desk.approve(page); await D.settle(page, 500); await snap(page, t + '14-sprinkler-correction');
      await D.desk.next(page); await snap(page, t + '15-sprinkler-for-the-file');
      await D.desk.next(page); await snap(page, t + '16-sprinkler-for-the-owner');
      await page.evaluate(() => { const s = document.querySelector('.dk-view.is-on .rp-scroll'), g = s.querySelector('.rp-sol-title'); s.scrollTop = g.offsetTop - 30; }); await D.settle(page, 250); await snap(page, t + '17-sprinkler-for-the-owner-option');
      await page.evaluate(() => { document.querySelector('.dk-view.is-on .rp-scroll').scrollTop = 0; }); await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 500); await snap(page, t + '18-sprinkler-for-the-owner-enlarged'); await page.mouse.click(8, 8); await D.settle(page, 500);
      await s.ctx.close();
    }
    { const s = await D.open(browser, URL + '?gleb=0'), page = s.page; await D.phone.run(page, 'ladder', { pick: 'under10' }); await D.settle(page, 900); await snap(page, 'kit-off-finding'); await D.desk.approve(page); await D.settle(page, 500); await snap(page, 'kit-off-corrections'); await D.desk.next(page); await snap(page, 'kit-off-for-the-file'); await D.desk.next(page); await snap(page, 'kit-off-for-the-owner'); await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 500); await snap(page, 'kit-off-for-the-owner-enlarged'); await page.mouse.click(8, 8); await D.settle(page, 500); await D.desk.publish(page); await snap(page, 'kit-off-published'); await s.ctx.close(); }
    // ---- other window sizes, and a real phone
    for (const [w, hgt] of [[1280, 720], [2000, 1250]]) {
      const s = await D.open(browser, URL, { width: w, height: hgt }), page = s.page; await D.phone.run(page, 'ladder', { pick: '10to30' }); await D.settle(page, 900); await snap(page, w + 'x' + hgt + '-finding');
      if (w === 1280) { await D.desk.approve(page); await D.settle(page, 500); await snap(page, w + 'x' + hgt + '-corrections'); await D.desk.next(page); await snap(page, w + 'x' + hgt + '-for-the-file'); await D.desk.next(page); await snap(page, w + 'x' + hgt + '-for-the-owner'); await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 500); await snap(page, w + 'x' + hgt + '-for-the-owner-enlarged'); await page.mouse.click(8, 8); await D.settle(page, 500); await D.desk.publish(page); await snap(page, w + 'x' + hgt + '-published');
        await D.phone.next(page); await D.phone.run(page, 'sprinkler', {}); await page.click('.dk-item:nth-child(1) .dk-item-btn'); await D.settle(page, 500); await D.desk.approve(page); await D.settle(page, 500); await D.desk.next(page); await snap(page, w + 'x' + hgt + '-sprinkler-for-the-file'); await D.desk.next(page); await snap(page, w + 'x' + hgt + '-sprinkler-for-the-owner'); await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 500); await snap(page, w + 'x' + hgt + '-sprinkler-for-the-owner-enlarged'); }
      await s.ctx.close();
    }
    { const s = await D.open(browser, URL, { width: 390, height: 844 }), page = s.page; await snap(page, '390-01-camera'); await D.phone.shoot(page); await snap(page, '390-02-note'); await D.phone.confirm(page); await snap(page, '390-03-year'); await D.phone.send(page); await page.click('.tm-devseg button[data-value="desk"]'); await D.settle(page, 500); await snap(page, '390-04-laptop'); await D.desk.approve(page); await D.settle(page, 500); await snap(page, '390-05-how-to-fix-it'); await s.ctx.close(); }
    // the smallest window that still shows both devices: the date sits over its choices, beside the button
    { const s = await D.open(browser, URL, { width: 1180, height: 760 }), page = s.page; await D.phone.run(page, 'ladder', { pick: '10to30' }); await D.settle(page, 900); await D.desk.approve(page); await D.settle(page, 500); await snap(page, '1180x760-corrections'); await s.ctx.close(); }
    console.log('wrote ' + made.length + ' images to ' + OUT + ': team-' + made.join(', team-'));
  } catch (e) { console.log('SHOT ERR ' + String(e && e.message).slice(0, 700)); process.exitCode = 1; }
  finally { clearTimeout(kill); if (browser) await browser.close(); if (server) server.close(); }
})();
