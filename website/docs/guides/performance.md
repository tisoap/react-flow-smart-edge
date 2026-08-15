---
sidebar_position: 7
---

# Performance

`SmartEdgeProvider` batches every registered edge's routing together and, by default, runs that batch on a background Web Worker, so pathfinding never blocks the main thread. This is the pipeline built for [#69](https://github.com/tisoap/react-flow-smart-edge/issues/69): a 750-node graph that used to freeze the tab.

```tsx
<SmartEdgeProvider nodes={nodes} onMetrics={(metrics) => console.log(metrics)}>
  <ReactFlow nodes={nodes} edges={edges} edgeTypes={edgeTypes} />
</SmartEdgeProvider>
```

## Web Worker routing, fallback-first paint

Every smart edge falls back to its native (non-routed) path until a route arrives, so React Flow paints every node and edge immediately on mount, before the provider's first routing batch has even run. The batch itself executes on an inlined Web Worker, so a large graph's initial pathfinding pass never blocks input or scrolling. If `Worker` is unavailable, its construction throws, or it reports a runtime error, the provider falls back to synchronous main-thread routing instead; edges keep routing either way, just without the off-thread benefit.

## Route only when blocked

By default (`routeOnlyWhenBlocked: true`), an edge whose straight line between endpoints is already clear of every node and `avoidAreas` skips pathfinding entirely and renders the preset's native path (`getBezierPath`, `getSmoothStepPath`, etc.). Most graphs have far more clear edges than blocked ones, so this cuts the number of A\* searches a batch actually runs. Set it to `false` to always pathfind, matching v4's behavior.

## Corridor-cropped, typed-array engine

The pathfinding grid is a flat `Uint8Array` (`FlatGrid`), not the object-per-cell grid v4 used; building and cloning it is one allocation instead of thousands of objects. Each edge also routes on a small sub-grid cropped around its own endpoints first ("the corridor"), widening the crop only if that attempt fails to find a path, and falling back to the full graph as a last resort. Routing cost then scales with the obstacles local to one edge, not the whole canvas.

## Incremental invalidation and an LRU route cache

Between batches, the scheduler diffs the previous node snapshot against the current one and only re-routes edges whose corridor was actually affected by what changed (a node entering, leaving, resizing within, or being dragged through it). Every other edge's cached route, keyed by a hash of its own corridor's obstacles, is served straight from an LRU cache (`cacheSize`, default `500`) instead of re-running A\*. Moving one node in a 750-node graph re-routes a handful of edges, not all of them.

## Dashed fallback while dragging, routed on drop

While an edge's source or target node is being dragged, and `routeWhileDragging` is `false` (the default), the edge renders its native path styled with `dragFallbackStyle` (a dashed stroke, `{ strokeDasharray: "5 5" }`, by default) instead of re-routing on every drag frame. It routes for real once the drag ends. Set `routeWhileDragging: true` to re-route live during the drag instead, or `dragFallbackStyle: {}` to drop the dashed styling. Waypoint (control-point) drags do not use `dragFallbackStyle`; they update the registered waypoints and re-route after `debounceMs`.

## Runtime metrics

Pass `onMetrics` to `SmartEdgeProvider` to observe every completed batch: `batchLatencyMs` and `mainThreadBlockingMs`, how many edges were `routed`, served from `cacheHits`, marked `clear`, `deferred` (dragging), or `unchanged`, and whether the batch ran on the `"worker"` or the `"main"` thread. See [`SmartEdgeMetrics`](../api/smart-edge-provider#smartedgemetrics) for the full field list.

## Benchmarks

`npm run bench` (`vitest bench`) measured the v5 pipeline against the old (pre-v5) object-based grid implementation on the same fixtures before that legacy engine was deleted from the repo; the table below is now a historical record (the legacy engine no longer exists to re-run against), while the v5-only benchmarks further down remain reproducible. Numbers are from a single dev machine (AMD Ryzen 9 5900X, WSL2), not a CI-controlled environment; expect run-to-run variance, especially on the smaller/noisier groups. Full methodology and raw numbers: [`bench/RESULTS.md`](https://github.com/tisoap/react-flow-smart-edge/blob/main/bench/RESULTS.md).

| Comparison                                         | Legacy (v4 object grid) | v5 (flat grid) | Speedup   |
| -------------------------------------------------- | ----------------------: | -------------: | --------- |
| Grid build, 100-node fixture                       |             273.3 ops/s |  6,617.3 ops/s | **24.2x** |
| Grid build, 750-node fixture                       |              44.9 ops/s |    889.7 ops/s | **19.8x** |
| A\* orthogonal, 100-node fixture (8 edges/call)    |              47.2 ops/s |    463.2 ops/s | **9.8x**  |
| A\* diagonal, 100-node fixture (8 edges/call)      |              46.6 ops/s |    253.3 ops/s | **5.4x**  |
| Jump Point Search, 100-node fixture (8 edges/call) |              52.8 ops/s |    357.6 ops/s | **6.8x**  |

The corridor ladder alone (v5 engine, corridor-cropped vs. always building the full 750-node grid, same post-routing work on both sides) is **1.7x** faster — this comparison stays reproducible since both sides are v5 engine code.

`routeSmartEdgeBatch` end-to-end (v5 engine, corridor-cropped, `bezier` preset), measured with `vitest bench` (also reproducible):

| Fixture                 | ops/s | Mean batch time |
| ----------------------- | ----: | --------------: |
| 10 nodes / 15 edges     | 375.8 |          2.66ms |
| 100 nodes / 150 edges   |  17.9 |         55.95ms |
| 750 nodes / 1,125 edges | 0.360 |           2.78s |

Separately, a Storybook interaction test drives the real browser pipeline (React Flow render, measurement, `fitView`, then the provider's real worker) against the same #69-style 750-node / ~1,125-edge fixture: every node paints in the DOM before the first routing batch is even scheduled, and that first batch reports `batchLatencyMs` around 2.2s (roughly 336 routed, 789 clear, 0 deferred). See `SmartEdgePerformance.stories.tsx`'s `LargeNetwork750` story.

## Related

- [`SmartEdgeProvider` reference](../api/smart-edge-provider) for every option and the metrics shape
- [Migration guide](../migration/v5) for the flags that restore v4's always-route, always-live behavior
