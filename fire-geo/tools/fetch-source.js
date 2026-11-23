// node tools/fetch-source.js <url> <out.txt> [waitMs]
// Opens one public page in headless Chrome (no window), waits for it to render, and saves its
// visible text so a citation can be checked against the official source. One page per run,
// no crawling, no header spoofing. If the site shows a bot challenge, that is recorded and we stop.
const { chromium } = require('/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright');
const fs = require('fs');
const [url, out, wait] = process.argv.slice(2);
setTimeout(() => { console.log('hard timeout'); process.exit(1); }, 90000);
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
  try {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const resp = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => ({ status: () => 'ERR ' + e.message.slice(0, 80) }));
    await p.waitForTimeout(+(wait || 9000));
    const title = await p.title();
    const text = await p.evaluate(() => document.body ? document.body.innerText : '');
    fs.writeFileSync(out, 'URL: ' + url + '\nTITLE: ' + title + '\nSTATUS: ' + (resp && resp.status ? resp.status() : '?') + '\n\n' + text);
    console.log('status', resp && resp.status ? resp.status() : '?', '| title:', title.slice(0, 90), '| chars:', text.length);
  } finally { await b.close(); }
})();
