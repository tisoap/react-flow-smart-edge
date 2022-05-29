import React from 'react'
import { EdgeText } from 'react-flow-renderer'
import { getSmartEdge } from '../getSmartEdge'
import type { GetSmartEdgeOptions } from '../getSmartEdge'
import type { EdgeProps, Node } from 'react-flow-renderer'

export interface SmartEdgeProps<EdgeDataType = unknown, NodeDataType = unknown>
	extends EdgeProps<EdgeDataType> {
	nodes: Node<NodeDataType>[]
	options: GetSmartEdgeOptions
}

export function SmartEdge<EdgeDataType = unknown, NodeDataType = unknown>({
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
	style,
	nodes,
	label,
	labelStyle,
	labelShowBg,
	labelBgStyle,
	labelBgPadding,
	labelBgBorderRadius,
	markerEnd,
	markerStart,
	options
}: SmartEdgeProps<EdgeDataType, NodeDataType>) {
	const { edgeCenterX, edgeCenterY, svgPathString } = getSmartEdge({
		sourcePosition,
		targetPosition,
		sourceX,
		sourceY,
		targetX,
		targetY,
		options,
		nodes
	})

	let edgeLabel: JSX.Element | null = null
	const hasStringLabel = !!label && typeof label === 'string'

	if (hasStringLabel) {
		edgeLabel = (
			<EdgeText
				x={edgeCenterX}
				y={edgeCenterY}
				label={label}
				labelStyle={labelStyle}
				labelShowBg={labelShowBg}
				labelBgStyle={labelBgStyle}
				labelBgPadding={labelBgPadding}
				labelBgBorderRadius={labelBgBorderRadius}
			/>
		)
	}

	return (
		<>
			<path
				style={style}
				className='react-flow__edge-path'
				d={svgPathString}
				markerEnd={markerEnd}
				markerStart={markerStart}
			/>
			{edgeLabel}
		</>
	)
}

export type SmartEdgeFunction = typeof SmartEdge
