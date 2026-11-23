// team/promote.js: put a staged change live, only if it loads.
//   node team/promote.js          checks team/next/ on a scratch server (smoke.js), then copies its files over team/
// The live page is never left half-changed: everything staged is checked together and copied together.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const NEXT = path.join(__dirname, 'next');
(async () => {
  const files = fs.existsSync(NEXT) ? fs.readdirSync(NEXT).filter(f => fs.statSync(path.join(NEXT, f)).isFile()) : [];
  if (!files.length) { console.log('nothing staged'); return; }
  for (const f of files.filter(x => x.endsWith('.js'))) { try { new Function(fs.readFileSync(path.join(NEXT, f), 'utf8')); } catch (e) { console.log('NOT PROMOTED: ' + f + ' does not parse: ' + e.message); process.exit(1); } }
  const port = 8870 + Math.floor(Math.random() * 20), server = await require('./serve.js').start(port, true);
  process.env.TEAM_DRAFT_FAKE = '1';
  const args = [path.join(__dirname, 'smoke.js'), 'http://localhost:' + port + '/team/?embedded=1'].concat(process.argv[2] ? [process.argv[2]] : []);
  const r = await new Promise(res => { const c = require('child_process').spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] }); let out = ''; c.stdout.on('data', d => out += d); c.stderr.on('data', d => out += d); c.on('close', code => res({ code, out })); });
  server.close();
  process.stdout.write(r.out);
  if (r.code !== 0) { console.log('NOT PROMOTED: the staged page does not pass the load check'); process.exit(1); }
  for (const f of files) fs.copyFileSync(path.join(NEXT, f), path.join(__dirname, f));
  for (const f of files) fs.unlinkSync(path.join(NEXT, f));
  console.log('PROMOTED ' + files.join(', '));
})();
