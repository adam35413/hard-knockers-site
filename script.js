/*
 * Fantasy Football League client logic
 *
 * This script populates the standings table from a simple array, handles rule proposal submissions
 * using localStorage, and updates dynamic elements like the current year. Data is kept
 * client‑side to support static hosting environments (e.g. GitHub Pages or Netlify).  
 */

document.addEventListener('DOMContentLoaded', () => {
  // Sample standings data. Replace this array with your real league stats.
  const standings = [
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
   * Render the standings table based on the standings array.
   * Rankings are calculated by wins (descending) and pointsFor as tiebreaker.
   */
  function renderStandings() {
    // Create a copy of the array to avoid mutating the original when sorting
    const sorted = [...standings].sort((a, b) => {
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

  // Initialize standings and proposals on page load
  renderStandings();
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