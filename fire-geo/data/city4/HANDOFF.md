# City 4 handoff: Berkeley, for the map owner

Nothing outside `data/city4/` was touched. Run `node data/city4/tools/check.js` (from `data/city4`) after any edit.

## Files

| File | Global | What |
|---|---|---|
| `law.js` | `window.FIREGEO_CITY4` (also `module.exports`) | The place, its rows, verdict rules, pins, the one-line difference |
| `boundary.js` | `window.FIREGEO_CITY4_BOUNDARY` = `{ area, source }` | `area` is one `areas` entry: `{ id:'berkeley', name:'Berkeley', kind:'town', labelAt:[-122.276, 37.876], rings:[[ [lon,lat] x 117 ]] }` |
| `zones.js` | `window.FIREGEO_CITY4_ZONES` = `{ source, zones }` | Same shape as `data/hazard.js`: `{ town:'berkeley', cls, rings, name? }`. `cls` is `mitigation` (2, named), `very-high` (2), `high` (2) |
| `basemap.jpg` + `basemap.json` | | 1640 x 1642, bounds west -122.3300, south 37.8305, east -122.2275, north 37.9115 |

## Pin and pill

- Pill label: **Berkeley**. Land on `FIREGEO_CITY4.pin` = `[-122.25823, 37.89515]`: a house lot off Creston Road,
  inside the city limit and inside the Grizzly Peak Mitigation Area (pixel 1148, 332 on the new basemap).
- `pins` has four more checked points if you want the zone change inside Berkeley to be reachable by dragging:
  `panoramic`, `veryHigh` (Very High zone, no Zone 0), `high`, `flat`.
- Zone of a point: test `zones.js` in the order `mitigation`, `very-high`, `high`; else `none`. The mitigation
  areas lie inside the Very High zone, so order matters. Labels for the "Mapped zone" fact are in `zoneLabels`.

## Wiring the rows

`rows.ladder` and `rows.sprinkler` are flat, already-merged rows (what `buildRow` in `lib/codes.js` produces before
the verdict): `key, label, title, value, unit, rule, cite, sec, code, requires, applies, open, turns?, extra?,
sayExtra?, say?, source, status, words, zone, isNew?`.

- Existing keys (`ladder-reach`, `hazard-veg`, `roadside`, `required-system`, `remodel-triggers`,
  `out-of-service`): copy `value, requires, cite, source, applies, open, extra, sayExtra` into that row's
  `by.berkeley` in `data/law.js`. Two fields are per-row today and need a per-place override in `buildRow`:
  `rule` (`RULES[(by && by.rule) || def.rule]`) and `turns` (`(by && by.turns) || def.turns`). The title of
  `remodel-triggers` also changes here ("Sprinklers required in existing buildings").
- New keys (`zone-zero`, `vertical-spacing`, `shrub-spacing`, `compliance-plan`, `replacement-head`): add as new
  defs with only `by.berkeley`. `evaluate()` already hides a row from places that have no `by` entry.
- No `canopy` row for Berkeley (no trunk-diameter rule there). `diff()` already skips a row the destination lacks.
- `verdictRules` has the same signature as `RULES`: `(row, c) -> { verdict, why }`, where `c.d` is the distance
  and `c.zone` is `'mitigation' | 'very-high' | 'high' | 'none' | 'unknown'`. Pass `zone` alongside `scope`.
  `ladderReachBerkeley`, `verticalSpacing`, `shrubSpacing`, `hazardVegBerkeley` and `zoneZero` are new; `roadside`
  and `judgement` match yours.
- `overallLine(c, verdict)` gives the Berkeley sentence for the ladder photo. The existing `overallLine` hard-codes
  "30 ft rule" and "mapped hazard zone". The sprinkler line can stay as it is.
- `diff()`: between a Ross Valley place and Berkeley the generic builder would print two "adds a row" lines. Use
  `differsBy.ladder` / `differsBy.sprinkler` instead, or `differs` for one sentence covering the hedge.
- `zoneFor(d)` in `codes.js` already names Zone 0, 1 and 2 at 5, 30 and 100 ft, which is Berkeley's own split.
- The facts block reads `fireCode`, `wuiCode`, `agency`, `agencyCite` as for the other places. The "Mapped zone"
  fact cites "Ross Valley Fire map" in code: for Berkeley cite `FIREGEO_CITY4_ZONES.source.title`.

Expected verdicts on the ladder photo (tested): mitigation area red at 3, 20 and 60 ft, yellow at 120 ft. Very
High zone the same (but the Zone 0 row is green). High zone and flatlands yellow at every distance. Ross for
comparison: red at 20 ft, yellow at 60 ft. The sprinkler photo stays red overall (statewide row); the four local
rows are yellow.

## The trip

The two basemaps share one ground scale (16,000 px per degree of longitude, about 5.5 m per pixel) and the same
Web Mercator maths, so they sit in one world without rescaling.

| | west | south | east | north | px |
|---|---|---|---|---|---|
| Ross Valley | -122.6280 | 37.9500 | -122.5255 | 38.0135 | 1640 x 1289 |
| Berkeley | -122.3300 | 37.8305 | -122.2275 | 37.9115 | 1640 x 1642 |

- In Ross Valley image pixels the Berkeley image's top-left corner is at **(4768, 2070)**, and the pin at (5916, 2402).
- The box holding both is 6408 x 3712 px at full scale, so the zoomed-out view is about a quarter scale.
- Great circle, Ross label point to the Berkeley pin: **27.7 km (17.2 mi), bearing 106 degrees** (east-southeast).
  San Anselmo 29.0 km at 109, Fairfax 31.4 km at 109. Basemap centre to centre: 28.9 km at 115.
- Suggested read: zoom out from the valley, travel east-southeast, zoom in on Berkeley. There is no map picture
  for the 3,128 px gap between the two images (San Rafael, the Bay, Richmond): draw it as plain paper or water
  tone, and do not imply the towns in between are carried. A caption such as "28 km east-southeast, across the
  Bay" is true to the numbers.

## The basemap is drawn, not stitched

`tile.openstreetmap.org` answered every request with its "Access blocked" tile (it wants an app identity with
contact details, which the brief ruled out). I did not work around that. The picture is drawn from OpenStreetMap
vector data fetched through the Overpass API (three queries, saved gzipped in `sources/osm/`), in headless
Chrome, with a palette measured from `assets/rossvalley.jpg`. It matches in tone, scale and street labelling but
is not pixel-identical in style: label type is the system sans, there are no admin lines or map icons.
Attribution string: `© OpenStreetMap contributors`. To redraw:

```
cd data/city4
node tools/prep-vector.js sources/osm work/bounds.json work/render-data.js
node tools/draw-basemap.js work/render-data.js basemap.jpg
node tools/build-geo.js sources . work/render-data.js      # boundary.js, zones.js, pins, trip numbers
node tools/check.js
```

The city limit runs out into the Bay; 2% of its vertices are west of the basemap edge. Clip the outline to the image.

## Say on the page

- Zone 0 is required only in the two mitigation areas. The Very High zone outside them has Zones 1 and 2 only.
- The polygons are simplified. Keep the existing "read the parcel on that map before citing" line, pointing at
  the city's map (`FIREGEO_CITY4_ZONES.source.map`).
- Do not show a plant ban, a different code edition or a different roadside distance: Berkeley has none of those.
