let helpVisible = false;
let helpOpener = null;
let renderedPhase = null;

const STAT_DEFS = [
  { key: 'mind', name: 'Mind' },
  { key: 'body', name: 'Body' },
  { key: 'wallet', name: 'Wallet' },
  { key: 'bonds', name: 'Friends' },
];
const STAT_NAMES = { mind: 'Mind', body: 'Body', wallet: 'Wallet', bonds: 'Friends', research: 'Research', network: 'Contacts' };
// Plain words for a few card categories.
const TAG_LABELS = { 'Cruel': 'Unfair', 'Black Swan': 'Out of Nowhere', 'Privilege': 'Uneven Ground', 'MILESTONE': 'Checkpoint', 'Milestone': 'The Program' };
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
  const run = savedRun();
  const runLine = run ? `Semester ${run.gameState.semester} · ${ARCHETYPE_DATA[run.gameState.archetype].name}` : '';
  return `
    <div class="title-screen">
      <div class="title-art">${endingIcon('defended')}</div>
      <h1>UGA Grad <em>Survivor</em></h1>
      <p class="tagline">Ten semesters. Every card has two answers.<br>Keep four bars above zero, and do enough research to defend.</p>
      ${run ? `<button class="begin-btn" onclick="resumeRun()">Continue<span class="btn-sub">${runLine}</span></button>
      <button class="new-run-btn" onclick="beginGame()">New run</button>`
        : `<button class="begin-btn" onclick="beginGame()">${returning ? 'New run' : 'Begin'}</button>`}
      ${returning ? `<div class="title-meta">${save.endings.length} of 6 endings found · ${save.totalRuns} ${save.totalRuns === 1 ? 'run' : 'runs'}</div>` : ''}
      <div class="credits">by Chen Hsieh, a UGA bioinformatics PhD student</div>
    </div>`;
}

// ── Picking a path and an advisor ─────────────────────────────────

const ARCH_UNLOCK_HINTS = {
  double_agent:   'Opens once you reach semester 7',
  gym_bro:        'Opens once a run ends in the hospital',
  neurodivergent: 'Opens once a run ends burnt out',
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
          <span class="pick-blurb">${locked ? ARCH_UNLOCK_HINTS[key] || 'Opens later' : data.blurb}</span>
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
    const hint = key === 'exploiter' ? 'Opens once a run ends with a master’s' : key === 'dynasty' ? 'Opens once you defend' : 'Opens later';
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
  const g = nextGate(gameState.phase === 'semester_advance' ? gameState.nextSemester : gameState.semester);
  const r = gameState.st.research;
  const short = r < g.need;
  return `<div class="gate-line ${short ? 'short' : ''}">${statIcon('research')} Research <strong>${r}</strong>. ${g.name} in semester ${g.sem} needs ${g.need}.</div>`;
}

function lastLine() {
  const result = gameState.lastConsequence;
  if (!result) return '';
  const steps = result.steps.map(step => `<div class="why-step"><span class="why-label">${escapeText(step.label)}</span> ${formatDeltas(step.deltas)}</div>`).join('');
  const v = verdictText(result);
  return `<div class="why-box"><div class="why-choice">${escapeText(result.choice)}</div>${v ? `<div class="why-verdict ${result.verdict.passed ? 'ok' : 'bad'}">${v}</div>` : ''}${steps || '<div class="why-step">No change.</div>'}</div>`;
}

function verdictText(result) {
  const v = result && result.verdict;
  if (!v) return '';
  if (v.id === 'ms_quals') return v.passed ? 'Qualifying exam passed.' : 'Qualifying exam failed. Retake next semester.';
  if (v.id === 'ms_defense') return v.passed ? 'Defended.' : 'Not enough Research to defend.';
  return v.passed ? 'Committee satisfied.' : 'Committee unhappy.';
}

function renderRotationComplete() {
  return `<div class="semester-advance-screen">
    <div class="sem-advance-badge">Semester 1 done · rotations over</div>
    <div class="sem-advance-title">Choose your lab</div>
    <div class="sem-advance-flavor">Rotations are over. Now you pick the lab you will stay in, and the professor who runs it becomes your advisor until you graduate.</div>
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
    5: gameState.memory.includes('quals_passed') ? "Past the exam. The project is yours now. Nobody tells you what to do next." : "The exam is still ahead of you. The retake is this semester.",
    6: gameState.memory.includes('quals_passed') ? "Committee season. Everyone wants a progress report. You have a PowerPoint." : "Last chance at the exam. A third miss ends the PhD with a master’s.",
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
    <div class="sem-advance-cost">${next >= 6 ? 'Starting the semester costs Wallet −1 (rent goes up) and Friends −1 (late PhD years are lonely).' : 'Starting the semester costs Wallet −1: rent goes up.'}</div>
    <button class="sem-advance-btn" onclick="continueSemester()">Start semester ${next}</button>
  </div>`;
}

// ── Play ──────────────────────────────────────────────────────────

function dangerMessage() {
  const st = gameState.st;
  const g = nextGate();
  const bars = STAT_DEFS.map(s => ({ ...s, v: st[s.key] })).sort((a, b) => a.v - b.v);
  const list = arr => arr.length === 1 ? arr[0] : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const critical = bars.filter(b => b.v <= 10);
  if (critical.length) return `${list(critical.map(b => `${b.name} ${b.v}`))}. At 0 the run ends.`;
  if (st.wallet < 20) return 'Wallet under 20 costs Mind and Body every card.';
  if (st.bonds < 20) return 'Friends under 20 costs Mind and Body every card.';
  const onGateCard = gameState.currentCard && gameState.currentCard.id === g.id;
  if (!onGateCard && g.sem === gameState.semester && st.research < g.need) return `${g.name} this semester: Research ${g.need} needed, you have ${st.research}.`;
  if (st.research < 15 && gameState.semester >= 3) return 'Research under 15: your advisor’s worry costs Mind.';
  const low = bars.filter(b => b.v <= DANGER);
  if (low.length) return `${list(low.map(b => b.name))} ${low.length > 1 ? 'are' : 'is'} low. Watch for big dots.`;
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
      <div class="stat-top">${statIcon(s.key)}<span class="stat-name">${s.name}</span></div>
      <div class="stat-row"><div class="stat-bar"><div class="stat-fill" data-to="${v}" style="width:${shownFrom[s.key]}%"></div></div><span class="stat-value">${v}</span></div>
      ${float}
    </div>`;
  };

  const g = nextGate();
  const r = st.research;
  const rFloat = fresh && total.research ? `<span class="float r-float ${total.research > 0 ? 'up' : 'down'}">${signed(total.research)}</span>` : '';
  const gateNow = g.sem === gameState.semester;
  const research = `<div class="research ${r < g.need ? (gateNow ? 'short now' : 'short') : 'met'}" data-stat="research">
    <span class="dot" aria-hidden="true"></span>
    <div class="research-top">${statIcon('research')}<span class="stat-name">Research</span><span class="stat-value">${r}</span>${rFloat}
      <span class="gate-label">${g.name}, sem ${g.sem}: needs ${g.need}</span></div>
    <div class="research-bar"><div class="stat-fill" data-to="${r}" style="width:${shownFrom.research}%"></div>
      <div class="gate-mark" style="left:${g.need}%"></div></div>
  </div>`;

  const finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let line1;
  const verdict = verdictText(result);
  if (!result && gameState.totalCards === 0) line1 = `<span class="teach">${finePointer ? 'Drag the card, or click an answer.' : 'Drag the card, or tap an answer twice.'}</span>`;
  else if (result) line1 = `${verdict ? `<span class="verdict ${result.verdict.passed ? 'ok' : 'bad'}">${verdict}</span>` : '<span class="last">Last:</span>'} ${formatDeltas(total) || 'no change'}`;
  else line1 = '';
  let line2 = dangerMessage();
  const a = ARCHETYPE_DATA[gameState.archetype];
  const intro = !line2 && gameState.totalCards === 0 ? `You are ${a.name}: ${a.blurb.split('. ')[0].replace(/\.$/, '').replace(/^./, c => c.toLowerCase())}.` : '';

  let milestoneBox = '';
  const need = gateNeed(card.id);
  if (card.milestone && need !== undefined) {
    const reach = Math.max(predictEffects('left').research || 0, predictEffects('right').research || 0);
    const miss = card.id === 'ms_quals' ? (gameState.qualsAttempts >= 2 ? 'third miss ends the PhD with a master’s' : `retake next semester, Mind −${QUALS_PENALTY}`)
      : card.id === 'ms_defense' ? 'no PhD, you leave with a master’s' : `Mind −${COMMITTEE_PENALTY[card.id]}`;
    const state = r >= need ? 'ok' : r + reach >= need ? 'close' : 'warn';
    const tail = state === 'ok' ? 'Checked after you answer.'
      : state === 'close' ? `Short by ${need - r}. One answer adds Research before the check.`
      : `Short by ${need - r}. Below the line: ${miss}.`;
    milestoneBox += `<div class="research-reveal ${state}">Needs Research ${need}. You have ${r}. ${tail}</div>`;
  }
  const networkFlavor = {
    ms_committee_1: [
      { min: 45, text: 'One committee member mentioned a contact at a biotech firm in passing. You filed it away.' },
      { min: 20, text: 'Your committee is academically sharp. Outside of academia, the network is thinner.' },
      { min: 0,  text: 'Career contacts: almost none. You don\'t know anyone outside this department. The committee doesn\'t either.' }
    ],
    ms_defense_sched: [
      { min: 50, text: 'People at conferences know your name. The job search has already started informally.' },
      { min: 25, text: 'You have some contacts. The market will tell you if it\'s enough.' },
      { min: 0,  text: 'Career contacts: almost none. That is starting to feel like the kind of thing that matters.' }
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
      <div class="news-2 ${line2 ? 'alert' : ''}">${line2 || intro}</div>
    </div>
    <div class="card-container">
      <div class="card-ghost"></div>
      <div class="card" id="card">
        <div class="card-tag">${escapeText(TAG_LABELS[card.tag] || card.tag)}</div>
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
    : 'The degree is real. Your career contacts are thin. You\'ll spend the next few months explaining your work to people who weren\'t in the room.';
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
    'Insufficient Research': `Your Research was under ${GATE_NEED.ms_defense} at the defense.`,
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
    ? `<div class="network-hint">Your career contacts were thin this run. Conferences, collaborations and saying yes to people lead to a different version of this ending.</div>`
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
      <div class="stat-line"><span>${statIcon('network')} Career contacts</span><span>${gameState.network}</span></div>
      <div class="stat-line sep"><span>Cards played</span><span>${cards}</span></div>
    </div>
    ${renderEndingGrid()}
    <div class="share-section">
      <div class="share-label">Share your run</div>
      <textarea id="shareText" class="share-textarea" rows="3" onclick="this.select()">${d.shareText}\nhttps://chenhsieh.github.io/UGA-grad-survivor/</textarea>
      <button class="share-btn" onclick="copyShare()">Copy the text</button>
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
  <div class="run-meta">${save.totalRuns <= 1 ? 'Next run you choose who to play. ' : ''}${save.archetypes.length} of 8 characters open.</div>`;
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
    // Change numbers play once, then leave, so they cannot replay later.
    app.querySelectorAll('.float').forEach(el => el.addEventListener('animationend', () => el.remove()));
  }
  persistRun();
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
      <p>Drag the card left or right to answer. Or tap an answer to preview it, then tap it again to choose. With a mouse, one click chooses.</p>
      <p>While you lean toward an answer, dots appear on the bars it will move. A bigger dot means a bigger change. The dots never say up or down. The card does.</p>
      <div class="help-stat">${statIcon('mind')}<span><strong>Mind, Body, Wallet, Friends.</strong> If any of them hits 0, the run ends. At 20 or below they turn red. Wallet or Friends under 20 also cost you Mind and Body every card.</span></div>
      <div class="help-stat">${statIcon('research')}<span><strong>Research</strong> is the long bar. The line across it is what the next exam or committee meeting needs. Each checkpoint asks for more: ${qualsNeed()}, ${GATE_NEED.ms_committee_1}, ${GATE_NEED.ms_committee_2}, then ${GATE_NEED.ms_defense} to defend in semester 10.</span></div>
      <div class="help-stat">${statIcon('network')}<span><strong>Career contacts</strong> come from conferences and saying yes to people. They never end a run, but they change how your ending reads.</span></div>
      <p>If a choice ends your run, you can take it back once.</p>
      <details class="how">
        <summary>Words on the cards</summary>
        <p><strong>PI</strong>: the professor who runs a lab, your advisor. <strong>Rotation</strong>: a short trial stay in a lab before you pick one. <strong>Committee</strong>: the professors who check your progress. <strong>Cluster</strong> or <strong>HPC</strong>: the shared campus supercomputer. <strong>SSH</strong>: the command that logs you in to it. <strong>Pipeline</strong>: a chain of analysis steps run as code. <strong>RNA-seq</strong>: measuring which genes are switched on. <strong>Postdoc</strong>: a short research job after the PhD. <strong>ABD</strong>: all but dissertation. <strong>Desk-rejected</strong>: turned down by the editor without review. <strong>DOI</strong>: the permanent ID of a paper.</p>
      </details>
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
