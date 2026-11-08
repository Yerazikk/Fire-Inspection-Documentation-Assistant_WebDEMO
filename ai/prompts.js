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
// V1 SCOPE: text only. No photo is sent and no image is generated. The model
// is told it cannot see the photograph — see SHARED.noVision.

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
  // Gemini thinks by default. 0 disables it, -1 is dynamic. Some thinking
  // measurably helps the code-matching step, so leave it dynamic.
  thinkingBudget: Number(process.env.GEMINI_THINKING_BUDGET ?? -1),
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
    '1. The inspector’s note for each entry is the ONLY source of observed fact. Do not add',
    '   observations that are not in it. Do not describe plants, structures, slopes, distances or',
    '   conditions the note does not mention.',
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
    'recommendations — ONLY for a violation: 2 to 5 alternative ways the owner could correct it,',
    '  each a title and two or three sentences. They are alternatives, not steps: any one of them',
    '  fixes the finding. Order them cheapest-and-simplest first. Empty array for anything that',
    '  is not a violation.',
  ].join('\n'),
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

  // The section plan. Edit freely: the app renders whatever sections come back,
  // in order, and the ids are only used to key the edit paths.
  sectionPlan: [
    { id: 'synopsis', heading: 'Synopsis', type: 'prose', brief: 'Two or three sentences: property, what was inspected, the outcome in total (how many violations, compliances, notes).' },
    { id: 'findings', heading: 'Findings', type: 'list', brief: 'One item per entry, in entry order. Start each with "Entry N — " then the determination (Violation / Compliant / Note) then what was observed, drawn only from the note.' },
    { id: 'determination', heading: 'Determination and authority', type: 'fields', brief: 'One field per violation entry: label "Entry N", value = the requirement it fails and the citation string. If there are no violations, one field saying no violation was determined.' },
    { id: 'tobemeasured', heading: 'Measurements required', type: 'fields', brief: 'For each violation, the measurements needed to quantify it and the standard each will be tested against (e.g. label "Entry 1 — vertical clearance", value "measure hedge height and lowest branch height; required 3x the lower fuel height per 14 CCR 1299.03"). Use the numeric standards block. Omit this section only if there are no violations.' },
    { id: 'codes', heading: 'Code references', type: 'codes', brief: 'Every code section relied on, once each, with a one-line relevance note tying it to an entry number.' },
    { id: 'actions', heading: 'Required actions and procedure', type: 'list', brief: 'What happens next procedurally — the correction window, how compliance is verified, what follows if it is not corrected. Straight from the PROCEDURE block.' },
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
    'what-to-do': 'the per-entry recommendation options the inspector approved in the deck',
    'attached-documents': 'the department library attachments',
  },

  sectionPlan: [
    { id: 'what-we-found', heading: 'What we found', type: 'list', brief: 'One item per violation entry, in plain words, no citations. Say what is there and why it matters for fire. If there are no violations, omit this section.' },
    { id: 'why-it-matters', heading: 'Why this matters', type: 'prose', brief: 'Two to four sentences on how fire would actually move through what was found and reach the house. Concrete, calm, no statistics. Omit if there are no violations.' },
    { id: 'what-to-do', heading: 'What you need to do', type: 'prose', brief: 'The deadline, where the work has to happen, and the fact that the options shown underneath this paragraph are alternatives so any one of them fixes it. Do not list or describe the options; they are rendered separately. Never refer to the app, this brief, or anything being inserted.' },
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
      recommendations: {
        type: 'array',
        description: 'Alternative corrections, violations only. Any one of them fixes the finding.',
        items: {
          type: 'object',
          properties: { title: { type: 'string' }, text: { type: 'string' } },
          required: ['title', 'text'],
        },
      },
    },
    required: ['summary', 'determination', 'categories', 'measurements', 'codes', 'recommendations'],
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
    'NO IMAGES',
    SHARED.noVision,
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
    `EDITION CAVEAT: ${codes.meta.editionCaveat}`,
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
    `Photograph on file: ${e.hasPhoto ? 'yes (not provided to you)' : 'no'}`,
    `Inspector’s note${e.spoken ? ' (spoken, transcribed)' : ''}: ${e.note ? '"' + e.note + '"' : '(none recorded)'}`,
  ].filter(Boolean);

  if (!e.note) {
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
      lines.push('Options the inspector approved to offer the owner for this entry:');
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

function assemble(kind, ctx) {
  return {
    system: systemFor(kind, ctx),
    user: userFor(kind, ctx),
    schema: SCHEMAS[kind],
    model: MODEL,
  };
}

module.exports = {
  MODEL, GROUNDING, SHARED, RECORD, REPORT, NOTICE, SEVERITY_BANDS,
  SCHEMAS, SECTION_SCHEMA, assemble, systemFor, userFor,
};
