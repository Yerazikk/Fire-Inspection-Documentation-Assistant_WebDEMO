// Mock iOS keyboard for the web demo. Slides up whenever a text field inside the phone has focus,
// types into it (real input events, so typeahead and Enter handling run unchanged) and drops when focus leaves.
(() => {
  const H = 262;
  const ROWS = {
    abc: [['q','w','e','r','t','y','u','i','o','p'], ['a','s','d','f','g','h','j','k','l'], ['⇧','z','x','c','v','b','n','m','⌫'], ['123','space','return']],
    num: [['1','2','3','4','5','6','7','8','9','0'], ['-','/',':',';','(',')','$','&','@','"'], ['#+=','.',',','?','!',"'",'⌫'], ['ABC','space','return']],
  };
  let layer = 'abc', shift = false, target = null, el = null, hideT = null;
  const phone = document.querySelector('.phone'); if (!phone) return;
  const isField = n => n && (n.tagName === 'TEXTAREA' || (n.tagName === 'INPUT' && !['checkbox','radio','range','file','button','submit'].includes(n.type))) && !n.readOnly && !n.disabled;

  function build() {
    el = document.createElement('div'); el.className = 'kbd'; el.setAttribute('aria-hidden', 'true');
    phone.appendChild(el); paint();
    el.addEventListener('mousedown', e => e.preventDefault());   // keep focus in the field
    el.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    el.addEventListener('click', e => { const k = e.target.closest('[data-k]'); if (k) press(k.dataset.k); });
  }
  function paint() {
    const rows = ROWS[layer];
    el.innerHTML = `<div class="kbd-rows">${rows.map((r, i) => `<div class="kbd-row r${i}">${r.map(k => {
      const wide = k === 'space' ? ' space' : k === 'return' ? ' ret' : k.length > 1 ? ' fn' : '';
      const label = k === 'space' ? 'space' : k === 'return' ? 'return' : (layer === 'abc' && shift && k.length === 1) ? k.toUpperCase() : k;
      return `<button class="kbd-k${wide}${k === '⇧' && shift ? ' on' : ''}" data-k="${k}">${label}</button>`; }).join('')}</div>`).join('')}</div><div class="kbd-bar"></div>`;
  }
  function press(k) {
    if (!target || !document.contains(target)) return;
    if (k === '⇧') { shift = !shift; return paint(); }
    if (k === '123' || k === 'ABC' || k === '#+=') { layer = layer === 'abc' ? 'num' : 'abc'; return paint(); }
    if (k === 'return') {
      const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true });
      const handled = !target.dispatchEvent(ev);
      if (!handled && target.tagName === 'TEXTAREA') insert('\n');
      if (!handled && target.form) target.form.requestSubmit ? target.form.requestSubmit() : target.form.submit();
      return;
    }
    if (k === '⌫') {
      const s = target.selectionStart, e = target.selectionEnd, v = target.value;
      if (s == null) { target.value = v.slice(0, -1); } else if (s !== e) { target.value = v.slice(0, s) + v.slice(e); target.setSelectionRange(s, s); } else if (s > 0) { target.value = v.slice(0, s - 1) + v.slice(s); target.setSelectionRange(s - 1, s - 1); }
      return fire();
    }
    insert(k === 'space' ? ' ' : (shift && layer === 'abc' ? k.toUpperCase() : k));
    if (shift) { shift = false; paint(); }
  }
  function insert(t) {
    const s = target.selectionStart ?? target.value.length, e = target.selectionEnd ?? s, v = target.value;
    target.value = v.slice(0, s) + t + v.slice(e);
    try { target.setSelectionRange(s + t.length, s + t.length); } catch (_) {}
    fire();
  }
  function fire() { target.dispatchEvent(new Event('input', { bubbles: true })); }
  function show(n) { clearTimeout(hideT); target = n; if (!el) build(); const was = phone.classList.contains('kb'); el.classList.add('on'); phone.classList.add('kb'); phone.style.setProperty('--kb', H + 'px'); if (!was) phone.dispatchEvent(new CustomEvent('kb', { detail: { open: true } })); }
  function hide() { hideT = setTimeout(() => { if (isField(document.activeElement) && phone.contains(document.activeElement)) return; target = null; el && el.classList.remove('on'); if (phone.classList.contains('kb')) { phone.classList.remove('kb'); phone.dispatchEvent(new CustomEvent('kb', { detail: { open: false } })); } }, 80); }

  document.addEventListener('focusin', e => { if (phone.contains(e.target) && isField(e.target)) show(e.target); });
  document.addEventListener('focusout', e => { if (target && e.target === target) hide(); });
  // tapping anywhere else on the phone (the map swallows mousedown, so native blur never happens there) drops the keyboard
  phone.addEventListener('pointerdown', e => { if (!target) return; if (el.contains(e.target) || e.target === target || (e.target.closest && e.target.closest('.sugg'))) return; target.blur(); hide(); }, true);
  // a field focused by script before this ran
  if (isField(document.activeElement) && phone.contains(document.activeElement)) show(document.activeElement);
  // lets the app or tests drive it: KBD.show(el) / KBD.hide() / KBD.press('a')
  window.KBD = { show, hide, press, get open() { return !!(el && el.classList.contains('on')); } };
})();
