import React from 'react';
import { data, data2 } from './dummyData';
import type { Meta, Story } from '@storybook/react';
import { Graph, GraphWithProvider } from './Graph';
import type { GraphProps, GraphWithProviderProps } from './Graph';

export default {
  title: 'SmartEdge',
  component: Graph,
} as Meta;

const Template: Story<GraphProps> = (args) => <Graph {...args} />;

export const DefaultExample = Template.bind({});
DefaultExample.args = {
  elements: data,
};

export const smallExample = Template.bind({});
smallExample.args = {
  elements: data2,
};

const TemplateWithProvider: Story<GraphWithProviderProps> = (args) => (
  <GraphWithProvider {...args} />
);

export const smallerDebounce = TemplateWithProvider.bind({});
smallerDebounce.args = {
  options: {
    debounceTime: 50,
  },
  elements: data,
};

export const noDebounce = TemplateWithProvider.bind({});
noDebounce.args = {
  options: {
    debounceTime: 0,
  },
  elements: data,
};
