# Adding an example

An **example** is one photograph carried all the way through the product: what the inspector found, the code it is
judged by in each place, what the phone asks in the field, what the senior inspector's desk starts from, what the
owner is told to do, and the before / after pictures of the correction.

All of that lives in **one file**: `examples/<id>/example.js`. There are four, and the pattern to copy is
`ladder` and `sprinkler` — those two were built from the inspector's own gold-standard analyses and are the
quality bar. `daisy` shows how to write a finding whose rule is statewide text, and `firedoor` is the thinnest of
the four (`tools/check-examples.js` lists what it is still missing).

```
node tools/new-example.js <id> "<tab name>" "<title>"   start one
node tools/check-examples.js <id>                       what is still missing
node test.js && node team/test.js                       nothing else broke
```

`tools/new-example.js` writes `examples/<id>/example.js` from `_template/example.js` and adds the id to the list
in `examples/index.js`. **That list is the only other thing in the app that names the examples.** The tab strip,
the phone's camera, the code rows, the drafting desk, the owner's page and both test suites all follow it.

---

## The rule that governs everything here

> **No sentence on any screen may say something no source says.**

Every word of the inspection record is lifted from a real analysis. Every requirement is quoted from the code as
printed. Every verdict is a reading of the quoted text and nothing more. Every field question names the code row
or the content line it comes from. Where something cannot be settled, it is *said* to be unsettled — that is what
`uncertainty`, `open`, `turns` and the yellow verdict are for, and an example with a lot of them is a better
example, not a worse one.

If you find yourself writing a sentence because the screen looks empty without it, stop. Leave it out, or go and
read the document that would support it.

---

## The order to work in

### 1. The photograph, and whether it earns a place

Put it at `assets/<id>.jpg` (or `.png`) and read its pixel size — `aspect` is width / height, written as the
division so it is checkable (`820 / 1474`).

Then write the file's header, before anything else. Four short paragraphs: **the photograph** (what is in it),
**why it is here** (what this example shows that the four already here do not), **words** (which analysis the
record comes from), **law** (which codes were read, from which document, on what date).

"Why it is here" is a real gate. The four shapes so far are:

| shape | example | what it demonstrates |
|---|---|---|
| the verdict changes with the place | `ladder` | local text, a mapped hazard zone, an assumed distance |
| the duty is state law, only the citation moves | `sprinkler`, `daisy` | the same photograph, a different ordinance per town |
| the field inspector's answer moves the verdict | `daisy`, `firedoor` | an exception that turns on a fact only someone there knows |
| the correction has two halves | `firedoor` | the wedge and the sign, marked as two places on one picture |

A fifth photograph of a fifth kind is worth building. A second painted sprinkler is not.

### 2. The inspection record (`content`)

This is `window.CONTENT.<id>`, and the Inspectors tab renders most of it. It needs a real analysis behind it: a
written inspection of that photograph, from someone who inspects. Reflow it into the fields; never rewrite it into
new claims. The three tags carry the standing of a statement through to the screen:

- `confirmed` — the inspector determined it
- `observed` — read off the photograph
- `verify` — it cannot be settled from the evidence available

The annotation boxes are `[left, top, width, height]` as percentages of the displayed image, measured against the
picture. **Exactly one** box is `tone: 'red'`: that is the finding, and the phone's scan and the laptop's crop both
locate it by that tone. The rest are `'cyan'` — what is beside it and matters.

The corrections: the **first** is the inspector's own and carries `badge: 'required'`. Everything else is an
alternative, needs `badge: 'alt'`, and must state its `limit` — the sentence that stops it being read as an equal
choice. A correction that is this repo's proposal rather than the inspector's also carries `proposal: true`
(see `ladder` solution C).

### 3. The law (`law`)

One row per **meaning**, not per citation. If two sections say the same thing in two places, that is one row whose
`by` entry differs per place; if one section means two things, that is two rows.

- `state` rows read the same everywhere. `local` rows carry a `by` map: `ross`, `san_anselmo`, `fairfax`, `marin`,
  and `berkeley` is joined on separately in `data/law.js` from the researcher's `data/city4/law.js`.
- `requires` is the code's **own words**, in curly quotes. Read the real text. `NOTES.md` records which site
  served which chapter and which ones refused; if a document is new, add it to `SRC` in `data/lawbase.js` with its
  `status` (`read` / `blocked` / `repo`) and say in `NOTES.md` what you read and when.
- `applies` says how that section bears on **this photograph**. `open` says what the photograph leaves unsettled.
- `rule` names a verdict rule. `judgement` and `carried` are shared; anything that reads your sections belongs in
  your own `law.rules`, and two examples may not define the same name.
- `short` gives the one-line form: the section number, and the local code that carries it. `WUI`, `FIRE` and `PEN`
  in `data/lawbase.js` are the three maps of local codes.
- Every fire-code finding also carries `CM.penalties()` from `examples/common.js` — the penalty clause, amended
  into a different section in every town.

**The verdicts.** Three only:

- **red** — the photograph settles it and the inspector confirmed it. A painted head, a tap in a tap, a wedge
  under a fire door. Nothing that depends on a measurement or a reading is red.
- **yellow** — "Inspector's call". It depends on something the photograph cannot settle, and `why` says *what*,
  in 70 characters or fewer, beginning "Depends on …".
- **green** — the cited text does not reach this case.

`overallLine` is the reason under the verdict headline: five or six plain words, no citation, no year, no section
number. A string where it never changes (`'A tap fed from a tap.'`); a function `(P, c, verdict, rows)` where it
does, returning `null` to fall through to the generic line.

`across` is the one sentence said when the map flies to the other region.

### 4. The field app (`field`)

What the phone shows. The rules, from Andrew on 22 November:

1. The app answers everything it can. The person is asked only what a photograph cannot tell.
2. A question is allowed only if it is about **this photograph and what is in it**. Nothing about the rest of the
   room or the building. Nothing the person would have to go and survey.
3. One screen, **at most three** questions, answered by tapping. Fewer is better. None is fine.

- `reading` — what the app thinks is being reported, in words a person with no training reads, plus the other
  readings a tap offers.
- `scan` — what lights up: the finding, and at most two things beside it. Each names an annotation by index; the
  region is read from that annotation, never written here.
- `seen` — the readings the app fills in itself. The **first** option is the app's own reading; the others are what
  "Change" offers. `'Not sure'` belongs on anything a visitor to a building may genuinely not know.
- `questions` — each needs something to tap, type or write, a `cant` way out for someone who cannot tell, and a
  `source` saying where it comes from and why it is asked. Good questions are the exceptions in the cited text:
  the two in `daisy` are exactly the two exceptions in CFC § 603.5.2.
- `facts(a, c, h)` — the answers as plain facts for the rows.
- `callouts(f, ctx)` — the one or two things the senior inspector should act on, each a short line and a full
  sentence. **Nothing here decides a verdict.** It says what was read and what has to be settled, and by whom.
- `apply(f, ctx)` — what the answers do to the rows on the desk. Most readings only add a `lead` line. Change a
  row's verdict **only** where the answer genuinely settles it, and where the photograph never could: a cord run
  under a door is § 603.5.3 confirmed; a door that will not latch is § 705.2.4 failed.

### 5. The owner's steps (`ownerSteps`)

One numbered list per correction, keyed by its id. Each step is one concrete action and says where to stop or what
must stay. The second item of each pair is where the step comes from in the content above. **No section numbers,
no trade words** — the owner's page is written for someone who has never heard the term "ladder fuel". The page
shows the first four steps, so anything the owner must not miss belongs in them.

### 6. The pictures and the contour

The "after" pictures live in `assets/after/` (packed by `tools/topack.js` from `tools/work/`). Then the contour of
what changed, so the "Show what changed" switch has a shape to draw:

- a photographed or edited pair that registers: `tools/register.js` fits them and writes the contour to
  `data/outlines.js`. The residual has to come in under 0.6 px.
- a pair drawn whole, which cannot register: `tools/daisy-outline.js` takes a blurred difference instead, and
  records `fit.how` saying so. Marking a shape by hand is allowed and also goes in `fit.how`.
- no contour at all is allowed: the switch is simply hidden for that correction.

### 7. Check, and prove nothing else moved

```
node tools/check-examples.js <id>     until it says "ready"
node test.js                          150+ pass
node test.js --plain                  the same with the Gleb kit off
node team/test.js                      the Inspectors tab
```

`tools/check-examples.js` runs ~1,800 checks per example: that every row has a source and a verdict and a reason
under 70 characters, that every yellow row says what it depends on, that nothing uses an em dash, that the scan
points at an annotation that exists, that every question has a provenance, that every set of field answers
produces at least one callout with no `undefined` in it, that every picture is on disk. It will not tell you
whether you read the law correctly. Nothing can; that is what the sources in `NOTES.md` are for.

---

## Where it all plugs in

Nothing outside `examples/` names an example. These read the registry (`examples/registry.js`):

| module | what it takes |
|---|---|
| `lib/codes.js` | `photos()` the tabs · `rules()` the verdict rules · the example's `overallLine` |
| `data/law.js` | `lawRows()` `lawShort()` `lawAcross()`, then joins Berkeley's rows on by meaning |
| `data/content.js` | `content()` → `window.CONTENT` |
| `lib/emphasis.js` | `phrases()` the key portions marked in a quoted requirement |
| `team/flow.js` | the four phone tables, and `facts()` / `callouts()` |
| `team/adapter.js` | `apply()` — what the field answers do to a row |
| `team/drafts.js` | `ownerSteps()` |
| `team/phone.js` | `zoom` — how far the cropped photograph is pulled back |
| `app.js` | `statewideNote` — this example's note in "Sources and notes", if it has one |

Load order, in both `index.html` and `team/index.html`:

```
data/lawbase.js        the places, the documents, the local code maps
examples/registry.js   the collector
examples/common.js     rows more than one example carries
examples/index.js      the id list; pulls each example in, in order
data/content.js        binds window.CONTENT
data/law.js            collects the rows, joins Berkeley
```

The three node suites (`test.js`, `team/test.js`, `team/api.js`) read `FireExamples.files()` instead of naming the
example files, so they need no change either.
