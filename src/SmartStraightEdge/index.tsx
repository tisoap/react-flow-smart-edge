import {
	smartEdgeFactory,
	svgDrawStraightLinePath,
	pathfindingAStarNoDiagonal
} from '../SmartEdge'
import type { FactoryOptions } from '../SmartEdge'

const StraightConfiguration = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingAStarNoDiagonal
}

export const SmartStraightEdge = smartEdgeFactory(StraightConfiguration)
SmartStraightEdge.displayName = 'SmartStraightEdge'

export function straightEdgeFactory<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(options: FactoryOptions) {
	const SmartStraightEdge = smartEdgeFactory<EdgeDataType, NodeDataType>({
		...StraightConfiguration,
		...options
	})
	SmartStraightEdge.displayName = 'SmartStraightEdge'
	return SmartStraightEdge
}
