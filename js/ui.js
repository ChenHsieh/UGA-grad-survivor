let helpVisible = false;
let helpOpener = null;
let renderedPhase = null;

const STAT_DEFS = [
  { key: 'mind', name: 'Mind' },
  { key: 'body', name: 'Body' },
  { key: 'wallet', name: 'Wallet' },
  { key: 'bonds', name: 'Friends' },
];
const STAT_NAMES = { mind: 'Mind', body: 'Body', wallet: 'Wallet', bonds: 'Friends', research: 'Research' };
const DANGER = 20;   // at or below: red, and Wallet/Friends start draining Mind and Body
const WARN = 35;

const SEM_LABELS = {
  1: 'The Naive Years', 2: 'The Naive Years', 3: 'The Grind', 4: 'The Grind', 5: 'Deep In It', 6: 'Deep In It',
  7: 'The Reckoning', 8: 'Career Crossroads', 9: 'The Final Push', 10: 'Defense or Bust'
};

const escapeText = text => String(text).replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

function signed(v) { return (v > 0 ? '+' : '−') + Math.abs(v); }

function formatDeltas(deltas) {
  return Object.keys(STAT_NAMES)
    .filter(stat => deltas[stat])
    .map(stat => `<span class="d ${deltas[stat] > 0 ? 'up' : 'down'}">${STAT_NAMES[stat]} ${signed(deltas[stat])}</span>`)
    .join(' ');
}

function totalDeltas(result) {
  const total = {};
  Object.keys(STAT_NAMES).forEach(stat => {
    const d = result.after[stat] - result.before[stat];
    if (d) total[stat] = d;
  });
  return total;
}

function zoneOf(v) { return v <= DANGER ? 'danger' : v <= WARN ? 'warn' : 'ok'; }

// ── Title ──────────────────────────────────────────────────────────

function beginGame() {
  if (!save.totalRuns) { selectArchetype('overachiever'); return; }
  gameState.phase = 'archetype';
  gameState.ending = null;
  gameState.currentCard = null;
  menuIndex = Math.max(0, getSelectableArchetypes().indexOf(save.lastArchetype));
  render();
}

function renderTitle() {
  const returning = save.totalRuns > 0;
  return `
    <div class="title-screen">
      <div class="title-art">${endingIcon('defended')}</div>
      <h1>UGA Grad <em>Survivor</em></h1>
      <p class="tagline">Ten semesters. Every card has two answers.<br>Keep four bars above zero, and do enough research to defend.</p>
      <button class="begin-btn" onclick="beginGame()">${returning ? 'New run' : 'Begin'}</button>
      ${returning ? `<div class="title-meta">${save.endings.length} of 6 endings found · ${save.totalRuns} ${save.totalRuns === 1 ? 'run' : 'runs'}</div>` : ''}
      <div class="credits">by Chen Hsieh, a UGA bioinformatics PhD student</div>
    </div>`;
}

// ── Picking a path and an advisor ─────────────────────────────────

const ARCH_UNLOCK_HINTS = {
  double_agent:   'Reach semester 7 to unlock',
  gym_bro:        'End up in the hospital to unlock',
  neurodivergent: 'Burn out to unlock',
};

function miniStats(s) {
  return ['mind', 'body', 'wallet', 'bonds', 'research'].map(k =>
    `<span class="mini-stat" title="${STAT_NAMES[k]}">${statIcon(k)}<span class="sr">${STAT_NAMES[k]}</span>${s[k]}</span>`).join('');
}

function renderArchetype() {
  const archs = Object.entries(ARCHETYPE_DATA);
  const selectable = getSelectableArchetypes();
  const preferred = selectable.includes(save.lastArchetype) ? save.lastArchetype : selectable[0];
  let html = `<div class="pick-screen">
    <h1 class="screen-title">Who are you?</h1>
    <p class="screen-sub">Each one starts with different bars and one quirk.</p>`;
  archs.forEach(([key, data]) => {
    const locked = !save.archetypes.includes(key);
    html += `
      <button type="button" class="pick-card ${locked ? 'locked' : ''} ${key === preferred ? 'selected' : ''}" ${locked ? 'disabled' : `onclick="selectArchetype('${key}')"`}>
        <span class="pick-icon">${archIcon(key)}</span>
        <span class="pick-text">
          <span class="pick-name">${data.name}</span>
          <span class="pick-blurb">${locked ? ARCH_UNLOCK_HINTS[key] || 'Unlock by playing' : data.blurb}</span>
          ${locked ? '' : `<span class="pick-stats">${miniStats(data.st)}</span>`}
        </span>
      </button>`;
  });
  html += `<details class="how">
    <summary>How each quirk works</summary>
    ${archs.filter(([k]) => save.archetypes.includes(k)).map(([, d]) => `<p><strong>${d.name}.</strong> ${d.desc}</p>`).join('')}
  </details></div>`;
  return html;
}

function renderPISelection() {
  const pis = Object.entries(PI_DATA);
  const unlocked = save.unlockedPIs || ['micromanager', 'ghost', 'mentor', 'new_pi'];
  let html = `<div class="pick-screen">
    <h1 class="screen-title">Pick your advisor</h1>
    <p class="screen-sub">You will work for them until you graduate.</p>`;
  pis.forEach(([key, data]) => {
    const locked = !unlocked.includes(key);
    const hint = key === 'exploiter' ? 'Leave with a master’s to unlock' : key === 'dynasty' ? 'Defend to unlock' : 'Unlock by playing';
    html += `
      <button type="button" class="pick-card ${locked ? 'locked' : ''}" ${locked ? 'disabled' : `onclick="selectPI('${key}')"`}>
        <span class="pick-icon">${piIcon(key)}</span>
        <span class="pick-text">
          <span class="pick-name">${data.name}</span>
          <span class="pick-blurb">${locked ? hint : data.blurb}</span>
        </span>
      </button>`;
  });
  html += `<details class="how">
    <summary>How each advisor works</summary>
    ${pis.filter(([k]) => unlocked.includes(k)).map(([, d]) => `<p><strong>${d.name}.</strong> ${d.desc}</p>`).join('')}
  </details></div>`;
  return html;
}

// ── Between semesters ─────────────────────────────────────────────

function statRow(st) {
  return `<div class="sem-stats">${STAT_DEFS.map(s =>
    `<span class="sem-stat ${zoneOf(st[s.key])}">${statIcon(s.key)}<span>${s.name}</span><strong>${st[s.key]}</strong></span>`).join('')}</div>`;
}

function gateLine() {
  const g = nextGate();
  const r = gameState.st.research;
  const short = r < g.need;
  return `<div class="gate-line ${short ? 'short' : ''}">${statIcon('research')} Research <strong>${r}</strong>. ${g.name} in semester ${g.sem} needs ${g.need}.</div>`;
}

function lastLine() {
  const result = gameState.lastConsequence;
  if (!result) return '';
  const steps = result.steps.map(step => `<div class="why-step"><span class="why-label">${escapeText(step.label)}</span> ${formatDeltas(step.deltas)}</div>`).join('');
  return `<div class="why-box"><div class="why-choice">${escapeText(result.choice)}</div>${steps || '<div class="why-step">No change.</div>'}</div>`;
}

function renderRotationComplete() {
  return `<div class="semester-advance-screen">
    <div class="sem-advance-badge">Semester 1 done · rotations over</div>
    <div class="sem-advance-title">Choose your lab</div>
    <div class="sem-advance-flavor">You have seen the famous PI with no time for students. The warm one with no publications. The new one still figuring it out. Now you commit to one of them.</div>
    ${statRow(gameState.st)}
    ${gateLine()}
    <button class="sem-advance-btn" onclick="continueToPI()">Pick your advisor</button>
  </div>`;
}

function renderSemesterAdvance() {
  const done = gameState.semester;
  const next = gameState.nextSemester;
  const flavors = {
    3: "First year is behind you. The qualifying exam is out there, somewhere in the fog.",
    4: "The grind is real. Your brain hurts in a productive way. The exam is this semester.",
    5: "Past the exam. The project is yours now. Nobody tells you what to do next.",
    6: "Committee season. Everyone wants a progress report. You have a PowerPoint.",
    7: "You've been here long enough to have strong opinions about the grad lounge coffee.",
    8: "The end is theoretically visible. You've written more than you ever thought possible.",
    9: "One more push. Defense is almost within reach.",
    10: "Final semester. Defense or bust. No more semesters after this one."
  };
  return `<div class="semester-advance-screen">
    <div class="sem-advance-badge">Semester ${done} done</div>
    <div class="sem-advance-title">Semester ${next}</div>
    <div class="sem-advance-next-label">${SEM_LABELS[next] || ''}</div>
    <div class="sem-advance-flavor">${flavors[next] || ''}</div>
    ${lastLine()}
    ${statRow(gameState.st)}
    ${gateLine()}
    <div class="sem-advance-cost">Rent goes up: Wallet −1 when you start the semester.</div>
    <button class="sem-advance-btn" onclick="continueSemester()">Start semester ${next}</button>
  </div>`;
}

// ── Play ──────────────────────────────────────────────────────────

function dangerMessage() {
  const st = gameState.st;
  const g = nextGate();
  const lowest = STAT_DEFS.map(s => ({ ...s, v: st[s.key] })).sort((a, b) => a.v - b.v)[0];
  if (lowest.v <= 10) return `${lowest.name} is at ${lowest.v}. At 0 the run ends.`;
  if (st.wallet < 20) return 'Wallet under 20: you lose Mind and Body every card.';
  if (st.bonds < 20) return 'Friends under 20: you lose Mind and Body every card.';
  if (g.sem === gameState.semester && st.research < g.need) return `${g.name} this semester needs Research ${g.need}. You have ${st.research}.`;
  if (st.research < 15 && gameState.semester >= 3) return 'Research under 15: your advisor’s worry costs Mind every card.';
  if (lowest.v <= DANGER) return `${lowest.name} is low. Watch for big dots on it.`;
  return '';
}

function renderPlay() {
  if (!gameState.currentCard) gameState.currentCard = drawCard();
  const card = gameState.currentCard;
  if (!card) return '';
  const st = gameState.st;
  const result = gameState.lastConsequence;
  const fresh = result && !result.shown;
  const shownFrom = fresh ? result.before : st;
  const total = result ? totalDeltas(result) : {};

  const meter = s => {
    const v = st[s.key];
    const float = fresh && total[s.key] ? `<span class="float ${total[s.key] > 0 ? 'up' : 'down'}">${signed(total[s.key])}</span>` : '';
    return `<div class="stat-item ${zoneOf(v)}" data-stat="${s.key}">
      <span class="dot" aria-hidden="true"></span>
      <div class="stat-top">${statIcon(s.key)}<span class="stat-name">${s.name}</span><span class="stat-value">${v}</span></div>
      <div class="stat-bar"><div class="stat-fill" data-to="${v}" style="width:${shownFrom[s.key]}%"></div></div>
      ${float}
    </div>`;
  };

  const g = nextGate();
  const r = st.research;
  const rFloat = fresh && total.research ? `<span class="float ${total.research > 0 ? 'up' : 'down'}">${signed(total.research)}</span>` : '';
  const gateNow = g.sem === gameState.semester;
  const research = `<div class="research ${r < g.need ? (gateNow ? 'short now' : 'short') : 'met'}" data-stat="research">
    <span class="dot" aria-hidden="true"></span>
    <div class="research-top">${statIcon('research')}<span class="stat-name">Research</span><span class="stat-value">${r}</span>
      <span class="gate-label">${g.name}, sem ${g.sem}: needs ${g.need}</span></div>
    <div class="research-bar"><div class="stat-fill" data-to="${r}" style="width:${shownFrom.research}%"></div>
      <div class="gate-mark" style="left:${g.need}%"></div></div>
    ${rFloat}
  </div>`;

  let line1;
  if (!result && gameState.totalCards === 0) line1 = '<span class="teach">Drag the card, or tap an answer.</span>';
  else if (result) line1 = `<span class="last">Last:</span> ${formatDeltas(total) || 'no change'}`;
  else line1 = '';
  const line2 = dangerMessage();

  let milestoneBox = '';
  const thresholds = { ms_quals: qualsNeed(), ms_committee_1: 25, ms_committee_2: 35, ms_defense: 30 };
  if (card.milestone && thresholds[card.id] !== undefined) {
    const need = thresholds[card.id];
    const ok = r >= need;
    const outcome = card.id === 'ms_quals' ? (ok ? 'You will pass. The answer decides how it feels.' : 'You will not pass this time. Retake next semester.')
      : card.id === 'ms_defense' ? (ok ? 'Enough to defend.' : 'Not enough. The committee will say no.')
      : (ok ? 'They are satisfied.' : 'They were not impressed. Mind already took the hit.');
    milestoneBox += `<div class="research-reveal ${ok ? 'ok' : 'warn'}">Research ${r} of ${need} needed. ${outcome}</div>`;
  }
  const networkFlavor = {
    ms_committee_1: [
      { min: 45, text: 'One committee member mentioned a contact at a biotech firm in passing. You filed it away.' },
      { min: 20, text: 'Your committee is academically sharp. Outside of academia, the network is thinner.' },
      { min: 0,  text: 'You realize you don\'t know anyone outside this department. The committee doesn\'t either.' }
    ],
    ms_defense_sched: [
      { min: 50, text: 'People at conferences know your name. The job search has already started informally.' },
      { min: 25, text: 'You have some contacts. The market will tell you if it\'s enough.' },
      { min: 0,  text: 'The network you haven\'t built is starting to feel like the kind of thing that matters.' }
    ]
  };
  if (card.milestone && networkFlavor[card.id]) {
    const hint = networkFlavor[card.id].find(t => gameState.network >= t.min);
    if (hint) milestoneBox += `<div class="network-flavor">${hint.text}</div>`;
  }

  if (fresh) result.shown = true;

  return `<div class="play-screen">
    <div class="topbar">
      <div class="sem"><strong>Semester ${gameState.semester}</strong> of 10<span class="phase">${SEM_LABELS[gameState.semester] || ''}</span></div>
      <div class="who">${ARCHETYPE_DATA[gameState.archetype].name}${gameState.piType ? `<br>${PI_DATA[gameState.piType].name}` : ''}</div>
      <button class="help-btn" onclick="showHelp()" aria-label="How to play">?</button>
    </div>
    <div class="meters">
      <div class="stats-bar">${STAT_DEFS.map(meter).join('')}</div>
      ${research}
    </div>
    <div class="news" aria-live="polite">
      <div class="news-1" id="news1" data-base="${escapeText(line1)}">${line1}</div>
      <div class="news-2 ${line2 ? 'alert' : ''}">${line2}</div>
    </div>
    <div class="card-container">
      <div class="card-ghost"></div>
      <div class="card" id="card">
        <div class="card-tag">${escapeText(card.tag)}</div>
        <div class="card-title">${card.title}</div>
        ${milestoneBox}
        <div class="card-body" id="cardBody">${card.body}</div>
        <div class="card-art-wrap" aria-hidden="true">${cardArt(card)}</div>
        <div class="card-controls">
          <button class="card-btn left" data-side="left"><span class="btn-label"><span class="side-arrow">←</span> ${card.cL}</span><span class="confirm">Tap again to choose</span></button>
          <button class="card-btn right" data-side="right"><span class="btn-label">${card.cR} <span class="side-arrow">→</span></span><span class="confirm">Tap again to choose</span></button>
        </div>
      </div>
    </div>
    <div class="controls-hint">← → to lean, again to choose</div>
  </div>`;
}

// ── Ending ────────────────────────────────────────────────────────

function renderEnding() {
  recordRun();
  const ending = gameState.ending;
  const networkMsg = gameState.network > 50
    ? 'Multiple paths are open. Industry reached out before you even updated your LinkedIn. The degree and the network landed at the same time.'
    : gameState.network > 25
    ? 'You have a few leads: people who remember your name from conferences, a cold email that got a warm reply. It\'s enough to start.'
    : 'The degree is real. The network isn\'t there yet. You\'ll spend the next few months explaining your work to people who weren\'t in the room.';
  const archName = ARCHETYPE_DATA[gameState.archetype]?.name || 'Unknown';
  const piName = gameState.piType ? PI_DATA[gameState.piType]?.name : null;
  const runInfo = piName ? `${archName} · ${piName}` : archName;
  const piPhrase = piName ? ` under ${piName}` : '';
  const sem = gameState.semester;
  const cards = gameState.totalCards;
  const masterBody = gameState.network > 30
    ? 'The master\'s opens a door your PhD would have kept closed. A contact from the conference two years ago is now a hiring manager. You send one email. They respond in an hour.'
    : 'The master\'s is real and the expertise is yours. What comes next is less clear. You update your resume. You start from scratch.';
  const masterCause = {
    'Failed Quals (3 attempts)': 'You failed the qualifying exam three times.',
    'Insufficient Research': 'Your Research was under 30 at the defense.',
    'Delayed Too Long': 'You pushed the defense back one time too many.',
    'Time': 'You ran out of semesters.',
  };
  const endingData = {
    defended: {
      title: 'Dr. You',
      body: `You stood in front of your committee and defended your research. There were hard questions. You answered most of them. They approved you anyway. Dr. is a title you now possess.<br><br>${networkMsg}`,
      shareText: `Played ${archName}${piPhrase} and actually made it to defense. Semester ${sem}, ${cards} cards.\nUGA Grad Survivor:`,
    },
    mastered_out: {
      title: 'You Got the Master\'s',
      cause: masterCause[gameState.cause] || '',
      body: masterBody,
      shareText: `${archName}${piPhrase}. Left with a master\'s in semester ${sem}. Nobody\'s calling it quitting.\nUGA Grad Survivor:`,
    },
    burnt_out: {
      title: 'Burnt Out', cause: 'Mind hit 0.',
      body: 'The 2am sessions. The unanswered emails. The feedback that felt more like verdict than guidance. It accumulated until it didn\'t. Your mind needed rest. The program didn\'t stop to notice.',
      shareText: `${archName}${piPhrase}. The mind gave out in semester ${sem}. ${cards} cards deep.\nUGA Grad Survivor:`,
    },
    hospitalized: {
      title: 'Hospitalized', cause: 'Body hit 0.',
      body: 'Your body filed a formal complaint. The all-nighters, the skipped meals, the stress. It all came due at once. The ER copay was $500. Your advisor asked when you\'d be back.',
      shareText: `${archName}${piPhrase}. Body filed a formal complaint in semester ${sem}. ${cards} cards played.\nUGA Grad Survivor:`,
    },
    broke: {
      title: 'Financially Liquidated', cause: 'Wallet hit 0.',
      body: gameState.network > 30
        ? 'An email arrives before your card declines a second time. Someone you met at a poster session has a contract role. Two weeks of work. Enough to breathe. Networks pay out in strange moments.'
        : 'Your card declined at the vending machine in the department building. You have $3.47. There\'s no one to call. Your stipend doesn\'t arrive until the 15th. It is the 3rd.',
      shareText: `${archName}${piPhrase}. Card declined in semester ${sem}. The stipend wasn\'t enough.\nUGA Grad Survivor:`,
    },
    disappeared: {
      title: 'Disappeared', cause: 'Friends hit 0.',
      body: 'You stopped responding to messages. You stopped showing up to lab meeting. One day your desk was empty. Nobody knows when exactly you left. The department sent one email. Nobody followed up.',
      shareText: `${archName}${piPhrase}. Just stopped showing up in semester ${sem}. Nobody sent a follow-up.\nUGA Grad Survivor:`,
    },
  };

  const d = endingData[ending];
  if (!d) return '<div>Error loading ending.</div>';

  const networkHint = (['mastered_out', 'broke'].includes(ending) && gameState.network <= 30)
    ? `<div class="network-hint">Your network was thin this run. Conferences, collaborations and saying yes to people unlock a different version of this ending.</div>`
    : '';

  const why = ending !== 'defended' && gameState.lastConsequence
    ? `<div class="ending-why"><div class="why-head">${d.cause || 'What happened'}</div>${lastLine()}</div>`
    : (d.cause ? `<div class="ending-why"><div class="why-head">${d.cause}</div></div>` : '');
  const takeBackBtn = canTakeBack()
    ? `<button class="takeback-btn" onclick="takeBack()">Take back that last choice<span>Once per run</span></button>` : '';

  return `<div class="ending-screen">
    <div class="ending-art">${endingIcon(ending)}</div>
    <div class="ending-title">${d.title}</div>
    <div class="ending-sub">Semester ${sem} · ${runInfo}</div>
    ${why}
    ${takeBackBtn}
    <button class="play-again-btn" onclick="beginGame()">Play again</button>
    <div class="ending-body">${d.body}</div>
    ${networkHint}
    <div class="ending-stats">
      ${['mind', 'body', 'wallet', 'bonds', 'research'].map(k => `<div class="stat-line"><span>${statIcon(k)} ${STAT_NAMES[k]}</span><span>${gameState.st[k]}</span></div>`).join('')}
      <div class="stat-line sep"><span>Cards played</span><span>${cards}</span></div>
    </div>
    ${renderEndingGrid()}
    <div class="share-section">
      <div class="share-label">Share your run</div>
      <textarea id="shareText" class="share-textarea" rows="3" onclick="this.select()">${d.shareText}\nhttps://chenhsieh.github.io/UGA-grad-survivor/</textarea>
      <button class="share-btn" onclick="copyShare()">Copy</button>
      <div id="shareFeedback" class="share-feedback"></div>
    </div>
    <div class="footer-credit">Made by a UGA PhD student · chenhsieh.xyz</div>
  </div>`;
}

function renderEndingGrid() {
  const all = [
    { id: 'defended', name: 'Defended' }, { id: 'mastered_out', name: 'Master’s' },
    { id: 'burnt_out', name: 'Burnt Out' }, { id: 'hospitalized', name: 'Hospitalized' },
    { id: 'broke', name: 'Broke' }, { id: 'disappeared', name: 'Disappeared' }
  ];
  return `<div class="share-label">Endings found: ${save.endings.length} of 6</div>
  <div class="ending-grid">${all.map(e => {
    const unlocked = save.endings.includes(e.id);
    const now = e.id === gameState.ending;
    return unlocked
      ? `<div class="ending-slot unlocked ${now ? 'now' : ''}"><div class="slot-emoji">${endingIcon(e.id)}</div><div class="slot-name">${e.name}</div></div>`
      : `<div class="ending-slot locked"><div class="slot-lock">?</div><div class="slot-name">Not yet</div></div>`;
  }).join('')}</div>
  <div class="run-meta">${save.archetypes.length} of 8 characters unlocked</div>`;
}

// ── Render ────────────────────────────────────────────────────────

function render() {
  const app = document.getElementById('app');
  resetLean();
  const phase = gameState.phase;
  if (phase === 'title') app.innerHTML = renderTitle();
  else if (phase === 'archetype') app.innerHTML = renderArchetype();
  else if (phase === 'pi_selection') app.innerHTML = renderPISelection();
  else if (phase === 'rotation_complete') app.innerHTML = renderRotationComplete();
  else if (phase === 'semester_advance') app.innerHTML = renderSemesterAdvance();
  else if (phase === 'play') app.innerHTML = renderPlay();
  else if (phase === 'ending') app.innerHTML = renderEnding();
  document.body.classList.toggle('in-play', phase === 'play');
  if (phase === 'play') {
    bindCard();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      app.querySelectorAll('.stat-fill[data-to]').forEach(el => { el.style.width = el.dataset.to + '%'; });
    }));
    const body = document.getElementById('cardBody');
    if (body) body.classList.toggle('overflows', body.scrollHeight > body.clientHeight + 4);
  }
  if (renderedPhase !== phase) {
    window.scrollTo(0, 0);
    if (phase !== 'title' && phase !== 'play') {
      app.querySelector('.pick-card.selected, .pick-card:not(.locked), .sem-advance-btn, .takeback-btn, .play-again-btn')?.focus({ preventScroll: true });
    }
  }
  renderedPhase = phase;
}

// ── Help ──────────────────────────────────────────────────────────

function showHelp() {
  if (helpVisible) return;
  helpOpener = document.activeElement;
  helpVisible = true;
  const overlay = document.createElement('dialog');
  overlay.className = 'help-overlay';
  overlay.id = 'helpOverlay';
  overlay.setAttribute('aria-labelledby', 'helpTitle');
  overlay.oncancel = function(ev) { ev.preventDefault(); closeHelp(); };
  overlay.onclick = function(ev) { if (ev.target === overlay) closeHelp(); };
  overlay.innerHTML = `
    <div class="help-content" tabindex="-1">
      <h2 id="helpTitle">How to play</h2>
      <p>Drag the card left or right to answer. Or tap an answer, then tap it again.</p>
      <p>While you lean toward an answer, dots appear on the bars it will move. A bigger dot means a bigger change. The dots never say up or down. The card does.</p>
      <div class="help-stat">${statIcon('mind')}<span><strong>Mind, Body, Wallet, Friends.</strong> If any of them hits 0, the run ends. Under 20 they turn red. Wallet or Friends under 20 also cost you Mind and Body every card.</span></div>
      <div class="help-stat">${statIcon('research')}<span><strong>Research</strong> is the long bar. The white mark is the next checkpoint. Reach semester 10 with enough Research to defend.</span></div>
      <p>If a choice ends your run, you can take it back once.</p>
      <details class="how">
        <summary>Why these rules?</summary>
        <p>The cards come from one student's bioinformatics PhD at the University of Georgia. The rules are hand-written, not a model of real data. Each answer moves the bars by a fixed amount, and your character and advisor scale some of those amounts.</p>
        <p>Money trouble and loneliness drain mind and body because that is how it felt. Research is slow and only matters at checkpoints, which is also how it felt. The stipend behind the Wallet bar was about $34,738 a year.</p>
      </details>
      <div class="theme-picker">
        <div class="share-label">Look</div>
        <div class="theme-btns">
          ${['classic','cold','terminal','zine','pixel','red'].map(t => {
            const labels = {cold:'Cold',terminal:'Terminal',zine:'Zine',pixel:'Pixel',classic:'Classic',red:'Crimson'};
            const active = (document.documentElement.getAttribute('data-theme') || 'classic') === t ? ' active' : '';
            return `<button class="theme-btn${active}" aria-pressed="${!!active}" data-theme="${t}" onclick="setTheme('${t}')">${labels[t]}</button>`;
          }).join('')}
        </div>
      </div>
      <button class="help-close" onclick="closeHelp()">Back to the game</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.showModal();
  overlay.querySelector('.help-content').focus();
}

function copyShare() {
  const textarea = document.getElementById('shareText');
  const text = textarea.value;
  const feedback = document.getElementById('shareFeedback');
  const done = () => { feedback.textContent = 'Copied.'; setTimeout(() => { feedback.textContent = ''; }, 3000); };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(() => { textarea.select(); document.execCommand('copy'); done(); });
  else { textarea.select(); document.execCommand('copy'); done(); }
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('uga_theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === t);
    b.setAttribute('aria-pressed', String(b.dataset.theme === t));
  });
}

function closeHelp() {
  helpVisible = false;
  const el = document.getElementById('helpOverlay');
  if (el) { el.close(); el.remove(); }
  if (helpOpener?.isConnected) helpOpener.focus({ preventScroll: true });
}
