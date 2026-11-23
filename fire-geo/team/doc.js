// team/doc.js: one continuous editable document.
// A draft (the owner's page, the file document) is ONE editing surface, like a page in a word processor. The caret
// moves freely across paragraphs and list items, a selection can run across several, Enter splits a block, Backspace
// at the start of one joins it to the one above, paste is plain text, and undo is the document's own.
//
// Blocks. The surface holds blocks in a flat run: paragraphs and headings, list items (inside a real <ol>, so the
// numbers renumber themselves), and ISLANDS: pieces that must stay exact or are not text (pictures, citations,
// generated numbering, the date). An island is contenteditable="false": the caret steps over it as one unit and it
// cannot be typed into. If a selection that runs across an island is typed over or deleted, the text goes and the
// island STAYS (it is never removed by an edit). A block may also begin with a small inline island ("Option 1: ").
// Every block carries the key of the part of the document it came from; a block made by Enter keeps that key, so
// what was typed can be read back into the data ("problem" is every paragraph with that key, in order).
//
// The page is never re-rendered while it has the focus: update() waits until the focus has left. When it runs it
// merges, part by part. A part that is kept in the data ("bound": a step, an option's name) is taken from the data,
// which already holds what was typed. Any other part the model changed is taken unless the person wrote something
// else there; a part they removed stays removed; new parts are put in their place.
//
// What the browser does on its own: typing and deleting inside one block. Everything that changes the structure
// (Enter, joining, deleting across blocks, paste, cut, undo) is done here, so the result is always known.
window.TeamDoc = (function () {
  'use strict';
  const U = window.TeamUI, h = U.h;
  const HEAD = /^H[1-6]$/, isIsland = n => n.nodeType === 1 && n.getAttribute('contenteditable') === 'false';

  function create(el, opt) {
    const O = opt || {}, meta = new Map(), islands = new Map(), lists = new Map();
    let base = new Map(), past = [], future = [], last = null, lastKind = '', lastAt = 0, preCaret = null, timer = 0;
    el.classList.add('tm-doc'); el.setAttribute('contenteditable', 'true'); el.setAttribute('spellcheck', 'true'); el.setAttribute('role', 'textbox'); el.setAttribute('aria-multiline', 'true');

    // ---------------------------------------------------------------- blocks in the page
    const isList = n => n.nodeType === 1 && (n.tagName === 'OL' || n.tagName === 'UL') && !isIsland(n);      // a list that is typed into (a protected list is one island)
    const order = () => { const out = []; for (const n of el.children) { if (isList(n)) out.push(...n.children); else out.push(n); } return out; };
    const keyOf = b => (b.tagName === 'LI' ? b.parentNode.dataset.key : b.dataset.key) || '';
    const tagOf = b => b.tagName.toLowerCase();
    const leadOf = b => { const f = b.firstElementChild; return f && f.hasAttribute('data-lead') ? f : null; };
    const textOf = b => { let t = ''; for (const n of b.childNodes) { if (n.nodeType === 3) t += n.nodeValue; else if (n.nodeType === 1 && !isIsland(n) && n.tagName !== 'BR') t += n.textContent; } return t.replace(/ /g, ' '); };
    function setText(b, text) { const lead = leadOf(b); b.replaceChildren(...(lead ? [lead] : []), text ? document.createTextNode(text) : document.createElement('br')); }
    function setLead(b, text, cls) {
      let l = leadOf(b);
      if (!text) { if (l) l.remove(); return; }
      if (!l) { l = h('span', { class: ((cls || '') + ' tm-island tm-lead').trim(), contenteditable: 'false', 'data-lead': '' }); b.prepend(l); }
      if (l.textContent !== text) l.textContent = text;
    }
    /** a new, empty editable block for a part. Its class is the part's own when it has the part's tag; a paragraph made under a heading is an ordinary paragraph. */
    function make(key, tag) {
      if (tag === 'li') return document.createElement('li');
      const m = meta.get(key) || {};
      return h(tag, { class: m.tag === tag ? (m.cls || '') : tag === 'p' ? (O.pCls || '') : '', 'data-key': key });
    }
    function listFor(key) { let l = lists.get(key); if (!l) { const m = meta.get(key) || {}; l = h(m.list || 'ol', { class: m.listCls || '', 'data-key': key }); lists.set(key, l); } return l; }
    function drop(b) { const p = b.parentNode; b.remove(); if (p !== el && !p.children.length) p.remove(); }
    const firstOfKey = b => { const k = keyOf(b); return order().find(x => !isIsland(x) && keyOf(x) === k) === b; };

    // ---------------------------------------------------------------- the caret, as (block, offset in its own text)
    function pos(node, offset, dir) {
      const all = order(); if (!all.length) return null;
      const edge = i => { for (let k = i; k >= 0 && k < all.length; k += dir) if (!isIsland(all[k])) return dir > 0 ? { b: all[k], off: 0 } : { b: all[k], off: textOf(all[k]).length }; const any = all.filter(x => !isIsland(x)); if (!any.length) return null; const b = dir > 0 ? any[any.length - 1] : any[0]; return { b, off: dir > 0 ? textOf(b).length : 0 }; };
      if (node === el || (isList(node) && node.parentNode === el)) {      // between blocks
        const kids = node === el ? [...el.children] : [...node.children], n = kids[Math.min(offset, kids.length) - (dir < 0 ? 1 : 0)] || (dir < 0 ? kids[0] : kids[kids.length - 1]);
        const b = !n ? null : isList(n) ? (dir < 0 ? n.lastElementChild : n.firstElementChild) : n;
        return b ? edge(all.indexOf(b)) : null;
      }
      let b = node.nodeType === 1 ? node : node.parentNode;
      while (b && b.parentNode !== el && !(b.tagName === 'LI' && b.parentNode && b.parentNode.parentNode === el && isList(b.parentNode))) b = b.parentNode;
      if (!b) return null;
      if (isIsland(b)) return edge(all.indexOf(b));                                    // inside an island: the nearest place a caret can be
      let inner = node.nodeType === 1 ? node : node.parentNode; for (; inner && inner !== b; inner = inner.parentNode) if (isIsland(inner)) return { b, off: 0 };      // inside the block's leading island
      const r = document.createRange(); r.selectNodeContents(b); try { r.setEnd(node, offset); } catch (e) { return { b, off: 0 }; }
      const lead = leadOf(b);
      return { b, off: Math.max(0, Math.min(textOf(b).length, r.toString().replace(/ /g, ' ').length - (lead && r.toString().length ? lead.textContent.length : 0))) };
    }
    function where() {
      const s = getSelection(); if (!s.rangeCount || !el.contains(s.anchorNode) || !el.contains(s.focusNode)) return null;
      const r = s.getRangeAt(0), a = pos(r.startContainer, r.startOffset, 1); if (!a) return null;
      let z = s.isCollapsed ? a : (pos(r.endContainer, r.endOffset, -1) || a); const all = order();
      if (z.b !== a.b && z.off === 0) { let k = all.indexOf(z.b) - 1; while (k >= 0 && isIsland(all[k])) k--; if (k >= all.indexOf(a.b)) z = { b: all[k], off: textOf(all[k]).length }; }      // a selection that ends at the very start of a block (a triple click) does not take that block in
      const back = all.indexOf(z.b) < all.indexOf(a.b) || (z.b === a.b && z.off < a.off);
      return { a, z: back ? a : z, collapsed: s.isCollapsed || back || (a.b === z.b && a.off === z.off) };
    }
    function caretTo(b, off) {
      const s = getSelection(); let left = off;
      for (const n of b.childNodes) if (n.nodeType === 3) { if (left <= n.length) { s.collapse(n, left); return; } left -= n.length; }
      const br = [...b.childNodes].findIndex(n => n.nodeName === 'BR'); s.collapse(b, br < 0 ? b.childNodes.length : br);
    }
    /** where a caret at (block, offset) is in the page itself */
    function point(b, off) { let left = off; for (const n of b.childNodes) if (n.nodeType === 3) { if (left <= n.length) return [n, left]; left -= n.length; } const br = [...b.childNodes].findIndex(n => n.nodeName === 'BR'); return [b, br < 0 ? b.childNodes.length : br]; }
    /** everything that can be typed into, from the first block to the last (the browser's own Select All gives up on a page that has protected pieces in it) */
    function selectAll() { const ed = order().filter(b => !isIsland(b)); if (!ed.length) return; const a = point(ed[0], 0), z = point(ed[ed.length - 1], textOf(ed[ed.length - 1]).length); getSelection().setBaseAndExtent(a[0], a[1], z[0], z[1]); }
    const caretNow = () => { const w = where(); return w ? { i: order().indexOf(w.a.b), off: w.a.off } : null; };

    // ---------------------------------------------------------------- the edits that change the structure
    const near = (b, d) => { const all = order(); return all[all.indexOf(b) + d] || null; };
    /** the block that Enter makes after this one: a list item after a list item, a paragraph after a heading, else the same again */
    function blockAfter(b, text) {
      const li = b.tagName === 'LI', head = HEAD.test(b.tagName); let key = keyOf(b);
      if (head) { const nx = near(b, 1); if (nx && !isIsland(nx) && nx.tagName === 'P') key = keyOf(nx); }      // a paragraph under a heading belongs to the text that follows it
      const n = make(key, li ? 'li' : head ? 'p' : tagOf(b)); setText(n, text); b.after(n); return n;
    }
    function split(c) { const t = textOf(c.b), n = blockAfter(c.b, t.slice(c.off)); setText(c.b, t.slice(0, c.off)); caretTo(n, 0); }
    function joinUp(b) {                                          // Backspace at the start of a block
      const p = near(b, -1); if (!p || isIsland(p) || leadOf(b)) return;       // an island above stays, and so does a heading's own numbering
      const t = textOf(p); setText(p, t + textOf(b)); drop(b); caretTo(p, t.length);
    }
    function joinDown(b) {                                        // Delete at the end of a block
      const n = near(b, 1); if (!n || isIsland(n) || leadOf(n)) return;
      const t = textOf(b); setText(b, t + textOf(n)); drop(n); caretTo(b, t.length);
    }
    /** take out what is selected. Text goes; islands in the way stay where they are. */
    function removeRange(a, z) {
      if (a.b === z.b) { const t = textOf(a.b); setText(a.b, t.slice(0, a.off) + t.slice(z.off)); caretTo(a.b, a.off); return; }
      const all = order(), i = all.indexOf(a.b), j = all.indexOf(z.b); let wall = false;
      for (let k = i + 1; k < j; k++) { if (isIsland(all[k])) wall = true; else if (leadOf(all[k])) { setText(all[k], ''); wall = true; } else drop(all[k]); }      // a block with its own protected start stays, emptied of what was typed
      const ta = textOf(a.b).slice(0, a.off), tz = textOf(z.b).slice(z.off);
      if (!wall && !leadOf(z.b)) { setText(a.b, ta + tz); drop(z.b); } else { setText(a.b, ta); setText(z.b, tz); }
      caretTo(a.b, ta.length);
    }
    function insert(c, text) { const t = textOf(c.b); setText(c.b, t.slice(0, c.off) + text + t.slice(c.off)); caretTo(c.b, c.off + text.length); }
    /** plain text, wherever it came from: each line of it becomes a block of the kind it lands in */
    function pasteText(c, text) {
      const lines = String(text).replace(/\r/g, '').split(/\n+/).map(s => s.replace(/[ \t ]+/g, ' ').trim()).filter(Boolean); if (!lines.length) return;
      const t = textOf(c.b), tail = t.slice(c.off); setText(c.b, t.slice(0, c.off) + lines[0]);
      let cur = c.b; for (let i = 1; i < lines.length; i++) cur = blockAfter(cur, lines[i]);
      const end = textOf(cur).length; setText(cur, textOf(cur) + tail); caretTo(cur, end);
    }

    // ---------------------------------------------------------------- reading the page, and writing it
    const read = () => order().map(b => isIsland(b) ? { key: keyOf(b), island: true } : { key: keyOf(b), tag: tagOf(b), text: textOf(b) });
    function place(parent, kids) { let ref = parent.firstChild; for (const k of kids) { if (k === ref) ref = ref.nextSibling; else parent.insertBefore(k, ref); } while (ref) { const n = ref.nextSibling; ref.remove(); ref = n; } }
    /** make the page say exactly this list of blocks. Elements that are already right are left untouched. */
    function write(list) {
      const pool = new Map(), top = [], seen = new Set(); let cur = null;
      for (const b of order()) if (!isIsland(b)) { const k = keyOf(b) + '|' + tagOf(b); if (!pool.has(k)) pool.set(k, []); pool.get(k).push(b); }
      for (const d of list) {
        if (d.island) { cur = null; const n = islands.get(d.key); if (n) top.push(n); continue; }
        const m = meta.get(d.key) || {}, q = pool.get(d.key + '|' + d.tag), b = (q && q.shift()) || make(d.key, d.tag);
        setLead(b, seen.has(d.key) ? '' : m.lead, m.leadCls); seen.add(d.key);
        if (textOf(b) !== d.text || !b.firstChild || (leadOf(b) && b.childNodes.length === 1)) setText(b, d.text);
        if (d.tag === 'li') { if (!cur || cur.dataset.key !== d.key) { cur = listFor(d.key); cur.tmKids = []; top.push(cur); } cur.tmKids.push(b); } else { cur = null; top.push(b); }
      }
      place(el, top); for (const n of top) if (n.tmKids) { place(n, n.tmKids); n.tmKids = null; }
    }
    /** after the browser has typed: nothing but text inside a block, islands back in their places */
    function heal() {
      for (const n of [...el.childNodes]) {
        if (n.nodeType === 1 && (isList(n) || isIsland(n))) continue;
        const prev = n.previousElementSibling, key = (n.nodeType === 1 && n.dataset.key) || (prev ? (prev.dataset.key || '') : (order().find(x => !isIsland(x)) ? keyOf(order().find(x => !isIsland(x))) : ''));
        if (n.nodeType === 3 || n.tagName === 'DIV' || n.tagName === 'BR') { const t = n.textContent; if (!t.trim()) { n.remove(); continue; } const p = make(key, 'p'); n.replaceWith(p); setText(p, t); }
        else if (!n.dataset.key) n.dataset.key = key;
      }
      for (const b of order()) {
        if (isIsland(b)) continue;
        const lead = leadOf(b); let dirty = false;
        for (const c of [...b.childNodes]) if (c.nodeType === 1 && c !== lead && !(c.tagName === 'BR' && c === b.lastChild && !textOf(b))) dirty = true;
        if (dirty || b.childNodes.length > (lead ? 2 : 1)) setTextKeepingCaret(b);
        if (!b.firstChild || (lead && b.childNodes.length === 1)) b.append(document.createElement('br'));
        const m = meta.get(keyOf(b)); if (m && m.lead && !lead && firstOfKey(b)) setLead(b, m.lead, m.leadCls);
      }
      if (last) last.blocks.forEach((d, i) => {                    // an island is never removed by an edit: it goes back where it was
        const n = d.island && islands.get(d.key); if (!n || n.isConnected) return;
        let ref = null; for (let k = i + 1; k < last.blocks.length && !ref; k++) { const x = last.blocks[k]; ref = x.island ? (islands.get(x.key) && islands.get(x.key).isConnected ? islands.get(x.key) : null) : el.querySelector(':scope > [data-key="' + x.key + '"]'); }
        el.insertBefore(n, ref);
      });
    }
    function setTextKeepingCaret(b) { const w = where(), mine = w && w.collapsed && w.a.b === b ? w.a.off : -1, t = textOf(b); setText(b, t); if (mine >= 0) caretTo(b, Math.min(mine, t.length)); }

    // ---------------------------------------------------------------- the document's own undo
    const snap = () => ({ blocks: read(), caret: caretNow() });
    const sameAs = (a, b) => JSON.stringify(a.blocks) === JSON.stringify(b.blocks);
    /** after any change. A run of typing is one step back; a pause, or a change of kind, starts the next. */
    function changed(kind) {
      const now = snap();
      if (last && sameAs(now, last)) { last = now; return; }
      const run = (kind === 'in' || kind === 'out') && kind === lastKind && performance.now() - lastAt < 700;
      if (!run && last) { if (preCaret) last.caret = preCaret; past.push(last); if (past.length > 300) past.shift(); }
      future = []; last = now; lastKind = kind; lastAt = performance.now();
      clearTimeout(timer); timer = setTimeout(flush, 120);
    }
    function restore(s) { write(s.blocks); const all = order(), b = s.caret && all[s.caret.i]; if (b && !isIsland(b)) caretTo(b, Math.min(s.caret.off, textOf(b).length)); last = snap(); lastKind = ''; clearTimeout(timer); timer = setTimeout(flush, 0); }
    function undo() { if (!past.length) return; const now = snap(); future.push(now); restore(past.pop()); }
    function redo() { if (!future.length) return; const now = snap(); past.push(now); restore(future.pop()); }
    function flush() { clearTimeout(timer); timer = 0; if (O.onChange) O.onChange(read()); }

    // ---------------------------------------------------------------- what is typed
    el.addEventListener('beforeinput', e => {
      const t = e.inputType || '';
      if (t === 'historyUndo') { e.preventDefault(); undo(); return; }
      if (t === 'historyRedo') { e.preventDefault(); redo(); return; }
      if (/^format|Drop$|^deleteByDrag|^insertFromYank|^insertHorizontalRule|List$|^insertLink/.test(t)) { e.preventDefault(); return; }
      if (/^insertFromPaste/.test(t)) { e.preventDefault(); return; }                  // the paste event does it, as plain text
      const w = where(); if (!w) { e.preventDefault(); return; }
      preCaret = { i: order().indexOf(w.a.b), off: w.a.off };
      const own = (fn, kind) => { e.preventDefault(); fn(); changed(kind || 'edit'); };
      const wide = !w.collapsed && (w.a.b !== w.z.b || leadOf(w.a.b));                // across blocks, or in a block with its own numbering: done here
      if (t === 'insertParagraph' || t === 'insertLineBreak') { own(() => { if (!w.collapsed) removeRange(w.a, w.z); const c = where(); if (c) split(c.a); }); return; }
      if (wide) { own(() => { removeRange(w.a, w.z); const c = where(); if (c && /^insert/.test(t) && e.data) insert(c.a, e.data); }, /^insert/.test(t) && e.data ? 'in' : 'edit'); return; }      // typed over a selection: the letters that follow belong to the same step back
      if (w.collapsed && /^delete\w*Backward$/.test(t) && w.a.off === 0) { own(() => joinUp(w.a.b)); return; }
      if (w.collapsed && /^delete\w*Forward$/.test(t) && w.a.off === textOf(w.a.b).length) { own(() => joinDown(w.a.b)); return; }
    });
    el.addEventListener('input', e => { if (e.isComposing) return; const t = e.inputType || ''; heal(); changed(/^insert(Text|CompositionText)$/.test(t) ? 'in' : /^delete/.test(t) ? 'out' : 'edit'); });      // while a character is being composed the text is left alone
    el.addEventListener('compositionend', () => { heal(); changed('in'); });
    el.addEventListener('paste', e => {
      e.preventDefault(); const text = (e.clipboardData || window.clipboardData).getData('text/plain'), w = where(); if (!w || !text) return;
      preCaret = { i: order().indexOf(w.a.b), off: w.a.off };
      if (!w.collapsed) removeRange(w.a, w.z); const c = where(); if (c) pasteText(c.a, text); changed('edit');
    });
    el.addEventListener('cut', e => {
      const w = where(), s = getSelection(); if (!w || w.collapsed) return;
      e.preventDefault(); e.clipboardData.setData('text/plain', s.toString()); preCaret = { i: order().indexOf(w.a.b), off: w.a.off }; removeRange(w.a, w.z); changed('edit');
    });
    el.addEventListener('drop', e => e.preventDefault());
    el.addEventListener('dragstart', e => e.preventDefault());
    el.addEventListener('keydown', e => {
      if (e.target !== el) return;                                                     // a control inside an island keeps its own keys
      e.stopPropagation();
      const key = (e.key || '').toLowerCase(), mod = (e.metaKey || e.ctrlKey) && !e.altKey;
      if (mod && key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (mod && key === 'y') { e.preventDefault(); redo(); }
      else if (mod && key === 'a') { e.preventDefault(); selectAll(); }
      else if (mod && (key === 'b' || key === 'i' || key === 'u')) e.preventDefault();
      else if (e.key === 'Escape') { e.preventDefault(); el.blur(); }
    });
    el.addEventListener('keyup', e => { if (e.target === el) e.stopPropagation(); });
    el.addEventListener('focusout', e => { if (el.contains(e.relatedTarget)) return; if (timer) flush(); if (O.onSettle) O.onSettle(); });

    // ---------------------------------------------------------------- from the model
    function island(d) {
      let n = islands.get(d.key);
      if (!n) {
        n = d.build ? d.build() : h(d.tag || 'p', { class: d.cls || '', text: d.text });
        n.dataset.key = d.key; n.setAttribute('contenteditable', 'false'); n.classList.add('tm-island'); if (!d.build) n.classList.add('is-text');
        n.tmSig = d.build ? d.sig : d.text; islands.set(d.key, n);
      } else if (d.build) { if (d.sig !== n.tmSig) { n.tmSig = d.sig; if (d.patch) d.patch(n); } }
      else if (n.tmSig !== d.text) { n.tmSig = d.text; n.textContent = d.text; }
    }
    /**
     * The document as the model has it now: a list of
     *   { key, tag, cls, text, lead?, leadCls?, bound? }      a block of text ("lead" is its own inline island)
     *   { key, tag: 'li', list: 'ol', listCls, text, bound? }  an item of a list
     *   { key, island: true, tag, cls, text }                  protected text
     *   { key, island: true, sig, build(), patch?(el) }        a protected piece that is not text
     * Returns false, and does nothing, while the page has the focus (call again when it has settled).
     */
    function update(descs) {
      if (document.activeElement === el) return false;
      const groups = [], at = new Map();
      for (const d of descs) {
        meta.set(d.key, d);
        if (d.island) { island(d); groups.push({ key: d.key, island: true }); continue; }
        let g = at.get(d.key); if (!g) { g = { key: d.key, bound: !!d.bound, blocks: [] }; at.set(d.key, g); groups.push(g); }
        g.blocks.push({ tag: d.tag, text: d.text });
      }
      const have = new Map(); for (const b of read()) if (!b.island) { if (!have.has(b.key)) have.set(b.key, []); have.get(b.key).push({ tag: b.tag, text: b.text }); }
      const out = [], next = new Map();
      for (const g of groups) {
        if (g.island) { out.push({ key: g.key, island: true }); continue; }
        const sig = JSON.stringify(g.blocks), was = base.get(g.key), cur = have.get(g.key), curSig = cur ? JSON.stringify(cur) : '';
        next.set(g.key, sig);
        const use = was === undefined || g.bound ? g.blocks                       // a new part; or a part that is kept in the data (what was typed there has already been read back into it)
          : was === sig ? (cur || [])                                              // nothing new from the model: what is on the page stays, and what was removed stays removed
          : (!cur || curSig === was) ? g.blocks : cur;                            // the model changed it: taken, unless the person has written something else there
        for (const b of use) out.push({ key: g.key, tag: b.tag, text: b.text });
      }
      base = next;
      const before = JSON.stringify(read());
      write(out); for (const d of descs) if (!d.island && d.lead !== undefined) { const b = order().find(x => !isIsland(x) && keyOf(x) === d.key); if (b) setLead(b, d.lead, d.leadCls); }
      if (JSON.stringify(read()) !== before) { past = []; future = []; }           // the page was changed from outside: its history starts again
      last = snap();
      return true;
    }
    return { el, update, read, flush: () => { if (timer) flush(); }, undo, redo, focused: () => document.activeElement === el, steps: () => past.length, blocks: order };
  }
  return { create };
})();
