import { StepEdge, useNodes } from '@xyflow/react'
import React from 'react'
import { SmartEdge } from '../SmartEdge'
import {
	pathfindingJumpPointNoDiagonal,
	svgDrawStraightLinePath
} from '../functions'
import type { SmartEdgeOptions } from '../SmartEdge'
import type { Edge, EdgeProps, Node } from '@xyflow/react'

const StepConfiguration: SmartEdgeOptions = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingJumpPointNoDiagonal,
	// @ts-expect-error error with bezieredge?
	fallback: StepEdge
}

export function SmartStepEdge<
	EdgeDataType extends Edge = Edge,
	NodeDataType extends Node = Node
>(props: EdgeProps<EdgeDataType>) {
	const nodes = useNodes<NodeDataType>()

	return (
		<SmartEdge<EdgeDataType, NodeDataType>
			{...props}
			options={StepConfiguration}
			nodes={nodes}
		/>
	)
}
