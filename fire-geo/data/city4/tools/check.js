// node tools/check.js   (run from data/city4)
// Loads the three data files in node and checks them: shapes, pins inside the limit and the right zone, every row
// cited and sourced, every quoted passage present in the downloaded ordinance text, no em dashes, verdict table.
'use strict';
const fs = require('fs'), path = require('path'), DIR = path.join(__dirname, '..');
const C = require(path.join(DIR, 'law.js')), B = require(path.join(DIR, 'boundary.js')), Z = require(path.join(DIR, 'zones.js')), M = JSON.parse(fs.readFileSync(path.join(DIR, 'basemap.json'), 'utf8'));
let fail = 0, n = 0; const ok = (cond, msg) => { n++; if (!cond) { fail++; console.log('FAIL', msg); } };
const inRing = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > p[1]) !== (r[j][1] > p[1]) && p[0] < (r[j][0] - r[i][0]) * (p[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
const inRings = (p, rs) => rs.some(r => inRing(p, r));
const zoneOf = p => { for (const cls of ['mitigation', 'very-high', 'high']) for (const z of Z.zones) if (z.cls === cls && inRings(p, z.rings) && !(z.holes && inRings(p, z.holes))) return cls; return 'none'; };
// shapes
ok(C.id === 'berkeley' && C.name && C.short && C.kind && C.agency && Array.isArray(C.adopted) && C.source && Array.isArray(C.pin) && C.rows.ladder.length && C.rows.sprinkler.length && C.rows.firedoor.length && C.verdictRules && typeof C.differs === 'string', 'city object shape');
ok(globalThis.FIREGEO_CITY4 === C, 'global export');
const A = B.area; ok(A.id === 'berkeley' && A.kind === 'town' && Array.isArray(A.labelAt) && A.rings.length >= 1 && A.rings.every(r => r.length > 20 && r.every(p => p.length === 2)), 'boundary shape');
ok(Z.source && Z.zones.every(z => z.town === 'berkeley' && ['mitigation', 'very-high', 'high'].includes(z.cls) && z.rings.length), 'zones shape');
// pins
ok(inRings(C.pin, A.rings), 'main pin inside the city limit'); ok(zoneOf(C.pin) === 'mitigation', 'main pin inside a mitigation area');
ok(inRings(A.labelAt, A.rings), 'label point inside the city limit');
for (const [k, p] of Object.entries(C.pins)) { ok(inRings(p.at, A.rings), 'pin ' + k + ' inside the limit'); ok(zoneOf(p.at) === p.zone, 'pin ' + k + ' zone ' + zoneOf(p.at) + ' = ' + p.zone); ok(p.at[0] > M.west && p.at[0] < M.east && p.at[1] > M.south && p.at[1] < M.north, 'pin ' + k + ' on the basemap'); }
for (const z of Z.zones) if (z.cls === 'mitigation') for (const r of z.rings) { const inVH = r.filter(p => Z.zones.some(v => v.cls === 'very-high' && inRings(p, v.rings))).length / r.length; ok(inVH > 0.5, z.name + ' lies in the very high zone (' + (inVH * 100).toFixed(0) + '% of vertices; edges coincide)'); }
// basemap
ok(M.w === 1640 && M.h > 1000 && M.attribution === '© OpenStreetMap contributors' && fs.existsSync(path.join(DIR, 'basemap.jpg')), 'basemap meta');
const allInView = A.rings[0].filter(p => p[0] >= M.west && p[0] <= M.east && p[1] >= M.south && p[1] <= M.north).length / A.rings[0].length;
console.log('city limit vertices on the basemap:', (allInView * 100).toFixed(0) + '% (the rest are out in the Bay)');
// rows
const norm = s => s.replace(/^(?:(?:[a-z]|i{1,3}|iv|v|\d{1,2})\.[ \t]+)+/gm, '').replace(/-\n/g, '-').replace(/\s+/g, ' ').replace(/Page \d+ of \d+/g, ' ').replace(/Ordinance No\. 7,99\d-N\.S\./g, ' ').replace(/[“”"]/g, '"').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
const corpus = norm(['item41-2025-12-02.txt', 'item40-2025-12-02.txt', 'landscape-guide-2026.txt'].map(f => fs.readFileSync(path.join(DIR, 'sources', f), 'utf8')).join('\n'));
const quotesOf = s => { const out = []; let depth = 0, start = -1; for (let i = 0; i < s.length; i++) { if (s[i] === '“') { if (!depth) start = i + 1; depth++; } else if (s[i] === '”') { depth--; if (!depth) out.push(s.slice(start, i)); } } return out; };
let q = 0, qbad = 0;
for (const photo of ['ladder', 'sprinkler', 'firedoor']) for (const r of C.rows[photo]) {
  ok(r.key && r.label && r.title && r.rule && r.cite && r.requires && r.applies && r.open != null && r.source && /^https:\/\//.test(r.source.url) && r.status === 'read' && ['quote', 'quote+paraphrase', 'paraphrase'].includes(r.words), 'row fields ' + r.key);
  ok(typeof C.verdictRules[r.rule] === 'function', 'rule exists ' + r.rule); if (r.rule === 'judgement' || r.rule === 'shrubSpacing') ok(!!r.turns, 'turns on ' + r.key);
  if (r.words !== 'paraphrase') ok(quotesOf(r.requires).length > 0, 'has a quote ' + r.key);
  for (const quote of quotesOf(r.requires)) for (const part of quote.split('…')) { const t = norm(part.replace(' [sic]', '')); if (t.length < 4) continue; q++; if (!corpus.includes(t)) { qbad++; fail++; console.log('QUOTE NOT FOUND in', r.key, ':', t.slice(0, 90)); } }
}
for (const a of C.adopted) for (const quote of quotesOf(a.note || '')) { const t = norm(quote); q++; if (!corpus.includes(t)) { qbad++; fail++; console.log('QUOTE NOT FOUND in adopted:', t); } }
console.log('quoted passages checked against the downloaded text:', q, 'not found:', qbad);
// no em dashes anywhere in the data
const walk = (v, p) => { if (typeof v === 'string') ok(!/—/.test(v), 'em dash at ' + p); else if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + '[' + i + ']')); else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p + '.' + k); };
walk(C, 'city'); walk(B, 'boundary'); walk(Z.source, 'zones.source'); walk(M, 'basemap');
// verdict table
const rank = { green: 0, yellow: 1, red: 2 };
const run = (zone, d) => { const rs = C.rows.ladder.map(r => Object.assign({ key: r.key }, C.verdictRules[r.rule](r, { d, zone }))); let worst = 'green'; rs.forEach(r => { ok(['red', 'yellow', 'green'].includes(r.verdict) && r.why && (r.verdict !== 'yellow' || /Depends on|depends on/.test(r.why)), 'verdict form ' + r.key + ' ' + zone + ' ' + d + ': ' + r.why); ok(r.why.length <= 92, 'why length ' + r.key + ' ' + r.why.length); if (rank[r.verdict] > rank[worst]) worst = r.verdict; }); return { worst, rs }; };
console.log('\nladder photo, overall verdict (zone-zero / ladder-reach / vertical-spacing rows):');
for (const zone of ['mitigation', 'very-high', 'high', 'none', 'unknown']) console.log(' ', zone.padEnd(10), [3, 20, 60, 120].map(d => { const o = run(zone, d), g = k => o.rs.find(r => r.key === k).verdict[0]; return d + ' ft ' + o.worst + ' (' + g('zone-zero') + '/' + g('ladder-reach') + '/' + g('vertical-spacing') + ')'; }).join(' | '));
for (const r of C.rows.sprinkler) { const o = C.verdictRules[r.rule](r, { d: 20, zone: 'none' }); ok(o.verdict === 'yellow' && /^Depends on /.test(o.why), 'sprinkler verdict ' + r.key); }
ok(run('mitigation', 5).rs[0].verdict === 'red' && run('mitigation', 6).rs[0].verdict === 'green', 'zone 0 boundary inclusive at 5 ft');
ok(run('very-high', 30).rs[1].verdict === 'red' && run('very-high', 31).rs[1].verdict === 'green', 'ladder boundary inclusive at 30 ft');
ok(run('very-high', 100).rs[2].verdict === 'red' && run('very-high', 101).rs[2].verdict === 'green', 'spacing boundary inclusive at 100 ft');
console.log('\n' + (n - fail) + ' of ' + n + ' checks passed' + (fail ? ', ' + fail + ' FAILED' : ''));
process.exit(fail ? 1 : 0);
