'use strict';
/* ============================================================
   Repodest for GitHub — options page logic
   Uses RPApi from ../lib/api.js
   ============================================================ */
const OPT_I18N = {
  en: {
    patTitle: 'GitHub token (optional)', patDesc: 'Without a token you get 60 GitHub API calls per hour. A free personal access token raises that to 5,000/hour. The token is stored only in your browser and is sent only to api.github.com.',
    test: 'Test', createToken: 'Create a token →', tokenScope: 'No extra scopes needed for public repos (classic: no scopes / fine-grained: public repositories, read-only).',
    prefsTitle: 'Preferences', language: 'Language', theme: 'Theme', themeAuto: 'Auto (follow GitHub)', themeDark: 'Dark', themeLight: 'Light',
    cacheTitle: 'Cache', cacheDesc: 'Repository data is cached locally for 6 hours (activity for 1 hour) to save API calls. Nothing ever leaves your browser.',
    clearCache: 'Clear cache', cacheInfo: '{n} entries · {size}', cleared: 'Cache cleared',
    moreTitle: 'More', webVersion: 'Web version', webDesc: 'No install needed — paste any repo URL', telegram: 'Telegram', tgDesc: 'New projects & updates',
    github: 'GitHub', ghDesc: 'Source & other projects', madeBy: 'Built by Mohsen Niksirat', noTracking: '100% client-side, no tracking',
    okAuth: '✓ Token works — {login} · {n} calls/hour', okAnon: '✓ No token — anonymous, {n} calls/hour', badToken: '✗ Token rejected ({code})',
    testing: 'Testing…', saved: 'Saved'
  },
  fa: {
    patTitle: 'توکن گیت‌هاب (اختیاری)', patDesc: 'بدون توکن ۶۰ درخواست API در ساعت دارید. یک توکن رایگان این سقف را به ۵٬۰۰۰ در ساعت می‌رساند. توکن فقط در مرورگر شما ذخیره می‌شود و فقط به api.github.com ارسال می‌گردد.',
    test: 'تست', createToken: 'ساخت توکن ←', tokenScope: 'برای مخازن عمومی به اسکوپ اضافی نیاز نیست (کلاسیک: بدون اسکوپ / fine-grained: مخازن عمومی، فقط-خواندنی).',
    prefsTitle: 'تنظیمات', language: 'زبان', theme: 'تم', themeAuto: 'خودکار (مطابق گیت‌هاب)', themeDark: 'تاریک', themeLight: 'روشن',
    cacheTitle: 'کش', cacheDesc: 'داده مخازن به‌صورت محلی ۶ ساعت (فعالیت ۱ ساعت) کش می‌شود تا درخواست API صرفه‌جویی شود. هیچ داده‌ای از مرورگر شما خارج نمی‌شود.',
    clearCache: 'پاک‌کردن کش', cacheInfo: '{n} مورد · {size}', cleared: 'کش پاک شد',
    moreTitle: 'بیشتر', webVersion: 'نسخه وب', webDesc: 'بدون نصب — فقط URL ریپو را پیست کنید', telegram: 'تلگرام', tgDesc: 'پروژه‌ها و به‌روزرسانی‌های جدید',
    github: 'گیت‌هاب', ghDesc: 'سورس و پروژه‌های دیگر', madeBy: 'ساختهٔ محسن نیک‌سیرت', noTracking: '۱۰۰٪ سمت کلاینت، بدون ردیابی',
    okAuth: '✓ توکن کار می‌کند — {login} · {n} درخواست/ساعت', okAnon: '✓ بدون توکن — ناشناس، {n} درخواست/ساعت', badToken: '✗ توکن رد شد ({code})',
    testing: 'در حال تست…', saved: 'ذخیره شد'
  }
};
let OPT_LANG = 'en';
function T(key, args) {
  let s = (OPT_I18N[OPT_LANG] && OPT_I18N[OPT_LANG][key]) != null ? OPT_I18N[OPT_LANG][key] : OPT_I18N.en[key];
  if (s == null) return key;
  if (args) s = s.replace(/\{(\w+)\}/g, function (_, k) { return args[k] != null ? args[k] : ''; });
  return s;
}
function fmtSize(b) {
  b = Number(b) || 0;
  if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
  if (b >= 1024) return (b / 1024).toFixed(1) + ' KB';
  return b + ' B';
}

function applyI18n() {
  document.documentElement.lang = OPT_LANG;
  document.documentElement.dir = OPT_LANG === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = T(el.dataset.i18n);
  });
}

async function refreshCacheInfo() {
  const el = document.getElementById('cacheInfo');
  const info = await RPApi.cacheSize();
  el.textContent = T('cacheInfo', { n: info.entries, size: fmtSize(info.bytes) });
}

let saveTimer = null;
function saveSettings(patch) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async function () {
    await RPApi.setSettings(patch);
  }, 250);
}

async function testPat() {
  const btn = document.getElementById('testPat');
  const st = document.getElementById('patStatus');
  btn.disabled = true;
  st.hidden = false;
  st.className = 'status';
  st.textContent = T('testing');
  /* ensure the latest typed value is saved before probing */
  await RPApi.setSettings({ pat: document.getElementById('pat').value.trim() });
  const r = await RPApi.probeToken();
  btn.disabled = false;
  if (r.login) {
    st.className = 'status ok';
    st.textContent = T('okAuth', { login: r.login, n: fmtNum(r.limit) });
  } else if (r.error && r.error !== 'RATE_LIMIT') {
    st.className = 'status bad';
    st.textContent = T('badToken', { code: r.error });
  } else {
    st.className = 'status ok';
    st.textContent = T('okAnon', { n: fmtNum(r.limit || 60) });
  }
}
function fmtNum(n) { n = Number(n) || 0; return n >= 1000 ? (n / 1000).toFixed(0) + 'k' : String(n); }

(async function init() {
  try { const v = document.querySelector('.ver'); if (v && chrome.runtime && chrome.runtime.getManifest) v.textContent = 'v' + chrome.runtime.getManifest().version; } catch (e) {}
  const s = await RPApi.getSettings();
  OPT_LANG = (s.lang === 'fa' || s.lang === 'en') ? s.lang : ((navigator.language || 'en').toLowerCase().startsWith('fa') ? 'fa' : 'en');
  applyI18n();

  document.getElementById('pat').value = s.pat || '';
  document.getElementById('lang').value = s.lang;
  document.getElementById('theme').value = s.theme;

  document.getElementById('pat').addEventListener('input', function (e) {
    saveSettings({ pat: e.target.value.trim() });
  });
  document.getElementById('testPat').addEventListener('click', testPat);
  document.getElementById('lang').addEventListener('change', async function (e) {
    await RPApi.setSettings({ lang: e.target.value });
    OPT_LANG = (e.target.value === 'fa' || e.target.value === 'en')
      ? e.target.value
      : ((navigator.language || 'en').toLowerCase().startsWith('fa') ? 'fa' : 'en');
    applyI18n();
  });
  document.getElementById('theme').addEventListener('change', function (e) {
    saveSettings({ theme: e.target.value });
  });
  document.getElementById('clearCache').addEventListener('click', async function () {
    await RPApi.clearCache();
    await refreshCacheInfo();
    const st = document.getElementById('patStatus');
    st.hidden = false; st.className = 'status ok'; st.textContent = T('cleared');
  });

  await refreshCacheInfo();
})();
