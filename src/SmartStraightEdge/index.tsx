import React from 'react'
import { useNodes, StraightEdge } from 'react-flow-renderer'
import { SmartEdge } from '../SmartEdge'
import {
	svgDrawStraightLinePath,
	pathfindingAStarNoDiagonal
} from '../functions'
import type { SmartEdgeOptions } from '../SmartEdge'
import type { EdgeProps } from 'react-flow-renderer'

const StraightConfiguration: SmartEdgeOptions = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingAStarNoDiagonal,
	fallback: StraightEdge
}

export function SmartStraightEdge<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(props: EdgeProps<EdgeDataType>) {
	const nodes = useNodes<NodeDataType>()

	return (
		<SmartEdge<EdgeDataType, NodeDataType>
			{...props}
			options={StraightConfiguration}
			nodes={nodes}
		/>
	)
}
