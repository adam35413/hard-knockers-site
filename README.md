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
