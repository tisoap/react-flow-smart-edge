import { BezierEdge } from 'react-flow-renderer'
import {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	pathfindingAStarDiagonal
} from '../SmartEdge'
import type { FactoryOptions } from '../SmartEdge'

const BezierConfiguration = {
	drawEdge: svgDrawSmoothLinePath,
	fallback: BezierEdge,
	generatePath: pathfindingAStarDiagonal
}

export const SmartBezierEdge = smartEdgeFactory(BezierConfiguration)
SmartBezierEdge.displayName = 'SmartBezierEdge'

export function bezierEdgeFactory<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(options: FactoryOptions<EdgeDataType>) {
	const SmartBezierEdge = smartEdgeFactory<EdgeDataType, NodeDataType>({
		...BezierConfiguration,
		...options
	})
	SmartBezierEdge.displayName = 'SmartBezierEdge'
	return SmartBezierEdge
}
