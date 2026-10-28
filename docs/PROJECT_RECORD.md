# SHIFT: ICU — first fun shift

Created by Rafael Gallardo, RN. Updated October 28, 2026.

## Goal / definition of done
One existing CABG rhythm-change scenario becomes a small complete 3–5 minute target experience: enter, assess, act, see response, adapt, hand off, replay. Simple controls, visible focus, shallow choices, immediate feedback, pause and quick retry. No mouse required for the supported controller core. Physical hardware acceptance requires Rafael’s controller/device test. Preserve the existing hospital, cases and notes; Entropy Quest is excluded.

## Verified current version
**Deployed v0.5.0** — game commit `a8fbdebc9f07077d981b235e032bc89664912e6e`, merged in [PR3](https://github.com/rgallardomc-ui/SHIFT-ICU/pull/3). [Pages deployment6](https://github.com/rgallardomc-ui/SHIFT-ICU/actions/runs/40639838135) passed prepare and deploy. All23 served game assets match that commit byte for byte. [Start the short shift](https://rgallardomc-ui.github.io/SHIFT-ICU/#quick).

Source is saved in GitHub. This record-only follow-up does not change the deployed game assets. Physical controller compatibility, enjoyment and target session length are still pending Rafael’s hands-on acceptance.

## Verified starting baseline
**Deployed:** v0.4.1, GitHub main `13a7af2ece0e79330ff7d3dab867b2a3d0ffb682`. Verified current main and live page on October 28. Canonical source: https://github.com/rgallardomc-ui/SHIFT-ICU . Play: https://rgallardomc-ui.github.io/SHIFT-ICU/ . All 86 existing checks pass. Historical ZIP and earlier Site are not used as current source.

## Teams / tasks
| Team | Owner | Output / acceptance | Status |
| --- | --- | --- | --- |
| Investigation / research | Investigator subagent | Current source/live evidence, five frictions, one bounded scenario; `team/investigation.md` | Complete |
| Investigation / research | Gameplay researcher subagent | Three lessons from at most three games, primary links, facts vs inference; `team/gameplay-research.md` | Complete |
| Investigation / research | Clinical reviewer subagent | Existing case logic, safety/feedback guardrails, primary sources; `team/clinical-review.md` | Actual engine / UI review complete; no clinical blocker |
| Development / playtest | Root: designer and integration owner | Complete quick shift, clinical gates, render/focus wiring, preserved existing modes | Implemented; independent QA passed |
| Development / playtest | Input specialist subagent | Standard gamepad + keyboard adapter and meaningful input tests; only `controller-input.js`, its test, own report | Implemented; independent QA passed |
| Development / playtest | Independent QA subagent | Play through start/pause/finish/replay, focus and regressions; actual vs untested evidence | Complete; final-batch keyboard QA passed |
| Coordination | Root | Resolve proposals, maintain this record, integrate, test, publish and report | Complete for this build; awaiting Rafael’s playtest |

## Three highest-impact decisions
1. **Small complete loop:** use existing `cabg-recovery`; one patient, one compact arena, one clear objective, at most three actions per panel. Keep old hospital as a separate mode.
2. **Controls first:** standard-mapped Gamepad API and keyboard, visible focus restored after every panel update, held-button protection, pause/back, no typing. Nonstandard remotes are not assumed compatible.
3. **Meaningful consequences:** patient/signal assessment, ungated team call, prescribed diagnostic coordination, delayed honest recheck and handoff. No speed score or cure from a call. Replay offers bounded map variation and relaxed/optional practice pressure.

Keep the current clinical profile, colors, nurse/world interaction, old saves and detailed modes. Simplify the default entry, walking area, action count, menus and end feedback. Defer new cases, admissions/IV/pharmacy interruptions, extra inventory, a hospital expansion and remote-specific mappings.

## Blockers / unknowns
- Rafael selected **computer + gamepad**; exact OS/browser/controller model not yet supplied. Real controller connectivity and comfort remain hands-on acceptance.
- Resolved publication limitation: GitHub connector writes returned403; the authorized signed-in GitHub browser saved the exact tested tree, merged it and ran Pages successfully.
- No educator/local-protocol approval. This is a fictional teaching game with source-informed review, not a validated competency assessment.

## Test record
- Baseline: 86/86 Node checks pass.
- Investigator: live entry, route/report, keyboard Pause checked; focus drops to BODY after report; no Gamepad API in source.
- Implemented: quick engine/UI/input. **107/107 checks pass**, including all86 baseline checks,12 input transitions and9 quick logic/geometry checks. Browser-module syntax passes.
- Independent first keyboard-only full loop passed including unsafe-handoff retry and finish. Measured120s guided run; 3–5min target remains unvalidated. Both task orders, same/switched replay, old-hospital entry and deep-link entry passed. Final routine results return directly to the world; resume survived idle intro and reload. No app console errors. Final familiar run55s with42s time jump: short replay timing is not a human enjoyment result.
- Clinical implementation review found no blocking unsafe claim. Physical controller, real human enjoyment and deployed asset checks remain separate.

## Next playable milestone
**Deployed playable candidate v0.5.0:** controller-first “Rhythm on the night shift,” from existing CABG case. Root owns integration on `fun-shift-v0.5`; other agents owned disjoint files. Independent keyboard QA and clinical logic review passed; deployed source and23 live assets verified. The next milestone is Rafael’s hardware/pacing feedback, before adding more systems. Human enjoyment and physical controller compatibility remain Rafael’s test, not inferred from automated checks.

## Final simplicity refinement
Routine plan / call / cart / diagnostic-request / handoff-prep results now return
to the ward with persistent clinical feedback. Only alarm, assessment,
reassessment, safety and finish remain explicit reading beats. The waiting panel
labels its paused countdown and offers a deliberate time jump. No idle padding
was added to force the3–5min target. Intro autosave preserves Resume; background
controls disable under panels; disconnect handling pauses the quick shift.

## Hands-on acceptance still required
Connect the controller, press/release a button, confirm the displayed controller
name, then start and navigate the shift without a mouse. Pause/resume once,
finish, replay and try the other task order. Report the controller model, OS,
browser, approximate time, and the first awkward/boring moment. Physical pad
connection/disconnection and enjoyment cannot be certified by this cloud browser.

## Live smoke test
Root verified the public `/#quick` entry, focused Start, keyboard start/guided
walking, baseline/change assessment, call feedback returning focus to CANVAS,
pause/back and task choice. Deployment and asset verification are complete.
No physical controller was connected in the cloud browser; no TV remote support
is claimed. No job or agent continues after this completed handoff.
