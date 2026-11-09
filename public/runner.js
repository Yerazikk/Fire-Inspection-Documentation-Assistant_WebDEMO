// Executes PROMPTS against the live UI with a visible cursor. Manual tapping keeps working in between.
(function () {
  const phone = document.querySelector('.phone'); const cur = document.createElement('div'); cur.className = 'cursor'; cur.innerHTML = '<i class="ping"></i>'; phone.appendChild(cur); const sayEl = document.createElement('div'); sayEl.className = 'rsay'; phone.appendChild(sayEl);
  let running = false, stopFlag = false;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function find(sel) { if (sel.includes(' >> ')) { const [a, b] = sel.split(' >> '); const base = b === 'last' ? [...document.querySelectorAll(a)].pop() : null; if (b === 'last') return base; const parent = find(a); return parent ? parent.querySelector(b) : null; } if (sel.includes(':has-text(')) { const m = sel.match(/^(.*?):has-text\("(.*)"\)$/); return [...document.querySelectorAll(m[1])].find(e => e.textContent.includes(m[2])) || null; } return document.querySelector(sel); }
  function place(el, dy) { const r = el.getBoundingClientRect(), p = phone.getBoundingClientRect(); cur.style.left = (r.left + r.width / 2 - p.left) + 'px'; cur.style.top = (r.top + r.height / 2 - p.top + (dy || 0)) + 'px'; }
  async function moveTo(el) {
    // appear just below the target with no slide, then settle onto it — a finger arriving, not a cursor travelling
    cur.classList.remove('on', 'pulse', 'press'); cur.style.transition = 'none'; place(el, 44); cur.getBoundingClientRect(); cur.style.transition = '';
    place(el, 0); cur.classList.add('on'); await sleep(300);
  }
  async function pulseAway(ms) { cur.classList.add('pulse'); await sleep(ms == null ? 160 : ms); cur.classList.remove('on'); await sleep(220); cur.classList.remove('pulse', 'press'); }
  const pointer = (el, type, extra = {}) => { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, pointerType: 'touch', button: 0, ...extra })); return { x, y }; };
  async function tap(el) { await moveTo(el); cur.classList.add('press'); pointer(el, 'pointerdown'); await sleep(60); pointer(el, 'pointerup'); el.click && el.click(); await pulseAway(); }
  async function hold(el, ms) { await moveTo(el); cur.classList.add('press'); pointer(el, 'pointerdown'); await sleep(ms); pointer(el, 'pointerup'); await pulseAway(); }
  async function type(el, text) { await moveTo(el); cur.classList.add('press'); await sleep(60); el.focus(); await pulseAway(120); const setter = Object.getOwnPropertyDescriptor(el.__proto__, 'value').set; setter.call(el, ''); el.dispatchEvent(new Event('input', { bubbles: true })); for (let i = 1; i <= text.length; i++) { setter.call(el, text.slice(0, i)); el.dispatchEvent(new Event('input', { bubbles: true })); await sleep(text.length > 40 ? 12 : 28); } }
  async function fill(el, text) { await moveTo(el); cur.classList.add('press'); await sleep(60); el.focus(); await pulseAway(120); el.textContent = text; el.dispatchEvent(new Event('input', { bubbles: true })); }
  async function waitFor(sel, ms = 8000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (stopFlag) throw new Error('stopped'); const el = find(sel); if (el && el.offsetParent !== null) return el; await sleep(80); } throw new Error('not found: ' + sel); }
  function say() {} function sayErr(t) { sayEl.textContent = t; sayEl.classList.add('on'); setTimeout(() => sayEl.classList.remove('on'), 2600); }
  async function run(steps, btn) { if (running) return; running = true; stopFlag = false; btn && btn.classList.add('running'); document.getElementById('stopRun').style.display = ''; document.getElementById('raillist').querySelectorAll('.pbtn').forEach(b => { if (b !== btn) b.disabled = true; }); 
    try { for (const st of steps) { if (stopFlag) break; const [op, a, b] = st;
        if (op === 'tap') { const el = await waitFor(a); await tap(el); }
        else if (op === 'tapIf') { const el = find(a); if (el) await tap(el); }
        else if (op === 'hold') { const el = await waitFor(a); await hold(el, b); }
        else if (op === 'type') { const el = await waitFor(a); await type(el, b); }
        else if (op === 'fill') { const el = await waitFor(a); await fill(el, b); }
        else if (op === 'key') { const active = document.activeElement; if (active && active.tagName === 'INPUT') { active.dispatchEvent(new KeyboardEvent('keydown', { key: a, bubbles: true })); } else { document.dispatchEvent(new KeyboardEvent('keydown', { key: a, bubbles: true })); } await sleep(120); }
        else if (op === 'wait') await sleep(a);
        else if (op === 'waitFor') await waitFor(a, b);
        else if (op === 'say') say(a);
        else if (op === 'screen') { if (S.screen !== a) { S = fresh(); render(); await sleep(300); } }
        else if (op === 'dragRow') { const rows = document.querySelectorAll('#rows .srow'); const from = rows[a], to = rows[b]; if (!from || !to) continue; await moveTo(from); const r0 = from.getBoundingClientRect(); const grip = from.querySelector('.grip'); pointer(grip, 'pointerdown', { clientY: r0.top + 20 }); await sleep(250); const r1 = to.getBoundingClientRect(); const steps = 8; for (let i = 1; i <= steps; i++) { const y = r0.top + 20 + (r1.top + 8 - r0.top - 20) * i / steps; from.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r0.left + 120, clientY: y, pointerId: 1 })); cur.style.top = (y - phone.getBoundingClientRect().top) + 'px'; await sleep(45); } from.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r0.left + 120, clientY: r1.top + 8, pointerId: 1 })); await sleep(400); }
      } } catch (e) { if (e.message !== 'stopped') sayErr('Could not continue: ' + e.message.replace('not found: ', 'waiting for ')); }
    running = false; cur.classList.remove('on'); document.getElementById('stopRun').style.display = 'none'; renderRail(); }
  window.renderRail = function () { const list = document.getElementById('raillist'); const items = (PROMPTS[S.screen] || []).filter(p => { try { return !p.when || p.when(); } catch (e) { return false; } });
    document.getElementById('railsub').textContent = (SPEC.screens.find(s => s.id === S.screen) || {}).name || S.screen;
    list.innerHTML = items.length ? items.map((p, i) => `<button class="pbtn" data-p="${i}"><span class="k">${i + 1}</span><span><span class="t">${p.title}</span><br><span class="h">${p.hint || ''}</span></span></button>`).join('') : '<div style="font-size:12px;color:var(--faint);padding:6px 2px">Nothing to fill in here · everything on this screen is a tap.</div>';
    list.querySelectorAll('[data-p]').forEach(b => b.onclick = () => run(items[+b.dataset.p].steps, b)); document.getElementById('stopRun').onclick = () => { stopFlag = true; }; };
  document.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return; const n = +e.key; if (n >= 1 && n <= 9) { const b = document.querySelector(`#raillist [data-p="${n - 1}"]`); if (b && !running) b.click(); } });
  renderRail();
})();
