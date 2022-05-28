import React from 'react'
import type { CustomEdgeProps } from '../index'
import type { EdgeData } from './DummyData'

const size = 40

export function CustomLabel({
	edgeCenterX,
	edgeCenterY,
	id,
	data
}: CustomEdgeProps<EdgeData>) {
	return (
		<foreignObject
			width={size}
			height={size}
			x={edgeCenterX}
			y={edgeCenterY}
			style={{
				background: 'transparent',
				width: '40px',
				height: '40px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '40px'
			}}
			requiredExtensions='http://www.w3.org/1999/xhtml'
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
					alert(`Clicked ${id}`)
					if (data) {
						console.log('Custom field:', data.customField)
					}
				}}
			>
				x
			</button>
		</foreignObject>
	)
}
