# Network-Flavored Endings Design

**Date:** 2026-03-20
**Status:** Approved

## Summary

Extend the existing network-flavored ending pattern (currently only on "Defended") to two additional endings: Mastered Out and Broke. Each gets a high-network and low-network body text variant. Low-network variants also show a replayability hint nudging players to invest in networking choices.

## Scope

**Endings with network variants:**
| Ending | Status |
|---|---|
| Defended | Already implemented (`network > 30`) |
| Mastered Out | New |
| Broke | New |
| Burnt Out | Out of scope — network is not meaningfully related to mental collapse |
| Hospitalized | Out of scope — body failure, network is secondary |
| Disappeared | Out of scope — high network + zero bonds causes mechanical confusion (player wonders why connections didn't help) |

**Network threshold:** `network > 30` (consistent with existing Defended logic)

## Flavor Text

### Mastered Out

**High network (> 30):**
> "The master's opens a door your PhD would have kept closed. A contact from the conference two years ago is now a hiring manager. You send one email. They respond in an hour."

**Low network (≤ 30):**
> "The master's is real and the expertise is yours. What comes next is less clear. You update your resume. You start from scratch."

### Broke

**High network (> 30):**
> "An email arrives before your card declines a second time. Someone you met at a poster session has a contract role. Two weeks of work. Enough to breathe. Networks pay out in strange moments."

**Low network (≤ 30):**
> "Your card declines at the vending machine in Brooks Hall. You have $3.47. There's no one to call. Your stipend doesn't arrive until the 15th. It is the 3rd."

## Network Replayability Hint

Shown below the ending body when `network ≤ 30`, only on Mastered Out and Broke.

**Hint text:**
> 💡 Your network score was low this run. Choices that build professional connections — conferences, LinkedIn, collaborations — unlock a different version of this ending.

**Visual treatment:** dashed border callout (signals meta/hint vs. solid borders for story content).

## Implementation

**Files touched:** `js/ui.js`, `css/style.css` only.

### `js/ui.js` — `renderEnding()`

1. Compute `const hiNet = gameState.network > 30;` at the top of `renderEnding()`.
2. Add `networkMsg` to `mastered_out` ending body using the flavor text above.
3. Add `networkMsg` to `broke` ending body using the flavor text above.
4. Add `networkHint` HTML string: shown when `!hiNet` on mastered_out and broke; empty string otherwise.
5. Render `networkHint` after the ending body `<div>`, before `ending-stats`.

### `css/style.css`

Add one rule:
```css
.network-hint {
  font-family: var(--font-sans); font-size: 13px; color: var(--dim);
  border: 1px dashed var(--border); border-radius: 8px;
  padding: 12px 14px; margin-bottom: 16px; line-height: 1.6;
}
```

## Constraints

- Do not change milestone card effects
- Do not bump save version (no `gameState` schema changes)
- Do not show network value to the player (remains hidden)
