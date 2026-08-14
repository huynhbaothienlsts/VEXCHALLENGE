# VEX Rapid Innovation Challenge — Control Center

A fast, student-facing control center for the **VEX Rapid Innovation Challenge** at LSTS.

**Build. Practice. Improve. Compete.**

The site is designed for three teams of four students. Every team completes the same mission:

> Collect as many Cups and Pins as possible from the Supply Zone and deliver them to the team's Delivery Zone.

## What is included

- Five focused sections: Home, Mission & Field, Build & Practice, Match Mode and Results
- The original `Pictures/Field.jpg` field map, with full-screen viewing and zoom controls
- One-minute individual practice and four-minute full-match practice
- A timestamp-based 4:00 Match Timer with Pause, Resume and reload recovery
- Automatic Driver 1–4 rotation at 3:00, 2:00 and 1:00
- Visual and optional sound alerts for `CHANGE DRIVER!` and `MATCH ENDED`
- Cup and Pin counters using only `Cups × 5 + Pins × 10`
- Optional score lock when a match ends, with a manual correction unlock
- Local result history, tied leaderboard ranks, printing and CSV export
- Automatic saving to browser `localStorage`; no account, backend or API key
- Responsive layouts for laptops, landscape tablets, projectors and phones
- Keyboard focus states, labels, alt text and reduced-motion support

## Requirements

- Node.js 20 or newer
- npm 10 or newer

No paid service or additional runtime is required.

## Install and run

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal. The default port is `4173`.

## Test and build

```bash
npm test
npm run build
```

The production site is written to `dist/`. Preview that exact production output with:

```bash
npm run preview
```

Then open `http://127.0.0.1:4173/`.

The automated tests verify:

- `0 Cups, 0 Pins = 0`
- `1 Cup, 0 Pins = 5`
- `0 Cups, 1 Pin = 10`
- `3 Cups, 2 Pins = 35`
- Negative counts are clamped to zero
- Driver changes occur at exactly `3:00`, `2:00` and `1:00`
- Timer formatting ends at `0:00`

## Deploy to GitHub Pages

The repository already contains `.github/workflows/deploy-pages.yml`. It builds `dist/` and publishes it with the official GitHub Pages actions.

1. Upload the **whole project**, including all folders and the hidden `.github` folder, to the repository's `main` branch.
2. On GitHub, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Open the **Actions** tab and select **Deploy VEX Challenge to GitHub Pages**.
5. Choose **Run workflow**, or push a new commit to `main`.
6. Wait for both the `build` and `deploy` jobs to become green.
7. Open the address shown in the deployment job. For a project repository it normally looks like:

   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

The Vite build uses relative asset paths, so it works under a repository subpath without manually editing the repository name.

### If GitHub Pages shows 404

- Confirm the repository contains `index.html`, `package.json`, `src/`, `public/`, and `.github/workflows/deploy-pages.yml`.
- Confirm **Settings → Pages → Source** is set to **GitHub Actions**, not `Deploy from a branch`.
- Confirm the workflow ran on the `main` branch and both jobs succeeded.
- Open the deployment URL from the Actions result instead of guessing the URL.
- Repository names and URLs are case-sensitive.

The workflow follows GitHub's documented Pages flow: checkout, build, configure Pages, upload the `dist` artifact and deploy it.

## Project structure

```text
src/
  App.jsx                  Main five-section experience and interactions
  data/challenge.js        Mission, rules, steps and initial local data
  hooks/useProject.js      localStorage persistence
  utils/challenge.js       Scoring and timer phase utilities
  styles.css               Visual system, responsive and print styles
public/images/
  field.jpg                Exact supplied field map
  v5-clawbot.webp          Supplied Clawbot visual
  cup-and-pin.jfif         Supplied scoring objects
  international-teams.webp Optimized supplied team photo
test/challenge.test.js     Scoring and timing tests
scripts/
  build.mjs                Production build
  dev.mjs                  Local Vite server
  preview.mjs              Dependency-free production preview
```

## Local data

Team setup, short improvement notes, practice checks, timer state, score and match history are saved on the current browser and device only.

- Reloading a paused match preserves its time and score.
- Reloading a running match recalculates time from its real end timestamp.
- Saving the same match again updates its existing record instead of adding the score twice.
- **Clear Results** and all timer/score resets require confirmation.
- Clearing browser storage removes saved data.

## Source assets

All challenge visuals come from the supplied project assets. `Field.jpg` is copied without visual changes. The large international team photograph is resized to WebP for faster loading; the original remains in `Pictures/`.
