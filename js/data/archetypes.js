const ARCHETYPE_DATA = {
  overachiever: {
    blurb: 'Steady at everything. Gets a little Mind back when it runs low.',
    emoji: '📈', name: 'The Overachiever', perk: 'One More Hour',
    rules: { everyCards: 3, lowMind: 20, mindRecovery: 3 },
    get desc() { const rules = this.rules; return `First in, last out. Well-rounded, hardworking, slightly boring. After the first choice, then every ${rules.everyCards} cards, if Mind is below ${rules.lowMind}, recover +${rules.mindRecovery} Mind.`; },
    st: { mind: 50, body: 45, wallet: 60, bonds: 50, research: 10 }
  },
  vibe_coder: {
    blurb: 'Lets the AI write the code. Pipeline cards pay more, people cards hurt more.',
    emoji: '🤖', name: 'The Vibe-Coder', perk: 'Prompt Engineering',
    rules: { techGain: 1.5, socialLoss: 1.3 },
    get desc() { const rules = this.rules; return `Always sharing the latest AI tools. Gains on tech cards ${rules.techGain}x, but losses on social/life cards ${rules.socialLoss}x. Your brain outsourced itself.`; },
    st: { mind: 60, body: 47, wallet: 60, bonds: 45, research: 15 }
  },
  fun_haver: {
    blurb: 'Everyone\'s favorite person. Friends come easy, research comes slow.',
    emoji: '🎉', name: 'The Fun Haver', perk: 'Main Character Energy',
    rules: { bondsGain: 1.5, researchGain: 0.75 },
    get desc() { const rules = this.rules; return `Parties the night before defense. Card Friends gains ${rules.bondsGain}x, Research gains ${rules.researchGain}x. Bad scientist, great friend.`; },
    st: { mind: 50, body: 58, wallet: 50, bonds: 70, research: 20 }
  },
  global_student: {
    blurb: 'Far from home, with a tight circle. Visa stress arrives late.',
    emoji: '🌏', name: 'The Global Student', perk: 'Tight-Knit Circle',
    rules: { bondsLoss: 0.75, visaSemester: 7, visaDrain: 2 },
    get desc() { const rules = this.rules; return `Card Friends losses ${rules.bondsLoss}x (strong community). Visa stress drains ${rules.visaDrain} Mind per card from semester ${rules.visaSemester}. Resourceful and resilient.`; },
    st: { mind: 50, body: 50, wallet: 60, bonds: 55, research: 10 }
  },
  biologist: {
    blurb: 'Knows the organism, fears the terminal. Friends soften code disasters.',
    emoji: '🧫', name: 'The Biologist', perk: '"Can I Send You My Data?"',
    rules: { highBonds: 50, lowBonds: 30, supportedLoss: 0.5, isolatedLoss: 2, labGain: 1.3, qualsResearch: 25 },
    get desc() { const rules = this.rules; return `Opens .py in Word. Knows their organism inside out. When Friends > ${rules.highBonds}, tech card Research losses ${rules.supportedLoss}x. When Friends < ${rules.lowBonds}, ${rules.isolatedLoss}x. Lab Life/Politics Research gains ${rules.labGain}x. Quals require ${rules.qualsResearch} Research.`; },
    st: { mind: 45, body: 50, wallet: 55, bonds: 60, research: 10 }
  },
  double_agent: {
    blurb: 'Bench and terminal both. More research, small random costs.',
    emoji: '🧬', name: 'The Double Agent', perk: 'Wet + Dry',
    rules: { researchBonus: 3, randomDrain: 1 },
    get desc() { const rules = this.rules; return `Nobody knows how you manage both bench and terminal. Card Research gains +${rules.researchBonus} bonus, but random -${rules.randomDrain} drain to Mind, Body, Wallet or Friends per card.`; },
    st: { mind: 55, body: 45, wallet: 58, bonds: 55, research: 5 }
  },
  gym_bro: {
    blurb: 'Body never drops far. Money and Mind take the hits instead.',
    emoji: '💪', name: 'The Gym Bro', perk: 'Never Skip Leg Day',
    rules: { bodyFloor: 15, loss: 1.15 },
    get desc() { const rules = this.rules; return `Strong and good looking. Body recovers to at least ${rules.bodyFloor} after a choice, before passive drains. But card Wallet and Mind losses are ${rules.loss}x. Unstable mind, low wallet.`; },
    st: { mind: 52, body: 70, wallet: 52, bonds: 55, research: 5 }
  },
  neurodivergent: {
    blurb: 'Mind and Research swing harder, both ways.',
    emoji: '🧩', name: 'The Neurodivergent', perk: 'Hyperfocus / Hyperfail',
    rules: { mindChange: 1.3, researchChange: 1.3 },
    get desc() { const rules = this.rules; return `Card Mind changes ${rules.mindChange}x (gains AND losses). Research changes ${rules.researchChange}x. When medicated, brilliant. When not, chaos.`; },
    st: { mind: 65, body: 45, wallet: 50, bonds: 50, research: 10 }
  }
};
