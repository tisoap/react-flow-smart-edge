import React from 'react'
import ReactFlow from 'react-flow-renderer'
import {
	edgesBezier,
	edgesStraight,
	edgesStep,
	nodes,
	edgeTypes
} from './DummyData'
import type { Meta, Story } from '@storybook/react'
import type { ReactFlowProps } from 'react-flow-renderer'

export default {
	title: 'Smart Edge',
	component: ReactFlow
} as Meta

const style = {
	background: '#fafafa',
	width: '100%',
	height: 500
}

const Template: Story<ReactFlowProps> = (args) => <ReactFlow {...args} />

export const SmartBezier = Template.bind({})
SmartBezier.args = {
	style,
	edgeTypes,
	defaultNodes: nodes,
	defaultEdges: edgesBezier
}

export const SmartStraight = Template.bind({})
SmartStraight.args = {
	...SmartBezier.args,
	defaultEdges: edgesStraight
}

export const SmartStep = Template.bind({})
SmartStep.args = {
	...SmartBezier.args,
	defaultEdges: edgesStep
}
