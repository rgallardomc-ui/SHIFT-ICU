# SHIFT: ICU

A retro nursing simulation created by **Rafael Gallardo, RN**.

Move your nurse around a twelve-room unit. Receive a generated assignment, obtain
report, assess patients, check orders, gather supplies, prepare an admission,
reassess changes, document and hand off unfinished concerns.

## Source and deployment status

- Repository: [rgallardomc-ui/SHIFT-ICU](https://github.com/rgallardomc-ui/SHIFT-ICU).
- Live game: [Play SHIFT: ICU](https://rgallardomc-ui.github.io/SHIFT-ICU/).
- Last verified public deployment: original six-case import, `f7094d0`.
- Eight-case update: saved on the GitHub branch `delta-v0.2`, `9bdaba8`.
- This **0.3 floor implementation is a pending candidate**. It has not yet been
  merged / deployed. GitHub connection writes returned HTTP403 and browser control
  was unavailable. The live URL must not be described as containing this update
  until a new successful Pages deployment is verified.

GitHub is the source of truth. Retrieve current `main` and preserve the pending
branch work before future edits. Pages deployments are manual; a source commit
alone does not update the playable game.

## The 0.3 candidate

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

The candidate has **71 passing automated checks**, including the prior focused
cases, all floor response / handoff paths, specialty boundaries, randomized room
assignments, admissions, supplies / procedure gates, recurring deadlines, specimen
chronology, TOF readiness, persistence and walkable routes.

Browser / actual iPhone QA is still required. Passing engine checks does not
establish clinical accuracy or input / layout behavior on a real device.

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
