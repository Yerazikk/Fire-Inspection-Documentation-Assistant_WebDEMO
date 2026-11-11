// Prompt configuration for the drafting assistant.
//
// THIS IS THE FILE TO EDIT FOR PROMPT ENGINEERING. Nothing here is plumbing:
// every export is either a knob or a block of prompt text, and `assemble()` at
// the bottom just concatenates them in a fixed order. Change the wording, the
// section plan or the model settings here and nothing else needs touching.
//
// Layout:
//   MODEL        — model name and sampling settings
//   GROUNDING    — how much of the code corpus to send
//   SHARED       — rules that apply to every document (the important ones)
//   RECORD       — the per-entry record: role, fields, style
//   REPORT       — the internal report: role, sections, style
//   NOTICE       — the notice to the owner: role, sections, style
//   SCHEMAS      — the JSON shape each document must come back in
//   assemble()   — order of assembly; rarely needs changing
//
// THREE KINDS. 'record' is drafted once per entry, as the inspector saves it,
// and is what the record screen renders. 'report' and 'notice' are compiled at
// the end of the inspection from all the entries.
//
// IMAGES: a record is sent the entry's photograph when there is one, and is
// asked to read it — see SHARED.withVision, and `scan` in SCHEMAS.record for
// the boxes it draws back on it. A report and a notice are compiled from
// records already written and are never sent an image, so they still get
// SHARED.noVision. Nothing generates an image.

const codes = require('./codes');

// ---------------------------------------------------------------------------
// MODEL
// ---------------------------------------------------------------------------

const MODEL = {
  // Override with GEMINI_MODEL in .env without editing this file.
  // `npm run ai:check -- --models` lists what the current key can actually
  // use; Google retires older ids for new keys, so check there before pinning.
  name: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  // Low temperature: this is a legal-adjacent document, not prose.
  temperature: 0.3,
  topP: 0.95,
  // Generous on purpose. Thinking tokens count against this ceiling, so a
  // seven-section report over several entries ran into it and came back as
  // truncated — and therefore malformed — JSON. Output is billed per token
  // generated, not per token allowed, so a high ceiling costs nothing.
  maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 32768),
  // Gemini thinks by default. 0 disables it, -1 is dynamic.
  //
  // This was dynamic on the belief that thinking helps the code-matching step.
  // Measured over 28 drafts — easy record, record whose photograph contradicts
  // the note, sprinkler record that must not reach for vegetation code, report
  // and notice — it does not. Citation integrity was the thing to protect and
  // it was perfect either way: zero unverified citations at every budget, same
  // section counts, the conflict flag firing 3/3 at 0 as at -1.
  //
  // What it costs is the whole latency of the app. Medians, budget 0 vs -1:
  // record 4.3 s / 18.2 s, conflict 6.5 s / 15.6 s, report 10.0 s / 26.6 s,
  // notice 6.6 s / 42.3 s — and an inspector stands at the property waiting
  // for each one. Re-run the benchmark before raising this; if a harder corpus
  // ever needs thinking, 512 bought nothing here but costs little.
  thinkingBudget: Number(process.env.GEMINI_THINKING_BUDGET ?? 0),
  // Hard ceiling on one request, ms. Drafting a seven-section document against
  // a code library is not fast; a minute is normal, so do not cut this close.
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS || 150000),
  // Shared model endpoints return 429/503 under load often enough that one
  // attempt is not a fair test of whether drafting works.
  retries: Number(process.env.GEMINI_RETRIES || 3),
  retryBaseMs: 1500,
};

// ---------------------------------------------------------------------------
// GROUNDING — how much of ai/codes.js goes into the prompt
// ---------------------------------------------------------------------------

const GROUNDING = {
  // 'relevant' keyword-matches the inspector's notes against code tags and
  // sends the matches plus an always-on backbone (cheaper, ~2–3k tokens).
  // 'all' sends the whole corpus (~5k tokens). Flip to 'all' if the model is
  // missing codes it should have found.
  codeSelection: process.env.AI_CODE_SELECTION || 'relevant',
  includeNumericTables: true,
  includeProcedure: true,
};

// ---------------------------------------------------------------------------
// SHARED — rules for both documents
// ---------------------------------------------------------------------------

const SHARED = {
  persona:
    'You are drafting documents for a fire inspector with the Marin County Fire Department, ' +
    'California. The inspector has visited a property, recorded one or more entries, and will ' +
    'read, edit and sign whatever you produce. You are a drafting assistant, not the ' +
    'decision-maker: the inspector decides.\n' +
    'Inspections cover two distinct bodies of code and an entry may fall under either:\n' +
    '  • EXTERIOR VEGETATION — defensible space, ladder fuels, clearances, parcel abatement.\n' +
    '  • BUILDING AND FIRE PROTECTION — sprinklers, fire alarm and detection, extinguishers, ' +
    'standpipes, exit signs, egress and exit doors, emergency lighting, fire-rated construction ' +
    'and fire doors, storage and housekeeping, electrical hazards, premises identification, ' +
    'hydrant and fire department connection access, occupant load.\n' +
    'Work out which one the entry is about from the inspector’s note and the CODE LIBRARY you ' +
    'were given, and stay inside it. Do not reach for defensible-space reasoning on a sprinkler ' +
    'finding, or the reverse. The library sent to you has already been narrowed to the relevant ' +
    'body of code; if nothing in it fits the note, say so rather than citing the nearest thing.',

  // The single most important block in this file. Everything downstream of a
  // vegetation notice — a correction order, a reinspection fee, a lien, a
  // hearing — rests on the findings being defensible, so invented specifics
  // are worse than missing ones.
  noFabrication: [
    'EVIDENCE RULES — these override every other instruction:',
    '1. The inspector’s note for each entry, together with the photograph attached to this',
    '   message if there is one, is the ONLY source of observed fact. Do not add observations',
    '   drawn from neither. Where no photograph is attached, the note is the whole of it: do not',
    '   describe plants, structures, slopes, distances or conditions it does not mention.',
    '2. Never state a measurement that is not in the inspector’s note. No heights, distances,',
    '   depths, diameters, slope percentages or areas of your own. If a requirement turns on a',
    '   measurement the note does not give, say what has to be measured and name the standard it',
    '   will be measured against. Write "not measured" rather than an estimate, and never write',
    '   a number with a "~" or "approximately" in front of it to cover for not knowing.',
    '3. Never invent a severity score, a risk rating or a percentage. Where a severity BAND is',
    '   asked for, pick one of the exact values offered using the rubric given and justify the',
    '   choice from the note. The app renders the band; it does not want a number from you.',
    '4. Cite only the code sections supplied in CODE LIBRARY below, and quote the citation string',
    '   exactly as given. Never cite a section that is not in the library, and never cite one',
    '   whose STATUS line says it is not currently enforceable as a present violation.',
    '5. All deadlines, fees, hearing and appeal windows come from the PROCEDURE block. Never',
    '   state a different number of days.',
    '6. Do not state where the inspector was standing, or any GPS coordinate or accuracy figure.',
    '7. Where you are uncertain, say so in the document in plain words. An honest gap is useful;',
    '   a confident wrong detail is not.',
  ].join('\n'),

  noVision: [
    'You cannot see any photograph. Photographs may be attached to entries in the case file, but',
    'none has been given to you and no vision analysis has been run. Do not describe, interpret or',
    'refer to the content of any image. Do not say "as shown in the photo". You may note that a',
    'photograph is on file for an entry when that is stated in the entry data.',
  ].join('\n'),

  // Used in place of noVision when the entry's photograph is attached. The
  // inspector is standing at the property and will read this before anyone
  // else does, so the one thing the record must never do is quietly agree
  // with a note the picture contradicts — that is worse than having no
  // photograph at all, because it looks like the photograph was checked.
  withVision: [
    'The photograph attached to this message was taken at this property by this inspector, at the',
    'time given with the entry. You can see it. Read it, and ground the record in what is actually',
    'in the frame.',
    '',
    'What a photograph can and cannot establish:',
    '• It can establish what is present, where it is in relation to the structure, and its',
    '  condition — dead or living, clear or obstructed, stored or in use.',
    '• It cannot establish a distance, a height, a depth or a slope. One camera, one angle, no',
    '  scale. An eyeballed size may appear in a `scan` label with "≈", and nowhere else. Every',
    '  entry in `measurements` stays "not measured" unless the inspector’s note gives the figure.',
    '• It cannot establish what is outside the frame, behind the camera, or on the other',
    '  elevations. Never write that something is absent because you cannot see it.',
    '',
    'WHEN THE NOTE AND THE PHOTOGRAPH DISAGREE',
    'The inspector made the determination on site with the whole property in view, so',
    '`determination.level` follows the note — that, and only that. Everything else you write',
    'describes the scene in the photograph. Do not launder the note into the observation: a',
    '`summary` row that reads "recorded by the inspector as clear" is not an observation, it is a',
    'restatement, and it hides the disagreement instead of surfacing it.',
    '',
    '`photoNote` is a required safety check, not optional commentary. Before you finish, look at',
    'the frame once more and ask: would a reviewer holding this note beside this photograph be',
    'surprised? If yes, `photoNote` is the one sentence telling them what they are looking at.',
    'A "Compliant" determination never excuses an empty `photoNote` — a compliant finding over a',
    'photograph that shows otherwise is the single most costly thing this tool can produce.',
    '',
    'Do not reason the disagreement away. You do not know that the obstruction was cleared after',
    'the shutter fired, that the pictured item is a different one from the one noted, or that',
    'something out of frame resolves it. If the photograph was attached to this entry, it is of',
    'this entry. Never invent a reconciliation to make the two agree.',
    '',
    'The same applies to the boxes: `tone` describes the photograph, not the determination. Mark a',
    'thing green only when the frame shows it meeting the requirement. Where the frame shows the',
    'deficiency, the box is red — even when the note called the entry compliant.',
    '',
    'Worked example. Note: "rear exit door checked, clear and unobstructed, compliant".',
    'Photograph: an exit door with stacked boxes and sheeting piled against it. Correct output —',
    'determination.level "Compliant" (the inspector’s call stands); a summary describing the',
    'material piled at the door, because that is what is in the frame; a red box on the pile; and',
    'photoNote "The photograph shows stored material stacked against the exit door, which would',
    'obstruct egress." Writing "clear and unobstructed" there, or leaving photoNote empty, is the',
    'failure this instruction exists to prevent.',
  ].join('\n'),

  housekeeping: [
    'Write in the active voice. No filler, no restating the instructions, no preamble, no markdown',
    'syntax inside field values (no **bold**, no bullet characters — the app renders structure from',
    'the JSON). Use "ft" and "in." for units. Dates as given to you.',
  ].join('\n'),
};

// ---------------------------------------------------------------------------
// RECORD — the per-entry record, drafted as the inspector saves one entry
// ---------------------------------------------------------------------------

// Bands the model may choose from, and what each one is rendered as. The model
// picks the band and says why; the number is this file's, not the model's, so
// nobody can accuse the assistant of inventing a risk score. Keep the wording
// of each band tight — it is the whole rubric the model gets.
const SEVERITY_BANDS = {
  'Immediate hazard': { score: 92, rubric: 'A condition that endangers occupants right now: a locked, chained or blocked exit in an occupied building; a fire protection system out of service; overcrowding beyond the posted load; active ignition source against fuel.' },
  High: { score: 74, rubric: 'A fire protection or life safety feature that would fail when called on, or fuel arranged so fire reaches a structure quickly. Nobody is in immediate danger but the margin is gone.' },
  Moderate: { score: 52, rubric: 'A real deficiency with some margin left — degraded, overdue or partially obstructed, but still likely to function or still some distance from a structure.' },
  Low: { score: 28, rubric: 'Technical non-compliance with little practical fire consequence on its own: a record not kept, a sign faded but legible, a minor accumulation.' },
  None: { score: 0, rubric: 'Use for every compliant entry and every informational note. No corrective action is owed.' },
};

const RECORD = {
  role:
    'Draft the RECORD for ONE entry the inspector has just saved. This is the first thing the ' +
    'inspector sees after recording it, on a phone, in the field, with the property in front of ' +
    'them. They will correct it in place and it becomes part of the case file, so it feeds the ' +
    'report and the notice later. Be useful and be brief: this is a field note, not a document.',

  style: [
    'Terse and concrete. The summary values are phrases and short sentences, not paragraphs —',
    'this is read on a phone screen. Name what was observed in the inspector’s own terms before',
    'reaching for code language. Where the note is thin, the record is short: do not pad it out',
    'to look thorough. Never contradict the determination the inspector recorded.',
  ].join('\n'),

  // What each field is for. The schema enforces the shape; this is the brief.
  fieldPlan: [
    'summary — 2 to 4 rows, each a label and a value. Use the labels that fit the entry: for a',
    '  violation, "Observed" / "Condition" / "Why it matters" / "Requirement"; for a compliant',
    '  entry, "Observed" / "Condition" / "Result"; for a note, "Note" / "Follow-up". The first',
    '  row is what the inspector sees in the day list, so it must stand alone as a description',
    '  of this entry.',
    'determination — `level` is the determination the inspector already recorded; repeat it',
    '  exactly as given to you, do not re-decide it. `band` is the severity band from the rubric.',
    '  `why` is one sentence justifying the band from the note. A compliant entry or a note takes',
    '  band "None".',
    'categories — 1 to 3 short chips naming the subject area, e.g. "Automatic sprinkler system",',
    '  "Means of egress", "Zone 0 (0–5 ft)", "Surface fuel", "Housekeeping". Not sentences.',
    'measurements — what would have to be measured to quantify this finding, and the standard it',
    '  would be tested against, drawn from the NUMERIC STANDARDS block. If the note already gives',
    '  a measurement, record it as given. If a measurement was not taken, say so in the value —',
    '  "not measured; required 18 in. minimum below the deflector". Never estimate. Empty array',
    '  when nothing turns on a measurement.',
    'codes — the sections this entry turns on, from the library only, 1 to 4 of them. `relevance`',
    '  is one plain line saying what this section requires of this entry. For a compliant entry,',
    '  say what was checked and that it meets. Empty array for an informational note.',
    'solutionType — how many legitimately different corrections this finding has. Decide this',
    '  before you write any of them, from the finding and the code library, not from how many',
    '  cards would look good:',
    '    "multiple_valid_options" — there are genuinely different ways to comply and each one is',
    '      sufficient on its own. Combustible mulch against siding: remove it, replace it with',
    '      noncombustible material, or move the planting bed back off the wall.',
    '    "single_required_action" — the code or the trade leaves one correct correction. A',
    '      painted-over sprinkler head is replaced by qualified personnel; a missing exit sign is',
    '      replaced with a compliant one. Write that one action, and only that one.',
    '    "professional_assessment_required" — what has to be done cannot be settled from this',
    '      finding: the extent of the deficiency is unknown, or a licensed contractor, engineer',
    '      or the authority having jurisdiction has to determine the scope first. The one',
    '      recommendation is that assessment, and what it has to establish.',
    '  Choose "multiple_valid_options" only where every option you write would independently',
    '  bring the property into compliance and is as safe as the others. For anything that is not',
    '  a violation, use "single_required_action" with an empty recommendations array.',
    'recommendations — ONLY for a violation, and as many as solutionType allows: 2 to 5 for',
    '  "multiple_valid_options", exactly one for either of the others. Each is a title and two or',
    '  three sentences. Where there are several they are alternatives, not steps — any one of',
    '  them fixes the finding — and they go cheapest-and-simplest first. Never pad the list to',
    '  fill it out: an option that is weaker, partial or not equivalent, offered beside a repair',
    '  that is actually required, is a safety problem and not a convenience. Empty array for',
    '  anything that is not a violation.',
    '  `illustrable` on each: true when a picture of this property with the work done would help',
    '  the owner see what is being asked of them; false when it would not — the work is not',
    '  visible in this photograph, or it is paperwork, a test, a permit, a service call or a part',
    '  swapped at a size nobody can see. No card is better than a card showing nothing.',
    'scan — only when a photograph is attached, otherwise empty. 2 to 6 labelled boxes over the',
    '  things in the frame the record turns on, as they are drawn back on the photograph for the',
    '  inspector to check. Name elements in cyan, and give the finding itself one red box (a',
    '  violation) or one green box (compliant), last.',
    '  BOUNDING BOX ACCURACY:',
    '  - Use the tightest rectangle enclosing the visible target.',
    '  - Include only the object or component relevant to the finding.',
    '  - Do not include unrelated surrounding objects.',
    '  - For small components, box the component, not the whole assembly: the sprinkler head,',
    '    not the ceiling; the blocked panic bar, not the whole door; the gutter run holding the',
    '    litter, not the roof.',
    '  - A box covering most of the frame tells the inspector nothing and will be discarded.',
    '  - If the visible object cannot be located reliably, omit its box.',
  ].join('\n'),
};

// ---------------------------------------------------------------------------
// VISUAL — the after-image on a recommendation card
// ---------------------------------------------------------------------------

// Each recommendation card carries a picture of the property with the work
// done: the same house from the same spot in the same light, with the proposed
// correction carried out and nothing else about it touched. That is the thing
// the owner is actually deciding about. This used to be the photograph with
// cyan guide lines drawn over it, which showed them the problem a second time
// and left them to imagine the result.
//
// So it is a visualisation, not a photograph, and it has to read as one
// everywhere it appears — the card and the copy in the notice are both
// captioned as a proposed result, because an uncaptioned generated picture of
// someone's property inside an enforcement notice is a doctored photograph.
//
// Two rules keep it honest. The property stays recognisably itself — same
// angle, same structure, same windows, doors, roofline, paving and planting
// except where the work changes them — so the owner can see their own house
// and check the claim against it. And nothing is measured off a photograph: a
// number appears only when the code or the inspector supplied it. That rule is
// SHARED.noFabrication for the documents, and this is a separate request to a
// different model that never sees that block, so it is restated here. Without
// it the model estimates from the frame, and a "10 ft" label lands across a
// window that has nothing to do with the finding.
const VISUAL = {
  model: process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image',
  timeoutMs: Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 120000),
  // An image endpoint rate-limits harder than a text one, and a run of five
  // cards walks straight into it: observed 429 "resource has been exhausted"
  // on the fourth consecutive call. These back off 4s, 8s, 16s, which clears
  // it. Nothing is waiting on these, so patience is free.
  retries: Number(process.env.GEMINI_IMAGE_RETRIES || 3),
  retryBaseMs: 4000,
  // Breathing room between one card and the next, for the same reason.
  gapMs: Number(process.env.GEMINI_IMAGE_GAP_MS || 1200),

  instruction: (rec, ctx) => [
    'You are producing the visual for a fire inspector’s recommendation card. It is shown to the',
    'inspector and sent to the property owner with the correction notice, captioned there as a',
    'proposed result rather than as a photograph.',
    '',
    'Return a realistic photographic visualisation of THIS property as it would look once the',
    'correction below has been carried out — and with nothing else about it changed.',
    '',
    'THE CORRECTION TO ILLUSTRATE',
    `Title: ${rec.title}`,
    `Detail: ${rec.text}`,
    ctx && ctx.finding ? `What the inspector recorded here: ${ctx.finding}` : null,
    '',
    'KEEP THE PROPERTY ITSELF',
    '- Same camera position, angle, lens and framing. Same time of day, same light, same shadow',
    '  direction, same weather, same exposure. It must look like the next photograph taken from',
    '  the same spot, not a different visit and not a different house.',
    '- The structure stays exactly itself: roofline, siding, colour, windows, doors, trim,',
    '  railings, steps, paving, fences, vehicles, outbuildings, and every plant and tree the work',
    '  does not touch. The owner is holding their own photograph next to this and has to',
    '  recognise their own property in it.',
    '- Change only what the correction changes. Clearing vegetation reveals what was behind it —',
    '  the wall, the soil, the bare ground — it does not substitute new landscaping, fresh paint,',
    '  a repaired fence or a staged garden. Do not tidy, modernise or improve anything that was',
    '  not the finding.',
    '- No people, pets or vehicles that were not in the photograph, and keep the ones that were.',
    '',
    'WHAT THE PICTURE HAS TO SHOW',
    '- The corrected condition, plainly legible: what had to go is gone, what had to be cleared',
    '  is clear, what had to be replaced is the compliant thing sitting in its place. Show the',
    '  separation, the clearance or the access the work creates, so the owner can see what',
    '  finished looks like.',
    '- If the work is only partly inside this frame, show the part that is in frame and leave the',
    '  rest of the scene as photographed. Never re-frame, zoom or widen the shot to fit it in.',
    '',
    'MEASUREMENTS — the same evidence rule the documents are written under',
    '- Never measure anything off the photograph. One camera, one angle, no scale: you cannot',
    '  tell a 3 ft gap from a 10 ft one from an image, and must not try.',
    '- A number may appear in the picture only if it is written in the correction or the',
    '  inspector’s finding above, where it came from a code requirement or from a measurement the',
    '  inspector took on site. If it is not written there, it does not go in.',
    '- Annotate a distance only when that distance is the thing the owner has to get right, and',
    '  put it on what the work touches. Never place a dimension on a window, a door, a roof, a',
    '  driveway or anything else the correction is not about.',
    '- If no such number exists, show no number. The corrected condition, clearly visualised, is',
    '  the whole point; a dimension is at best a caption on it, and a wrong one discredits it.',
    '- At most one such annotation: a thin dimension bar in bright cyan (#35E0FF) with a plain',
    '  label such as "3 ft", drawn against the corrected state.',
    '',
    'NOTHING ELSE ADDED',
    '- No watermark, no title bar, no legend, no caption strip, no added border, no before/after',
    '  split or inset, and no arrows, outlines or callouts beyond the one dimension bar above.',
    '',
    'If this correction would make no visible difference to this photograph — it is paperwork, a',
    'test, a permit, a part swapped at a size nobody can see, or work on something outside the',
    'frame — return the photograph unchanged rather than inventing a change to show.',
    // Only the conditional line above drops out (it is null). `filter(Boolean)`
    // would have taken the blank separators with it and run the whole prompt
    // together as one block.
  ].filter(x => x !== null).join('\n'),
};

// ---------------------------------------------------------------------------
// VOICE — the dictated memo
// ---------------------------------------------------------------------------

// The inspector holds the memo bar and talks; the microphone records it and the
// clip is transcribed here. The words land in the note box, editable, and the
// record is drafted from them — so this is the first link in the chain and the
// one with the least room for invention.
//
// Two rules make it safe to put a transcript in front of a legal-adjacent
// draft. Transcribe only: no summarising, no tidying, no completing a sentence
// the inspector abandoned, because what they said is the evidence and what the
// model would have preferred they said is not. And when there is no speech in
// the clip, answer with a token that means exactly that, rather than guessing
// at wind or traffic. A confident sentence about a property nobody said is the
// one output worse than an empty box.
//
// The vocabulary list is not decoration. "Ladder fuels", "Zone 0", "duff" and
// "manzanita" are the words this job is dictated in, and a general transcriber
// reaches for the common English neighbours instead.
const NOTHING_SAID = '[no speech]';

// The device measures the recording level 20 times a second while the bar is
// held, and the swing between the loud fifth and the quiet fifth of a clip is a
// usable tell. Measured here over six-second clips through the same browser
// path: dictated speech 35x, a 440 Hz tone 4.2x, wind 6.4x. Speech leaves gaps
// between words; a steady sound does not.
//
// This is given to the model as evidence, never as a verdict, and the app does
// not gate on it. One unbroken sentence is flatter than this, a phone's noise
// suppression moves the numbers, and refusing a real memo is a worse failure
// than sending a tone to a transcriber that will say there was nothing in it.
// What it fixes is the opposite error: asked to transcribe a pure tone, the
// model answered "Address marker from". Told the swing was 4x, it does not.
function meterLine(m) {
  if (!m || !m.frames) return null;
  const parts = [`peak ${m.peak}`, `average ${m.mean}`, `loud-to-quiet swing ${m.swing}x`];
  const read = m.swing >= 10
    ? 'That swing is the gaps between words — consistent with somebody speaking.'
    : m.swing >= 6
      ? 'That is flatter than dictation usually looks, so weigh what you hear carefully.'
      : 'That is a steady, unbroken sound with no syllable rhythm in it — a tone, a fan, traffic, a hand over the microphone. Evidence against anyone having spoken, though your ears decide.';
  return [
    `THE DEVICE'S OWN LEVEL METER, over the whole clip: ${parts.join(', ')}.`,
    `A held dictation normally swings 10x or more; a steady sound stays near 1-6x. ${read}`,
  ].join('\n');
}

const VOICE = {
  // Transcription is a cheap, fast call on the same text model that drafts the
  // record — one request, one key, one backend.
  model: process.env.GEMINI_VOICE_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  // A held memo is seconds long and the inspector is waiting for the words to
  // appear, so this is the one call in the app that has to feel immediate.
  timeoutMs: Number(process.env.GEMINI_VOICE_TIMEOUT_MS || 45000),
  retries: Number(process.env.GEMINI_VOICE_RETRIES || 2),
  retryBaseMs: 1200,
  maxOutputTokens: Number(process.env.GEMINI_VOICE_MAX_OUTPUT_TOKENS || 2048),
  // Nothing creative about a transcript.
  temperature: 0,
  thinkingBudget: 0,
  // The answer that means "there was nothing in it".
  //
  // Asked for a bare transcript, this model invents one. Four seconds of
  // low-level noise with no voice in it came back as "Zone 0 deck attached
  // facing east, wood lattice underneath open, dead leaf litter accumulated
  // inside 3 to 4 in" — fluent, plausible, about a property nobody had
  // described, from a clip containing no speech. A prompt rule saying "return
  // [no speech]" did not stop it: the model's default is to be useful, and
  // transcribing nothing does not feel useful.
  //
  // So the answer is a judgement first and a transcript second. `speech` is a
  // decision the model has to make and state, and the schema below makes the
  // field non-optional, which is a different and much harder thing to get
  // wrong than declining to produce the output it was built to produce.
  //
  // The field ORDER is load-bearing, not tidiness. The answer is generated left
  // to right, so `heard` first makes the model describe the audio ("static and
  // no voice") before it is asked to rule on it — and a model that has just
  // written that does not then claim someone spoke. Judgement first scored
  // `speech: true` on the noise clip; description first does not. Keep `text`
  // last, after both.
  nothing: NOTHING_SAID,
  schema: {
    type: 'OBJECT',
    properties: {
      heard: { type: 'STRING', description: 'What is audible in the clip, in a few words, before deciding anything — "a man speaking close to the mic", "wind and a passing car, no voice", "static", "silence".' },
      speech: { type: 'BOOLEAN', description: 'True only if a human voice saying words is audible in the clip. False for silence, noise, wind, handling, music, or a voice too distant or muffled to make out any word.' },
      text: { type: 'STRING', description: 'The verbatim transcript of what was said. Empty string when speech is false.' },
    },
    required: ['heard', 'speech', 'text'],
    propertyOrdering: ['heard', 'speech', 'text'],
  },
  // Audio formats the browsers produce and this backend accepts inline. Chrome
  // and Android give webm/opus; Safari gives mp4/aac.
  mimeTypes: [
    'audio/webm', 'audio/ogg', 'audio/opus', 'audio/mp4', 'audio/m4a', 'audio/aac',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/aiff',
  ],

  instruction: (ctx = {}) => [
    'Listen to this audio clip and report what is in it.',
    '',
    'It should be a fire inspector dictating a field note into a phone held at their mouth,',
    'outdoors, at a property they are inspecting. Expect wind, traffic, dogs and footsteps under',
    'the voice, and expect the sentence to be short and unfinished — this is a note to themselves,',
    'not a report.',
    ctx.address ? `Where they are standing: ${ctx.address}` : null,
    ctx.hasPhoto
      ? 'They have just photographed the thing they are describing, so the note often points at it ("this", "here", "that side").'
      : 'There is no photograph with this note, so the words are the whole of the entry.',
    '',
    meterLine(ctx.meter),
    '',
    'FIRST SAY WHAT YOU HEAR, THEN DECIDE WHETHER ANYONE SPOKE',
    '- Fill in `heard` before anything else, describing the recording as it is — "a woman speaking',
    '  close to the mic over traffic", "wind and static, no voice". Judge `speech` against what you',
    '  just wrote down.',
    '- The bar is held down to record, so a good share of clips catch an open microphone with',
    '  nobody talking: wind, a car, a hand over the mic, a door, silence. That is an ordinary',
    '  outcome and reporting it is the correct, useful answer.',
    '- `speech` is true only if you can actually hear a human voice saying words. If you cannot,',
    '  set it false, say what you did hear in `heard`, and leave `text` empty.',
    '- Never compose a plausible inspection note from noise. A fabricated sentence here is read as',
    '  the inspector’s own words, drafted into their record, and quoted to a property owner in an',
    '  enforcement notice. An empty answer costs them one typed sentence; a convincing invention',
    '  costs them the truth of a legal document. When in doubt, `speech` is false.',
    '',
    'THEN TRANSCRIBE, IF THERE WAS SPEECH',
    '- `text` is the words that were spoken and nothing else: no preamble, no quotation marks, no',
    '  speaker label, no timestamps, no note about the recording quality.',
    '- Transcribe, do not improve. Never summarise, re-order, complete or professionalise what was',
    '  said. If they trailed off, it trails off. A record is drafted from this and it is evidence.',
    '- Drop filler ("um", "uh") and a false start the speaker abandoned themselves. Keep the rest,',
    '  including hedges like "looks like" or "maybe" — the uncertainty is part of the observation.',
    '- Transcribe only what you can hear. Do not fill an inaudible stretch with something that fits',
    `  the sentence; write ${'[inaudible]'} in its place and let the inspector fix it.`,
    '- Numbers as digits with the unit as spoken: "thirty feet" → "30 ft", "three and a half',
    '  inches" → "3.5 in", "zone zero" → "Zone 0".',
    '- Code citations as said, in the usual written form: "C F C forty nine oh six point two" →',
    '  "CFC 4906.2"; "P R C forty two ninety one" → "PRC 4291".',
    '- Sentence case, ordinary punctuation, no trailing full stop if they stopped mid-thought.',
    '',
    'VOCABULARY — the terms this job is dictated in, spelled this way',
    'defensible space, Zone 0, Zone 1, Zone 2, ember-resistant zone, ladder fuel, ladder fuels,',
    'ground fuel, surface fuel, fine fuel, dead and dying, duff, leaf litter, pine needles, slash,',
    'canopy, crown, limb up, raise the canopy, horizontal spacing, vertical clearance, fuel break,',
    'chipping, abatement, reinspection, clearance, setback, cord wood, combustible storage,',
    'eaves, soffit, vents, ember-resistant vents, gutters, roof valley, siding, cladding, deck,',
    'under-deck, lattice, fence, noncombustible, outbuilding, propane tank, address marker,',
    'turnaround, fire apparatus access, hydrant, driveway grade, red flag,',
    'manzanita, coyote brush, chamise, juniper, oleander, eucalyptus, acacia, scotch broom,',
    'french broom, bay laurel, live oak, Monterey pine, ivy, blackberry, pampas grass, bamboo,',
    'CFC, PRC, CCR, WUI, NFPA, Marin County Code, Fire Marshal',
    // Only the conditional lines above drop out (they are null); the empty
    // strings are paragraph breaks and the prompt is easier to follow with them.
  ].filter(l => l !== null && l !== undefined).join('\n'),
};

// ---------------------------------------------------------------------------
// REPORT — the internal technical document for the case file
// ---------------------------------------------------------------------------

const REPORT = {
  role:
    'Draft the INTERNAL INSPECTION REPORT. Audience: the department case file, a reviewing ' +
    'supervisor, and — if the owner appeals — a hearing officer. It must be precise, technical, ' +
    'and defensible on its own without the inspector present to explain it.',

  style: [
    'Dense and factual. Short declarative sentences. No persuasion and no advice to the owner —',
    'this document records what was found and under what authority. Where an entry is compliant,',
    'say so as plainly as where it is not. Where a determination depends on a measurement that was',
    'not taken, state that explicitly in the Limitations section.',
  ].join('\n'),

  // Sections the app attaches its own interactive blocks beneath. Keep these
  // ids in sectionPlan or the blocks fall to the bottom of the document.
  slots: {
    actions: 'the per-entry corrections the inspector approved in the deck, each with its after-image',
  },

  // The section plan. Edit freely: the app renders whatever sections come back,
  // in order, and the ids are only used to key the edit paths.
  sectionPlan: [
    { id: 'synopsis', heading: 'Synopsis', type: 'prose', brief: 'Two or three sentences: property, what was inspected, the outcome in total (how many violations, compliances, notes).' },
    { id: 'findings', heading: 'Findings', type: 'list', brief: 'One item per entry, in entry order. Start each with "Entry N — " then the determination (Violation / Compliant / Note) then what was observed, drawn only from the note.' },
    { id: 'determination', heading: 'Determination and authority', type: 'fields', brief: 'One field per violation entry: label "Entry N", value = the requirement it fails and the citation string. If there are no violations, one field saying no violation was determined.' },
    { id: 'tobemeasured', heading: 'Measurements required', type: 'fields', brief: 'For each violation, the measurements needed to quantify it and the standard each will be tested against (e.g. label "Entry 1 — vertical clearance", value "measure hedge height and lowest branch height; required 3x the lower fuel height per 14 CCR 1299.03"). Use the numeric standards block. Omit this section only if there are no violations.' },
    { id: 'codes', heading: 'Code references', type: 'codes', brief: 'Every code section relied on, once each, with a one-line relevance note tying it to an entry number.' },
    { id: 'actions', heading: 'Required actions and procedure', type: 'list', brief: 'What happens next procedurally — the correction window, how compliance is verified, what follows if it is not corrected. Straight from the PROCEDURE block. The corrections the inspector approved are rendered as blocks underneath this section, so do not list or describe them here.' },
    { id: 'limitations', heading: 'Limitations', type: 'list', brief: 'What this report does not establish: measurements not taken, conditions not inspected, anything resting on the owner’s statement rather than observation, and the code edition caveat.' },
  ],
};

// ---------------------------------------------------------------------------
// NOTICE — the plain-language email to the property owner
// ---------------------------------------------------------------------------

const NOTICE = {
  role:
    'Draft the NOTICE TO THE PROPERTY OWNER. Audience: a homeowner with no fire-service or legal ' +
    'background, who may be worried, annoyed, or both, and who needs to know exactly what to do ' +
    'and by when. It is sent as an email from the inspector.',

  style: [
    'Plain English at about an eighth-grade reading level. Short sentences. Second person ("your',
    'property", "you need to"). Respectful and matter-of-fact — never scolding, never alarming,',
    'never apologetic. Explain the risk in terms of how fire moves, briefly, because owners comply',
    'better when they understand why. Keep code citations OUT of the body text: they belong only in',
    'the "The rules this is based on" section, where each gets one plain-sentence translation.',
    'If the visit found nothing wrong, the whole notice should be short and should say so clearly.',
  ].join('\n'),

  // Sections the app attaches its own interactive blocks beneath. Keep these
  // ids in sectionPlan or the blocks fall to the bottom of the document.
  slots: {
    'what-to-do': 'the per-entry corrections the inspector approved in the deck — several alternatives on some entries, one required action on others',
    'attached-documents': 'the department library attachments',
  },

  sectionPlan: [
    { id: 'what-we-found', heading: 'What we found', type: 'list', brief: 'One item per violation entry, in plain words, no citations. Say what is there and why it matters for fire. If there are no violations, omit this section.' },
    { id: 'why-it-matters', heading: 'Why this matters', type: 'prose', brief: 'Two to four sentences on how fire would actually move through what was found and reach the house. Concrete, calm, no statistics. Omit if there are no violations.' },
    { id: 'what-to-do', heading: 'What you need to do', type: 'prose', brief: 'The deadline, where the work has to happen, and how to read the blocks shown underneath this paragraph. Where an entry has alternatives, say any one of them fixes that finding; where it has a single required correction, say that plainly and do not imply a choice — the entry lines tell you which is which, and never offer a choice they do not show. Do not list or describe the corrections; they are rendered separately. Never refer to the app, this brief, or anything being inserted.' },
    { id: 'also-checked', heading: 'Also checked and fine', type: 'list', brief: 'One item per compliant entry, in plain words. Omit this section if there are none.' },
    { id: 'attached-documents', heading: 'Attached documents', type: 'prose', brief: 'One or two sentences saying what the attached documents are for and that they are listed underneath. Do not list the filenames; they are rendered separately. Never refer to the app, this brief, or anything being inserted.' },
    { id: 'how-to-close', heading: 'How to close this notice', type: 'list', brief: 'Exactly how to show the work is done, where to send proof, what happens if the deadline passes (reinspection, cost recovery, the penalty figure), and the hearing and appeal rights with their windows. All numbers from the PROCEDURE block.' },
    { id: 'questions', heading: 'Questions', type: 'prose', brief: 'One or two sentences: who to contact and how. Use the inspector contact details given.' },
  ],
};

// ---------------------------------------------------------------------------
// SCHEMAS — the JSON contract. Gemini is given these as a responseSchema, so
// the shapes here and the renderer in app.js must stay in step.
// ---------------------------------------------------------------------------

const SECTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'The section id from the plan.' },
    heading: { type: 'string' },
    type: { type: 'string', enum: ['prose', 'list', 'fields', 'codes'] },
    body: { type: 'string', description: 'Used when type is prose. Plain text, may contain newlines.' },
    items: { type: 'array', items: { type: 'string' }, description: 'Used when type is list.' },
    fields: {
      type: 'array',
      description: 'Used when type is fields.',
      items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] },
    },
    codes: {
      type: 'array',
      description: 'Used when type is codes.',
      items: {
        type: 'object',
        properties: {
          scope: { type: 'string', enum: ['State', 'Local', 'Standard'] },
          citation: { type: 'string', description: 'Copied exactly from the code library.' },
          title: { type: 'string' },
          relevance: { type: 'string', description: 'One line tying it to an entry number.' },
        },
        required: ['scope', 'citation', 'title', 'relevance'],
      },
    },
  },
  required: ['id', 'heading', 'type'],
};

const LABEL_VALUE = {
  type: 'object',
  properties: { label: { type: 'string' }, value: { type: 'string' } },
  required: ['label', 'value'],
};

const SCHEMAS = {
  record: {
    type: 'object',
    properties: {
      summary: { type: 'array', description: '2 to 4 label/value rows. The first row stands alone as the description of this entry.', items: LABEL_VALUE },
      determination: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['Violation', 'Compliant', 'Note'], description: 'Repeat the determination the inspector recorded. Do not re-decide it.' },
          band: { type: 'string', enum: Object.keys(SEVERITY_BANDS), description: 'Severity band from the rubric. "None" for Compliant and Note.' },
          why: { type: 'string', description: 'One sentence justifying the band from the note.' },
        },
        required: ['level', 'band', 'why'],
      },
      categories: { type: 'array', description: '1 to 3 short subject-area chips.', items: { type: 'string' } },
      measurements: { type: 'array', description: 'What must be measured and the standard it is tested against. Never an estimate.', items: LABEL_VALUE },
      codes: {
        type: 'array',
        description: 'Sections this entry turns on, from the library only.',
        items: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['State', 'Local', 'Standard'] },
            citation: { type: 'string', description: 'Copied exactly from the code library.' },
            relevance: { type: 'string', description: 'One plain line: what this section requires of this entry.' },
          },
          required: ['scope', 'citation', 'relevance'],
        },
      },
      // Before the recommendations, not after: the answer is generated left to
      // right, so deciding how many corrections this finding legitimately has
      // is what stops the model filling five cards on a finding with one
      // correct repair. See `solutionType` in RECORD.fieldPlan.
      solutionType: {
        type: 'string',
        enum: ['multiple_valid_options', 'single_required_action', 'professional_assessment_required'],
        description:
          'How many legitimately different corrections this finding has. ' +
          '"multiple_valid_options" only where each recommendation would independently bring ' +
          'the property into compliance and is as safe as the others; otherwise one ' +
          'recommendation, and "professional_assessment_required" when the scope has to be ' +
          'determined by a licensed trade or the authority having jurisdiction first.',
      },
      recommendations: {
        type: 'array',
        description:
          'Corrections, violations only. 2 to 5 alternatives when solutionType is ' +
          '"multiple_valid_options", any one of which fixes the finding; exactly one otherwise. ' +
          'Never an invented alternative to a required repair.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            text: { type: 'string' },
            illustrable: {
              type: 'boolean',
              description:
                'True when a picture of this property with the work done would help the owner ' +
                'understand the correction. False when the work is not visible in this ' +
                'photograph, or is paperwork, a test, a permit, a service call or a part ' +
                'swapped at a size nobody can see.',
            },
          },
          required: ['title', 'text', 'illustrable'],
        },
      },
      photoNote: {
        type: 'string',
        description:
          'One sentence naming what the photograph shows that the inspector’s note does not ' +
          'account for, or appears to contradict. Empty string when they agree, when there is ' +
          'no photograph, or when the photograph simply shows less than the note describes.',
      },
      scan: {
        type: 'array',
        description:
          'What you can point at in the photograph, 2 to 6 of them, drawn over it as labelled ' +
          'boxes. Empty array when no photograph was attached.',
        items: {
          type: 'object',
          properties: {
            label: {
              type: 'string',
              description:
                'Under 38 characters, it is drawn on the image. Name the thing and, where it ' +
                'carries the finding, the eyeballed size: "Juniper hedge ≈ 5 ft", "Gutter · ' +
                'leaf litter", "Residence". No sentences.',
            },
            box: {
              type: 'array',
              items: { type: 'integer' },
              description:
                'Exactly four integers, [ymin, xmin, ymax, xmax], each 0–1000 normalised to the ' +
                'image: y down from the top edge, x right from the left edge. The tightest ' +
                'rectangle enclosing the visible target and nothing around it; for a small ' +
                'component, the component rather than the assembly it sits in. Omit the box ' +
                'entirely if the object cannot be located reliably.',
            },
            tone: {
              type: 'string',
              enum: ['cyan', 'red', 'green'],
              description:
                'cyan for an element you are naming; red for the deficiency itself; green for a ' +
                'condition that meets. At most one red or green box — the finding — and put it last.',
            },
          },
          required: ['label', 'box', 'tone'],
        },
      },
    },
    required: ['summary', 'determination', 'categories', 'measurements', 'codes', 'solutionType', 'recommendations', 'photoNote', 'scan'],
    propertyOrdering: ['summary', 'determination', 'categories', 'measurements', 'codes', 'solutionType', 'recommendations', 'photoNote', 'scan'],
  },
  report: {
    type: 'object',
    properties: {
      headline: { type: 'string', description: 'One line stating the overall outcome of the inspection.' },
      sections: { type: 'array', items: SECTION_SCHEMA },
    },
    required: ['headline', 'sections'],
  },
  notice: {
    type: 'object',
    properties: {
      subject: { type: 'string', description: 'The email subject line.' },
      greeting: { type: 'string', description: 'e.g. "Dear Ms Okafor," — use the owner name given, or "Dear Property Owner," if none.' },
      sections: { type: 'array', items: SECTION_SCHEMA },
      closing: { type: 'string', description: 'One closing sentence, without the signature block.' },
    },
    required: ['subject', 'greeting', 'sections', 'closing'],
  },
};

// ---------------------------------------------------------------------------
// ASSEMBLY
// ---------------------------------------------------------------------------

const planBlock = plan => plan
  .map(s => `- id "${s.id}" · heading "${s.heading}" · type ${s.type}\n    ${s.brief}`)
  .join('\n');

const SPECS = { record: RECORD, report: REPORT, notice: NOTICE };

/** The free text a kind's code selection is driven from. */
function noteTextFor(kind, ctx) {
  if (kind === 'record') {
    const e = ctx.entry || {};
    return [e.note, (e.categories || []).join(' ')].filter(Boolean).join(' \n');
  }
  return (ctx.entries || []).map(e => e.note || '').join(' \n');
}

/** The system instruction: persona + rules + plan + code library. */
function systemFor(kind, ctx) {
  const spec = SPECS[kind];
  // Only a record is ever sent an image, and only when the entry has one.
  const hasPhoto = kind === 'record' && !!(ctx.entry && ctx.entry.photo && ctx.entry.photo.data);
  const noteText = noteTextFor(kind, ctx);
  // Narrow by domain as well as by tag, so a sprinkler finding is not grounded
  // in defensible space and does not get the fuel-spacing tables.
  const domains = codes.domainsFor(noteText);
  const picked = codes.select(noteText, { mode: GROUNDING.codeSelection, domains });

  const parts = [
    SHARED.persona,
    '',
    spec.role,
    '',
    'STYLE',
    spec.style,
    '',
    SHARED.noFabrication,
    '',
    hasPhoto ? 'THE PHOTOGRAPH' : 'NO IMAGES',
    hasPhoto ? SHARED.withVision : SHARED.noVision,
    '',
    'HOUSEKEEPING',
    SHARED.housekeeping,
    '',
  ];

  if (kind === 'record') {
    parts.push(
      'FIELD PLAN — what each field in the schema is for.',
      spec.fieldPlan,
      '',
      'SEVERITY BANDS — pick exactly one of these values for `determination.band`:',
      Object.entries(SEVERITY_BANDS).map(([k, v]) => `  "${k}" — ${v.rubric}`).join('\n'),
      '',
    );
  } else {
    parts.push(
      'SECTION PLAN — return these sections, in this order, using these exact ids.',
      'Omit a section only where its brief says you may. Add no sections of your own.',
      planBlock(spec.sectionPlan),
      '',
    );
  }

  parts.push(
    `JURISDICTION: ${codes.meta.jurisdiction}`,
    `CODE EDITION IN FORCE: ${codes.meta.edition}`,
    `ADOPTED BY: ${codes.meta.ordinance}, effective ${codes.meta.effective}`,
    `EDITION CAVEAT: ${codes.meta.editionCaveat}`,
    '',
    // The corpus has just been through a renumbering. A model that has seen the
    // older Marin code will reach for CFC § 322.x and § 4907.2; those sections
    // are not in force and are not in the library. Naming the dead numbers
    // explicitly is cheaper than letting them come back and be flagged red.
    'SECTION NUMBERS THAT NO LONGER EXIST — never cite any of these, even if you',
    'recognise them. The right-hand side is what replaced each one:',
    Object.entries(codes.meta.superseded.map)
      .map(([was, now]) => `  ${was}  ->  ${now}`)
      .join('\n'),
    '',
    'Every citation you write must carry the edition it belongs to, exactly as the',
    'EDITION line of that library entry gives it. A section number alone is',
    'ambiguous across editions and is not an acceptable citation.',
    '',
    'CODE LIBRARY — the only sections you may cite:',
    codes.pack(picked),
  );

  if (GROUNDING.includeNumericTables) {
    parts.push('', 'NUMERIC STANDARDS — the only source for any number you write:', codes.packTables(domains));
  }
  // A record is one entry seen in the field; it does not state deadlines, fees
  // or appeal windows, so it does not need the procedure block.
  if (GROUNDING.includeProcedure && kind !== 'record') {
    parts.push('', 'PROCEDURE — the only source for deadlines, fees and appeal windows:', codes.packProcedure());
  }
  return parts.join('\n');
}

/** The user turn for one entry's record. */
function recordUserFor(ctx) {
  const e = ctx.entry || {};
  const lines = [
    `Date of inspection: ${ctx.date}`,
    `Property: ${ctx.address}`,
    ctx.inspector ? `Inspector: ${ctx.inspector.name}, badge ${ctx.inspector.badge}` : '',
    '',
    'THE ENTRY TO DRAFT THE RECORD FOR:',
    `Entry number: ${e.n}`,
    `Determination recorded by the inspector: ${e.level}`,
    `Time: ${e.time}`,
    `Photograph: ${e.photo ? 'attached to this message' : e.hasPhoto ? 'on file (not provided to you)' : 'none taken'}`,
    `Inspector’s note${e.spoken ? ' (spoken, transcribed)' : ''}: ${e.note ? '"' + e.note + '"' : '(none recorded)'}`,
  ].filter(Boolean);

  // The rules for reading a photograph are in the system instruction, under
  // THE PHOTOGRAPH; what belongs here is only what is true of this entry.
  if (e.photo) {
    lines.push(
      '',
      e.note
        ? 'The photograph attached above is of this entry, and the note is about the same scene. ' +
          'Where the note names something you can see, use the inspector’s words for it. Where ' +
          'the photograph shows something the note does not mention, you may record it.'
        : 'No note was recorded, so the photograph attached above is the only evidence you have. ' +
          'Describe only what is plainly visible in it, and do not infer a measurement from it.',
    );
  }

  // The prescan already boxed the elements while the inspector was typing; the
  // overlay has drawn them. Keep them so the record agrees with what was shown.
  if (e.photo && Array.isArray(e.prescan) && e.prescan.length) {
    lines.push(
      "",
      "ELEMENTS ALREADY LOCATED IN THIS PHOTOGRAPH by a first pass, as [ymin, xmin, ymax, xmax] 0–1000:",
      ...e.prescan.map((b, i) => `  ${i + 1}. "${b.label}" at [${b.box.join(", ")}]`),
      "",
      "Return these same boxes in `scan`, with the same labels and coordinates, in this order —",
      "correct one only if it is plainly wrong — and then add the finding as the last box: one red",
      "box on the deficiency, or one green box on what meets the requirement.",
    );
  }

  // Re-scan. The inspector read the draft and told it what it got wrong.
  if (e.corrections && e.corrections.length) {
    lines.push(
      '',
      'CORRECTIONS THE INSPECTOR MADE TO YOUR PREVIOUS DRAFT OF THIS RECORD:',
      ...e.corrections.map((c, i) => `  ${i + 1}. ${c}`),
      '',
      'These came from the inspector after reading the draft, standing at the property with it in',
      'front of them. They carry the authority of the note, and more: where a correction',
      'contradicts what you read in the photograph, the correction is right and your reading was',
      'wrong. A figure in a correction is a measurement the inspector took — record it as given',
      'and stop calling it not measured.',
      '',
      'Redraft the whole record with every correction applied, including the boxes. Do not append',
      'a line saying you were corrected, do not argue, and do not carry forward the reading a',
      'correction replaced.',
    );
  }

  if (!e.note && !e.photo) {
    lines.push(
      '',
      'The inspector recorded no note for this entry. You have nothing observed to work from, so',
      'do not invent an observation. Say in the summary that no note was recorded and that the',
      'record needs one, keep `codes` and `measurements` empty, and use band "None".',
    );
  }

  if (ctx.history && ctx.history.length) {
    lines.push('', 'PREVIOUS INSPECTIONS AT THIS PROPERTY (most recent first):');
    ctx.history.forEach(h => lines.push(`  ${h.date} — ${h.outcome}${h.notes ? ' · ' + h.notes : ''}`));
  }

  lines.push('', 'Draft the record for this entry now, as JSON matching the schema.');
  return lines.join('\n');
}

/** The user turn: the actual inspection data. */
function userFor(kind, ctx) {
  if (kind === 'record') return recordUserFor(ctx);
  const lines = [
    `Date of inspection: ${ctx.date}`,
    `Property: ${ctx.address}`,
    `Owner of record: ${ctx.owner && ctx.owner.name ? ctx.owner.name : 'not on file'}` +
      (ctx.owner && ctx.owner.email ? ` <${ctx.owner.email}>` : ''),
    `Inspector: ${ctx.inspector.name}, badge ${ctx.inspector.badge}, ${ctx.inspector.unit}`,
    `Inspector contact: ${ctx.inspector.email} · ${ctx.inspector.phone}`,
    `Correction deadline to state in the documents: ${ctx.correctBy} (${ctx.correctionDays} days from today)`,
    ctx.portal ? `Self-report portal: ${ctx.portal}` : '',
    '',
    `ENTRIES RECORDED TODAY (${ctx.entries.length}):`,
  ].filter(Boolean);

  ctx.entries.forEach(e => {
    lines.push(
      `--- Entry ${e.n} ---`,
      `Determination recorded by the inspector: ${e.kind}`,
      `Time: ${e.time}`,
      `Photograph on file: ${e.hasPhoto ? 'yes (not provided to you)' : 'no'}`,
      `Inspector's note${e.spoken ? ' (spoken, transcribed)' : ''}: ${e.note ? '"' + e.note + '"' : '(none recorded)'}`,
    );
    if (e.approvedOptions && e.approvedOptions.length) {
      // Whether these are alternatives at all. A deck of options is right for
      // mulch against siding and wrong for a painted-over sprinkler head, and
      // a letter that offers the owner a choice they do not have is worse than
      // one that is blunt about it.
      // Two different reasons there is only one: the finding has one correct
      // repair, or the inspector approved one of several. Either way the owner
      // is not being offered a choice, and the letter says so.
      const ruledSingle = e.solutionType && e.solutionType !== 'multiple_valid_options';
      lines.push(
        e.solutionType === 'professional_assessment_required'
          ? 'The one correction the inspector approved for this entry. The scope has to be determined by a qualified professional first; there is no alternative to it:'
          : ruledSingle
            ? 'The one correction the inspector approved for this entry. This finding has a single correct fix and there is no alternative to offer, so do not imply the owner has a choice:'
            : e.approvedOptions.length === 1
              ? 'The one correction the inspector chose to offer for this entry. Present it as what has to be done, not as one option among others:'
              : 'Options the inspector approved to offer the owner for this entry. They are alternatives — any one of them fixes it:');
      e.approvedOptions.forEach((o, i) => lines.push(`  ${i + 1}. ${o.title} — ${o.text}`));
    }
    lines.push('');
  });

  if (ctx.history && ctx.history.length) {
    lines.push('PREVIOUS INSPECTIONS AT THIS PROPERTY (most recent first):');
    ctx.history.forEach(h => lines.push(`  ${h.date} — ${h.outcome}${h.notes ? ' · ' + h.notes : ''}`));
    lines.push('');
  }

  if (ctx.attachments && ctx.attachments.length) {
    lines.push('DOCUMENTS THE INSPECTOR ATTACHED:');
    ctx.attachments.forEach(a => lines.push(`  ${a.title} (${a.src})`));
    lines.push('');
  }

  lines.push(kind === 'report'
    ? 'Draft the internal inspection report now, as JSON matching the schema.'
    : 'Draft the notice to the owner now, as JSON matching the schema.');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// DETECT — the prescan: what is in the frame, boxed and named, nothing else.
// Runs the moment a photograph lands, before the inspector has typed a note,
// so the scan sweep has its boxes ready by the time Submit is tapped. The
// record call later receives these boxes and keeps them, adding the finding.
// ---------------------------------------------------------------------------
const DETECT = {
  system: [
    SHARED.persona,
    "",
    "You are reading ONE photograph taken by a fire inspector at a property. Your only job is to",
    "locate the things in the frame a vegetation / fire-safety record could turn on and box them:",
    "vegetation (trees, hedges, ground cover, dead material), the structure and its parts (roof,",
    "eaves, gutters, deck, fence, wall), utilities (poles, conductors, meters), stored material,",
    "access and exits. Name each in under 38 characters, with an eyeballed size marked ≈ where it",
    "matters (\"Juniper hedge ≈ 5 ft\"). Box the specific object, not the whole frame.",
    "Do not judge compliance here: every box is cyan. No sentences, no markdown.",
  ].join("\n"),
  user: "Locate 2 to 6 things in the photograph attached above, as JSON matching the schema. Boxes are [ymin, xmin, ymax, xmax], each 0–1000 normalised to the image.",
  schema: {
    type: "object",
    properties: {
      scan: {
        type: "array",
        items: { type: "object", properties: {
          label: { type: "string", description: "Under 38 characters, drawn on the image." },
          box: { type: "array", items: { type: "integer" }, description: "Exactly four integers, [ymin, xmin, ymax, xmax], 0–1000." },
          tone: { type: "string", enum: ["cyan"] },
        }, required: ["label", "box", "tone"] },
      },
    },
    required: ["scan"],
  },
  model: { ...MODEL, maxOutputTokens: 2048, timeoutMs: Number(process.env.GEMINI_DETECT_TIMEOUT_MS || 45000), retries: 1 },
};
function assembleDetect(ctx) {
  const photo = ctx && ctx.photo;
  return { system: DETECT.system, user: DETECT.user, image: photo && photo.data ? { mimeType: photo.mimeType || "image/jpeg", data: photo.data } : null, schema: DETECT.schema, model: DETECT.model };
}

function assemble(kind, ctx) {
  // Only a record carries a photograph: the report and the notice are compiled
  // from records already written, and re-reading every photo to rewrite them
  // would cost a vision call per entry for nothing new.
  const photo = kind === 'record' && ctx.entry && ctx.entry.photo;
  return {
    system: systemFor(kind, ctx),
    user: userFor(kind, ctx),
    image: photo && photo.data ? { mimeType: photo.mimeType || 'image/jpeg', data: photo.data } : null,
    schema: SCHEMAS[kind],
    model: MODEL,
  };
}

module.exports = {
  MODEL, VISUAL, VOICE, GROUNDING, SHARED, RECORD, REPORT, NOTICE, SEVERITY_BANDS,
  SCHEMAS, SECTION_SCHEMA, assemble, assembleDetect, DETECT, systemFor, userFor,
};
