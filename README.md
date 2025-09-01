# Hard Knockers Fantasy Football Site

A simple, static website for the Hard Knockers Fantasy Football League. Built with plain HTML/CSS/JS and hosted on GitHub Pages.

## Live Site
- https://adam35413.github.io/hard-knockers-site

## Local Development
- Serve locally (any static server works):
  - `python3 -m http.server 8080`
  - Open `http://localhost:8080/`
- Files:
  - `index.html` — main page (rules, scores, proposals entry)
  - `proposals.html` — review proposals from GitHub Issues
  - `style.css`, `script.js`, images (`.png/.jpg/.webp`)

## Proposals Workflow
- Submit a rule: opens a prefilled GitHub Issue (label: `proposal`).
- Review proposals: `proposals.html` lists issues and shows status (Open/Accepted/Rejected).

## Notes
- ESPN scores fetch is best-effort and may fall back to a message if unavailable.
- Images use WebP with JPEG/PNG fallbacks for performance.

## Editing Guide
- Quotes: update `quotes.json` (hero subtitle rotates every 8s, with fade and per‑session shuffle).
- Theme: tweak colors in `style.css` `:root`; subtitle legibility in `#hero p` and `#subtitle`.
- Mobile navigation: HTML structure in `index.html`/`proposals.html` (`.nav-toggle`, `.nav-links`), behavior in `script.js` (`nav.open`).
- ESPN scores: logic in `script.js` (`fetchNflScores`, `showScoresError`, `renderScores`).
- Rules and copy: edit By‑Laws and Basics in `index.html` (loser jersey rule + image under By‑Laws).
- Proposals review: client loads Issues via GitHub API (issues only; PRs excluded). Labels `accepted`/`rejected` control badges.
- Cache busting: append query strings to CSS/JS when needed (e.g., `style.css?v=YYYYMMDD`).
