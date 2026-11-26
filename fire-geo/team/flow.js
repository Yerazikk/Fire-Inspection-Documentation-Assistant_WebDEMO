// team/flow.js: what the phone says to the field inspector.
//
// Not one word of it is here. Each example writes its own in examples/<id>/example.js, under `field`:
//   reading    what the app thinks is being reported, and the other readings on offer
//   scan       what the scan lights up, naming content annotations by index
//   seen       what the app reads off the photo: answers already filled in, the app's own first
//   questions  what only the person standing there knows
//   facts      those answers as plain facts for the code rows
//   callouts   the one or two things the senior inspector should act on
// This file collects them and holds what is shared: the scan's three steps, the distance buckets, and the three
// functions that turn raw answers into the shapes the phone and the laptop render.
//
// The rules an example's `field` follows (Andrew, 22 Nov):
//   - The app answers everything it can; the person is asked only what a photo cannot tell.
//   - A question is allowed only if it is about THAT photograph and what is in it. Nothing about the rest of the
//     room or the building, nothing the person would have to go and survey.
//   - One screen, at most three questions, answered by tapping. Fewer is better. None is fine.
// Wording comes from the source analyses, made plain for someone with no training: no trade words without a
// picture. Each entry names its source; NOTES.md lists them. No threshold, year, model or measurement is stated
// that the sources do not give. examples/README.md is the whole standard.
window.TeamFlow = (function () {
  'use strict';
  const EX = window.FireExamples;

  // ---- the four content tables, collected from the examples in the order examples/index.js lists them
  const READING = EX.table('reading');
  const SCAN = EX.table('scan');
  const SEEN = EX.table('seen');
  const QUESTIONS = EX.table('questions');

  const SCAN_STEPS = ['Reading the photo', 'Finding what is wrong', 'Checking what else is needed'];
  const SCAN_NONE = 'Nothing was marked.';
  const UNKNOWN_PHOTO = 'The app could not read this photo. Write what is wrong and send it.';
  // where a cropped photograph is centred: the middle of the finding's own region, from the shared data
  const FOCUS = new Proxy({}, { get: (t, scene) => { const s = window.TeamData && window.TeamData.scene ? window.TeamData.scene(scene) : null; return (s && s.focus) || [50, 50]; } });

  // The three buckets offered where a distance is asked for instead of typed. Shared, because any example with a
  // distance question uses the same three; an example that has none never reads it.
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
  /** the same answers as plain facts for the code rows: the example's own `facts`, with the shared helpers */
  function facts(scene, answers, changes) {
    return EX.facts(scene, answers || {}, changes || {}, { DISTANCE, seen, optLabel });
  }
  /**
   * The one or two things the senior inspector should act on, each as a short line (shown at rest) and a full
   * sentence (shown on request). The example writes them; nothing here decides anything. Where the sources give
   * no service-life limit and no recall list, the note says what was read and what to check, and never decides.
   */
  function callouts(scene, f, thisYear) {
    return EX.callouts(scene, f, { thisYear, optLabel });
  }

  return { READING, SCAN, SCAN_NONE, FOCUS, SCAN_STEPS, UNKNOWN_PHOTO, SEEN, QUESTIONS, DISTANCE, questions, seen, asked, readings, facts, callouts, optLabel };
})();
