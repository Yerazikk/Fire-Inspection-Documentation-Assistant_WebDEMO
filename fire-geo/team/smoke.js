// team/smoke.js: a ten-second check that the page loads. Run after every change, before moving on.
//   node team/smoke.js [url] [screenshot]   default: the live page as the shell embeds it, /team/?embedded=1
// Headless only. Passes when there is no page error and the phone shows the camera screen.
const { chromium } = require('/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright');
const url = process.argv[2] || 'http://localhost:8861/team/?embedded=1';
(async () => {
  const kill = setTimeout(() => { console.log('SMOKE FAIL: timed out'); process.exit(2); }, 20000);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message + (e.stack ? ' | ' + String(e.stack).split('\n')[1] : '')));
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const frame = page.frames().find(f => /\/team\//.test(f.url())) || page.mainFrame();
    const info = await frame.evaluate(() => ({
      screen: (document.getElementById('phone') || {}).dataset ? document.getElementById('phone').dataset.screen : null,
      shutter: !!document.querySelector('.ph-shutter'), desk: !!(document.getElementById('desk') && document.getElementById('desk').children.length),
      map: !!document.querySelector('.mp-pin'), scroll: document.documentElement.scrollHeight > innerHeight + 1,
    }));
    const ok = !errors.length && info.screen === 'camera' && info.shutter && info.desk;
    console.log((ok ? 'SMOKE OK ' : 'SMOKE FAIL ') + JSON.stringify(info) + (errors.length ? '\n' + errors.join('\n') : ''));
    if (process.argv[3]) await page.screenshot({ path: process.argv[3] });
    process.exitCode = ok ? 0 : 1;
  } catch (e) { console.log('SMOKE FAIL: ' + e.message); process.exitCode = 1; }
  finally { clearTimeout(kill); if (browser) await browser.close(); }
})();
