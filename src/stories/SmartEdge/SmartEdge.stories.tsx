import React from 'react'
import { Graph, GraphWithProvider } from './Graph'
import { data, data2 } from './dummyData'
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
	elements: data
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
	options: {
		...defaultOptions,
		lineType: 'straight'
	},
	elements: data
}

export const StraightLinesWithLessCorners = TemplateWithProvider.bind({})
StraightLinesWithLessCorners.args = {
	options: {
		...defaultOptions,
		lineType: 'straight',
		lessCorners: true
	},
	elements: data
}

export const SmallerDebounce = TemplateWithProvider.bind({})
SmallerDebounce.args = {
	options: {
		...defaultOptions,
		debounceTime: 50
	},
	elements: data
}

export const NoDebounce = TemplateWithProvider.bind({})
NoDebounce.args = {
	options: {
		...defaultOptions,
		debounceTime: 0
	},
	elements: data
}

export const BiggerNodePadding = TemplateWithProvider.bind({})
BiggerNodePadding.args = {
	options: {
		...defaultOptions,
		nodePadding: 20
	},
	elements: data
}

export const SmallerNodePadding = TemplateWithProvider.bind({})
SmallerNodePadding.args = {
	options: {
		...defaultOptions,
		nodePadding: 8
	},
	elements: data
}

export const BiggerGridRatio = TemplateWithProvider.bind({})
BiggerGridRatio.args = {
	options: {
		...defaultOptions,
		gridRatio: 15
	},
	elements: data
}

export const SmallerGridRatio = TemplateWithProvider.bind({})
SmallerGridRatio.args = {
	options: {
		...defaultOptions,
		gridRatio: 6
	},
	elements: data
}

export const SmallExample = Template.bind({})
SmallExample.args = {
	elements: data2
}
