import { expect } from '@storybook/jest'
import { within } from '@storybook/testing-library'
import React from 'react'
import { edges1, edges2, nodes1, nodes2 } from './DummyData'
import {
	SimulateDragAndDrop,
	wait,
	getElementClientCenter
} from './SimulateDragAndDrop'
import { Graph } from './TestGraph'
import type { GraphProps } from './TestGraph'
import type { Meta, Story } from '@storybook/react'

export default {
	title: 'SmartEdge',
	component: Graph
} as Meta

const Template: Story<GraphProps> = (args) => <Graph {...args} />

export const DefaultExample = Template.bind({})
DefaultExample.args = {
	defaultNodes: nodes1,
	defaultEdges: edges1
}
DefaultExample.play = async ({ canvasElement }) => {
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

export const SmallExample = Template.bind({})
SmallExample.args = {
	defaultNodes: nodes2,
	defaultEdges: edges2
}
