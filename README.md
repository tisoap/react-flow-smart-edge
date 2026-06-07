# React Flow Smart Edge

Custom Edges for React Flow that never intersect with other nodes, using pathfinding.

![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=white)
![Storybook](https://img.shields.io/badge/Storybook-FF4785?logo=storybook&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-3A33D1?logo=eslint&logoColor=white)

![Smart Edge](./.github/images/example-image.gif)

## Install

With `npm`:

```bash
npm install @tisoap/react-flow-smart-edge
```

With `yarn`:

```bash
yarn add @tisoap/react-flow-smart-edge
```

This package is only compatible with [**version 12** of React Flow Edge](https://reactflow.dev/learn/troubleshooting/migrate-to-v12).

## Support

Like this project and want to show your support? Buy me a coffee:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J472RAJ)

_Really_ like this project? Sponsor me on GitHub:

[![GitHub Sponsors](https://img.shields.io/static/v1?label=Sponsor%20Me&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/tisoap)

## Usage

This package ships with the following Smart Edges components:

- `SmartBezierEdge`: A smart equivalent to React Flow's [BezierEdge](https://reactflow.dev/docs/api/edges/edge-types/)
- `SmartStraightEdge`: A smart equivalent to React Flow's [StraightEdge](https://reactflow.dev/docs/api/edges/edge-types/)
- `SmartStepEdge`: A smart equivalent to React Flow's [StepEdge](https://reactflow.dev/docs/api/edges/edge-types/)
- `SmartSmoothStepEdge`: A smart equivalent to React Flow's [SmoothStepEdge](https://reactflow.dev/docs/api/edges/edge-types/)

Each one can be imported individually as a named export.

### Example

```jsx
import React from "react";
import { ReactFlow } from "reactflow";
import { SmartBezierEdge } from "@tisoap/react-flow-smart-edge";
import "@xyflow/react/dist/style.css";

const nodes = [
  {
    id: "1",
    data: { label: "Node 1" },
    position: { x: 300, y: 100 },
  },
  {
    id: "2",
    data: { label: "Node 2" },
    position: { x: 300, y: 200 },
  },
];

const edges = [
  {
    id: "e21",
    source: "2",
    target: "1",
    type: "smart",
  },
];

// You can give any name to your edge types
// https://reactflow.dev/docs/api/edges/custom-edges/
const edgeTypes = {
  smart: SmartBezierEdge,
};

export const Graph = (props) => {
  const { children, ...rest } = props;

  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      edgeTypes={edgeTypes}
      {...rest}
    >
      {children}
    </ReactFlow>
  );
};
```

## Edge Options

All smart edges will take the exact same options as a [React Flow Edge](https://reactflow.dev/docs/api/edges/edge-options/).

## Configuring Edge Options

By default, each smart edge preset uses built-in path-finding settings. To tune options such as `gridRatio` or `nodePadding` without building a full custom edge, use one of the approaches below.

### Using `createSmartEdge` (recommended)

Define configured edge types at **module scope** (not inside a component render function):

```ts
import { createSmartEdge } from "@tisoap/react-flow-smart-edge";

const edgeTypes = {
  smartstep: createSmartEdge("step", { gridRatio: 5, nodePadding: 20 }),
};
```

Pass `edgeTypes` to `<ReactFlow edgeTypes={edgeTypes} />` as usual. All edges of that type share the same options.

> **Important:** React Flow identifies edge types by component reference. Calling `createSmartEdge` during render creates a new component each time and can remount edges. Define `edgeTypes` outside your component, or memoize with stable dependencies.

Presets: `"bezier"`, `"straight"`, and `"step"`.

### Using `SmartEdge` and `smartEdgePresets`

When you need custom rendering (labels, buttons, etc.) alongside tuned options, use the exported `SmartEdge` component with a preset config:

```tsx
import { useNodes } from "@xyflow/react";
import { SmartEdge, smartEdgePresets } from "@tisoap/react-flow-smart-edge";
import type { EdgeProps } from "@xyflow/react";

function MySmartStepEdge(props: EdgeProps) {
  const nodes = useNodes();

  return (
    <SmartEdge
      {...props}
      nodes={nodes}
      options={{ ...smartEdgePresets.step, gridRatio: 5 }}
    />
  );
}
```

Register `MySmartStepEdge` in `edgeTypes` like any other custom edge.

For option-only changes, prefer `createSmartEdge`. Use `SmartEdge` + `smartEdgePresets` when you also customize the rendered output.

## Custom Smart Edges

You can have more control over how the edge is rerendered by creating a [custom edge](https://reactflow.dev/docs/api/edges/custom-edges/) and using the provided `getSmartEdge` function. It takes an object with the following keys:

- `sourcePosition`, `targetPosition`, `sourceX`, `sourceY`, `targetX` and `targetY`: The same values your [custom edge](https://reactflow.dev/docs/examples/edges/custom-edge/) will take as props
- `nodes`: An array containing all graph nodes, you can get it from the [`useNodes` hook](https://reactflow.dev/docs/api/hooks/use-nodes/)

### Example

Just like you can use `getBezierPath` from `reactflow` to create a [custom edge with a button](https://reactflow.dev/docs/examples/edges/edge-with-button/), you can do the same with `getSmartEdge`:

```jsx
import React from "react";
import { useNodes, BezierEdge } from "@xyflow/react";
import { getSmartEdge } from "@tisoap/react-flow-smart-edge";

const foreignObjectSize = 200;

export function SmartEdgeWithButtonLabel(props) {
  const {
    id,
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerStart,
    markerEnd,
  } = props;

  const nodes = useNodes();

  const getSmartEdgeResponse = getSmartEdge({
    sourcePosition,
    targetPosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    nodes,
  });

  // If the value returned is an Error, it means "getSmartEdge" was unable
  // to find a valid path, and you should do something else instead
  if (smartResponse instanceof Error) {
    return <BezierEdge {...props} />;
  }

  const { edgeCenterX, edgeCenterY, svgPathString } = getSmartEdgeResponse;

  return (
    <>
      <path
        style={style}
        className="react-flow__edge-path"
        d={svgPathString}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      <foreignObject
        width={foreignObjectSize}
        height={foreignObjectSize}
        x={edgeCenterX - foreignObjectSize / 2}
        y={edgeCenterY - foreignObjectSize / 2}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
          onClick={(event) => {
            event.stopPropagation();
            alert(`remove ${id}`);
          }}
        >
          X
        </button>
      </foreignObject>
    </>
  );
}
```

## Advanced Custom Smart Edges

> For tuning `gridRatio`, `nodePadding`, or other path-finding options on a preset edge, see [Configuring Edge Options](#configuring-edge-options) first.

The `getSmartEdge` function also accepts an optional object `options`, which allows you to configure aspects of the path-finding algorithm. You may use it like so:

```js
const myOptions = {
  // your configuration goes here
  nodePadding: 20,
  gridRatio: 15,
};

// ...

const getSmartEdgeResponse = getSmartEdge({
  sourcePosition,
  targetPosition,
  sourceX,
  sourceY,
  targetX,
  targetY,
  nodes,
  // Pass down options in the getSmartEdge object
  options: myOptions,
});
```

The `options` object accepts the following keys (they're all optional):

- `nodePadding`: How many pixels of padding are added around nodes, or by how much should the edge avoid the walls of a node. Default `10`, minimum `2`.
- `gridRatio`: The size in pixels of each square grid cell used for path-finding. Smaller values for a more accurate path, bigger for faster path-finding. Default `10`, minimum `2`.
- `drawEdge`: Allows you to change the function responsible to draw the SVG line, by default it's the same used by `SmartBezierEdge` ([more below](#drawedge))
- `generatePath`: Allows you to change the function for the path-finding, by default it's the same used by `SmartBezierEdge` ([more below](#generatepath))

### `drawEdge`

With the `drawEdge` option, you can change the function used to generate the final [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths), used to draw the line. By default it's the `svgDrawSmoothLinePath` function (same as used by the `SmartBezierEdge`), but the package also includes `svgDrawStraightLinePath` (same as used by the `SmartStraightEdge` and `SmartStepEdge`), or you can provide your own.

The package also includes `svgDrawSmoothStepLinePath` (used by `SmartSmoothStepEdge`), which is a **factory** that returns an SVG draw function. It accepts a `borderRadius` option (default `5`, matching React Flow) to control how much each corner is rounded:

```jsx
import {
  createSmartEdge,
  svgDrawSmoothStepLinePath,
} from "@tisoap/react-flow-smart-edge";

// Configure the corner rounding of a smooth step edge:
const edgeTypes = {
  smartSmoothStep: createSmartEdge("smoothstep", {
    drawEdge: svgDrawSmoothStepLinePath({ borderRadius: 12 }),
  }),
};
```

```jsx
import {
  getSmartEdge,
  // Available built-in SVG draw functions
  svgDrawSmoothLinePath,
  svgDrawStraightLinePath,
  svgDrawSmoothStepLinePath,
} from "@tisoap/react-flow-smart-edge";

// Using provided SVG draw functions:
const result = getSmartEdge({
  // ...
  options: {
    drawEdge: svgDrawSmoothLinePath,
  },
});

// ...or using your own custom function
const result = getSmartEdge({
  // ...
  options: {
    drawEdge: (source, target, path) => {
      // your code goes here
      // ...
      return svgPath;
    },
  },
});
```

The function you provided must comply with this signature:

```ts
type SVGDrawFunction = (
  source: XYPosition, // The starting {x, y} point
  target: XYPosition, // The ending  {x, y} point
  path: number[][], // The sequence of points [x, y] the line must follow
) => string; // A string to be used in the "d" property of the SVG line
```

For inspiration on how to implement your own, you can check the [`drawSvgPath.ts` source code](https://github.com/tisoap/react-flow-smart-edge/blob/main/src/functions/drawSvgPath.ts).

### `generatePath`

With the `generatePath` option, you can change the function used to do [Pathfinding](https://en.wikipedia.org/wiki/Pathfinding). By default, it's the `pathfindingAStarDiagonal` function (same as used by the `SmartBezierEdge` and `SmartStraightEdge`). The package also includes `pathfindingAStarNoDiagonal` (orthogonal-only A\* for custom edges), `pathfindingJumpPointNoDiagonal` (used by `SmartStepEdge`), or you can provide your own.

`SmartStraightEdge` shares the same pathfinder as `SmartBezierEdge` but draws straight SVG segments (`svgDrawStraightLinePath`) instead of smooth curves, so paths may still use diagonal grid shortcuts.

```jsx
import {
  getSmartEdge,
  // Available built-in pathfinding functions
  pathfindingAStarDiagonal,
  pathfindingAStarNoDiagonal,
  pathfindingJumpPointNoDiagonal,
} from "@tisoap/react-flow-smart-edge";

// Using provided pathfinding functions:
const result = getSmartEdge({
  // ...
  options: {
    generatePath: pathfindingAStarDiagonal,
  },
});

// ...or using your own custom function
const result = getSmartEdge({
  // ...
  options: {
    generatePath: (grid, start, end) => {
      // your code goes here
      // ...
      return { fullPath, smoothedPath };
    },
  },
});
```

The function you provide must comply with this signature:

```ts
type PathFindingFunction = (
  grid: Grid, // Grid representation of the graph
  start: XYPosition, // The starting {x, y} point
  end: XYPosition, // The ending  {x, y} point
) => number[][]; // Array of points [x, y] representing the full path with all points
```

For inspiration on how to implement your own, you can check the [`generatePath.ts` source code](https://github.com/tisoap/react-flow-smart-edge/blob/main/src/functions/generatePath.ts).

### Advanced Examples

```jsx
import { getSmartEdge, smartEdgePresets } from "@tisoap/react-flow-smart-edge";

// Same as importing "SmartBezierEdge" directly
const bezierResult = getSmartEdge({
  // ...
  options: smartEdgePresets.bezier,
});

// Same as importing "SmartStepEdge" directly
const stepResult = getSmartEdge({
  // ...
  options: smartEdgePresets.step,
});

// Same as importing "SmartStraightEdge" directly
const straightResult = getSmartEdge({
  // ...
  options: smartEdgePresets.straight,
});
```

## Storybook

You can see live Storybook examples by visiting [this page](https://tisoap.github.io/react-flow-smart-edge/), and see their source code [here](https://github.com/tisoap/react-flow-smart-edge/blob/main/src/stories/SmartEdge.stories.tsx).

## License

This project is [MIT](https://github.com/tisoap/react-flow-smart-edge/blob/main/LICENSE) licensed.
