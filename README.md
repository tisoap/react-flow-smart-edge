# React Flow Smart Edge

Custom Edges for [React Flow](https://github.com/tisoap/react-flow-smart-edge#readme) that never intersect with other nodes.

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

## Usage

```jsx
import React from 'react'
import ReactFlow from 'react-flow-renderer'
import { SmartEdge } from '@tisoap/react-flow-smart-edge'

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

const edgeTypes = {
	smart: SmartEdge
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

## Options

The `SmartEdge` takes the same options as a [React Flow Edge](https://reactflow.dev/docs/api/edges/edge-options/).

You can configure additional advanced options by wrapping your graph with `SmartEdgeProvider` and passing an `options` object. If an option is not provided it'll assume it's default value. The available options are:

```js
const options = {
	// Configure by how many milliseconds the Edge render should be
	// debounced. Default 200, 0 to disable.
	debounceTime: 200,

	// How many pixels of padding is added around nodes, or by how
	// much should the edge avoid the walls of a node. Default 10,
	// minimum 2.
	nodePadding: 10,

	// The size in pixels of each square grid cell used for path
	// finding. Smaller values for a more accurate path, bigger
	// for faster path finding. Default 10, minimum 2.
	gridRatio: 10,

	// The type of line that is draw. Available options are:
	// 'curve' - Curved lines with BezierEdge fallback (default)
	// 'straight' - Straight lines with StraightEdge fallback
	lineType: 'curve',

	// Boolean value to control if the path finding algorithm should
	// use less diagonal movement, default to false.
	lessCorners: false
}
```

Usage:

```jsx
import React from 'react'
import ReactFlow from 'react-flow-renderer'
import { SmartEdge, SmartEdgeProvider } from '@tisoap/react-flow-smart-edge'
import { nodes, edges } from './data'

const edgeTypes = {
	smart: SmartEdge
}

const smartOptions = {
	debounceTime: 300
}

export const Graph = (props) => {
	const { children, ...rest } = props

	return (
		<SmartEdgeProvider options={smartOptions}>
			<ReactFlow
				defaultNodes={nodes}
				defaultEdges={edges}
				edgeTypes={edgeTypes}
				{...rest}
			>
				{children}
			</ReactFlow>
		</SmartEdgeProvider>
	)
}
```

## Storybook

You can see Storybook examples by visiting this page: https://tisoap.github.io/react-flow-smart-edge/

## License

This project is [MIT](https://github.com/tisoap/react-flow-smart-edge/blob/main/LICENSE) licensed.

### Support

Liked this project and want to show your support? Buy me a coffee:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J472RAJ)
