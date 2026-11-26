// examples/__ID__/example.js — __TITLE__
//
// WRITE THIS HEADER FIRST, before any of the fields below, in four short paragraphs:
//
//   The photograph: what is in it, and where the file is. One or two sentences.
//   Why it is here: what this example shows that the others do not. If the answer is "nothing", do not add it.
//     The three shapes so far are: the verdict changes with the place (ladder fuel), the duty is state law and
//     only the citation changes (sprinkler, power taps), and the field inspector's answer moves the verdict
//     (power taps, fire door).
//   Words: where the inspection record came from. Every word of it must be lifted from a real analysis, not
//     written here. If there is no analysis behind it, there is no example yet.
//   Law: which codes were read, from which document, on what date.
//
// Then: node tools/check-examples.js __ID__   until it says "ready".
// The standard, and the order to fill this in: examples/README.md.
(function (root) {
'use strict';
const EX = root.FireExamples, CM = root.FireExampleCommon, SRC = root.FIREGEO_LAWBASE.sources;
// Also available from root.FIREGEO_LAWBASE: WUI, FIRE, PEN — the local code that carries a WUI section, a fire
// code section and the penalty clause in each of the four towns. Use them in `short` below.

// ============================================================= 1. what the inspector found
// window.CONTENT.__ID__: the inspection record, as structured content. Tags carry the evidentiary standing of a
// statement through to the page: confirmed (the inspector determined it) · observed (read off the photograph) ·
// verify (it cannot be settled from the evidence available). Nothing here is invented; gaps are stated as gaps.
const content = {
  tab: '',                       // two or three words, the same as the manifest's `tab`
  title: '',                     // the finding, as an inspection record names it
  status: '',                    // e.g. 'Noncompliant — inspector confirmed'
  meta: [
    ['Inspection type', ''],
    ['Category', ''],
    ['Location', ''],
    ['Referenced timeframe', ''],
  ],

  photo: 'assets/__ID__.jpg',
  aspect: 0,                     // the picture's own width / height, written as the division

  note: '',                      // the finding in one short phrase, as a field note
  noteFix: '',                   // what the inspector said to do, in their own voice
  noteWhy: '',                   // why it matters, in their own voice

  summary: '',                   // two sentences: what is in the photograph, and what makes it a finding
  primary: '',                   // the required correction, in the record's own words

  // Boxes are [left, top, width, height] as percentages of the displayed image, authored against the photograph,
  // never model-guessed. EXACTLY ONE box is tone 'red': that is the finding, and the phone's scan and the
  // laptop's crop both find it by that. The others are 'cyan': what is beside it and matters.
  annotations: [
    { box: [0, 0, 0, 0], tone: 'red', label: '', note: '' },
    { box: [0, 0, 0, 0], tone: 'cyan', label: '', note: '' },
  ],
  annotationCaption: '',         // one sentence: the condition the correction has to break

  // The corrections. The FIRST is the inspector's own and carries badge 'required'; everything else is an
  // alternative and must say its `limit` — what makes it not an equal choice.
  solutions: [
    {
      id: 'a',
      badge: 'required', badgeText: 'Inspector-preferred · required correction',
      title: '', lede: '',
      plain: '',                 // the same instruction for someone with no training
      image: 'assets/generated/__ID__-a-....png',
      where: '', change: '',
      how: ['', ''],
      keep: '',                  // what the owner does NOT have to touch
      why: '',
    },
  ],

  // Supplementary work that is not illustrable on its own. Optional.
  extras: [],

  // The record proper. Four sections in the three built examples: what the photograph shows, the fire behaviour
  // and risk, the applicable codes, and the internal inspection record. Blocks are
  //   { t: 'p' | 'h' | 'ul' | 'ol' | 'kv', v: … , tag?: 'observed' | 'verify' | 'confirmed' }
  analysis: [
    { h: '', blocks: [] },
    { h: '', blocks: [] },
    { h: '', blocks: [] },
  ],

  // The owner's page: plain words, no trade terms, no section numbers.
  owner: {
    title: '', sub: '', intro: '', todo: '', keep: '', when: '',
    qa: [
      { q: 'What did we find?', a: [''] },
      { q: 'Why is this dangerous?', a: [''] },
      { q: 'What do you need to do?', a: [''], image: true },
      { q: 'When must this be completed?', a: [''] },
    ],
  },

  // [the question, what is known, what the inspector has to settle] — one row per thing the photograph cannot
  // settle. This is where honesty lives: the more of these, the better the example.
  uncertainty: [
    ['', '', ''],
  ],

  final: [
    ['Primary finding', ''],
    ['Primary cause', ''],
    ['Preferred corrective action', ''],
    ['Final status', ''],
  ],
};

// ============================================================= 2. the law
// Quote the operative sentence of every section, in the code's own words, inside curly quotes. Nothing is
// paraphrased and nothing is inferred; where a document would not open, say so in its SRC entry and quote from
// whatever did. Read the real text: NOTES.md records which site served which chapter.
const Q_EXAMPLE = '“…”';

const law = {
  // Statewide rows: the same in every place. Each reads one section.
  state: [
    { key: '', label: '', title: '', value: null, unit: '', rule: '',
      cite: '2025 California Fire Code § ',
      requires: Q_EXAMPLE,
      applies: '',               // how this section applies to THIS photograph
      open: '',                  // what the photograph leaves unsettled about it
      turns: '',                 // required on a 'judgement' row: the one thing it turns on, lower case
      source: SRC.cfc6 },
  ],
  // One paragraph under the statewide block: what changes with the place, and what does not.
  stateNote: '',

  // Local rows: `by` says what each place changes. A place with no entry does not carry the row.
  local: [
    // Every fire-code finding carries the penalty clause, which is amended differently in each town:
    CM.penalties(),
  ],

  // The one-line form of each row: the section number, and the local code that carries it.
  short: {
    'penalties': { sec: '§ 113.4', code: root.FIREGEO_LAWBASE.PEN },
  },

  // One plain sentence when the map moves to the other region. {To} {toName} = the place arrived in.
  across: '',

  // The reason under the verdict headline: five or six plain words, no citation, no year, no section. A string
  // where it never changes; a function (P, c, verdict, rows) where it does, returning null to fall through.
  overallLine: '',

  // The verdict rules this example's rows name. Each returns { verdict, why }: `row` is the merged row, `c` is
  // { d, scope, zone, place }. A rule reads ONLY what the cited text says.
  //   red     the photograph settles it, and the inspector confirmed it
  //   yellow  it depends on something the photograph cannot settle — and `why` says what, in 70 characters
  //   green   the cited text does not reach this case
  // 'judgement' and 'carried' are shared (lib/codes.js) and must not be redefined here.
  rules: {
  },
};

// ============================================================= 3. the field app (the phone)
// The rules (Andrew, 22 Nov): the app answers everything it can, and the person is asked only what a photograph
// cannot tell. A question must be about THIS photograph and what is in it — nothing about the rest of the room or
// the building, nothing the person would have to go and survey. One screen, at most three questions, answered by
// tapping. Fewer is better. None is fine.
const field = {
  reading: {
    text: '',                    // what the app thinks is being reported, in plain words
    alternatives: ['', ''],      // the other readings a tap offers
    source: '',                  // which part of the content above these words come from
  },

  // What the scan lights up: the finding, and at most two things beside it. `ix` names an annotation above by
  // index; the region itself is read from that annotation, never written here.
  scan: [{ ix: 1, label: '' }, { ix: 0, label: '', finding: true }],

  // What the app reads off the photo: answers already filled in. The FIRST option is the app's own reading; the
  // others are what a tap on "Change" offers. Each names its source.
  seen: [
    { id: '', label: '', options: [{ id: '', label: '' }, { id: '', label: '' }, { id: 'unsure', label: 'Not sure' }], source: '' },
  ],

  // The questions. Each shows its answer control with it:
  //   picture  a small drawing of what the words refer to      options  answers to tap
  //   entry    a number typed on the screen                    write    free text
  //   cant     the way out, as a quiet text button             photo    one optional extra picture
  questions: [
    {
      id: '', ask: '',
      options: [{ id: '', label: '' }],
      cant: { id: 'unsure', label: 'Not sure' },
      say: () => '',             // one line under the question: why it is being asked
      source: '',                // the code row or content line the question comes from
    },
  ],

  /** the phone's answers as plain facts for the code rows. a = answers, c = corrected readings. */
  facts(a, c, h) {
    const f = {}; const { seen } = h;
    return f;
  },

  /** the one or two things the senior inspector should act on: a short line and a full sentence. Nothing here
   *  decides a verdict — it says what was read and what has to be settled, and by whom. */
  callouts(f, ctx) {
    const out = [];
    return out;
  },

  /** what those answers do to this example's rows on the senior inspector's desk (team/adapter.js).
   *  ctx = { rows, by, lead, D, call, known, dist, used, loc, place }. Use `lead(key, text)` to put a line in
   *  front of a row's analysis; set by[key].verdict / .why / .open only where the answer genuinely settles it. */
  apply(f, ctx) {
    const { by, lead } = ctx;
  },
};

// ============================================================= 4. the owner's numbered steps
// One list per correction, keyed by its id. Each step is one concrete action and says where to stop or what must
// stay; the second item is where the step comes from in the content above. No section numbers, no trade words.
const ownerSteps = {
  a: [
    ['', 'solutions[a].how[0]'],
    ['', 'solutions[a].change'],
    ['', 'solutions[a].keep; owner.keep'],
  ],
};

EX.define({
  id: '__ID__', tab: '', title: '',
  photo: 'assets/__ID__.jpg', aspect: 0,
  usesDistance: false,           // true only where the distance to the structure decides a row
  zoom: 14,                      // how far the phone pulls back from the finding's box (5 to 40)
  content, law, field, ownerSteps,
  // statewideNote: there => '',  // optional: this example's own note in "Sources and notes"
  emphasis: [],                  // the key portions to mark inside the quoted texts above
});
})(typeof window !== 'undefined' ? window : globalThis);
