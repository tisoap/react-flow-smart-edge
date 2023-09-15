import {
	edgesBezier,
	edgesStraight,
	edgesStep,
	edgesLabel,
	nodes,
	edgeTypes
} from './DummyData'
import { GraphWrapper } from './GraphWrapper'
import type { Meta, StoryObj } from '@storybook/react'

const meta = {
	component: GraphWrapper
} satisfies Meta<typeof GraphWrapper>

type Story = StoryObj<typeof GraphWrapper>

export const SmartBezier = {
	args: {
		edgeTypes,
		defaultNodes: nodes,
		defaultEdges: edgesBezier
	}
} satisfies Story

export const SmartStraight = {
	args: {
		...SmartBezier.args,
		defaultEdges: edgesStraight
	}
} satisfies Story

export const SmartStep = {
	args: {
		...SmartBezier.args,
		defaultEdges: edgesStep
	}
} satisfies Story

export const SmartBezierWithCustomLabel = {
	args: {
		...SmartBezier.args,
		defaultEdges: edgesLabel
	}
} satisfies Story

export default meta
