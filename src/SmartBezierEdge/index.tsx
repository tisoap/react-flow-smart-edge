import {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	pathfindingAStarDiagonal
} from '../SmartEdge'
import type { GetSmartEdgeOptions } from '../getSmartEdge'

const BezierConfiguration = {
	drawEdge: svgDrawSmoothLinePath,
	generatePath: pathfindingAStarDiagonal
}

export const SmartBezierEdge = smartEdgeFactory(BezierConfiguration)
SmartBezierEdge.displayName = 'SmartBezierEdge'

export function bezierEdgeFactory<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(options: GetSmartEdgeOptions) {
	const SmartBezierEdge = smartEdgeFactory<EdgeDataType, NodeDataType>({
		...BezierConfiguration,
		...options
	})
	SmartBezierEdge.displayName = 'SmartBezierEdge'
	return SmartBezierEdge
}
