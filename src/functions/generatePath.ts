import { AStarFinder, Util, DiagonalMovement } from 'pathfinding'
import type { Grid } from 'pathfinding'
import type { XYPosition } from 'react-flow-renderer'

// https://www.npmjs.com/package/pathfinding#advanced-usage
declare module 'pathfinding' {
	interface FinderOptions extends Heuristic {
		diagonalMovement?: DiagonalMovement
		weight?: number
		allowDiagonal?: boolean
		dontCrossCorners?: boolean
	}
}

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
) => { fullPath: number[][]; smoothedPath: number[][] }

export const pathfindingAStarDiagonal: PathFindingFunction = (
	grid,
	start,
	end
) => {
	const finder = new AStarFinder({
		allowDiagonal: true,
		dontCrossCorners: true,
		diagonalMovement: DiagonalMovement.Always
	})

	let fullPath: number[][] = []
	let smoothedPath: number[][] = []

	try {
		fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid)
		smoothedPath = Util.smoothenPath(grid, fullPath)
	} catch {
		// No path was found. This can happen if the end point is "surrounded"
		// by other nodes, or if the starting and ending nodes are on top of
		// each other.
	}

	return { fullPath, smoothedPath }
}

export const pathfindingAStarNoDiagonal: PathFindingFunction = (
	grid,
	start,
	end
) => {
	const finder = new AStarFinder({
		allowDiagonal: false
	})

	let fullPath: number[][] = []
	let smoothedPath: number[][] = []

	try {
		fullPath = finder.findPath(start.x, start.y, end.x, end.y, grid)
		smoothedPath = Util.smoothenPath(grid, fullPath)
	} catch {
		// No path was found. This can happen if the end point is "surrounded"
		// by other nodes, or if the starting and ending nodes are on top of
		// each other.
	}

	return { fullPath, smoothedPath }
}
