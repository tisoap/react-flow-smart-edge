import { createSmartEdge, svgDrawSmoothStepLinePath } from "../index";
import {
  edgesBezier,
  edgesStraight,
  edgesStep,
  edgesSmoothStep,
  edgesLabel,
  nodes,
  edgeTypes,
  simpleNodes,
  simpleEdgesBezier,
  unalignedNodes,
  unalignedEdgesStep,
  horizontalNodes,
  horizontalEdgesStep,
  subFlowNodes,
  subFlowEdgesBezier,
  subFlowEdgesStep,
  subFlowGroupNodes,
  subFlowGroupEdgesBezier,
  subFlowGroupEdgesStep,
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

const configuredEdgeTypes = {
  smartStep: createSmartEdge("step", { gridRatio: 5 }),
};

export const SmartStepConfigured = Template.bind({});
SmartStepConfigured.args = {
  edgeTypes: configuredEdgeTypes,
  defaultNodes: nodes,
  defaultEdges: edgesStep,
  smartEdgeDebug: true,
};

export const SmartSmoothStep = Template.bind({});
SmartSmoothStep.args = {
  ...SmartBezier.args,
  defaultEdges: edgesSmoothStep,
};

const configuredSmoothStepEdgeTypes = {
  smartSmoothStep: createSmartEdge("smoothstep", {
    drawEdge: svgDrawSmoothStepLinePath({ borderRadius: 20 }),
  }),
};

export const SmartSmoothStepConfigured = Template.bind({});
SmartSmoothStepConfigured.args = {
  edgeTypes: configuredSmoothStepEdgeTypes,
  defaultNodes: nodes,
  defaultEdges: edgesSmoothStep,
  smartEdgeDebug: true,
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

export const SmartBezierSubFlow = Template.bind({});
SmartBezierSubFlow.args = {
  edgeTypes,
  defaultNodes: subFlowNodes,
  defaultEdges: subFlowEdgesBezier,
  smartEdgeDebug: false,
};

export const SmartStepSubFlow = Template.bind({});
SmartStepSubFlow.args = {
  edgeTypes,
  defaultNodes: subFlowNodes,
  defaultEdges: subFlowEdgesStep,
  smartEdgeDebug: false,
};

export const SmartBezierSubFlowGroup = Template.bind({});
SmartBezierSubFlowGroup.args = {
  edgeTypes,
  defaultNodes: subFlowGroupNodes,
  defaultEdges: subFlowGroupEdgesBezier,
  smartEdgeDebug: false,
};

export const SmartStepSubFlowGroup = Template.bind({});
SmartStepSubFlowGroup.args = {
  edgeTypes,
  defaultNodes: subFlowGroupNodes,
  defaultEdges: subFlowGroupEdgesStep,
  smartEdgeDebug: false,
};
