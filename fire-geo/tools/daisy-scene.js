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
const SRC = path.join(ASSETS, 'daisychain-src.png');     // the inspector's frame as supplied, kept
const SCENE = path.join(ASSETS, 'daisychain.jpg');       // the upright frame the page shows
const WORK = path.join(__dirname, 'work');

const WHAT_IS_THERE = [
  'The photograph looks down at a carpeted floor below a run of pale cabinets.',
  'TOP LEFT: a white wall receptacle on the wall. It is a DUPLEX, two sockets on one faceplate. Only the LOWER',
  'socket is in use: a thick grey cord is plugged into it. The UPPER socket is empty.',
  'That grey cord runs down and right across the carpet to the UPPER STRIP: a dark grey power strip lying against',
  'the cabinet plinth. So the grey strip is correctly supplied, from the wall.',
  'A pale cord is plugged into one of the grey strip\u2019s sockets. It runs down and left across the carpet to the',
  'LOWER STRIP: a pale cream power strip in the foreground, with a lit red rocker switch at its near end and a',
  'large black plug-in transformer in it.',
  'So the pale strip is fed by the grey strip instead of by the wall. That single connection is the violation.',
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
  // The wall receptacle is a duplex and its upper socket is empty, so the correction is to use it. No receptacle
  // is installed, nothing is bought, and the wall is left exactly as photographed.
  a: {
    file: 'daisy-a-direct',
    title: 'Plug both power strips directly into the same wall outlet',
    text: [
      'Take the PALE PLUG out of the dark grey strip, so the socket it was in is visibly EMPTY and no cord runs',
      'between the two power strips any more.',
      '',
      'Run that pale cord instead to the wall receptacle at the TOP LEFT and plug it into the UPPER socket of that',
      'same receptacle \u2014 the empty one, directly above the grey cord that is already there. Both cords now come out',
      'of the one faceplate, side by side.',
      '',
      'Do NOT add a second receptacle, a second faceplate, or any new wiring. The wall must look exactly as it does',
      'now: ONE faceplate, same place, same size, only now both of its sockets are occupied.',
      '',
      'Both power strips stay exactly where they are on the carpet, at the same angles, with everything else',
      'plugged into them unchanged \u2014 the black transformer stays in the pale strip, the grey strip keeps its own',
      'cord to the lower socket. Same camera, same light, same cabinets, same carpet. No text, labels or arrows.',
    ].join(' '),
  },
  b: {
    file: 'daisy-b-one-tap',
    title: 'Replace both strips with one longer power strip',
    text: [
      'Remove BOTH power strips and the cord that ran between them. Where the pale strip was in the foreground',
      'there is only empty carpet.',
      '',
      'In their place put ONE single longer power strip, white, lying against the cabinet plinth roughly where the',
      'grey strip was, with its own long cord running up to the wall receptacle at the top left and plugged into',
      'the LOWER socket of it \u2014 the same single faceplate, unchanged, in the same place.',
      '',
      'The black plug-in transformer that was in the pale strip is now plugged into this one strip, along with two',
      'other ordinary plugs, spread along its length. One strip, one cord, one wall socket.',
      '',
      'Do not add a receptacle or a faceplate. Same camera, same light, same cabinets, same carpet, same plinth.',
      'No text, labels or arrows.',
    ].join(' '),
  },
  c: {
    file: 'daisy-c-receptacles',
    title: 'Install an additional permanent electrical outlet',
    text: [
      'Keep the wall receptacle at the top left exactly as it is, one white faceplate in the same place.',
      '',
      'Add ONE more matching white duplex receptacle on the same wall, lower down and further right, close to the',
      'cabinet plinth where the equipment actually sits \u2014 as a licensed electrician would have installed it.',
      '',
      'Remove BOTH power strips and all the cord between them from the floor. Instead, four ordinary appliance',
      'cords run directly to the two wall receptacles, two into each, and lead away across the carpet and out of',
      'the frame. No power strip anywhere in the picture, and no cord plugged into another cord.',
      '',
      'Same camera, same light, same cabinets, same plinth, same carpet texture.',
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
