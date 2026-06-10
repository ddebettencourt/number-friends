# Gameplay Ideas & Suggestions

*Written by Claude (Fable 5) during the June 2026 visual overhaul. These are design
suggestions only — none of them are implemented. The existing `app/MINIGAME_IDEAS.md`
covers minigame concepts; this doc focuses on the overall game loop, pacing, and
player experience.*

---

## 🐛 First, a real bug worth deciding on: Chutes & Ladders never fire

`boardHelpers.ts` defines `DEFAULT_CONNECTIONS` (6 ladders, 6 chutes) and a
`getConnectionDestination()` helper, and the 2D board *draws* them — but
`gameStore.movePlayer()` never calls `getConnectionDestination`, so landing on
square 4 doesn't take you to 14. The connections are pure decoration right now.

Two ways to go:

1. **Wire them up.** One line in `movePlayer` after computing `newPosition`. But then
   you should also render them in the immersive/3D boards, or players will be
   teleported with no visual explanation.
2. **Remove them.** Honestly, the math-special-squares *are* this game's chutes and
   ladders — primes, squares, and Fibonacci numbers already create the "snakes and
   boosts" texture. Classic chutes may be redundant and they fight the math theme.

My vote: **remove the classic chutes/ladders and lean into "math chutes"** (see idea
#2 below). Keeping dead decorative arrows on one of three board modes is the worst of
both worlds.

---

## 1. Fix the catch-up mechanic's invisibility

There IS a catch-up mechanic (+1..3 squares when 30+ behind the leader) buried in
`movePlayer`, but nothing in the UI announces it. A player who benefits never knows.
Rubber-banding only creates drama if players *see* it.

**Suggestion:** When the bonus triggers, show a quick "⚡ Comeback Wind! +2" toast and
hop the pawn the extra squares as a visibly separate move. Cheap to build, big
perceived-fairness payoff.

## 2. "Math chutes": make special numbers move you, not just minigame you

Right now every special square triggers a minigame, which makes all special squares
feel the same (a modal appears). Differentiate by letting some numbers act as
instant terrain:

- **Composite collapse:** landing on a highly composite number (48, 60, 96…) gives a
  choice: "factor down" to its largest proper divisor as a safe retreat, or stay put.
- **Prime climb:** win a prime minigame → advance to the *next* prime (already partly
  the design) — but show the chain of primes lighting up on the board as a "ladder."
- **Square root slide:** land on a perfect square *while behind the leader* → option
  to teleport to its square root's square × something interesting. (e.g. from 81,
  ride to 9× your current die roll, capped at 100.)

The principle: minigames should be ~50% of special-square events, terrain effects the
other 50%, so the pacing alternates between "stop and play" and "whee, movement."

## 3. Turn length is the #1 pacing risk — add a "fast minigame" tier

A 4-player game where every other landing triggers a 30–60s minigame means several
minutes between *your* turns. Suggestions:

- Tag each minigame as **quick** (≤15s: Prime-Off, Greater/Lesser) or **deep**
  (Blackjack, Number Builder). Never trigger two deep games in a row for the same
  player; if the last event was deep, downgrade to a quick one.
- **Everyone plays:** more minigames where all players participate simultaneously
  (Root Race already does this). Spectating is the dead time — minimize it.
- A **"skip for +1"** option: any player can decline a minigame and just take +1
  square. Keeps impatient/young players in flow.

## 4. Dice choice should be a decision, not a slot machine

The spinner picks your die randomly, which wastes the most interesting object in the
game (six dice with different distributions!). Ideas, in increasing order of depth:

- **Pick 1 of 3:** spinner offers three random dice; the player picks one. Now d4 vs
  d10 near square 97 is a real decision (you must land on 100 *exactly* — bounce-back
  punishes greed).
- **Die drafting:** at game start each player drafts 2 personal dice; each turn choose
  one of yours or the random spinner. Creates identity ("I'm the Gaussian gambler").
- **Endgame math:** past square 90, show the probability of hitting exactly 100 with
  each offered die. Sneaky probability education, and it makes the endgame tense
  instead of a coin-flip grind.

## 5. The Gaussian die deserves to be the star

It's the most original mechanic in the game (mean + SD from two d6, can roll
negative!). Make it legible: show the bell curve with the rolled mean/SD, animate the
sample being drawn from it, and mark where the result fell. Players will internalize
"high SD = risky" within two rolls. This is the game's signature educational moment
and right now it reads as random noise.

## 6. Victory conditions: soften the "exactly 100" wall

Bounce-back at 100 plus a must-win Final Showdown can stall the endgame badly (a
player can yo-yo in the 90s for many turns while others catch up — which is sort of
fun once, then tedious).

- Track **bounce count**: after a player bounces off 100 twice, let them win on
  "100 or more" (announced as "the Summit takes pity").
- Or: each bounce *upgrades* your Final Showdown (start with a small head start in
  the showdown per bounce). Failure earns equity instead of pure frustration.

## 7. Session-level ideas

- **Best-of-three sprint mode:** board to 50 instead of 100, ~15 minutes. Great for
  "one more game" at the end of a family game night when the full board feels long.
- **Daily challenge seed:** same dice sequence + minigame order for everyone that day;
  share scores. Trivially cheap (seeded RNG) and gives the game replay pull.
- **House rules screen:** a pre-game toggle list (chutes on/off, bounce-back on/off,
  minigame frequency, sprint board). Family games accumulate house rules over the
  years — letting players encode *their* version is half the nostalgia. This also
  neatly resolves design questions like #6: make them toggles instead of decisions.
- **Stats payoff:** `statsStore` already records every turn — surface it on the
  victory screen ("Longest ladder of the game", "Most primes landed", "Unluckiest
  roll"). Data you already collect, zero new mechanics, big end-of-game delight.

## 8. Small polish items with outsized gameplay feel

- **Anticipation on near-special squares:** when a pawn's path will pass within 2 of
  a special square, slow the hop animation slightly as it approaches — hit or miss
  both become little drama beats.
- **Turn preview:** before rolling, faintly highlight the reachable range on the
  board for the offered die (min..max). Teaches dice ranges and adds tension.
- **Rivalry pings:** when you pass another player's pawn, a quick "Passed Blue!"
  callout. Local multiplayer thrives on teasing.

---

## Priority if I had to pick three

1. **#4 Pick-1-of-3 dice** — biggest strategy gain for the least code.
2. **#3 fast/deep minigame pacing** — protects the core loop from its main failure mode.
3. **#1 visible catch-up** (plus deciding the chutes/ladders question) — fairness you
   already built, just unhidden.
