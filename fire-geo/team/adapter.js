// team/adapter.js: the one place the Inspectors tab reads fire-code data from.
//
// Every citation, requirement, verdict, place and correction comes from the Technology tab's shared modules
// (window.FireGeo, described in /API.md): FireGeo.codes.evaluate() for the rows, FireGeo.geo for the place and the
// mapped hazard zone under the pin, FireGeo.solutions for the corrections with their registered "after" images and
// outlines. This file holds no second copy of a rule that FireGeo owns. If FireGeo did not load it says so
// (`missing: true`) and the page states the gap in place instead of guessing.
//
// What this file adds, and FireGeo does not have, is what the field inspector answered:
//   - the Technology tab ASSUMES a distance. Here the field inspector types it, estimates it, or does not know it.
//     Unknown: the shared logic is asked at both ends of its range and any row whose verdict depends on the distance
//     is left for the inspector. An estimate decides the row, and the row says it is an estimate.
//   - a correction to one of the app's readings (no road beside it, a gap between the layers, no dry leaves) is put
//     in front of the analysis it bears on. Only "no road or driveway" changes a verdict (it clears the roadside row).
window.TeamData = (function () {
  'use strict';
  const W = window, C = W.CONTENT || {};
  const ROOT = '../';                                   // the server root, as seen from /team/
  const PLACES = ['ross', 'san_anselmo', 'fairfax', 'marin'];
  const fg = () => { const g = W.FireGeo; return g && g.codes && typeof g.codes.evaluate === 'function' ? g : null; };

  // Source strings carry em dashes and a few tags. The interface uses neither.
  function tidy(s) {
    s = String(s == null ? '' : s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return s.replace(/\s*—\s*/g, (m, at) => {
      const before = s.slice(0, at), cut = Math.max(before.lastIndexOf('. '), before.lastIndexOf('; '));
      return /:/.test(before.slice(cut + 1)) ? ', ' : ': ';
    });
  }
  const VERDICT = () => (fg() && fg().codes.VERDICT) || {
    red: { word: 'Violation', shape: 'square' }, yellow: { word: 'Inspector’s call', shape: 'triangle' }, green: { word: 'Clear', shape: 'circle' },
  };
  const RANK = { red: 0, yellow: 1, green: 2 };          // the order on the senior's desk: red first

  // ---------------------------------------------------------------- the two fixture inspections
  function scene(id) {
    const c = C[id]; if (!c) return null;
    const g = fg(), P = g && g.codes.PHOTOS ? g.codes.PHOTOS.find(p => p.id === id) : null;
    const fb = (c.annotations.find(x => x.tone === 'red') || { box: [25, 25, 50, 50] }).box;
    return {
      id, title: tidy(c.title), status: tidy(c.status), focus: [fb[0] + fb[2] / 2, fb[1] + fb[3] / 2],
      short: (P && P.tab) || tidy(c.tab) || tidy(c.title),       // the same name the Technology tab's switch uses
      photo: ROOT + ((P && P.photo) || c.photo), aspect: (P && P.aspect) || c.aspect,
      annotations: c.annotations.map((a, i) => ({ ix: i, box: a.box, finding: a.tone === 'red', label: tidy(a.label), note: tidy(a.note) })),
      meta: c.meta.map(m => [m[0], tidy(m[1])]), owner: c.owner,
    };
  }

  /** The photographs the field app can take, in the order the shared list gives them (lib/codes.js PHOTOS).
   *  One reaches the phone when the field flow knows it: its questions and what the app reads off it are in
   *  team/flow.js. So a new violation is added to the shared list first and shows up here once those are written. */
  function scenes() {
    const g = fg(), F = W.TeamFlow;
    const ids = g && g.codes.PHOTOS ? g.codes.PHOTOS.map(p => p.id) : Object.keys(C);
    return ids.filter(id => C[id] && (!F || (F.QUESTIONS[id] && F.SEEN[id])));
  }

  // ---------------------------------------------------------------- places
  /** the place and the mapped hazard zone at a point (the pin on the map). In the real product: the phone's GPS. */
  function at(lon, lat) {
    const g = fg();
    if (!g || !g.geo) return { lon, lat, place: 'ross', scope: 'unknown', classes: [], label: '' };
    const a = g.geo.at(lon, lat);
    return { lon, lat, place: a.place, scope: a.scope || 'unknown', classes: a.classes || [], label: a.label || '' };
  }
  const pin = id => { const g = fg(); const p = g && g.geo && g.geo.pins ? g.geo.pins[id] : null; return p ? at(p[0], p[1]) : { place: id, scope: 'unknown', classes: [], label: '' }; };
  /** the hazard zone under a location, in a few words (the same words on the map and on the laptop) */
  const ZONE = { wui: 'WUI area', high: 'High hazard zone', moderate: 'Moderate hazard zone' };
  const zoneText = a => !a ? '' : a.scope === 'in' ? ((a.classes || []).map(c => ZONE[c]).filter(Boolean).join(' · ') || a.label) : a.scope === 'out' ? 'Outside the mapped zones' : (a.label || 'Hazard zone not mapped here');
  function place(id) {
    const g = fg(), p = g && g.codes.place ? (g.codes.place(id) || {}) : {};
    return { id, short: p.short || id, name: p.name || id, inSentence: p.inSentence || p.short || id, kind: tidy(p.kind || ''), agency: tidy(p.agency || ''), agencyNote: tidy(p.agencyNote || ''), carried: p.carried !== false, why: tidy(p.why || ''), fireCode: p.fireCode ? tidy(p.fireCode.value) : '' };
  }

  // ---------------------------------------------------------------- code rows
  /**
   * The code rows for one photograph at one location, with the field inspector's answers applied.
   * loc: { place, scope, label } from at() or pin(). facts: from TeamFlow.facts().
   */
  function evaluate(photo, loc, facts) {
    const g = fg(), f = facts || {}, L = typeof loc === 'string' ? pin(loc) : (loc || pin('ross')), pl = place(L.place);
    if (!g || !C[photo]) return { rows: [], adopted: [], place: pl, loc: L, missing: true, carried: false, stateNote: '' };
    const D = g.codes.DISTANCE || { min: 0, max: 150, default: 20 };
    const dist = photo === 'ladder' ? f.distance : null, known = !!dist && (dist.kind === 'exact' || dist.kind === 'estimate');
    const call = d => g.codes.evaluate({ photo, place: L.place, distance: d, scope: L.scope, hazardLabel: L.label });
    const used = known ? Math.max(D.min, Math.min(D.max, dist.feet)) : D.default, ev = call(used);
    const rows = (ev.state || []).concat(ev.local || []).map((r, i) => ({
      key: r.key, layer: r.layer, tag: r.layer === 'state' ? 'State' : pl.short, label: tidy(r.label), title: tidy(r.title || r.label),
      value: r.value, unit: r.unit || '', cite: tidy(r.cite), citeShort: tidy(r.sec || String(r.cite).split(' · ')[0]),
      requires: String(r.requires || '').replace(/<[^>]+>/g, ' ').trim(),
      applies: tidy(r.applies), open: tidy(r.open), verdict: r.verdict, why: tidy(r.why), was: r.was || null, order: i, lead: '',
    }));
    const by = {}; rows.forEach(r => { by[r.key] = r; });
    const lead = (key, text) => { if (by[key] && text) by[key].lead = (by[key].lead ? by[key].lead + ' ' : '') + text; };

    if (photo === 'ladder') {
      // Which rows depend on the distance: ask the shared logic at both ends of its range.
      const near = {}, far = {}, lo = call(D.min), hi = call(D.max);
      (lo.state || []).concat(lo.local || []).forEach(r => { near[r.key] = r; });
      (hi.state || []).concat(hi.local || []).forEach(r => { far[r.key] = r; });
      for (const r of rows) {
        const a = near[r.key], b = far[r.key];
        if (!a || !b || a.verdict === b.verdict) continue;
        r.dependsOnDistance = true;
        if (!known) {
          r.verdict = 'yellow'; r.why = 'Depends on the distance, which the field inspector did not give.';
          if (!r.open) r.open = 'The distance from the bushes to the building.';
          if (dist && dist.kind === 'unsure') r.lead = 'The field inspector was not sure of the distance.';
        } else if (dist.kind === 'exact') {
          if (/distance/i.test(r.open)) r.open = '';
          r.why = r.why.replace(new RegExp(' at ' + used + ' ft\\b'), ' at ' + dist.feet + ' ft, as the field inspector gives it');
        } else {
          // an estimate decides the row, but no exact figure is quoted for it
          r.why = r.why.replace(new RegExp(' at ' + used + ' ft\\b'), ', by the field inspector’s estimate (' + dist.label.toLowerCase() + ')').replace(new RegExp('This is ' + used + ' ft\\.'), 'By the field inspector’s estimate it is farther (' + dist.label.toLowerCase() + ').');
          if (/distance/i.test(r.open)) r.open = 'A measured distance. This one is an estimate.';
        }
      }
      if (f.touch === 'gap') lead('ladder-reach', 'The field inspector says there is a gap between the two layers.');
      if (f.dry === 'none') lead('hazard-veg', 'The field inspector sees no dry leaves or dead plants.');
      else if (f.dry === 'lots') lead('hazard-veg', 'The field inspector says there is a lot of dry material.');
      if (f.beside === 'neither') {
        lead('roadside', 'The field inspector says there is no road or driveway next to it.');
        if (by.roadside) { by.roadside.verdict = 'green'; by.roadside.why = 'No road or driveway next to it, by the field inspector’s report.'; by.roadside.open = ''; }
      } else if (f.beside === 'driveway') lead('roadside', 'The field inspector says it is a driveway, not a road.');
    } else if (photo === 'daisy') {
      // The two answers the phone asks for are the two exceptions in CFC \u00a7 603.5.2, so they land on that row.
      // A meeting or function room does not clear the finding; it turns a confirmed violation into a reading the
      // inspector has to make, which is what yellow means everywhere else on this page.
      if (f.room === 'meeting' || f.room === 'assembly') {
        const where = f.room === 'meeting' ? 'a meeting room' : 'a hall or function room';
        lead('tap-direct', 'The field inspector calls this ' + where + '.');
        if (by['tap-direct']) {
          by['tap-direct'].verdict = 'yellow';
          by['tap-direct'].why = 'Depends on whether the meeting-room exception covers this.';
          by['tap-direct'].open = 'Whether the room is a Group A occupancy or a Group B meeting room, whether the use is temporary, and whether the load is electronic equipment.';
        }
      } else if (f.room === 'work') lead('tap-direct', 'The field inspector calls this an office or work room, so neither exception is in play.');
      else if (f.room === 'written') {
        lead('tap-direct', 'The field inspector wrote the room in: \u201c' + f.roomText + '\u201d.');
        if (by['tap-direct']) {
          by['tap-direct'].verdict = 'yellow';
          by['tap-direct'].why = 'Depends on whether that room is one the exception covers.';
          by['tap-direct'].open = 'Whether the room the field inspector describes is a Group A occupancy or a Group B meeting room, and whether the use is temporary.';
        }
      }
      if (f.temp === 'testing' || f.temp === 'temporary') lead('tap-direct', f.temp === 'testing' ? 'Temporary, for testing equipment, the field inspector says.' : 'Temporary, the field inspector says.');
      // A cord run under a door or a covering is the plain words of \u00a7 603.5.3, and the field inspector can see it.
      if (f.cords === 'under' && by['tap-install']) {
        lead('tap-install', 'The field inspector says a cord runs under a door or under the carpet.');
        by['tap-install'].verdict = 'red';
        by['tap-install'].why = 'A cord runs under a door or a covering. Confirmed on site.';
        by['tap-install'].open = '';
      }
      if (f.count === 'more') lead('tap-direct', 'The field inspector counts more than the two taps in the photograph.');
      if (f.upper === 'other') lead('cords', 'The field inspector says the upper strip is not plugged into a wall socket either.');
    } else {
      if (f.paint === 'all') lead('maintenance', 'The field inspector says the paint is all over the sprinkler.');
      else if (f.paint === 'ring') lead('maintenance', 'The field inspector says the paint is only on the ring around the sprinkler.');
      if (f.plate === 'painted') { lead('maintenance', 'The field inspector says the bottom plate is painted too.'); lead('itm-standard', 'The field inspector says the bottom plate is painted too.'); }
    }
    for (const r of rows) r.analysis = (r.lead ? r.lead + ' ' : '') + r.applies;
    const adopted = (ev.facts || []).map(x => ({ key: x.key, label: tidy(x.label), value: tidy(x.value), cite: tidy(x.cite || ''), was: x.was || null }));
    return { rows, adopted, place: pl, loc: L, missing: false, carried: ev.carried !== false, stateNote: tidy(ev.stateNote || '') };
  }
  /** how far the ladder-fuel rule reaches at a place (for the phone's one line under the distance question) */
  function reach(placeId) {
    const r = evaluate('ladder', pin(placeId), { distance: { kind: 'exact', feet: 0 } }).rows.find(x => x.key === 'ladder-reach');
    return r && r.value ? { value: r.value, unit: r.unit || 'ft' } : null;
  }

  // ---------------------------------------------------------------- corrections
  // FireGeo.solutions gives the title, standing, images, alignment and the contour of what changes. The technical
  // wording of each correction (where, change, how, keep, why) is read from the same content.js it is built from.
  function solutions(photo) {
    const c = C[photo]; if (!c) return [];
    const g = fg(), list = (g && g.solutions && g.solutions.list) ? g.solutions.list(photo) : [];
    return c.solutions.map(s => {
      const f = list.find(x => x.id === s.id) || {};
      return {
        id: s.id, photo, title: tidy(f.title || s.title), plain: tidy(f.plain || s.plain),
        standing: f.standing || (s.badge === 'required' ? 'required' : 'alternative'), standingText: tidy(f.standingText || s.badgeText),
        proposal: !!s.proposal, limit: tidy(f.limit || s.limit || ''),
        before: ROOT + (f.before || c.photo), after: f.after ? ROOT + f.after : '',
        aspect: f.aspect || c.aspect, align: f.align || { sx: 1, sy: 1, dx: 0, dy: 0 }, outline: f.outline || [],
      };
    });
  }
  /** write a requirement into an element with its key portions marked, through the shared helper. Same words. */
  function fillRule(el, text) { const g = W.FireGeo; if (g && g.emphasis && g.emphasis.fill) g.emphasis.fill(el, text); else el.textContent = text; }
  const disclosure = () => tidy((fg() && fg().codes.disclosure) || '');

  return { ROOT, PLACES, tidy, VERDICT, RANK, scene, scenes, place, at, pin, zoneText, evaluate, reach, solutions, fillRule, disclosure, usesFireGeo: () => !!fg() };
})();
