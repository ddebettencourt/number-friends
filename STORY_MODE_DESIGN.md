# Story Mode v2: "The Hollow Board"

*Design document — June 2026 (v2, expanded after design review).
A single-player/co-op narrative campaign for Number Friends, in conversation
with* The Number Devil *by Hans Magnus Enzensberger.*

---

## The cold open (the part nobody will see coming)

You start what looks like a **normal game**. Setup screen, pick your name,
the meadow, the dice slot machine. But something is off: **the tiles have no
numbers.** The minimap progress reads `—/—`. The die comes up blank.

You roll anyway. The pawn hops — and the path **crumbles**. You fall out of
the board world entirely, down through the dark…

…and are caught by **Zero**.

> **ZERO**: "Easy. Easy! You're all right — nothing's got you.
> …I'm Nothing. It's a long story."

The numbers are gone from the board because they're gone from *everywhere*.
The Number Devil has taken the world below — the place numbers actually live —
and locked the patterns away in their own lands. The board above is just the
first place anyone *noticed*.

To restore the board, you have to travel the number-lands, free the patterns,
gather companions, and climb back up to face the Devil at the Hundredth
Square.

## Why this structure is right for this game

- The prologue weaponizes nostalgia: the familiar game breaking IS the
  inciting incident. No cutscene could do it better than the real board
  failing mid-roll.
- The "world below" lets the math get more interesting than the board's
  squares-and-primes, without touching the family game everyone knows.
- The ending feeds back: when the numbers return, the *normal mode board*
  gains small permanent echoes of the story (see "After the credits").

## The cast (numerical characters, met in this order)

| Character | Who they are | Voice |
|---|---|---|
| **Zero** | Your first guide. The oldest number and the loneliest — adds nothing, multiplies everything away. Catches you when you fall (into nothing, naturally). | Dry, kind, a little melancholy. Constant nothing-puns he's tired of. |
| **Two** | The only even prime. Sick of being told she "doesn't count" as a real prime. Runs the Doubling Delta. | Chip on her shoulder, fierce, proud. |
| **The Hours** | Twelve sibling-numbers who live on a clock and can't count past themselves. Keepers of the Clockwork Commons. | Finish each other's— no, interrupt each other's sentences. |
| **Twenty-Seven** | A daredevil. Of all small numbers, her hailstone ride is the wildest (111 steps, peaking at 9,232 — true). | Adrenaline junkie. "You think YOUR path was long?" |
| **The Twins** | 11 and 13, twin primes. Pascal's Stair caretakers; combinatorics hustlers ("how many ways can you be wrong? We counted"). | Deadpan double act. |
| **Goldie (φ)** | The golden ratio. An artist who has never once finished a piece — she's irrational, it's literally impossible. Gallery owner. | Perfectionist, warm, self-deprecating. |
| **Root (√2)** | A fugitive since the Pythagoreans tried to drown the fact of her existence (true story — Hippasus). The Devil's book calls her kind "unreasonable." | Jumpy, whispery, brave when it counts. |
| **Twenty-Eight** | A perfect number (1+2+4+7+14 = 28). Keeper of the second oasis in the Long Sands; hasn't had a neighbor in 468 numbers. | Serene, a little lonely, at peace with both. |
| **Chance** | A coin who has never landed the way anyone expected. Won (or possibly lost?) from the Devil's game show. | Speaks in odds. Delighted by everything. |
| **The Innkeeper (ℵ)** | Runs the Infinite Inn, which is always full and always has room. | Serene, unhurried. Has never once been surprised. |
| **Primo** | The mascot from the tutorials — here revealed as the Devil's runaway apprentice. Your link between the world above and below. | Earnest, guilty, starstruck by the cast. |
| **The Number Devil** | Not a monster. The keeper of the number world, who decided people stopped deserving it. | Theatrical, vain, sulky — the book's devil, older and angrier. |

## The journey — three acts

### Act I — The Fall (prologue + 2 chapters)
*Concepts: zero, negatives, the number line as a place.*

- **Prologue: The Hollow Board.** Playable false-normal game. Blank die,
  numberless tiles, the fall. (~4 minutes, fully scripted.)
- **Ch. 1: Nullhaven.** Zero's home at the center of the Mirror Marsh, where
  every number's negative twin lives across the water. Puzzle: cross the
  marsh by keeping your running sum at exactly zero — stepping stones add
  and subtract; pick paths that cancel. Teaches: negatives as mirrors,
  inverses, zero as balance point. **Companion gained: Zero.**
- **Ch. 2: The Clockwork Commons.** A town that loops — walk far enough
  east and you're back where you started. Everything is arithmetic mod 12.
  The Devil locked the town gate with a shifted-alphabet cipher (Caesar →
  modular arithmetic, taught by the Hours bickering about what 9 + 5 is).
  Puzzle: set three clock-locks; decode the gate phrase. Teaches: mod
  arithmetic, remainders as *where you land on a loop* — which secretly
  reteaches the main game's bounce-back rule.

### Act II — The Lands (4 core chapters + 2 optional)
*Each land = one concept + one character + one signature mechanic. After
Act I you see the world map; core lands gate progress, optional lands give
extra companions (and the best replay value).*

- **Ch. 3: The Doubling Delta.** Two's domain: a chessboard field where one
  grain of rice doubles per square (the classic — played as escalating
  absurdity until the 64th square buries a mountain). Puzzle: binary locks —
  reach exact totals by choosing which powers of two to take. Teaches:
  binary, exponential growth in the gut, why doubling beats almost anything.
  **Companion: Two.**
- **Ch. 4: Pascal's Stair.** A mountainside of ledges where every ledge's
  number is the sum of the two above it. Descend by choosing paths; the
  Twins light up what you trace: odd-numbered ledges form Sierpinski's
  triangle; one diagonal is *the Fibonacci numbers* (the nostalgia callback —
  the main game's Fibonacci squares come from here). Puzzle: route-counting
  ("how many ways down to that ledge?" — the answer is written on the
  ledge). Teaches: Pascal's triangle, combinations, patterns inside
  patterns. **Companions: the Twins.**
- **Ch. 5: The Hailstone Caverns.** The Collatz ride. Pick any number,
  board its minecart: odd → 3n+1 (the cart climbs), even → n/2 (it drops).
  Every cart eventually rattles home to 1 — *probably* — nobody has ever
  proven it. The Devil mines the caverns for unsolved problems: they're
  his fortress's building material, because **what nobody can prove, nobody
  can tear down**. Set-piece: ride 27's full path with her whooping the
  whole way. Teaches: conjecture vs. theorem, why "nobody knows" is the
  most exciting sentence in math. **Companion: Twenty-Seven.**
- **Ch. 6: The Infinite Inn.** Always full. Always room. Puzzle sequence:
  make room for 1 new guest (everyone shifts +1), then a bus of infinitely
  many (everyone doubles to the even rooms). Finale: a second bus arrives
  for every point on a line, and the Innkeeper, for the first time in
  eternity, says "no." Teaches: countable infinity, that some infinities
  are bigger — played entirely as hotel logistics. **Companion: ℵ.**
- **Ch. 7: The Long Sands.** A desert where perfect numbers are oases:
  6, then 28, then 496, then 8128 — and the crossings between them grow
  brutally, *felt* as ever-longer provisioning puzzles (gather a number's
  proper divisors to fill your waterskin; only a perfect number fills it
  exactly — abundant numbers overflow, deficient ones leave you dry, which
  is also exactly what the main game's abundant squares are). At the last
  oasis, **Twenty-Eight** tells you the two desert legends nobody has ever
  settled: whether the oases go on forever, and whether an *odd* one exists
  anywhere. Both unsolved — the Devil has already been here, mining.
  Teaches: perfect/abundant/deficient numbers, divisor sums, the
  accelerating gaps, two real open problems. **Companion: Twenty-Eight.**
- **Ch. 8: The Devil's Game Show.** The Devil's first full appearance —
  as a game-show host. Three vaults, one prize. He opens an empty one.
  "Stick… or switch?" You play it *repeatedly*, watching the win
  frequencies converge live (law of large numbers as a scoreboard), until
  switching's 2/3 edge is undeniable. **Then the twist**: a final round
  where his deputy hosts instead — and the deputy *didn't know* where the
  prize was, he opened an empty vault by pure luck. Does switching still
  help? (No — it's 50/50 now. The host's *knowledge* was the entire
  advantage.) The Devil watches you realize that information itself bends
  probability, and for the first time he looks interested. Teaches: Monty
  Hall, conditional probability, why information is power — the lesson the
  whole boss fight is secretly built on. **Companion: Chance** (a coin who
  has never once landed where anyone expected).
- **Ch. 9: The Irrational Wilds.** Root's chapter — on the run with √2
  through a land where every length wants to be a fraction and hers isn't.
  Stealth-puzzle vibe: prove she can't be caught (the classic even/odd
  contradiction, told as an escape). The locals call it the *Unreasonable*
  Wilds — the Devil's old word for numbers like her, straight from his
  book. Teaches: irrationality, proof by contradiction. **Companion: Root.**
- **Ch. 10 (optional): Goldie's Gallery.** Spirals, pentagons, continued
  fractions as an endless picture-in-picture painting. Puzzle: rebuild her
  smashed golden rectangle from squares (Fibonacci callback). **Companion:
  Goldie.**

### Act III — The Ascent (2 chapters + finale)
*The world above, corrupted. Concepts: everything, used together.*

- **Ch. 11: The Climb.** Return to the board world — the five zones we
  built, but **hollowed**: gray meadow, dark crystals, the windmill stopped.
  You climb 1→100 with dice travel and your chosen party of three
  companions, whose powers are real mechanics (Zero: nullify one bad
  square; Two: double one roll; Twins: reveal twin-prime safe tiles;
  Twenty-Seven: survive one crash; ℵ: re-roll, always, but at +1 to the
  Devil's attention meter; Goldie: hop the Fibonacci spiral; Root: slip one
  gate without solving it; Twenty-Eight: split one roll into its divisors
  and spend them across turns; Chance: peek behind one corrupted square
  before committing — information bends probability, as taught). Corrupted squares lie about their identity —
  challenge them with what you learned to purify them, and *color returns
  to the zone as you do* (the world literally re-saturates square by
  square).
- **Ch. 12: The Hundredth Square.** The gate. Boss in three phases:
  1. **The Gauntlet** — rapid mixed challenges drawn from your weakest
     trials (stats store already knows).
  2. **The Devil's Proof** — he proves 1 = 2 in five beautiful steps; tap
     the broken one. Then a harder one. Your companions heckle.
  3. **The Duel at 100** — the final root-and-remainder duel. The Devil
     *grows* when you're slow and *shrinks* when you're sharp (straight
     from the book: his size is his temper, and his temper is the health
     bar).
- **Finale.** He loses. He sits down on the 100 tile, suddenly small.
  The reveal: he sealed the numbers away because people stopped *playing*
  with them — numbers kept being used and never enjoyed. The companions
  answer him not with an argument but with the game itself: the board
  relights, and he's offered a seat at it. Numbers flow back zone by zone
  in one long camera pull across the whole world. He takes the seat.

> **DEVIL**: "Finally. Someone who pays attention."
>
> *post-credits, small type:* **"For the dads who read us the strange books."**

## After the credits (story feeds the family game)

- The Devil becomes a **playable AI opponent** in normal mode (his dice
  luck is suspiciously good; Primo fact-checks him).
- Special squares in normal mode gain **character cameos**: land on a
  Fibonacci square and Goldie waves from the tile edge; twin primes get the
  Twins. Tiny, permanent, earned.
- The codex ("**The Dream Journal**") keeps every concept as a beautifully
  written page — the book your game becomes.

## Design principles

1. **The math is the story.** Every puzzle's solution *is* the concept.
   No quiz wrapped in a skin. (Hilbert's Inn isn't "about" infinity — making
   room IS the infinity argument.)
2. **Never lie about numbers.** Every character trait, every set-piece is
   true math (27's ride really peaks at 9,232; √2's fugitive story really
   got someone drowned, allegedly).
3. **Failure is content.** No fail-walls: retries get quiet assists, and
   the third failure auto-passes with a Devil sneer. Mastery is tracked for
   replay, never required for progress.
4. **Wonder over difficulty.** Target: a sharp 10-year-old can finish with
   help; an adult who "hates math" should hit at least two genuine whoa
   moments (rice chessboard and the Inn are the designated two).
5. **Co-op is native.** "Traveling companions" mode: two players share the
   run, alternate puzzles, both name a companion for the party, and the
   boss alternates phases between them. The game's origin story is two
   people playing together; story mode should honor that.

## Build phases (honest sizing)

- **Phase A — Vertical slice**: Prologue (false-normal game + the fall) +
  Nullhaven + Clockwork Commons, with dialogue engine (reuse tutorial
  typewriter + Primo components), story save, world map stub. *This proves
  the tone and the trick.* ~2–3 focused sessions.
- **Phase B — The Lands**: Act II chapters as **small 3D dioramas**
  (decided 2026-06-10: real 3D over 2D scenes). Scope control: each land is
  a contained set — one terrain patch, a handful of hero props, the proven
  sky/fog system — not a zone-scale world. The terrain/noise/sky toolkit
  from the world rebuild makes each diorama ~a session of work. Build order:
  **Hailstone Caverns and the Irrational Wilds first** (the favorites set
  the quality bar), then the Infinite Inn. Companion system lands here.
- **Phase C — The Ascent + boss + finale**: corrupted-zone shaders over the
  existing 3D world, party powers on the board, three-phase boss, the
  re-saturation finale, post-credits integrations.

## Decisions (round 2, 2026-06-10)

- **Lands are 3D dioramas**, built with the existing terrain/sky toolkit.
- **Favorites → build first**: Hailstone Caverns, Irrational Wilds (renamed
  from "Unreasonable" — the book's word survives in dialogue), Infinite Inn.
- **New core chapters**: The Long Sands (perfect numbers + the widening
  gaps, both open problems), The Devil's Game Show (Monty Hall + the
  host-knowledge twist; doubles as the Devil's mid-game entrance).

## Open questions for Dominic

1. Co-op from day one, or solo first with co-op in Phase C?
2. Any childhood house-rules or in-jokes from the original game that should
   be hidden in dialogue? (This is the cheapest, highest-value nostalgia in
   the whole design — only you can supply it.)
3. More chapter ideas welcome — current count is 12 chapters (prologue +
   2 + 7 core + optional Goldie + climb + boss), which is already a "twelve
   nights" structure. New ideas can swap in for weaker slots or join the
   optional pool.
