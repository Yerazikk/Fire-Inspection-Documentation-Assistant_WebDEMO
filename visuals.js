// The annotated photo on each recommendation card, fetched in the background.
//
// Drawing one takes fifteen to twenty seconds, and a violation entry can carry
// five recommendations, so nothing in the app is allowed to wait on them. The
// queue starts once Finish has drafted the report and the notice — the
// documents are what the inspector needs to leave the property, the pictures
// are what makes the notice easier for the owner to act on — and then runs on
// its own while they carry on clicking.
//
// A card whose visual has not arrived says so and keeps its place, so the deck
// never reflows under the inspector's thumb as pictures land. Cards are
// repainted in place by `data-vis` rather than by re-rendering the screen,
// which would throw away a half-swiped card or the cursor in the notice.
window.VISUALS = (() => {
  const EDGE = 1280;            // what a card and the notice actually display
  const QUALITY = 0.85;
  const GAP = 1200;             // between cards, so the image endpoint is not hammered

  // key -> 'pending' | 'done' | 'failed'. The image itself lives on the rec,
  // as `rec.img`, so a saved entry carries it like any other field.
  const state = new Map();
  const queue = [];
  let running = false;

  const key = (entryId, recId) => entryId + ':' + recId;
  const statusOf = (entryId, recId) => state.get(key(entryId, recId)) || null;
  const pending = () => queue.length + (running ? 1 : 0);

  /** The inner HTML of a card's visual area, for whatever state it is in. */
  function cell(entryId, rec) {
    if (rec.img) return img(rec.img, 'Annotated photo');
    const st = statusOf(entryId, rec.id);
    if (st === 'pending') return '<div class="vgen"><span class="vdots"><i></i><i></i><i></i></span>Generating suggestion visual</div>';
    if (st === 'failed') return '<div class="vgen bad">Visual could not be drawn<small>the recommendation still stands</small></div>';
    return '';
  }

  /** Does this card reserve space for a visual at all? */
  const has = (entryId, rec) => !!rec.img || !!statusOf(entryId, rec.id);

  // Repaint just the cards showing this recommendation — there may be two, the
  // deck card and the copy in the notice — without disturbing the screen.
  function paint(entryId, rec) {
    const k = key(entryId, rec.id);
    document.querySelectorAll(`[data-vis="${k}"]`).forEach(el => {
      el.innerHTML = cell(entryId, rec);
      el.classList.toggle('on', !!rec.img);
    });
    // A card that had no visual area now needs one; that is a layout change,
    // so the deck redraws itself rather than being patched.
    if (typeof S !== 'undefined' && S.screen === 'deck' && typeof renderDeck === 'function') {
      if (!document.querySelector(`[data-vis="${k}"]`)) renderDeck();
    }
  }

  async function one(job) {
    const { addrId, entry, rec } = job;
    const k = key(entry.id, rec.id);
    state.set(k, 'pending');
    paint(entry.id, rec);
    try {
      const photo = await PHOTO.forModel(entry.photo);
      if (!photo) throw new Error('the photograph could not be read');
      const res = await fetch('/api/visual', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo,
          rec: { title: rec.title, text: rec.text },
          finding: entry.ai && entry.ai.summary && entry.ai.summary[0] ? entry.ai.summary[0][1] : '',
          address: addrId,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.image) throw new Error(body.error || 'the image call failed');
      // It arrives as a 2 MB PNG and is shown at card size. Keeping it at that
      // weight, five to an entry, for the life of the session, is not worth it.
      const small = await PHOTO.fit(`data:${body.image.mimeType};base64,${body.image.data}`, EDGE, QUALITY);
      rec.img = small ? small.src : `data:${body.image.mimeType};base64,${body.image.data}`;
      state.set(k, 'done');
    } catch (e) {
      console.warn('visual failed for', rec.title, '—', e.message);
      state.set(k, 'failed');
    }
    paint(entry.id, rec);
  }

  async function pump() {
    if (running) return;
    running = true;
    // One at a time. Five parallel image calls would finish no sooner against
    // the same endpoint and would make the first card wait for all of them —
    // and the endpoint rate-limits, so they would start failing instead.
    while (queue.length) {
      await one(queue.shift());
      if (queue.length) await new Promise(r => setTimeout(r, GAP));
    }
    running = false;
  }

  /**
   * Queue every recommendation that does not have a picture yet, for every
   * violation entry at this address. Idempotent: calling it again after a
   * re-scan picks up the new cards and leaves the finished ones alone.
   *
   * Options the inspector has already chosen go first — those are the ones
   * heading into the notice to the owner.
   */
  function start(addrId) {
    const entries = (typeof S === 'undefined' ? null : S.entries[addrId]) || [];
    const jobs = [];
    for (const entry of entries) {
      if (!entry.photo || entry.kind !== 'violation') continue;
      for (const rec of entry.recs || []) {
        if (rec.img || state.has(key(entry.id, rec.id))) continue;
        jobs.push({ addrId, entry, rec, chosen: rec.decision === 'in' });
      }
    }
    jobs.sort((a, b) => (b.chosen ? 1 : 0) - (a.chosen ? 1 : 0));
    jobs.forEach(j => { state.set(key(j.entry.id, j.rec.id), 'pending'); queue.push(j); });
    if (jobs.length) pump();
    return jobs.length;
  }

  /** Forget what we know about one entry's cards, so a re-scan can redraw. */
  function reset(entryId, recs) {
    (recs || []).forEach(r => state.delete(key(entryId, r.id)));
  }

  return { start, reset, cell, has, statusOf, key, pending };
})();
