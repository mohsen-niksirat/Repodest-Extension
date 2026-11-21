# Changelog

All notable changes to **Repodest for GitHub**. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.5.0] — 2026-11-21

Three practical additions on top of the shared Repodest engine — all
100% client-side, bilingual (EN/FA + RTL) and theme-aware.

### Added

- ⚔️ **Compare tab (Battle mode)** — pit the current repo against any other
  public repo (`owner/repo` or a GitHub URL, Enter to run). 11 metrics side
  by side — health, stars, forks, watchers, open issues, size, freshness,
  license, CI, tests, README — with per-metric winners and an overall
  verdict. Lower-is-better metrics (issues, size, days since push) are
  handled correctly; missing data shows as a tie, never a crash. If the
  other repo's tree needs a token, the four tree-based checks are marked
  unknown instead of failing.
- 🕘 **Recent repos** — the Health tab remembers the last 12 repos you
  analyzed as one-click chips with their health score (stored in
  `chrome.storage.local`, deduped case-insensitively, capped). A "Clear
  history" button wipes the list.
- 📋 **Copy health report** — one click copies a shareable Markdown report
  (score, 10-check table, repo facts, language breakdown, links) to the
  clipboard, ready to paste into issues, docs or chats.

### Tests

- 30 new assertions (**153 total**): compare engine (winners, ties,
  lower-is-better, null safety), recent-history helper (dedupe, cap,
  invalid entries), Markdown report builder, EN/FA string parity.
- Verified end-to-end in a real browser via the E2E harness: compare vs
  `facebook/react`, recent chips across soft navigation, report copy,
  Persian/RTL rendering.

## [1.4.0] — 2026-11-11

Performance and reliability pass on top of the shared Repodest engine.

### Performance

- Lazy boot: the sidebar mounts only on repository, pull-request and search
  pages; every other GitHub page pays just the route check.
- Settings are cached in memory for the session and invalidated through
  `chrome.storage.onChanged` — previously every API request re-read 11 keys.
- GitHub requests run in parallel: metadata + languages, the three activity
  endpoints, and PR metadata + the first files page. Repository load is two
  round trips instead of three.
- A single `chrome.storage` read returns both the fresh and the stale cache
  entry (was two reads per fetch); the cache self-prunes at 48 entries / 14
  days and orphaned ETags are removed.
- The file tree is indexed once (folder file lists, selectable files, parent
  links), so folder checkboxes are O(1) and large repos no longer recompute
  subtrees on every paint.
- Health score and selection sizes are computed once per load instead of on
  every render.
- Digests fetch eight files in parallel (was five); API calls have a 30-second
  timeout and raw file fetches a 20-second timeout.

### Fixed

- Force refresh no longer caches an empty language breakdown when GitHub
  answers `304 Not Modified`.
- Pull requests with more than 100 files are paginated up to 300, and
  truncated PRs show whole-PR additions/deletions instead of only the fetched
  files.
- Activity tab shows a real error with a retry button instead of spinning
  forever after a failed/`EMPTY` response.
- PR X-Ray retries itself (not the repository) after an error, and still works
  when the repository metadata request fails.
- Folder checkboxes in mixed folders (text + binary files) can now be
  unchecked; goal presets skip lockfiles and binary files.
- Code smells are scanned on raw text, so TODO/FIXME comments are detected
  even when the token shrinker strips comments from the digest.
- XML digests escape a literal `]]>` inside CDATA sections.
- Fixed double-encoded characters in the digest header/signature markers and
  in the E2E harness.
- Vulnerability scan covers `pyproject.toml` and `composer.json` as well, plus
  `~=` requirements, extras and optional dev dependencies.
- `chrome.storage` memory fallback supports `get(null)` (used by cache tools).
- Accessibility: the closed panel is `inert` (out of the tab order), file and
  folder checkboxes have labels, and the panel keeps `aria-hidden` in sync.

### Added

- Tests grew from 99 to 118 assertions (settings cache, pruning, PR
  pagination, new manifest parsers, raw-text smell scan, CDATA safety).
- The local harness serves `/owner/repo/pull/N` pages so PR X-Ray can be
  exercised without GitHub.
- CI now builds both store zips on every push.

## [1.3.0] — 2026-10

- OSV.dev dependency scan, search-result health badges, PAT-graceful
  degradation.

## [1.2.0] — 2026-09

- Code smell scan, Firefox build, zero-dependency packer.

## [1.1.0] — 2026-08

- PR X-Ray tab, send-to-LLM buttons, ETag quota saver, accessibility.

## [1.0.0] — 2026-08

- First release: health score, languages, activity, LLM digests, bilingual UI.
