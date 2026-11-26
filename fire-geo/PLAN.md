# fire-geo: plan

"The same photograph, a different fire code depending on where it was taken."
One screen at http://localhost:8861 (tab "Technology"). A second agent builds `/team/` (tab "Inspectors").

## 0. What changed after reading the sources (read this first)

I opened the official ordinances behind the three town links. Two things in the repo's `jurisdictions.js` are
out of date, and the page follows the ordinances, not the repo file:

- **Fairfax is not on the 2022 fire code and does not clear ladder fuels to 100 ft any more.** Ordinance 899
  (fire code) and Ordinance 900 (WUI code) were adopted on 5 Nov 2025 and took effect on 1 Jan 2026. Fairfax
  now enforces the 2025 California Fire Code, and its WUI code § 604.6(7) says 30 ft, the same words as Ross.
  The 100 ft rule was Ordinance 873 (2022). It is shown in place as "100 ft until 31 Dec 2025".
- **The county is on the 2025 codes too** (new Marin County Code ch. 16.16, first reading 4 Nov 2025, in force
  1 Jan 2026). Its ladder-fuel rule is also 30 ft. Real differences that remain: trees for canopy separation
  6 in. (towns 8 in.), a power to enter private property for roadside clearing, different sprinkler exceptions.

So the towns now share one template on purpose (the Marin fire agencies write it together). What truly changes
with the place, and what the screen shows:

1. **Which code you must cite**: each town's own chapter and ordinance (a notice citing the wrong town's code is wrong).
2. **Whether the parcel is in a mapped fire hazard zone or WUI area.** These are real polygons from the Ross Valley
   Fire Department's public map (the page Andrew linked embeds it). Inside one, the 30 ft rule is applied to the
   assumed distance. Outside, the row turns yellow. This is where geography changes the verdict.
3. **Town vs county**: 8 in. → 6 in., the roadside entry power, a county-only fire-hazard rule, the agency.
4. **What changed on 1 Jan 2026**, said in place for Fairfax and the county.

Details and sources per statement: NOTES.md.

## 1. Layout at 1440 × 900 (no scrolling)

```
 Fire code by location        [ Technology | Inspectors ]                     A demonstration …
┌───────────────┐ ┌──────────────────────────────────┐ ┌──────────────────────────────────────┐
│ PHOTO  320    │ │ MAP  550                          │ │ CODES  490                           │
│ [Ladder fuel |│ │ pearl-tinted basemap              │ │ ■ Noncompliant here   1 · 3 · 1      │
│  Painted      │ │ town limits, labels, hazard hatch │ │ one line: what changed when crossing │
│  sprinkler]   │ │ blue pin (drag, tap, arrow keys)  │ │ Statewide · the same everywhere      │
│               │ │ short label over the pin          │ │   rows (never touched by the pin)    │
│ before/after  │ │ At the pin: the mapped zone       │ │ Here · Ross                          │
│ divider +     │ │ Ross · San Anselmo · Fairfax ·    │ │   agency / fire code / WUI code      │
│ outline       │ │ Unincorporated   (chips)          │ │   (facts, patched in place)          │
│               │ │ Distance to the structure ‹ 20 › │ │   rows keyed by meaning              │
│ correction    │ │ (ladder photo only)               │ │ Reading pane: the chosen row's words │
│ A · B · C     │ │ map credit, hatch legend          │ │   + this town's source link          │
└───────────────┘ └──────────────────────────────────┘ └──────────────────────────────────────┘
```

- Rows are two lines: mark + meaning + value + citation, then a few words on why. The ordinance's own words and
  "how it applies to this photo" show for one row at a time in the reading pane (calm over content).
- At 390 wide the three cards stack: photo switch and photo, map, chips and distance, verdict, codes, pane. The page scrolls.

## 2. Row keys (one row per meaning, not per citation)

Ladder fuel, local: `ladder-reach` (30 ft) · `hazard-veg` (100 ft) · `canopy` (8 in. / 6 in.) · `roadside` (10 ft) ·
`brush-nuisance` (Fairfax only) · `fire-hazard` (county only). State: `state-defensible`.

Painted sprinkler, state: `maintenance` (§ 901.6) · `itm-standard` (§ 903.5 + NFPA 25) · `residential` (CRC § R309.3.2.6).
Local: `required-system` (§ 903.2.1 as added locally + WUI § 613.2) · `remodel-triggers` (§§ 903.2.2, 903.2.2.1) ·
`out-of-service` (§ 901.7 as amended).

Facts above the local rows (also keyed): `agency` · `fire-code` · `wui-code`, plus one reserved line for what the
place enforced before 2026. The mapped hazard zone at the pin (`zone`) is shown under the map, next to the pin it describes.

Places: `ross`, `san_anselmo`, `fairfax`, `marin` (unincorporated) carry rows. `sleepy_hollow`, `san_rafael`,
`larkspur` are named and say "not carried" in place. The statewide block still applies there.

## 3. Verdicts

Mark = colour + word + shape: red square "Noncompliant" · yellow triangle "Inspector's call" · green circle "Compliant".
Overall = the worst row. Inputs: photo, place, assumed distance `d` (ladder only, 0 to 150 ft, default 20 ft),
`scope` at the pin (`in` a mapped hazard zone or WUI area · `out` · `unknown` where the map has no layer).

| Row | Rule |
|---|---|
| ladder-reach | d ≤ 30 and scope in → red. d ≤ 30 and scope out or unknown → yellow. d > 30 → green. |
| hazard-veg | yellow (d ≤ 100: is it hazardous vegetation. d > 100: only if the official extends the reach to 200 ft). |
| canopy | d ≤ 30 → yellow (only when the official requires it). d > 30 → green. |
| roadside, brush-nuisance, fire-hazard, state-defensible | yellow, each with what it turns on. |
| maintenance | red (inspector confirmed the head is painted). |
| itm-standard, residential, required-system, remodel-triggers, out-of-service | yellow, each with what it turns on. |

Overall, ladder photo: red where scope is in and d ≤ 30, otherwise yellow. Sprinkler photo: red everywhere (state law).
Full table with expected values per place and distance: NOTES.md and `test.js`.

## 4. Motion at a line crossing

- Drag is direct: the pin's transform is written in the pointer handler, no easing. Hit-testing is throttled to one
  per animation frame. Crossing sets a new target state; nothing queues.
- Map: each town outline and fill has its own opacity that eases toward 0 or 1 with CSS transitions on
  compositor properties (interruptible by design, so a fast scrub just reverses). A short label by the pin crossfades.
- Codes panel: a keyed reconciler. For the new place it computes the row list and then
  1. rows with the same key and same content: untouched (same DOM node, no class change);
  2. same key, different value: the number counts in place (tabular digits); different citation or reason: the text
     crossfades in place (old and new overlap, fixed line height);
  3. keys only in the new place: inserted, fade in and rise 8 px;
  4. keys no longer present: fade and sink 8 px, then removed;
  5. everything that moved glides (FLIP on transform, plain ease-out, about 250 ms).
  Every animation is a WAAPI animation on transform or opacity started from the element's current visual state, so
  a reversal mid-flight starts from where it is. Entering rows play their entrance once.
- The statewide block is not part of the reconciler. It is rendered on photo change only. `test.js` proves zero
  mutations inside it during a drag across three lines.
- The card never changes size: fixed column height, a fixed-height reading pane at the bottom, free space between.
- The highlight under the chosen row is one element that glides. It sits outside the statewide block, so choosing
  a row (or losing the chosen row at a crossing) writes nothing inside that block.
- `prefers-reduced-motion`: no travel, no counting; changes are applied at once with a short opacity fade.

## 5. Files

`data/` copied sources + `law.js` (the rows shown) + `hazard.js` (map polygons) + `outlines.js` (generated contours).
`lib/` DOM-free logic (`geo.js`, `codes.js`, `solutions.js`) + `beforeafter.js/.css`. `shared/` shell (tokens, nav).
`tools/` offline scripts. `API.md` describes all of it for the Inspectors tab.

## 6. What changed after Andrew's review (2026-11-22, later the same day)

Sections 1 to 4 describe the first build. Where they differ from this list, this list is what is built.

- **Declutter.** One line per rule: verdict mark, name and value as one phrase ("Ladder fuels · within 30 ft"), a quiet
  section number. Only the ONE chosen rule shows its reason, citation and the ordinance's words. History, source
  status, caveats, the map footnote and the "this is a demonstration" statement are behind one "Sources and notes"
  button (a sheet) and in NOTES.md § 10. No instructions anywhere. 443 words on screen became 136.
- **Cards size to their content** and their height travels (about 250 ms, ease-out) when the content changes: the left
  card takes the photograph's own shape, the map card closes the distance row for the sprinkler photo, the codes card
  grows and shrinks with its rules. Nothing has a fixed height with empty space in it.
- **The pin** slides to a press (140 to 180 ms, live end point), then sticks to the pointer; pressed on itself it is
  simply held (`lib/pindrag.js`, shared with the Inspectors minimap).
- **"Show what changed"** is a switch under the photograph, off by default: a clean white outline, a spotlight dim
  outside it, one pulse.
- **Zones are a tint with a stipple**, not a hatch (the street grid was being read as hatching, NOTES.md § 5).
- **One document, two views.** Both tabs live in the shell page and stay alive; a switch crossfades them and reloads
  nothing (API.md § 9).
- **A fifth place, Berkeley**, reached by a pill that flies the map there (NOTES.md § 9, API.md § 10). The map is one
  world with two regions and a camera; the panel changes once, on landing.
- **The Gleb kit** (`shared/gleb/`, another agent's) re-skins the page by default; `?gleb=0` is the Pearl look. Tests
  pass in both.
