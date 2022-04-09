import { SmartEdgeFactory } from './SmartEdgeFactory'
import type { SmartEdgeOptions } from './SmartEdgeFactory'

export { SmartEdgeFactory }
export type { SmartEdgeOptions }

export const SmartBezierEdge = SmartEdgeFactory({
	lineType: 'curve'
})

export const SmartStraightEdge = SmartEdgeFactory({
	lineType: 'straight'
})
