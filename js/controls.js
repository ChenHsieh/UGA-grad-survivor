let dragStart = 0, dragCurrent = 0;

function getSelectableArchetypes() {
  return Object.keys(ARCHETYPE_DATA).filter(k => save.archetypes.includes(k));
}

function getSelectablePIs() {
  const unlocked = save.unlockedPIs || ['micromanager', 'ghost', 'mentor', 'new_pi'];
  return Object.keys(PI_DATA).filter(k => unlocked.includes(k));
}

function highlightArchetype(index) {
  const cards = document.querySelectorAll('.arch-card:not(.locked)');
  cards.forEach((c, i) => {
    if (i === index) c.classList.add('selected');
    else c.classList.remove('selected');
  });
  // Scroll into view
  if (cards[index]) {
    cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (document.activeElement !== cards[index]) cards[index].focus({ preventScroll: true });
  }
}

// Tab and the W/S menu are two ways to move through the same list; keep them in
// step so Space always acts on whatever is actually focused.
function syncMenuIndex(el) {
  const cards = [...document.querySelectorAll('.arch-card:not(.locked)')];
  const i = cards.indexOf(el);
  if (i >= 0) { menuIndex = i; cards.forEach((c, n) => c.classList.toggle('selected', n === i)); }
}

function startDrag(e) {
  dragStart = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  dragCurrent = dragStart;
}
function moveDrag(e) {
  if (dragStart === 0) return;
  dragCurrent = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  const card = document.getElementById('card');
  if (!card) return;
  const delta = dragCurrent - dragStart;
  const rot = delta * 0.05;
  card.style.transform = `translateX(${delta * 0.5}px) rotateZ(${rot}deg)`;
  armChoice(delta < -30 ? 'left' : delta > 30 ? 'right' : null);
}

// Light up the choice a swipe is heading toward. The labels used to be repeated
// in a hidden row above the buttons purely to do this, which put the same words
// on screen twice mid-swipe and cost vertical space the rest of the time.
function armChoice(side) {
  const l = document.querySelector('.card-btn.left'), r = document.querySelector('.card-btn.right');
  if (l) l.classList.toggle('armed', side === 'left');
  if (r) r.classList.toggle('armed', side === 'right');
}
function endDrag(e) {
  const card = document.getElementById('card');
  if (!card) return;
  const delta = dragCurrent - dragStart;
  dragStart = 0;
  dragCurrent = 0;
  card.style.transform = '';
  armChoice(null);
  if (delta < -70) choose('left');
  else if (delta > 70) choose('right');
}

document.addEventListener('keydown', function(e) {
  // Close help on Escape or any key
  if (helpVisible) {
    closeHelp();
    e.preventDefault();
    return;
  }

  const key = e.key;

  // TITLE SCREEN: Space/Enter to begin
  if (gameState.phase === 'title') {
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      gameState.phase = 'archetype';
      menuIndex = 0;
      render();
      setTimeout(() => highlightArchetype(0), 50);
    }
    return;
  }

  // ARCHETYPE SCREEN: Up/Down/W/S to navigate, Space/Enter to select
  if (gameState.phase === 'archetype') {
    const selectable = getSelectableArchetypes();
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      e.preventDefault();
      menuIndex = (menuIndex - 1 + selectable.length) % selectable.length;
      highlightArchetype(menuIndex);
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      e.preventDefault();
      menuIndex = (menuIndex + 1) % selectable.length;
      highlightArchetype(menuIndex);
    } else if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      const arch = selectable[menuIndex];
      if (arch) selectArchetype(arch);
    }
    return;
  }

  // PI SELECTION SCREEN: Up/Down/W/S to navigate, Space/Enter to select
  if (gameState.phase === 'pi_selection') {
    const selectable = getSelectablePIs();
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      e.preventDefault();
      menuIndex = (menuIndex - 1 + selectable.length) % selectable.length;
      highlightArchetype(menuIndex);
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      e.preventDefault();
      menuIndex = (menuIndex + 1) % selectable.length;
      highlightArchetype(menuIndex);
    } else if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      const pi = selectable[menuIndex];
      if (pi) selectPI(pi);
    }
    return;
  }

  // ROTATION COMPLETE TRANSITION: Space/Enter to continue to PI selection
  if (gameState.phase === 'rotation_complete') {
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      continueToPI();
    }
    return;
  }

  // SEMESTER ADVANCE CHECKPOINT: Space/Enter to continue
  if (gameState.phase === 'semester_advance') {
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      continueSemester();
    }
    return;
  }

  // PLAY SCREEN: Left/Right/A/D to choose, ? for help
  if (gameState.phase === 'play' && gameState.currentCard) {
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      e.preventDefault();
      choose('left');
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      e.preventDefault();
      choose('right');
    } else if (key === '?' || key === 'h' || key === 'H') {
      e.preventDefault();
      showHelp();
    }
    return;
  }

  // ENDING SCREEN: Space/Enter to play again
  if (gameState.phase === 'ending') {
    if (key === ' ' || key === 'Enter') {
      e.preventDefault();
      gameState.phase = 'archetype';
      gameState.ending = null;
      gameState.currentCard = null;
      menuIndex = 0;
      render();
      setTimeout(() => highlightArchetype(0), 50);
    }
    return;
  }
});
