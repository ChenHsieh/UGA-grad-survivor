// One hand-drawn scene per badge, 200 x 200, drawn on a dark ground.
// One palette: cream line for the scene, gold for the bar you protected, coral for the bar you spent.
// One line style: 4 px round line, a little wobble from a displacement filter, fills that sit slightly off the line.
// No text inside the pictures, so they read the same in both languages.

const BA = (() => {
  const L = '#f5f0e8', G = '#d4a017', C = '#ff8a78';
  const P = (d, c = L, w = 4, f = 'none') => `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="${f}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const O = (x, y, r, c = L, f = 'none', w = 4) => `<circle cx="${x}" cy="${y}" r="${r}" stroke="${c}" stroke-width="${w}" fill="${f}"/>`;
  const E = (x, y, rx, ry, c = L, f = 'none', w = 4) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" stroke="${c}" stroke-width="${w}" fill="${f}"/>`;
  const R = (x, y, w, h, c = L, f = 'none', sw = 4, rx = 4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" stroke="${c}" stroke-width="${sw}" fill="${f}" stroke-linejoin="round"/>`;
  const F = (d, c, o = 0.9) => `<path d="${d}" fill="${c}" fill-opacity="${o}" stroke="none"/>`;
  const GROUND = P('M20 172 H180', L, 3);
  const calmFace = (x, y) => P(`M${x - 8} ${y - 2} q4 4 8 0`, L, 3) + P(`M${x + 2} ${y - 2} q4 4 8 0`, L, 3) + P(`M${x - 4} ${y + 8} q8 6 16 0`, L, 3);
  const coin = (x, y, r = 10, c = G) => O(x, y, r, c, c, 3) + O(x, y, r - 4, '#0e0c0a', 'none', 2);
  const drops = (x, y) => P(`M${x} ${y} q-5 8 0 12 q5 -4 0 -12`, C, 3, C);

  const S = {};

  // Protect Mind, spend Body: a calm sitter in a chair, a bent back with pain marks
  S['mind-body'] = O(98, 62, 34, G, G, 0).replace('stroke-width="0"', 'stroke-width="0" fill-opacity=".25"') +
    O(98, 62, 16) + calmFace(98, 60) + P('M92 78 C76 92 74 112 82 130', L) + P('M81 106 C75 116 77 124 82 130', C, 5) +
    P('M82 130 H124 V168') + P('M60 130 H112') + P('M62 130 V88 M66 130 V168 M108 130 V168') +
    P('M94 86 L116 106 L130 102') + P('M58 108 l-10 -6 l10 -2 l-10 -8', C, 3) + GROUND;

  // Protect Mind, spend Wallet: a calm face over a pocket turned inside out
  S['mind-wallet'] = O(100, 56, 34, G, G, 0).replace('stroke-width="0"', 'stroke-width="0" fill-opacity=".25"') +
    O(100, 56, 26) + calmFace(100, 54) +
    P('M58 112 H142 V168 H58 Z') + P('M58 112 L70 98 H130 L142 112') +
    P('M82 112 V146 Q82 156 92 156 H108 Q118 156 118 146 V112', C, 4, 'none') + P('M92 132 h16', C, 3) +
    P('M150 134 l8 6 M152 150 l10 0 M148 164 l8 -4', C, 3);

  // Protect Mind, spend Friends: big headphones, a phone with piled-up message bubbles
  S['mind-bonds'] = P('M54 104 C54 52 146 52 146 104', G, 7) + R(42, 98, 22, 40, G, G, 3, 8) + R(136, 98, 22, 40, G, G, 3, 8) +
    P('M80 96 q5 5 10 0 M110 96 q5 5 10 0', L, 3) + P('M88 116 q12 8 24 0', L, 3) + O(100, 90, 0) +
    R(120, 134, 44, 30, L, 'none', 4, 6) + O(160, 130, 11, C, C, 3) + O(150, 122, 8, C, C, 3) + P('M130 144 h24 M130 154 h16', L, 3) + GROUND;

  // Protect Mind, spend Research: a hammock, a sleeper, papers piling up on the ground
  S['mind-research'] = P('M30 172 V80 M170 172 V80', L) + P('M30 90 Q100 150 170 90', G, 5) + P('M60 104 Q100 120 140 104', G, 4) +
    O(80, 100, 9, L, 'none', 3) + P('M90 106 Q110 116 128 104', L, 3) + P('M74 98 q3 3 6 0', L, 2) + P('M96 52 l4 -8 M108 56 l8 -6 M116 66 l10 -2', G, 3) +
    R(70, 150, 40, 14, C, 'none', 3, 2) + R(76, 138, 40, 14, C, 'none', 3, 2) + R(66, 164, 44, 8, C, 'none', 3, 2) + GROUND;

  // Protect Body, spend Mind: a runner with a scribble of worry above
  S['body-mind'] = O(110, 66, 12, L, 'none') + P('M104 80 L92 112 L110 132 L108 166 M92 112 L66 120 M104 84 L132 96 L140 80 M92 112 L84 150 L64 166', L) +
    P('M96 26 c-14 0 -14 16 2 16 c14 0 12 -20 -6 -22 c-24 -2 -26 30 4 32 c26 0 20 -34 -8 -34', C, 3) + P('M24 100 h26 M16 120 h30 M30 140 h22', G, 4) + GROUND;

  // Protect Body, spend Wallet: a dumbbell, an empty wallet
  S['body-wallet'] = R(26, 92, 18, 52, G, G, 3, 5) + R(46, 82, 18, 72, G, G, 3, 5) + P('M64 118 H136', L, 6) + R(136, 82, 18, 72, G, G, 3, 5) + R(156, 92, 18, 52, G, G, 3, 5) +
    R(60, 38, 80, 30, C, 'none', 4, 6) + P('M60 50 H140', C, 3) + O(122, 53, 4, C, C, 2) + P('M84 168 h32', L, 4) + P('M30 36 l8 -8 M170 36 l-8 -8', G, 3);

  // Protect Body, spend Friends: a lone runner at sunrise, an empty bench with a dotted friend
  S['body-bonds'] = F('M30 120 A70 70 0 0 1 170 120 Z', G, 0.35) + P('M30 120 A70 70 0 0 1 170 120', G, 4) + P('M100 36 v-14 M52 56 l-10 -10 M148 56 l10 -10', G, 3) +
    P('M10 150 Q60 130 120 150 T200 140', L, 3) + O(70, 96, 8) + P('M66 104 L58 124 L70 134 L68 156 M58 124 L42 128 M66 108 L84 114 M58 124 L52 148', L, 3.5) +
    P('M118 150 h50 M122 150 v16 M164 150 v16 M118 134 h50', L, 3) + `<g stroke="${C}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" fill="none"><circle cx="143" cy="108" r="8"/><path d="M143 116 v22 M143 124 l-10 8 M143 124 l10 8"/></g>`;

  // Protect Body, spend Research: a hiker on a peak, a closed laptop far below
  S['body-research'] = P('M14 164 L70 70 L104 124 L130 90 L186 164 Z', L) + F('M70 70 L56 94 L70 86 L82 96 Z', G, 0.9) + P('M62 82 L70 70 L78 82', G, 3) +
    O(128, 70, 6, G, 'none', 3) + P('M128 76 L122 92 L130 100 M124 82 L112 86 M128 80 L140 76', G, 3) +
    R(30, 172, 36, 4, C, C, 2, 1).replace('y="172"', 'y="163"') + P('M32 163 L36 148 H62 L66 163', C, 3) + P('M44 138 h6 l-6 -8 h6', C, 3);

  // Protect Wallet, spend Mind: a piggy bank with sweat drops and a knot above
  S['wallet-mind'] = E(100, 118, 54, 40, G, G, 4).replace('fill-opacity', 'x') + E(100, 118, 54, 40, L, 'none', 4) + P('M64 90 L58 74 L78 84', L, 4) +
    O(138, 108, 3, L, L, 2) + P('M154 112 q14 0 18 -10 q-6 -2 -10 2', L, 4) + P('M80 156 v14 M120 156 v14', L, 5) + P('M88 84 h24', '#0e0c0a', 5) +
    P('M52 28 c-12 0 -12 14 2 14 c12 0 10 -18 -5 -19 c-20 -2 -22 26 3 28', C, 3) + drops(150, 50) + drops(166, 66) + drops(40, 62);

  // Protect Wallet, spend Body: instant noodle cup, coins, a dizzy swirl
  S['wallet-body'] = P('M54 84 H146 L134 160 H66 Z', L, 4, '#1a1714') + P('M52 84 Q100 62 148 84', L) + P('M62 112 H138', G, 5) + P('M74 132 H126', G, 3) +
    P('M76 70 q-6 -12 2 -22 M100 66 q-6 -12 2 -24 M124 70 q-6 -12 2 -22', L, 3) + coin(168, 154, 10) + coin(168, 138, 10) + coin(168, 122, 10) +
    P('M26 52 a10 10 0 1 1 10 10 a5 5 0 1 1 -5 -5', C, 3);

  // Protect Wallet, spend Friends: a small house, a coin jar, an unopened invitation
  S['wallet-bonds'] = P('M44 100 L100 52 L156 100', L) + P('M56 92 V168 H144 V92', L) + R(84, 128, 32, 40, L, 'none', 4, 3) + R(66, 104, 20, 20, G, G, 3, 2) +
    R(158, 138, 28, 30, G, 'none', 4, 4) + P('M162 138 v-6 h20 v6', G, 4) + coin(172, 154, 6) +
    `<g stroke="${C}" stroke-width="3" stroke-dasharray="3 6" fill="none" stroke-linecap="round"><rect x="14" y="132" width="34" height="24" rx="3"/><path d="M14 134 l17 12 l17 -12"/></g>` + GROUND;

  // Protect Wallet, spend Research: a delivery bag with coins, a thesis page that is still a draft
  S['wallet-research'] = R(30, 70, 66, 62, G, G, 4, 8) + P('M46 70 V58 Q46 46 62 46 Q78 46 78 58 V70', L, 4) + O(62, 100, 14, '#0e0c0a', 'none', 3) +
    coin(120, 52, 9) + coin(142, 40, 9) + coin(160, 62, 9) + coin(128, 74, 9) +
    R(112, 110, 56, 56, C, 'none', 4, 3) + P('M122 126 h36 M122 138 h24 M122 150 h30', C, 3) + P('M154 100 L178 76', L, 5) + O(40, 150, 14, L) + O(88, 150, 14, L) + P('M26 164 h80', L, 3);

  // Protect Friends, spend Mind: a mother duck, ducklings, a knot of worry above
  S['bonds-mind'] = E(96, 128, 46, 30, G, G, 4) + E(96, 128, 46, 30, L, 'none', 4) + O(130, 84, 18, L, G) + P('M146 84 l18 6 l-16 6', C, 4, C) + O(134, 80, 2.5, '#0e0c0a', '#0e0c0a', 1) +
    P('M62 124 q16 -14 30 0', L, 3) + E(36, 156, 11, 8, G, G, 3) + O(30, 142, 7, G, G, 3) + E(62, 160, 10, 7, G, G, 3) + O(56, 148, 6, G, G, 3) +
    P('M84 158 v10 M112 158 v10', L, 5) +
    P('M110 34 c-14 0 -14 16 2 16 c14 0 12 -20 -6 -22 c-24 -2 -26 30 4 32', C, 3) + GROUND;

  // Protect Friends, spend Body: a name tag with a star, a sore foot in a sneaker with a plaster
  S['bonds-body'] = P('M70 20 V44 M130 20 V44', L, 3) + P('M70 44 H130', L, 3) + R(54, 52, 92, 62, L, '#1a1714', 4, 8) + P('M100 66 l7 14 l15 2 l-11 11 l3 15 l-14 -8 l-14 8 l3 -15 l-11 -11 l15 -2 Z', G, 3, G) +
    P('M44 160 H148 Q158 160 158 150 Q158 134 142 130 L116 124 L96 140 L68 136 L56 126 L44 130 Z', L, 4) + P('M70 138 L86 150', L, 3) + R(100, 140, 22, 10, C, 'none', 3, 3) + P('M170 118 l8 -8 M172 134 l12 0 M168 148 l8 6', C, 3);

  // Protect Friends, spend Wallet: a long receipt, a thin card, a sweat drop, little hearts
  S['bonds-wallet'] = P('M56 24 H126 V150 L116 142 L106 150 L96 142 L86 150 L76 142 L66 150 L56 142 Z', L, 4, '#1a1714') + P('M68 42 h48 M68 58 h48 M68 74 h48 M68 90 h30', L, 3) + P('M68 112 h22', G, 4) + P('M96 112 h20', L, 3) +
    R(112, 124, 66, 42, C, 'none', 4, 6) + P('M112 138 H178', C, 5) + drops(168, 100) +
    P('M26 56 c-8 -10 6 -18 10 -8 c4 -10 18 -2 10 8 l-10 10 Z', G, 3, G) + P('M148 40 c-6 -8 4 -14 8 -6 c4 -8 14 -2 8 6 l-8 8 Z', G, 3, G);

  // Protect Friends, spend Research: bunting, a cake, a blank page with a pencil
  S['bonds-research'] = P('M14 36 Q100 76 186 36', L, 3) + F('M34 44 l10 24 l10 -20 Z', G) + F('M70 54 l10 22 l10 -18 Z', L, 0.9) + F('M108 58 l10 22 l10 -20 Z', G) + F('M146 52 l10 22 l10 -22 Z', L, 0.9) +
    R(34, 118, 66, 42, G, G, 4, 4) + P('M34 138 q8 8 16 0 q8 8 16 0 q8 8 18 0', '#0e0c0a', 3) + P('M67 118 v-14', L, 4) + P('M67 96 q-5 -6 0 -12 q5 6 0 12', C, 3, C) +
    P('M118 168 L122 118 H174 V168 Z', C, 3) + P('M130 134 h36 M130 146 h20', C, 2) + P('M150 164 L186 116 L192 122 L156 168 Z', L, 3) + GROUND;

  // Protect Research, spend Mind: a laptop with a rising chart, a frazzled scribble
  S['research-mind'] = R(40, 80, 120, 72, L, '#1a1714', 4, 6) + P('M24 156 H176', L, 5) + P('M56 134 L82 112 L104 122 L146 92', G, 6) + P('M134 92 H148 V106', G, 6) +
    P('M70 40 l-8 -22 M92 36 l0 -26 M114 40 l8 -24 M134 50 l18 -16 M54 54 l-18 -12', C, 4) + O(92, 54, 10, C, 'none', 3);

  // Protect Research, spend Body: a hunched figure with glowing eyes at a laptop
  S['research-body'] = P('M40 168 V100 Q42 52 100 52 Q140 52 146 92 L140 112', L, 5) + F('M52 120 Q60 70 100 66 Q132 66 138 96 L120 100 Q104 82 80 92 Q62 104 64 130 Z', G, 0.28) +
    P('M96 84 l8 6 M118 84 l-8 6', L, 3) + O(104, 96, 4, G, G, 2) + O(124, 96, 4, G, G, 2) + P('M64 60 L52 40 M142 62 L152 44', L, 4) +
    R(110, 128, 60, 38, L, '#1a1714', 4, 4) + P('M104 168 H180', L, 5) + P('M44 100 q-12 22 -2 50', C, 4) + P('M26 96 l-8 -6 M24 116 l-12 0 M28 134 l-10 8', C, 3);

  // Protect Research, spend Wallet: a tall stack of papers, one coin with a hole
  S['research-wallet'] = R(52, 130, 96, 18, L, '#1a1714', 4, 2) + R(60, 112, 84, 18, G, G, 4, 2) + R(48, 94, 92, 18, L, '#1a1714', 4, 2) + R(58, 76, 86, 18, G, G, 4, 2) + R(50, 58, 92, 18, L, '#1a1714', 4, 2) +
    P('M52 150 H148', L, 4) + P('M70 44 l8 8 l16 -16', G, 5) + O(168, 150, 16, C, 'none', 4) + O(168, 150, 5, C, 'none', 3) + P('M164 60 l10 -6 M168 76 l14 0', C, 3) + GROUND;

  // Protect Research, spend Friends: one person at the end of a long table of empty chairs
  S['research-bonds'] = P('M14 112 H186', L, 5) + P('M30 112 V160 M170 112 V160', L, 4) +
    P('M30 128 V150 H46 M70 128 V150 H86 M114 128 V150 H130', C, 3).replace(/stroke="#ff8a78" stroke-width="3"/, `stroke="${C}" stroke-width="3" stroke-dasharray="3 6"`) +
    O(158, 66, 11) + P('M158 78 L158 108 M158 86 L140 96 L128 92 M158 86 L172 96', L, 4) + R(110, 88, 22, 24, G, G, 3, 2) + R(104, 96, 22, 16, G, G, 3, 2) + P('M30 36 L44 26 M54 40 L62 30', G, 3) + P('M152 150 h20', L, 4);

  return { S, L, G, C };
})();

const BADGE_FILTER = '<filter id="hand" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter>';

// The scene as an SVG string. `id` is the badge id ("mind-body").
function badgeArtSvg(id, cls) {
  const inner = BA.S[id] || '';
  return `<svg${cls ? ` class="${cls}"` : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-hidden="true"><defs>${BADGE_FILTER}</defs><g filter="url(#hand)">${inner}</g></svg>`;
}
