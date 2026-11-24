// team/flow.js: what the phone says to the field inspector. Content only; the phone renders any finding type from it,
// so a third finding type needs one more entry in READING, SCAN, SEEN and QUESTIONS and nothing else.
//
// The rules this file follows (Andrew, 22 Nov):
//   - The app answers everything it can; the person is asked only what a photo cannot tell.
//   - A question is allowed only if it is about THIS photograph and what is in it. Nothing about the rest of the
//     room or the building, nothing the person would have to go and survey.
//   - One screen, at most three questions, answered by tapping. Fewer is better. None is fine.
//   SEEN       what the app reads off the photo. It goes to the senior inspector with the finding; the field
//              inspector is not asked to review it.
//   QUESTIONS  what only the person standing there knows.
// Wording comes from the source analyses (content.js, ladderfuel.md, sprinkler.md), made plain for someone with no
// training: no trade words without a picture. Each entry names its source; NOTES.md lists them.
// No threshold, year, model or measurement is stated here that the sources do not give.
window.TeamFlow = (function () {
  'use strict';

  // ---- what the app thinks the inspector is reporting, and the other readings on offer
  const READING = {
    sprinkler: {
      text: 'This sprinkler has paint on it.',
      alternatives: ['The ring around the sprinkler has brown spots.', 'The paint is only on the ring around it, not on the sprinkler.'],
      source: 'content.js sprinkler.summary, annotations[0..2]; sprinkler.md "Surrounding ceiling and trim"',
    },
    ladder: {
      text: 'The low bushes grow right up into the tall plants. Fire could climb from one to the other.',
      alternatives: ['There are dead leaves and dry plants along the wall.', 'The plants grow right next to the road.'],
      source: 'content.js ladder.summary, owner.intro, annotations[2]; ladderfuel.md "Risk to evacuation and emergency access"',
    },

    daisy: {
      text: 'One power strip is plugged into another one, instead of into the wall.',
      alternatives: ['Both strips are plugged into the wall.', 'The cords are lying across the floor where people walk.'],
      source: 'content.js daisy.summary, annotations[0], owner.intro',
    },

    firedoor: {
      text: 'A wedge is holding this fire door open.',
      alternatives: ['The door is held open by something else.', 'The door is shut; nothing is holding it.'],
      source: 'content.js firedoor.summary, annotations[0], owner.intro',
    },
  };

  // ---- what the scan lights up, in plain words: the finding, and at most one thing beside it that matters.
  // Each names a content.js annotation by its index; the region itself (a fraction of the photograph) is read from
  // the shared data, never written here, so a new photograph with new boxes needs no change.
  const SCAN = {
    sprinkler: [{ ix: 2, label: 'Stains on the ring' }, { ix: 0, label: 'Paint on the sprinkler', finding: true }],
    ladder: [{ ix: 0, label: 'Tall plants' }, { ix: 1, label: 'Bushes reach the tall plants', finding: true }],
    daisy: [{ ix: 2, label: 'Upper strip, on the wall' }, { ix: 0, label: 'The lower strip feeds off it', finding: true }],
    firedoor: [{ ix: 1, label: 'Closer, at the top' }, { ix: 0, label: 'A wedge under the door', finding: true }],
  };
  const SCAN_STEPS = ['Reading the photo', 'Finding what is wrong', 'Checking what else is needed'];
  const SCAN_NONE = 'Nothing was marked.';
  const UNKNOWN_PHOTO = 'The app could not read this photo. Write what is wrong and send it.';
  // where a cropped photograph is centred: the middle of the finding's own region, from the shared data
  const FOCUS = new Proxy({}, { get: (t, scene) => { const s = window.TeamData && window.TeamData.scene ? window.TeamData.scene(scene) : null; return (s && s.focus) || [50, 50]; } });

  // ---- what the app reads off the photo: answers already filled in. The first option is the app's own reading;
  // the others are what a tap on "Change" offers.
  const SEEN = {
    sprinkler: [
      { id: 'paint', label: 'Paint', options: [{ id: 'arms', label: 'On the metal arms and the middle' }, { id: 'all', label: 'All over it' }, { id: 'ring', label: 'Only on the ring around it' }], source: 'content.js sprinkler.summary; annotations[0]' },
      { id: 'plate', label: 'Bottom plate', options: [{ id: 'clean', label: 'No heavy paint' }, { id: 'painted', label: 'Painted too' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js sprinkler.annotations[1]; uncertainty "Is the deflector painted?"' },
    ],
    ladder: [
      { id: 'touch', label: 'Low bushes', options: [{ id: 'touch', label: 'Reach the tall plants' }, { id: 'gap', label: 'There is a gap' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js ladder.summary, annotationCaption' },
      { id: 'plant', label: 'Tall plants', options: [{ id: 'oleander', label: 'Look like oleander' }, { id: 'other', label: 'Something else' }, { id: 'unsure', label: 'Not sure' }], source: 'ladderfuel.md "Upper vegetation" (consistent with oleander, not confirmed)' },
      { id: 'dry', label: 'Dry leaves', options: [{ id: 'some', label: 'Some, along the wall' }, { id: 'lots', label: 'A lot' }, { id: 'none', label: 'None' }], source: 'content.js ladder.annotations[2]; ladderfuel.md "Ground-level vegetation"' },
      { id: 'beside', label: 'Next to it', options: [{ id: 'road', label: 'A road' }, { id: 'driveway', label: 'A driveway' }, { id: 'neither', label: 'Neither' }], source: 'ladderfuel.md "Surrounding environment" (a paved roadway runs directly beside it)' },
    ],
    daisy: [
      { id: 'chain', label: 'Lower strip', options: [{ id: 'intostrip', label: 'Plugged into the strip above' }, { id: 'intowall', label: 'Plugged into the wall' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.summary, annotations[0]' },
      { id: 'upper', label: 'Upper strip', options: [{ id: 'wall', label: 'Plugged into a wall socket' }, { id: 'other', label: 'Plugged into something else' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.annotations[1]; uncertainty "Where does the upper tap\u2019s cord go?"' },
      { id: 'cords', label: 'Cords', options: [{ id: 'loose', label: 'Loose on the carpet' }, { id: 'under', label: 'Run under a door or the carpet' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.annotations[2]; code row "tap-install" (CFC \u00a7 603.5.3)' },
      { id: 'count', label: 'Strips', options: [{ id: 'two', label: 'Two, chained together' }, { id: 'more', label: 'More than two' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.extras[0]; code row "tap-direct" (the exception counts up to five)' },
    ],
    // The first of these is the one the inspector already knows and the app is only confirming: it is a fire door.
    // Everything the code asks of this door follows from that, so it is the reading to correct if it is wrong.
    firedoor: [
      { id: 'door', label: 'The door', options: [{ id: 'fire', label: 'A fire door' }, { id: 'notfire', label: 'Not a fire door' }, { id: 'unsure', label: 'Not sure' }], source: 'the inspector\u2019s identification; content.js firedoor.uncertainty "Is this a fire door?"' },
      { id: 'held', label: 'Held open by', options: [{ id: 'wedge', label: 'A wedge under it' }, { id: 'other', label: 'Something else' }, { id: 'nothing', label: 'Nothing; it is shut' }], source: 'content.js firedoor.summary, annotations[0]' },
      { id: 'closer', label: 'Closer', options: [{ id: 'fitted', label: 'Fitted at the top' }, { id: 'none', label: 'None fitted' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js firedoor.annotations[1]; code row "door-closer" (CFC \u00a7 705.2.3)' },
      { id: 'sign', label: 'Sign on it', options: [{ id: 'none', label: 'No sign on the door' }, { id: 'some', label: 'There is a sign' }, { id: 'unsure', label: 'Not sure' }], source: 'the photograph shows no sign; code row "door-sign" (CFC \u00a7 705.2.2)' },
    ],
  };

  // ---- the questions. Each is about this photograph, and each shows its answer control with it:
  //   picture   a small drawing of what the words refer to
  //   options   answers to tap (the common ones)
  //   entry     a number typed on the screen: the year, or the feet
  //   cant      the exception, as a quiet text button: it is never an equal choice
  //   photo     one optional extra picture, behind a small camera button
  const QUESTIONS = {
    sprinkler: [
      {
        id: 'year', ask: 'What year is stamped on the sprinkler?', picture: 'block',
        entry: { name: 'Year, four numbers', digits: 4, min: 1950, max: () => new Date().getFullYear(), always: true, wrong: 'That year looks unlikely. Check the four numbers.' },      // min..max is the range taken without a question (this app's own choice, not from the sources). Outside it the app asks once; the person may still keep the year.
        cant: { id: 'cant', label: 'I can’t see a year' },
        say: () => 'The senior inspector will check its age.',
        photo: { label: 'Add a close photo', prompt: 'Take a close photo of the sprinkler.', picture: 'closeup', callout: 'Fill the picture with the sprinkler', safety: 'Don’t touch the sprinkler.' },
        source: 'content.js sprinkler.identification.markings[2] (year of manufacture on the wrench boss), .clues[6], .evidence[0]; uncertainty "Is the sprinkler expired or recalled?". The sources give no age limit, so none is stated.',
      },
    ],
    ladder: [
      {
        id: 'distance', ask: 'How far are the bushes from the building?', picture: 'gap',
        options: [{ id: 'under10', label: 'Under 10 ft' }, { id: '10to30', label: '10 to 30 ft' }, { id: 'over30', label: 'Over 30 ft' }],
        entry: { name: 'Distance in feet', digits: 3, unit: 'ft', min: 0, max: () => 999, open: 'Or type the distance', help: 'A long step is about 3 ft.' },
        cant: { id: 'unsure', label: 'Not sure' },
        photo: { label: 'Add a photo with the building', prompt: 'Take a photo of the bushes and the building.', picture: 'both', callout: 'Bushes and building, both in the picture' },
        source: 'FireGeo code row "ladder-reach" (data/law.js); content.js ladder.uncertainty "Is the vegetation within 30 feet of a structure?"; ladderfuel.md "Surrounding environment". The step length is a rule of thumb written for this prototype, not from the sources.',
      },
    ],
    // The rule itself needs no measurement: a strip fed from a strip is the violation, and the photograph shows it.
    // What the photograph cannot show is whether either exception in CFC \u00a7 603.5.2 is in play, and both turn on
    // something only the person standing in the room knows. So the two questions are exactly those two exceptions.
    daisy: [
      {
        // Nothing to photograph here: the three taps are the common answers, anything else is written in, and
        // "Not sure" stays, because a visitor to a building may genuinely not know what a room is used for.
        id: 'room', ask: 'What is this room used for?',
        options: [{ id: 'work', label: 'An office or work room' }, { id: 'meeting', label: 'A meeting room' }, { id: 'assembly', label: 'A hall or function room' }],
        write: { label: 'What the room is used for', placeholder: 'Or write what it is' },
        cant: { id: 'unsure', label: 'Not sure' },
        say: () => 'The rule has an exception for meeting and function rooms.',
        source: 'code row "tap-direct" (CFC \u00a7 603.5.2, read on up.codes 2026-11-23): the exception covers a Group A occupancy or a Group B meeting room. The plain words for the three options are this prototype\u2019s; the occupancy groups themselves are the inspector\u2019s to decide.',
      },
      {
        // Both exceptions turn on the same thing \u2014 whether the arrangement is temporary \u2014 so that is what is asked,
        // in those words. Testing is kept apart from plain temporary use, because only testing carries the 90 days.
        id: 'temp', ask: 'Is this a temporary setup?',
        options: [{ id: 'testing', label: 'Yes, testing equipment' }, { id: 'temporary', label: 'Yes, temporary' }, { id: 'permanent', label: 'No, it stays like this' }],
        cant: { id: 'unsure', label: 'Not sure' },
        write: { label: 'What the setup is for', placeholder: 'Or write what it is for' },
        say: () => 'One exception covers temporary use, the other only 90 days of testing.',
        source: 'code row "tap-direct" (CFC \u00a7 603.5.2): up to five taps \u201cfor temporary use supplying electronic equipment\u201d, and taps \u201cused for 90 days or less for the purpose of testing the performance of such devices\u201d. content.js daisy.uncertainty "How long has this stood?"',
      },
    ],
    // Two questions, and both are things only someone at the door can answer. The first is a reading, not a
    // judgement: the label is there or it is not, and a close photograph of it settles the rating for good. The
    // drawing beside it says where to look, the way the sprinkler question says where the year is stamped.
    firedoor: [
      {
        id: 'label', ask: 'What does the door\u2019s rating label say?', picture: 'doorlabel',
        options: [{ id: '20', label: '20 minutes' }, { id: '45', label: '45 minutes' }, { id: '60', label: '60 minutes' }],
        write: { label: 'What the label says', placeholder: 'Or write what it says' },
        cant: { id: 'cant', label: 'I can\u2019t find a label' },
        say: () => 'Look along the hinge edge of the door, and on the metal it hangs in.',
        photo: { label: 'Add a photo of the label', prompt: 'Take a close photo of the label.', picture: 'doorshot', callout: 'Fill the picture with the label', safety: 'Mind the door: it is not latched.' },
        source: 'content.js firedoor.annotations[2], uncertainty "Is this a fire door?"; code row "door-blocked" (CFC \u00a7 705.2, which sends maintenance to NFPA 80). The ratings offered are the common ones; where the label is, is written for this prototype from the labelling sections of the Building Code (\u00a7\u00a7 716.2.9, 716.2.9.4), not quoted here.',
      },
      {
        id: 'latch', ask: 'With the wedge out, does it close and latch by itself?',
        options: [{ id: 'yes', label: 'Yes, it shuts and latches' }, { id: 'slow', label: 'It shuts but does not latch' }, { id: 'no', label: 'It does not shut on its own' }],
        cant: { id: 'cant', label: 'I did not try it' },
        say: () => 'This is what decides whether taking the wedge out is enough.',
        source: 'code row "door-latch" (CFC \u00a7 705.2.4, read on up.codes 2026-11-23): \u201cSwinging fire doors shall close from the full-open position and latch automatically.\u201d Also code row "door-closer" (\u00a7 705.2.3).',
      },
    ],
  };
  const DISTANCE = { under10: { label: 'Under 10 ft', feet: 5 }, '10to30': { label: '10 to 30 ft', feet: 20 }, over30: { label: 'Over 30 ft', feet: 40 } };

  const questions = scene => QUESTIONS[scene] || [];
  const seen = scene => SEEN[scene] || [];
  const optLabel = (list, id) => ((list || []).find(o => o.id === id) || {}).label || '';

  /** what was asked and what was answered, in the phone's own words: for the laptop's "From the field" */
  function asked(scene, answers) {
    return questions(scene).map(q => {
      const a = (answers || {})[q.id] || {}, typed = a.value != null;
      const written = (a.text || '').trim();
      const text = typed ? a.value + (q.entry && q.entry.unit ? ' ' + q.entry.unit : '') : a.pick ? optLabel((q.options || []).concat(q.cant ? [q.cant] : []), a.pick) : written;
      return { id: q.id, ask: q.ask, text: text || 'Not answered', answered: !!text, typed, written: written || null, pick: a.pick || null, value: typed ? a.value : null, photo: a.photo || null, estimate: q.id === 'distance' && !!DISTANCE[a.pick] };
    });
  }
  /** the app's readings, with any the field inspector corrected */
  function readings(scene, changes) {
    return seen(scene).map(s => { const c = changes && changes[s.id]; return { id: s.id, label: s.label, value: optLabel(s.options, c || s.options[0].id), app: s.options[0].label, changed: !!c && c !== s.options[0].id, pick: c || s.options[0].id }; });
  }
  /** the same answers as plain facts for the code rows */
  function facts(scene, answers, changes) {
    const f = {}, a = answers || {}, c = changes || {};
    if (scene === 'ladder') {
      const d = a.distance || {};
      if (d.value != null) f.distance = { kind: 'exact', feet: d.value };
      else if (DISTANCE[d.pick]) f.distance = { kind: 'estimate', bucket: d.pick, label: DISTANCE[d.pick].label, feet: DISTANCE[d.pick].feet };
      else if (d.pick === 'unsure') f.distance = { kind: 'unsure' };
      for (const k of ['touch', 'dry', 'beside', 'plant']) if (c[k] && c[k] !== seen('ladder').find(s => s.id === k).options[0].id) f[k] = c[k];
    } else if (scene === 'sprinkler') {
      const y = a.year || {};
      if (y.value != null) { f.year = y.value; if (y.unlikely) f.yearUnlikely = true; } else if (y.pick === 'cant') f.yearCant = true;
      for (const k of ['paint', 'plate']) if (c[k] && c[k] !== seen('sprinkler').find(s => s.id === k).options[0].id) f[k] = c[k];
    } else if (scene === 'daisy') {
      if ((a.room || {}).pick) f.room = a.room.pick;
      else if (((a.room || {}).text || '').trim()) { f.room = 'written'; f.roomText = a.room.text.trim(); }
      if ((a.temp || {}).pick) f.temp = a.temp.pick;
      else if (((a.temp || {}).text || '').trim()) { f.temp = 'written'; f.tempText = a.temp.text.trim(); }
      for (const k of ['chain', 'upper', 'cords', 'count']) if (c[k] && c[k] !== seen('daisy').find(s => s.id === k).options[0].id) f[k] = c[k];
    } else if (scene === 'firedoor') {
      if ((a.label || {}).pick) f.label = a.label.pick;
      else if (((a.label || {}).text || '').trim()) { f.label = 'written'; f.labelText = a.label.text.trim(); }
      if ((a.latch || {}).pick) f.latch = a.latch.pick;
      for (const k of ['door', 'held', 'closer', 'sign']) if (c[k] && c[k] !== seen('firedoor').find(s => s.id === k).options[0].id) f[k] = c[k];
    }
    return f;
  }
  /**
   * The one or two things the senior inspector should act on, each as a short line (shown at rest) and a full
   * sentence (shown on request). The sources give no service-life limit and no recall list, so the age note never
   * decides: it says what was read and what to check.
   */
  function callouts(scene, f, thisYear) {
    const out = [];
    if (scene === 'sprinkler') {
      if (f.year && f.yearUnlikely) out.push({ short: 'Year typed on site: ' + f.year + '. It looks unlikely; check the stamp.', text: 'The year typed on site is ' + f.year + '. That looks unlikely for a sprinkler in service. The app asked the field inspector to check the four numbers, and they kept them. Read the stamp again before relying on it.' });
      else if (f.year) out.push({ short: 'Year on the sprinkler: ' + f.year + '.', text: 'Made in ' + f.year + ', about ' + (thisYear - f.year) + ' years ago. Check its age against the testing rules and the model against the recall list. The app has neither list.' });
      else if (f.yearCant) out.push({ short: 'Year not recorded: out of reach.', text: 'The year could not be read on site. Look for it in the building’s sprinkler records.' });
      else out.push({ short: 'Year not recorded.', text: 'The year was not given. The age of this sprinkler is not known.' });
      if (f.plate === 'painted' || f.paint === 'all') out.push({ short: 'More paint than the app saw.', text: 'The field inspector says the paint goes further than the app saw.' });
    } else if (scene === 'ladder') {
      const d = f.distance;
      if (!d || d.kind === 'unsure') out.push({ short: 'Distance to the building not recorded.', text: 'The distance to the building is not known. The rule for plants near a building depends on it.' });
      else if (d.kind === 'estimate') out.push({ short: 'Bushes ' + d.label.toLowerCase() + ' from the building, estimated.', text: 'The distance is an estimate (' + d.label.toLowerCase() + '). Measure it before citing the distance rule.' });
      else out.push({ short: 'Bushes ' + d.feet + ' ft from the building.', text: 'The field inspector gives the distance as ' + d.feet + ' ft.' });
      if (f.touch === 'gap') out.push({ short: 'A gap between the two layers, the field inspector says.', text: 'The field inspector says there is a gap between the two layers. The app saw none.' });
    } else if (scene === 'daisy') {
      // Neither answer clears the finding on its own. Each says which exception has to be settled, and by whom.
      if (f.room === 'meeting' || f.room === 'assembly') {
        const where = f.room === 'meeting' ? 'a meeting room' : 'a hall or function room';
        out.push({ short: 'The field inspector calls this ' + where + '.', text: 'The field inspector calls this ' + where + '. The exception in \u00a7 603.5.2 covers up to five taps connected together for temporary use supplying electronic equipment in a Group A occupancy or a Group B meeting room. Whether this room is one, and whether this use is temporary, is yours to decide.' });
      } else if (f.room === 'work') out.push({ short: 'An ordinary work room: no exception in play.', text: 'The field inspector calls this an office or work room, so neither exception in \u00a7 603.5.2 is in play and the finding stands as read.' });
      else if (f.room === 'written') out.push({ short: 'Room, in the field inspector\u2019s words: \u201c' + f.roomText + '\u201d.', text: 'The field inspector wrote the room in rather than choosing one of the three: \u201c' + f.roomText + '\u201d. Decide from that whether \u00a7 603.5.2 excepts it, as a Group A occupancy or a Group B meeting room.' });
      else out.push({ short: 'Room use not recorded.', text: 'What the room is used for was not given, and \u00a7 603.5.2 excepts a Group A occupancy and a Group B meeting room. Settle the occupancy before citing.' });
      if (f.temp === 'written') out.push({ short: 'What it is for, in the field inspector\u2019s words: \u201c' + f.tempText + '\u201d.', text: 'The field inspector wrote what the setup is for rather than choosing: \u201c' + f.tempText + '\u201d. The 90-day exception covers testing the performance of the devices themselves, not a temporary arrangement in general.' });
      else if (f.temp === 'testing') out.push({ short: 'Temporary, for testing equipment, the field inspector says.', text: 'The field inspector says this is temporary and set up to test equipment. The 90-day exception covers testing the performance of the taps themselves, not whatever is plugged into them. Establish what is being tested, and for how long.' });
      else if (f.temp === 'temporary') out.push({ short: 'Temporary, the field inspector says.', text: 'The field inspector calls this temporary. \u00a7 603.5.2 excepts temporary use only in a Group A occupancy or a Group B meeting room, and only for electronic equipment; the other exception is 90 days of testing the devices themselves. Ask what it is for.' });
      else if (f.temp === 'permanent') out.push({ short: 'Not temporary: neither exception in play.', text: 'The field inspector says the arrangement stays as it is, so neither exception in \u00a7 603.5.2 is in play on this point and the finding stands as read.' });
      if (f.cords === 'under') out.push({ short: 'A cord runs under something, out of the frame.', text: 'The field inspector says a cord runs under a door or under the carpet. That is a second finding under \u00a7 603.5.3, separate from the chained taps.' });
      if (f.count === 'more') out.push({ short: 'More than two strips, the field inspector says.', text: 'The field inspector counts more than the two taps in the photograph. Record each one: the exception in \u00a7 603.5.2 stops at five, and only for the uses it names.' });
    } else if (scene === 'firedoor') {
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
    }
    return out;
  }

  return { READING, SCAN, SCAN_NONE, FOCUS, SCAN_STEPS, UNKNOWN_PHOTO, SEEN, QUESTIONS, DISTANCE, questions, seen, asked, readings, facts, callouts, optLabel };
})();
