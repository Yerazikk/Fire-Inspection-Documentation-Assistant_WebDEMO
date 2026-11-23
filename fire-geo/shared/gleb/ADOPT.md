# Adopting the Gleb kit

Andrew asked: "gleb-ify the design components where you can". The kit is a skin: his components and materials
(Natural OS 3.0), your interactions and motion. Preview it first: http://localhost:8861/shared/gleb/kit.html

Written against the pages as they were on 22 Nov, 20:35 (`app.css` 20:17, `team/team.css`, `phone.css`, `desk.css` 20:23).
If you rename a class listed below, tell the kit (or add the `.gl-*` class next to it).

## 1. What to add (two tags per page, nothing else)

In `<head>`, **after your last stylesheet**:

```html
<!-- index.html -->
<link rel="stylesheet" href="shared/gleb/gleb.css">
<script src="shared/gleb/gleb.js"></script>

<!-- team/index.html -->
<link rel="stylesheet" href="../shared/gleb/gleb.css">
<script src="../shared/gleb/gleb.js"></script>
```

- The stylesheet does nothing until `<html>` has the class `gleb`. Every rule starts with `html.gleb`.
- `gleb.js` sets that class before the page paints. It is on by default. `?gleb=0` turns it off, `?gleb=1` turns it
  on, and the choice is kept in `localStorage` (`fire-geo.gleb`), so the embedded Inspectors page follows the shell.
- The script must not be `defer`: it has to run before the body is drawn. It must come after your stylesheets so that
  equal rules resolve in the kit's favour.
- Inter is loaded from `shared/gleb/InterVariable.woff2`. No outside request.

`shared/gleb/test.js` already checks both pages with these two tags put in at run time. Once you add them yourself the
test sees them and stops adding its own.

## 2. Already covered: you need do nothing

These re-skin by tokens alone. The kit re-points your own variables under `html.gleb`:

| Your variable | Becomes |
|---|---|
| `--ink`, `--ink2`, `--ink3`, `--ink-rgb`, `--shade` | his Ink `#192233`, at 100 / 80 / 72 % |
| `--hi`, `--hi-rgb` | his Sky `#6892F8` (focus rings, the map pin and area, the breadcrumb line) |
| `--bg`, body background | his Air (mist with a rose bloom) |
| `--line`, `--line2` | his hairline, ink at 9 % and 16 % |
| `--r-card`, `--r-media`, `--r-row` | 24 (his smallest corner; never 12). `--r-pill` stays a capsule |
| `--font` | Inter, weights 500 and 300 only |
| `--v-red`, `--v-yellow`, `--v-green` | still red, yellow, green; nudged to sit with his palette |
| `--tm-surface`, `--tm-solid`, `--tm-wash`, `--tm-border`, `--tm-radius-*`, `--tm-shadow-photo` | veil fills, no outlines, corner 24 |
| `--flat`, `--spring`, `--soft` | **not touched** |

These classes are mapped onto his components by overrides (part 4 of `gleb.css`):

| Where | Classes covered |
|---|---|
| Shell | `.shell-seg` + `.shell-seg-ind`, `button.shell-pill` (and pressed), `span.shell-pill`, `.shell-glass`, `.shell-label`, `.shell-brand`, `mark.code-key` |
| Technology | `.board > .card`, `.card-title`, `.fix-dots` / `.fix-dot`, `.stepper` / `.step-btn` / `.scrub`, `.row-select`, `.ba-toggle`, `.ba-tag`, `.ba-stage`, `.map-box`, `.notes-veil` / `.notes-sheet` / `.notes-grab` |
| Inspectors, shared | `.tm-btn` (and `is-quiet`, `is-solid`, `is-on`), `.tm-words`, `.tm-steps`, `.tm-ring`, `.tm-box`, `.tm-icon`, `.tm-map`, `.mp-chip`, `.tm-ba`, `.tm-mark-label` |
| Inspectors, phone | `.ph-screen`, `.ph-primary`, `.ph-btn` (and `-dark`, `-quiet`), `.ph-back`, `.ph-round`, `.ph-lens`, `.ph-opt`, `.ph-pick`, `.ph-field`, `.ph-state`, `.ph-veil` / `.ph-sheet` / `.ph-grab`, `.ph-key`, `.ph-pad-display`, `.ph-shot-tile` |
| Inspectors, laptop | `.dk-app`, `.dk-bar`, `.dk-item-btn`, `.dk-crumb` / `.dk-crumb-mark`, `.dk-photo-img`, `.dk-verdict`, `.dk-menu` / `.dk-menu-item`, `.dk-choice`, `.dk-primary`, `.dk-zoom-*` |

## 3. Optional: where a class or a small markup change gets you more of his component

None of these is needed. Each is a small step closer to his frames.

**a. The three verdict choices as his segmented control** (laptop, open rule). Today they are three chips; the
chosen one is ink. His "switch between views of one thing" is one track with a sliding ink pill. You already have
`U.seg`:

```js
// before (desk.js)
st.choices = h('div', { class: 'dk-choices', role: 'group' }, ORDER.map(v => h('button', { class: 'dk-choice', ... })));
// after
st.choices = U.seg(ORDER.map(v => ({ id: v, node: [h('i', { class: 'verdict-mark', 'data-verdict': v }), word(v)] })), st.verdict, v => pick(V, st, v), 'dk-choices');
```

**b. A sheet that asks one thing** can use his decision sheet: up to four blocks and at most two buttons.

```html
<div class="gl-sheet">
  <dl class="gl-sheet-facts"><div><dt>Finding</dt><dd>Sprinkler</dd></div> ... </dl>   <!-- 1 the facts -->
  <h3 class="gl-sheet-question">Send it for review?</h3>                                <!-- 2 the question -->
  <p class="gl-why">One rule is a violation.</p>
  <div class="gl-seg is-wide" data-gl="seg"> ... </div>                                  <!-- 3 the choice -->
  <p class="gl-then">Goes to the senior inspector.</p>                                   <!-- 4 what happens next -->
  <div class="gl-sheet-actions">
    <button class="gl-button" data-gl="hold"><span class="gl-hold-fill"></span><span>Hold to send</span></button>
    <button class="gl-icon-button" aria-label="Close"><i class="gl-icon" data-i="x"></i></button>
  </div>
</div>
```

**c. Sending is a hold in his system and in Andrew's.** The phone's "Send to the senior inspector" is a tap today.
That is behaviour, so the kit leaves it. If you make it a hold, `U.hold` already draws his fill (white at 26 %).

**d. A wait inside a card** can show his one loader, the Light: `<span class="gl-light"></span>`. A wait inside a
button: add `is-loading` to a `.gl-button` and put `<i class="gl-loader"></i>` in it. Neither spins.

**e. New markup** should use the clean classes. All are shown, in every state, on `kit.html`:
`.gl-button` (`is-light`, `is-veil`, `is-small`, `is-wide`, `is-loading`), `.gl-pair`, `.gl-icon-button`, `.gl-chip`
(`is-selected`, `is-suggested`, `is-needs`, `is-working`, `is-small`), `.gl-tag`, `.gl-outline`, `.gl-seg`, `.gl-dots`,
`.gl-row`, `.gl-rowcard` (`is-lit`), `.gl-switch`, `.gl-tick`, `.gl-slider`, `.gl-stepper`, `.gl-readout`, `.gl-field`,
`.gl-error`, `.gl-card`, `.gl-glass`, `.gl-state`, `.gl-sheet`, `.gl-option`, `.gl-steps`, `.gl-loader`, `.gl-light`,
`.gl-icon`. Behaviour, if wanted: `data-gl="seg | hold | slider | switch"` (see the top of `gleb.js`).

## 4. Do not change

- Any gesture, state, transition, duration or easing. The kit sets looks only. Pills still slide with the plain
  ease-out, content still updates in place, entrances do not replay, nothing spins, presses do not bounce.
- Do not add `!important` to beat the kit and do not load `gleb.css` before your own stylesheets.
- Do not use weights other than 500 and 300 in new markup. He has no bold.
- Do not add corners under 24 to a surface. Things you touch are capsules or circles.
- Do not colour a button or a chosen state. Chosen is ink. Sky, ember and leaf mark state only.

## 5. Our component → his component → where it is specified

Spec files are in `~/.figma-session/spec/`, tiles in `~/.figma-session/out/os3b/`. Crops are in `shared/gleb/ref/`.

| Ours | His | Spec | Tile |
|---|---|---|---|
| Top two-tab pill, photo switch, viewfinder switch, device switch (`.shell-seg`) | Segmented | 04 §4.10 | `32-segmented-chips/t-01-01` |
| Map chips, Start over, Sources and notes, `.tm-btn`, `.dk-choice` | Chip (Quiet, Selected) | 04 §4.8 | `32-segmented-chips/t-01-01`, `t-01-02` |
| Status tags that are not controls (`span.shell-pill`, `.ph-state`) | Outline capsule | 04 §4.13 | `32-segmented-chips/t-02-01` |
| Correction dots (`.fix-dots`) | Page dots | 04 §4.11 | `32-segmented-chips/t-01-01` |
| `.ph-primary`, `.dk-primary`, `.ph-btn-dark`, `.tm-btn.is-solid` | Button, Ink | 04 §4.1, §4.5 | `30-buttons/t-01-01`, `t-02-01` |
| `.ph-btn` | Button, Veil | 04 §4.1 | `30-buttons/t-01-01` |
| Hold to approve (`.tm-hold`) | Button, Holding state | 04 §4.5 | `30-buttons/t-01-01` |
| `.ph-back`, `.ph-round`, `.step-btn` | Icon button | 04 §4.2 | `30-buttons/t-01-01` |
| `.ph-opt`, `.ph-pick`, `.dk-menu-item` | Selected: ink with a check | 04 §4.5 | `30-buttons/t-02-01` |
| `.ph-field`, `.tm-words` | Ask input | 03 §4.13 | `30-buttons/t-02-01`, `31-ask-input/t-01-01` |
| Distance stepper | no stepper in his set; his capsule and readout | 04 §4.17, §4.18 | `33-lists-controls/t-01-01`, `34-sheets/t-01-01` |
| The three Technology cards | Card shell | 08 §4.4 | `37-generative-ui/t-09-01` |
| `.shell-glass` inside the devices | Glass | 01 §4.5 | `26-shape-layout/t-01-01` |
| The chosen rule (`.row-select`) | Lit row, one at a time | 08 §4.7 | `37-generative-ui/t-10-01` |
| Rules on the laptop, sent list | Card rows with hairlines | 08 §4.4 | `37-generative-ui/t-09-01` |
| `.ph-sheet`, `.notes-sheet`, `.dk-menu` | Sheet | 04 §4.18 | `34-sheets/t-01-01` |
| `.ph-veil`, `.notes-veil`, `.dk-zoom-veil` | Recede | 04 §4.20 | `34-sheets/t-01-02` |
| Named steps (`.tm-steps`) | Agent sheet step marks, leaf status light | 04 §4.19, 01 §4.11 | `37-generative-ui/t-09-01` |
| Number pad (`.ph-key`) | Keyboard letter key | 03 §4.16 | `43-keyboards/t-01-01` |
| Labels on photographs (`.ba-tag`, `.tm-mark-label`) | Frosted photo chip | 08 §4.4 | `37-generative-ui/t-09-01` |
| Line icons (`.tm-icon`) | Line icons, 24 grid, 1.75 stroke | 02 §4.15 | `27-icons/t-01-01` |
| Checklist box (`.tm-box`) | The well with a tick | 14 (Hold for more) | not opened |

## 6. No counterpart, or a conflict. What was decided

| Thing | Decision |
|---|---|
| The map, its pin, the hazard stipple | Kept. Tokens only: the pin and the chosen area are Sky. |
| Before / after divider and grip | Kept. Corner 24 (his media corner). |
| Red / yellow / green verdict marks | Kept, by Andrew's request. Small, each with a shape and a word. His system has only ember for "needs you". |
| Phone and laptop bodies | Kept. His frames have no bezel, but these are pictures of devices, not the screen. |
| Camera shutter, scan line, line drawings, the owner's page, the file document | Kept. Tokens only. |
| **Loader spins** (his: one turn in 1.2 s). Andrew: nothing spins. | His ring is drawn as he draws it and holds still. It breathes on his 1.2 s beat. |
| **Slider** (his: a pill with a white fill). Andrew: scrub the number, arrows step it. | Andrew's control stays. `.gl-slider` exists for a level, if one is ever needed. |
| **On / off** (his: a leaf switch). Andrew: a checklist with a square box. | "Show what changed" becomes his Selected chip (ink with a check). `.gl-switch` exists for new markup. |
| **Switch size**: printed 72 × 40, drawn 44 × 24. | Printed size is the default; `is-small` is the drawn one. |
| **Body weight**: printed Medium everywhere, drawn Regular for running text. | 500 for anything you act on or scan; 400 for running text under a title. Never bold. |
| **Key phrase in a quoted rule** (`mark.code-key`, ours is bold). | Full ink at 500 inside 400 text at 80 %. |
| **Type sizes**: his five fixed sizes. Technology uses four fluid sizes. | Your sizes stay. Only the family, weights and tracking change. |
| **Chosen = blue** on our pages. His: chosen is ink, never a colour. | Chosen is ink. Sky only marks what is active (pin, focus, breadcrumb line). |
| **Outline pills** (Andrew's tags). His: no outlines on controls. | Controls lose the outline and get a veil fill. Tags that are not controls keep a hairline: his Outline capsule. |
| **Sheet shape**: ours is attached to the bottom edge. His floats with four round corners. | It floats. It still rises from the bottom edge and leaves the same way, at your timing. |
| **Press**: his 0.96 scale and 86 %. Andrew: shrink, no bounce. | Your press scale stays; the kit adds the 86 % opacity. |
| **Chip height**: his 32 or 24. The map chips under the phone are 22. | Left at 22: at 24 the four of them do not fit beside the map. |
| **Sheet corner on the phone**: his 48. | 40, because this phone screen is narrower than his 360. |
| Leaf green | No hex is printed. `#52D98C` is sampled from his tiles. |
