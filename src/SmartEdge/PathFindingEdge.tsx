import React from 'react'
import { EdgeText } from 'react-flow-renderer'
import { getSmartEdge } from '../getSmartEdge'
import type { SVGDrawFunction, PathFindingFunction } from '../functions'
import type { EdgeProps, Node, BezierEdge } from 'react-flow-renderer'

/**
 * Any valid Edge component from react-flow-renderer
 */
export type EdgeComponent = typeof BezierEdge

export interface SmartEdgeOptions {
	debounceTime: number
	nodePadding: number
	gridRatio: number
}

export interface SmartEdgeAdvancedOptions extends SmartEdgeOptions {
	drawEdge: SVGDrawFunction
	generatePath: PathFindingFunction
}

export interface PathFindingEdgeProps<
	EdgeDataType = unknown,
	NodeDataType = unknown
> extends EdgeProps<EdgeDataType> {
	storeNodes: Node<NodeDataType>[]
	options: SmartEdgeAdvancedOptions
}

export interface CustomEdgeProps<EdgeDataType = unknown>
	extends EdgeProps<EdgeDataType> {
	edgeCenterX: number
	edgeCenterY: number
}

export function PathFindingEdge<EdgeDataType = unknown, NodeDataType = unknown>(
	props: PathFindingEdgeProps<EdgeDataType, NodeDataType>
) {
	const {
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		style,
		storeNodes,
		label,
		labelStyle,
		labelShowBg,
		labelBgStyle,
		labelBgPadding,
		labelBgBorderRadius,
		markerEnd,
		markerStart,
		options
	} = props

	const { edgeCenterX, edgeCenterY, svgPathString } = getSmartEdge({
		sourcePosition,
		targetPosition,
		sourceX,
		sourceY,
		targetX,
		targetY,
		options,
		nodes: storeNodes
	})

	let edgeLabel = null
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
