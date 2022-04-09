import { BezierEdge, StraightEdge } from 'react-flow-renderer'
import {
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath,
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal
} from '../functions'
import { smartEdgeFactory } from './SmartEdgeFactory'
import type { PathFindingFunction, SVGDrawFunction } from '../functions'
import type { SmartEdgeOptions } from './SmartEdgeFactory'

export {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath,
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal
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
