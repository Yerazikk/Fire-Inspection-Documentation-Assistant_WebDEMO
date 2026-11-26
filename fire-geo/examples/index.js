// examples/index.js — the list of examples, in the order the tabs show them.
//
// THIS IS THE ONLY LINE TO EDIT WHEN AN EXAMPLE IS ADDED. Put the new id in the list below (where you want its
// tab to sit) and create examples/<id>/example.js beside it. Nothing else in the app names the examples.
//
// In a browser this file pulls each example in, in order, before the next <script> tag runs. In node the suites
// read FireExamples.files() and run them in their own context (see test.js, team/test.js, team/api.js).
(function (root) {
'use strict';

const IDS = root.FireExamples.setIds([
  'ladder',
  'sprinkler',
  'daisy',
  'firedoor',
]);

// The browser half. document.write of a plain <script> during parsing is synchronous and keeps the order, which
// is what the rest of the include list depends on: data/content.js and data/law.js read the registry as soon as
// they run. There is no build step in this project, so there is nothing to bundle these into.
if (typeof document !== 'undefined' && document.currentScript) {
  const base = document.currentScript.src.replace(/index\.js(\?.*)?$/, '');
  for (const id of IDS) document.write('<scr' + 'ipt src="' + base + id + '/example.js"></scr' + 'ipt>');
}
})(typeof window !== 'undefined' ? window : globalThis);
