# SHIFT: ICU

A retro nursing simulation created by **Rafael Gallardo, RN**.

The primary experience is now **Pocket Bedside: Pressure Drop**, a phone-first
portrait game with floating touch-drag movement and hands-on nursing mini-games.
One older patient needs assessment, prescribed hemodynamic support and ordered
A-line monitoring. The earlier hospital, focused cases and rhythm demo remain
available under Other modes. Existing browser notes are preserved.

## Source and deployment status

- Repository: [rgallardomc-ui/SHIFT-ICU](https://github.com/rgallardomc-ui/SHIFT-ICU).
- Live game: [Play SHIFT: ICU](https://rgallardomc-ui.github.io/SHIFT-ICU/).
- The floor framework and earlier Delta improvements were
  merged into `main` in [pull request #1](https://github.com/rgallardomc-ui/SHIFT-ICU/pull/1).
- The first floor release, `b885b3e`, passed [Pages deployment #2](https://github.com/rgallardomc-ui/SHIFT-ICU/actions/runs/39521193404).
  Later source changes require a new successful deployment before appearing live.

GitHub is the source of truth. Retrieve current `main` and preserve the pending
branch work before future edits. Pages deployments are manual; a source commit
alone does not update the playable game.

## Pocket Bedside — 0.6 candidate

- One portrait viewport: patient, pump and tray stay close. Drag to move; release
  to stop, or tap a station. No D-pad or required typing.
- Touch patient assessment hotspots, match the prescribed bag, trace the systemic
  IV, then assemble/prime/de-air/pressurize/level/zero the ordered monitoring setup.
- A trained inserter places the catheter. Nurse checks waveform/site/distal
  circulation and obtains the patient response. A-line setup does not treat shock.
- Physical pieces rearrange on replay; the medical order does not randomize.
- Installable home-screen manifest/app shell. In Safari, use Share → Add to Home
  Screen; real-device installation/offline behavior remains separately testable.

The current design target is the phone, replacing the earlier controller-first
priority. See [the compact project record](docs/PROJECT_RECORD.md) for what is
implemented, browser-tested and deployed.

## Earlier controller prototype — 0.5

Use **Play a short shift** on the home screen, or `/#quick` after deployment.
The first slice adapts existing Delta `cabg-recovery`, with one compact ward and
no admission / IV / pharmacy interruptions. The 3–5 minute label is a design
target, not a validated session-length guarantee. No forced idle time is added.

- Move with left stick / D-pad / arrows; interact with A / Cross / E / Enter.
- Menus use directions and confirm. B / Circle / Escape goes back; Start / P pauses.
- Follow objective offers guided walking. Either ECG or K/Mg coordination may come
  first; both stay on the clinical plan. Urgent calls never wait for a checklist.
- Clinical feedback keeps the still-irregular rhythm and pending review visible.
  Success requires obtained reassessment and an honest handoff, not a high score.
- Calm has no deadline. The optional practice clock stops for decisions / pause
  and offers retry from the alarm. It predicts no patient outcome.
- Replay keeps the same case and optionally flips the compact layout. No streak,
  absence penalty or grinding. New progress uses `shift-icu-quick-v1`; older
  `shift-icu-v1` and `shift-icu-floor-v3` data are retained.

Physical controller compatibility remains unverified until Rafael supplies his
controller model / OS / browser and tests it. Nonstandard remotes are not guessed.
See [the compact project record](docs/PROJECT_RECORD.md) for verified versions,
team owners, acceptance criteria, decisions, blockers and actual test evidence.
Research / clinical review are linked from that record.

## Play-first shift layer — 0.4

The default floor now leads with one short objective and a highlighted destination.
The full chart and clinical worklist remain available when the player needs them.

- A central U-shaped station, with a supply room and Pyxis behind its back wall.
- Three Celsius arcade sprint charges, a visible carried gray bin, supply-card
  pickups, eight inventory slots, one-time quest points and short result feedback.
- Three bedside clue cards that obtain the actual scripted assessment / device
  findings. Cause-specific responses unlock from current findings and orders;
  urgent team calls remain available immediately.
- A seeded iMobile admission call, receiving report, visible ETA, room setup
  upgrades and a safe transport hold when readiness is incomplete.
- A dislodged peripheral-IV event with explicit intact critical-infusion access,
  a labs-first or replacement-first plan, supplies and labelled Pyxis pickup.
- An abstract ultrasound-IV phantom puzzle: inspect / identify the vessel,
  reacquire the tip before each advance, and complete site / patency / securement
  checks before the inventory is consumed and the task clears.
- An A-line setup puzzle: assemble components, prime off the patient, remove air,
  meet this case's bag-pressure target, level / zero, and obtain a prepared tray.
  Catheter insertion remains assigned to the credentialed operator.
- A pharmacy queue for the explicit Impella purge-order addendum, followed by
  patient / strength / volume / route label matching, pickup and device-team handoff.
- Short shift highlights; the detailed clinical task review is expandable.

The score is an arcade score, not a clinical grade. The speed boost is a fictional
power-up and does not change clinical time. Existing floor notes and the separate
focused-case saves are preserved. The latest source needs its matching successful
Pages workflow before the live URL changes.

## The floor framework


| Pod | Patient assignment pool |
| --- | --- |
| Alpha — step-down / IMC | Pneumonia / oxygen, telemetry, recovering sepsis transfer, DKA transition / meal-MAR handoff |
| Bravo — medical ICU | SLED, ventilation / liberation, upper GI bleeding, ARDS / paralysis readiness, post-ROSC admission |
| Charlie — neuro ICU | SAH / EVD, post-status airway protection, spontaneous ICH with a fall at onset |
| Delta — cardiac ICU | CABG receiving / bleeding change, postoperative CABG rhythm change, Impella rounds |

Fifteen scripted floor profiles support three shift formats: first rounds,
preparing / receiving an admission, and a longer night shift. Rooms and event
start times vary by seed; these are reviewed-in-progress teaching pathways, not
fifteen validated curricula or a continuous physiology model.

- Walk around the station and into actual room doorways with keyboard, touch pad
  or tap-to-walk. Room / destination buttons guide the nurse without teleporting.
- Visit bedsides, room computers, supplies and an interactive charge nurse.
- Use Orders, Worklist, MAR / infusions, labs, history / diagnostics, flowsheets
  and SBAR in a fictional Expanse-style chart. There is no EHR integration.
- Gather supplies and check actual admission room / receiving readiness.
- Prepare arterial-line and CVC-assistance equipment with an optional timer;
  trained operators retain insertion / device-procedure responsibilities.
- Track ordered repeated neuro / output / close checks, labs and positioning.
- Respond to new findings with order and assessment prerequisites. Urgent calls
  remain available before routine checklists. No delegation mechanic is included.
- Reassess at the actual response interval; retain unresolved problems in handoff.
- Document observed TOF site, stimulus and count in the NMBA readiness case, with
  separate analgesia / sedation / ventilation context and clear limits.
- Save floor progress / notes and up to ten earlier shifts; export a shift journal.
  The separate focused-case save key and authored notes are preserved.

Eight focused bedside cases remain separate: six Impella scenarios, sepsis and
DKA. Their original action-based clock is preserved.

Coached floor mode pauses while reading; independent mode keeps the clock running
in workspaces. One real minute represents thirty simulated minutes, and nursing
actions also advance case time. Blur / hidden pages pause the floor and release
movement. Equipment drills use a separate optional practice timer.

## Run and check

No installation or build step is required. Use Node.js 22 or newer for tests:

```bash
npm test
```

The release has **134 passing automated checks**, including the prior focused
cases, all floor response / handoff paths, specialty boundaries, randomized room
assignments, admissions, supplies / procedure gates, recurring deadlines, specimen
chronology, TOF readiness, persistence and walkable routes.

Desktop browser spot checks confirmed floor setup, a generated Delta admission
assignment, walking to the station, report, Orders / MAR / SBAR navigation and
restored authored notes after reloading. Actual iPhone QA and complete shift
playthroughs remain pending. Passing engine checks does not establish clinical
accuracy or input / layout behavior on a real device.

Serve `dist/` over HTTP to run ES modules; do not open the HTML file directly:

```bash
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. In a managed Sites environment, use its approved
preview workflow instead of starting a separate server.

## Publish through GitHub Pages

Merge the reviewed source into `main`, then run **Deploy game to GitHub Pages**
(`pages.yml`) on `main`. It checks browser module syntax and scenario tests,
uploads `dist/` and deploys the Pages artifact. Verify the returned deployment and
actual playable version before reporting the update live. Repository public
visibility was explicitly authorized; no paid plan was purchased.

## Clinical and design record

See [CURRICULUM.md](CURRICULUM.md) for Rafael's full game direction and pending
facility details, [CLINICAL_REVIEW.md](CLINICAL_REVIEW.md) for sources / scope, and
[DESIGN.md](DESIGN.md) for technical architecture.

Patients, prescriptions and responses are fictional. The game has not been
clinically validated or approved by the nurse manager / educator. Note checks
measure completeness, not clinical truth or competency. Exact SLED equipment,
medication / admission processes and Expanse configurations require the actual
manufacturer material, orders and local review.
