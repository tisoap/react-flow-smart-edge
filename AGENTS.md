# AGENTS.md — react-flow-smart-edge

Guidance for AI agents working in this repository.

## What this project is

**`@tisoap/react-flow-smart-edge`** is a published npm library (MIT) that provides custom [React Flow](https://reactflow.dev) edges which route around nodes using grid-based A\* pathfinding.

- **Consumers**: React apps using `@xyflow/react` v12+ (peer dependency).
- **This repo**: Library source, Vite library build, Storybook demos/docs, and browser-based Storybook tests.
- **Live demos**: https://tisoap.github.io/react-flow-smart-edge/
- **Package entry**: `src/index.tsx` → `dist/index.{mjs,cjs}` + `dist/index.d.ts`

Do not treat Storybook stories or `src/internal/` as part of the public API unless explicitly exporting them.

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

| Layer            | Location                            | Role                                                                                         |
| ---------------- | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| React components | `src/Smart*Edge/`, `src/SmartEdge/` | Wire `useNodes()` + `getSmartEdge()` into `@xyflow/react` `BaseEdge`                         |
| Core API         | `src/getSmartEdge/index.ts`         | Pure(ish) path computation; returns `{ svgPathString, edgeCenterX, edgeCenterY }` or `Error` |
| Geometry / grid  | `src/functions/`                    | Bounding boxes, grid creation, coordinate conversion, SVG drawing                            |
| Pathfinding      | `src/pathfinding/`                  | Grid type + A\* (based on [PathFinding.js](https://github.com/qiao/PathFinding.js))          |

### Edge presets (do not duplicate logic—compose via options)

| Export              | `drawEdge`                | `generatePath`               | Fallback (on failure) |
| ------------------- | ------------------------- | ---------------------------- | --------------------- |
| `SmartBezierEdge`   | `svgDrawSmoothLinePath`   | `pathfindingAStarDiagonal`   | `BezierEdge`          |
| `SmartStraightEdge` | `svgDrawStraightLinePath` | `pathfindingAStarNoDiagonal` | `StraightEdge`        |
| `SmartStepEdge`     | `svgDrawStraightLinePath` | `pathfindingAStarNoDiagonal` | `StepEdge`            |

Custom edges should call `getSmartEdge({ ...edgeProps, nodes, options })` and handle `instanceof Error` (see README).

### Tunable options (`GetSmartEdgeOptions`)

- `nodePadding` (default `10`, min `2`): clearance around nodes in px.
- `gridRatio` (default `10`, min `2`): px per grid cell; lower = more accurate, slower.
- `drawEdge` / `generatePath`: pluggable; types exported from `src/index.tsx`.

## Repository layout

```
src/
  index.tsx              # Public exports only
  getSmartEdge/           # Core algorithm entry
  SmartEdge/             # Shared React wrapper (BaseEdge + fallback)
  SmartBezierEdge/       # Preset components
  SmartStraightEdge/
  SmartStepEdge/
  functions/             # Grid, bounds, SVG path builders
  pathfinding/           # Grid + A*
  internal/              # Debug overlay/context (NOT in package exports)
  stories/               # Storybook only (excluded from dts build)
.storybook/              # Storybook + Vitest browser setup
dist/                    # Build output (gitignored in dev; published to npm)
```

## Commands

| Task                                           | Command                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| Install                                        | `npm ci`                                                        |
| Storybook dev                                  | `npm run storybook` (port 6006)                                 |
| Library build                                  | `npm run build-component`                                       |
| Full build (lib + static Storybook)            | `npm run build`                                                 |
| All checks (CI-equivalent lint/type/spell)     | `npm run check`                                                 |
| Auto-fix lint + format                         | `npm run fix`                                                   |
| Tests (Playwright + Vitest, Storybook stories) | `npm run test`                                                  |
| Install browser for tests                      | `npm run install-chromium`                                      |
| Release (maintainer)                           | `npm run release` (uses `release-it` + `.env` via `dotenv-cli`) |

**Before opening a PR**, run at minimum: `npm run check` and `npm run test`.

## Testing

- **No unit test files** in `src/**/*.test.*`; tests are **Storybook interaction tests** run in **headless Chromium** via Vitest (`vite.config.ts` → `storybook` project).
- Stories live in `src/stories/`; primary file: `SmartEdge.stories.tsx`.
- `GraphWrapper` wraps flows with optional `smartEdgeDebug` and `data-testid="graph-wrapper"`.
- CI (`.github/workflows/test-ui.yml`): Node 24.4.1 → `install-chromium` → `npm ci` → `npm run test-storybook`.

When adding behavior, prefer extending existing stories or adding a focused story over introducing a parallel test harness.

## Build & publish

- **Bundler**: Vite 7 library mode (`vite.config.ts`).
- **Externals** (not bundled): `react`, `react-dom`, `react/jsx-runtime`, `@xyflow/react`.
- **Types**: `vite-plugin-dts` with `entryRoot: src`, excludes `src/stories/**`.
- **Published files** (`package.json` `"files"`): `dist`, `src` (source shipped for debugging/types convenience).
- **Chromatic**: `.github/workflows/chromatic.yml` for visual regression on Storybook.

## Code conventions

- **TypeScript**: strict, `verbatimModuleSyntax`, `erasableSyntaxOnly` (`tsconfig.app.json`).
- **ESLint**: flat config; `strictTypeChecked` + `@eslint-react` + SonarJS + Prettier (`eslint.config.js`). Stories use `eslint-plugin-storybook`.
- **Format**: Prettier (`.prettierrc`).
- **Spellcheck**: cspell (`.cspell.json`); run via `npm run spellcheck`.
- **React**: functional components; smart edges use `useNodes()` inside preset components, not in `getSmartEdge`.
- **Imports**: use `import type` for types; respect `verbatimModuleSyntax`.
- **Errors**: `getSmartEdge` catches and returns `Error` instances; pathfinding helpers may `throw` internally. `SmartEdge` falls back to `options.fallback` (default `BezierEdge`) and logs in debug mode.

## Internal debug (contributors only)

- `src/internal/`: `SmartEdgeDebugProvider`, overlay, `useSmartEdgeDebug`.
- `getSmartEdge` accepts optional `options.debug` (wired from `SmartEdge` when debug context is enabled)—**not documented for npm consumers**; avoid expanding this API without maintainer intent.

## Common agent tasks

### Fix routing / path quality

1. Reproduce in Storybook (`npm run storybook`) with `smartEdgeDebug: true` if needed.
2. Trace: `getBoundingBoxes` → `createGrid` → `guaranteeWalkablePath` → A\* → `drawSvgPath`.
3. Tune `gridRatio` / `nodePadding` in stories before changing defaults.

### Add or change a public export

1. Implement in appropriate `src/` module.
2. Re-export from `src/index.tsx` (types + values).
3. Run `npm run build-component` and confirm `dist/index.d.ts`.
4. Update README if user-facing.

### Add a new smart edge variant

Prefer a thin wrapper like `SmartBezierEdge`: static `SmartEdgeOptions` + `useNodes` + `<SmartEdge options={...} />`, rather than forking `getSmartEdge`.

## Pitfalls

- **React Flow v12 only** (`@xyflow/react` ≥ 12). Do not use legacy `reactflow` import paths in docs or code.
- **README examples** may show older import names (`reactflow`); library code correctly uses `@xyflow/react`.
- Changing `getSmartEdge` return shape or option defaults is a **breaking change** for consumers—bump major version via release-it.
- `src/stories/` and `src/internal/` must stay out of the dts entry surface (already excluded in Vite dts config).
- Pathfinding runs on a **discrete grid**; very small `gridRatio` on large graphs can be slow.

## Key files (quick reference)

| File                                     | Why it matters                            |
| ---------------------------------------- | ----------------------------------------- |
| `src/getSmartEdge/index.ts`              | Central algorithm orchestration           |
| `src/SmartEdge/index.tsx`                | React integration + fallback behavior     |
| `src/functions/createGrid.ts`            | Grid dimensions and obstacle marking      |
| `src/functions/guaranteeWalkablePath.ts` | Start/end walkability fixes               |
| `src/pathfinding/aStar.ts`               | A\* implementation                        |
| `src/functions/drawSvgPath.ts`           | SVG path string generation                |
| `vite.config.ts`                         | Lib build + Vitest/Storybook test project |
| `package.json`                           | Scripts, peers, exports map               |

## What not to do unless asked

- Commit secrets (`.env` is for release tokens; see `.env.example`).
- Add unrelated dependencies or restructure the monolith pipeline without cause.
- Commit to `dist/` or `storybook-static/` (build artifacts).
- Force-push `main` or skip git hooks.
- Expand scope into a full app—this is a **library**, not an application repo.
