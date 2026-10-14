let menuIndex = 0;

// ?seed=anything makes the card draws repeat exactly, so a reported run can be replayed.
(function seedFromUrl() {
  const m = typeof location !== 'undefined' && /[?&]seed=([^&]+)/.exec(location.search);
  if (!m) return;
  let s = 2166136261;
  for (const ch of decodeURIComponent(m[1])) s = Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0;
  Math.random = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
let undoSnapshot = null;

const SAVE_KEY = 'uga_grad_survivor_v2';
const RUN_KEY = 'uga_grad_survivor_run';   // the run in progress, so a reload does not lose it

// Research needed at each checkpoint. It rises through the PhD; the check happens after
// your answer, so an answer that adds Research can carry you over the line.
const GATE_NEED = { ms_quals: 20, ms_committee_1: 35, ms_committee_2: 50, ms_defense: 65 };
const COMMITTEE_PENALTY = { ms_committee_1: 10, ms_committee_2: 15 };
const QUALS_PENALTY = 15;
function gateNeed(id) {
  if (id === 'ms_quals' && gameState.archetype === 'biologist') return ARCHETYPE_DATA.biologist.rules.qualsResearch;
  return GATE_NEED[id];
}

let save = { version: 3, endings: [], archetypes: ['overachiever', 'vibe_coder', 'fun_haver', 'global_student', 'biologist'], unlockedPIs: ['micromanager', 'ghost', 'mentor', 'new_pi'], totalRuns: 0, totalDeaths: 0, bestSemester: 0 };
let gameState = {
  phase: 'title', archetype: null, piType: null, st: {mind:50, body:50, wallet:50, bonds:50, research:50}, semester: 1, cardCount: 0,
  totalCards: 0, network: 0, qualsAttempts: 0, memory: [], currentCard: null, ending: null, cause: null, nextMilestone: null, nextSemester: null, lastConsequence: null
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
  gameState.lastConsequence = null;
  gameState.ending = null;
  gameState.cause = null;
  gameState.nextMilestone = null;
  gameState.recorded = false;
  gameState.undoUsed = false;
  undoSnapshot = null;
  gameState.phase = 'play';
  save.totalRuns++;
  saveSave();
  startNextSemester();
  render();
}

function startNextSemester() {
  // Don't reset cardCount here — drawCard needs it >= 3 to serve the milestone
  let ms = getMilestoneForSemester(gameState.semester);
  // A failed qualifying exam comes back the next semester, after that semester's cards.
  if (gameState.semester > 4 && gameState.memory.includes('quals_retry_1') && !gameState.memory.includes('quals_passed')) {
    ms = MILESTONE_CARDS.find(c => c.id === 'ms_quals');
  }
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
  // Some cards tell the same story twice (two rent hikes); seeing one removes the other.
  cardPool = cardPool.filter(c => !(c.excludes && c.excludes.some(id => gameState.memory.includes(id))));
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
    // PI selection milestone triggers transition → then PI selection
    if (ms.piSelection) {
      gameState.phase = 'rotation_complete';
      return null;
    }
    return ms;
  }
  // If semester advanced but no milestone, reset for next semester
  if (gameState.cardCount >= 3) {
    gameState.cardCount = 0;
  }

  // Every run opens on the same first day.
  if (gameState.totalCards === 0 && !gameState.memory.includes('orientation')) {
    const opener = PHASE1_CARDS.find(c => c.id === 'orientation');
    if (opener) return opener;
  }

  if (cardPool.length === 0) cardPool = UNIVERSAL_CARDS.filter(c => !gameState.memory.includes(c.id));
  if (cardPool.length === 0) {
    gameState.phase = 'ending';
    gameState.ending = 'defended';
    return null;
  }

  return cardPool[Math.floor(Math.random() * cardPool.length)];
}

function snapStats() { return {...gameState.st, network: gameState.network}; }
function beginConsequence(choice) {
  gameState.lastConsequence = { choice, before: snapStats(), after: snapStats(), steps: [] };
}

function recordConsequenceStep(label) {
  const result = gameState.lastConsequence;
  if (!result) return;
  const deltas = {};
  const now = snapStats();
  Object.keys(result.before).forEach(stat => {
    const delta = now[stat] - result.after[stat];
    if (delta !== 0) deltas[stat] = delta;
  });
  if (Object.keys(deltas).length) result.steps.push({ label, deltas });
  result.after = now;
}

function choose(side) {
  const card = gameState.currentCard;
  if (!card) return;
  if (!(card.id === 'ms_rotation' && card.piSelection)) undoSnapshot = JSON.parse(JSON.stringify(gameState));

  // Handle PI selection (special milestone)
  if (card.id === 'ms_rotation' && card.piSelection) {
    // PI selection is handled by selectPI() function, not here
    return;
  }

  beginConsequence(side === 'left' ? card.cL : card.cR);
  const perk = ARCHETYPE_DATA[gameState.archetype].rules;
  let effects = side === 'left' ? card.eL : card.eR;

  // Defense delay check
  if (card.milestone && side === 'right' && card.id === 'ms_defense_sched' && gameState.memory.includes('defense_delayed')) {
    gameState.phase = 'ending';
    gameState.ending = 'mastered_out';
    gameState.cause = 'Delayed Too Long';
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
  recordConsequenceStep('Your choice');

  // CHECKPOINTS: Research is checked after the answer.
  const need = gateNeed(card.id);
  if (need !== undefined) {
    const passed = gameState.st.research >= need;
    gameState.lastConsequence.verdict = { id: card.id, passed, need };
    if (card.id === 'ms_defense' && !passed) {
      gameState.phase = 'ending'; gameState.ending = 'mastered_out'; gameState.cause = 'Insufficient Research';
      return render();
    }
    if (card.id === 'ms_quals' && !passed) {
      gameState.qualsAttempts++;
      gameState.memory.push('quals_retry_' + gameState.qualsAttempts);
      if (gameState.qualsAttempts >= 3) {
        gameState.phase = 'ending'; gameState.ending = 'mastered_out'; gameState.cause = 'Failed Quals (3 attempts)';
        return render();
      }
      gameState.st.mind = Math.max(0, gameState.st.mind - QUALS_PENALTY);
      recordConsequenceStep('Failed the exam');
      gameState.totalCards++;
      if (gameState.st.mind <= 0) { gameState.phase='ending'; gameState.ending='burnt_out'; gameState.cause='Mind'; return render(); }
      // Retake next semester, after that semester's cards.
      gameState.nextSemester = gameState.semester + 1;
      gameState.phase = 'semester_advance';
      return render();
    }
    if (COMMITTEE_PENALTY[card.id] && !passed) {
      gameState.st.mind = Math.max(0, gameState.st.mind - COMMITTEE_PENALTY[card.id]);
      recordConsequenceStep(`Committee wanted Research ${need}`);
    }
  }

  // POST-CHOICE ARCHETYPE EFFECTS
  if (gameState.archetype === 'overachiever' && gameState.totalCards % perk.everyCards === 0) {
    if (gameState.st.mind < perk.lowMind) {
      gameState.st.mind = Math.min(100, gameState.st.mind + perk.mindRecovery);
    }
  }
  if (gameState.archetype === 'gym_bro') {
    if (gameState.st.body < perk.bodyFloor) gameState.st.body = perk.bodyFloor;
  }
  if (gameState.archetype === 'double_agent') {
    const drainStats = ['mind', 'body', 'wallet', 'bonds'];
    const drainStat = drainStats[Math.floor(Math.random() * drainStats.length)];
    gameState.st[drainStat] = Math.max(0, gameState.st[drainStat] - perk.randomDrain);
  }
  recordConsequenceStep(ARCHETYPE_DATA[gameState.archetype].perk);

  // PASSIVE DRAIN: financial stress
  if (gameState.st.wallet < 20) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
    gameState.st.body = Math.max(0, gameState.st.body - 2);
  }
  recordConsequenceStep('Wallet under 20');

  // PASSIVE DRAIN: low bonds → isolation impairs cognition
  if (gameState.st.bonds < 20) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 1);
    gameState.st.body = Math.max(0, gameState.st.body - 1);
  }
  recordConsequenceStep('Friends under 20');

  // PASSIVE DRAIN: low research → anxiety and advisor pressure
  if (gameState.st.research < 15 && gameState.semester >= 3) {
    gameState.st.mind = Math.max(0, gameState.st.mind - 2);
  }
  if (gameState.st.research < 15 && gameState.semester >= 5) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 2);
  }
  recordConsequenceStep('Research under 15');

  // GLOBAL STUDENT: visa pressure in late game
  if (gameState.archetype === 'global_student' && gameState.semester >= perk.visaSemester) {
    gameState.st.mind = Math.max(0, gameState.st.mind - perk.visaDrain);
  }
  recordConsequenceStep('Visa pressure');

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
  beginConsequence('Semester change');
  // Cost of living: -1 wallet each semester
  gameState.st.wallet = Math.max(0, gameState.st.wallet - 1);
  recordConsequenceStep('Cost of living');
  if (gameState.st.wallet <= 0) { gameState.phase='ending'; gameState.ending='broke'; gameState.cause='Wallet'; return render(); }
  gameState.semester = gameState.nextSemester;
  // PhD isolation: bonds −1 per semester from sem 6 onward (fires once per advance, not per card)
  if (gameState.semester >= 6) {
    gameState.st.bonds = Math.max(0, gameState.st.bonds - 1);
    recordConsequenceStep('Late-PhD isolation');
    if (gameState.st.bonds <= 0) { gameState.phase='ending'; gameState.ending='disappeared'; gameState.cause='Bonds'; return render(); }
  }
  gameState.nextSemester = null;
  gameState.cardCount = 0;
  startNextSemester();
  gameState.phase = 'play';
  gameState.currentCard = drawCard(); // drawCard() may override phase to pi_selection
  render();
}

// Called from rotation_complete transition screen
function continueToPI() {
  gameState.phase = 'pi_selection';
  menuIndex = 0;
  render();
  setTimeout(() => highlightArchetype(0), 50);
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
  const perk = ARCHETYPE_DATA[arch]?.rules;
  const tag = card && card.tag ? card.tag : '';
  const techTags = ['Pipeline Failure', 'Pipeline', 'Pipeline'];
  const socialTags = ['Social', 'Human Existence', 'Athens Life', 'Social Drama', 'Lab Drama'];
  switch(arch) {
    case 'overachiever':
      // Post-choice effect handled in choose()
      break;
    case 'vibe_coder':
      if (techTags.includes(tag) && delta > 0) return Math.floor(delta * perk.techGain);
      if (socialTags.includes(tag) && delta < 0) return Math.floor(delta * perk.socialLoss);
      break;
    case 'fun_haver':
      if (stat === 'bonds' && delta > 0) return Math.floor(delta * perk.bondsGain);
      if (stat === 'research' && delta > 0) return Math.max(1, Math.floor(delta * perk.researchGain));
      break;
    case 'global_student':
      if (stat === 'bonds' && delta < 0) return Math.ceil(delta * perk.bondsLoss);
      break;
    case 'biologist':
      if (stat === 'research' && delta < 0 && techTags.includes(tag)) {
        if (gameState.st.bonds > perk.highBonds) return Math.ceil(delta * perk.supportedLoss);
        if (gameState.st.bonds < perk.lowBonds) return Math.floor(delta * perk.isolatedLoss);
      }
      if (stat === 'research' && delta > 0 && (tag === 'Lab Life' || tag === 'Lab Politics')) return Math.floor(delta * perk.labGain);
      break;
    case 'double_agent':
      if (stat === 'research' && delta > 0) return delta + perk.researchBonus;
      // Random drain handled in choose()
      break;
    case 'gym_bro':
      if (stat === 'wallet' && delta < 0) return Math.floor(delta * perk.loss);
      if (stat === 'mind' && delta < 0) return Math.floor(delta * perk.loss);
      // Body floor handled in choose()
      break;
    case 'neurodivergent':
      if (stat === 'mind') return Math.floor(delta * perk.mindChange);
      if (stat === 'research') return Math.floor(delta * perk.researchChange);
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


// ── Reading the state for the interface ─────────────────────────────

// What a choice will do to each meter, after the player's perks, before passive drains.
// The interface shows only which meters move and roughly how much, never the direction.
function predictEffects(side) {
  const card = gameState.currentCard;
  if (!card) return {};
  const effects = side === 'left' ? card.eL : card.eR;
  if (!effects) return {};
  const after = {...gameState.st};
  Object.entries(effects).forEach(([stat, delta]) => {
    if (!(stat in gameState.st)) return;
    let d = applyPerk(gameState.archetype, stat, delta, card);
    if (gameState.piType) d = applyPIPerk(gameState.piType, stat, d, card);
    after[stat] = Math.max(0, Math.min(100, after[stat] + d));
  });
  // A checkpoint you miss costs Mind on top of the answer.
  const need = gateNeed(card.id);
  if (need !== undefined && after.research < need) {
    const hit = card.id === 'ms_quals' ? (gameState.qualsAttempts < 2 ? QUALS_PENALTY : 0) : (COMMITTEE_PENALTY[card.id] || 0);
    after.mind = Math.max(0, after.mind - hit);
  }
  const out = {};
  Object.keys(after).forEach(stat => { if (after[stat] !== gameState.st[stat]) out[stat] = after[stat] - gameState.st[stat]; });
  return out;
}

function dotSize(delta) {
  const m = Math.abs(delta);
  if (!m) return 0;
  if (m <= 5) return 1;
  if (m <= 10) return 2;
  return 3;
}

function qualsNeed() { return gateNeed('ms_quals'); }

// The next research checkpoint, drawn as a mark on the Research bar.
function nextGate(sem = gameState.semester) {
  const mem = gameState.memory;
  if (!mem.includes('quals_passed')) {
    return { id: 'ms_quals', name: 'Qualifying exam', sem: Math.max(4, sem), need: qualsNeed(), miss: 'retake next semester, Mind −' + QUALS_PENALTY + '. Fail 3 times and you leave with a master’s' };
  }
  if (sem <= 6 && !mem.includes('committee_1_passed')) return { id: 'ms_committee_1', name: 'Committee meeting', sem: 6, need: GATE_NEED.ms_committee_1, miss: 'Mind −' + COMMITTEE_PENALTY.ms_committee_1 };
  if (sem <= 8 && !mem.includes('committee_2_passed')) return { id: 'ms_committee_2', name: 'Committee meeting', sem: 8, need: GATE_NEED.ms_committee_2, miss: 'Mind −' + COMMITTEE_PENALTY.ms_committee_2 };
  return { id: 'ms_defense', name: 'Defense', sem: 10, need: GATE_NEED.ms_defense, miss: 'no PhD, you leave with a master’s' };
}

// Save the run's ending once, however many times the ending screen is drawn.
function recordRun() {
  if (gameState.recorded) return;
  gameState.recorded = true;
  const ending = gameState.ending;
  save.bestSemester = Math.max(save.bestSemester || 0, gameState.semester);
  if (ending !== 'defended') save.totalDeaths++;
  if (!save.endings.includes(ending)) save.endings.push(ending);
  if (!save.archetypes.includes('double_agent') && gameState.semester >= 7) save.archetypes.push('double_agent');
  if (!save.archetypes.includes('gym_bro') && save.endings.includes('hospitalized')) save.archetypes.push('gym_bro');
  if (!save.archetypes.includes('neurodivergent') && save.endings.includes('burnt_out')) save.archetypes.push('neurodivergent');
  if (!save.unlockedPIs) save.unlockedPIs = ['micromanager', 'ghost', 'mentor', 'new_pi'];
  if (!save.unlockedPIs.includes('exploiter') && save.endings.includes('mastered_out')) save.unlockedPIs.push('exploiter');
  if (!save.unlockedPIs.includes('dynasty') && save.endings.includes('defended')) save.unlockedPIs.push('dynasty');
  save.archetypes = [...new Set(save.archetypes)];
  save.endings = [...new Set(save.endings)];
  save.lastArchetype = gameState.archetype;
  saveSave();
}

// One take-back per run: return to the card before the last choice.
function canTakeBack() {
  if (!undoSnapshot || gameState.undoUsed) return false;
  if (['broke', 'hospitalized', 'burnt_out', 'disappeared'].includes(gameState.ending)) return true;
  return gameState.ending === 'mastered_out' && gameState.cause === 'Delayed Too Long';
}
function takeBack() {
  if (!canTakeBack()) return;
  const snap = undoSnapshot;
  undoSnapshot = null;
  Object.keys(gameState).forEach(k => { delete gameState[k]; });
  Object.assign(gameState, snap);
  gameState.undoUsed = true;
  gameState.recorded = false;
  gameState.lastConsequence = null;
  gameState.phase = 'play';
  render();
}

// ── The run in progress survives a reload ─────────────────────────
function persistRun() {
  try {
    if (['play', 'semester_advance', 'rotation_complete', 'pi_selection'].includes(gameState.phase)) {
      localStorage.setItem(RUN_KEY, JSON.stringify({ v: 1, gameState, undoSnapshot }));
    } else if (gameState.phase === 'ending') {
      localStorage.removeItem(RUN_KEY);
    }
  } catch (e) {}
}
function savedRun() {
  try {
    const r = JSON.parse(localStorage.getItem(RUN_KEY));
    return r && r.v === 1 && r.gameState && ARCHETYPE_DATA[r.gameState.archetype] ? r : null;
  } catch (e) { return null; }
}
function resumeRun() {
  const r = savedRun();
  if (!r) return beginGame();
  Object.keys(gameState).forEach(k => { delete gameState[k]; });
  Object.assign(gameState, r.gameState);
  undoSnapshot = r.undoSnapshot || null;
  render();
}
