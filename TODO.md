# What is left before this is a working app

The interaction system is complete — every screen, gesture and edge case in
`SPEC.md` is built and reachable. The **day plan** is now wired to live data:
addresses are geocoded, legs are real drives, and "best route" searches every
ordering (`geo.js`). Everything downstream of the map is still a scripted
demo over one fixture photo.

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
(`app.js:465`) — so the record shows a fabricated location, with a fabricated
accuracy, next to a real date and a real inspector name. The pulsing "you are
here" dot on the parcel view is the same fake array (`app.js:393`).

**Done means.** `navigator.geolocation.watchPosition`, the real fix and its
real accuracy stored on the entry, and the accuracy figure shown rather than
invented. A legal notice turns on where the inspector stood.

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

## 6. The AI text is templates — L

**Today.** Every summary, severity score, category, measurement and code
citation is a literal in `window.AI` (`data.js:60`), picked by entry kind. The
severity "72" and the estimates ("≈ 14 ft", "≈ 25 % slope") are the same on
every property. `data.js:59` documents a `{memo}` placeholder that no code
substitutes — the inspector's note never reaches the generated text.
Re-scan feedback appends the typed sentence to the estimates list after a
1.6 s wait (`app.js:491`); nothing is re-analysed.

**Done means.** Generation per entry from the photo, memo and parcel context.
Measurements need a real basis (photogrammetry, a scale reference, or the
inspector entering them) — stating "≈ 14 ft" with no measurement behind it is
the kind of thing that loses an appeal.

**Code citations are their own task.** They are currently strings. They need a
maintained source keyed to jurisdiction and effective date, with the cited
version pinned on the notice, because codes change between inspection and
hearing.

## 7. Documents do not go anywhere — L

**Today.**
- **Export** (`app.js:520`) calls `toast('PDF saved to the case file')`. `toast`
  is `() => {}` (`app.js:11`). Tapping Export does nothing at all, visibly or
  otherwise. No PDF is produced.
- **Save draft** (`app.js:537`) sets `ns.draft = true`. Nothing reads it.
- **Hold to send** (`app.js:538`) sets `ns.sent = true` and re-renders. Nothing
  reads that either, so the notice looks identical afterwards and no mail is
  sent.

The last two break the project's own principle — *"the result of an action is
visible in the UI itself"* — not by showing the wrong thing but by showing
nothing.

**Done means.** Real PDF generation, mail send through the department's
system, and the notice carrying its sent state, timestamp and recipient. Until
then, at minimum make `ns.sent` and `ns.draft` visible so the screen stops
lying by omission.

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

## 10. The parcel view is drawn, not imaged — M

**Today.** `satSVG` (`app.js:392`) generates a parcel from a number seeded off
the address's map coordinates — nine procedural trees, a rectangle for the
house, a rectangle for the hedge. It is the same cartoon at every property.

**Done means.** Real aerial or satellite imagery with the parcel boundary from
the county layer, entry pips placed by their GPS fix (§3).

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
  free tiers with usage policies and no uptime guarantee; the OSM tile server
  likewise. Fine for a demo, not for a fleet. Needs keyed providers, or
  self-hosted OSRM, plus request budgeting. **L for launch**
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
- **`test.js` cannot run here.** It requires Playwright from a hard-coded path
  on another machine (`/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright`).
  Make it a dev dependency. `test_route.js` runs and passes.
- **No accessibility pass.** Interaction is pointer-events throughout; the deck,
  the sheet detents and the reorder drag have no keyboard path, and there are no
  ARIA roles or live regions.
- **No build step.** Four globals-based scripts and no package manifest. Fine
  now; revisit when the first dependency arrives.
