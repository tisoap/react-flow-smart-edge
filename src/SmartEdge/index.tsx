import React from 'react'
import { EdgeText, BezierEdge } from 'reactflow'
import { getSmartEdge } from '../getSmartEdge'
import type { GetSmartEdgeOptions } from '../getSmartEdge'
import type { EdgeProps, Node } from 'reactflow'

export type EdgeElement = typeof BezierEdge

export type SmartEdgeOptions = GetSmartEdgeOptions & {
	fallback?: EdgeElement
}

export interface SmartEdgeProps<EdgeDataType = unknown, NodeDataType = unknown>
	extends EdgeProps<EdgeDataType> {
	nodes: Node<NodeDataType>[]
	options: SmartEdgeOptions
}

export function SmartEdge<EdgeDataType = unknown, NodeDataType = unknown>({
	nodes,
	options,
	...edgeProps
}: SmartEdgeProps<EdgeDataType, NodeDataType>) {
	const {
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		style,
		label,
		labelStyle,
		labelShowBg,
		labelBgStyle,
		labelBgPadding,
		labelBgBorderRadius,
		markerEnd,
		markerStart
	} = edgeProps

	const smartResponse = getSmartEdge({
		sourcePosition,
		targetPosition,
		sourceX,
		sourceY,
		targetX,
		targetY,
		options,
		nodes
	})

	const FallbackEdge = options.fallback || BezierEdge

	if (smartResponse === null) {
		return <FallbackEdge {...edgeProps} />
	}

	const { edgeCenterX, edgeCenterY, svgPathString } = smartResponse

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
