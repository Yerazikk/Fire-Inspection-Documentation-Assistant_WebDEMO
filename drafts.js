// Document drafting, client side.
//
// Builds the inspection context, posts it to /api/draft, and hands back a
// structured document: { sections: [...] } plus a little metadata. The key and
// the prompts live on the server (ai/); nothing here knows how the text is
// made, which is the point — swap the provider and this file does not change.
//
// If the server has no key, or the call fails, `fallback()` builds the same
// shape out of the window.AI templates, so the app is never dead in the water.
// A document built that way is marked `source: 'template'` and the screen says
// so: a template is not a draft of this property, and the inspector has to know
// which one they are reading.
//
// `record()` does the same job for ONE entry, as the inspector saves it. Same
// contract: it is drafted from the note they actually typed, it is marked
// `source: 'ai'`, and `recordFallback()` returns the old window.AI fixture
// marked `source: 'template'` when there is no key or the call fails.
window.DRAFTS = (() => {

  // ---- capability probe ---------------------------------------------------
  let statusP = null;
  const status = () => (statusP = statusP || fetch('/api/ai/status')
    .then(r => r.json())
    .catch(() => ({ key: false, offline: true })));

  // ---- context -----------------------------------------------------------
  const dateIn = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }); };
  const today = () => new Date().toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });

  /**
   * @param {'report'|'notice'} kind
   * @param {object} a       address record (ADDRESSES entry)
   * @param {Array}  entries today's entries for that address
   * @param {object} opts    { attachments: [...] }
   */
  function context(kind, a, entries, opts = {}) {
    const C = window.CONFIG;
    return {
      kind,
      date: today(),
      address: a.addr + (a.where ? ', ' + a.where : ''),
      owner: a.owner || null,
      inspector: { name: C.inspector.name, badge: C.inspector.badge, unit: C.unit, email: C.inspector.email, phone: C.inspector.phone },
      correctionDays: C.correctionDays,
      correctBy: dateIn(C.correctionDays),
      portal: C.portal,
      entries: entries.map(e => ({
        n: e.n,
        kind: e.kind,
        time: e.time,
        hasPhoto: !!e.photo,
        spoken: !!e.spoken,
        note: e.memo || e.note || '',
        approvedOptions: (e.recs || []).filter(r => r.decision === 'in').map(r => ({ title: r.title, text: r.text })),
      })),
      history: (window.HISTORY[a.id] || []).slice(0, 4).map(h => ({
        date: h.date, outcome: h.outcome, notes: h.entries.map(x => x.note).join(' '),
      })),
      attachments: opts.attachments || [],
    };
  }

  // ---- per-entry record --------------------------------------------------

  const LEVELS = { violation: 'Violation', compliance: 'Compliant', note: 'Note' };

  /**
   * Context for one entry's record.
   * @param {object} a      address record
   * @param {object} entry  { n, kind, time, photo, spoken, memo }
   */
  async function recordContext(a, entry) {
    const C = window.CONFIG;
    // The photograph goes with the note. Until now the prompt told the model
    // "photograph on file: yes (not provided to you)" and then asked it to
    // write up a scene it had never seen; the note was the only evidence.
    // Resizing can fail on an image the browser will not decode, in which case
    // the draft still goes out — without the picture, as before.
    const image = entry.photo ? await window.PHOTO.forModel(entry.photo) : null;
    return {
      kind: 'record',
      date: today(),
      address: a.addr + (a.where ? ', ' + a.where : ''),
      inspector: { name: C.inspector.name, badge: C.inspector.badge },
      entry: {
        n: entry.n,
        level: LEVELS[entry.kind] || 'Note',
        time: entry.time,
        hasPhoto: !!entry.photo,
        photo: image,
        spoken: !!entry.spoken,
        note: entry.memo || '',
      },
      history: (window.HISTORY[a.id] || []).slice(0, 2).map(h => ({
        date: h.date, outcome: h.outcome, notes: h.entries.map(x => x.note).join(' '),
      })),
    };
  }

  /**
   * Draft one entry's record. Never throws: on any failure it falls back to the
   * template for that entry kind and says why, because the inspector is
   * standing at the property and an error screen is not an answer.
   * @returns {Promise<object>} the `ai` block the record screen renders
   */
  async function record(a, entry) {
    const st = await status();
    if (!st.key) return recordFallback(entry.kind, st.offline ? 'the server is not reachable' : 'no AI key is configured');
    try {
      const res = await fetch('/api/draft', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(await recordContext(a, entry)),
      });
      const body = await res.json().catch(() => ({ error: 'bad response from the server' }));
      if (!res.ok) return recordFallback(entry.kind, body.error || 'the draft call failed');
      const ai = body.doc;
      ai.source = 'ai';
      return ai;
    } catch (e) {
      return recordFallback(entry.kind, String((e && e.message) || e));
    }
  }

  /**
   * The old fixture, clearly marked. window.AI is keyed by the draft kind, and
   * falls back to the note fixture for a kind it does not carry.
   */
  function recordFallback(kind, reason) {
    const t = window.AI[kind] || window.AI.note;
    return {
      ...JSON.parse(JSON.stringify(t)),
      source: 'template',
      fallbackReason: reason || null,
      audit: { unknownCitations: [], pendingCitations: [], unsourcedCitations: [] },
      meta: { generatedAt: new Date().toISOString() },
    };
  }

  // ---- the call ----------------------------------------------------------
  async function draft(kind, ctx) {
    const res = await fetch('/api/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ctx, kind }),
    });
    const body = await res.json().catch(() => ({ error: 'bad response from the server' }));
    if (!res.ok) { const e = new Error(body.error || 'draft failed'); e.code = body.code; throw e; }
    body.doc.source = 'ai';
    return body.doc;
  }

  // ---- fallback: the same shape, built from the templates ----------------
  // Deliberately plain. It must not be mistaken for a drafted document, so it
  // says what it is and carries no code citations it cannot stand behind.
  function fallback(kind, ctx, reason) {
    const viol = ctx.entries.filter(e => e.kind === 'violation');
    const comp = ctx.entries.filter(e => e.kind === 'compliance');
    const notes = ctx.entries.filter(e => e.kind === 'note');
    const AI = window.AI;
    const sections = [];

    if (kind === 'report') {
      sections.push({ id: 'synopsis', heading: 'Synopsis', type: 'prose',
        body: `${ctx.address} inspected ${ctx.date} by ${ctx.inspector.name} (${ctx.inspector.badge}). ` +
          `${ctx.entries.length} entr${ctx.entries.length === 1 ? 'y' : 'ies'} recorded: ${viol.length} violation(s), ${comp.length} compliant, ${notes.length} note(s).` });
      sections.push({ id: 'findings', heading: 'Findings', type: 'list',
        items: ctx.entries.map(e => `Entry ${e.n} — ${e.kind === 'violation' ? 'Violation' : e.kind === 'compliance' ? 'Compliant' : 'Note'}. ${e.note || 'No note recorded.'}`) });
      const perKind = e => (AI[e.kind] || AI.note);
      if (viol.length) sections.push({ id: 'determination', heading: 'Determination and authority', type: 'fields',
        fields: viol.map(e => ({ label: `Entry ${e.n}`, value: (perKind(e).codes || []).map(c => c.c).join('; ') || 'Not determined.' })) });
      sections.push({ id: 'codes', heading: 'Code references', type: 'codes',
        codes: (AI.violation.codes || []).map(c => ({ scope: c.scope, citation: c.c, title: c.t, relevance: 'Template reference — not matched to this property.' })) });
      sections.push({ id: 'limitations', heading: 'Limitations', type: 'list', items: [
        'This document was assembled from the built-in templates, not drafted for this property.',
        'No measurement was recorded for any entry.',
        reason ? 'Drafting was unavailable: ' + reason : 'Drafting was unavailable.',
      ] });
      return { kind, headline: `Template report · ${ctx.address}`, sections, source: 'template', fallbackReason: reason || null, audit: { unknownCitations: [], pendingCitations: [] }, meta: { generatedAt: new Date().toISOString() } };
    }

    if (viol.length) {
      sections.push({ id: 'what-we-found', heading: 'What we found', type: 'list', items: viol.map(e => e.note || `Entry ${e.n}: see the inspector's record.`) });
      sections.push({ id: 'what-to-do', heading: 'What you need to do', type: 'prose',
        body: `Please complete the work by ${ctx.correctBy}, which is ${ctx.correctionDays} days from today. Any one of the options below will fix it.` });
    }
    if (comp.length) sections.push({ id: 'also-checked', heading: 'Also checked and fine', type: 'list', items: comp.map(e => e.note || `Entry ${e.n}`) });
    sections.push({ id: 'attached-documents', heading: 'Attached documents', type: 'prose', body: 'The documents listed below explain the requirements in more detail.' });
    sections.push({ id: 'how-to-close', heading: 'How to close this notice', type: 'list', items: [
      `Do the work, then send photographs to ${ctx.inspector.email}${ctx.portal ? ' or upload them on ' + ctx.portal : ''} by ${ctx.correctBy}.`,
      'If the photographs show the work is done, the case closes with no visit and no fee.',
      'Otherwise an inspector returns and a reinspection fee applies.',
      'You may ask for a hearing in writing.',
    ] });
    sections.push({ id: 'questions', heading: 'Questions', type: 'prose', body: `Contact ${ctx.inspector.name} at ${ctx.inspector.email} or ${ctx.inspector.phone}.` });
    return {
      kind, source: 'template', fallbackReason: reason || null,
      subject: (viol.length ? 'Notice of Vegetation Violation' : 'Vegetation inspection result') + ' · ' + ctx.address,
      greeting: `Dear ${ctx.owner && ctx.owner.name ? ctx.owner.name : 'Property Owner'},`,
      closing: 'Thank you for helping keep the neighbourhood safe.',
      sections, audit: { unknownCitations: [], pendingCitations: [] }, meta: { generatedAt: new Date().toISOString() },
    };
  }

  return { status, context, draft, fallback, record, recordContext, recordFallback };
})();
