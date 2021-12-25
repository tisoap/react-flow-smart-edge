import React from 'react';
import { data, data2 } from './dummyData';
import { Graph, GraphWithProvider } from './Graph';
import type { Meta, Story } from '@storybook/react';
import type { GraphProps, GraphWithProviderProps } from './Graph';
import type { SmartEdgeOptions } from '../../src/SmartEdge/context';

export default {
  title: 'SmartEdge',
  component: Graph,
} as Meta;

const Template: Story<GraphProps> = (args) => <Graph {...args} />;

export const DefaultExample = Template.bind({});
DefaultExample.args = {
  elements: data,
};

const TemplateWithProvider: Story<GraphWithProviderProps> = (args) => (
  <GraphWithProvider {...args} />
);

const defaultOptions: SmartEdgeOptions = {
  debounceTime: 200,
  nodePadding: 10,
  gridRatio: 10,
  lineType: 'curve',
  lessCorners: false,
};

export const straightLines = TemplateWithProvider.bind({});
straightLines.args = {
  options: {
    ...defaultOptions,
    lineType: 'straight',
  },
  elements: data,
};

export const straightLinesWithLessCorners = TemplateWithProvider.bind({});
straightLinesWithLessCorners.args = {
  options: {
    ...defaultOptions,
    lineType: 'straight',
    lessCorners: true,
  },
  elements: data,
};

export const smallerDebounce = TemplateWithProvider.bind({});
smallerDebounce.args = {
  options: {
    ...defaultOptions,
    debounceTime: 50,
  },
  elements: data,
};

export const noDebounce = TemplateWithProvider.bind({});
noDebounce.args = {
  options: {
    ...defaultOptions,
    debounceTime: 0,
  },
  elements: data,
};

export const biggerNodePadding = TemplateWithProvider.bind({});
biggerNodePadding.args = {
  options: {
    ...defaultOptions,
    nodePadding: 20,
  },
  elements: data,
};

export const smallerNodePadding = TemplateWithProvider.bind({});
smallerNodePadding.args = {
  options: {
    ...defaultOptions,
    nodePadding: 8,
  },
  elements: data,
};

export const biggerGridRatio = TemplateWithProvider.bind({});
biggerGridRatio.args = {
  options: {
    ...defaultOptions,
    gridRatio: 15,
  },
  elements: data,
};

export const smallerGridRatio = TemplateWithProvider.bind({});
smallerGridRatio.args = {
  options: {
    ...defaultOptions,
    gridRatio: 6,
  },
  elements: data,
};

export const smallExample = Template.bind({});
smallExample.args = {
  elements: data2,
};
