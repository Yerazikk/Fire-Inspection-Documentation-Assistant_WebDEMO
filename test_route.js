// node test_route.js — checks the route search in geo.js without a browser.
// The claim the UI makes is "every ordering was tried and this one is fastest",
// so that is what gets checked: against an independent brute force, on random
// matrices, for every size band the three strategies cover.
const fs = require('fs'), vm = require('vm');
const ctx = {
  window: {}, console, setTimeout, clearTimeout, AbortController, URL,
  localStorage: { getItem: () => null, setItem: () => {} },
  performance: { now: () => Date.now() },
  requestAnimationFrame: cb => setTimeout(cb, 0),
  fetch: () => Promise.reject(new Error('no network in this test')),
};
vm.runInNewContext(fs.readFileSync(__dirname + '/geo.js', 'utf8'), ctx);
const G = ctx.window.GEO;

// A random asymmetric time matrix: point 0 is HQ, 1..n are the stops.
const randomTimes = n => Array.from({ length: n + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === j ? 0 : 60 + Math.floor(Math.random() * 1800)));

// Independent brute force, written separately from the one under test.
function reference(d, n) {
  let best = Infinity, order = null;
  const walk = (left, path, cost) => {
    if (!left.length) { if (cost < best) { best = cost; order = path.slice(); } return; }
    for (let i = 0; i < left.length; i++) walk(left.filter((_, k) => k !== i), path.concat(left[i]), cost + d[path.length ? path[path.length - 1] : 0][left[i]]);
  };
  walk(Array.from({ length: n }, (_, i) => i + 1), [], 0);
  return { best, order };
}

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

  for (const n of [1, 2, 3, 5, 7, 8]) {
    let agreed = 0, counted = 0, honest = 0;
    for (let t = 0; t < 5; t++) {
      const d = randomTimes(n), r = await G.fastestOrder(d, n), ref = reference(d, n);
      if (Math.abs(r.cost - ref.best) < 1e-6) agreed++;
      if (r.tried === G.factorial(n)) counted++;
      if (Math.abs(G.costOf(d, r.order) - r.cost) < 1e-6 && new Set(r.order).size === n) honest++;
    }
    ok(agreed === 5, `n=${n}: fastest ordering matches an independent brute force (5/5)`);
    ok(counted === 5, `n=${n}: all ${G.factorial(n)} orderings were actually driven`);
    ok(honest === 5, `n=${n}: the returned order is a permutation and costs what it claims`);
  }

  for (const n of [9, 10, 11]) {
    const d = randomTimes(n), r = await G.fastestOrder(d, n), ref = reference(d, n);
    ok(r.method === 'exact', `n=${n}: switches to the exact subset solver`);
    ok(Math.abs(r.cost - ref.best) < 1e-6, `n=${n}: still the true optimum over all ${G.factorial(n).toLocaleString('en-US')} orderings`);
    ok(Math.abs(G.costOf(d, r.order) - r.cost) < 1e-6 && new Set(r.order).size === n, `n=${n}: order is a permutation and costs what it claims`);
  }

  const n = 16, d = randomTimes(n), r = await G.fastestOrder(d, n);
  ok(r.method === 'heuristic', `n=${n}: admits it is no longer exact`);
  ok(new Set(r.order).size === n && G.costOf(d, r.order) <= G.costOf(d, Array.from({ length: n }, (_, i) => i + 1)), `n=${n}: heuristic still returns a valid, improved order`);

  ok(G.fmtTime(90) === '2 min' && G.fmtTime(3900) === '1 h 05 m', 'drive times format as minutes and hours');
  ok(G.fmtDist(1609.344) === '1.0 mi' && G.fmtDist(30) === '98 ft', 'distances format as miles and feet');

  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
