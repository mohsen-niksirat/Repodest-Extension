# Chrome Web Store — Listing Package
# بستهٔ انتشار Chrome Web Store

Everything below is ready to copy-paste into the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
همهٔ موارد زیر برای کپی مستقیم در داشبورد توسعه‌دهنده آماده است.

---

## 1. Identity / شناسه

| Field | Value |
|---|---|
| Name (EN) | Repodest for GitHub — Health & LLM Digest |
| Name (FA locale) | رپودست برای گیت‌هاب — سلامت و دایجست LLM |
| Version | 1.4.0 |
| Category | Developer Tools |
| Language | English (primary) + add Persian (fa) locale |
| Website | https://mohsen-niksirat.github.io/repodest/ |

## 2. Short description (≤132 chars)

**EN:**
```
Health score, PR risk, vulnerability scan & LLM digests for any GitHub repo or PR — right on the page. No tracking.
```
(115 chars ✓)

**FA:**
```
امتیاز سلامت، ریسک PR، اسکن آسیب‌پذیری و دایجست آمادهٔ LLM برای هر ریپوی گیت‌هاب — همین‌جا در صفحه. بدون ردیابی.
```

## 3. Detailed description (EN)

```
Know a GitHub repo in seconds — right on the repo page.

Repodest adds a sidebar to every GitHub repository page:

🩺 HEALTH SCORE
10 weighted checks (license, README, tests, CI, docs, freshness…) distilled into one honest number with a score ring.

🔀 PR X-RAY
Open any pull request → risk score 0–10, weighted flags (auth, migrations, CI/CD, secrets…), change type, size class, test share — plus a one-click review digest for your LLM.

🤖 LLM DIGEST (hero feature)
Select files — or use smart presets (🐞 Bug Hunter, 🏗️ Architecture, 🛡️ Security Audit) — and generate a prompt you can paste straight into ChatGPT, Claude or Gemini.
• Output formats: Markdown, XML, JSON, llms.txt, Repomix
• ✂️ Token Shrinker strips comments & whitespace (up to 40% saved)
• 🗜️ Signatures-only mode for ultra-compact digests
• Live token estimates for GPT-5, Claude, Gemini and Llama
• Auto-splitting when the selection exceeds the model's context window
• 📤 Send-to-LLM buttons: opens Claude / ChatGPT / Gemini with the digest on your clipboard

📊 LANGUAGES
Byte-accurate language breakdown using GitHub's own color palette.

🛡️ VULNERABILITY SCAN
One click scans the repo's package.json / requirements.txt / pyproject.toml / composer.json / go.mod / Cargo.toml against the free OSV.dev database, with direct links to every advisory.

⚔️ COMPARE — BATTLE MODE (v1.5)
Pit the repo you're viewing against any other public repo (owner/repo or a GitHub URL). 11 metrics side by side — health, stars, forks, watchers, open issues, size, freshness, license, CI, tests, README — with per-metric winners and an overall verdict.

🕘 RECENT REPOS (v1.5)
The Health tab remembers the last repos you analyzed as one-click chips with their health scores. Stored only in your browser; clear anytime.

📋 COPY HEALTH REPORT (v1.5)
One click copies a clean Markdown report — score, 10-check table, repo facts and language breakdown — ready to paste into issues, docs or chats.

🔎 SEARCH BADGES
Health-score chips right inside GitHub's repository search results (enable by adding a token in Settings).

🧹 CODE SMELLS
The files you digest are scanned for TODO/FIXME markers, console logging, var usage, loose equality, eval(), bare except and hardcoded IPs — with a density score per 1k lines.

💾 QUOTA-FRIENDLY
6h/1h caching plus conditional (ETag) revalidation — GitHub's 304 responses don't count against your rate limit.

⚡ FAST BY DESIGN (v1.4)
Lazy boot on repo pages only, one settings read per session, parallel GitHub requests, a pre-indexed file tree and 8-way file fetching — the sidebar no longer slows GitHub down.

📈 ACTIVITY
52-week commit heatmap, recent commits and contributor stats.

🌐 BILINGUAL
English & Persian (RTL) — follows your browser language.
🌗 THEME-AWARE — matches GitHub's light/dark mode automatically.
⌨️ Alt+R or the edge button toggles the sidebar.

🔒 PRIVACY
100% client-side. No backend, no accounts, no analytics, no tracking. Your optional GitHub token stays in your browser and is sent only to api.github.com.

Free, open source (MIT). Part of the Repodest family:
• Web version: https://mohsen-niksirat.github.io/repodest/
• Source: https://github.com/mohsen-niksirat
```

## 4. Detailed description (FA)

```
هر ریپوی گیت‌هاب را در چند ثانیه بشناسید — همین‌جا، روی خود صفحه.

رپودست به هر صفحهٔ مخزن گیت‌هاب یک سایدبار اضافه می‌کند:

🩺 امتیاز سلامت
۱۰ بررسی وزن‌دار (مجوز، README، تست‌ها، CI، مستندات، تازگی…) در یک عدد صادقانه با حلقهٔ امتیاز.

🔀 اشعه ایکس PR
هر پول‌ریکوئست را باز کنید → امتیاز ریسک ۰–۱۰، پرچم‌های وزن‌دار (احراز هویت، مایگریشن، CI/CD، اسرار…)، نوع تغییر، کلاس اندازه، سهم تست — به‌همراه دایجست بازبینی یک‌کلیکی برای LLM شما.

🤖 دایجست LLM (فیچر اصلی)
فایل‌ها را انتخاب کنید — یا از پریست‌های هوشمند (🐞 شکارچی باگ، 🏗️ معماری، 🛡️ ممیزی امنیت) استفاده کنید — و پرامپتی بسازید که مستقیم در ChatGPT، Claude یا Gemini پیست می‌شود.
• فرمت‌های خروجی: Markdown، XML، JSON، llms.txt، Repomix
• ✂️ کاهندهٔ توکن: حذف کامنت‌ها و فاصله‌های اضافی (تا ۴۰٪ صرفه‌جویی)
• 🗜️ حالت فقط-امضاها برای خلاصهٔ فوق فشرده
• تخمین زندهٔ توکن برای GPT-5، Claude، Gemini و Llama
• تقسیم خودکار وقتی انتخاب از پنجرهٔ زمینهٔ مدل بزرگ‌تر باشد
• 📤 دکمه‌های ارسال به LLM: با یک کلیک Claude / ChatGPT / Gemini باز می‌شود و دایجست روی کلیپ‌بورد است

🛡️ اسکن آسیب‌پذیری
با یک کلیک، package.json / requirements.txt / pyproject.toml / composer.json / go.mod / Cargo.toml مخزن در برابر پایگاه رایگان OSV.dev اسکن می‌شود، با لینک مستقیم به هر هشدار.

⚔️ مقایسه — حالت بتل (v1.5)
ریپوی در حال مشاهده را با هر ریپوی عمومی دیگری (owner/repo یا لینک گیت‌هاب) مقایسه کنید. ۱۱ سنجه کنار هم — سلامت، ستاره، فورک، دنبال‌کننده، ایشوهای باز، حجم، تازگی، مجوز، CI، تست، README — با برندهٔ هر سنجه و نتیجهٔ کلی.

🕘 ریپوهای اخیر (v1.5)
تب سلامت آخرین ریپوهای بررسی‌شده را به‌صورت چیپ‌های یک‌کلیکی با امتیاز سلامت به خاطر می‌سپارد. فقط در مرورگر شما ذخیره می‌شود؛ هر وقت خواستید پاک کنید.

📋 کپی گزارش سلامت (v1.5)
با یک کلیک یک گزارش Markdown تمیز — امتیاز، جدول ۱۰ بررسی، مشخصات ریپو و تفکیک زبان‌ها — کپی می‌شود، آمادهٔ پیست در ایشوها، مستندات یا چت‌ها.

🔎 نشان‌های جستجو
چیپ امتیاز سلامت در همین نتایج جستجوی مخازن گیت‌هاب (با افزودن توکن در تنظیمات فعال می‌شود).

🧹 بوی بد کد
فایل‌های انتخابی برای دایجست از نظر TODO/FIXME، console.log، var، برابری سست، eval()، except بدون نوع و IP هاردکد اسکن می‌شوند — با امتیاز تراکم در هر هزار خط.

💾 صرفه‌جویی در سهمیه
کش ۶/۱ ساعته به‌همراه اعتبارسنجی شرطی (ETag) — پاسخ‌های ۳۰۴ گیت‌هاب از سهمیه شما کم نمی‌کنند.

⚡ سریع به‌صورت پیش‌فرض (v1.4)
راه‌اندازی تنبل فقط در صفحات مخزن، یک بار خواندن تنظیمات در هر نشست، درخواست‌های موازی گیت‌هاب، درخت فایل از پیش ایندکس‌شده و دریافت ۸ فایل هم‌زمان — سایدبار دیگر گیت‌هاب را کند نمی‌کند.

📈 فعالیت
نقشهٔ حرارتی ۵۲ هفتهٔ کامیت‌ها، کامیت‌های اخیر و آمار مشارکت‌کنندگان.

🌐 دوزبانه
انگلیسی و فارسی (RTL) — بر اساس زبان مرورگر شما.
🌗 هماهنگ با تم — روشن/تاریک گیت‌هاب را خودکار دنبال می‌کند.
⌨️ Alt+R یا دکمهٔ لبهٔ صفحه سایدبار را باز می‌کند.

🔒 حریم خصوصی
۱۰۰٪ سمت کلاینت. بدون سرور، بدون حساب، بدون آنالیتیکس، بدون ردیابی. توکن اختیاری گیت‌هاب فقط در مرورگر شما می‌ماند و فقط به api.github.com ارسال می‌شود.

رایگان و متن‌باز (MIT). از خانوادهٔ رپودست:
• نسخهٔ وب: https://mohsen-niksirat.github.io/repodest/
• سورس: https://github.com/mohsen-niksirat
```

## 5. Privacy tab answers / پاسخ‌های تب Privacy

| Question | Answer |
|---|---|
| Single purpose description | Adds an analysis sidebar (repo health, languages, activity, LLM digest, pull-request risk report) to GitHub repository and pull-request pages. |
| Permission: `storage` | Stores your settings, optional GitHub token, and a local 6-hour cache of repo data on your device. |
| Permission: `unlimitedStorage` | Large repositories can exceed the default local-storage quota; the cache needs room. |
| Permission: `activeTab` + `scripting` | Lets the toolbar button inject the sidebar into the current GitHub tab if it was opened before installation. |
| Host permissions | None. |
| Remote code | No — all code is bundled in the package. |
| Data usage | The extension does not collect, store (server-side), or transmit any personal data or website content. API calls go directly from your browser to api.github.com / raw.githubusercontent.com / api.osv.dev (anonymous vulnerability scan). |
| Data sold / transferred | No — never. |

## 6. Screenshot checklist / چک‌لیست اسکرین‌شات

Store screenshots: **1280×800** (or 640×400), JPG/PNG, up to 5. After installing, capture:

1. ☐ Health tab open on a well-known repo (dark theme) — hero shot
2. ☐ PR X-Ray tab on a real pull request (risk flags visible)
3. ☐ Digest tab with files selected + generated output + Send-to-LLM buttons
4. ☐ Health tab on a repo with a mid-range score (shows ✓/✗ mix)
5. ☐ Persian/RTL version (Settings → Language → فارسی)

Tip: open `chrome://extensions` → Repodest → Details → and use Windows `Win+Shift+S` on a maximized window at 100% zoom for crisp 1280×800 captures.

## 7. Pre-submission checklist

- [x] manifest.json valid MV3, version 1.5.0
- [x] No remote code, no CDN, no eval — CSP-safe
- [x] Icons 16/32/48/128 present
- [x] LICENSE (MIT) bundled
- [x] 153+ automated tests pass (`tests/run-tests.js`)
- [ ] One-time $5 developer registration fee
- [ ] Upload `repodest-extension-1.5.0.zip`
- [ ] Review typically takes 1–3 business days (no broad permissions → fast lane)
