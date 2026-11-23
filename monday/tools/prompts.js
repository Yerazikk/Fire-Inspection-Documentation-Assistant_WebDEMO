// The image-edit prompts for the four after-images in the demo.
//
// Adapted from ai/prompts.js VISUAL.instruction, which is the rule set the
// production app draws its recommendation cards under. Two things carry over
// unchanged because they are what make a generated picture of someone's
// property defensible rather than a doctored photograph:
//
//   KEEP THE PROPERTY ITSELF — same camera, same light, same structure. The
//   owner holds their own photograph next to this and has to recognise it.
//   NO MEASURING OFF THE FRAME — one camera, one angle, no scale. A number
//   appears only if the correction or the inspector supplied it, and none of
//   these four corrections carries one, so none of these four shows one.
//
// What is deliberately NOT carried over is the one dimension bar VISUAL allows.
// Here the after-images stay clean: every callout, ghost and highlight in the
// demo is drawn in HTML over the photograph, where the text stays crisp and
// nothing is baked into a picture that later has to be defended.

// Shared constraint block, appended to each edit instruction.
const RULES = [
  '',
  'KEEP THE PROPERTY ITSELF',
  '- Same camera position, angle, lens and framing. Same time of day, same light, same shadow',
  '  direction, same weather, same exposure. It must look like the next photograph taken from',
  '  the same spot, not a different visit and not a different place.',
  '- Everything the correction does not touch stays exactly itself. The owner is holding their',
  '  own photograph next to this and has to recognise their own property in it.',
  '- Change only what the correction changes. Clearing vegetation reveals what was behind it —',
  '  the wall, the soil, the bare ground — it does not substitute new landscaping, fresh paint,',
  '  a repaired fence or a staged garden. Do not tidy, modernise or improve anything that was',
  '  not the finding.',
  '- No people, pets or vehicles that were not in the photograph, and keep the ones that were.',
  '',
  'MEASUREMENTS',
  '- Never measure anything off the photograph. One camera, one angle, no scale: you cannot',
  '  tell a 3 ft gap from a 10 ft one from an image, and must not try.',
  '- This correction carries no measurement, so no number, dimension, ruler or scale appears in',
  '  the picture at all.',
  '',
  'NOTHING ELSE ADDED',
  '- No watermark, no title bar, no legend, no caption strip, no added border, no before/after',
  '  split or inset. No arrows, outlines, callouts, ghosting, highlights, labels or text of any',
  '  kind. Return only the corrected photograph.',
].join('\n');

const LEAD = [
  'You are producing the visual for a fire inspector’s recommendation card. It is shown to the',
  'inspector and sent to the property owner with the correction notice, captioned there as a',
  'proposed result rather than as a photograph.',
  '',
  'Return a realistic photographic visualisation of THIS property as it would look once the',
  'correction below has been carried out — and with nothing else about it changed.',
  '',
].join('\n');

const build = parts => LEAD + parts.join('\n') + '\n' + RULES;

// The scene, restated for each ladder-fuel edit so the model has the inventory
// of what must survive the edit rather than inferring it.
const STREET = [
  'WHAT IS IN THIS PHOTOGRAPH',
  'A paved residential street running away from the camera. Along the left, raised above the',
  'road on a dark stone retaining wall, a landscaped strip in three layers: tall flowering',
  'oleander-like shrubs forming a dense upper canopy; beneath them a clipped, horizontally',
  'continuous green hedge; and at the base, along the top of the stone wall, low succulents and',
  'ground cover with some brown and dried material. Beyond: a utility pole with overhead',
  'conductors, a yellow bollard, a parked car, autumn-coloured trees, a shingle-roofed house on',
  'the right, blue sky with high cirrus, and a tree shadow falling across the road in the',
  'foreground. All of that stays exactly as photographed except where the correction says',
  'otherwise.',
  '',
];

const IMAGES = [
  {
    file: 'ladder-a-remove-hedge.png',
    source: 'ladderfuel.jpg',
    aspectRatio: '9:16',
    title: 'Remove the lower tier of bushes',
    instruction: build([
      'THE CORRECTION TO ILLUSTRATE',
      'Title: Remove the lower tier of bushes',
      'Detail: Remove the dense, horizontally continuous clipped hedge that runs beneath the tall',
      'flowering shrubs, so that the continuous vertical fuel pathway between the ground-level',
      'planting and the upper canopy is interrupted. Cut material is taken off the property.',
      'What the inspector recorded here: a ladder fuel condition — the lower hedge sits directly',
      'beneath the upper vegetation with little vertical separation, giving fire a path upward.',
      '',
      ...STREET,
      'WHAT THE PICTURE HAS TO SHOW',
      '- The clipped continuous hedge is gone along the whole run, from the foreground to where it',
      '  disappears up the street.',
      '- What was behind and beneath it is now visible: the dark stone retaining wall continuing',
      '  up, bare soil and leaf litter, the bare lower stems and trunks of the tall shrubs behind.',
      '- The tall flowering oleander-like canopy above is completely unchanged — same mass, same',
      '  outline against the sky, same flowers, same leaves.',
      '- The low succulents and ground cover along the top of the stone wall are unchanged.',
      '- An open, plainly visible gap now separates the ground from the underside of the canopy.',
    ]),
  },
  {
    file: 'ladder-b-prune-separation.png',
    source: 'ladderfuel.jpg',
    aspectRatio: '9:16',
    title: 'Selective pruning to increase vertical separation',
    instruction: build([
      'THE CORRECTION TO ILLUSTRATE',
      'Title: Selective pruning to increase vertical separation',
      'Detail: Instead of removing the lower hedge outright, raise the canopy of the tall shrubs by',
      'pruning their lower branches away, and cut the clipped hedge beneath them down to a low',
      'band, so that an open vertical gap opens between the two vegetation layers.',
      'What the inspector recorded here: a ladder fuel condition — the lower hedge sits directly',
      'beneath the upper vegetation with little vertical separation, giving fire a path upward.',
      '',
      ...STREET,
      'WHAT THE PICTURE HAS TO SHOW',
      '- The tall flowering shrubs keep their upper mass and their outline against the sky, but',
      '  their lower branches have been cut away, leaving clean bare trunks and stems below the',
      '  canopy. The canopy itself is intact and still flowering.',
      '- The clipped hedge beneath is still there but cut down to a low, neatly trimmed band, well',
      '  short of the branches above it.',
      '- Between the top of the cut-down hedge and the underside of the raised canopy there is a',
      '  clear, open band of air in which the bare trunks and the stone wall behind are visible.',
      '- The low succulents and ground cover along the top of the stone wall are unchanged.',
    ]),
  },
  {
    file: 'ladder-c-low-fuel-redesign.png',
    source: 'ladderfuel.jpg',
    aspectRatio: '9:16',
    title: 'Low-fuel landscape in place of the hedge',
    instruction: build([
      'THE CORRECTION TO ILLUSTRATE',
      'Title: Low-fuel landscape in place of the hedge',
      'Detail: Remove the continuous clipped hedge and replace that band with low-fuel landscaping —',
      'a bed of grey gravel with widely spaced low plants, none of them forming a continuous',
      'horizontal or vertical run of fuel. The tall flowering shrubs above are retained.',
      'What the inspector recorded here: a ladder fuel condition — the lower hedge sits directly',
      'beneath the upper vegetation with little vertical separation, giving fire a path upward.',
      '',
      ...STREET,
      'WHAT THE PICTURE HAS TO SHOW',
      '- The clipped continuous hedge is gone and the band it occupied is now a clean bed of grey',
      '  crushed gravel running along in front of the stone retaining wall.',
      '- Set into that gravel, low plants — succulents, lavender, low grey-green shrubs — each',
      '  clearly separate from its neighbours with open gravel between them, none of them tall',
      '  enough or dense enough to reach the branches above.',
      '- The dark stone retaining wall is fully visible along its length.',
      '- The tall flowering oleander-like canopy above is completely unchanged — same mass, same',
      '  outline against the sky, same flowers.',
      '- An open, plainly visible gap separates the new low planting from the underside of the',
      '  canopy.',
    ]),
  },
  {
    file: 'sprinkler-a-replacement.png',
    source: 'sprinkler.png',
    aspectRatio: '4:3',
    title: 'Replace the painted sprinkler head',
    instruction: build([
      'THE CORRECTION TO ILLUSTRATE',
      'Title: Replace the painted sprinkler head',
      'Detail: The painted pendent fire sprinkler is removed by a qualified sprinkler contractor and',
      'a clean, unpainted listed replacement is installed in the same position, in the same ceiling',
      'opening, on the same piping.',
      'What the inspector recorded here: apparent field-applied white paint on the sprinkler frame',
      'arms and central assembly — a painted-over sprinkler head requiring replacement.',
      '',
      'WHAT IS IN THIS PHOTOGRAPH',
      'A flat grey ceiling photographed at a shallow angle from below and to one side. A recessed',
      'pendent fire sprinkler drops through a circular opening: a white outer trim ring, a darker',
      'recessed inner cup, a two-arm metal frame, and a small toothed circular deflector at the',
      'bottom. White paint lies unevenly along both frame arms and around the central body. The',
      'trim ring carries small yellow-brown spots, and there is white material around the outer',
      'edge of the ring where it meets the ceiling.',
      '',
      'WHAT THE PICTURE HAS TO SHOW',
      '- The same grey ceiling, the same shallow camera angle, the same circular opening in the',
      '  same place in the frame, the same lighting and the same soft shadow under the assembly.',
      '- In place of the painted assembly, a clean new pendent sprinkler: bright unpainted',
      '  chrome-plated or brass metal, a crisp two-arm frame, a clean toothed deflector, and no',
      '  white coating anywhere on any part of it.',
      '- The surrounding ceiling finish is untouched — do not repaint, resurface or clean the',
      '  ceiling, and do not remove the yellow-brown spotting on the trim ring. Only the sprinkler',
      '  assembly itself is new.',
      '',
      'CRITICAL — DO NOT IDENTIFY A PRODUCT',
      '- The make and model of this sprinkler are unknown and must stay unknown. Render a generic,',
      '  plain pendent sprinkler.',
      '- No brand name, no logo, no model number, no sprinkler identification number, no stamped',
      '  lettering, no legible text or marking of any kind on the deflector, the frame or the trim.',
      '  Anything readable there would be an invented product identification.',
      '- No coloured glass bulb and no colour-coded element: the temperature rating is unknown and',
      '  a colour would assert one.',
    ]),
  },
];

module.exports = { IMAGES };
