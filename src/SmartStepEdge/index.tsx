import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useNodes, StepEdge } from 'reactflow'
import { SmartEdge } from '../SmartEdge'
import {
	svgDrawStraightLinePath,
	pathfindingJumpPointNoDiagonal
} from '../functions'
import type { GetSmartEdgeOptions } from '../getSmartEdge'
import type { EdgeProps } from 'reactflow'

const StepConfiguration: GetSmartEdgeOptions = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingJumpPointNoDiagonal
}

export function SmartStepEdge<EdgeDataType = unknown, NodeDataType = unknown>(
	props: EdgeProps<EdgeDataType>
) {
	const nodes = useNodes<NodeDataType>()

	return (
		<ErrorBoundary fallback={<StepEdge {...props} />}>
			<SmartEdge<EdgeDataType, NodeDataType>
				{...props}
				options={StepConfiguration}
				nodes={nodes}
			/>
		</ErrorBoundary>
	)
}
