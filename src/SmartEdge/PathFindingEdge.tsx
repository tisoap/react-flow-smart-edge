import omit from 'lodash/omit'
import React, { memo } from 'react'
import { EdgeText } from 'react-flow-renderer'
import { createGrid, getBoundingBoxes, gridToGraphPoint } from '../functions'
import type {
	PointInfo,
	SVGDrawFunction,
	PathFindingFunction
} from '../functions'
import type { JSXElementConstructor } from 'react'
import type { EdgeProps, Node, BezierEdge } from 'react-flow-renderer'

/**
 * Any valid Edge component from react-flow-renderer
 */
export type EdgeComponent = typeof BezierEdge

export interface SmartEdgeOptions<EdgeDataType = unknown> {
	debounceTime: number
	nodePadding: number
	gridRatio: number
	customEdgeLabel?: JSXElementConstructor<CustomEdgeProps<EdgeDataType>>
}

export interface SmartEdgeAdvancedOptions<EdgeDataType = unknown>
	extends SmartEdgeOptions<EdgeDataType> {
	fallback: EdgeComponent
	drawEdge: SVGDrawFunction
	generatePath: PathFindingFunction
}

export interface PathFindingEdgeProps<
	EdgeDataType = unknown,
	NodeDataType = unknown
> extends EdgeProps<EdgeDataType> {
	storeNodes: Node<NodeDataType>[]
	options: SmartEdgeAdvancedOptions<EdgeDataType>
}

export interface CustomEdgeProps<EdgeDataType = unknown>
	extends EdgeProps<EdgeDataType> {
	edgeCenterX: number
	edgeCenterY: number
}

function PathFindingEdgeComponent<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(props: PathFindingEdgeProps<EdgeDataType, NodeDataType>) {
	const {
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		style,
		storeNodes,
		label,
		labelStyle,
		labelShowBg,
		labelBgStyle,
		labelBgPadding,
		labelBgBorderRadius,
		markerEnd,
		markerStart,
		options
	} = props

	const {
		gridRatio,
		nodePadding,
		drawEdge,
		fallback: FallbackEdge,
		generatePath,
		customEdgeLabel: CustomEdgeLabel
	} = options

	const roundCoordinatesTo = gridRatio

	// We use the node's information to generate bounding boxes for them
	// and the graph
	const { graph, nodes } = getBoundingBoxes<NodeDataType>(
		storeNodes,
		nodePadding,
		roundCoordinatesTo
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
		graph,
		nodes,
		source,
		target,
		gridRatio
	)

	// We then can use the grid representation to do pathfinding
	const { fullPath, smoothedPath } = generatePath(grid, start, end)

	/*
    Use the fallback Edge if no path was found.
    length = 0: no path was found
    length = 1: starting and ending points are the same
    length = 2: a single straight line from point A to point B
  */
	if (smoothedPath.length <= 2) {
		return <FallbackEdge {...props} />
	}

	// Here we convert the grid path to a sequence of graph coordinates.
	const graphPath = smoothedPath.map((gridPoint) => {
		const [x, y] = gridPoint
		const graphPoint = gridToGraphPoint(
			{ x, y },
			graph.xMin,
			graph.yMin,
			gridRatio
		)
		return [graphPoint.x, graphPoint.y]
	})

	// Finally, we can use the graph path to draw the edge
	const svgPathString = drawEdge(source, target, graphPath)

	let edgeLabel = null
	const hasStringLabel = !!label && typeof label === 'string'
	const hasCustomLabel = !!CustomEdgeLabel

	if (hasStringLabel || hasCustomLabel) {
		// The Label, if any, should be placed in the middle of the path
		const [middleX, middleY] = fullPath[Math.floor(fullPath.length / 2)]
		const { x: labelX, y: labelY } = gridToGraphPoint(
			{ x: middleX, y: middleY },
			graph.xMin,
			graph.yMin,
			gridRatio
		)

		if (hasCustomLabel) {
			edgeLabel = (
				<CustomEdgeLabel
					{...omit(props, ['storeNodes', 'options'])}
					edgeCenterX={labelX}
					edgeCenterY={labelY}
				/>
			)
		}

		if (hasStringLabel && !hasCustomLabel) {
			edgeLabel = (
				<EdgeText
					x={labelX}
					y={labelY}
					label={label}
					labelStyle={labelStyle}
					labelShowBg={labelShowBg}
					labelBgStyle={labelBgStyle}
					labelBgPadding={labelBgPadding}
					labelBgBorderRadius={labelBgBorderRadius}
				/>
			)
		}
	}

	return (
		<>
			<path
				style={style}
				className='react-flow__edge-path'
				d={svgPathString}
				markerEnd={markerEnd}
				markerStart={markerStart}
			/>
			{edgeLabel}
		</>
	)
}

export const PathFindingEdge = memo(
	PathFindingEdgeComponent
) as typeof PathFindingEdgeComponent
