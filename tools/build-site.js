// Assembles the deployed site into dist/:
//
//   dist/            the fire-geo demo ("Fire code by location") — the main site
//   dist/mobile/     the vegetation-inspection app that used to be the main site
//
// fire-geo asks for the server root: its shell loads /team/?embedded=1, /progress/pill.js and /api/… by
// absolute path, so it can only live at /. The mobile app is self-contained under its own folder; the only
// absolute paths it uses are /api/… , and the serverless functions stay at the root.
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

// Not served: caches, the local node server and its helpers, the regeneration tools and their downloads.
const SKIP_GEO = new Set([
  'node_modules', 'tools', 'sources', 'shots', 'team-input', 'feedback-shots', 'src-monday',
  'server.js', 'feedback-api.js', 'test.js', 'shot.js', '.gitignore', '.DS_Store',
]);
const SKIP_PUBLIC = new Set(['.DS_Store']);

function copy(from, to, skip, depth = 0) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (depth === 0 && skip.has(e.name)) continue;
    if (e.name === 'node_modules' || e.name === '.DS_Store' || /\.(old|pre-|bak)\./.test(e.name)) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copy(a, b, skip, depth + 1);
    else fs.copyFileSync(a, b);
  }
}

function count(dir) {
  let n = 0, bytes = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { const r = count(f); n += r.n; bytes += r.bytes; }
    else { n++; bytes += fs.statSync(f).size; }
  }
  return { n, bytes };
}

fs.rmSync(OUT, { recursive: true, force: true });
copy(path.join(ROOT, 'fire-geo'), OUT, SKIP_GEO);
copy(path.join(ROOT, 'public'), path.join(OUT, 'mobile'), SKIP_PUBLIC);

for (const f of ['index.html', 'app.js', 'team/index.html', 'assets/ladderfuel.jpg', 'mobile/index.html', 'mobile/app.js']) {
  if (!fs.existsSync(path.join(OUT, f))) throw new Error('build-site: dist/' + f + ' is missing');
}
const all = count(OUT);
console.log('dist: ' + all.n + ' files, ' + (all.bytes / 1048576).toFixed(1) + ' MB  (/ = fire-geo, /mobile/ = inspection app)');
