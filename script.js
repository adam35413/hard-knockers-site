/*
 * Fantasy Football League client logic
 *
 * This script fetches recent NFL scores, handles rule proposal submissions
 * using localStorage, and updates dynamic elements like the current year. Data is kept
 * client‑side to support static hosting environments (e.g. GitHub Pages or Netlify).
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mark that JS is active so reveal styles engage (no-JS keeps content visible)
  document.documentElement.classList.add('js');

  // Solid nav background once scrolled past the hero threshold
  const navEl = document.querySelector('nav');
  if (navEl) {
    const onScroll = () => navEl.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Scroll-triggered reveals for sections and cards
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
      );
      revealEls.forEach((el) => io.observe(el));
    }
  }

  // Rotating hero subtitle quotes
  const subtitle = document.getElementById('subtitle');
  async function loadQuotes() {
    try {
      const res = await fetch('quotes.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load quotes');
      const arr = await res.json();
      return Array.isArray(arr) && arr.length ? arr : null;
    } catch (e) {
      console.warn('Using built-in quotes fallback:', e);
      return [
        "Draft day: where hope outruns homework.",
        "Trust the process? I barely trust my bench.",
        "Questionable (Q) is my love language.",
        "My waiver claims are 90% apologies.",
        "I don’t rebuild, I emotionally hedge.",
        "If projections were real, I’d be a champion.",
        "Set lineup, say a prayer, avoid Thursday tilt.",
        "Trade calculators can’t measure bad vibes.",
        "Bye weeks build character (and ulcers).",
        "Fantasy: where we yell at TVs about decimals."
      ];
    }
  }

  if (subtitle) {
    (async () => {
      const quotes = await loadQuotes();

      // Storage key migration: previously stored an index; now store the quote text
      const LS_KEY_TEXT = 'hkLastQuote';
      const LS_KEY_INDEX = 'hkLastQuoteIndex';
      const getPrevQuote = () => {
        try {
          const q = localStorage.getItem(LS_KEY_TEXT);
          if (q) return q;
          const idx = parseInt(localStorage.getItem(LS_KEY_INDEX), 10);
          if (Number.isFinite(idx) && quotes[idx]) return quotes[idx];
        } catch (_) {}
        return null;
      };
      const setPrevQuote = (q) => { try { localStorage.setItem(LS_KEY_TEXT, q); } catch (_) {} };

      // Fisher–Yates shuffle (per session order)
      const shuffled = quotes.slice();
      const rng = (max) => {
        const a = new Uint32Array(1);
        window.crypto && crypto.getRandomValues ? crypto.getRandomValues(a) : (a[0] = Math.random() * 2**32);
        return a[0] % max;
      };
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = rng(i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Avoid showing the same first quote as last session
      const lastQuote = getPrevQuote();
      if (shuffled.length > 1 && lastQuote && shuffled[0] === lastQuote) {
        shuffled.push(shuffled.shift());
      }

      let idx = 0;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const advance = () => {
        const next = shuffled[idx % shuffled.length];
        idx += 1;
        setPrevQuote(next);
        if (reduceMotion) {
          subtitle.textContent = next;
          return;
        }
        subtitle.style.opacity = '0';
        setTimeout(() => {
          subtitle.textContent = next;
          subtitle.style.opacity = '1';
        }, 250);
      };
      advance();
      if (!reduceMotion) {
        let timer = setInterval(advance, 8000);
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            clearInterval(timer);
          } else {
            advance();
            timer = setInterval(advance, 8000);
          }
        });
      }
    })();
  }
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
    {
      away: { name: 'Dallas Cowboys', score: 21, abbreviation: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
      home: { name: 'Philadelphia Eagles', score: 24, abbreviation: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' }
    },
    {
      away: { name: 'New England Patriots', score: 17, abbreviation: 'NE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
      home: { name: 'Miami Dolphins', score: 20, abbreviation: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' }
    },
    {
      away: { name: 'Green Bay Packers', score: 27, abbreviation: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
      home: { name: 'Chicago Bears', score: 23, abbreviation: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' }
    },
    {
      away: { name: 'New York Giants', score: 14, abbreviation: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
      home: { name: 'Washington Commanders', score: 18, abbreviation: 'WAS', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' }
    },
    {
      away: { name: 'San Francisco 49ers', score: 30, abbreviation: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
      home: { name: 'Seattle Seahawks', score: 28, abbreviation: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' }
    }
  ];

  const teamDivisions = {
    // AFC East
    BUF: 'AFC East', MIA: 'AFC East', NE: 'AFC East', NYJ: 'AFC East',
    // AFC North
    BAL: 'AFC North', CIN: 'AFC North', CLE: 'AFC North', PIT: 'AFC North',
    // AFC South
    HOU: 'AFC South', IND: 'AFC South', JAX: 'AFC South', JAC: 'AFC South', TEN: 'AFC South',
    // AFC West
    DEN: 'AFC West', KC: 'AFC West', LV: 'AFC West', LVR: 'AFC West', LAC: 'AFC West',
    // NFC East
    DAL: 'NFC East', NYG: 'NFC East', PHI: 'NFC East', WSH: 'NFC East', WAS: 'NFC East',
    // NFC North
    CHI: 'NFC North', DET: 'NFC North', GB: 'NFC North', MIN: 'NFC North',
    // NFC South
    ATL: 'NFC South', CAR: 'NFC South', NO: 'NFC South', NOR: 'NFC South', TB: 'NFC South',
    // NFC West
    ARI: 'NFC West', LAR: 'NFC West', LA: 'NFC West', SEA: 'NFC West', SF: 'NFC West'
  };

  const DIVISION_ORDER = [
    'AFC East',
    'AFC North',
    'AFC South',
    'AFC West',
    'NFC East',
    'NFC North',
    'NFC South',
    'NFC West'
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
    const pickLogo = (team) => team?.logo || team?.logos?.[0]?.href || '';
    const pickAbbreviation = (team) =>
      (team?.abbreviation || team?.altAbbreviation || team?.alternateAbbreviation || team?.abbrev || '').toUpperCase();

    const toScores = (events) =>
      events
        .map((ev) => {
          const comp = ev.competitions?.[0];
          const status = comp?.status?.type;
          const completed = status?.completed || status?.state === 'post';
          if (!completed) return null;
          const home = comp?.competitors?.find((c) => c.homeAway === 'home');
          const away = comp?.competitors?.find((c) => c.homeAway === 'away');
          if (!home || !away) return null;
          const toSide = (entry) => {
            const abbreviation = pickAbbreviation(entry.team) || (entry.team.shortDisplayName || '').toUpperCase();
            return {
              name: entry.team.displayName,
              score: Number.isFinite(Number(entry.score)) ? Number(entry.score) : entry.score,
              abbreviation,
              logo: pickLogo(entry.team)
            };
          };
          const startTime = new Date(comp?.date || ev.date || Date.now()).getTime();
          return {
            id: ev.id,
            startTime,
            home: toSide(home),
            away: toSide(away)
          };
        })
        .filter(Boolean);

    const today = new Date();
    const collected = [];
    const seenIds = new Set();

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
          parsed.forEach((game) => {
            if (!seenIds.has(game.id)) {
              seenIds.add(game.id);
              collected.push(game);
            }
          });
        }
      } catch (e) {
        // Try the next day back on network/CORS failure.
        continue;
      }
      if (collected.length >= 16) break;
    }
    // No events found in the last week.
    return collected.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Render NFL scores into the scores list.
   * @param {Array} scoresArr
   */
  function renderScores(scoresArr) {
    const list = document.getElementById('scores-list');
    list.innerHTML = '';
    const getDivision = (team) => {
      if (!team) return null;
      const abbr = (team.abbreviation || '').toUpperCase();
      return teamDivisions[abbr] || null;
    };

    const createTeamEl = (team, opponentScore) => {
      const container = document.createElement('div');
      container.className = 'team';

      if (team.logo) {
        const img = document.createElement('img');
        img.src = team.logo;
        img.alt = `${team.name} helmet`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.className = 'team-logo';
        container.appendChild(img);
      } else {
        container.classList.add('team--no-logo');
      }

      const info = document.createElement('div');
      info.className = 'team-info';

      const name = document.createElement('span');
      name.className = 'team-name';
      name.textContent = team.name;
      info.appendChild(name);

      const score = document.createElement('span');
      score.className = 'team-score';
      const scoreValue = Number(team.score);
      const opponentValue = Number(opponentScore);
      score.textContent = Number.isFinite(scoreValue) ? scoreValue : team.score || '—';
      if (Number.isFinite(scoreValue) && Number.isFinite(opponentValue) && scoreValue > opponentValue) {
        score.classList.add('team-score--lead');
      }
      info.appendChild(score);

      container.appendChild(info);
      return container;
    };

    const buildCard = (game) => {
      const card = document.createElement('article');
      card.className = 'score-card';
      const awayLabel = game.away?.score ?? '—';
      const homeLabel = game.home?.score ?? '—';
      card.setAttribute('aria-label', `${game.away.name} ${awayLabel}, ${game.home.name} ${homeLabel}`);

      const awayEl = createTeamEl(game.away, game.home.score);
      const divider = document.createElement('span');
      divider.className = 'score-divider';
      divider.textContent = 'at';
      const homeEl = createTeamEl(game.home, game.away.score);

      card.appendChild(awayEl);
      card.appendChild(divider);
      card.appendChild(homeEl);
      return card;
    };

    const grouped = new Map();
    scoresArr.forEach((game) => {
      const division = getDivision(game.home) || getDivision(game.away) || 'Around the League';
      if (!grouped.has(division)) {
        grouped.set(division, []);
      }
      grouped.get(division).push(game);
    });

    const orderedDivisions = [
      ...DIVISION_ORDER.filter((name) => grouped.has(name)),
      ...Array.from(grouped.keys()).filter((name) => !DIVISION_ORDER.includes(name))
    ];

    orderedDivisions.forEach((division) => {
      const games = grouped.get(division);
      if (!games || games.length === 0) return;

      const section = document.createElement('section');
      section.className = 'division-group';

      const title = document.createElement('h3');
      title.className = 'division-title';
      title.textContent = division;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'division-grid';
      games.forEach((game) => grid.appendChild(buildCard(game)));
      section.appendChild(grid);

      list.appendChild(section);
    });
  }

  /**
   * Show a fantasy-themed error notice in the scores area.
   * @param {string} message
   */
  function showScoresError(message, { append = false } = {}) {
    const list = document.getElementById('scores-list');
    if (!append) {
      list.innerHTML = '';
    } else {
      list.querySelectorAll('.score-error').forEach((el) => el.remove());
    }
    const notice = document.createElement('div');
    notice.className = 'score-error';
    notice.textContent = message;
    if (append && list.firstChild) {
      list.insertBefore(notice, list.firstChild);
    } else {
      list.appendChild(notice);
    }
  }

  /**
   * Initialize NFL scores using ESPN data if possible, otherwise fall back to
   * the sample array above.
   */
  async function initScores() {
    try {
      const scores = await fetchNflScores();
      if (!scores || scores.length === 0) {
        console.warn('No recent ESPN scores found; showing fallback scores.');
        renderScores(sampleScores);
        showScoresError(
          'The live scoreboard got benched this week — showing last season classics instead.',
          { append: true }
        );
      } else {
        renderScores(scores);
      }
    } catch (err) {
      console.error('ESPN scores fetch failed:', err);
      renderScores(sampleScores);
      showScoresError(
        'We couldn’t pick up the ESPN play-by-play — showing placeholder scores.',
        { append: true }
      );
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
