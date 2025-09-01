# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static fantasy football league website for the "Hard Knockers" league. The site is designed for static hosting (GitHub Pages, Netlify) with all functionality implemented client-side using vanilla HTML, CSS, and JavaScript.

## Architecture

### Core Files
- `index.html` - Single-page application with all content sections
- `script.js` - Client-side logic for NFL scores, proposals, and Yahoo OAuth
- `style.css` - Ted Lasso-inspired styling with CSS custom properties
- Image assets: `hero-ted.png`, `group.jpg`, `loser-jersey.jpeg`

### Key Features
- **NFL Scores**: Fetches live scores from ESPN API with fallback to sample data
- **Rule Proposals**: Client-side form with localStorage persistence
- **Yahoo OAuth Integration**: Implicit OAuth flow for Yahoo Sports login
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox

## Data Management

All data is stored client-side using localStorage:
- `fantasyProposals` - Array of user-submitted rule proposals
- `yahooAccessToken` - OAuth token for Yahoo Sports integration

External API integrations:
- ESPN Scoreboard API for NFL scores
- Yahoo Sports API for league data (OAuth required)

## Design System

CSS custom properties in `:root`:
- `--primary-color: #003da5` (AFC Richmond blue)
- `--secondary-color: #002d62` (darker blue for panels)  
- `--accent-color: #ffc72c` (golden yellow)
- `--text-color: #ffffff` (white text)
- `--muted-text: #d4dceb` (light blue for descriptions)

## Development Workflow

This is a static site with no build process:
- Direct file editing for HTML/CSS/JS
- Live preview by opening `index.html` in browser
- No package managers or build tools required

## Content Structure

The site uses a single-page layout with these sections:
- Hero section with background image
- League Basics (buy-in, prizes, rules summary)
- By-Laws (detailed league rules)
- NFL Scores (live data from ESPN)
- Yahoo Sign In (OAuth integration)
- Propose a Rule (form with localStorage)

## Yahoo API Integration

The Yahoo OAuth flow requires:
1. Register app at developer.yahoo.com
2. Update `YOUR_CLIENT_ID` in script.js:139
3. Configure redirect URI to match site URL
4. Token is stored in localStorage after successful auth

## Styling Conventions

- Ted Lasso theme with AFC Richmond colors
- Font: Montserrat from Google Fonts
- Font Awesome icons for section headers
- Responsive breakpoints at 768px and 480px
- Cards use `--card-radius: 8px` and subtle shadows