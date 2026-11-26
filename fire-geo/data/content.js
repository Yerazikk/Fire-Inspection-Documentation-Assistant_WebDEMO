// window.CONTENT: the inspection record of every example, keyed by id.
//
// The records themselves moved to examples/<id>/example.js on 2026-11-25, so that one photograph's content, law,
// field questions and owner steps sit in one file instead of five. This file is what binds them to the global the
// pages and tests have always read. It must load after examples/index.js and before lib/codes.js.
//
// Every word in those records is lifted from the inspector's own analyses (monday/ladderfuel.md,
// monday/sprinkler.md and the later two findings), reflowed into fields the page can lay out, never rewritten into
// new claims. No code citation, measurement, deadline, manufacturer or model appears anywhere that is not in them.
//
// Tags carry the evidentiary standing of a statement through to the page:
//   confirmed — the inspector determined it
//   observed  — the AI read it off the photograph
//   verify    — it cannot be settled from the evidence available
window.CONTENT = window.FireExamples.content();
