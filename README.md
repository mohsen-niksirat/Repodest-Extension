# 🧪 Repodest for GitHub

**Know a repo in seconds — right on the repo page.**
**هر ریپویی رو در چند ثانیه بشناس — همین‌جا توی صفحه.**

A Chrome extension (Manifest V3) that adds a sidebar to GitHub repository and **pull request** pages: health score, language breakdown, activity, **LLM-ready digests** you can paste straight into ChatGPT, Claude or Gemini, and an **PR X-Ray** risk report on every pull request.

> 100% client-side: no backend, no tracking, no accounts. Optional GitHub PAT raises your API rate limit from 60 to 5,000 calls/hour. Conditional (ETag) requests keep cached data fresh **without burning quota**.

---

## ✨ Features

| | |
|---|---|
| 🩺 **Health Score** | 10 weighted checks (license, README, tests, CI, docs, freshness…) distilled into one score, with an animated ring — on every repo page |
| 🔀 **PR X-Ray** *(v1.1)* | Open any pull request → risk score 0–10, weighted flags (auth, migrations, CI/CD, secrets…), change type, size class, test share, largest changes — plus a one-click **review digest** for your LLM |
| 🤖 **LLM Digest** | Pick files (or use smart presets 🐞 Bug Hunter / 🏗️ Architecture / 🛡️ Security Audit) → generate a prompt in Markdown, XML, JSON, `llms.txt` or Repomix format |
| 📤 **Send to LLM** *(v1.1)* | One click opens Claude / ChatGPT / Gemini with the digest already on your clipboard |
| ✂️ **Token Shrinker** | Strips comments & whitespace to save up to 40% context tokens |
| 🗜️ **Signatures Only** | Ultra-compact digests: function/class signatures without bodies |
| 📈 **Live token estimates** | Context-aware budgeting for GPT-5, Claude, Gemini and Llama with auto-splitting into parts |
| 📊 **Languages** | Byte-accurate breakdown with GitHub's own color palette |
| 🔀 **Activity** | 52-week commit heatmap, top contributors, recent commits |
| 🧹 **Code Smells** *(v1.2)* | Scans the files you digest for TODO/FIXME, console logging, `var`, loose equality, `eval()`, bare except, hardcoded IPs — with density per 1k lines |
| 🛡️ **Vulnerability Scan** *(v1.3)* | One click scans `package.json` / `requirements.txt` / `go.mod` / `Cargo.toml` against the free [OSV.dev](https://osv.dev) database — raw fetches, no API quota |
| 🔎 **Search Badges** *(v1.3)* | Health-score chips right inside GitHub's repository search results (needs a token) |
| 🌐 **Bilingual** | English & فارسی (RTL) — follows your browser language |
| 🌗 **Theme-aware** | Matches GitHub's light/dark mode automatically |
| ♿ **Accessible** *(v1.1)* | ARIA tabs with arrow-key navigation, dialog semantics, focus management |

## 🚀 Install (developer mode)

1. Download / clone this folder
2. Open `chrome://extensions`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** → select the `Repodest-Extension` folder
5. Open any GitHub repo or PR page — click the **Repodest button** on the left edge (or press **Alt+R**)

Also works in **Microsoft Edge** (`edge://extensions`, same steps).

### Firefox (beta)

A Firefox build ships in every GitHub Release (`repodest-extension-firefox-*.zip`):
about:debugging → This Firefox → **Load Temporary Add-on** → pick `manifest.json`.
Permanent install comes via [addons.mozilla.org](https://addons.mozilla.org/) once signed.

## 🔨 Build

```bash
node tools/build.mjs          # → dist/repodest-extension-<v>.zip + firefox variant
```

Zero dependencies — includes its own ZIP writer; the Firefox variant patches the
manifest (MV3 event page, gecko id, options_ui) automatically.

## 🔑 Optional: GitHub token

Without a token: 60 API calls/hour (per IP). With a free token: 5,000/hour.
Extension Options → paste a [personal access token](https://github.com/settings/tokens?type=beta) → **Test**.
No scopes needed for public repos. Stored only in your browser, sent only to `api.github.com`.

**Quota-friendly by design:** cached for 6h (repos) / 1h (activity & PRs), and expired entries are revalidated with `If-None-Match` — GitHub's `304` responses don't count against your rate limit.

**Search badges** appear on GitHub's repository search results when a token is configured (each result costs 2 API calls, cached 6h).

## 🛠️ Architecture

```
Repodest-Extension/
├── manifest.json              # MV3 — storage + activeTab + scripting only
├── lib/
│   ├── core.js                # pure engines, ported 1:1 from Repodest (health, PR risk, tree, shrinker)
│   ├── i18n.js                # EN / FA strings + localized relative time
│   ├── api.js                 # GitHub API layer, ETag revalidation, chrome.storage cache, optional PAT
│   └── digest.js              # digest engine: presets, 5 formats, signatures, context packing
├── content/
│   ├── sidebar.css.js         # Shadow-DOM styles (theme-aware, RTL)
│   └── content.js             # repo/PR page detection (Turbo-soft-nav aware) + sidebar UI
├── background/service-worker.js  # toolbar click / Alt+R → toggle sidebar · OSV.dev bridge
├── options/                   # settings page (PAT, language, theme, cache)
├── tests/                     # 99-test suite + local E2E harness
├── tools/build.mjs            # zero-dep packer: store zip + Firefox variant
└── .github/workflows/         # CI (tests on every push) + Release (zips on tag)
```

- **Zero build step** — plain JS, no bundler, no CDN (MV3 CSP-safe)
- **Shadow DOM** — GitHub's CSS can't touch the sidebar and vice versa
- **No host permissions** — GitHub's APIs send permissive CORS headers, so the extension needs none
- **Soft navigation aware** — listens to `turbo:load` / `turbo:render` / `popstate` + a title observer, so the sidebar follows you across GitHub's instant navigations

## 🧪 Tests

```bash
node tests/run-tests.js          # 99 assertions: health, digest × 5 formats, PR risk, smells, parsers, OSV client, cache, i18n
node tests/harness-server.js     # E2E harness → /{owner}/{repo}?lang=fa&theme=light · /search?type=repositories&pat=1
```

CI runs the suite on every push; tagging `v1.2.3` publishes **store-ready Chrome and Firefox zips** as a GitHub Release.

## 🔒 Privacy

- No analytics, no telemetry, no accounts
- API calls go to `api.github.com`, `raw.githubusercontent.com` and `api.osv.dev` (anonymous vulnerability scan) only
- Your token and cached data stay in `chrome.storage.local`
- Links: [Web version](https://mohsen-niksirat.github.io/repodest/) · [Telegram](https://t.me/mohsenniksirat) · [GitHub](https://github.com/mohsen-niksirat)

## 📄 License

MIT © Mohsen Niksirat
