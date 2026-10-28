# Physical A-line milestone — clinical/source review

Reviewer: clinical-review subagent. Date: October 28, 2026.
Canonical repository: `rgallardomc-ui/SHIFT-ICU`; starting main `5181f92`.
Scope: phone episode only. No Entropy Quest access or edits.

This is source-informed development review, not clinical validation, facility or
manufacturer approval, supervised device training, or a competency assessment.

## Primary material inspected

| Source | Specific material | Finding applied to this milestone |
| --- | --- | --- |
| [Edwards TruWave IFU DOC-0070773A](https://eifu.edwards.com/eifu/5970f1b346e0fb00015e5f4d/DOC-0070773A.pdf) | English pp. 1–2; setup steps 1–15, zero/calibration, routine maintenance; both pages visually inspected | Aseptic assembly and secure connections; compatible dry cable; bag air removal. Gravity preparation clears the transducer/vent before the remaining pressure tubing. All air is removed and vented caps replaced before pressurizing. The cited blue-tab setup uses 300 mmHg. Patient connection follows preparation. The vent interface is leveled to the right-atrium reference; atmospheric zero is followed by vent closure and a nonvented cap. Patient-position changes require reference adjustment. |
| [Edwards educational guide AR12814](https://edwardsprodjp.blob.core.windows.net/media/Zh/devices/monitoring/hemodynamic%20monitoring/ar12814.pdf) | Printed pp. 88–89 and 96–97 (PDF indices 50/54); 2015 pediatric guide, narrow physics reference only | The zeroing diagram/text explicitly isolates the patient. Restoring monitoring closes the air port and replaces its cap. The marker on the game is a supplied reference, not instruction to eyeball anatomy. Its pulse diagram distinguishes the systolic peak and dicrotic notch. No pediatric regimen is imported into this adult case. |
| [SCCM SSC 2026](https://sccm.org/clinical-resources/guidelines/guidelines/surviving-sepsis-campaign-international-guidelines-for-management-of-sepsis-and-septic-shock-2026) | Vasopressor administration recommendation/remarks; BP monitoring remarks | Supports initial peripheral vasopressors rather than waiting for central access. Does not establish one duration, dose or catheter-location threshold. Inconsistent repeated noninvasive pressures support this authored A-line indication. |
| [Baxter norepinephrine label](https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=6363e9b4-29df-4553-904d-a563e5adda6e) | Updated February 6, 2026; sections 2.1, 3, 5.1 | 4 mg/250 mL is a labeled 16 mcg/mL premix. The label calls for a large vein and frequent site/extravasation observation; that concentration alone is not a universal central-line rule. |

## Agreed game abstraction

The next build replaces six matching-word cards with shaped equipment and an
explicit state machine. Snap geometry and short hold/drag gestures are game
controls, not manufacturer-accurate connector specifications or a test of sterile
technique. The supplied kit must visibly identify prior team preparation,
including bag de-airing and asepsis. A waste endpoint stays separate from the
patient. The physical drawing must agree with the active route, not merely show
successful text beside an unchanged circuit.

The agreed sequence is fit bag/wrap/tubing/cable → trace → two off-patient fluid
stages → close/cap → pressure → level → route/zero/restore → trained insertion.
Every transition is independently gated. Wrong gestures leave work recoverable.
Pressure squeezes are deliberately few; no elapsed setup time, gesture speed or
zeroing action changes physiology. Needed support and urgent patient assessment
remain available ahead of equipment. A due obtained recheck interrupts the next
objective while retaining assembled progress.

Before valid monitoring, the ART channel is unavailable or explicitly a setup
reference; a zero display is not a patient pressure. Last obtained cuff/recheck
values retain their measurement label. Any future bed-height artifact must be
stored separately from the authored patient findings. The current scope does not
add independent cannulation, an arrest treatment pathway, EVD handling, a universal
peripheral-pressor duration rule, or drug titration.

## Implementation review status

Reviewed candidate: `pocket-engine.js`, `pocket-equipment.js` and
`pocket-game.js`, with the project instructions and earlier clinical record.
The source-informed review found no remaining blocking clinical mismatch in the
intended playable sequence after the following corrections were inspected:

- Two gated fluid stages now distinguish vent and remaining-tubing preparation.
  Air removal, caps, pressure and reference setup gate trained insertion.
  The obsolete word-part and bubble-pop actions cannot bypass the new workflow.
- The prepared-kit/de-aired-bag assumption is visible during fitting and in About.
  Waste flow is drawn only during the open preparation route; closure removes the
  waste cup/branch and displays a capped distal endpoint. The stopcock drawing
  labels PATIENT PORT, AIR and TRANSDUCER, with an OFF indicator and active path.
- Atmospheric zero requires the air route. Restore explicitly closes/caps it;
  opening the reference again invalidates zero. These actions leave obtained
  patient values unchanged. The handoff requires complete monitoring and recheck.
- Both arterial display entry points now suppress the schematic signal unless the
  circuit is primed, clear, pressurized, leveled, zeroed, capped, closed to air and
  inserted by the team. The zoom retains last obtained cuff/recheck observations
  separately and identifies atmospheric zero as a reference. No numerical
  arterial reading is invented from the teaching trace.
- The brief peak tap describes the highest pressure in the schematic beat. It
  does not score a waveform diagnosis or establish procedural competence.
- The main control's due-recheck behavior now agrees with its label even while
  the monitor is enlarged. HELP retains its recognizable label after the call.
  Equipment work persists across bedside return.

Independent check run: `node --test tests/pocket-engine.test.mjs` passed 21/21.
This verifies modeled gates, migration and invariants; it is not a physical-phone
playtest, source validation of every legacy case, or evidence of enjoyment.
Browser gesture/layout acceptance belongs to the independent UX reviewer and
integrator. Physical-phone comfort and clinical educator/device-team review
remain outstanding. No further source changes are proposed by this review.
