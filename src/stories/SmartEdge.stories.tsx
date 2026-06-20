import { expect, userEvent, waitFor } from "storybook/test";
import { demoRegistry } from "../demos/registry";
import { GraphWrapper } from "../demos/GraphWrapper";
import type { Meta, StoryFn } from "@storybook/react-vite";
import type { DemoGraphProps } from "../demos/registry";

export default {
  title: "Smart Edge",
  component: GraphWrapper,
  parameters: {
    layout: "fullscreen",
  },
} as Meta;

const Template: StoryFn<DemoGraphProps> = (args) => <GraphWrapper {...args} />;

export const SmartBezier = Template.bind({});
SmartBezier.args = demoRegistry.smartBezier;

export const SmartStraight = Template.bind({});
SmartStraight.args = demoRegistry.smartStraight;

export const SmartStep = Template.bind({});
SmartStep.args = demoRegistry.smartStep;

export const SmartStepConfigured = Template.bind({});
SmartStepConfigured.args = demoRegistry.smartStepConfigured;

export const SmartSmoothStep = Template.bind({});
SmartSmoothStep.args = demoRegistry.smartSmoothStep;

export const SmartSmoothStepConfigured = Template.bind({});
SmartSmoothStepConfigured.args = demoRegistry.smartSmoothStepConfigured;

export const SmartBezierWithCustomLabel = Template.bind({});
SmartBezierWithCustomLabel.args = demoRegistry.smartBezierWithCustomLabel;

export const SmartBezierSimple = Template.bind({});
SmartBezierSimple.args = demoRegistry.smartBezierSimple;

export const SmartStepUnaligned = Template.bind({});
SmartStepUnaligned.args = demoRegistry.smartStepUnaligned;

export const SmartStepHorizontal = Template.bind({});
SmartStepHorizontal.args = demoRegistry.smartStepHorizontal;

export const SmartBezierSubFlow = Template.bind({});
SmartBezierSubFlow.args = demoRegistry.smartBezierSubFlow;

export const SmartStepSubFlow = Template.bind({});
SmartStepSubFlow.args = demoRegistry.smartStepSubFlow;

export const SmartBezierSubFlowGroup = Template.bind({});
SmartBezierSubFlowGroup.args = demoRegistry.smartBezierSubFlowGroup;

export const SmartStepSubFlowGroup = Template.bind({});
SmartStepSubFlowGroup.args = demoRegistry.smartStepSubFlowGroup;

export const SmartFloating = Template.bind({});
SmartFloating.args = demoRegistry.smartFloating;

export const SmartFloatingWithConnectionLine = Template.bind({});
SmartFloatingWithConnectionLine.args =
  demoRegistry.smartFloatingWithConnectionLine;

export const SmartBezierWithAvoidArea = Template.bind({});
SmartBezierWithAvoidArea.args = demoRegistry.smartBezierWithAvoidArea;
SmartBezierWithAvoidArea.play = async ({ canvasElement }) => {
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
SmartEditable.args = demoRegistry.smartEditable;
SmartEditable.play = async ({ canvasElement }) => {
  const controlPoints = await waitFor(() => {
    const circles = canvasElement.querySelectorAll<SVGCircleElement>(
      "[data-testid='smart-edge-control-point']",
    );
    if (circles.length === 0) throw new Error("control points not rendered");
    return circles;
  });

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

  const inactivePoint = canvasElement.querySelector<SVGCircleElement>(
    "[data-testid='smart-edge-control-point']:not(.active)",
  );
  if (inactivePoint) {
    await userEvent.click(inactivePoint);
  }

  activePoint.focus();
  await userEvent.keyboard("{Delete}");
};
