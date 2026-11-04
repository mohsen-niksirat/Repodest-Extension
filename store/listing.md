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
| Version | 1.0.0 |
| Category | Developer Tools |
| Language | English (primary) + add Persian (fa) locale |
| Website | https://mohsen-niksirat.github.io/repodest/ |

## 2. Short description (≤132 chars)

**EN:**
```
Health score, languages, activity & LLM-ready digests for any GitHub repo — right on the page. 100% client-side, no tracking.
```
(125 chars ✓)

**FA:**
```
امتیاز سلامت، زبان‌ها، فعالیت و دایجست آمادهٔ LLM برای هر ریپوی گیت‌هاب — همین‌جا در صفحه. ۱۰۰٪ سمت کلاینت، بدون ردیابی.
```

## 3. Detailed description (EN)

```
Know a GitHub repo in seconds — right on the repo page.

Repodest adds a sidebar to every GitHub repository page:

🩺 HEALTH SCORE
10 weighted checks (license, README, tests, CI, docs, freshness…) distilled into one honest number with an animated ring.

🤖 LLM DIGEST (hero feature)
Select files — or use smart presets (🐞 Bug Hunter, 🏗️ Architecture, 🛡️ Security Audit) — and generate a prompt you can paste straight into ChatGPT, Claude or Gemini.
• Output formats: Markdown, XML, JSON, llms.txt, Repomix
• ✂️ Token Shrinker strips comments & whitespace (up to 40% saved)
• 🗜️ Signatures-only mode for ultra-compact digests
• Live token estimates for GPT-5, Claude, Gemini and Llama
• Auto-splitting when the selection exceeds the model's context window

📊 LANGUAGES
Byte-accurate language breakdown using GitHub's own color palette.

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
۱۰ بررسی وزن‌دار (مجوز، README، تست‌ها، CI، مستندات، تازگی…) در یک عدد صادقانه با حلقهٔ متحرک.

🤖 دایجست LLM (فیچر اصلی)
فایل‌ها را انتخاب کنید — یا از پریست‌های هوشمند (🐞 شکارچی باگ، 🏗️ معماری، 🛡️ ممیزی امنیت) استفاده کنید — و پرامپتی بسازید که مستقیم در ChatGPT، Claude یا Gemini پیست می‌شود.
• فرمت‌های خروجی: Markdown، XML، JSON، llms.txt، Repomix
• ✂️ کاهندهٔ توکن: حذف کامنت‌ها و فاصله‌های اضافی (تا ۴۰٪ صرفه‌جویی)
• 🗜️ حالت فقط-امضاها برای خلاصهٔ فوق فشرده
• تخمین زندهٔ توکن برای GPT-5، Claude، Gemini و Llama
• تقسیم خودکار وقتی انتخاب از پنجرهٔ زمینهٔ مدل بزرگ‌تر باشد

📊 زبان‌ها
تفکیک دقیق بر اساس بایت با پالت رنگی خود گیت‌هاب.

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
| Single purpose description | Adds an analysis sidebar (health score, languages, activity, LLM digest) to GitHub repository pages. |
| Permission: `storage` | Stores your settings, optional GitHub token, and a local 6-hour cache of repo data on your device. |
| Permission: `unlimitedStorage` | Large repositories can exceed the default local-storage quota; the cache needs room. |
| Permission: `activeTab` + `scripting` | Lets the toolbar button inject the sidebar into the current GitHub tab if it was opened before installation. |
| Host permissions | None. |
| Remote code | No — all code is bundled in the package. |
| Data usage | The extension does not collect, store (server-side), or transmit any personal data or website content. API calls go directly from your browser to api.github.com / raw.githubusercontent.com. |
| Data sold / transferred | No — never. |

## 6. Screenshot checklist / چک‌لیست اسکرین‌شات

Store screenshots: **1280×800** (or 640×400), JPG/PNG, up to 5. After installing, capture:

1. ☐ Health tab open on a well-known repo (dark theme) — hero shot
2. ☐ Digest tab with files selected + generated output visible
3. ☐ Health tab on a repo with a mid-range score (shows ✓/✗ mix)
4. ☐ Persian/RTL version (Settings → Language → فارسی)
5. ☐ Activity tab with the 52-week heatmap

Tip: open `chrome://extensions` → Repodest → Details → and use Windows `Win+Shift+S` on a maximized window at 100% zoom for crisp 1280×800 captures.

## 7. Pre-submission checklist

- [x] manifest.json valid MV3, version 1.0.0
- [x] No remote code, no CDN, no eval — CSP-safe
- [x] Icons 16/32/48/128 present
- [x] LICENSE (MIT) bundled
- [x] 47 automated tests pass (`extension-tests/run-tests.js`)
- [ ] One-time $5 developer registration fee
- [ ] Upload `repodest-extension-1.0.0.zip`
- [ ] Review typically takes 1–3 business days (no broad permissions → fast lane)
