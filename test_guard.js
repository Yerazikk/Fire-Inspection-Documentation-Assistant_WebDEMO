// The gate on the tests that cost money.
//
// test.js, test_ai.js, test_photo.js and test_visual.js each walk a real
// inspection against the live model. Every entry they save is a text draft,
// every dictated memo a transcription, and every violation entry carrying a
// photograph is one `gemini-3-pro-image` call per recommendation — two to five
// of them, at roughly $0.13 apiece, which is the overwhelming majority of the
// bill. A sweep of all four is a few dollars, and three of them draw pictures
// only as a side effect of walking the flow rather than to assert anything
// about them: whether they do depends on whether the memo they happen to type
// trips the `violation` branch in app.js.
//
// So they no longer run by being asked for in the ordinary way. They run when
// someone deliberately says so:
//
//   node test.js --live
//
// Everything that costs nothing — test_route.js, build_spec.js — is unguarded
// and runs as before. `ai/check.js` is text-only and about a hundredth the
// cost of a flow test; it is the cheap way to judge a prompt change.
//
// Exits 0, not 1: a skipped test is not a failed one, and a chained command
// should carry on past it.
const LIVE = ['--live', '--paid', '--spend'];

module.exports = function gate(name, what) {
  const asked = process.argv.some(a => LIVE.includes(a)) ||
    /^(1|true|yes)$/i.test(String(process.env.FLOW_TESTS || ''));
  if (asked) return;
  console.log(`${name} is disabled — it ${what} against the live model, and that is billed.`);
  console.log(`Run it deliberately with:  node ${name} --live`);
  console.log('See the Quota section of README.md for what a run costs.');
  process.exit(0);
};

/** The port, ignoring any `--flag` in argv. */
module.exports.port = (dflt = 8956) =>
  process.argv.slice(2).find(a => !a.startsWith('-')) || dflt;
