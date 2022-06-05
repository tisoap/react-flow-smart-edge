// FIXME: The "pathfinding" module doe not have proper typings.
/* eslint-disable
	@typescript-eslint/no-unsafe-call,
	@typescript-eslint/no-unsafe-member-access,
	@typescript-eslint/no-unsafe-assignment,
	@typescript-eslint/ban-ts-comment,
*/
import {
	AStarFinder,
	JumpPointFinder,
	Util,
	DiagonalMovement
} from 'pathfinding'
import type { Grid } from 'pathfinding'
import type { XYPosition } from 'react-flow-renderer'

/**
 * Takes source and target {x, y} points, together with an grid representation
 * of the graph, and returns two arrays of number tuples [x, y]. The first
 * array represents the full path from source to target, and the second array
 * represents a condensed path from source to target.
 */
export type PathFindingFunction = (
	grid: Grid,
	start: XYPosition,
	end: XYPosition
) => {
	fullPath: number[][] | null
	smoothedPath: number[][] | null
}

export const pathfindingAStarDiagonal: PathFindingFunction = (
	grid,
	start,
	end
) => {
	const finder = new AStarFinder({
		diagonalMovement: DiagonalMovement.Always
	})

	let fullPath: number[][] | null = null
	let smoothedPath: number[][] | null = null

	try {
		fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid)
		smoothedPath = Util.smoothenPath(grid, fullPath)
	} catch {
		// No path was found. This can happen if the end point is "surrounded"
		// by other nodes, or if the starting and ending nodes are on top of
		// each other.
		fullPath = null
		smoothedPath = null
	}

	return { fullPath, smoothedPath }
}

export const pathfindingAStarNoDiagonal: PathFindingFunction = (
	grid,
	start,
	end
) => {
	const finder = new AStarFinder({
		diagonalMovement: DiagonalMovement.Never
	})

	let fullPath: number[][] | null = null
	let smoothedPath: number[][] | null = null

	try {
		fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid)
		smoothedPath = Util.smoothenPath(grid, fullPath)
	} catch {
		// No path was found. This can happen if the end point is "surrounded"
		// by other nodes, or if the starting and ending nodes are on top of
		// each other.
		fullPath = null
		smoothedPath = null
	}

	return { fullPath, smoothedPath }
}

export const pathfindingJumpPointNoDiagonal: PathFindingFunction = (
	grid,
	start,
	end
) => {
	// FIXME: The "pathfinding" module doe not have proper typings.
	// @ts-ignore
	const finder = new JumpPointFinder({
		diagonalMovement: DiagonalMovement.Never
	})

	let fullPath: number[][] | null = null
	let smoothedPath: number[][] | null = null

	try {
		fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid)
		// Jump point works better using only the full path.
		smoothedPath = fullPath
	} catch {
		// No path was found. This can happen if the end point is "surrounded"
		// by other nodes, or if the starting and ending nodes are on top of
		// each other.
		fullPath = null
		smoothedPath = null
	}

	return { fullPath, smoothedPath }
}
