'use strict';
/* ============================================================
   Repodest Extension — VM test runner
   Loads lib/*.js into a shared vm context (like content-script
   script sharing) and runs tests.js inside it.
   Run: node tests/run-tests.js
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const LIB = path.join(__dirname, '..', 'lib');
const files = ['core.js', 'i18n.js', 'api.js', 'digest.js'];

const ctx = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  URL: URL,
  Promise: Promise
};
ctx.globalThis = ctx;
vm.createContext(ctx);

for (const f of files) {
  const code = fs.readFileSync(path.join(LIB, f), 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: f });
    console.log('loaded: ' + f);
  } catch (e) {
    console.error('LOAD FAILED: ' + f + ' → ' + e.message);
    process.exit(1);
  }
}

const testCode = fs.readFileSync(path.join(__dirname, 'tests.js'), 'utf8');
try {
  vm.runInContext(testCode, ctx, { filename: 'tests.js' });
} catch (e) {
  console.error('TEST RUN FAILED: ' + (e && e.stack || e));
  process.exit(1);
}
function report(res) {
  if (res && res.failed > 0) {
    console.error('\n== ' + res.failed + ' FAILED / ' + res.passed + ' passed ==');
    process.exit(1);
  }
  console.log('\n== ALL ' + (res ? res.passed : '?') + ' TESTS PASSED ==');
}
if (ctx.__RP_RESULTS_PROMISE) {
  ctx.__RP_RESULTS_PROMISE.then(report, function (e) { console.error('ASYNC TEST FAILED: ' + (e && e.stack || e)); process.exit(1); });
} else {
  report(ctx.__RP_RESULTS);
}
