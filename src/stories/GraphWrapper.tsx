import React from 'react'
import { ReactFlow } from 'reactflow'
import type { ReactFlowProps } from 'reactflow'

const style = {
	background: '#fafafa',
	width: '100%',
	height: '500px'
}

export type GraphWrapperProps = Pick<
	ReactFlowProps,
	'edgeTypes' | 'defaultNodes' | 'defaultEdges'
>

export const GraphWrapper = (args: GraphWrapperProps) => (
	<div style={style}>
		<ReactFlow {...args} />
	</div>
)
