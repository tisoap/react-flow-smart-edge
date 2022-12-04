import type { GraphBoundingBox } from './getBoundingBoxes'
import type { XYPosition } from 'reactflow'

export function gridIndexToGraphPoint(
	gridIndex: XYPosition,
	boundingBox: GraphBoundingBox,
	roundDownFactor: number
): XYPosition {
	// Calculate the X and Y coordinates in the original graph by
	// multiplying the index coordinates by the round down factor and
	// adding the minimum X and Y values from the bounding box
	const x = gridIndex.x * roundDownFactor + boundingBox.xMin
	const y = gridIndex.y * roundDownFactor + boundingBox.yMin

	return { x, y }
}

export function graphPointToGridIndex(
	point: XYPosition,
	boundingBox: GraphBoundingBox,
	roundDownFactor: number
): XYPosition {
	// Calculate the X and Y coordinates in the grid by dividing the point
	// coordinates by the round down factor and subtracting the minimum X
	// and Y values from the bounding box
	const x = Math.floor((point.x - boundingBox.xMin) / roundDownFactor)
	const y = Math.floor((point.y - boundingBox.yMin) / roundDownFactor)

	return { x, y }
}
