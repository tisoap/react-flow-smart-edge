# AGENTS.md — react-flow-smart-edge

Guidance for AI agents working in this repository.

## What this project is

**`@tisoap/react-flow-smart-edge`** is a published npm library (MIT) that provides custom [React Flow](https://reactflow.dev) edges which route around nodes using grid-based A\* pathfinding.

- **Consumers**: React apps using `@xyflow/react` v12+ (peer dependency).
- **This repo**: Library source, Vite library build, Docusaurus docs site, Storybook demos/tests, and browser-based Storybook tests.
- **Documentation**: https://tisoap.github.io/react-flow-smart-edge/docs (Docusaurus, deployed to gh-pages on release)
- **Storybook demos**: Chromatic (`.github/workflows/chromatic.yml`); local dev via `npm run storybook`
- **Package entry**: `src/index.tsx` → `dist/index.{mjs,cjs}` + `dist/index.d.ts`

Do not treat Storybook stories or `src/demos/` as part of the public API unless explicitly exporting them.

## Architecture (read this before changing path logic)

Smart edges follow a fixed pipeline. Changes usually touch one stage:

```
nodes + edge endpoints
  → getBoundingBoxes()     // graph + per-node boxes (nodePadding, gridRatio)
  → createGrid()           // 2D walkability grid; mark node cells blocked
  → guaranteeWalkablePath() // ensure start/end cells are reachable
  → generatePath()         // A* on grid (diagonal or orthogonal)
  → gridToGraphPoint()     // grid coords → flow graph coords
  → drawEdge()             // point sequence → SVG `d` string
```

| Layer            | Location                                          | Role                                                                                         |
| ---------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| React components | `src/Smart*Edge/`, `src/SmartEdge/`               | Wire `useNodes()` + `getSmartEdge()` into `@xyflow/react` `BaseEdge`                         |
| Edge factory     | `src/createSmartEdge/`, `src/smartEdgePresets.ts` | `createSmartEdge(preset, options?)` and canonical preset configs                             |
| Core API         | `src/getSmartEdge/index.ts`                       | Pure(ish) path computation; returns `{ svgPathString, edgeCenterX, edgeCenterY }` or `Error` |
| Geometry / grid  | `src/functions/`                                  | Bounding boxes, grid creation, coordinate conversion, SVG drawing                            |
| Pathfinding      | `src/pathfinding/`                                | Grid type + A\* (based on [PathFinding.js](https://github.com/qiao/PathFinding.js))          |

### Edge presets (canonical configs in `src/smartEdgePresets.ts`)

| Export / preset         | `drawEdge`                    | `generatePath`                   | Fallback (on failure) |
| ----------------------- | ----------------------------- | -------------------------------- | --------------------- |
| `SmartBezierEdge`       | `svgDrawSmoothLinePath`       | `pathfindingAStarDiagonal`       | `BezierEdge`          |
| `SmartStraightEdge`     | `svgDrawStraightLinePath`     | `pathfindingAStarDiagonal`       | `StraightEdge`        |
| `SmartStepEdge`         | `svgDrawStraightLinePath`     | `pathfindingJumpPointNoDiagonal` | `StepEdge`            |
| `SmartSmoothStepEdge`   | `svgDrawSmoothStepLinePath`   | `pathfindingJumpPointNoDiagonal` | `SmoothStepEdge`      |
| `SmartSimpleBezierEdge` | `svgDrawSimpleBezierLinePath` | `pathfindingAStarDiagonal`       | `SimpleBezierEdge`    |

Preset components are `createSmartEdge(preset)` with default options. Consumers can call `createSmartEdge("step", { gridRatio: 5 })` at module scope, or use exported `SmartEdge` + `smartEdgePresets` for custom rendering.

Custom edges that bypass presets should call `getSmartEdge({ ...edgeProps, nodes, options })` and handle `instanceof Error` (see README).

### Tunable options (`GetSmartEdgeOptions`)

- `nodePadding` (default `10`, min `2`): clearance around nodes in px.
- `gridRatio` (default `10`, min `2`): px per grid cell; lower = more accurate, slower.
- `drawEdge` / `generatePath`: pluggable; types exported from `src/index.tsx`.

## Repository layout

```
src/
  index.tsx              # Public exports only
  getSmartEdge/          # Core algorithm entry
  createSmartEdge/       # createSmartEdge factory
  smartEdgePresets.ts    # Canonical preset drawEdge/generatePath/fallback configs
  SmartEdge/             # Shared React wrapper (BaseEdge + fallback)
  SmartBezierEdge/       # Preset components (thin createSmartEdge wrappers)
  SmartStraightEdge/
  SmartStepEdge/
  SmartSmoothStepEdge/
  SmartSimpleBezierEdge/
  functions/             # Grid, bounds, SVG path builders
  pathfinding/           # Grid + A*
  demos/                 # Shared GraphWrapper, fixtures, demoRegistry (Storybook + docs)
  stories/               # Storybook only (excluded from dts build)
website/                 # Docusaurus documentation site (npm workspace)
.storybook/              # Storybook + Vitest browser setup
dist/                    # Build output (gitignored in dev; published to npm)
```

## Commands

| Task                                           | Command                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Install                                        | `npm ci`                                                        |
| Docs dev (Docusaurus)                          | `npm run docs` → http://localhost:3000/docs                     |
| Docs build                                     | `npm run build-docs` → `website/build`                          |
| Storybook dev                                  | `npm run storybook` (port 6006)                                 |
| Library build                                  | `npm run build-component`                                       |
| Full build (lib only)                          | `npm run build`                                                 |
| Deploy docs to gh-pages                        | `npm run deploy-docs` (also runs on `npm run release`)          |
| All checks (CI-equivalent lint/type/spell)     | `npm run check`                                                 |
| Auto-fix lint + format                         | `npm run fix`                                                   |
| Tests (Playwright + Vitest, Storybook stories) | `npm run test`                                                  |
| Install browser for tests                      | `npm run install-chromium`                                      |
| Release (maintainer)                           | `npm run release` (uses `release-it` + `.env` via `dotenv-cli`) |

**Before opening a PR**, run at minimum: `npm run check` and `npm run test`.

## Testing

- **No unit test files** in `src/**/*.test.*`; tests are **Storybook interaction tests** run in **headless Chromium** via Vitest (`vite.config.ts` → `storybook` project).
- Stories live in `src/stories/`; primary file: `SmartEdge.stories.tsx`.
- Demo fixtures and `demoRegistry` live in `src/demos/` and are shared with the Docusaurus `<FlowDemo />` component.
- `GraphWrapper` wraps flows with `data-testid="graph-wrapper"`.
- CI (`.github/workflows/test-ui.yml`): Node 26.3.1 → `npm ci` → `install-chromium` → `npm run test-storybook`.

When adding behavior, prefer extending existing stories or adding a focused story over introducing a parallel test harness.

## Build & publish

- **Bundler**: Vite library mode (`vite.config.ts`).
- **Externals** (not bundled): `react`, `react-dom`, `react/jsx-runtime`, `@xyflow/react`.
- **Types**: `vite-plugin-dts` with `entryRoot: src`, excludes `src/stories/**`.
- **Published files** (`package.json` `"files"`): `dist`, `src` (source shipped for types convenience).
- **Chromatic**: `.github/workflows/chromatic.yml` publishes Storybook on every push (public demo host).
- **Docs site**: Docusaurus in `website/`; `npm run deploy-docs` publishes to gh-pages via `release-it` `after:release` hook.
- **Rebuild before publish**: `prepublishOnly` runs `build-component`; `.release-it.json` runs the same in `before:npm`. Never publish with an outdated `dist/`—npm does not use `src/` for runtime imports.

## Code conventions

- **TypeScript**: strict, `verbatimModuleSyntax`, `erasableSyntaxOnly` (`tsconfig.app.json`).
- **ESLint**: flat config; `strictTypeChecked` + `@eslint-react` + SonarJS + Prettier (`eslint.config.ts`). Stories use `eslint-plugin-storybook`.
- **Format**: Prettier (`.prettierrc`).
- **Spellcheck**: cspell (`.cspell.json`); run via `npm run spellcheck`.
- **React**: functional components; smart edges use `useNodes()` inside preset components, not in `getSmartEdge`.
- **Imports**: use `import type` for types; respect `verbatimModuleSyntax`.
- **Errors**: `getSmartEdge` catches and returns `Error` instances; pathfinding helpers may `throw` internally. `SmartEdge` falls back to `options.fallback` (default `BezierEdge`).

## Common agent tasks

### Fix routing / path quality

1. Reproduce in Storybook (`npm run storybook`).
2. Trace: `getBoundingBoxes` → `createGrid` → `guaranteeWalkablePath` → A\* → `drawSvgPath`.
3. Tune `gridRatio` / `nodePadding` in stories before changing defaults.

### Add or change a public export

1. Implement in appropriate `src/` module.
2. Re-export from `src/index.tsx` (types + values).
3. Run `npm run build-component` and confirm the symbol appears in `dist/index.d.ts` and `dist/index.mjs` (and `dist/index.cjs` for CJS).
4. Update README if user-facing.

### Configure preset edge options (issue #58)

- **Option-only changes:** `createSmartEdge("step", { gridRatio: 5 })` at module scope.
- **Custom rendering + options:** exported `SmartEdge` + `smartEdgePresets.step` spread with overrides.
- Do not fork `getSmartEdge` for simple tuning.

### Add a new smart edge variant

Add an entry to `smartEdgePresets.ts`, export via `createSmartEdge("newPreset")`, and add a thin `Smart*Edge` wrapper. Do not fork `getSmartEdge`.

## Pitfalls

- **React Flow v12 only** (`@xyflow/react` ≥ 12). Do not use legacy `reactflow` import paths in docs or code.
- **README examples** may show older import names (`reactflow`); library code correctly uses `@xyflow/react`.
- Changing `getSmartEdge` return shape or option defaults is a **breaking change** for consumers—bump major version via release-it.
- `src/stories/` and `src/demos/` must stay out of the dts entry surface (stories are already excluded in Vite dts config).
- Pathfinding runs on a **discrete grid**; very small `gridRatio` on large graphs can be slow.
- **Stale `dist/` on npm**: editing `src/index.tsx` alone does not fix consumers; a release must include a fresh `npm run build-component` output.

## Key files (quick reference)

| File                                     | Why it matters                            |
| ---------------------------------------- | ----------------------------------------- |
| `src/smartEdgePresets.ts`                | Canonical preset configs (single source)  |
| `src/createSmartEdge/index.tsx`          | `createSmartEdge` factory for consumers   |
| `src/getSmartEdge/index.ts`              | Central algorithm orchestration           |
| `src/SmartEdge/index.tsx`                | React integration + fallback behavior     |
| `src/functions/createGrid.ts`            | Grid dimensions and obstacle marking      |
| `src/functions/guaranteeWalkablePath.ts` | Start/end walkability fixes               |
| `src/pathfinding/aStar.ts`               | A\* implementation                        |
| `src/functions/drawSvgPath.ts`           | SVG path string generation                |
| `vite.config.ts`                         | Lib build + Vitest/Storybook test project |
| `.release-it.json`                       | Release hooks (`before:npm` → build lib)  |
| `package.json`                           | Scripts, peers, exports map               |

## What not to do unless asked

- Commit secrets (`.env` is for release tokens; see `.env.example`).
- Add unrelated dependencies or restructure the monolith pipeline without cause.
- Commit to `dist/`, `storybook-static/`, or `website/build/` (build artifacts).
- Force-push `main` or skip git hooks.
- Expand scope into a full app—this is a **library**, not an application repo.
