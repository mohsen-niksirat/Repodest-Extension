'use strict';
/* ============================================================
   Repodest for GitHub — content script
   Repo-page detection (soft-nav aware), floating button,
   Shadow-DOM sidebar: Health / Digest / Activity.
   Depends on: lib/core.js, lib/i18n.js, lib/api.js, lib/digest.js,
               content/sidebar.css.js
   ============================================================ */
(function () {
  if (window.__RP_LOADED__) return;
  window.__RP_LOADED__ = true;

  /* =============== constants =============== */
  const RP_RESERVED = new Set(['orgs', 'organizations', 'users', 'topics', 'notifications', 'settings',
    'marketplace', 'apps', 'sessions', 'new', 'login', 'logout', 'signup', 'explore', 'dashboard',
    'trending', 'collections', 'events', 'about', 'pricing', 'features', 'enterprise', 'security',
    'customer-stories', 'readme', 'site-policy', 'site-map', 'sponsors', 'gist', 'pulls', 'issues',
    'search', 'codespaces', 'contact', 'join', 'fightcoronavirus', 'company', 'careers', 'press',
    'atom', 'git-guide', 'open-source', 'personal', 'organizations-plan',
    'stars', 'advisories', 'copilot', 'solutions', 'resources', 'discussions', 'account', 'watching', 'edu', 'why-github']);

  const RP_ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h4l2.5-6 4 12 2.5-6h5"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6c.3-1.3-.7-1.9-1.6-1.5L2.7 10.4c-1.2.5-1.2 1.4-.2 1.7l4.4 1.4 1.7 5.2c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.5 3.3c.8.5 1.5.2 1.7-.8l3-13.7zM8.8 13.6l8.7-5.5c.4-.3.8-.1.5.2l-7.2 6.5-.3 3-1.7-4.2z"/></svg>',
    github: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>'
  };

  const RP_LINKS = {
    web: 'https://mohsen-niksirat.github.io/repodest/',
    telegram: 'https://t.me/mohsenniksirat',
    github: 'https://github.com/mohsen-niksirat'
  };

  const CHECK_KEYS = ['checkDescription', 'checkTopics', 'checkLicense', 'checkReadme', 'checkGitignore', 'checkCI', 'checkTests', 'checkDocs', 'checkContributing', 'checkActive'];

  /* =============== state =============== */
  const S = {
    owner: null, repo: null, key: null,
    data: null, loading: false, error: null,
    activity: null, activityLoading: false, activityError: null,
    sel: new Set(), treeRoot: null, expanded: new Set(), limits: new Map(), search: '',
    digestParts: null, partIdx: 0, digestStats: null, digestStale: false,
    tab: 'health', open: false,
    pull: null, pullData: null, pullLoading: false, pullError: null, prxFocus: false,
    settings: null, rateShown: false,
    smellScan: null, vulnScan: null, vulnLoading: false, vulnError: null,
    fileMap: null, treeMap: null, selectableCount: 0, generating: false, health: null,
    cmpInput: '', cmpLoading: false, cmpError: null, cmpResult: null,
    recent: [], recentLoaded: false
  };
  const t = function (key, args) { return RPI18N.t(key, args || {}); };

  /* =============== search result badges =============== */
  function rpIsSearchPage() {
    return location.pathname === '/search' && new URLSearchParams(location.search).get('type') === 'repositories';
  }
  let _searchScanTimer = null;
  let _lastSearchUrl = '';
  const _searchBadges = new Set(); /* repo keys already processed on current search view */
  const _badgeQueue = [];
  let _badgeActive = 0;
  const _BADGE_CONCURRENCY = 3;
  function rpScheduleSearchScan() {
    clearTimeout(_searchScanTimer);
    _searchScanTimer = setTimeout(rpScanSearch, 900);
  }
  function rpScanSearch() {
    if (!rpIsSearchPage()) return;
    const searchUrl = location.pathname + location.search;
    if (searchUrl !== _lastSearchUrl) {
      _lastSearchUrl = searchUrl;
      _searchBadges.clear();
      _badgeQueue.length = 0;
    }
    if (!S.settings || !S.settings.pat) return; /* needs a PAT — full scores require the tree API */
    const links = Array.from(document.querySelectorAll('a[href]')).filter(function (a) {
      if (a.dataset.rpBadge) return false;
      const href = a.getAttribute('href') || '';
      const m = href.match(/^\/([\w.-]+)\/([\w.-]+?)(?:$|[?#])/);
      if (!m || RP_RESERVED.has(m[1].toLowerCase())) return false;
      return !!a.closest('[data-testid="results-list"], ul.repo-list, .search-results, [class*="search-title"]');
    }).slice(0, 12);
    links.forEach(function (a) {
      const m = (a.getAttribute('href') || '').match(/^\/([\w.-]+)\/([\w.-]+?)(?:$|[?#])/);
      if (m) {
        a.dataset.rpBadge = 'queued';
        _badgeQueue.push({ owner: m[1], repo: m[2], anchor: a });
      }
    });
    rpPumpBadges();
  }
  function rpPumpBadges() {
    while (_badgeActive < _BADGE_CONCURRENCY && _badgeQueue.length) {
      const job = _badgeQueue.shift();
      _badgeActive++;
      rpInjectBadge(job.owner, job.repo, job.anchor).then(function () {
        _badgeActive--; rpPumpBadges();
      }, function () {
        _badgeActive--; rpPumpBadges();
      });
    }
  }
  async function rpInjectBadge(owner, repo, anchor) {
    const key = (owner + '/' + repo).toLowerCase();
    if (_searchBadges.has(key)) return;
    _searchBadges.add(key);
    const token = 'p' + Math.random().toString(36).slice(2);
    anchor.dataset.rpBadge = token;
    try {
      const d = await RPApi.fetchScore(owner, repo);
      const paths = (d.tree && d.tree.tree || []).map(function (f) { return f.path; });
      const score = healthCheckPaths(paths, d.meta).score;
      const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
      if (anchor.dataset.rpBadge !== token || !anchor.isConnected) return; /* page changed mid-flight */
      const host = document.createElement('span');
      host.style.display = 'inline-block';
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<style>.rp-sb{font:700 11px/1 -apple-system,Segoe UI,sans-serif;color:#fff;background:' + color +
        ';border-radius:4px;padding:3px 6px;margin-inline-start:6px;vertical-align:middle;display:inline-block}' +
        '.rp-sb:hover{filter:brightness(1.15)}</style>' +
        '<span class="rp-sb" title="' + esc(RPI18N.t('badgeTitle')) + '">RP ' + score + '</span>';;
      anchor.appendChild(host);
    } catch (e) { /* private / rate-limited / gone — skip silently */ }
  }

  /* =============== repo-page detection =============== */
  function rpParseRepo() {
    const m = location.pathname.match(/^\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:$|\/)/);
    if (!m) return null;
    if (RP_RESERVED.has(m[1].toLowerCase())) return null;
    const pm = location.pathname.match(/\/pull\/(\d+)(?:$|\/)/);
    return { owner: m[1], repo: m[2], pull: pm ? parseInt(pm[1], 10) : null };
  }

  let _routeTimer = null;
  function rpRouteDebounced() {
    clearTimeout(_routeTimer);
    _routeTimer = setTimeout(function () { rpRouteSafe().catch(function () {}); }, 250);
  }
  function rpRoute() {
    if (rpIsSearchPage()) { rpScheduleSearchScan(); }
    const r = rpParseRepo();
    const host = rpEls.host;
    if (!r) {
      if (host) host.style.display = 'none';
      _repoReq++; _pullReq++; _actReq++; _vulnReq++; _cmpReq++;
      S.loading = false; S.pullLoading = false; S.activityLoading = false; S.vulnLoading = false; S.cmpLoading = false;
      S.key = null;
      return;
    }
    if (host) host.style.display = '';
    const key = r.owner + '/' + r.repo;
    const pull = r.pull || null;
    if (key.toLowerCase() !== (S.key || '').toLowerCase()) {
      _repoReq++; _pullReq++; _actReq++; _vulnReq++; _cmpReq++;
      S.owner = r.owner; S.repo = r.repo; S.key = key;
      S.data = null; S.loading = false; S.error = null;
      S.activity = null; S.activityLoading = false; S.activityError = null;
      S.sel.clear(); S.expanded.clear(); S.limits.clear(); S.search = '';
      S.digestParts = null; S.digestStats = null; S.digestStale = false; S.smellScan = null;
      S.health = null; S.fileMap = null; S.treeMap = null; S.selectableCount = 0;
      S.pull = pull; S.pullData = null; S.pullLoading = false; S.pullError = null;
      S.vulnScan = null; S.vulnLoading = false; S.vulnError = null;
      S.cmpInput = ''; S.cmpLoading = false; S.cmpError = null; S.cmpResult = null;
      S.prxFocus = !!pull;
      if (S.pull) S.tab = 'prx'; else if (S.tab === 'prx') S.tab = 'health';
      rpRenderChrome();
      if (S.open) { rpRenderTabBody(); rpLoadRepo(); if (S.pull) rpLoadPull(); }
    } else if (pull !== S.pull) {
      _pullReq++;
      S.pull = pull; S.pullData = null; S.pullLoading = false; S.pullError = null;
      S.prxFocus = !!pull;
      if (pull) S.tab = 'prx'; else if (S.tab === 'prx') S.tab = 'health';
      rpRenderChrome();
      if (S.open) { rpRenderTabBody(); if (pull) rpLoadPull(); }
    }
  }

  /* =============== theme & language =============== */
  function rpDetectTheme() {
    if (S.settings && (S.settings.theme === 'dark' || S.settings.theme === 'light')) return S.settings.theme;
    const mode = document.documentElement.getAttribute('data-color-mode');
    if (mode === 'dark' || mode === 'light') return mode;
    try {
      const bg = getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
      const m = bg.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (m) {
        const lum = (0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3])) / 255;
        return lum < 0.5 ? 'dark' : 'light';
      }
    } catch (e) {}
    return 'dark';
  }

  /* =============== data loading =============== */
  let _repoReq = 0;
  let _cmpReq = 0;
  async function rpLoadRepo(force) {
    if (!S.key) return;
    const req = ++_repoReq;
    S.loading = true; S.error = null;
    rpRender();
    try {
      const data = await RPApi.fetchRepo(S.owner, S.repo, { force: force });
      if (req !== _repoReq) return; /* a newer navigation won */
      S.data = data;
      S.health = null;
      S.treeRoot = rpBuildTree(S.data.tree);
      S.treeMap = rpBuildTreeMap(S.treeRoot, new Map());
      S.fileMap = new Map(((S.data.tree && S.data.tree.tree) || []).map(function (f) { return [f.path, f]; }));
      S.selectableCount = ((S.data.tree && S.data.tree.tree) || []).reduce(function (n, f) { return n + (RPDigest.isSelectable(f) ? 1 : 0); }, 0);
      rpRecomputeSelCounts();
      S.loading = false;
      rpRecordRecent();
      rpRender();
    } catch (e) {
      if (req !== _repoReq) return;
      S.loading = false;
      S.error = (e && e.code) ? e.code : 'UNKNOWN';
      rpRender();
    }
  }

  let _pullReq = 0;
  async function rpLoadPull(force) {
    if (!S.pull || (S.pullLoading && !force)) return;
    const req = ++_pullReq;
    S.pullLoading = true; S.pullError = null;
    rpRenderScorebar();
    rpRenderTabBody();
    try {
      const data = await RPApi.fetchPull(S.owner, S.repo, S.pull, { force: force });
      if (req !== _pullReq) return;
      S.pullData = data;
      S.pullLoading = false;
      rpRenderScorebar();
      rpRenderTabBody();
    } catch (e) {
      if (req !== _pullReq) return;
      S.pullLoading = false;
      S.pullError = (e && e.code) || 'UNKNOWN';
      rpRenderScorebar();
      rpRenderTabBody();
    }
  }

  let _actReq = 0;
  async function rpLoadActivity(force) {
    if (!S.key || (S.activityLoading && !force)) return;
    const req = ++_actReq;
    S.activityLoading = true; S.activityError = null;
    rpRenderTabBody();
    try {
      const data = await RPApi.fetchActivity(S.owner, S.repo, { force: force });
      if (req !== _actReq) return;
      S.activity = data;
      S.activityLoading = false;
      rpRenderTabBody();
    } catch (e) {
      if (req !== _actReq) return;
      S.activityLoading = false;
      S.activityError = (e && e.code) || 'UNKNOWN';
      rpRenderTabBody();
    }
  }

  /* =============== tree building =============== */
  function rpBuildTree(tree) {
    const root = { name: '', path: '', dirs: new Map(), files: [] };
    if (!tree || !tree.tree) return root;
    for (const f of tree.tree) {
      if (f.type !== 'blob') continue;
      const parts = f.path.split('/');
      let node = root;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node.dirs.has(parts[i])) {
          const p = node.path ? node.path + '/' + parts[i] : parts[i];
          node.dirs.set(parts[i], { name: parts[i], path: p, dirs: new Map(), files: [] });
        }
        node = node.dirs.get(parts[i]);
      }
      node.files.push(f);
    }
    rpIndexTree(root, null);
    return root;
  }
  function rpDirFiles(node, out) {
    if (!out && node._all) return node._all;
    out = out || [];
    for (const f of node.files) out.push(f);
    node.dirs.forEach(function (d) { rpDirFiles(d, out); });
    return out;
  }
  /* Pre-compute every directory's file list once, so rendering the tree
     is O(visible nodes) instead of walking whole subtrees per folder. */
  function rpIndexTree(node, parent) {
    node._parent = parent || null;
    const all = [];
    node.dirs.forEach(function (d) { all.push.apply(all, rpIndexTree(d, node)); });
    all.push.apply(all, node.files);
    node._all = all;
    node._sel = all.filter(function (f) { return RPDigest.isSelectable(f); });
    node._selCount = 0;
    node.files.forEach(function (f) { f._dir = node; });
    return all;
  }
  function rpBuildTreeMap(node, map) {
    map.set(node.path, node);
    node.dirs.forEach(function (d) { rpBuildTreeMap(d, map); });
    return map;
  }
  function rpNodeIcon(node) { return node.dirs ? '📁' : '📄'; }

  /* =============== shadow DOM mount =============== */
  let rpEls = {};
  function rpMount() {
    if (document.getElementById('repodest-ext-host')) return;
    const host = document.createElement('div');
    host.id = 'repodest-ext-host';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = RP_CSS;
    shadow.appendChild(style);
    const root = document.createElement('div');
    root.className = 'rp-root';
    root.setAttribute('data-theme', 'dark');
    root.innerHTML =
      '<button class="rp-fab" data-action="toggle" aria-expanded="false" title="' + esc(t('open')) + '" aria-label="' + esc(t('open')) + '">' + RP_ICONS.logo + '</button>' +
      '<aside class="rp-panel" id="rpPanel" role="dialog" aria-hidden="true" aria-label="' + esc(t('extName')) + '" tabindex="-1">' +
      '  <header class="rp-head">' +
      '    <div class="rp-brand"><span class="rp-logo">' + RP_ICONS.logo + '</span><span>Repodest</span><span class="rp-reponame" id="rpRepoName"></span></div>' +
      '    <button class="rp-iconbtn" data-action="refresh" title="' + esc(t('refresh')) + '" aria-label="' + esc(t('refresh')) + '">' + RP_ICONS.refresh + '</button>' +
      '    <button class="rp-iconbtn" data-action="settings" title="' + esc(t('settings')) + '" aria-label="' + esc(t('settings')) + '">' + RP_ICONS.gear + '</button>' +
      '    <button class="rp-iconbtn" data-action="toggle" title="' + esc(t('close')) + '" aria-label="' + esc(t('close')) + '">' + RP_ICONS.close + '</button>' +
      '  </header>' +
      '  <div id="rpScorebar"></div>' +
      '  <nav class="rp-tabs" id="rpTabs" role="tablist" aria-label="' + esc(t('extName')) + '"></nav>' +
      '  <div class="rp-body" id="rpBody" role="region"></div>' +
      '  <footer class="rp-foot">' +
      '    <span class="rp-rate" id="rpRate" style="display:none"><span class="dot"></span><span class="rp-rateval"></span></span>' +
      '    <span style="opacity:.7">' + esc(t('noTracking')) + '</span>' +
      '    <span class="rp-links">' +
      '      <a href="' + RP_LINKS.web + '" target="_blank" rel="noopener noreferrer" title="' + esc(t('webVersion')) + '">' + RP_ICONS.globe + '</a>' +
      '      <a href="' + RP_LINKS.telegram + '" target="_blank" rel="noopener noreferrer" title="' + esc(t('telegram')) + '">' + RP_ICONS.telegram + '</a>' +
      '      <a href="' + RP_LINKS.github + '" target="_blank" rel="noopener noreferrer" title="' + esc(t('github')) + '">' + RP_ICONS.github + '</a>' +
      '    </span>' +
      '  </footer>' +
      '</aside>' +
      '<div class="rp-toast" id="rpToast"></div>';
    shadow.appendChild(root);
    document.documentElement.appendChild(host);

    rpEls = {
      host: host, shadow: shadow, root: root,
      fab: root.querySelector('.rp-fab'),
      panel: root.querySelector('#rpPanel'),
      repoName: root.querySelector('#rpRepoName'),
      scorebar: root.querySelector('#rpScorebar'),
      tabs: root.querySelector('#rpTabs'),
      body: root.querySelector('#rpBody'),
      rate: root.querySelector('#rpRate'),
      rateVal: root.querySelector('.rp-rateval'),
      toast: root.querySelector('#rpToast')
    };
    rpEls.panel.inert = true; /* closed panel stays out of the tab order */

    shadow.addEventListener('click', rpClick);
    shadow.addEventListener('change', rpChange);
    shadow.addEventListener('input', rpInput);
    shadow.addEventListener('keydown', rpTabKeys);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.open) rpToggle(false);
    });
    RPApi.onRate(rpUpdateRate);
  }

  /* arrow-key navigation between tabs (RTL-aware) + Enter/Space on folder carets */
  function rpTabKeys(e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'rpCmpInput') { e.preventDefault(); rpCompareRun(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.dataset && e.target.dataset.action === 'exp') {
      e.preventDefault();
      e.target.click();
      return;
    }
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const tab = e.target.closest ? e.target.closest('.rp-tab') : null;
    if (!tab) return;
    const tabs = Array.from(rpEls.tabs.querySelectorAll('.rp-tab'));
    const i = tabs.indexOf(tab);
    if (i < 0) return;
    const rtl = RPI18N.isRTL();
    const dir = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : (rtl ? 1 : -1);
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    if (next) { next.focus(); next.click(); }
    e.preventDefault();
  }

  function rpApplyDirTheme() {
    rpEls.root.setAttribute('data-theme', rpDetectTheme());
    rpEls.root.setAttribute('dir', RPI18N.isRTL() ? 'rtl' : 'ltr');
  }

  /* =============== render: chrome (header/scorebar/footer) =============== */
  function rpRenderChrome() {
    if (!rpEls.panel) return;
    rpApplyDirTheme();
    rpEls.repoName.textContent = S.key || '';
    rpEls.tabs.innerHTML = rpTabsHtml();
    rpRenderScorebar();
  }

  function rpTabsHtml() {
    const tabs = [['health', t('tabHealth')], ['digest', t('tabDigest')], ['diagram', 'Diagram']];
    if (S.pull) tabs.push(['prx', t('prTab')]);
    tabs.push(['activity', t('tabActivity')]);
    tabs.push(['compare', t('compareTab')]);
    return tabs.map(function (tb) {
      const sel = S.tab === tb[0];
      return '<button class="rp-tab' + (sel ? ' rp-active' : '') + '" role="tab" aria-selected="' + sel + '" tabindex="' + (sel ? '0' : '-1') + '" data-action="tab" data-tab="' + tb[0] + '">' + esc(tb[1]) + '</button>';
    }).join('');
  }

  function rpScoreColor(score) {
    return score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--yellow)' : score >= 40 ? 'var(--orange)' : 'var(--red)';
  }
  function rpScoreVerdict(score) {
    return score >= 80 ? t('excellent') : score >= 60 ? t('decent') : score >= 40 ? t('needsLove') : t('needsCare');
  }

  function rpHealth() {
    if (S.health) return S.health;
    if (!S.data || !S.data.meta) return null;
    const paths = (S.data.tree && S.data.tree.tree || []).map(function (f) { return f.path; });
    S.health = healthCheckPaths(paths, S.data.meta);
    return S.health;
  }

  function rpRenderScorebar() {
    if (!rpEls.scorebar) return;
    if (S.pull) { rpRenderPRScorebar(); return; }
    if (S.loading || !S.data) { rpEls.scorebar.innerHTML = ''; rpEls.scorebar.style.display = 'none'; return; }
    const h = rpHealth();
    if (!h) { rpEls.scorebar.style.display = 'none'; return; }
    const score = h.score, color = rpScoreColor(score);
    const C = 163.36, off = C - (C * score / 100);
    rpEls.scorebar.style.display = '';
    rpEls.scorebar.innerHTML =
      '<div class="rp-scorebar">' +
      '  <div class="rp-ring">' +
      '    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">' +
      '      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg3)" stroke-width="6"/>' +
      '      <circle cx="32" cy="32" r="26" fill="none" stroke="' + color + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + off + '"/>' +
      '    </svg>' +
      '    <div class="rp-ringnum" style="color:' + color + '">' + score + '</div>' +
      '  </div>' +
      '  <div class="rp-scoremeta">' +
      '    <div class="rp-verdict" style="color:' + color + '">' + esc(rpScoreVerdict(score)) + '</div>' +
      '    <div class="rp-scoresub">' +
      '      <span class="rp-chip"><span class="dot"></span>' + esc(t('healthScore')) + '</span>' +
      '      <span class="rp-chip">' + (S.data._cached ? esc(t('cached')) : esc(t('refreshed'))) + '</span>' +
      '      <span class="rp-chip">' + esc(S.data.branch) + '</span>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  function rpAnalyzePull() {
    const d = S.pullData;
    if (!d) return null;
    const an = analyzePR(d.pr, d.files);
    an.truncated = !!d.truncated; /* our 300-file cap, not core's 100 */
    if (an.truncated && d.pr) {
      /* totals for the whole PR, not just the 300 fetched files */
      if (typeof d.pr.additions === 'number') an.totals.add = d.pr.additions;
      if (typeof d.pr.deletions === 'number') an.totals.del = d.pr.deletions;
      an.totals.changes = an.totals.add + an.totals.del;
    }
    return an;
  }

  function rpRenderPRScorebar() {
    if (S.pullLoading || !S.pullData) { rpEls.scorebar.innerHTML = ''; rpEls.scorebar.style.display = 'none'; return; }
    const an = rpAnalyzePull();
    const color = an.verdict === 'low' ? 'var(--green)' : an.verdict === 'medium' ? 'var(--yellow)' : 'var(--red)';
    const verdict = an.verdict === 'low' ? t('prLow') : an.verdict === 'medium' ? t('prMedium') : t('prHigh');
    const C = 163.36, off = C - (C * an.riskScore / 10);
    rpEls.scorebar.style.display = '';
    rpEls.scorebar.innerHTML =
      '<div class="rp-scorebar">' +
      '  <div class="rp-ring">' +
      '    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">' +
      '      <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg3)" stroke-width="6"/>' +
      '      <circle cx="32" cy="32" r="26" fill="none" stroke="' + color + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="' + off + '"/>' +
      '    </svg>' +
      '    <div class="rp-ringnum" style="color:' + color + '">' + an.riskScore + '</div>' +
      '  </div>' +
      '  <div class="rp-scoremeta">' +
      '    <div class="rp-verdict" style="color:' + color + '">' + esc(verdict) + '</div>' +
      '    <div class="rp-scoresub">' +
      '      <span class="rp-chip">#' + S.pull + '</span>' +
      '      <span class="rp-chip">+' + fmt(an.totals.add) + ' / \u2212' + fmt(an.totals.del) + '</span>' +
      '      <span class="rp-chip">' + (S.pullData._cached ? esc(t('cached')) : esc(t('refreshed'))) + '</span>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  /* =============== render: tabs =============== */
  function rpRender() {
    if (!rpEls.panel) return;
    rpRenderChrome();
    rpRenderTabBody();
  }

  function rpRenderTabBody() {
    if (!rpEls.body) return;
    /* PR X-Ray is independent of the repo bundle: show it even while
       repo metadata is loading or if that request failed. */
    if (S.tab === 'prx') {
      if (S.pullError) { rpEls.body.innerHTML = rpErrorHtml(S.pullError, 'reloadpr'); return; }
      if (!S.pullData) {
        if (!S.pullLoading && S.pull) rpLoadPull();
        rpEls.body.innerHTML = '<div class="rp-spin"></div><div class="rp-empty">' + esc(t('loading')) + '</div>';
        return;
      }
      rpEls.body.innerHTML = rpPRHtml();
      return;
    }
    if (S.loading) {
      rpEls.body.innerHTML = '<div class="rp-spin"></div><div class="rp-empty">' + esc(t('loading')) + '</div>';
      return;
    }
    if (S.error) { rpEls.body.innerHTML = rpErrorHtml(S.error); return; }
    if (!S.data) { rpEls.body.innerHTML = '<div class="rp-empty">' + esc(t('tagline')) + '</div>'; return; }
    if (S.tab === 'health') { rpEls.body.innerHTML = rpHealthHtml(); if (!S.recentLoaded) rpLoadRecent(); }
    else if (S.tab === 'digest') rpEls.body.innerHTML = rpDigestHtml();
    else if (S.tab === 'diagram') rpEls.body.innerHTML = rpDiagramHtml();
    else if (S.tab === 'activity') { rpEls.body.innerHTML = rpActivityHtml(); if (!S.activity && !S.activityError) rpLoadActivity(); }
    else if (S.tab === 'compare') rpEls.body.innerHTML = rpCompareHtml();
  }

  function rpErrorHtml(code, retryAction) {
    let msg, extra = '';
    if (code === 'NOT_FOUND') msg = t('notFound');
    else if (code === 'RATE_LIMIT') {
      msg = t('rateLimited');
      extra = '<button class="rp-btn rp-ghost rp-sm" data-action="settings">' + esc(t('openSettings')) + '</button> ';
    } else msg = t('networkError');
    return '<div class="rp-err"><b>' + esc(t('error')) + '</b>' + esc(msg) + '<div>' + extra +
      '<button class="rp-btn rp-sm" data-action="' + esc(retryAction || 'reload') + '">' + esc(t('retry')) + '</button></div></div>';
  }

  /* ---------- health tab ---------- */
  function rpHealthHtml() {
    const m = S.data.meta, h = rpHealth();
    const checks = h.items.map(function (c, i) {
      return '<div class="rp-check ' + (c.ok ? 'ok' : 'bad') + '"><span class="rp-ico">' + (c.ok ? '✓' : '✗') + '</span><span>' + esc(t(CHECK_KEYS[i])) + '</span><span class="rp-w">+' + c.w + '</span></div>';
    }).join('');

    const facts = [
      { k: t('stars'), v: fmt(m.stargazers_count) },
      { k: t('forks'), v: fmt(m.forks_count) },
      { k: t('openIssues'), v: fmt(m.open_issues_count) },
      { k: t('license'), v: m.license ? esc(m.license.spdx_id || m.license.key) : t('noLicense') },
      { k: t('lastPush'), v: esc(RPI18N.timeAgo(m.pushed_at)) },
      { k: t('size'), v: fmtSize((m.size || 0) * 1024) }
    ].map(function (f) { return '<div class="rp-fact"><div class="v">' + f.v + '</div><div class="k">' + esc(f.k) + '</div></div>'; }).join('');

    let langsHtml = '';
    const langs = Object.entries(S.data.langs || {}).sort(function (a, b) { return b[1] - a[1]; });
    if (langs.length) {
      const total = langs.reduce(function (a, c) { return a + c[1]; }, 0) || 1;
      const bar = langs.slice(0, 10).map(function (l) {
        return '<i style="width:' + (l[1] / total * 100).toFixed(2) + '%;background:' + langColor(l[0]) + '" title="' + esc(l[0]) + '"></i>';
      }).join('');
      const rows = langs.slice(0, 6).map(function (l) {
        return '<div class="rp-langrow"><span class="swatch" style="background:' + langColor(l[0]) + '"></span><span class="nm">' + esc(l[0]) + '</span><span class="pc">' + (l[1] / total * 100).toFixed(1) + '%</span></div>';
      }).join('');
      langsHtml = '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('languages')) + '</div><div class="rp-langbar">' + bar + '</div>' + rows + '</div>';
    }

    let topicsHtml = '';
    if (m.topics && m.topics.length) {
      topicsHtml = '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('topics')) + '</div><div class="rp-topics">' +
        m.topics.slice(0, 12).map(function (tp) { return '<span class="rp-topic">' + esc(tp) + '</span>'; }).join('') + '</div></div>';
    }

    let descHtml = '';
    if (m.description) descHtml = '<div class="rp-sec"><div style="font-size:12.5px;color:var(--text2)">' + esc(m.description) + '</div></div>';

    const treeNote = (S.data.tree && S.data.tree.truncated)
      ? '<div class="rp-sec"><div class="rp-check bad"><span class="rp-ico">⚠</span><span>' + esc(t('treeTruncatedShort')) + '</span></div></div>'
      : '';

    const reportBtn = '<div class="rp-sec"><button class="rp-btn rp-ghost rp-sm" data-action="report">' + esc(t('reportCopy')) + '</button></div>';
    return descHtml + treeNote + reportBtn +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('checks')) + '</div><div class="rp-checks">' + checks + '</div></div>' +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('repoFacts')) + '</div><div class="rp-facts">' + facts + '</div></div>' +
      langsHtml + topicsHtml + rpVulnHtml() + rpRecentHtml();
  }

  /* ---------- security / vulnerability scan (OSV.dev) ---------- */
  let _vulnReq = 0;
  async function rpLoadVulns() {
    if (!S.data || S.vulnLoading) return;
    const req = ++_vulnReq;
    S.vulnLoading = true; S.vulnError = null;
    rpRenderTabBody();
    try {
      const scan = await RPApi.scanVulns(S.owner, S.repo, S.data.branch, S.data.tree);
      if (req !== _vulnReq) return;
      S.vulnScan = scan;
      S.vulnLoading = false;
      rpRenderTabBody();
    } catch (e) {
      if (req !== _vulnReq) return;
      S.vulnLoading = false;
      S.vulnError = true;
      rpRenderTabBody();
    }
  }

  function rpVulnHtml() {
    let inner;
    if (S.vulnLoading) {
      inner = '<div style="font-size:12px;color:var(--text2)">' + esc(t('secScanning')) + '</div>';
    } else if (S.vulnError) {
      inner = '<div class="rp-check bad"><span class="rp-ico">✗</span><span>' + esc(t('secFailed')) + '</span></div>' +
        '<button class="rp-btn rp-ghost rp-sm" data-action="vulnscan" style="margin-top:8px">' + esc(t('secScan')) + '</button>';
    } else if (!S.vulnScan) {
      return '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('secTitle')) + '</div>' +
        '<button class="rp-btn rp-ghost rp-sm" data-action="vulnscan">' + esc(t('secScan')) + '</button>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:6px">' + esc(t('secHint')) + '</div></div>';
    } else if (!S.vulnScan.scanned) {
      inner = '<div style="font-size:12px;color:var(--text2)">' + esc(t('secNoManifests')) + '</div>';
    } else if (!S.vulnScan.vulns.length) {
      inner = '<div class="rp-check ok"><span class="rp-ico">✓</span><span>' + esc(t('secClean', { n: S.vulnScan.scanned })) + '</span></div>';
    } else {
      const rows = S.vulnScan.vulns.map(function (v) {
        const ids = v.ids.slice(0, 4).map(function (id) {
          return '<a href="https://osv.dev/vuln/' + esc(id) + '" target="_blank" rel="noopener noreferrer" style="color:var(--red);text-decoration:none;direction:ltr">' + esc(id) + '</a>';
        }).join(' ');
        const more = v.ids.length > 4 ? ' <span style="color:var(--text3)">+' + (v.ids.length - 4) + '</span>' : '';
        return '<div class="rp-commit"><div class="m" style="direction:ltr;text-align:start"><b>' + esc(v.pkg) + '</b>@' + esc(v.version) + ' <span style="color:var(--text3)">(' + esc(v.eco) + ')</span></div>' +
          '<div class="d">' + ids + more + '</div></div>';
      }).join('');
      inner = '<div class="rp-check bad"><span class="rp-ico">⚠</span><span>' + esc(t('secVulns', { n: S.vulnScan.total, m: S.vulnScan.vulns.length, s: S.vulnScan.scanned })) + '</span></div>' + rows;
    }
    return '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('secTitle')) + '</div>' + inner + '</div>';
  }

  /* ---------- digest tab ---------- */
  function rpDigestHtml() {
    const st = S.settings;
    const presetOpts = ['general', 'review', 'learn', 'migrate', 'docs', 'custom'].map(function (p) {
      return '<option value="' + p + '"' + (st.preset === p ? ' selected' : '') + '>' + esc(t('preset' + p.charAt(0).toUpperCase() + p.slice(1))) + '</option>';
    }).join('');
    const formatOpts = RPDigest.FORMATS.map(function (f) {
      return '<option value="' + f + '"' + (st.format === f ? ' selected' : '') + '>' + f.toUpperCase() + '</option>';
    }).join('');
    const modelOpts = RPDigest.MODELS.map(function (mm) {
      return '<option value="' + mm.id + '"' + (st.model === mm.id ? ' selected' : '') + '>' + esc(mm.label) + '</option>';
    }).join('');
    const customTask = st.preset === 'custom'
      ? '<textarea class="rp-textarea" id="rpCustomTask" rows="3" style="margin-top:6px" placeholder="' + esc(t('customPlaceholder')) + '">' + esc(st.customTask) + '</textarea>'
      : '';

    return '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('digestTitle')) + '</div>' +
      '<div style="font-size:11.5px;color:var(--text2);margin-bottom:6px">' + esc(t('digestHint')) + '</div></div>' +

      '<div class="rp-sec">' +
      '  <label class="rp-label">' + esc(t('goalPresets')) + '</label>' +
      '  <div class="rp-goalrow">' +
      '    <button class="rp-goal" data-action="goal" data-goal="bug">' + esc(t('goalBug')) + '</button>' +
      '    <button class="rp-goal" data-action="goal" data-goal="arch">' + esc(t('goalArch')) + '</button>' +
      '    <button class="rp-goal" data-action="goal" data-goal="security">' + esc(t('goalSecurity')) + '</button>' +
      '    <button class="rp-goal" data-action="goal" data-goal="docs">' + esc(t('goalDocs')) + '</button>' +
      '    <button class="rp-goal" data-action="goal" data-goal="all">' + esc(t('goalAll')) + '</button>' +
      '    <button class="rp-goal" data-action="goal" data-goal="clear">' + esc(t('goalClear')) + '</button>' +
      '  </div>' +
      '</div>' +

      '<div class="rp-sec">' +
      '  <div class="rp-row">' +
      '    <div><label class="rp-label">' + esc(t('preset')) + '</label><select class="rp-select" id="rpPreset">' + presetOpts + '</select></div>' +
      '    <div><label class="rp-label">' + esc(t('format')) + '</label><select class="rp-select" id="rpFormat">' + formatOpts + '</select></div>' +
      '    <div><label class="rp-label">' + esc(t('model')) + '</label><select class="rp-select" id="rpModel">' + modelOpts + '</select></div>' +
      '  </div>' + customTask +
      '  <div class="rp-opts" style="margin-top:8px">' +
      '    <label class="rp-opt"><input type="checkbox" id="rpOptReadme"' + (st.readme ? ' checked' : '') + '>' + esc(t('optReadme')) + '</label>' +
      '    <label class="rp-opt"><input type="checkbox" id="rpOptTree"' + (st.tree ? ' checked' : '') + '>' + esc(t('optTree')) + '</label>' +
      '    <label class="rp-opt"><input type="checkbox" id="rpOptShrink"' + (st.shrink ? ' checked' : '') + '>' + esc(t('optShrink')) + '</label>' +
      '    <label class="rp-opt"><input type="checkbox" id="rpOptSig"' + (st.sigonly ? ' checked' : '') + '>' + esc(t('optSig')) + '</label>' +
      '  </div>' +
      '</div>' +

      rpTreeHtml() +
      rpSelMetaHtml() +
      '<button class="rp-btn" data-action="generate" id="rpGenBtn" style="width:100%;margin-top:10px">' + esc(t('generate')) + '</button>' +
      rpOutHtml();
  }

  function rpTreeHtml() {
    if (!S.treeRoot) return '';
    const trunc = S.data.tree && S.data.tree.truncated
      ? '<div style="font-size:11px;color:var(--yellow);padding:6px 10px 0">⚠ ' + esc(t('treeTruncated')) + '</div>'
      : '';
    return '<div class="rp-sec">' +
      '  <div class="rp-treebox">' +
      '    <div class="rp-treehead">' +
      '      <input class="rp-input" id="rpSearch" placeholder="' + esc(t('searchFiles')) + '" value="' + esc(S.search) + '">' +
      '      <button class="rp-btn rp-ghost rp-sm" data-action="selall">' + esc(t('selectAllText')) + '</button>' +
      '      <button class="rp-btn rp-ghost rp-sm" data-action="collapse">' + esc(t('collapseAll')) + '</button>' +
      '    </div>' + trunc +
      '    <div class="rp-tree" id="rpTree">' + rpTreeInnerHtml() + '</div>' +
      '  </div>' +
      '</div>';
  }

  function rpTreeInnerHtml() {
    const out = [];
    if (S.search) {
      const q = S.search.toLowerCase();
      const files = (S.data.tree && S.data.tree.tree) || [];
      let n = 0;
      for (const f of files) {
        if (f.type === 'blob' && f.path.toLowerCase().includes(q)) {
          out.push(rpFileNodeHtml(f, 0));
          if (++n >= 300) { out.push('<button class="rp-more">… 300+</button>'); break; }
        }
      }
      if (!n) out.push('<div class="rp-empty" style="padding:14px">—</div>');
      return out.join('');
    }
    rpRenderDir(S.treeRoot, 0, out);
    return out.join('');
  }

  function rpRenderDir(node, depth, out) {
    const dirs = Array.from(node.dirs.values()).sort(function (a, b) { return a.name.localeCompare(b.name); });
    const files = node.files.slice().sort(function (a, b) { return a.path.split('/').pop().localeCompare(b.path.split('/').pop()); });
    const items = dirs.concat(files);
    const limit = S.limits.get(node.path) || 100;
    let shown = 0;
    for (const it of items) {
      if (shown >= limit) {
        out.push('<button class="rp-more" data-action="more" data-path="' + esc(node.path) + '">… +' + (items.length - shown) + '</button>');
        break;
      }
      if (it.dirs) {
        const isOpen = S.expanded.has(it.path);
        out.push('<div class="rp-node rp-dir" style="padding-inline-start:' + (depth * 14 + 4) + 'px">' +
          '<span class="rp-caret" role="button" tabindex="0" aria-expanded="' + isOpen + '" aria-label="' + esc(it.name) + '" data-action="exp" data-path="' + esc(it.path) + '">' + (isOpen ? '▼' : '▶') + '</span>' +
          '<input type="checkbox" class="rp-ck" data-dirpath="' + esc(it.path) + '"' + (rpDirAllSel(it) ? ' checked' : '') + ' aria-label="' + esc(t('selectFolder', { path: it.path || '.' })) + '">' +
          '<span class="rp-name">' + esc(it.name) + '</span></div>');
        if (isOpen) rpRenderDir(it, depth + 1, out);
      } else {
        out.push(rpFileNodeHtml(it, depth));
      }
      shown++;
    }
  }

  function rpFileNodeHtml(f, depth) {
    const selectable = RPDigest.isSelectable(f);
    return '<div class="rp-node" style="padding-inline-start:' + (depth * 14 + 22) + 'px">' +
      '<input type="checkbox" class="rp-ck" data-path="' + esc(f.path) + '"' + (S.sel.has(f.path) ? ' checked' : '') + (selectable ? '' : ' disabled') + ' aria-label="' + esc(t('selectFile', { path: f.path })) + '">' +
      '<span class="rp-name">' + esc(f.path.split('/').pop()) + '</span>' +
      '<span class="rp-sz">' + fmtSize(f.size || 0) + '</span></div>';
  }

  function rpDirAllSel(node) {
    const sel = node._sel || [];
    return sel.length > 0 && (node._selCount || 0) >= sel.length;
  }
  /* Keep per-folder selected counts in sync while walking up the tree:
     folder checkboxes become O(1) instead of O(subtree) on every tick. */
  function rpBumpDirCounts(file, delta) {
    let dir = file && file._dir;
    while (dir) {
      dir._selCount = Math.max(0, (dir._selCount || 0) + delta);
      dir = dir._parent;
    }
  }
  function rpSetFileSel(path, on) {
    const has = S.sel.has(path);
    if (on === has) return;
    if (on) S.sel.add(path); else S.sel.delete(path);
    const f = S.fileMap && S.fileMap.get(path);
    if (f) rpBumpDirCounts(f, on ? 1 : -1);
  }
  function rpRecomputeSelCounts() {
    if (!S.treeMap) return;
    S.treeMap.forEach(function (node) {
      let n = 0;
      const sel = node._sel || [];
      for (let i = 0; i < sel.length; i++) if (S.sel.has(sel[i].path)) n++;
      node._selCount = n;
    });
  }

  function rpSelMetaHtml() {
    let bytes = 0;
    const selectable = S.selectableCount || 0;
    const fmap = S.fileMap;
    S.sel.forEach(function (p) { const f = fmap && fmap.get(p); if (f) bytes += f.size || 0; });
    const model = RPDigest.modelById(S.settings.model);
    const isPrompt = !!(S.digestParts && S.digestParts.length && !S.digestStale);
    const textLen = isPrompt ? S.digestParts[S.partIdx].length : bytes;
    const toks = RPDigest.estimateTokens(textLen, S.settings.model);
    const pct = Math.min(999, Math.round(toks / model.ctx * 100));
    const ctxColor = pct > 90 ? 'var(--red)' : pct > 60 ? 'var(--yellow)' : 'var(--green)';
    return '<div class="rp-selmeta">' +
      '<span><b>' + S.sel.size + '</b>/' + selectable + ' ' + esc(t('files')) + '</span>' +
      '<span><b>' + fmtSize(textLen) + '</b> ' + esc(isPrompt ? t('prompt') : t('selected')) + '</span>' +
      '<span>~<b>' + fmt(toks) + '</b> tok</span>' +
      '<span style="color:' + ctxColor + '">' + pct + '% ctx</span>' +
      '<div class="rp-ctxbar" style="flex-basis:100%"><i style="width:' + Math.min(100, pct) + '%;background:' + ctxColor + '"></i></div>' +
      '</div>';
  }

  function rpOutHtml() {
    if (!S.digestParts || !S.digestParts.length) return '';
    const parts = S.digestParts;
    const nav = parts.length > 1
      ? '<div class="rp-partnav">' +
        '<button class="rp-btn rp-ghost rp-sm" data-action="part" data-d="-1"' + (S.partIdx === 0 ? ' disabled' : '') + '>◀</button>' +
        '<span>' + esc(t('part')) + ' <b>' + (S.partIdx + 1) + '/' + parts.length + '</b></span>' +
        '<button class="rp-btn rp-ghost rp-sm" data-action="part" data-d="1"' + (S.partIdx === parts.length - 1 ? ' disabled' : '') + '>▶</button>' +
        '</div>'
      : '';
    return '<div class="rp-out">' +
      '<textarea class="rp-textarea" id="rpOut" rows="10" readonly>' + esc(parts[S.partIdx]) + '</textarea>' +
      nav +
      '<div class="rp-outbtns">' +
      '<button class="rp-btn rp-sm" data-action="copy" style="flex:1">' + esc(t('copy')) + '</button>' +
      '<button class="rp-btn rp-ghost rp-sm" data-action="download" style="flex:1">' + esc(t('download')) + '</button>' +
      '</div>' +
      '<div class="rp-outbtns">' +
      '<button class="rp-btn rp-ghost rp-sm" data-action="llm" data-provider="claude" style="flex:1" title="Claude">🤖 Claude</button>' +
      '<button class="rp-btn rp-ghost rp-sm" data-action="llm" data-provider="chatgpt" style="flex:1" title="ChatGPT">💬 ChatGPT</button>' +
      '<button class="rp-btn rp-ghost rp-sm" data-action="llm" data-provider="gemini" style="flex:1" title="Gemini">✨ Gemini</button>' +
      '</div>' + rpSmellHtml() + '</div>';
  }

  /* ---------- PR X-Ray tab ---------- */
  function rpPRHtml() {
    const d = S.pullData, pr = d.pr;
    const an = rpAnalyzePull();
    const state = pr.merged_at ? 'merged' : (pr.draft ? 'draft' : (pr.state || 'open'));
    const stateColor = state === 'merged' ? 'var(--accent)' : state === 'draft' ? 'var(--text3)' : state === 'closed' ? 'var(--red)' : 'var(--green)';

    const addPct = an.totals.changes ? Math.round(an.totals.add / an.totals.changes * 100) : 50;
    const bar = '<div class="rp-langbar" style="height:8px"><i style="width:' + addPct + '%;background:var(--green)" title="+' + fmt(an.totals.add) + '"></i><i style="width:' + (100 - addPct) + '%;background:var(--red)" title="\u2212' + fmt(an.totals.del) + '"></i></div>';

    const facts = [
      { k: t('prChangedFiles'), v: String((an.truncated && pr.changed_files) || d.files.length) },
      { k: t('prAdditions'), v: '+' + fmt(an.totals.add) },
      { k: t('prDeletions'), v: '\u2212' + fmt(an.totals.del) },
      { k: t('prType'), v: esc(an.changeType) },
      { k: t('prSize'), v: esc(an.sizeClass) },
      { k: t('prTestShare'), v: an.testShare + '%' }
    ].map(function (f) { return '<div class="rp-fact"><div class="v">' + f.v + '</div><div class="k">' + esc(f.k) + '</div></div>'; }).join('');

    const risks = an.risks.length
      ? an.risks.map(function (r) {
          return '<div class="rp-check bad"><span class="rp-ico">⚠</span><span>' + esc(r.label) + '</span><span class="rp-w">' + r.files.length + ' file' + (r.files.length > 1 ? 's' : '') + '</span></div>';
        }).join('')
      : '<div class="rp-check ok"><span class="rp-ico">✓</span><span>' + esc(t('prNoRisks')) + '</span></div>';

    const topFiles = d.files.slice().sort(function (a, b) { return (b.changes || 0) - (a.changes || 0); }).slice(0, 12);
    const filesHtml = topFiles.map(function (f) {
      const tot = Math.max(1, (f.additions || 0) + (f.deletions || 0));
      const ap = Math.round((f.additions || 0) / tot * 100);
      return '<div class="rp-commit"><div class="m">' + esc(f.filename) + '</div>' +
        '<div class="rp-langbar" style="height:5px;margin-top:4px"><i style="width:' + ap + '%;background:var(--green)"></i><i style="width:' + (100 - ap) + '%;background:var(--red)"></i></div>' +
        '<div class="d"><span style="color:var(--green)">+' + (f.additions || 0) + '</span> <span style="color:var(--red)">\u2212' + (f.deletions || 0) + '</span></div></div>';
    }).join('');
    const moreFiles = d.files.length > 12 ? '<div class="rp-more" style="cursor:default">… +' + (d.files.length - 12) + ' ' + esc(t('files')) + '</div>' : '';

    return '<div class="rp-sec">' +
      '<div style="font-size:13.5px;font-weight:700;line-height:1.35">' + esc(pr.title || '') + '</div>' +
      '<div class="rp-scoresub" style="margin-top:5px">' +
      '<span class="rp-chip" style="color:' + stateColor + ';border-color:' + stateColor + '">' + esc(state) + '</span>' +
      '<span class="rp-chip">#' + S.pull + '</span>' +
      '<span class="rp-chip">' + esc(t('prBy')) + ' ' + esc(pr.user && pr.user.login || '?') + '</span>' +
      '<span class="rp-chip" style="direction:ltr">' + esc(pr.head && pr.head.ref || '?') + ' → ' + esc(pr.base && pr.base.ref || '?') + '</span>' +
      '</div></div>' +
      '<div class="rp-sec">' + bar + '</div>' +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('repoFacts')) + '</div><div class="rp-facts">' + facts + '</div></div>' +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('prRisk')) + ' · ' + an.riskScore + '/10</div><div class="rp-checks">' + risks + '</div></div>' +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('prTopFiles')) + '</div>' + filesHtml + moreFiles + '</div>' +
      (an.truncated ? '<div class="rp-sec" style="font-size:11px;color:var(--text3)">⚠ ' + esc(t('prTruncated')) + '</div>' : '') +
      '<button class="rp-btn" data-action="prdigest" style="width:100%">' + esc(t('prCopyReview')) + '</button>';
  }

  function rpSmellHtml() {
    const sm = S.smellScan;
    if (!sm) return '';
    if (sm.clean) {
      return '<div class="rp-check ok" style="margin-top:12px"><span class="rp-ico">✓</span><span>' + esc(t('smellClean')) + '</span></div>';
    }
    const rules = Object.keys(sm.byRule).slice(0, 6).map(function (k) {
      return '<span class="rp-topic">' + esc(k) + ' ×' + sm.byRule[k] + '</span>';
    }).join('');
    const topFiles = sm.files.slice(0, 3).map(function (f) {
      return '<div class="rp-langrow"><span class="nm" style="direction:ltr">' + esc(f.path) + '</span><span class="pc">' + f.count + '</span></div>';
    }).join('');
    return '<div class="rp-sec" style="margin-top:14px">' +
      '<div class="rp-sec-title">' + esc(t('smellTitle')) + ' · ' + sm.total + ' · ' + esc(t('smellDensity', { n: sm.perKloc })) + '</div>' +
      '<div class="rp-topics">' + rules + '</div>' +
      (topFiles ? '<div style="margin-top:6px">' + topFiles + '</div>' : '') +
      '</div>';
  }

  /* ---------- activity tab ---------- */
  function rpActivityHtml() {
    if (S.activityLoading) return '<div class="rp-spin"></div><div class="rp-empty">' + esc(t('loading')) + '</div>';
    if (S.activityError) {
      return '<div class="rp-err"><b>' + esc(t('error')) + '</b>' +
        esc(S.activityError === 'RATE_LIMIT' ? t('rateLimited') : S.activityError === 'EMPTY' ? t('activityUnavailable') : t('networkError')) +
        '<div><button class="rp-btn rp-sm" data-action="reloadact">' + esc(t('retry')) + '</button></div></div>';
    }
    if (!S.activity) return '<div class="rp-empty">' + esc(t('loading')) + '</div>';
    const a = S.activity;

    let heat = '';
    if (a.weekly && a.weekly.length) {
      const max = Math.max.apply(null, a.weekly.map(function (w) { return w.total || 0; })) || 1;
      const total = a.weekly.reduce(function (s, w) { return s + (w.total || 0); }, 0);
      const cols = a.weekly.map(function (w) {
        const days = (w.days || [0, 0, 0, 0, 0, 0, 0]).map(function (d) {
          const lv = d === 0 ? 0 : Math.min(4, Math.ceil(d / max * 4));
          const bg = lv === 0 ? 'var(--bg3)' : 'rgba(34,197,94,' + (0.25 + lv * 0.19) + ')';
          return '<span class="rp-cell" style="background:' + bg + '"></span>';
        }).join('');
        return '<div class="rp-heatcol">' + days + '</div>';
      }).join('');
      heat = '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('commitActivity')) + ' · <b>' + fmt(total) + '</b></div>' +
        '<div class="rp-heat">' + cols + '</div>' +
        '<div class="rp-heatlegend"><span>0</span><span class="rp-cell" style="background:var(--bg3)"></span><span class="rp-cell" style="background:rgba(34,197,94,.44)"></span><span class="rp-cell" style="background:rgba(34,197,94,.63)"></span><span class="rp-cell" style="background:rgba(34,197,94,.82)"></span><span class="rp-cell" style="background:rgba(34,197,94,1)"></span></div></div>';
    } else {
      heat = '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('commitActivity')) + '</div><div class="rp-empty" style="padding:10px">' + esc(t('activityUnavailable')) + '</div></div>';
    }

    let contribs = '';
    if (a.contributors && a.contributors.length) {
      contribs = '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('topContributors')) + '</div>' +
        a.contributors.map(function (c) {
          return '<div class="rp-contrib">' +
            (c.avatar_url ? '<img src="' + esc(c.avatar_url) + (c.avatar_url.indexOf('?') !== -1 ? '&' : '?') + 's=44" alt="" loading="lazy">' : '<img src="" alt="">') +
            '<span class="nm">' + esc(c.login || '') + '</span><span class="n">' + fmt(c.contributions) + ' ' + esc(t('commits')) + '</span></div>';
        }).join('') + '</div>';
    }

    let commits = '';
    if (a.commits && a.commits.length) {
      commits = '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('recentCommits')) + '</div>' +
        a.commits.map(function (c) {
          const msg = ((c.commit && c.commit.message) || '').split('\n')[0];
          const date = c.commit && c.commit.author && c.commit.author.date;
          return '<div class="rp-commit"><div class="m">' + esc(msg) + '</div><div class="d">' + esc(RPI18N.timeAgo(date)) + '</div></div>';
        }).join('') + '</div>';
    }

    return heat + contribs + commits;
  }

  /* ---------- recent repos (local history, chrome.storage) ---------- */
  const RP_RECENT_KEY = 'rp_recent';
  const RP_RECENT_MAX = 12;
  function rpRecordRecent() {
    if (!S.key) return;
    const h = rpHealth();
    S.recent = RepodestCore.pushRecent(S.recent, { full: S.key, t: Date.now(), score: h ? h.score : null }, RP_RECENT_MAX);
    RPApi.storeSet({ [RP_RECENT_KEY]: S.recent }).catch(function () {});
  }
  async function rpLoadRecent() {
    S.recentLoaded = true;
    try {
      const o = await RPApi.storeGet(RP_RECENT_KEY);
      const list = (o && o[RP_RECENT_KEY]) || [];
      S.recent = Array.isArray(list) ? list.filter(function (r) { return r && typeof r.full === 'string'; }).slice(0, RP_RECENT_MAX) : [];
    } catch (e) { S.recent = []; }
    if (S.tab === 'health' && S.data && !S.loading) rpRenderTabBody();
  }
  function rpRecentHtml() {
    const list = (S.recent || []).filter(function (r) {
      return r && r.full && r.full.toLowerCase() !== (S.key || '').toLowerCase();
    }).slice(0, 8);
    if (!list.length) return '';
    const chips = list.map(function (r) {
      const title = r.full + (r.score != null ? ' — ' + r.score + '/100' : '');
      return '<button class="rp-chip rp-recent-chip" data-action="recent" data-key="' + esc(r.full) + '" title="' + esc(title) + '">' + esc(r.full) + '</button>';
    }).join('');
    return '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('recentTitle')) + '</div>' +
      '<div class="rp-recent">' + chips + '</div>' +
      '<button class="rp-btn rp-ghost rp-sm" data-action="recentclear" style="margin-top:8px">' + esc(t('recentClear')) + '</button></div>';
  }

  /* ---------- compare tab (Battle mode vs any public repo) ---------- */
  function rpCompareHtml() {
    let inner = '';
    if (S.cmpError) {
      const msg = S.cmpError === 'SAME_REPO' ? t('compareSameRepo')
        : S.cmpError === 'NOT_FOUND' ? t('notFound')
        : S.cmpError === 'RATE_LIMIT' ? t('rateLimited')
        : S.cmpError === 'INVALID' ? t('invalidInput')
        : t('networkError');
      inner = '<div class="rp-err"><b>' + esc(t('error')) + '</b>' + esc(msg) + '</div>';
    }
    if (S.cmpResult) inner += rpCompareResultHtml(S.cmpResult);
    return '<div class="rp-sec">' +
      '<div class="rp-sec-title">⚔️ ' + esc(t('compareTab')) + '</div>' +
      '<div style="font-size:12px;color:var(--text2);margin-bottom:8px">' + esc(t('compareHint')) + '</div>' +
      '<label class="rp-label" for="rpCmpInput">' + esc(t('comparePlaceholder')) + '</label>' +
      '<input id="rpCmpInput" class="rp-input" type="text" dir="ltr" placeholder="facebook/react" value="' + esc(S.cmpInput) + '"' + (S.cmpLoading ? ' disabled' : '') + '>' +
      '<div class="rp-btnrow" style="margin-top:8px"><button class="rp-btn" data-action="compare"' + (S.cmpLoading ? ' disabled' : '') + '>' +
      esc(S.cmpLoading ? t('compareLoading') : t('compareBtn')) + '</button></div>' +
      inner + '</div>';
  }

  async function rpCompareRun() {
    if (!S.data || S.cmpLoading) return;
    const inputEl = rpEls.root.querySelector('#rpCmpInput');
    const raw = ((inputEl ? inputEl.value : S.cmpInput) || '').trim();
    S.cmpInput = raw;
    let m = raw.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/\s?#]|$)/i);
    if (!m) m = raw.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (!m) { S.cmpError = 'INVALID'; S.cmpResult = null; rpRenderTabBody(); return; }
    const owner = m[1], repo = m[2].replace(/\.git$/, '');
    if ((owner + '/' + repo).toLowerCase() === (S.key || '').toLowerCase()) {
      S.cmpError = 'SAME_REPO'; S.cmpResult = null; rpRenderTabBody(); return;
    }
    const req = ++_cmpReq;
    S.cmpLoading = true; S.cmpError = null;
    rpRenderTabBody();
    try {
      const other = await RPApi.fetchRepo(owner, repo, {});
      if (req !== _cmpReq) return; /* navigation or a newer compare won */
      const hA = rpHealth();
      const pathsB = (other.tree && other.tree.tree || []).map(function (f) { return f.path; });
      const hB = other.tree ? healthCheckPaths(pathsB, other.meta) : null;
      S.cmpResult = RepodestCore.compareRepos(
        { name: S.key, meta: S.data.meta, health: hA },
        { name: owner + '/' + repo, meta: other.meta, health: hB }
      );
      S.cmpResult.names = [S.key, owner + '/' + repo];
      S.cmpResult.treeMissing = !other.tree;
      S.cmpLoading = false;
      rpRenderTabBody();
    } catch (e) {
      if (req !== _cmpReq) return;
      S.cmpLoading = false;
      S.cmpError = (e && e.code) || 'NETWORK';
      S.cmpResult = null;
      rpRenderTabBody();
    }
  }

  function rpCompareResultHtml(res) {
    const nameA = (res.names && res.names[0]) || 'A';
    const nameB = (res.names && res.names[1]) || 'B';
    const verdict = res.overall === 0
      ? t('compareTie', { a: res.wins.a, b: res.wins.b })
      : t('compareWins', { name: res.overall === 1 ? nameA : nameB, a: res.wins.a, b: res.wins.b });
    const labels = {
      health: t('healthScore'), stars: t('stars'), forks: t('forks'), watchers: t('watchers'),
      issues: t('openIssues'), size: t('size'), fresh: t('cmpFresh'),
      license: t('checkLicense'), ci: t('checkCI'), tests: t('checkTests'), readme: t('checkReadme')
    };
    const cell = function (row, side) {
      const v = side === 1 ? row.a : row.b;
      const win = row.winner === side;
      let txt;
      if (v == null) txt = '—';
      else if (row.key === 'fresh') txt = v + 'd';
      else if (row.key === 'size') txt = fmtSize(v * 1024);
      else if (row.key === 'license' || row.key === 'ci' || row.key === 'tests' || row.key === 'readme') txt = v === 1 ? '✓' : '✗';
      else txt = fmt(v);
      return '<span class="rp-cmp-val' + (win ? ' rp-cmp-win' : '') + '">' + esc(String(txt)) + (win ? ' 🏆' : '') + '</span>';
    };
    const rows = res.rows.map(function (row) {
      return '<div class="rp-cmp-row"><span class="rp-cmp-k">' + esc(labels[row.key] || row.key) + '</span>' +
        cell(row, 1) + cell(row, 2) + '</div>';
    }).join('');
    const treeNote = res.treeMissing
      ? '<div style="font-size:11px;color:var(--text3);margin-top:6px">' + esc(t('compareNoTree')) + '</div>' : '';
    return '<div class="rp-sec rp-cmp">' +
      '<div class="rp-cmp-verdict">' + esc(verdict) + '</div>' +
      '<div class="rp-cmp-row rp-cmp-head"><span class="rp-cmp-k"></span>' +
      '<span class="rp-cmp-name" title="' + esc(nameA) + '">' + esc(nameA) + '</span>' +
      '<span class="rp-cmp-name" title="' + esc(nameB) + '">' + esc(nameB) + '</span></div>' +
      rows + treeNote + '</div>';
  }

  /* =============== Architecture Diagram tab (GitDiagram-grade, CSP-safe local SVG + List) =============== */
  function rpGetDiagram() {
    if (!S.data || !S.data.meta) return null;
    const branch = (S.data.meta && S.data.meta.default_branch) || 'main';
    const key = (S.key || '') + '@' + branch;
    if (S._diagCache && S._diagCache.key === key) return S._diagCache.built;
    const paths = (S.data.tree && S.data.tree.tree || []).map(function (f) { return f.path; });
    const built = RepodestCore.buildArchDiagram(paths, S.data.meta, { maxPerLayer: 5, truncated: !!(S.data.tree && S.data.tree.truncated) });
    S._diagCache = { key: key, built: built };
    return built;
  }

  function rpDiagramSvgHtml(graph) {
    return RepodestCore.graphToSvg(graph);
  }

  function rpDiagramHtml() {
    const built = rpGetDiagram();
    if (!built) return '';
    const graph = built.graph;
    const fullName = (S.data.meta && S.data.meta.full_name) || S.key || '';
    const webUrl = RP_LINKS.web + '?repo=' + encodeURIComponent(fullName) + '#diagram';
    const isList = S.diagView === 'list';

    const listHtml = graph.groups.map(function (l) {
      const pills = l.nodes.map(function (nid) {
        const info = graph.nodes[nid];
        if (!info) return '';
        if (!info.url || info.isOverflow) {
          return '<span style="display:inline-block;margin:3px 4px 3px 0;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,.04);color:var(--text3);font-family:var(--mono);font-size:11px">' + esc(info.label) + '</span>';
        }
        return '<a href="' + esc(info.url) + '" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:3px 4px 3px 0;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--text);font-family:var(--mono);font-size:11px;text-decoration:none" title="' + esc(info.path) + '">' + esc(info.label) + '</a>';
      }).join('');
      return '<div style="border-left:3px solid ' + l.color + ';background:var(--bg2);border-radius:8px;padding:8px 10px;margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '  <b style="font-size:12px;color:' + l.color + '">' + esc(l.title) + '</b>' +
        '  <span style="font-size:10.5px;color:var(--text3)">' + l.shown + '/' + l.total + ' files</span>' +
        '</div>' +
        '<div>' + pills + '</div>' +
        '</div>';
    }).join('');

    return '<div class="rp-sec">' +
      '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">' +
      '  Heuristic structural map · ' + built.stats.layers + ' layers · ' + built.stats.shownFiles + '/' + built.stats.totalFiles + ' files · click any node to open on GitHub' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">' +
      '  <button class="rp-btn rp-ghost rp-sm" data-action="diagview">' + (isList ? 'SVG Diagram' : 'List View') + '</button>' +
      '  <button class="rp-btn rp-sm" data-action="diagcopy">Copy Mermaid</button>' +
      '  <button class="rp-btn rp-ghost rp-sm" data-action="diagjson">Copy JSON</button>' +
      '  <button class="rp-btn rp-ghost rp-sm" data-action="diagprompt">Copy AI Prompt</button>' +
      '  <a class="rp-btn rp-ghost rp-sm" href="' + esc(webUrl) + '" target="_blank" rel="noopener noreferrer" style="text-decoration:none">Full Interactive ↗</a>' +
      '</div>' +
      (isList ? listHtml : rpDiagramSvgHtml(graph)) +
      '<details style="margin-top:10px">' +
      '  <summary style="cursor:pointer;font-size:11.5px;color:var(--text3)">View Mermaid (.mmd) source</summary>' +
      '  <pre dir="ltr" style="margin-top:8px;padding:10px;border-radius:8px;background:var(--bg2);border:1px solid var(--line);font-family:var(--mono);font-size:10.5px;overflow-x:auto;white-space:pre-wrap;color:var(--text2)">' + esc(built.mermaid) + '</pre>' +
      '</details>' +
      '</div>';
  }

  /* =============== interactions =============== */
  function rpClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    if (a === 'toggle') { e.preventDefault(); rpToggle(); }
    else if (a === 'settings') {
      e.preventDefault();
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
        else window.open((typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('options/options.html') : 'https://mohsen-niksirat.github.io/repodest/'));
      } catch (err) { window.open('https://mohsen-niksirat.github.io/repodest/'); }
    }
    else if (a === 'refresh') { e.preventDefault(); rpLoadRepo(true); }
    else if (a === 'reload') { e.preventDefault(); rpLoadRepo(); }
    else if (a === 'reloadpr') { e.preventDefault(); rpLoadPull(true); }
    else if (a === 'reloadact') { e.preventDefault(); rpLoadActivity(true); }
    else if (a === 'tab') { S.tab = el.dataset.tab; rpRenderChrome(); rpRenderTabBody(); }
    else if (a === 'goal') { rpGoal(el.dataset.goal); }
    else if (a === 'vulnscan') { rpLoadVulns(); }
    else if (a === 'compare') { rpCompareRun(); }
    else if (a === 'recent') {
      const key = el.dataset.key;
      if (key && /^[\w.-]+\/[\w.-]+$/.test(key)) location.href = 'https://github.com/' + key;
    }
    else if (a === 'recentclear') {
      S.recent = [];
      RPApi.storeSet({ [RP_RECENT_KEY]: [] }).catch(function () {});
      rpRenderTabBody();
    }
    else if (a === 'report') {
      const h = rpHealth();
      if (!h || !S.data) return;
      const md = RepodestCore.healthReportMarkdown(S.data.meta, h, S.data.langs);
      rpCopyText(md, function () { rpToast(t('reportCopied')); });
    }
    else if (a === 'diagview') {
      S.diagView = S.diagView === 'list' ? 'svg' : 'list';
      rpRenderTabBody();
    }
    else if (a === 'diagcopy') {
      const built = rpGetDiagram();
      if (!built) return;
      rpCopyText(built.mermaid, function () { rpToast('Mermaid code copied'); });
    }
    else if (a === 'diagjson') {
      const built = rpGetDiagram();
      if (!built) return;
      rpCopyText(JSON.stringify(built.graph, null, 2), function () { rpToast('Graph JSON copied'); });
    }
    else if (a === 'diagprompt') {
      if (!S.data) return;
      const paths = (S.data.tree && S.data.tree.tree || []).map(function (f) { return f.path; });
      const prompt = RepodestCore.buildDiagramPrompt(paths, S.data.meta, '');
      rpCopyText(prompt, function () { rpToast('AI Diagram prompt copied'); });
    }
    else if (a === 'selall') { S.sel = new Set(RPDigest.selectAllText(S.data.tree)); S.digestStale = true; rpRecomputeSelCounts(); rpRenderTabBody(); }
    else if (a === 'collapse') { S.expanded.clear(); rpRefreshTree(); }
    else if (a === 'exp') {
      const p = el.dataset.path;
      if (S.expanded.has(p)) S.expanded.delete(p); else S.expanded.add(p);
      rpRefreshTree();
    }
    else if (a === 'more') { S.limits.set(el.dataset.path, (S.limits.get(el.dataset.path) || 100) + 200); rpRefreshTree(); }
    else if (a === 'generate') { rpGenerate(el); }
    else if (a === 'copy') { rpCopy(); }
    else if (a === 'llm') {
      const ta = rpEls.root.querySelector('#rpOut');
      const text = ta ? ta.value : '';
      if (!text) return;
      const urls = { claude: 'https://claude.ai/new', chatgpt: 'https://chatgpt.com/', gemini: 'https://gemini.google.com/app' };
      const u = urls[el.dataset.provider];
      if (u) window.open(u, '_blank', 'noopener'); /* sync — inside the user gesture */
      rpCopyText(text, function () { rpToast(t('copied')); });
    }
    else if (a === 'prdigest') {
      const d = S.pullData;
      if (!d) return;
      const an = rpAnalyzePull();
      rpCopyText(buildPRDigest(d.pr, d.files, an, {}), function () { rpToast(t('prReviewReady')); });
    }
    else if (a === 'download') { rpDownload(); }
    else if (a === 'part') {
      S.partIdx = Math.max(0, Math.min(S.digestParts.length - 1, S.partIdx + Number(el.dataset.d)));
      rpRenderTabBody();
    }
  }

  function rpChange(e) {
    const el = e.target;
    if (el.id === 'rpPreset' || el.id === 'rpFormat' || el.id === 'rpModel') {
      const patch = {};
      patch[el.id === 'rpPreset' ? 'preset' : el.id === 'rpFormat' ? 'format' : 'model'] = el.value;
      rpSaveSettings(patch);
      if (el.id !== 'rpModel') S.digestStale = true;
      if (el.id === 'rpPreset') rpRenderTabBody(); /* show/hide custom-task textarea */
      else rpRefreshSelMeta();
      return;
    }
    if (el.id === 'rpOptReadme' || el.id === 'rpOptTree' || el.id === 'rpOptShrink' || el.id === 'rpOptSig') {
      const map = { rpOptReadme: 'readme', rpOptTree: 'tree', rpOptShrink: 'shrink', rpOptSig: 'sigonly' };
      const patch = {};
      patch[map[el.id]] = el.checked;
      rpSaveSettings(patch);
      S.digestStale = true;
      rpRefreshSelMeta();
      return;
    }
    if (el.dataset.path) {
      rpSetFileSel(el.dataset.path, el.checked);
      S.digestStale = true;
      rpRefreshSelMeta();
    } else if (el.dataset.dirpath) {
      const node = rpFindDir(S.treeRoot, el.dataset.dirpath);
      if (node) {
        const files = node._sel || [];
        const all = rpDirAllSel(node);
        files.forEach(function (f) { rpSetFileSel(f.path, !all); });
        S.digestStale = true;
        rpRefreshTree();
      }
    }
  }

  function rpInput(e) {
    const el = e.target;
    if (el.id === 'rpSearch') {
      S.search = el.value;
      clearTimeout(S._searchTimer);
      S._searchTimer = setTimeout(rpRefreshTree, 180);
    } else if (el.id === 'rpCmpInput') {
      S.cmpInput = el.value;
    } else if (el.id === 'rpCustomTask') {
      clearTimeout(S._ctTimer);
      S._ctTimer = setTimeout(function () { rpSaveSettings({ customTask: el.value }); }, 400);
    }
  }

  async function rpSaveSettings(patch) {
    S.settings = await RPApi.setSettings(patch);
  }

  function rpGoal(goal) {
    if (goal === 'clear') S.sel.clear();
    else if (goal === 'all') S.sel = new Set(RPDigest.selectAllText(S.data.tree));
    else S.sel = new Set(RPDigest.selectByGoal(S.data.tree, goal));
    S.digestStale = true;
    rpRecomputeSelCounts();
    rpRenderTabBody();
  }

  function rpFindDir(node, path) {
    if (S.treeMap) return S.treeMap.get(path) || null;
    if (node.path === path) return node;
    for (const d of node.dirs.values()) {
      const r = rpFindDir(d, path);
      if (r) return r;
    }
    return null;
  }

  function rpRefreshTree() {
    const treeEl = rpEls.root.querySelector('#rpTree');
    if (treeEl) treeEl.innerHTML = rpTreeInnerHtml();
    rpRefreshSelMeta();
  }
  function rpRefreshSelMeta() {
    const body = rpEls.body;
    if (!body) return;
    /* selmeta is the first .rp-selmeta after the tree */
    const el = body.querySelector('.rp-selmeta');
    if (el) {
      const tmp = document.createElement('div');
      tmp.innerHTML = rpSelMetaHtml();
      el.replaceWith(tmp.firstChild);
    }
    rpSyncDirChecks();
  }
  /* keep parent folder checkboxes in sync after a single file toggles */
  function rpSyncDirChecks() {
    if (!rpEls.body) return;
    const boxes = rpEls.body.querySelectorAll('input[data-dirpath]');
    for (const box of boxes) {
      const node = rpFindDir(S.treeRoot, box.dataset.dirpath);
      if (node) box.checked = rpDirAllSel(node);
    }
  }

  /* =============== digest generation =============== */
  async function rpGenerate(btn) {
    if (!S.sel.size) { rpToast(t('noSelection')); return; }
    if (S.generating) return;
    S.generating = true;
    btn.disabled = true;
    btn.textContent = t('analyzingFiles');
    const st = S.settings;
    let res;
    try {
      res = await RPDigest.generate(
        { meta: S.data.meta, branch: S.data.branch, tree: S.data.tree, sel: S.sel },
        { preset: st.preset, format: st.format, model: st.model, shrink: st.shrink, sigonly: st.sigonly, readme: st.readme, tree: st.tree, customTask: st.customTask },
        function (n, total) { btn.textContent = t('generating', { n: n, total: total }); }
      );
    } catch (e) {
      S.generating = false;
      btn.disabled = false;
      btn.textContent = t('generate');
      rpToast(t('networkError'));
      return;
    }
    S.generating = false;
    btn.disabled = false;
    btn.textContent = t('generate');
    if (res.error === 'NO_SELECTION') { rpToast(t('noSelection')); return; }
    if (res.error === 'TOO_BIG') { rpToast(t('selectionTooBig')); return; }
    S.digestParts = res.parts; S.partIdx = 0; S.digestStats = res.stats; S.digestStale = false;
    S.smellScan = res.smells || RPDigest.smellScan(res.sections || []);
    rpRenderTabBody();
    rpToast(S.digestParts.length > 1 ? t('digestParts', { n: S.digestParts.length }) : t('digestReady'));
  }

  function rpCopy() {
    const ta = rpEls.root.querySelector('#rpOut');
    const text = ta ? ta.value : '';
    if (!text) return;
    rpCopyText(text, function () { rpToast(t('copied')); });
  }
  function rpCopyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { rpCopyTextFallback(text, done); });
    } else rpCopyTextFallback(text, done);
  }
  function rpCopyTextFallback(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    ta.remove();
  }

  function rpDownload() {
    if (!S.digestParts || !S.digestParts.length) return;
    const ext = { md: 'md', xml: 'xml', json: 'json', llmstxt: 'txt', repomix: 'xml' }[S.settings.format] || 'txt';
    const name = (S.key || 'repo').replace('/', '-') + '-repodest-digest.' + ext;
    const blob = new Blob([S.digestParts[S.partIdx]], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.documentElement.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  /* =============== misc =============== */
  let _toastTimer = null;
  function rpToast(msg) {
    if (!rpEls.toast) return;
    rpEls.toast.textContent = msg;
    rpEls.toast.classList.add('rp-show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { rpEls.toast.classList.remove('rp-show'); }, 2600);
  }

  function rpUpdateRate(info) {
    if (!rpEls.rate) return;
    if (info.remaining == null) return;
    rpEls.rate.style.display = '';
    rpEls.rateVal.textContent = t('apiLeft') + ': ' + info.remaining;
    const dot = rpEls.rate.querySelector('.dot');
    if (dot) dot.style.background = info.remaining <= 5 ? 'var(--red)' : info.remaining < 20 ? 'var(--yellow)' : 'var(--green)';
  }

  function rpToggle(force) {
    if (!rpEls.panel) return;
    const want = force !== undefined ? force : !S.open;
    S.open = want;
    if (want) {
      if (S.prxFocus) { S.tab = 'prx'; S.prxFocus = false; }
      if (!S.data && !S.loading) rpLoadRepo();
      rpRenderChrome();
      rpRenderTabBody();
      try { rpEls.panel.focus(); } catch (e) {}
    } else {
      try { rpEls.fab.focus(); } catch (e) {}
    }
    rpEls.panel.classList.toggle('rp-open', want);
    rpEls.panel.inert = !want;
    rpEls.panel.setAttribute('aria-hidden', want ? 'false' : 'true');
    rpEls.fab.setAttribute('aria-expanded', want ? 'true' : 'false');
  }

  /* =============== messages & soft navigation =============== */
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (!msg || msg.type !== 'RP_TOGGLE') return;
      if (!rpNeedsUi()) return;
      rpRouteSafe().then(function () { rpToggle(); }, function () {});
    });
  }

  document.addEventListener('turbo:load', rpRouteDebounced);
  document.addEventListener('turbo:render', rpRouteDebounced);
  window.addEventListener('popstate', rpRouteDebounced);
  try {
    const titleEl = document.querySelector('title');
    if (titleEl) new MutationObserver(rpRouteDebounced).observe(titleEl, { childList: true, subtree: true, characterData: true });
  } catch (e) {}

  /* =============== boot (lazy: non-repo pages stay untouched) =============== */
  let _booted = false, _booting = null;
  function rpNeedsUi() { return !!(rpParseRepo() || rpIsSearchPage()); }
  async function rpEnsureBoot() {
    if (_booted) return;
    if (!_booting) {
      _booting = (async function () {
        S.settings = await RPApi.getSettings();
        RPI18N.init(S.settings.lang);
        rpMount();
        _booted = true;
        /* re-detect theme when GitHub toggles it */
        try {
          const mo = new MutationObserver(function () { rpApplyDirTheme(); });
          mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-darktheme'] });
        } catch (e) {}
        /* live settings: options page or another tab changed something */
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener(function (changes, area) {
            if (area !== 'local') return;
            if (!Object.keys(changes).some(function (k) { return k in RPApi.DEFAULT_SETTINGS; })) return;
            RPApi.getSettings({ force: true }).then(function (s) {
              S.settings = s;
              RPI18N.init(s.lang);
              rpRender();
            }, function () {});
          });
        }
        RPApi.maybePrune(14).catch(function () {});
      })();
    }
    try { await _booting; } catch (e) { _booting = null; throw e; }
  }
  async function rpRouteSafe() {
    if (!rpNeedsUi()) {
      if (rpEls.host) rpEls.host.style.display = 'none';
      _repoReq++; _pullReq++; _actReq++; _vulnReq++; _cmpReq++;
      S.loading = false; S.pullLoading = false; S.activityLoading = false; S.vulnLoading = false; S.cmpLoading = false;
      S.key = null;
      return;
    }
    await rpEnsureBoot();
    rpRoute();
  }
  rpRouteSafe().then(function () {
    /* deep link: #repodest opens the sidebar (also used by headless tests) */
    if (rpNeedsUi() && /^#repodest(-open)?$/.test(location.hash)) rpToggle(true);
  }, function () {});
})();
