const ARCHETYPE_DATA = {
  overachiever: {
    blurb: 'Steady at everything. Gets a little Mind back when it runs low.',
    emoji: '📈', name: 'The Overachiever', perk: 'One More Hour',
    rules: { everyCards: 3, lowMind: 20, mindRecovery: 3 },
    get desc() { const rules = this.rules; return `First in, last out, good at most things. After the first choice and every ${rules.everyCards} cards after it, Mind below ${rules.lowMind} gets +${rules.mindRecovery} back.`; },
    st: { mind: 50, body: 45, wallet: 60, bonds: 50, research: 10 }
  },
  vibe_coder: {
    blurb: 'Lets the AI write the code. Pipeline cards pay more, people cards hurt more.',
    emoji: '🤖', name: 'The Vibe-Coder', perk: 'Prompt Engineering',
    rules: { techGain: 1.5, socialLoss: 1.3 },
    get desc() { const rules = this.rules; return `Has a new AI tool to show you every week. Gains on pipeline cards are ${rules.techGain}x; losses on social and everyday-life cards are ${rules.socialLoss}x.`; },
    st: { mind: 60, body: 47, wallet: 60, bonds: 45, research: 15 }
  },
  fun_haver: {
    blurb: 'Everyone\'s favorite person. Friends come easy, research comes slowly.',
    emoji: '🎉', name: 'The Fun Haver', perk: 'Everyone\'s Plus-One',
    rules: { bondsGain: 1.5, researchGain: 0.75 },
    get desc() { const rules = this.rules; return `Knows everyone's birthday and most of their roommates. Friends gains from cards are ${rules.bondsGain}x; Research gains are ${rules.researchGain}x.`; },
    st: { mind: 50, body: 58, wallet: 50, bonds: 70, research: 20 }
  },
  global_student: {
    blurb: 'Far from home, with a tight circle. Visa stress arrives late.',
    emoji: '🌏', name: 'The Global Student', perk: 'Tight-Knit Circle',
    rules: { bondsLoss: 0.75, visaSemester: 7, visaDrain: 2 },
    get desc() { const rules = this.rules; return `A close community back home and here: Friends losses from cards are ${rules.bondsLoss}x. From semester ${rules.visaSemester}, visa paperwork costs ${rules.visaDrain} Mind every card.`; },
    st: { mind: 50, body: 50, wallet: 60, bonds: 55, research: 10 }
  },
  biologist: {
    blurb: 'Knows the organism, fears the terminal. Friends soften code disasters.',
    emoji: '🧫', name: 'The Biologist', perk: '"Can I Send You My Data?"',
    rules: { highBonds: 50, lowBonds: 30, supportedLoss: 0.5, isolatedLoss: 2, labGain: 1.3, qualsResearch: 25 },
    get desc() { const rules = this.rules; return `Knows the organism inside out, opens .py files in Word. Research losses on pipeline cards are ${rules.supportedLoss}x with Friends above ${rules.highBonds}, ${rules.isolatedLoss}x below ${rules.lowBonds}. Lab Life and Lab Politics Research gains are ${rules.labGain}x. The qualifying exam needs ${rules.qualsResearch} Research.`; },
    st: { mind: 45, body: 50, wallet: 55, bonds: 60, research: 10 }
  },
  double_agent: {
    blurb: 'Bench and terminal both. More research, small random costs.',
    emoji: '🧬', name: 'The Double Agent', perk: 'Wet + Dry',
    rules: { researchBonus: 3, randomDrain: 1 },
    get desc() { const rules = this.rules; return `Bench in the morning, terminal at night. Research gains from cards get +${rules.researchBonus}; every card also takes ${rules.randomDrain} from Mind, Body, Wallet or Friends, at random.`; },
    st: { mind: 55, body: 45, wallet: 58, bonds: 55, research: 5 }
  },
  gym_bro: {
    blurb: 'Body never drops far. Money and Mind take the hits instead.',
    emoji: '💪', name: 'The Gym Bro', perk: 'Never Skip Leg Day',
    rules: { bodyFloor: 15, loss: 1.15 },
    get desc() { const rules = this.rules; return `Lifts at 6am, every day. After each choice Body comes back up to at least ${rules.bodyFloor}, before other drains. Wallet and Mind losses from cards are ${rules.loss}x.`; },
    st: { mind: 52, body: 70, wallet: 52, bonds: 55, research: 5 }
  },
  neurodivergent: {
    blurb: 'Mind and Research swing harder, both ways.',
    emoji: '🧩', name: 'The Neurodivergent', perk: 'Hyperfocus / Hyperfail',
    rules: { mindChange: 1.3, researchChange: 1.3 },
    get desc() { const rules = this.rules; return `Mind changes from cards are ${rules.mindChange}x, gains and losses alike. Research changes are ${rules.researchChange}x the same way.`; },
    st: { mind: 65, body: 45, wallet: 50, bonds: 50, research: 10 }
  }
};
