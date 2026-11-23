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
  };

  // ---- what the scan lights up, in plain words: the finding, and at most one thing beside it that matters.
  // Each names a content.js annotation by its index; the region itself (a fraction of the photograph) is read from
  // the shared data, never written here, so a new photograph with new boxes needs no change.
  const SCAN = {
    sprinkler: [{ ix: 2, label: 'Stains on the ring' }, { ix: 0, label: 'Paint on the sprinkler', finding: true }],
    ladder: [{ ix: 0, label: 'Tall plants' }, { ix: 1, label: 'Bushes reach the tall plants', finding: true }],
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
  };
  const DISTANCE = { under10: { label: 'Under 10 ft', feet: 5 }, '10to30': { label: '10 to 30 ft', feet: 20 }, over30: { label: 'Over 30 ft', feet: 40 } };

  const questions = scene => QUESTIONS[scene] || [];
  const seen = scene => SEEN[scene] || [];
  const optLabel = (list, id) => ((list || []).find(o => o.id === id) || {}).label || '';

  /** what was asked and what was answered, in the phone's own words: for the laptop's "From the field" */
  function asked(scene, answers) {
    return questions(scene).map(q => {
      const a = (answers || {})[q.id] || {}, typed = a.value != null;
      const text = typed ? a.value + (q.entry && q.entry.unit ? ' ' + q.entry.unit : '') : a.pick ? optLabel((q.options || []).concat(q.cant ? [q.cant] : []), a.pick) : '';
      return { id: q.id, ask: q.ask, text: text || 'Not answered', answered: !!text, typed, pick: a.pick || null, value: typed ? a.value : null, photo: a.photo || null, estimate: q.id === 'distance' && !!DISTANCE[a.pick] };
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
    }
    return out;
  }

  return { READING, SCAN, SCAN_NONE, FOCUS, SCAN_STEPS, UNKNOWN_PHOTO, SEEN, QUESTIONS, DISTANCE, questions, seen, asked, readings, facts, callouts, optLabel };
})();
