import React from 'react';
import { data } from './dummyData';
import type { Meta, Story } from '@storybook/react';
import { Graph } from './Graph';
import type { GraphProps } from './Graph';

const meta: Meta = {
  title: 'PathFindingEdge',
  component: Graph,
};

export default meta;

const Template: Story<GraphProps> = (args) => <Graph {...args} />;

export const Default = Template.bind({});
Default.args = {
  elements: data,
};
