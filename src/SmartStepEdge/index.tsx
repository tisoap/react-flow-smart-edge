import { StepEdge } from 'react-flow-renderer'
import {
	smartEdgeFactory,
	svgDrawStraightLinePath,
	pathfindingJumpPointNoDiagonal
} from '../SmartEdge'
import type { FactoryOptions } from '../SmartEdge'

const StepConfiguration = {
	drawEdge: svgDrawStraightLinePath,
	fallback: StepEdge,
	generatePath: pathfindingJumpPointNoDiagonal
}

export const SmartStepEdge = smartEdgeFactory(StepConfiguration)
SmartStepEdge.displayName = 'SmartStepEdge'

export const stepEdgeFactory = ({
	debounceTime,
	gridRatio,
	nodePadding
}: FactoryOptions) => {
	const SmartStepEdge = smartEdgeFactory({
		...StepConfiguration,
		debounceTime,
		gridRatio,
		nodePadding
	})
	SmartStepEdge.displayName = 'SmartStepEdge'
	return SmartStepEdge
}
