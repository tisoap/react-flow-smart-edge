import React from 'react'
import {
	edgesBezier,
	edgesStraight,
	edgesStep,
	edgesLabel,
	nodes,
	edgeTypes
} from './DummyData'
import { GraphWrapper } from './GraphWrapper'
import type { Meta, Story } from '@storybook/react'
import type { ReactFlowProps } from 'reactflow'

export default {
	title: 'Smart Edge',
	component: GraphWrapper
} as Meta

const Template: Story<ReactFlowProps> = (args) => <GraphWrapper {...args} />

export const SmartBezier = Template.bind({})
SmartBezier.args = {
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

export const SmartBezierWithCustomLabel = Template.bind({})
SmartBezierWithCustomLabel.args = {
	...SmartBezier.args,
	defaultEdges: edgesLabel
}
