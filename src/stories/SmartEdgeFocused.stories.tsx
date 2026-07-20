import { createSmartEdge } from "../index";
import {
  demoAvoidAreas,
  edgeTypes,
  edgesBezier,
  floatingEdges,
  floatingNodes,
  nodes,
  simpleEdgesBezier,
  simpleNodes,
} from "../demos/DummyData";
import { GraphWrapper } from "../demos/GraphWrapper";
import { SmartFloatingConnectionLine } from "../SmartFloatingConnectionLine";
import {
  demoStoryPlay,
  dragSmartConnectionPreview,
  expectBezierCurves,
  expectDemoGraph,
  expectPathAvoidsRect,
  interactWithEditableEdge,
  waitForRoutedEdge,
} from "./storyPlayHelpers";
import type { Meta, StoryObj } from "@storybook/react-vite";

const avoidAreaEdgeTypes = {
  smartBezierAvoid: createSmartEdge("bezier", { avoidAreas: demoAvoidAreas }),
};

const meta = {
  title: "Smart Edge/Focused",
  component: GraphWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GraphWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const selfLoopEdge = edgesBezier.find((edge) => edge.id === "e3");
if (!selfLoopEdge) {
  throw new Error("self-loop fixture edge e3 is missing from DummyData");
}

const bidirectionalEdges = edgesBezier.filter(
  (edge) => edge.id === "e56" || edge.id === "e65",
);

export const SelfLoop: Story = {
  args: {
    edgeTypes,
    defaultNodes: nodes.filter((node) => node.id === "3"),
    defaultEdges: [selfLoopEdge],
  },
  play: demoStoryPlay(async (canvasElement) => {
    const paths = await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 1 },
      edgeCount: { exact: 1 },
    });
    const pathData = paths[0].getAttribute("d") ?? "";
    if (pathData.length < 12) {
      throw new Error(
        "self-loop path should be longer than a degenerate segment",
      );
    }
  }),
};

export const BidirectionalPair: Story = {
  args: {
    edgeTypes,
    defaultNodes: nodes.filter((node) => node.id === "5" || node.id === "6"),
    defaultEdges: bidirectionalEdges,
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 2 },
    });
    // Address each direction of the pair by its own edge id, rather than
    // pattern-matching across every path on the canvas, so a regression that
    // only breaks one direction can't hide behind the other's routed path.
    await waitForRoutedEdge(canvasElement, "e56", /Q/i);
    await waitForRoutedEdge(canvasElement, "e65", /Q/i);
  }),
};

export const VerticalRouting: Story = {
  args: {
    edgeTypes,
    defaultNodes: simpleNodes,
    defaultEdges: simpleEdgesBezier,
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });
    await expectBezierCurves(canvasElement);
  }),
};

export const AvoidAreaVerticalDetour: Story = {
  args: {
    edgeTypes: avoidAreaEdgeTypes,
    defaultNodes: [
      {
        id: "aa-source",
        data: { label: "Source" },
        position: { x: 80, y: 200 },
      },
      {
        id: "aa-target",
        data: { label: "Target" },
        position: { x: 520, y: 200 },
      },
    ],
    defaultEdges: [
      {
        id: "aa-e-source-target",
        source: "aa-source",
        target: "aa-target",
        type: "smartBezierAvoid",
      },
    ],
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });

    const [avoidArea] = demoAvoidAreas;
    await expectPathAvoidsRect(canvasElement, avoidArea);
  }),
};

export const EditableWaypointEditing: Story = {
  args: {
    edgeTypes,
    defaultNodes: simpleNodes,
    defaultEdges: [
      {
        id: "editable-focused",
        source: "1",
        target: "2",
        type: "smartEditable",
        selected: true,
        data: {
          points: [{ id: "focused-wp", x: 300, y: 210, active: true }],
        },
      },
    ],
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });
    await interactWithEditableEdge(canvasElement);
  }),
};

export const FloatingConnectionPreview: Story = {
  args: {
    edgeTypes,
    defaultNodes: floatingNodes,
    defaultEdges: floatingEdges,
    connectionLineComponent: SmartFloatingConnectionLine,
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 7 },
      edgeCount: { exact: 6 },
    });
    await dragSmartConnectionPreview(canvasElement, "f-hub");
  }),
};
