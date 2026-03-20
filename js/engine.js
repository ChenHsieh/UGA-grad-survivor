let menuIndex = 0;

const SAVE_KEY = 'uga_grad_survivor_v2';

let save = { version: 3, endings: [], archetypes: ['overachiever', 'vibe_coder', 'fun_haver', 'global_student', 'biologist'], unlockedPIs: ['micromanager', 'ghost', 'mentor', 'new_pi'], totalRuns: 0, totalDeaths: 0, bestSemester: 0 };
let gameState = {
  phase: 'title', archetype: null, piType: null, st: {mind:50, body:50, wallet:50, bonds:50, research:50}, semester: 1, cardCount: 0,
  totalCards: 0, network: 0, qualsAttempts: 0, memory: [], currentCard: null, ending: null, cause: null, nextMilestone: null, nextSemester: null
};

function getPhase(semester) {
  if (semester <= 2) return 1;
  if (semester <= 6) return 2;
  return 3;
}

function loadSave() {
  try {
    const loaded = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (loaded && loaded.version >= 3) { save = loaded; }
    // v2 or older saves get reset (new archetypes, research stat, PI system)
  } catch (e) {}
}
function saveSave() { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }

function selectArchetype(arch) {
  gameState.archetype = arch;
  const startStats = ARCHETYPE_DATA[arch].st;
  gameState.st = {...startStats};
  gameState.semester = 1;
  gameState.totalCards = 0;
  gameState.cardCount = 0;
  gameState.network = 0;
  gameState.qualsAttempts = 0;
  gameState.piType = null;
  gameState.memory = [];
  gameState.currentCard = null;
  gameState.ending = null;
  gameState.cause = null;
  gameState.nextMilestone = null;
  gameState.phase = 'play';
  save.totalRuns++;
  startNextSemester();
  render();
}

function startNextSemester() {
  // Don't reset cardCount here — drawCard needs it >= 3 to serve the milestone
  const ms = getMilestoneForSemester(gameState.semester);
  gameState.nextMilestone = ms;
}

function getMilestoneForSemester(sem) {
  return MILESTONE_CARDS.find(c => c.semester === sem) || null;
}

function drawCard() {
  const phase = getPhase(gameState.semester);
  let cardPool = [];
  if (phase === 1) cardPool = PHASE1_CARDS;
  else if (phase === 2) cardPool = PHASE2_CARDS;
  else cardPool = PHASE3_CARDS;

  cardPool = cardPool.concat(UNIVERSAL_CARDS);
  // Filter by semester range (cards with minSem/maxSem only appear in that window)
  const sem = gameState.semester;
  cardPool = cardPool.filter(c => {
    if (c.minSem && sem < c.minSem) return false;
    if (c.maxSem && sem > c.maxSem) return false;
    return true;
  });
  cardPool = cardPool.filter(c => !gameState.memory.includes(c.id));
  cardPool = cardPool.concat(CALLBACK_CARDS.filter(c => {
    if (gameState.memory.includes(c.id)) return false;
    if (c.requires && !c.requires.every(r => gameState.memory.includes(r))) return false;
    return true;
  }));

  // Add archetype-exclusive cards (weighted 2x for more frequent appearance)
  const archExclusive = EXCLUSIVE_CARDS.filter(c => c.exclusive === gameState.archetype && !gameState.memory.includes(c.id));
  archExclusive.forEach(c => { if (c.minSem && sem < c.minSem) return; if (c.maxSem && sem > c.maxSem) return; cardPool.push(c); cardPool.push(c); }); // 2x weight
  // Add PI-exclusive cards (weighted 2x)
  if (gameState.piType) {
    const piExclusive = PI_EXCLUSIVE_CARDS.filter(c => c.exclusive === gameState.piType && !gameState.memory.includes(c.id));
    piExclusive.forEach(c => { if (c.minSem && sem < c.minSem) return; if (c.maxSem && sem > c.maxSem) return; cardPool.push(c); cardPool.push(c); });
  }

  // Serve milestone card after 3 regular cards, if one exists for this semester
  if (gameState.cardCount >= 3 && gameState.nextMilestone) {
    const ms = gameState.nextMilestone;
    gameState.nextMilestone = null;
    // PI selection milestone triggers special UI
    if (ms.piSelection) {
      gameState.phase = 'pi_selection';
      menuIndex = 0;
      return null;
    }
    // Committee meeting: research check affects mind
    if (ms.id === 'ms_committee_1' && gameState.st.research < 25) {
      gameState.st.mind = Math.max(0, gameState.st.mind - 10);
    }
    if (ms.id === 'ms_committee_2' && gameState.st.research < 35) {
      gameState.st.mind = Math.max(0, gameState.st.mind - 15);
    }
    return ms;
  }
  // If semester advanced but no milestone, reset for next semester
  if (gameState.cardCount >= 3) {
    gameState.cardCount = 0;
  }

  if (cardPool.length === 0) cardPool = UNIVERSAL_CARDS.filter(c => !gameState.memory.includes(c.id));
  if (cardPool.length === 0) {
    gameState.phase = 'ending';
    gameState.ending = 'defended';
    return null;
  }

  return cardPool[Math.floor(Math.random() * cardPool.length)];
}

function choose(side) {
  const card = gameState.currentCard;
  if (!card) return;

  // Handle PI selection (special milestone)
  if (card.id === 'ms_rotation' && card.piSelection) {
    // PI selection is handled by selectPI() function, not here
    return;
  }

  let effects = side === 'left' ? card.eL : card.eR;

  // Defense delay check
  if (card.milestone && side === 'right' && card.id === 'ms_defense_sched' && gameState.memory.includes('defense_delayed')) {
    gameState.phase = 'ending';
    gameState.ending = 'mastered_out';
    gameState.cause = 'Delayed Too Long';
    return render();
  }

  // Quals failure check
  if (card.id === 'ms_quals' && gameState.st.research < (gameState.archetype === 'biologist' ? 30 : 25)) {
    gameState.qualsAttempts++;
    if (gameState.qualsAttempts >= 3) {
      gameState.phase = 'ending';
      gameState.ending = 'mastered_out';
      gameState.cause = 'Failed Quals (3 attempts)';
      return render();
    }
    // Retry next semester — push quals back
    gameState.st.mind = Math.max(0, gameState.st.mind - 15);
    gameState.memory.push('quals_retry_' + gameState.qualsAttempts);
    gameState.cardCount++;
    gameState.totalCards++;
    gameState.semester++;
    // Re-queue quals for next semester
    gameState.nextMilestone = MILESTONE_CARDS.find(c => c.id === 'ms_quals');
    gameState.currentCard = drawCard();
    render();
    return;
  }

  // Defense research gate
  if (card.id === 'ms_defense' && gameState.st.research < 30) {
    gameState.phase = 'ending';
    gameState.ending = 'mastered_out';
    gameState.cause = 'Insufficient Research';
    return render();
  }

  if (!effects) {
    gameState.cardCount++;
    gameState.totalCards++;
    gameState.semester++;
    startNextSemester();
    gameState.currentCard = drawCard();
    render();
    return;
  }

  // Apply effects with archetype and PI perks
  Object.entries(effects).forEach(([stat, delta]) => {
    if (stat === 'network') {
      // Hidden network score — not a visible stat
      gameState.network = Math.max(0, gameState.network + delta);
      return;
    }
    let finalDelta = applyPerk(gameState.archetype, stat, delta, card);
    if (gameState.piType) finalDelta = applyPIPerk(gameState.piType, stat, finalDelta, card);
    gameState.st[stat] = Math.max(0, Math.min(100, gameState.st[stat] + finalDelta));
  });

  // POST-CHOICE ARCHETYPE EFFECTS
  if (gameState.archetype === 'overachiever' && gameState.totalCards % 3 === 0) {
    if (gameState.st.mind < 20) {
      gameState.st.mind = Math.min(100, gameState.st.mind + 3);
    }
  }
  if (gameState.archetype === 'gym_bro') {
    if (gameState.st.body < 15) gameState.st.body = 15;
  }
  if (gameState.archetype === 'double_agent') {
    const drainStats = ['mind', 'body', 'wallet', 'bonds'];
    const drainStat = drainStats[Math.floor(Math.random() * drainStats.length)];
    gameState.st[drainStat] = Math.max(0, gameState.st[drainStat] - 2);
  }

  // PASSIVE DRAIN: financial stress
  if (gameState.st.wallet < 20) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 3);
    gameState.st.body = Math.max(0, gameState.st.body - 2);
  }

  // PASSIVE DRAIN: low bonds → isolation impairs cognition
  if (gameState.st.bonds < 20) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
    gameState.st.body = Math.max(0, gameState.st.body - 1);
  }

  // PASSIVE DRAIN: low research → anxiety and advisor pressure
  if (gameState.st.research < 20 && gameState.semester >= 3) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
  }
  if (gameState.st.research < 15 && gameState.semester >= 5) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 2);
  }

  // GLOBAL STUDENT: visa pressure in late game
  if (gameState.archetype === 'global_student' && gameState.semester >= 6) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 3);
  }

  // PASSIVE DRAIN: PhD isolation in late game
  if (gameState.semester >= 6) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
  }

  if (card.sets) card.sets.forEach(flag => { if (!gameState.memory.includes(flag)) gameState.memory.push(flag); });
  gameState.memory.push(card.id);

  gameState.totalCards++;
  gameState.cardCount++;

  // Check endings based on which stat died
  if (gameState.st.wallet <= 0) { gameState.phase='ending'; gameState.ending='broke'; gameState.cause='Wallet'; return render(); }
  if (gameState.st.body <= 0) { gameState.phase='ending'; gameState.ending='hospitalized'; gameState.cause='Body'; return render(); }
  if (gameState.st.mind <= 0) { gameState.phase='ending'; gameState.ending='burnt_out'; gameState.cause='Mind'; return render(); }
  if (gameState.st.bonds <= 0) { gameState.phase='ending'; gameState.ending='disappeared'; gameState.cause='Bonds'; return render(); }
  if (gameState.memory.includes('defended')) { gameState.phase='ending'; gameState.ending='defended'; return render(); }
  if (gameState.semester > 10 && !gameState.memory.includes('defended')) { gameState.phase='ending'; gameState.ending='mastered_out'; gameState.cause='Time'; return render(); }

  if (gameState.cardCount >= 3 && !gameState.nextMilestone) {
    const nextSem = gameState.semester + 1;
    if (nextSem > 10) {
      // Safety: should have already ended via defense or mastered_out checks above
      gameState.phase = 'ending'; gameState.ending = 'mastered_out'; gameState.cause = 'Time'; return render();
    }
    gameState.nextSemester = nextSem;
    gameState.phase = 'semester_advance';
    render();
    return;
  }

  gameState.currentCard = drawCard();
  render();
}

// Called from semester advance checkpoint screen
function continueSemester() {
  // Cost of living: -1 wallet each semester
  gameState.st.wallet = Math.max(0, gameState.st.wallet - 1);
  if (gameState.st.wallet <= 0) { gameState.phase='ending'; gameState.ending='broke'; gameState.cause='Wallet'; return render(); }
  gameState.semester = gameState.nextSemester;
  gameState.nextSemester = null;
  gameState.cardCount = 0;
  startNextSemester();
  gameState.phase = 'play';
  gameState.currentCard = drawCard(); // drawCard() may override phase to pi_selection
  render();
}

// PI SELECTION
function selectPI(piKey) {
  gameState.piType = piKey;
  gameState.cardCount = 0;
  gameState.semester++;
  startNextSemester();
  gameState.currentCard = drawCard();
  gameState.phase = 'play';
  render();
}

function applyPerk(arch, stat, delta, card) {
  const tag = card && card.tag ? card.tag : '';
  const techTags = ['Pipeline Failure', 'Pipeline', 'Pipeline'];
  const socialTags = ['Social', 'Human Existence', 'Athens Life', 'Social Drama', 'Lab Drama'];
  switch(arch) {
    case 'overachiever':
      // Post-choice effect handled in choose()
      break;
    case 'vibe_coder':
      if (techTags.includes(tag) && delta > 0) return Math.floor(delta * 1.5);
      if (socialTags.includes(tag) && delta < 0) return Math.floor(delta * 1.5);
      break;
    case 'fun_haver':
      if (stat === 'bonds' && delta > 0) return Math.floor(delta * 1.5);
      if (stat === 'mind' && delta < 0) return Math.floor(delta * 1.3);
      if (stat === 'research' && delta > 0) return Math.max(1, Math.floor(delta * 0.75));
      break;
    case 'global_student':
      if (stat === 'bonds' && delta < 0) return Math.ceil(delta * 0.75);
      break;
    case 'biologist':
      if (stat === 'research' && delta < 0 && techTags.includes(tag)) {
        if (gameState.st.bonds > 50) return Math.ceil(delta / 2);
        if (gameState.st.bonds < 30) return Math.floor(delta * 2);
      }
      if (stat === 'research' && delta > 0 && (tag === 'Lab Life' || tag === 'Lab Politics')) return Math.floor(delta * 1.3);
      break;
    case 'double_agent':
      if (stat === 'research' && delta > 0) return delta + 3;
      // Random drain handled in choose()
      break;
    case 'gym_bro':
      if (stat === 'wallet' && delta < 0) return Math.floor(delta * 1.3);
      if (stat === 'mind' && delta < 0) return Math.floor(delta * 1.3);
      // Body floor handled in choose()
      break;
    case 'neurodivergent':
      if (stat === 'mind') return Math.floor(delta * 1.5);
      if (stat === 'research') return Math.floor(delta * 1.3);
      break;
  }
  return delta;
}

function applyPIPerk(piType, stat, delta, card) {
  const tag = card && card.tag ? card.tag : '';
  const isAdvisor = tag === 'Advisor';
  switch(piType) {
    case 'micromanager':
      if (stat === 'research' && delta > 0) return Math.floor(delta * 1.2);
      if (stat === 'mind' && delta < 0 && isAdvisor) return Math.floor(delta * 1.3);
      break;
    case 'ghost':
      if (stat === 'research' && delta > 0) return Math.floor(delta * 0.8);
      break;
    case 'exploiter':
      if (stat === 'research' && delta > 0) return Math.floor(delta * 1.3);
      if (stat === 'wallet' && delta < 0) return Math.floor(delta * 1.3);
      if (stat === 'bonds' && delta < 0 && isAdvisor) return Math.floor(delta * 1.3);
      break;
    case 'mentor':
      if (delta < 0 && isAdvisor) return Math.min(delta + 1, 0);
      if (stat === 'bonds' && delta > 0 && isAdvisor) return Math.floor(delta * 1.2);
      if (stat === 'research' && delta > 0) return Math.min(delta, 10);
      break;
    case 'new_pi':
      if (stat === 'research' && delta > 0) return Math.floor(delta * 1.25);
      if (stat === 'mind' && delta < 0) return Math.floor(delta * 1.2);
      break;
    case 'dynasty':
      if (stat === 'wallet' && delta > 0) return Math.floor(delta * 1.2);
      if (stat === 'bonds' && delta < 0) return Math.floor(delta * 1.3);
      break;
  }
  return delta;
}
