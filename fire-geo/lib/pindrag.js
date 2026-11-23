// FireGeo.pinDrag(el, opts): the one way a pin is moved on a map, on both tabs.
//
// Press anywhere on `el`:
//   away from the pin   The pin slides to the pointer from where it is: it starts in the first frame after the press
//                       and gets there in 140 to 180 ms (longer for a longer trip), on a plain ease-out with no
//                       overshoot. It is never hidden and never jumps. The end of the slide is live: if the pointer
//                       moves while the pin is still on its way, the pin heads for where the pointer is now. The
//                       moment it arrives it locks on, and from then until release it follows every pointer move
//                       directly: no threshold, no easing.
//   on the pin          (within `grip` px of its point) No slide. The pin is held where it was gripped and follows
//                       directly from the first move.
//   a quick tap         (released before the pin arrives) The pin finishes its slide to the tap point.
// Every position on the way is handed to opts.move, so whatever the page works out from the pin (the town it is in,
// the lit town, the panel) follows the pin as it is DRAWN, during the slide exactly as during a drag. There is no
// change of state saved up for the end.
// Reduced motion: no slide. The pin is placed at the pointer on press and then follows directly.
//
//   opts.where()            -> [clientX, clientY]: where the pin's point is on screen right now. Required.
//   opts.move(x, y, phase)  Put the pin's point at client (x, y). Required. phase says who is asking:
//                             'slide'  one frame of the catch-up (called inside requestAnimationFrame)
//                             'drag'   locked to the pointer (called from the pointer event itself)
//                             'place'  reduced motion: placed at the pointer on press
//   opts.start(event)       A press began. Stop any movement of your own here (a chip's glide, say). Return false
//                           to refuse the press (the map is busy): nothing moves and no other callback fires.
//   opts.end(event, how)    The press ended. how: 'up' | 'cancel'. A tap's slide may still be finishing.
//   opts.settle()           The pin has come to rest: the press is over and any slide has finished.
//   opts.grip               Radius in px around the pin's point that counts as "on the pin". Default 20.
//   opts.ms                 [shortest, longest] time in ms for the pin to reach the pointer. Default [140, 180].
//   opts.far                The trip, in px, that takes the longest time. Default 480.
//   opts.reduced()          -> true to place the pin with no slide. Default: the prefers-reduced-motion setting.
// Returns { stop(), busy(), destroy() }. stop() ends a slide where it is: call it before you move the pin yourself.
// The element gets touch-action: none (the gesture never scrolls the page), the pointer is captured, and a press
// never selects text. Mouse, touch and pen all take the same path; there is no separate click handler.
(function (root) {
'use strict';
const FIRST = 8;                                        // ms: the least the first frame of a slide counts for, so the pin is already moving in it
const ease = u => 1 - Math.pow(1 - u, 3);              // plain ease-out: fastest at the start, comes to rest, never passes the end
// The pin locks on when it is within a pixel of the pointer. On this curve that is at 1 - cbrt(1 / trip) of the full
// time, so the full time is stretched by that much and the pin reaches the pointer when it is meant to.
const lands = trip => 1 - Math.cbrt(1 / Math.max(trip, 8));

function pinDrag(el, opts) {
  const o = opts || {}, grip = o.grip == null ? 20 : o.grip, ms = o.ms || [140, 180], far = o.far || 480;
  const reduced = o.reduced || (() => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches));
  let id = null;                                        // the pointer that is down, or null
  let mode = 'rest';                                    // 'rest' | 'slide' (catching up) | 'locked' (on the pointer)
  let from = [0, 0], to = [0, 0], at = [0, 0], off = [0, 0], t0 = 0, dur = 0, raf = 0;
  el.style.touchAction = 'none';

  function frame(now) {
    raf = 0; if (mode !== 'slide') return;
    const u = Math.min(1, Math.max(now - t0, FIRST) / dur), e = ease(u), dx = to[0] - from[0], dy = to[1] - from[1];
    if (u < 1 && Math.hypot(dx, dy) * (1 - e) >= 1) {    // still more than a pixel away: one more frame toward where the pointer is now
      at = [from[0] + dx * e, from[1] + dy * e]; o.move(at[0], at[1], 'slide'); raf = root.requestAnimationFrame(frame); return;
    }
    at = [to[0], to[1]]; o.move(at[0], at[1], 'slide');                       // caught up
    if (id !== null) mode = 'locked'; else { mode = 'rest'; if (o.settle) o.settle(); }
  }
  const down = e => {
    if (e.button || id !== null) return;
    e.preventDefault();
    if (o.start && o.start(e) === false) return;
    id = e.pointerId; try { el.setPointerCapture(id); } catch (_) {}
    if (raf) { root.cancelAnimationFrame(raf); raf = 0; }
    const p = o.where(), x = e.clientX, y = e.clientY, trip = Math.hypot(x - p[0], y - p[1]);
    at = [p[0], p[1]];
    if (trip <= grip) { off = [x - p[0], y - p[1]]; mode = 'locked'; return; }             // on the pin: held where it was gripped
    off = [0, 0]; to = [x, y];
    if (reduced()) { at = [x, y]; mode = 'locked'; o.move(x, y, 'place'); return; }
    from = [p[0], p[1]]; t0 = root.performance.now(); dur = (ms[0] + (ms[1] - ms[0]) * Math.min(1, trip / far)) / lands(trip); mode = 'slide';
    raf = root.requestAnimationFrame(frame);
  };
  const move = e => {
    if (e.pointerId !== id) return;
    if (mode === 'slide') { to = [e.clientX, e.clientY]; return; }                         // live end point: the next frame heads for here
    if (mode === 'locked') { at = [e.clientX - off[0], e.clientY - off[1]]; o.move(at[0], at[1], 'drag'); }
  };
  const up = e => {
    if (e.pointerId !== id) return;
    id = null; try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    if (o.end) o.end(e, e.type === 'pointercancel' ? 'cancel' : 'up');
    if (mode === 'locked') { mode = 'rest'; if (o.settle) o.settle(); }                   // a slide still under way finishes on its own
  };
  const noSelect = e => e.preventDefault();
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('selectstart', noSelect);

  return {
    // End a slide where it is. If the pointer is still down the pin stays held from where it stopped.
    stop() { if (raf) { root.cancelAnimationFrame(raf); raf = 0; } if (mode !== 'slide') return; if (id !== null) { off = [to[0] - at[0], to[1] - at[1]]; mode = 'locked'; } else mode = 'rest'; },
    busy() { return mode !== 'rest'; },
    destroy() { if (raf) root.cancelAnimationFrame(raf); raf = 0; mode = 'rest'; id = null; el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.removeEventListener('selectstart', noSelect); },
  };
}
root.FireGeo = root.FireGeo || {};
root.FireGeo.pinDrag = pinDrag;
})(window);
