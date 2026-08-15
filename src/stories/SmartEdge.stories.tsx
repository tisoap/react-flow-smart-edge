import { demoRegistry } from "../demos/registry";
import { GraphWrapper } from "../demos/GraphWrapper";
import {
  demoStoryPlay,
  dragSmartConnectionPreview,
  expectArcHops,
  expectBezierCurves,
  expectCubicBezierCurves,
  expectCustomLabelButtons,
  expectDemoGraph,
  expectEdgePaths,
  expectPathAvoidsRect,
  expectStraightOrStepPaths,
} from "./storyPlayHelpers";
import { interactWithEditableEdge } from "./storyEditablePlay";
import { demoAvoidAreas } from "../demos/DummyData";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Smart Edge",
  component: GraphWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GraphWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SmartBezier: Story = {
  args: demoRegistry.smartBezier,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectBezierCurves(canvasElement);
  }),
};

export const SmartStraight: Story = {
  args: demoRegistry.smartStraight,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartStep: Story = {
  args: demoRegistry.smartStep,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartStepConfigured: Story = {
  args: demoRegistry.smartStepConfigured,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartSmoothStep: Story = {
  args: demoRegistry.smartSmoothStep,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectEdgePaths(canvasElement, { exact: 9 });
  }),
};

export const SmartSmoothStepConfigured: Story = {
  args: demoRegistry.smartSmoothStepConfigured,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectEdgePaths(canvasElement, { exact: 9 });
  }),
};

export const SmartSimpleBezier: Story = {
  args: demoRegistry.smartSimpleBezier,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectCubicBezierCurves(canvasElement);
  }),
};

export const SmartBezierWithCustomLabel: Story = {
  args: demoRegistry.smartBezierWithCustomLabel,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 9 },
    });
    await expectCustomLabelButtons(canvasElement, { exact: 9 });
  }),
};

export const SmartBezierSimple: Story = {
  args: demoRegistry.smartBezierSimple,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });
    await expectBezierCurves(canvasElement);
  }),
};

export const SmartStepUnaligned: Story = {
  args: demoRegistry.smartStepUnaligned,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 4 },
      edgeCount: { exact: 3 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartStepHorizontal: Story = {
  args: demoRegistry.smartStepHorizontal,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 3 },
      edgeCount: { exact: 2 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartBezierSubFlow: Story = {
  args: demoRegistry.smartBezierSubFlow,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 8 },
      edgeCount: { exact: 7 },
    });
    await expectBezierCurves(canvasElement);
  }),
};

export const SmartStepSubFlow: Story = {
  args: demoRegistry.smartStepSubFlow,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 8 },
      edgeCount: { exact: 7 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartBezierSubFlowGroup: Story = {
  args: demoRegistry.smartBezierSubFlowGroup,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 8 },
      edgeCount: { exact: 5 },
    });
    await expectBezierCurves(canvasElement);
  }),
};

export const SmartStepSubFlowGroup: Story = {
  args: demoRegistry.smartStepSubFlowGroup,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 8 },
      edgeCount: { exact: 5 },
    });
    await expectStraightOrStepPaths(canvasElement);
  }),
};

export const SmartFloating: Story = {
  args: demoRegistry.smartFloating,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 6 },
    });
    await expectBezierCurves(canvasElement);
  }),
};

export const SmartFloatingWithConnectionLine: Story = {
  args: demoRegistry.smartFloatingWithConnectionLine,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 6 },
    });
    await dragSmartConnectionPreview(canvasElement, "f-hub");
  }),
};

export const SmartBezierWithAvoidArea: Story = {
  args: demoRegistry.smartBezierWithAvoidArea,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });

    const [avoidArea] = demoAvoidAreas;
    await expectPathAvoidsRect(canvasElement, avoidArea);
  }),
};

export const SmartEditable: Story = {
  args: demoRegistry.smartEditable,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 6 },
      edgeCount: { exact: 1 },
    });
    await interactWithEditableEdge(canvasElement);
  }),
};

export const SmartCheckpoint: Story = {
  args: demoRegistry.smartCheckpoint,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 6 },
      edgeCount: { exact: 1 },
    });

    await expectPathAvoidsRect(canvasElement, {
      x: 300,
      y: 200,
      width: 100,
      height: 100,
    });
  }),
};

export const SmartStepHop: Story = {
  args: demoRegistry.smartStepHop,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 4 },
      edgeCount: { exact: 2 },
    });
    await expectArcHops(canvasElement);
  }),
};

export const SmartSmoothStepHop: Story = {
  args: demoRegistry.smartSmoothStepHop,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 4 },
      edgeCount: { exact: 2 },
    });
    await expectArcHops(canvasElement);
  }),
};
