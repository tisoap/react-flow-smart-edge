import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNodes, StraightEdge } from 'reactflow'
import { SmartEdge } from '../SmartEdge'
import {
	svgDrawStraightLinePath,
	pathfindingAStarNoDiagonal
} from '../functions'
import type { GetSmartEdgeOptions } from '../getSmartEdge'
import type { EdgeProps } from 'reactflow'

const StraightConfiguration: GetSmartEdgeOptions = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingAStarNoDiagonal
}

export function SmartStraightEdge<
	EdgeDataType = unknown,
	NodeDataType = unknown
>(props: EdgeProps<EdgeDataType>) {
	const nodes = useNodes<NodeDataType>()

	return (
		<ErrorBoundary fallback={<StraightEdge {...props} />}>
			<SmartEdge<EdgeDataType, NodeDataType>
				{...props}
				options={StraightConfiguration}
				nodes={nodes}
			/>
		</ErrorBoundary>
	)
}
