import { BezierEdge, StraightEdge, StepEdge } from 'react-flow-renderer'
import {
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath,
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal,
	pathfindingJumpPointNoDiagonal
} from '../functions'
import { smartEdgeFactory } from './SmartEdgeFactory'
import type { PathFindingFunction, SVGDrawFunction } from '../functions'
import type { SmartEdgeOptions } from './SmartEdgeFactory'

export {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath,
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal,
	pathfindingJumpPointNoDiagonal
}

export type { SmartEdgeOptions, PathFindingFunction, SVGDrawFunction }

export const SmartBezierEdge = smartEdgeFactory({
	drawEdge: svgDrawSmoothLinePath,
	fallback: BezierEdge,
	generatePath: pathfindingAStarDiagonal
})

export const SmartStraightEdge = smartEdgeFactory({
	drawEdge: svgDrawStraightLinePath,
	fallback: StraightEdge,
	generatePath: pathfindingAStarNoDiagonal
})

export const SmartStepEdge = smartEdgeFactory({
	drawEdge: svgDrawStraightLinePath,
	fallback: StepEdge,
	generatePath: pathfindingJumpPointNoDiagonal
})
