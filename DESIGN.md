# SHIFT: ICU

Created by Rafael Gallardo, RN. First playable build: 0.1. Current build: 0.2.

## The game Rafael described

A retro, top-down hospital is the overworld. Alpha is IMC, Bravo is medical ICU, Charlie is neuro ICU, and Delta is cardiac ICU. Each patient scenario is a level inside a compressed nursing shift. Movement gets the player to the bedside; clinical decisions drive progression.

The core loop is receive report, assess, interpret, act within orders, reassess, document and hand off. Urgent assessment and escalation can occur in parallel; a completion checklist never delays emergency care.

## This build

Four pods on the hospital map. Eight playable cases:

1. Delta D1: Impella CP suction with reduced filling after diuresis.
2. Delta D2: Impella CP suction with rising CVP and RV dysfunction.
3. Delta D3: Impella 5.5 too shallow / position in aorta.
4. Delta D4: Impella 5.5 too deep / position in ventricle.
5. Delta D5: new dark urine, laboratory trends, suspected hemolysis and operator treatment.
6. Delta D6: purge-disc recognition failure, escalation and a trained backup-controller exchange.
7. Bravo B1: sepsis, perfusion, fluid math and treatment in parallel.
8. Bravo B2: DKA, potassium before insulin, then dextrose with ongoing ketoacidosis.

Each case has handoff, revealed assessment findings, active/conditional/clarification orders, laboratory schedules, nursing actions, explicit scope boundaries, a scripted response, SBAR and response fields, optional browser speech input, an exportable practice note, and a debrief. Review notes can be exported for a manager or educator. They are not sent automatically.

Delta uses a schematic controller and three lecture photos. Red is sensed placement pressure, white is calculated LV pressure, green is motor current. Systemic arterial MAP is separate, particularly important when placement pressure is misleading. Graphics are illustrative, not calibrated device signals. No precise manufacturer interface or control behavior is claimed.

## What is deliberately not claimed

This prototype does not simulate continuous physiology, grade the clinical accuracy of free text, certify competency, implement real medication titration engines, or contain the local hospital's approved protocols. Outcomes are discrete scripted teaching events. Unsafe selections are intercepted as safety stops, not simulated as dosing injuries. Coached mode explains choices; independent mode defers most explanation to debrief. These labels do not claim a validated assessment instrument.

Typed notes and progress save in this browser. Speech is optional, browser-dependent and invoked only by the player. Browser/phone dictation is the fallback. No AI grading service, microphone recording store, EMR connection or patient-data integration exists.

## Curriculum expansion

### Alpha / IMC

Early respiratory deterioration, telemetry changes, electrolyte replacement, bleeding trends, transfer decisions, competing priorities, and rapid response. A higher difficulty shift adds two patients and an interruption while the first task remains unresolved.

### Bravo / Medical

Septic and mixed shock, DKA/HHS, renal failure and CRRT, ventilator/ARDS problems, hepatic disease and selected albumin indications. Medication exercises separate indication, concentration, dose in grams or units, volume, rate, compatibility and response. Fluid cases include congested and depleted patients so that one diagnosis does not become a shortcut.

### Charlie / Neuro

Baseline exam and sedation confounders, new stroke deficits and last known well, seizure activity/EEG, EVD leveling/drainage/movement, and TBI with ICP/MAP/CPP. EVD manipulation and drug doses require reviewed case orders and local protocol. Avoid inventing a universal target or teaching independent catheter manipulation.

### Delta / Cardiac

Version 0.2 adds hemolysis and purge-disc recognition failure before expanding other pods. Working-concern choices require the relevant findings but never gate urgent notification. Responses stay in the case and action timeline. Initial assessment cards explicitly retain the starting findings. Estimated LV values/waveforms are suppressed at P3 and below; the recorded alarm-onset interpretation remains separately available.

Additional Impella modules: further purge failure variants, CP/5.5/RP selection, weaning, arrest and device troubleshooting. CABG: bleeding, falling output, suspected tamponade, rhythm problems, graft perfusion concerns and escalation. ECMO: VA versus VV support, oxygen delivery, drainage problems, bleeding/anticoagulation, cannula assessment and specialist escalation. ECMO controls and adjustments should reflect the player’s reviewed role and institution’s permissions.

## Level design standard

Every level needs a patient story, known baseline, active orders, critical findings, acceptable paths, prerequisites for specific treatments, unsafe actions, reassessment findings, escalation triggers and a documentation rubric. Include normal/reference ranges with units where useful. Every laboratory interval is a case order, not a universal rule. Repeated lactate timing changes with clinical stability and the active protocol.

Assessment should reveal information; it should not consume an arbitrary amount of time before lifesaving treatment becomes available. Use event-based time for deliberate learning first. A future shift mode can introduce time pressure after the clinical model is reviewed.

## Progression and learning

Coached shift: prompts, immediate rationales, example notes and safety stops.

Independent shift: the same patient data with fewer prompts; debrief still explains reasoning. Later builds can randomize the cause of a familiar alarm without disclosing it in the mission title. Require the learner to state a concern before revealing the resolution, and score explicitly reviewed reasoning criteria.

Use care quality, recognition, reassessment and communication as progression measures. Do not attach invented individual mortality probabilities to pressor count. Do not reward speed at the expense of assessment or authorized practice. Do not use a successful game outcome as proof that a clinical intervention will work.

## Clinical basis checked for the first build

- Manufacturer Impella CP with SmartAssist IFU and supplied lecture material: placement/suction principles, estimated LV pressure, motor-current interpretation, role of imaging and trained operator.
- SCCM Surviving Sepsis Campaign adult guidance, 2026: https://sccm.org/survivingsepsiscampaign/guidelines-and-resources/surviving-sepsis-campaign-adult-guidelines
- ADA/EASD and collaborating societies, Hyperglycaemic crises in adults with diabetes, 2024 consensus: https://doi.org/10.1007/s00125-024-06183-8
- Albumin concentration and overload cautions: current DailyMed product labeling; verify the actual manufacturer/product before building a product-specific medication level.

The manager/educator review should confirm device/software version, action ordering, local nursing authority, medication/lab intervals, realistic alternatives and the debrief. Once approved, a case should carry its reviewer, reviewed date and protocol version. Approval has not been obtained for this build.

## Technical shape

Dependency-free static HTML/CSS/JS. Clinical cases are data in `dist/cases.js`; the pure state engine is `dist/engine.js`; presentation and optional speech are in `dist/app.js`. This separation permits reviewed case updates without rewriting movement or UI. Engine tests cover safety gates, task reachability, complete handoff, calculations and position-alarm settings. Browser UI QA remains separate from unit verification.
