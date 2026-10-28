# Physical A-line independent QA — v0.7.0

Owner: `/root/qa` · October 28, 2026. Integration owner: root.

**Result:** the 390×844 episode was completed and replayed. The 320×568 repeat reached the stopcock activity through all earlier physical setup phases, with no page scrolling or material input/layout blocker found in that scope. This is browser viewport QA, not physical-phone acceptance, clinical validation, or proof of enjoyment.

## Method and tested candidate

Read current `AGENTS.md`, `docs/PROJECT_RECORD.md`, engine/UI and existing test evidence. Used the managed preview with an ignored, unpublished `phone-check.html` fixture containing a real 390×844 or 320×568 iframe. Actions used native pointer drags/holds or ordinary visible buttons. No game state, local storage, synthetic events, or hidden completion calls were injected.

An early saline drag coincided with a builder file write and preview reload; it is excluded from results. Later verification used a frozen candidate. Root also stopped interacting with other browser tabs for the compact hold check. The fixes noted below were loaded before final downstream and compact checks.

## Actually played at 390×844

- Called bedside help, completed mental/airway-breathing/perfusion/validated-pressure checks, and verified the explicit patient prescription. Wrong-patient bag selection produced corrective feedback and immediate retry. Correct bag, systemic IV checkpoints, prescribed site and locked pump were completed by taps.
- Started prescribed support before any A-line equipment. The displayed obtained MAP stayed 54 until all fresh recheck hotspots were completed; the scripted recheck showed MAP 66/HR 106 and retained prior-hour urine 18 mL.
- Native saline-to-sleeve, wrap-to-bag and fluid-connector-to-transducer drags passed. A misplaced wrap drop onto the patient gave specific retry feedback without removing accepted saline progress. The keyed cable passed its tap alternative.
- Left the equipment at 3/4 through the patient shortcut. Latest mental-state feedback was available, and returning preserved 3/4.
- Traced bag→transducer and transducer→waste with two native drag segments. The disconnected priming phase followed. A sustained coordinate hold visibly advanced fluid; release stopped it. Pausing/resuming at 53% preserved that partial vent progress. Saved partial priming also survived reload.
- Tap alternatives completed vent and remaining tubing in order. Nonvented-cap closure preceded three pressure-bulb taps to the marked 300 mmHg target.
- Native transducer drag aligned the single moving sensor with the right-atrial reference. Tubing/cable followed it; no second static sensor remained.
- Native stopcock drags turned OFF toward PATIENT, then after zero OFF toward AIR. The air-open and capped-monitoring state labels changed. MAP remained the obtained 66; zeroing did not create a new patient response.
- Assisted the trained inserter, zoomed the valid schematic waveform, inspected its systolic peak and received the brief cue, then returned and checked site/distal circulation.
- Completed the ongoing-care handoff. Ending explicitly retained support and the pending plan. Replay reset assessment to 0/4, MAP 54 and support OFF.

## Compact repeat at 320×568

- Replayed initial assessment and prescribed support through normal taps. Native saline drag passed.
- Opened the monitor before a valid A-line existed: it showed the last obtained cuff values and `ART —`, with no patient arterial waveform.
- The due recheck took over the primary action while monitor zoom was open. Completing the fresh bedside checks and returning retained the seated bag at 1/4.
- Completed wrap/fluid/cable and fluid-route tap alternatives. Native hold advanced flow and stopped at release. Completed remaining priming/caps/pressure by taps.
- Native transducer drag passed at compact size. Stopcock labels and 48×48 control remained readable and contained. The compact repeat stopped at this phase; no full second compact handoff is claimed.

| Measurement | Observed bounds |
| --- | --- |
| 390×844 page | Document client and scroll dimensions both 390×844. |
| 320×568 page | Document client and scroll dimensions both 320×568. |
| Compact primary / HELP | 219×45 / 69×45 px. |
| Compact Pause / Back / Patient | 44×44 / 52×44 / 53.30×44 px. |
| Compact miniature monitor | 57×44 px. |
| Compact saline object | 55×66 px. |
| Compact flow control | 66×44 px. |
| Compact transducer | 56×48 px. |
| Compact stopcock | 48×48 px. |

The compact equipment image compresses vertically but preserves the patient-left/equipment-right arrangement and visible current instruction. Every visible actionable control measured in these new scenes met the 44 px minimum. Precise geometric drop-zone extents were not separately measured; successful native bag drops were verified at both dimensions.

## Regression and verification

- Pause/resume and replay passed. Moving focus to the fixture's size buttons triggered the expected blur pause; resuming restored the scene.
- Other modes → hospital hub → Earlier rhythm demo → Back to hospital → Play Pressure Drop passed. Returning preserved the new pocket run at the stopcock objective. This is entry/return smoke, not a full browser playthrough of every historical case.
- Independent final `npm test`: **142/142 passing**. This includes legacy-state preservation, physical setup prerequisites, retired word/bubble shortcut rejection, partial-flow behavior, old pocket-save migration and waveform-validity guards.
- Syntax checks passed for changed browser modules: `pocket-engine.js`, `pocket-game.js`, `pocket-equipment.js`, `app.js`, `phone-sw.js`.
- No console/runtime defect surfaced during the played path. A comprehensive console-log audit was not performed.

## Findings resolved during this pass

- Flow HUD initially displayed raw fractional precision, such as `0.8349999999991269/100`. Rounded progress is now verified at both sizes.
- Reopened assessment initially retained its baseline footer after the obtained recheck. Builder changed the footer to reflect the latest check; underlying hotspot feedback already used the latest findings.
- Builder/source review identified stale cancellation visuals and a duplicate static transducer. Final source cleanup and resume rerender were reviewed; the single-sensor level scene and ordinary pause/resume were exercised.

## Limits and next hands-on check

Native sustained flow works, but tool-controlled wall-clock hold duration did not reliably correspond to the authored two-second phase: one exclusive-focus 2.4-second native press advanced 25%. Earlier long presses advanced differing amounts. Browser rendering/tool timing is a possible contributor; no exact cause or physical-device timing is established. Tap flow reliably completes the task. Test hold feel and frame-rate behavior on an actual phone before claiming a fixed duration.

Pointer-cancel/lost-capture cleanup was source-reviewed, not deliberately injected into a live held gesture. Multitouch, OS interruptions during a gesture, real finger occlusion/comfort, physical iPhone/Android latency, Safari chrome/safe areas, Home Screen/offline installation, controller/remote input, audio/haptics and human enjoyment remain unverified. Clinical review is separate and is source-informed, not manufacturer/facility approval.

Inspected proof images were captured from the final workbench at 390×844 and 320×568. They are handoff artifacts, not deployed game assets. The local fixture must remain ignored and excluded from publication.

## Integrator final label check

After independent QA, the integrator enlarged all three stopcock port names to 11px. DOM and visual inspection confirmed 320×568 and 390×844 client/scroll dimensions remain exact, with readable, non-overlapping port labels. No action logic changed. [Final viewport proof](physical-aline-final.jpg); the earlier cropped [390 phone](physical-aline-390.jpg) and [320 phone](physical-aline-320.jpg) show the independently tested scene before this label-only adjustment.
