# SHIFT: ICU — the hospital Rafael is building

Created by Rafael Gallardo, RN. Direction recorded October 20, 2026.

The main game is a walkable nursing shift, inspired by the spatial organization and
competing tasks of an Overcooked-style game. Rooms are not fixed clinical levels.
The assignment generator selects patients, room numbers and change timing inside
the chosen specialty. A shift has one to three assigned beds according to the
scenario; the twelve-room floor does not imply a twelve-patient assignment.

## Specialty boundaries

| Pod | Assignment scope | First floor pathways in 0.3 | Further curriculum |
| --- | --- | --- | --- |
| Alpha | Step-down / IMC; stabilized transfers from the ICUs | Pneumonia / oxygen escalation, telemetry change, sepsis recovery after Bravo, DKA transition / meal-MAR reconciliation | Recovery after critical illness, mobility, fall prevention, wound / skin care, discharge teaching, transfer appropriateness and renewed deterioration |
| Bravo | Medical ICU | SLED tolerance / fluid balance, ventilator liberation, upper GI bleeding, ARDS / NMBA readiness, post-ROSC receiving bed | Septic / mixed shock, severe DKA / HHS, renal failure, CRRT, specific SLED device, ARDS / ventilation, variceal and other bleeding pathways, medication / infusion preparation |
| Charlie | Neuro ICU | SAH / EVD, post-status airway protection, spontaneous intracerebral hemorrhage with a fall at onset | Ischemic stroke, hemorrhagic stroke / SAH, trauma / TBI after falls, seizure / EEG, neuro confounders, EVD / ICP / CPP, ordered scans and transport |
| Delta | Cardiac ICU | CABG receiving / bleeding change, CABG postoperative rhythm change, Impella rounds; six separate focused Impella cases | Further CABG recovery / complications, Impella failure variants / emergencies, hemodynamics, arrhythmias, bleeding, ECMO with the specialist team |

A fall does not automatically establish the cause or type of a hemorrhage. A
ventilator is used for an actual support / airway indication, not simply because
“seizure precautions” appears on the chart. Transfers preserve baseline, support,
last doses, pending diagnostics, complications and escalation plans.

## Shift work and interactions

- Receive an assignment and report; establish your own baseline.
- Move around the station, through room doors, to the bedside and the room computer.
- Review orders, MAR / infusions, worklist, labs, history / diagnostic reports,
  flowsheets and SBAR. Keep performed time separate from charting time.
- Gather supplies and prepare rooms for the actual incoming patient: postoperative
  cardiac, neuro, monitored transfer or post-resuscitation receiving bed.
- Prepare equipment for an arterial line or to assist a credentialed CVC inserter.
  Check the required items / barriers, scope and safety; an optional timer tests
  preparation under pressure rather than rewarding unsafe speed.
- Assess physical findings, mentation, breathing, access sites, distal circulation,
  bleeding, measured urine / appearance, fluid balance and medication safety.
- Respond to new changes, act under the selected orders, reassess, escalate and
  document continuing concerns. Calling the clinical team is never gated by a
  routine checklist. No task-delegation game system is included.
- Track hourly neuro / output checks where ordered, close observations, laboratory
  timing and two-hourly positioning in the fictional orders. A clinical positioning
  hold retains pending care and a reassessment plan; a timer is not a clinical order.
- Save the assignment, authored notes, obtained observations and event history;
  export a journal and review unfinished care at handoff.

The first version uses scripted snapshots and workflow state changes. It does not
simulate continuous drug kinetics, evolving multiorgan physiology, real staff
capacity, or a complete twelve-hour course of every complication. Longer-form
clinical progression needs additional reviewed states rather than repeating a
single abnormal finding indefinitely as though it were a validated model.

## Medication / advanced care expansion

The first medication workspace separates analgesia, sedation, vasoactive support and
neuromuscular blockade, and tests order / patient / pump checks. The ARDS readiness
case adds observed TOF site, established stimulus, twitch count, timestamp and the
separate analgesia / sedation / ventilation context.

Further medication tasks need actual case prescriptions: drug, indication, patient
weight when relevant, concentration, dose / rate, route / line, titration steps and
interval, target, limits, hold / escalation conditions, reassessment and lab timing.
Fentanyl, midazolam, propofol, norepinephrine or rocuronium must not become an
automatic bundle for every ventilated patient. Future drug-selection cases should
explain their alternatives and the patient-specific reasoning.

Use the current SCCM / manufacturer evidence and the relevant local protocol. TOF
does not measure pain / awareness. A fixed current or twitch target from one case
must not become a universal protocol. CTA / angiography belongs to a specific
diagnostic / intervention question; suspected variceal bleeding also requires
airway / perfusion assessment and the team-directed resuscitation / GI pathway.

## Facility details awaiting exact material

- SLED machine model and the photograph Rafael offered; do not guess from the
  employer name. Add the actual IFU and reviewed RN / dialysis-team responsibilities.
- Exact spelling / intended meaning of the dictated medication “memotab” and
  “Bactrim band.” Do not silently convert these into a medication or blood-bank rule.
- Local admission orders for swabs, blood-bank identification, devices and screening.
  MRSA screening / transfusion processes are not assumed universal room requirements.
- Approved Expanse workflows / field examples without patient identifiers. The
  current chart is a fictional training workspace, not a reproduction or integration.
- Clinical educator / nurse-manager feedback. The study guide was sent for
  recommendations; approval has not been established.

## Default interaction layer — 0.4

The main experience uses short missions, revealed clues, concrete pickups and
visible task results. Keep prolonged chart reading optional. A new interaction
should change inventory, setup, observations, a patient / device state, a timer,
communication state or progress; a repeated paragraph alone is insufficient.

The U-shaped nursing station remains central to twelve rooms. Supply is behind
its back wall, with Pyxis inside that room. The player carries a gray bin and has
three fictional Celsius sprint charges per shift. Charge / iMobile introduces
variable admission timing and a receiving-room ticket. Transport keeps care if
readiness is incomplete. Humor targets unit logistics, not patients' distress.

The first action puzzles are bedside clue discovery, a dislodged PIV / ordered
lab branch, an abstract ultrasound phantom, and A-line setup. The pharmacy quest
requires an explicit fictional heparin-contraindication / device-team order;
preparation, collection, verification and team connection are separate actions.
Exact SLED hardware and local workflows remain awaiting the offered material.
