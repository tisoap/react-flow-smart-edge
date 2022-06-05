import {
	createGrid,
	getBoundingBoxes,
	gridToGraphPoint,
	pathfindingAStarDiagonal,
	svgDrawSmoothLinePath,
	toInteger
} from '../functions'
import type {
	PointInfo,
	PathFindingFunction,
	SVGDrawFunction
} from '../functions'
import type { Node, EdgeProps } from 'react-flow-renderer'

export type EdgeParams = Pick<
	EdgeProps,
	| 'sourceX'
	| 'sourceY'
	| 'targetX'
	| 'targetY'
	| 'sourcePosition'
	| 'targetPosition'
>

export type GetSmartEdgeOptions = {
	gridRatio?: number
	nodePadding?: number
	drawEdge?: SVGDrawFunction
	generatePath?: PathFindingFunction
}

export type GetSmartEdgeParams<NodeDataType = unknown> = EdgeParams & {
	options?: GetSmartEdgeOptions
	nodes: Node<NodeDataType>[]
}

export type GetSmartEdgeReturn = {
	svgPathString: string
	edgeCenterX: number
	edgeCenterY: number
}

export const getSmartEdge = <NodeDataType = unknown>({
	options = {},
	nodes = [],
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition
}: GetSmartEdgeParams<NodeDataType>): GetSmartEdgeReturn | null => {
	const {
		drawEdge = svgDrawSmoothLinePath,
		generatePath = pathfindingAStarDiagonal
	} = options

	let { gridRatio = 10, nodePadding = 10 } = options
	gridRatio = toInteger(gridRatio)
	nodePadding = toInteger(nodePadding)

	// We use the node's information to generate bounding boxes for them
	// and the graph
	const { graphBox, nodeBoxes } = getBoundingBoxes<NodeDataType>(
		nodes,
		nodePadding,
		gridRatio
	)

	const source: PointInfo = {
		x: sourceX,
		y: sourceY,
		position: sourcePosition
	}

	const target: PointInfo = {
		x: targetX,
		y: targetY,
		position: targetPosition
	}

	// With this information, we can create a 2D grid representation of
	// our graph, that tells us where in the graph there is a "free" space or not
	const { grid, start, end } = createGrid(
		graphBox,
		nodeBoxes,
		source,
		target,
		gridRatio
	)

	// We then can use the grid representation to do pathfinding
	const { fullPath, smoothedPath } = generatePath(grid, start, end)

	if (fullPath === null || smoothedPath === null) {
		return null
	}

	// Here we convert the grid path to a sequence of graph coordinates.
	const graphPath = smoothedPath.map((gridPoint) => {
		const [x, y] = gridPoint
		const graphPoint = gridToGraphPoint(
			{ x, y },
			graphBox.xMin,
			graphBox.yMin,
			gridRatio
		)
		return [graphPoint.x, graphPoint.y]
	})

	// Finally, we can use the graph path to draw the edge
	const svgPathString = drawEdge(source, target, graphPath)

	// Compute the edge's middle point using the full path, so users can use
	// it to position their custom labels
	const index = Math.floor(fullPath.length / 2)
	const middlePoint = fullPath[index]
	// FIXME: can fail here, middlePoint can be undefined for some reason
	const [middleX, middleY] = middlePoint
	const { x: edgeCenterX, y: edgeCenterY } = gridToGraphPoint(
		{ x: middleX, y: middleY },
		graphBox.xMin,
		graphBox.yMin,
		gridRatio
	)

	return { svgPathString, edgeCenterX, edgeCenterY }
}

export type GetSmartEdgeFunction = typeof getSmartEdge
