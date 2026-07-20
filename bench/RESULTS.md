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
| Grid build, 100-node fixture                     | 281.7 ops/s (3.55ms)     | 7,222 ops/s (0.14ms) | **25.6x**       |
| Grid build, 750-node fixture                     | 40.7 ops/s (24.56ms)     | 1,099 ops/s (0.91ms) | **27.0x** (177x vs. the 100-node flat baseline) |
| A\* orthogonal, 100-node fixture (8 edges/call)  | 46.5 ops/s (21.5ms)      | 450.9 ops/s (2.22ms) | **9.7x**        |
| A\* diagonal, 100-node fixture (8 edges/call)    | 46.9 ops/s (21.3ms)      | 250.9 ops/s (3.99ms) | **5.35x**       |
| Jump Point Search, 100-node fixture (8 edges/call) | 52.9 ops/s (18.9ms)    | 352.9 ops/s (2.83ms) | **6.67x**       |

| Comparison (v5 engine only)                                        | Corridor ladder | Full-grid, no corridor | Speedup     |
| -------------------------------------------------------------------- | --------------: | ----------------------: | ----------- |
| `getSmartEdge`, 750-node fixture, 50 sampled edges/call             | 12.9 ops/s (77.3ms) | 8.2 ops/s (122.0ms) | **1.58x** |

## `routeSmartEdgeBatch` end-to-end (v5 engine, corridor ladder, `bezier` preset)

| Fixture                    | ops/s  | Mean batch time |
| --------------------------- | -----: | ---------------: |
| 10 nodes / 15 edges        | 381.2  | 2.62ms            |
| 100 nodes / 150 edges      | 17.6   | 56.97ms           |
| 750 nodes / 1,125 edges    | 0.364  | **2.75s**         |

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
- The corridor-vs-full-grid comparison isolates the corridor ladder's benefit
  on the v5 engine alone — both sides use the same flat-grid A\*, the only
  difference is routing on a sub-grid cropped to the endpoints (widening on
  retry) vs. always building the grid over all 750 nodes.
- Fixture nodes come from `buildLargeNetwork` (`src/demos/dummyData/largeNetwork.ts`,
  Task 19) with `measured: { width: 100, height: 50 }` stamped on, since
  `buildLargeNetwork` relies on React Flow's runtime measurement pass, which
  doesn't run under the Node-environment bench project.
