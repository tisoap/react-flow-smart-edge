import React from 'react'
import { useNodes } from 'react-flow-renderer'
import { getSmartEdge } from '../getSmartEdge'
import type { EdgeData, NodeData } from './DummyData'
import type { EdgeProps } from 'react-flow-renderer'

const size = 20

export function SmartEdgeCustomLabel({
	id,
	sourcePosition,
	targetPosition,
	sourceX,
	sourceY,
	targetX,
	targetY,
	style,
	markerStart,
	markerEnd
}: EdgeProps<EdgeData>) {
	const nodes = useNodes<NodeData>()

	const { edgeCenterX, edgeCenterY, svgPathString } = getSmartEdge({
		sourcePosition,
		targetPosition,
		sourceX,
		sourceY,
		targetX,
		targetY,
		nodes
	})

	return (
		<>
			<path
				style={style}
				className='react-flow__edge-path'
				d={svgPathString}
				markerEnd={markerEnd}
				markerStart={markerStart}
			/>
			<foreignObject
				width={size}
				height={size}
				x={edgeCenterX - size / 2}
				y={edgeCenterY - size / 2}
				style={{
					background: 'transparent',
					width: 'minContent',
					height: 'minContent',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '40px'
				}}
				requiredExtensions='http://www.w3.org/1999/xhtml'
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						flexDirection: 'column'
					}}
				>
					<button
						style={{
							width: '20px',
							height: '20px',
							background: '#eee',
							border: '1px solid #fff',
							cursor: 'pointer',
							borderRadius: '50%',
							fontSize: '12px',
							lineHeight: '1'
						}}
						onClick={() => {
							alert(`Clicked on edge with id ${id}`)
						}}
					>
						x
					</button>
				</div>
			</foreignObject>
		</>
	)
}
