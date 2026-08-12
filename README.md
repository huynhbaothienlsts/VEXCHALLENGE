# VEX Rapid Innovation Challenge

An interactive project guide and engineering notebook for **The Science Exchange Program at LSTS**. The site supports three international teams through the 180-minute **Emergency Supply Delivery Robot** challenge.

The student-facing experience is in clear English and includes:

- Team setup, roles, design priorities and constraints
- Baseline observation and a guided hypothesis builder
- Design planning, sketch upload and build checkpoints
- Baseline, Trial 1–3 and Final Test data entry
- A live comparison chart built only from student-entered data
- Analysis, Presentation View, rubric and reflection
- Autosave, JSON import/export, CSV test export and a printable project summary

## Requirements

- Node.js 20 or newer (Node.js 22 recommended)
- npm 10 or newer

No backend, API key, account or paid service is required.

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Open the local address shown in the terminal. The default development address is `http://127.0.0.1:4173/`.

## Build

```bash
npm run build
```

The static production site is written to `dist/`. To inspect that build locally:

```bash
npm run preview
```

## Deploy to GitHub Pages

This repository includes `.github/workflows/deploy-pages.yml` and uses relative asset paths, so it works for both a user site and a project site.

1. Create a GitHub repository and push this project to the `main` branch.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push to `main`, or run **Deploy VEX Challenge to GitHub Pages** manually from the Actions tab.
5. The workflow installs packages, builds `dist/` and publishes the result.

## Edit content

- Challenge structure, roles, priorities, constraints, timeline, rubric and glossary: `src/data/challenge.js`
- Page content and interaction layouts: `src/App.jsx`
- Shared controls, timers, chart and navigation: `src/components/Common.jsx`
- Visual system and responsive/print styles: `src/styles.css`
- Landing image: `public/challenge-hero.png`

Keep student data defaults blank. Do not add example trial values to `createInitialProject()`.

## Local data and moving devices

The app autosaves the project in browser `localStorage`. Data remains on the current browser and device; it does not sync automatically.

- **Export** downloads the complete project as JSON.
- **Import** restores an exported JSON project on another device.
- **Export testing CSV** downloads the five-row test table.
- **Reset** displays a clear confirmation before deleting local project data.
- **Print / Save PDF** uses the browser’s print dialog on the Team Project Summary page.

Large uploaded sketches may exceed browser storage limits. The interface accepts images up to 1.5 MB to keep local saving reliable.

## Accessibility and responsive behavior

The interface includes semantic headings, labels for form controls, keyboard focus states, alt text, ARIA names, non-color status labels and reduced-motion support. Layouts are optimized for laptops and tablets and adapt to a mobile navigation drawer below 760 px.

## Source notes

The lesson sequence and student content were adapted from the provided `VEX Rapid Innovation Challenge.docx` and `VEX_Rapid_Innovation_Challenge_3_Hours.pptx`. The landing visual was extracted from the user-provided PowerPoint. The activity uses selected Override elements as an engineering context and does not reproduce the full official competition rules.
