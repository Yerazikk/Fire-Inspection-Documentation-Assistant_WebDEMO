// Reads .env into process.env, without a dependency.
//
// Both hosts call this: the local server at startup, and `vercel dev`, where
// the file is the only source of the key. On a real Vercel deployment there is
// no .env — the three variables come from the project's environment — so this
// is a no-op there and must stay one.
const fs = require('fs'), path = require('path');

let done = false;

module.exports = function loadEnv() {
  if (done) return; done = true;
  const f = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
};
