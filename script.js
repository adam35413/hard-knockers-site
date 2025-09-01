/*
 * Fantasy Football League client logic
 *
 * This script populates the standings table from a simple array, handles rule proposal submissions
 * using localStorage, and updates dynamic elements like the current year. Data is kept
 * client‑side to support static hosting environments (e.g. GitHub Pages or Netlify).  
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sample standings data used when the Yahoo API is not available.
  const sampleStandings = [
    { team: 'Gridiron Gurus', wins: 10, losses: 3, pointsFor: 1550, pointsAgainst: 1300 },
    { team: 'Pigskin Wizards', wins: 9, losses: 4, pointsFor: 1487, pointsAgainst: 1321 },
    { team: 'End Zone Enforcers', wins: 8, losses: 5, pointsFor: 1422, pointsAgainst: 1360 },
    { team: 'Monday Night Maniacs', wins: 8, losses: 5, pointsFor: 1408, pointsAgainst: 1345 },
    { team: 'Touchdown Titans', wins: 7, losses: 6, pointsFor: 1380, pointsAgainst: 1395 },
    { team: 'Hail Mary Heroes', wins: 6, losses: 7, pointsFor: 1295, pointsAgainst: 1421 },
    { team: 'Fourth & Longshots', wins: 5, losses: 8, pointsFor: 1258, pointsAgainst: 1430 },
    { team: 'Draft Day Darlings', wins: 4, losses: 9, pointsFor: 1194, pointsAgainst: 1442 },
    { team: 'Blitz Brigade', wins: 3, losses: 10, pointsFor: 1102, pointsAgainst: 1504 },
    { team: 'Bye Week Bums', wins: 3, losses: 10, pointsFor: 1099, pointsAgainst: 1520 }
  ];

  /**
   * Parse an OAuth access token from the URL fragment if present and store it
   * in localStorage. This supports Yahoo's implicit OAuth 2.0 flow.
   */
  function handleOAuthRedirect() {
    if (window.location.hash.includes('access_token')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        localStorage.setItem('yahooAccessToken', token);
        // Remove the fragment so it doesn't clutter bookmarks/refreshes
        history.replaceState(null, '', window.location.pathname);
      }
    }
  }

  /**
   * Fetch standings from Yahoo Fantasy Sports API.
   *
   * The user must provide a league key and Yahoo OAuth client ID below. After
   * authorizing with Yahoo the access token is stored in localStorage under the
   * key `yahooAccessToken`.
   *
   * @returns {Promise<Array>} resolved with an array of team objects
   */
  async function fetchYahooStandings() {
    const leagueKey = 'YOUR_LEAGUE_KEY'; // e.g. '402.l.12345'
    const token = localStorage.getItem('yahooAccessToken');
    if (!token) throw new Error('No Yahoo OAuth token present');

    const url = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/standings?format=json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error(`Yahoo API error: ${res.status}`);
    }
    const json = await res.json();

    const teamsData = json.fantasy_content.league[1].standings[0].teams;
    const result = [];
    Object.keys(teamsData).forEach((key) => {
      if (key === 'count') return;
      const teamArr = teamsData[key].team;
      let name = '';
      let wins = 0;
      let losses = 0;
      let pointsFor = 0;
      let pointsAgainst = 0;
      teamArr.forEach((entry) => {
        if (entry.name) {
          name = entry.name;
        }
        if (entry.team_standings) {
          const standings = entry.team_standings;
          if (standings.outcome_totals) {
            wins = parseInt(standings.outcome_totals.wins, 10);
            losses = parseInt(standings.outcome_totals.losses, 10);
          }
          pointsFor = parseFloat(standings.points_for);
          pointsAgainst = parseFloat(standings.points_against);
        }
      });
      result.push({ team: name, wins, losses, pointsFor, pointsAgainst });
    });
    return result;
  }

  /**
   * Render the standings table based on the standings array provided.
   * Rankings are calculated by wins (descending) and pointsFor as tiebreaker.
   *
   * @param {Array} standingsArr
   */
  function renderStandings(standingsArr) {
    const sorted = [...standingsArr].sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.pointsFor - a.pointsFor;
    });
    const tbody = document.getElementById('standings-body');
    tbody.innerHTML = '';
    sorted.forEach((team, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${team.team}</td>
        <td>${team.wins}–${team.losses}</td>
        <td>${team.pointsFor}</td>
        <td>${team.pointsAgainst}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Initialize standings using Yahoo data if possible, otherwise fall back to
   * the sample array above.
   */
  async function initStandings() {
    try {
      const yahooStandings = await fetchYahooStandings();
      renderStandings(yahooStandings);
    } catch (err) {
      console.error('Falling back to sample standings:', err);
      renderStandings(sampleStandings);
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

  // Process any OAuth response from Yahoo and load standings/proposals
  handleOAuthRedirect();
  initStandings();
  loadProposals();

  // Allow user to initiate Yahoo OAuth if a client ID is provided
  const loginBtn = document.getElementById('yahoo-login');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      const clientId = 'YOUR_CLIENT_ID'; // Register an app at developer.yahoo.com
      const redirectUri = window.location.href.split('#')[0];
      const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token`;
      window.location.href = authUrl;
    });
  }

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