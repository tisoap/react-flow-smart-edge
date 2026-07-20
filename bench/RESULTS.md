# Bench results (Task 20, refreshed at Task 22)

Dev-machine numbers only — not a CI-controlled benchmark environment. First
recorded at Task 20 so Task 21's README section had real figures to cite;
refreshed one final time at Task 22 immediately before the legacy v4 A/B
lanes were deleted (`bench/legacy/`, the legacy `bench()` groups in
`bench/engine.bench.ts`) — **the legacy-vs-v5 comparisons below are now a
historical record and can no longer be reproduced**, since the v4
object-grid engine they benchmarked against no longer exists in this repo.
The v5-only groups (grid build, corridor-vs-full-grid, `routeSmartEdgeBatch`)
remain in `bench/engine.bench.ts` / `bench/batch.bench.ts` and stay
reproducible with `npm run bench`. Expect run-to-run variance of roughly
±10-20% on the smaller/noisier groups, much less on the larger aggregate
numbers (batch routing).

**Machine:** AMD Ryzen 9 5900X (12c/24t), Linux 6.6 (WSL2), Node v26.3.1,
Vitest 4.1.9 (`vitest bench`, `pool: forks` default).

**Command:** `npm run bench` (`vitest bench --config vitest.bench.config.ts`).

## Headline numbers (historical: v4 legacy engine removed after this measurement)

| Comparison                                       | Legacy (v4 object grid) | v5 (flat grid)  | Speedup            |
| ------------------------------------------------- | ----------------------: | --------------: | ------------------ |
| Grid build, 100-node fixture                     | 273.3 ops/s (3.66ms)     | 6,617.3 ops/s (0.15ms) | **24.2x**       |
| Grid build, 750-node fixture                     | 44.9 ops/s (22.28ms)     | 889.7 ops/s (1.12ms) | **19.8x**       |
| A\* orthogonal, 100-node fixture (8 edges/call)  | 47.2 ops/s (21.19ms)      | 463.2 ops/s (2.16ms) | **9.8x**        |
| A\* diagonal, 100-node fixture (8 edges/call)    | 46.6 ops/s (21.47ms)      | 253.3 ops/s (3.95ms) | **5.4x**        |
| Jump Point Search, 100-node fixture (8 edges/call) | 52.8 ops/s (18.95ms)    | 357.6 ops/s (2.80ms) | **6.8x**        |

| Comparison (v5 engine only)                                        | Corridor ladder | Full-grid, no corridor | Speedup     |
| -------------------------------------------------------------------- | --------------: | ----------------------: | ----------- |
| `getSmartEdge`-equivalent, 750-node fixture, 50 sampled edges/call  | 13.0 ops/s (76.91ms) | 7.5 ops/s (132.58ms) | **1.7x** |

## `routeSmartEdgeBatch` end-to-end (v5 engine, corridor ladder, `bezier` preset)

| Fixture                    | ops/s  | Mean batch time |
| --------------------------- | -----: | ---------------: |
| 10 nodes / 15 edges        | 375.8  | 2.66ms            |
| 100 nodes / 150 edges      | 17.9   | 55.95ms           |
| 750 nodes / 1,125 edges    | 0.360  | **2.78s**         |

## Notes on methodology

- (Historical, legacy-comparison groups only) All comparisons built the
  obstacle grid from the same `getBoundingBoxes` output (identical
  `nodePadding`/`gridRatio`, identical node boxes), so the legacy and v5
  sides always searched/rasterized the exact same obstacle layout from the
  exact same start/end grid cell. The legacy-grid-building glue this relied
  on was removed from `bench/legacyPipeline.ts` after this measurement; only
  the v5 flat-grid setup remains.
- (Historical) Legacy grids were `.clone()`d before each timed search (the
  legacy `Grid` mutated node state — `opened`/`closed`/`parent` — in place);
  the v5 flat grid needs no such reset since its scratch buffers use a
  generation stamp and the grid's `Uint8Array` obstacle mask is never
  written to during a search.
- (Historical) One of the 8 sampled A*/JPS edges returned a different point
  count between the JPS engines (32 legacy vs. 36 flat jump points) even on
  identical grids/start/end — both were valid, equal-cost paths; orthogonal
  JPS can reach multiple optimal routes when the two engines' open lists
  break ties differently (legacy: linear min-scan over insertion order;
  flat: binary min-heap). This was noted inline in `bench/engine.bench.ts`
  next to the (now-removed) legacy JPS group so it didn't read as a routing
  bug.
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
