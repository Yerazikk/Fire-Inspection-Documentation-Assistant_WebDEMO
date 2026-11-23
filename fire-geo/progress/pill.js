// Queue button: a small pill, bottom left, that opens the list of what is being worked on, what is next and what is done.
// Drop-in: <script src="/progress/pill.js" defer></script>. Reads /progress/queue.json (and status.json if present) every 8 s.
// Andrew, 2026-11-22: "always keep a lil button somewhere where i can see the current queue and whats being worked on and the progress".
(function () {
  if (window.top !== window || document.getElementById('qpill')) return;       // one per window, not inside embedded views
  const css = `
#qpill{position:fixed;left:18px;bottom:18px;z-index:2147483000;font:600 13px/1 ui-rounded,"SF Pro Rounded",-apple-system,BlinkMacSystemFont,sans-serif;color:#262a31}
#qpill button.qp-btn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px 0 10px;border-radius:99px;background:rgba(255,255,255,.86);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.95);box-shadow:0 1px 2px rgba(38,42,49,.08),0 10px 24px -12px rgba(38,42,49,.35);transition:transform 140ms cubic-bezier(.22,1,.36,1)}
#qpill button.qp-btn:active{transform:scale(.96)}#qpill button.qp-btn:focus-visible{outline:2px solid #262a31;outline-offset:2px}
#qpill svg.qp-ring{width:20px;height:20px;transform:rotate(-90deg)}#qpill svg.qp-ring circle{fill:none;stroke-width:3;stroke-linecap:round}
#qpill .qp-bg{stroke:rgba(38,42,49,.12)}#qpill .qp-fg{stroke:#4667f5;stroke-dasharray:50.3;stroke-dashoffset:50.3;transition:stroke-dashoffset 500ms cubic-bezier(.22,1,.36,1)}
#qpill .qp-count{font-variant-numeric:tabular-nums}
#qpill .qp-panel{position:absolute;left:0;bottom:48px;width:min(380px,calc(100vw - 36px));max-height:min(70vh,560px);overflow:auto;padding:16px 16px 8px;border-radius:20px;background:rgba(255,255,255,.94);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.95);box-shadow:0 1px 2px rgba(38,42,49,.08),0 24px 50px -20px rgba(38,42,49,.45);opacity:0;transform:translateY(8px);pointer-events:none;visibility:hidden;transition:opacity 160ms cubic-bezier(.22,1,.36,1),transform 220ms cubic-bezier(.22,1,.36,1),visibility 0s linear 220ms}
#qpill.open .qp-panel{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition-delay:0s}
#qpill .qp-panel{scrollbar-width:thin;scrollbar-color:rgba(38,42,49,.28) transparent}
#qpill .qp-panel::-webkit-scrollbar{width:10px}
#qpill .qp-panel::-webkit-scrollbar-track{background:transparent;margin:22px 0}
#qpill .qp-panel::-webkit-scrollbar-thumb{background:rgba(38,42,49,.26);border-radius:99px;border:3px solid transparent;background-clip:padding-box}
#qpill .qp-head{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;font-weight:650;margin-bottom:4px}
#qpill .qp-head a{font-size:12.5px;font-weight:600;color:#5b6170;text-decoration:none;border-bottom:1.5px solid rgba(38,42,49,.12)}
#qpill .qp-sec{font-size:12px;font-weight:600;color:#8a90a0;margin:14px 0 2px}
#qpill ul{list-style:none;margin:0;padding:0}
#qpill li{display:grid;grid-template-columns:16px 1fr;gap:9px;padding:8px 0;border-top:1px solid rgba(38,42,49,.08);font-weight:500;font-size:13px;line-height:1.35;}
#qpill li small{display:block;font-size:11.5px;color:#8a90a0;font-weight:600;margin-top:1px}
#qpill li i{width:12px;height:12px;margin-top:3px;border-radius:50%;border:1.5px solid rgba(38,42,49,.25)}
#qpill li[data-s=working] i{border-color:#4667f5;border-width:2px}
#qpill li[data-s=done] i{background:#4667f5;border-color:#4667f5}
#qpill li[data-s=done]{color:#8a90a0}#qpill li[data-s=queued]{color:#5b6170}
@media (prefers-reduced-motion:reduce){#qpill *{transition:none!important;animation:none!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'qpill';
  root.innerHTML = '<div class="qp-panel" role="dialog" aria-label="Work queue"><div class="qp-head"><span>Work queue</span><a href="/progress/">Full progress</a></div>' +
    '<div class="qp-sec" data-sec="working">Working on now</div><ul data-list="working"></ul><div class="qp-sec" data-sec="queued">Up next</div><ul data-list="queued"></ul><div class="qp-sec" data-sec="done">Done</div><ul data-list="done"></ul></div>' +
    '<button class="qp-btn" aria-expanded="false" aria-label="Work queue"><svg class="qp-ring" viewBox="0 0 20 20"><circle class="qp-bg" cx="10" cy="10" r="8"/><circle class="qp-fg" cx="10" cy="10" r="8"/></svg><span class="qp-count">Queue</span></button>';
  document.body.appendChild(root);
  const btn = root.querySelector('.qp-btn'), fg = root.querySelector('.qp-fg'), count = root.querySelector('.qp-count');
  const toggle = on => { root.classList.toggle('open', on); btn.setAttribute('aria-expanded', String(on)); };
  btn.addEventListener('click', () => toggle(!root.classList.contains('open')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  document.addEventListener('pointerdown', e => { if (!root.contains(e.target)) toggle(false); });
  const rows = new Map();
  async function tick() {
    let q; try { q = await (await fetch('/progress/queue.json?' + Date.now(), { cache: 'no-store' })).json(); } catch { return; }
    const items = q.items || [], n = s => items.filter(i => i.state === s).length, done = n('done');
    const label = n('working') + ' in progress · ' + done + ' of ' + items.length + ' done'; if (count.textContent !== label) count.textContent = label;
    fg.style.strokeDashoffset = 50.3 * (1 - (items.length ? done / items.length : 0));
    const seen = new Set();
    for (const it of items) {                                  // keyed: a row is made once; only its text or state attribute changes
      seen.add(it.id); let li = rows.get(it.id);
      if (!li) { li = document.createElement('li'); li.innerHTML = '<i></i><span><span class="qp-t"></span><small></small></span>'; rows.set(it.id, li); }
      const t = li.querySelector('.qp-t'), sm = li.querySelector('small'); if (t.textContent !== it.text) t.textContent = it.text; if (sm.textContent !== (it.area || '')) sm.textContent = it.area || '';
      if (li.dataset.s !== it.state) li.dataset.s = it.state;
    }
    for (const [id, li] of rows) if (!seen.has(id)) { li.remove(); rows.delete(id); }
    // newest first inside each group (items are listed in the order they were asked). Touch the DOM only when the order really changed.
    for (const st of ['working', 'queued', 'done']) {
      const ul = root.querySelector('[data-list="' + st + '"]'), want = items.filter(i => i.state === st).reverse().map(i => rows.get(i.id));
      const have = [...ul.children]; if (have.length === want.length && have.every((n, k) => n === want[k])) continue;
      want.forEach((li, k) => { if (ul.children[k] !== li) ul.insertBefore(li, ul.children[k] || null); });
    }
    for (const s of ['working', 'queued', 'done']) root.querySelector('[data-sec="' + s + '"]').style.display = n(s) ? '' : 'none';
  }
  tick(); setInterval(tick, 8000);
})();
