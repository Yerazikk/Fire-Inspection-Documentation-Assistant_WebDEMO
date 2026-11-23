// team/test.js: checks the Inspectors tab end to end. Headless, on its own scratch server, drafting on the test
// switch (TEAM_DRAFT_FAKE=1), so nothing here calls a model or touches the live server on 8861.
//   node team/test.js                 the files in team/
//   TEAM_NEXT=1 node team/test.js     the staged files in team/next/ laid over them
//   TEAM_ONLY=clip node team/test.js  only the window sizes and the clipping audit
process.env.TEAM_DRAFT_FAKE = '1';
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = require('./drive.js'), ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0; const failed = [];
const ok = (c, name, extra) => { if (c) pass++; else { fail++; failed.push(name + (extra != null && extra !== '' ? '  [' + String(typeof extra === 'object' ? JSON.stringify(extra) : extra).slice(0, 300) + ']' : '')); } };
const kill = setTimeout(() => { console.log('TEST TIMEOUT'); process.exit(2); }, 560000);
const SIZES = [[1280, 720], [1440, 900], [1728, 1000], [1920, 1080], [2000, 1250]];
const tb = label => '.tm-btn:has(span:text-is("' + label + '"))';

// ---- in the page: is every control whole inside whatever clips it?
function clipAudit(rootSel) {
  const out = { n: 0, bad: [] }, sel = 'button, input:not([type=file]), textarea, select, [role=textbox], [role=radiogroup][tabindex], [role=radio][tabindex], [role=option][tabindex], [contenteditable=true], [contenteditable=plaintext-only]';
  const gone = el => { for (let p = el; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.visibility === 'hidden' || s.display === 'none' || +s.opacity === 0 || p.hidden || p.inert) return true; } return false; };
  for (const root of document.querySelectorAll(rootSel)) for (const el of root.querySelectorAll(sel)) {
    if (el.closest('.leaving, .tm-ghost, .tm-leaving') || gone(el)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    let ext = 0; try { el.focus({ preventScroll: true, focusVisible: true }); const f = getComputedStyle(el); if (f.outlineStyle !== 'none') ext = Math.max(0, parseFloat(f.outlineWidth) + parseFloat(f.outlineOffset)); el.blur(); } catch (e) { /* not focusable */ }
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p), cx = s.overflowX !== 'visible', cy = s.overflowY !== 'visible'; if (!cx && !cy) continue;
      const b = p.getBoundingClientRect(), k = p.offsetWidth ? b.width / p.offsetWidth : 1, L = b.left + p.clientLeft * k, R = L + p.clientWidth * k, T = b.top + p.clientTop * k, B = T + p.clientHeight * k, e = ext * k, scrolls = /auto|scroll/.test(s.overflowY);
      if (r.left - e < L - .6 || r.right + e > R + .6 || (!scrolls && (r.top - e < T - .6 || r.bottom + e > B + .6))) out.bad.push((el.className || el.tagName).toString().slice(0, 40) + ' "' + (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24) + '" in .' + String(p.className).split(' ')[0] + ' [' + [r.left - e - L, R - r.right - e, r.top - e - T, B - r.bottom - e].map(v => Math.round(v * 10) / 10).join(',') + ']');
      break;
    }
    out.n++;
  }
  return out;
}

// ---- in the page: does any text crowd a round corner? (Andrew's rule: the more rounded a container, the more its
// content is set in from the edge; inside a 48 px corner about 28 to 30 px.) For every drawn, rounded container:
//   curve   a line of text that reaches into a corner's square keeps at least 0.4 of the radius clear of the curve
//   pad     and is set in from each edge by at least 0.58 of that side's radius (28 / 48)
//   end     in a pill, the words keep 0.58 of the radius clear of each round end
// The displays and bodies of the two devices are checked for the curve only (a phone's screen is rounded far more
// than its side margins; what matters there is the corners). Words kept for screen readers only are skipped.
function roundAudit(rootSel) {
  const K_PAD = 0.58, K_CURVE = 0.4, MIN_R = 10, out = [];
  const shown = el => { for (let p = el; p && p !== document.documentElement; p = p.parentElement) { const s = getComputedStyle(p); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0 || p.hidden) return false; } return true; };
  const alpha = c => { const m = String(c).match(/[\d.]+/g); return !m ? 0 : m.length > 3 ? +m[3] : 1; };
  const SHELL = '.tm-phone, .ph-screen, .tm-lid, .dk-app';      // the bodies and displays of the two devices: only their corners' curves are checked
  for (const root of document.querySelectorAll(rootSel)) {
    // every line of text, with the element it is in
    const lines = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.nodeValue.trim()) continue; const pe = n.parentElement; if (!pe || pe.closest('.leaving, .tm-ghost, .tm-leaving') || !shown(pe)) continue;
      const box = pe.getBoundingClientRect(); if (box.width < 3 || box.height < 3) continue;      // words kept for screen readers only
      const r = document.createRange(); r.selectNodeContents(n);
      for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1) lines.push({ b, el: pe, text: n.nodeValue.trim().slice(0, 22) });
    }
    for (const el of [root, ...root.querySelectorAll('*')]) {
      const s = getComputedStyle(el), E = el.getBoundingClientRect(); if (E.width < 8 || E.height < 8) continue;
      const k = el.offsetWidth ? E.width / el.offsetWidth : 1;
      const rad = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'].map(key => { const v = String(s[key]).split(' ')[0]; return Math.min(v.endsWith('%') ? parseFloat(v) / 100 * Math.min(E.width, E.height) : parseFloat(v) * k || 0, E.width / 2, E.height / 2); });
      if (Math.max(...rad) < MIN_R * Math.min(1, k)) continue;
      const drawn = alpha(s.backgroundColor) > .03 || s.backgroundImage !== 'none' || s.boxShadow !== 'none' || ['Top', 'Left'].some(d => parseFloat(s['border' + d + 'Width']) > 0 && alpha(s['border' + d + 'Color']) > .03) || s.overflowX !== 'visible' || (s.backdropFilter && s.backdropFilter !== 'none');
      if (!drawn || !shown(el)) continue;
      const mine = lines.filter(l => el.contains(l.el) && l.b.right > E.left && l.b.left < E.right && l.b.bottom > E.top && l.b.top < E.bottom); if (!mine.length) continue;
      const R = Math.max(...rad), pill = R >= Math.min(E.width, E.height) / 2 - 1, round = pill && Math.abs(E.width - E.height) < 2, shell = el.matches(SHELL);
      const name = (el.className && String(el.className).split(' ')[0]) || el.tagName, bad = (why, l, got, need) => out.push(name + ' r' + Math.round(R / k) + ' ' + why + ' "' + l.text + '" ' + (Math.round(got / k * 10) / 10) + ' < ' + (Math.round(need / k * 10) / 10));
      if (round) continue;                                      // a round button holds an icon or a digit in its middle
      for (const l of mine) {
        const T = l.b;
        if (pill) {                                             // a pill: its words keep clear of the round ends
          const wide = E.width >= E.height, a = wide ? T.left - E.left : T.top - E.top, b2 = wide ? E.right - T.right : E.bottom - T.bottom, need = K_PAD * R;
          if (Math.min(a, b2) < need - .75) bad('end', l, Math.min(a, b2), need);
          continue;
        }
        // the curve of each corner
        const C = [[E.left, E.top, 1, 1], [E.right, E.top, -1, 1], [E.right, E.bottom, -1, -1], [E.left, E.bottom, 1, -1]];
        let hit = false;
        C.forEach(([cx, cy, sx, sy], i) => { const r = rad[i]; if (r < MIN_R * Math.min(1, k)) return; const px = Math.max(T.left, Math.min(T.right, cx)), py = Math.max(T.top, Math.min(T.bottom, cy)); if (Math.abs(px - cx) >= r || Math.abs(py - cy) >= r) return; const d = Math.hypot(px - (cx + sx * r), py - (cy + sy * r)), clear = r - d; if (clear < K_CURVE * r - .75) { hit = true; bad('curve', l, clear, K_CURVE * r); } });
        if (hit || shell) continue;
        // set in from each edge in step with the rounding (text that scrolls is only checked sideways)
        let scrolls = false; for (let p = l.el; p && p !== el.parentElement; p = p.parentElement) { const ps = getComputedStyle(p); if (/auto|scroll/.test(ps.overflowY) && p.scrollHeight > p.clientHeight + 1) { scrolls = true; break; } }
        const ins = { left: T.left - E.left, right: E.right - T.right, top: T.top - E.top, bottom: E.bottom - T.bottom }, side = { left: Math.max(rad[0], rad[3]), right: Math.max(rad[1], rad[2]), top: Math.max(rad[0], rad[1]), bottom: Math.max(rad[2], rad[3]) };
        for (const sd of ['left', 'right', 'top', 'bottom']) { if (scrolls && (sd === 'top' || sd === 'bottom')) continue; if (side[sd] < MIN_R * Math.min(1, k)) continue; if (ins[sd] < K_PAD * side[sd] - .75) { bad('pad-' + sd, l, ins[sd], K_PAD * side[sd]); break; } }
      }
    }
  }
  return [...new Set(out)];
}

// ---- in the page: scroll areas that would show the browser's own scrollbar (anything that scrolls must either show
// no bar or be one of the thin ones, whose track stops short of round corners)
function looseBars(rootSel) {
  const out = [];
  for (const root of document.querySelectorAll(rootSel)) for (const el of root.querySelectorAll('*')) { const s = getComputedStyle(el); if (!/auto|scroll/.test(s.overflowY + ' ' + s.overflowX) || el.classList.contains('tm-thinscroll') || s.display === 'none') continue; if (s.scrollbarWidth !== 'none') out.push(String(el.className).split(' ')[0] || el.tagName.toLowerCase()); }
  return [...new Set(out)];
}

(async () => {
  let browser, server;
  try {
    // ================================================================ 1. logic, in node (no browser)
    const sb = { console }; sb.window = sb; vm.createContext(sb);
    const dir = process.env.TEAM_NEXT === '1' ? f => (fs.existsSync(path.join(__dirname, 'next', f)) ? path.join(__dirname, 'next', f) : path.join(__dirname, f)) : f => path.join(__dirname, f);
    for (const f of ['data/jurisdictions.js', 'data/content.js', 'data/hazard.js', 'data/law.js', 'data/outlines.js', 'lib/geo.js', 'lib/codes.js', 'lib/emphasis.js', 'lib/solutions.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
    for (const f of ['adapter.js', 'flow.js', 'drafts.js']) vm.runInContext(fs.readFileSync(dir(f), 'utf8'), sb, { filename: f });
    const TDt = sb.TeamData, TF = sb.TeamFlow;
    ok(TDt.usesFireGeo(), 'the adapter reads the shared FireGeo modules');
    for (const pl of ['ross', 'san_anselmo', 'fairfax', 'marin']) { const r = TDt.evaluate('ladder', TDt.pin(pl), { distance: { kind: 'exact', feet: 12 } }).rows.find(x => x.key === 'ladder-reach'); ok(r && r.value === 30, 'the ladder-fuel reach is 30 ft in ' + pl, r && r.value); }
    const unk = TDt.evaluate('ladder', TDt.pin('ross'), {}).rows.find(x => x.key === 'ladder-reach');
    ok(unk.verdict === 'yellow' && /^Depends on the distance/.test(unk.why), 'no distance given: the row is left to the inspector and says it depends on the distance', unk.why);
    const est = TDt.evaluate('ladder', TDt.pin('ross'), TF.facts('ladder', { distance: { pick: '10to30' } })).rows.find(x => x.key === 'ladder-reach');
    ok(est.verdict === 'red' && /estimate/.test(est.why) && !/\b20 ft\b/.test(est.why), 'an estimate decides the row and says it is an estimate, with no invented exact figure', est.why);
    const shown = o => JSON.stringify(o, (k, v) => (k === 'source' ? undefined : typeof v === 'function' ? String(v) : v));
    const phoneText = shown(TF.QUESTIONS) + shown(TF.READING) + shown(TF.SCAN) + TF.SCAN_STEPS.join(' ') + TF.SCAN_NONE + TF.UNKNOWN_PHOTO;
    ok(!/deflector|\bframe\b|\bSIN\b|fusible|\bbulb\b|\bdisc\b|\bhead\b|turns on|demonstration|prototype|\bAI\b|—/i.test(phoneText.replace(/sprinkler head/gi, '')), 'the phone uses no trade words, no "turns on", no demonstration notice, no "AI", no em dash', (phoneText.match(/.{20}(deflector|\bframe\b|SIN\b|fusible|bulb|disc|\bhead\b|turns on|demonstration|prototype|\bAI\b|—).{20}/i) || [])[0]);
    ok(Object.values(TF.QUESTIONS).every(l => l.length <= 2) && !/other sprinkler|how many/i.test(phoneText), 'at most two questions per finding, none about other sprinklers');
    ok(Object.keys(TF.SCAN).every(s => TF.SCAN[s].length <= 3 && TF.SCAN[s].filter(x => x.finding).length === 1 && TF.SCAN[s].every(x => TDt.scene(s).annotations[x.ix] && !('box' in x))), 'the scan lights the finding and at most two other things, each a region read from the shared data');
    ok(Math.abs(TDt.scene('sprinkler').focus[0] - 50) < 15 && TF.FOCUS.ladder === undefined || Array.isArray(TF.FOCUS.ladder), 'where a photograph is centred comes from the finding’s own region in the data');
    const api = require('./api.js');
    const inj = (await api.draft(JSON.stringify({ target: 'own', scene: 'ladder', place: 'ross', instruction: 'Move the hedge back from the road inject', current: {} }))).body;
    ok(inj.ok && inj.removed.length === 1 && /§ 999\.9/.test(inj.removed[0]) && !/999|45 feet|7 days/.test(JSON.stringify(inj.steps)), 'the server strips a sentence that carries a section, distance and deadline not in the sources', inj);
    ok((await api.draft('{"target":"problem"}')).code === 400, 'a malformed drafting request is refused');
    for (const f of ['phone.js', 'desk.js', 'desk-draft.js', 'main.js', 'ui.js', 'photo.js', 'flow.js', 'team.css', 'phone.css', 'desk.css']) {
      const src = fs.readFileSync(dir(f), 'utf8'), ui = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/source: '[^\n]*'/g, '');
      if (f.endsWith('.css')) ok(!/(^|[\s,>+~])\.[a-z]{1,2}(?=[\s,{:.>+~\[])/m.test(ui), f + ': no one- or two-letter class names', (ui.match(/(^|[\s,>+~])\.[a-z]{1,2}(?=[\s,{:.>+~\[])/m) || [])[0]);
      else ok(!/'[^'\n]*(—|\bAI\b|demonstration|prototype|reprompt|veto|provenance|Put it back|Take it back|Hold to)[^'\n]*'/.test(ui), f + ': no jargon, demonstration notice, em dash, "put it back" or "hold to" in interface strings', (ui.match(/'[^'\n]*(—|\bAI\b|demonstration|prototype|reprompt|veto|provenance|Put it back|Take it back|Hold to)[^'\n]*'/) || [])[0]);
    }
    ok(!fs.existsSync(path.join(__dirname, 'map.js')) && !/mp-|pindrag|map\.js/.test(fs.readFileSync(dir('index.html'), 'utf8') + fs.readFileSync(dir('team.css'), 'utf8')), 'the minimap is gone: no file, no styles, no script');

    // ================================================================ 2. the page
    server = await require('./serve.js').start(8893, process.env.TEAM_NEXT === '1'); browser = await D.launch();
    const URL = 'http://localhost:8893/team/';
    // at the corrections step: does the large picture, or the switch under it, lie on its words?
    const apart = pg => pg.evaluate(() => { const v = document.querySelector('.dk-view.is-on'), box = s => { const n = v.querySelector(s); return n && n.getBoundingClientRect(); }, hit = (a, b) => a && b && !(a.right <= b.left + 1 || b.right <= a.left + 1 || a.bottom <= b.top + 1 || b.bottom <= a.top + 1), big = box('.dk-detail .dk-big .ba-stage, .dk-detail .dk-big'), tools = box('.dk-detail .ba-tools'), side = box('.dk-detail .dk-side'); return hit(big, side) ? 'the picture is on its words' : hit(tools, side) ? 'the switch is on the words' : ''; });

    // ---- 2a. the stage: each device in its true shape, the two the same height, nothing cut, no page scroll
    for (const [w, hgt] of SIZES) {
      const { ctx, page, errors } = await D.open(browser, URL, { width: w, height: hgt });
      const g = await page.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), p = q('.tm-phone'), l = q('.tm-laptop'), a = q('.dk-app'), m = document.querySelector('.tm-main'), c = [...document.querySelectorAll('.tm-cap')].map(n => n.getBoundingClientRect().bottom); return { phone: p.width / p.height, lap: a.width / a.height, tops: p.top - l.top, bottoms: p.bottom - l.bottom, caps: c[0] - c[1], margins: [p.left, innerWidth - l.right], scroll: Math.max(m.scrollWidth - m.clientWidth, m.scrollHeight - m.clientHeight, document.documentElement.scrollWidth - innerWidth, document.documentElement.scrollHeight - innerHeight), inside: [p, l, q('#tmReset')].every(r => r.left >= 0 && r.top >= 0 && r.right <= innerWidth + .5 && r.bottom <= innerHeight + .5), apart: p.right <= l.left, map: !!document.querySelector('.tm-map, .mp-pin') }; });
      ok(Math.abs(g.phone / (390 / 844) - 1) < .01, w + 'x' + hgt + ': the phone keeps the shape of a phone (390 : 844)', g.phone);
      ok(Math.abs(g.tops) <= 1 && Math.abs(g.bottoms) <= 1 && Math.abs(g.caps) <= 1, w + 'x' + hgt + ': the two devices are the same height, tops and bottoms level, captions on one line', [g.tops, g.bottoms, g.caps]);
      ok(g.lap >= 1.41 && g.lap <= 1.61, w + 'x' + hgt + ': the laptop screen is 16 : 10, or a little squarer in a narrow window', g.lap);
      ok(g.scroll <= 1 && g.inside && g.apart && !g.map && Math.abs(g.margins[0] - g.margins[1]) <= 2, w + 'x' + hgt + ': the pair is centred with even margins, whole, with no page scroll and no map', g);
      ok(!errors.length, w + 'x' + hgt + ': no errors on load', errors.join(' | '));
      await ctx.close();
    }

    if (process.env.TEAM_ONLY !== 'clip') {
    // ---- 2b. the phone: camera, scan, note, question, send
    const s1 = await D.open(browser, URL), page = s1.page;
    const cam = await page.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), k = q('.tm-phone').height / 844, v = q('.ph-stage'), l = q('.ph-lens'), sh = q('.ph-shutter'), g = q('.ph-actions-camera .ph-round'), sp = q('.ph-spacer'), scr = q('.ph-screen'); return { words: document.querySelector('.ph-layer:not(.leaving)').innerText.replace(/Sprinkler|Hedge/g, '').trim(), lensAbove: l.bottom <= v.top + 1, lensCentred: Math.abs((l.left + l.right) / 2 - (scr.left + scr.right) / 2) / k, sides: [(v.left - scr.left) / k, (scr.right - v.right) / k], shutter: (scr.bottom - (sh.top + sh.height / 2)) / k, shutterX: Math.abs((sh.left + sh.right) / 2 - (scr.left + scr.right) / 2) / k, row: Math.abs((g.top + g.bottom) / 2 - (sh.top + sh.bottom) / 2) / k, balance: Math.abs(g.width - sp.width) / k, gap: (sh.top - v.bottom) / k, pillGap: (v.top - l.bottom) / k, pillTop: (l.top - q('.ph-view').top) / k, marks: document.querySelectorAll('.ph-stage .ph-win, .ph-stage .tm-mark').length }; });
    ok(cam.pillGap >= 20 && cam.pillGap <= 24 && cam.pillTop >= cam.pillGap - .5 && cam.pillTop <= cam.pillGap + 8, 'camera: the scene switch sits balanced in its band, 20 to 24 px above the picture and at least as far under the status bar', [cam.pillTop, cam.pillGap]);
    ok(cam.words === '' && cam.lensAbove && cam.lensCentred < 1.5 && cam.marks === 0, 'camera: no words, the scene switch above the picture and centred, nothing on the picture', cam);
    ok(Math.abs(cam.sides[0] - 16) < 1 && Math.abs(cam.sides[1] - 16) < 1 && cam.shutter >= 80 && cam.shutter <= 90 && cam.shutterX < 1 && cam.row < 1 && cam.balance < 1 && cam.gap >= 20 && cam.gap <= 24 && Math.abs(cam.gap - cam.pillGap) <= 2, 'camera: even side margins, the shutter centred 80 to 90 px above the bottom, gallery level with it and balanced by a spacer, 20 to 24 px between the picture and the shutter (the same as above the picture)', cam);
    ok(await page.evaluate(() => document.querySelector('.dk-empty.is-on') && document.querySelector('.dk-panes').dataset.rail === 'off' && !/sample/i.test(document.body.innerText)), 'empty laptop: one calm line, no sidebar, no sample anywhere');
    for (const scene of ['sprinkler', 'ladder']) {
      await D.phone.scene(page, scene); const box = () => page.evaluate(() => { const r = document.querySelector('.ph-stage').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); }), atCamera = await box();
      await page.click('.ph-shutter'); await D.waitScreen(page, 'scan'); await page.waitForTimeout(120); ok(await box() === atCamera, scene + ': the picture does not move when the scan starts', [atCamera, await box()]); await page.waitForTimeout(1380);
      const sc = await page.evaluate(() => { const st = document.querySelector('.ph-stage').getBoundingClientRect(), box = n => n.getBoundingClientRect(), hit = (a, b) => !(a.right <= b.left + .5 || b.right <= a.left + .5 || a.bottom <= b.top + .5 || b.bottom <= a.top + .5), W = [...document.querySelectorAll('.ph-win')], T = [...document.querySelectorAll('.ph-win-tag')]; return { wins: W.length, finding: W.filter(n => n.classList.contains('is-finding')).length, dashed: W.some(n => /dashed/.test(getComputedStyle(n).borderStyle + getComputedStyle(n).outlineStyle)), tagsInside: T.every(t => { const b = box(t); return b.left >= st.left - .5 && b.right <= st.right + .5 && b.top >= st.top - .5 && b.bottom <= st.bottom + .5; }), tagsApart: T.every((t, i) => T.every((u, j) => i === j || !hit(box(t), box(u)))), tagOffOthers: T.every((t, i) => W.every((w, j) => i === j || !hit(box(t), box(w)))), veil: getComputedStyle(document.querySelector('.ph-scan-veil')).opacity, skip: getComputedStyle(document.querySelector('.ph-skip')).backgroundColor }; });
      ok(sc.wins >= 1 && sc.wins <= 3 && sc.finding === 1 && !sc.dashed && +sc.veil === 1, scene + ' scan: the picture is dim and a few solid windows light up, one of them the finding', sc);
      ok(sc.tagsInside && sc.tagsApart && sc.tagOffOthers, scene + ' scan: every tag is inside the picture, on no other tag and no other window', sc);
      { const r = await page.evaluate(roundAudit, '#phone'); ok(!r.length, scene + ' scan: no tag sits in the curve of the picture’s corners', r.slice(0, 3).join(' | ')); }
      await D.waitScreen(page, 'note'); await D.settle(page, 600);
      ok(await page.evaluate(() => { const st = document.querySelector('.ph-stage'); return !st.querySelector('.ph-win, .ph-win-tag, .tm-mark, .ph-scan-line') && document.querySelector('.ph-layer:not(.leaving) h1').textContent === 'Add a note'; }), scene + ': after the scan the photograph is clean and the screen is "Add a note"');
      if (scene === 'sprinkler') await page.click(D.LAYER + ' .ph-back');
    }
    const hd = await page.evaluate(() => { const k = document.querySelector('.tm-phone').getBoundingClientRect().height / 844, b = document.querySelector('.ph-layer:not(.leaving) .ph-back').getBoundingClientRect(), t = document.querySelector('.ph-layer:not(.leaving) h1'), r = t.getBoundingClientRect(); return { gap: (r.left - b.right) / k, centred: Math.abs((r.top + r.bottom) / 2 - (b.top + b.bottom) / 2) / k, lines: Math.round(r.height / parseFloat(getComputedStyle(t).lineHeight) / k) }; });
    ok(hd.gap >= 12 && hd.gap <= 14 && hd.centred < 1.5 && hd.lines === 1, 'phone header: 12 to 14 px between the back button and the title, the title centred on the button, on one line', hd);
    ok(await page.evaluate(() => { const o = [...document.querySelectorAll('.ph-layer:not(.leaving) .ph-opt')]; return o.length === 4 && o[0].classList.contains('is-on') && o.filter(x => x.classList.contains('is-on')).length === 1 && o.slice(0, 3).every(x => x.querySelector('[aria-label="Change wording"]')) && !o[3].querySelector('.ph-opt-edit') && o[3].textContent === 'Something else' && !document.querySelector('.ph-layer:not(.leaving) .ph-btn') && document.querySelector('.ph-layer:not(.leaving) .ph-primary').textContent === 'Use this note'; }), 'note: the app’s suggestions with the first chosen, a pencil on each, "Something else" last, and no separate wording button');
    await page.click(D.LAYER + ' .ph-opt[data-i="1"] .ph-opt-edit'); await page.keyboard.press('Meta+A'); await page.keyboard.type('Dry leaves along the wall.'); await page.click(D.LAYER + ' .ph-opt[data-i="1"] [aria-label="Done"]'); await D.settle(page, 200);
    ok(await page.evaluate(() => { const N = window.Team.Phone.state.note, r = document.querySelector('.ph-layer:not(.leaving) .ph-opt[data-i="1"]'); return N.pick === 1 && N.words[1] === 'Dry leaves along the wall.' && r.classList.contains('is-on') && !r.querySelector('[aria-label="Undo"]').hidden; }), 'note: the pencil edits an option in place, the edited one becomes the chosen one, and Undo appears on it');
    await page.click(D.LAYER + ' .ph-opt[data-i="1"] [aria-label="Undo"]'); await page.click(D.LAYER + ' .ph-opt[data-i="0"]'); await D.settle(page, 200);
    await D.phone.confirm(page);
    ok(await page.evaluate(() => { const L = document.querySelector('.ph-layer:not(.leaving)'), q = L.querySelectorAll('.ph-q'); return q.length === 1 && !!q[0].querySelector('.ph-q-pic svg') && q[0].querySelectorAll('.ph-pick').length === 3 && q[0].querySelector('.ph-cant').textContent === 'Not sure' && !/filled in|Check them|Sending from/.test(L.textContent); }), 'hedge question: a drawing, three ranges, a number field, a quiet "Not sure"; no list of readings, no location line');
    ok(await page.evaluate(() => { const e = document.querySelector('.ph-layer:not(.leaving) .ph-entry.is-field'), u = e.querySelector('.ph-entry-unit'); return e.querySelector('.ph-entry-value').textContent === 'Or type the distance' && u.textContent === 'ft' && getComputedStyle(u).display !== 'none' && /A long step is about 3 ft\./.test(document.querySelector('.ph-layer:not(.leaving) .ph-q-say').textContent); }), 'hedge question: the field says "Or type the distance", with the unit ft in it and the step hint beneath');
    await D.phone.type(page, 20); ok(await page.evaluate(() => { const e = document.querySelector('.ph-layer:not(.leaving) .ph-entry.is-field'), u = e.querySelector('.ph-entry-unit'); return e.querySelector('.ph-entry-value').textContent === '20' && u.textContent === 'ft' && getComputedStyle(u).position !== 'absolute' && u.getBoundingClientRect().left > e.querySelector('.ph-entry-value').getBoundingClientRect().right; }), 'a typed distance reads "20 ft": the unit sits beside the number');
    await D.phone.pick(page, '10to30');
    ok(await page.evaluate(() => { const b = document.querySelector('.ph-layer:not(.leaving) .ph-primary'); return b.textContent === 'Send to the senior inspector' && !b.querySelector('.tm-hold-fill'); }), 'the send button is a plain button');
    await page.click(D.LAYER + ' .ph-primary'); await D.waitScreen(page, 'sent'); await D.settle(page, 950);
    ok(await page.evaluate(() => document.querySelectorAll('.ph-sent').length === 1), 'one tap sends, and the item is in the Sent list');
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(); return V && V.f.scene === 'ladder' && V.f.facts.distance.kind === 'estimate' && V.loc.place === 'ross' && document.querySelector('.dk-panes').dataset.rail === 'off' && !document.querySelector('.dk-view.is-on.is-arriving') && !document.querySelector('.dk-view.is-on .dk-photo .tm-mark'); }), 'the finding lands on the laptop, in Ross, with the estimate, the photograph clean, and no sidebar for one finding');
    const rest = await page.evaluate(() => document.querySelector('.dk-view.is-on').innerText.trim().split(/\s+/).length);
    ok(rest <= 218, 'the hedge finding at rest shows a third or less of the words it used to (656 before)', rest); console.log('words on the laptop at rest, hedge: ' + rest);

    // ---- 2c. a rule opens in place; its analysis has a pencil and, once changed, an undo
    await D.desk.open(page, 'ladder-reach');
    ok(await page.evaluate(() => { const r = document.querySelector('.dk-row[data-key="ladder-reach"]'); return !r.querySelector('.dk-row-body').hidden && r.querySelectorAll('mark.code-key').length > 0 && /Still to confirm: /.test(r.textContent) && !!r.querySelector('.dk-read-row [aria-label="Change wording"]') && r.querySelector('.dk-read-row [aria-label="Undo"]').hidden && !/Change wording|Put it back|The app read/.test(r.innerText); }), 'an open rule: the code’s words with the key part marked, what the app thinks with a pencil beside it, "Still to confirm", and no caption');
    await page.click('.dk-row[data-key="ladder-reach"] [aria-label="Change wording"]'); await page.keyboard.press('Meta+A'); await page.keyboard.type('Measured on site at 12 ft.'); await page.click('.dk-row[data-key="ladder-reach"] [aria-label="Done"]'); await D.settle(page, 200);
    ok(await page.evaluate(() => window.Team.Desk.view().rows.get('ladder-reach').words === 'Measured on site at 12 ft.' && !document.querySelector('.dk-row[data-key="ladder-reach"] .dk-read-row [aria-label="Undo"]').hidden), 'the analysis can be reworded in place, and Undo appears beside the pencil');

    // ---- 2d. the verdict becomes the system's two-part switch in place; the row keeps its place when its verdict changes
    await page.evaluate(() => { window.__row = document.querySelector('.dk-row[data-key="hazard-veg"]'); window.__made = 0; window.__seen = new Set(document.querySelectorAll('.dk-row')); new MutationObserver(m => { for (const x of m) for (const n of x.addedNodes) if (n.nodeType === 1 && n.classList.contains('dk-row') && !window.__seen.has(n)) window.__made++; }).observe(document.querySelector('.dk-rows'), { childList: true }); window.__h = window.__row.getBoundingClientRect().height; window.__order = [...document.querySelectorAll('.dk-view.is-on .dk-row')].map(n => n.dataset.key).join(','); });
    ok(await page.evaluate(() => { const v = [...document.querySelectorAll('.dk-view.is-on .dk-row')].map(n => ['red', 'yellow', 'green'].indexOf(n.dataset.verdict)); return v.every((x, i) => !i || v[i - 1] <= x); }), 'when the finding opens the rules are sorted once: violations, then the inspector’s calls, then clear');
    const still = () => page.evaluate(() => [...document.querySelectorAll('.dk-view.is-on .dk-row')].map(n => n.dataset.key).join(',') === window.__order);
    await page.click('.dk-row[data-key="hazard-veg"] .dk-verdict'); await D.settle(page, 380);
    const sw = await page.evaluate(() => { const t = document.querySelector('.dk-toggle'), r = t.getBoundingClientRect(), row = t.closest('.dk-row'), n = row.querySelector('.dk-row-name').getBoundingClientRect(), i = t.querySelector('.shell-seg-ind'), dark = el => { const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g) || [255, 255, 255, 0]; return (m[3] == null || +m[3] > .5) && (+m[0] + +m[1] + +m[2]) / 3 < 110; }; return { seg: t.classList.contains('shell-seg'), h: Math.round(r.height), labels: [...t.querySelectorAll('button')].map(b => b.textContent).join('|'), on: t.querySelectorAll('button.on').length, thumb: getComputedStyle(i).opacity, from: !!t.querySelector('.dk-toggle-from[data-verdict="yellow"]'), clear: n.left - r.right, rowH: Math.abs(row.getBoundingClientRect().height - window.__h), dark: [t, i, ...t.querySelectorAll('button')].some(dark) }; });
    ok(sw.seg && sw.h >= 30 && sw.h <= 32 && sw.labels === 'Violation|Clear' && sw.on === 0 && +sw.thumb === 0 && sw.from, 'pressing an "Inspector’s call" opens the system’s small two-part switch, Violation | Clear, with no thumb on either side and the yellow mark at its left', sw);
    ok(sw.clear >= 4 && sw.rowH <= 1 && !sw.dark, 'the switch does not cover the rule’s name, the row keeps its height, and nothing in it is a dark fill', sw);
    await page.keyboard.press('Escape'); await D.settle(page, 340);
    ok(await page.evaluate(() => !document.querySelector('.dk-toggle') && document.querySelector('.dk-row[data-key="hazard-veg"]').dataset.verdict === 'yellow' && !document.querySelector('.dk-row[data-key="hazard-veg"] .dk-row-open').style.marginLeft), 'Escape closes the switch with nothing changed, and the name is back in place');
    await page.click('.dk-row[data-key="hazard-veg"] .dk-verdict'); await D.settle(page, 380); await page.click('.dk-toggle button[data-value="red"]'); await page.waitForTimeout(200);
    const pill = await page.evaluate(() => { const t = document.querySelector('.dk-toggle'); if (!t) return null; const i = t.querySelector('.shell-seg-ind'), b = t.querySelector('button.on'), m = getComputedStyle(i).backgroundColor.match(/[\d.]+/g); return { on: b && b.dataset.value, white: (+m[0] + +m[1] + +m[2]) / 3 > 235, under: Math.abs(i.getBoundingClientRect().left - b.getBoundingClientRect().left) < 3 && +getComputedStyle(i).zIndex < +getComputedStyle(b).zIndex && getComputedStyle(b).color !== getComputedStyle(i).backgroundColor, weight: +getComputedStyle(b).fontWeight > +getComputedStyle(t.querySelector('button:not(.on)')).fontWeight }; });
    ok(pill && pill.on === 'red' && pill.white && pill.under, 'choosing a side puts a raised white pill under it, with the word and its mark readable on the pill', pill);
    await D.settle(page, 1000);
    ok(await page.evaluate(() => { const r = document.querySelector('.dk-row[data-key="hazard-veg"]'); return r === window.__row && r.dataset.verdict === 'red' && !document.querySelector('.dk-toggle') && !r.querySelector('.dk-row-hint') && !/The app read|Put it back/.test(r.innerText) && !r.getAnimations().some(a => a.id === 'tm-glide'); }) && await still(), 'the row is now red, in the same place: nothing in the list moved, and there is no caption under it');
    ok(await page.evaluate(() => [...document.querySelectorAll('.dk-tally-n b')].map(b => b.textContent).join(',')) === '2,3,0', 'the counts follow');
    await D.desk.verdict(page, 'hazard-veg', 'green');
    ok(await page.evaluate(() => { const r = document.querySelector('.dk-row[data-key="hazard-veg"]'); return r === window.__row && r.dataset.verdict === 'green'; }) && await still(), 'the other side flips it, and the row stays where it is');
    await page.click('.dk-row[data-key="hazard-veg"] .dk-verdict'); await D.settle(page, 380);
    ok(await page.evaluate(() => document.querySelector('.dk-toggle button.on').dataset.value === 'green' && !document.querySelector('.dk-toggle .dk-toggle-from')), 'a decided row opens with the pill on its side');
    await page.click('.dk-toggle button[data-value="green"]'); await D.settle(page, 1000);
    ok(await page.evaluate(() => { const r = document.querySelector('.dk-row[data-key="hazard-veg"]'); return r === window.__row && r.dataset.verdict === 'yellow' && !window.Team.Desk.view().rows.get('hazard-veg').manual && window.__made === 0; }) && await still(), 'pressing the chosen side again undoes the decision: the row is back to the app’s verdict; through all of it no row moved or was rebuilt');
    await D.desk.verdict(page, 'canopy', 'red');

    // ---- 2e. approve; the corrections large, one at a time; the file document; the owner's page, where it is published
    ok(await page.evaluate(() => [...document.querySelectorAll('.dk-view.is-on .dk-crumb')].map(b => b.textContent + ':' + b.dataset.state).join(' ')) === 'Finding:current How to fix it:todo For the file:todo For the owner:todo' && await page.evaluate(() => { const V = window.Team.Desk.view(); return V.nextBtn.textContent === 'Approve' && document.querySelectorAll('.dk-view.is-on .dk-foot button').length === 1 && document.querySelector('.dk-item.is-on .dk-item-state').textContent === 'To review'; }), 'the breadcrumb shows the four steps, the one button says "Approve", and the finding is "To review"');
    await D.desk.approve(page); await D.settle(page, 400);
    const fx = await page.evaluate(() => { const V = window.Team.Desk.view(), big = document.querySelector('.dk-view.is-on .dk-detail .dk-big').getBoundingClientRect(), det = document.querySelector('.dk-view.is-on .dk-detail').getBoundingClientRect(), th = [...document.querySelectorAll('.dk-view.is-on .dk-fix-thumb img')].map(i => i.getAttribute('src')); return { step: V.step, rows: document.querySelectorAll('.dk-view.is-on .dk-fix-row').length, on: document.querySelectorAll('.dk-view.is-on .dk-fix-row.is-on').length, used: document.querySelectorAll('.dk-view.is-on .dk-use[aria-checked="true"]').length, bigH: big.height / det.height, slider: !!document.querySelector('.dk-view.is-on .dk-detail [role=slider]'), toggle: !!document.querySelector('.dk-view.is-on .dk-detail .ba-toggle'), steps: document.querySelectorAll('.dk-view.is-on .dk-detail .dk-card-steps li').length, thumbsDiffer: new Set(th).size === th.length, context: getComputedStyle(document.querySelector('.dk-view.is-on .dk-context')).display, btn: V.nextBtn.textContent }; });
    ok(fx.step === 'fix' && fx.rows === 3 && fx.on === 1 && fx.used === 1 && fx.slider && fx.toggle && fx.steps >= 4 && fx.bigH > .7 && fx.context === 'none' && fx.btn === 'Next: for the file', 'one click on Approve shows the required correction large at once: its before and after fills the height, with its steps beside it', fx);
    ok(await page.evaluate(() => document.querySelector('.dk-item.is-on .dk-item-state').textContent) === 'Fixes to choose', 'approved with a violation: the finding is "Fixes to choose"');
    ok(fx.thumbsDiffer, 'the three corrections have different small pictures (their "after")', fx);
    await page.evaluate(() => { window.__pane = document.querySelector('.dk-view.is-on .dk-detail-pane'); });
    await page.hover('.dk-view.is-on .dk-fix-row:nth-child(3)'); await page.waitForTimeout(450);
    ok(await page.evaluate(() => document.querySelector('.dk-view.is-on .dk-detail-pane') === window.__pane && document.querySelector('.dk-view.is-on .dk-fix-row:nth-child(1)').classList.contains('is-on')), 'passing the pointer over a correction changes nothing');
    const look = await page.evaluate(() => { const lum = c => { const m = c.match(/[\d.]+/g) || [0, 0, 0, 0]; return [(+m[0] + +m[1] + +m[2]) / 3, m[3] == null ? 1 : +m[3]]; }, rows = [...document.querySelectorAll('.dk-view.is-on .dk-fix-row')], box = r => getComputedStyle(r.querySelector('.tm-box')), blue = getComputedStyle(document.documentElement).getPropertyValue('--hi').trim(); return { onBorder: getComputedStyle(rows[0]).borderTopColor, ticked: lum(box(rows[0]).backgroundColor), empty: lum(box(rows[1]).backgroundColor), outline: rows.map(r => getComputedStyle(r).outlineStyle + '/' + getComputedStyle(r.querySelector('.dk-use')).outlineStyle).join(' '), blue }; });
    ok(look.ticked[0] < 90 && look.ticked[1] > .9 && look.empty[1] < .1 && !/solid|auto/.test(look.outline), 'a ticked correction has a filled check and the others an empty one; the looked-at row has its own surface and nothing carries a ring at rest', look);
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(3) .dk-use'); await D.settle(page, 250);
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(); return document.querySelector('.dk-view.is-on .dk-detail-pane') === window.__pane && V.draft.chosen().length === 2 && document.querySelector('.dk-view.is-on .dk-fix-row:nth-child(1)').classList.contains('is-on'); }), 'the check ticks a correction without changing which one is being looked at');
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(3) .dk-use'); await D.settle(page, 250);
    await page.focus('.dk-view.is-on .dk-fix-row:nth-child(1)'); await page.keyboard.press('ArrowDown'); await D.settle(page, 300);
    ok(await page.evaluate(() => document.querySelector('.dk-view.is-on .dk-detail-pane') === window.__pane && document.activeElement === document.querySelector('.dk-view.is-on .dk-fix-row:nth-child(2)')), 'the arrow keys move along the list without changing the picture');
    await page.keyboard.press('Enter'); await D.settle(page, 450);
    ok(await page.evaluate(() => document.querySelector('.dk-view.is-on .dk-detail-pane') !== window.__pane && document.querySelector('.dk-view.is-on .dk-fix-row:nth-child(2)').classList.contains('is-on')), 'Enter looks at the correction that has the focus');
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(1)'); await D.settle(page, 450); await page.evaluate(() => { window.__pane = document.querySelector('.dk-view.is-on .dk-detail-pane'); });
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(2)'); await D.settle(page, 450);
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(); return document.querySelector('.dk-view.is-on .dk-detail-pane') !== window.__pane && document.querySelectorAll('.dk-view.is-on .dk-detail-pane').length === 1 && document.querySelector('.dk-view.is-on .dk-fix-row:nth-child(2)').classList.contains('is-on') && V.draft.chosen().length === 1; }), 'looking at another correction swaps the large view as one unit and does not tick it');
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(2) .dk-use'); await D.settle(page, 200);
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(1)'); await D.settle(page, 450);
    await page.click('.dk-view.is-on .dk-detail ' + tb('Ask for a rewrite')); await D.settle(page, 350); await page.click('.dk-view.is-on .dk-detail .dk-ask ' + tb('Make it shorter')); await page.waitForTimeout(1900);
    ok(await page.evaluate(() => { const s = window.Team.Desk.view().draft.model.sols[0]; return s.rewrites === 1 && s.steps[0].base === 'Find the low, clipped green hedge that grows directly under the tall flowering plants.' && !document.querySelector('.dk-view.is-on .dk-detail .dk-card-stepshead [aria-label="Undo"]').hidden; }), 'asking for a rewrite changes the steps, and Undo appears');
    await page.click('.dk-view.is-on .dk-detail .dk-card-stepshead [aria-label="Change wording"]'); await D.settle(page, 150); await page.click('.dk-view.is-on .dk-detail .dk-card-steps li:nth-child(2) .dk-step'); await page.keyboard.press('Meta+A'); await page.keyboard.type('Take out the low hedge only.'); await page.click('.dk-view.is-on .dk-detail .dk-card-stepshead [aria-label="Done"]'); await D.settle(page, 250);
    ok(await page.evaluate(() => window.Team.Desk.view().draft.model.sols[0].steps[1].cur === 'Take out the low hedge only.'), 'the pencil turns a correction’s steps into text boxes; the same button ends it');
    await page.click('.dk-view.is-on .dk-fix-row:nth-child(3)'); await D.settle(page, 450); await page.click('.dk-view.is-on .dk-detail ' + tb('Don’t use this one')); await D.settle(page, 550);
    ok(await page.evaluate(() => document.querySelectorAll('.dk-view.is-on .dk-fix-row:not(.tm-leaving)').length === 2 && !document.querySelector('.dk-view.is-on .dk-off').hidden && !!document.querySelector('.dk-view.is-on .dk-off-row [aria-label="Undo"]') && !!document.querySelector('.dk-view.is-on .dk-detail-pane')), 'a correction set aside goes to "Not used" with an Undo, and another is shown in its place');
    await page.click('.dk-view.is-on ' + tb('Write my own')); await D.settle(page, 400); await page.fill('.dk-view.is-on .dk-new .dk-input', 'Move the hedge back from the road inject'); await page.click('.dk-view.is-on .dk-new ' + tb('Write it up')); await page.waitForTimeout(2300);
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(), s = V.draft.model.sols.find(x => x.kind === 'own'), p = document.querySelector('.dk-view.is-on .dk-detail-pane'); return s && s.use && !/999|45 feet|7 days/.test(JSON.stringify(s.steps)) && p.dataset.kind === 'own' && /No picture can be made for this one\./.test(p.textContent) && !!p.querySelector('.tm-markup'); }), 'a correction of the inspector’s own is written up, shown large, and says no picture can be made');
    await page.click('.dk-view.is-on .dk-detail ' + tb('Mark where the problem is')); await D.settle(page, 250);
    ok(await page.evaluate(() => window.Team.Desk.view().draft.model.sols.find(x => x.kind === 'own').regions.length === 1 && !!document.querySelector('.dk-view.is-on .dk-detail .tm-hatch')), 'the area is marked on the photo as a hatched plan');
    await D.desk.next(page);
    ok(await D.desk.step(page) === 'file' && await page.evaluate(() => document.querySelector('.dk-item.is-on .dk-item-state').textContent) === 'Draft ready', 'after the corrections comes the file document, and the finding is "Draft ready"');
    const doc = await page.evaluate(() => { const d = document.querySelector('.dk-view.is-on .doc-page'), r = d.getBoundingClientRect(), sc = document.querySelector('.dk-view.is-on .doc-scroll'); return { step: window.Team.Desk.view().step, text: d.innerText, marks: d.querySelectorAll('mark.code-key').length, tools: [...document.querySelectorAll('.dk-view.is-on .dk-foot button')].map(b => b.getAttribute('aria-label') || b.textContent).join('|'), bar: !!document.querySelector('.dk-view.is-on .dk-pane.is-on .dk-rules-head, .dk-view.is-on .dk-pane.is-on [aria-label="Undo"]'), radius: parseFloat(getComputedStyle(d).borderTopLeftRadius), w: r.width, top: sc.scrollTop, topGap: r.top - sc.getBoundingClientRect().top, photo: !!d.querySelector('.doc-photo'), cite: [...d.querySelectorAll('.doc-cite, .doc-rule')].every(n => !n.isContentEditable), free: d.querySelectorAll('.doc-p.tm-direct').length, ssTop: getComputedStyle(sc).getPropertyValue('--ss-top').trim(), lane: sc.offsetWidth - sc.clientWidth }; });
    ok(doc.step === 'file' && /Town of Ross/.test(doc.text) && /Town WUI Code § 604\.6\(7\) · RMC ch\. 14\.16/.test(doc.text) && /Measured on site at 12 ft\./.test(doc.text) && /estimated on site, not measured/.test(doc.text) && /Set by the senior inspector\. The app read this as Inspector’s call\./.test(doc.text) && /No picture was generated\./.test(doc.text) && /Option 1: Remove the lower tier of bushes/.test(doc.text) && /Option 3: /.test(doc.text) && doc.marks > 0 && doc.tools === 'Copy|Print|Next: for the owner' && !doc.bar, 'the file document: the place, exact citations, the inspector’s wording and verdicts, what was estimated; no bar above it, Copy and Print beside the button that leads on to the owner’s page', doc.tools);
    ok(doc.radius >= 20 && doc.w <= 742 && doc.photo && doc.cite && doc.free > 8 && doc.top === 0 && doc.topGap >= 10 && doc.ssTop === '0px', 'it is a page: rounded, a reading width, the photo small, citations fixed, the rest free text, its top edge whole', doc);
    ok(doc.lane === 16, 'the long document shows a thin scrollbar (an 8 px lane, kept on both sides so the page stays centred)', doc.lane);
    ok(await page.evaluate(() => { const v = document.querySelector('.dk-view.is-on'), f = v.querySelector('.doc-frame').getBoundingClientRect(), w = v.querySelector('.dk-work').getBoundingClientRect(); return f.height / w.height > .96 && getComputedStyle(v.querySelector('.dk-foot')).position === 'absolute' && !!v.querySelector('.doc-frame > [aria-label="Enlarge"]') && /The owner’s steps in full: 1\. /.test(v.querySelector('.doc-page').innerText); }), 'the file document has the whole screen too, can be enlarged, and carries the owner’s steps in full');
    await page.click('.dk-view.is-on .doc-page .doc-p.tm-direct'); await page.keyboard.press('Meta+ArrowDown'); await page.keyboard.type(' Checked.'); await page.waitForTimeout(150);
    ok(await page.evaluate(() => /Checked\.$/.test(document.activeElement.textContent) && document.activeElement.classList.contains('tm-direct')), 'the document is edited by clicking and typing');
    const soft = await page.evaluate(async () => { const sc = document.querySelector('.dk-view.is-on .doc-scroll'), v = k => getComputedStyle(sc).getPropertyValue(k).trim(), wait = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); document.activeElement.blur(); const a = [v('--ss-top'), v('--ss-bottom')]; sc.scrollTop = 300; await wait(); const b = [v('--ss-top'), v('--ss-bottom')]; sc.scrollTop = sc.scrollHeight; await wait(); const c = [v('--ss-top'), v('--ss-bottom')]; sc.scrollTop = 0; await wait(); return { a, b, c, mask: /gradient/.test(getComputedStyle(sc).maskImage || getComputedStyle(sc).webkitMaskImage), all: [...document.querySelectorAll('#desk .dk-pane-scroll, #desk .dk-context, #desk .doc-scroll, #desk .rp-scroll, #desk .dk-fix-list, #desk .dk-side, #phone .ph-body:not(.ph-body-scan), #phone .ph-sheet-in')].every(n => n.classList.contains('tm-softscroll')) }; });
    ok(soft.mask && soft.a[0] === '0px' && soft.a[1] === '28px' && soft.b[0] === '28px' && soft.b[1] === '28px' && soft.c[0] === '28px' && soft.c[1] === '0px' && soft.all, 'scroll edges are soft: a fade only on a side with more to scroll, on every scroll area, by a mask', soft);
    await D.desk.next(page);
    const ow = await page.evaluate(() => { const V = window.Team.Desk.view(), w = document.querySelector('.dk-view.is-on .rp-window'), p = w.querySelector('.rp-page'), wr = w.getBoundingClientRect(), pane = document.querySelector('.dk-view.is-on .dk-pane.is-on').getBoundingClientRect(), txt = p.querySelector('.rp-text').textContent; return { step: V.step, hero: (() => { const pl = p.querySelector('.rp-photo .tm-plate'), im = pl.querySelector('img'), r = pl.getBoundingClientRect(); return [r.width / r.height, im.naturalWidth / im.naturalHeight, getComputedStyle(im).objectFit]; })(), titleW: getComputedStyle(p.querySelector('.rp-title')).fontWeight, addr: w.querySelector('.rp-addr').textContent, wide: wr.width, col: p.getBoundingClientRect().width - parseFloat(getComputedStyle(p).paddingLeft) - parseFloat(getComputedStyle(p).paddingRight), centred: Math.abs((wr.left + wr.right) / 2 - (pane.left + pane.right) / 2), sentences: txt.split(/(?<=[.!?])\s+/).length, sols: p.querySelectorAll('.rp-sol').length, stand: [...p.querySelectorAll('.rp-opt')].map(n => n.textContent), names: [...p.querySelectorAll('.rp-sol-title')].map(n => n.textContent), head: [...p.querySelectorAll('h2')].map(n => n.textContent).join('|'), pick: !p.querySelector('.rp-pick').hidden && p.querySelector('.rp-pick').textContent, marks: p.querySelectorAll('.tm-mark').length, law: p.querySelector('.rp-law').textContent, contact: p.innerText.includes('The phone number is not on file.'), top: w.querySelector('.rp-scroll').scrollTop, ctx: getComputedStyle(document.querySelector('.dk-view.is-on .dk-context')).display, btn: w.querySelector('.rp-act .dk-primary').textContent, btnH: w.querySelector('.rp-act .dk-primary').getBoundingClientRect().height, strip: getComputedStyle(document.querySelector('.dk-view.is-on .dk-foot')).display, bar: [...document.querySelectorAll('.dk-view.is-on .dk-pane.is-on .dk-rules-head button')].map(b => b.getAttribute('aria-label') || b.textContent).join('|'), junk: (document.querySelector('.dk-view.is-on').innerText.match(/\[object |\bnull\b|\bundefined\b|NaN|Change wording|Put it back/) || [])[0] || '' }; });
    ok(ow.step === 'owner' && /Ross Valley Fire Department · your inspection/.test(ow.addr) && !/https?:|www\./.test(ow.addr) && ow.wide > 700 && ow.col >= 600 && ow.col <= 722 && ow.centred < 2 && ow.top === 0 && ow.ctx === 'none', 'the owner’s page is a website in a browser window: wide, centred, a reading column, not clipped at the top, with no repeat of the finding beside it', ow);
    ok(ow.sentences <= 3 && ow.marks === 0 && ow.sols === 3 && ow.names[0] === 'Option 1: Remove the lower tier of bushes' && /^Option 2: /.test(ow.names[1]) && /^Option 3: /.test(ow.names[2]) && ow.stand.join('|') === 'What the inspector asked for|Another way, ask your inspector first|From your inspector' && /\|Options for how to fix it\|/.test(ow.head) && ow.pick === 'Pick one of these.' && /Town WUI Code § 604\.6\(7\)/.test(ow.law) && ow.contact && !ow.junk, '"What is wrong" is two or three sentences, the photograph is clean, only the chosen corrections are there, with the rule cited and the missing phone number said', ow);
    ok(await page.evaluate(() => { const l = [...document.querySelectorAll('.dk-view.is-on .dk-fix-name')].map(n => n.textContent); return l[0] === 'Option 1: Remove the lower tier of bushes' && /^Option 2: /.test(l[1]) && /^Option 3: /.test(l[2]); }), 'the laptop’s list carries the same "Option N: name" headings');
    const room = await page.evaluate(() => { const v = document.querySelector('.dk-view.is-on'), q = s => v.querySelector(s).getBoundingClientRect(), w = q('.rp-window'), work = q('.dk-work'), foot = v.querySelector('.rp-act'), sc = q('.rp-scroll'), figs = [...v.querySelectorAll('.rp-fig')].map(n => n.getBoundingClientRect()), tg = [...v.querySelectorAll('.rp-figwrap')].map(n => { const t = n.querySelector('.ba-toggle'), g = n.querySelector('.rp-fig'); return !t || t.getBoundingClientRect().top >= g.getBoundingClientRect().bottom - 1; }); return { fill: [w.width / work.width, w.height / work.height], foot: getComputedStyle(foot).position, footW: foot.getBoundingClientRect().width / v.getBoundingClientRect().width, bar: q('.rp-bar').height, fig: Math.max(...figs.map(r => r.height)) / sc.height, steps: Math.max(...[...v.querySelectorAll('.rp-steps')].map(o => o.children.length)), under: tg.every(Boolean), panel: [...v.querySelectorAll('.rp-sol')].map(n => getComputedStyle(n).backgroundColor).join('|'), body: parseFloat(getComputedStyle(v.querySelector('.rp-page')).fontSize) }; });
    ok(room.fill[0] > .96 && room.fill[1] > .96 && room.foot === 'absolute' && room.footW < .4 && room.bar <= 38 && ow.strip === 'none', 'the owner’s page has the whole screen: the window fills it, its bar is slim, and Publish floats at the corner of the window with no strip under it', room);
    ok(room.fig <= .61 && room.steps <= 4 && room.under && /^(rgba\(0, 0, 0, 0\)\|?)+$/.test(room.panel) && room.body >= 15 && room.body <= 16.5, 'inside it: no picture taller than six tenths of what is visible, at most four steps per option, the "Show what changed" switch under the picture, no inner panel, body text 15 to 16 px', room);
    ok(await page.evaluate(() => { const sc = document.querySelector('.dk-view.is-on .rp-scroll'), v = k => getComputedStyle(sc).getPropertyValue(k).trim(), first = sc.querySelector('.rp-agency').getBoundingClientRect(); return sc.classList.contains('tm-softscroll') && sc.scrollTop === 0 && v('--ss-top') === '0px' && v('--ss-bottom') === '28px' && first.top - sc.getBoundingClientRect().top >= 20; }), 'the page’s scroll edges are soft, and at the top of the page nothing fades over its first line');
    const bars = await page.evaluate(() => { const loose = [], thin = {}; for (const el of document.querySelectorAll('#phone *, #desk *')) { const s = getComputedStyle(el); if (!/auto|scroll/.test(s.overflowY + ' ' + s.overflowX) || el.classList.contains('tm-thinscroll')) continue; if (s.scrollbarWidth !== 'none') loose.push(String(el.className).split(' ')[0] || el.tagName); } for (const k of ['rp-scroll', 'doc-scroll']) { const el = document.querySelector('.dk-view.is-on .' + k), s = getComputedStyle(el), t = getComputedStyle(el, '::-webkit-scrollbar-track'), host = el.closest('.rp-window, .doc-frame'); thin[k] = { cls: el.classList.contains('tm-thinscroll'), own: s.scrollbarWidth, width: getComputedStyle(el, '::-webkit-scrollbar').width, top: parseFloat(t.marginTop), bottom: parseFloat(t.marginBottom), radius: parseFloat(getComputedStyle(host).borderBottomRightRadius) || 0 }; } thin.lane = (() => { const el = document.querySelector('.dk-view.is-on .rp-scroll'); return el.offsetWidth - el.clientWidth; })(); return { loose: [...new Set(loose)], thin }; });
    ok(!bars.loose.length && ['rp-scroll', 'doc-scroll'].every(k => { const t = bars.thin[k]; return t.cls && t.own === 'auto' && t.width === '8px' && t.bottom >= 14 && t.bottom >= t.radius && t.top >= 6; }) && bars.thin.lane === 16, 'a scrollbar shows only on the two drafts: thin, and its track stops short of the round corners by their radius; every other scroll area shows none', bars);
    await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 450);
    ok(await page.evaluate(weight => { const w = document.querySelector('.dk-big-layer.gl-scope > .rp-window.is-big'); if (!w) return false; const r = w.getBoundingClientRect(); return r.width >= innerWidth * .9 && r.height >= innerHeight * .85 && innerHeight - r.bottom >= 60 && parseFloat(getComputedStyle(w.querySelector('.rp-page')).fontSize) >= 17.5 && !!w.querySelector('[aria-label="Close"]') && w.querySelector('.rp-text').isContentEditable && w.querySelector('.rp-act .dk-primary').textContent === 'Publish' && document.querySelector('.tm-main').inert && getComputedStyle(w.querySelector('.rp-title')).fontWeight === weight; }, ow.titleW), 'Enlarge opens the same page over most of the window, outside the laptop: larger type in the same weights, still editable, with its own Publish button, clear of the corner buttons at the bottom of the tab');
    await page.click('.rp-window.is-big .rp-page .rp-text'); await page.keyboard.press('Meta+ArrowDown'); await page.keyboard.type(' Thank you.'); await page.waitForTimeout(120); await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await D.settle(page, 450);
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(); return /Thank you\.$/.test(V.draft.model.problem.cur) && !document.querySelector('.is-big, .dk-big-layer') && !document.querySelector('.tm-main').inert && !!document.querySelector('.dk-view.is-on .dk-pane.is-on .rp-window'); }), 'what is typed there is the same text; Escape puts the page back where it was');
    await page.dblclick('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 500);
    const twice = await page.evaluate(() => !!document.querySelector('.rp-window.is-big') && document.querySelectorAll('.dk-big-layer').length === 1);
    await page.dblclick('.rp-window.is-big .rp-bar [aria-label="Close"]'); await D.settle(page, 700);
    ok(twice && await page.evaluate(() => !document.querySelector('.dk-big-layer, .is-big') && document.querySelectorAll('.dk-view.is-on .dk-pane.is-on .rp-window').length === 1 && !!document.querySelector('.dk-view.is-on .rp-bar [aria-label="Enlarge"]') && !document.querySelector('.tm-main').inert), 'a double click on Enlarge opens it once, and a double click on Close closes it once: the page is back in the laptop, whole');
    ok(ow.btn === 'Publish' && ow.btnH <= 42, 'the last step’s one button is Publish, a normal size, on the page it publishes', ow);
    ok(Math.abs(ow.hero[0] / ow.hero[1] - 1) < .02 && ow.hero[2] === 'cover', 'the photograph on the owner’s page keeps its own proportions (it is cropped, never stretched)', ow.hero);
    ok(ow.bar === '' && await page.evaluate(() => { const pane = document.querySelector('.dk-view.is-on .dk-pane.is-on'), w = pane.querySelector('.rp-window').getBoundingClientRect(); return !/Rewrite|For the owner/.test(pane.innerText.split('\n')[0]) && !pane.querySelector('.dk-rules-head') && ![...pane.querySelectorAll('[aria-label="Undo"]')].some(n => n.offsetParent) && w.top - pane.getBoundingClientRect().top < 8; }), 'the owner’s step has no bar above the page: no title, no rewrite, no undo button; the page starts at the top', ow.bar);
    const nums = await page.evaluate(() => { const txt = document.querySelector('.dk-view.is-on .rp-page').innerText, src = JSON.stringify(window.CONTENT) + JSON.stringify(window.TeamDrafts.OWNER_STEPS) + JSON.stringify(window.Team.Desk.view().ev); return (txt.match(/§+\s*[\w.()\-]+|\d+(?:\.\d+)?\s*(?:ft|feet|days|inches|in\.)/g) || []).filter(x => !src.includes(x.replace(/\s+/g, ' ')) && !src.includes(x)); });
    ok(!nums.length, 'no citation or measurement on the owner’s page that is not in the sources', nums.join(' | '));
    await page.evaluate(() => { window.__el = document.querySelector('.dk-view.is-on .rp-page .rp-text'); });
    await page.click('.dk-view.is-on .rp-page .rp-text'); await page.keyboard.press('Meta+ArrowDown'); await page.keyboard.type(' Please call us first.'); await page.waitForTimeout(150);
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(), el = document.querySelector('.dk-view.is-on .rp-page .rp-text'); return el === window.__el && document.activeElement === el && /Please call us first\.$/.test(V.draft.model.problem.cur); }), 'click in the text and type: it saves as you type and the caret stays');
    for (let i = 0; i < 40; i++) await page.keyboard.press('Meta+z'); await page.waitForTimeout(150);
    ok(await page.evaluate(() => window.Team.Desk.view().draft.model.problem.cur == null && document.activeElement === window.__el && !/Thank you|Please call/.test(window.__el.textContent)), 'undo on the keyboard takes the typing back, as far as this text’s own words and no further, and the caret stays in it');
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(), d = document.querySelector('.dk-view.is-on .dk-pane[data-step="file"] .doc-page'); return /Checked\./.test(d.textContent) && V.draft.model.sols[0].steps[1].cur === 'Take out the low hedge only.'; }), 'it does not reach into the other texts: what was typed in the file document and in a correction’s steps is still there');
    await page.keyboard.press('Meta+Shift+z'); await page.waitForTimeout(100);
    ok(await page.evaluate(() => /Thank you\.$/.test(window.Team.Desk.view().draft.model.problem.cur || '')), 'and redo brings a step of it back');
    await page.keyboard.press('Meta+z'); await page.waitForTimeout(100);
    await page.keyboard.type(' Please call us first.'); await page.waitForTimeout(120);
    await page.click('.dk-view.is-on .rp-sol:nth-child(1) .rp-steps li:nth-child(3) .rp-step'); await page.keyboard.press('Meta+A'); await page.keyboard.type('Leave the tall plants.'); await page.keyboard.press('Escape'); await D.settle(page, 200);
    ok(await page.evaluate(() => window.Team.Desk.view().draft.model.sols[0].steps[2].cur === 'Leave the tall plants.'), 'a step typed over on the owner’s page is the same step under "How to fix it"; Escape keeps it');
    ok(await page.evaluate(() => { const V = window.Team.Desk.view(); return /Please call us first/.test(V.draft.model.problem.cur) && !document.querySelector('.dk-view.is-on .rp-law').isContentEditable && !document.querySelector('.dk-view.is-on .rp-opt').isContentEditable && !document.querySelector('.dk-view.is-on .rp-optn').isContentEditable; }), 'the rule line, the standing and the option number are not text to type into');
    await page.click('.dk-view.is-on .dk-crumb[data-step="finding"]'); await D.settle(page, 450);
    ok(await D.desk.step(page) === 'finding' && await page.evaluate(() => { const V = window.Team.Desk.view(); return V.rows.get('canopy').verdict === 'red' && V.draft.model.sols[0].steps[1].cur === 'Take out the low hedge only.' && /^Next: /.test(V.nextBtn.textContent) && getComputedStyle(document.querySelector('.dk-view.is-on .dk-context')).display !== 'none'; }), 'going back to the finding loses nothing, and the photo and note are there again');
    await page.click('.dk-view.is-on .dk-crumb[data-step="owner"]'); await D.settle(page, 450);
    ok(await D.desk.step(page) === 'owner' && await page.evaluate(() => [...document.querySelectorAll('.dk-view.is-on .dk-crumb')].map(b => b.textContent + ':' + b.dataset.state).join(' ')) === 'Finding:done How to fix it:done For the file:done For the owner:current', 'the owner’s page is the last step: there is no separate publish screen');
    await D.desk.publish(page);
    const pub = await page.evaluate(() => { const V = window.Team.Desk.view(), v = document.querySelector('.dk-view.is-on'), d = v.querySelector('.rp-done'), sc = v.querySelector('.rp-scroll').getBoundingClientRect(), dr = d.getBoundingClientRect(); return { step: V.step, published: V.published, text: d.innerText.replace(/\s+/g, ' ').trim(), shown: !d.hidden && dr.height > 30, under: dr.top >= sc.bottom - 1, btn: v.querySelector('.rp-act').hidden, undo: !!d.querySelector('[aria-label="Undo"]'), phone: document.querySelector('.ph-sent').dataset.state, item: document.querySelector('.dk-item.is-on .dk-item-state').textContent, tick: getComputedStyle(v.querySelector('.dk-crumb-tick')).opacity, mark: v.dataset.published }; });
    ok(pub.step === 'owner' && pub.published && pub.shown && pub.btn && pub.undo && pub.text === 'Published Sending to the owner is not connected yet. Nothing has left this computer.' && pub.under, 'one click on Publish, on the owner’s page: the button leaves and a line at the foot of the window says it is published and that sending is not connected, with Undo, without covering the page', pub);
    ok(pub.phone === 'reviewed' && pub.item === 'Published' && pub.tick === '1' && pub.mark === '1', 'publishing marks the finding "Published" (a tick beside its last step) and the phone’s item "Reviewed"', pub);
    await page.click('.dk-view.is-on .rp-done [aria-label="Undo"]'); await D.settle(page, 600);
    ok(await D.desk.step(page) === 'owner' && await page.evaluate(() => { const V = window.Team.Desk.view(), v = document.querySelector('.dk-view.is-on'); return !V.published && v.querySelector('.rp-done').hidden && !v.querySelector('.rp-act').hidden && v.querySelector('.rp-act .dk-primary').textContent === 'Publish' && document.querySelector('.ph-sent').dataset.state === 'sent' && document.querySelector('.dk-item.is-on .dk-item-state').textContent === 'Draft ready' && getComputedStyle(v.querySelector('.dk-crumb-tick')).opacity === '0'; }), 'Undo unpublishes in place: the Publish button is back, the finding is "Draft ready" and the phone’s item "Sent" again');
    const share = sel => page.evaluate(s => { const n = document.querySelector(s); return n.scrollTop / (n.scrollHeight - n.clientHeight); }, sel);
    await page.evaluate(() => { const n = document.querySelector('.dk-view.is-on .rp-scroll'); n.scrollTop = (n.scrollHeight - n.clientHeight) * .5; }); await D.settle(page, 250);
    await page.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(page, 450);
    { const s = await share('.rp-window.is-big .rp-scroll'), t = await page.evaluate(() => { const w = document.querySelector('.rp-window.is-big'), k = getComputedStyle(w.querySelector('.rp-scroll'), '::-webkit-scrollbar-track'); return [parseFloat(getComputedStyle(w).borderBottomRightRadius), parseFloat(k.marginBottom)]; }); ok(Math.abs(s - .5) < .12 && t[1] >= t[0], 'Enlarge keeps the place in the page, and the enlarged page’s scrollbar also stops short of its round corners', [s, t]); }
    await page.click('.rp-window.is-big .rp-act .dk-primary'); await D.settle(page, 600);
    ok(await page.evaluate(() => { const w = document.querySelector('.rp-window.is-big'), d = w && w.querySelector('.rp-done'); return !!w && window.Team.Desk.view().published && !d.hidden && /Sending to the owner is not connected yet\./.test(d.textContent) && document.querySelector('.ph-sent').dataset.state === 'reviewed'; }), 'Publish works the same from the enlarged page, which stays open and says so in place');
    await page.keyboard.press('Escape'); await D.settle(page, 450);
    ok(await page.evaluate(() => { const v = document.querySelector('.dk-view.is-on'); return !document.querySelector('.dk-big-layer') && !v.querySelector('.rp-done').hidden && window.Team.Desk.view().published; }), 'closing the enlarged page returns to the laptop, still published');
    { const s = await share('.dk-view.is-on .rp-scroll'); ok(Math.abs(s - .5) < .15, 'and closing it keeps the place too', s); }
    await page.click('.dk-view.is-on .rp-done [aria-label="Undo"]'); await D.settle(page, 600);
    ok(await page.evaluate(() => !/Put it back|Take it back|Change wording|Use it again/.test(document.body.innerText) && [...document.querySelectorAll('[aria-label="Put it back"], [aria-label="Take it back"]')].length === 0), 'every reverse action is Undo; no "put it back", "take it back" or "change wording" in words anywhere');
    ok(await page.evaluate(() => !/\bhold\b/i.test(document.body.innerText) && !document.querySelector('.tm-hold-fill, [data-gl="hold"], .gl-hold-fill')), 'nothing is pressed and held: no hold wording, no hold fill');

    // ---- 2f. a second finding: the sidebar eases in; the year question
    await D.phone.next(page); await D.phone.scene(page, 'sprinkler'); await D.phone.shoot(page); await D.phone.confirm(page);
    ok(await page.evaluate(() => { const q = document.querySelector('.ph-layer:not(.leaving) .ph-q'); return q.querySelector('.ph-q-ask').textContent === 'What year is stamped on the sprinkler?' && q.querySelectorAll('.ph-digit').length === 4 && q.querySelectorAll('.ph-key').length === 11 && !q.querySelector('.ph-padwrap').hidden && q.querySelector('.ph-cant').textContent === 'I can’t see a year' && !!q.querySelector('.ph-attach') && q.querySelector('.ph-digit').classList.contains('is-caret'); }), 'year question: the drawing, four digit boxes with the first marked, the keys on the screen, a quiet exception and a camera button');
    await page.keyboard.type('2099'); await D.settle(page, 200);
    ok(await page.evaluate(() => window.Team.Phone.state.answers.year.value == null && /not a year/.test(document.querySelector('.ph-q-say').textContent)), 'a year in the future is not taken');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Backspace'); await D.phone.type(page, 1996);
    ok(await page.evaluate(() => window.Team.Phone.state.answers.year.value === 1996 && [...document.querySelectorAll('.ph-digit')].map(d => d.textContent).join('') === '1996' && document.querySelector('.ph-q-say').textContent === 'The senior inspector will check its age.'), 'the typed year shows in the boxes above the keys, with one calm line under it');
    await D.phone.send(page);
    ok(await page.evaluate(() => document.querySelector('.dk-panes').dataset.rail === 'on' && document.querySelectorAll('.dk-item').length === 2 && [...document.querySelectorAll('.dk-item-state')].map(n => n.textContent).join('|') === 'To review|Draft ready' && window.Team.Desk.view().f.scene === 'ladder'), 'the second finding brings the sidebar in and does not take the laptop away from the first');
    await page.click('.dk-item:nth-child(1) .dk-item-btn'); await D.settle(page, 500);
    const rest2 = await page.evaluate(() => document.querySelector('.dk-view.is-on').innerText.trim().split(/\s+/).length);
    ok(rest2 <= 225 && await page.evaluate(() => { const V = window.Team.Desk.view(); return V.f.facts.year === 1996 && /Year on the sprinkler: 1996\./.test(document.querySelector('.dk-view.is-on .dk-fieldline').textContent); }), 'the sprinkler finding opens with the year, and a third or less of the words it used to show (676 before)', rest2); console.log('words on the laptop at rest, sprinkler: ' + rest2);
    await page.click('.dk-view.is-on .dk-recorded-toggle'); await D.settle(page, 400);
    ok(await page.evaluate(() => { const r = document.querySelector('.dk-view.is-on .dk-recorded'); return !r.hidden && /Asked on site/.test(r.textContent) && !r.querySelector('input, [role=checkbox], .tm-box') && /The app has neither list\./.test(r.textContent); }), '"What the field inspector recorded" opens to plain lines and says the app holds no age or recall list');
    await page.evaluate(() => { window.__alive = true; }); await page.click('#tmReset'); await D.settle(page, 500);
    ok(await page.evaluate(() => window.__alive === true && window.Team.Desk.views.size === 0 && document.querySelector('.dk-empty.is-on') && document.getElementById('phone').dataset.screen === 'camera'), '"Start over" empties both devices without reloading the page');
    ok(!s1.errors.length, 'no page errors through the whole session', s1.errors.join(' | '));
    await s1.ctx.close();

    // ---- 2g. a photo the app cannot read goes through as a note, with no rules attached
    const c1 = await D.open(browser, URL);
    await c1.page.click('.ph-actions-camera .ph-round'); await c1.page.evaluate(() => window.Team.Phone.picked('../assets/ladderfuel.jpg')); await D.waitScreen(c1.page, 'scan'); await c1.page.waitForTimeout(1500);
    ok(await c1.page.evaluate(() => document.querySelectorAll('.ph-win').length === 0 && document.querySelector('.ph-scan-said').textContent === 'Nothing was marked.'), 'a photo from the gallery: the line passes and it says plainly that nothing was marked');
    await D.waitScreen(c1.page, 'note'); await D.settle(c1.page);
    await c1.page.fill(D.LAYER + ' .ph-own-text', 'The gate is blocked by a parked trailer.'); await D.primary(c1.page).click(); await D.waitScreen(c1.page, 'questions'); await D.settle(c1.page); await D.phone.send(c1.page);
    ok(await c1.page.evaluate(() => { const V = window.Team.Desk.view(); return V && V.f.scene === 'custom' && /could not read this photo/.test(document.querySelector('.dk-view.is-on .dk-gap').textContent) && document.querySelector('.dk-view.is-on .dk-crumbs').hidden; }), 'on the laptop it has the note, no rules and no further steps');
    await D.desk.approve(c1.page);
    ok(await c1.page.evaluate(() => window.Team.Desk.view().published && document.querySelector('.ph-sent').dataset.state === 'reviewed'), 'Approve marks it reviewed on both devices');
    ok(!c1.errors.length, 'photo with no reading: no errors', c1.errors.join('|')); await c1.ctx.close();

    // ---- 2k. every action is one press, so a double press must not run on into the next screen or step
    const d1 = await D.open(browser, URL);
    await D.phone.scene(d1.page, 'ladder'); await D.phone.shoot(d1.page); await d1.page.dblclick(D.LAYER + ' .ph-primary'); await d1.page.waitForTimeout(900);
    ok(await D.screen(d1.page) === 'questions' && await d1.page.evaluate(() => window.Team.Desk.views.size === 0), 'phone: a double tap on "Use this note" goes to the question and does not send');
    await D.phone.pick(d1.page, 'under10'); await D.phone.send(d1.page);
    await d1.page.dblclick('.dk-view.is-on .dk-foot .dk-primary'); await D.settle(d1.page, 700);
    ok(await D.desk.step(d1.page) === 'fix', 'laptop: a double click on Approve stops at "How to fix it"', await D.desk.step(d1.page));
    await d1.page.dblclick('.dk-view.is-on .dk-foot .dk-primary'); await D.settle(d1.page, 700);
    ok(await D.desk.step(d1.page) === 'file' && !d1.errors.length, 'and a double click on the next button moves one step', await D.desk.step(d1.page)); await d1.ctx.close();

    for (const [w, hgt] of [[1280, 720], [1440, 900]]) { const s = await D.open(browser, URL, { width: w, height: hgt }); await D.desk.seed(s.page, 'ladder', 'ross', { answers: { distance: { pick: 'under10' } } }); await s.page.waitForTimeout(500); await D.desk.approve(s.page); await D.settle(s.page, 450); const o = await apart(s.page); ok(!o, w + ' x ' + hgt + ', one finding: the correction’s picture and its words sit side by side, apart', o); await s.ctx.close(); }

    // ---- 2h. inside the shell, a real phone, reduced motion, the kit off
    const e1 = await D.open(browser, URL + '?embedded=1');
    ok(await e1.page.evaluate(() => getComputedStyle(document.querySelector('.shell-bar')).display === 'none' && document.querySelector('.tm-main').scrollHeight <= document.querySelector('.tm-main').clientHeight + 1), 'embedded in the shell: its own bar is hidden and the stage fits with no scroll'); ok(!e1.errors.length, 'embedded: no errors', e1.errors.join('|')); await e1.ctx.close();
    for (const [w, hgt, win] of [[1440, 836, '1440 x 900'], [1280, 656, '1280 x 720']]) {      // the frame the shell gives this page: the window less its 64 px bar
      const e = await D.open(browser, URL + '?embedded=1', { width: w, height: hgt });
      const g = await e.page.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), p = q('.tm-phone'), l = q('.tm-laptop'), m = document.querySelector('.tm-main'); return { tops: p.top - l.top, bottoms: p.bottom - l.bottom, phone: p.width / p.height, scroll: Math.max(m.scrollWidth - m.clientWidth, m.scrollHeight - m.clientHeight, document.documentElement.scrollHeight - innerHeight), inside: p.top >= 0 && l.bottom <= innerHeight + .5 && p.bottom <= innerHeight + .5 }; });
      ok(g.scroll <= 1 && g.inside && Math.abs(g.tops) <= 1 && Math.abs(g.bottoms) <= 1 && Math.abs(g.phone / (390 / 844) - 1) < .01, 'inside the shell at ' + win + ' (under the 64 px bar): nothing scrolls and the two devices are the same height', g);
      await e.ctx.close();
    }
    const m1 = await D.open(browser, URL, { width: 390, height: 844 });
    ok(await m1.page.evaluate(() => { const p = document.querySelector('.tm-phone').getBoundingClientRect(); return getComputedStyle(document.querySelector('.tm-laptop')).display === 'none' && Math.round(p.width) === 390 && getComputedStyle(document.querySelector('.tm-phone')).transform === 'none' && document.documentElement.scrollWidth <= 390; }), 'on a real phone the phone fills the screen, unscaled, and the laptop is behind a switch');
    await D.phone.shoot(m1.page); await D.phone.confirm(m1.page); await D.phone.send(m1.page);
    ok(await m1.page.evaluate(() => document.querySelector('.tm-badge').textContent === '1'), 'on a real phone a sent finding is counted on the Laptop tab');
    await m1.page.click('.tm-devseg button[data-value="desk"]'); await D.settle(m1.page, 600); await D.desk.approve(m1.page); await D.settle(m1.page, 300);
    ok(await D.desk.step(m1.page) === 'fix' && !(await apart(m1.page)), 'on a real phone the laptop’s button is clear of the page’s corner buttons and can be pressed; the correction’s picture comes first and its words under it'); ok(!m1.errors.length, 'real phone: no errors', m1.errors.join('|')); await m1.ctx.close();
    const r1 = await D.open(browser, URL, { reduced: true });
    await r1.page.click('.ph-shutter'); await D.waitScreen(r1.page, 'scan'); await D.settle(r1.page, 250);
    ok(await r1.page.evaluate(() => { const lit = [...document.querySelectorAll('.ph-win.is-lit')]; return lit.length === 1 && lit[0].classList.contains('is-finding') && document.querySelector('.ph-layer:not(.leaving) [data-skip]').textContent === 'Continue'; }), 'reduced motion: the scan is its final still, the finding lit, with "Continue"'); ok(!r1.errors.length, 'reduced motion: no errors', r1.errors.join('|')); await r1.ctx.close();
    const g0 = await D.open(browser, URL + '?gleb=0');
    const cam0 = await g0.page.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(), k = q('.tm-phone').height / 844; return [(q('.ph-lens').top - q('.ph-view').top) / k, (q('.ph-stage').top - q('.ph-lens').bottom) / k]; });
    ok(cam0[1] >= 20 && cam0[1] <= 24 && cam0[0] >= cam0[1] - .5, 'kit off: the scene switch keeps the same gaps', cam0);
    await D.desk.seed(g0.page, 'sprinkler', 'ross'); await g0.page.waitForTimeout(400); await g0.page.click('.dk-row[data-verdict="yellow"] .dk-verdict'); await D.settle(g0.page, 380); await g0.page.focus('.dk-toggle'); await g0.page.keyboard.press('ArrowRight'); await D.settle(g0.page, 320);
    ok(await g0.page.evaluate(() => { const lum = el => { const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g); return (+m[0] + +m[1] + +m[2]) / 3; }, t = document.querySelector('.dk-toggle'), top = document.querySelector('.shell-nav .shell-seg-ind'); return !document.documentElement.classList.contains('gleb') && lum(t.querySelector('.shell-seg-ind')) > 235 && lum(top) > 235 && t.classList.contains('shell-seg') && t.querySelector('button.on').dataset.value === 'green' && +getComputedStyle(t.querySelector('button.on')).fontWeight > +getComputedStyle(t.querySelector('button:not(.on)')).fontWeight; }), 'with the kit off the switch is the same component as the top tabs: a raised white pill, the chosen word at full weight; the arrow keys choose a side'); ok(!g0.errors.length, 'kit off: no errors', g0.errors.join('|')); await g0.ctx.close();

    // ---- 2j. when one thing is replaced by another, the old leaves before the new arrives: stepped frame by frame.
    // watch() runs an action and then reads two opacities on every frame; both() counts frames in which both are legible.
    const watch = (page, act, read, ms) => page.evaluate(([act, read, ms]) => new Promise(res => {
      const eff = el => { if (!el || !el.isConnected) return 0; let o = 1; for (let p = el; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.visibility === 'hidden' || s.display === 'none') return 0; o *= +s.opacity; } return o; };
      const rd = new Function('eff', 'return (' + read + ')(eff)'), out = [], t0 = performance.now(); new Function(act)();
      (function step() { let v; try { v = rd(eff); } catch (e) { v = [0, 0]; } out.push(v.map(x => Math.round(x * 100) / 100)); if (performance.now() - t0 < ms) requestAnimationFrame(step); else res(out); })();
    }), [act, read, ms]);
    const both = fr => fr.filter(x => Math.min(x[0], x[1]) > .3).length, seen = (fr, i) => fr.some(x => x[i] > .9);
    const w1 = await D.open(browser, URL), wp = w1.page;
    await D.desk.seed(wp, 'ladder', 'ross', { answers: { distance: { pick: '10to30' } } }); await wp.waitForTimeout(500);
    const SW = "eff => { const r = document.querySelector('.dk-row[data-key=\"roadside\"]'), t = r.querySelector('.dk-toggle'); return [eff(r.querySelector('.dk-verdict .tm-vword')), t ? Math.max(...[...t.querySelectorAll('button > span')].map(eff)) : 0]; }";
    let fr = await watch(wp, "document.querySelector('.dk-row[data-key=\"roadside\"] .dk-verdict').click()", SW, 450);
    ok(fr.length > 12 && both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'opening the verdict switch: the verdict’s word is gone before the switch’s words arrive (' + fr.length + ' frames)', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4));
    fr = await watch(wp, "document.querySelector('.dk-toggle button[data-value=\"red\"]').click()", SW, 900);
    ok(fr.length > 20 && both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'closing it: the switch’s words are gone before the new verdict word arrives (' + fr.length + ' frames)', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4));
    await D.settle(wp, 500);
    ok(await wp.evaluate(() => [...document.querySelectorAll('.dk-view.is-on .dk-verdict .tm-vword')].every(n => n.scrollWidth <= n.clientWidth + 1 && n.getBoundingClientRect().right <= n.closest('.dk-row-line').querySelector('.dk-row-open').getBoundingClientRect().left + 1)), 'no verdict word is clipped or runs into the rule’s name');
    fr = await watch(wp, "document.querySelector('.dk-row[data-key=\"roadside\"] .dk-verdict').click()", SW, 450); await wp.keyboard.press('Escape'); await D.settle(wp, 400);
    await D.desk.open(wp, 'ladder-reach');
    fr = await watch(wp, "document.querySelector('.dk-row.is-open [aria-label=\"Change wording\"]').click()", "eff => { const i = document.querySelectorAll('.dk-row.is-open .dk-read-tools .tm-sym[data-glyph] > .tm-icon'); return [eff(i[0]), eff(i[1])]; }", 400);
    ok(both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'the pencil leaves before the tick arrives, in the same spot', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4)); await wp.keyboard.press('Escape');
    await D.desk.approve(wp); await D.settle(wp, 500);
    fr = await watch(wp, "document.querySelector('.dk-view.is-on .dk-fix-row:nth-child(2)').click()", "eff => { const p = document.querySelectorAll('.dk-view.is-on .dk-detail > .dk-detail-pane'); return [p.length > 1 ? 1 : 0, p.length > 1 ? 1 : 0]; }", 450);
    ok(both(fr) === 0, 'the large before and after is replaced as one unit: never two in the pane at once');
    fr = await watch(wp, "document.querySelector('.dk-view.is-on .dk-crumb[data-step=\"finding\"]').click()", "eff => [eff(document.querySelector('.dk-view.is-on .dk-pane[data-step=\"fix\"] .dk-h')), eff(document.querySelector('.dk-view.is-on .dk-pane[data-step=\"finding\"] .dk-h'))]", 450);
    ok(both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'a step change: the old step leaves before the new one arrives', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4));
    fr = await watch(wp, "document.querySelector('.dk-view.is-on .dk-crumb[data-step=\"fix\"]').click()", "eff => { const g = document.querySelectorAll('.tm-ghost').length; return [g ? 1 : 0, g ? 1 : 0]; }", 450);
    ok(both(fr) === 0, 'a text that changes (the button’s label) is never drawn twice');
    await D.desk.next(wp); await D.desk.next(wp);
    const PUB = "eff => [eff(document.querySelector('.dk-view.is-on .rp-act .dk-primary')), eff(document.querySelector('.dk-view.is-on .rp-done-text'))]";
    fr = await watch(wp, "document.querySelector('.dk-view.is-on .rp-act .dk-primary').click()", PUB, 700);
    ok(await D.desk.step(wp) === 'owner' && both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'publishing: the button is gone before the published line arrives', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4));
    fr = await watch(wp, "document.querySelector('.dk-view.is-on .rp-done [aria-label=\"Undo\"]').click()", PUB, 700);
    ok(both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'undoing it: the line is gone before the button returns', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4));
    // the end of the scan: every mark leaves in one fade, the same on every frame; and the same when it is skipped
    const MARKS = "eff => { const m = [...document.querySelectorAll('.ph-scan > [data-w]')]; if (!m.length) return [0, 0]; const o = m.map(n => +getComputedStyle(n).opacity); return [Math.max(...o), Math.min(...o)]; }";
    const TAG = "document.querySelectorAll('.ph-scan > *').forEach(n => { if (+getComputedStyle(n).opacity > .9) n.dataset.w = '1'; });";
    const together = fr => fr.every(x => x[0] - x[1] <= .08) && fr[0][0] > .9 && fr[fr.length - 1][0] === 0 && fr.some(x => x[0] > .15 && x[0] < .85);
    for (const scene of ['sprinkler', 'ladder']) {
      await D.phone.scene(wp, scene); await wp.click('.ph-shutter'); await D.waitScreen(wp, 'scan'); await wp.waitForTimeout(2150);
      fr = await watch(wp, TAG, MARKS, 1300);
      ok(together(fr) && fr.filter(x => x[0] > 0).length > 3, scene + ' scan: at the end the dimming, every window and every tag fade out together, in one move', fr.filter(x => x[0] - x[1] > .08).slice(0, 4));
      await D.waitScreen(wp, 'note'); await D.settle(wp, 300); await wp.click(D.LAYER + ' .ph-back'); await D.settle(wp, 450);
      await wp.click('.ph-shutter'); await D.waitScreen(wp, 'scan'); await wp.waitForTimeout(scene === 'sprinkler' ? 1500 : 1700);
      fr = await watch(wp, TAG + " document.querySelector('.ph-layer:not(.leaving) [data-skip]').click();", MARKS, 700);
      ok(together(fr), scene + ' scan, skipped: the same single fade', fr.filter(x => x[0] - x[1] > .08).slice(0, 4));
      await D.waitScreen(wp, 'note'); await D.settle(wp, 300);
      ok(await wp.evaluate(() => !document.querySelector('.ph-stage .ph-win, .ph-stage .ph-win-tag, .ph-stage .ph-scan-veil, .ph-stage .ph-scan-line')), scene + ': nothing of the scan is left on the photograph');
      await wp.click(D.LAYER + ' .ph-back'); await D.settle(wp, 450);
    }
    await D.phone.shoot(wp);
    fr = await watch(wp, "document.querySelector('.ph-layer:not(.leaving) .ph-primary').click()", "eff => [eff(document.querySelector('.ph-layer.leaving .ph-opts')), eff(document.querySelector('.ph-layer:not(.leaving) .ph-q-ask'))]", 500);
    ok(both(fr) === 0 && seen(fr, 0) && seen(fr, 1), 'the phone: one screen’s words leave before the next screen’s arrive', fr.filter(x => Math.min(x[0], x[1]) > .3).slice(0, 4));
    ok(!w1.errors.length, 'frame-by-frame session: no errors', w1.errors.join('|')); await w1.ctx.close();
    }

    // ---- 2i. every screen at four window sizes, and once more with the kit off: no control cut by what clips it, no
    // words crowding a round corner, no default scrollbar, nothing lying on anything else
    let checked = 0, screens = 0; const cuts = [], crowded = [], loose = [], spills = [], piled = [];
    for (const [w, hgt, look] of [...SIZES.slice(0, 4).map(s => [s[0], s[1], '']), [1440, 900, '?gleb=0']]) {
      const { ctx, page: p, errors } = await D.open(browser, URL + look, { width: w, height: hgt });
      const audit = async (label, root) => { const where = w + 'x' + hgt + (look ? ' kit off ' : ' ') + label, r = await p.evaluate(clipAudit, root || '#phone, #desk'); checked += r.n; r.bad.forEach(b => cuts.push(where + ': ' + b)); (await p.evaluate(roundAudit, root || '#phone, #desk')).forEach(b => crowded.push(where + ': ' + b)); (await p.evaluate(looseBars, root || '#phone, #desk')).forEach(b => loose.push(where + ': ' + b)); screens++; };
      await audit('camera');
      for (const scene of ['sprinkler', 'ladder']) {
        await D.phone.scene(p, scene); await D.phone.shoot(p); await audit(scene + ' note');
        await p.click(D.LAYER + ' .ph-opt[data-i="own"]'); await D.settle(p, 200); await p.fill(D.LAYER + ' .ph-own-text', 'Something I saw'); await audit(scene + ' own words');
        await p.click(D.LAYER + ' .ph-opt[data-i="0"] .ph-opt-edit'); await D.settle(p, 150); await audit(scene + ' editing a note'); await p.keyboard.press('Escape'); await p.click(D.LAYER + ' .ph-opt[data-i="0"]');
        await D.phone.confirm(p); await audit(scene + ' question');
        await D.phone.type(p, scene === 'sprinkler' ? 1996 : 14); await D.settle(p, 300); await audit(scene + ' answered');
        { const o = await p.evaluate(() => { const b = document.querySelector('.ph-layer:not(.leaving) .ph-body'); return b.scrollHeight - b.clientHeight; }); if (o > 1) spills.push(w + 'x' + hgt + (look ? ' kit off ' : ' ') + scene + ': ' + o + ' px'); }
        await p.click(D.LAYER + ' .ph-attach'); await D.settle(p, 420); await audit(scene + ' photo sheet'); await p.click('.ph-sheet .ph-btn-quiet'); await D.settle(p, 380);
        await p.click(D.LAYER + ' .ph-cant'); await D.settle(p, 300); await audit(scene + ' exception');
        await D.phone.send(p); await audit(scene + ' sent'); await D.phone.next(p);
      }
      await audit('laptop finding, two findings');
      await p.click('.dk-view.is-on .dk-row .dk-row-open'); await D.settle(p, 380); await p.click('.dk-view.is-on .dk-row.is-open [aria-label="Change wording"]'); await D.settle(p, 150); await audit('laptop rule open, editing'); await p.keyboard.press('Escape');
      await p.click('.dk-view.is-on .dk-row[data-verdict="yellow"] .dk-verdict'); await D.settle(p, 380); await audit('laptop verdict switch'); await p.keyboard.press('Escape'); await D.settle(p, 320);
      await p.click('.dk-view.is-on .dk-recorded-toggle'); await D.settle(p, 380); await audit('laptop recorded');
      await D.desk.approve(p); await D.settle(p, 450); await audit('laptop corrections');
      { const o = await apart(p); if (o) piled.push(w + 'x' + hgt + (look ? ' kit off' : '') + ', two findings: ' + o); }
      await p.click('.dk-view.is-on .dk-detail ' + tb('Ask for a rewrite')); await D.settle(p, 350); await p.click('.dk-view.is-on .dk-detail .dk-card-stepshead [aria-label="Change wording"]'); await D.settle(p, 200); await audit('laptop correction, rewrite form, editing'); await p.click('.dk-view.is-on .dk-detail .dk-card-stepshead [aria-label="Done"]');
      await p.click('.dk-view.is-on ' + tb('Write my own')); await D.settle(p, 450); await audit('laptop write my own');
      await p.click('.dk-view.is-on .dk-fix-row'); await D.settle(p, 400);
      await D.desk.next(p); await audit('laptop file');
      await D.desk.next(p); await audit('laptop owner page');
      if (w === 1280) ok(await p.evaluate(() => { const sc = document.querySelector('.dk-view.is-on .rp-scroll'), r = sc.getBoundingClientRect(), hd = [...sc.querySelectorAll('h2')].find(n => n.textContent === 'What is wrong').getBoundingClientRect(), tx = sc.querySelector('.rp-text').getBoundingClientRect(); return sc.scrollTop === 0 && hd.bottom < r.bottom - 28 && tx.top < r.bottom - 34; }), '1280 x 720: the first screenful of the owner’s page still reaches "What is wrong" and the start of its words');
      await p.click('.dk-view.is-on .rp-page .rp-text'); await D.settle(p, 150); await audit('laptop owner page, typing'); await p.keyboard.press('Escape');
      await p.click('.dk-view.is-on .rp-bar [aria-label="Enlarge"]'); await D.settle(p, 450); await audit('owner page enlarged', '.dk-big-layer'); await p.keyboard.press('Escape'); await D.settle(p, 450);
      await D.desk.publish(p); await audit('laptop published');
      ok(!errors.length, w + 'x' + hgt + (look ? ' kit off' : '') + ': no errors through every screen', errors.join(' | '));
      await ctx.close();
    }
    ok(!cuts.length, 'no control is cut at an edge, in any state, at any of the four sizes or with the kit off (' + checked + ' control boxes checked)', cuts.slice(0, 5).join(' || '));
    ok(!piled.length, 'the large before and after, its switch and its words never lie on one another, at any size, with the sidebar out', piled.join(' | '));
    ok(!spills.length, 'the question screens fit with their keys out: nothing is pushed under the fold, "Not sure" stays whole', spills.join(' | '));
    ok(!loose.length, 'on every screen a scroll area shows either no scrollbar or the thin one that keeps to the straight part', [...new Set(loose.map(c => c.split(': ').slice(1).join(': ')))].slice(0, 6).join(' || '));
    ok(!crowded.length, 'no words crowd a round corner: content is set in from every rounded edge in step with its rounding (' + screens + ' screens checked, both looks)', [...new Set(crowded.map(c => c.split(': ').slice(1).join(': ')))].slice(0, 6).join(' || '));
    console.log('controls checked for clipping: ' + checked + '; screens checked for crowded corners: ' + screens); [...new Set(cuts)].forEach(c => console.log('  CUT ' + c)); [...new Set(crowded)].slice(0, 30).forEach(c => console.log('  CROWDED ' + c));
  } catch (e) { fail++; failed.push('the test run stopped: ' + String(e && e.message).slice(0, 1500)); }
  finally { clearTimeout(kill); if (browser) await browser.close(); if (server) server.close(); }
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  failed.forEach(f => console.log('  FAIL ' + f));
  process.exit(fail ? 1 : 0);
})();
