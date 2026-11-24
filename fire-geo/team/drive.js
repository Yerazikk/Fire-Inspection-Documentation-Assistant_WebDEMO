// team/drive.js: drives the phone and the laptop for test.js and shot.js. Headless only.
const { chromium } = require('../tools/playwright')();
const LAYER = '.ph-layer:not(.leaving)';

/** headless Chrome. bars: true draws scrollbars in pictures (a headless browser leaves them out by default; the layout is the same either way) */
async function launch(o) { return chromium.launch(Object.assign({ channel: 'chrome', headless: true, args: ['--mute-audio'] }, o && o.bars ? { ignoreDefaultArgs: ['--hide-scrollbars'] } : {})); }
/** a page on the tab, with every page error and console error collected */
async function open(browser, url, o) {
  const opt = o || {}, ctx = await browser.newContext({ viewport: { width: opt.width || 1440, height: opt.height || 900 }, reducedMotion: opt.reduced ? 'reduce' : 'no-preference', deviceScaleFactor: opt.scale || 1 });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' | ' + String(e.stack || '').split('\n').slice(1, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.Team && document.getElementById('phone').dataset.screen === 'camera');
  await page.waitForTimeout(350);
  return { ctx, page, errors };
}
const screen = page => page.evaluate(() => document.getElementById('phone').dataset.screen);
const waitScreen = (page, name) => page.waitForFunction(n => document.getElementById('phone').dataset.screen === n, name);
/** wait, and then until nothing on the page is still moving (a slow machine draws few frames, and a move can end late). Moves that never end are left out. */
const settle = async (page, ms) => { await page.waitForTimeout(ms == null ? 420 : ms); await page.evaluate(() => new Promise(res => { const t0 = performance.now(); (function wait() { const busy = document.getAnimations().some(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity); if (!busy || performance.now() - t0 > 2000) res(); else setTimeout(wait, 30); })(); })).catch(() => {}); };
const primary = page => page.locator(LAYER + ' .ph-primary');

const phone = {
  /** which of the two example scenes is in front of the camera */
  async scene(page, scene) { if (await page.evaluate(() => window.Team.Phone.state.scene) !== scene) { await page.click('.ph-lens button[data-value="' + scene + '"]'); await settle(page, 300); } },
  /** shutter, then straight past the scan */
  async shoot(page, o) { await page.click('.ph-shutter'); await waitScreen(page, 'scan'); if (!(o && o.watch)) { await page.click(LAYER + ' [data-skip]'); } await waitScreen(page, 'note'); await settle(page); },
  async confirm(page) { await primary(page).click(); await waitScreen(page, 'questions'); await settle(page); },
  async pick(page, id) { await page.click(LAYER + ' .ph-pick[data-id="' + id + '"]'); await settle(page, 200); },
  /** type a number on the screen's own keys (the feet field opens its keys when pressed) */
  async type(page, digits) { if (await page.locator(LAYER + ' .ph-padwrap[hidden]').count()) { await page.click(LAYER + ' .ph-entry'); await settle(page, 380); } for (const d of String(digits)) await page.click(LAYER + ' .ph-key:text-is("' + d + '")'); await settle(page, 220); },
  async send(page) { await primary(page).click(); await waitScreen(page, 'sent'); await settle(page, 950); },
  /** the whole common case: photo, confirm, answer, send. Returns the number of taps it took. */
  async run(page, scene, o) {
    const opt = o || {}; let taps = 0;
    await phone.scene(page, scene);
    await phone.shoot(page); taps++;
    await phone.confirm(page); taps++;
    if (opt.pick) { await phone.pick(page, opt.pick); taps++; }
    if (opt.type != null) { await phone.type(page, opt.type); taps += String(opt.type).length; }
    await phone.send(page); taps++;
    return taps;
  },
  async next(page) { await primary(page).click(); await waitScreen(page, 'camera'); await settle(page); },
};
const desk = {
  seed: (page, scene, place, o) => page.evaluate(([s, p, x]) => window.Team.Desk.seed(s, p, x).id, [scene, place, o || null]),
  row: (page, key) => page.locator('.dk-view.is-on .dk-row[data-key="' + key + '"]'),
  order: page => page.evaluate(() => [...document.querySelectorAll('.dk-view.is-on .dk-row:not(.tm-leaving)')].map(n => n.dataset.key + ':' + n.dataset.verdict)),
  async open(page, key) { await page.click('.dk-view.is-on .dk-row[data-key="' + key + '"] .dk-row-open'); await settle(page, 380); },
  /** press the verdict, then a side of the switch it turns into (red or green) */
  async verdict(page, key, v) { await page.click('.dk-view.is-on .dk-row[data-key="' + key + '"] .dk-verdict'); await settle(page, 330); await page.click('.dk-toggle button[data-value="' + v + '"]'); await settle(page, 1000); },
  async approve(page) { await page.click('.dk-view.is-on .dk-foot .dk-primary'); await settle(page, 450); },
  next: async page => { await page.click('.dk-view.is-on .dk-foot .dk-primary'); await settle(page, 450); },
  /** the last step: Publish is on the owner's page itself */
  async publish(page) { await page.click('.dk-view.is-on .rp-act .dk-primary'); await settle(page, 600); },
  step: page => page.evaluate(() => { const V = window.Team.Desk.view(); return V ? V.step : null; }),
};
module.exports = { launch, open, screen, waitScreen, settle, primary, phone, desk, LAYER };
