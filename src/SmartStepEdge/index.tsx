import { StepEdge } from 'react-flow-renderer'
import {
	smartEdgeFactory,
	svgDrawStraightLinePath,
	pathfindingJumpPointNoDiagonal
} from '../SmartEdge'

export const SmartStepEdge = smartEdgeFactory({
	drawEdge: svgDrawStraightLinePath,
	fallback: StepEdge,
	generatePath: pathfindingJumpPointNoDiagonal
})
