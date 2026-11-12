'use strict';
/* ============================================================
   Repodest Extension — GitHub API layer
   chrome.storage caching (6h repo / 1h activity), optional PAT,
   rate-limit tracking. Exposes: RPApi
   ============================================================ */
const RPApi = { rateRemaining: null, rateLimit: null, _rateListeners: [] };

RPApi.onRate = function (fn) { RPApi._rateListeners.push(fn); };
RPApi._emitRate = function () {
  RPApi._rateListeners.forEach(function (fn) {
    try { fn({ remaining: RPApi.rateRemaining, limit: RPApi.rateLimit }); } catch (e) {}
  });
};

/* ---------- storage (chrome.storage.local, fallback: memory) ---------- */
const _RP_MEM = {};
RPApi.storeGet = async function (keys) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return await chrome.storage.local.get(keys);
  }
  const out = {};
  if (keys == null) {
    Object.keys(_RP_MEM).forEach(function (k) { out[k] = _RP_MEM[k]; });
    return out;
  }
  (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { if (_RP_MEM[k] !== undefined) out[k] = _RP_MEM[k]; });
  return out;
};
RPApi.storeSet = async function (obj) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return await chrome.storage.local.set(obj);
  }
  Object.assign(_RP_MEM, obj);
};
RPApi.storeRemove = async function (keys) {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return await chrome.storage.local.remove(keys);
  }
  (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { delete _RP_MEM[k]; });
};

/* ---------- settings ---------- */
RPApi.DEFAULT_SETTINGS = {
  pat: '',
  lang: 'auto',          /* auto | en | fa */
  theme: 'auto',         /* auto | dark | light */
  preset: 'general',
  format: 'md',
  model: 'gpt5',
  shrink: true,
  sigonly: false,
  readme: true,
  tree: true,
  customTask: ''
};
/* Settings are read on every API request, so keep a memory copy and
   hydrate it once per session. chrome.storage.onChanged invalidates it. */
RPApi._settings = null;
RPApi._settingsLoading = null;
RPApi.getSettings = async function (opts) {
  opts = opts || {};
  if (!opts.force && RPApi._settings) return Object.assign({}, RPApi._settings);
  if (!RPApi._settingsLoading) {
    RPApi._settingsLoading = (async function () {
      const keys = Object.keys(RPApi.DEFAULT_SETTINGS);
      const o = await RPApi.storeGet(keys);
      const out = {};
      keys.forEach(function (k) { out[k] = o[k] !== undefined ? o[k] : RPApi.DEFAULT_SETTINGS[k]; });
      RPApi._settings = out;
      return out;
    })();
    RPApi._settingsLoading.then(function () { RPApi._settingsLoading = null; }, function () { RPApi._settingsLoading = null; });
  }
  return Object.assign({}, await RPApi._settingsLoading);
};
RPApi.setSettings = async function (patch) {
  const cur = await RPApi.getSettings();
  if (patch.pat !== undefined && patch.pat !== cur.pat) RPApi._patBad = false;
  const next = Object.assign({}, cur, patch);
  const obj = {};
  Object.keys(patch).forEach(function (k) { obj[k] = next[k]; });
  await RPApi.storeSet(obj);
  RPApi._settings = Object.assign({}, next);
  return Object.assign({}, next);
};
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area !== 'local' || !RPApi._settings) return;
    if (Object.keys(changes).some(function (k) { return k in RPApi.DEFAULT_SETTINGS; })) RPApi._settings = null;
  });
}

/* ---------- cache (TTL, size-guarded) ---------- */
/* One storage read returns both the fresh value and the stale copy used
   for ETag revalidation (previously two getters read the same key). */
RPApi.cacheEntry = async function (key) {
  const k = 'rp_c_' + key;
  const o = await RPApi.storeGet(k);
  return (o && o[k]) || null;
};
RPApi.cacheGet = async function (key, ttl) {
  const c = await RPApi.cacheEntry(key);
  if (c && (ttl == null || (Date.now() - c.t) < ttl)) return c.v;
  return null;
};
RPApi.cacheSet = async function (key, v) {
  try {
    const s = JSON.stringify(v);
    if (s.length > 8000000) return; /* per-entry guard: ~8 MB (very large trees) */
    await RPApi.storeSet({ ['rp_c_' + key]: { t: Date.now(), v: v } });
  } catch (e) {}
};
RPApi.clearCache = async function () {
  const all = await RPApi.storeGet(null);
  const keys = Object.keys(all || {}).filter(function (k) { return k.indexOf('rp_c_') === 0 || k.indexOf('rp_e_') === 0; });
  if (keys.length) await RPApi.storeRemove(keys);
  return keys.length;
};
RPApi.cacheSize = async function () {
  const all = await RPApi.storeGet(null);
  let n = 0, bytes = 0;
  Object.keys(all || {}).forEach(function (k) {
    if (k.indexOf('rp_c_') === 0) { n++; try { bytes += JSON.stringify(all[k]).length; } catch (e) {} }
  });
  return { entries: n, bytes: bytes };
};
/* Keep storage lean: drop entries older than maxAgeDays and anything
   beyond maxEntries (newest first), plus orphaned ETags. */
RPApi.pruneCache = async function (opts) {
  opts = opts || {};
  const maxAge = (opts.maxAgeDays != null ? opts.maxAgeDays : 14) * 864e5;
  const maxEntries = opts.maxEntries || 48;
  const all = (await RPApi.storeGet(null)) || {};
  const rows = [];
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('rp_c_') === 0 && all[k] && typeof all[k].t === 'number') rows.push({ k: k, t: all[k].t });
  });
  rows.sort(function (a, b) { return b.t - a.t; });
  const drop = [];
  const keep = new Set();
  rows.forEach(function (r, i) {
    if (i >= maxEntries || Date.now() - r.t > maxAge) drop.push(r.k);
    else keep.add(r.k.slice(5));
  });
  Object.keys(all).forEach(function (k) {
    if (k.indexOf('rp_e_') !== 0) return;
    if (!keep.has(k.slice(5).split('!')[0])) drop.push(k);
  });
  if (drop.length) await RPApi.storeRemove(drop);
  return drop.length;
};
/* Run the prune at most once a day (one extra storage read per session). */
RPApi.maybePrune = async function (maxAgeDays) {
  const o = await RPApi.storeGet('rp_pruned_at');
  const last = (o && o.rp_pruned_at) || 0;
  if (Date.now() - last < 864e5) return 0;
  await RPApi.storeSet({ rp_pruned_at: Date.now() });
  try { return await RPApi.pruneCache({ maxAgeDays: maxAgeDays || 14, maxEntries: 48 }); } catch (e) { return 0; }
};

/* ---------- fetch primitives ---------- */
RPApi._patBad = false; /* set when GitHub rejects the stored PAT (401) */
RPApi.authHeaders = async function (skipPat) {
  const s = await RPApi.getSettings();
  const h = { Accept: 'application/vnd.github+json' };
  if (s.pat && !skipPat && !RPApi._patBad) h.Authorization = 'Bearer ' + s.pat;
  return h;
};
RPApi.rawUrl = function (fullName, branch, path) {
  return 'https://raw.githubusercontent.com/' + fullName + '/' + encodeURIComponent(branch) + '/' +
    String(path).split('/').map(encodeURIComponent).join('/');
};
RPApi._updateRate = function (r) {
  const rem = r.headers && r.headers.get('x-ratelimit-remaining');
  const lim = r.headers && r.headers.get('x-ratelimit-limit');
  if (rem != null) { RPApi.rateRemaining = Number(rem); RPApi.rateLimit = lim != null ? Number(lim) : RPApi.rateLimit; RPApi._emitRate(); }
};

/* JSON GET from api.github.com — throws Error with .code.
   On 401 with a stored PAT: the token is marked bad and the
   request retries once anonymously (graceful degradation). */
RPApi._fetchApi = async function (path, headers, timeoutMs) {
  const init = { headers: headers };
  let timer = null;
  if (typeof AbortController !== 'undefined') {
    const ctrl = new AbortController();
    init.signal = ctrl.signal;
    timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 30000);
  }
  try {
    return await fetch('https://api.github.com' + path, init);
  } catch (e) {
    throw Object.assign(new Error('NETWORK'), { code: 'NETWORK' });
  } finally {
    if (timer) clearTimeout(timer);
  }
};
RPApi.api = async function (path) {
  let headers = await RPApi.authHeaders();
  const hadAuth = !!headers.Authorization;
  let r = await RPApi._fetchApi(path, headers);
  RPApi._updateRate(r);
  if (r.status === 401 && hadAuth) {
    RPApi._patBad = true;
    r = await RPApi._fetchApi(path, await RPApi.authHeaders(true));
    RPApi._updateRate(r);
  }
  if (r.status === 404) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  if (r.status === 202) return null; /* GitHub still computing (stats endpoints) */
  if (r.status === 403 || r.status === 429) {
    const rem = Number(r.headers.get('x-ratelimit-remaining'));
    if (rem === 0) throw Object.assign(new Error('RATE_LIMIT'), { code: 'RATE_LIMIT' });
    throw Object.assign(new Error('HTTP_403'), { code: 'HTTP_403' });
  }
  if (!r.ok) throw Object.assign(new Error('HTTP_' + r.status), { code: 'HTTP_' + r.status });
  return r.json();
};

/* ---------- conditional GET (ETag) ----------
   304 responses do not count against the GitHub rate limit, so
   revalidating an expired cache entry is quota-free. */
RPApi.apiCond = async function (path, etagKey, skipEtag) {
  let headers = await RPApi.authHeaders();
  const hadAuth = !!headers.Authorization;
  const stored = skipEtag ? null : await RPApi.storeGet('rp_e_' + etagKey);
  const etag = stored && stored['rp_e_' + etagKey];
  if (etag) headers['If-None-Match'] = etag;
  let r = await RPApi._fetchApi(path, headers);
  RPApi._updateRate(r);
  if (r.status === 401 && hadAuth) {
    RPApi._patBad = true;
    headers = await RPApi.authHeaders(true);
    if (etag) headers['If-None-Match'] = etag;
    r = await RPApi._fetchApi(path, headers);
    RPApi._updateRate(r);
  }
  if (r.status === 304) return { notModified: true };
  if (r.status === 404) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  if (r.status === 202) return { computed: true }; /* GitHub still crunching stats */
  if (r.status === 403 || r.status === 429) {
    const rem = Number(r.headers.get('x-ratelimit-remaining'));
    if (rem === 0) throw Object.assign(new Error('RATE_LIMIT'), { code: 'RATE_LIMIT' });
    throw Object.assign(new Error('HTTP_403'), { code: 'HTTP_403' });
  }
  if (!r.ok) throw Object.assign(new Error('HTTP_' + r.status), { code: 'HTTP_' + r.status });
  const fresh = r.headers.get('etag');
  if (fresh) await RPApi.storeSet({ ['rp_e_' + etagKey]: fresh });
  return { value: await r.json() };
};
/* Raw file text from raw.githubusercontent.com — null on failure */
RPApi.raw = async function (fullName, branch, path) {
  const init = {};
  let timer = null;
  if (typeof AbortController !== 'undefined') {
    const ctrl = new AbortController();
    init.signal = ctrl.signal;
    timer = setTimeout(function () { ctrl.abort(); }, 20000);
  }
  try {
    const r = await fetch(RPApi.rawUrl(fullName, branch, path), init);
    if (!r.ok) return null;
    return await r.text();
  } catch (e) { return null; }
  finally { if (timer) clearTimeout(timer); }
};
/* Rate-limit probe for the options page */
RPApi.probeToken = async function () {
  const out = { remaining: null, limit: null, login: null, user: null };
  try {
    const j = await RPApi.api('/rate_limit');
    if (j && j.resources && j.resources.core) { out.remaining = j.resources.core.remaining; out.limit = j.resources.core.limit; }
  } catch (e) { if (e.code) out.error = e.code; }
  const s = await RPApi.getSettings();
  if (s.pat) {
    try {
      const u = await RPApi.api('/user');
      if (u && u.login) { out.login = u.login; out.user = u; }
    } catch (e) { out.error = out.error || e.code; }
  }
  return out;
};

/* ---------- repo bundle: meta + languages + tree (cached 6h, etag-revalidated) ---------- */
RPApi.fetchRepo = async function (owner, repo, opts) {
  opts = opts || {};
  const key = String(owner).toLowerCase() + '/' + String(repo).toLowerCase();
  const ck = 'repo:' + key;
  const entry = opts.force ? null : await RPApi.cacheEntry(ck);
  if (entry && (Date.now() - entry.t) < 6 * 3600e3) return Object.assign({}, entry.v, { _cached: true });
  const old = entry ? entry.v : null;
  const base = '/repos/' + owner + '/' + repo;

  /* meta and languages are independent → one round trip instead of two */
  const langsP = RPApi.apiCond(base + '/languages', ck + '!langs', !!opts.force).then(function (r) {
    return r.notModified ? (old && old.langs) || {} : (r.value || {});
  }).catch(function () { return (old && old.langs) || {}; });

  let metaR = await RPApi.apiCond(base, ck + '!meta', !!opts.force);
  if (metaR.notModified && !(old && old.meta)) { await RPApi.storeRemove('rp_e_' + ck + '!meta'); metaR = await RPApi.apiCond(base, ck + '!meta', !!opts.force); }
  const meta = metaR.notModified ? (old && old.meta) : metaR.value;
  if (!meta) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  const branch = meta.default_branch || 'main';

  const treeP = (async function () {
    try {
      let treeR = await RPApi.apiCond(base + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1', ck + '!tree', !!opts.force);
      if (treeR.notModified && !(old && old.tree)) {
        await RPApi.storeRemove('rp_e_' + ck + '!tree');
        treeR = await RPApi.apiCond(base + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1', ck + '!tree', !!opts.force);
      }
      if (treeR.notModified) return (old && old.tree) || null;
      if (!treeR.value) return null;
      return { tree: (treeR.value.tree || []).map(function (t) { return { path: t.path, type: t.type, size: t.size || 0 }; }), truncated: !!treeR.value.truncated };
    } catch (e) { return (old && old.tree) || null; }
  })();

  const langs = await langsP;
  const tree = await treeP;

  const data = { meta: meta, langs: langs, branch: branch, tree: tree };
  await RPApi.cacheSet(ck, data);
  return Object.assign({}, data, { _cached: false });
};

/* ---------- activity bundle: weekly stats + contributors + commits (cached 1h, etag-revalidated) ---------- */
RPApi.fetchActivity = async function (owner, repo, opts) {
  opts = opts || {};
  const key = String(owner).toLowerCase() + '/' + String(repo).toLowerCase();
  const ck = 'act:' + key;
  const entry = opts.force ? null : await RPApi.cacheEntry(ck);
  if (entry && (Date.now() - entry.t) < 3600e3) return Object.assign({}, entry.v, { _cached: true });
  const old = entry ? entry.v : null;
  const base = '/repos/' + owner + '/' + repo;
  const out = { weekly: null, contributors: null, commits: null };

  /* three independent endpoints → one round trip */
  let firstErr = null;
  const captureErr = function (prev) {
    return function (err) {
      if (!firstErr || (err && err.code === 'RATE_LIMIT')) firstErr = err;
      return prev || null;
    };
  };
  const results = await Promise.all([
    RPApi.apiCond(base + '/stats/commit_activity', ck + '!weekly', !!opts.force).then(function (r) {
      if (r.notModified) return (old && old.weekly) || null;
      return r.computed ? null : r.value;
    }).catch(captureErr(old && old.weekly)),
    RPApi.apiCond(base + '/contributors?per_page=8', ck + '!contribs', !!opts.force).then(function (r) {
      return r.notModified ? (old && old.contributors) || null : r.value;
    }).catch(captureErr(old && old.contributors)),
    RPApi.apiCond(base + '/commits?per_page=10', ck + '!commits', !!opts.force).then(function (r) {
      return r.notModified ? (old && old.commits) || null : r.value;
    }).catch(captureErr(old && old.commits))
  ]);
  if (Array.isArray(results[0]) && results[0].length) out.weekly = results[0].slice(-52);
  out.contributors = results[1];
  out.commits = results[2];

  if (!out.weekly && !out.contributors && !out.commits) {
    if (firstErr) throw firstErr;
    throw Object.assign(new Error('EMPTY'), { code: 'EMPTY' });
  }
  await RPApi.cacheSet(ck, out);
  return Object.assign({}, out, { _cached: false });
};

/* ---------- dependency manifest parsers (pure, testable) ----------
   Returns [{name, version, eco}] — only pinned versions are kept. */
RPApi.parseDeps = function (path, text, opts) {
  opts = opts || {};
  if (!text || typeof text !== 'string') return [];
  const cleanVer = function (v) {
    const m = String(v || '').trim().replace(/^[\^~>=<\s]+/, '').match(/^v?(\d+\.\d+(?:\.\d+)?(?:[-+][\w.-]+)?)/);
    return m ? m[1] : null;
  };
  const out = [];
  const push = function (name, v, eco) {
    const cv = cleanVer(v);
    if (name && cv) out.push({ name: name, version: cv, eco: eco });
  };

  if (/(^|\/)package\.json$/i.test(path)) {
    let j = null;
    try { j = JSON.parse(text); } catch (e) { return []; }
    const groups = [j && j.dependencies];
    if (opts.includeDev) groups.push(j && j.devDependencies);
    groups.forEach(function (deps) {
      Object.keys(deps || {}).forEach(function (name) { push(name, deps[name], 'npm'); });
    });
    return out;
  }

  if (/(^|\/)requirements\.txt$/i.test(path)) {
    text.split('\n').forEach(function (line) {
      line = line.trim();
      if (!line || line[0] === '#' || line[0] === '-') return;
      const m = line.match(/^([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*(===|==|~=)\s*(\d[\w.*+-]*)/);
      if (!m) return;
      push(m[1].replace(/[-_.]+/g, '-').toLowerCase(), m[3], 'PyPI');
    });
    return out;
  }

  /* PEP 621 + Poetry (pinned versions only) */
  if (/(^|\/)pyproject\.toml$/i.test(path)) {
    const seen = {};
    const add = function (name, v) {
      const cv = cleanVer(v);
      if (!cv || !name || /^python$/i.test(name)) return;
      const k = name.toLowerCase() + '@' + cv;
      if (seen[k]) return;
      seen[k] = 1;
      out.push({ name: name.replace(/[-_.]+/g, '-').toLowerCase(), version: cv, eco: 'PyPI' });
    };
    let section = '';
    text.split('\n').forEach(function (line) {
      const sm = line.trim().match(/^\[([\w.-]+)\]$/);
      if (sm) { section = sm[1]; return; }
      const q = line.match(/["']([A-Za-z0-9._-]+)(?:\[[^\]]*\])?\s*(===|==|~=)\s*([^"']+)["']/);
      if (q) { add(q[1], q[3]); return; }
      if (section === 'tool.poetry.dependencies') {
        const kv = line.trim().match(/^([A-Za-z0-9._-]+)\s*=\s*(.+)$/);
        if (!kv) return;
        const vm = kv[2].match(/^"([^"]+)"/) || kv[2].match(/version\s*=\s*"([^"]+)"/);
        if (vm) add(kv[1], vm[1]);
      }
    });
    return out;
  }

  if (/(^|\/)composer\.json$/i.test(path)) {
    let j = null;
    try { j = JSON.parse(text); } catch (e) { return []; }
    const groups = [j && j.require];
    if (opts.includeDev) groups.push(j && j['require-dev']);
    groups.forEach(function (deps) {
      Object.keys(deps || {}).forEach(function (name) {
        if (/^(php|ext-|composer-|lib-)/i.test(name)) return;
        push(name, deps[name], 'Packagist');
      });
    });
    return out;
  }

  if (/(^|\/)go\.mod$/i.test(path)) {
    text.split('\n').forEach(function (line) {
      const m = line.trim().match(/^(?:require\s+)?([\w.-]+\.[\w.-]+\/[\w./-]+)\s+(v[\w.+-]+)/);
      if (!m) return;
      push(m[1], m[2], 'Go');
    });
    return out;
  }

  if (/(^|\/)Cargo\.toml$/i.test(path)) {
    const allowed = { dependencies: 1 };
    if (opts.includeDev) { allowed['dev-dependencies'] = 1; allowed['build-dependencies'] = 1; }
    let section = '';
    text.split('\n').forEach(function (line) {
      const sm = line.trim().match(/^\[([\w.-]+)\]$/);
      if (sm) { section = sm[1]; return; }
      if (!allowed[section]) return;
      const kv = line.trim().match(/^([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
      if (!kv) return;
      const vm = kv[2].match(/^"([^"]+)"/) || kv[2].match(/version\s*=\s*"([^"]+)"/);
      if (vm) push(kv[1], vm[1], 'crates.io');
    });
    return out;
  }
  return [];
};

/* ---------- OSV.dev client ----------
   In the extension the call is routed through the background
   service worker (page CSP on github.com would block a direct
   third-party fetch); elsewhere (harness) it goes direct. */
RPApi.osvQueryBatch = async function (queries) {
  const body = JSON.stringify({ queries: queries });
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
    return new Promise(function (resolve, reject) {
      try {
        chrome.runtime.sendMessage({ type: 'RP_OSV', body: body }, function (res) {
          if (chrome.runtime.lastError) { reject(Object.assign(new Error('OSV_ERR'), { code: 'OSV_ERR' })); return; }
          if (res && res.ok) resolve(res.results);
          else reject(Object.assign(new Error((res && res.code) || 'OSV_ERR'), { code: (res && res.code) || 'OSV_ERR' }));
        });
      } catch (e) { reject(Object.assign(new Error('OSV_ERR'), { code: 'OSV_ERR' })); }
    });
  }
  const r = await fetch('https://api.osv.dev/v1/querybatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body });
  if (!r.ok) throw Object.assign(new Error('HTTP_' + r.status), { code: 'HTTP_' + r.status });
  return (await r.json()).results;
};

/* scan root manifests via raw fetches (no API quota) + OSV batch */
RPApi.SCAN_MANIFESTS = ['package.json', 'requirements.txt', 'pyproject.toml', 'composer.json', 'go.mod', 'Cargo.toml'];
RPApi.scanVulns = async function (owner, repo, branch, tree) {
  const fullName = owner + '/' + repo;
  const entries = ((tree && tree.tree) || []).filter(function (f) { return f && f.type !== 'tree' && f.path; });
  const found = [];
  RPApi.SCAN_MANIFESTS.forEach(function (m) {
    const ml = m.toLowerCase();
    const hit = entries.find(function (f) { return f.path.toLowerCase() === ml; });
    if (hit) found.push(hit.path);
  });
  const deps = [];
  const texts = await Promise.all(found.map(function (p) { return RPApi.raw(fullName, branch, p); }));
  found.forEach(function (p, i) {
    if (texts[i]) deps.push.apply(deps, RPApi.parseDeps(p, texts[i], { includeDev: true }).slice(0, 60));
  });
  if (!deps.length) return { scanned: 0, deps: [], vulns: [], total: 0 };
  const queries = deps.map(function (d) { return { package: { name: d.name, ecosystem: d.eco }, version: d.version }; });
  const results = await RPApi.osvQueryBatch(queries);
  const vulns = [];
  (results || []).forEach(function (res, i) {
    const vs = (res && res.vulns) || [];
    if (vs.length && deps[i]) vulns.push({ pkg: deps[i].name, version: deps[i].version, eco: deps[i].eco, ids: vs.map(function (v) { return v.id; }) });
  });
  return { scanned: deps.length, deps: deps, vulns: vulns, total: vulns.reduce(function (a, v) { return a + v.ids.length; }, 0) };
};

/* ---------- lightweight score fetch for search badges (meta + tree only) ---------- */
RPApi.fetchScore = async function (owner, repo, opts) {
  opts = opts || {};
  const key = String(owner).toLowerCase() + '/' + String(repo).toLowerCase();
  const ck = 'score:' + key;
  const entry = opts.force ? null : await RPApi.cacheEntry(ck);
  if (entry && (Date.now() - entry.t) < 6 * 3600e3) return Object.assign({}, entry.v, { _cached: true });
  const old = entry ? entry.v : null;
  const base = '/repos/' + owner + '/' + repo;
  const treeUrl = function (b) { return base + '/git/trees/' + encodeURIComponent(b) + '?recursive=1'; };
  const readTree = function (r) {
    return { tree: (r.tree || []).map(function (t) { return { path: t.path, type: t.type, size: t.size || 0 }; }), truncated: !!r.truncated };
  };

  /* when a previous branch is known, tree revalidation starts together with meta */
  const hint = opts.force ? null : (old && old.branch);
  const treeP = hint ? RPApi.apiCond(treeUrl(hint), ck + '!tree').catch(function () { return null; }) : null;

  let metaR = await RPApi.apiCond(base, ck + '!meta', !!opts.force);
  if (metaR.notModified && !(old && old.meta)) { await RPApi.storeRemove('rp_e_' + ck + '!meta'); metaR = await RPApi.apiCond(base, ck + '!meta', !!opts.force); }
  const meta = metaR.notModified ? (old && old.meta) : metaR.value;
  if (!meta) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });
  const branch = meta.default_branch || 'main';

  let tree = null;
  try {
    let treeR = (treeP && hint === branch) ? await treeP : await RPApi.apiCond(treeUrl(branch), ck + '!tree', !!opts.force);
    if (!treeR) treeR = await RPApi.apiCond(treeUrl(branch), ck + '!tree', !!opts.force);
    if (treeR.notModified && !(old && old.tree)) {
      await RPApi.storeRemove('rp_e_' + ck + '!tree');
      treeR = await RPApi.apiCond(treeUrl(branch), ck + '!tree', !!opts.force);
    }
    if (treeR.notModified) tree = (old && old.tree) || null;
    else if (treeR.value) tree = readTree(treeR.value);
  } catch (e) { tree = (old && old.tree) || null; }

  const out = { meta: meta, branch: branch, tree: tree };
  await RPApi.cacheSet(ck, out);
  return Object.assign({}, out, { _cached: false });
};

/* ---------- pull request bundle: PR + files (cached 1h, etag-revalidated) ---------- */
/* PR files: 100 per page, capped at 300 (3 pages). The sidebar used to
   stop after page 1, so large PRs under-reported their risk. */
RPApi._fetchPullFiles = async function (base, ck, old, perPage, force) {
  const per = perPage || 100;
  const cap = 300;
  const pageUrl = function (p) { return base + '/files?per_page=' + per + '&page=' + p; };
  try {
    let first = await RPApi.apiCond(pageUrl(1), ck + '!files1', !!force);
    if (first.notModified && !(old && old.files)) {
      await RPApi.storeRemove('rp_e_' + ck + '!files1');
      first = await RPApi.apiCond(pageUrl(1), ck + '!files1', !!force);
    }
    if (first.notModified) return { files: (old && old.files) || [], truncated: !!(old && old.truncated) };
    let files = Array.isArray(first.value) ? first.value : [];
    if (files.length === per && files.length < cap) {
      const oldFiles = (old && Array.isArray(old.files)) ? old.files : [];
      const rest = await Promise.all([2, 3].map(async function (p) {
        const cachedPage = oldFiles.slice((p - 1) * per, p * per);
        try {
          let r = await RPApi.apiCond(pageUrl(p), ck + '!files' + p, !!force);
          if (r.notModified && !cachedPage.length) {
            await RPApi.storeRemove('rp_e_' + ck + '!files' + p);
            r = await RPApi.apiCond(pageUrl(p), ck + '!files' + p, !!force);
          }
          return r.notModified ? cachedPage : (Array.isArray(r.value) ? r.value : []);
        } catch (e) {
          return cachedPage;
        }
      }));
      rest.forEach(function (r) { files = files.concat(r); });
    }
    return { files: files, truncated: files.length >= cap };
  } catch (e) {
    return { files: (old && old.files) || [], truncated: !!(old && old.truncated) };
  }
};

RPApi.fetchPull = async function (owner, repo, number, opts) {
  opts = opts || {};
  const key = String(owner).toLowerCase() + '/' + String(repo).toLowerCase() + '#' + number;
  const ck = 'pull:' + key;
  const entry = opts.force ? null : await RPApi.cacheEntry(ck);
  if (entry && (Date.now() - entry.t) < 3600e3) return Object.assign({}, entry.v, { _cached: true });
  const old = entry ? entry.v : null;
  const base = '/repos/' + owner + '/' + repo + '/pulls/' + number;

  /* PR metadata and the first files page are independent → both in flight */
  const prP = RPApi.apiCond(base, ck + '!pr', !!opts.force);
  const filesP = RPApi._fetchPullFiles(base, ck, old, 100, opts.force);

  let prR = await prP;
  if (prR.notModified && !(old && old.pr)) { await RPApi.storeRemove('rp_e_' + ck + '!pr'); prR = await RPApi.apiCond(base, ck + '!pr', !!opts.force); }
  const pr = prR.notModified ? (old && old.pr) : prR.value;
  if (!pr) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });

  const f = await filesP;
  const files = Array.isArray(f.files) ? f.files : [];
  const out = { pr: pr, files: files, truncated: !!f.truncated };
  await RPApi.cacheSet(ck, out);
  return Object.assign({}, out, { _cached: false });
};
