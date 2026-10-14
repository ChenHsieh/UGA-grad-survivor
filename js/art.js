// Card and interface art — Isotype-style pictograms, drawn inline as SVG.
//
// Style reference: Otto Neurath and Gerd Arntz's Isotype (1925-40). The rules we
// take from it, and hold to everywhere in this file:
//
//   1. Solid filled silhouettes. No outline strokes, no line weight, no shading.
//      Detail is carried by the gap between shapes, the way a linocut carries it.
//   2. Profile or flat front view. No perspective.
//   3. Geometric simplification — instantly recognisable, no decorative detail.
//   4. Quantity is shown by repeating a unit, never by scaling one up.
//   5. Related meanings are small additions to a shared base figure.
//
// Isotype was built to make social statistics — labour, housing, class — legible
// to people without training. That is the same job this deck does, which is why
// the borrowing is structural rather than stylistic.
//
// Everything is fill="currentColor", so all six themes work with no per-theme
// asset, and solid shapes stay legible down to the 14px stat bar where an
// outline icon would disappear. Card art is keyed to card.tag so ~26 motifs
// cover 233 cards; each is seeded from the card id so no two cards draw alike.

function artSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Deterministic PRNG (mulberry32) — a card always draws the same mark.
function artRng(seed) {
  let a = seed;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const artR = n => Math.round(n * 10) / 10;
const artInt = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

// The Arntz figure: round head, trapezoidal shoulders, flat base. Every person in
// the deck is a variation on this one unit.
function artFigure(cx, base, s, dim) {
  s = s || 1;
  const hr = 5 * s, hy = base - 26 * s;
  return `<g${dim ? ` opacity="${dim}"` : ''}>` +
    `<circle cx="${artR(cx)}" cy="${artR(hy)}" r="${artR(hr)}"/>` +
    `<path d="M${artR(cx - 8 * s)} ${artR(base)}V${artR(base - 12 * s)}c0-${artR(5 * s)} ${artR(3.4 * s)}-${artR(7 * s)} ${artR(8 * s)}-${artR(7 * s)}s${artR(8 * s)} ${artR(2 * s)} ${artR(8 * s)} ${artR(7 * s)}v${artR(12 * s)}z"/>` +
    `</g>`;
}

// A row of `n` units, `ghost` of them faded — Isotype counts by repetition.
function artRow(n, ghost, y, s) {
  let out = '';
  const step = 13 * (s || 1);
  const x0 = 32 - ((n - 1) * step) / 2;
  for (let i = 0; i < n; i++) out += artFigure(x0 + i * step, y, s || 0.85, i >= n - ghost ? 0.28 : 0);
  return out;
}

// A stack of `n` coin units with `spent` gone from the top. Isotype counts money
// the same way it counts people: one unit each, never one bigger symbol.
function artCoins(cx, base, n, spent) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const y = base - i * 7;
    out += `<ellipse cx="${cx}" cy="${y}" rx="11" ry="4"${i >= n - spent ? ' opacity=".18"' : ''}/>`;
  }
  return out;
}

const ART_MOTIFS = {

  // ── Work, data, the machine ────────────────────────────────────────────

  // A run of results; the one that matters sits the wrong side of the cut line.
  threshold(r) {
    const n = artInt(r, 5, 7), bad = artInt(r, 3, n - 1);
    let bars = '';
    for (let i = 0; i < n; i++) {
      const h = i === bad ? 20 : 8 + Math.floor(r() * 8);
      bars += `<rect x="${artR(10 + i * 7.5)}" y="${artR(46 - h)}" width="5" height="${artR(h)}"${i === bad ? '' : ' opacity=".45"'}/>`;
    }
    return bars + `<rect x="8" y="24" width="48" height="2.5"/><rect x="8" y="48" width="48" height="3"/>`;
  },

  // A process in stages, one of them broken open.
  pipeline(r) {
    const n = artInt(r, 3, 4), bad = artInt(r, 0, n - 1);
    const w = n === 4 ? 11 : 14, gap = n === 4 ? 14 : 18;
    const x0 = artR(32 - (n * gap - (gap - w)) / 2);
    let out = '';
    for (let i = 0; i < n; i++) {
      const x = artR(x0 + i * gap), h = artInt(r, 18, 24), y = artR(32 - h / 2);
      out += i === bad
        ? `<rect x="${x}" y="${y}" width="${w}" height="${artR(h / 2 - 1.5)}"/><rect x="${x}" y="${artR(y + h / 2 + 1.5)}" width="${w}" height="${artR(h / 2 - 1.5)}"/>`
        : `<rect x="${x}" y="${y}" width="${w}" height="${h}" opacity=".45"/>`;
      if (i < n - 1) out += `<rect x="${artR(x + w + 1)}" y="30" width="${artR(gap - w - 2)}" height="4" opacity=".45"/>`;
    }
    return out;
  },

  // Things ahead of you in the queue, and you.
  queue(r) {
    const you = artInt(r, 2, 3);
    let out = '';
    for (let i = 0; i < 5; i++) {
      out += `<rect x="10" y="${11 + i * 9}" width="${artR(20 + r() * 22)}" height="6" rx="1"${i === you ? '' : ' opacity=".35"'}/>`;
    }
    return out;
  },

  // Branches collapsing to a single outcome.
  tree(r) {
    const j = artR(28 + r() * 6);
    return `<rect x="8" y="12" width="12" height="3"/><rect x="8" y="24" width="12" height="3"/>` +
      `<rect x="8" y="38" width="12" height="3"/><rect x="8" y="50" width="12" height="3"/>` +
      `<rect x="20" y="12" width="3" height="15"/><rect x="20" y="38" width="3" height="15"/>` +
      `<rect x="23" y="18" width="8" height="3"/><rect x="23" y="44" width="8" height="3"/>` +
      `<rect x="31" y="18" width="3" height="29"/><rect x="34" y="${j}" width="10" height="3"/>` +
      `<circle cx="51" cy="${artR(+j + 1.5)}" r="7"/>`;
  },

  // A field of readings with one that runs hot.
  matrix(r) {
    const hot = artInt(r, 0, 15);
    let out = '';
    for (let i = 0; i < 16; i++) {
      const x = 12 + (i % 4) * 11, y = 12 + Math.floor(i / 4) * 11;
      out += `<rect x="${x}" y="${y}" width="9" height="9"${i === hot ? '' : ` opacity="${artR(0.18 + r() * 0.3)}"`}/>`;
    }
    return out;
  },

  // A cluster, and the one outside it.
  outlier(r) {
    const ox = artR(46 + r() * 6), oy = artR(14 + r() * 6);
    let out = '';
    for (let i = 0; i < 7; i++) {
      out += `<circle cx="${artR(18 + r() * 20)}" cy="${artR(30 + r() * 18)}" r="3.4" opacity=".4"/>`;
    }
    return out + `<circle cx="${ox}" cy="${oy}" r="4.6"/><rect x="8" y="50" width="48" height="3"/>`;
  },

  // ── The advisor ────────────────────────────────────────────────────────

  // A month of slots; the ones that were cancelled are empty, one is moved on.
  calendar(r) {
    const moved = artInt(r, 4, 7);
    let cells = '';
    for (let i = 0; i < 8; i++) {
      if (i === moved) continue;
      const x = 12 + (i % 4) * 11, y = 30 + Math.floor(i / 4) * 11;
      cells += `<rect x="${x}" y="${y}" width="8" height="8" opacity="${r() > 0.45 ? '.45' : '.16'}"/>`;
    }
    const mx = 12 + (moved % 4) * 11, my = 30 + Math.floor(moved / 4) * 11;
    return `<rect x="8" y="14" width="48" height="10"/>` +
      `<rect x="${artInt(r, 13, 18)}" y="8" width="4" height="8"/><rect x="${artInt(r, 41, 46)}" y="8" width="4" height="8"/>` +
      cells + `<rect x="${mx}" y="${my}" width="8" height="8"/>`;
  },

  // Messages out, nothing back.
  inbox(r) {
    const n = artInt(r, 2, 3), reply = r() > 0.6;
    let out = '';
    for (let i = 0; i < n; i++) out += `<rect x="8" y="${10 + i * 13}" width="${artInt(r, 22, 34)}" height="9" rx="2"/>`;
    return out + `<rect x="${artInt(r, 22, 30)}" y="${10 + n * 13}" width="${artInt(r, 24, 32)}" height="9" rx="2" opacity="${reply ? '.45' : '.13'}"/>`;
  },

  // A name that isn't first on the list.
  hierarchy(r) {
    const you = artInt(r, 1, 3);
    let out = '';
    for (let i = 0; i < 4; i++) {
      const y = 13 + i * 12;
      out += `<circle cx="12" cy="${y + 3}" r="${i === you ? 4.5 : 3}"${i === you ? '' : ' opacity=".35"'}/>` +
        `<rect x="21" y="${y + 1}" width="${artR(20 + r() * 16)}" height="${i === you ? 5 : 4}"${i === you ? '' : ' opacity=".35"'}/>`;
    }
    return out;
  },

  // ── People ─────────────────────────────────────────────────────────────

  // Two people, and the distance between them.
  pair(r) {
    const gap = artR(20 + r() * 18), s1 = artR(0.9 + r() * 0.22), s2 = artR(0.9 + r() * 0.22);
    return artFigure(artR(32 - gap / 2), 48, s1) +
      artFigure(artR(32 + gap / 2), 48, s2, r() > 0.4 ? artR(0.2 + r() * 0.25) : 0);
  },

  // A cohort, thinning.
  cohort(r) {
    const n = artInt(r, 4, 6), gone = artInt(r, 1, 2), s = artR(0.72 + r() * 0.16);
    return artRow(n, gone, artInt(r, 42, 47), s);
  },

  // One figure, alone, and the room.
  alone(r) {
    let others = '';
    const n = artInt(r, 3, 5);
    for (let i = 0; i < n; i++) others += artFigure(artR(38 + i * 6), 44, artR(0.4 + r() * 0.16), artR(0.16 + r() * 0.16));
    return artFigure(artInt(r, 14, 20), 48, 1) + others;
  },

  // An open hand — the person who did the thing nobody counted.
  hands(r) {
    let f = '';
    for (let i = 0; i < 4; i++) {
      const h = artInt(r, 14, 22);
      f += `<rect x="${17 + i * 8}" y="${artR(32 - h)}" width="6" height="${h}" rx="3"/>`;
    }
    return f + `<path d="M15 28h34v10a12 12 0 0 1-12 12h-10a12 12 0 0 1-12-12z"/>`;
  },

  // ── Money, time, body ──────────────────────────────────────────────────

  // A stipend, and what's left of it.
  coins(r) { return artCoins(19, 50, 5, artInt(r, 1, 3)) + artCoins(45, 50, 4, artInt(r, 2, 4)); },

  // A reserve running down.
  gauge(r) {
    const left = artR(12 + r() * 18);
    return `<rect x="8" y="26" width="48" height="16" opacity=".2"/><rect x="8" y="26" width="${left}" height="16"/>` +
      `<rect x="8" y="48" width="48" height="3"/>`;
  },

  // The clock you are always behind.
  clock(r) {
    const a = r() * Math.PI * 2;
    return `<circle cx="32" cy="30" r="18" opacity=".22"/><circle cx="32" cy="30" r="4"/>` +
      `<rect x="30" y="16" width="4" height="15"/>` +
      `<rect x="30" y="28" width="4" height="${artR(10 + r() * 4)}" transform="rotate(${artR(a * 57)} 32 30)"/>`;
  },

  // A body keeping or losing its rhythm.
  pulse(r) {
    const h = artInt(r, 12, 20), x = artInt(r, 14, 22), w = artInt(r, 4, 6), t = artInt(r, 28, 38);
    return `<path d="M8 ${t}h${x}l${w}-${h} ${w} ${h * 2} ${w}-${h} ${artR(w * 0.8)} ${artR(h / 2)}H56v6H${artR(30 + w)}l-${artR(w * 0.8)}-${artR(h / 2)}-${w} ${h}-${w}-${h * 2}-${w} ${h}H8z"/>`;
  },

  // ── Place, event, chance ───────────────────────────────────────────────

  // The town, and the one window still lit.
  map(r) {
    const h1 = artInt(r, 19, 27), h2 = artInt(r, 37, 45);
    const v1 = artInt(r, 19, 27), v2 = artInt(r, 39, 47);
    const sz = artInt(r, 8, 12);
    return `<rect x="8" y="${h1}" width="48" height="3" opacity=".3"/><rect x="8" y="${h2}" width="48" height="3" opacity=".3"/>` +
      `<rect x="${v1}" y="8" width="3" height="48" opacity=".3"/><rect x="${v2}" y="8" width="3" height="48" opacity=".3"/>` +
      `<rect x="${artInt(r, 10, 42)}" y="${artInt(r, 10, 42)}" width="${sz}" height="${sz}"/>`;
  },

  // Something arriving that nobody scheduled.
  weather(r) {
    let rain = '';
    for (let i = 0; i < 4; i++) rain += `<rect x="${artR(16 + i * 10)}" y="${artR(42 + r() * 4)}" width="3" height="${artInt(r, 6, 11)}" opacity=".55"/>`;
    return `<path d="M14 38a10 10 0 0 1 4-19 13 13 0 0 1 24 4 9 9 0 0 1 2 15z"/>` + rain;
  },

  // A door, and what's on the other side of it.
  door(r) {
    const left = r() > 0.5;
    return `<path fill-rule="evenodd" d="M16 6h32v50H16zm6 6v38h20V12z"/>` +
      `<circle cx="${left ? 26 : 38}" cy="32" r="2.6"/><rect x="8" y="53" width="48" height="3" opacity=".35"/>`;
  },

  // Two roads, one of them not taken.
  branch(r) {
    const a1 = artInt(r, 28, 46), a2 = artInt(r, 28, 46), len = artInt(r, 20, 26);
    const dimLeft = r() > 0.5;
    return `<rect x="29" y="30" width="6" height="26"/>` +
      `<rect x="29" y="${artR(32 - len)}" width="6" height="${len}" transform="rotate(-${a1} 32 32)"${dimLeft ? ' opacity=".3"' : ''}/>` +
      `<rect x="29" y="${artR(32 - len)}" width="6" height="${len}" transform="rotate(${a2} 32 32)"${dimLeft ? '' : ' opacity=".3"'}/>` +
      `<rect x="8" y="53" width="48" height="3" opacity=".3"/>`;
  },

  // A rare good reading.
  spark(r) {
    const n = artInt(r, 6, 10), len = artInt(r, 7, 11), rad = artInt(r, 9, 12);
    let rays = '';
    for (let i = 0; i < n; i++) {
      rays += `<rect x="30.5" y="${artR(31 - rad - len)}" width="3" height="${len}" transform="rotate(${artR((i / n) * 360 + r() * 5)} 32 32)" opacity=".55"/>`;
    }
    return rays + `<circle cx="32" cy="32" r="${rad}"/>`;
  },

  // A thing that comes back around.
  loop(r) {
    return `<g transform="rotate(${artInt(r, 0, 359)} 32 32)"><path d="M32 12a20 20 0 1 1-14 6l5 5a13 13 0 1 0 9-4z"/><path d="M28 4h10v14l-12-7z"/></g>` +
      `<circle cx="32" cy="32" r="${artInt(r, 3, 6)}" opacity=".3"/>`;
  },

  // ── Identity ───────────────────────────────────────────────────────────

  flag(r) {
    const px = artInt(r, 12, 17), w = artInt(r, 24, 34), notch = artInt(r, 5, 10), h = artInt(r, 16, 22);
    return `<rect x="${px}" y="8" width="4" height="48"/>` +
      `<path d="M${px + 4} 12h${w}l-${notch} ${artR(h / 2)} ${notch} ${artR(h / 2)}H${px + 4}z"${r() > 0.5 ? '' : ' opacity=".45"'}/>`;
  },

  flask(r) {
    let bub = '';
    for (let i = 0; i < 3; i++) bub += `<circle cx="${artR(24 + r() * 16)}" cy="${artR(42 + r() * 6)}" r="2" opacity=".3"/>`;
    return `<rect x="24" y="8" width="4" height="18"/><rect x="36" y="8" width="4" height="18"/><rect x="20" y="8" width="24" height="4"/>` +
      `<path d="M28 26h8l14 24a4 4 0 0 1-3 6H17a4 4 0 0 1-3-6z"/>` + bub;
  },

  stack(r) {
    let out = '';
    for (let i = 0; i < 5; i++) out += `<rect x="${artR(12 + r() * 5)}" y="${12 + i * 9}" width="${artR(28 + r() * 12)}" height="6"${i ? ` opacity="${artR(1 - i * 0.16)}"` : ''}/>`;
    return out;
  },

  mask(r) {
    const gap = artInt(r, 2, 6), h = artInt(r, 12, 17), w = artR((56 - gap) / 2);
    const dimLeft = r() > 0.5, dim = artR(0.28 + r() * 0.18);
    const half = (x, o) => `<path d="M${x} 18h${w}v${h}a${artR(w / 2)} ${artR(w / 2)} 0 0 1-${w} 0z"${o ? ` opacity="${o}"` : ''}/>`;
    return half(4, dimLeft ? dim : 0) + half(artR(4 + w + gap), dimLeft ? 0 : dim);
  },

  puzzle(r) {
    return `<path d="M12 14h16a4 4 0 0 1 8 0h16v16a4 4 0 0 0 0 8v16H36a4 4 0 0 0-8 0H12V38a4 4 0 0 0 0-8z"/>` +
      `<circle cx="${artR(26 + r() * 12)}" cy="${artR(28 + r() * 8)}" r="3" opacity=".25"/>`;
  },

  barbell(r) {
    // inner and bar are continuous rather than bucketed: with six integer
    // dimensions two cards can quantize into identical buckets (leg_day_vs_lab
    // and protein_budget did, at odds of about 1 in 5000).
    const inner = artR(23 + r() * 9), outer = artInt(r, 14, 18), bar = artR(4 + r() * 4);
    const ix = artInt(r, 15, 18), ox = artInt(r, 6, 9), pw = artInt(r, 6, 8);
    const iy = artR(32 - inner / 2), oy = artR(32 - outer / 2);
    return `<rect x="${ox}" y="${oy}" width="6" height="${outer}"/><rect x="${ix}" y="${iy}" width="${pw}" height="${inner}"/>` +
      `<rect x="${ix + pw}" y="${artR(32 - bar / 2)}" width="${artR(64 - 2 * (ix + pw))}" height="${bar}"/>` +
      `<rect x="${artR(64 - ix - pw)}" y="${iy}" width="${pw}" height="${inner}"/><rect x="${artR(58 - ox)}" y="${oy}" width="6" height="${outer}"/>`;
  },

  confetti(r) {
    let out = '';
    for (let i = 0; i < 7; i++) {
      out += `<rect x="${artR(10 + r() * 42)}" y="${artR(10 + r() * 32)}" width="${artR(4 + r() * 4)}" height="${artR(4 + r() * 3)}" transform="rotate(${artInt(r, -40, 40)} 32 32)" opacity="${artR(0.5 + r() * 0.5)}"/>`;
    }
    return out + `<rect x="10" y="50" width="44" height="3" opacity=".3"/>`;
  },

  // Fallback.
  mark(r) {
    return `<rect x="12" y="12" width="40" height="40" opacity=".18"/>` +
      `<rect x="20" y="34" width="6" height="12"/><rect x="29" y="26" width="6" height="20"/><rect x="38" y="30" width="6" height="16"/>`;
  },
};

const ART_TAG = {
  'Advisor': 'calendar', 'Lab Drama': 'pair', 'Lab Politics': 'hierarchy',
  'Lab Life': 'matrix', 'Collaboration': 'hierarchy', 'Academic Politics': 'hierarchy',
  'Peer Review': 'threshold', 'Cruel': 'threshold', 'Pipeline Failure': 'pipeline',
  'Pipeline': 'pipeline', 'Dissertation': 'stack', 'Milestone': 'tree', 'MILESTONE': 'tree',
  'Existential Event': 'outlier', 'Identity Crisis': 'outlier', 'Human Existence': 'pulse',
  'Health': 'pulse', 'Mental Health': 'pulse', 'Self Care': 'pulse', 'Big Mood': 'pulse',
  'Funding': 'coins', 'Funding Crisis': 'coins', 'Privilege': 'gauge',
  'Campus Reality': 'gauge', 'Survival': 'gauge',
  'Athens Life': 'map', 'Athens Reality': 'map', 'Campus Life': 'map',
  'Black Swan': 'weather', 'Life Event': 'door', 'Career': 'branch',
  'Social': 'cohort', 'Social Drama': 'pair', 'Networking': 'cohort', 'Conference': 'cohort',
  'Support Staff': 'hands', 'Teaching Labor': 'clock', 'Teaching': 'clock',
  'Preparation': 'clock', 'Temptation': 'branch', 'Callback': 'loop',
  'Marketing': 'spark', 'Rare Win': 'spark', 'Small Win': 'spark', 'Validation': 'spark',
  'Global Student': 'flag', 'Day One': 'flask', 'First Day': 'flask', 'Rotation': 'flask',
  'Biologist': 'flask', 'Overachiever': 'stack', 'Vibe-Coder': 'queue',
  'Fun Haver': 'confetti', 'Neurodivergent': 'puzzle', 'Double Agent': 'mask',
  'Gym Bro': 'barbell',
};

// Signature cards that earn a mark of their own, overriding their tag.
const ART_CARD = {
  ms_rotation: 'branch', ms_quals: 'threshold', ms_committee_1: 'hierarchy',
  ms_committee_2: 'hierarchy', ms_defense_sched: 'calendar', ms_defense: 'tree',
  job_pending: 'queue', scratch_purge: 'matrix', advisor_ghost: 'inbox',
  email_void: 'inbox', advisor_vacation: 'inbox', not_eaten: 'clock',
  stipend_late: 'coins', imposter_moment: 'outlier', cohort_dropout: 'cohort',
  not_in_group_chat: 'alone', excluded_hangout: 'alone', friend_group_shift: 'alone',
  homesick_holiday: 'alone', authorship_politics: 'hierarchy', no_credit_collab: 'hierarchy',
  first_draft_author: 'hierarchy', ice_storm: 'weather', lab_flood: 'weather',
  power_outage: 'weather', pandemic_echo: 'weather', car_accident: 'weather',
  family_emergency: 'door', industry_vs_academia: 'branch', job_market: 'branch',
  good_coffee: 'spark', email_from_stranger: 'spark', pipeline_runs: 'spark',
};

function artMotifFor(card) { return ART_CARD[card.id] || ART_TAG[card.tag] || 'mark'; }

// Guard: a motif named in the tag/card maps but missing from ART_MOTIFS would
// silently fall back to `mark` and every card sharing it would draw identically.
// Fail loudly in the console instead.
(function artCheckMotifs() {
  const missing = [...new Set([...Object.values(ART_TAG), ...Object.values(ART_CARD)])]
    .filter(m => typeof ART_MOTIFS[m] !== 'function');
  if (missing.length && typeof console !== 'undefined') {
    console.error('art.js: motifs referenced but not defined —', missing.join(', '));
  }
})();

function artSvg(body, cls, box) {
  return `<svg class="${cls}" viewBox="0 0 ${box || 64} ${box || 64}" fill="currentColor" aria-hidden="true">${body}</svg>`;
}

function cardArt(card) {
  const draw = ART_MOTIFS[artMotifFor(card)] || ART_MOTIFS.mark;
  return artSvg(draw(artRng(artSeed(card.id))), 'card-art');
}

// ── Interface marks ──────────────────────────────────────────────────────
// Same rules at a smaller unit. These sit at 14-20px, where a solid silhouette
// still reads and an outline would vanish.

const ART_STATS = {
  // A head in profile — the Isotype way of naming a person's interior.
  mind: '<path d="M12 2a8 8 0 0 1 8 8v3h-2.5v4a2 2 0 0 1-2 2H12v3H6v-6l-2-2a8 8 0 0 1 8-12z"/>',
  // The figure itself.
  body: '<circle cx="12" cy="4.5" r="3"/><path d="M5 22v-8a7 7 0 0 1 14 0v8z"/>',
  // Coins, counted by repetition.
  wallet: '<path fill-rule="evenodd" d="M2 6h20v12H2zm10 2.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z"/>',
  // Two of the base figure, joined.
  bonds: '<circle cx="7" cy="6" r="3"/><circle cx="17" cy="6" r="3"/><path d="M1 21v-5a6 6 0 0 1 12 0v5z"/><path d="M11 21v-5a6 6 0 0 1 12 0v5z" opacity=".55"/>',
  // A stack of pages.
  research: '<path fill-rule="evenodd" d="M5 2h9l5 5v15H5zm2.5 8.5v2h9v-2zm0 4v2h9v-2zm0 4v2h6v-2z"/>',
  // Nodes and the ties between them.
  network: '<circle cx="5" cy="18" r="3"/><circle cx="12" cy="6" r="3"/><circle cx="19" cy="18" r="3"/><rect x="7" y="10" width="2.5" height="8" transform="rotate(-28 8 14)" opacity=".5"/><rect x="15" y="10" width="2.5" height="8" transform="rotate(28 16 14)" opacity=".5"/>',
};

const ART_ENDINGS = {
  defended:     '<path d="M32 8 4 20l28 12 28-12z"/><path d="M14 27v13c0 5 8 9 18 9s18-4 18-9V27l-18 8z" opacity=".55"/><rect x="56" y="20" width="3" height="16"/>',
  mastered_out: '<path fill-rule="evenodd" d="M10 6h44v34H10zm7 8v3h30v-3zm0 8v3h30v-3zm0 8v3h18v-3z"/>' +
                '<circle cx="32" cy="46" r="8"/><path d="M27 52l-4 10 9-4 9 4-4-10z" opacity=".5"/>',
  burnt_out:    '<path fill-rule="evenodd" d="M32 6a19 19 0 0 1 19 19v5h-6v10a5 5 0 0 1-5 5h-7v9H18V37l-5-6A19 19 0 0 1 32 6zm3 11-11 14h7l-4 12 13-16h-7z"/>',
  hospitalized: '<rect x="8" y="20" width="48" height="28" rx="3" opacity=".35"/><rect x="27" y="26" width="10" height="16"/><rect x="24" y="29" width="16" height="10"/>',
  broke:        '<ellipse cx="32" cy="50" rx="14" ry="5"/>' +
                '<ellipse cx="32" cy="41" rx="14" ry="5" opacity=".16"/><ellipse cx="32" cy="32" rx="14" ry="5" opacity=".16"/>' +
                '<ellipse cx="32" cy="23" rx="14" ry="5" opacity=".16"/><ellipse cx="32" cy="14" rx="14" ry="5" opacity=".16"/>',
  disappeared:  '<rect x="6" y="28" width="52" height="5"/><rect x="11" y="33" width="4" height="22"/><rect x="49" y="33" width="4" height="22"/>' +
                '<rect x="26" y="38" width="14" height="4" opacity=".3"/><rect x="30" y="42" width="6" height="12" opacity=".3"/>',
};

const ART_ARCH = {
  overachiever:   ART_MOTIFS.stack(artRng(11)),
  vibe_coder:     '<rect x="8" y="14" width="48" height="30" rx="3" opacity=".35"/><rect x="16" y="22" width="4" height="4"/><rect x="22" y="22" width="10" height="4" opacity=".6"/><rect x="16" y="30" width="16" height="4" opacity=".6"/><rect x="22" y="50" width="20" height="4"/>',
  fun_haver:      ART_MOTIFS.confetti(artRng(7)),
  global_student: ART_MOTIFS.flag(artRng(3)),
  biologist:      ART_MOTIFS.flask(artRng(5)),
  double_agent:   ART_MOTIFS.mask(artRng(9)),
  gym_bro:        ART_MOTIFS.barbell(artRng(2)),
  neurodivergent: ART_MOTIFS.puzzle(artRng(4)),
};

const ART_PI = {
  micromanager: '<circle cx="32" cy="30" r="20" opacity=".25"/><circle cx="32" cy="30" r="11" opacity=".45"/><circle cx="32" cy="30" r="4"/>',
  ghost:        '<circle cx="32" cy="14" r="8"/>' +
                '<rect x="18" y="28" width="28" height="5" opacity=".55"/><rect x="18" y="36" width="28" height="5" opacity=".32"/>' +
                '<rect x="18" y="44" width="28" height="5" opacity=".16"/>',
  mentor:       '<circle cx="22" cy="18" r="7"/><path d="M8 46V34a14 14 0 0 1 28 0v12z"/><circle cx="46" cy="24" r="5" opacity=".45"/><path d="M36 46v-8a10 10 0 0 1 20 0v8z" opacity=".45"/>',
  new_pi:       '<rect x="12" y="44" width="40" height="10"/><rect x="12" y="32" width="40" height="10" opacity=".55"/>' +
                '<rect x="12" y="20" width="22" height="10" opacity=".22"/><rect x="30" y="6" width="3" height="12"/><path d="M33 7h13l-4 4 4 4H33z"/>',
  exploiter:    '<path d="M32 8 4 20l28 12 28-12z" opacity=".3"/><rect x="10" y="36" width="44" height="4"/><rect x="10" y="44" width="30" height="4" opacity=".5"/><rect x="10" y="52" width="18" height="4" opacity=".28"/>',
  dynasty:      '<path d="M32 6 8 16l24 10 24-10z"/><path d="M32 30 12 22v10l20 8 20-8V22z" opacity=".55"/><path d="M32 44 16 38v8l16 6 16-6v-8z" opacity=".3"/>',
};

function statIcon(key)   { return artSvg(ART_STATS[key] || '', 'ui-icon', 24); }
function endingIcon(id)  { return artSvg(ART_ENDINGS[id] || ART_ENDINGS.disappeared, 'ending-art'); }
function archIcon(key)   { return artSvg(ART_ARCH[key] || ART_MOTIFS.mark(artRng(1)), 'pick-art'); }
function piIcon(key)     { return artSvg(ART_PI[key] || ART_MOTIFS.mark(artRng(1)), 'pick-art'); }
