// Renders spec.js to SPEC.md (run: node build_spec.js)
const fs = require('fs'); const vm = require('vm');
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(__dirname + '/spec.js', 'utf8'), ctx); const S = ctx.window.SPEC;
let md = `# ${S.product} — interaction system (source of truth)\n\nGenerated from \`spec.js\`. The app implements exactly these screens and affordances; the in-app “?” shows the current screen’s list.\n\n## Principles\n\n${S.principles.map(p => '- ' + p).join('\n')}\n\n## Global\n\n| Control | Gesture | Result |\n|---|---|---|\n${S.global.map(a => `| ${a[0]} | ${a[1]} | ${a[2]} |`).join('\n')}\n\n`;
for (const sc of S.screens) {
  md += `## ${sc.name} (\`${sc.id}\`)\n\n${sc.purpose}\n\n| Control | Gesture | Result |\n|---|---|---|\n${sc.affordances.map(a => `| ${a[0]} | ${a[1]} | ${a[2]} |`).join('\n')}\n`;
  if (sc.edge.length) md += `\nEdge cases\n\n${sc.edge.map(e => '- ' + e).join('\n')}\n`;
  md += '\n';
}
md += `## Screen graph\n\nmap → location (Open inspection) → camera (New entry) → record (after scan) → deck (Recommendations) → record → location (Save)\n\nlocation → report · notice → kb → notice\n\nmap → menu → days → location (snapshot, read-only)\n\nlocation → map (‹ or Finish inspection)\n`;
fs.writeFileSync(__dirname + '/SPEC.md', md); console.log('SPEC.md written:', S.screens.length, 'screens');
