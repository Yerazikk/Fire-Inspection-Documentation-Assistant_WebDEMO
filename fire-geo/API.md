# fire-geo: shared data, logic and shell

Everything here is plain script, no build step, no modules. Paths are from the server root (`/`), so from
`/team/index.html` use absolute paths (`/lib/codes.js`) or `../`.

Status: built and tested 2026-11-22. `node test.js` (Gleb kit on, the default) and `node test.js --plain` (kit off)
both pass, 149 checks each. The "Changed" list is at the bottom; the newest entries are the fifth place (Berkeley),
the pin helper, and the one-document shell.

## 0. Read this before using the code rows

Do **not** read code rows from `window.JURIS.jurisdictions[...]`. That file is an untouched copy of the repo's
`monday/jurisdictions.js`, and it is out of date: Fairfax and the county moved to the 2025 codes on 1 Jan 2026, and
Fairfax's ladder-fuel distance is 30 ft now, not 100 ft (NOTES.md § 1). Use `FireGeo.codes.evaluate()`. `JURIS` is
only used for the basemap bounds, the town polygons and the three town pins.

## 1. Include order

```html
<link rel="stylesheet" href="/shared/shell.css">        <!-- tokens, top bar, nav pill, shared primitives -->
<link rel="stylesheet" href="/lib/beforeafter.css">     <!-- only if you use the divider -->
<!-- your own stylesheet(s) here -->
<link rel="stylesheet" href="/shared/gleb/gleb.css">    <!-- the Gleb kit: last stylesheet, then its script, not deferred -->
<script src="/shared/gleb/gleb.js"></script>

<header class="shell-bar" data-shell="inspectors"></header>   <!-- "technology" on / ; "inspectors" on /team/ -->

<script src="/data/jurisdictions.js"></script>   <!-- window.JURIS   (repo copy: basemap bounds, town polygons) -->
<script src="/data/content.js"></script>         <!-- window.CONTENT (repo copy: the two inspections, corrections text) -->
<script src="/data/hazard.js"></script>          <!-- window.FIREGEO_HAZARD   (Ross Valley Fire map polygons) -->
<!-- optional, the fifth place (§ 10). Leave these three out and there are four places, exactly as before: -->
<script src="/data/city4/law.js"></script>       <!-- window.FIREGEO_CITY4           (Berkeley: rows, sources) -->
<script src="/data/city4/boundary.js"></script>  <!-- window.FIREGEO_CITY4_BOUNDARY  (city limit) -->
<script src="/data/city4/zones.js"></script>     <!-- window.FIREGEO_CITY4_ZONES     (three fire zones) -->
<script src="/data/corridor.js"></script>        <!-- window.FIREGEO_CORRIDOR (optional: the map between the two regions) -->
<script src="/data/law.js"></script>             <!-- window.FIREGEO_LAW      (the code rows, with sources) -->
<script src="/data/outlines.js"></script>        <!-- window.FIREGEO_OUTLINES (generated contours + image alignment) -->
<script src="/lib/geo.js"></script>              <!-- FireGeo.geo -->
<script src="/lib/codes.js"></script>            <!-- FireGeo.codes -->
<script src="/lib/emphasis.js"></script>         <!-- FireGeo.emphasis (key words of a rule's text) -->
<script src="/lib/solutions.js"></script>        <!-- FireGeo.solutions -->
<script src="/lib/beforeafter.js"></script>      <!-- FireGeo.beforeAfter (DOM component, optional) -->
<script src="/lib/pindrag.js"></script>          <!-- FireGeo.pinDrag (the one way a pin is moved on a map, § 5b) -->
<script src="/shared/shell.js"></script>         <!-- fills .shell-bar, slides the nav pill, window.Shell -->
```

`geo.js`, `codes.js`, `solutions.js` touch no DOM and also load in node (`vm` with a `window` object: see the first
lines of `test.js`). The three `data/city4` files must come before `data/law.js` and `lib/geo.js`.

## 2. `FireGeo.geo`

There is ONE world. Its pixels are the Ross Valley basemap's pixels: (0, 0) is that picture's top-left corner.
Berkeley's picture was drawn at the same ground scale with the same Web Mercator maths, so `toXY` works for a
Berkeley point unchanged and returns large numbers (that picture's top-left corner is at world pixel 4768, 2070).

| Member | Meaning |
|---|---|
| `map` | `{ src:'assets/rossvalley.jpg', w:1640, h:1289, west, south, east, north, credit }` (the Ross Valley picture) |
| `regions` | `{ rossvalley, berkeley? }`, each `{ id, name, src, x, y, w, h, west, south, east, north, view:{x0,y0,x1,y1}, attribution }`. `x, y, w, h`: where the picture sits in the world. `view`: the 1344 x 1289 world pixels shown when a map rests on that region |
| `regionOf(lon, lat)` → `'rossvalley'` or `'berkeley'` | Berkeley when the point is on Berkeley's picture, else the Ross Valley |
| `toXY(lon, lat)` → `[x, y]` | world pixels |
| `toLonLat(x, y)` → `[lon, lat]` | the inverse |
| `clamp(lon, lat, region?)` → `[lon, lat]` | kept on that region's picture (default: the region the point is in) |
| `locate(lon, lat)` → place id | `'ross' 'san_anselmo' 'fairfax'` (towns) · `'marin'` (unincorporated, the Ross Valley fallback) · `'sleepy_hollow' 'san_rafael' 'larkspur'` (named, not carried) · `'berkeley'` · `'east_bay'` (on Berkeley's picture, past its city limit: not carried) |
| `hazardAt(lon, lat, placeId?)` → `{ scope, classes, label, zone?, zoneName? }` | `scope`: `'in'` a mapped zone · `'out'` (outside every polygon of a place that has them) · `'unknown'` (no layer for this place). `classes`: subset of `['wui','high','moderate']` in the Ross Valley; in Berkeley one of `['mitigation']`, `['very-high']`, `['high']` or `[]`. `label`: plain words |
| `at(lon, lat)` → `{ place, scope, classes, label, zone, zoneName, region }` | everything in one. `zone` is `null` in the Ross Valley. In Berkeley it is `'mitigation'`, `'very-high'`, `'high'` or `'none'` (tested in that order: the mitigation areas lie inside the Very High zone); past the limit `'unknown'`. `zoneName`: `'Grizzly Peak Mitigation Area'` or `'Panoramic Mitigation Area'`, else `''` |
| `areas` | `[{ id, name, kind:'town'|'other'|'district', region, rings:[[[lon,lat],…]], labelAt:[lon,lat]|null }]` |
| `hazardZones` | `[{ town, cls, name, rings, holes }]`. Ross Valley Fire map: `cls` `'wui'|'high'|'moderate'`. Berkeley: `town:'berkeley'`, `cls` `'mitigation'|'very-high'|'high'` |
| `inZone(lon, lat, zone)` → boolean | inside one of the zone's rings and not inside one of its holes |
| `pins` | `{ ross, san_anselmo, fairfax, marin, berkeley? }` each `[lon, lat]`. `marin` is NOT the repo's pin (that one is inside Sleepy Hollow). `berkeley` is a house lot inside the Grizzly Peak Mitigation Area |
| `path(rings)` → string | SVG path data in world pixels (for Berkeley give the SVG `viewBox="4768 2070 1640 1642"`) |
| `trip(a, b)` → `[km, bearing]` | great circle between two `[lon, lat]` points. Ross to the Berkeley pin: 27.7 km at 106 degrees |
| `corridor` | the picture of everything between the two regions, or `null`: `{ src:'assets/corridor.jpg', w:3160, h:1976, scale:0.4, x:-700, y:-760, worldW:7900, worldH:4940, places:[{name, kind:'city'|'town'|'water', lon, lat}], attribution }`. `x, y, worldW, worldH` place it in the world; names are in `places`, not baked into the picture |
| `hazardSource`, `berkeleySource` | where the zone polygons come from: `{ title, publisher, page, map, modified, fetched }` |

## 3. `FireGeo.codes`

```js
const where = FireGeo.geo.at(lon, lat);
const ev = FireGeo.codes.evaluate({
  photo: 'ladder' | 'sprinkler',
  place: where.place,
  distance: 20,                 // feet, assumed; the ladder photo only. Default codes.DISTANCE.default (20)
  scope: where.scope,           // default 'unknown'
  zone: where.zone,             // Berkeley only; null elsewhere
  hazardLabel: where.label      // optional, shown as the 'zone' fact
});
```

returns

```js
{
  photo, place, distance, scope, zone,
  carried: true,                       // false for sleepy_hollow, san_rafael, larkspur, east_bay
  placeInfo: { id, name, short, inSentence, kind, carried, region?, agency, agencyShort, agencyCite, fireCode?, wuiCode?, why?, sources },
  state:  [Row],                       // depends on the photo only: identical for every place, zone and distance
  stateNote: '',                       // no longer shown
  local:  [Row],                       // [] when not carried
  facts:  [{ key:'agency'|'fire-code'|'wui-code'|'zone', label, value, cite, was }],   // only 'agency' when not carried
  overall: { verdict:'red'|'yellow'|'green', word, tally:{red,yellow,green}, decidedBy:'row key', line:'six words at most, no citation' },
  sources: [{ short, label, url, status:'read'|'blocked'|'repo' }]
}
```

`Row`:

```js
{
  key: 'ladder-reach',                 // the row's meaning; stable across places. Use it as the DOM key
  layer: 'state' | 'local',
  label: 'Ladder fuels',               // short, for a one-line row. Can differ by place for one row (remodel-triggers)
  title: 'Ladder fuels cleared to',    // long form
  value: 30, unit: 'ft',               // the number that matters, or null and ''
  phrase: ['within ', ' ft'] | null,   // how the value joins the name on one line: "Ladder fuels · within 30 ft"
  sec: '§ 604.6(7)',                   // the section number. The same in the four Ross Valley places; Berkeley's own there
  quiet: null,                         // if set, show this instead of `sec` on a one-line row ('Guide p. 17')
  code: 'RMC ch. 14.16',               // the local code that carries it: this is what changes at a town line
  cite: 'Town WUI Code § 604.6(7) · RMC ch. 14.16',     // the full citation
  citeShort: null,                     // Berkeley rows: the same citation without the ordinance number, for the main view
  requires: '“Ladder fuels shall be removed within 30 feet of the structure.”',   // the ordinance's words (curly quotes = verbatim)
  brief: null,                         // Berkeley rows: the one passage of `requires` the main view shows, cut out word for word
  applies: 'how it applies to this photograph',
  open: 'what the photograph cannot settle, or empty',
  verdict: 'red' | 'yellow' | 'green',
  word: 'Violation' | 'Inspector’s call' | 'Compliant',
  why: 'a few words, 70 characters at most. Every yellow says "Depends on …"',
  was: { value:100, unit:'ft', until:'31 Dec 2025', cite:'CFC § 4907.4(7) as added by FMC § 8.04.100 · Ord. 873 (2022)' } | null,
  extra: 'a difference that is not a number, or empty',
  source: { short, label, url, status:'read'|'blocked'|'repo' }
}
```

Do not reword `why`: the Inspectors adapter reads phrases out of it (" at N ft", "This is N ft.").

Row keys. Ladder, local, in display order: `zone-zero` (B) · `ladder-reach` · `vertical-spacing` (B) ·
`shrub-spacing` (B) · `hazard-veg` · `canopy` (not in Berkeley) · `roadside` · `brush-nuisance` (Fairfax only) ·
`fire-hazard` (county only) · `compliance-plan` (B). Ladder, state: `state-defensible`. Sprinkler, state:
`maintenance` · `itm-standard` · `residential`. Sprinkler, local: `required-system` · `remodel-triggers` ·
`out-of-service` · `replacement-head` (B). (B) = Berkeley only.

Verdict rules and the expected-value tables: NOTES.md § 4 and § 9. In one line: in the Ross Valley the ladder photo
is red where `scope` is `in` and `distance` ≤ 30, otherwise yellow. In Berkeley it is red within 30 ft in the Very
High zone (mitigation areas included), with the Zone 0 row also red within 5 ft in a mitigation area, and yellow
everywhere else. The sprinkler photo is red everywhere.

Other members:

| Member | Meaning |
|---|---|
| `VERDICT` | `{ red:{word:'Violation',shape:'square'}, yellow:{word:'Inspector’s call',shape:'triangle'}, green:{word:'Compliant',shape:'circle'} }` |
| `DISTANCE` | `{ min:0, max:150, step:1, default:20, unit:'ft' }` |
| `PHOTOS` | `[{ id:'ladder', tab:'Ladder fuel', title, finding, photo:'assets/ladderfuel.jpg', aspect, usesDistance:true }, { id:'sprinkler', … usesDistance:false }]` |
| `place(id)` | the place record (`placeInfo` above) |
| `zoneFor(distance)` → `{ id, label }` | `Zone 0 · 0 to 5 ft`, `Zone 1 · 5 to 30 ft`, `Zone 2 · 30 to 100 ft`, `Past 100 ft` (no longer shown on the Technology page) |
| `diff({ photo, from:{place}, to:{place} })` → string | ONE short plain sentence about what is different in the place arrived in, with no citation and no history: "Fairfax adds a dry-brush rule." `''` inside one place. Between the two regions the place arrived in states its own rule: "In parts of Berkeley’s hills nothing that burns may stand within 5 ft of the house." / "In Ross the rule is ladder fuels within 30 ft." |
| `disclosure` | the "this is a demonstration" sentence. On the Technology page it is in the "Sources and notes" sheet only |
| `sources` | every Ross Valley source record, keyed (`rossPage`, `ff900`, …). Berkeley's are on its place record |

Status words I show for a source (in the sheet only): `read` → "read on 22 Nov 2026", `blocked` → "this site would
not open", `repo` → "from the project notes, not re-read at the source", `secondary` → "a summary by others, not an
official source".

## 4. `FireGeo.solutions`

```js
FireGeo.solutions.list('ladder')   // → [Solution, Solution, Solution]   ('sprinkler' → one)
FireGeo.solutions.get('ladder', 'a')
```

`Solution`:

```js
{
  id: 'a', photo: 'ladder',
  title: 'Remove the lower tier of bushes',
  plain: 'Take out the low hedge under the tall plants. The tall plants stay.',
  lede: 'The correction the inspector specified.',
  standing: 'required' | 'alternative',                          // kept in the data; the Technology page no longer shows it
  standingText: 'Inspector-preferred · required correction',     // content.js badgeText, dash replaced
  limit: 'string or null',            // content.js `limit`: why an alternative needs approval
  imageNote: 'string or null',
  before: 'assets/ladderfuel.jpg',    // the inspection photograph
  after:  'assets/after/ladder-a-remove-hedge.jpg',
  aspect: 0.5563,                     // width / height of the BEFORE image; the stage uses this
  align:  { sx, sy, dx, dy },         // how to draw AFTER so it registers on BEFORE, as fractions of the stage:
                                      //   width = sx * 100%, height = sy * 100%, left = dx * 100%, top = dy * 100%
  outline: [ { points:[[x,y],…], label:'lower tier removed', labelAt:[x,y], anchor:[x,y] } ]
                                      // one closed, simple contour (6 to 16 points) of what changes, x and y in 0..1
                                      // of the stage. `anchor` is a point ON the drawn curve: the leader starts there
}
```

Image paths are relative to the server root. From `/team/` pass `base: '/'` to the component, or prefix them.

## 5. Before / after divider: `FireGeo.beforeAfter(el, opts)`

```js
const ba = FireGeo.beforeAfter(document.querySelector('#stage'), {
  solution,            // a Solution from above
  base: '/',           // prefix for image paths (default '')
  position: 0.5,       // divider, 0..1 from the left. Left of it is BEFORE
  outline: 'toggle',   // 'toggle' (default): a "Show what changed" switch under the picture, off until pressed
                       // 'on': the outline is always shown and there is no switch · 'off': never
  shown: false,        // the switch's first state in 'toggle' mode
  caption: false,      // false leaves out the two-line caption under the picture (default: shown)
  tags: { before: 'Before', after: 'After · illustrative' },    // the words on the two tags in the picture
  switch: false        // 'toggle' mode without the built-in button: your page has ONE switch of its own and calls ba.outline(on).
                       // Use it when you swap instances, so the switch never appears twice or moves (default: built-in button)
});
ba.set(0.4);  ba.get();                 // move / read the divider
ba.outline();  ba.outline(true);        // read / set "Show what changed"
ba.update({ solution: other });         // swap correction: the AFTER image crossfades, the divider and the switch stay
ba.update({ shown: true, position: 0.3 });
ba.destroy();
```

Give `el` a width; the stage keeps `aspect`. Direct pointer drag anywhere on the picture, arrow keys (1% per press,
Shift 10%), Home / End, `role="slider"`. Events on `el`: `ba:change` (`detail.position`) and `ba:outline`
(`detail.on`).

"Show what changed", when on: a clean white line (2.75 px, a soft shadow, no dark edge) draws on around the change,
pulses once, and its label appears on a solid pill at the end of a leader that starts on the line. Everything outside
the shape on the AFTER side eases 30% darker (one even-odd path from the same geometry, about 420 ms). Switching it
off is a fade, never a cut: the line, its leader, its label and the dim all ease out over about 240 ms, and switching on
again in the middle carries on from where they were. When the correction is swapped the outline that is leaving finishes
its fade before the new one is drawn. With reduced motion it is simply shown: a static dim, no drawing on, no pulse. The switch is
`button.shell-pill.ba-toggle` (`aria-pressed`); the Gleb kit draws its on state as ink with a check.

## 5b. The pin: `FireGeo.pinDrag(el, opts)` (`lib/pindrag.js`)

The one way a pin is moved on a map, on both tabs. Andrew: "when i tap on the map i dont want the pin to disappear
and appear at my mouse, i want it to quickly slide to my mouse but stay movable as i hold".

- Press **away from the pin**: the pin slides to the pointer from where it is. It is moving in the first frame after
  the press and reaches the pointer in 140 to 180 ms (longer for a longer trip), on a plain ease-out with no
  overshoot. It is never hidden and never jumps. The end of the slide is live: move the pointer while the pin is on
  its way and it heads for where the pointer is now. The moment it arrives it locks on, and until release it follows
  every pointer move directly, with no threshold and no easing.
- Press **on the pin** (within `grip` px): no slide. It is held where it was gripped.
- A **quick tap** (released before the pin arrives): the pin finishes its slide to the tap point.
- **Reduced motion**: the pin is placed at the pointer on press.
- Every position on the way goes through `opts.move`, so the town, the lit area and the panel follow the pin where
  it is DRAWN, during the slide as during a drag. Do not save a change of state up for the end.

```js
const hold = FireGeo.pinDrag(mapBox, {
  where: () => { const r = pinEl.getBoundingClientRect(); return [r.left, r.top]; },   // the pin's point on screen, now
  move:  (x, y, phase) => { const p = lonLatAt(x, y); setPin(p[0], p[1], phase !== 'drag'); },
                         // put the pin's point at client (x, y). phase: 'slide' (one frame of the catch-up, inside
                         // requestAnimationFrame) · 'drag' (locked to the pointer, from the pointer event itself)
                         // · 'place' (reduced motion: placed on press)
  start:  e => { stopMyOwnGlide(); },     // a press began. Return false to refuse it (the map is busy): nothing moves
  end:    (e, how) => {},                 // the press ended ('up' | 'cancel'). A tap's slide may still be finishing
  settle: () => {},                       // the pin has come to rest
  grip: 20,                               // px around the pin's point that count as "on the pin"
  ms: [140, 180], far: 480,               // shortest and longest time to reach the pointer; the trip (px) that takes the longest
  reduced: () => matchMedia('(prefers-reduced-motion: reduce)').matches
});
hold.stop();      // end a slide where it is: call it before you move the pin yourself (a chip, the arrow keys)
hold.busy();      // a press is down or a slide is finishing
hold.destroy();
```

The element gets `touch-action: none`, the pointer is captured, and a press never selects text. Mouse, touch and pen
take the same path; there is no separate click handler. Shortcut pills keep their own, slightly longer glide.

## 6. Shell: `shared/shell.css` + `shared/shell.js`

- `<header class="shell-bar" data-shell="technology|inspectors"></header>` is filled by `shell.js` with the brand
  and the two-item sliding pill: Technology (`/`) and Inspectors (`/#inspectors`). Anything you put inside the header
  is moved to its right side (`[data-shell-right]`). The bar is 56 px tall. The two tabs are views in one document:
  see § 9.
- The pill slides with a plain ease-out and no overshoot. Do not add your own transition to it.
- `Shell.tabs(el, onChange)` wires a `.shell-seg` of `<button data-value>` (click, arrow keys, the pill slides).
  `Shell.seg(el)` re-places a pill after you change `.on` yourself. `Shell.watch(el)` keeps it placed on resize.
  `Shell.build(headerEl)` fills a `.shell-bar` you add after load (the one in the HTML is filled automatically).
  `Shell.reduced` is the reduced-motion media query, `Shell.FLAT` the ease-out curve.
  `Shell.where(text)` sets the quiet words after the brand (the region on screen: "Ross Valley" or "Berkeley").
- **Sliding thumbs.** The thumb of every `.shell-seg` sits above the labels and carries its own copy of them
  (`.shell-seg-over`, built by `Shell.seg`), clipped to its shape. A label therefore changes colour exactly at the
  thumb's edge while it slides, never half and half. Nothing to do on your side; do not style label colours with a
  transition.
- **Soft scroll edges.** `Shell.softScroll(el)` (class `.soft-scroll`): where a scroll area has more to scroll, its
  content fades out over up to 28 px at that edge. It is a mask on the scroll container driven by its scroll
  position (`--soft-top`, `--soft-bottom`), not a coloured overlay, and there is no mask while nothing is cut off.
  Call it once for every element that scrolls (Andrew's rule: a scroll area never ends in a hard cut).
- Tokens (use these, do not redefine): `--bg #eef0f3`, `--ink #262a31`, `--ink2 #6b7280`, `--ink3 #9aa1ad`,
  `--ink-rgb`, `--line`, `--line2`, `--hi #4667f5` (chosen / done only), `--hi-rgb`, `--hi-soft`, `--v-red`,
  `--v-yellow`, `--v-green` (verdict marks only, never large fills), `--r-card 24px`, `--r-media 18px`,
  `--r-row 12px`, `--r-pill 99px`, `--flat cubic-bezier(.22,1,.36,1)`, `--spring` (travel only), `--soft`, `--font`.
  The Gleb kit (`shared/gleb/`, on by default, `?gleb=0` turns it off) re-points most of them under `html.gleb`;
  it does not touch `--flat`, `--spring` or `--soft`.
- Primitives: `.shell-glass` (glass card), `.shell-pill` (pill button; chosen when `aria-pressed="true"` or `.on`),
  `.shell-seg` + `.shell-seg-ind` (add `.is-wide` to fill the row),
  `.verdict-mark[data-verdict=red|yellow|green]` (square / triangle / circle that crossfade; no attribute = dashed
  ring; `.is-large` = 20 px; always put the word next to it), `.shell-label`, `.shell-num` (tabular figures),
  `mark.code-key` (a key phrase in a rule's text).
- Class names the Gleb kit's overrides target, which therefore stay as they are: `.shell-seg`, `.shell-seg-ind`,
  `button.shell-pill`, `span.shell-pill`, `.shell-glass`, `.shell-label`, `.shell-brand`, `mark.code-key`, and on the
  Technology page `.board > .card`, `.card-title`, `.fix-dots`, `.fix-dot`, `.stepper`, `.step-btn`, `.scrub`,
  `.row-select`, `.ba-toggle`, `.ba-tag`, `.ba-stage`, `.map-box`, `.notes-veil`, `.notes-sheet`, `.notes-grab`.
- No one- or two-letter class names anywhere; shared classes start with `shell-` or `verdict-`. `shell.css` resets
  margins on headings, lists and `body`, and sets the page background.
- Andrew's Feedback pill is fixed at the bottom right (38 px tall, 22 px from the edges) and the queue pill
  (`/progress/pill.js`) at the bottom left. Keep both corners clear.

## 7. Server (`server.js`, port 8861, kept alive by launchd `com.andrewdong.fire-geo`)

- Static files from the project root, `cache-control: no-store`. A directory resolves to its `index.html`
  (`/team` redirects to `/team/`), so `/team/` and `/team/resident/` work as soon as those files exist.
- `/team/` without `?embedded` or `?standalone` redirects to `/#inspectors` (§ 9).
- Any request under `/api/team/` is handed to `team/api.js` when that file exists and exports `handle(req, res)`
  (or is itself a function). It is loaded on first use and reloaded when the file changes, so no restart is needed.
  `handle` may return a boolean or a Promise. If the file is missing, fails to load, throws, or returns `false`,
  the answer is `503 {"error":"drafting not available"}`. The environment is passed through unchanged.
  `test.js` never calls `/api/team/*` (it answers those requests inside the test browser).
- `/api/feedback*` is Andrew's feedback mode (`feedback-api.js`). Include `<script src="/feedback-mode.js"></script>`
  before `</body>` on every page.
- `/progress/` is the coordinator's page, served as static files with no caching.

## 8. The Technology page itself (for tests and screenshots)

URL parameters: `?photo=ladder|sprinkler`, `&pin=ross|san_anselmo|fairfax|marin|berkeley` or `&pin=<lon>,<lat>`
(either region), `&d=<feet>`, `&sol=a|b|c`, `&pos=<0..1 divider>`, `&sel=<row key>`, `&change=1` ("Show what changed"
on), `&notes=1` (the sheet open), `&solo=1` (do not preload the other view), `&gleb=0|1` (the kit).

`window.APP`: `state` (`photo, lon, lat, place, scope, zone, zoneName, region, distance, sol, selected, showChange`),
`setPin(lon, lat)` (at once, in either region), `goto(placeId)` (what a pill does: a glide inside the region on
screen, a flight to the other one), `camera()` → `{ x, y, z, flying }`, `toClient(lon, lat)`, `setDistance(ft)`,
`setPhoto(id)`, `setSolution(id)`, `select(rowKey)`, `divider()`, `evaluate()`, `notes.open()` / `notes.close()`,
`corridor()` → `{ done, ok, ready (a Promise) }`, and `pose(placeId, k)`: draw the trip to a place at time `k` in 0..1 with
the clock stopped (k = 0 starts a trip from where things are, k = 1 lands), for looking at a flight frame by frame.
`document.body.dataset.ready === '1'` once it has drawn.

## 9. One document, two views (2026-11-22, replaces the page-to-page transition)

Andrew: "preload and cache views, rn when i switch between them they flash and reload". The two tabs are now views
inside ONE document, the shell page at `/`. Both are loaded ahead of time and never destroyed. A switch crossfades
them (about 220 ms, old and new overlap), the pill slides with a plain ease-out, the address changes with
`history.pushState` (`/` and `/#inspectors`), back / forward work, and each view is exactly as it was left.

- **Technology** is the shell page's own content, in `<div class="shell-view" data-view="technology">`.
- **Inspectors** is `/team/?embedded=1` in an `<iframe>` inside `<div class="shell-view" data-view="inspectors">`.
  It is created once, during idle time after the first paint (at once if the page was opened on `#inspectors`),
  same-origin, and kept alive. Hidden views are `visibility: hidden` + `inert`, not `display: none`, so your layout
  and sizes do not change while you are hidden.
- Opening `http://localhost:8861/team/` redirects to `/#inspectors` (query string kept: `/team/?a=1` becomes
  `/#inspectors?a=1` and reaches you as `/team/?embedded=1&a=1`). `/team/?standalone=1` serves the page on its own.
  Other servers (for example `team/serve.js` in your tests) are not affected: the redirect is in `server.js` only.
- `Shell.views` on the shell page: `show('technology'|'inspectors')`, `current()`, `frame()` (the iframe),
  `mount()`. The window gets a `shell:view` event with `detail: { view, previous }` on every switch.
  `Shell.embedded` is true inside the iframe.

### Being embedded: what the Inspectors page must support

Already handled for you by `shared/shell.js` + `shared/shell.css` (you include both, nothing to add):

1. With `?embedded=1` (or when framed by the shell) `<html>` gets the class `shell-embedded`. Your own
   `.shell-bar` is hidden (the parent shows the one bar) and the page background is transparent.
2. A `body` grid whose first child is the bar (`grid-template-rows: 56px minmax(0, 1fr)`) is collapsed to one row
   by `shell.css`, so your content gets the full iframe height, the same height it has standalone under the bar.
3. Buttons you keep in your `.shell-bar` ("Start over") are mirrored as pills on the right of the parent bar while
   your view is up. A click on the mirror calls `.click()` on your button. Keep such buttons as real `<button>`s in
   your header. (They are read once when your page has loaded.)
4. While you are hidden `<html>` also has the class `shell-hidden` and `shell.css` pauses every CSS animation.

What you must do:

5. **Pause your own loops while hidden.** Your `window` receives `shell:visibility` (a `CustomEvent`,
   `detail: { visible: true|false }`) on every switch, and once right after your page has loaded. Stop
   `requestAnimationFrame` loops, timers and polling when `visible` is false, resume when true. You can also test
   `document.documentElement.classList.contains('shell-hidden')`.
6. **Never rely on a reload.** You are loaded once and kept for the whole session: "start again" must reset state
   in place. Do not navigate the top window. A link back to the other tab is
   `parent.Shell.views.show('technology')`.
7. **No outer page scroll.** Fit the iframe (`100%` / `100dvh` of your own viewport, which is the window minus the
   56 px bar) and scroll inside your own panes. Nothing may be positioned as if the bar were inside your document.
8. **Keep working standalone** (`?standalone=1`, your own test server): do not depend on `parent`.
9. **Feedback mode:** keep your own `feedback-mode.js` include. While your view is up the parent hides its pill, so
   yours (bottom right of the iframe, the same spot) is the one Andrew uses, and boxes are stored against `/team/`.
   The queue pill (`/progress/pill.js`) shows in the top window only: keep the bottom-left corner free.

Testing flag: `/?solo=1` loads the shell without preloading the other view.

## 10. A fifth place: Berkeley (2026-11-22)

Andrew asked for one more city whose fire code is meaningfully different. A researcher picked the City of Berkeley
and prepared `data/city4/` (read its `HANDOFF.md`). It is joined to the shared modules like this:

- **Nothing changes for a page that does not load the three `data/city4` scripts.** The Inspectors page does not,
  so it still has one region and four carried places, and every row it reads is the same as before (`test.js`
  checks this). Its minimap can stay on the three towns.
- To get Berkeley, add the three scripts before `data/law.js` (§ 1). Then `geo.regions.berkeley`, `geo.pins.berkeley`,
  the place `'berkeley'` (and `'east_bay'`, past its limit, not carried) exist, `geo.at()` returns a `zone`, and
  `codes.evaluate({ place:'berkeley', zone })` returns Berkeley's rows.
- Rows that mean the same thing keep their key, so the same row changes in place: `ladder-reach`, `hazard-veg`,
  `roadside`, `required-system`, `remodel-triggers` (its `label` differs in Berkeley), `out-of-service`. Their `sec`
  and `cite` are Berkeley's own there. Berkeley-only keys: `zone-zero`, `vertical-spacing`, `shrub-spacing`,
  `compliance-plan`, `replacement-head`. There is no `canopy` row in Berkeley.
- Berkeley's rules are written for named zones, so the verdict depends on `zone`, not `scope`: the Zone 0 row is red
  within 5 ft in a mitigation area; the ladder-fuel row is red within 30 ft in the Very High zone (mitigation areas
  included); the spacing row is always the inspector's call inside 100 ft; outside the Very High zone everything
  local is the inspector's call. The table is in NOTES.md § 9.
- What does NOT differ, and must not be shown as a difference: the code edition (2025, like the Ross Valley), the
  30 ft edge of the ladder-fuel rule, the 10 ft roadside strip. Berkeley has no plant ban.
- All of Berkeley's legal text, citations and sources live in `data/city4/law.js`. `data/law.js` only joins them to
  the shared rows and adds display fields (`phrase`, `sec` as far as the subsection, `brief`, `citeShort`).
  `data/city4/tools/check.js` checks every quoted passage against the downloaded ordinances; `test.js` runs it.
- On the Technology page a "Berkeley" pill flies the map there (§ 8, `APP.goto('berkeley')`): one eased camera
  move of about 1.4 s that pulls back to a quarter scale, travels east-southeast and comes down on Berkeley. The
  land between the two pictures is not drawn. With reduced motion the two maps crossfade.

## Changed

- 2026-11-22, first version.
- 2026-11-22: rows gained `title`, `sec`, `code`, `extra`; `label` is now the short form. Sources gained `short`.
  `Shell.tabs`, `Shell.watch`, `Shell.build` added. Bar height 56 px. Server behaviour for `/api/team/*`,
  `/team/resident/` and `/progress/` documented.
- 2026-11-22: **single-page shell** (§ 9). `/team/` on :8861 now redirects to `/#inspectors`; the Inspectors page is
  embedded as `/team/?embedded=1`. `shared/shell-check.html` is no longer used by anything.
- 2026-11-22, the declutter pass: `why` now says "Depends on …" (was "Turns on …"); `overall.line` is six words at
  most; `diff()` returns one short sentence; rows gained `phrase`; places gained `agencyShort`; `stateNote` is empty.
  `beforeAfter` gained `outline`, `shown`, `caption`, `tags`, the `outline()` method and the `ba:outline` event (§ 5).
  Zone polygons keep their holes (`hazardZones[].holes`, `geo.inZone`). Tokens `--ink-rgb`, `--hi-rgb`, `--r-*` added.
- 2026-11-22: **`FireGeo.pinDrag`** (§ 5b). The signature is an options object: `where`, `move`, and optionally
  `start`, `end`, `settle`, `grip`, `ms`, `far`, `reduced`. `start` may return `false` to refuse a press.
- 2026-11-22: **a fifth place, Berkeley** (§ 10). `geo` gained `regions`, `regionOf`, `trip`, `berkeleySource`;
  `clamp` takes a region; `at()` returns `zone`, `zoneName`, `region`; `areas[].region`; `hazardZones[].name`.
  `evaluate()` takes and returns `zone`. Rows gained `quiet`, `brief`, `citeShort`; `why` may be 70 characters.
  A row's `label`, `title`, `sec`, `code`, rule and `turns` can now differ by place. `Shell.where(text)` added.
- 2026-11-22: the Gleb kit (`shared/gleb/`) is loaded by both pages. `node test.js --plain` runs the suite with it off.

- 2026-11-22: **the trip to Berkeley slides over a real map.** `assets/corridor.jpg` (+ `.json`, `data/corridor.js`,
  `geo.corridor`) is one picture of everything between the two regions, drawn from OpenStreetMap data. The map is one
  world container with one camera transform; the regional pictures dissolve into the corridor when pulled back.
  `APP.pose`, `APP.corridor` added. The Inspectors minimap is not affected.
- 2026-11-22: **changing over.** Words that have nothing in common with the ones they replace no longer crossfade over
  each other: the old ones leave (90 ms) before the new ones arrive. In a keyed list the rows that leave go first, then
  the rows that stay glide, then new rows rise in. `beforeAfter` gained `switch: false`. `Shell.softScroll` and the
  thumb's label copies added (§ 6). The sheet's "Done" is a close symbol. Switching "Show what changed" off fades (§ 5).
- 2026-11-22: **new sprinkler photograph.** Same file name, new picture: `assets/sprinkler.png` is now **428 x 710**
  (aspect 0.6028, upright; it was 343 x 263). `CONTENT.sprinkler.aspect` and `codes.PHOTOS[1].aspect` say so. The three
  annotation boxes in `CONTENT.sprinkler` were moved onto it and are now, in percent of the picture:
  `[42.5, 44.8, 17, 13.1]` paint on frame and body · `[42.5, 57.7, 14.7, 6.8]` deflector · `[65.1, 43.2, 12.5, 11.5]`
  trim staining. `assets/after/sprinkler-a-replacement.jpg` is now 428 x 710 too and registers on the photograph with
  no scale or shift (`align` is identity to 0.2 px); its outline was measured again. The old files are kept as
  `assets/sprinkler.old.png` and `assets/after/sprinkler-a-replacement.old.jpg`; `assets/sprinkler.json` records the
  fit. Anything of yours that assumed a landscape sprinkler picture (viewfinder, scan regions, drawings, tests) needs
  the new shape.

- 2026-11-23: **the top bar is 64 px tall, not 56** (`--shell-bar` in `shared/shell.css`): its pill and buttons sit 8 px
  lower. A page whose `body` is a grid with the bar as its first child now gets that row height from the shell
  (`body:has(> .shell-bar:first-child)`), so do not hard-code 56 px. **Inspectors: your stage is 8 px shorter** in both
  modes (836 px at 1440 x 900, 656 px at 1280 x 720); it does not scroll at either size today.
- 2026-11-23: two more of Andrew's rules, in the shared shell. **Corner inset:** the more rounded a container, the
  more its content is set in; inside a 48 px corner use about 28 to 30 px (the Technology cards do, in the Gleb look).
  **Scrollbars stay on the straight part of a rounded container:** an element with `.soft-scroll` gets a thin scrollbar
  whose track stops short of a rounded corner by `--scroll-inset-top` / `--scroll-inset-bottom` (set them to the
  corner radius). Do not set `scrollbar-width` on such an element: it switches these rules off in Chrome.
- 2026-11-23: `.gitignore` and `README.md` added. The site must be served by its own `server.js` from the root.

## Key portions of code text (added 2026-11-22)

`lib/emphasis.js` → `FireGeo.emphasis.segments(text)` returns `[{text, key}]`; `FireGeo.emphasis.fill(el, text)` writes the text into `el` with key portions in `<mark class="code-key">` (styled in `shared/shell.css`). Use it wherever a row's `requires` text is shown. It never changes the words.
