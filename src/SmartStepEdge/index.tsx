import {
	smartEdgeFactory,
	svgDrawStraightLinePath,
	pathfindingJumpPointNoDiagonal
} from '../SmartEdge'
import type { FactoryOptions } from '../SmartEdge'

const StepConfiguration = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingJumpPointNoDiagonal
}

export const SmartStepEdge = smartEdgeFactory(StepConfiguration)
SmartStepEdge.displayName = 'SmartStepEdge'

export function stepEdgeFactory<EdgeDataType = unknown, NodeDataType = unknown>(
	options: FactoryOptions
) {
	const SmartStepEdge = smartEdgeFactory<EdgeDataType, NodeDataType>({
		...StepConfiguration,
		...options
	})
	SmartStepEdge.displayName = 'SmartStepEdge'
	return SmartStepEdge
}
