# Pocket shift — clinical design review

Reviewed October 28, 2026. **Source-informed game design, not educator, facility, manufacturer or competency approval.** The user’s phone-first hemodynamic scenario supersedes the earlier CABG/controller priority. This review covers proposed logic; it does not certify an implemented build or real device.

## A specific fictional encounter

**78-year-old with pneumonia-associated septic shock.** Cultures, prescribed antibiotics and initial fluid resuscitation/reassessment have already occurred. Further fluid decisions remain with the bedside team; a low MAP is not an automatic order for another large bolus. Airway is patent, the patient is drowsy but arousable, RR 26 and SpO₂ 94% on prescribed oxygen. Current cuff MAP 54, tachycardia and cool skin prompt rapid bedside reassessment and immediate team escalation. A repeat pressure corroborates hypotension; subsequent cuff inconsistency and ongoing support needs justify the team’s arterial-monitoring request.

**Active case order:** pharmacy-prepared norepinephrine, 16 mcg/mL (4 mg/250 mL D5W), systemic IV, prescribed dose locked to the active order; individualized MAP goal around 65 mmHg. This is a setup/monitoring exercise, not dose calculation, a universal titration schedule or independent prescribing. An appropriate existing upper-limb peripheral IV is explicitly approved under this case’s local protocol and checked before use.

## Short playable sequence

1. **Help now:** calling the bedside/critical-care team remains available before any checklist. Assessment and escalation can occur together.
2. **Look at the patient:** obtain mentation, airway/breathing, pulse/rhythm, pressure reliability, skin/perfusion and the actual urine trend. A number or prettier waveform alone cannot determine stability or the shock cause.
3. **Trace and match:** match patient/allergy, active order, norepinephrine label/concentration, systemic-IV route, pump and line. Inspect appropriate access/patency and ongoing extravasation risk. Reject connection to arterial-monitoring tubing. Do not flush a vasopressor-containing line as a game shortcut.
4. **Support promptly under the order:** continue frequent BP, rhythm, access-site and patient checks. Do not require an A-line or new central line first. The team continues reassessing volume status and cause.
5. **Build the A-line setup** while support continues. This prepares/assists the trained inserter; it does not make the player independently cannulate.
6. **Obtain the response:** after an explicit compressed interval, a possible authored snapshot is MAP 66, HR 108 and improved alertness. This is scripted, not a guaranteed drug effect. Prior-hour urine remains the prior-hour measurement; infection, diagnostics and ongoing support remain active concerns.
7. **Finish with continued care:** retain monitoring, infusion/site surveillance, pending team orders and reassessment. “MAP reached goal” does not mean shock or sepsis is cured.

## Make the line setup tactile

Drag prescribed flush solution, pressure bag, transducer/closed pressure tubing, compatible cable/holder and sterile assistance supplies into place. Prime the disconnected setup and remove all air; the game may show bubbles clearing. Meet this kit’s prescribed 300 mmHg bag-pressure target. Align the transducer reference to the right-atrial level. With the patient isolated, open the reference to atmosphere and zero; restore the closed monitoring state. A trained-team insertion/connection checkpoint precedes an arterial trace and site/distal-perfusion check.

Completing tubing or zeroing **unlocks a reliable measurement, not a rise in MAP**. Air, incorrect level and open stopcocks should block a “ready” state and give a short corrective cue, not simulate an actual air embolism or award speed points. Exact supplies, flush solution, technique and monitoring follow the real kit IFU and institution.

## Important current-source nuances

- SSC 2026 permits invasive **or** noninvasive BP monitoring. Its remarks favor invasive monitoring for escalating/intermediate-to-high support, multiple pressors, frequent arterial samples or inconsistent cuff measurements. Do not teach “Levo always requires an A-line.”
- SSC 2026 conditionally suggests an initial MAP range 60–65 in adults ≥65. Keep the displayed target individualized to this case, rather than teaching that every older patient needs ≥65 or a higher pressure.
- No dose race, independent antiarrhythmic/vasopressor bolus, invented normal urine/lactate, or “A-line first, support later” reward.

## Primary sources checked

- [SCCM 2026 adult Surviving Sepsis Campaign](https://www.sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026): urgent resuscitation, norepinephrine, peripheral initiation and monitoring indications. Web refs `turn14view0`, `turn15view2`.
- [Full 2026 SSC guideline](https://doi.org/10.1007/s00134-026-08361-1), MAP recommendations 13–14 and BP monitoring 42: age-related target nuance and patient-specific decisions. Ref `turn14view3`.
- [Current DailyMed norepinephrine premix label](https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6363e9b4-29df-4553-904d-a563e5adda6e), sections 2 and 5: ready-to-administer concentrations, access, BP/rhythm surveillance, extravasation and volume-status cautions. Ref `turn14view1`/`turn15view3`. No label dose is imported as a universal game rule.
- [Edwards TruWave Pressure Monitoring Kit IFU, DOC-0070773A](https://eifu.edwards.com/eifu/5970f1b346e0fb00015e5f4d/DOC-0070773A.pdf), English pp 1–2: setup, air removal, pressure, reference/zero, closed-state restoration and signal checks. Ref `turn16view0`. Prefer this actual pressure-kit IFU over the earlier VolumeView venous-injectate reference.

**Must-pass implementation checks:** ungated call; appropriate assessment before cause-specific action; prescribed setup/route verified; support not gated on A-line; A-line alone changes no perfusion values; delayed obtained recheck; unchanged historical urine; no unsupervised insertion claim; brief pending-care ending.

## Implemented review

Read actual `pocket-engine.js` and `pocket-game.js`. Two review corrections are implemented: a fourth airway/breathing hotspot, and a due-recheck objective/large bedside CTA ahead of unfinished A-line work. Setup progress survives that recheck. Urgent help remains ungated; ordered systemic-IV setup precedes line preparation; zeroing changes no MAP. Explicit patient reassessment yields the scripted MAP 66 while prior-hour urine stays 18 mL. The ending retains support and pending care. Wrong arterial routing is rejected; insertion belongs to the trained team.

Independent engine verification: **14 tests passed, zero failed**. No blocking unsafe assertion identified in this reviewed source. Phone gestures, usability and human clinical validation were not tested by this reviewer.
