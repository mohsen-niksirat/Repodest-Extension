'use strict';
/* ============================================================
   Repodest Extension — tests (executed inside the vm context)
   ============================================================ */
var T_PASSED = 0, T_FAILED = 0;
var T_PENDING = [];
function T_OK(cond, name) {
  if (cond) { T_PASSED++; console.log('  ✓ ' + name); }
  else { T_FAILED++; console.log('  ✗ FAIL: ' + name); }
}

/* ---------- fake repository ---------- */
var T_META = {
  full_name: 'acme/widget', description: 'A tiny widget', language: 'JavaScript',
  stargazers_count: 1234, forks_count: 56, open_issues_count: 3,
  license: { spdx_id: 'MIT' }, html_url: 'https://github.com/acme/widget',
  pushed_at: new Date().toISOString(), created_at: '2023-01-01T00:00:00Z',
  default_branch: 'main', size: 42, topics: ['demo', 'widget']
};
var T_TREE = [
  { path: 'README.md', type: 'blob', size: 100 },
  { path: 'package.json', type: 'blob', size: 200 },
  { path: 'LICENSE', type: 'blob', size: 1000 },
  { path: '.gitignore', type: 'blob', size: 50 },
  { path: '.github/workflows/ci.yml', type: 'blob', size: 400 },
  { path: 'src/index.js', type: 'blob', size: 3000 },
  { path: 'src/app.js', type: 'blob', size: 2500 },
  { path: 'src/util.js', type: 'blob', size: 1000 },
  { path: 'src/bigfile.js', type: 'blob', size: 15000 },
  { path: 'tests/index.test.js', type: 'blob', size: 800 },
  { path: 'logo.png', type: 'blob', size: 5000 }
];
var T_CONTENT = {
  'README.md': '# Widget\n\nA tiny widget.\n',
  'package.json': '{\n  "name": "widget",\n  "version": "1.0.0"\n}\n',
  'LICENSE': 'MIT License\n',
  '.gitignore': 'node_modules\n',
  '.github/workflows/ci.yml': 'name: CI\non: push\n',
  'src/index.js': '// entry point\n/* block\ncomment */\nconst app = require("./app");\napp.run();\n',
  'src/app.js': '// app\nfunction run() { console.log("hi"); }\nmodule.exports = { run };\n',
  'src/util.js': '// util\nfunction add(a, b) { return a + b; }\n',
  'src/bigfile.js': '// big\nfunction a() {\n  var x = 1;\n  return x;\n}\nfunction b() {\n  var y = 2;\n  return y;\n}\n',
  'tests/index.test.js': '// tests\ntest("adds", () => {});\n'
};
function T_fetchRaw(fullName, branch, p) {
  return T_CONTENT[p] != null ? Promise.resolve(T_CONTENT[p]) : Promise.resolve(null);
}

/* ========== 1. health score engine (from core.js) ========== */
(function () {
  console.log('healthCheckPaths');
  var paths = T_TREE.map(function (f) { return f.path; });
  var h = healthCheckPaths(paths, T_META);
  T_OK(typeof h.score === 'number' && h.score >= 0 && h.score <= 100, 'score is 0..100');
  T_OK(h.items.length === 10, '10 weighted checks');
  /* expected: Description 5 + Topics 10 + License 15 + README 15 + gitignore 5 + CI 15 + Tests 15 + Docs 0 + Contributing 0 + Active 10 = 90 */
  T_OK(h.score === 90, 'expected score 90, got ' + h.score);
  T_OK(RepodestCore.extOf('src/x.ts') === 'ts', 'extOf');
  T_OK(RepodestCore.isText({ path: 'a.py' }) && !RepodestCore.isText({ path: 'a.png' }), 'isText');
})();

/* ========== 2. digest: markdown ========== */
T_PENDING.push((function () {
  console.log('digest markdown');
  return RPDigest.generate(
    { meta: T_META, branch: 'main', tree: { tree: T_TREE }, sel: new Set(['src/index.js', 'src/app.js', 'README.md']) },
    { preset: 'general', format: 'md', model: 'gpt5', shrink: true, sigonly: false, readme: true, tree: true },
    null, T_fetchRaw
  ).then(function (res) {
    T_OK(!res.error && res.parts.length === 1, 'single part');
    var out = res.parts[0];
    T_OK(out.indexOf('# Repository Context: acme/widget') !== -1, 'header');
    T_OK(out.indexOf('## Task') !== -1, 'task section');
    T_OK(out.indexOf('# File: src/index.js') !== -1, 'file section');
    T_OK(out.indexOf('# File: README.md') !== -1, 'README included');
    T_OK(out.indexOf('```text') !== -1, 'file tree');
    T_OK(out.indexOf('End of repository digest') !== -1, 'footer');
    T_OK(out.indexOf('require("./app")') !== -1, 'file content present');
    T_OK(out.indexOf('// entry point') === -1, 'comments stripped (shrinker)');
  });
})());

/* ========== 3. digest: all formats ========== */
T_PENDING.push((function () {
  console.log('digest formats');
  var sel = new Set(['src/index.js', 'src/app.js']);
  var mk = function (fmt) {
    return RPDigest.generate(
      { meta: T_META, branch: 'main', tree: { tree: T_TREE }, sel: sel },
      { preset: 'review', format: fmt, model: 'claude', shrink: true, sigonly: false, readme: false, tree: true },
      null, T_fetchRaw
    );
  };
  return Promise.all([mk('xml'), mk('json'), mk('llmstxt'), mk('repomix')]).then(function (rs) {
    var xml = rs[0].parts[0];
    T_OK(xml.indexOf('<repository name="acme/widget"') !== -1 && xml.indexOf('</repository>') !== -1, 'xml structure');
    T_OK(xml.indexOf('<![CDATA[') !== -1, 'xml CDATA');

    var json = rs[1].parts[0];
    var parsed = null;
    try { parsed = JSON.parse(json); } catch (e) {}
    T_OK(parsed !== null, 'json is valid JSON');
    T_OK(parsed && parsed.repository === 'acme/widget', 'json repository');
    T_OK(parsed && Array.isArray(parsed.files) && parsed.files.length === 2, 'json files array');
    T_OK(parsed && parsed.file_tree && parsed.file_tree.indexOf('src') !== -1, 'json file_tree');

    var llm = rs[2].parts[0];
    T_OK(llm.indexOf('# acme/widget') === 0, 'llms.txt heading');
    T_OK(llm.indexOf('### src/index.js') !== -1, 'llms.txt file sections');
    T_OK(llm.indexOf('End of llms.txt repository documentation.') !== -1, 'llms.txt footer');

    var rm = rs[3].parts[0];
    T_OK(rm.indexOf('<repository_files>') !== -1 && rm.indexOf('</repository_files>') !== -1, 'repomix structure');
    T_OK(rm.indexOf('<file path="src/app.js">') !== -1, 'repomix file tag');
    T_OK(rm.indexOf('<directory_structure>') !== -1, 'repomix tree');
  });
})());

/* ========== 4. skipped files note (non-json) & valid json ========== */
T_PENDING.push((function () {
  console.log('digest skipped files');
  var sel = new Set(['src/index.js', 'logo.png']); /* logo.png = binary */
  return RPDigest.generate(
    { meta: T_META, branch: 'main', tree: { tree: T_TREE }, sel: sel },
    { preset: 'general', format: 'md', model: 'gpt5', shrink: false, sigonly: false, readme: false, tree: false },
    null, T_fetchRaw
  ).then(function (res) {
    T_OK(res.stats.skipped === 1 && res.stats.binSkipped === 1, 'binary counted as skipped');
    T_OK(res.parts[0].indexOf('files skipped') !== -1, 'md shows skip note');
    return RPDigest.generate(
      { meta: T_META, branch: 'main', tree: { tree: T_TREE }, sel: sel },
      { preset: 'general', format: 'json', model: 'gpt5', shrink: false, sigonly: false, readme: false, tree: false },
      null, T_fetchRaw
    );
  }).then(function (res) {
    var ok = true;
    try { JSON.parse(res.parts[0]); } catch (e) { ok = false; }
    T_OK(ok, 'json stays valid when files are skipped');
  });
})());

/* ========== 5. context splitting (llama 8k) ========== */
T_PENDING.push((function () {
  console.log('digest splitting');
  var files = [];
  var sel = new Set();
  for (var i = 0; i < 30; i++) {
    var p = 'src/mod' + i + '.js';
    files.push({ path: p, type: 'blob', size: 4000 });
    T_CONTENT[p] = '// header\n' + Array(200).join('function f(){ return 1; }\n');
    sel.add(p);
  }
  return RPDigest.generate(
    { meta: T_META, branch: 'main', tree: { tree: T_TREE.concat(files) }, sel: sel },
    { preset: 'general', format: 'md', model: 'llama', shrink: true, sigonly: false, readme: false, tree: true },
    null, T_fetchRaw
  ).then(function (res) {
    T_OK(res.parts.length > 1, 'splits into ' + res.parts.length + ' parts for 8k model');
    T_OK(res.parts[0].indexOf('part 1/') !== -1, 'part label in header');
  });
})());

/* ========== 6. signatures-only mode ========== */
T_PENDING.push((function () {
  console.log('digest signatures');
  return RPDigest.generate(
    { meta: T_META, branch: 'main', tree: { tree: T_TREE }, sel: new Set(['src/bigfile.js']) },
    { preset: 'general', format: 'md', model: 'gpt5', shrink: true, sigonly: true, readme: false, tree: false },
    null, T_fetchRaw
  ).then(function (res) {
    T_OK(res.stats.sigShrunk === 1, 'signature extraction applied');
    T_OK(res.parts[0].length < 4000, 'shrunk output is small');
  });
})());

/* ========== 7. selection helpers ========== */
(function () {
  console.log('selection helpers');
  var all = RPDigest.selectAllText({ tree: T_TREE });
  T_OK(all.indexOf('src/index.js') !== -1 && all.indexOf('logo.png') === -1, 'selectAllText skips binary');
  var bug = RPDigest.selectByGoal({ tree: T_TREE }, 'bug');
  T_OK(bug.indexOf('src/index.js') !== -1 && bug.indexOf('tests/index.test.js') !== -1, 'bug preset: entry + tests');
  var sec = RPDigest.selectByGoal({ tree: T_TREE }, 'security');
  T_OK(sec.indexOf('.github/workflows/ci.yml') !== -1, 'security preset: workflows');
})();

/* ========== 8. api layer: settings & cache (memory fallback) ========== */
T_PENDING.push((function () {
  console.log('api storage & cache');
  return RPApi.setSettings({ pat: 'ghp_test' }).then(function (s) {
    T_OK(s.pat === 'ghp_test' && s.lang === 'auto', 'settings merge with defaults');
    return RPApi.cacheSet('k1', { hello: 'world' });
  }).then(function () {
    return RPApi.cacheGet('k1', 1000);
  }).then(function (v) {
    T_OK(v && v.hello === 'world', 'cache set/get');
  }).then(function () {
    var key = 'ttl';
    return RPApi.cacheSet(key, 42).then(function () { return RPApi.cacheGet(key, -1); });
  }).then(function (v) {
    T_OK(v === null, 'cache respects TTL');
    return RPApi.setSettings({ pat: '' });
  });
})());

/* ========== 9. i18n ========== */
(function () {
  console.log('i18n');
  RPI18N.init('en');
  T_OK(RPI18N.t('tabDigest') === 'Digest', 'en string');
  RPI18N.init('fa');
  T_OK(RPI18N.t('tabDigest') === 'دایجست', 'fa string');
  T_OK(RPI18N.t('digestParts', { n: 3 }).indexOf('۳') !== -1 || RPI18N.t('digestParts', { n: 3 }).indexOf('3') !== -1, 'fa interpolation');
  T_OK(RPI18N.isRTL() === true, 'fa is RTL');
  RPI18N.init('en');
  T_OK(RPI18N.isRTL() === false, 'en is LTR');
})();

/* ========== 10. token estimation ========== */
(function () {
  console.log('token estimation');
  T_OK(RPDigest.estimateTokens(400, 'gpt5') === 100, 'gpt5 ~4 chars/token');
  T_OK(RPDigest.estimateTokens(360, 'claude') === 100, 'claude ~3.6 chars/token');
  T_OK(RPDigest.tokenBudget('llama') === Math.floor(8000 * 0.9 * 4.2), 'llama budget');
})();

/* ========== 11. localized timeAgo ========== */
(function () {
  console.log('timeAgo i18n');
  var now = Date.now();
  RPI18N.init('en');
  T_OK(RPI18N.timeAgo(new Date(now - 2 * 864e5).toISOString()) === '2d ago', 'en days');
  T_OK(RPI18N.timeAgo(new Date(now).toISOString()) === 'today', 'en today');
  RPI18N.init('fa');
  T_OK(RPI18N.timeAgo(new Date(now - 2 * 864e5).toISOString()).indexOf('روز پیش') !== -1, 'fa days');
  T_OK(RPI18N.timeAgo(new Date(now).toISOString()) === 'امروز', 'fa today');
  T_OK(/[۰-۹]/.test(RPI18N.timeAgo(new Date(now - 3 * 864e5).toISOString())), 'fa digits');
  T_OK(RPI18N.timeAgo(null) === 'نامشخص', 'fa unknown');
  RPI18N.init('en');
  T_OK(RPI18N.timeAgo(null) === 'unknown', 'en unknown');
})();

/* ========== 12. PR X-Ray engine ========== */
(function () {
  console.log('PR analyze & digest');
  var pr = {
    number: 1, title: 'fix: harden login session handling',
    user: { login: 'alice' }, state: 'open', merged_at: null, draft: false,
    created_at: '2026-11-01T00:00:00Z', html_url: 'https://github.com/acme/widget/pull/1',
    base: { ref: 'main', repo: { full_name: 'acme/widget' } }, head: { ref: 'patch-1' }, labels: []
  };
  var files = [
    { filename: 'src/auth/login.js', additions: 10, deletions: 2, changes: 12 },
    { filename: 'src/auth/login.test.js', additions: 30, deletions: 0, changes: 30 },
    { filename: 'migrations/001_users.sql', additions: 5, deletions: 1, changes: 6 },
    { filename: '.github/workflows/deploy.yml', additions: 4, deletions: 0, changes: 4 }
  ];
  var an = analyzePR(pr, files);
  T_OK(an.totals.add === 49 && an.totals.del === 3, 'totals add/del');
  T_OK(an.risks.some(function (r) { return r.label.indexOf('Authentication') !== -1; }), 'auth risk flagged');
  T_OK(an.risks.some(function (r) { return r.label.indexOf('migration') !== -1; }), 'migration risk flagged');
  T_OK(an.risks.some(function (r) { return r.label.indexOf('CI/CD') !== -1; }), 'CI risk flagged');
  T_OK(an.riskScore >= 8 && an.verdict === 'high', 'riskScore ' + an.riskScore + ' → high');
  T_OK(an.changeType === 'fix', 'changeType fix from title');
  T_OK(an.testShare > 0, 'test share computed (' + an.testShare + '%)');
  T_OK(an.byType.test && an.byType.test.files === 1, 'byType classification');
  T_OK(an.truncated === false, 'not truncated under 100 files');

  var md = buildPRDigest(pr, files, an, {});
  T_OK(md.indexOf('# Pull Request Review Digest') === 0, 'review digest header');
  T_OK(md.indexOf('PR #1') !== -1, 'review digest PR number');
  T_OK(md.indexOf('Risk level: **high') !== -1, 'review digest risk level');
  T_OK(md.indexOf('Authentication') !== -1, 'review digest lists risk areas');

  /* low-risk PR: docs only */
  var an2 = analyzePR({ title: 'docs: update readme', labels: [] }, [{ filename: 'README.md', additions: 2, deletions: 2, changes: 4 }]);
  T_OK(an2.verdict === 'low' && an2.changeType === 'docs', 'docs-only PR → low risk, docs type');
})();

/* ========== 13. code smell scan ========== */
(function () {
  console.log('smell scan');
  var sm = RPDigest.smellScan([
    { path: 'src/dirty.js', ext: 'js', content: '// TODO fix this\nvar x = 1;\nif (a == b) { console.log("hi"); }\nconst ip = "192.168.0.1";\neval("2+2");\n' },
    { path: 'src/dirty.py', ext: 'py', content: 'try:\n    pass\nexcept:\n    pass\nfrom os import *\n' },
    { path: 'src/clean.js', ext: 'js', content: 'const add = (a, b) => a + b;\nexport default add;\n' }
  ]);
  T_OK(sm.total >= 8, 'smell total ' + sm.total + ' >= 8');
  T_OK(sm.byRule['TODO / FIXME / HACK'] === 1, 'todo rule');
  T_OK(sm.byRule['console logging'] === 1, 'console rule');
  T_OK(sm.byRule['var usage'] === 1, 'var rule');
  T_OK(sm.byRule['loose equality (==)'] === 1, 'loose equality rule');
  T_OK(sm.byRule['eval()'] === 1, 'eval rule');
  T_OK(sm.byRule['hardcoded IP'] === 1, 'hardcoded IP rule (quoted only)');
  T_OK(sm.byRule['bare except'] === 1, 'bare except rule (py)');
  T_OK(sm.byRule['wildcard import'] === 1, 'wildcard import rule (py)');
  T_OK(sm.files[0].path === 'src/dirty.js', 'top file sorted by count');
  T_OK(sm.clean === false, 'not clean');

  var clean = RPDigest.smellScan([{ path: 'src/clean.js', ext: 'js', content: 'const add = (a, b) => a + b;\n' }]);
  T_OK(clean.clean === true && clean.total === 0, 'clean file → 0 smells');
  T_OK(clean.perKloc === 0, 'clean density 0');
})();

/* ========== 14. dependency manifest parsers ========== */
(function () {
  console.log('manifest parsers');
  var npm = RPApi.parseDeps('package.json', JSON.stringify({
    dependencies: { lodash: '^4.17.15', 'left-pad': '~1.3.0', x: '1.2.3', y: '*', z: 'git+https://github.com/x/y.git' }
  }));
  T_OK(npm.length === 3, 'npm: 3 pinned deps, got ' + npm.length);
  T_OK(npm.some(function (d) { return d.name === 'lodash' && d.version === '4.17.15' && d.eco === 'npm'; }), 'npm lodash ^4.17.15 → 4.17.15');
  T_OK(npm.some(function (d) { return d.name === 'left-pad' && d.version === '1.3.0'; }), 'npm left-pad ~1.3.0 → 1.3.0');

  var req = RPApi.parseDeps('requirements.txt', 'requests==2.31.0\nflask>=2.0\n# comment\nDjango===4.2\n-r other.txt\n');
  T_OK(req.length === 2, 'PyPI: 2 pinned deps, got ' + req.length);
  T_OK(req.some(function (d) { return d.name === 'requests' && d.version === '2.31.0' && d.eco === 'PyPI'; }), 'PyPI requests==2.31.0');
  T_OK(req.some(function (d) { return d.name === 'django' && d.version === '4.2'; }), 'PyPI Django normalized to django');

  var go = RPApi.parseDeps('go.mod', 'module x\n\ngo 1.21\n\nrequire (\n\tgithub.com/pkg/errors v0.9.1\n)\nrequire golang.org/x/mod v0.14.0\n');
  T_OK(go.length === 2, 'Go: 2 deps, got ' + go.length);
  T_OK(go.some(function (d) { return d.name === 'github.com/pkg/errors' && d.version === '0.9.1' && d.eco === 'Go'; }), 'Go module version stripped');

  var cargo = RPApi.parseDeps('Cargo.toml', '[dependencies]\nserde = "1.0.190"\nrand = { version = "0.8.5", features = [] }\n\n[dev-dependencies]\ntempfile = "3.8.0"\n');
  T_OK(cargo.length === 2, 'Cargo: [dependencies] only, got ' + cargo.length);
  T_OK(cargo.every(function (d) { return d.name !== 'tempfile'; }), 'Cargo: dev-dependencies excluded');
  T_OK(cargo.some(function (d) { return d.name === 'serde' && d.version === '1.0.190' && d.eco === 'crates.io'; }), 'Cargo serde');

  T_OK(RPApi.parseDeps('package.json', 'not json').length === 0, 'invalid JSON → no deps');
})();

/* ========== 15. OSV client (mocked fetch) ========== */
T_PENDING.push((function () {
  console.log('osv client');
  globalThis.fetch = function (url, opts) {
    globalThis.__lastFetch = { url: url, opts: opts };
    return Promise.resolve({
      ok: true, status: 200,
      headers: { get: function () { return null; } },
      json: function () {
        return Promise.resolve({ results: [{ vulns: [{ id: 'GHSA-1' }, { id: 'GHSA-2' }] }, {}] });
      },
      text: function () {
        return Promise.resolve('{"dependencies":{"lodash":"4.17.15"}}');
      }
    });
  };
  return RPApi.osvQueryBatch([{ package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.15' }]).then(function (results) {
    T_OK(results.length === 2 && results[0].vulns.length === 2, 'querybatch parses results');
    T_OK(globalThis.__lastFetch.url.indexOf('api.osv.dev/v1/querybatch') !== -1, 'osv endpoint used');
    T_OK(JSON.parse(globalThis.__lastFetch.opts.body).queries.length === 1, 'body carries queries');
    return RPApi.scanVulns('acme', 'widget', 'main', { tree: [{ path: 'package.json', type: 'blob', size: 40 }] });
  }).then(function (scan) {
    T_OK(scan.scanned === 1 && scan.deps[0].name === 'lodash', 'scanVulns parsed the manifest');
    T_OK(scan.vulns.length === 1 && scan.vulns[0].pkg === 'lodash', 'vulnerable package detected');
    T_OK(scan.total === 2, 'vuln total counts ids');
  });
})());

/* ========== 16. settings cache & cache pruning ========== */
T_PENDING.push((function () {
  console.log('settings cache & pruning');
  RPApi._settings = null;
  return RPApi.getSettings().then(function (s) {
    T_OK(RPApi._settings && RPApi._settings.preset === 'general', 'settings hydrated into memory');
    s.preset = 'mutated';
    return RPApi.getSettings();
  }).then(function (s) {
    T_OK(s.preset === 'general', 'cached settings returned as a copy');
    return RPApi.storeSet({ 'rp_c_stale': { t: Date.now() - 20 * 864e5, v: 1 }, 'rp_c_fresh': { t: Date.now(), v: 2 } });
  }).then(function () {
    return RPApi.pruneCache({ maxAgeDays: 14, maxEntries: 48 });
  }).then(function () {
    return Promise.all([RPApi.cacheGet('stale', 1e15), RPApi.cacheGet('fresh', 1e15)]);
  }).then(function (v) {
    T_OK(v[0] === null, 'prune drops entries older than 14 days');
    T_OK(v[1] === 2, 'prune keeps fresh entries');
  });
})());

/* ========== 17. PR files pagination (mocked API) ========== */
T_PENDING.push((function () {
  console.log('PR files pagination');
  function res(status, body) {
    return {
      ok: status >= 200 && status < 300, status: status,
      headers: { get: function (h) { return h === 'x-ratelimit-remaining' ? '50' : h === 'x-ratelimit-limit' ? '60' : null; } },
      json: function () { return Promise.resolve(body); },
      text: function () { return Promise.resolve(''); }
    };
  }
  var origFetch = globalThis.fetch;
  globalThis.fetch = function (url, opts) {
    if (url.indexOf('/pulls/7') === -1) return origFetch(url, opts);
    if (url.indexOf('/files') === -1) return Promise.resolve(res(200, { number: 7, title: 'Big PR' }));
    var m = url.match(/[?&]page=(\d+)/);
    var page = m ? Number(m[1]) : 1;
    var n = page === 3 ? 50 : 100;
    var files = [];
    for (var i = 0; i < n; i++) files.push({ filename: 'f' + page + '_' + i + '.js', additions: 1, deletions: 0, changes: 1 });
    return Promise.resolve(res(200, files));
  };
  return RPApi.fetchPull('acme', 'widget', 7, { force: true }).then(function (d) {
    globalThis.fetch = origFetch;
    T_OK(d.files.length === 250, 'fetches 3 pages (got ' + d.files.length + ')');
    T_OK(d.truncated === false, 'not truncated at 250 files');
  }, function (e) {
    globalThis.fetch = origFetch;
    throw e;
  });
})());

/* ========== 18. extra manifest parsers ========== */
(function () {
  console.log('extra manifest parsers');
  var req = RPApi.parseDeps('requirements.txt', 'requests~=2.31.0\nuvicorn[standard]==0.24.0\nflask>=2.0\n');
  T_OK(req.length === 2, 'requirements: ~= and extras parsed (got ' + req.length + ')');
  T_OK(req.some(function (d) { return d.name === 'requests' && d.version === '2.31.0'; }), 'requirements ~= keeps compatible version');
  T_OK(req.some(function (d) { return d.name === 'uvicorn' && d.version === '0.24.0'; }), 'requirements extras stripped');

  var py = RPApi.parseDeps('pyproject.toml', '[project]\ndependencies = [\n  "requests==2.31.0",\n  "httpx~=0.25.0",\n]\n\n[tool.poetry.dependencies]\npython = "^3.11"\nserde = "1.0.0"\n');
  T_OK(py.some(function (d) { return d.name === 'requests' && d.version === '2.31.0'; }), 'pyproject PEP 621 dependency');
  T_OK(py.some(function (d) { return d.name === 'httpx' && d.version === '0.25.0'; }), 'pyproject ~= dependency');
  T_OK(py.every(function (d) { return d.name !== 'python'; }), 'pyproject skips python runtime');

  var comp = RPApi.parseDeps('composer.json', JSON.stringify({ require: { php: '>=8.1', 'monolog/monolog': '^3.0' } }));
  T_OK(comp.length === 1 && comp[0].name === 'monolog/monolog', 'composer skips platform packages');

  var npmDev = RPApi.parseDeps('package.json', JSON.stringify({ dependencies: { a: '1.0.0' }, devDependencies: { b: '2.0.0' } }), { includeDev: true });
  T_OK(npmDev.length === 2, 'npm devDependencies included on request');

  var goal = filterPathsByGoal(['package-lock.json', 'src/index.js', 'dist/app.js', 'node_modules/pkg/index.js', 'README.md'], 'bug');
  T_OK(goal.indexOf('package-lock.json') === -1 && goal.indexOf('node_modules/pkg/index.js') === -1 && goal.indexOf('dist/app.js') === -1, 'goal presets exclude lockfiles and vendored dirs');
  var goalSel = RPDigest.selectByGoal({ tree: [{ path: 'logo.png', type: 'blob', size: 1000 }, { path: 'src/index.js', type: 'blob', size: 100 }] }, 'all');
  T_OK(goalSel.indexOf('logo.png') === -1, 'goal selection skips binary files');
})();

/* ========== 19. smell scan runs on raw text, CDATA is safe ========== */
T_PENDING.push((function () {
  console.log('smell scan with shrinker');
  T_CONTENT['src/todo.js'] = '// TODO: fix this\nexport const x = 1;\n';
  var tree = { tree: [{ path: 'src/todo.js', type: 'blob', size: 40 }] };
  return RPDigest.generate(
    { meta: T_META, branch: 'main', tree: tree, sel: new Set(['src/todo.js']) },
    { preset: 'general', format: 'md', model: 'gpt5', shrink: true, sigonly: false, readme: false, tree: false },
    null, T_fetchRaw
  ).then(function (res) {
    T_OK(res.smells && res.smells.total >= 1, 'TODO found even though comments are stripped');
    T_OK(res.parts[0].indexOf('TODO') === -1, 'shrinker removed the TODO comment from the digest');
    var xml = RPDigest.wrapFile('a.js', 'js', 'const s = "]]>";', 'xml');
    T_OK(xml.indexOf(']]]]><![CDATA[>') !== -1, 'CDATA terminator escaped');
  });
})());

/* ========== 20. scanVulns handles Cargo.toml, PR partial 304, Activity rate limit ========== */
/* Run after earlier mocked-fetch tests so globalThis.fetch does not race */
var T_SEQ = Promise.all(T_PENDING).then(function () {
  console.log('scanVulns Cargo.toml, PR partial 304 & activity rate limit');
  var origFetch = globalThis.fetch;
  function mkRes(status, body, headersMap) {
    headersMap = headersMap || {};
    return {
      ok: status >= 200 && status < 300,
      status: status,
      headers: { get: function (h) { return headersMap[h.toLowerCase()] || null; } },
      json: function () { return Promise.resolve(body); },
      text: function () { return Promise.resolve(typeof body === 'string' ? body : ''); }
    };
  }
  var requestedUrls = [];
  globalThis.fetch = function (url, opts) {
    requestedUrls.push(String(url));
    if (String(url).indexOf('raw.githubusercontent.com/rust-org/crate/main/Cargo.toml') !== -1) {
      return Promise.resolve(mkRes(200, '[dependencies]\nserde = "1.0.190"\n'));
    }
    if (String(url).indexOf('api.osv.dev/v1/querybatch') !== -1) {
      return Promise.resolve(mkRes(200, { results: [{ vulns: [{ id: 'RUSTSEC-1' }] }] }));
    }
    /* PR #99: page 1 returns 200 (100 files), page 2 returns 304 */
    if (String(url).indexOf('/pulls/99/files') !== -1) {
      var pm = String(url).match(/[?&]page=(\d+)/);
      var page = pm ? Number(pm[1]) : 1;
      if (page === 1) {
        var p1 = [];
        for (var i = 0; i < 100; i++) p1.push({ filename: 'p1_' + i + '.js', additions: 1, deletions: 0, changes: 1 });
        return Promise.resolve(mkRes(200, p1, { etag: '"e1"' }));
      }
      if (page === 2) {
        if (opts && opts.headers && opts.headers['If-None-Match'] === '"e2"') {
          return Promise.resolve(mkRes(304, null, {}));
        }
        return Promise.resolve(mkRes(200, [{ filename: 'p2_0.js', additions: 1, deletions: 0, changes: 1 }], { etag: '"e2"' }));
      }
      return Promise.resolve(mkRes(200, [], {}));
    }
    if (String(url).indexOf('/pulls/99') !== -1) {
      return Promise.resolve(mkRes(200, { number: 99, title: 'PR 99' }, {}));
    }
    if (String(url).indexOf('/repos/lim/repo/') !== -1) {
      return Promise.resolve(mkRes(403, { message: 'rate limit' }, { 'x-ratelimit-remaining': '0', 'x-ratelimit-limit': '60' }));
    }
    return origFetch(url, opts);
  };

  return RPApi.scanVulns('rust-org', 'crate', 'main', { tree: [{ path: 'Cargo.toml', type: 'blob', size: 120 }] }).then(function (scan) {
    T_OK(scan.scanned === 1 && scan.deps[0].name === 'serde' && scan.deps[0].eco === 'crates.io', 'scanVulns finds and scans Cargo.toml');
    T_OK(scan.vulns.length === 1 && scan.vulns[0].ids[0] === 'RUSTSEC-1', 'scanVulns flags Cargo.toml vulnerability');
    T_OK(requestedUrls.some(function (u) { return u.indexOf('/Cargo.toml') !== -1; }), 'scanVulns preserves Cargo.toml casing in raw URL');

    /* Seed expired PR cache + etag for page 2, then revalidate with page 1 = 200, page 2 = 304 */
    var oldFiles = [];
    for (var i = 0; i < 100; i++) oldFiles.push({ filename: 'old_p1_' + i + '.js', additions: 1, deletions: 0, changes: 1 });
    oldFiles.push({ filename: 'old_p2_kept.js', additions: 2, deletions: 0, changes: 2 });
    return RPApi.storeSet({
      'rp_c_pull:acme/widget#99': { t: 0, v: { pr: { number: 99 }, files: oldFiles, truncated: false } },
      'rp_e_pull:acme/widget#99!files2': '"e2"'
    }).then(function () {
      return RPApi.fetchPull('acme', 'widget', 99);
    });
  }).then(function (d) {
    T_OK(d.files.length === 101 && d.files.some(function (f) { return f.filename === 'old_p2_kept.js'; }), 'fetchPull preserves page 2 cached files on partial 304');
    return RPApi.fetchActivity('lim', 'repo', { force: true }).then(function () {
      T_OK(false, 'fetchActivity should reject on 403 rate limit');
    }, function (err) {
      T_OK(err && err.code === 'RATE_LIMIT', 'fetchActivity propagates RATE_LIMIT instead of EMPTY');
    });
  }).then(function () {
    globalThis.fetch = origFetch;
  }, function (e) {
    globalThis.fetch = origFetch;
    throw e;
  });
});

/* ========== v1.5: compare / battle mode (pure core) ========== */
(function () {
  console.log('compareRepos');
  var pathsA = T_TREE.map(function (f) { return f.path; });
  var hA = healthCheckPaths(pathsA, T_META); /* score 90 */
  var metaB = Object.assign({}, T_META, {
    full_name: 'beta/gadget', stargazers_count: 9999, forks_count: 500,
    subscribers_count: 40, open_issues_count: 1, size: 10,
    pushed_at: new Date(Date.now() - 30 * 864e5).toISOString()
  });
  var r = RepodestCore.compareRepos(
    { name: 'acme/widget', meta: T_META, health: hA },
    { name: 'beta/gadget', meta: metaB, health: null }
  );
  T_OK(r.rows.length === 11, 'compareRepos emits 11 metric rows');
  T_OK(r.rows.map(function (x) { return x.key; }).join(',') === 'health,stars,forks,watchers,issues,size,fresh,license,ci,tests,readme', 'compareRepos row keys/order');
  var byKey = {};
  r.rows.forEach(function (x) { byKey[x.key] = x; });
  T_OK(byKey.health.a === 90 && byKey.health.b === null && byKey.health.winner === 0, 'missing health → no winner, not a crash');
  T_OK(byKey.stars.winner === 2 && byKey.forks.winner === 2, 'higher stars/forks wins for B');
  T_OK(byKey.issues.winner === 2 && byKey.issues.lowerBetter === true, 'fewer open issues wins (lowerBetter)');
  T_OK(byKey.size.winner === 2, 'smaller repo size wins (lowerBetter)');
  T_OK(byKey.fresh.a === 0 && byKey.fresh.b === 30 && byKey.fresh.winner === 1, 'freshness: days since push, lower wins');
  T_OK(byKey.watchers.a === null && byKey.watchers.winner === 0, 'missing metric on one side → tie/unknown');
  T_OK(byKey.license.a === 1 && byKey.license.b === null && byKey.license.winner === 0, 'health checks mapped to 1/0/null');
  T_OK(r.wins.a === 1 && r.wins.b === 4 && r.overall === 2, 'overall winner = more metric wins');

  var tie = RepodestCore.compareRepos({ meta: T_META, health: hA }, { meta: T_META, health: hA });
  T_OK(tie.overall === 0 && tie.wins.a === 0 && tie.wins.b === 0, 'identical repos → tie');

  var empty = RepodestCore.compareRepos(null, null);
  T_OK(empty.rows.length === 11 && empty.overall === 0 && empty.rows.every(function (x) { return x.a === null && x.b === null; }), 'null bundles are safe');

  var hB = healthCheckPaths(['src/x.js'], { description: '', pushed_at: new Date().toISOString() });
  var r2 = RepodestCore.compareRepos({ meta: T_META, health: hA }, { meta: metaB, health: hB });
  var bk2 = {};
  r2.rows.forEach(function (x) { bk2[x.key] = x; });
  T_OK(bk2.license.a === 1 && bk2.license.b === 0 && bk2.license.winner === 1, 'license check: present beats absent');
  T_OK(bk2.ci.winner === 1 && bk2.tests.winner === 1 && bk2.readme.winner === 1, 'CI/tests/README checks compare correctly');
})();

/* ========== v1.5: recent repos history (pure core) ========== */
(function () {
  console.log('pushRecent');
  var l1 = RepodestCore.pushRecent([], { full: 'a/b', t: 5, score: 80 }, 10);
  T_OK(l1.length === 1 && l1[0].full === 'a/b' && l1[0].score === 80, 'pushRecent adds newest entry');
  var l2 = RepodestCore.pushRecent(l1, { full: 'A/B', t: 9 }, 10);
  T_OK(l2.length === 1 && l2[0].full === 'A/B' && l2[0].t === 9, 'pushRecent dedupes case-insensitively, newest first');
  var big = [];
  for (var i = 0; i < 12; i++) big.push({ full: 'o/r' + i, t: i });
  var l3 = RepodestCore.pushRecent(big, { full: 'new/repo', t: 99 }, 10);
  T_OK(l3.length === 10 && l3[0].full === 'new/repo' && !l3.some(function (x) { return x.full === 'o/r11'; }), 'pushRecent caps the list, drops oldest');
  var l4 = RepodestCore.pushRecent(l1, { full: 'no-slash' }, 10);
  T_OK(l4.length === 1 && l4[0].full === 'a/b', 'pushRecent rejects invalid entries');
  T_OK(RepodestCore.pushRecent(null, { full: 'x/y' }, 3).length === 1, 'pushRecent tolerates null list');
})();

/* ========== v1.5: shareable Markdown health report ========== */
(function () {
  console.log('healthReportMarkdown');
  var h = healthCheckPaths(T_TREE.map(function (f) { return f.path; }), T_META);
  var md = RepodestCore.healthReportMarkdown(T_META, h, { JavaScript: 900, Python: 100 });
  T_OK(md.indexOf('# 🧪 Repodest report: acme/widget') === 0, 'report starts with repo title');
  T_OK(md.indexOf('**Health score: 90/100**') !== -1, 'report includes the score');
  T_OK(md.indexOf('| License | ✅ |') !== -1 && md.indexOf('| Docs folder | ❌ |') !== -1, 'report renders check table');
  T_OK(md.indexOf('- ⭐ Stars: 1.2k') !== -1, 'report formats facts');
  T_OK(md.indexOf('JavaScript (90%)') !== -1, 'report includes language breakdown');
  T_OK(md.indexOf('https://github.com/acme/widget') !== -1 && md.indexOf('Generated by [Repodest]') !== -1, 'report links repo + Repodest');
  var bare = RepodestCore.healthReportMarkdown(null, null, null);
  T_OK(bare.indexOf('unknown repo') !== -1, 'report tolerates null meta/health');
})();

/* ========== v1.5: i18n parity for new strings ========== */
(function () {
  console.log('i18n v1.5 keys');
  var keys = ['compareTab', 'compareHint', 'comparePlaceholder', 'compareBtn', 'compareLoading',
    'compareSameRepo', 'compareWins', 'compareTie', 'compareNoTree', 'cmpFresh',
    'recentTitle', 'recentClear', 'reportCopy', 'reportCopied', 'invalidInput'];
  T_OK(keys.every(function (k) { return typeof RPI18N.en[k] === 'string' && RPI18N.en[k].length > 0; }), 'all 15 new keys exist in EN');
  T_OK(keys.every(function (k) { return typeof RPI18N.fa[k] === 'string' && RPI18N.fa[k].length > 0; }), 'all 15 new keys exist in FA');
  RPI18N.init('en');
  T_OK(RPI18N.t('compareWins', { name: 'beta/gadget', a: 4, b: 1 }).indexOf('beta/gadget') !== -1, 'compareWins interpolates name');
  RPI18N.init('fa');
  T_OK(RPI18N.isRTL() && RPI18N.t('compareTab') === RPI18N.fa.compareTab, 'FA compareTab resolves + RTL');
  RPI18N.init('en');
})();

globalThis.__RP_RESULTS_PROMISE = T_SEQ.then(function () {
  return { passed: T_PASSED, failed: T_FAILED };
});
globalThis.__RP_RESULTS = { passed: T_PASSED, failed: T_FAILED };
