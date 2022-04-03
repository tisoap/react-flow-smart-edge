import React from 'react'
import { Graph, GraphWithProvider } from './Graph'
import { edges1, edges2, nodes1, nodes2 } from './dummyData'
import type { GraphProps, GraphWithProviderProps } from './Graph'
import type { Meta, Story } from '@storybook/react'
import type { SmartEdgeOptions } from 'SmartEdge/context'

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

const TemplateWithProvider: Story<GraphWithProviderProps> = (args) => (
	<GraphWithProvider {...args} />
)

const defaultOptions: SmartEdgeOptions = {
	debounceTime: 200,
	nodePadding: 10,
	gridRatio: 10,
	lineType: 'curve',
	lessCorners: false
}

export const StraightLines = TemplateWithProvider.bind({})
StraightLines.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		lineType: 'straight'
	}
}

export const StraightLinesWithLessCorners = TemplateWithProvider.bind({})
StraightLinesWithLessCorners.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		lineType: 'straight',
		lessCorners: true
	}
}

export const SmallerDebounce = TemplateWithProvider.bind({})
SmallerDebounce.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		debounceTime: 50
	}
}

export const NoDebounce = TemplateWithProvider.bind({})
NoDebounce.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		debounceTime: 0
	}
}

export const BiggerNodePadding = TemplateWithProvider.bind({})
BiggerNodePadding.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		nodePadding: 20
	}
}

export const SmallerNodePadding = TemplateWithProvider.bind({})
SmallerNodePadding.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		nodePadding: 8
	}
}

export const BiggerGridRatio = TemplateWithProvider.bind({})
BiggerGridRatio.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		gridRatio: 15
	}
}

export const SmallerGridRatio = TemplateWithProvider.bind({})
SmallerGridRatio.args = {
	...DefaultExample.args,
	options: {
		...defaultOptions,
		gridRatio: 6
	}
}

export const SmallExample = Template.bind({})
SmallExample.args = {
	defaultNodes: nodes2,
	defaultEdges: edges2
}
