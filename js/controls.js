// Input. A choice has two steps, like Reigns: lean toward an answer (drag, hover, first tap
// or first key press) to see which bars it moves, then commit (release past the edge, click,
// second tap or second key press). Leaning back or tapping the other answer changes your mind.

let lean = null;          // 'left' | 'right' | null
let leanSource = null;    // 'drag' | 'hover' | 'tap' | 'key'
let busy = false;         // true while a card is flying away
let drag = null;          // { id, x0, y0, dx, captured }
let leanCount = 0;        // how many times the player has leaned this page load

const DRAG_LEAN = 30, DRAG_COMMIT = 80;
let lastPointerType = 'mouse';
document.addEventListener('pointerdown', e => { lastPointerType = e.pointerType || 'mouse'; }, true);

function getSelectableArchetypes() {
  return Object.keys(ARCHETYPE_DATA).filter(k => save.archetypes.includes(k));
}

function getSelectablePIs() {
  const unlocked = save.unlockedPIs || ['micromanager', 'ghost', 'mentor', 'new_pi'];
  return Object.keys(PI_DATA).filter(k => unlocked.includes(k));
}

function highlightArchetype(index) {
  const cards = document.querySelectorAll('.pick-card:not(.locked)');
  cards.forEach((c, i) => c.classList.toggle('selected', i === index));
  if (cards[index]) {
    cards[index].focus({ preventScroll: true });
    cards[index].scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
  }
}

document.addEventListener('focusin', function(e) {
  const card = e.target.closest?.('.pick-card:not(.locked)');
  if (!card) return;
  const cards = [...document.querySelectorAll('.pick-card:not(.locked)')];
  menuIndex = cards.indexOf(card);
  cards.forEach(c => c.classList.toggle('selected', c === card));
});

// ── Leaning: show which bars an answer moves, never which way ─────

function resetLean() {
  lean = null; leanSource = null; busy = false; drag = null;
}

function setLean(side, source) {
  if (busy) return;
  const card = document.getElementById('card');
  if (!card) return;
  if (side === lean && source === leanSource) return;
  lean = side; leanSource = side ? source : null;
  card.classList.toggle('lean-left', side === 'left');
  card.classList.toggle('lean-right', side === 'right');
  card.classList.toggle('leaning', !!side);
  card.dataset.source = leanSource || '';
  if (source !== 'drag') card.style.transform = '';
  document.querySelectorAll('.card-btn').forEach(b => b.classList.toggle('leaned', b.dataset.side === side));

  document.querySelector('.meters')?.classList.toggle('leaning', !!side);
  if (side) document.querySelectorAll('.meters .float').forEach(el => el.remove());

  const fx = side ? predictEffects(side) : {};
  document.querySelectorAll('[data-stat]').forEach(el => {
    const stat = el.dataset.stat;
    const size = side ? dotSize(fx[stat] || 0) : 0;
    const dot = el.querySelector('.dot');
    el.classList.remove('touch-1', 'touch-2', 'touch-3', 'risky');
    if (size) {
      el.classList.add('touch-' + size);
      const v = gameState.st[stat];
      if (stat !== 'research' && ((v <= DANGER && size >= 2) || Math.abs(fx[stat]) >= v)) el.classList.add('risky');
    }
    if (dot) dot.title = size ? ['', 'small change', 'medium change', 'big change'][size] : '';
  });

  const news = document.getElementById('news1');
  if (news) {
    if (side) {
      leanCount++;
      const any = Object.keys(fx).length;
      const tip = !any ? 'This answer moves nothing you can see.'
        : (save.totalRuns <= 1 && gameState.totalCards < 8) ? 'Dots show which bars move. Bigger dot, bigger change.'
        : null;
      const how = source === 'drag' ? 'Let go to choose.' : source === 'tap' ? 'Tap again to choose.' : source === 'key' ? 'Press again to choose.' : '';
      news.innerHTML = `<span class="teach">${tip || how || 'Click to choose.'}</span>`;
    } else {
      news.innerHTML = news.dataset.base ? decodeHTML(news.dataset.base) : '';
    }
  }
}

function decodeHTML(s) { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; }

function commit(side) {
  if (busy || gameState.phase !== 'play' || !gameState.currentCard) return;
  busy = true;
  const card = document.getElementById('card');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (card && !reduce) {
    card.classList.add('fly-' + side);
    setTimeout(() => { busy = false; choose(side); }, 220);
  } else {
    busy = false; choose(side);
  }
}

// ── Card and button wiring (called after each play render) ────────

function bindCard() {
  const card = document.getElementById('card');
  if (!card) return;
  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  card.addEventListener('pointercancel', onCancel);
  card.addEventListener('lostpointercapture', e => { if (e.target === card && drag && drag.captured && !drag.done) onCancel(); });

  card.querySelectorAll('.card-btn').forEach(btn => {
    const side = btn.dataset.side;
    btn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !drag?.captured) setLean(side, 'hover'); });
    btn.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && leanSource === 'hover' && lean === side) setLean(null); });
    btn.addEventListener('focus', () => { if (!lean && btn.matches(':focus-visible')) setLean(side, 'key'); });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (drag?.suppressClick) return;
      const type = e.detail === 0 ? 'key' : (e.pointerType || lastPointerType);
      // A mouse has already hovered (and leaned), so a click chooses.
      // A tap or a key press leans first; the second one chooses.
      if (type === 'mouse' || lean === side) commit(side);
      else setLean(side, type === 'key' ? 'key' : 'tap');
    });
  });
  // Tapping the card itself (not an answer) cancels a tap-lean.
  card.addEventListener('click', e => {
    if (e.target.closest('.card-btn')) return;
    if (drag?.suppressClick) return;
    if (lean && leanSource === 'tap') setLean(null);
  });
}

function onDown(e) {
  if (busy || e.button > 0) return;
  drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, captured: false, suppressClick: false };
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
  if (!drag.captured) {
    if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy)) return;
    drag.captured = true;
    drag.suppressClick = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    e.currentTarget.classList.add('dragging');
  }
  drag.dx = dx;
  const card = e.currentTarget;
  card.style.transform = `translateX(${dx * 0.6}px) rotate(${dx * 0.04}deg)`;
  if (dx <= -DRAG_LEAN) setLean('left', 'drag');
  else if (dx >= DRAG_LEAN) setLean('right', 'drag');
  else if (leanSource === 'drag') setLean(null);
  card.classList.toggle('past-edge', Math.abs(dx) >= DRAG_COMMIT);
}

function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  const card = e.currentTarget;
  card.classList.remove('dragging', 'past-edge');
  if (d.captured) {
    d.done = true;
    // Let the synthetic click that follows a drag pass without acting.
    setTimeout(() => { if (drag === d) drag = null; }, 0);
    if (d.dx <= -DRAG_COMMIT) { commit('left'); return; }
    if (d.dx >= DRAG_COMMIT) { commit('right'); return; }
    card.style.transform = '';
    if (leanSource === 'drag') setLean(null);
  } else {
    drag = null;
  }
}

function onCancel() {
  const card = document.getElementById('card');
  if (card) { card.style.transform = ''; card.classList.remove('dragging', 'past-edge'); }
  if (leanSource === 'drag') setLean(null);
  drag = null;
}

// ── Keyboard ──────────────────────────────────────────────────────

document.addEventListener('keydown', function(e) {
  if (helpVisible) return;
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.matches?.('input, textarea, select, [contenteditable="true"]')) return;

  const key = e.key;
  const onControl = e.target.closest?.('button, a, summary');
  const phase = gameState.phase;

  if (phase === 'play' && gameState.currentCard) {
    const side = (key === 'ArrowLeft' || key === 'a' || key === 'A') ? 'left'
      : (key === 'ArrowRight' || key === 'd' || key === 'D') ? 'right' : null;
    if (side) {
      e.preventDefault();
      if (lean === side) commit(side); else setLean(side, 'key');
    } else if ((key === 'Enter' || key === ' ') && lean && !onControl?.classList.contains('help-btn')) {
      e.preventDefault();
      commit(lean);
    } else if (key === 'Escape' || key === 'ArrowDown') {
      if (lean) { e.preventDefault(); setLean(null); }
    } else if (key === '?' || key === 'h' || key === 'H') {
      e.preventDefault();
      showHelp();
    }
    return;
  }

  if ((key === ' ' || key === 'Enter') && onControl) return;

  if (phase === 'title') {
    if (key === ' ' || key === 'Enter') { e.preventDefault(); beginGame(); }
    return;
  }

  if (phase === 'archetype' || phase === 'pi_selection') {
    const selectable = phase === 'archetype' ? getSelectableArchetypes() : getSelectablePIs();
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
      const pick = selectable[menuIndex];
      if (pick) phase === 'archetype' ? selectArchetype(pick) : selectPI(pick);
    }
    return;
  }

  if (phase === 'rotation_complete') {
    if (key === ' ' || key === 'Enter') { e.preventDefault(); continueToPI(); }
    return;
  }

  if (phase === 'semester_advance') {
    if (key === ' ' || key === 'Enter') { e.preventDefault(); continueSemester(); }
    return;
  }

  if (phase === 'ending') {
    if (key === ' ' || key === 'Enter') { e.preventDefault(); beginGame(); }
  }
});
