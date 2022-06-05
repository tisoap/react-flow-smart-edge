import React from 'react'
import { useNodes, BezierEdge } from 'react-flow-renderer'
import { SmartEdge } from '../SmartEdge'
import { svgDrawSmoothLinePath, pathfindingAStarDiagonal } from '../functions'
import type { SmartEdgeOptions } from '../SmartEdge'
import type { EdgeProps } from 'react-flow-renderer'

const BezierConfiguration: SmartEdgeOptions = {
	drawEdge: svgDrawSmoothLinePath,
	generatePath: pathfindingAStarDiagonal,
	fallback: BezierEdge
}

export function SmartBezierEdge<EdgeDataType = unknown, NodeDataType = unknown>(
	props: EdgeProps<EdgeDataType>
) {
	const nodes = useNodes<NodeDataType>()

	return (
		<SmartEdge<EdgeDataType, NodeDataType>
			{...props}
			options={BezierConfiguration}
			nodes={nodes}
		/>
	)
}
