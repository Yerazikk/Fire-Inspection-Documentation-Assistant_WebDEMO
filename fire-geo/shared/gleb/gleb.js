/* fire-geo · the Gleb kit, behaviour. Small and optional: the stylesheet does the work.
   1. Sets html.gleb (on by default). ?gleb=0 turns it off, ?gleb=1 turns it back on; the choice is remembered, so the
      embedded Inspectors page follows the outer page. Load this in <head>, before the page paints.
   2. Helpers for NEW markup only (the pages' own controls keep their own code and motion):
      Gleb.seg(el, onChange)     sliding ink pill for .gl-seg          (plain ease-out, lands exactly on the tab)
      Gleb.hold(el, onDone, ms)  hold-to-act fill for .gl-button       (900 ms; letting go early runs it back)
      Gleb.slider(el, onChange)  direct drag for .gl-slider            (no easing while dragging; arrow keys step)
      Gleb.toggle(el, onChange)  .gl-switch on / off
      Elements with data-gl="seg | hold | slider | switch" are wired on load and fire a "gl-change" / "gl-hold" event. */
(function () {
  'use strict';
  var KEY = 'fire-geo.gleb', root = document.documentElement;
  function read() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('gleb'); } catch (e) { }
    try { if (q === '0' || q === '1') localStorage.setItem(KEY, q); else q = localStorage.getItem(KEY); } catch (e) { }
    return q !== '0';
  }
  function set(on, remember) {
    root.classList.toggle('gleb', !!on);
    if (remember !== false) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { } }
    // an embedded page (same origin) follows
    try { document.querySelectorAll('iframe').forEach(function (f) { var d = f.contentDocument; if (d) d.documentElement.classList.toggle('gleb', !!on); }); } catch (e) { }
    try { window.dispatchEvent(new Event('resize')); } catch (e) { }      // sliding pills re-measure
  }
  root.classList.toggle('gleb', read());

  var reduced = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };
  function fire(el, name, detail) { el.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail })); }

  /* ---- segmented: <div class="gl-seg"><span class="gl-seg-ind"></span><button class="on" data-value="a">A</button>...</div> */
  function seg(el, onChange) {
    var ind = el.querySelector(':scope > .gl-seg-ind');
    if (!ind) { ind = document.createElement('span'); ind.className = 'gl-seg-ind'; el.prepend(ind); }
    var buttons = function () { return [].slice.call(el.querySelectorAll(':scope > button')); };
    function place(instant) {
      var on = el.querySelector(':scope > button.on'); if (!on || !el.offsetWidth) return;
      if (instant) ind.style.transition = 'none';
      ind.style.width = on.offsetWidth + 'px'; ind.style.transform = 'translateX(' + on.offsetLeft + 'px)';
      if (instant) { void ind.offsetWidth; ind.style.transition = ''; }
    }
    function choose(b, quiet) {
      if (!b || b.classList.contains('on')) return;
      buttons().forEach(function (x) { var is = x === b; x.classList.toggle('on', is); x.setAttribute('aria-selected', String(is)); x.tabIndex = is ? 0 : -1; });
      place(false);
      if (!quiet) { if (onChange) onChange(b.dataset.value); fire(el, 'gl-change', { value: b.dataset.value }); }
    }
    el.setAttribute('role', 'tablist');
    buttons().forEach(function (b) { b.setAttribute('role', 'tab'); var is = b.classList.contains('on'); b.setAttribute('aria-selected', String(is)); b.tabIndex = is ? 0 : -1; });
    el.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && b.parentNode === el) choose(b); });
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var list = buttons(), i = list.indexOf(el.querySelector(':scope > button.on')), n = list[i + (e.key === 'ArrowRight' ? 1 : -1)];
      if (n) { e.preventDefault(); choose(n); n.focus(); }
    });
    place(true);
    if (window.ResizeObserver) new ResizeObserver(function () { place(true); }).observe(el);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(true); });
    return { set: function (v, quiet) { choose(el.querySelector(':scope > button[data-value="' + v + '"]'), quiet); }, sync: function () { place(true); } };
  }

  /* ---- hold to act: <button class="gl-button" data-gl="hold"><span class="gl-hold-fill"></span><span>Hold to send</span></button> */
  function hold(el, onDone, ms) {
    var D = ms || 900, fill = el.querySelector(':scope > .gl-hold-fill'), anim = null, down = false;
    if (!fill) { fill = document.createElement('span'); fill.className = 'gl-hold-fill'; el.prepend(fill); }
    function done() { down = false; anim = null; fill.style.transform = 'scaleX(0)'; if (onDone) onDone(); fire(el, 'gl-hold', {}); }
    function start(e) {
      if (el.disabled || down) return; down = true;
      if (e && e.pointerId != null) { try { el.setPointerCapture(e.pointerId); } catch (x) { } }
      if (reduced() || !fill.animate) { anim = { t: setTimeout(done, D) }; fill.style.transform = 'scaleX(1)'; return; }
      var from = anim ? anim.effect.getComputedTiming().progress || 0 : 0; if (anim) anim.cancel();
      anim = fill.animate([{ transform: 'scaleX(' + from + ')' }, { transform: 'scaleX(1)' }], { duration: D * (1 - from), easing: 'linear', fill: 'forwards' });
      anim.onfinish = function () { if (down) { anim.cancel(); done(); } };
    }
    function stop() {
      if (!down) return; down = false;
      if (anim && anim.t) { clearTimeout(anim.t); anim = null; fill.style.transform = 'scaleX(0)'; return; }
      if (!anim) return;
      var at = anim.effect.getComputedTiming().progress || 0, a = anim; a.onfinish = null; a.cancel();
      anim = fill.animate([{ transform: 'scaleX(' + at + ')' }, { transform: 'scaleX(0)' }], { duration: Math.max(90, 260 * at), easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });   // back the way it came
      var back = anim; back.onfinish = function () { if (anim === back) { back.cancel(); anim = null; } };
    }
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', start); el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('pointerleave', stop);
    el.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
    el.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
    el.addEventListener('blur', stop);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ---- slider: <div class="gl-slider" data-gl="slider" data-value="0.57"><span class="gl-slider-fill"></span><i class="gl-icon" data-i="sun"></i></div> */
  function slider(el, onChange) {
    var v = Math.min(1, Math.max(0, parseFloat(el.dataset.value || '0.5')));
    function put(n, quiet) {
      v = Math.min(1, Math.max(0, n)); el.style.setProperty('--gl-value', v.toFixed(4)); el.dataset.value = v.toFixed(2); el.setAttribute('aria-valuenow', Math.round(v * 100));
      if (!quiet) { if (onChange) onChange(v); fire(el, 'gl-change', { value: v }); }
    }
    function at(e) { var r = el.getBoundingClientRect(); put((e.clientX - r.left) / r.width); }
    el.tabIndex = 0; el.setAttribute('role', 'slider'); el.setAttribute('aria-valuemin', 0); el.setAttribute('aria-valuemax', 100);
    el.addEventListener('pointerdown', function (e) { try { el.setPointerCapture(e.pointerId); } catch (x) { } at(e); el.dataset.held = '1'; });
    el.addEventListener('pointermove', function (e) { if (el.dataset.held) at(e); });
    ['pointerup', 'pointercancel'].forEach(function (n) { el.addEventListener(n, function () { delete el.dataset.held; }); });
    el.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? .05 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -.05 : 0;
      if (d) { e.preventDefault(); put(v + d); }
    });
    put(v, true);
    return { set: put, get: function () { return v; } };
  }

  /* ---- switch: <button class="gl-switch" data-gl="switch" role="switch" aria-checked="false" aria-label="..."></button> */
  function toggle(el, onChange) {
    el.setAttribute('role', 'switch'); if (!el.hasAttribute('aria-checked')) el.setAttribute('aria-checked', 'false');
    el.addEventListener('click', function () {
      if (el.disabled) return;
      var on = el.getAttribute('aria-checked') !== 'true'; el.setAttribute('aria-checked', String(on));
      if (onChange) onChange(on); fire(el, 'gl-change', { value: on });
    });
  }

  function wire(scope) {
    (scope || document).querySelectorAll('[data-gl]').forEach(function (el) {
      if (el.dataset.glWired) return; el.dataset.glWired = '1';
      var k = el.dataset.gl;
      if (k === 'seg') seg(el); else if (k === 'hold') hold(el); else if (k === 'slider') slider(el); else if (k === 'switch') toggle(el);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { wire(); }); else wire();

  window.Gleb = { on: function () { return root.classList.contains('gleb'); }, set: set, seg: seg, hold: hold, slider: slider, toggle: toggle, wire: wire };
})();
