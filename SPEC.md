# Vegetation inspection · V3 — interaction system (source of truth)

Generated from `spec.js`. The app implements exactly these screens and affordances; the in-app “?” shows the current screen’s list.

## Principles

- One primary action per screen, at the bottom. Secondary actions are quiet.
- Tap opens or selects. Press-and-hold acts (reorder, delete, speak, send). Swipe decides (deck). Drag moves (sheet, order).
- Nothing is lost silently: leaving an unsaved record asks; deleting asks; retaking restarts on purpose.
- No confirmation pills or toasts: the result of an action is visible in the UI itself.
- Generated text is always editable in place. The AI drafts, the inspector decides.
- Stale derived documents (report, notice) say so and offer Refresh; they never silently change.

## Global

| Control | Gesture | Result |
|---|---|---|
| R | key | Restart the demo from the map. |
| ? | tap | Show this screen’s affordances. |
| Space | key | Shutter on the camera. |
| ← → | keys | Swipe in the deck. |

## Map (landing) (`map`)

Plan and run the day: the station, today’s stops, their order, and what is done.

| Control | Gesture | Result |
|---|---|---|
| ☰ (top-left) | tap | Opens the menu: previous inspections, profile, settings. |
| Address field | type | Typeahead over known addresses; Enter or tapping a suggestion adds the stop. A pin drops on the map and a row appears in the sheet. |
| Map pin | tap | Highlights the stop row in the sheet and scrolls to it. |
| Sheet handle | drag or tap | Three detents: peek, half, full (Apple Maps style). |
| Stop row | tap | Opens the Location home for that stop. |
| Stop row ➚ | tap | Deep-links to Apple Maps for turn-by-turn (asks first); the app stays where it is. |
| Stop row ≡ handle | drag | Lifts the row instantly and follows the finger; other rows slide out of the way; the route redraws on drop. |
| Stop row | press-and-hold anywhere, then drag | Same lift after a short hold. |
| Stop row ✕ | tap | Removes the stop (asks first if it already has entries). |
| Best route ✦ | tap | AI proposes an order; rows and the route animate into it. Manual reorder still works afterwards. |

Edge cases

- Completed stops show a green check and a struck-through address; they can still be opened and edited.
- Adding a duplicate address flashes the existing row instead of adding a pin.
- With no stops, the sheet shows a hint and the route button is disabled.

## Menu (`menu`)

Everything that is not today’s route.

| Control | Gesture | Result |
|---|---|---|
| Previous inspections | tap | Opens the Days screen. |
| Profile | tap | Shows inspector name, badge, unit, contact. |
| Settings | tap | Jurisdiction, correction window, notice defaults (read-only in the demo). |
| Scrim | tap | Closes the menu. |

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
| Bird’s-eye view | look | Shows the parcel, the inspector’s live position (pulsing dot) and one numbered pip per entry at the spot it was captured. |
| Pip | tap | Scrolls to that entry in the list. |
| Today / History tabs | tap | Today lists this visit’s entries. History lists past inspection dates. |
| New entry (+) | tap | Opens the camera. |
| Entry card | tap | Opens its record for editing. |
| Entry card | press-and-hold | Cards wobble and show ✕. Tap ✕ to delete (asks first). Tap anywhere else to stop wobbling. |
| Finish | tap | Marks the stop complete and opens the wrap-up: a completion card compiles the Internal report and drafts the Notice in front of the inspector, then “See the documents” reveals them on the home with a highlight (asks first if there are no entries). |
| Internal report | tap | Opens the compiled technical document. Shown only after Finish. |
| Notice to owner | tap | Opens the email draft. Shown only after Finish. |
| Reopen | tap | Un-finishes the stop so entries can be added; documents hide again until the next Finish. |
| Next stop → | tap | Back to the map with this stop checked off. |
| History date | tap | Opens the snapshot of that day: same layout, dated banner, read-only, with its pips and entries. |

Edge cases

- Empty Today shows one message and the New entry button; nothing else competes.
- Report and Notice show a “changes since generated” badge when entries changed after they were made.
- Finish with zero entries asks whether to mark the stop as visited with no findings.

## Capture (`camera`)

Get a photo and a note with as few taps as possible.

| Control | Gesture | Result |
|---|---|---|
| Shutter (centre) | tap or space | Takes the photo; the memo bar slides up. |
| Upload (left) | tap | Picks a photo from the library instead of shooting one; continues the same way. |
| Note only (right, keyboard icon) | tap | Skips the photo; opens the memo bar directly. |
| Memo bar | tap | Opens a text box with Submit. |
| Memo bar | press-and-hold | Walkie-talkie: transcribes while held; releasing drops the transcript into the editable box. |
| Use voice instead | tap | Returns from the text box to the bar. |
| Retake / Change photo | tap | Back to the live viewfinder; the memo is kept. |
| Submit entry | tap | Starts the scan on the photo in place (or a note-only analysis). The memo is optional when there is a photo; a note-only entry needs text. |
| Cancel (during scan) | tap | Stops the scan; the photo and memo are kept. |
| ‹ | tap | Back to Location home; asks first if a photo or memo exists. |

Edge cases

- Releasing the mic after less than three words shows “didn’t catch that” and keeps listening available.
- The scan is a single top-to-bottom sweep; blue boxes label what the vision pass recognised; a red box marks a violation, a green box a compliance; it then opens the record by itself.

## Entry record (`record`)

The inspector’s technical record for one entry, editable, with recommendations.

| Control | Gesture | Result |
|---|---|---|
| Original photo | tap | Expands it with a Retake button. Retake restarts the whole entry: new photo, new scan, new notes, new deck. |
| Scanned photo | tap | Expands it with a feedback pill. Sending feedback re-runs the scan with that instruction and updates the notes. |
| Any text line | tap Edit on its card | Lines become editable; Done saves; Revert restores the generated text. |
| Recommendations | tap | Opens the deck. |
| Save | tap | Saves the entry and returns to Location home; a numbered pip appears at the capture position. |
| ‹ | tap | If anything changed: Save / Discard / Keep editing. Otherwise just goes back. |

Edge cases

- Note-only entries have no photo row, no determination and no recommendations; the record shows the raw note, its transcription (if spoken) and the AI summary.
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

A rigorous document compiled from every entry for the file.

| Control | Gesture | Result |
|---|---|---|
| Refresh | tap | Shown when entries changed after the report was generated; recompiles. |
| Section | tap Edit | Editable like the record. |
| Export | tap | Saves a PDF to the case (demo: toast). |
| ‹ | tap | Back to Location home. |

Edge cases

- Includes metadata per entry: time, position, inspector, address.

## Notice to owner (`notice`)

Plain-language email: what we found, what to do, with the approved visuals and attachments.

| Control | Gesture | Result |
|---|---|---|
| Edit options | tap | Reopens the deck for that entry. |
| Find attachments | tap | Searches the department library; each hit has an include toggle. |
| Add your own | tap | Attach a file from the device (demo: adds a placeholder document). |
| Refresh | tap | Shown when entries or decisions changed after the draft; redrafts, keeping manual edits where possible. |
| Save draft | tap | Saves to the inspector’s Mail drafts for the desktop. |
| Hold to send | press-and-hold | Sends from the phone; greyed until at least one violation entry has an included option. |
| ‹ | tap | Back to Location home; the draft is kept. |

Edge cases

- Compliance-only visits produce a short “no action needed” notice.

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
