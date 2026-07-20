---
sidebar_position: 6
---

# SmartEdgeProvider

Owns the shared routing worker, the per-edge results store, and the debounced routing scheduler for every smart edge beneath it. Every preset edge component, `SmartEdge`, and `useSmartEdgePath` need a `SmartEdgeProvider` ancestor to route; without one they warn once (in development) and render their native fallback edge. See the [performance guide](../guides/performance) for how the routing pipeline behaves, and the [migration guide](../migration/v5) if you are upgrading from v4.

```tsx
<SmartEdgeProvider nodes={nodes} onMetrics={(metrics) => console.log(metrics)}>
  <ReactFlow nodes={nodes} edges={edges} edgeTypes={edgeTypes} />
</SmartEdgeProvider>
```

## Props

| Prop         | Type                                  | Description                                                                                                                                                                                                 |
| ------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodes`      | `Node[]`                              | Required. All flow nodes, controlled. Used as routing obstacles and as the source of drag/selection state, so it must be the live array (see [controlled nodes](../migration/v5#nodes-must-be-controlled)). |
| `options?`   | `SmartEdgeProviderOptions`            | Partial overrides for the fields below; every field is optional and defaults as documented.                                                                                                                 |
| `onMetrics?` | `(metrics: SmartEdgeMetrics) => void` | Called once per completed routing batch with aggregate counters.                                                                                                                                            |
| `children`   | `ReactNode`                           | Your flow.                                                                                                                                                                                                  |

`SmartEdgeProvider` does not need to be inside `<ReactFlow>` or a `ReactFlowProvider`. It falls back to synchronous main-thread routing whenever `Worker` is unavailable, its construction throws, or it reports a runtime error; edges keep routing either way.

## Options (`SmartEdgeProviderOptions`)

Every field is optional; `resolveProviderOptions` fills in the default shown below.

| Option                 | Default                      | Description                                                                                                                                                                                      |
| ---------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preset`               | `"bezier"`                   | Which built-in `drawEdge`/`generatePath` pair edges resolve to when they don't set their own preset (only relevant for `useSmartEdgePath`; preset edge components always pass their own preset). |
| `gridRatio`            | `10`                         | Pixels per grid cell. Same meaning as `GetSmartEdgeOptions.gridRatio`.                                                                                                                           |
| `nodePadding`          | `10`                         | Clearance around nodes, in pixels. Same meaning as `GetSmartEdgeOptions.nodePadding`.                                                                                                            |
| `avoidAreas`           | `[]`                         | Extra rectangular areas every edge routes around, in addition to nodes.                                                                                                                          |
| `borderRadius`         | `undefined`                  | Corner radius for the `smoothstep` preset.                                                                                                                                                       |
| `routeOnlyWhenBlocked` | `true`                       | Skip pathfinding and render the preset's native path when the direct line between an edge's endpoints is already clear.                                                                          |
| `routeWhileDragging`   | `false`                      | Re-route on every drag frame. When `false`, a dragging edge renders `dragFallbackStyle` instead and routes for real once the drag ends.                                                          |
| `dragFallbackStyle`    | `{ strokeDasharray: "5 5" }` | Style merged onto a dragging edge's native path while its route is deferred.                                                                                                                     |
| `debounceMs`           | `16`                         | How long the scheduler waits after the last registration/node change before flushing a routing batch.                                                                                            |
| `cacheSize`            | `500`                        | Max entries in the LRU route cache (keyed by each edge's corridor obstacle hash).                                                                                                                |

## `useSmartEdgePath`

Registers one edge's routing geometry with the nearest `SmartEdgeProvider` and subscribes to that edge's routed path and drag state. This is what `SmartEdge` (and every preset built on it) calls internally; use it directly to build a fully custom edge.

```tsx
import { BaseEdge, BezierEdge } from "@xyflow/react";
import { useSmartEdgePath } from "@tisoap/react-flow-smart-edge";
import type { EdgeProps } from "@xyflow/react";

function MySmartEdge(props: EdgeProps) {
  const { route, isDragging } = useSmartEdgePath({
    ...props,
    preset: "bezier",
  });

  if (!route || route.kind === "clear") {
    return <BezierEdge {...props} />;
  }

  return (
    <BaseEdge
      id={props.id}
      path={route.svgPathString}
      markerEnd={props.markerEnd}
    />
  );
}
```

### Input (`UseSmartEdgePathInput`)

`id`, `source`, `target`, `sourceX`, `sourceY`, `targetX`, `targetY`, `sourcePosition`, `targetPosition` (all present on React Flow's `EdgeProps`), plus:

- `preset?` (defaults to the provider's `options.preset`).
- `options?` (per-edge overrides: `gridRatio`, `nodePadding`, `avoidAreas`, `borderRadius`).
- `waypoints?` (intermediate graph-coordinate points the edge must pass through, in order).

### Result (`UseSmartEdgePathResult`)

| Field         | Type                           | Description                                                                                                                                                                                                  |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `route`       | `SmartEdgeRouteResult \| null` | `null` while the route is pending, or while there is no provider. Otherwise `{ kind: "clear", wasRouted: false }` or `{ kind: "routed", wasRouted: true, svgPathString, edgeCenterX, edgeCenterY, points }`. |
| `isDragging`  | `boolean`                      | `true` when this edge's source or target node is being dragged.                                                                                                                                              |
| `hasProvider` | `boolean`                      | `false` outside a `SmartEdgeProvider`; every other field is then inert (`route` is `null`, `isDragging` is `false`).                                                                                         |

## `SmartEdgeMetrics`

Reported once per completed batch via `onMetrics`:

| Field            | Type                 | Description                                                                                   |
| ---------------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `batchId`        | `number`             | Monotonically increasing batch counter.                                                       |
| `executedOn`     | `"worker" \| "main"` | Whether this batch ran on the Web Worker or the main-thread fallback.                         |
| `batchLatencyMs` | `number`             | Wall-clock time the batch took to route.                                                      |
| `routed`         | `number`             | Edges that ran pathfinding and produced a path.                                               |
| `cacheHits`      | `number`             | Edges served from the LRU route cache instead of re-routing.                                  |
| `clear`          | `number`             | Edges whose direct line was clear, so they render their native path (`routeOnlyWhenBlocked`). |
| `deferred`       | `number`             | Edges skipped this batch because an endpoint is dragging and `routeWhileDragging` is off.     |
| `unchanged`      | `number`             | Edges whose obstacles didn't change enough to need a new route.                               |

## `routeSmartEdgeBatch`

The pure function the worker runs, also used as the main-thread fallback. Safe to call directly, for example during server-side rendering or your own batching:

```ts
import { routeSmartEdgeBatch } from "@tisoap/react-flow-smart-edge";

const results = routeSmartEdgeBatch(nodes, edges);
// results: Record<edgeId, SmartEdgeRouteResult>
```

`edges` are `SmartEdgeBatchItem` entries: endpoints plus `preset` and serializable `options` (`gridRatio`, `nodePadding`, `avoidAreas`, `borderRadius`). Function options (`drawEdge`/`generatePath`) cannot cross the worker boundary, so custom pathfinding/drawing needs the main-thread [`getSmartEdge`](./get-smart-edge) API instead.

## `isDirectPathBlocked`

Standalone utility behind `routeOnlyWhenBlocked`: does a straight line between two points cross any padded node (or `avoidAreas`)? Useful for building your own "route only when needed" logic outside the provider.

```ts
import { isDirectPathBlocked } from "@tisoap/react-flow-smart-edge";

const blocked = isDirectPathBlocked(source, target, nodes, {
  nodePadding: 10,
  excludeNodeIds: [sourceNodeId, targetNodeId],
});
```

## Related

- [Performance guide](../guides/performance) for the routing pipeline this provider runs
- [Migration guide](../migration/v5) for upgrading from the 4.13 batch-routing API
- [`getSmartEdge`](./get-smart-edge) for single, synchronous, main-thread routing
- [Exported types](../types/exported-types)
