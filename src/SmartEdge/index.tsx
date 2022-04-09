import { BezierEdge, StraightEdge } from 'react-flow-renderer'
import { drawSmoothLinePath, drawStraightLinePath } from '../functions'
import { SmartEdgeFactory } from './SmartEdgeFactory'
import type { SmartEdgeOptions } from './SmartEdgeFactory'

export { SmartEdgeFactory }
export type { SmartEdgeOptions }

export const SmartBezierEdge = SmartEdgeFactory({
	drawEdge: drawSmoothLinePath,
	fallback: BezierEdge
})

export const SmartStraightEdge = SmartEdgeFactory({
	drawEdge: drawStraightLinePath,
	fallback: StraightEdge
})
