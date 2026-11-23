# Fire code by location

A local prototype for fire inspectors: the same photograph is judged by a different fire code depending on where it
was taken. Move a pin across a map and the rules, their citations and a green / yellow / red verdict change in place.

## Run it

```
node server.js 8861        # then open http://localhost:8861
```

Node 18 or later, no install step, no build step. The site must be served by its own `server.js` from the server root:
the two tabs, the feedback and drafting endpoints and a few paths (`/team/`, `/progress/`, `/api/…`) are absolute, so it
does not run from a sub-path of another server or straight from the file system.

## The two tabs (one document, both kept alive)

- **Technology** (`index.html`, `app.js`, `app.css`): a photograph with its before / after correction, a map of the Ross
  Valley (Ross, San Anselmo, Fairfax, unincorporated Marin) with a pill that flies to Berkeley, and the rules that apply
  where the pin is.
- **Inspectors** (`team/`): the product itself, a field inspector's phone and a senior inspector's laptop.

Shared pieces: `shared/shell.*` (top bar, tabs, soft scroll edges), `lib/` (place lookup, the rules and verdicts, the
before / after divider, the pin), `data/` (the rules with their sources, map polygons), `shared/gleb/` (a second look).
`API.md` describes all of it.

## Two looks

The Gleb kit is on by default. `?gleb=0` switches to the plain Pearl look and `?gleb=1` back; the choice is remembered.

## Tests

```
node test.js             # with the Gleb kit on
node test.js --plain     # with it off
```

Both must pass. They start their own server on port 8864 and drive headless Chrome through Playwright (the path to
Playwright is at the top of `test.js` and `shot.js`: point it at your own install). `team/test.js` and
`shared/gleb/test.js` are the other two parts' own suites.

## Where the law comes from

`NOTES.md`: every rule on screen, the ordinance it was read in, what would not load, and what is the app's own reading.
The texts that were read are in `sources/text/` and `data/city4/sources/*.txt`. The verdicts are a demonstration: the
inspector decides.

## Limits

- No model or API keys are needed. Drafting on the Inspectors tab uses a local command-line model if one is installed
  and falls back to prepared text otherwise.
- The "after" pictures are illustrations.
- Map data © OpenStreetMap contributors. Zone polygons are simplified from the fire agencies' public maps: read the
  parcel on those maps before citing.
- Regenerating the maps and pictures (`tools/`) needs the downloads that are not in the repository; the tools fetch
  them again (`tools/corridor-fetch.js`) or say what is missing.
