// Draws the "after" picture for each daisy-chain correction, from the inspection photograph.
//
//   node tools/daisy-after.js            all three
//   node tools/daisy-after.js a c        only those
//
// It goes through the repo's own image path (../ai/visual.js, Gemini on Vertex AI, key from ../.env), so there is
// one place where the model, the retries and the key live. Output lands in tools/work/ as PNG for inspection;
// nothing is installed into assets/ until it has been looked at — see the note at the bottom of this file.
//
// The pictures are illustrations and are captioned as such on the page. The rule they have to obey is the one in
// ai/prompts.js VISUAL: the same scene from the same camera, with the correction carried out and NOTHING else
// touched — same carpet, same two strips, same plugs, same light. A redrawn room is useless to an inspector.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'ai', 'env'))();
const visual = require(path.join(ROOT, 'ai', 'visual'));
const { backend, keyPresent } = require(path.join(ROOT, 'ai', 'draft'));

const PHOTO = path.join(__dirname, '..', 'assets', 'daisychain.png');
const WORK = path.join(__dirname, 'work');

// What is in the photograph, restated for the model so it does not have to infer the direction of the chain —
// which is the one thing it has to get right, and the thing it reads backwards if left to itself.
const SCENE = [
  'The photograph shows two power strips lying on grey ribbed carpet.',
  'UPPER STRIP: white, marked BELKIN, six outlets in a row. Four are occupied, left to right: a black right-angle',
  'plug, a white plug-in USB charger, a second black plug, and at the far right a CREAM right-angle plug.',
  'Its own supply cord leaves the LEFT end of the body and runs out of the frame.',
  'LOWER STRIP: cream coloured, worn, six outlets, a lit red rocker switch at its right end, two black plugs in it.',
  'Its supply cord leaves the RIGHT end of the body, curves up and to the right across the carpet, and ends in that',
  'CREAM right-angle plug in the far-right outlet of the upper white strip.',
  'So the lower cream strip is fed by the upper white strip. That single connection is the violation.',
].join(' ');

const CORRECTIONS = {
  a: {
    file: 'daisy-a-direct',
    title: 'Each power strip plugged directly into its own wall receptacle',
    text: [
      'Remove the CREAM right-angle plug from the far-right outlet of the white BELKIN strip, so that outlet is',
      'EMPTY and clearly unoccupied. The cream strip’s supply cord must no longer reach the white strip: show it',
      'leaving the right-hand end of the cream strip and running off the right edge of the frame instead, as a cord',
      'that now goes to a wall socket out of shot. Keep BOTH strips in the picture, in the same places, at the same',
      'angles, on the same carpet. Keep every other plug exactly as it is: the two black plugs and the white USB',
      'charger stay in the white strip, the two black plugs stay in the cream strip. Change nothing else at all.',
    ].join(' '),
  },
  b: {
    file: 'daisy-b-one-tap',
    title: 'One power strip, the second removed from the area',
    text: [
      'Remove the UPPER white BELKIN strip from the scene entirely, along with its cord and everything plugged into',
      'it. Where it was there is now only empty grey carpet, matching the carpet around it. The LOWER cream strip',
      'stays exactly where it is, at the same angle, with its two black plugs still in it and its lit red rocker',
      'switch still at the right end; its supply cord now runs off the right edge of the frame to a wall socket out',
      'of shot. Change nothing else: same camera, same light, same carpet, same wooden edge at the top left.',
    ].join(' '),
  },
  c: {
    file: 'daisy-c-receptacles',
    title: 'Both taps retired after receptacles were installed where the equipment sits',
    text: [
      'Remove BOTH power strips and all of their cords from the scene, leaving clean, empty grey ribbed carpet',
      'across the whole floor, matching the carpet texture and lighting already in the picture. Keep the wooden',
      'edge at the top left of the frame exactly as it is. The result is the same floor, photographed from the same',
      'place in the same light, with the strips and cords gone. Do not add a wall, a socket, furniture, equipment,',
      'people, text or labels of any kind.',
    ].join(' '),
  },
};

(async () => {
  const want = process.argv.slice(2).filter(a => CORRECTIONS[a]);
  const ids = want.length ? want : Object.keys(CORRECTIONS);
  if (!keyPresent()) { console.error('No GEMINI_API_KEY. Put one in ../.env — see ai/env.js.'); process.exit(1); }
  if (!fs.existsSync(PHOTO)) { console.error('No photograph at ' + PHOTO); process.exit(1); }
  fs.mkdirSync(WORK, { recursive: true });

  const photo = { mimeType: 'image/png', data: fs.readFileSync(PHOTO).toString('base64') };
  console.log(backend().name + ' · ' + visual.model() + ' · ' + ids.length + ' to draw');

  for (const id of ids) {
    const c = CORRECTIONS[id];
    process.stdout.write('  ' + id + ' ' + c.file + ' … ');
    try {
      const out = await visual.illustrate(photo, { title: c.title, text: c.text }, { finding: SCENE });
      const buf = Buffer.from(out.data, 'base64');
      const to = path.join(WORK, c.file + '.png');
      fs.writeFileSync(to, buf);
      console.log(Math.round(buf.length / 1024) + ' KB · ' + out.ms + ' ms → tools/work/' + c.file + '.png');
    } catch (e) {
      console.log('FAILED [' + (e.code || 'error') + '] ' + e.message.slice(0, 160));
    }
  }
  console.log('\nLook at each one before installing it. To install:');
  console.log('  cp tools/work/<name>.png assets/after/<name>.jpg   # lib/solutions.js maps the generated name to it');
})();
