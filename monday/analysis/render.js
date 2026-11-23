// node monday/analysis/render.js
//
// Renders positioning.html to a PDF next to it. Letter, 0.6in margins — the
// stylesheet sets the type and the page breaks, Chromium only paginates.
//
// Free: no API calls, nothing billed.

const path = require('path');
const { chromium } = require('playwright');

const SRC = 'file:///' + path.join(__dirname, 'positioning.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, '..', 'Where We Fit — Competitive Analysis.pdf');

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));

  await p.goto(SRC, { waitUntil: 'networkidle' });
  await p.emulateMedia({ media: 'print' });

  // Chromium numbers the pages, so the document does not have to guess how
  // many it will be. Same mono/grey as the body's quiet text.
  const foot = `
    <div style="width:100%;margin:0 0.7in;font:8pt Consolas,monospace;color:#9aa1ab;
                display:flex;justify-content:space-between;border-top:1px solid #dfe3e8;
                padding-top:5px;">
      <span>Fire Inspector V3 · competitive analysis</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>`;

  await p.pdf({
    path: OUT,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: foot,
    margin: { top: '0.6in', bottom: '0.7in', left: '0.7in', right: '0.7in' },
  });

  await b.close();
  if (errs.length) { console.error('page errors:', errs.join('; ')); process.exit(1); }
  console.log('wrote ' + OUT);
})();
