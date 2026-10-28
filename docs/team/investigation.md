# SHIFT: ICU investigation — 28 October 2026

Owner: investigator subagent. Status: baseline inspected; proposals below are not implemented.

## Verified baseline

- Repository: `rgallardomc-ui/SHIFT-ICU`; local HEAD and fetched `origin/main` are both `13a7af2ece0e79330ff7d3dab867b2a3d0ffb682`. Package and live footer say **v0.4.1**.
- Live page: https://rgallardomc-ui.github.io/SHIFT-ICU/ (own inspection tab **1**). No Entropy project files were inspected or edited.
- Buildless ES modules; four floor pods, three shift formats, separate focused-case library. A visible objective, route buttons, clue cards, points, supply bin, optional deeper charts and pause already exist.
- Actual browser checks: fresh Clock in → default coached Delta admission shift; route to charge opens report; report action awards +20; Enter activates Pause/Resume. No physical controller was available.

## Five highest-impact problems

1. **The core input contract is missing.** No `getGamepads`/gamepad polling exists anywhere in `dist`. On the live floor, ArrowRight with Pause focused leaves focus on Pause; arrows mean nurse movement, not action selection. A D-pad/OK remote therefore has no defined way to traverse actions. The actual device/controller is still unknown. Relevant: `dist/app.js:106`, `dist/shift-floor.js:446`.
2. **Successful actions lose the selection.** Observed live: after “Hear the short report,” +20 feedback appears, but `document.activeElement` becomes **BODY**. Modal contents are replaced without restoring a meaningful action focus. Repeated clue/MAR/supply actions use the same pattern, inferred from source. Relevant: `dist/shift-floor.js:43`, `:205`. Preserve focus on the next useful action after every render, including pause/retry.
3. **Session length is not bounded to the target.** Both shorter formats use 240 simulated minutes; at 0.5 simulated minutes/real second, the clock alone requires **eight real minutes**. Coached dialogs pause it and actions add time, so wall-clock completion is not a reliable 3–5 minute loop. This is source arithmetic, not a timed full playthrough. Relevant: `dist/shift-data.js:9`, `dist/shift-engine.js:4`.
4. **The default shift adds systems before a complete clinical beat.** Browser observed separate report, bedside/computer destinations, admission call, supply and chart controls immediately. Source additionally starts a PIV event after baseline/MAR, then can add an admission/A-line and pharmacy quest. These are useful later, but interrupt a beginner's attempt to understand one patient response. Relevant: `dist/shift-arcade.js:39`, `:214`. Keep these in the existing floor; exclude them from the first polished slice.
5. **Completion is administrative rather than a clear outcome.** Source inspection: finish is manual; the detailed handoff requires five typed fields per patient, while the short debrief leads to generic shift setup. Recurring work can remain after the interesting response. The current three treatment options are mostly one safe plan versus obvious unsafe shortcuts, so repeated play becomes recall. Relevant: `dist/shift-floor.js:316`, `:326`, `dist/shift-data.js:100`. Give the slice an explicit response/recheck finish and one-button replay, with one short clinical takeaway and a specific next attempt.

## Recommended single existing scenario

**Delta `cabg-recovery`: postoperative day-one new irregular tachycardia.** It already has a legible baseline, an alarm, patient symptoms, case-authorized ECG/electrolyte work, escalation and a partial follow-up (HR improves, rhythm concern remains). It can teach “look at patient + verify rhythm + call/recheck” through a few physical actions without medication dosing or Impella-controller complexity. Retain the honest unresolved rhythm at the finish. Make a bounded 3–5 minute slice of this scenario; do not add another patient or a supply-admission branch first.

## Preserve

- Four pods and existing floor/focused modes; U-shaped floor geometry and route collision safety.
- `shift-icu-v1` focused notes/progress and `shift-icu-floor-v3` version-3 saves, authored notes, `shift.arcade`, and ten-shift history.
- Urgent escalation available alongside assessment; meaningful reassessment intervals and unresolved handoff concerns.
- Gold `:focus-visible` outlines, keyboard/touch fallback, pause on blur/hidden, movement release and optional sounds.

Not tested: full clinical shift completion, every case, actual iPhone/controller, TV remote, screen reader, or current live pharmacy/minigame paths. No app code was changed.
