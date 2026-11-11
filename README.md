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

Tests: `npm test` runs the two free ones — the routing solver against an
independent brute force (`test_route.js`), and the Google Maps wiring against a
stubbed Google (`test_maps.js`). Neither costs anything or needs a server.

**The four flow tests are disabled, because they are billed.** Each one walks a
real inspection against the live model, and a photographed violation entry
spends one `gemini-3-pro-image` call per recommendation — two to five of them,
which is the bulk of any Gemini bill this project runs up. A sweep of all four
is a few dollars. `test_guard.js` is the gate; run one deliberately with:

```sh
node test.js --live          # the interaction walk-through (also npm run test:flow)
node test_ai.js --live       # document drafting
node test_photo.js --live    # photo input
node test_visual.js --live   # the recommendation visuals
```

The server must be running first. `FLOW_TESTS=1` works in place of `--live`.
Pass the port as a bare argument — `node test.js --live 9000`.

Worth knowing which of those actually *means* to spend: only `test_visual.js`
is about the pictures. The other three draw a deck of them as a side effect of
saving an entry, because `createRecord` queues the visuals and their memo text
trips the `violation` branch in `app.js`. `test.js` and `test_ai.js` also drive
the microphone for real — Chromium is given `test_memo.wav`, a spoken
inspection note, as its capture device — so each adds a transcription call.

To judge a prompt change, use `npm run ai:check` instead. It is text-only,
sends no image, and costs about a hundredth of a flow test.

### Where the files are

The split is the one the deployment needs, and it is also the honest one:

| | |
|---|---|
| `public/` | the app the browser gets — `index.html` and every client script, `assets/` |
| `api/` | the endpoints, one file each |
| `ai/` | the drafting itself: prompts, the code corpus, the Gemini calls |
| root | `serve.js`, the tests, the documents |

Nothing outside `public/` is reachable over HTTP. That is not a rule the server
enforces with a blocklist any more — `ai/prompts.js` and `.env` simply are not
inside the directory being served, locally or deployed.

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
AI drafting on · gemini-3.6-flash via Vertex AI · fireinspector-514022 · global · 56 code sections (Marin County, California (unincorporated))
```

`GET /api/ai/status` reports the same thing as JSON, and `?models=1` adds the
models the key can actually reach.

`.env` is gitignored. **Never commit the key, and never put it in client-side
JavaScript** — the one deliberate exception is `GOOGLE_MAPS_BROWSER_KEY`, which
the Maps JavaScript API cannot work without; see below — anything in `app.js`, `data.js`, `drafts.js` or `index.html` is
served to the browser and readable by anyone who opens the page. The key is read
server-side in `serve.js` via `process.env`, the model call is made from
`ai/draft.js`, and only the finished document crosses to the client. `serve.js`
refuses to serve `.env` or anything under `ai/` whatever the URL asks for.

### Quota

Every entry costs **one** request as it is saved, each Re-scan costs another,
each dictated memo **one** to transcribe — a few seconds of audio, so the
cheapest call in the app — and the wrap-up costs **two** more (report + notice). On top of that, Finish
queues **one image request per recommendation on every violation entry** — the
after-image on each card, the property with that correction carried out — which is typically two to five per violation and is by
far the largest share. A three-entry inspection with two violations is five
text requests and perhaps six image ones. Every Refresh is another text
request, and `npm run ai:check` spends two.

Image requests go to `gemini-3-pro-image` and are rate-limited more tightly
than text: a run of consecutive calls draws `429 resource has been exhausted`,
which is why they are issued one at a time with a gap and backed off 4s/8s/16s.
A card that still cannot be drawn says so and keeps its recommendation. A
correction that would not show in a picture at all — a permit, a test, a part
swapped at a size nobody can see — is never queued, and goes out as a text
card.

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

## Setup — the Google Maps key

**Two things in the app come from Google Maps Platform, and both degrade on
their own if the key is missing or refused.**

| where | what | without a key |
|---|---|---|
| tap a pin → the preview, and every list thumbnail | a **Street View** still of the property, taken through `api/streetview.js` | the box says *No Street View for this address* |
| the lot view on the inspection screen | an **interactive satellite map** (Maps JavaScript API) — zoom, pan, pinch | the keyless Esri frame `sat.js` already fetches, and the stylised parcel behind that |

The still is not whatever the nearest camera happened to be pointing at. The
proxy asks the free metadata endpoint where the panorama actually stands,
computes the bearing from there to the address, and requests that panorama at
that heading — so the frame faces the house rather than the road. A property
with no coverage answers `404 no_imagery`, which is an ordinary fact about a
rural parcel, not an error.

Two variables, because they are two different exposures:

```
GOOGLE_MAPS_API_KEY=…        # server side. Needs the Street View Static API.
GOOGLE_MAPS_BROWSER_KEY=…    # served to the page. Needs the Maps JavaScript API.
```

`GOOGLE_MAPS_API_KEY` never leaves the server and falls back to
`GEMINI_API_KEY` when unset — on a single-project setup it is the same key.
`GOOGLE_MAPS_BROWSER_KEY` is the one deliberate exception to the rule below:
the Maps JavaScript API runs in the browser and there is no proxying that, so
the page is handed a key by `GET /api/maps/config`. It **does not** fall back
to `GEMINI_API_KEY` — that key is never given to a browser. Make it a separate
key and restrict it by HTTP referrer in the Cloud console; anything the page
can see is public.

Both APIs have to be **enabled on the Cloud project and listed in the key's own
API restrictions**, or Maps answers `REQUEST_DENIED · The provided API key is
invalid` — which is exactly what the Vertex-restricted `AQ.` key above does
today. `npm run test:maps -- --live` makes one real round trip and prints
which of the two it was.

Street View is billed per request, so a frame is cached three deep: in the
process (`ai/maps.js`), by the browser (a day), and in Cache Storage by the
service worker. A property looked at twice costs once.

## Deploy it — Vercel

`public/` is the static site, `api/` holds the endpoints as functions, and
`ai/` is bundled into those functions without ever being served. `vercel.json`
is the whole configuration.

```sh
npx vercel login
npx vercel        # a preview URL
npx vercel --prod # the one you hand to people
```

Then give the project the same variables `.env` holds locally — the Gemini key
is read inside the function and never sent to the browser:

```sh
npx vercel env add GEMINI_API_KEY production
npx vercel env add GOOGLE_CLOUD_PROJECT production
npx vercel env add GOOGLE_CLOUD_LOCATION production
npx vercel env add GOOGLE_MAPS_API_KEY production      # Street View, server side
npx vercel env add GOOGLE_MAPS_BROWSER_KEY production  # the interactive lot map
```

`GOOGLE_MAPS_BROWSER_KEY` is served to the page, so restrict it by HTTP
referrer to the deployment's own domains before the link travels — on a
deployed site that restriction is the only thing protecting it.

Add them to `preview` too if you want preview deployments to draft, and
re-deploy after adding any of them — a function picks up the environment at
deploy time, not per request. Without them the site still works and documents
fall back to the built-in templates, which is a fine way to show the
interaction and a poor way to show the drafting.

**Anyone with the link spends your quota.** The site is public, the key sits
behind it, and a single generated after-image is the expensive call. For a demo
to a handful of people that is usually the point; for a link that might travel,
turn on Deployment Protection in the project's settings, or rotate the key
afterwards.

Neither platform limit is anywhere near a normal inspection: a request body
may be 100 MB and a record posts 100–250 KB of photograph, and a function may
run for the plan's maximum duration, which `vercel.json` asks for by name
(`"maxDuration": "max"`) rather than a fixed number — 300 s by default, against
the fifteen to twenty seconds a generated after-image takes.

## How the drafting works

```
app.js ──> drafts.js ──POST /api/draft─────> serve.js ──> ai/draft.js
       └─> voice.js  ──POST /api/transcribe─┘        └──> ai/voice.js
                                                          ├── ai/prompts.js   what to ask for
                                                          └── ai/codes.js     what it may cite
```

Three kinds of document come out of the same pipe:

| kind | when | what it is |
|---|---|---|
| `record` | as the inspector saves one entry | the per-entry record screen — summary, severity band, categories, measurements needed, citations, and the recommendation deck |
| `report` | at wrap-up | the internal report for the case file |
| `notice` | at wrap-up | the plain-language email to the owner |

A record is drafted from **the note the inspector actually typed or dictated**,
and dictated now means dictated: holding the memo bar opens the microphone,
records, and sends the clip to be transcribed — see [Hold to speak](#hold-to-speak-is-a-real-microphone)
below. The canned `MEMOS` fixture that used to type itself out on a timer is
gone. `window.AI` in `data.js` is now only the fallback, used when there is no
key or the call fails, and a record built that way is labelled **Template · not
this property** on its own card — a template is not a description of the
property in front of the inspector.

The severity number is not the model's. The model picks a **band**
(`Immediate hazard` / `High` / `Moderate` / `Low` / `None`) from a rubric in
`ai/prompts.js` and justifies it from the note; that file maps the band to the
number the ring renders. The evidence rules forbid the model inventing a score,
and this is how the screen keeps its dial without breaking that.

## Hold to speak is a real microphone

Holding the memo bar calls `getUserMedia`, records with `MediaRecorder`, and
posts the clip to `/api/transcribe`, where the same backend that drafts the
record transcribes it. The bars on the bar are the analyser's own level, 20
samples a second, and the seconds count up because something is recording.
Releasing stops the recording and the words arrive about two seconds later.
`public/voice.js` is the whole client side of it; `ai/voice.js` and the `VOICE`
block in `ai/prompts.js` are the server side.

**Nothing is ever put in the note box that was not said or typed.** Every way
this can fail says which and opens the keyboard: permission refused, no
microphone, a browser that cannot record, a page served over plain http, no
connection, no key on the server, a clip the model would not transcribe. There
is no fixture left to fall back on, because a fabricated sentence here does not
stay in the note box — a record is drafted from it and an enforcement notice
quotes it to a property owner.

The recording itself is kept on the entry and offered back on the record screen
(**▶ Play what was said**). The transcript is editable, as it should be, so the
audio is the one unedited account of what the inspector said at the property.

### What a transcription model does with four seconds of noise

Asked plainly for a transcript, `gemini-3.6-flash` invented one. Low-level
noise with no voice in it came back as *"Zone 0 deck attached facing east, wood
lattice underneath open, dead leaf litter accumulated inside 3 to 4 in"* —
fluent, plausible, about a property nobody had described. Telling it in the
prompt to answer `[no speech]` did not stop it; its default is to be useful,
and transcribing nothing does not feel useful.

Three things fixed it, and they are worth keeping in that order:

1. **The answer is a judgement first and a transcript second.** A JSON schema
   with a required `speech` boolean, and `text` empty when it is false.
2. **The fields are generated in the order `heard`, `speech`, `text`.** The
   model describes the audio ("static and wind, no voice") before it is asked to
   rule on it, and a model that has just written that does not then claim
   someone spoke. Judgement-first scored `speech: true` on the noise clip;
   description-first does not.
3. **The device's own level meter goes in the prompt** as evidence, never as a
   verdict. Measured over six-second clips through the same browser path:
   dictated speech swings 35× between its loud and quiet fifths, a 440 Hz tone
   4.2×, wind 6.4×. Speech leaves gaps between words.

Wind, traffic and silence now come back as "no speech in it" and the keyboard
opens saying so. A pure tone — a reversing truck, a smoke alarm — can still be
transcribed as words, so the app does not pretend otherwise: when the meter saw
no speech-like rhythm and the model returned words anyway, the words go in the
box and the hint says to play the recording back and check them. The app never
*discards* a clip on the meter's say-so, because one unbroken sentence over
traffic is flat too, and throwing away a real memo is the worse failure.

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

### The building corpus is now transcribed — and nine numbers were wrong

The building and fire-protection corpus used to carry
`provenance: 'unverified'` on every entry: written from the author's knowledge
of the **2019** CFC and never read off a source. It has now been transcribed
section by section from the **2025 California Fire Code** (chs. 3, 5, 6, 7, 9
and 10), which is the edition Ord. 3837 adopts.

Verifying it against the edition in force turned up **nine wrong section
numbers**, and most were not simply dead — the old number now addresses a
different subject, which is worse than a dangling reference:

| was (2019 CFC) | is (2025 CFC) | the old number now means |
|---|---|---|
| § 901.6.2 records | § 901.6.3 | Integrated Testing |
| § 907.9 alarms out of service | § 901.7 (any system) | Where Required in Existing Buildings |
| § 1031.2 egress reliability | § 1032.2 | Emergency Escape and Rescue Openings |
| § 1031.3 egress maintenance | §§ 1032.4, 1032.10 | Emergency Escape and Rescue Openings |
| § 1010.1.9 door operations | §§ 1010.2, 1010.2.1, 1010.2.4 | — (ch. 10 stops at 1010.1.7) |
| § 1010.1.10 panic hardware | § 1010.2.8 | — |
| § 912.3 FDC access | §§ 912.4, 912.4.2 | Fire Hose Threads |
| § 605.3 electrical working space | § 603.4 | Chimneys and Vents |
| § 605.4 extension cords | § 603.6 | Fuel Oil Storage Systems |

Several figures were also attributed to the wrong subsection — the 18-in.
sprinkler clearance is § 315.3.1, not § 315.3 or NFPA 13; the 3-ft hydrant
clear space is § 507.5.5, not § 507.5.4; the 1-footcandle egress level is
§ 1008.2.1, not § 1008.2; the 5-footcandle exit-sign face is § 1013.6.2, not
§ 1013.3. Two figures were simply wrong: fire-protection records are retained
**five** years under CCR Title 19 §§ 904.1(b)/904.2(c), not three, and
California runs portable extinguishers off **CCR Title 19, Division 1,
Chapter 3 — not NFPA 10 —** where the owner's inspection is **monthly**
(§ 574.1), not annual.

**What is still unverified.** Exactly two entries: **NFPA 13** and **NFPA 25**.
They are referenced standards rather than part of the Fire Code and were not
reachable, so they keep `provenance: 'unverified'` and the **verify source**
flag. `buildingTables` also carries explicit `verify` notes where a number
could not be confirmed — the panic-hardware release force (§ 1010.1.3) and the
extinguisher annual-maintenance interval — so the model is told not to state
them rather than left to guess.

This is tracked, not hidden. Citations come back on a three-tier flag:
**not in library** (red — the model invented it, or it is a superseded number),
**verify source** (`doc.audit.unsourcedCitations` — in the library, nobody read
a source), and **confirm source** (`doc.audit.mirroredCitations` — transcribed
verbatim, but from a mirror rather than the signed or official publication).
The edition rides next to every citation on screen and on every document. Before any of it goes on an
enforceable notice, replace the text with a transcription from the adopted code.
A section the model invented outright is a different and worse thing, and is
flagged separately as **not in library** — see `checkCitations` in
`ai/draft.js`, which enforces in code the rule the prompt also states.

| File | What it is | Edit it when |
|---|---|---|
| `ai/prompts.js` | **All prompt engineering.** Persona, evidence rules, style, the section plan for each document, the JSON schemas, model settings. | Tuning how the documents read. |
| `ai/codes.js` | The fire-code corpus, transcribed from primary sources, plus the numeric standards and the abatement/appeal procedure. | A code changes, or a new jurisdiction is added. |
| `ai/draft.js` | Plumbing: build request, call, validate, audit citations. | Rarely. |
| `ai/voice.js` | Plumbing for the dictated memo: audio in, a transcript or “nobody spoke” out. | Rarely. |
| `ai/check.js` | Command-line bench for prompt changes. | Adding fixtures. |
| `drafts.js` | Client side: builds the context, calls the endpoint, falls back. | Changing what data the model sees. |
| `voice.js` | Client side: the microphone, the recording, the level meter, the transcription call. | Changing how dictation behaves. |

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
- **Recommendation cards are drawn on the property's own photograph.** Each
  option gets the entry photo back with the work marked on it in cyan — a guide
  line where a cut goes, a dimension bar, a label in the inspector's words —
  and the owner receives it with the notice. The photograph underneath is never
  altered and the work is never shown already done: the model draws over a true
  picture rather than producing a false one. `gemini-3-pro-image`, overridable
  with `GEMINI_IMAGE_MODEL`.
- **Nothing waits on them.** One card takes 15–20 s and a violation can carry
  five, so the queue starts only after Finish has drafted the report and the
  notice, then runs on its own while the inspector keeps working. A card still
  waiting says "Generating suggestion visual"; one that failed says so and
  keeps its recommendation text. Cards are repainted in place, so pictures
  landing never disturb a half-swiped card or the cursor in the notice.
- **The inspector's determination is never overridden.** Violation, Compliant or
  Note is theirs, made on site with the whole property in view. But where the
  photograph disagrees with the note, the record says so in plain words, above
  the AI summary, so it is seen before the entry is signed. Silently writing a
  compliant record over a photograph that shows otherwise is the failure the
  prompt and `test:ai` both exist to prevent.

## Jurisdiction and codes

`ai/codes.js` carries **56 sections** — 54 transcribed verbatim, 2 unverified.
The edition in force is the **2025 California Fire Code** (based on the 2024
IFC) and the **2025 California Wildland-Urban Interface Code** (2024 IWUIC), as
adopted and amended by Marin County Code ch. 16.16, re-established by
**Ordinance No. 3837, § III (2025)**, effective **1 January 2026**. Every entry
names its source document (`meta.sourceDocs`) and its edition, and `pack()`
prints both next to the citation, because a section number alone is ambiguous
across editions.

Ord. 3837 renumbered the half of this corpus that matters most. It moved
Exterior Fire Hazard Control from CFC § 322 to **CFC § 325**, and deleted the
CFC ch. 49 amendments outright — the WUI vegetation duties that were
§§ 4906.2, 4907.1, 4907.2 and 4908 now live in the Wildland-Urban Interface
Code at **§§ 604.6–604.7** (MCC § 16.16.060). The full old-to-new map is
`meta.superseded.map`, it is injected into every prompt as sections the model
may not cite, and any old number that comes back anyway is flagged **not in
library**.

**One substantive change, not just renumbering.** Old CFC § 4907.2 required
clearance within **30 ft** of structures, up to 150 ft. Its successor, WUI Code
§ 604.6, requires **100 ft**, up to **200 ft**, and adds an explicit ladder-fuel
rule (30 ft) and a 6-in.-DBH canopy-separation rule. Anything written against
the old distance understates the current requirement.

Three things to re-check before this is used for real:

1. **Signed ordinance.** The ch. 16.16 text was transcribed from a municipal-code
   mirror (gocodebook.com, text as of 2026-10-04), not the signed ordinance.
   Those citations come back flagged **confirm source**. Confirm against the
   copy on file with the Marin County Fire Marshal.
2. **A numbering defect in the source.** The codified chapter gives two
   different sections the number **§ 16.16.060** — the IWUIC amendments, and
   "Authority to arrest and issue citations". Separately, CFC § 325.10 and MCC
   § 16.16.070(c) both cross-reference § 16.16.055 for appeals, but the appeal
   procedure is codified at **§ 16.16.065**, which is what this corpus treats as
   operative. See `meta.localSectionAmbiguity`.
3. **Correction window.** `CONFIG.correctionDays` is **10 days**, from CFC
   § 325.9.1 as added by MCC § 16.16.040 — not the generic 45 days this project
   used to assume. `appealDays` (15) is the window to appeal the Hearing
   Officer's decision under MCC § 16.16.065, not the window from the notice; an
   immediate hazard is 5 days to abate (§ 325.9.3) and 72 hours to appeal. Both
   windows survived the re-adoption unchanged; the section numbers did not.

A parcel already under a standing **seasonal and recurrent** nuisance
declaration (CFC § 325.3.2) is abated every year with no further hearing, and
§ 325.9.2 notice for it is a post card with **no hearing at all** — a materially
different process from the 10-day show-cause notice, and one the app does not
yet model. See `procedure.seasonalNotice`.

## Other services

Geocoding, routing and imagery use public keyless endpoints — Photon, Nominatim,
the OSRM demo server, Esri World Imagery and USGS NAIP. No keys needed, but they
are free tiers with usage policies and no uptime guarantee. See the
route-planning section of `TODO.md`.

Two things about them are worth knowing before changing that code:

- **Both geocoders are bounded to California, and the bound is applied twice.**
  Photon treats a `bbox` as a bias rather than a filter and will answer a bare
  street query with Nevada, so `geo.js` re-checks every result against the state
  it names and against the state's bounding box. Nominatim gets
  `countrycodes=us&bounded=1` and `addressdetails=1`, the latter only so the
  state arrives as a field instead of a word to be hunted for in
  `display_name`.
- **Esri answers `Cache-Control: max-age=0, must-revalidate`.** This app rebuilds
  whole screens, so left to the browser every satellite frame is re-requested
  each time one is drawn. `sat.js` therefore fetches each frame itself, keeps it
  as an object URL for the life of the page, and hands that to every later
  `<img>` asking for the same ground. Until a frame lands the box holds a
  skeleton; the stylised parcel drawing is kept for the one case it is honest
  about, which is every provider having failed.
