// Builds the daisy-chain scene: an upright "before" that shows the whole chain including the wall receptacle, and
// the three "after" pictures that match it frame for frame.
//
//   node tools/daisy-scene.js before      draw the extended photograph only
//   node tools/daisy-scene.js after       draw the three corrections from assets/daisychain.jpg
//   node tools/daisy-scene.js             both, in that order
//
// WHY THE FRAME IS EXTENDED. The inspector's photograph (assets/daisychain-src.png, 517 x 377) is shot straight
// down at the floor. Both power taps are in it and the chain between them is in it, but the thing the chain is
// finally plugged into is not: the Belkin's own cord leaves the left of the frame and the picture never says where
// it goes. On screen that reads as an incomplete story, and it is also the wrong shape — the other two inspections
// are upright photographs (820 x 1474 and 428 x 710), so a 1.37 landscape sits in the left card as a squat band.
//
// So the model is asked to extend the same photograph upward into an upright frame, keeping every pixel of the
// original floor as it is and continuing the room above it to the skirting and the wall receptacle the cord runs
// to. That is outpainting, and it is recorded as such: NOTES.md § 13 says so, the page captions it, and the
// original is kept beside it as daisychain-src.png so the two can always be compared.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'ai', 'env'))();
const visual = require(path.join(ROOT, 'ai', 'visual'));
const { backend, keyPresent } = require(path.join(ROOT, 'ai', 'draft'));

const ASSETS = path.join(__dirname, '..', 'assets');
const SRC = path.join(ASSETS, 'daisychain-src.png');     // the inspector's frame, kept
const SCENE = path.join(ASSETS, 'daisychain.jpg');       // the upright frame the page shows
const WORK = path.join(__dirname, 'work');

const WHAT_IS_THERE = [
  'In the photograph, two power strips lie on grey ribbed carpet.',
  'UPPER STRIP: white, marked BELKIN, six outlets. Occupied left to right by a black right-angle plug, a white USB',
  'charger, a second black plug, and at the far right a CREAM right-angle plug. Its own cord leaves its LEFT end.',
  'LOWER STRIP: cream, worn, six outlets, a lit red rocker switch at the right end, two black plugs in it.',
  'Its cord leaves its RIGHT end, curves up and right, and ends in that CREAM plug in the white strip.',
  'So the cream strip is fed by the white strip. That is the violation.',
].join(' ');

const BEFORE = [
  'Extend this photograph upward into an UPRIGHT (tall) frame, about 3 units wide by 4 units tall.',
  '',
  'KEEP THE EXISTING PHOTOGRAPH EXACTLY AS IT IS in the lower part of the new frame: the same two power strips, the',
  'same plugs, the same cords, the same carpet, the same wooden edge, the same light and the same camera angle.',
  'Do not redraw, move, straighten or clean up anything that is already in the picture.',
  '',
  'ABOVE it, continue the same room in the same perspective and the same light: more of the same grey carpet, then a',
  'plain skirting board and a plain painted wall. In that wall, set a single ordinary white domestic double outlet',
  '(a standard duplex receptacle on a white faceplate) just above the skirting.',
  '',
  'Then show where the white BELKIN strip gets its power: its cord, which leaves the LEFT end of that strip, runs',
  'across the carpet and plugs into that wall outlet. Keep the cord the same colour and thickness it already is.',
  '',
  'The finished picture must read in one look as: wall outlet -> white Belkin strip -> cream strip. Three links.',
  'No people, no furniture, no text, no labels, no arrows, no numbers. Photographic, not a diagram.',
].join(' ');

const CORRECTIONS = {
  // The receptacle in the picture is a duplex: two sockets on one faceplate, and only the lower one is in use.
  // The correction is to use the socket that is already there. Nothing is installed, nothing is bought, and no
  // outlet appears that was not in the photograph — an earlier pass drew a second receptacle into the wall, which
  // is not what an inspector would ask for and not what the code asks for either.
  a: {
    file: 'daisy-a-direct',
    title: 'Both strips plugged straight into the receptacle that is already there',
    text: [
      'Take the CREAM right-angle plug out of the far-right outlet of the white BELKIN strip, so that outlet on the',
      'strip is visibly EMPTY.',
      '',
      'The wall receptacle in this picture is a duplex: two sockets on one white faceplate, and only the LOWER',
      'socket is in use (the white Belkin strip’s cord is in it). Plug the cream strip’s cord into the UPPER socket',
      'of that SAME receptacle. Its cord runs up from the cream strip, across the carpet, to that upper socket.',
      '',
      'Do NOT add a second receptacle, a second faceplate, or any new wiring. The wall must look exactly as it does',
      'now: one faceplate, in the same place, the same size — only now both of its sockets are occupied.',
      '',
      'Both strips stay where they are on the carpet, at the same angles, with every other plug unchanged: the two',
      'black plugs and the white USB charger stay in the white strip, the two black plugs stay in the cream strip.',
      'Same camera, same light, same skirting, same wooden edge, same carpet. No text, labels or arrows.',
    ].join(' '),
  },
  b: {
    file: 'daisy-b-one-tap',
    title: 'One strip of adequate rating in place of the two',
    text: [
      'Remove the UPPER white BELKIN strip from the scene entirely, with its cord and everything plugged into it.',
      'Where it was there is only the same empty grey carpet.',
      '',
      'The LOWER cream strip stays exactly where it is, at the same angle, with its lit red rocker switch and its',
      'two black plugs, and takes on the loads the white strip was carrying: show FOUR plugs in it now, spread',
      'along its length. Its cord runs up across the carpet and plugs into the LOWER socket of the wall receptacle',
      'that is already in the picture — the same single faceplate, unchanged, in the same place.',
      '',
      'Do not add a receptacle or a faceplate. Same camera, same light, same wall, same skirting, same wooden edge.',
      'No text, labels or arrows.',
    ].join(' '),
  },
  c: {
    file: 'daisy-c-receptacles',
    title: 'The strips retired after receptacles were added where the equipment is',
    text: [
      'Remove BOTH power strips from the floor.',
      '',
      'Keep the wall receptacle that is already in the picture exactly as it is, one white faceplate in the same',
      'place. Beside it, further along the same skirting, show ONE additional matching white duplex receptacle as a',
      'licensed electrician would have installed it.',
      '',
      'Four ordinary appliance cords now run to those two receptacles directly — two into each — and lead away',
      'across the carpet and out of the frame, as cords from desks and equipment would. No power strip anywhere in',
      'the picture, and no cord plugged into another cord.',
      '',
      'Same camera, same light, same wall, same skirting, same wooden edge, same carpet texture.',
      'No people, no furniture, no text, no labels, no arrows.',
    ].join(' '),
  },
};

async function draw(photoPath, rec, outName) {
  const mime = /\.jpe?g$/i.test(photoPath) ? 'image/jpeg' : 'image/png';
  const photo = { mimeType: mime, data: fs.readFileSync(photoPath).toString('base64') };
  process.stdout.write('  ' + outName + ' … ');
  const out = await visual.illustrate(photo, rec, { finding: WHAT_IS_THERE });
  const buf = Buffer.from(out.data, 'base64');
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(path.join(WORK, outName + '.png'), buf);
  console.log(Math.round(buf.length / 1024) + ' KB · ' + out.ms + ' ms');
}

(async () => {
  const stage = process.argv[2] || 'both';
  if (!keyPresent()) { console.error('No GEMINI_API_KEY in ../.env'); process.exit(1); }
  console.log(backend().name + ' · ' + visual.model());

  if (stage === 'before' || stage === 'both') {
    if (!fs.existsSync(SRC)) { console.error('No ' + SRC + ' — the inspector’s frame must be kept there.'); process.exit(1); }
    console.log('the upright scene, from the inspector’s frame:');
    await draw(SRC, { title: 'The same floor, framed upright as far as the wall outlet', text: BEFORE }, 'daisychain-scene');
    console.log('  look at tools/work/daisychain-scene.png, then install it as assets/daisychain.jpg');
  }
  if (stage === 'after' || stage === 'both') {
    if (!fs.existsSync(SCENE)) { console.error('No ' + SCENE + ' yet — run the before stage and install it first.'); process.exit(1); }
    console.log('the three corrections, from the scene the page shows:');
    for (const id of Object.keys(CORRECTIONS)) {
      const c = CORRECTIONS[id];
      try { await draw(SCENE, { title: c.title, text: c.text }, c.file); }
      catch (e) { console.log('FAILED [' + (e.code || 'error') + '] ' + e.message.slice(0, 160)); }
    }
  }
})();
