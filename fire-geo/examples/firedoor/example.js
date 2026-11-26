// examples/firedoor/example.js — a fire door held open by a wedge.
//
// The photograph: a self-closing fire door with a wedge driven under its leading edge and a closer arm at the
// head (assets/firedoor.png).
//
// Why it is here: like the power taps the rule is statewide text, and the wedge in the photograph settles § 705.2
// by itself. What the photograph cannot settle is what the door DOES once the wedge is out, and that is what the
// phone asks. It is the one example whose correction marks two places at once — the wedge and the sign — and the
// one place where Berkeley writes into chapter 7 (§ 705.2.5, data/city4/law.js).
(function (root) {
'use strict';
const EX = root.FireExamples, CM = root.FireExampleCommon, SRC = root.FIREGEO_LAWBASE.sources, PEN = root.FIREGEO_LAWBASE.PEN;

// ============================================================= 1. what the inspector found
// window.CONTENT.firedoor: the inspection record, as structured content. Tags carry the evidentiary
// standing of a statement through to the page: confirmed / observed / verify (see examples/README.md).
const content = {
  tab: 'Fire door',
  title: 'Fire Door — Held Open by a Wedge',
  status: 'Noncompliant — inspector confirmed',
  meta: [
    ['Inspection type', 'Fire and life safety inspection'],
    ['Category', 'Fire and smoke protection features · opening protectives'],
    ['Location', 'Rated door opening at the photographed location'],
    ['Compliance deadline', 'To be established by the authority having jurisdiction'],
  ],

  photo: 'assets/firedoor.png',
  aspect: 576 / 762,

  note: 'a wedge holds the fire door open',
  noteFix: 'Take the wedge out from under the door and let it close.',
  noteWhy: 'A fire door earns its rating by being shut when there is a fire. Held off its latch it is an open hole in a rated wall, and the corridor it is meant to protect is the way out.',

  summary: 'A cream-painted door stands open against its frame, held there by a wedge driven under the leading edge of the leaf. A closer arm is fitted across the head of the door. The wall opposite carries a directional EXIT sign and a hose valve, so the opening is on a protected route. Nothing holds the door except the wedge: take it away and the closer is what decides whether the door shuts.',
  primary: 'Remove the wedge and let the door close. If the door has to stand open for the work going on, it may only be held by a device that releases it on detection — never by a wedge, a hook or anything propped against it.',

  // Boxes are [left, top, width, height] as percentages of the displayed image, measured off the photograph.
  annotations: [
    { box: [50.7, 92.3, 12, 5.4], tone: 'red', label: 'The wedge',
      note: 'A block driven under the leading edge of the leaf. It is the only thing holding this door open, and it is the finding.' },
    { box: [5.7, 7, 23.5, 4.5], tone: 'cyan', label: 'Closer arm, at the head',
      note: 'A door closer is fitted across the top of the opening. Whether it still works is what decides if the door shuts once the wedge is gone. The photograph cannot say.' },
    { box: [18.6, 12.3, 5, 10.5], tone: 'cyan', label: 'Hinge edge — where the label is',
      note: 'The rating label is fixed to the hinge edge of the leaf, and a second one to the frame. Neither is legible here, so the door’s rating is not established by this photograph.' },
    { box: [70, 20, 23, 12], tone: 'cyan', label: 'EXIT sign, opposite',
      note: 'A directional exit sign on the far wall. It places this opening on a route people are meant to use to get out, which is what the door is there to protect.' },
  ],
  annotationCaption: 'The finding is the wedge. The closer, the hinge edge and the exit sign are marked because each decides something the wedge alone does not: whether the door will shut, what it is rated for, and what it is protecting.',

  // One correction, not two. The wedge and the sign are the same piece of work: taking the wedge out answers
  // § 705.2 today, and the sign is what keeps it answered once the inspector has gone. They are shown in one
  // picture because that is how the door ends up: shut, with a sign on it. Whether the sign is owed here is still
  // the fire code official’s to decide, and the limit below says so.
  solutions: [
    {
      id: 'a',
      badge: 'required', badgeText: 'Required correction · inspector confirmed',
      title: 'Take the wedge out, and sign the door',
      lede: 'The correction the code asks for. The wedge comes out today; whether the door also carries a sign is the fire code official’s to decide.',
      plain: 'Pull the wedge out from under the door, let it swing shut, and fix a sign to the leaf saying it is a fire door and must be kept closed.',
      image: 'assets/generated/firedoor-a-shut-and-signed.png',
      imageNote: 'The sign in the visualisation carries the KEEP CLOSED legend and is drawn to show where it goes. Whether this door carries a sign at all, and which of the two legends it takes, is the fire code official’s decision.',
      where: 'The block under the leading edge of the door leaf, at floor level; and the face of the leaf at about eye height, where someone about to prop it open will read the sign.',
      change: 'Remove the wedge, let the door close and check that the latch engages. Add a permanent sign in letters not less than 1 inch high.',
      how: [
        'Take the wedge away from the opening altogether, so it cannot be put back.',
        'Let the door close on its own from the full-open position. Watch it the whole way.',
        'Listen for the latch. A fire door that rests against the frame without latching has not closed.',
        'Where it does not close or does not latch, report the closer as out of service: until it is repaired the door is to be kept in the closed position.',
        'Ask why the door was wedged. A door propped for a reason that will come back is the reason the sign belongs to this correction and not to a later visit.',
        'Ask the fire code official whether a sign is required on this door.',
        'Settle which legend belongs here: a door designed to be kept normally closed takes KEEP CLOSED, one designed to be kept normally open takes DO NOT BLOCK.',
        'Use letters not less than 1 inch high, and fix the sign permanently.',
        'Put it where it is read from the side the door is propped from.',
      ],
      keep: 'The door, the frame, the closer and the hardware, all of which are serviceable as far as the photograph shows. The sign is added to the door, not instead of anything, and nothing here needs a contractor.',
      why: 'A fire door is rated on the understanding that it is shut. Wedged open it is a hole in a rated assembly, and the smoke that the wall was built to hold back crosses it freely. The wedge comes back when nobody at the door knows what the door is for, which is what the sign is against: it is the only part of this finding that outlasts the inspection.',
      limit: 'The wedge comes out whether or not a sign is required here. § 705.2.2 leaves the sign to the fire code official, so the second half of this correction is confirmed on site, not from the photograph.',
    },
  ],

  // The file document is assembled from these blocks (team/drafts.js record()): the headings it looks for are
  // "Observed condition", "Hazard description", "Compliance deadline" and "Reinspection requirements", and the
  // first section's `verify` list is what the record carries as its limits.
  analysis: [
    {
      h: 'Inspector input — what the photograph shows',
      blocks: [
        { t: 'p', tag: 'observed', v: 'A flush door in a steel frame stands open against the frame and is held there by a wedge driven under the leading edge of the leaf. A closer arm is fitted across the head of the opening. The wall opposite carries a directional exit sign and a hose valve.' },
        { t: 'h', v: 'Observed condition' },
        { t: 'p', tag: 'observed', v: 'The door is held in the open position by a wedge. Nothing else restrains it. No rating label is legible in the photograph, and no sign is visible on the leaf or on the wall beside it.' },
        { t: 'h', v: 'The closer' },
        { t: 'p', v: 'A door closer is fitted at the head of the opening. Whether it is still in working order cannot be determined from a photograph, and whether the wedge is standing in for a failed closer is the first thing to establish on site.' },
        { t: 'h', v: 'What the photograph does not settle' },
        { t: 'ul', tag: 'verify', v: [
          'The fire-protection rating of the door and of the assembly it is set in. Both are on labels that are not legible here.',
          'Whether the door closes from the full-open position and latches automatically once the wedge is removed.',
          'Whether the closer is in service.',
          'Whether the fire code official requires a sign on this door, and which of the two legends applies.',
          'The occupancy group, which decides whether Berkeley’s added sentence about fusible-link hold-opens reaches this door.',
        ] },
      ],
    },
    {
      h: 'Analysis',
      blocks: [
        { t: 'h', v: 'Hazard description' },
        { t: 'p', tag: 'hazard', v: 'An opening protective earns its rating on the understanding that it is closed. Held off its latch, the opening is a gap in a rated assembly, and smoke crosses it at once. The exit sign on the opposite wall places this opening on a route people are meant to use to leave the building, so the assembly the door belongs to is protecting the way out.' },
        { t: 'h', v: 'Compliance deadline' },
        { t: 'p', tag: 'verify', v: 'To be established by the authority having jurisdiction. The removal of the wedge itself is immediate: it takes a moment and the condition persists for as long as the wedge is in place.' },
        { t: 'h', v: 'Reinspection requirements' },
        { t: 'ul', v: [
          'The wedge removed from the opening.',
          'The door observed closing from the full-open position and latching without assistance.',
          'The closer in working order, or reported out of service with the door kept closed until it is repaired.',
          'Where the fire code official requires one, a permanent sign on or near the door in letters not less than 1 inch high.',
          'The door’s rating label read and recorded against the assembly it protects.',
        ] },
      ],
    },
  ],

  owner: {
    title: 'Fire safety inspection — correction required',
    sub: 'Finding: a wedge holding a fire door open',
    intro: 'A fire door on your property is being held open with a wedge. A fire door only works when it is shut, so this has to come out.',
    todo: 'Take the wedge out from under the door and let the door close on its own. Check that it latches, and ask your inspector whether the door also needs a sign.',
    keep: 'Nothing has to be replaced. The door, the frame and the arm at the top of it all stay as they are. The only thing that might have to be bought is the sign, and only where your inspector requires one.',
    when: 'Now. Of all the things an inspection turns up, this is the one that takes a second and matters most while it is still propped.',
    dont: 'Do not swap the wedge for a hook, a chair or a bin. Anything that holds the door open is the same finding.',
    qa: [
      { q: 'What did we find?', a: ['A fire door propped open with a wedge under it.', 'The door in the photograph is held off its frame by a block pushed under its leading edge. The arm across the top of the door is a <b>closer</b>: it is there to shut the door on its own, and the wedge is defeating it.'] },
      { q: 'Why does it matter?', a: ['A fire door is a piece of the wall. The wall is built to hold smoke and fire on one side of it for a set time, and the door is rated to do the same — as long as it is shut.', 'Propped open it is simply a hole. Smoke goes through an open doorway in seconds, and the corridor on the other side of this one is a way out: the sign on the opposite wall says so.'] },
      { q: 'What do you need to do?', a: ['<b>Take the wedge away and let the door close.</b>', 'Then watch it shut from fully open and listen for the latch. A door resting against the frame without latching has not closed.', 'Take the wedge out of the building, or it will be back under the door by the afternoon.', 'Then ask your inspector whether this door also needs a sign saying it is a fire door and must be kept closed. Not every door does; where yours does, the sign goes on the face of it in letters at least an inch high.'] },
      { q: 'The door does not close properly. Now what?', a: ['Then the closer needs repair, and that is a second thing to fix.', 'In the meantime the rule is plain: while the closer is out of service, the door is kept closed. Not propped, not left ajar.'] },
      { q: 'What happens next?', a: ['Once the wedge is out and the door closes and latches on its own, the condition can be reviewed. Your inspector decides whether the finding has been corrected.', 'While you are there, look at the other rated doors on the same corridor. Where one is wedged, others usually are.'] },
    ],
  },

  uncertainty: [
    ['Is this a fire door?', 'The inspector has identified it as one. The photograph shows a flush door in a steel frame with a closer, which is consistent, but a rating label is not legible in it.', 'Read the label on the hinge edge of the leaf and on the frame, and record the rating.'],
    ['Is the door held open by anything else?', 'Only the wedge is visible. Whether a hook or a hold-open is fitted out of frame is not shown.', 'Check the head and the wall behind the door.'],
    ['Does it close and latch?', 'Not determinable from a photograph. § 705.2.4 asks that it close from the full-open position and latch automatically.', 'Take the wedge out and watch the door close. Listen for the latch.'],
    ['Is the closer in service?', 'A closer arm is fitted. Whether it still works, and whether the wedge is standing in for a failed one, is not shown.', 'Test the closer. While it is out of service the door is to be kept closed.'],
    ['Is a sign required here?', '§ 705.2.2 asks for one where the fire code official requires it, and no sign is visible on this door.', 'Ask the official whether a sign is required, and which legend applies.'],
    ['What does this door separate?', 'An exit sign and a hose valve are on the opposite wall, so this is a protected route. Which assembly the door is part of is not established.', 'Identify the rated assembly from the building’s plans.'],
    ['What is the occupancy?', 'Not determinable. It matters in Berkeley, whose § 705.2.5 names R-1 and R-2 stairway and floor-separation doors.', 'Confirm the occupancy group and whether this is one of those doors.'],
  ],
};

// ============================================================= 2. the law
// ---- the fire door. 2025 CFC ch. 7, read on up.codes 2026-11-23; the ICC site is blocked. § 705 is Door and
// Window Openings: how an opening protective is kept once it is in. None of the four Ross Valley ordinances
// writes anything into chapter 7, so these four sections are the state text as printed, carried by each town's
// own code. Berkeley is the exception and adds a sentence to § 705.2.5 (data/city4/law.js).
// The two legends in § 705.2.2 are set with an em dash in the code. Nothing on this page uses one, so the legend
// words are given without it; the sentence they sit in is quoted as it stands.
const Q_DOOR_BLOCK = '“Opening protectives in fire-resistance-rated assemblies shall be inspected and maintained in accordance with NFPA 80.” “Fire doors and smoke and draft control doors shall not be blocked, obstructed, or otherwise made inoperable.” “Fusible links shall be replaced promptly whenever fused or damaged. Opening protectives and smoke and draft control doors shall not be modified.”';
const Q_DOOR_LATCH = '“Swinging fire doors shall close from the full-open position and latch automatically.”';
const Q_DOOR_HOLD = '“Hold-open devices and automatic door closers, where provided, shall be maintained. During the period that such device is out of service for repairs, the door it operates shall remain in the closed position.”';
const Q_DOOR_SIGN = '“Where required by the fire code official, a sign shall be permanently displayed on or near each fire door in letters not less than 1 inch (25 mm) high”. The legend is “FIRE DOOR” and then “DO NOT BLOCK” on a door designed to be kept normally open, or “KEEP CLOSED” on one designed to be kept normally closed.';

const law = {
  state: [
    { key: 'door-blocked', label: 'Fire doors', title: 'Not blocked, obstructed or made inoperable', value: null, unit: '', rule: 'doorBlocked',
      cite: '2025 California Fire Code § 705.2', requires: Q_DOOR_BLOCK,
      applies: 'The direct basis for the finding. A wedge driven under the leaf holds the door off its latch, and a fire door that cannot swing shut has been made inoperable.',
      open: 'The door’s rating and the assembly it protects. Both are on the label, and no label is legible in the photograph.',
      source: SRC.cfc7 },
    { key: 'door-latch', label: 'Closing and latching', title: 'Closes from full open and latches', value: null, unit: '', rule: 'judgement',
      cite: '2025 California Fire Code § 705.2.4', requires: Q_DOOR_LATCH,
      applies: 'What the door must do once the wedge is gone. Taking the wedge out answers § 705.2 only if the door then travels the whole way and the latch engages on its own.',
      open: 'Whether it closes from the full-open position and latches without a hand on it. Only someone at the door can try it.',
      turns: 'whether the door closes and latches on its own', source: SRC.cfc7 },
    { key: 'door-closer', label: 'Closer', title: 'The closer kept in working order', value: null, unit: '', rule: 'judgement',
      cite: '2025 California Fire Code § 705.2.3', requires: Q_DOOR_HOLD,
      applies: 'A closer arm is fitted at the head of this door. If it has failed, the wedge may be standing in for it, and the section says the door is to be kept closed until it is repaired.',
      open: 'Whether the closer still works, and whether the wedge is there because it does not.',
      turns: 'whether the closer still works', source: SRC.cfc7 },
    { key: 'door-sign', label: 'Sign', title: 'A sign on or near the door', value: null, unit: '', rule: 'judgement',
      cite: '2025 California Fire Code § 705.2.2', requires: Q_DOOR_SIGN,
      applies: 'The half of the correction that is not owed everywhere: the sign is owed where the fire code official requires it, and which of the two legends belongs here depends on whether the door is kept normally open or normally closed.',
      open: 'Whether the official requires a sign on this door, and which legend it carries.',
      turns: 'whether the official requires a sign here', source: SRC.cfc7 },
  ],
  stateNote: 'The rule is state text and it reads the same in the four Ross Valley places: not one of their ordinances writes anything into chapter 7. Berkeley does, and adds a sentence to § 705.2.5 about doors held open on fusible links. What else changes with the place is the ordinance that carries the chapter and what a violation costs.',
  local: [CM.penalties()],

  // The one-line form of each row: the section number, and the local code that carries it.
  short: {
  'door-blocked': { sec: '§ 705.2', code: 'California Fire Code' }, 'door-latch': { sec: '§ 705.2.4', code: 'California Fire Code' },
  'door-closer': { sec: '§ 705.2.3', code: 'California Fire Code' }, 'door-sign': { sec: '§ 705.2.2', code: 'California Fire Code' },
  'smoke-doors': { sec: '§ 705.2.5', code: { berkeley: 'BMC § 19.48.050' } },
  'penalties': { sec: '§ 113.4', code: PEN },                      // the shared row, examples/common.js
  },

  // One plain sentence when the map moves to the other region. {To} {toName} = the place arrived in.
  across: 'In {toName} the same state chapter 7 applies, under its own ordinance.',

  overallLine: 'A fire door wedged open.',

  // The verdict rules this example's rows name. Each returns { verdict, why }: `row` is the merged row,
  // `c` is { d, scope, zone, place }. A rule reads only what the cited text says.
  rules: {
    // 2025 CFC § 705.2: a fire door is not to be blocked, obstructed or otherwise made inoperable. The wedge under
    // the leaf is in the photograph, so this is as settled as the painted head and the chained taps. What the door
    // does once the wedge is out is a different section, and that row is a judgement.
    doorBlocked() { return { verdict: 'red', why: 'A wedge holds this fire door open. Confirmed.' }; },
  },
};

// ============================================================= 3. the field app (the phone)
// The rules this follows (Andrew, 22 Nov): the app answers everything it can, and the person is asked
// only what a photograph cannot tell. A question must be about THIS photograph and what is in it.
const field = {
  // what the app thinks the inspector is reporting, and the other readings on offer
  reading: {
    text: 'A wedge is holding this fire door open.',
    alternatives: ['The door is held open by something else.', 'The door is shut; nothing is holding it.'],
    source: 'content.js firedoor.summary, annotations[0], owner.intro',
  },

  // what the scan lights up: the finding, and at most one thing beside it that matters. `ix` names a
  // content annotation by its index; the region itself is read from that annotation, never written here.
  scan: [{ ix: 1, label: 'Closer, at the top' }, { ix: 0, label: 'A wedge under the door', finding: true }],

  // what the app reads off the photo: answers already filled in. The first option is the app's own
  // reading; the others are what a tap on "Change" offers.
  // The first of these is the one the inspector already knows and the app is only confirming: it is a fire door.
  // Everything the code asks of this door follows from that, so it is the reading to correct if it is wrong.
  seen: [
    { id: 'door', label: 'The door', options: [{ id: 'fire', label: 'A fire door' }, { id: 'notfire', label: 'Not a fire door' }, { id: 'unsure', label: 'Not sure' }], source: 'the inspector\u2019s identification; content.js firedoor.uncertainty "Is this a fire door?"' },
    { id: 'held', label: 'Held open by', options: [{ id: 'wedge', label: 'A wedge under it' }, { id: 'other', label: 'Something else' }, { id: 'nothing', label: 'Nothing; it is shut' }], source: 'content.js firedoor.summary, annotations[0]' },
    { id: 'closer', label: 'Closer', options: [{ id: 'fitted', label: 'Fitted at the top' }, { id: 'none', label: 'None fitted' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js firedoor.annotations[1]; code row "door-closer" (CFC \u00a7 705.2.3)' },
    { id: 'sign', label: 'Sign on it', options: [{ id: 'none', label: 'No sign on the door' }, { id: 'some', label: 'There is a sign' }, { id: 'unsure', label: 'Not sure' }], source: 'the photograph shows no sign; code row "door-sign" (CFC \u00a7 705.2.2)' },
  ],

  // the questions: one screen, at most three, answered by tapping. Fewer is better. None is fine.
  // Two questions, and both are things only someone at the door can answer. The first is a reading, not a
  // judgement: the label is there or it is not, and a close photograph of it settles the rating for good. The
  // drawing beside it says where to look, the way the sprinkler question says where the year is stamped.
  questions: [
    {
      id: 'label', ask: 'What does the door\u2019s rating label say?', picture: 'doorlabel',
      options: [{ id: '20', label: '20 minutes' }, { id: '45', label: '45 minutes' }, { id: '60', label: '60 minutes' }],
      write: { label: 'What the label says', placeholder: 'Or write what it says' },
      cant: { id: 'cant', label: 'I can\u2019t find a label' },
      // No `say`: where to look is in the drawing above the question, and saying it again under the answer was a
      // second voice for the same instruction.
      photo: { label: 'Add a photo of the label', prompt: 'Take a close photo of the label.', picture: 'doorshot', callout: 'Fill the picture with the label', safety: 'Mind the door: it is not latched.' },
      source: 'content.js firedoor.annotations[2], uncertainty "Is this a fire door?"; code row "door-blocked" (CFC \u00a7 705.2, which sends maintenance to NFPA 80). The ratings offered are the common ones; where the label is, is written for this prototype from the labelling sections of the Building Code (\u00a7\u00a7 716.2.9, 716.2.9.4), not quoted here.',
    },
    {
      id: 'latch', ask: 'With the wedge out, does it close and latch by itself?',
      options: [{ id: 'yes', label: 'Yes, it shuts and latches' }, { id: 'slow', label: 'It shuts but does not latch' }, { id: 'no', label: 'It does not shut on its own' }],
      cant: { id: 'cant', label: 'I did not try it' },
      // No `say`: the question already says what it turns on, and why it matters is the senior inspector's to
      // read off the row, not the field inspector's to be told while answering.
      source: 'code row "door-latch" (CFC \u00a7 705.2.4, read on up.codes 2026-11-23): \u201cSwinging fire doors shall close from the full-open position and latch automatically.\u201d Also code row "door-closer" (\u00a7 705.2.3).',
    },
  ],

  /** the phone's answers as plain facts for the code rows. a = answers, c = corrected readings. */
  facts(a, c, h) {
    const f = {}; const { seen } = h;
    if ((a.label || {}).pick) f.label = a.label.pick;
    else if (((a.label || {}).text || '').trim()) { f.label = 'written'; f.labelText = a.label.text.trim(); }
    if ((a.latch || {}).pick) f.latch = a.latch.pick;
    for (const k of ['door', 'held', 'closer', 'sign']) if (c[k] && c[k] !== seen('firedoor').find(s => s.id === k).options[0].id) f[k] = c[k];
    return f;
  },

  /** the one or two things the senior inspector should act on: a short line and a full sentence. */
  callouts(f, ctx) {
    const out = [];
    // What the door does once the wedge is out is the whole question. Nothing here clears the finding: the
    // wedge was there and \u00a7 705.2 is answered by taking it out. These say what else has to be written up.
    if (f.latch === 'yes') out.push({ short: 'It shuts and latches on its own.', text: 'With the wedge out the door closes from the full-open position and latches, which is what \u00a7 705.2.4 asks. The finding is the wedge, and taking it out answers it.' });
    else if (f.latch === 'slow') out.push({ short: 'It shuts but does not latch.', text: 'The field inspector says the door closes but the latch does not engage. \u00a7 705.2.4 asks that it latch automatically, so this is a second finding and the door is not made good by removing the wedge alone.' });
    else if (f.latch === 'no') out.push({ short: 'It does not shut on its own: the closer has failed.', text: 'The field inspector says the door does not close on its own. Under \u00a7 705.2.3 the closer is to be maintained, and while it is out of service for repairs the door is to be kept in the closed position. That is an instruction to give today, not at the next visit.' });
    else out.push({ short: 'Closing not tried on site.', text: 'Whether the door closes and latches by itself was not tried. \u00a7 705.2.4 turns on it, so it has to be tried before the finding is closed.' });
    if (f.label === 'cant' || !f.label) out.push({ short: 'No rating label found.', text: 'No rating label was found on the door or the frame. The rating is not established, and an opening protective that cannot be identified is a question for the inspector before this is signed off.' });
    else if (f.label === 'written') out.push({ short: 'Label, in the field inspector\u2019s words: \u201c' + f.labelText + '\u201d.', text: 'The field inspector wrote the label in rather than choosing: \u201c' + f.labelText + '\u201d. Record it against the assembly this door protects.' });
    else out.push({ short: 'Label read: ' + f.label + ' minutes.', text: 'The label on the door reads ' + f.label + ' minutes. Check that against the rating the assembly it sits in requires.' });
    if (f.closer === 'none') out.push({ short: 'No closer fitted, the field inspector says.', text: 'The field inspector says no closer is fitted. Then nothing shuts this door but a hand, and how it is ever closed is the question to put to the owner.' });
    if (f.door === 'notfire' || f.door === 'unsure') out.push({ short: 'The field inspector is not calling it a fire door.', text: 'The field inspector has corrected or doubted the app\u2019s reading that this is a fire door. Settle that first: every section cited here is about an opening protective.' });
    if (f.held === 'other') out.push({ short: 'Held open by something other than a wedge.', text: 'The field inspector says something other than a wedge is holding it. It makes no difference to \u00a7 705.2 \u2014 blocked is blocked \u2014 but record what it was.' });
    return out;
  },

  /** what those answers do to this example's rows on the senior inspector's desk (team/adapter.js). */
  apply(f, ctx) {
    const { by, lead } = ctx;
    // The phone asks the one thing § 705.2.4 turns on: with the wedge out, does the door close from the full-open
    // position and latch by itself. The row is yellow until it is tried, because the photograph cannot try it.
    // Once it has been, the answer settles the row either way, and a door that will not shut or will not latch is
    // a second finding beside the wedge — not a judgement left for the senior inspector.
    if (f.latch === 'yes') {
      lead('door-latch', 'The field inspector tried it with the wedge out.');
      if (by['door-latch']) { by['door-latch'].verdict = 'green'; by['door-latch'].why = 'It closes from the full-open position and latches on its own. Tried on site.'; by['door-latch'].open = ''; }
    } else if (f.latch === 'slow') {
      lead('door-latch', 'The field inspector tried it with the wedge out.');
      if (by['door-latch']) { by['door-latch'].verdict = 'red'; by['door-latch'].why = 'The door closes but the latch does not engage. Confirmed on site.'; by['door-latch'].open = 'What the latch needs: the latch itself, the strike on the frame, or the closer’s final push.'; }
    } else if (f.latch === 'no') {
      lead('door-latch', 'The field inspector tried it with the wedge out.');
      if (by['door-latch']) { by['door-latch'].verdict = 'red'; by['door-latch'].why = 'The door does not close from the full-open position on its own. Confirmed on site.'; by['door-latch'].open = ''; }
      // § 705.2.3 asks that the closer be kept in working order. A door that will not shut by itself with a closer
      // fitted is that section, and it carries the instruction to keep the door closed until the closer is repaired.
      if (f.closer !== 'none' && by['door-closer']) {
        lead('door-closer', 'The field inspector says the door does not close on its own.');
        by['door-closer'].verdict = 'red';
        by['door-closer'].why = 'The closer does not shut the door. Until it is repaired the door is to be kept closed.';
        by['door-closer'].open = 'Whether the closer is repaired or replaced, and what keeps the door closed in the meantime.';
      }
    }
    if (f.closer === 'none') lead('door-closer', 'The field inspector says no closer is fitted.');
    if (f.door === 'notfire' || f.door === 'unsure') lead('door-blocked', 'The field inspector has not confirmed this is a fire door.');
    if (f.held === 'other') lead('door-blocked', 'The field inspector says something other than a wedge is holding it open.');
    if (f.sign === 'some') lead('door-sign', 'The field inspector says there is already a sign on the door.');
  },
};

// ============================================================= 4. the owner's numbered steps
// One list per correction, keyed by the correction id. Each step is one concrete action and says where
// to stop or what must stay; the second item is where the step comes from in the content above.
// One correction now, so one list. The owner’s page shows the first four steps, so the sign is in them:
// the wedge and the sign are what this finding ends as, and the owner should not have to scroll for half of it.
// The sixth step is the conditional one, and it is written as a condition because the prepared list cannot know
// what the door does. Where the field inspector has tried it and it failed, ownerSteps() below takes that step
// out and puts the repair itself in at the top, which moves the sign down the list.
const ownerSteps = {
  a: [
    ['Take the wedge out from under the door, and take it out of the building: left beside the door it will be back under it by the afternoon.', 'solutions[a].change, .how[0]; owner.todo'],
    ['Let the door close on its own from fully open, and listen for the latch. A door resting against the frame without latching has not closed.', 'solutions[a].how[1], [2]; owner.qa “What do you need to do?”'],
    ['Ask your inspector whether this door also needs a sign. Not every one does.', 'solutions[a].how[5]; solutions[a].lede, .limit'],
    ['Where it does, fix a permanent sign to the face of the door in letters at least an inch high, where someone about to prop it open will read it.', 'solutions[a].how[7], [8]; solutions[a].where'],
    ['Settle which words it takes: KEEP CLOSED for a door meant to stay shut, DO NOT BLOCK for one meant to stand open.', 'solutions[a].how[6]'],
    ['If the door does not close or does not latch, say so: the door is then kept closed until the closer is repaired.', 'solutions[a].how[3]; owner.qa “The door does not close properly. Now what?”'],
    ['Do not swap the wedge for a hook, a chair or a bin. Anything holding it open is the same problem.', 'owner.dont'],
    ['Apart from the sign, nothing has to be bought. The door, the frame and the arm at the top all stay as they are.', 'solutions[a].keep; owner.keep'],
  ],
};

EX.define({
  id: 'firedoor', tab: 'Fire door', title: 'Fire door held open by a wedge',
  photo: 'assets/firedoor.png', aspect: 576 / 762,
  usesDistance: false,
  zoom: 18,
  content, law, field, ownerSteps,
  emphasis: [],      // nothing marked in this example's text yet
});
})(typeof window !== 'undefined' ? window : globalThis);
