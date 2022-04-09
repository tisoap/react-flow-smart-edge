import { within } from '@storybook/testing-library'
import React from 'react'
import {
	edges1Bezier,
	edges1Straight,
	edges1Mixed,
	edges2Bezier,
	nodes1,
	nodes2
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
	defaultNodes: nodes1,
	defaultEdges: edges1Bezier
}
SmartBezier.play = dragElementRandomly

export const SmartStraight = Template.bind({})
SmartStraight.args = {
	defaultNodes: nodes1,
	defaultEdges: edges1Straight
}
SmartStraight.play = dragElementRandomly

export const MixedSmartEdges = Template.bind({})
MixedSmartEdges.args = {
	defaultNodes: nodes1,
	defaultEdges: edges1Mixed
}
MixedSmartEdges.play = dragElementRandomly

export const SmallExample = Template.bind({})
SmallExample.args = {
	defaultNodes: nodes2,
	defaultEdges: edges2Bezier
}
