let helpVisible = false;

function renderTitle() {
  return `
    <div class="title-screen">
      <h1>UGA GRAD <em>Survivor</em></h1>
      <div class="sub">BIOINFORMATICS EDITION</div>
      <div class="tagline">A card game about surviving a PhD on \$34,738/year.<br>6 endings. 8 archetypes. 6 advisors. Swipe to find out.</div>
      <button class="begin-btn" onclick="gameState.phase='archetype'; menuIndex=0; render()">Begin</button>
      <div class="press-hint">PRESS SPACE TO START</div>
      <div class="credits">by Chen Hsieh, UGA Bioinformatics PhD Candidate</div>
    </div>
  `;
}

function renderArchetype() {
  const archs = Object.entries(ARCHETYPE_DATA);
  const selectable = getSelectableArchetypes();
  let selectIdx = 0;
  let html = `<div class="archetype-screen"><div class="screen-title">Choose Your Path</div><div class="screen-sub">↑↓ or W/S to browse · Space to select</div>`;
  archs.forEach(([key, data]) => {
    const locked = !save.archetypes.includes(key);
    const isFirst = !locked && key === selectable[0];
    const s = data.st;
    html += `
      <div class="arch-card ${locked ? 'locked' : ''} ${isFirst ? 'selected' : ''}" ${!locked ? `onclick="selectArchetype('${key}')"` : ''}>
        <div class="arch-emoji">${data.emoji}</div>
        <div class="arch-name">${data.name}</div>
        <div class="arch-perk">${data.perk}</div>
        <div class="arch-desc">${data.desc}</div>
        <div class="arch-stats">
          <span>🧠 ${s.mind}</span>
          <span>💪 ${s.body}</span>
          <span>💰 ${s.wallet}</span>
          <span>🤝 ${s.bonds}</span>
          <span>📊 ${s.research}</span>
        </div>
        ${locked ? `<div class="arch-locked-msg">🔒 Unlock by playing</div>` : ''}
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function renderRotationComplete() {
  const st = gameState.st;
  return `<div class="semester-advance-screen">
    <div class="sem-advance-badge">✓ SEMESTER 1 COMPLETE · ROTATIONS END</div>
    <div class="sem-advance-done-label">The Naive Years</div>
    <div class="sem-advance-title">Choose Your Lab</div>
    <div class="sem-advance-next-label">The Most Important Decision of Your PhD</div>
    <div class="sem-advance-flavor">You spent the semester rotating through labs. You've seen the famous PI with no time for students. The warm one with no publications. The new one still figuring it out.<br><br>Now you have to commit. One advisor. One research direction. The next four to six years of your life.</div>
    <div class="sem-advance-stats">
      <span>🧠 ${st.mind}</span>
      <span>💪 ${st.body}</span>
      <span>💰 ${st.wallet}</span>
      <span>🤝 ${st.bonds}</span>
      <span>📊 ${st.research}</span>
    </div>
    <button class="sem-advance-btn" onclick="continueToPI()">Choose Your Advisor →</button>
    <div style="font-size:9px;color:#3a3530;margin-top:12px;letter-spacing:1px">PRESS SPACE TO CONTINUE</div>
  </div>`;
}

function renderPISelection() {
  const pis = Object.entries(PI_DATA);
  const unlocked = save.unlockedPIs || ['micromanager', 'ghost', 'mentor', 'new_pi'];
  let html = `<div class="archetype-screen">
    <div class="screen-title">Choose Your Advisor</div>
    <div class="screen-sub">↑↓ or W/S to browse · Space to select</div>`;
  pis.forEach(([key, data]) => {
    const locked = !unlocked.includes(key);
    html += `
      <div class="arch-card ${locked ? 'locked' : ''}" ${!locked ? `onclick="selectPI('${key}')"` : ''}>
        <div class="arch-emoji">${data.emoji}</div>
        <div class="arch-name">${data.name}</div>
        <div class="arch-desc">${data.desc}</div>
        ${locked ? `<div class="arch-locked-msg">🔒 Unlock by playing</div>` : ''}
      </div>
    `;
  });
  html += `</div>`;
  return html;
}

function renderSemesterAdvance() {
  const done = gameState.semester;
  const next = gameState.nextSemester;
  const semLabels = {
    1:'The Naive Years', 2:'The Naive Years',
    3:'The Grind', 4:'The Grind', 5:'Deep In It', 6:'Deep In It',
    7:'The Reckoning', 8:'Career Crossroads', 9:'The Final Push', 10:'Defense or Bust'
  };
  const flavors = {
    3: "First year is officially behind you. The qualifying exam is out there, somewhere in the fog.",
    4: "The grind is real. Your brain hurts in a productive way. Quals are coming.",
    5: "Post-quals. The project is yours now. Nobody tells you what to do next.",
    6: "Committee season. Everyone wants a progress report. You have a PowerPoint.",
    7: "You've been here long enough to have strong opinions about the grad lounge coffee.",
    8: "The end is theoretically visible. You've written more than you ever thought possible.",
    9: "One more push. Defense is almost within reach.",
    10: "Final semester. Defense or bust. No more semesters after this one."
  };
  const st = gameState.st;
  return `<div class="semester-advance-screen">
    <div class="sem-advance-badge">✓ SEMESTER ${done} COMPLETE</div>
    <div class="sem-advance-done-label">${semLabels[done] || ''}</div>
    <div class="sem-advance-title">Entering Semester ${next}</div>
    <div class="sem-advance-next-label">${semLabels[next] || ''}</div>
    <div class="sem-advance-flavor">${flavors[next] || ''}</div>
    <div class="sem-advance-stats">
      <span>🧠 ${st.mind}</span>
      <span>💪 ${st.body}</span>
      <span>💰 ${st.wallet}</span>
      <span>🤝 ${st.bonds}</span>
      <span>📊 ${st.research}</span>
    </div>
    <div class="sem-advance-cost">Cost of living: Wallet −1</div>
    <button class="sem-advance-btn" onclick="continueSemester()">Enter Semester ${next} →</button>
    <div style="font-size:9px;color:#3a3530;margin-top:12px;letter-spacing:1px">PRESS SPACE TO CONTINUE</div>
  </div>`;
}

function fxHints(fx) {
  if (!fx) return '';
  const icons = {mind:'🧠', body:'💪', wallet:'💰', bonds:'🤝', research:'📊'};
  return '<div class="fx-hints">' + Object.entries(fx).map(([k,v]) => {
    const arrow = v > 0 ? '↑' : '↓';
    const cls = v > 0 ? 'up' : 'down';
    return `<span class="fx-hint ${cls}">${icons[k]||k}${arrow}</span>`;
  }).join('') + '</div>';
}

function renderPlay() {
  if (!gameState.currentCard) gameState.currentCard = drawCard();
  const card = gameState.currentCard;
  const phase = getPhase(gameState.semester);
  const semLabels = {
    1:'The Naive Years', 2:'The Naive Years',
    3:'The Grind', 4:'The Grind', 5:'Deep In It', 6:'Deep In It',
    7:'The Reckoning', 8:'Career Crossroads', 9:'The Final Push', 10:'Defense or Bust'
  };

  let html = `<div class="header">
    <h1>UGA Grad <em>Survivor</em></h1>
    <div class="sub">${gameState.archetype ? ARCHETYPE_DATA[gameState.archetype].name.toUpperCase() : 'UNKNOWN'}</div>
    <div class="semester-badge">Semester ${gameState.semester}/10</div>
    <div class="phase-label">${semLabels[gameState.semester] || 'The Reckoning'}</div>
  </div>`;

  const statDefs = [
    {key:'mind', emoji:'🧠', name:'Mind'}, {key:'body', emoji:'💪', name:'Body'},
    {key:'wallet', emoji:'💰', name:'Wallet'}, {key:'bonds', emoji:'🤝', name:'Bonds'},
    {key:'research', emoji:'📊', name:'Research'}
  ];
  html += `<div class="stats-bar">${statDefs.map(s => {
    const v = gameState.st[s.key];
    const zone = v > 50 ? 'green' : v > 25 ? 'yellow' : 'red';
    return `<div class="stat-item"><div class="stat-top"><span class="stat-emoji">${s.emoji}</span><span class="stat-name">${s.name}</span><span class="stat-value">${v}</span></div><div class="stat-bar ${zone}"><div class="stat-fill" style="width:${v}%"></div></div></div>`;
  }).join('')}</div>`;

  html += `<div class="card-container">
    <div class="card-ghost"></div>
    <div class="card-ghost"></div>
    <div class="card" id="card" ontouchstart="startDrag(event)" ontouchmove="moveDrag(event)" ontouchend="endDrag(event)" onmousedown="startDrag(event)" onmousemove="moveDrag(event)" onmouseup="endDrag(event)" onmouseleave="endDrag(event)">
      <div><div class="card-emoji">${card.emoji}</div><div class="card-tag">${card.tag}</div><div class="card-title">${card.title}</div></div>
      <div class="card-body">${card.body}</div>
      <div class="card-hints">
        <div class="card-hint" id="hintL">${card.cL}</div>
        <div class="card-hint" id="hintR">${card.cR}</div>
      </div>
      <div class="card-controls">
        <button class="card-btn left" onclick="choose('left')">← ${card.cL}${fxHints(card.eL)}</button>
        <button class="card-btn right" onclick="choose('right')">${card.cR} →${fxHints(card.eR)}</button>
      </div>
    </div>
  </div>
  <div class="controls-hint">SWIPE · CLICK · ← A/D →</div>
  <button class="help-btn" onclick="showHelp()" title="How to play">?</button>`;

  return html;
}

function renderEnding() {
  const ending = gameState.ending;
  const networkMsg = gameState.network > 30
    ? 'Recruiters are lining up. Your LinkedIn is ready.<br><br><em>Coming soon: Industry Escape Room</em>'
    : 'You have the degree but not many leads.<br><br><em>Coming soon: Post-Doc Purgatory</em>';
  const archName = ARCHETYPE_DATA[gameState.archetype]?.name || 'Unknown';
  const piName = gameState.piType ? PI_DATA[gameState.piType]?.name : null;
  const runInfo = piName ? `${archName} · ${piName}` : archName;
  const sem = gameState.semester;
  const cards = gameState.totalCards;
  const endingData = {
    defended: {
      emoji: '🎓', title: 'Dr. You',
      subtitle: `Semester ${sem} · ${runInfo}`,
      body: `You stood in front of your committee and defended your research. There were hard questions. You answered most of them. They approved you anyway. Dr. is a title you now possess.<br><br>${networkMsg}`,
      shareText: `Defended. ${runInfo}. Semester ${sem}/10, ${cards} cards played.\nUGA Grad Survivor:`,
    },
    mastered_out: {
      emoji: '📜', title: 'You Got the Master\'s',
      subtitle: `Semester ${sem} · ${runInfo}`,
      body: 'Nobody calls this failing. The program does, technically. You leave with a master\'s, real expertise, and a clearer sense of what you actually want.',
      shareText: `Mastered out in semester ${sem}. ${runInfo}. ${cards} cards played.\nUGA Grad Survivor:`,
    },
    burnt_out: {
      emoji: '🧠', title: 'Burnt Out',
      subtitle: `Semester ${sem} · ${runInfo}`,
      body: 'The 2am sessions. The unanswered emails. The feedback that felt more like verdict than guidance. It accumulated until it didn\'t. Your mind needed rest. The program didn\'t stop to notice.',
      shareText: `Burnt out in semester ${sem}. ${runInfo}. ${cards} cards played.\nUGA Grad Survivor:`,
    },
    hospitalized: {
      emoji: '🏥', title: 'Hospitalized',
      subtitle: `Semester ${sem} · ${runInfo}`,
      body: 'Your body filed a formal complaint. The all-nighters, the skipped meals, the stress — it all came due at once. The ER copay was $500. Your advisor asked when you\'d be back.',
      shareText: `Hospitalized in semester ${sem}. ${runInfo}. ${cards} cards played.\nUGA Grad Survivor:`,
    },
    broke: {
      emoji: '💸', title: 'Financially Liquidated',
      subtitle: `Semester ${sem} · ${runInfo}`,
      body: 'Your card declined at the vending machine in Brooks Hall. You have $3.47. Your stipend doesn\'t arrive until the 15th. It is the 3rd.',
      shareText: `Ran out of money in semester ${sem}. ${runInfo}. ${cards} cards played.\nUGA Grad Survivor:`,
    },
    disappeared: {
      emoji: '👻', title: 'Disappeared',
      subtitle: `Semester ${sem} · ${runInfo}`,
      body: 'You stopped responding to messages. You stopped showing up to lab meeting. One day your desk was empty. Nobody knows when exactly you left. The department sent one email. Nobody followed up.',
      shareText: `Disappeared in semester ${sem}. ${runInfo}. ${cards} cards played.\nUGA Grad Survivor:`,
    },
  };

  const d = endingData[ending];
  if (!d) return '<div>Error loading ending.</div>';

  const uniqueSeen = new Set(gameState.memory.filter(m => !m.match(/^(quals_|paper_|committee_|chose_|defense_|defended)/))).size;
  const totalPool = PHASE1_CARDS.length + PHASE2_CARDS.length + PHASE3_CARDS.length + UNIVERSAL_CARDS.length + CALLBACK_CARDS.length + EXCLUSIVE_CARDS.length + PI_EXCLUSIVE_CARDS.length + MILESTONE_CARDS.length;

  let html = `<div class="ending-screen">
    <div class="ending-emoji">${d.emoji}</div>
    <div class="ending-title">${d.title}</div>
    <div class="ending-sub">${d.subtitle}</div>
    <div class="ending-body">${d.body}</div>
    <div class="ending-stats">
      <div class="stat-line"><span>🧠 Mind</span><span>${gameState.st.mind}</span></div>
      <div class="stat-line"><span>💪 Body</span><span>${gameState.st.body}</span></div>
      <div class="stat-line"><span>💰 Wallet</span><span>${gameState.st.wallet}</span></div>
      <div class="stat-line"><span>🤝 Bonds</span><span>${gameState.st.bonds}</span></div>
      <div class="stat-line"><span>📊 Research</span><span>${gameState.st.research}</span></div>
      <div class="stat-line" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px"><span>Cards played</span><span>${gameState.totalCards}</span></div>
      <div class="stat-line"><span>Unique cards seen</span><span>${uniqueSeen} / ${totalPool}</span></div>
    </div>

    <div class="share-section">
      <div class="share-label">Share your run</div>
      <textarea id="shareText" class="share-textarea" rows="4" onclick="this.select()">${d.shareText}\nhttps://chenhsieh.github.io/UGA-grad-survivor/</textarea>
      <button class="share-btn" onclick="copyShare()">Copy to Clipboard</button>
      <div id="shareFeedback" class="share-feedback"></div>
    </div>

    ${renderEndingGrid()}
    <button class="play-again-btn" onclick="gameState.phase='archetype'; gameState.ending=null; gameState.currentCard=null; menuIndex=0; render()">Play Again</button>
    <div class="footer-note">PRESS SPACE TO CONTINUE</div>
    <div class="footer-credit">MADE BY A UGA PHD CANDIDATE · GRADUATING JUNE 2026 · chenhsieh.xyz</div>
  </div>`;

  // Update save state
  save.bestSemester = Math.max(save.bestSemester, gameState.semester);
  if (ending !== 'defended') save.totalDeaths++;
  if (!save.endings.includes(ending)) save.endings.push(ending);
  // Unlock archetypes based on conditions
  if (!save.archetypes.includes('double_agent') && gameState.semester >= 7) save.archetypes.push('double_agent');
  if (!save.archetypes.includes('gym_bro') && save.endings.includes('hospitalized')) save.archetypes.push('gym_bro');
  if (!save.archetypes.includes('neurodivergent') && save.endings.includes('burnt_out')) save.archetypes.push('neurodivergent');
  // Unlock PI types
  if (!save.unlockedPIs) save.unlockedPIs = ['micromanager', 'ghost', 'mentor', 'new_pi'];
  if (!save.unlockedPIs.includes('exploiter') && save.endings.includes('mastered_out')) save.unlockedPIs.push('exploiter');
  if (!save.unlockedPIs.includes('dynasty') && save.endings.includes('defended')) save.unlockedPIs.push('dynasty');
  save.archetypes = [...new Set(save.archetypes)];
  save.endings = [...new Set(save.endings)];
  saveSave();

  return html;
}

function renderEndingGrid() {
  const all = [
    {id:'defended',emoji:'🎓',name:'Defended'}, {id:'mastered_out',emoji:'📜',name:"Master'd Out"},
    {id:'burnt_out',emoji:'🧠',name:'Burnt Out'}, {id:'hospitalized',emoji:'🏥',name:'Hospitalized'},
    {id:'broke',emoji:'💸',name:'Broke'}, {id:'disappeared',emoji:'👻',name:'Disappeared'}
  ];
  const totalPool = PHASE1_CARDS.length + PHASE2_CARDS.length + PHASE3_CARDS.length + UNIVERSAL_CARDS.length + CALLBACK_CARDS.length + EXCLUSIVE_CARDS.length + PI_EXCLUSIVE_CARDS.length + MILESTONE_CARDS.length;
  const cardsSeen = gameState.totalCards || 0;
  const uniqueSeen = new Set(gameState.memory.filter(m => m.match && !m.match(/^(quals_|paper_|committee_|chose_|defense_|defended)/))).size;

  return `<div class="ending-grid">${all.map(e => {
    const unlocked = save.endings.includes(e.id);
    return unlocked
      ? `<div class="ending-slot unlocked"><div class="slot-emoji">${e.emoji}</div><div class="slot-name">${e.name}</div></div>`
      : `<div class="ending-slot locked"><div class="slot-lock">?</div><div class="slot-name">???</div></div>`;
  }).join('')}</div>
  <div class="run-meta">
    ${save.endings.length}/6 endings · ${save.archetypes.length}/8 archetypes<br>
    ${cardsSeen} cards played · ${uniqueSeen} unique cards seen (of ${totalPool})
  </div>`;
}

function render() {
  const app = document.getElementById('app');
  if (gameState.phase === 'title') app.innerHTML = renderTitle();
  else if (gameState.phase === 'archetype') app.innerHTML = renderArchetype();
  else if (gameState.phase === 'pi_selection') app.innerHTML = renderPISelection();
  else if (gameState.phase === 'rotation_complete') app.innerHTML = renderRotationComplete();
  else if (gameState.phase === 'semester_advance') app.innerHTML = renderSemesterAdvance();
  else if (gameState.phase === 'play') app.innerHTML = renderPlay();
  else if (gameState.phase === 'ending') app.innerHTML = renderEnding();
}

function showHelp() {
  helpVisible = true;
  const overlay = document.createElement('div');
  overlay.className = 'help-overlay';
  overlay.id = 'helpOverlay';
  overlay.onclick = function(ev) { if (ev.target === overlay) closeHelp(); };
  overlay.innerHTML = `
    <div class="help-content">
      <h2>How to Play</h2>
      <p>You're a PhD student. Every card is a situation — choose left or right. Each choice affects your stats. If any stat hits zero, your PhD is over.</p>
      <p><strong>Survive 10 semesters</strong>, pass your milestones, and keep your research up to defend.</p>
      <div class="help-stat"><span class="emoji">🧠</span><span><strong>Mind</strong> — Sanity, focus, will to continue. Hits zero → burnt out.</span></div>
      <div class="help-stat"><span class="emoji">💪</span><span><strong>Body</strong> — Physical health, sleep, energy. Hits zero → hospitalized.</span></div>
      <div class="help-stat"><span class="emoji">💰</span><span><strong>Wallet</strong> — Money and funding. Low wallet drains Mind and Body.</span></div>
      <div class="help-stat"><span class="emoji">🤝</span><span><strong>Bonds</strong> — Relationships. Low bonds drains Mind and Body. Hits zero → disappeared.</span></div>
      <div class="help-stat"><span class="emoji">📊</span><span><strong>Research</strong> — Your academic output. Too low at milestones = trouble. Below 30 at defense → mastered out.</span></div>
      <p style="margin-top:12px"><strong>Controls:</strong></p>
      <p>← A or Arrow Left = left choice<br>→ D or Arrow Right = right choice<br>Swipe left/right on mobile<br>Click the buttons, or use ↑↓/WS to navigate menus</p>
      <p style="margin-top:12px"><strong>Tip:</strong> Dying unlocks new archetypes and endings. You're meant to play more than once.</p>
      <button class="help-close" onclick="closeHelp()">GOT IT</button>
    </div>`;
  document.body.appendChild(overlay);
}

function copyShare() {
  const textarea = document.getElementById('shareText');
  const text = textarea.value;
  const feedback = document.getElementById('shareFeedback');
  navigator.clipboard.writeText(text).then(() => {
    feedback.textContent = 'Copied! Paste anywhere.';
    setTimeout(() => { feedback.textContent = ''; }, 3000);
  }).catch(() => {
    textarea.select();
    document.execCommand('copy');
    feedback.textContent = 'Copied!';
    setTimeout(() => { feedback.textContent = ''; }, 3000);
  });
}

function closeHelp() {
  helpVisible = false;
  const el = document.getElementById('helpOverlay');
  if (el) el.remove();
}
