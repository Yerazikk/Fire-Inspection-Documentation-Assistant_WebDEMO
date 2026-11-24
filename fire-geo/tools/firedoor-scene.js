// Draws the "after" picture for the fire-door inspection, from the inspector's own photograph.
//
//   node tools/firedoor-scene.js            the one correction
//
// The photograph (assets/firedoor.png, 576 x 762) is used as it stands: unlike the daisy chain, the frame already
// holds the whole story — the wedge, the door, the closer at the head and the exit sign opposite — so nothing is
// outpainted here and the "before" the page shows is the inspector's own file.
//
// The wedge and the sign are one correction, so there is one picture: the same frame with the wedge gone, the
// door shut and a sign on the leaf. It lays over the photograph and the divider is pulled across the pair.
// The result lands in tools/work/ to be looked at before it is installed as
// assets/after/firedoor-a-shut-and-signed.jpg; the contour that the "Show what changed" switch draws is
// measured afterwards by tools/daisy-outline.js, from the difference between the pair rather than registration.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
require(path.join(ROOT, 'ai', 'env'))();
const visual = require(path.join(ROOT, 'ai', 'visual'));
const { backend, keyPresent } = require(path.join(ROOT, 'ai', 'draft'));

const ASSETS = path.join(__dirname, '..', 'assets');
const SCENE = path.join(ASSETS, 'firedoor.png');
const WORK = path.join(__dirname, 'work');

const WHAT_IS_THERE = [
  'The photograph looks along a service corridor at a cream-painted flush door hung in a dark steel frame.',
  'The door is NOT closed: it stands open, swung towards the camera, and the gap between its leading edge and the',
  'frame is visible. At floor level, under the leading edge of the door, a pale chunk of material is jammed in as a',
  'WEDGE. That wedge is the only thing holding the door open, and it is the violation.',
  'Across the head of the opening, at the top left, a slim metal DOOR CLOSER arm runs from the door to the frame.',
  'Behind and to the left is a second, dark brown door with a small red "Janitor / Closet" sign on it.',
  'On the white wall to the RIGHT of the fire door are a white EXIT sign with a red arrow pointing right, and below',
  'it a red and brass fire hose valve. Overhead at the top of the frame runs a red sprinkler pipe.',
  'The floor is dark grey carpet with a metal threshold strip across the doorway.',
].join(' ');

const CORRECTIONS = {
  a: {
    file: 'firedoor-a-shut-and-signed',
    title: 'Take the wedge out, and sign the door',
    text: [
      'Remove the WEDGE from under the door completely. The floor under the leading edge of the door is bare: just',
      'the dark grey carpet and the metal threshold strip, with nothing propped against the door and no debris.',
      '',
      'With nothing holding it, the door has CLOSED. Show the same cream door shut flush in its dark steel frame:',
      'the leading edge now meets the frame, there is no gap and no daylight between them, and the lever handle sits',
      'against the closed leaf. The closer arm at the head is now folded back along the door, as a closer sits when',
      'the door it serves is shut.',
      '',
      'Then add ONE small permanent sign to the face of the closed door, at about eye height, a little above the',
      'lever handle and centred on the leaf. It is a plain rectangular white plate, roughly 9 inches wide and 3',
      'inches tall, screwed flat to the door, carrying two short lines of plain red capital letters:',
      'FIRE DOOR on the first line and KEEP CLOSED on the second. Ordinary signage lettering, not a sticker, not',
      'handwritten, not glossy, no logo and no border decoration.',
      '',
      'Change NOTHING else. The same corridor, the same camera position and the same lens. The dark brown janitor',
      'door behind it keeps its own small red sign unchanged. The white EXIT sign with the red arrow and the red and',
      'brass hose valve on the right-hand wall stay exactly as they are, same size, same place. The red pipe overhead',
      'stays. Same carpet, same threshold strip, same scuffs on the door, same light and shadows.',
      '',
      'The only two differences from the original photograph are the wedge being gone with the door shut, and this',
      'one sign on the door. No people, no other text, no labels, no arrows, no numbers added to the picture.',
      'Photographic, not a diagram.',
    ].join(' '),
  },
};

async function draw(rec, outName) {
  const photo = { mimeType: 'image/png', data: fs.readFileSync(SCENE).toString('base64') };
  process.stdout.write('  ' + outName + ' … ');
  const out = await visual.illustrate(photo, rec, { finding: WHAT_IS_THERE });
  const buf = Buffer.from(out.data, 'base64');
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(path.join(WORK, outName + '.png'), buf);
  console.log(Math.round(buf.length / 1024) + ' KB · ' + out.ms + ' ms');
}

(async () => {
  const only = process.argv[2];
  if (!keyPresent()) { console.error('No GEMINI_API_KEY in ../.env'); process.exit(1); }
  if (!fs.existsSync(SCENE)) { console.error('No ' + SCENE); process.exit(1); }
  console.log(backend().name + ' · ' + visual.model());
  console.log('the fire door, corrected:');
  for (const [id, rec] of Object.entries(CORRECTIONS)) {
    if (only && only !== id) continue;
    await draw(rec, rec.file);
  }
  console.log('  look at tools/work/firedoor-a-shut-and-signed.png, then install it as assets/after/firedoor-a-shut-and-signed.jpg');
})();
