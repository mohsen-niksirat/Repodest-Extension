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
    'atom', 'git-guide', 'open-source', 'personal', 'organizations-plan']);

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
    digestParts: null, partIdx: 0, digestStats: null,
    tab: 'health', open: false,
    pull: null, pullData: null, pullLoading: false, pullError: null, prxFocus: false,
    settings: null, rateShown: false
  };
  const t = function (key, args) { return RPI18N.t(key, args || {}); };

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
    _routeTimer = setTimeout(rpRoute, 250);
  }
  function rpRoute() {
    const r = rpParseRepo();
    const host = rpEls.host;
    if (!r) {
      if (host) host.style.display = 'none';
      S.key = null;
      return;
    }
    if (host) host.style.display = '';
    const key = r.owner + '/' + r.repo;
    const pull = r.pull || null;
    if (key.toLowerCase() !== (S.key || '').toLowerCase()) {
      S.owner = r.owner; S.repo = r.repo; S.key = key;
      S.data = null; S.error = null; S.activity = null; S.activityError = null;
      S.sel.clear(); S.expanded.clear(); S.limits.clear(); S.search = '';
      S.digestParts = null; S.digestStats = null;
      S.pull = pull; S.pullData = null; S.pullError = null;
      S.prxFocus = !!pull;
      if (S.pull) S.tab = 'prx'; else if (S.tab === 'prx') S.tab = 'health';
      rpRenderChrome();
      if (S.open) { rpRenderTabBody(); rpLoadRepo(); if (S.pull) rpLoadPull(); }
    } else if (pull !== S.pull) {
      S.pull = pull; S.pullData = null; S.pullError = null;
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
  async function rpLoadRepo(force) {
    if (!S.key) return;
    S.loading = true; S.error = null;
    rpRender();
    try {
      S.data = await RPApi.fetchRepo(S.owner, S.repo, { force: force });
      S.treeRoot = rpBuildTree(S.data.tree);
      S.loading = false;
      rpRender();
    } catch (e) {
      S.loading = false;
      S.error = (e && e.code) ? e.code : 'UNKNOWN';
      rpRender();
    }
  }

  async function rpLoadPull(force) {
    if (!S.pull || S.pullLoading) return;
    S.pullLoading = true; S.pullError = null;
    rpRenderScorebar();
    rpRenderTabBody();
    try {
      S.pullData = await RPApi.fetchPull(S.owner, S.repo, S.pull, { force: force });
      S.pullLoading = false;
      rpRenderScorebar();
      rpRenderTabBody();
    } catch (e) {
      S.pullLoading = false;
      S.pullError = (e && e.code) || 'UNKNOWN';
      rpRenderScorebar();
      rpRenderTabBody();
    }
  }

  async function rpLoadActivity(force) {
    if (!S.key || S.activityLoading) return;
    S.activityLoading = true; S.activityError = null;
    rpRenderTabBody();
    try {
      S.activity = await RPApi.fetchActivity(S.owner, S.repo, { force: force });
      S.activityLoading = false;
      rpRenderTabBody();
    } catch (e) {
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
    return root;
  }
  function rpDirFiles(node, out) {
    out = out || [];
    for (const f of node.files) out.push(f);
    node.dirs.forEach(function (d) { rpDirFiles(d, out); });
    return out;
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
      '<button class="rp-fab" data-action="toggle" title="' + esc(t('open')) + '" aria-label="' + esc(t('open')) + '">' + RP_ICONS.logo + '</button>' +
      '<aside class="rp-panel" id="rpPanel" role="dialog" aria-label="' + esc(t('extName')) + '" tabindex="-1">' +
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

    shadow.addEventListener('click', rpClick);
    shadow.addEventListener('change', rpChange);
    shadow.addEventListener('input', rpInput);
    shadow.addEventListener('keydown', rpTabKeys);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && S.open) rpToggle(false);
    });
    RPApi.onRate(rpUpdateRate);
  }

  /* arrow-key navigation between tabs (RTL-aware) */
  function rpTabKeys(e) {
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
    const tabs = [['health', t('tabHealth')], ['digest', t('tabDigest')]];
    if (S.pull) tabs.push(['prx', t('prTab')]);
    tabs.push(['activity', t('tabActivity')]);
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
    if (!S.data || !S.data.meta) return null;
    const paths = (S.data.tree && S.data.tree.tree || []).map(function (f) { return f.path; });
    return healthCheckPaths(paths, S.data.meta);
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

  function rpRenderPRScorebar() {
    if (S.pullLoading || !S.pullData) { rpEls.scorebar.innerHTML = ''; rpEls.scorebar.style.display = 'none'; return; }
    const an = analyzePR(S.pullData.pr, S.pullData.files);
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
    if (S.loading) {
      rpEls.body.innerHTML = '<div class="rp-spin"></div><div class="rp-empty">' + esc(t('loading')) + '</div>';
      return;
    }
    if (S.error) { rpEls.body.innerHTML = rpErrorHtml(S.error); return; }
    if (!S.data) { rpEls.body.innerHTML = '<div class="rp-empty">' + esc(t('tagline')) + '</div>'; return; }
    if (S.tab === 'health') rpEls.body.innerHTML = rpHealthHtml();
    else if (S.tab === 'digest') rpEls.body.innerHTML = rpDigestHtml();
    else if (S.tab === 'prx') {
      if (!S.pullData && !S.pullError && !S.pullLoading) { rpLoadPull(); return; }
      rpEls.body.innerHTML = S.pullError ? rpErrorHtml(S.pullError) : (S.pullData ? rpPRHtml() : '<div class="rp-spin"></div><div class="rp-empty">' + esc(t('loading')) + '</div>');
    }
    else if (S.tab === 'activity') { rpEls.body.innerHTML = rpActivityHtml(); if (!S.activity && !S.activityError) rpLoadActivity(); }
  }

  function rpErrorHtml(code) {
    let msg, extra = '';
    if (code === 'NOT_FOUND') msg = t('notFound');
    else if (code === 'RATE_LIMIT') {
      msg = t('rateLimited');
      extra = '<button class="rp-btn rp-ghost rp-sm" data-action="settings">' + esc(t('openSettings')) + '</button> ';
    } else msg = t('networkError');
    return '<div class="rp-err"><b>' + esc(t('error')) + '</b>' + esc(msg) + '<div>' + extra +
      '<button class="rp-btn rp-sm" data-action="reload">' + esc(t('retry')) + '</button></div></div>';
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

    return descHtml +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('checks')) + '</div><div class="rp-checks">' + checks + '</div></div>' +
      '<div class="rp-sec"><div class="rp-sec-title">' + esc(t('repoFacts')) + '</div><div class="rp-facts">' + facts + '</div></div>' +
      langsHtml + topicsHtml;
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
          '<span class="rp-caret" data-action="exp" data-path="' + esc(it.path) + '">' + (isOpen ? '▼' : '▶') + '</span>' +
          '<input type="checkbox" class="rp-ck" data-dirpath="' + esc(it.path) + '"' + (rpDirAllSel(it) ? ' checked' : '') + '>' +
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
      '<input type="checkbox" class="rp-ck" data-path="' + esc(f.path) + '"' + (S.sel.has(f.path) ? ' checked' : '') + (selectable ? '' : ' disabled') + '>' +
      '<span class="rp-name">' + esc(f.path.split('/').pop()) + '</span>' +
      '<span class="rp-sz">' + fmtSize(f.size || 0) + '</span></div>';
  }

  function rpDirAllSel(node) {
    const files = rpDirFiles(node);
    return files.length > 0 && files.every(function (f) { return S.sel.has(f.path); });
  }

  function rpSelMetaHtml() {
    let bytes = 0, selectable = 0;
    const files = (S.data.tree && S.data.tree.tree) || [];
    const fmap = {};
    files.forEach(function (f) { fmap[f.path] = f; if (RPDigest.isSelectable(f)) selectable++; });
    S.sel.forEach(function (p) { const f = fmap[p]; if (f) bytes += f.size || 0; });
    const model = RPDigest.modelById(S.settings.model);
    const isPrompt = !!(S.digestParts && S.digestParts.length);
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
      '</div></div>';
  }

  /* ---------- PR X-Ray tab ---------- */
  function rpPRHtml() {
    const d = S.pullData, pr = d.pr;
    const an = analyzePR(pr, d.files);
    const state = pr.merged_at ? 'merged' : (pr.draft ? 'draft' : (pr.state || 'open'));
    const stateColor = state === 'merged' ? 'var(--accent)' : state === 'draft' ? 'var(--text3)' : state === 'closed' ? 'var(--red)' : 'var(--green)';

    const addPct = an.totals.changes ? Math.round(an.totals.add / an.totals.changes * 100) : 50;
    const bar = '<div class="rp-langbar" style="height:8px"><i style="width:' + addPct + '%;background:var(--green)" title="+' + fmt(an.totals.add) + '"></i><i style="width:' + (100 - addPct) + '%;background:var(--red)" title="\u2212' + fmt(an.totals.del) + '"></i></div>';

    const facts = [
      { k: t('prChangedFiles'), v: String(d.files.length) },
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
      (d.truncated ? '<div class="rp-sec" style="font-size:11px;color:var(--text3)">⚠ ' + esc(t('prTruncated')) + '</div>' : '') +
      '<button class="rp-btn" data-action="prdigest" style="width:100%">' + esc(t('prCopyReview')) + '</button>';
  }

  /* ---------- activity tab ---------- */
  function rpActivityHtml() {
    if (S.activityLoading) return '<div class="rp-spin"></div><div class="rp-empty">' + esc(t('loading')) + '</div>';
    if (S.activityError === 'RATE_LIMIT') return rpErrorHtml('RATE_LIMIT');
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
            (c.avatar_url ? '<img src="' + esc(c.avatar_url) + '&s=44" alt="" loading="lazy">' : '<img src="" alt="">') +
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
    else if (a === 'tab') { S.tab = el.dataset.tab; rpRenderChrome(); rpRenderTabBody(); }
    else if (a === 'goal') { rpGoal(el.dataset.goal); }
    else if (a === 'selall') { S.sel = new Set(RPDigest.selectAllText(S.data.tree)); rpRenderTabBody(); }
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
      const an = analyzePR(d.pr, d.files);
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
      if (el.id === 'rpPreset') rpRenderTabBody(); /* show/hide custom-task textarea */
      else rpRefreshSelMeta();
      return;
    }
    if (el.id === 'rpOptReadme' || el.id === 'rpOptTree' || el.id === 'rpOptShrink' || el.id === 'rpOptSig') {
      const map = { rpOptReadme: 'readme', rpOptTree: 'tree', rpOptShrink: 'shrink', rpOptSig: 'sigonly' };
      const patch = {};
      patch[map[el.id]] = el.checked;
      rpSaveSettings(patch);
      rpRefreshSelMeta();
      return;
    }
    if (el.dataset.path) {
      if (el.checked) S.sel.add(el.dataset.path); else S.sel.delete(el.dataset.path);
      rpRefreshSelMeta();
    } else if (el.dataset.dirpath) {
      const node = rpFindDir(S.treeRoot, el.dataset.dirpath);
      if (node) {
        const files = rpDirFiles(node).filter(function (f) { return RPDigest.isSelectable(f); });
        const all = rpDirAllSel(node);
        files.forEach(function (f) { if (all) S.sel.delete(f.path); else S.sel.add(f.path); });
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
    rpRenderTabBody();
  }

  function rpFindDir(node, path) {
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
  }

  /* =============== digest generation =============== */
  async function rpGenerate(btn) {
    if (!S.sel.size) { rpToast(t('noSelection')); return; }
    btn.disabled = true;
    btn.textContent = t('analyzingFiles');
    const st = S.settings;
    const res = await RPDigest.generate(
      { meta: S.data.meta, branch: S.data.branch, tree: S.data.tree, sel: S.sel },
      { preset: st.preset, format: st.format, model: st.model, shrink: st.shrink, sigonly: st.sigonly, readme: st.readme, tree: st.tree, customTask: st.customTask },
      function (n, total) { btn.textContent = t('generating', { n: n, total: total }); }
    );
    btn.disabled = false;
    btn.textContent = t('generate');
    if (res.error === 'NO_SELECTION') { rpToast(t('noSelection')); return; }
    if (res.error === 'TOO_BIG') { rpToast(t('selectionTooBig')); return; }
    S.digestParts = res.parts; S.partIdx = 0; S.digestStats = res.stats;
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
  }

  /* =============== messages & soft navigation =============== */
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function (msg) {
      if (msg && msg.type === 'RP_TOGGLE') rpToggle();
    });
  }

  document.addEventListener('turbo:load', rpRouteDebounced);
  document.addEventListener('turbo:render', rpRouteDebounced);
  window.addEventListener('popstate', rpRouteDebounced);
  try {
    const titleEl = document.querySelector('title');
    if (titleEl) new MutationObserver(rpRouteDebounced).observe(titleEl, { childList: true, subtree: true, characterData: true });
  } catch (e) {}

  /* =============== boot =============== */
  (async function rpBoot() {
    S.settings = await RPApi.getSettings();
    RPI18N.init(S.settings.lang);
    rpMount();
    rpRoute();
    /* deep link: #repodest opens the sidebar (also used by headless tests) */
    if (/^#repodest(-open)?$/.test(location.hash)) rpToggle(true);
    /* re-detect theme when GitHub toggles it */
    const mo = new MutationObserver(function () { rpApplyDirTheme(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-color-mode', 'data-darktheme'] });
  })();
})();
