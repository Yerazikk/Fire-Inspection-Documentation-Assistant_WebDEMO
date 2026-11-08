# Vegetation inspection · V3 — interaction system (source of truth)

Generated from `spec.js`. The app implements exactly these screens and affordances; the in-app “?” shows the current screen’s list.

## Principles

- One primary action per screen, at the bottom. Secondary actions are quiet.
- Tap opens or selects. Press-and-hold acts (reorder, delete, speak, send). Swipe decides (deck). Drag moves (sheet, order).
- Nothing is lost silently: leaving an unsaved record asks; deleting asks; retaking restarts on purpose.
- No confirmation pills or toasts: the result of an action is visible in the UI itself.
- Generated text is always editable in place. The AI drafts, the inspector decides.
- Stale derived documents (report, notice) say so and offer Refresh; they never silently change.
- Drafted text says what drafted it and when. A document the model could not write is never dressed up as one it did.

## Global

| Control | Gesture | Result |
|---|---|---|
| R | key | Restart the demo from the map. |
| ? | tap | Show this screen’s affordances. |
| Space | key | Shutter on the camera. |
| ← → | keys | Swipe in the deck. |

## Map (landing) (`map`)

Plan and run the day: HQ, today’s stops, their order on real roads, and what is done.

| Control | Gesture | Result |
|---|---|---|
| ☰ (top-left) | tap | Opens the menu: previous inspections, saved site lookups, profile, settings. |
| Address field | type | Typeahead over saved and seeded addresses, then over OpenStreetMap. Every suggestion carries a satellite thumbnail of the property it would pin, so the right one is recognised before it is chosen. Enter or tapping a suggestion geocodes the address and adds the stop: a pin drops on the real map and a row appears in the sheet. |
| Address field | focus when empty | Lists recent site lookups — every address ever added to a day, kept on the device. |
| Address field | Enter with nothing highlighted | Geocodes whatever was typed and adds the first match. |
| Map pin | tap | Highlights the stop row in the sheet and scrolls to it. |
| Sheet handle | drag or tap | Three detents: peek, half, full (Apple Maps style). |
| Stop row | tap | Opens the Location home for that stop. |
| Stop row ➚ | tap | Deep-links to Apple Maps for turn-by-turn (asks first); the app stays where it is. |
| Stop row ≡ handle | drag | Lifts the row instantly and follows the finger; other rows slide out of the way; the route redraws on drop. |
| Stop row | press-and-hold anywhere, then drag | Same lift after a short hold. |
| Stop row ✕ | tap | Removes the stop (asks first if it already has entries). |
| Best route ✦ | tap | Times every pair of points on the road network, drives every ordering of today’s stops from HQ, and keeps the fastest. The panel reports each stage and the running count; rows and the route animate into the winning order. Manual reorder still works afterwards. |
| ◉ (top-right) | tap | Switches the basemap between satellite imagery and roads. Satellite shows the vegetation on the way in; roads name the street the route turns on. |
| ◎ (top-right) | tap | Fits the map back around HQ and the whole route. |

Edge cases

- Completed stops show a green check and a struck-through address; they can still be opened and edited.
- Adding a duplicate address flashes the existing row instead of adding a pin.
- With no stops, the sheet shows a hint and the route button is disabled.
- Every leg carries its real driving time and distance; the readout above the rows gives the day’s total.
- Up to eight stops, every ordering is driven one by one; from nine to fourteen the same exact answer is reached over subsets; beyond that the search says it is no longer exact.
- Reordering by hand or removing a stop re-times the day and retires the previous result.
- When OpenStreetMap has the street but not the house number, the number typed is kept and the row says it is pinned on the street.
- If the road network cannot be reached the readout says so and offers Retry; pins and rows still work.

## Menu (`menu`)

Everything that is not today’s route.

| Control | Gesture | Result |
|---|---|---|
| Previous inspections | tap | Opens the Days screen. |
| Saved site lookups | tap | Lists every address ever added to a day, with how often and how recently it was looked up. Tapping one puts it on today’s route; ✕ forgets it; Forget all clears the device. |
| Profile | tap | Shows inspector name, badge, unit, contact. |
| Settings | tap | Jurisdiction, correction window, notice defaults, the HQ every route starts from (read-only in the demo). |
| Scrim | tap | Closes the menu. |

Edge cases

- Lookups are kept on the device and survive a reload or a demo reset.

## Previous inspections (`days`)

Find any past inspection by day, date or words.

| Control | Gesture | Result |
|---|---|---|
| Search | type | Filters locations across all days by address, entry text or outcome (semantic in the product, substring in the demo). |
| Calendar icon | tap | Opens a month picker; choosing a day scrolls to that section. |
| Location card | tap | Opens that location as it looked at the end of that day (read-only snapshot). |
| ‹ | tap | Back to the map. |

Edge cases

- Days with no inspections do not appear; the picker greys them out.

## Location home (`location`)

Everything about one property today, and its history.

| Control | Gesture | Result |
|---|---|---|
| ‹ (top-left) | tap | Back to the map. Nothing to save here: entries save themselves. |
| Satellite view | look | Real aerial imagery of this address, framed on its own coordinate. Over it: the three defensible-space zones (5 ft, 30 ft, 100 ft) drawn true to scale, the point that was geocoded and routed to, the inspector’s position (pulsing dot) and one numbered pip per entry at the spot it was captured. A scale bar and the imagery credit sit along the bottom. |
| Parcel / 100 ft zone / Block | tap | Opens on Parcel. Reframes the imagery between the house, its whole defensible space, and the street around it. Pips stay on the ground as it rescales. The zone rings belong to the 100 ft zone view alone — Parcel and Block are plain imagery, so nothing is drawn over the ground being read. |
| Pip | tap | Scrolls to that entry in the list. |
| Today / History tabs | tap | Today lists this visit’s entries. History lists past inspection dates. |
| New entry (+) | tap | Opens the camera. |
| Entry card | tap | Opens its record for editing. |
| Entry card | press-and-hold | Cards wobble and show ✕. Tap ✕ to delete (asks first). Tap anywhere else to stop wobbling. |
| Finish | tap | Marks the stop complete and opens the wrap-up: a completion card drafts the Internal report and the Notice in front of the inspector — real calls, so it reports what each one actually came back as — then “See the documents” reveals them on the home with a highlight (asks first if there are no entries). |
| Internal report | tap | Opens the compiled technical document. Shown only after Finish. |
| Notice to owner | tap | Opens the email draft. Shown only after Finish. |
| Reopen | tap | Un-finishes the stop so entries can be added; documents hide again until the next Finish. |
| Next stop → | tap | Back to the map with this stop checked off. |
| History date | tap | Opens the snapshot of that day: same layout, dated banner, read-only, with its pips and entries. |

Edge cases

- If no imagery provider answers, the view falls back to a stylised parcel drawing and says so.
- Empty Today shows one message and the New entry button; nothing else competes.
- Report and Notice show a “changes since generated” badge when entries changed after they were made.
- Finish with zero entries asks whether to mark the stop as visited with no findings.

## Capture (`camera`)

Get a photo and a note with as few taps as possible.

| Control | Gesture | Result |
|---|---|---|
| Shutter (centre) | tap or space | Takes the photo; the memo bar slides up. |
| Upload (left) | tap | Opens the photo picker instead of shooting one: a file off the device, or one of the reference photos that ship with the app. Continues the same way. |
| Note only (right, keyboard icon) | tap | Skips the photo; opens the memo bar directly. |
| Memo bar | tap | Opens a text box with Submit. |
| Memo bar | press-and-hold | Walkie-talkie: transcribes while held; releasing drops the transcript into the editable box. |
| Use voice instead | tap | Returns from the text box to the bar. |
| Retake / Change photo | tap | Back to the live viewfinder; the memo is kept. |
| Picker · Choose from this device | tap | A real file picker. The photo is turned upright from its EXIF orientation, capped at 1600 px and re-encoded. A file the browser cannot open — HEIC off an iPhone, on Chrome — says so in the picker. |
| Submit entry | tap | Starts the scan on the photo in place (or a note-only analysis). The memo is optional when there is a photo; a note-only entry needs text. |
| Cancel (during scan) | tap | Stops the scan; the photo and memo are kept. |
| ‹ | tap | Back to Location home; asks first if a photo or memo exists. |

Edge cases

- Releasing the mic after less than three words shows “didn’t catch that” and keeps listening available.
- The scan is a single top-to-bottom sweep. The photo and the note go to the model together; the boxes are what it found in that frame, so they land when it answers rather than on a timer — blue labels an element, red marks the deficiency, green a condition that meets. It then opens the record by itself.
- Where the model cannot be reached, a photo taken with the shutter falls back to the hand-measured boxes for that one fixture image. Any other photo gets no boxes: percentages measured against one picture are wrong on another.
- A photograph cannot establish a distance, so none of this produces a measurement. Measurements stay "not measured" unless the note gives the figure.

## Entry record (`record`)

The inspector’s technical record for one entry, editable, with recommendations.

| Control | Gesture | Result |
|---|---|---|
| Original photo | tap | Expands it with a Retake button. Retake restarts the whole entry: new photo, new scan, new notes, new deck. |
| Scanned photo | tap | Expands it with a feedback pill. Sending a correction puts the photograph back in front of the model with it and redrafts the whole record — boxes included — so a figure the inspector gives (“it is 3 ft, I measured it”) stops being “not measured” and anything they point out that was missed is picked up. Corrections accumulate on the entry; a recommendation the inspector wrote themselves, and the in/out decisions they already made, survive the redraft. |
| Any text line | tap Edit on its card | Lines become editable; Done saves; Revert restores the generated text. |
| Recommendations | tap | Opens the deck. |
| Save | tap | Saves the entry and returns to Location home; a numbered pip appears at the capture position. |
| ‹ | tap | If anything changed: Save / Discard / Keep editing. Otherwise just goes back. |

Edge cases

- Note-only entries have no photo row, no determination and no recommendations; the record shows the raw note, its transcription (if spoken) and the AI summary.
- Where the photograph disagrees with the note, an amber block sits directly under the inspector’s note saying what the photograph shows instead. The determination is unchanged — Violation, Compliant or Note is the inspector’s call, made on site with the whole property in view — but it is said out loud before the entry is signed, rather than the record quietly reading as though the two agreed.
- An entry submitted with a photo and no note at all is drafted from the photograph alone, and the note card says so.
- Compliance entries are marked green and have no recommendations section.
- Metadata (date, time, position, address, inspector) sits as a quiet footer under the record.
- Severity, category, estimates and both state and local code references are listed for violations.

## Recommendations deck (`deck`)

Decide which fixes to offer the owner.

| Control | Gesture | Result |
|---|---|---|
| Card | swipe right / ✓ / → | Include this recommendation. |
| Card | swipe left / ✕ / ← | Leave it out. |
| ↶ | tap | Undo the last decision (the previous card comes back). |
| Write your own | tap | Type a recommendation; an AR card is generated for it and placed on top of the deck to decide on like the others. |
| Skip the rest | tap | Enabled once at least one is included; returns to the record. |
| ‹ | tap | Back to the record; decisions so far are kept. |

Edge cases

- Only violation entries have a deck; notes and compliance entries have none.
- When the deck is exhausted the end card shows the tally and the only action is to return.

## Internal report (`report`)

A rigorous document drafted from every entry, grounded in the code library, for the file.

| Control | Gesture | Result |
|---|---|---|
| Refresh | tap | Shown when entries changed after the report was drafted, or when drafting failed; redrafts. |
| Section | tap Edit | Every drafted line is editable in place; Revert restores what was drafted. |
| Export | tap | Writes the document to a text file on the device. |
| ‹ | tap | Back to Location home. |

Edge cases

- Drafted per property from the inspector’s notes and the jurisdiction’s fire code — it states no measurement that was not recorded, and cites only sections in the code library.
- A citation outside the code library is flagged in red on the section that carries it.
- The footer names when it was drafted, by which model, the code edition cited, and the inspector who reviewed it.
- If drafting is unavailable the screen says so and shows generic template text, marked as not being about this property.

## Notice to owner (`notice`)

Plain-language email: what we found, what to do, with the approved visuals and attachments.

| Control | Gesture | Result |
|---|---|---|
| Edit options | tap | Reopens the deck for that entry. |
| Find attachments | tap | Searches the department library; each hit has an include toggle. |
| Add your own | tap | Attach a file from the device (demo: adds a placeholder document). |
| Refresh | tap | Shown when entries, decisions or attachments changed after the draft, or when drafting failed; redrafts. |
| Save draft | tap | Saves to the inspector’s Mail drafts for the desktop; the screen then says it is saved and not sent. |
| Hold to send | press-and-hold | Sends from the phone; greyed until at least one violation entry has an included option and the owner has a deliverable address. Afterwards the screen says who it went to and when. |
| ‹ | tap | Back to Location home; the draft is kept. |

Edge cases

- Drafted in plain language per property; code citations stay out of the letter body.
- The correction deadline, the hearing and the appeal windows come from the jurisdiction’s abatement procedure, not from a generic default.
- Compliance-only visits produce a short “no action needed” notice.
- With no mailing address on file the notice says so and Hold to send is disabled.
- If drafting is unavailable the screen says so and shows generic template text, marked as not being about this property.

## Department library search (`kb`)

Find the documents the notice should carry.

| Control | Gesture | Result |
|---|---|---|
| Hit ✓/○ | tap | Include or leave out. |
| Attach | tap | Returns to the notice with the included set. |
| ‹ | tap | Back without changes. |

Edge cases

- A second visit shows the previous choices instead of re-animating the search.

## Screen graph

map → location (Open inspection) → camera (New entry) → record (after scan) → deck (Recommendations) → record → location (Save)

location → report · notice → kb → notice

map → menu → days → location (snapshot, read-only)

location → map (‹ or Finish inspection)
