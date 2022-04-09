import { BezierEdge, StraightEdge } from 'react-flow-renderer'
import { SmartEdgeFactory } from './SmartEdgeFactory'
import type { SmartEdgeOptions } from './SmartEdgeFactory'

export { SmartEdgeFactory }
export type { SmartEdgeOptions }

export const SmartBezierEdge = SmartEdgeFactory({
	lineType: 'curve',
	fallback: BezierEdge
})

export const SmartStraightEdge = SmartEdgeFactory({
	lineType: 'straight',
	fallback: StraightEdge
})
