# SHIFT: ICU — phone-first pocket bedside

By Rafael Gallardo, RN. Updated October28,2026.

## Current iteration — physical A-line / v0.7.0

**Implemented:** v0.7.0 on `physical-aline-v0.7`, based on freshly retrieved main `5181f92a5b6f1cdb700f58db11ebd357b30bc9fe`. Existing GitHub Pages remains the only hosting target. No Entropy Quest source, data or cache was accessed or changed.

**Tested:** 142/142 Node checks and changed-browser-module syntax passed. Independent QA completed the 390×844 episode and replay, native fitting/trace/hold/bulb/level/dial gestures, saved progress and pause/resume. At 320×568 it tested all new setup phases through the stopcock, obtained recheck from monitor zoom with setup retention, and legacy hub/rhythm/pocket return. Both viewport client/scroll sizes match; tested targets are at least 44px. The integrator enlarged port labels to 11px and rechecked both viewport sizes after QA. See the detailed report for limits.

**Deployed:** publication pending; v0.6 remains the last verified live build until this status is updated.

### What changed
- The six matching-word docks are replaced by physical bag/sleeve/wrap, round fluid connector and keyed monitor cable pieces in one patient-left, pole-right workspace. Native drag and accessible tap alternatives share the same gated actions.
- Trace to waste; hold/release for vent-first then tubing de-airing; fit nonvented caps; squeeze three times to this kit’s target; drag the transducer to the supplied right-atrial reference; turn a labeled OFF handle to isolate the patient for zero and then restore closed/capped monitoring.
- Miniature monitor and zoom view distinguish unavailable ART setup, atmospheric reference and schematic arterial signal. A single systolic-peak interaction accompanies the postline waveform check. No arterial numbers or pressure improvement are inferred from equipment.
- HELP, the assessment view, ongoing prescribed support, due recheck priority, old modes and save keys remain. Version-1 pocket saves migrate physical setup fields without deleting accepted progress. Added tests cover preparation/routing gates, partial flow, migration, honest observations and completion.

### Actual team and ownership
Root owns design, equipment rendering/input, app/cache wiring, integration and publishing. Engine subagent owns `pocket-engine.js` and tests. Clinical subagent checked primary IFU/source material and actual implementation in [review](team/physical-aline-clinical.md). Independent QA owns [playtest report](team/physical-aline-playtest.md). These were real coordinated agents with disjoint file ownership.

### Scope and next milestone
Keep the approved compact phone design. Clinical/source review is not facility, manufacturer or educator approval; finger comfort, human timing/enjoyment and actual Safari/PWA/offline behavior still need Rafael’s phone pass. After this loop earns approval, test changed bed/reference height and authored replay variations, then patient/access-site updates and coherent emergency access. IV practice, provider cannulation, neuro/EVD, new shock cases, pharmacy/calls, music and expanded hospital systems remain later roadmap items. No consent/documentation subsystem was added.

## Prior verified baseline and historical evidence

### Goal / definition of done
A real phone-shaped game: one portrait screen, touch-drag movement instead of a D-pad, nearby patient/pump/tray, and tactile nursing interventions rather than long Continue cards. First episode: an older deteriorating patient with prescribed hemodynamic support and ordered A-line monitoring. Start, pause, reassess, finish and replay with no typing or page scrolling. Home-screen app shell; preserve old modes/saves. Entropy Quest is excluded.

### Verified version
**Deployed and verified:** v0.6.0, game commit `6a1497eb4cd3cec4919b79e73b0470358d14ed11`, merged through [PR4](https://github.com/rgallardomc-ui/SHIFT-ICU/pull/4). [Pages run40646122747](https://github.com/rgallardomc-ui/SHIFT-ICU/actions/runs/40646122747) prepared and deployed successfully. All33 tracked game assets match that fixed commit byte-for-byte. [Phone entry](https://rgallardomc-ui.github.io/SHIFT-ICU/?v=0.6.0#pocket) opens the new episode.

**Historical baseline:** v0.5.0 game `a8fbdeb`, record-only main `cac6b32`. The user rejected its spread-out desktop/controller-first experience as not fun. Passing its functional tests did not establish enjoyment or phone suitability.

**Implemented and tested:** v0.6.0 on `phone-pocket-v0.6`, merged into `main`; the uploaded, tested and merged trees match. Canonical repo: https://github.com/rgallardomc-ui/SHIFT-ICU . Hosting remains the existing GitHub Pages; no new Site or project is substituted.

### Three design decisions
1. **Phone is primary:** full-height portrait app, safe-area padding, one compact bay; drag anywhere anchors a floating joystick and release stops. Tap stations is an alternative. No D-pad in this mode.
2. **Interventions are the game:** touch mental/airway-breathing/perfusion/pressure hotspots; match the norepinephrine bag; trace bag→pump→systemic IV; drag six setup pieces, prime off patient, clear bubbles, pressurize, slide to reference and zero. Trained-team insertion is represented, not taught as independent cannulation.
3. **Keep returning through mastery:** repeat a short bedside episode with rearranged physical pieces/labels/tubing and level calibration. Same medical orders; no dose race, absence penalties, streak grinding or padding the clock. Progress changes the scene and next action.

### Teams / owners / acceptance
| Responsibility | Owner / output | Acceptance / status |
| --- | --- | --- |
| Clinical research/review | Clinical subagent; [report](team/pocket-clinical.md) | Current SCCM/DailyMed/TruWave sources; actual engine/UI reviewed; no blocking unsafe assertion; not educator approval |
| Gameplay/phone UX + independent QA | UX subagent; [design](team/pocket-ux.md), [playtest](team/pocket-playtest.md) |Complete390×844 episode/replay and native gestures passed;320×568 readability/target fixes retested; legacy mode entry/return passed |
| Pure episode engine | Engine subagent; `pocket-engine.js` / test |14focusedchecks pass; support independent of A-line, recheck independent of setup, honest ongoing-care ending |
| Phone gesture adapter | Input subagent; [contract](team/pocket-touch.md) |7checks pass; floating drag, neutral release, multitouch isolation and cancellation |
| Design, UI, PWA, integration/publishing | Root only | Compact art/scene, touch games, app shell, old-mode integration;134totalchecks pass; material viewport issues fixed; merged, deployed and live assets verified |

### Clinical decisions
Fictional Evelyn Reed,78, suspected septic shock; infection/initial-fluid care already underway. Explicit case order: norepinephrine16mcg/mL (4mg/250mL D5W), appropriate prescribed upper-limb systemic IV, pump dose locked to active prescription, individualized MAP target65. Needed support does not wait for the A-line. The line is ordered here for inconsistent cuff monitoring during support, not as a universal Levo rule.

Support prompts an explicit delayed recheck, prioritized over unfinished equipment work; prepared pieces persist. Obtained scripted follow-up is MAP66/HR106, not automatic recovery. Urine remains18mL from the previous hour. Zeroing unlocks monitoring and does not raise MAP. Trained team inserts; nurse checks waveform, dressing/site and distal circulation. Handoff retains treatment and reassessment.

### Test evidence
-134/134 Node checks pass:107 existing +14episode +7touch +3compact routes +3app-shell/scope checks. Browser modules pass syntax checks.
- Independent QA completed the390×844 episode, honest ongoing-care handoff, replay, pause/resume and restart. Native pointer movement/release, wrong/correct bag docking, continuous IV trace, component drop and transducer alignment passed; taps were used for the other care actions. The scheduled recheck preserved setup progress.
-390×844 and320×568 document dimensions equal their viewports, with no page scroll. Compact critical bag/parts labels were enlarged to11px (concentration13px). Final compact drop zones measure45.58–45.59px, part buttons46.09px, with7px scene clearance; native bag/component drags retested. Revised390px scenes retain10px clearance and52px main action. See the independent report for what was and was not played.
- Legacy hub→earlier rhythm demo→hub→Pressure Drop entry/return passed. Existing107 regression checks remain green; no complete new browser rerun of every legacy specialty case is claimed.
- Published-game smoke: initial four checks, native bag docking, tap line trace, locked pump/support, native A-line component placement, due recheck and preserved setup all passed at390×844. This supplements the independent full episode on the identical source.
- Home-screen manifest, icon files, offline-shell file references and cache scope are checked. Cache cleanup/interception is restricted to SHIFT: ICU; other projects are not touched. Actual Safari installation/offline launch still requires a physical phone check.

### Blockers / limits
No source-access blocker. GitHub connector writes previously403; the authorized signed-in GitHub UI remains the publishing fallback. Physical iPhone finger comfort/latency, actual installation and enjoyment are not established by browser viewport tests. Clinical review is source-informed, not facility/educator approval.

### Next playable milestone
The phone-first Pressure Drop candidate is playable at the existing URL. Rafael’s next hands-on pass: open on his phone, drag to the patient, complete the intervention loop, try pause/replay, and judge finger comfort, clarity and enjoyment. Verify Home Screen installation/offline launch on that actual device. Use that experience before more cases or systems. Earlier v0.5 reports remain in `docs/team/` as history, not proof the revised game is fun.
