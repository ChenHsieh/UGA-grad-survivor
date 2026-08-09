// `desc` must state what applyPerk() in engine.js actually does — players choose
// on this text. Check the code before editing it.
const ARCHETYPE_DATA = {
  overachiever: { name: 'The Overachiever', perk: 'One More Hour', desc: 'First in, last out. Every 3 cards, Mind below 20 recovers +3.', st: { mind: 50, body: 45, wallet: 60, bonds: 50, research: 55 } },
  vibe_coder: { name: 'The Vibe-Coder', perk: 'Prompt Engineering', desc: 'Your brain outsourced itself. Tech gains +50%, social and life losses +30%.', st: { mind: 60, body: 47, wallet: 60, bonds: 45, research: 60 } },
  fun_haver: { name: 'The Fun Haver', perk: 'Main Character Energy', desc: 'Bad scientist, great friend. Bonds gains 1.5x, Research gains halved.', st: { mind: 50, body: 58, wallet: 50, bonds: 70, research: 35 } },
  global_student: { name: 'The Global Student', perk: 'Tight-Knit Circle', desc: 'Bonds losses cut 25%. Visa stress hits Mind from semester 7.', st: { mind: 50, body: 50, wallet: 60, bonds: 55, research: 50 } },
  biologist: { name: 'The Biologist', perk: '"Can I Send You My Data?"', desc: 'Opens .py in Word. Lab research gains +30%. Tech research losses halve above 50 Bonds, double below 30. Quals harder.', st: { mind: 45, body: 50, wallet: 55, bonds: 60, research: 40 } },
  double_agent: { name: 'The Double Agent', perk: 'Wet + Dry', desc: 'Bench and terminal both. Research gains +3, one random stat drains 1 per card.', st: { mind: 55, body: 45, wallet: 58, bonds: 55, research: 55 } },
  gym_bro: { name: 'The Gym Bro', perk: 'Never Skip Leg Day', desc: 'Body can\'t drop below 15. Wallet and Mind losses 1.15x.', st: { mind: 52, body: 70, wallet: 52, bonds: 55, research: 45 } },
  neurodivergent: { name: 'The Neurodivergent', perk: 'Hyperfocus / Hyperfail', desc: 'Medicated, brilliant. Otherwise chaos. Mind and Research changes both 1.3x.', st: { mind: 65, body: 45, wallet: 50, bonds: 50, research: 50 } }
};
