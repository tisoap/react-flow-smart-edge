<div align="center">

# React Flow Smart Edge

Smart edges for [React Flow](https://reactflow.dev) that route _around_ your nodes instead of straight through them.

Drop-in custom edges that use grid-based A\* pathfinding to find a clean path between nodes, plus floating endpoints, draggable waypoints, and circuit-style hops over crossing wires.

[![npm version](https://img.shields.io/npm/v/@tisoap/react-flow-smart-edge?logo=npm&color=cb3837)](https://www.npmjs.com/package/@tisoap/react-flow-smart-edge)
[![npm downloads](https://img.shields.io/npm/dm/@tisoap/react-flow-smart-edge?color=cb3837)](https://www.npmjs.com/package/@tisoap/react-flow-smart-edge)
[![CI](https://github.com/tisoap/react-flow-smart-edge/actions/workflows/ci.yml/badge.svg)](https://github.com/tisoap/react-flow-smart-edge/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=white)](https://main--625ade28911b53003a921739.chromatic.com/?path=/story/smart-edge--smart-bezier)
[![Chromatic](https://github.com/tisoap/react-flow-smart-edge/actions/workflows/chromatic.yml/badge.svg)](https://www.chromatic.com/library?appId=625ade28911b53003a921739)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white)

![Smart Edge](./.github/images/example-image.gif)

</div>

## Why?

React Flow's built-in edges draw a direct line from source to target, which often means edges cut straight across your nodes. React Flow Smart Edge computes a path that goes _around_ them, so your graphs stay readable even as they grow and as nodes move.

It's a tiny, dependency-light library (just `@xyflow/react` as a peer) that ships ready-to-use edge components and a low-level API for building your own.

## Features

- Grid-based A\* / jump-point pathfinding finds a path that never crosses your nodes.
- Five edge styles: smart equivalents of every React Flow edge (bezier, straight, step, smooth-step, and simple-bezier).
- Every smart edge routes through one shared `SmartEdgeProvider`, off the main thread on a Web Worker by default, so large graphs stay responsive. _(new!)_
- Edges whose direct line is already clear skip pathfinding entirely (`routeOnlyWhenBlocked`, on by default). _(new!)_
- Moving a node only re-routes the edges whose corridor it actually entered or left; everything else is served from an LRU route cache. _(new!)_
- Step edges can draw a small bridge arc where they cross each other, so intersections read cleanly.
- Floating edges connect to the nearest node border instead of a fixed handle.
- Editable waypoints let you drag control points to reshape a route; each segment still avoids nodes.
- Checkpoints route through fixed points without the editing UI.
- Avoid areas keep edges clear of arbitrary regions (e.g. labels), not just nodes.
- Subflow aware routing works correctly inside React Flow groups/subflows.
- If no path is found, or while a route is deferred, the edge drops back to the native React Flow edge.
- Swap the pathfinding or SVG drawing functions, or build custom edges with `useSmartEdgePath` or `getSmartEdge`.
- Written in strict TypeScript, with browser-based interaction tests.

## Install

```bash
npm install @tisoap/react-flow-smart-edge
```

Requires [React Flow v12+](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) (`@xyflow/react`).

## Quick start

Smart edges route through a `SmartEdgeProvider`, which owns the routing worker and needs your current `nodes` to know what to route around. That means `nodes` must be controlled (`useNodesState`, or your own state), not just handed to React Flow as `defaultNodes`:

```tsx
import { ReactFlow, useNodesState } from "@xyflow/react";
import {
  SmartEdgeProvider,
  SmartBezierEdge,
} from "@tisoap/react-flow-smart-edge";
import "@xyflow/react/dist/style.css";

const initialNodes = [
  { id: "1", data: { label: "Node 1" }, position: { x: 300, y: 100 } },
  { id: "2", data: { label: "Node 2" }, position: { x: 300, y: 200 } },
];

const edges = [{ id: "e21", source: "2", target: "1", type: "smart" }];

const edgeTypes = { smart: SmartBezierEdge };

export function Graph() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);

  return (
    <SmartEdgeProvider nodes={nodes}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        defaultEdges={edges}
        edgeTypes={edgeTypes}
        fitView
      />
    </SmartEdgeProvider>
  );
}
```

Without a `SmartEdgeProvider` ancestor, smart edges warn once in development and render their native (non-routed) fallback edge, so a graph without one still renders, just without routing.

## Edge components

| Export                  | React Flow equivalent                                                                |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `SmartBezierEdge`       | [BezierEdge](https://reactflow.dev/examples/edges/edge-types)                        |
| `SmartStraightEdge`     | [StraightEdge](https://reactflow.dev/examples/edges/edge-types)                      |
| `SmartStepEdge`         | [StepEdge](https://reactflow.dev/examples/edges/edge-types)                          |
| `SmartSmoothStepEdge`   | [SmoothStepEdge](https://reactflow.dev/examples/edges/edge-types)                    |
| `SmartSimpleBezierEdge` | [SimpleBezierEdge](https://reactflow.dev/api-reference/utils/get-simple-bezier-path) |
| `SmartFloatingEdge`     | [Floating edges example](https://reactflow.dev/examples/edges/floating-edges)        |
| `SmartEditableEdge`     | [Editable edge example](https://reactflow.dev/examples/edges/editable-edge)          |
| `SmartCheckpointEdge`   | No equivalent                                                                        |

Configure any preset with `createSmartEdge`, or see [Custom edges](#custom-edges) below to build your own:

```tsx
import { createSmartEdge } from "@tisoap/react-flow-smart-edge";

const edgeTypes = {
  // finer routing grid:
  fineStep: createSmartEdge("step", { gridRatio: 5 }),
};
```

## Circuit-style hops

Give the step variants the `hops` option and crossing wires bridge over each
other like a schematic. The edge on top draws a small arc over the one beneath.
Hops still draw when `routeOnlyWhenBlocked` leaves an edge on its native step
path, not only after A\* has detoured around a node:

```tsx
import { createSmartEdge } from "@tisoap/react-flow-smart-edge";

const edgeTypes = {
  hop: createSmartEdge("step", { hops: true }),
  // or smooth-step with rounded corners + bridges:
  smoothHop: createSmartEdge("smoothstep", { hops: { borderRadius: 8 } }),
};
```

See the [`hops` docs](https://tisoap.github.io/react-flow-smart-edge/docs/options/hops) for tuning and a live demo.

## Custom edges

Build a fully custom edge with `useSmartEdgePath`. It registers your edge's geometry with the nearest `SmartEdgeProvider` and returns its routed path, or `null`/`"clear"` while there is nothing to draw yet:

```tsx
import { BaseEdge, BezierEdge } from "@xyflow/react";
import { useSmartEdgePath } from "@tisoap/react-flow-smart-edge";
import type { EdgeProps } from "@xyflow/react";

function MySmartEdge(props: EdgeProps) {
  const { route } = useSmartEdgePath({ ...props, preset: "bezier" });

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

const edgeTypes = { custom: MySmartEdge };
```

For synchronous, main-thread routing outside a provider (SSR, tests, your own batching), call `getSmartEdge` directly. See the [custom edges guide](https://tisoap.github.io/react-flow-smart-edge/docs/guides/custom-edges).

## Performance

Every smart edge registers with the nearest `SmartEdgeProvider`, which batches every registered edge's routing together and, by default, runs that batch on a background Web Worker so pathfinding never blocks the main thread:

- Web Worker routing runs by default. Nodes and edges paint immediately on mount, before the first routing batch has even run (smart edges fall back to their native path until routed), so a large graph never freezes the tab while it computes routes.
- Edges route only when blocked (`routeOnlyWhenBlocked: true` by default). An edge whose straight line between endpoints is already clear skips pathfinding and renders the preset's native path, so a typical graph only pays for A\* on the edges that actually need it.
- Each edge routes on a corridor-cropped, typed-array grid: a small `Uint8Array` grid cropped around its own endpoints first, widening the crop only if that fails, instead of always rebuilding a grid over the whole graph.
- Node moves invalidate incrementally, into an LRU route cache. Moving one node only re-routes the edges whose corridor it actually entered or left; every other edge's cached route (keyed by its own obstacle set) is reused untouched.
- A dragged edge keeps its native path until drop, then routes. Set `routeWhileDragging: true` to re-route during the drag.
- `onMetrics` reports runtime metrics for every completed batch: `batchLatencyMs` and `mainThreadBlockingMs`, `routed`/`clear`/`cacheHits`/`deferred`/`unchanged` counts, and whether it ran on the worker or the main thread.
- A benchmark suite (`npm run bench`) measured the pipeline against the old (pre-v5) object-based grid before that legacy engine was deleted from the repo. See [`bench/RESULTS.md`](./bench/RESULTS.md) for the historical numbers: grid construction was roughly 20-24x faster, A\* pathfinding 5.4x (diagonal) to 9.8x (orthogonal) faster, and jump-point search 6.8x faster; the corridor-cropped grid cut routing on a 750-node graph to about 1.7x over always building the full grid. On the [#69](https://github.com/tisoap/react-flow-smart-edge/issues/69) 750-node / 1,125-edge scenario that used to freeze the tab, every node still paints instantly, and the first routing batch completes off the main thread in about 2.2s.

```tsx
<SmartEdgeProvider nodes={nodes} onMetrics={(metrics) => console.log(metrics)}>
  <ReactFlow nodes={nodes} edges={edges} edgeTypes={edgeTypes} />
</SmartEdgeProvider>
```

See the [performance guide](https://tisoap.github.io/react-flow-smart-edge/docs/guides/performance) and the [`SmartEdgeProvider` reference](https://tisoap.github.io/react-flow-smart-edge/docs/api/smart-edge-provider) for every option.

## Migrating from v4

v5 makes `SmartEdgeProvider` required: every smart edge needs one as an ancestor to route (it warns once and falls back to its native edge without one). Nodes are passed straight to the provider, so apps using uncontrolled `defaultNodes` need to lift that state, as shown in [Quick start](#quick-start). `routeOnlyWhenBlocked` also now defaults to `true`, so an edge with a clear direct line renders its native path unless you opt back into always routing.

See the [migration guide](https://tisoap.github.io/react-flow-smart-edge/docs/migration/v5) for the full before/after, the options that restore v4 behavior, and the mapping from the removed 4.13 batch-routing API to `SmartEdgeProvider` / `useSmartEdgePath`.

## Documentation

Full documentation: [tisoap.github.io/react-flow-smart-edge/docs](https://tisoap.github.io/react-flow-smart-edge/docs)

Guides, the full API reference, and live interactive demos for every feature.

Interactive Storybook examples are also published on [Chromatic](https://main--625ade28911b53003a921739.chromatic.com/?path=/story/smart-edge--smart-bezier).

## Support

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J472RAJ)

[![GitHub Sponsors](https://img.shields.io/static/v1?label=Sponsor%20Me&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/tisoap)

## Development

```bash
npm ci
npm run storybook    # demos + tests (port 6006)
npm run docs         # Docusaurus dev server → http://localhost:3000/docs
npm run verify       # lint, types, spellcheck, coverage tests, full build
npm run check        # lint, types, spellcheck
npm run test         # Storybook interaction tests
npm run build-docs   # static docs site → website/build
```

## License

[MIT](./LICENSE)
