import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNodes, BezierEdge } from 'reactflow'
import { SmartEdge } from '../SmartEdge'
import { svgDrawSmoothLinePath, pathfindingAStarDiagonal } from '../functions'
import type { GetSmartEdgeOptions } from '../getSmartEdge'
import type { EdgeProps } from 'reactflow'

const BezierConfiguration: GetSmartEdgeOptions = {
	drawEdge: svgDrawSmoothLinePath,
	generatePath: pathfindingAStarDiagonal
}

export function SmartBezierEdge<EdgeDataType = unknown, NodeDataType = unknown>(
	props: EdgeProps<EdgeDataType>
) {
	const nodes = useNodes<NodeDataType>()

	return (
		<ErrorBoundary fallback={<BezierEdge {...props} />}>
			<SmartEdge<EdgeDataType, NodeDataType>
				{...props}
				options={BezierConfiguration}
				nodes={nodes}
			/>
		</ErrorBoundary>
	)
}
