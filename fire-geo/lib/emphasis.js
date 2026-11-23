// FireGeo.emphasis: marks the key portions of a quoted code requirement so it can be scanned.
// It never changes the words. The phrases below are picked by hand from the texts in data/law.js: the
// operative verb, the distance or threshold, who decides, and any exception. Andrew, 2026-11-22: "let's
// highlight key portions of the code text so it's more readable".
(function (root) {
const PHRASES = [
  'shall be removed within 30 feet of the structure',
  'within 100 feet of structures', 'up to 200 feet', 'as determined by the Fire Code Official',
  'When required by the Fire Code Official', /trees that are \d+" of diameter or less/, 'canopy separation within 30 feet of the structure',
  'within 10 feet (3048 cm) on each side', 'cleared of flammable vegetation', 'enter upon private property',
  'shall be installed and maintained in all newly constructed buildings or structures',
  'in all occupancies, in new buildings, and substantial remodels',
  'in excess of 3,000 sq. ft.', 'ten per cent (10%) or more floor area added', 'fifty per cent (50%) or more floor area added', 'within any 36 month period', '‘substantial remodel’',
  'shall be notified immediately', 'evacuated', 'approved fire watch', 'shall also apply to residential fire sprinkler systems',
  'public nuisance', 'abated on notice', 'costs assessed', 'constitutes a fire hazard',
  'kept in operative condition', 'repaired or replaced',
  'replacing sprinklers with disqualifying paint', 'detrimental to performance',
  'is prohibited', 'must be replaced',
  'Two exceptions', 'Five exceptions', 'other than R-3 occupancies',
  'State Responsibility Areas', 'very high fire hazard severity zones',
];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = new RegExp(PHRASES.map(p => p instanceof RegExp ? p.source : esc(p)).sort((a, b) => b.length - a.length).join('|'), 'g');
// → [{ text, key:boolean }, …] covering the whole string, in order
function segments(text) {
  const out = []; let last = 0; text = String(text == null ? '' : text);
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
