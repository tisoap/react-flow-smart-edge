# React Flow Smart Edge

Custom edges for [React Flow](https://reactflow.dev) that never intersect with other nodes, using pathfinding.

![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-3A33D1?logo=eslint&logoColor=white)

![Smart Edge](./.github/images/example-image.gif)

## Documentation

**Full documentation:** [tisoap.github.io/react-flow-smart-edge/docs](https://tisoap.github.io/react-flow-smart-edge/docs)

Interactive Storybook examples are published on [Chromatic](https://main--625ade28911b53003a921739.chromatic.com/?path=/story/smart-edge--smart-bezier).

## Install

```bash
npm install @tisoap/react-flow-smart-edge
```

Requires [**React Flow v12+**](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) (`@xyflow/react`).

## Quick example

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

| Export                | React Flow equivalent                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| `SmartBezierEdge`     | [BezierEdge](https://reactflow.dev/examples/edges/edge-types)                 |
| `SmartStraightEdge`   | [StraightEdge](https://reactflow.dev/examples/edges/edge-types)               |
| `SmartStepEdge`       | [StepEdge](https://reactflow.dev/examples/edges/edge-types)                   |
| `SmartSmoothStepEdge` | [SmoothStepEdge](https://reactflow.dev/examples/edges/edge-types)             |
| `SmartFloatingEdge`   | [Floating edges example](https://reactflow.dev/examples/edges/floating-edges) |
| `SmartEditableEdge`   | [Editable edge example](https://reactflow.dev/examples/edges/editable-edge)   |
| `SmartCheckpointEdge` | No equivalent                                                                 |

Configure options with `createSmartEdge("step", { gridRatio: 5 })` or build custom edges with `getSmartEdge`. See the [docs](https://tisoap.github.io/react-flow-smart-edge/docs) for guides, API reference, and live examples.

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
