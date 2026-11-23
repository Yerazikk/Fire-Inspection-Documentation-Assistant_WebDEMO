// node shot.js <out.png> [--path "/?photo=sprinkler"] [--w 1440] [--h 900] [--eval "js run in the page"] [--wait 700] [--reduce] [--full]
// Headless screenshot of the running server (PORT env, default 8861). Never opens a window.
const { chromium } = require('./tools/playwright')();
const a = process.argv.slice(2), opt = n => { const i = a.indexOf('--' + n); return i >= 0 ? a[i + 1] : null; }, flag = n => a.includes('--' + n);
const out = a[0]; if (!out || out.startsWith('--')) { console.log('usage: node shot.js <out.png> [--path /] [--w 1440] [--h 900] [--eval js] [--wait ms] [--reduce] [--full]'); process.exit(2); }
const killer = setTimeout(() => { console.log('hard timeout'); process.exit(1); }, 60000);
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
  try {
    const ctx = await b.newContext({ viewport: { width: +(opt('w') || 1440), height: +(opt('h') || 900) }, deviceScaleFactor: +(opt('dpr') || 1), reducedMotion: flag('reduce') ? 'reduce' : 'no-preference', hasTouch: +(opt('w') || 1440) < 700 });
    const p = await ctx.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console error:', m.text().slice(0, 300)); }); p.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url()); });
    await p.goto('http://localhost:' + (process.env.PORT || 8861) + (opt('path') || '/'), { waitUntil: 'load' });
    await p.waitForFunction(() => document.body.dataset.ready === '1' || !document.querySelector('#board'), null, { timeout: 8000 }).catch(() => console.log('page never became ready'));
    await p.waitForTimeout(500);
    if (opt('eval')) console.log('eval ->', JSON.stringify(await p.evaluate(opt('eval'))));
    await p.waitForTimeout(+(opt('wait') || 700));
    await p.screenshot({ path: out, fullPage: flag('full') }); console.log('wrote', out);
  } finally { await b.close(); clearTimeout(killer); }
})();
