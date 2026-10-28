# Clinical review — first playable shift

Reviewed October 28, 2026 by the clinical-review subagent. **Source-informed design review, not independent educator approval, local protocol approval, or clinical validation.** Scope: existing source logic and a proposed small playable slice; no bedside device/controller testing performed.

## Recommended scenario

Use **Delta `cabg-recovery`**, the existing postoperative-day-one patient with a new irregular tachycardia (`dist/shift-data.js`, profile at line 100 in the inspected baseline). The scene already has a complete nursing decision: recognize a change, assess its consequences, obtain the prescribed diagnostic work, involve the team, reassess, and hand off a persistent concern. It needs no new drug regimen, invasive procedure, or hospital expansion.

Defer Impella troubleshooting, admission/Pyxis/pharmacy, dislodged IV, and A-line puzzles in this short mode. They remain valuable separate experiences, but combining them obscures the current patient priority. Pneumonia/oxygen is a reasonable later slice; its oxygen permissions must remain explicit case orders rather than a universal oxygen target.

## Minimal clinical sequence

1. **Meet the patient:** short report and a visible starting pulse/BP/respiratory picture. The normal starting observations do not predict later stability.
2. **Respond to the new alarm:** assess symptoms, consciousness, perfusion, blood pressure, breathing and pulse; verify monitor/electrode information. Use “new irregular tachycardia,” not a definitive AF diagnosis from a monitor label.
3. **Act within this case:** promptly notify the surgical/clinical team; arrange the already ordered 12-lead ECG and K/Mg studies. The urgent call is available throughout assessment. Diagnostic collection or a menu checklist must not delay escalation.
4. **Reassess after the displayed compressed interval:** compare the patient and trend, not just a prettier number. Preserve the existing follow-up: more comfortable, HR 112/MAP 72, rhythm still irregular. This is a fictional observation, not a treatment-effect prediction.
5. **Finish with a short handoff:** communicate the new rhythm, response, current condition, pending diagnostics/team plan and continuing monitoring. A controller choice can replace typing; its acceptance must depend on the correct continuing concern, not the amount of text.

## Five guardrails

- Assess clinical consequences; HR 142 or MAP 68 alone neither proves stability nor identifies a rhythm. An instability branch requires explicit findings and urgent team response. The algorithm's “typically ≥150” is not a permission to ignore lower-rate symptomatic changes.
- Keep escalation ungated. Existing `performCare(..., 'notify')` correctly permits it before routine report/orders/assessment. Preserve that behavior in the new mode.
- No independently started antiarrhythmic, unprescribed bolus, drain manipulation, cardioversion mini-game, or medication dose. This slice teaches recognition and coordination; trained team decisions remain outside its scope.
- Distinguish **ordered/requested**, **sample collected**, and **result available**. If the simplified action only coordinates ECG/labs, label it “requested/sent for review”; do not claim an actual specimen or interpreted diagnosis without the corresponding scripted event. Do not instantly normalize rhythm, urine or laboratories after a call.
- Reward safe completion and useful reassessment, with no speed score, death penalty or success from points alone. Wrong actions are intercepted, explain why, and offer quick retry. Pause/pressure settings change game pacing, not clinical authority. Completing the shift does not mean the arrhythmia is resolved.

## Current source findings / acceptance checks

**Keep:** `shift-engine.js` rejects unprescribed response choices, leaves patient values unchanged until follow-up assessment, permits urgent calls, and retains pending care at handoff. The current CABG response requests ECG/labs rather than implying that the call cures the patient. No unsafe reward was demonstrated in this path during source review.

**Must address for the new slice:** (1) `cabg-recovery` currently cites only the cardiac-surgery special-circumstances source; add the directly applicable rhythm sources below. (2) Generic quest-point feedback must not replace the clinical reason for the action. (3) A success screen must retain the still-irregular rhythm and pending plan. These are acceptance conditions, not claims that a new implementation is already verified.

Suggested brief feedback: “You checked the patient and confirmed the signal. The ECG helps the team identify the rhythm.” / “The call brings the team; it does not treat the rhythm by itself.” / “The rate is lower, but the rhythm remains irregular. Continue monitoring and hand off the pending plan.”

## Primary sources checked

- [AHA 2025 adult tachyarrhythmia-with-pulse algorithm, accessible version](https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Accessible/Algorithm-ACLS-Tachyarrhythmia-LngDscrp-250726-Ed.pdf): initial support, monitoring/ECG, clinical consequences of tachyarrhythmia. Applied to assessment and escalation, not a full treatment algorithm.
- [AHA 2025 Adult Advanced Life Support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support), take-home messages 1/10 and section 18: stability and underlying context direct management; treatment is individualized. Does not establish this hospital's RN scope.
- [2023 ACC/AHA/ACCP/HRS AF guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC11095842/), sections 4.2.2 and 10.9.2: clinician visual interpretation of ECG signals for initial diagnosis; postoperative treatment depends on symptoms/hemodynamics and the clinician's plan. No treatment recommendation or drug dose is imported into the game.

Game simplifications are the single patient, bundled coordination action, compressed interval and scripted follow-up. None establishes real-world task duration, competence, prognosis or a universally correct treatment order.

## Implemented slice review — October 28

Independently inspected `dist/quick-engine.js`, `dist/quick-shift.js` and `tests/quick-shift.test.mjs` after implementation. **No blocking unsafe clinical assertion found in this bounded slice.** This is source/logic review, not a real-controller or bedside-competency test.

| Acceptance condition | Actual implementation evidence |
| --- | --- |
| Escalation without a checklist | Post-alarm `call` sets the notification flag before assessment is complete; it leaves patient values unchanged. The toolbar/radio offers the call throughout the actionable scene. |
| Diagnostic states kept distinct | `ecg` records the prescribed 12-lead obtained and sent for clinician review; no AF diagnosis is assigned. `labs` records a K/Mg collection request, explicitly leaving collection/results pending and administering no replacement medicine. |
| Follow-up actually obtained | Coordination starts a 45-game-second interval representing ten compressed case minutes. An explicitly labelled time jump may skip waiting; neither route obtains the assessment. Only `reassess` copies the existing profile's follow-up values and opens handoff. |
| Continuing concern preserved | HR 112/MAP 72 is described with a still-irregular rhythm. The resolved/stop-monitoring choice is intercepted with an explanation and same-step retry. Successful handoff retains monitoring, ECG review, K/Mg collection/results and the team plan. |
| Timer/replay has no clinical claim | Optional practice expiry offers an alarm checkpoint, explicitly predicts no patient outcome, and permits an untimed retry. The finish screen has no speed grade, cure or competency claim. Two layouts retain the same existing clinical values. |

The focused state tests were independently run: **9 passed, 0 failed**. They exercise call-before-assessment, both diagnostic task orders, delayed versus explicit time-jump reassessment, unchanged values before reassessment, unresolved-handoff interception, pause, timer retry and replay/save behavior. This does not verify the live UI, hardware input or all possible states.

Nonblocking wording opportunity: the assessment feedback states several domains were checked but displays only selected findings. If adding detail, use explicitly authored observed respiratory/chest-symptom/perfusion findings; do not infer absent chest pain or prove stability from the numerical values. The original profile's warm-extremity finding can be retained.
