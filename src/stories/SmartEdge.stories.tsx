import React from 'react'
import ReactFlow from 'react-flow-renderer'
import {
	edges1Bezier,
	edges1Straight,
	edges1Step,
	edges1CustomBezier,
	edges1CustomStraight,
	nodes1,
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
	defaultNodes: nodes1,
	defaultEdges: edges1Bezier
}

export const SmartStraight = Template.bind({})
SmartStraight.args = {
	...SmartBezier.args,
	defaultEdges: edges1Straight
}

export const SmartStep = Template.bind({})
SmartStep.args = {
	...SmartBezier.args,
	defaultEdges: edges1Step
}

export const CustomBezier = Template.bind({})
CustomBezier.args = {
	...SmartBezier.args,
	defaultEdges: edges1CustomBezier
}

export const CustomStraight = Template.bind({})
CustomStraight.args = {
	...SmartBezier.args,
	defaultEdges: edges1CustomStraight
}
