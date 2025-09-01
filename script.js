/*
 * Fantasy Football League client logic
 *
 * This script fetches recent NFL scores, handles rule proposal submissions
 * using localStorage, and updates dynamic elements like the current year. Data is kept
 * client‑side to support static hosting environments (e.g. GitHub Pages or Netlify).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const nav = document.querySelector('nav');
  const navToggle = document.querySelector('.nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Toggle navigation');
    });
    document.querySelectorAll('nav .nav-links a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      })
    );
  }
  // Sample NFL scores used when the API is not available.
  const sampleScores = [
    { away: 'Cowboys', awayScore: 21, home: 'Eagles', homeScore: 24 },
    { away: 'Patriots', awayScore: 17, home: 'Dolphins', homeScore: 20 },
    { away: 'Packers', awayScore: 27, home: 'Bears', homeScore: 23 },
    { away: 'Giants', awayScore: 14, home: 'Commanders', homeScore: 18 },
    { away: '49ers', awayScore: 30, home: 'Seahawks', homeScore: 28 }
  ];

  /**
   * Fetch NFL scores for the past week from ESPN's public scoreboard API.
   * Falls back to sample data if the request fails.
   *
   * @returns {Promise<Array>} resolved with an array of score objects
   */
  async function fetchNflScores() {
    // ESPN's scoreboard often expects a single date; try today then walk back up to 7 days.
    const format = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const toScores = (events) =>
      events.map((ev) => {
        const comp = ev.competitions?.[0];
        const home = comp?.competitors?.find((c) => c.homeAway === 'home');
        const away = comp?.competitors?.find((c) => c.homeAway === 'away');
        return (
          home && away && {
            home: home.team.displayName,
            homeScore: home.score,
            away: away.team.displayName,
            awayScore: away.score
          }
        );
      }).filter(Boolean);

    const today = new Date();
    for (let offset = 0; offset <= 7; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() - offset);
      const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${format(d)}`;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const json = await res.json();
        const events = json.events || [];
        if (events.length > 0) {
          const parsed = toScores(events);
          if (parsed.length > 0) return parsed;
        }
      } catch (e) {
        // Try the next day back on network/CORS failure.
        continue;
      }
    }
    // No events found in the last week.
    return [];
  }

  /**
   * Render NFL scores into the scores list.
   * @param {Array} scoresArr
   */
  function renderScores(scoresArr) {
    const list = document.getElementById('scores-list');
    list.innerHTML = '';
    scoresArr.forEach((game) => {
      const div = document.createElement('div');
      div.classList.add('score-card');
      div.innerHTML = `
        <span class="team away">${game.away} <strong>${game.awayScore}</strong></span>
        <span class="team home"><strong>${game.homeScore}</strong> ${game.home}</span>
      `;
      list.appendChild(div);
    });
  }

  /**
   * Show a fantasy-themed error notice in the scores area.
   * @param {string} message
   */
  function showScoresError(message) {
    const list = document.getElementById('scores-list');
    const notice = document.createElement('div');
    notice.className = 'score-error';
    notice.textContent = message;
    // Prepend so it appears above any fallback content
    list.innerHTML = '';
    list.appendChild(notice);
  }

  /**
   * Initialize NFL scores using ESPN data if possible, otherwise fall back to
   * the sample array above.
   */
  async function initScores() {
    try {
      const scores = await fetchNflScores();
      if (!scores || scores.length === 0) {
        console.warn('No recent ESPN scores found; showing message only.');
        showScoresError("The live scoreboard got benched this week — try again soon.");
      } else {
        renderScores(scores);
      }
    } catch (err) {
      console.error('ESPN scores fetch failed:', err);
      showScoresError("We couldn’t pick up the ESPN play-by-play — please try again later.");
    }
  }

  /**
   * Load proposals from localStorage and render them on the page.
   */
  function loadProposals() {
    const listContainer = document.getElementById('proposals-list');
    listContainer.innerHTML = '';
    const saved = JSON.parse(localStorage.getItem('fantasyProposals') || '[]');
    saved.forEach((item) => {
      const wrapper = document.createElement('div');
      wrapper.classList.add('proposal-item');
      const nameEl = document.createElement('h4');
      nameEl.textContent = item.name;
      const proposalEl = document.createElement('p');
      proposalEl.textContent = item.proposal;
      wrapper.appendChild(nameEl);
      wrapper.appendChild(proposalEl);
      listContainer.appendChild(wrapper);
    });
  }

  /**
   * Save a new proposal to localStorage and update the list.
   * @param {string} name – The author of the proposal.
   * @param {string} proposal – The suggestion text.
   */
  function addProposal(name, proposal) {
    const existing = JSON.parse(localStorage.getItem('fantasyProposals') || '[]');
    existing.unshift({ name, proposal, date: new Date().toISOString() });
    localStorage.setItem('fantasyProposals', JSON.stringify(existing));
    loadProposals();
  }

  // Load scores and any saved proposals (if present on page)
  initScores();
  if (document.getElementById('proposals-list')) {
    loadProposals();
  }

  // Handle proposal submission
  const form = document.getElementById('proposal-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('name');
      const proposalInput = document.getElementById('proposal');
      const name = nameInput.value.trim();
      const proposalText = proposalInput.value.trim();
      if (!name || !proposalText) return;
      addProposal(name, proposalText);
      // Clear the form
      nameInput.value = '';
      proposalInput.value = '';
    });
  }

  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
});
