# Repository Guidelines

## Project Structure & Module Organization
- `index.html`: Main page (hero, basics, by‑laws, scores, proposal CTAs).
- `proposals.html`: Review proposals from GitHub Issues (filters + badges).
- `style.css`: Global styles (theme vars in `:root`, responsive nav, components).
- `script.js`: Client logic (mobile nav, quotes rotation, ESPN scores, proposals fetch helper).
- `quotes.json`: 100 rotating hero subtitle quotes.
- Assets: `*.webp` preferred with PNG/JPEG fallbacks.
- Meta: `.github/ISSUE_TEMPLATE/proposal.md`, `.git/`, `CLAUDE.md`.

## Build, Test, and Development Commands
- Local preview: `python3 -m http.server 8080` then open `http://localhost:8080/index.html`.
- Alternative: `npx serve` (or any static HTTP server).
- No build step or dependencies; edit and refresh.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; wrap at ~100 chars where sensible.
- HTML: semantic tags; lowercase attributes; double quotes.
- CSS: use variables in `:root`; kebab-case class names; keep sections grouped (hero, rules, forms).
- JS: ES2017+; single quotes; end statements with semicolons; prefer `const`/`let`.
- Files: lowercase with hyphens (e.g., `loser-jersey.jpeg`).

## Testing Guidelines
- Manual checks in modern browsers (Chrome, Safari, Firefox, mobile).
- Console: ensure no errors; offline fallback for scores should render sample data.
- Accessibility: verify focus states, color contrast, and semantic headings.
- Performance: run Lighthouse in DevTools; avoid large images; use CSS for effects.

## Commit & Pull Request Guidelines
- Messages: present tense, concise; prefer Conventional Commits when possible (e.g., `feat: add NFL scores grid`, `fix: correct loser jersey filename`).
- PRs: include summary, before/after screenshots for UI, and any linked issues. Keep changes scoped; avoid unrelated refactors.
- Branches: short, hyphenated names (e.g., `codex/update-rules-copy`).

## Security & Configuration Tips
- No secrets in this repo. Client-only fetches must use public APIs (e.g., ESPN scoreboard); expect CORS failures and fallbacks.
- Keep third-party links (fonts/icons) pinned with integrity attributes when available.

## Deployment
- Hosting: GitHub Pages using branch-based deploys (no workflow file).
- Source: in GitHub Settings → Pages, set Source to “Deploy from a branch” (e.g., `main`, root).
- Publish: merging to `main` updates the site within a few minutes; check the Pages URL in Settings.
- Custom domain: add a `CNAME` file at repo root with your domain and configure a DNS CNAME to `<user>.github.io`.
- Cache busting: change asset filenames or append query strings (e.g., `style.css?v=2`).

## Proposals Workflow
- Submit via GitHub Issues: template labels new issues as `proposal`.
- Review in `proposals.html`: pulls issues (PRs excluded), shows status badges; closed and not `accepted` → treated as Rejected.
- Labels: use `accepted` to elevate, optional `rejected`.

## Editing Tips
- Quotes: edit `quotes.json`. Rotation and fade handled in `script.js` (respects reduced‑motion; shuffles per session).
- Theme: adjust colors in `:root`; hero subtitle styles under `#hero p` and `#subtitle`.
- Mobile nav: markup in both HTML files; behavior in `script.js` (hamburger toggle adds `nav.open`).
- ESPN scores: see `fetchNflScores`, `renderScores`, and `showScoresError` in `script.js`.
- Rules: edit By‑Laws list in `index.html` (jersey rule + image live here).

## Agent-Specific Notes
- Keep edits surgical; match existing style and structure.
- Do not add frameworks or bundlers. Prefer zero-dependency solutions.
- If adding assets, compress and name consistently; update references in `index.html`.
