import { within } from '@storybook/testing-library'
import { GraphWrapper } from './GraphWrapper'
import { SimulateDragAndDrop, wait } from './SimulateDragAndDrop'
import { SmartBezier, SmartStraight, SmartStep } from './SmartEdge.stories'
import type { Meta, StoryObj } from '@storybook/react'

export default {
	component: GraphWrapper,
	argTypes: {
		edgeTypes: { table: { disable: true } },
		defaultNodes: { table: { disable: true } },
		defaultEdges: { table: { disable: true } }
	}
} as Meta

type Story = StoryObj<typeof GraphWrapper>

export const SmartBezierInteraction = {
	args: {
		...SmartBezier.args
	},
	play: async ({ canvasElement }) => {
		await wait(500)
		const canvas = within(canvasElement)
		const node4 = canvas.getByText('Node 4')
		SimulateDragAndDrop(node4, { delta: { x: -300, y: -250 } })
		const node1 = canvas.getByText('Node 1')
		SimulateDragAndDrop(node1, { delta: { x: -250, y: 300 } })
		const node6 = canvas.getByText('Node 6')
		SimulateDragAndDrop(node6, { delta: { x: 250, y: -50 } })
		const node3 = canvas.getByText('Node 3')
		SimulateDragAndDrop(node3, { delta: { x: 300, y: -100 } })
	}
} satisfies Story

export const SmartStraightInteraction = {
	args: {
		...SmartStraight.args
	},
	play: SmartBezierInteraction.play
} satisfies Story

export const SmartStepInteraction = {
	args: {
		...SmartStep.args
	},
	play: SmartBezierInteraction.play
} satisfies Story
