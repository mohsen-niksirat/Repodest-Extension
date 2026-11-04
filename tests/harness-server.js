'use strict';
/* ============================================================
   Local E2E harness â€” serves the extension files into a
   GitHub-like page at /{owner}/{repo} so the content script's
   URL detection activates without loading the extension.
   Real api.github.com calls flow (CORS allows any origin).
   Run: node tests/harness-server.js  (port 8123)
   Open: http://127.0.0.1:8123/{owner}/{repo}?lang=fa&theme=light
   ============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');

const EXT = path.join(__dirname, '..');

const HARNESS = (qs) => `<!DOCTYPE html>
<html lang="${qs.lang === 'fa' ? 'fa' : 'en'}" data-color-mode="${qs.theme === 'light' ? 'light' : 'dark'}" data-darktheme="dark">
<head>
<meta charset="UTF-8">
<title>${qs.owner || 'owner'}/${qs.repo || 'repo'}: harness</title>
${qs.lang === 'fa' ? '<script>Object.defineProperty(navigator,\'language\',{get:function(){return \'fa-IR\'}});</script>' : ''}
<style>
  body { background: ${qs.theme === 'light' ? '#ffffff' : '#0d1117'}; color: ${qs.theme === 'light' ? '#1f2328' : '#e6edf3'}; font-family: -apple-system, 'Segoe UI', sans-serif; margin: 0; padding: 40px; }
  h1 { font-size: 20px; } h1 b { color: #58a6ff; }
  .box { max-width: 700px; border: 1px solid ${qs.theme === 'light' ? '#d0d7de' : '#30363d'}; border-radius: 8px; padding: 20px; background: ${qs.theme === 'light' ? '#f6f8fa' : '#161b22'}; }
  p { color: ${qs.theme === 'light' ? '#59636e' : '#9198a1'}; font-size: 14px; }
</style>
</head>
<body>
  <div class="box">
    <h1><b>${qs.owner || 'owner'}</b> / ${qs.repo || 'repo'}</h1>
    <p>Local E2E harness â€” the page path mimics a GitHub repo URL so the
    extension's content-script detection activates. All extension files load
    unmodified; api.github.com is called for real.</p>
    <p>The Repodest floating button should be attached to the left edge â†’</p>
  </div>
  <script src="/lib/core.js"><\/script>
  <script src="/lib/i18n.js"><\/script>
  <script src="/lib/api.js"><\/script>
  <script src="/lib/digest.js"><\/script>
  <script src="/content/sidebar.css.js"><\/script>
  <script>if (new URLSearchParams(location.search).get('pat') === '1') { RPApi.storeSet({ pat: 'harness' }); var _fs = RPApi.fetchScore; RPApi.fetchScore = function (o, r) { return _fs(o, r).catch(function (e) { window.__rpErrors = (window.__rpErrors || []).concat(o + '/' + r + ': ' + e.message + '/' + e.code); throw e; }); }; }</script>
  <script src="/content/content.js"><\/script>
</body>
</html>`;

const SEARCH_PAGE = `<!DOCTYPE html>
<html lang="en" data-color-mode="dark" data-darktheme="dark">
<head>
<meta charset="UTF-8">
<title>search Â· repositories</title>
<style>
  body { background: #0d1117; color: #e6edf3; font-family: -apple-system, 'Segoe UI', sans-serif; margin: 0; padding: 30px; }
  h2 { font-size: 16px; }
  li { border-bottom: 1px solid #30363d; }
  a { color: #58a6ff; text-decoration: none; font-size: 15px; display: block; padding: 12px 0; }
</style>
</head>
<body>
  <h2>Search Â· repositories (mock results)</h2>
  <ul data-testid="results-list" style="list-style:none;padding:0">
    <li><a href="/mohsen-niksirat/Repodest">mohsen-niksirat/<b>Repodest</b></a></li>
    <li><a href="/mohsen-niksirat/DataLens">mohsen-niksirat/<b>DataLens</b></a></li>
    <li><a href="/mohsen-niksirat/Ravaan">mohsen-niksirat/<b>Ravaan</b></a></li>
    <li><a href="/mohsen-niksirat/News-Channel-Bot">mohsen-niksirat/<b>News-Channel-Bot</b></a></li>
  </ul>
  <script src="/lib/core.js"><\/script>
  <script src="/lib/i18n.js"><\/script>
  <script src="/lib/api.js"><\/script>
  <script src="/lib/digest.js"><\/script>
  <script src="/content/sidebar.css.js"><\/script>
  <script>if (new URLSearchParams(location.search).get('pat') === '1') { RPApi.storeSet({ pat: 'harness' }); var _fs = RPApi.fetchScore; RPApi.fetchScore = function (o, r) { return _fs(o, r).catch(function (e) { window.__rpErrors = (window.__rpErrors || []).concat(o + '/' + r + ': ' + e.message + '/' + e.code); throw e; }); }; }</script>
  <script src="/content/content.js"><\/script>
</body>
</html>`;

const MIME = { '.js': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json' };

const server = http.createServer(function (req, res) {
  const u = new URL(req.url, 'http://x');
  const url = u.pathname;
  const qs = { lang: u.searchParams.get('lang'), theme: u.searchParams.get('theme'), owner: url.split('/')[1], repo: url.split('/')[2] };
  if (url === '/search') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(SEARCH_PAGE);
    return;
  }
  if (url === '/' || /^\/[^/]+\/[^/]*$/.test(url) === true) {
    if (url.includes('.') === false) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HARNESS(qs));
      return;
    }
  }
  const rel = url.replace(/^\//, '');
  const file = path.join(EXT, rel);
  if ((rel.startsWith('lib/') || rel.startsWith('content/') || rel.startsWith('options/')) && !rel.includes('..')) {
    if (fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(fs.readFileSync(file));
      return;
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});
server.listen(8123, '127.0.0.1', function () {
  console.log('harness: http://127.0.0.1:8123/{owner}/{repo}?lang=fa&theme=light');
});
