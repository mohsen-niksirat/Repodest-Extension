# 🧪 Repodest for GitHub

**Know a repo in seconds — right on the repo page.**
**هر ریپویی رو در چند ثانیه بشناس — همین‌جا توی صفحه.**

A Chrome extension (Manifest V3) that adds a sidebar to every GitHub repository page: health score, language breakdown, activity, and an **LLM-ready digest** you can paste straight into ChatGPT, Claude or Gemini.

> 100% client-side: no backend, no tracking, no accounts. Optional GitHub PAT raises your API rate limit from 60 to 5,000 calls/hour.

---

## ✨ Features

| | |
|---|---|
| 🩺 **Health Score** | 10 weighted checks (license, README, tests, CI, docs, freshness…) distilled into one score, with an animated ring — on every repo page |
| 📊 **Languages** | Byte-accurate breakdown with GitHub's own color palette |
| 🤖 **LLM Digest** | Pick files (or use smart presets 🐞 Bug Hunter / 🏗️ Architecture / 🛡️ Security Audit) → generate a prompt in Markdown, XML, JSON, `llms.txt` or Repomix format |
| ✂️ **Token Shrinker** | Strips comments & whitespace to save up to 40% context tokens |
| 🗜️ **Signatures Only** | Ultra-compact digests: function/class signatures without bodies |
| 📈 **Live token estimates** | Context-aware budgeting for GPT-5, Claude, Gemini and Llama with auto-splitting into parts |
| 🔀 **Activity** | 52-week commit heatmap, top contributors, recent commits |
| 🌐 **Bilingual** | English & فارسی (RTL) — follows your browser language |
| 🌗 **Theme-aware** | Matches GitHub's light/dark mode automatically |

## 🚀 Install (developer mode)

1. Download / clone this folder
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `Repodest-Extension` folder
5. Open any GitHub repo page — click the **Repodest button** on the left edge (or press **Alt+R**)

## 🔑 Optional: GitHub token

Without a token: 60 API calls/hour (per IP). With a free token: 5,000/hour.
Extension Options → paste a [personal access token](https://github.com/settings/tokens?type=beta) → **Test**.
No scopes needed for public repos. Stored only in your browser, sent only to `api.github.com`.

## 🛠️ Architecture

```
Repodest-Extension/
├── manifest.json              # MV3 — storage + activeTab + scripting only
├── lib/
│   ├── core.js                # pure engines, ported 1:1 from Repodest (health checks, tree, shrinker)
│   ├── i18n.js                # EN / FA strings
│   ├── api.js                 # GitHub API layer, chrome.storage cache (6h/1h), optional PAT
│   └── digest.js              # digest engine: presets, 5 formats, signatures, context packing
├── content/
│   ├── sidebar.css.js         # Shadow-DOM styles (theme-aware, RTL)
│   └── content.js             # repo-page detection (Turbo-soft-nav aware) + sidebar UI
├── background/service-worker.js  # toolbar click / Alt+R → toggle sidebar
└── options/                   # settings page (PAT, language, theme, cache)
```

- **Zero build step** — plain JS, no bundler, no CDN (MV3 CSP-safe)
- **Shadow DOM** — GitHub's CSS can't touch the sidebar and vice versa
- **No host permissions** — GitHub's APIs send permissive CORS headers, so the extension needs none
- **Soft navigation aware** — listens to `turbo:load` / `turbo:render` / `popstate` + a title observer, so the button follows you across GitHub's instant navigations

## 🔒 Privacy

- No analytics, no telemetry, no accounts
- API calls go to `api.github.com` and `raw.githubusercontent.com` only
- Your token and cached data stay in `chrome.storage.local`
- Links: [Web version](https://mohsen-niksirat.github.io/repodest/) · [Telegram](https://t.me/mohsenniksirat) · [GitHub](https://github.com/mohsen-niksirat)

## 📄 License

MIT © Mohsen Niksirat
