# Loot Calculating

Loot Calculating is a local-first React/TypeScript web application for game-economy and loot
planning. It combines deterministic reward calculations, probability tools, dungeon planning, and
reward simulation in a browser-only SPA.

## Features

- Main loot and economy calculator for one or multiple chest types.
- Expected versus actual reward tracking with deviation indicators.
- Mixed chest handling and price overrides.
- Advanced dungeon planning with equipment categories, character count, reward multipliers, and
  day/week/month/year periods.
- Transfer of a planned chest composition into the main calculator.
- Weighted reward simulation with large runs processed in chunks.
- Editable price and probability/reference data.
- RU/EN interface, light/dark themes, and browser persistence.

The bundled dataset contains 65 items, 22 chest types, 20 dungeons, and a simulator chest with 62
reward outcomes.

## How It Works

The application follows a simple client-side flow:

```text
bundled reward data
        -> user inputs and price overrides
        -> deterministic calculation or weighted simulation
        -> totals, deviations, planning results, or reward distribution
```

Calculators derive expected values from reward chances, quantities, and chest counts. The simulator
selects one weighted outcome for each opening and exposes the resulting distribution for the run.

## Tech Stack

- React 19
- TypeScript 6
- Vite 8
- React Router DOM 7
- Tailwind CSS 4
- Vitest 5
- Oxlint

## Local-first Architecture

The application runs entirely in the browser. It does not require an account, backend, database,
or cloud service. User settings, prices, probabilities, and calculation state are persisted in the
browser's `localStorage`.

## Getting Started

Requires Node.js 20 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:5173` in a browser.

To preview the production build locally:

```bash
npm run build
npm run preview
```

## Data and Validation

Core calculator data is stored in `src/data/initialData.ts`. Simulator chest definitions live in
`src/data/simulator-chests/` and are checked before a build.

Validate the installed simulator data:

```bash
npm run chest:validate
```

Validate a draft chest definition without changing project files:

```bash
npm run chest:import -- --input examples/simulator-chest-draft.example.json
```

The importer also supports an explicit `--apply` workflow for developers who intentionally want to
add a validated chest and download its icons.

## Quality Checks

The repository includes automated regression coverage for calculation, advanced planning, and
simulation logic.

```bash
npm test
npm run typecheck
npm run lint
npm run chest:validate
npm run build
npm audit
npm audit --omit=dev
```

The checks cover seven automated tests, TypeScript compilation, linting, simulator-data validation,
the production Vite build, dependency security auditing, and a local production-preview smoke path.

## Limitations

- The application is client-side and local-first; there are no accounts, cloud synchronization, or
  shared projects.
- Results depend on the reward and price data bundled with the application or entered by the user.
- The project is not tied to a maintained hosted service; run it locally or deploy the static build
  to infrastructure you control.
- The automated tests focus on business logic. Browser and device compatibility still depends on
  the target environment.

## Project Structure

```text
src/
  components/          shared UI
  context/             state and persistence boundary
  data/                calculator and simulator data
  pages/                application routes
  utils/                calculations, simulation, and storage helpers
scripts/chest-import/   simulator-data validation and import tools
examples/              safe importer example input
public/                static icons and assets
```
