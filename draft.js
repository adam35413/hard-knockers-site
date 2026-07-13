/*
 * Draft page logic
 *
 * Manages this year's league roster and generates a random draft order.
 * All data is client-side (localStorage) to fit static hosting:
 *   hkLeague     -> { season, members: [names] }
 *   hkDraftOrder -> { season, generatedAt, order: [names] }
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('member-form');
  if (!form) return; // Not the draft page

  const LEAGUE_KEY = 'hkLeague';
  const ORDER_KEY = 'hkDraftOrder';
  const season = new Date().getFullYear();

  const nameInput = document.getElementById('member-name');
  const listEl = document.getElementById('member-list');
  const rosterEmpty = document.getElementById('roster-empty');
  const countEl = document.getElementById('member-count');
  const seasonLabel = document.getElementById('season-label');
  const generateBtn = document.getElementById('generate-order');
  const copyBtn = document.getElementById('copy-order');
  const clearBtn = document.getElementById('clear-order');
  const boardEl = document.getElementById('draft-board');
  const draftEmpty = document.getElementById('draft-empty');
  const metaEl = document.getElementById('draft-meta');

  if (seasonLabel) seasonLabel.textContent = `${season} Season`;

  // ---- storage helpers ----
  const read = (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } catch (_) { return null; }
  };
  const write = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  };
  const drop = (key) => {
    try { localStorage.removeItem(key); } catch (_) {}
  };

  const storedLeague = read(LEAGUE_KEY);
  let members = storedLeague && Array.isArray(storedLeague.members) ? storedLeague.members.slice() : [];
  let order = read(ORDER_KEY);

  // ---- crypto-backed Fisher–Yates shuffle ----
  const rand = (max) => {
    const a = new Uint32Array(1);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else a[0] = Math.floor(Math.random() * 2 ** 32);
    return a[0] % max;
  };
  const shuffle = (arr) => {
    const s = arr.slice();
    for (let i = s.length - 1; i > 0; i--) {
      const j = rand(i + 1);
      [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
  };

  const persistLeague = () => write(LEAGUE_KEY, { season, members });

  const hasOrder = () => !!(order && Array.isArray(order.order) && order.order.length);

  // Roster changed: a previously generated order is now stale, so drop it.
  const invalidateOrder = () => {
    if (order) {
      order = null;
      drop(ORDER_KEY);
      renderOrder();
    }
  };

  const syncGenerateState = () => {
    generateBtn.disabled = members.length < 2;
    generateBtn.textContent = hasOrder() ? 'Regenerate Draft Order' : 'Generate Draft Order';
  };

  // ---- rendering ----
  const renderRoster = () => {
    listEl.innerHTML = '';
    countEl.textContent = String(members.length);
    rosterEmpty.hidden = members.length > 0;

    members.forEach((name, index) => {
      const li = document.createElement('li');
      li.className = 'member-chip';

      const label = document.createElement('span');
      label.textContent = name;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${name}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        members.splice(index, 1);
        persistLeague();
        invalidateOrder();
        renderRoster();
        syncGenerateState();
      });

      li.append(label, remove);
      listEl.appendChild(li);
    });
  };

  const renderOrder = () => {
    boardEl.innerHTML = '';
    const showOrder = hasOrder();
    draftEmpty.hidden = showOrder;
    copyBtn.hidden = !showOrder;
    clearBtn.hidden = !showOrder;

    if (!showOrder) {
      metaEl.textContent = '';
      return;
    }

    order.order.forEach((name) => {
      const li = document.createElement('li');
      li.className = 'draft-pick';
      const pickName = document.createElement('span');
      pickName.className = 'pick-name';
      pickName.textContent = name;
      li.appendChild(pickName);
      boardEl.appendChild(li);
    });

    let stamp = '';
    if (order.generatedAt) {
      const when = new Date(order.generatedAt);
      if (!Number.isNaN(when.getTime())) {
        stamp = ` · generated ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }
    metaEl.textContent = `${order.season || season} draft · ${order.order.length} managers${stamp}`;
  };

  // ---- events ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    if (members.some((m) => m.toLowerCase() === name.toLowerCase())) {
      nameInput.value = '';
      return; // no duplicates
    }
    members.push(name);
    persistLeague();
    invalidateOrder();
    renderRoster();
    syncGenerateState();
    nameInput.value = '';
    nameInput.focus();
  });

  generateBtn.addEventListener('click', () => {
    if (members.length < 2) return;
    order = { season, generatedAt: new Date().toISOString(), order: shuffle(members) };
    write(ORDER_KEY, order);
    renderOrder();
    syncGenerateState();
    boardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  clearBtn.addEventListener('click', () => {
    order = null;
    drop(ORDER_KEY);
    renderOrder();
    syncGenerateState();
  });

  copyBtn.addEventListener('click', async () => {
    if (!hasOrder()) return;
    const text = order.order.map((n, i) => `${i + 1}. ${n}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    } catch (_) {
      // Clipboard unavailable — leave the board as the source of truth.
    }
  });

  // Drop a stored order that no longer matches the current roster (safety on load).
  if (hasOrder()) {
    const current = new Set(members.map((m) => m.toLowerCase()));
    const sameSize = order.order.length === members.length;
    const sameNames = order.order.every((n) => current.has(n.toLowerCase()));
    if (!sameSize || !sameNames) {
      order = null;
      drop(ORDER_KEY);
    }
  }

  renderRoster();
  renderOrder();
  syncGenerateState();
});
