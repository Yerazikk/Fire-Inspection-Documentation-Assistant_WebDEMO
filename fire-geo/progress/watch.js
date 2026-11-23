// Writes status.json every 10 s from what is actually on disk. Run: node progress/watch.js
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.join(__dirname, '..'), T = '/private/tmp/claude-501/-Users-andrewdong/6ad5fe15-f171-4067-a3ee-b39384c7940f/tasks/';
const AGENTS = { tech: 'a5551d9915322a82a.output', team: 'a66878182ead65eb2.output' };
const ex = p => fs.existsSync(path.join(ROOT, p));
const walk = (dir, out = []) => { let es = []; try { es = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; } for (const e of es) { const p = path.join(dir, e.name); if (e.isDirectory()) { if (!/node_modules|src-monday|shots|png|assets|progress|\.git/.test(e.name)) walk(p, out); } else if (/\.(js|html|css|md)$/.test(e.name) && !/\.pre-/.test(e.name)) out.push(p); } return out; };
const read = fs_ => fs_.map(f => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } }).join('\n');
function scan() {
  const all = walk(ROOT), teamF = all.filter(f => f.includes('/team/')), techF = all.filter(f => !f.includes('/team/') && !f.includes('/team-input/'));
  const tech = read(techF), team = read(teamF), has = (s, re) => re.test(s);
  const newest = fs_ => fs_.reduce((m, f) => { try { return Math.max(m, fs.statSync(f).mtimeMs); } catch { return m; } }, 0);
  const items = {
    tech: [
      ['Plan written', ex('PLAN.md')],
      ['Fire code data and shared modules', ex('API.md') || ex('lib/codes.js')],
      ['Page and top tabs', ex('index.html')],
      ['Map with a pin you drag between towns', has(tech, /point.?in.?polygon|inPolygon|pointIn/i) && ex('index.html')],
      ['Codes panel: statewide layer and local layer', has(tech, /Statewide/) && ex('index.html')],
      ['Green, yellow, red verdicts', has(tech, /verdict/i) && ex('lib/codes.js')],
      ['Before and after solutions', has(tech, /before.?after/i) && ex('index.html')],
      ['Outline around what changed', has(tech, /contour|outline/i) && (ex('lib/solutions.js') || ex('index.html'))],
      ['Tests written', ex('test.js')],
      ['Sources and notes written', ex('NOTES.md')],
      ['Always-on server at localhost:8861', fs.existsSync('/Users/andrewdong/Library/LaunchAgents/com.andrewdong.fire-geo.plist')],
    ],
    team: [
      ['Page with phone and laptop', ex('team/index.html')],
      ['Phone: take the photo, AI scan', has(team, /scan/i) && ex('team/index.html')],
      ['Phone: "Is this what you mean?" note, easy to overwrite', has(team, /what you mean/i)],
      ['Phone: step-by-step extra checks (sprinkler and hedge)', has(team, /can.?t reach|cannot reach/i)],
      ['Send from phone, arrive on laptop', has(team, /inbox/i) && has(team, /send/i)],
      ['Laptop: codes with verdicts, red then yellow then green', has(team, /verdict/i) && ex('team/index.html')],
      ['Laptop: change a verdict, rows glide to new places', has(team, /FLIP|getBoundingClientRect/) && has(team, /verdict/i)],
      ['Laptop: solutions desk (confirm, edit, reprompt, veto, add own)', has(team, /veto/i)],
      ['AI rewrite on reprompt (local Claude)', ex('team/api.js')],
      ['Internal technical document', has(team, /internal document/i)],
      ['Resident portal preview inside the laptop', has(team, /resident portal/i)],
      ['Minimap with a pin that changes the senior\'s screen', has(team, /minimap|mini-map/i)],
      ['Junior: short questionnaire in place of the long check list', has(team, /quick questions/i) && !has(team, /Check \0\{?[a-z]* ?of|Other heads in the room/i)],
      ['Senior: one-line rows that expand for detail', has(team, /Still to confirm/i)],
      ['Senior: steps with a breadcrumb (finding, fixes, drafts, publish)', has(team, /breadcrumb/i)],
      ['Tests written', ex('team/test.js')],
      ['Notes written', ex('team/NOTES.md')],
    ],
  };
  let done = {}; try { done = JSON.parse(fs.readFileSync(path.join(__dirname, 'done.json'), 'utf8')); } catch {}
  const out = { at: Date.now(), tabs: {} };
  for (const k of ['tech', 'team']) {
    let active = 0; try { active = fs.statSync(T + AGENTS[k]).mtimeMs; } catch {}
    const rows = items[k].map(([name, found], i) => ({ id: k + i, name, state: done[k] ? 'done' : found ? 'built' : 'todo' }));
    // the first item not yet built is the one being worked on, if the agent is active
    const next = rows.find(r => r.state === 'todo'); if (next && !done[k] && Date.now() - active < 180000) next.state = 'wip';
    const built = rows.filter(r => r.state === 'built' || r.state === 'done').length;
    out.tabs[k] = { rows, total: rows.length, built, pct: done[k] ? 100 : Math.min(95, Math.round(built / rows.length * 95)), finished: !!done[k], lastFile: newest(k === 'team' ? teamF : techF), agentActive: active, note: (done[k] && done[k].note) || '' };
  }
  const t = out.tabs; out.pct = Math.round((t.tech.pct * t.tech.total + t.team.pct * t.team.total) / (t.tech.total + t.team.total));
  const req = http.get({ host: 'localhost', port: 8861, path: '/', timeout: 1500 }, r => { out.live8861 = r.statusCode === 200; r.resume(); write(out); });
  req.on('error', () => { out.live8861 = false; write(out); }); req.on('timeout', () => req.destroy());
}
const write = o => { try { fs.writeFileSync(path.join(__dirname, 'status.tmp'), JSON.stringify(o)); fs.renameSync(path.join(__dirname, 'status.tmp'), path.join(__dirname, 'status.json')); } catch {} };
scan(); setInterval(scan, 10000);
