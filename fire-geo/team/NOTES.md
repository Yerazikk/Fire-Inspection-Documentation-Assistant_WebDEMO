# Inspectors tab: notes

What is on this tab, where every piece of content comes from, what a real product would need that the
sources do not hold, and the judgement calls. Updated 23 Nov 2026, after Andrew's review notes.

## What it is

Two devices on one screen, the same height, linked live.

- **Phone, field inspector.** Camera, the app scans the photo, "Add a note" with the app's suggestion
  already chosen, one question that only a person on site can answer, send.
- **Laptop, senior inspector.** One finding, one way forward, in four steps:
  Finding, How to fix it, For the file, For the owner. The owner's page is the last step and the thing that
  is published, so Publish is a button on that page. There is no separate publish screen.

Findings on this tab are taken in Ross, inside its mapped zone. The place is kept in state and read by
the rules, the owner's page and the file document. There is no control to change it: how the codes change
with the place is the Technology tab's subject. (The small map with a pin was built and then removed.)

Files: `index.html`, `team.css` (stage, shared pieces), `phone.css`, `desk.css`, `adapter.js` (the one place
fire-code data is read from), `flow.js` (what the phone says), `drafts.js` (prepared wording and the guard),
`ui.js`, `photo.js`, `phone.js`, `desk.js`, `desk-draft.js`, `main.js`, `api.js` (the drafting endpoint),
`serve.js` (scratch server), `drive.js`, `test.js`, `shot.js`, `smoke.js`, `promote.js`.

## What comes from the Technology tab (no second copy here)

| Used for | Shared module |
|---|---|
| Rule rows, verdicts, citations, requirement text, "still to confirm" | `FireGeo.codes.evaluate()` |
| The place and its mapped hazard zone (Ross) | `FireGeo.geo.at()` at `FireGeo.geo.pins.ross` |
| Photographs, their size, and the regions found in them | `FireGeo.codes.PHOTOS`, `content.js` annotations |
| Corrections: title, standing, "after" image, alignment, outline | `FireGeo.solutions` |
| The before and after divider, with its "Show what changed" switch | `FireGeo.beforeAfter` |
| Key portions of a quoted requirement | `FireGeo.emphasis.fill()` |
| Tokens, top bar, sliding pills, verdict marks, embedding | `shared/shell.css`, `shared/shell.js` |
| The skin | `shared/gleb/` (on by default, `?gleb=0` turns it off) |

Nothing here is fixed to one photograph: the crop centre is the middle of the finding's own region in the
data, the scan's regions are read from the data, and every frame crops to the photo's own shape. A new
sprinkler photo with new boxes needs no change on this tab.

What `adapter.js` adds is what the field inspector answered. The Technology tab assumes a distance; here it
is typed, estimated or not known. Not known: the shared logic is asked at both ends of its range and every
row whose verdict differs is left to the inspector ("Depends on the distance, which the field inspector did
not give."). An estimate decides the row and the row says it is an estimate. Each range stands for one
distance inside it when the shared logic is asked (5, 20 and 40 ft); that number is never shown.

## The phone: what is said and asked, and where each line comes from

### The scan

The picture goes dim, one line of light travels from the top to the bottom, and what it finds comes back to
full brightness in a rounded window with its name; the finding has the red rim and a white tag. At the end,
or on Skip, every mark leaves in one fade and the photograph is clean on every screen after that. It follows the scan Andrew chose earlier
(`five-futures/fire/final`, `final-scanseq.png`).

| Scene | Lit (region from `content.js` annotations) | Left out |
|---|---|---|
| Sprinkler | "Paint on the sprinkler" (the finding, [0]); "Stains on the ring" ([2]) | the bottom plate ("clean") |
| Hedge | "Bushes reach the tall plants" (the finding, [1]); "Tall plants" ([0]) | dry leaves on the ground |

A side note that has no clean place for its tag (inside the picture, on no other tag or window) is left out.
A photo from the gallery has no regions: the line passes and it says "Nothing was marked."

### Painted sprinkler

| On the phone | Source |
|---|---|
| Note: "This sprinkler has paint on it." | `content.js` sprinkler.summary, annotations[0] |
| Other notes offered | annotations[2] (stains on the trim); `sprinkler.md` "Surrounding ceiling and trim" |
| Question: "What year is stamped on the sprinkler?" | `content.js` sprinkler.identification.markings[2]: "Wrench boss / body hex: Listing marks, year of manufacture" |
| Drawing: the metal block at the top, lit | same line. "Metal block at the top" is our plain wording for the wrench boss |
| Exception: "I can't see a year" | uncertainty "Is the sprinkler expired or recalled?" |
| After a year: "The senior inspector will check its age." | the sources give no age limit, so none is stated |
| Optional close photo, "Don't touch the sprinkler." | identification.evidence[0]; `notAcceptable.body` |

The example year in the drawing ("1998", labelled "for example") shows what a stamp looks like. It is
replaced by what the person types.

### Bushes under tall plants

| On the phone | Source |
|---|---|
| Note: "The low bushes grow right up into the tall plants. Fire could climb from one to the other." | `content.js` ladder.summary, owner.intro |
| Other notes offered | annotations[2]; `ladderfuel.md` "Risk to evacuation and emergency access" |
| Question: "How far are the bushes from the building?" | FireGeo row `ladder-reach`; uncertainty "Is the vegetation within 30 feet of a structure?" |
| Ranges: under 10, 10 to 30, over 30 ft | chosen so that 30 ft, the reach of the rule, is a boundary. "Over", not "More than", so each range is one line |
| "A long step is about 3 ft." | a rule of thumb written here, not from the sources |
| The drawing gets smaller while the number keys are out | so the whole screen fits and "Not sure" stays in view |
| Optional photo with the building | `ladderfuel.md` "Surrounding environment" |

### What was cut from the phone, and why

- The overview list of extra checks, the seven-step sequence, "why it matters" blocks: too much to read.
- "How many other sprinklers are painted?", the spare cabinet, the code on the disc, the bulb colour: not
  about this photograph, or a trade term with no picture.
- "Use a sample": the concept is gone. Tests inject a picture through a hook with nothing on screen.
- The list of what the app read: the field inspector is not asked to review it. It goes to the senior.
- Boxes and tags on the still photograph, the separate "Change wording" button, the location line, the
  label over the scene switch, the hint under the shutter, every demonstration notice.

Every action on both devices is a single tap or click; nothing is pressed and held.
Taps from the shutter to sent: shutter, "Use this note", one answer, send. Hedge: 4. Sprinkler:
3 with no year, 4 with "I can't see a year", 7 with a year (four digits).

## The laptop: where each piece comes from

| Piece | Source |
|---|---|
| Rule rows | `FireGeo.codes.evaluate()` for Ross, with the field answers applied |
| "What the app thinks" | the row's `why` and `applies`, as given by the shared module |
| "Still to confirm" | the row's `open` |
| One field line under the photo | `flow.js` `callouts()`: what was typed, estimated, or not recorded |
| Corrections and their pictures | `FireGeo.solutions` (three for the hedge, one for the sprinkler) |
| Owner's steps per correction | `drafts.js` `OWNER_STEPS`, each written from a named line of `content.js` |
| "What is wrong" on the owner's page | the first sentences of `content.js` owner.intro, plus one from "Why is this dangerous?" when short |
| "Fix by" | owner.when, as stated. Marked to verify in the file document |
| Agency | `FireGeo.codes.place().agency` |
| The line citing the rule | the full citation of each red row |
| File document | `content.js` analysis blocks through `drafts.js` `record()` and `technical()`, plus the rows |

Rewrites. The first drafts are prepared from the sources and call no model. "Ask for a rewrite" on a
correction and "Write my own" POST to `/api/team/draft` (`api.js`). (The owner's page has no rewrite
button: it is edited by clicking and typing.) The endpoint runs the local `claude` CLI with the source material
and nothing about the user or the project. Before a reply reaches the page the server removes any sentence
that carries a section number, a measurement, a deadline or a code name that is not in the supplied
material, and the page says what was left out. `TEAM_DRAFT_FAKE=1` keeps it off the model; if the CLI
cannot be reached a small built-in rewrite answers instead.

## How things are edited and undone

- **A verdict.** Pressing it turns it, in place, into the system's small two-part switch: Violation | Clear.
  From "Inspector's call" neither side has the pill. Pressing the side already chosen takes the decision
  back to the app's own verdict. There is no caption under the row, and the row does not move.
- **A short text** (a note on the phone, a rule's analysis, a correction's steps): the pencil beside it. The
  words stay and become editable where they are; the pencil turns into the tick in the same spot.
- **The two drafts** are documents with nothing above them: click and type. It saves as you type, and undo
  on the keyboard (Cmd or Ctrl + Z; with Shift, redo) takes typing back. Each text keeps its own history,
  so undo never reaches into another text or into a step that is out of sight, and it survives Enlarge.
  (The browser's own undo is one list for the whole page; pressed often enough it changed the hidden file
  document and dropped the caret.) Citations, pictures and the before / after are fixed. Copy and
  Print for the file document sit beside its "Next: for the owner" button.
- **Every reverse action** is the undo symbol, named "Undo".
- **Scroll areas** fade at an edge only when there is more to scroll that way (`.tm-softscroll`, a mask
  driven by `TeamUI.soft`; the shell now has its own `.soft-scroll`, not adopted here yet).
- **Scrollbars.** Only the two long drafts show one (`.tm-thinscroll`): a 4 px thumb in an 8 px lane, the
  shell's look, kept on both sides so the page stays centred. Its track stops short of a round corner by
  that corner's radius (`--scroll-inset-top`, `--scroll-inset-bottom`), so the thumb stays on the straight
  part. Every other scroll area, and the whole phone, shows no bar; the soft edges say there is more.

## What a real product needs that the sources do not hold

1. **Sprinkler age and recall.** The phone collects the year. Nothing decides on it, because the sources
   hold no service-life rule by sprinkler type, no test interval, and no recall list (maker, model, years).
   The senior sees "Check its age against the testing rules and the model against the recall list. The app
   has neither list." A real product needs both lists, from the adopted NFPA 25 edition and the CPSC.
2. **The maker and model.** No marking is readable in the photo (`sprinkler.md`). A real product would
   read the stamp from the close photo.
3. **Pictures for the inspector's own corrections.** The "after" images in the repo were made ahead of time
   by `src-monday/monday/tools/generate.js` with a Gemini image model (`gemini-3-pro-image`, the prompts in
   `tools/prompts.js`), which needs a key this tab does not have and must not look for. So a correction the
   inspector writes gets no picture. The page says so and offers a plan drawn on the photograph instead
   (hatched areas: remove, thin out, replace), labelled as a plan. A real product would call the image
   model here and register the result on the photo as `FireGeo.solutions` does.
4. **Reading a photo.** The two readings are prepared. A photo from the gallery gets "The app could not
   read this photo" and a text box. A real product needs the vision model.
5. **Sending.** Publish, on the owner's page, marks the finding published and tells the phone. Nothing
   leaves the computer, and the line that appears says so. A real product needs the hosted owner's page
   (the preview here is that page), a link sent to the owner, and the file document written to the
   agency's system.
6. **The agency's phone number.** Not in the data. The owner's page says so.
7. **A measured distance.** The phone takes feet or a range. A real product could measure from the photo
   or the parcel map.
8. **Other places.** The rules for San Anselmo, Fairfax and unincorporated Marin are in the shared data and
   `relocate()` in `desk.js` still re-reads a finding for another place, but nothing on this tab calls it.

## Judgement calls

- **Top bar.** The shell's bar is 64 px (`--shell-bar`); this page takes that row from the shell and does
  not hard-code it. The stage is 8 px shorter than before and still fits at 1280 x 720 and 1440 x 900.
- **Stage.** Both devices are the same height. The phone is always 390 x 844, drawn at one scale. The
  laptop is as tall, with a 16:10 screen; in a narrow window the screen is a little squarer (down to
  1.42:1), and past that both scale down together. The laptop's content is fluid, not scaled, so its text
  stays a readable size and the shared divider keeps working.
- **Small sizes.** With the sidebar out the correction's large picture has less room. Down to a 400 px
  pane the picture and its words still sit side by side; narrower than that (1280 x 720 with two findings)
  they become one scrolling column, the picture first and capped by the height there is. Before this the
  words were drawn over the picture in that state (a portrait photograph in a narrow pane), which is what
  the new sprinkler photograph showed at 1440 x 900 with two findings. In a window under 1180 px one device
  shows at a time; the bottom 62 px are left to the page's two corner buttons, so the device's own last
  button is never under them. On a real phone the laptop's later steps are one column too: the list of
  corrections, then the one being looked at; a draft keeps the height of the screen and scrolls inside.
- **Sidebar.** Hidden with no findings and with one. It eases in with the second.
- **Arrival.** The first photo lands straight in the open finding; later ones land in the sidebar and do
  not take the laptop away from the finding being read.
- **Verdict switch under the kit.** The kit's own segmented control has an ink pill. This switch keeps a
  raised white pill with ink words in both looks, as asked ("no dark fills"), so with the kit on it is the
  top tabs' shape and motion but not their fill.
- **"Inspector's call"** cannot be chosen by hand; it is where a row returns when a decision is undone.
- **The scene switch** is centred above the picture, like a camera's mode control. There are 22 px between
  it and the picture, and the same 22 px between the picture and the shutter's ring; the shutter's centre
  stays 85 px above the bottom of the display, so the height comes out of the picture.
- **Round corners.** Content is set in from a rounded edge in step with its rounding: at least 0.58 of the
  radius (28 px inside a 48 px corner), and a line of text that reaches into a corner keeps 0.4 of the
  radius clear of the curve. `test.js` checks every screen in both looks. What it changed: the status
  bar's time and symbols sit further in from the display's corners; note rows, the drawing card, the feet
  field and the example tile have a few px more inside; the before / after tags sit 12 px in, not the
  shared 10; and a sidebar item has no box of its own (its word sat in the curve of the box's corners):
  the chosen one is ringed on its picture.
- **The owner's page** has no side list of blocks: the page itself is edited.
- **Options.** With more than one correction included, the owner's page says "Options for how to fix it"
  and "Pick one of these.", and each heading is "Option N: name" with its standing on a quiet line under
  it (what the inspector asked for; another way, ask your inspector first; from your inspector). The laptop's list and the file
  document carry the same numbers. With one included there is no number.
- **Corrections.** A click on a row looks at it; the check at its right ticks it to use. Hovering does
  nothing. On arrival the required correction is the one looked at, and it is already ticked.
- **The drafts step aside the finding.** At "How to fix it", "For the file" and "For the owner" the photo
  and note on the left give way to the step, which uses the whole screen. The step's button floats at the
  bottom right, with no strip under the page.
- **Publishing.** One click on Publish, which sits on the owner's page (bottom right of the browser
  window). The button leaves, and a line at the foot of the same window says "Published. Sending to the
  owner is not connected yet. Nothing has left this computer.", with Undo. The line takes its own height,
  so it never covers the page. The last breadcrumb gets a tick, the sidebar says "Published", and the
  phone's item says "Reviewed". Sidebar words: To review, Fixes to choose, Draft ready, Published.
- **Enlarge.** Each draft has an Enlarge symbol (on the browser window's bar; at the top right of the
  file document). It opens the same live page over the tab: 92% of the width, from near the top to 66 px
  above the bottom, so the queue and feedback buttons in the bottom corners stay clear. It is editable
  there and the owner's page keeps its Publish button, so the whole review can be done enlarged. Opening
  and closing it keep the reader's place in the page. It does not open on its own: a page that leaves
  the laptop as the step arrives would be a jump nobody asked for.
- **The owner's page layout.** One reading column (720 px). Each option: "Option N: name", its standing,
  the before / after on the same left edge and never taller than six tenths of what is visible, "Show
  what changed" under the picture, then at most four steps. The file document has every step. In a
  short window (1280 x 720) the top of the page is tighter and the photograph flatter, so the first
  screenful still reaches "What is wrong". With the kit on, "Show what changed" has a quiet fill on this
  page: the kit's pale pill cannot be seen on white.
- **Approve, Send and Publish are single presses** with no confirmation. They stay recoverable: the
  breadcrumb leads back after Approve, a sent item is in the phone's Sent list, and Publish has Undo.
- **A double press does not run on.** With one press per action, the second press of a double press
  would land on what comes next: "Use this note" and "Send" sit in the same place on the phone, and the
  laptop's button stays put from step to step. So a phone screen takes presses a third of a second after
  it arrives, the laptop's button ignores a click within a third of a second of a step change, and
  Enlarge and Close each act once.
- **Rows keep their place.** The rules are sorted red, yellow, green once, when the finding opens, from
  the app's own verdicts, and keep that order for the life of the finding. A changed verdict changes the
  row's mark, its word and the counts; nothing moves. (The later steps and the documents still list
  violations first.)
- **Photo with no reading.** It goes through as a note. The laptop attaches no rules and the only step is
  to mark it reviewed.

## Open questions

- Should "Inspector's call" be something the senior can set by hand on a red or green row?
- Should an estimate be allowed to produce a red row, or should it stay yellow until measured?
- Whose name and contact go on the owner's page, and who signs the file document?
- Is the deadline in the sources (30 days for the hedge) the agency's, or a placeholder?
- With the kit on, should the verdict switch take the kit's ink pill to match the top tabs?

## Checking it

`node team/test.js` (headless, scratch server on 8893, drafting on the test switch). It walks every
screen of both devices at four window sizes, and once more with the kit off, with two audits: no control
is cut by what clips it, and no words crowd a round corner. Changes of one thing into another (a verdict,
a step, Publish) are stepped frame by frame.
`node team/shot.js` writes `shots/team-*.png`, including the scan strips and the verdict-switch sheets.
`node team/smoke.js` is the ten-second load check. Changes are staged in `team/next/` and put live with
`node team/promote.js`, which runs the load check first.
