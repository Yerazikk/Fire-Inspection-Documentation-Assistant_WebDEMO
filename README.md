# Vegetation inspection · V3

A field tool for wildland-urban-interface vegetation inspections in Marin County:
plan the day's route, capture entries at each property, and draft the internal
report and the notice to the owner.

`SPEC.md` is the source of truth for every screen and gesture. `TODO.md` is the
gap between the interaction demo and a working app.

## Run it

```sh
npm install        # playwright, for the tests only
npm run serve      # http://localhost:8956
```

Tests: `npm test` (interaction), `npm run test:route` (routing),
`npm run test:photo` (photo input), `npm run test:ai` (document drafting).
The server must be running first.

## Setup — the AI key

**The report and the notice to the owner are drafted by Google Gemini. Without a
key the app still runs and falls back to built-in template text, clearly marked
as not being about the property.**

There are two kinds of Google key, they are not interchangeable, and `.env`
decides which host is called.

**A Google Cloud key (what this project uses).** An API key issued by a Cloud
project and bound to a service account — the id starts with `AQ.`. It reaches
Gemini through **Vertex AI** and is rejected on the AI Studio host with
`403 API_KEY_SERVICE_BLOCKED`, so the project and location must be named:

```
GEMINI_API_KEY=AQ.your-key-here
GOOGLE_CLOUD_PROJECT=fireinspector-514022
GOOGLE_CLOUD_LOCATION=global
```

The service account needs the **Agent Platform User** role, and the Vertex AI
API must be enabled on the project.

**An AI Studio key.** A key from https://aistudio.google.com/apikey — the id
starts with `AIza`. The project is implied by the key, so leave
`GOOGLE_CLOUD_PROJECT` out and that is the whole file:

```
GEMINI_API_KEY=AIza-your-key-here
```

Setting `GOOGLE_CLOUD_PROJECT` is the only switch: with it `ai/draft.js` calls
`aiplatform.googleapis.com`, without it `generativelanguage.googleapis.com`.
The request and response bodies are identical, so nothing else changes.

Then restart `npm run serve`. It names the model and the host it will use:

```
AI drafting on · gemini-3.6-flash via Vertex AI · fireinspector-514022 · global · 17 code sections (Marin County, California)
```

`GET /api/ai/status` reports the same thing as JSON, and `?models=1` adds the
models the key can actually reach.

`.env` is gitignored. **Never commit the key, and never put it in client-side
JavaScript** — anything in `app.js`, `data.js`, `drafts.js` or `index.html` is
served to the browser and readable by anyone who opens the page. The key is read
server-side in `serve.js` via `process.env`, the model call is made from
`ai/draft.js`, and only the finished document crosses to the client. `serve.js`
refuses to serve `.env` or anything under `ai/` whatever the URL asks for.

### Quota

Every entry now costs **one** request as it is saved, and the wrap-up costs
**two** more (report + notice). So a three-entry inspection is five requests,
every Refresh is another, and `npm run ai:check` spends two.

A Vertex AI key draws on the Cloud project's own quota and is billed per token,
so it is not the hard wall a free key is. A free AI Studio key is capped at
**20 requests per day** on `gemini-3.6-flash` — about ten inspections. Either
way, when the quota runs out the app says so and falls back to the templates; it
does not retry, because retrying spends requests against a quota that is already
gone.

### Choosing the model

`npm run ai:check -- record` drafts the per-entry records instead of the
documents, and `npm run ai:check -- record building` runs them against a
building-code fixture (painted sprinkler, chained exit, dark exit sign, expired
extinguisher) — the fastest way to judge a prompt change without clicking
through the app.

`npm run ai:check -- --models` lists what the key can actually use. Which ids
exist depends on the key: Google retires older ids for new keys, and on Vertex
availability also varies by location — on `fireinspector-514022` in `global`,
`gemini-3.6-flash`, `gemini-3.5-flash` and `gemini-3.5-flash-lite` are served
and the 2.5 ids are not. So the default is pinned rather than set to a moving
alias. Override without editing code:

```
GEMINI_MODEL=gemini-3.5-flash
```

Vertex does not publish a model list to an API key, so on that backend
`--models` probes each candidate in `PROBE_MODELS` (`ai/draft.js`) with a
one-token request rather than asking for a list.

## How the drafting works

```
app.js ──> drafts.js ──POST /api/draft──> serve.js ──> ai/draft.js
                                                          ├── ai/prompts.js   what to ask for
                                                          └── ai/codes.js     what it may cite
```

Three kinds of document come out of the same pipe:

| kind | when | what it is |
|---|---|---|
| `record` | as the inspector saves one entry | the per-entry record screen — summary, severity band, categories, measurements needed, citations, and the recommendation deck |
| `report` | at wrap-up | the internal report for the case file |
| `notice` | at wrap-up | the plain-language email to the owner |

A record is drafted from **the note the inspector actually typed or dictated**.
The pre-typed demo memo (`MEMOS` in `data.js`) only fills the input box; what is
submitted is what gets drafted. `window.AI` in `data.js` is now only the
fallback, used when there is no key or the call fails, and a record built that
way is labelled **Template · not this property** on its own card — a template
is not a description of the property in front of the inspector.

The severity number is not the model's. The model picks a **band**
(`Immediate hazard` / `High` / `Moderate` / `Low` / `None`) from a rubric in
`ai/prompts.js` and justifies it from the note; that file maps the band to the
number the ring renders. The evidence rules forbid the model inventing a score,
and this is how the screen keeps its dial without breaking that.

## Two bodies of code

`ai/codes.js` covers both halves of what an inspector looks at:

- **Vegetation** — defensible space, ladder fuels, clearances, parcel abatement.
  Transcribed from primary sources (`meta.sources`).
- **Building and fire protection** — sprinklers, fire alarm and detection,
  extinguishers, exit signs, egress and exit doors, emergency lighting,
  fire-rated construction and fire doors, storage and housekeeping, electrical
  hazards, premises identification, hydrant and FDC access, occupant load.

Each entry carries a `domain`, and selection is domain-aware: a note about a
painted sprinkler is grounded in the sprinkler sections and gets the sprinkler
clearance tables, and never sees the defensible-space corpus. A note touching
both — or neither — gets both. `codes.domainsFor(text)` is the whole decision
and it is a list of regexes you can read.

### The building corpus is not source-verified

**Every building and fire-protection entry carries `provenance: 'unverified'`.**
Section numbers follow the 2019 CFC chapter structure and the requirements are
stated as accurately as they were known, but the operative text was **not**
transcribed from a primary source — `codes.iccsafe.org` refuses automated
access and the mirrors reachable did not carry the section text. The vegetation
corpus *was* transcribed and is marked `provenance: 'transcribed'`.

This is tracked, not hidden. A citation drawn from an unverified entry comes
back flagged, the record screen marks it **verify source**, and
`doc.audit.unsourcedCitations` lists them. Before any of it goes on an
enforceable notice, replace the text with a transcription from the adopted code.
A section the model invented outright is a different and worse thing, and is
flagged separately as **not in library** — see `checkCitations` in
`ai/draft.js`, which enforces in code the rule the prompt also states.

| File | What it is | Edit it when |
|---|---|---|
| `ai/prompts.js` | **All prompt engineering.** Persona, evidence rules, style, the section plan for each document, the JSON schemas, model settings. | Tuning how the documents read. |
| `ai/codes.js` | The fire-code corpus, transcribed from primary sources, plus the numeric standards and the abatement/appeal procedure. | A code changes, or a new jurisdiction is added. |
| `ai/draft.js` | Plumbing: build request, call, validate, audit citations. | Rarely. |
| `ai/check.js` | Command-line bench for prompt changes. | Adding fixtures. |
| `drafts.js` | Client side: builds the context, calls the endpoint, falls back. | Changing what data the model sees. |

Both documents come back as a structured object — `{ sections: [...] }`, each
section `prose`, `list`, `fields` or `codes` — which the app renders with one
renderer and makes editable line by line. The AI drafts; the inspector decides.

### Iterating on a prompt

```sh
npm run ai:check -- --prompt notice    # print the assembled prompt, no API call
npm run ai:check -- notice             # draft against the sample inspection
npm run ai:check -- report clean       # the compliance-only fixture
```

### What the model is and is not allowed to do

Enforced in `ai/prompts.js` (`SHARED.noFabrication`) and, for citations, checked
again in code (`ai/draft.js`, `checkCitations`) — a prompt rule that is not also
checked is a suggestion:

- The inspector's note, and the entry's photograph where there is one, are the
  only sources of observed fact.
- **No invented measurements.** If a requirement turns on a number the note does
  not give, the document says what must be measured and against which standard.
  A photograph never supplies one: one camera, one angle, no scale. An eyeballed
  size may appear in a scan label with "≈" and nowhere else.
- No invented severity scores.
- Only the code sections in `ai/codes.js` may be cited, and a section marked
  `adopted-pending` (Zone 0) may be described as coming but never written up as
  a present violation. Anything cited that is not in the library is flagged in
  red on screen.
- All deadlines come from the procedure block in `ai/codes.js`.
- **The entry's photograph is sent with the note, and is read.** A record is
  drafted from both; the model draws labelled boxes back onto the image, which
  is what the scan overlay shows. A report and a notice are compiled from
  records already written and are never sent an image. Nothing generates one.
- **A correction beats the model's own reading.** Re-scan on the record screen
  sends the photograph back with what the inspector says it got wrong, and the
  whole record is drafted again. A figure they give is a measurement they took,
  so it stops being "not measured". Their own recommendation cards and the
  in/out decisions they already made survive the redraft.
- **The inspector's determination is never overridden.** Violation, Compliant or
  Note is theirs, made on site with the whole property in view. But where the
  photograph disagrees with the note, the record says so in plain words, above
  the AI summary, so it is seen before the entry is signed. Silently writing a
  compliant record over a photograph that shows otherwise is the failure the
  prompt and `test:ai` both exist to prevent.

## Jurisdiction and codes

`ai/codes.js` carries 17 sections transcribed from the Marin County ordinance
establishing Marin County Code ch. 16.16, from PRC § 4291, 14 CCR §§ 1299.02–04,
and the CAL FIRE Property Inspection Guide. Each entry names its source.

Two things to re-check before this is used for real:

1. **Code edition.** The ordinance transcribed adopts the 2019 California Fire
   Code. Marin re-adopts on the triennial cycle; confirm whether a later
   adopting ordinance supersedes it. The caveat rides on every document.
2. **Correction window.** `CONFIG.correctionDays` is **10 days**, from CFC
   § 322.9.1 as adopted by MCC § 16.16.040 — not the generic 45 days this
   project used to assume. `appealDays` (15) is the window to appeal the
   Hearing Officer's decision, not the window from the notice.

## Other services

Geocoding, routing and imagery use public keyless endpoints — Photon, Nominatim,
the OSRM demo server, Esri World Imagery and USGS NAIP. No keys needed, but they
are free tiers with usage policies and no uptime guarantee. See the
route-planning section of `TODO.md`.
