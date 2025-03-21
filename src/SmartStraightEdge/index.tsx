import { StraightEdge, useNodes } from '@xyflow/react'
import React from 'react'
import { SmartEdge } from '../SmartEdge'
import {
	pathfindingAStarNoDiagonal,
	svgDrawStraightLinePath
} from '../functions'
import type { SmartEdgeOptions } from '../SmartEdge'
import type { Edge, EdgeProps, Node } from '@xyflow/react'

const StraightConfiguration: SmartEdgeOptions = {
	drawEdge: svgDrawStraightLinePath,
	generatePath: pathfindingAStarNoDiagonal,
	fallback: StraightEdge
}

export function SmartStraightEdge<
	EdgeDataType extends Edge = Edge,
	NodeDataType extends Node = Node
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
