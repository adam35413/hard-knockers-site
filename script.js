/*
 * Fantasy Football League client logic
 *
 * This script fetches recent NFL scores, handles rule proposal submissions
 * using localStorage, and updates dynamic elements like the current year. Data is kept
 * client‑side to support static hosting environments (e.g. GitHub Pages or Netlify).
 */

document.addEventListener('DOMContentLoaded', () => {
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
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    const format = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${format(
      lastWeek
    )}-${format(today)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NFL API error: ${res.status}`);
    const json = await res.json();
    const events = json.events || [];
    return events.map((ev) => {
      const comp = ev.competitions[0];
      const home = comp.competitors.find((c) => c.homeAway === 'home');
      const away = comp.competitors.find((c) => c.homeAway === 'away');
      return {
        home: home.team.displayName,
        homeScore: home.score,
        away: away.team.displayName,
        awayScore: away.score
      };
    });
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
   * Initialize NFL scores using ESPN data if possible, otherwise fall back to
   * the sample array above.
   */
  async function initScores() {
    try {
      const scores = await fetchNflScores();
      renderScores(scores);
    } catch (err) {
      console.error('Falling back to sample NFL scores:', err);
      renderScores(sampleScores);
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

  // Load scores and any saved proposals
  initScores();
  loadProposals();

  // Handle proposal submission
  const form = document.getElementById('proposal-form');
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

  // Set current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();
});
