/*
 * Draft page logic
 *
 * Manages this year's league roster, generates a random draft order, and plays
 * a dramatic "field dash" race whose finishing order IS the draft order.
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
  const replayBtn = document.getElementById('replay-race');
  const copyBtn = document.getElementById('copy-order');
  const clearBtn = document.getElementById('clear-order');
  const boardEl = document.getElementById('draft-board');
  const draftEmpty = document.getElementById('draft-empty');
  const metaEl = document.getElementById('draft-meta');

  // Race stage elements
  const stageEl = document.getElementById('race-stage');
  const trackEl = document.getElementById('race-track');
  const worldEl = document.getElementById('race-world');
  const finishEl = document.getElementById('race-finish');
  const statusEl = document.getElementById('race-status');
  const skipBtn = document.getElementById('skip-race');
  const countdownEl = document.getElementById('race-countdown');
  const secondsInput = document.getElementById('race-seconds');

  if (seasonLabel) seasonLabel.textContent = `${season} Season`;

  const MASCOTS = [
    // Football & sports
    '🏈', '⛑️', '🏆', '🥇', '🎯', '🥊', '🏉', '⚽', '🏀', '⚾', '🥅', '🚩', '📣', '🎽', '🥏', '🏐',
    // Classic critters
    '🦆', '🐎', '🐢', '🐇', '🦁', '🐅', '🐐', '🦅', '🐝', '🦈', '🐊', '🐏', '🐆', '🦌', '🐗', '🐕',
    '🐈', '🐺', '🐻', '🐼', '🐨', '🐯', '🦊', '🦝', '🐷', '🐮', '🐸', '🐵', '🦍', '🦏', '🦛', '🐘',
    '🦒', '🦘', '🐫', '🦬', '🦙', '🦇', '🦉', '🦜', '🦢', '🦩', '🐓', '🦃', '🐍', '🦂', '🦀', '🦞',
    '🐙', '🐬', '🐳', '🦭', '🐡', '🐌', '🦔', '🦡', '🦦',
    // Mythical & wild cards
    '🐉', '🦄', '👾', '🤖', '👽', '💀', '🔥', '⚡', '👑', '🦸', '🤠', '😈', '🤡', '🎃', '🥶', '🌪️',
    '🍔', '🍕', '🌮', '🍺', '🚀'
  ];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  let members = [];
  let order = read(ORDER_KEY);
  let racing = false;
  let raf = null;
  let timers = [];
  let geo = null; // race geometry (set per race in buildLanes)

  // ---- race length control (seconds) ----
  const SECONDS_KEY = 'hkRaceSeconds';
  const clampSeconds = (v) => Math.min(60, Math.max(3, Math.round(Number(v) || 8)));
  if (secondsInput) {
    const savedSeconds = Number(localStorage.getItem(SECONDS_KEY));
    if (savedSeconds) secondsInput.value = String(clampSeconds(savedSeconds));
    secondsInput.addEventListener('change', () => {
      secondsInput.value = String(clampSeconds(secondsInput.value));
      write(SECONDS_KEY, Number(secondsInput.value));
    });
  }
  const raceSeconds = () => clampSeconds(secondsInput ? secondsInput.value : 8);

  // ---- crypto-backed Fisher–Yates shuffle (used for the actual draft order) ----
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

  const mascotFor = (name) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    return MASCOTS[h % MASCOTS.length];
  };

  // Members are stored as { name, mascot }. Migrate older string-only rosters.
  const migrateMembers = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((m) => (typeof m === 'string' ? { name: m, mascot: mascotFor(m) } : m))
      .filter((m) => m && m.name)
      .map((m) => ({ name: m.name, mascot: m.mascot || mascotFor(m.name) }));
  };

  const usedMascots = () => new Set(members.map((m) => m.mascot));

  // Prefer the name's hashed mascot; if taken, grab the first unused one.
  const pickMascot = (name) => {
    const used = usedMascots();
    const preferred = mascotFor(name);
    if (!used.has(preferred)) return preferred;
    return MASCOTS.find((m) => !used.has(m)) || preferred;
  };

  const mascotForName = (name) => {
    const m = members.find((x) => x.name === name);
    return (m && m.mascot) || mascotFor(name);
  };

  members = migrateMembers(storedLeague && storedLeague.members);

  const ordinal = (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const persistLeague = () => write(LEAGUE_KEY, { season, members });
  const hasOrder = () => !!(order && Array.isArray(order.order) && order.order.length);

  // ---- board rendering ----
  const clearBoard = () => { boardEl.innerHTML = ''; };

  const appendPick = (name) => {
    const li = document.createElement('li');
    li.className = 'draft-pick';
    const pickName = document.createElement('span');
    pickName.className = 'pick-name';
    pickName.textContent = name;
    li.appendChild(pickName);
    boardEl.appendChild(li);
  };

  const setMeta = () => {
    if (!hasOrder()) { metaEl.textContent = ''; return; }
    let stamp = '';
    if (order.generatedAt) {
      const when = new Date(order.generatedAt);
      if (!Number.isNaN(when.getTime())) {
        stamp = ` · generated ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    }
    metaEl.textContent = `${order.season || season} draft · ${order.order.length} managers${stamp}`;
  };

  const showResultButtons = (show) => {
    copyBtn.hidden = !show;
    clearBtn.hidden = !show;
    replayBtn.hidden = !show;
  };

  const renderBoardStatic = () => {
    clearBoard();
    if (!hasOrder()) { showResultButtons(false); setMeta(); draftEmpty.hidden = false; return; }
    order.order.forEach(appendPick);
    setMeta();
    showResultButtons(true);
    draftEmpty.hidden = true;
  };

  const syncGenerateState = () => {
    generateBtn.disabled = racing || members.length < 2;
    replayBtn.disabled = racing;
    generateBtn.textContent = hasOrder() ? 'Regenerate Draft Order' : 'Generate Draft Order';
  };

  // Roster changed: any previously generated order (and its race) is now stale.
  const invalidateOrder = () => {
    if (order) {
      order = null;
      drop(ORDER_KEY);
      stopRace();
      stageEl.hidden = true;
      clearBoard();
      showResultButtons(false);
      setMeta();
      draftEmpty.hidden = false;
    }
  };

  // ---- roster editing ----
  const renderRoster = () => {
    closeMascotPicker();
    listEl.innerHTML = '';
    countEl.textContent = String(members.length);
    rosterEmpty.hidden = members.length > 0;

    members.forEach((member, index) => {
      const li = document.createElement('li');
      li.className = 'member-chip';

      const mascotBtn = document.createElement('button');
      mascotBtn.type = 'button';
      mascotBtn.className = 'chip-mascot';
      mascotBtn.textContent = member.mascot;
      mascotBtn.title = 'Change mascot';
      mascotBtn.setAttribute('aria-label', `Change ${member.name}'s mascot`);
      mascotBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMascotPicker(index, mascotBtn);
      });

      const label = document.createElement('span');
      label.className = 'chip-name';
      label.textContent = member.name;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'chip-remove';
      remove.setAttribute('aria-label', `Remove ${member.name}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        if (racing) return;
        members.splice(index, 1);
        persistLeague();
        invalidateOrder();
        renderRoster();
        syncGenerateState();
      });

      li.append(mascotBtn, label, remove);
      listEl.appendChild(li);
    });
  };

  // ---- race engine -------------------------------------------------------
  // finishOrder[0] is the winner (1st overall pick). Each racer is given a
  // strictly increasing finish time by rank, plus a cosmetic "wobble" that is
  // exactly zero at its own finish moment — so mid-race positions swap wildly
  // but the crossing order always equals the draft order.
  function stopRace() {
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    timers.forEach(clearTimeout);
    timers = [];
    if (countdownEl) { countdownEl.textContent = ''; countdownEl.classList.remove('go'); }
  }

  // Position of a racer (0..1 progress) along the world, in world pixels.
  function worldXFor(p) {
    return geo.startPad + p * geo.runLen;
  }

  function buildLanes(finishOrder) {
    trackEl.innerHTML = '';
    const n = finishOrder.length;

    // Finish times spread across the chosen race length: winner ~60% in, last at the end.
    const durationMs = raceSeconds() * 1000;
    const T0 = durationMs * 0.6;
    const span = durationMs * 0.4;
    const gap = n > 1 ? span / (n - 1) : 0;

    const racers = finishOrder.map((name, rank) => ({
      name,
      rank,
      mascot: mascotForName(name),
      finishTime: T0 + rank * gap,
      amp: 0.14 + Math.random() * 0.22,
      freq: 1 + Math.floor(Math.random() * 3),
      phase: Math.random() * Math.PI * 2,
      progress: 0,
      placed: false
    }));

    // Geometry: a long field that scrolls right→left under a camera following the pack.
    const field = document.querySelector('.race-field');
    const W = field.clientWidth || 600;
    const startPad = 40;
    const finishZone = Math.min(150, Math.max(90, W * 0.15));
    const runLen = Math.max(1200, W * 1.7);
    const trackPx = startPad + runLen + finishZone;
    geo = { W, startPad, runLen, finishZone, trackPx, finishX: startPad + runLen };

    worldEl.style.width = `${trackPx}px`;
    worldEl.style.transform = 'translateX(0px)';
    finishEl.style.left = `${geo.finishX}px`;

    // Display lanes shuffled so the top lane doesn't telegraph the winner.
    const displayOrder = shuffle(racers.map((_, i) => i));
    displayOrder.forEach((rankIdx) => {
      const r = racers[rankIdx];
      const lane = document.createElement('div');
      lane.className = 'lane';

      const racer = document.createElement('div');
      racer.className = 'racer';
      racer.style.transform = `translate(${worldXFor(0)}px, -50%)`;

      const badge = document.createElement('span');
      badge.className = 'racer-place';

      const mascot = document.createElement('span');
      mascot.className = 'racer-mascot';
      mascot.textContent = r.mascot;

      const tag = document.createElement('span');
      tag.className = 'racer-tag';
      tag.textContent = r.name;

      racer.append(badge, mascot, tag);
      lane.appendChild(racer);
      trackEl.appendChild(lane);

      r.lane = lane;
      r.el = racer;
      r.badge = badge;
    });

    return racers;
  }

  function announce(place, name) {
    if (place === 1) statusEl.textContent = `🏆 1st overall pick — ${name}!`;
    else statusEl.textContent = `${ordinal(place)} pick — ${name}`;
  }

  function placeRacer(r, place, atFinish) {
    r.placed = true;
    r.progress = 1;
    if (atFinish) r.el.style.transform = `translate(${worldXFor(1)}px, -50%)`;
    r.el.classList.add('finished');
    r.lane.classList.add('done');
    if (place === 1) {
      r.lane.classList.add('winner');
      r.badge.textContent = '🏆';
    } else {
      r.badge.textContent = ordinal(place);
    }
    appendPick(r.name);
    announce(place, r.name);
  }

  function finishRace() {
    racing = false;
    stopRace();
    statusEl.textContent = "That's your draft order!";
    setMeta();
    showResultButtons(true);
    syncGenerateState();
  }

  function finishRemaining(racers) {
    // Place any not-yet-finished racers immediately, in rank order.
    let placed = racers.filter((r) => r.placed).length;
    racers.forEach((r) => {
      if (!r.placed) { placed += 1; placeRacer(r, placed, true); }
    });
    // Snap the camera to the finish so the crossings are on screen.
    if (geo) worldEl.style.transform = `translateX(${-(geo.trackPx - geo.W)}px)`;
    finishRace();
  }

  function animate(racers) {
    let startTs = null;
    let placedCount = racers.filter((r) => r.placed).length;

    const frame = (ts) => {
      if (startTs === null) startTs = ts;
      const t = ts - startTs;
      let allDone = true;
      let leader = null;
      let leaderX = -Infinity;

      racers.forEach((r) => {
        if (r.placed) {
          const x = worldXFor(r.progress);
          if (x > leaderX) { leaderX = x; leader = r; }
          return;
        }
        const base = Math.min(t / r.finishTime, 1);
        if (base >= 1) {
          placedCount += 1;
          placeRacer(r, placedCount, true);
          if (worldXFor(1) > leaderX) { leaderX = worldXFor(1); leader = r; }
          return;
        }
        allDone = false;
        const wobble = r.amp * Math.sin(base * r.freq * Math.PI + r.phase) * base * (1 - base);
        let p = base + wobble;
        if (p < 0) p = 0;
        if (p > 0.985) p = 0.985;
        r.progress = p;
        const x = worldXFor(p);
        r.el.style.transform = `translate(${x}px, -50%)`;
        if (x > leaderX) { leaderX = x; leader = r; }
      });

      // Camera follows the front-runner, clamped to the field ends.
      const cam = Math.max(-(geo.trackPx - geo.W), Math.min(0, geo.W * 0.58 - leaderX));
      worldEl.style.transform = `translateX(${cam}px)`;

      if (leader && !leader.placed && placedCount < racers.length) {
        statusEl.textContent = `${leader.mascot} ${leader.name} out front…`;
      }

      if (allDone) { finishRace(); return; }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
  }

  function runCountdown(done) {
    const steps = ['3', '2', '1', 'HIKE!'];
    statusEl.textContent = 'On the line…';
    let i = 0;
    const tick = () => {
      if (i >= steps.length) { countdownEl.textContent = ''; countdownEl.classList.remove('go'); done(); return; }
      countdownEl.textContent = steps[i];
      countdownEl.classList.remove('go');
      void countdownEl.offsetWidth; // reflow to retrigger the pop animation
      countdownEl.classList.add('go');
      i += 1;
      timers.push(setTimeout(tick, 650));
    };
    tick();
  }

  function startRace(finishOrder) {
    if (racing) return;
    racing = true;
    stopRace();
    clearBoard();
    draftEmpty.hidden = true;
    showResultButtons(false);
    stageEl.hidden = false;
    syncGenerateState();

    const racers = buildLanes(finishOrder);

    if (prefersReduced) {
      statusEl.textContent = 'Draft order set.';
      finishRemaining(racers);
      return;
    }

    stageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Skip jumps straight to the final board.
    skipBtn.onclick = () => {
      if (!racing) return;
      stopRace();
      statusEl.textContent = 'Skipped to the results.';
      finishRemaining(racers);
    };

    runCountdown(() => animate(racers));
  }

  // ---- events ----
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (racing) return;
    const name = nameInput.value.trim();
    if (!name) return;
    if (members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      nameInput.value = '';
      return; // no duplicates
    }
    members.push({ name, mascot: pickMascot(name) });
    persistLeague();
    invalidateOrder();
    renderRoster();
    syncGenerateState();
    nameInput.value = '';
    nameInput.focus();
  });

  generateBtn.addEventListener('click', () => {
    if (racing || members.length < 2) return;
    order = { season, generatedAt: new Date().toISOString(), order: shuffle(members.map((m) => m.name)) };
    write(ORDER_KEY, order);
    syncGenerateState();
    startRace(order.order);
  });

  replayBtn.addEventListener('click', () => {
    if (racing || !hasOrder()) return;
    startRace(order.order);
  });

  clearBtn.addEventListener('click', () => {
    order = null;
    drop(ORDER_KEY);
    stopRace();
    racing = false;
    stageEl.hidden = true;
    clearBoard();
    showResultButtons(false);
    setMeta();
    draftEmpty.hidden = false;
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
    const current = new Set(members.map((m) => m.name.toLowerCase()));
    const sameSize = order.order.length === members.length;
    const sameNames = order.order.every((n) => current.has(n.toLowerCase()));
    if (!sameSize || !sameNames) {
      order = null;
      drop(ORDER_KEY);
    }
  }

  // ---- mascot picker popover ----
  let pickerIndex = null;
  const picker = document.createElement('div');
  picker.className = 'mascot-picker';
  picker.hidden = true;
  picker.setAttribute('role', 'listbox');
  picker.setAttribute('aria-label', 'Choose a mascot');
  MASCOTS.forEach((emoji) => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'mascot-option';
    opt.textContent = emoji;
    opt.setAttribute('role', 'option');
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pickerIndex != null && members[pickerIndex]) {
        // Don't allow a mascot already taken by another manager.
        const taken = members.some((m, i) => i !== pickerIndex && m.mascot === emoji);
        if (!taken) {
          members[pickerIndex].mascot = emoji;
          persistLeague();
          renderRoster();
        }
      }
      closeMascotPicker();
    });
    picker.appendChild(opt);
  });
  document.body.appendChild(picker);

  function positionPicker(anchor) {
    const rect = anchor.getBoundingClientRect();
    picker.style.visibility = 'hidden';
    picker.hidden = false;
    const pw = picker.offsetWidth;
    const ph = picker.offsetHeight;
    const vw = document.documentElement.clientWidth;
    let left = Math.min(window.scrollX + rect.left, window.scrollX + vw - pw - 8);
    left = Math.max(left, window.scrollX + 8);
    let top = window.scrollY + rect.bottom + 8;
    if (rect.bottom + 8 + ph > window.innerHeight && rect.top - 8 - ph > 0) {
      top = window.scrollY + rect.top - ph - 8; // flip above when tight on space
    }
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
    picker.style.visibility = '';
  }

  function openMascotPicker(index, anchor) {
    if (pickerIndex === index && !picker.hidden) { closeMascotPicker(); return; }
    pickerIndex = index;
    const current = members[index] && members[index].mascot;
    const taken = new Set(members.filter((_, i) => i !== index).map((m) => m.mascot));
    picker.querySelectorAll('.mascot-option').forEach((opt) => {
      const isTaken = taken.has(opt.textContent);
      opt.disabled = isTaken;
      opt.classList.toggle('taken', isTaken);
      opt.classList.toggle('selected', opt.textContent === current);
    });
    picker.scrollTop = 0;
    positionPicker(anchor);
  }

  function closeMascotPicker() {
    picker.hidden = true;
    pickerIndex = null;
  }

  document.addEventListener('click', (e) => {
    if (!picker.hidden && !picker.contains(e.target)) closeMascotPicker();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMascotPicker();
  });
  window.addEventListener('resize', closeMascotPicker);
  window.addEventListener('scroll', (e) => {
    if (picker.hidden) return;
    if (picker.contains(e.target)) return; // scrolling inside the picker itself
    closeMascotPicker();
  }, true);

  renderRoster();
  renderBoardStatic();
  syncGenerateState();
});
