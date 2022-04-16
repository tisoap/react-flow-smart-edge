# React Flow Smart Edge

Custom Edges for [React Flow](https://github.com/wbkd/react-flow#readme) that never intersect with other nodes.

![Smart Edge](https://raw.githubusercontent.com/tisoap/react-flow-smart-edge/main/.github/images/example.gif)

## Install

With `npm`:

```bash
npm install @tisoap/react-flow-smart-edge
```

With `yarn`:

```bash
yarn add @tisoap/react-flow-smart-edge
```

## Support

Like this project and want to show your support? Buy me a coffee:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J472RAJ)

## Usage

This package ships with the following Smart Edges components:

- `SmartBezierEdge`: A smart equivalent to React Flow's [BezierEdge](https://reactflow.dev/docs/api/edges/edge-types/)
- `SmartStraightEdge`: A smart equivalent to React Flow's [StraightEdge](https://reactflow.dev/docs/api/edges/edge-types/)
- `SmartStepEdge`: A smart equivalent to React Flow's [StepEdge](https://reactflow.dev/docs/api/edges/edge-types/)

Each one can be imported individually as a named export.

### Example

```jsx
import React from 'react'
import ReactFlow from 'react-flow-renderer'
import { SmartBezierEdge } from '@tisoap/react-flow-smart-edge'

const nodes = [
	{
		id: '1',
		data: { label: 'Node 1' },
		position: { x: 300, y: 100 }
	},
	{
		id: '2',
		data: { label: 'Node 2' },
		position: { x: 300, y: 200 }
	}
]

const edges = [
	{
		id: 'e21',
		source: '2',
		target: '1',
		type: 'smart'
	}
]

// You can give any name to your edge types
// https://reactflow.dev/docs/api/edges/custom-edges/
const edgeTypes = {
	smart: SmartBezierEdge
}

export const Graph = (props) => {
	const { children, ...rest } = props

	return (
		<ReactFlow
			defaultNodes={nodes}
			defaultEdges={edges}
			edgeTypes={edgeTypes}
			{...rest}
		>
			{children}
		</ReactFlow>
	)
}
```

## Edge Options

All smart edges will take the exact same options as a [React Flow Edge](https://reactflow.dev/docs/api/edges/edge-options/).

## Configuring Smart Edges

You can create your own Smart Edges with custom configurations by using _factory functions_. Each edge type will have an equivalent _factory function_:

- `bezierEdgeFactory`: Creates a custom `SmartBezierEdge`
- `stepEdgeFactory`: Creates a custom `SmartStepEdge`
- `straightEdgeFactory`: Creates a custom `SmartStraightEdge`

All those functions take a configuration object as parameter. If an option is not passed it will assume it's default value. The available options for the configuration object are:

- `debounceTime`: By How many milliseconds the Edge render is debounced. Default is `200`, pass `0` to disable debouncing.
- `nodePadding`: How many pixels of padding is added around nodes, or by how much should the edge avoid the walls of a node. Default `10`, minimum `2`.
- `gridRatio`: The size in pixels of each square grid cell used for path finding. Smaller values for a more accurate path, bigger for faster path finding. Default `10`, minimum `2`.

### Example

```jsx
import React from 'react'
import ReactFlow from 'react-flow-renderer'
import {
	bezierEdgeFactory,
	straightEdgeFactory
} from '@tisoap/react-flow-smart-edge'
import { nodes, edges } from './data'

const BezierNoDebounce = bezierEdgeFactory({ debounceTime: 0 })
const StraightSmallPadding = straightEdgeFactory({ nodePadding: 5 })

const edgeTypes = {
	smartNoDebounce: BezierNoDebounce,
	smartSmallPadding: StraightSmallPadding
}

export const Graph = (props) => {
	const { children, ...rest } = props

	return (
		<ReactFlow
			defaultNodes={nodes}
			defaultEdges={edges}
			edgeTypes={edgeTypes}
			{...rest}
		>
			{children}
		</ReactFlow>
	)
}
```

## Storybook

You can see Storybook examples by visiting this page: https://tisoap.github.io/react-flow-smart-edge/

## Advanced Smart Edge Configuration

**⚠️ATTENTION: Only use these if you know what you're doing!⚠️**

This package also provides a more generic `smartEdgeFactory` function. Besides the default options available to other factory functions, this one also accepts the following additional options:

### `fallback`

By default, if the path-finding algorithm of a Smart Edge can't find a valid path, it will fall-back to a regular edge. With the `fallback` option, you can change what Edge it will fallback to. By default it's the React Flow's `BezierEdge`, but you can change it to any component that takes the same props as a regular edge component.

```jsx
// Available edges from "react-flow-renderer":
// https://reactflow.dev/docs/api/edges/edge-types/
import { SimpleBezier } from 'react-flow-renderer'
import { smartEdgeFactory } from '@tisoap/react-flow-smart-edge'

const MyCustomSmartEdge = smartEdgeFactory({ fallback: SimpleBezier })
```

### `drawEdge`

With the `drawEdge` option, you can change the function used to generate the final [SVG path string](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths), used to draw the line. By default it's the `svgDrawSmoothLinePath` function (same as used by the `SmartBezierEdge`), but the package also includes `svgDrawStraightLinePath` (same as used by the `SmartStraightEdge` and `SmartStepEdge`), or you can provide your own.

```jsx
import {
	smartEdgeFactory,
	// Available built-in SVG draw functions
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath
} from '@tisoap/react-flow-smart-edge'

// Using provided SVG draw functions:
const MyCustomStraightLine = smartEdgeFactory({
	drawEdge: svgDrawStraightLinePath
})

// Using your own custom function
const MyCustomSVGEdge = smartEdgeFactory({
	drawEdge: (source, target, path) => {
		// your code goes here
		// ...
		return svgPath
	}
})
```

The function your provide must comply with this signature:

```ts
type SVGDrawFunction = (
	source: XYPosition, // The starting {x, y} point
	target: XYPosition, // The ending  {x, y} point
	path: number[][] // The sequence of points [x, y] the line must follow
) => string // A string to be used in the "d" property of the SVG line
```

For inspiration on how to implement your own, you can check the [`drawSvgPath.ts` source code](./src/functions/drawSvgPath.ts).

### `generatePath`

With the `generatePath` option, you can change the function used to do [Pathfinding](https://en.wikipedia.org/wiki/Pathfinding). By default, it's the `pathfindingAStarDiagonal` function (same as used by the `SmartBezierEdge`), but the package also includes `pathfindingAStarNoDiagonal` (used by `SmartStraightEdge`) and `pathfindingJumpPointNoDiagonal` (used by `SmartStepEdge`), or your can provide your own. The built-in functions use the [`pathfinding` dependency](https://www.npmjs.com/package/pathfinding#advanced-usage) behind the scenes.

```jsx
import {
	smartEdgeFactory,
	// Available built-in pathfinding functions
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal,
	pathfindingJumpPointNoDiagonal
} from '@tisoap/react-flow-smart-edge'

// Using provided pathfinding functions:
const MyCustomJumpPoint = smartEdgeFactory({
	generatePath: pathfindingJumpPointNoDiagonal
})

// Using your own custom function
const MyCustomPathFindingEdge = smartEdgeFactory({
	generatePath: (grid, start, end) => {
		// your code goes here
		// ...
		return { fullPath, smoothedPath }
	}
})
```

The function you provide must comply with this signature:

```ts
type PathFindingFunction = (
	grid: Grid, // Grid representation of the graph
	start: XYPosition, // The starting {x, y} point
	end: XYPosition // The ending  {x, y} point
) => {
	fullPath: number[][] // Array of points [x, y] representing the full path with all points
	smoothedPath: number[][] // Array of points [x, y] representing a smaller, compressed path
}
```

For inspiration on how to implement your own, you can check the [`generatePath.ts` source code](./src/functions/generatePath.ts) and the [`pathfinding` dependency](https://www.npmjs.com/package/pathfinding#advanced-usage) documentation.

### Advanced Example

```jsx
import { BezierEdge, StepEdge, StraightEdge } from 'react-flow-renderer'
import {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal,
	pathfindingJumpPointNoDiagonal
} from '@tisoap/react-flow-smart-edge'

// Same as importing "SmartBezierEdge" directly
export const SmartBezierEdge = smartEdgeFactory({
	drawEdge: svgDrawSmoothLinePath,
	fallback: BezierEdge,
	generatePath: pathfindingAStarDiagonal,
	debounceTime: 200,
	nodePadding: 10,
	gridRatio: 10,
})

// Same as importing "SmartStepEdge" directly
export const SmartStepEdge = smartEdgeFactory({
	drawEdge: svgDrawStraightLinePath,
	fallback: StepEdge,
	generatePath: pathfindingJumpPointNoDiagonal,
	debounceTime: 200,
	nodePadding: 10,
	gridRatio: 10,
})

// Same as importing "SmartStraightEdge" directly
export const SmartStraightEdge = smartEdgeFactory({
	drawEdge: svgDrawStraightLinePath,
	fallback: StraightEdge,
	generatePath: pathfindingAStarNoDiagonal,
	debounceTime: 200,
	nodePadding: 10,
	gridRatio: 10,
})
```

## License

This project is [MIT](https://github.com/tisoap/react-flow-smart-edge/blob/main/LICENSE) licensed.
