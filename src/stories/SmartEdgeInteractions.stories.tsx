import { within } from '@storybook/testing-library'
import React from 'react'
import ReactFlow from 'react-flow-renderer'
import { SimulateDragAndDrop, wait } from './SimulateDragAndDrop'
import {
	SmartBezier,
	SmartStraight,
	SmartStep,
	CustomBezier,
	CustomStraight
} from './SmartEdge.stories'
import type { Meta, Story } from '@storybook/react'
import type { ReactFlowProps } from 'react-flow-renderer'

export default {
	title: 'Interactions',
	component: ReactFlow,
	argTypes: {
		edgeTypes: { table: { disable: true } },
		defaultNodes: { table: { disable: true } },
		defaultEdges: { table: { disable: true } }
	}
} as Meta

const Template: Story<ReactFlowProps> = (args) => <ReactFlow {...args} />

export const SmartBezierInteraction = Template.bind({})
SmartBezierInteraction.args = SmartBezier.args
SmartBezierInteraction.play = async ({ canvasElement }) => {
	await wait(500)
	const canvas = within(canvasElement)
	const node4 = canvas.getByText('Node 4')
	await SimulateDragAndDrop(node4, { delta: { x: -300, y: -250 } })
	const node1 = canvas.getByText('Node 1')
	await SimulateDragAndDrop(node1, { delta: { x: -250, y: 300 } })
	const node6 = canvas.getByText('Node 6')
	await SimulateDragAndDrop(node6, { delta: { x: 250, y: -50 } })
	const node3 = canvas.getByText('Node 3')
	await SimulateDragAndDrop(node3, { delta: { x: 300, y: -100 } })
}

export const SmartStraightInteraction = Template.bind({})
SmartStraightInteraction.args = SmartStraight.args
SmartStraightInteraction.play = SmartBezierInteraction.play

export const SmartStepInteraction = Template.bind({})
SmartStepInteraction.args = SmartStep.args
SmartStepInteraction.play = SmartBezierInteraction.play

export const CustomBezierInteraction = Template.bind({})
CustomBezierInteraction.args = CustomBezier.args
CustomBezierInteraction.play = SmartBezierInteraction.play

export const CustomStraightInteraction = Template.bind({})
CustomStraightInteraction.args = CustomStraight.args
CustomStraightInteraction.play = SmartBezierInteraction.play
