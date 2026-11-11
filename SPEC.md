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
| Address field | type | Typeahead over saved and seeded addresses, then over OpenStreetMap, bounded to California — this unit does not inspect out of state, and a near-miss in Nevada is a wasted drive rather than a harmless extra row. Every suggestion carries a satellite thumbnail of the property it would pin, so the right one is recognised before it is chosen. Enter or tapping a suggestion geocodes the address and adds the stop: a pin drops on the real map and a row appears in the sheet. |
| Address field | focus when empty | Lists recent site lookups — every address ever added to a day, kept on the device. |
| Address field | Enter with nothing highlighted | Geocodes whatever was typed and adds the first match. |
| Map pin | tap | Opens the property preview in the sheet: a Google Street View photograph of the house — aimed at it, not down the road, because the server works out where the camera stands first — over the status, today’s entries and the inspection history. An address with no Street View coverage says so rather than showing an empty box. |
| Sheet handle | drag or tap | Three detents: peek, half, full (Apple Maps style). |
| Stop row | tap | Opens the Location home for that stop. |
| Stop row ➚ | tap | Deep-links to Apple Maps for turn-by-turn (asks first); the app stays where it is. |
| Stop row ≡ handle | drag | Lifts the row instantly and follows the finger; other rows slide out of the way; the route redraws on drop. |
| Stop row | press-and-hold anywhere, then drag | Same lift after a short hold. |
| Stop row ✕ | tap | Removes the stop (asks first if it already has entries). |
| Best route ✦ | tap | Times every pair of points on the road network, drives every ordering of today’s stops from HQ, and keeps the fastest. The panel reports each stage and the running count; rows and the route animate into the winning order. Manual reorder still works afterwards. |
| ◉ (top-right) | tap | Switches the basemap between satellite imagery and roads. Satellite shows the vegetation on the way in; roads name the street the route turns on. |
| ◎ (top-right) | tap | Fits the map back around HQ and the whole route, inside the map that can actually be seen rather than the whole phone — the sheet covers the bottom of the canvas and the controls the top. |

Edge cases

- Completed stops show a green check and a struck-through address; they can still be opened and edited.
- Adding a duplicate address flashes the existing row instead of adding a pin.
- With no stops, the sheet shows a hint and the route button is disabled, and HQ sits in the middle of the strip of map left between the top controls and the sheet.
- Addresses outside California are not offered, and a query that only matches out of state says so rather than coming back empty.
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
| Satellite view | look | A live Google satellite map of this address, centred on the coordinate it was geocoded to plus whatever offset was saved for it. Imagery is Google’s, so it is the same picture the owner will recognise. Where the Maps key is missing or refused, the box falls back to keyless Esri aerial imagery and then to a stylised parcel, so it never shows an empty rectangle. |
| Satellite view | drag and pinch | Pans and zooms the map, one finger or two, with the scroll wheel and the zoom control as well — Google’s own handling. The geocoded point is a pin on the street, and the house, the woodpile and the slope behind it are not always in the box drawn round it. Where it is left stays put while the screen rebuilds under it; moving to another property reframes on that one. |
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

- While imagery loads, the view shows a skeleton — dark blocks pulsing. The stylised parcel is a drawing of ground nobody has seen, so it is never what fills the wait.
- If no imagery provider answers, the view falls back to that stylised parcel drawing and says so.
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
| Memo bar | press-and-hold | Walkie-talkie: opens the microphone and records while held, with the bars showing the real level and the seconds counting up beside them. The words appear in provisional type as they are spoken, from the browser’s own recogniser — a preview, so the hold is visibly hearing them. Releasing sends the recording to be transcribed properly; the words stay where they are, untouched, until the real transcript replaces them in the editable box. The recording is kept with the entry. |
| Use voice instead | tap | Returns from the text box to the bar. |
| Retake / Change photo | tap | Back to the live viewfinder; the memo is kept. |
| Picker · Choose from this device | tap | A real file picker. The photo is turned upright from its EXIF orientation, capped at 1600 px and re-encoded. A file the browser cannot open — HEIC off an iPhone, on Chrome — says so in the picker. |
| Submit entry | tap | Starts the scan on the photo in place (or a note-only analysis). The memo is optional when there is a photo; a note-only entry needs text. |
| Cancel (during scan) | tap | Stops the scan; the photo and memo are kept. |
| ‹ | tap | Back to Location home; asks first if a photo or memo exists. |

Edge cases

- Nothing is ever put in the note box that was not said or typed. There is no canned transcript to fall back on, so every way voice can fail says which and opens the keyboard: the microphone refused or missing, a browser that cannot record, no https, no connection, no transcription key, a clip the model could not transcribe.
- Released under half a second, or with a flat level and nothing audible: the bar says to hold it down while speaking, and stays on voice.
- A clip the model reports as having no speech in it — wind, traffic, a hand over the mic — opens the keyboard saying so rather than guessing at words.
- When the level meter saw no speech-like rhythm but the model returned words anyway, the words go in the box and the hint says to play the recording back and check them.
- The words shown while the bar is held are a preview and never the note. They come from the browser’s own recogniser, which cannot be given this job’s vocabulary, has no way to report that nobody spoke, and in Chrome is transcribed by a service outside this app — so they are drawn in provisional type, kept on screen through the wait, and replaced on release by the transcript from the model that was given the vocabulary and the rule. A browser without a recogniser, or one whose recogniser never answers, shows the level and the counter instead and loses nothing.
- The meter only gets to discard a recording when it was really measuring one. A browser that will not run an audio graph for the hold — Safari, until the graph is opened in the gesture itself — reads every sample as dead centre, which is not a quiet recording but no reading at all; the bars rest, the recording goes to be transcribed anyway, and the model decides on the audio.
- The scan is a single top-to-bottom sweep. The photo and the note go to the model together; the boxes are what it found in that frame, so they land when it answers rather than on a timer — blue labels an element, red marks the deficiency, green a condition that meets. It then opens the record by itself.
- Where the model cannot be reached, a photo taken with the shutter falls back to the hand-measured boxes for that one fixture image. Any other photo gets no boxes: percentages measured against one picture are wrong on another.
- A photograph cannot establish a distance, so none of this produces a measurement. Measurements stay "not measured" unless the note gives the figure.

## Entry record (`record`)

The inspector’s technical record for one entry, editable, with recommendations.

| Control | Gesture | Result |
|---|---|---|
| Original photo | tap | Expands it with a Retake button. Retake restarts the whole entry: new photo, new scan, new notes, new deck. |
| Scanned photo | tap | Expands it with a feedback pill. Sending a correction puts the photograph back in front of the model with it and redrafts the whole record — boxes included — so a figure the inspector gives (“it is 3 ft, I measured it”) stops being “not measured” and anything they point out that was missed is picked up. Corrections accumulate on the entry; a recommendation the inspector wrote themselves, and the in/out decisions they already made, survive the redraft. |
| Play what was said | tap | Plays back the recording the note was dictated from, where there is one. The transcript is editable and the recording is not, so it is the one unedited account of what the inspector said at the property. |
| Any text line | tap Edit on its card | Lines become editable; Done saves; Revert restores the generated text. |
| Recommendations | tap | Opens the deck. Each card carries the property's own photograph with that correction marked on it in cyan. The pictures are drawn after Finish, so a card opened before its own has arrived says “Generating suggestion visual” and keeps its place in the deck; one that could not be drawn says so and keeps its text. |
| Save | tap | Saves the entry and returns to Location home; a numbered pip appears at the capture position. |
| ‹ | tap | If anything changed: Save / Discard / Keep editing. Otherwise just goes back. |

Edge cases

- A dictated note is chipped “Voice” with the length of the recording, and the recording is offered back for playback. Where the level meter did not look like speech but words came back anyway, the line beside it says to check the note against the recording.
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
- Not every finding has alternatives. The record says whether it has several valid options, one required action, or an action a qualified professional has to scope first; where there is one, the deck carries that single card, marked as required, and the notice presents it as what has to be done rather than as an option out of one. The deck is never padded with an invented alternative to fill it.
- Each card carries a visualisation of the property with that correction carried out — same house, same camera angle, same light, nothing else changed — captioned as a visualisation wherever it appears, on the card and in the owner’s notice. A correction that would make no visible difference (a permit, a test, a part swapped out of sight) is given no picture and the card is text.

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
| Refresh | tap | Shown when entries or decisions changed after the draft, or when drafting failed; redrafts. Attaching documents does not stale the draft. |
| Save draft | tap | Saves to the inspector’s Mail drafts for the desktop; the screen then says it is saved and not sent. |
| Recipient | tap | The To: line picks who the notice goes to: the owner on the assessor roll, the demo inbox, or an address typed in. |
| Hold to send | press-and-hold | Sends from the phone; greyed until at least one violation entry has an included option and a recipient is set. It then closes back to Location home; reopening the notice says who it went to and when. |
| ‹ | tap | Back to Location home; the draft is kept. |

Edge cases

- Drafted in plain language per property; code citations stay out of the letter body.
- The correction deadline, the hearing and the appeal windows come from the jurisdiction’s abatement procedure, not from a generic default.
- Compliance-only visits produce a short “no action needed” notice.
- With no owner on the roll — an address geocoded on the spot — the notice says so and the To: line starts empty; choosing a recipient there enables Hold to send.
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
