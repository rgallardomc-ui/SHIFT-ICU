# Gameplay research — first playable shift

Reviewed 28 October 2026. Status: **research and proposals**, not implemented or play-tested. Researcher owns this file only. Three games studied; no assets or source copied.

## 1. Overcooked: a small action vocabulary, adjustable pressure

**Documented:** Team17 describes preparing, cooking and serving orders. Its All You Can Eat pages offer practice/assist modes, longer round and order timers, reduced recipe counts and optional removal of order timers. This separates the task loop from its pressure level.

**Design inference for SHIFT:** keep movement plus one contextual interact/confirm button as the core vocabulary. In one room, move to an obvious object, perform the useful action, and see it change: kit carried, equipment ready, patient reassessment available. A compact context panel can offer at most three choices. Default to relaxed pressure; offer a brisk variant without changing clinical prerequisites or rewarding a faster unsafe action. Do not copy food expiry, frantic multitasking or punishment into patient care.

**Evidence:** [Team17 game page](https://www.team17.com/games/overcooked), [AYCE accessibility FAQ](https://www.team17.com/news/overcooked-all-you-can-eat-updated-faqs). Retrieval refs: `turn7search2`, `turn6view1` (accessibility section, lines 176–203).

## 2. Into the Breach: make the decision readable before execution

**Documented:** Subset Games describes minimal turn-based combat with enemy attacks revealed before the player responds, and a newly generated challenge on each attempt.

**Design inference for SHIFT:** make the current finding, available response and next review step legible together. Show a patient/team cue before escalating a scripted event, then provide one concrete consequence after each action. For example, show an assessment finding and the active case order, then confirm what was performed and when to reassess. Avoid predictable “this treatment guarantees recovery” previews: disease is not a deterministic enemy attack. Choices should pause by default; the challenge is recognizing and responding to evidence. At finish, explain one decision in plain language and offer immediate retry with the same setup.

**Evidence:** [Subset Games official Into the Breach page](https://subsetgames.com/itb.html). Current official search result: `turn7search3`; direct page retrieval returned 403, so this finding uses its indexed official description. This is not a first-hand playtest.

## 3. Mini Metro: variation from demand, not more controls

**Documented:** Dinosaur Polo Club describes drawing a small network, adapting it as demand grows and allocating limited resources. Its presskit lists dynamically changing cities, upgrades, multiple pressure modes and responsive sound.

**Design inference for SHIFT:** replay the same compact room with a small set of authored variations: a different order of cues, supply position, or interruption. Keep the action vocabulary and clinical guardrails constant. Increase challenge by changing which safe task needs attention next, not by adding chart tabs, obscure recipes or more simultaneous patients. Use an optional short sound and a persistent visual completion state; the visual state must remain understandable with sound off. Do not copy daily attendance incentives or leaderboards.

**Evidence:** [Dinosaur Polo Club game page](https://dinopoloclub.com/games/mini-metro/), [official presskit](https://dinopoloclub.com/press/mini-metro/). Retrieval refs: `turn7search12`, `turn6view2` (description/features, lines 41–58).

## Three proposed improvements, in order

| Change | Observable acceptance in one shift |
| --- | --- |
| One arena, movement + interact, shallow choices | Enter, act, pause, resume and finish using directional input + confirm/back; focus always visible; no typing or mouse required. |
| Cue → choice → visible consequence → recheck | Every required action immediately changes an object, task or feedback state. Player can identify the next action without opening a guide. Finish explains one key reason. |
| Fast replay with adjustable pressure and bounded variation | Retry returns to play in at most two confirmations. Relaxed/brisk modes retain the same safety gates. A second run changes a meaningful cue or task order, not merely the room number. |

Target a complete **3–5 minute SHIFT experience**; this is our design target, not a claim about these games' session lengths. Defer new pods, multiplayer, elaborate equipment simulation, inventory expansion and persistent progression. Enjoyment requires Rafael's hands-on feedback; research and automated checks cannot establish it.

## Review of the implemented slice

Source inference from `quick-shift.js` / `quick-engine.js`; no browser playtest. Two proposed refinements:

1. Replace routine plan/call/cart/ECG/request/preparation **Continue** cards with persistent world feedback, updated objects/objectives, released input and arena focus. Retain blocking alarm, assessment, reassessment, safety and finish beats so the clinical reasoning stays readable.
2. Explicitly label the waiting panel's paused interval. Its countdown cannot advance while a menu is open. Keep deliberate time jump → bedside reassessment obvious; do not pad the session with idle time or reading to meet the duration target.
