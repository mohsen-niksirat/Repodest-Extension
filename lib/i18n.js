'use strict';
/* ============================================================
   Repodest Extension — i18n (EN / FA)
   Exposes: RPI18N
   ============================================================ */
const RPI18N = {
  en: {
    dir: 'ltr',
    extName: 'Repodest for GitHub',
    tagline: 'Know a repo in seconds — right on the page.',
    open: 'Open Repodest',
    close: 'Close',
    loading: 'Analyzing repository…',
    analyzingFiles: 'Fetching files…',
    error: 'Something went wrong',
    retry: 'Retry',
    notFound: 'Repository not found or private.',
    rateLimited: 'GitHub API rate limit reached (60/hour without a token). Add a free token in Settings for 5,000/hour.',
    openSettings: 'Open Settings',
    networkError: 'Network error — check your connection.',

    tabHealth: 'Health',
    tabDigest: 'Digest',
    tabActivity: 'Activity',

    healthScore: 'Health score',
    checks: 'Health checks',
    repoFacts: 'Repo facts',
    languages: 'Languages',
    excellent: 'Excellent shape',
    decent: 'Decent shape',
    needsLove: 'Needs love',
    needsCare: 'Needs serious care',
    stars: 'Stars',
    forks: 'Forks',
    watchers: 'Watchers',
    openIssues: 'Open issues',
    license: 'License',
    lastPush: 'Last push',
    size: 'Size',
    createdAt: 'Created',
    noLicense: 'None',
    topics: 'Topics',

    checkDescription: 'Description',
    checkTopics: 'Topics',
    checkLicense: 'License',
    checkReadme: 'README',
    checkGitignore: '.gitignore',
    checkCI: 'CI workflows',
    checkTests: 'Tests',
    checkDocs: 'Docs folder',
    checkContributing: 'Contributing guide',
    checkActive: 'Active (≤6 mo)',

    digestTitle: 'LLM Digest',
    digestHint: 'Pick files, generate a prompt, paste it into ChatGPT, Claude or Gemini.',
    preset: 'Preset',
    presetGeneral: 'General',
    presetReview: 'Code review',
    presetLearn: 'Learn codebase',
    presetMigrate: 'Migration',
    presetDocs: 'Docs writing',
    presetCustom: 'Custom',
    customPlaceholder: 'Custom instructions prepended to the digest…',
    goalPresets: 'Smart selection',
    goalBug: '🐞 Bug Hunter',
    goalArch: '🏗️ Architecture',
    goalSecurity: '🛡️ Security Audit',
    goalDocs: '📚 Docs',
    goalAll: '📄 All text files',
    goalClear: '✕ Clear',
    format: 'Format',
    model: 'Model',
    modelGpt5: 'GPT-5',
    modelClaude: 'Claude',
    modelGemini: 'Gemini',
    modelLlama: 'Llama',
    options: 'Options',
    optReadme: 'Include README',
    optTree: 'Include file tree',
    optShrink: '✂️ Token shrinker (strip comments)',
    optSig: '🗜️ Signatures only',
    files: 'Files',
    searchFiles: 'Search files…',
    treeTruncated: 'Tree truncated by GitHub (very large repo) — analysis covers the listed entries.',
    selectAllText: 'Select all text files',
    clearSelection: 'Clear',
    collapseAll: 'Collapse all',
    nFilesSelected: 'files selected',
    generate: 'Generate digest',
    generating: '⏳ {n}/{total} files…',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    noSelection: 'Select at least one file first.',
    selectionTooBig: 'Selection is over 3 MB — trim it down.',
    digestReady: 'Digest ready',
    digestParts: 'Digest split into {n} parts (context limit) — paste parts sequentially in one chat.',
    part: 'Part',
    tokens: '~{n} tokens',
    contextFit: 'Fits in {pct}% of context window ({ctx} tok)',
    prompt: 'prompt',
    selected: 'selected',
    filesSkipped: '{n} files skipped ({bin} binary, {big} too large)',

    smellTitle: 'Code smells',
    smellClean: 'No obvious smells found ✓',
    smellDensity: '{n} per 1k lines',

    activityTitle: 'Activity',
    commitActivity: 'Commit activity — last 52 weeks',
    topContributors: 'Top contributors',
    recentCommits: 'Recent commits',
    commits: 'commits',
    activityUnavailable: 'Commit stats are still being computed by GitHub — check back in a minute.',
    viewOnGithub: 'View on GitHub',

    prTab: 'PR X-Ray',
    prRisk: 'Risk',
    prLow: 'Low risk',
    prMedium: 'Medium risk',
    prHigh: 'High risk',
    prChangedFiles: 'Changed files',
    prAdditions: 'additions',
    prDeletions: 'deletions',
    prSize: 'Size',
    prType: 'Type',
    prTestShare: 'Test share',
    prCopyReview: 'Copy review digest',
    prReviewReady: 'Review digest copied — paste it into your LLM chat.',
    prNoRisks: 'No high-risk areas touched ✓',
    prTopFiles: 'Largest changes',
    prMoreFiles: '+{n} more files',
    prTruncated: 'Showing the first 100 changed files.',
    prBy: 'by',
    prLines: '{n} lines',

    apiLeft: 'API calls left',
    addToken: 'Add token',
    settings: 'Settings',
    webVersion: 'Web version',
    telegram: 'Telegram',
    github: 'GitHub',
    madeBy: 'Built by Mohsen Niksirat',
    noTracking: '100% client-side · no tracking',
    cached: 'cached',
    refreshed: 'refreshed',
    refresh: 'Refresh data'
  },

  fa: {
    dir: 'rtl',
    extName: 'رپودست برای گیت‌هاب',
    tagline: 'هر ریپویی رو در چند ثانیه بشناس — همین‌جا توی صفحه.',
    open: 'باز کردن رپودست',
    close: 'بستن',
    loading: 'در حال تحلیل مخزن…',
    analyzingFiles: 'در حال دریافت فایل‌ها…',
    error: 'مشکلی پیش آمد',
    retry: 'تلاش مجدد',
    notFound: 'مخزن پیدا نشد یا خصوصی است.',
    rateLimited: 'سقف درخواست API گیت‌هاب پر شد (بدون توکن ۶۰ در ساعت). یک توکن رایگان در تنظیمات اضافه کنید تا ۵٬۰۰۰ در ساعت شود.',
    openSettings: 'باز کردن تنظیمات',
    networkError: 'خطای شبکه — اتصال اینترنت را بررسی کنید.',

    tabHealth: 'سلامت',
    tabDigest: 'دایجست',
    tabActivity: 'فعالیت',

    healthScore: 'امتیاز سلامت',
    checks: 'بررسی‌های سلامت',
    repoFacts: 'مشخصات مخزن',
    languages: 'زبان‌ها',
    excellent: 'وضعیت عالی',
    decent: 'وضعیت قابل قبول',
    needsLove: 'نیاز به توجه دارد',
    needsCare: 'نیاز به توجه جدی دارد',
    stars: 'ستاره',
    forks: 'فورک',
    watchers: 'دنبال‌کننده',
    openIssues: 'ایشوهای باز',
    license: 'مجوز',
    lastPush: 'آخرین پوش',
    size: 'حجم',
    createdAt: 'ساخته شده',
    noLicense: 'بدون مجوز',
    topics: 'موضوعات',

    checkDescription: 'توضیحات',
    checkTopics: 'موضوعات',
    checkLicense: 'مجوز',
    checkReadme: 'README',
    checkGitignore: '.gitignore',
    checkCI: 'ورک‌فلوی CI',
    checkTests: 'تست‌ها',
    checkDocs: 'پوشه مستندات',
    checkContributing: 'راهنمای مشارکت',
    checkActive: 'فعال (≤۶ ماه)',

    digestTitle: 'دایجست LLM',
    digestHint: 'فایل‌ها را انتخاب کنید، پرامپت بسازید و در ChatGPT، Claude یا Gemini پیست کنید.',
    preset: 'پریست',
    presetGeneral: 'عمومی',
    presetReview: 'بازبینی کد',
    presetLearn: 'یادگیری کدبیس',
    presetMigrate: 'مهاجرت',
    presetDocs: 'نوشتن مستندات',
    presetCustom: 'سفارشی',
    customPlaceholder: 'دستورالعمل سفارشی که ابتدای دایجست قرار می‌گیرد…',
    goalPresets: 'انتخاب هوشمند',
    goalBug: '🐞 شکارچی باگ',
    goalArch: '🏗️ معماری',
    goalSecurity: '🛡️ ممیزی امنیت',
    goalDocs: '📚 مستندات',
    goalAll: '📄 همه فایل‌های متنی',
    goalClear: '✕ پاک‌کردن',
    format: 'فرمت',
    model: 'مدل',
    modelGpt5: 'GPT-5',
    modelClaude: 'Claude',
    modelGemini: 'Gemini',
    modelLlama: 'Llama',
    options: 'گزینه‌ها',
    optReadme: 'افزودن README',
    optTree: 'افزودن درخت فایل',
    optShrink: '✂️ کاهش توکن (حذف کامنت‌ها)',
    optSig: '🗜️ فقط امضاها',
    files: 'فایل‌ها',
    searchFiles: 'جستجوی فایل‌ها…',
    treeTruncated: 'درخت توسط گیت‌هاب کوتاه شده (ریپوی خیلی بزرگ) — تحلیل روی همین موارد اعمال می‌شود.',
    selectAllText: 'انتخاب همه فایل‌های متنی',
    clearSelection: 'پاک‌کردن',
    collapseAll: 'جمع‌کردن همه',
    nFilesSelected: 'فایل انتخاب شد',
    generate: 'ساخت دایجست',
    generating: '⏳ {n}/{total} فایل…',
    copy: 'کپی',
    copied: 'کپی شد!',
    download: 'دانلود',
    noSelection: 'حداقل یک فایل انتخاب کنید.',
    selectionTooBig: 'حجم انتخاب بیش از ۳ مگابایت است — کمترش کنید.',
    digestReady: 'دایجست آماده است',
    digestParts: 'دایجست به {n} بخش تقسیم شد (سقف کانتکست) — بخش‌ها را به‌ترتیب در یک چت پیست کنید.',
    part: 'بخش',
    tokens: 'حدود {n} توکن',
    contextFit: 'در {pct}% از پنجره زمینه جا می‌شود ({ctx} توکن)',
    prompt: 'پرامپت',
    selected: 'انتخاب‌شده',
    filesSkipped: '{n} فایل رد شد ({bin} باینری، {big} خیلی بزرگ)',

    smellTitle: 'بوی بد کد',
    smellClean: 'بوی بد واضحی پیدا نشد ✓',
    smellDensity: '{n} در هر هزار خط',

    activityTitle: 'فعالیت',
    commitActivity: 'فعالیت کامیت — ۵۲ هفته اخیر',
    topContributors: 'مشارکت‌کنندگان برتر',
    recentCommits: 'کامیت‌های اخیر',
    commits: 'کامیت',
    activityUnavailable: 'آمار کامیت هنوز توسط گیت‌هاب محاسبه می‌شود — چند دقیقه دیگر مراجعه کنید.',
    viewOnGithub: 'مشاهده در گیت‌هاب',

    prTab: 'اشعه ایکس PR',
    prRisk: 'ریسک',
    prLow: 'ریسک کم',
    prMedium: 'ریسک متوسط',
    prHigh: 'ریسک بالا',
    prChangedFiles: 'فایل‌های تغییرکرده',
    prAdditions: 'افزوده',
    prDeletions: 'حذف‌شده',
    prSize: 'اندازه',
    prType: 'نوع',
    prTestShare: 'سهم تست',
    prCopyReview: 'کپی دایجست بازبینی',
    prReviewReady: 'دایجست بازبینی کپی شد — در چت LLM پیست کنید.',
    prNoRisks: 'هیچ ناحیه پرخطری لمس نشده ✓',
    prTopFiles: 'بزرگ‌ترین تغییرها',
    prMoreFiles: '+{n} فایل دیگر',
    prTruncated: '۱۰۰ فایل اول نمایش داده می‌شود.',
    prBy: 'توسط',
    prLines: '{n} خط',

    apiLeft: 'درخواست باقی‌مانده',
    addToken: 'افزودن توکن',
    settings: 'تنظیمات',
    webVersion: 'نسخه وب',
    telegram: 'تلگرام',
    github: 'گیت‌هاب',
    madeBy: 'ساختهٔ محسن نیک‌سیرت',
    noTracking: '۱۰۰٪ سمت کلاینت · بدون ردیابی',
    cached: 'کش‌شده',
    refreshed: 'به‌روزرسانی شد',
    refresh: 'به‌روزرسانی داده‌ها'
  }
};

/* Resolve active locale: stored pref ('auto' default) or browser language */
RPI18N._lang = 'en';
RPI18N.detectLang = function (pref) {
  if (pref === 'en' || pref === 'fa') return pref;
  try {
    const n = (navigator.language || 'en').toLowerCase();
    return n.startsWith('fa') || n.startsWith('pes') || n.startsWith('prs') ? 'fa' : 'en';
  } catch (e) { return 'en'; }
};
RPI18N.init = function (pref) {
  RPI18N._lang = RPI18N.detectLang(pref);
};
RPI18N.t = function (key) {
  const dict = RPI18N[RPI18N._lang] || RPI18N.en;
  let s = dict[key] != null ? dict[key] : RPI18N.en[key];
  if (s == null) return key;
  if (arguments.length > 1) {
    const args = Array.prototype.slice.call(arguments, 1)[0] || {};
    s = s.replace(/\{(\w+)\}/g, function (_, k) { return args[k] != null ? args[k] : ''; });
  }
  return s;
};
RPI18N.isRTL = function () { return RPI18N._lang === 'fa'; };

/* localized relative time (core.js timeAgo is EN-only) */
RPI18N.timeAgo = function (iso) {
  const fa = RPI18N._lang === 'fa';
  if (!iso) return fa ? 'نامشخص' : 'unknown';
  const d = (Date.now() - new Date(iso)) / 864e5;
  if (isNaN(d)) return fa ? 'نامشخص' : 'unknown';
  const faNum = function (n) { return String(n).replace(/[0-9]/g, function (c) { return '۰۱۲۳۴۵۶۷۸۹'[Number(c)]; }); };
  if (d < 1) return fa ? 'امروز' : 'today';
  if (d < 2) return fa ? 'دیروز' : 'yesterday';
  if (d < 30) { const n = Math.floor(d); return fa ? faNum(n) + ' روز پیش' : n + 'd ago'; }
  if (d < 365) { const n = Math.max(1, Math.floor(d / 30)); return fa ? faNum(n) + ' ماه پیش' : n + 'mo ago'; }
  const n = Math.floor(d / 365); return fa ? faNum(n) + ' سال پیش' : n + 'y ago';
};
