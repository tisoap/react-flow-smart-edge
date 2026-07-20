# Bench results (Task 20)

Dev-machine numbers only — not a CI-controlled benchmark environment. Recorded
so Task 21's README section has real figures to cite. Re-run with `npm run
bench` to reproduce/refresh; expect run-to-run variance of roughly ±10-20% on
the smaller/noisier groups (legacy 750-node grid build in particular), much
less on the larger aggregate numbers (batch routing).

**Machine:** AMD Ryzen 9 5900X (12c/24t), Linux 6.6 (WSL2), Node v26.3.1,
Vitest 4.1.9 (`vitest bench`, `pool: forks` default).

**Command:** `npm run bench` (`vitest bench --config vitest.bench.config.ts`).

## Headline numbers

| Comparison                                       | Legacy (v4 object grid) | v5 (flat grid)  | Speedup            |
| ------------------------------------------------- | ----------------------: | --------------: | ------------------ |
| Grid build, 100-node fixture                     | 273.9 ops/s (3.65ms)     | 6,279 ops/s (0.16ms) | **22.9x**       |
| Grid build, 750-node fixture                     | 46.0 ops/s (21.76ms)     | 885.8 ops/s (1.13ms) | **19.3x**       |
| A\* orthogonal, 100-node fixture (8 edges/call)  | 46.6 ops/s (21.5ms)      | 443.8 ops/s (2.25ms) | **9.5x**        |
| A\* diagonal, 100-node fixture (8 edges/call)    | 44.5 ops/s (22.5ms)      | 262.3 ops/s (3.81ms) | **5.9x**        |
| Jump Point Search, 100-node fixture (8 edges/call) | 51.1 ops/s (19.6ms)    | 353.9 ops/s (2.83ms) | **6.9x**        |

| Comparison (v5 engine only)                                        | Corridor ladder | Full-grid, no corridor | Speedup     |
| -------------------------------------------------------------------- | --------------: | ----------------------: | ----------- |
| `getSmartEdge`-equivalent, 750-node fixture, 50 sampled edges/call  | 12.5 ops/s (79.7ms) | 7.6 ops/s (131.1ms) | **1.64x** |

## `routeSmartEdgeBatch` end-to-end (v5 engine, corridor ladder, `bezier` preset)

| Fixture                    | ops/s  | Mean batch time |
| --------------------------- | -----: | ---------------: |
| 10 nodes / 15 edges        | 364.3  | 2.75ms            |
| 100 nodes / 150 edges      | 18.4   | 54.35ms           |
| 750 nodes / 1,125 edges    | 0.372  | **2.69s**         |

## Notes on methodology

- All comparisons build the obstacle grid from the same `getBoundingBoxes`
  output (identical `nodePadding`/`gridRatio`, identical node boxes), so the
  legacy and v5 sides always search/rasterize the exact same obstacle layout
  from the exact same start/end grid cell (`bench/legacyPipeline.ts`).
- Legacy grids are `.clone()`d before each timed search (the legacy `Grid`
  mutates node state — `opened`/`closed`/`parent` — in place); the v5 flat
  grid needs no such reset since its scratch buffers use a generation stamp
  and the grid's `Uint8Array` obstacle mask is never written to during a
  search.
- One of the 8 sampled A*/JPS edges returns a different point count between
  the JPS engines (32 legacy vs. 36 flat jump points) even on identical
  grids/start/end — both are valid, equal-cost paths; orthogonal JPS can
  reach multiple optimal routes when the two engines' open lists break ties
  differently (legacy: linear min-scan over insertion order; flat: binary
  min-heap). Noted as a comment in `bench/engine.bench.ts` so it doesn't read
  as a routing bug.
- The corridor-vs-full-grid comparison isolates the corridor ladder's benefit
  on the v5 engine alone: both sides run the *same* post-routing
  work — A\* search, `alignEndpoints`, `drawEdge` (`svgDrawSmoothLinePath`,
  the `bezier` preset's default), and the edge-center `gridToGraphPoint`
  lookup — the only difference is routing on a sub-grid cropped to the
  endpoints (widening on retry) vs. always building the grid over all 750
  nodes. `routeFullGridNoCorridor` in `bench/engine.bench.ts` explicitly
  mirrors `getSmartEdge`'s full pipeline end-to-end rather than stopping at
  the raw grid path, so the comparison is a clean corridor-only toggle and
  doesn't also credit the corridor ladder for skipping `alignEndpoints`/
  `drawEdge`/point-conversion work that every route pays for either way.
- Fixture nodes come from `buildLargeNetwork` (`src/demos/dummyData/largeNetwork.ts`,
  Task 19) with `measured: { width: 100, height: 50 }` stamped on, since
  `buildLargeNetwork` relies on React Flow's runtime measurement pass, which
  doesn't run under the Node-environment bench project.
