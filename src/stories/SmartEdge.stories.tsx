import { expect } from '@storybook/jest'
import { within } from '@storybook/testing-library'
import React from 'react'
import {
	edges1Bezier,
	edges1Straight,
	edges2Bezier,
	nodes1,
	nodes2
} from './DummyData'
import {
	SimulateDragAndDrop,
	wait,
	getElementClientCenter
} from './SimulateDragAndDrop'
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

const dragElementTest = async ({ canvasElement }: PlayFunctionProps) => {
	const dragX = 200
	const dragY = 100

	await wait(500)
	const canvas = within(canvasElement)
	const node = canvas.getByText('Node 1')
	const currentCenter = getElementClientCenter(node)

	await SimulateDragAndDrop(node, { delta: { x: dragX, y: dragY } })
	const newCenter = getElementClientCenter(node)

	await expect(newCenter).toEqual({
		x: currentCenter.x + dragX,
		y: currentCenter.y + dragY
	})
}

const Template: Story<GraphProps> = (args) => <Graph {...args} />

export const SmartBezier = Template.bind({})
SmartBezier.args = {
	defaultNodes: nodes1,
	defaultEdges: edges1Bezier
}
SmartBezier.play = dragElementTest

export const SmartStraight = Template.bind({})
SmartStraight.args = {
	defaultNodes: nodes1,
	defaultEdges: edges1Straight
}
SmartStraight.play = dragElementTest

export const SmallExample = Template.bind({})
SmallExample.args = {
	defaultNodes: nodes2,
	defaultEdges: edges2Bezier
}
