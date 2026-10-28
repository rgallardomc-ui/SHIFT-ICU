# SHIFT: ICU — phone-first pocket bedside

By Rafael Gallardo, RN. Updated October28,2026.

## Goal / definition of done
A real phone-shaped game: one portrait screen, touch-drag movement instead of a D-pad, nearby patient/pump/tray, and tactile nursing interventions rather than long Continue cards. First episode: an older deteriorating patient with prescribed hemodynamic support and ordered A-line monitoring. Start, pause, reassess, finish and replay with no typing or page scrolling. Home-screen app shell; preserve old modes/saves. Entropy Quest is excluded.

## Verified version
**Deployed and verified:** v0.6.0, game commit `6a1497eb4cd3cec4919b79e73b0470358d14ed11`, merged through [PR4](https://github.com/rgallardomc-ui/SHIFT-ICU/pull/4). [Pages run40646122747](https://github.com/rgallardomc-ui/SHIFT-ICU/actions/runs/40646122747) prepared and deployed successfully. All33 tracked game assets match that fixed commit byte-for-byte. [Phone entry](https://rgallardomc-ui.github.io/SHIFT-ICU/?v=0.6.0#pocket) opens the new episode.

**Historical baseline:** v0.5.0 game `a8fbdeb`, record-only main `cac6b32`. The user rejected its spread-out desktop/controller-first experience as not fun. Passing its functional tests did not establish enjoyment or phone suitability.

**Implemented and tested:** v0.6.0 on `phone-pocket-v0.6`, merged into `main`; the uploaded, tested and merged trees match. Canonical repo: https://github.com/rgallardomc-ui/SHIFT-ICU . Hosting remains the existing GitHub Pages; no new Site or project is substituted.

## Three design decisions
1. **Phone is primary:** full-height portrait app, safe-area padding, one compact bay; drag anywhere anchors a floating joystick and release stops. Tap stations is an alternative. No D-pad in this mode.
2. **Interventions are the game:** touch mental/airway-breathing/perfusion/pressure hotspots; match the norepinephrine bag; trace bag→pump→systemic IV; drag six setup pieces, prime off patient, clear bubbles, pressurize, slide to reference and zero. Trained-team insertion is represented, not taught as independent cannulation.
3. **Keep returning through mastery:** repeat a short bedside episode with rearranged physical pieces/labels/tubing and level calibration. Same medical orders; no dose race, absence penalties, streak grinding or padding the clock. Progress changes the scene and next action.

## Teams / owners / acceptance
| Responsibility | Owner / output | Acceptance / status |
| --- | --- | --- |
| Clinical research/review | Clinical subagent; [report](team/pocket-clinical.md) | Current SCCM/DailyMed/TruWave sources; actual engine/UI reviewed; no blocking unsafe assertion; not educator approval |
| Gameplay/phone UX + independent QA | UX subagent; [design](team/pocket-ux.md), [playtest](team/pocket-playtest.md) |Complete390×844 episode/replay and native gestures passed;320×568 readability/target fixes retested; legacy mode entry/return passed |
| Pure episode engine | Engine subagent; `pocket-engine.js` / test |14focusedchecks pass; support independent of A-line, recheck independent of setup, honest ongoing-care ending |
| Phone gesture adapter | Input subagent; [contract](team/pocket-touch.md) |7checks pass; floating drag, neutral release, multitouch isolation and cancellation |
| Design, UI, PWA, integration/publishing | Root only | Compact art/scene, touch games, app shell, old-mode integration;134totalchecks pass; material viewport issues fixed; merged, deployed and live assets verified |

## Clinical decisions
Fictional Evelyn Reed,78, suspected septic shock; infection/initial-fluid care already underway. Explicit case order: norepinephrine16mcg/mL (4mg/250mL D5W), appropriate prescribed upper-limb systemic IV, pump dose locked to active prescription, individualized MAP target65. Needed support does not wait for the A-line. The line is ordered here for inconsistent cuff monitoring during support, not as a universal Levo rule.

Support prompts an explicit delayed recheck, prioritized over unfinished equipment work; prepared pieces persist. Obtained scripted follow-up is MAP66/HR106, not automatic recovery. Urine remains18mL from the previous hour. Zeroing unlocks monitoring and does not raise MAP. Trained team inserts; nurse checks waveform, dressing/site and distal circulation. Handoff retains treatment and reassessment.

## Test evidence
-134/134 Node checks pass:107 existing +14episode +7touch +3compact routes +3app-shell/scope checks. Browser modules pass syntax checks.
- Independent QA completed the390×844 episode, honest ongoing-care handoff, replay, pause/resume and restart. Native pointer movement/release, wrong/correct bag docking, continuous IV trace, component drop and transducer alignment passed; taps were used for the other care actions. The scheduled recheck preserved setup progress.
-390×844 and320×568 document dimensions equal their viewports, with no page scroll. Compact critical bag/parts labels were enlarged to11px (concentration13px). Final compact drop zones measure45.58–45.59px, part buttons46.09px, with7px scene clearance; native bag/component drags retested. Revised390px scenes retain10px clearance and52px main action. See the independent report for what was and was not played.
- Legacy hub→earlier rhythm demo→hub→Pressure Drop entry/return passed. Existing107 regression checks remain green; no complete new browser rerun of every legacy specialty case is claimed.
- Published-game smoke: initial four checks, native bag docking, tap line trace, locked pump/support, native A-line component placement, due recheck and preserved setup all passed at390×844. This supplements the independent full episode on the identical source.
- Home-screen manifest, icon files, offline-shell file references and cache scope are checked. Cache cleanup/interception is restricted to SHIFT: ICU; other projects are not touched. Actual Safari installation/offline launch still requires a physical phone check.

## Blockers / limits
No source-access blocker. GitHub connector writes previously403; the authorized signed-in GitHub UI remains the publishing fallback. Physical iPhone finger comfort/latency, actual installation and enjoyment are not established by browser viewport tests. Clinical review is source-informed, not facility/educator approval.

## Next playable milestone
The phone-first Pressure Drop candidate is playable at the existing URL. Rafael’s next hands-on pass: open on his phone, drag to the patient, complete the intervention loop, try pause/replay, and judge finger comfort, clarity and enjoyment. Verify Home Screen installation/offline launch on that actual device. Use that experience before more cases or systems. Earlier v0.5 reports remain in `docs/team/` as history, not proof the revised game is fun.
