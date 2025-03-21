import { Grid } from 'pathfinding'
import {
	getNextPointFromPosition,
	guaranteeWalkablePath
} from './guaranteeWalkablePath'
import { graphToGridPoint } from './pointConversion'
import { round, roundUp } from './utils'
import type { GraphBoundingBox, NodeBoundingBox } from './getBoundingBoxes'
import type { Position } from '@xyflow/react'

export type PointInfo = {
	x: number
	y: number
	position: Position
}

export const createGrid = (
	graph: GraphBoundingBox,
	nodes: NodeBoundingBox[],
	source: PointInfo,
	target: PointInfo,
	gridRatio = 2
) => {
	const { xMin, yMin, width, height } = graph

	// Create a grid representation of the graph box, where each cell is
	// equivalent to 10x10 pixels (or the grid ratio) on the graph. We'll use
	// this simplified grid to do pathfinding.
	const mapColumns = roundUp(width, gridRatio) / gridRatio + 1
	const mapRows = roundUp(height, gridRatio) / gridRatio + 1
	const grid = new Grid(mapColumns, mapRows)

	// Update the grid representation with the space the nodes take up
	nodes.forEach((node) => {
		const nodeStart = graphToGridPoint(node.topLeft, xMin, yMin, gridRatio)
		const nodeEnd = graphToGridPoint(node.bottomRight, xMin, yMin, gridRatio)

		for (let x = nodeStart.x; x < nodeEnd.x; x++) {
			for (let y = nodeStart.y; y < nodeEnd.y; y++) {
				grid.setWalkableAt(x, y, false)
			}
		}
	})

	// Convert the starting and ending graph points to grid points
	const startGrid = graphToGridPoint(
		{
			x: round(source.x, gridRatio),
			y: round(source.y, gridRatio)
		},
		xMin,
		yMin,
		gridRatio
	)

	const endGrid = graphToGridPoint(
		{
			x: round(target.x, gridRatio),
			y: round(target.y, gridRatio)
		},
		xMin,
		yMin,
		gridRatio
	)

	// Guarantee a walkable path between the start and end points, even if the
	// source or target where covered by another node or by padding
	const startingNode = grid.getNodeAt(startGrid.x, startGrid.y)
	guaranteeWalkablePath(grid, startingNode, source.position)
	const endingNode = grid.getNodeAt(endGrid.x, endGrid.y)
	guaranteeWalkablePath(grid, endingNode, target.position)

	// Use the next closest points as the start and end points, so
	// pathfinding does not start too close to the nodes
	const start = getNextPointFromPosition(startingNode, source.position)
	const end = getNextPointFromPosition(endingNode, target.position)

	return { grid, start, end }
}
