import React from 'react'

const foreignObjectWidth = 70
const foreignObjectHeight = 50

const CustomLabel = (props: { label: Node | string }) => {
	const { label } = props
	return (
		<foreignObject
			width={foreignObjectWidth}
			height={foreignObjectHeight}
			x={-foreignObjectWidth / 2}
			y={-foreignObjectHeight / 2}
			className='edgebutton-foreignobject'
			requiredExtensions='http://www.w3.org/1999/xhtml'
		>
			<div style={{ position: 'relative' }}>
				<div style={{ width: '85%', fontSize: '11px', marginTop: '10px' }}>
					{label}
				</div>
				<button
					style={{
						position: 'absolute',
						top: '-10px',
						right: '5px',
						borderRadius: '50%',
						fontSize: '10px',
						padding: '1px 4px',
						cursor: 'pointer'
					}}
				>
					x
				</button>
			</div>
		</foreignObject>
	)
}

export default CustomLabel
