import {
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath,
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal,
	pathfindingJumpPointNoDiagonal
} from '../functions'
import { smartEdgeFactory } from './SmartEdgeFactory'
import type { PathFindingFunction, SVGDrawFunction } from '../functions'
import type {
	SmartEdgeOptions,
	SmartEdgeAdvancedOptions,
	AdvancedFactoryOptions,
	FactoryOptions
} from './SmartEdgeFactory'

export {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	svgDrawStraightLinePath,
	pathfindingAStarDiagonal,
	pathfindingAStarNoDiagonal,
	pathfindingJumpPointNoDiagonal
}

export type {
	SmartEdgeOptions,
	SmartEdgeAdvancedOptions,
	PathFindingFunction,
	SVGDrawFunction,
	AdvancedFactoryOptions,
	FactoryOptions
}
