// Assembles the deployed site into dist/:
//
//   dist/            the fire-geo demo ("Fire code by location") — the main site
//   dist/mobile/     the vegetation-inspection app that used to be the main site
//
// fire-geo asks for the server root: its shell loads /team/?embedded=1 and /api/… by absolute path, so it
// can only live at /. The mobile app is self-contained under its own folder; the only absolute paths it uses
// are /api/… , and the serverless functions stay at the root.
//
// The two working-session widgets — the feedback pill (bottom right) and the work-queue pill (bottom left,
// “0 in progress…”) — are for us while the thing is being built, not for anyone reading the live site. Their
// files are left out of dist/ and their <script> tags are stripped from the pages that carry them, so the
// local server keeps both and the deployed site shows neither.
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

// Not served: caches, the local node server and its helpers, the regeneration tools and their downloads.
const SKIP_GEO = new Set([
  'node_modules', 'tools', 'sources', 'shots', 'team-input', 'feedback-shots', 'src-monday',
  'server.js', 'feedback-api.js', 'test.js', 'shot.js', '.gitignore', '.DS_Store',
  'feedback-mode.js', 'progress',
]);
const SKIP_PUBLIC = new Set(['.DS_Store']);

function copy(from, to, skip, depth = 0) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (depth === 0 && skip.has(e.name)) continue;
    // '-src' is the untouched original kept beside a packed asset (fire-geo/assets/daisychain-src.png is 3.4 MB).
    // It belongs in the repository as provenance and has no business in the deployed tree.
    if (e.name === 'node_modules' || e.name === '.DS_Store' || /\.(old|pre-|bak)\./.test(e.name) || /-src\.[a-z0-9]+$/i.test(e.name)) continue;
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

// Pull the working-session widgets out of the pages that load them. Matched on the script src, so a page
// that is later given the pill is cleaned too, and a page that never had it is left untouched.
const WIDGETS = /[ \t]*<script[^>]+src="[^"]*(?:feedback-mode\.js|progress\/pill\.js)"[^>]*><\/script>(?:\r?\n)?/g;
function stripWidgets(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { stripWidgets(f); continue; }
    if (!/\.html$/.test(e.name)) continue;
    const was = fs.readFileSync(f, 'utf8'), now = was.replace(WIDGETS, '');
    if (now !== was) fs.writeFileSync(f, now);
  }
}
stripWidgets(OUT);

for (const f of ['index.html', 'app.js', 'team/index.html', 'assets/ladderfuel.jpg', 'mobile/index.html', 'mobile/app.js']) {
  if (!fs.existsSync(path.join(OUT, f))) throw new Error('build-site: dist/' + f + ' is missing');
}
for (const f of ['feedback-mode.js', 'progress/pill.js']) {
  if (fs.existsSync(path.join(OUT, f))) throw new Error('build-site: dist/' + f + ' should not be deployed');
}
if (/feedback-mode\.js|progress\/pill\.js/.test(fs.readFileSync(path.join(OUT, 'index.html'), 'utf8'))) {
  throw new Error('build-site: dist/index.html still loads a working-session widget');
}
const all = count(OUT);
console.log('dist: ' + all.n + ' files, ' + (all.bytes / 1048576).toFixed(1) + ' MB  (/ = fire-geo, /mobile/ = inspection app)');
