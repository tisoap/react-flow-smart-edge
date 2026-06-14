import { expect, userEvent, waitFor, within } from "storybook/test";
import {
  createSmartEdge,
  svgDrawSmoothStepLinePath,
  SmartFloatingConnectionLine,
} from "../index";
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
  floatingNodes,
  floatingEdges,
  avoidAreaNodes,
  avoidAreaEdgesBezier,
  demoAvoidAreas,
  editableNodes,
  editableEdges,
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

export const SmartFloating = Template.bind({});
SmartFloating.args = {
  edgeTypes,
  defaultNodes: floatingNodes,
  defaultEdges: floatingEdges,
  smartEdgeDebug: false,
};

export const SmartFloatingWithConnectionLine = Template.bind({});
SmartFloatingWithConnectionLine.args = {
  edgeTypes,
  defaultNodes: floatingNodes,
  defaultEdges: floatingEdges,
  connectionLineComponent: SmartFloatingConnectionLine,
  smartEdgeDebug: false,
};

const avoidAreaEdgeTypes = {
  smartBezierAvoid: createSmartEdge("bezier", { avoidAreas: demoAvoidAreas }),
};

export const SmartBezierWithAvoidArea = Template.bind({});
SmartBezierWithAvoidArea.args = {
  edgeTypes: avoidAreaEdgeTypes,
  defaultNodes: avoidAreaNodes,
  defaultEdges: avoidAreaEdgesBezier,
  smartEdgeDebug: true,
};
SmartBezierWithAvoidArea.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement);

  // The consumer-provided avoid area is visualized by the debug overlay.
  const areas = await waitFor(() =>
    canvas.getAllByTestId("smart-edge-avoid-area"),
  );
  await expect(areas).toHaveLength(demoAvoidAreas.length);

  // The smart edge renders an SVG path (i.e. it did not fall back on error).
  const edgePath = await waitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      ".react-flow__edge-path",
    );
    if (!path) throw new Error("edge path not rendered yet");
    return path;
  });
  await expect(edgePath.getAttribute("d")).toBeTruthy();
};

export const SmartEditable = Template.bind({});
SmartEditable.args = {
  edgeTypes,
  defaultNodes: editableNodes,
  defaultEdges: editableEdges,
  smartEdgeDebug: false,
};
SmartEditable.play = async ({ canvasElement }) => {
  // The edge is seeded as selected, so its control points render immediately.
  const controlPoints = await waitFor(() => {
    const circles = canvasElement.querySelectorAll<SVGCircleElement>(
      "[data-testid='smart-edge-control-point']",
    );
    if (circles.length === 0) throw new Error("control points not rendered");
    return circles;
  });

  // One active waypoint plus an inactive insert point on each side.
  await expect(controlPoints.length).toBeGreaterThanOrEqual(3);

  const activePoint = canvasElement.querySelector<SVGCircleElement>(
    "circle.active[data-testid='smart-edge-control-point']",
  );
  if (!activePoint) throw new Error("active control point not found");

  const edgePath = canvasElement.querySelector<SVGPathElement>(
    ".react-flow__edge-path",
  );
  if (!edgePath) throw new Error("edge path not rendered");
  const initialPath = edgePath.getAttribute("d");

  // Nudging the active waypoint with the keyboard re-routes the edge, so the
  // rendered path changes.
  await userEvent.click(activePoint);
  await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");

  await waitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      ".react-flow__edge-path",
    );
    if (!path) throw new Error("edge path not rendered");
    if (path.getAttribute("d") === initialPath) {
      throw new Error("edge path did not change after moving the waypoint");
    }
  });
};
