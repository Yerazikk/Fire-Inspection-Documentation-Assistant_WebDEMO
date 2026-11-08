// Prompt bench: run a sample inspection through the drafting engine from the
// command line, so prompt changes can be judged without clicking through the app.
//
//   npm run ai:check                 both documents, the violation fixture
//   npm run ai:check -- notice       one document
//   npm run ai:check -- report clean the compliance-only fixture
//   npm run ai:check -- --prompt     print the assembled prompt and stop
//   npm run ai:check -- --models     list the models this key can use
//
// Add fixtures below. A fixture is just a draft context — the same shape
// app.js posts to /api/draft.

const path = require('path');
const fs = require('fs');

(function loadEnv() {
  const f = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
})();

const ai = require('./draft');
const prompts = require('./prompts');

const base = {
  date: 'Nov 7, 2026',
  address: '40 Ridgecrest Rd, Kentfield, CA',
  owner: { name: 'M. Okafor', email: 'm.okafor@example.com' },
  inspector: { name: 'D. Alvarez', badge: 'VM-214', unit: 'Vegetation Management Unit', email: 'vegetation@marinfire.example.gov', phone: '(415) 555-0142' },
  correctionDays: 10,
  correctBy: 'Nov 17, 2026',
  portal: 'Accela Citizen Access',
  history: [
    { date: '2025-06-12', outcome: 'Compliant' },
    { date: '2024-06-20', outcome: '1 violation · corrected', notes: 'Firewood stacked against the north wall.' },
  ],
  attachments: [{ title: 'Vertical clearance standard', src: '14 CCR 1299.03 Figure 3' }],
};

const FIXTURES = {
  violation: {
    ...base,
    entries: [
      { n: 1, kind: 'violation', time: '10:38', hasPhoto: true, spoken: true, note: 'Oleander hedge along the street side has grown into the tree canopy above it, no gap between them, runs the whole length of the frontage. Ivy and leaf litter underneath right up to the retaining wall. House is downslope maybe 20 feet.' },
      { n: 2, kind: 'compliance', time: '10:51', hasPhoto: true, note: 'Retaining wall base is clear on the north side, succulents spaced out on bare soil, no litter.' },
      { n: 3, kind: 'note', time: '10:58', hasPhoto: false, note: 'Owner says the north gutters were cleaned last week, verify at reinspection.' },
    ],
  },
  clean: {
    ...base,
    entries: [
      { n: 1, kind: 'compliance', time: '09:12', hasPhoto: true, note: 'Roof and gutters clear of needles, no branches overhanging the roof. Deck perimeter clear.' },
    ],
  },
  bare: {
    ...base,
    entries: [{ n: 1, kind: 'violation', time: '11:02', hasPhoto: true, note: '' }],
  },
};

const show = doc => {
  if (doc.subject) console.log(`\nSUBJECT  ${doc.subject}\n${doc.greeting}`);
  if (doc.headline) console.log(`\n${doc.headline}`);
  for (const s of doc.sections) {
    console.log(`\n## ${s.heading}   [${s.id} · ${s.type}]`);
    if (s.type === 'prose') console.log(s.body);
    if (s.type === 'list') s.items.forEach(i => console.log(' - ' + i));
    if (s.type === 'fields') s.fields.forEach(f => console.log(` ${f.label}: ${f.value}`));
    if (s.type === 'codes') s.codes.forEach(c => console.log(` [${c.scope}] ${c.citation}${c.unverified ? '  <-- NOT IN LIBRARY' : ''}${c.pending ? '  <-- NOT YET ENFORCEABLE' : ''}\n    ${c.title} — ${c.relevance}`));
  }
  if (doc.closing) console.log('\n' + doc.closing);
  console.log(`\n-- ${doc.meta.model} · ${doc.meta.ms} ms · ${doc.meta.tokens ? doc.meta.tokens.in + ' in / ' + doc.meta.tokens.out + ' out' : 'usage unknown'} · finish ${doc.meta.finish}`);
  if (doc.audit.unknownCitations.length) console.log(`!! citations not in the library: ${doc.audit.unknownCitations.join('; ')}`);
  if (doc.audit.pendingCitations.length) console.log(`!  cited but not yet enforceable: ${doc.audit.pendingCitations.join('; ')}`);
};

(async () => {
  const args = process.argv.slice(2);
  if (args.includes('--models')) { console.log((await ai.listModels()).join('\n')); return; }

  const kinds = args.filter(a => a === 'report' || a === 'notice');
  const fixName = args.find(a => FIXTURES[a]) || 'violation';
  const ctx = FIXTURES[fixName];
  const run = kinds.length ? kinds : ['report', 'notice'];

  if (args.includes('--prompt')) {
    for (const k of run) {
      const p = prompts.assemble(k, { ...ctx, kind: k });
      console.log(`\n${'='.repeat(70)}\n${k.toUpperCase()} SYSTEM INSTRUCTION (${p.system.length} chars)\n${'='.repeat(70)}\n${p.system}`);
      console.log(`\n${'-'.repeat(70)}\n${k.toUpperCase()} USER TURN\n${'-'.repeat(70)}\n${p.user}`);
    }
    return;
  }

  for (const k of run) {
    console.log(`\n${'='.repeat(70)}\n${k.toUpperCase()} · fixture "${fixName}" · model ${prompts.MODEL.name}\n${'='.repeat(70)}`);
    try { show(await ai.draft(k, { ...ctx, kind: k })); }
    catch (e) { console.error(`FAILED [${e.code}] ${e.message}`, e.detail || ''); process.exitCode = 1; }
  }
})();
