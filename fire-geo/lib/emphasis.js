// FireGeo.emphasis: marks the key portions of a quoted code requirement so it can be scanned.
// It never changes the words: every phrase is a literal part of a quoted requirement, or a pattern matching one.
(function (root) {
// Each example names the key portions of its own quoted texts (examples/<id>/example.js, `emphasis`): the
// operative verb, the distance or threshold, who decides, any exception. Andrew, 2026-11-22: "let's highlight key
// portions of the code text so it's more readable". An example that names none simply has nothing marked.
const PHRASES = (root.FireExamples ? root.FireExamples.phrases() : []);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = PHRASES.length === 0 ? null : new RegExp(PHRASES.map(p => p instanceof RegExp ? p.source : esc(p)).sort((a, b) => b.length - a.length).join('|'), 'g');
// → [{ text, key:boolean }, …] covering the whole string, in order
function segments(text) {
  const out = []; let last = 0; text = String(text == null ? '' : text);
  if (!RE) return text ? [{ text, key: false }] : [];
  for (const m of text.matchAll(RE)) { if (m.index > last) out.push({ text: text.slice(last, m.index), key: false }); out.push({ text: m[0], key: true }); last = m.index + m[0].length; }
  if (last < text.length) out.push({ text: text.slice(last), key: false });
  return out;
}
// Fill an element with the text, key portions wrapped in <mark class="code-key">. Skips the work if unchanged.
function fill(el, text) {
  if (el.__emph === text) return el; el.__emph = text; el.textContent = '';
  for (const s of segments(text)) { if (s.key) { const m = document.createElement('mark'); m.className = 'code-key'; m.textContent = s.text; el.appendChild(m); } else el.appendChild(document.createTextNode(s.text)); }
  return el;
}
root.FireGeo = root.FireGeo || {}; root.FireGeo.emphasis = { segments, fill };
if (typeof module !== 'undefined') module.exports = root.FireGeo.emphasis;
})(typeof window !== 'undefined' ? window : globalThis);
