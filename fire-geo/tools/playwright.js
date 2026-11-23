// Where Playwright is. The suites used to name one machine's absolute path, which meant the browser half of every
// suite failed everywhere else. Order: PLAYWRIGHT_PATH in the environment, then the repo's own node_modules
// (fire-inspector-v3 keeps playwright as a devDependency), then an ordinary resolve from here. It lives in tools/
// so it is not shipped: tools/ is left out of the deployed tree.
const path = require('path');

module.exports = function playwright() {
  const tries = [
    process.env.PLAYWRIGHT_PATH,
    path.join(__dirname, '..', '..', 'node_modules', 'playwright'),
    path.join(__dirname, '..', 'node_modules', 'playwright'),
    'playwright',
  ].filter(Boolean);
  const failed = [];
  for (const p of tries) {
    try { return require(p); } catch (e) { failed.push(p); }
  }
  throw new Error('Playwright not found. Set PLAYWRIGHT_PATH, or npm install it. Tried:\n  ' + failed.join('\n  '));
};
