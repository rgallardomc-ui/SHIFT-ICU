# SHIFT: ICU

Created by Rafael Gallardo, RN. First playable build: 0.1. Current candidate: 0.3.

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


## Walkable floor candidate — 0.3

The primary entry point is now a floor shift. The original eight focused cases
and their save key remain intact. `CURRICULUM.md` records the user direction,
pod boundaries, current profiles and material still needed for facility-specific
work. Do not mistake the new candidate for a verified live Pages deployment.

- `shift-data.js`: fictional patient profiles, specialty / acuity boundaries,
  shift formats, supplies, procedure equipment and medication-role reference.
- `shift-engine.js`: deterministic assignment generation, recurring deadlines,
  patient change / response stages, supply / admission and procedure gates,
  observations / charting / handoff state and journal export. This is pure logic.
- `shift-map.js`: twelve-room geometry, walls / furniture, pathfinding, normalized
  movement and original canvas pixel drawing. The nurse walks through doorways;
  shortcut buttons provide a route rather than teleportation.
- `shift-floor.js`: accessible setup / controls, live scheduling, patient / chart
  workspaces, touch / keyboard input, optional speech and local persistence.
- `shift-floor.css`: responsive floor / modal layouts and large touch targets.
- `tests/shift.test.mjs`: assignment scopes, complete paths, chronology, safety
  gates, persistence, recurring care and route / collision behavior.

An assignment seed selects profiles, rooms and change timing. First rounds uses
two patients, admission mode starts with one and accepts a second only after
actual room / handoff readiness, and the long Alpha shift can use three stable
step-down profiles. This is game capacity, not a staffing standard. No delegation
system is present; specialists are required clinical roles, not a way to offload
the player's nursing tasks.

Coached mode pauses continuous time while reading; independent mode continues it.
Action costs remain explicit compressed simulation time. Equipment drills pause
the floor and have their own optional timer. Hidden pages / window blur pause the
floor; all key, pointer / cancellation and capture-loss paths release movement.
Destroying a floor screen aborts its listeners, animation and optional dictation.

Actions do not automatically document unperformed care. Obtained observations
retain performed timestamps until reviewed / entered into the flowsheet, where
charting timestamps are separate. SBAR remains authored text with a completeness
check only. New care invalidates an earlier handoff review without deleting the
note. Sample collection and result stages are distinct; a pre-change sample
cannot become a post-change result. A treatment plan does not instantly normalize
patient values; a later actual response assessment exposes the scripted follow-up.

The patient model is a first set of workflow snapshots. It is not continuous
physiology / drug kinetics, a manufacturer emulator or a complete twelve-hour
course of every complication. Later work should add reviewed evolving states,
procedure / medication detail and alternative care paths before claiming a full
specialty curriculum. Real phone / desktop browser QA remains outstanding when
the approved browser infrastructure is unavailable.

## 0.4 mission / arcade layer

`shift-arcade.js` keeps serializable objective, inventory, boost, IV-phantom,
A-line-setup and pharmacy state under `shift.arcade`. `ensureArcade` lazily adds it
to version-3 floor saves without clearing notes or clinical events. Clinical care
still runs through `shift-engine.js`; clue cards record obtained findings rather
than fabricating an assessment from navigation. Scoring keys are awarded once.

The floor UI uses compact station, bedside, computer, supply, Pyxis and iMobile
workspaces. The full chart is retained. `shift-arcade.css` styles tactile pickup
cards, a gray inventory bin, schematic puzzles and result effects. Map targets
include the actual supply-room door / Pyxis; interaction range also checks walls.
Movement is substepped, releases on the existing cancellation / blur lifecycle,
and uses the sprint multiplier independently of the clinical clock.

The tests cover clue / reassessment chronology, actual supply use, labs-versus-IV
branches, pharmacy queue / label / delivery states, setup pressure / air / level
gates, duplicate reward prevention, deadline holds, saved notes and reachable
geometry. Browser and actual iPhone checks remain distinct from engine tests.

## 0.5 bounded controller-first shift

`quick-engine.js` adapts the existing `cabg-recovery` clinical profile into one
complete encounter, with serializable state separate from floor / focused cases.
It owns clinical gates, a non-prognostic optional practice clock, explicit time
jumps, actual reassessment, safe handoff and two compact route layouts. Geometry
and movement are collision-tested; diagnostics retain pending collection/review.

`quick-shift.js` draws one ward, owns shallow action panels and persistent result
feedback, and restores primary focus after every panel render. Old modes stay in
`app.js` / `shift-floor.js`. `controller-input.js` supplies a shared pure pad
transition layer and browser adapter: standard mapping, deadzones, edge/repeat
handling, scoped navigation, neutral reconnect and blur release. World movement
uses collision substeps with a shared bounded frame budget.

Only root integrates. The investigator independently playtests, a source-informed
clinical agent reviews claims, and a separate gameplay researcher distinguishes
source facts from adaptation choices. See `docs/PROJECT_RECORD.md`. Hardware
compatibility and enjoyment are not inferred from Node checks.

## v0.6 phone-first pocket bedside

The old controller-first entry is superseded. The phone shell fits100dvh with
safe areas and one replaceable workspace. Native Pointer Events support a
floating drag origin/release-stop world joystick, bag/part drag/drop, IV-line
checkpoint tracing, bubbles, pressure pumping and transducer reference dragging.
Tap alternatives preserve accessibility without requiring a D-pad.

Episode logic is pure/serializable and independent of old saves. Timed recheck
interrupts equipment guidance without losing setup progress. The app shell uses
a manifest and repository-scoped network-first offline cache; it never
intercepts or deletes Entropy or another project’s resources.
