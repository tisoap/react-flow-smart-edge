import {
  edgesBezier,
  edgesStraight,
  edgesStep,
  edgesLabel,
  nodes,
  edgeTypes,
  simpleNodes,
  simpleEdgesBezier,
  unalignedNodes,
  unalignedEdgesStep,
  horizontalNodes,
  horizontalEdgesStep,
} from "./DummyData";
import { GraphWrapper } from "./GraphWrapper";
import type { Meta, StoryFn } from "@storybook/react-vite";
import type { ReactFlowProps } from "@xyflow/react";

export default {
  title: "Smart Edge",
  component: GraphWrapper,
  argTypes: {
    smartEdgeDebug: {
      control: { type: "boolean" },
      defaultValue: false,
      description: "Enable SmartEdge debug logging",
      table: { category: "Debug" },
    },
  },
  parameters: {
    layout: "fullscreen",
  },
} as Meta;

const Template: StoryFn<ReactFlowProps & { smartEdgeDebug?: boolean }> = (
  args,
) => <GraphWrapper {...args} />;

export const SmartBezier = Template.bind({});
SmartBezier.args = {
  edgeTypes,
  defaultNodes: nodes,
  defaultEdges: edgesBezier,
  smartEdgeDebug: false,
};

export const SmartStraight = Template.bind({});
SmartStraight.args = {
  ...SmartBezier.args,
  defaultEdges: edgesStraight,
};

export const SmartStep = Template.bind({});
SmartStep.args = {
  ...SmartBezier.args,
  defaultEdges: edgesStep,
};

export const SmartBezierWithCustomLabel = Template.bind({});
SmartBezierWithCustomLabel.args = {
  ...SmartBezier.args,
  defaultEdges: edgesLabel,
};

export const SmartBezierSimple = Template.bind({});
SmartBezierSimple.args = {
  edgeTypes,
  defaultNodes: simpleNodes,
  defaultEdges: simpleEdgesBezier,
  smartEdgeDebug: false,
};

export const SmartStepUnaligned = Template.bind({});
SmartStepUnaligned.args = {
  edgeTypes,
  defaultNodes: unalignedNodes,
  defaultEdges: unalignedEdgesStep,
  smartEdgeDebug: false,
};

export const SmartStepHorizontal = Template.bind({});
SmartStepHorizontal.args = {
  edgeTypes,
  defaultNodes: horizontalNodes,
  defaultEdges: horizontalEdgesStep,
  smartEdgeDebug: false,
};
