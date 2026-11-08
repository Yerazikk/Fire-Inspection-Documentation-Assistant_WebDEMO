# What is left before this is a working app

The interaction system is complete — every screen, gesture and edge case in
`SPEC.md` is built and reachable. The **day plan** is now wired to live data:
addresses are geocoded, legs are real drives, "best route" searches every
ordering (`geo.js`), and the parcel view is real satellite imagery of the
address (`sat.js`). Everything downstream of the map is still a scripted demo
over one fixture photo.

This file is the gap between the two, ordered by what blocks a real inspector
first. Each item says what happens today, with a file reference, and what
"done" means.

Legend: **L** blocks launch · **M** needed to be useful · **S** polish.

---

## 1. Nothing survives a reload — L

**Today.** All state lives in one in-memory object, `S` (`app.js:16`). Close
the tab mid-inspection and the day, every entry, every photo and every draft
are gone. The only thing persisted is the site-lookup list
(`geo.js`, `localStorage`). `HISTORY` and `DAYS` (`data.js:116`, `data.js:136`)
are hard-coded fixtures, so "previous inspections" shows the same four days to
everyone forever.

**Done means.** A backend with inspections, entries, photos, documents and
their revisions; the client writing through on every save rather than at the
end; an offline queue, because inspectors work in canyons with no signal, and
this is the whole reason the app is on a phone. Decide early whether photos go
to object storage with the record holding a key — that choice shapes the entry
schema.

**Blocks:** §2, §3, §7 all need somewhere to put their output.

## 2. The camera is a fixture — L

**Today.** The shutter assigns a file path: `d.photo = 'assets/original.jpg'`
(`app.js:447`). Upload sets the string `'upload'` and shows a hard-coded
"IMG_2041.HEIC · today 10:38" caption (`app.js:448`); there is no file input
anywhere in the project. Every inspection of every property produces the same
oleander photo.

**Done means.** `getUserMedia` for the viewfinder and capture, a real
`<input type="file" accept="image/*">` for the library path, EXIF read for
timestamp and orientation, client-side downscale before upload, and the photo
stored against the entry.

## 3. There is no GPS — L

**Today.** Position comes from `POS`, five fixed pairs cycled per entry
(`app.js:20`). The coordinates printed in the record footer are assembled from
those array indices — `` `37.84${12 + pos[0] % 10}° N, 122.21${...}° W · ±4 m` ``
(`app.js`, `recordView`) — so the record shows a fabricated location, with a
fabricated accuracy, next to a real date and a real inspector name. Worse, the
hard-coded degrees are Oakland's, and the addresses are now in Marin. The
pulsing "you are here" dot and the entry pips are the same fake array, now
projected onto the parcel at `PARCEL_M` metres across (`geoXY`) so at least
they sit on the right property as it zooms.

**Done means.** `navigator.geolocation.watchPosition`, the real fix and its
real accuracy stored on the entry, and the accuracy figure shown rather than
invented. A legal notice turns on where the inspector stood. The drawing side
is already waiting for it: `SAT.view(...).xy(lat, lon)` turns a fix into a
position on the imagery, so `geoXY` is the only call site to replace.

> Worth fixing early even if the rest stays a demo: a plausible-looking wrong
> coordinate in a document that cites code sections is the most damaging thing
> in here.

## 4. The voice memo does not listen — L

**Today.** Holding the mic types out a canned sentence from `MEMOS[kind]`
word by word on a timer (`speakStep`, `app.js:454`). The mic is never opened.
Release under three words shows "didn't catch that", which is also scripted.

**Done means.** `SpeechRecognition` where available, otherwise record audio and
transcribe server-side; keep the audio attached to the entry. The transcript
stays editable, as it is now.

## 5. The vision pass is an animation — L

**Today.** `analyze()` (`app.js:459`) is a sequence of `setTimeout`s. The boxes
are hard-coded percentages for the fixture photo (`SCAN`, `data.js:35`); the
progress lines are a fixed list (`STREAM`); and the entry's type is decided by
a regex over the memo — `/compliant|clear|ok|good/i` (`app.js:458`) — so a note
reading "not clear" classifies as compliant.

**Done means.** A real model call with the photo and the memo, returning
detections with confidences, and boxes drawn from what it returns. Show
confidence, and let low confidence read as uncertain instead of definite.

## 6. The AI text — report and notice are drafted; the record is not — M

**Done.** The **Internal report** and the **Notice to owner** are now drafted per
property by a real model call. `drafts.js` builds the context, `serve.js` proxies
it so the key stays server-side, and `ai/` holds the three pieces that matter:

- `ai/prompts.js` — every prompt-engineering knob in one file: persona, evidence
  rules, per-document style, the section plan, the JSON schemas, model settings.
- `ai/codes.js` — 53 code sections (21 transcribed, 32 unverified): MCC ch. 16.16
  as re-established by Ordinance No. 3837 (2025, effective 2026-01-01), PRC
  § 4291, GC §§ 51175–51189, 14 CCR §§ 1299.02–04 and the CAL
  FIRE Property Inspection Guide, plus the numeric standards and the abatement
  and appeal procedure. Every entry names its source.
- `ai/draft.js` — the call, schema validation, and a citation audit that fails
  anything cited which is not in the library.

Both come back structured (`{ sections: [...] }`), render through one renderer,
and every line is editable with Revert. Measurements are no longer invented: the
report carries a **Measurements required** section naming what must be measured
and the standard it will be tested against. Severity scores are gone from the
drafted documents. `CONFIG.correctionDays` is now **10 days** (CFC § 325.9.1 as
adopted by MCC § 16.16.040), not the 45 this project used to assume.

**Still open here.**

- **The entry record is drafted.** DONE. `kind: 'record'` in `ai/prompts.js`,
  validated into the record screen's shape by `validateRecord` in
  `ai/draft.js`, called per entry by `DRAFTS.record` in `drafts.js`. The
  summary, severity band, categories, measurements, citations and the
  recommendation deck all come from the note the inspector submitted.
  `window.AI` is now only the fallback and a record built from it says
  **Template · not this property** on its face.
- **`{memo}` is resolved** for the records as well as the documents — the note
  is the model's only source of observed fact.
- **The photograph is still not sent.** Still true, and still §5. What this
  means for the record: the scan overlay boxes (`SCAN`, `data.js`) are still
  fixture percentages for the fixture photo, and the recommendation cards no
  longer carry illustrations, because the model cannot produce one. The deck
  renders text-only cards. Severity, categories, measurements and citations now
  all come from the note instead of the photo.
- **The building corpus is transcribed.** DONE. All 33 California Fire Code
  entries were transcribed verbatim from the **2025 CFC** (chs. 3, 5, 6, 7, 9,
  10) — the edition Ord. 3837 adopts — alongside the 21 vegetation sections.
  Doing it corrected **nine wrong section numbers** that had been written
  against the 2019 CFC, most of which now address a different subject
  (§ 912.3 is Fire Hose Threads, § 605.3 is Chimneys and Vents, § 1031.2 is
  Emergency Escape and Rescue Openings). The full map is
  `meta.superseded.map` and the old numbers are now rejected by the audit.
  Several figures also moved to their true subsection (18-in. sprinkler
  clearance is § 315.3.1; 3-ft hydrant space is § 507.5.5; 1 footcandle is
  § 1008.2.1; 5 footcandles is § 1013.6.2), and two were wrong outright:
  records are retained **five** years (CCR tit. 19 §§ 904.1(b), 904.2(c)), not
  three, and California extinguishers run off **CCR tit. 19 div. 1 ch. 3, not
  NFPA 10**, with a **monthly** owner inspection (§ 574.1), not annual.
  Everything carries **confirm source** because UpCodes is a code-viewer
  mirror; clearing that means checking against the Building Standards
  Commission publication of Title 24 Part 9.
- **Two entries remain unverified.** `nfpa13-painting` and
  `nfpa25-sprinkler-condition`. They are referenced standards, not part of the
  Fire Code, and were not reachable. They keep `provenance: 'unverified'` and
  the **verify source** flag, and the sprinkler-condition rule — that a
  painted or corroded sprinkler is replaced rather than cleaned — rests on
  them. `buildingTables.sprinklers.verify` tells the model not to quote a
  clause number for it. Getting the adopted California editions of NFPA 13 and
  NFPA 25 is the remaining transcription task.
- **Two figures deliberately absent.** The panic-hardware release force
  (CFC § 1010.1.3) and the extinguisher annual-maintenance interval and
  service-tag content (CCR tit. 19 div. 1 ch. 3) were not transcribed, so they
  are stated nowhere; `buildingTables` carries a `verify` note telling the
  model not to state them. The old corpus asserted 15 lb for the first and one
  year for the second without a source.
- **The building violation procedure is a sketch.** `procedure.buildingViolation`
  describes a correction notice, a correction period set by hazard, reinspection
  and citation. It is marked `unverified: true` and is not the vegetation
  abatement machinery (no 10-day Notice to Abate, no tax lien). Transcribe the
  adopted administrative chapter before a building notice is issued.
- **Entry kind is still guessed from keywords.** `app.js` picks violation vs
  compliance with `/compliant|clear|ok|good/i` over the memo. The record now
  repeats whatever that guess was — the model is told not to re-decide the
  inspector's determination — so a wrong guess produces a confidently wrong
  determination. The inspector should choose it.
- **Confirm the signed ordinance.** The edition question is settled: Marin
  adopted Ordinance No. 3837 on 2025-12-09, repealing Ord. 3775 (2022-11-15) and
  adopting the 2025 CFC / 2024 IFC and the 2025 CA WUI Code / 2024 IWUIC,
  effective 2026-01-01. What is *not* settled is the instrument: ch. 16.16 was
  transcribed from the gocodebook.com municipal-code mirror, so those citations
  carry **confirm source** until checked against the signed ordinance on file
  with the Fire Marshal. Two defects to resolve while doing it — the chapter
  numbers two different sections § 16.16.060, and CFC § 325.10 and MCC
  § 16.16.070(c) both point at § 16.16.055 for appeals when the procedure is at
  § 16.16.065. See `meta.localSectionAmbiguity`.
- **Model the seasonal and recurrent notice.** A parcel under a standing
  seasonal-and-recurrent declaration (CFC § 325.3.2) is abated annually with no
  further hearing, and § 325.9.2 notice is a post card with no hearing at all.
  The app only knows the 10-day show-cause route, so for such a parcel it would
  describe a hearing that will not happen. `procedure.seasonalNotice` carries
  the text; nothing reads it yet.
- **The old PDF is of a repealed ordinance.** `marin_county_fire_code_ordinance_3775_final.pdf`
  in the repo root is Ord. 3775, superseded on 2026-01-01. Keep it only as the
  record of what governed pre-2026 inspections, and do not transcribe from it.
- **Free-tier quota.** 20 requests/day; one inspection costs two. Needs billing
  for a fleet. See README.md.
- Re-scan feedback (`app.js`) still just appends the typed sentence after a
  1.6 s wait. Nothing is re-analysed.

## 7. Documents do not go anywhere — L

**Today.**
- **Export** now writes a real file — the document as plain text, via a Blob
  download (`exportDoc`, `app.js`). It is not a PDF: that needs a renderer the
  project does not have yet.
- **Save draft** and **Hold to send** now show their result — the notice says
  "Saved to drafts at …" or "Sent to … at …". Nothing is actually mailed and
  nothing is saved anywhere that survives a reload (§1); the screen no longer
  lies by omission, but the action behind it is still not real.

**Done means.** Real PDF generation and mail send through the department's
system, with the sent state persisted against the case rather than held in
memory.

**Also here.** Posting to the permit system (`CONFIG.portal`, "Accela Citizen
Access") does not exist in any form, and nothing tracks the 45-day correction
window, the 15-day appeal window, or reinspection scheduling — the three dates
the whole notice is about.

## 8. The document library is a fixture — M

**Today.** `kbAfter` (`app.js:544`) walks six hard-coded entries (`KB`,
`data.js:105`) on timers and attaches all of them by default; the scrolling
file index beside it is decorative. "Add your own" pushes a placeholder
filename string (`app.js:536`) — no file picker.

**Done means.** A real document store with search over it, relevance from the
entry rather than a `why` string written in advance, and real attachment upload.

## 9. Owner records are invented — M

**Today.** Seeded addresses carry an owner name and email (`data.js:16`).
Addresses geocoded at runtime get `{ name: 'Owner of record', email: '' }`
(`app.js`, `registerAddress`) — so a notice for any address the inspector
actually types has **no recipient**, and "Hold to send" is enabled anyway.

**Done means.** County assessor / parcel lookup for ownership and mailing
address, and the Send control disabled with a stated reason when there is no
deliverable address.

## 10. The parcel view has imagery but no parcel — M

**Today.** The view is real satellite imagery of the address, from Esri World
Imagery with USGS NAIP behind it (`sat.js`), framed in Web Mercator so the
scale bar and the 5/30/100 ft defensible-space rings are true to scale. The
stylised drawing survives only as the fallback when no provider answers.

Two things on it are still not real. The **parcel boundary** is not drawn at
all — the rings are concentric circles around the geocoded point, not the lot,
so on a long or oddly-shaped lot they are a guide rather than the legal area.
And the **geocoded point is not the structure**: OSM puts an address node at
the entrance or the driveway, so the rings centre a few metres off the house
they are supposed to protect.

**Done means.** The Marin County parcel layer over the imagery, the rings
measured from the structure footprint rather than a point, and entry pips
placed by their GPS fix (§3). Both are public ArcGIS feature services, so they
arrive the same way the imagery does.

## 11. Identity and settings — M

**Today.** The inspector is a constant (`CONFIG.inspector`), there is no sign
in, and Settings is a read-only sentence in a dialog. Jurisdiction, correction
window and notice defaults cannot be changed, though the documents are built
from them.

**Done means.** Auth, the signed-in inspector on every record, and settings
that are editable and actually read by the document builders.

## 12. Previous inspections — S

**Today.** Search is `String.includes` over the fixtures; `SPEC.md` says it is
"semantic in the product, substring in the demo". The date picker is hard-coded
to November 2026 — `new Date(2026, 10, 1)`, a 30-day loop (`app.js:296`) — and
its "October ‹ ›" control is decorative.

**Done means.** Server-side search over real inspections, and a calendar that
renders the current month and navigates.

---

## Route planning — what is real, and what is still missing

Done and verified (`geo.js`, `test_route.js`): geocoding, real road geometry,
per-leg times, exhaustive ordering with an exact fallback, saved lookups.
What it still does not do:

- **The day never returns to HQ.** The search optimises an open path ending at
  the last stop. If inspectors drive back, that leg is unaccounted for — a
  one-line change to the cost function, but it changes which order wins. **M**
- **No time at a stop.** An inspection takes 20–40 minutes; the plan counts
  only driving, so a "50 minute day" is really a six-hour one. Add per-stop
  service time and show a finish time. **M**
- **No traffic and no departure time.** OSRM is free-flow. A hills route at
  08:00 and at 17:00 are not the same drive. Needs a traffic-aware provider
  (Google/Mapbox/HERE Matrix) to be trustworthy for planning. **M**
- **No appointment windows, priorities or shift length** — real constraints on
  which order is allowed, not just which is fastest. **M**
- **Public endpoints, no keys.** Photon, Nominatim and the OSRM demo server are
  free tiers with usage policies and no uptime guarantee; the OSM and Esri tile
  servers likewise. Fine for a demo, not for a fleet. Needs keyed providers, or
  self-hosted OSRM, plus request budgeting. **L for launch**
- **Imagery is whatever Esri last flew.** No capture date is shown, and in
  Marin that can be two or three years old — long enough that vegetation in
  the picture is not the vegetation on the ground. The service exposes the date
  per tile; show it, and never let a notice cite the image as evidence. **M**
- **Navigation is Apple-only.** The ➚ hand-off builds a `maps.apple.com` URL;
  on Android it does nothing useful. Add a platform check and a Google Maps
  fallback. **S**
- **Today's stops are not saved** — only the lookup history is. Covered by §1. **L**
- **No offline map.** No tile caching, and a failed lookup leaves the route
  unavailable until Retry. Dead zones are exactly where this app gets used. **M**

---

## Cross-cutting

- **`toast()` is a no-op** (`app.js:11`) with 14 call sites. Some are correct
  under the no-toasts principle, but several — Export above all — leave an
  action with no feedback of any kind. Audit each site: either make the result
  visible in the UI, or delete the call.
- **No error handling outside the route layer.** `geo.js` paths report failure
  and offer Retry; nothing else does. Every network call added for the items
  above needs the same treatment.
- **Tests run and pass.** Playwright is a dev dependency and `test.js` requires
  it by name, so `npm test` works on any machine; `test_route.js` passes too.
  Four assertions had rotted against the app and were fixed with it: the drag
  test grabbed a point that stopped being the handle once rows grew a
  drive-time line (and sat below the fold once "best route" added its plan),
  the map checkmark was asserted on the SVG pin layer Leaflet replaced, and
  `[data-loc="a6"]` matched twice once Wolfback Ridge joined today's route.
  A green suite is now meaningful again — keep it that way.
- **No accessibility pass.** Interaction is pointer-events throughout; the deck,
  the sheet detents and the reorder drag have no keyboard path, and there are no
  ARIA roles or live regions.
- **No build step.** Four globals-based scripts and no package manifest. Fine
  now; revisit when the first dependency arrives.
