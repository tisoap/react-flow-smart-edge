import { BezierEdge } from 'react-flow-renderer'
import {
	smartEdgeFactory,
	svgDrawSmoothLinePath,
	pathfindingAStarDiagonal
} from '../SmartEdge'

export const SmartBezierEdge = smartEdgeFactory({
	drawEdge: svgDrawSmoothLinePath,
	fallback: BezierEdge,
	generatePath: pathfindingAStarDiagonal
})
