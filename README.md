# UGA Grad Survivor: Bioinformatics Edition

**A Reigns-style card game about surviving a PhD.**
Swipe left. Swipe right. Try not to lose your mind, your health, your money, or your relationships.

[Play Now →](https://chenhsieh.github.io/UGA-grad-survivor/)

![UGA Grad Survivor Preview](og-image.png)

---

## How to Play

You're a PhD student in bioinformatics at the University of Georgia. Every card presents a situation — swipe left or right to make a choice. Each choice affects your four stats:

- 🧠 **Mind** — sanity, focus, will to continue
- 💪 **Body** — physical health, sleep, energy
- 💰 **Wallet** — money, funding, financial stability
- 🤝 **Bonds** — all relationships (advisor, friends, cohort, family)

If any stat hits zero, your PhD is over. Survive 10 semesters and defend your dissertation to win.

## Choose Who You Are

**📈 The Overachiever** — First in, last out. Your desk has a ring light. You've applied to every fellowship. When things get bad, you just work harder. That's your gift and your problem.

**🎭 The Imposter** — Everyone else seems to understand what's going on. You don't. You compensate by being likeable and never letting anyone see you struggle. The mask is heavy.

**🛋️ The Coaster** — You're here for the degree, not the drama. Lab meetings are a suggestion. Your mental health is great. Your bank account is not.

**🔬 The True Believer** — You actually love your research. You have a favorite gene. This is simultaneously your greatest strength and the thing that will nearly destroy you.

**✊ The Organizer** — You figured out that the system doesn't break individuals by accident. When you invest in people, the whole lab gets stronger. Unlocks cards about the real fight for better pay.

Not all archetypes are available from the start. Each death unlocks something new.

## Game Structure

**10 semesters** across three phases, with milestone cards that gate the narrative:

| Phase | Semesters | Tone |
|-------|-----------|------|
| The Naive Years | 1–2 | Wonder, confusion, first mistakes |
| The Grind | 3–6 | Exhaustion, dark humor, pipeline failures |
| The Reckoning | 7–10 | Career decisions, defense prep, the finish line |

Milestone cards appear at phase boundaries — qualifying exam, paper submission, committee meetings, the career fork, scheduling the defense, and the defense itself. Your choices on milestones determine which of the 6 endings you reach.

## Six Ways It Ends

🎓 **Defended** — You made it. Walk across the stage. Then read what it actually cost.

📜 **Mastered Out** — You leave with a master's. Nobody calls it failing. The program does, technically.

💼 **Left for Industry** — The recruiter offered 4x your stipend. You did the math.

📂 **All But Dissertation** — You did the work. You just never finished the document. It happens more than anyone admits.

🛌 **Burned Out** — Your body filed a formal complaint.

🪙 **Broke** — Rare, because usually the money problems burn you out before the account actually hits zero. But sometimes the math just doesn't work.

Each ending has its own screen. Some include real numbers. Dying unlocks new archetypes and new endings — you're meant to play more than once.

## 131 Cards

The cards cover the real texture of PhD life: advisor ghosting, pipeline disasters, Athens rent increases, the NIH funding crisis, game day parking, stress baking, the LinkedIn comparison spiral, UCWGA organizing, and whether to take the side gig.

Cards are hyper-specific to UGA bioinformatics by design. If you've ever fought with conda environments on Sapelo2, argued with Reviewer 2, or Googled "Athens GA cost of living" after reading your stipend letter — this game was made for you.

## Balance

Calibrated against real PhD attrition data ([CGS](https://cgsnet.org), [Nature 2022 survey](https://www.nature.com/articles/d41586-022-03394-0)):

- Random play wins ~10% of the time. Strategic play wins ~70–98%.
- Financial stress is the background radiation, not usually the direct killer — it drains Mind and Body over time, matching how real grad student attrition works.
- The Imposter is the hardest archetype. The Coaster is the easiest. This is intentional.

## Tech

Zero dependencies. Single HTML file. No build step.

- Vanilla JS + CSS
- Touch swipe + mouse drag + button fallback
- 131 unique cards across 7 pools (3 phases + universal + callbacks + organizer-exclusive + milestones)
- localStorage for unlock persistence
- Mobile-first responsive design

## Deploy

```bash
# Just open it
open index.html

# Or serve it
python3 -m http.server 8080
```

For GitHub Pages: fork → Settings → Pages → deploy from `main`. Done.

Drop `index.html` on any static host (Netlify, Vercel, Cloudflare Pages, S3).

## Contributing

If you're a grad student and have a scenario that belongs in this game, open an issue or a PR. Card format:

```js
{ id:'unique_id', tag:'Category', emoji:'🔬', title:'Card Title',
  body:'The scenario. Be specific. Be funny. Be real.',
  cL:'Left choice', cR:'Right choice',
  eL:{ mind:-10, bonds:+5 }, eR:{ wallet:-8, body:+10 } }
```

Stats: `mind`, `body`, `wallet`, `bonds`. Max swing ±20 per stat. Every card should have at least one choice with a net positive.

## Credits

Made by [Chen Hsieh](https://chenhsieh.xyz) — UGA Bioinformatics PhD candidate, graduating June 2026.

Inspired by [Reigns](https://www.devolverdigital.com/games/reigns) by Nerial.

## License

[MIT](LICENSE)
