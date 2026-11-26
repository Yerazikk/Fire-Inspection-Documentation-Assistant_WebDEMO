// node tools/new-example.js <id> "<tab name>" "<title>"
//
// Starts an example: copies examples/_template/example.js to examples/<id>/example.js with the id filled in, adds
// the id to the end of the list in examples/index.js, and prints what is left to do by hand. It writes nothing
// else and overwrites nothing. Everything after this is reading the law and the record and filling the file in,
// with `node tools/check-examples.js <id>` saying what is still missing.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const [id, tab, title] = process.argv.slice(2);

const die = m => { console.error(m); process.exit(1); };
if (!id) die('node tools/new-example.js <id> "<tab name>" "<title>"\n  id    one lower-case word, the folder name and the key everywhere\n  tab   two or three words for the tab strip\n  title what the photograph shows, in a few words');
if (!/^[a-z][a-z0-9]*$/.test(id)) die('the id must be one lower-case word (letters and digits): got "' + id + '"');

const dir = path.join(ROOT, 'examples', id);
if (fs.existsSync(dir)) die('examples/' + id + ' is already there. Edit it, or pick another id.');

const index = path.join(ROOT, 'examples', 'index.js');
let list = fs.readFileSync(index, 'utf8');
if (new RegExp("'" + id + "'").test(list)) die('examples/index.js already names "' + id + '".');

let tpl = fs.readFileSync(path.join(ROOT, 'examples', '_template', 'example.js'), 'utf8');
tpl = tpl.split('__ID__').join(id).split('__TITLE__').join(title || '(title)');
if (tab) tpl = tpl.replace("  id: '" + id + "', tab: '', title: ''", "  id: '" + id + "', tab: '" + tab + "', title: '" + (title || '') + "'");

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'example.js'), tpl);

// the id goes at the end of the list, which is where its tab appears; move the line to move the tab
const m = list.match(/(\n)(\s*)'([a-z0-9]+)',(\n\]\);)/);
if (!m) die('wrote examples/' + id + '/example.js, but could not find the id list in examples/index.js. Add "' + id + '" to it by hand.');
list = list.replace(m[0], m[1] + m[2] + "'" + m[3] + "',\n" + m[2] + "'" + id + "'," + m[4]);
fs.writeFileSync(index, list);

console.log('examples/' + id + '/example.js     written from the template');
console.log('examples/index.js                  "' + id + '" added at the end of the list');
console.log('');
console.log('Nothing else in the app has to change: the tab, the phone\'s camera, the code rows, the drafting');
console.log('desk and the owner\'s page all follow that list.');
console.log('');
console.log('What is left, in this order (examples/README.md has the detail):');
console.log('  1. put the photograph at assets/' + id + '.jpg (or .png) and set `aspect` to its width / height');
console.log('  2. write the header of examples/' + id + '/example.js: the photograph, why it is here, the words, the law');
console.log('  3. fill in `content` from a real inspection analysis, and the annotation boxes against the picture');
console.log('  4. read the codes and write the rows, each with its quoted text, its source and its verdict rule');
console.log('  5. write the field app: one reading, the scan, what the app sees, at most three questions');
console.log('  6. write the owner steps, then draw the "after" pictures and register their contours');
console.log('  7. node tools/check-examples.js ' + id + '      until it says "ready"');
console.log('  8. node test.js  and  node team/test.js         both still pass');
console.log('  9. add the documents you read to NOTES.md, and the sources to data/lawbase.js if they are new');
