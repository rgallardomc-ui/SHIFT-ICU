# SHIFT: ICU

A retro nursing simulation created by **Rafael Gallardo, RN**.

Explore four hospital pods and practice a compressed shift: receive report, assess, interpret findings, act within orders, reassess, document and hand off.

| Pod | Specialty | Prototype status |
| --- | --- | --- |
| Alpha | Intermediate care | Curriculum planned |
| Bravo | Medical ICU | Sepsis and DKA cases playable |
| Charlie | Neuro ICU | Curriculum planned |
| Delta | Cardiac ICU | Four Impella cases playable |

## Current features

- Retro hospital map with tap, keyboard and touch controls.
- Six case pathways with bedside findings, orders and laboratory schedules.
- Schematic Impella Ao/LV placement pressures and motor current.
- PAPi and fluid calculations; albumin concentration/volume calculator.
- Coached and independent modes, safety stops and a case debrief.
- Typed SBAR, optional browser dictation, practice-note export and local progress.
- Exportable clinical/gameplay review notes.

The prototype uses fictional patients and scripted outcomes. It has not been clinically validated. Note checking measures field completeness, not clinical accuracy or nursing competency. Browser dictation depends on browser support; phone keyboard dictation remains an alternative.

## Run locally

No dependency installation or build step is needed. From the repository root:

```bash
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Serve the files over HTTP rather than opening `index.html` directly, because the game uses JavaScript modules.

## Run checks

Use Node.js 22 or newer:

```bash
npm test
node --check dist/app.js
```

Twenty scenario-engine checks cover complete handoffs, unsafe actions, potassium before insulin, position-alarm support settings, PAPi, fluid calculations and albumin arithmetic. Live browser and clinical review remain separate checks.

## GitHub Pages

The repository includes an on-demand deployment workflow. It does not publish automatically on an ordinary code push.

1. In the repository, open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Open **Actions → Deploy game to GitHub Pages → Run workflow** on `main`.
4. The workflow checks the game and uploads `dist/`, then reports the actual deployed URL.

GitHub Pages availability for a private repository depends on the GitHub plan. GitHub Free supports Pages from public repositories. See the [official Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Project structure

```text
dist/                    Browser game and lecture images
  cases.js               Clinical case content
  engine.js              Scenario state, gates and calculations
  app.js                 Game interface, map, notes and optional speech
  style.css              Desktop and phone layout
tests/                   Scenario-engine checks
.github/workflows/       Code checks and manual Pages deployment
DESIGN.md                Curriculum and development plan
```

Start clinical expansion with a reviewed Delta case, then apply the same assessment/action/reassessment structure to CABG, ECMO, neuro and IMC. Record case reviewers and local protocol versions when that review is complete.
