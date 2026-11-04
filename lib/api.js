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
RPApi.getSettings = async function () {
  const keys = Object.keys(RPApi.DEFAULT_SETTINGS);
  const o = await RPApi.storeGet(keys);
  const out = {};
  keys.forEach(function (k) { out[k] = o[k] !== undefined ? o[k] : RPApi.DEFAULT_SETTINGS[k]; });
  return out;
};
RPApi.setSettings = async function (patch) {
  const cur = await RPApi.getSettings();
  const next = Object.assign({}, cur, patch);
  const obj = {};
  Object.keys(patch).forEach(function (k) { obj[k] = next[k]; });
  await RPApi.storeSet(obj);
  return next;
};

/* ---------- cache (TTL, size-guarded) ---------- */
RPApi.cacheGet = async function (key, ttl) {
  const o = await RPApi.storeGet('rp_c_' + key);
  const c = o && o['rp_c_' + key];
  if (c && (Date.now() - c.t) < ttl) return c.v;
  return null;
};
RPApi.cacheSet = async function (key, v) {
  try {
    const s = JSON.stringify(v);
    if (s.length > 2500000) return; /* per-entry guard: ~2.5 MB */
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

/* ---------- fetch primitives ---------- */
RPApi.authHeaders = async function () {
  const s = await RPApi.getSettings();
  const h = { Accept: 'application/vnd.github+json' };
  if (s.pat) h.Authorization = 'Bearer ' + s.pat;
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

/* JSON GET from api.github.com — throws Error with .code */
RPApi.api = async function (path) {
  let r;
  try {
    r = await fetch('https://api.github.com' + path, { headers: await RPApi.authHeaders() });
  } catch (e) { throw Object.assign(new Error('NETWORK'), { code: 'NETWORK' }); }
  RPApi._updateRate(r);
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
RPApi.apiCond = async function (path, etagKey) {
  const headers = await RPApi.authHeaders();
  const stored = await RPApi.storeGet('rp_e_' + etagKey);
  const etag = stored && stored['rp_e_' + etagKey];
  if (etag) headers['If-None-Match'] = etag;
  let r;
  try {
    r = await fetch('https://api.github.com' + path, { headers: headers });
  } catch (e) { throw Object.assign(new Error('NETWORK'), { code: 'NETWORK' }); }
  RPApi._updateRate(r);
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
  try {
    const r = await fetch(RPApi.rawUrl(fullName, branch, path));
    if (!r.ok) return null;
    return await r.text();
  } catch (e) { return null; }
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
  if (!opts.force) {
    const c = await RPApi.cacheGet(ck, 6 * 3600e3);
    if (c) return Object.assign({}, c, { _cached: true });
  }
  const old = opts.force ? null : await RPApi.cacheGet(ck, 1e15); /* expired entry kept for 304 reuse */
  const base = '/repos/' + owner + '/' + repo;

  const reuse = function (part) { return part !== undefined && part !== null ? part : null; };
  let metaR = await RPApi.apiCond(base, key + '!meta');
  if (metaR.notModified && !reuse(old && old.meta)) { await RPApi.storeRemove('rp_e_' + key + '!meta'); metaR = await RPApi.apiCond(base, key + '!meta'); }
  const meta = metaR.notModified ? old.meta : metaR.value;
  const branch = meta.default_branch || 'main';

  let langs;
  try {
    const langsR = await RPApi.apiCond(base + '/languages', key + '!langs');
    langs = langsR.notModified ? reuse(old && old.langs) || {} : (langsR.value || {});
  } catch (e) { langs = (old && old.langs) || {}; }

  let tree;
  try {
    const treeR = await RPApi.apiCond(base + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1', key + '!tree');
    if (treeR.notModified && !reuse(old && old.tree)) { await RPApi.storeRemove('rp_e_' + key + '!tree'); tree = null; }
    else if (treeR.notModified) tree = old.tree;
    else if (treeR.value) tree = { tree: (treeR.value.tree || []).map(function (t) { return { path: t.path, type: t.type, size: t.size || 0 }; }), truncated: !!treeR.value.truncated };
    else tree = null;
  } catch (e) { tree = (old && old.tree) || null; }

  const data = { meta: meta, langs: langs, branch: branch, tree: tree };
  await RPApi.cacheSet(ck, data);
  return Object.assign({}, data, { _cached: false });
};

/* ---------- activity bundle: weekly stats + contributors + commits (cached 1h, etag-revalidated) ---------- */
RPApi.fetchActivity = async function (owner, repo, opts) {
  opts = opts || {};
  const key = String(owner).toLowerCase() + '/' + String(repo).toLowerCase();
  const ck = 'act:' + key;
  if (!opts.force) {
    const c = await RPApi.cacheGet(ck, 3600e3);
    if (c) return Object.assign({}, c, { _cached: true });
  }
  const old = opts.force ? null : await RPApi.cacheGet(ck, 1e15);
  const base = '/repos/' + owner + '/' + repo;
  const out = { weekly: null, contributors: null, commits: null };

  try {
    const wr = await RPApi.apiCond(base + '/stats/commit_activity', key + '!weekly');
    const w = wr.notModified ? (old && old.weekly) : (wr.computed ? null : wr.value);
    if (w && Array.isArray(w) && w.length) out.weekly = w.slice(-52);
  } catch (e) {}
  try {
    const cr = await RPApi.apiCond(base + '/contributors?per_page=8', key + '!contribs');
    out.contributors = cr.notModified ? (old && old.contributors) || null : cr.value;
  } catch (e) {}
  try {
    const cm = await RPApi.apiCond(base + '/commits?per_page=10', key + '!commits');
    out.commits = cm.notModified ? (old && old.commits) || null : cm.value;
  } catch (e) {}

  if (!out.weekly && !out.contributors && !out.commits) throw Object.assign(new Error('EMPTY'), { code: 'EMPTY' });
  await RPApi.cacheSet(ck, out);
  return Object.assign({}, out, { _cached: false });
};

/* ---------- pull request bundle: PR + files (cached 1h, etag-revalidated) ---------- */
RPApi.fetchPull = async function (owner, repo, number, opts) {
  opts = opts || {};
  const key = String(owner).toLowerCase() + '/' + String(repo).toLowerCase() + '#' + number;
  const ck = 'pull:' + key;
  if (!opts.force) {
    const c = await RPApi.cacheGet(ck, 3600e3);
    if (c) return Object.assign({}, c, { _cached: true });
  }
  const old = opts.force ? null : await RPApi.cacheGet(ck, 1e15);
  const base = '/repos/' + owner + '/' + repo + '/pulls/' + number;

  let prR = await RPApi.apiCond(base, key + '!pr');
  if (prR.notModified && !(old && old.pr)) { await RPApi.storeRemove('rp_e_' + key + '!pr'); prR = await RPApi.apiCond(base, key + '!pr'); }
  const pr = prR.notModified ? old.pr : prR.value;
  if (!pr) throw Object.assign(new Error('NOT_FOUND'), { code: 'NOT_FOUND' });

  let files;
  try {
    const filesR = await RPApi.apiCond(base + '/files?per_page=100', key + '!files');
    files = filesR.notModified ? (old && old.files) || [] : (filesR.value || []);
  } catch (e) { files = (old && old.files) || []; }

  const out = { pr: pr, files: Array.isArray(files) ? files : [], truncated: Array.isArray(files) && files.length >= 100 };
  await RPApi.cacheSet(ck, out);
  return Object.assign({}, out, { _cached: false });
};
