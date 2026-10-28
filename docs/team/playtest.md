# Independent playtest — SHIFT: ICU v0.5.0

Owner: investigator / independent QA subagent. Date: 28 October 2026.
Status: implemented working tree tested in managed preview; not a deployment claim.
Preview: http://terminal.local:4173/ and cold-entry http://terminal.local:4173/#quick.
Own test tabs: 4 (main) and 6 (deep link). No app or Entropy files edited.

## Actual browser tests

Desktop cloud Chrome, keyboard only for the core loop. Native Tab / Shift+Tab, arrows, Enter, P and Escape; no mouse or application-state mutation. Guided walking followed the visible objective. DOM reads inspected active focus; browser snapshots verified the action results.

- **Entry:** initial hub focus was BODY, so Enter triggered the old map toast. Reported immediately. Root fixed initial / return hub focus; after preview reload, Play owned focus and Enter opened the short shift. This fix was verified.
- **Menus / pause:** Up/Down selected visible intro actions; P opened pause with Resume focused; Escape returned to canvas. Back from a bedside panel returned to the world; Enter reopened the nearby patient action. Gold focus outlines were visible in screenshots.
- **Complete ECG-first route:** start → guided bedside → baseline → assess patient/signal → call surgical team → choose ECG first → take cart → obtain/send ECG → station K/Mg request → prepare handoff → explicit time jump of the remaining 22 game seconds → reassess → handoff.
- **Safety and retry:** deliberately chose “Mark rhythm resolved / stop monitoring.” It produced a short explanation that improved rate does not resolve the rhythm, with Retry focused. Retry returned to the correct handoff choice; correcting it reached finish. Pending ECG review, K/Mg collection/results, rhythm concern and monitoring remained explicit.
- **Alternative route:** same-layout replay reset to the introduction and Meet stage. Called the team before assessment, then completed K/Mg-first followed by ECG. Both prescribed tasks remained required and this route also finished.
- **Replay:** both Same shift / same layout and Replay / switch layout restart at the introduction. The switched ward was visibly patient-left / equipment-right. Exact coordinate preservation is additionally covered by source/automated tests, not measured through hidden state.
- **Deep link and old entry:** a cold new tab at `#quick` directly opened the short introduction with Resume focused. Keyboard Tab/Enter on Explore full hospital still opened the existing four-pod floor setup.
- **Focus:** action panels focused the primary action or Continue; closing restored canvas focus. Safety retry and finish replay had focus. No BODY focus loss occurred in the tested short-shift loop after the hub fix.
- **Console:** zero non-extension app warnings/errors in either test tab after these runs.

## Duration and experience

First deliberate QA route: **120 seconds wall time**, matching the displayed **2:00 session**, with 22 seconds explicitly skipped. Second familiar, expedited route: displayed **0:46**, using an earlier time jump and minimal reading. These are automation-assisted keyboard playthroughs, not evidence that a new human reliably takes 3–5 minutes. The target remains plausible for a new reader, but requires Rafael's hands-on timing. Do not pad the shift with forced idle time to hit the target.

The objective/action loop was understandable, the correction was useful and quick, and no typing was needed. A design concern remains: requiring Continue after every successful routine action adds repetitive confirmation. Root has queued a shorter persistent-feedback flow for retest.

## Limits

- No physical controller, device-specific browser, iPhone, TV remote, disconnect event or subjective enjoyment test. Gamepad unit transition checks do not establish real hardware support.
- No manual completion of every legacy floor/focused case. Old modes' entry was smoke-tested; old save integrity is supported by separate quick-save keys and regression tests, not a direct browser comparison of pre-existing authored notes on this preview origin.
- First baseline pass preceded the routine-feedback, disconnect, toolbar and resume-save polish. The final batch was retested below; the earlier screenshot documents the baseline finish panel, whose core content remains unchanged.

Evidence: `/workspace/scratch/shift-icu-v05-qa-finish-1793165402529.jpg` shows finished handoff, concise reasoning, pending concerns and visibly focused Replay.

## Final polish retest

**PASS in final managed-preview build, after root's ready signal:**

- Routine choice/call/cart/ECG/K/Mg/preparation/time-jump successes immediately returned to CANVAS with persistent, readable clinical status text. No extra Continue was required. Alarm, assessment, reassessment, safety and finish beats retained their short panels.
- Intro toolbar Interact/Call/Pause/Hospital was disabled. Resume owned visibly solid focus. A progressed attempt at **Choose your first task** was exited, reopened to intro, left idle across inspections, then the page was reloaded. Resume still restored **Choose your first task**, including completed assessment/call, rather than replacing it with the intro/baseline.
- Replayed the shortened ECG-first path through cart pickup, ECG, K/Mg, handoff preparation, explicit waiting-panel pause explanation, time jump, obtained reassessment, unsafe resolved handoff, quick correction and finish. The final run displayed **0:55**, including a 42-second time jump; this reinforces that expert/time-jump runs are shorter than the 3–5 minute initial design target.
- Replay reopened intro with **Start shift** focused and `:focus-visible` true. Final console contained zero app warnings/errors. No new input trap or BODY focus loss was found.

Controller disconnect is implemented and unit-tested by the input owner; this QA pass did **not** physically disconnect a controller or simulate browser gamepad state. Actual hardware compatibility and player enjoyment remain Rafael's hands-on acceptance checks.
