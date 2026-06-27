<div align="center">

# React Flow Smart Edge

Smart edges for [React Flow](https://reactflow.dev) that route _around_ your nodes instead of straight through them.

Drop-in custom edges that use grid-based A\* pathfinding to find a clean path between nodes, plus floating endpoints, draggable waypoints, and circuit-style hops over crossing wires.

[![npm version](https://img.shields.io/npm/v/@tisoap/react-flow-smart-edge?logo=npm&color=cb3837)](https://www.npmjs.com/package/@tisoap/react-flow-smart-edge)
[![npm downloads](https://img.shields.io/npm/dm/@tisoap/react-flow-smart-edge?color=cb3837)](https://www.npmjs.com/package/@tisoap/react-flow-smart-edge)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tisoap/react-flow-smart-edge?color=success)](https://bundlephobia.com/package/@tisoap/react-flow-smart-edge)
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
- Step edges can draw a small bridge arc where they cross each other, so intersections read cleanly. _(new!)_
- Floating edges connect to the nearest node border instead of a fixed handle.
- Editable waypoints let you drag control points to reshape a route; each segment still avoids nodes.
- Checkpoints route through fixed points without the editing UI.
- Avoid areas keep edges clear of arbitrary regions (e.g. labels), not just nodes.
- Subflow aware routing works correctly inside React Flow groups/subflows.
- If no path is found, the edge drops back to the native React Flow edge.
- Swap the pathfinding or SVG drawing functions, or build custom edges with `getSmartEdge`.
- Written in strict TypeScript, with browser-based interaction tests.

## Install

```bash
npm install @tisoap/react-flow-smart-edge
```

Requires [React Flow v12+](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) (`@xyflow/react`).

## Quick start

```tsx
import { ReactFlow } from "@xyflow/react";
import { SmartBezierEdge } from "@tisoap/react-flow-smart-edge";
import "@xyflow/react/dist/style.css";

const nodes = [
  { id: "1", data: { label: "Node 1" }, position: { x: 300, y: 100 } },
  { id: "2", data: { label: "Node 2" }, position: { x: 300, y: 200 } },
];

const edges = [{ id: "e21", source: "2", target: "1", type: "smart" }];

const edgeTypes = { smart: SmartBezierEdge };

export function Graph() {
  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      edgeTypes={edgeTypes}
      fitView
    />
  );
}
```

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

Configure any preset with `createSmartEdge`, or build custom edges with `getSmartEdge`:

```tsx
import { createSmartEdge } from "@tisoap/react-flow-smart-edge";

const edgeTypes = {
  // finer routing grid:
  fineStep: createSmartEdge("step", { gridRatio: 5 }),
};
```

## Circuit-style hops

Give the step variants the `hops` option and crossing wires bridge over each
other like a schematic. The edge on top draws a small arc over the one beneath:

```tsx
import { createSmartEdge } from "@tisoap/react-flow-smart-edge";

const edgeTypes = {
  hop: createSmartEdge("step", { hops: true }),
  // or smooth-step with rounded corners + bridges:
  smoothHop: createSmartEdge("smoothstep", { hops: { borderRadius: 8 } }),
};
```

See the [`hops` docs](https://tisoap.github.io/react-flow-smart-edge/docs/options/hops) for tuning and a live demo.

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
npm run check        # lint, types, spellcheck
npm run test         # Storybook interaction tests
npm run build-docs   # static docs site → website/build
```

## License

[MIT](./LICENSE)
