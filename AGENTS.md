# SHIFT: ICU

Created by Rafael Gallardo, RN. The canonical project is
`https://github.com/rgallardomc-ui/SHIFT-ICU`, branch `main`.
Keep it separate from `rgallardomc-ui/Entropy-Game`, which is a visual reference.

## Development

- Plain HTML, CSS and ES modules in `dist/`; no install or build is required.
- Retrieve current `main` before editing. Preserve existing notes and browser progress.
- Run `npm test` and `node --check` for changed browser modules.
- The floor uses `shift-data.js`, `shift-engine.js`, `shift-map.js` and
  `shift-floor.js`; focused bedside cases keep their existing engine / save key.
  Preserve both save formats. Floor notes use a separate `shift-icu-floor-v3` key.
- GitHub Pages serves `dist/` through the manual `pages.yml` workflow. A successful
  code push does not itself update the playable game. Verify the deployment result.
- Repository public visibility and Pages deployment were authorized on October 20,
  2026. Preserve this visibility unless Rafael requests a change.
- Keep introductions short, objectives visible, text readable and touch targets large.
  Release movement on pointer cancellation, capture loss, blur and page hiding.

## Clinical content

- The current direction is a walkable shift with room assignments, supplies,
  computers and recurring care. Keep Delta CABG / Impella depth a priority while
  retaining the requested pod boundaries in `CURRICULUM.md`.
- Alpha is step-down / IMC, including stabilized ICU transfers. Bravo is medical
  ICU; Charlie is neuro; Delta is cardiac. Do not place an actively unstable ICU
  patient into Alpha as a routine assignment. Renewed deterioration triggers review.
- Floor CABG / EVD / SLED / neuro cases are first scripted pathways, not completed
  specialty curricula. ECMO and machine-specific SLED operation remain planned.
- Use current primary/manufacturer sources and record sections and review scope in
  `CLINICAL_REVIEW.md`. Source checking does not establish local protocol approval.
- The nurse-manager review is pending. Never represent this game as validated,
  endorsed by the hospital/manufacturer, or a competency assessment.
- Keep orders, medication rates, targets, laboratory schedules and nursing authority
  explicit and case-specific. Catheter correction and controller exchanges use the
  trained/credentialed team assigned in each case.
- Urgent assessment and escalation can occur in parallel; do not gate them behind a
  routine checklist. Require relevant evidence before cause-specific treatment.
- Separate perfusion, congestion, responsiveness and reassessment in fluid decisions.
  Separate albumin concentration, dose, volume and indication.
- No isolated CVP, waveform, glucose or pressor count is a complete diagnosis or an
  individual mortality prediction. Pump flow is not total cardiac output.
- Outcomes are scripted; initial assessment cards retain baseline findings. Do not
  invent immediate urine improvement or laboratory normalization after treatment.
- Free-text note checking is completeness only. Preserve that limitation and use
  fictional case details throughout.
- Train-of-four is a blockade observation, not proof of unconsciousness / analgesia.
  Do not assign an interpretable movement-based RASS during pharmacologic paralysis.
  The current NMBA case is readiness / documentation, not an administration protocol.
- Do not make CTA the universal response to GI bleeding. Use the selected case's
  resuscitation, airway, GI / endoscopic and diagnostic plan.
- The chart follows a generic Expanse-style workflow. It is not connected to an EHR,
  an authenticated hospital environment or a facility medication formulary.
