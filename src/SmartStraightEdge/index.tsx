import { StraightEdge } from 'react-flow-renderer'
import {
	smartEdgeFactory,
	svgDrawStraightLinePath,
	pathfindingAStarNoDiagonal
} from '../SmartEdge'
import type { FactoryOptions } from '../SmartEdge'

const StraightConfiguration = {
	drawEdge: svgDrawStraightLinePath,
	fallback: StraightEdge,
	generatePath: pathfindingAStarNoDiagonal
}

export const SmartStraightEdge = smartEdgeFactory(StraightConfiguration)
SmartStraightEdge.displayName = 'SmartStraightEdge'

export function straightEdgeFactory<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(options: FactoryOptions<EdgeDataType>) {
	const SmartStraightEdge = smartEdgeFactory<EdgeDataType, NodeDataType>({
		...StraightConfiguration,
		...options
	})
	SmartStraightEdge.displayName = 'SmartStraightEdge'
	return SmartStraightEdge
}
