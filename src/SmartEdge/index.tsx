import React, { memo, useContext, useState } from 'react'
import {
	BezierEdge,
	StraightEdge,
	useNodes,
	EdgeText
} from 'react-flow-renderer'
import useDebounce from 'react-use/lib/useDebounce'
import { SmartEdgeContext, SmartEdgeProvider, useSmartEdge } from './context'
import { createGrid } from './createGrid'
import { drawSmoothLinePath, drawStraightLinePath } from './drawSvgPath'
import { generatePath } from './generatePath'
import { getBoundingBoxes } from './getBoundingBoxes'
import { gridToGraphPoint } from './pointConversion'
import type { PointInfo } from './createGrid'
import type { EdgeProps, Node } from 'react-flow-renderer'

interface PathFindingEdgeProps<T = unknown> extends EdgeProps<T> {
	storeNodes: Node<T>[]
}

const PathFindingEdge = memo((props: PathFindingEdgeProps) => {
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
		markerStart
	} = props

	const { gridRatio, nodePadding, lineType, lessCorners } = useSmartEdge()
	const roundCoordinatesTo = gridRatio

	// We use the node's information to generate bounding boxes for them
	// and the graph
	const { graph, nodes } = getBoundingBoxes(
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
	const { fullPath, smoothedPath } = generatePath(grid, start, end, lessCorners)

	/*
    Fallback to BezierEdge if no path was found.
    length = 0: no path was found
    length = 1: starting and ending points are the same
    length = 2: a single straight line from point A to point B
  */
	if (smoothedPath.length <= 2) {
		if (lineType === 'curve') {
			return <BezierEdge {...props} />
		}
		return <StraightEdge {...props} />
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
	const svgPathString =
		lineType === 'curve'
			? drawSmoothLinePath(source, target, graphPath)
			: drawStraightLinePath(source, target, graphPath)

	// The Label, if any, should be placed in the middle of the path
	const [middleX, middleY] = fullPath[Math.floor(fullPath.length / 2)]
	const { x: labelX, y: labelY } = gridToGraphPoint(
		{ x: middleX, y: middleY },
		graph.xMin,
		graph.yMin,
		gridRatio
	)

	const text = label ? (
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
	) : null

	return (
		<>
			<path
				style={style}
				className='react-flow__edge-path'
				d={svgPathString}
				markerEnd={markerEnd}
				markerStart={markerStart}
			/>
			{text}
		</>
	)
})

const DebouncedPathFindingEdge = memo((props: EdgeProps) => {
	const storeNodes = useNodes()
	const { debounceTime } = useSmartEdge()
	const [debouncedProps, setDebouncedProps] = useState({
		storeNodes,
		...props
	})

	useDebounce(
		() => {
			setDebouncedProps({
				storeNodes,
				...props
			})
		},
		debounceTime,
		[props, storeNodes]
	)

	return <PathFindingEdge {...debouncedProps} />
})

const RegularPathFindingEdge = memo((props: EdgeProps) => {
	const storeNodes = useNodes()
	return <PathFindingEdge storeNodes={storeNodes} {...props} />
})

RegularPathFindingEdge.displayName = 'RegularPathFindingEdge'

export const SmartEdge = memo((props: EdgeProps) => {
	const context = useContext(SmartEdgeContext)

	if (!context) {
		return (
			<SmartEdgeProvider>
				<DebouncedPathFindingEdge {...props} />;
			</SmartEdgeProvider>
		)
	}

	if (context.debounceTime === 0) {
		return <RegularPathFindingEdge {...props} />
	}

	return <DebouncedPathFindingEdge {...props} />
})

SmartEdge.displayName = 'SmartEdge'
