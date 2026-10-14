const ARCHETYPE_DATA = {
  overachiever: {
    emoji: '📈', name: 'The Overachiever', perk: 'One More Hour',
    rules: { everyCards: 3, lowMind: 20, mindRecovery: 3 },
    get desc() { const rules = this.rules; return `First in, last out. Well-rounded, hardworking, slightly boring. After the first choice, then every ${rules.everyCards} cards, if Mind is below ${rules.lowMind}, recover +${rules.mindRecovery} Mind.`; },
    st: { mind: 50, body: 45, wallet: 60, bonds: 50, research: 55 }
  },
  vibe_coder: {
    emoji: '🤖', name: 'The Vibe-Coder', perk: 'Prompt Engineering',
    rules: { techGain: 1.5, socialLoss: 1.3 },
    get desc() { const rules = this.rules; return `Always sharing the latest AI tools. Gains on tech cards ${rules.techGain}x, but losses on social/life cards ${rules.socialLoss}x. Your brain outsourced itself.`; },
    st: { mind: 60, body: 47, wallet: 60, bonds: 45, research: 60 }
  },
  fun_haver: {
    emoji: '🎉', name: 'The Fun Haver', perk: 'Main Character Energy',
    rules: { bondsGain: 1.5, researchGain: 0.75 },
    get desc() { const rules = this.rules; return `Parties the night before defense. Card Bonds gains ${rules.bondsGain}x, Research gains ${rules.researchGain}x. Bad scientist, great friend.`; },
    st: { mind: 50, body: 58, wallet: 50, bonds: 70, research: 35 }
  },
  global_student: {
    emoji: '🌏', name: 'The Global Student', perk: 'Tight-Knit Circle',
    rules: { bondsLoss: 0.75, visaSemester: 7, visaDrain: 2 },
    get desc() { const rules = this.rules; return `Card Bonds losses ${rules.bondsLoss}x (strong community). Visa stress drains ${rules.visaDrain} Mind per card from semester ${rules.visaSemester}. Resourceful and resilient.`; },
    st: { mind: 50, body: 50, wallet: 60, bonds: 55, research: 50 }
  },
  biologist: {
    emoji: '🧫', name: 'The Biologist', perk: '"Can I Send You My Data?"',
    rules: { highBonds: 50, lowBonds: 30, supportedLoss: 0.5, isolatedLoss: 2, labGain: 1.3, qualsResearch: 30 },
    get desc() { const rules = this.rules; return `Opens .py in Word. Knows their organism inside out. When Bonds > ${rules.highBonds}, tech card Research losses ${rules.supportedLoss}x. When Bonds < ${rules.lowBonds}, ${rules.isolatedLoss}x. Lab Life/Politics Research gains ${rules.labGain}x. Quals require ${rules.qualsResearch} Research.`; },
    st: { mind: 45, body: 50, wallet: 55, bonds: 60, research: 40 }
  },
  double_agent: {
    emoji: '🧬', name: 'The Double Agent', perk: 'Wet + Dry',
    rules: { researchBonus: 3, randomDrain: 1 },
    get desc() { const rules = this.rules; return `Nobody knows how you manage both bench and terminal. Card Research gains +${rules.researchBonus} bonus, but random -${rules.randomDrain} drain to Mind, Body, Wallet or Bonds per card.`; },
    st: { mind: 55, body: 45, wallet: 58, bonds: 55, research: 55 }
  },
  gym_bro: {
    emoji: '💪', name: 'The Gym Bro', perk: 'Never Skip Leg Day',
    rules: { bodyFloor: 15, loss: 1.15 },
    get desc() { const rules = this.rules; return `Strong and good looking. Body recovers to at least ${rules.bodyFloor} after a choice, before passive drains. But card Wallet and Mind losses are ${rules.loss}x. Unstable mind, low wallet.`; },
    st: { mind: 52, body: 70, wallet: 52, bonds: 55, research: 45 }
  },
  neurodivergent: {
    emoji: '🧩', name: 'The Neurodivergent', perk: 'Hyperfocus / Hyperfail',
    rules: { mindChange: 1.3, researchChange: 1.3 },
    get desc() { const rules = this.rules; return `Card Mind changes ${rules.mindChange}x (gains AND losses). Research changes ${rules.researchChange}x. When medicated, brilliant. When not, chaos.`; },
    st: { mind: 65, body: 45, wallet: 50, bonds: 50, research: 50 }
  }
};
