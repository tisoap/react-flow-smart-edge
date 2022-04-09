import { within } from '@storybook/testing-library'
import React from 'react'
import {
	edges1Bezier,
	edges1Straight,
	edges1Step,
	edges1Random,
	edges1CustomBezier,
	edges1CustomStraight,
	edges2Bezier,
	nodes1,
	nodes2,
	edgeTypes
} from './DummyData'
import { SimulateDragAndDrop, wait } from './SimulateDragAndDrop'
import { Graph } from './TestGraph'
import type { GraphProps } from './TestGraph'
import type { Meta, Story } from '@storybook/react'

export default {
	title: 'React Flow Smart Edge',
	component: Graph
} as Meta

interface PlayFunctionProps {
	canvasElement: HTMLElement
}

const dragElementRandomly = async ({ canvasElement }: PlayFunctionProps) => {
	// Selects a random integer between -300 and 300
	const random = () => Math.floor(Math.random() * 600 - 300)
	const dragX = random()
	const dragY = random()

	await wait(500)
	const canvas = within(canvasElement)
	const node = canvas.getByText('Node 2b')

	await SimulateDragAndDrop(node, { delta: { x: dragX, y: dragY } })
}

const Template: Story<GraphProps> = (args) => <Graph {...args} />

export const SmartBezier = Template.bind({})
SmartBezier.args = {
	edgeTypes,
	defaultNodes: nodes1,
	defaultEdges: edges1Bezier
}

export const SmartBezierWithInteraction = Template.bind({})
SmartBezierWithInteraction.args = {
	...SmartBezier.args
}
SmartBezierWithInteraction.play = dragElementRandomly

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

export const MixedRandomSmartEdges = Template.bind({})
MixedRandomSmartEdges.args = {
	...SmartBezier.args,
	defaultEdges: edges1Random
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

export const SmallExample = Template.bind({})
SmallExample.args = {
	edgeTypes,
	defaultNodes: nodes2,
	defaultEdges: edges2Bezier
}
