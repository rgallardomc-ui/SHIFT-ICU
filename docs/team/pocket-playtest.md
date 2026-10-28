# Pocket episode independent playtest

Owner: pocket_ux · 2026-10-28 · frozen v0.6 candidate plus focused final CSS retest.

**Result: full loop passed at 390×844; the required compact label and drop-target fixes are resolved and independently retested at 320×568. No remaining material UI/input blocker was found in this scope.** This is Chrome browser viewport testing through the managed preview, not a physical phone test. No app state, synthetic events, or storage were injected.

## Actually played

- Called help, opened bedside, completed all four checks including airway/breathing, and navigated to the infusion station.
- Read the active case prescription. Native pointer drag of the wrong-patient premix produced specific corrective feedback and an immediate retry; dragging the matching bag advanced. Native continuous bag → pump → patient-IV trace passed.
- Verified site/locked pump and started ordered support **before** A-line setup. The latest obtained MAP stayed 54 until a fresh patient check; starting support did not display an instant cure.
- Native Saline-to-matching-tray-slot drag placed one component. After 20 game seconds, the large RECHECK PATIENT action returned directly to bedside. Four fresh checks yielded the explicitly scripted MAP 66/HR 106 response; prior-hour urine stayed 18 mL. Returning to the tray preserved the placed Saline.
- Tapped the other five components, primed disconnected from the patient, cleared three visible air pockets, and reached this kit’s marked 300 mmHg. A native 1.8-second bulb hold gave one 100 increment; a bulb tap and the +100 action completed it. Continuous hold-to-inflate was therefore not established.
- Native transducer drag aligned with the heart reference (displayed range 50). Zero/closed monitoring, assisting the trained inserter, and waveform/site/distal circulation checks all advanced correctly. The insertion screen explicitly assigns catheter insertion to the trained team.
- Finished with an ongoing-care handoff. Feedback said MAP 66, supported rather than cured, and continue monitoring/team plan. Fresh setup reset to assessment 0/4, MAP 54 and support OFF.
- Pause → Resume and pause → Fresh setup passed. A fresh native floating-joystick drag visibly moved the nurse; subsequent observations showed a stable stopped position and no unintended scene opening after release.

## Layout and input evidence

| View | Actual observation |
| --- | --- |
| 390×844 | HTML client/scroll 390×844; full episode, completion and replay need no page scroll. Final station/Pause/Other modes targets 44 px; primary 52 px; replay 50 px. |
| 320×568 | HTML client/scroll 320×568. World, bedside progression, order, bag match, trace, pump, component tray and pause fit. Primary/help 45 px; back/Pause 44 px; bags 89×103 px; component buttons 89×46 px. |

Compact tray boundaries (CSS pixels): workspace y 184.55–466.91; scene y 186.55–464.91; scene bar y 193.55–237.55; tray y 243.55–355.72; parts y 361.72–457.91. Actual drop-zone rows were 40 px (last bottom 346.55); the last part button was 45.59 px high with 7 px clearance to the scene bottom. The grid’s own 76.17 px height is smaller than its two 40 px rows plus gap, so test child boundaries as well as document scroll after resizing. Controls remain y 505.91–550.91.

Native pointer gestures actually passed: world movement/release, wrong/correct bag docking, continuous IV trace, one component drop, transducer alignment. Supported taps were used for the remaining care actions; the compact repeat additionally passed medication match and three-node trace using taps. Minigames replace the central workspace, with short live objective/feedback and a persistent thumb action; there is no Continue-card chain or D-pad in this episode.

## Findings before the focused fix

1. **Readability:** compact Rx drug/ID/premix metadata and tray slot names use 7 px type and look tiny. Raise clinically meaningful text; do not treat fitting as proof of readability.
2. **Drop targets:** compact tray slots are 40 px high in CSS. Component buttons measured 46 px, but the matching drop zones should also reach 44 px. Recheck that enlarging them does not hide the thumb action.
3. **Gesture feedback:** the held bulb acted as one squeeze in this run. Tapping works; avoid claiming continuous hold behavior until physically confirmed or corrected.

No completion/input trap was found in the tested candidate. An earlier trace attempt coincided with a preview reload caused by another file write; the stable frozen-build repeat passed and that invalidated attempt is not counted as a game defect.

## Final focused retest

The builder raised drug/patient/premix labels to 11 px, concentration to 13 px, and tray/part names to 11 px. At 320 px the three 89×103 px bag cards wrap all clinical text within their borders; the matching bag again passed a native pointer drag. Drug names wrap across two lines at both phone sizes but remain fully visible.

The first target enlargement exposed 0.83 px of bottom-row clipping; removing the compact decorative tray heading resolved it. Final 320 px slots measure 45.58–45.59 px, part buttons 46.09 px; last part bottom 457.91 is 7 px above scene bottom 464.91. Native Tubing-to-matching-slot drag passed after this final revision. Both document dimensions remain exactly 320×568; action 45 px and pause menu remain contained, with Other modes 44 px and bottom 478.64. At 390 px labels/tray also fit; last part bottom 703 is 10 px above scene bottom 713, and the 52 px action is visible.

Regression entry smoke passed: Pause → Other modes opened the existing hospital hub; Earlier rhythm demo opened its CABG intro; Back to hospital → Play Pressure Drop returned to the phone episode. This was an entry/navigation check, not a full legacy-mode regression pass.

## Still untested

Physical iPhone/Android touch, finger occlusion, device performance, Safari browser chrome/safe areas, installed Home Screen/offline behavior, multi-touch, OS gesture interruption, pointer cancellation, audio/haptics, real controller/remote, and a timed 3–5-minute human enjoyment test. The full second shift was not completed at 320 px. Automated engine tests were run by the builder, not independently rerun here. Clinical correctness is owned by the separate clinical reviewer; this playtest verifies the displayed sequence and feedback.

Next gate: physical-phone play and user enjoyment feedback. The viewport loop and revised compact Rx/tray/pause checks are complete; the unchanged engine loop was not redundantly replayed after the CSS-only revision.
