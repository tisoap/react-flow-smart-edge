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

export const bezierEdgeFactory = ({
	debounceTime,
	gridRatio,
	nodePadding
}: FactoryOptions) => {
	const SmartBezierEdge = smartEdgeFactory({
		...BezierConfiguration,
		debounceTime,
		gridRatio,
		nodePadding
	})
	SmartBezierEdge.displayName = 'SmartBezierEdge'
	return SmartBezierEdge
}
