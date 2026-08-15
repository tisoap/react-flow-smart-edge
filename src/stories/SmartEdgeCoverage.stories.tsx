import { Component, useEffect, useState } from "react";
import { createSmartEdge } from "../index";
import { simpleNodes } from "../demos/DummyData";
import { GraphWrapper } from "../demos/GraphWrapper";
import { SmartFloatingConnectionLine } from "../SmartFloatingConnectionLine";
import {
  CONNECTION_PATH_SELECTOR,
  CONTROL_POINT_SELECTOR,
  demoStoryPlay,
  dragSmartConnectionPreview,
  expectDemoGraph,
  waitForRoutedEdge,
} from "./storyPlayHelpers";
import { interactWithEditableEdge } from "./storyEditablePlay";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Edge, Node } from "@xyflow/react";
import type { PathFindingFunction } from "../functions/generatePath";
import type { ComponentProps, ReactNode } from "react";
import type { SmartEdgeOptions } from "../SmartEdge";

/**
 * Stories that close Storybook UI-slice coverage gaps without belonging in the
 * visual demo catalog. Keep these focused on the branch they exercise.
 */

const meta = {
  title: "Smart Edge/Coverage",
  component: GraphWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GraphWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const SMART_NO_FALLBACK_TYPE = "smartNoFallback";
const HOP_OVER_EDGE_ID = "coverage-hop-over";
const TWO_NODE_GRAPH = {
  nodeCount: { exact: 2 },
  edgeCount: { exact: 1 },
} as const;

/** Omits the preset fallback so `SmartEdge` takes the `?? BezierEdge` branch. */
const noFallbackEdgeTypes = {
  [SMART_NO_FALLBACK_TYPE]: createSmartEdge("bezier", {
    // Clear the preset fallback at runtime; `?? BezierEdge` then supplies it.
    fallback: null as unknown as NonNullable<SmartEdgeOptions["fallback"]>,
  }),
};

export const DefaultBezierFallback: Story = {
  args: {
    edgeTypes: noFallbackEdgeTypes,
    defaultNodes: simpleNodes,
    defaultEdges: [
      {
        id: "coverage-fallback",
        source: "1",
        target: "2",
        type: SMART_NO_FALLBACK_TYPE,
      },
    ],
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, TWO_NODE_GRAPH);
    await waitForRoutedEdge(canvasElement, "coverage-fallback", /Q/i);
  }),
};

const editableEdgeTypes = {
  smartEditable: createSmartEdge("bezier", { editable: true }),
};

/** Two editable edges so `applyControlPointsUpdate` keeps the non-matching one. */
export const MultiEditableControlPoints: Story = {
  args: {
    edgeTypes: editableEdgeTypes,
    defaultNodes: [
      ...simpleNodes,
      {
        id: "3",
        data: { label: "Node 3" },
        position: { x: 80, y: 360 },
      },
      {
        id: "4",
        data: { label: "Node 4" },
        position: { x: 420, y: 360 },
      },
    ],
    defaultEdges: [
      {
        id: "coverage-edit-a",
        source: "1",
        target: "2",
        type: "smartEditable",
        selected: true,
        data: {
          points: [{ id: "wp-a", x: 300, y: 210, active: true }],
        },
      },
      {
        id: "coverage-edit-b",
        source: "3",
        target: "4",
        type: "smartEditable",
        selected: false,
        data: {
          points: [{ id: "wp-b", x: 300, y: 400, active: true }],
        },
      },
    ],
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 4 },
      edgeCount: { exact: 2 },
    });
    await interactWithEditableEdge(canvasElement);
  }),
};

/** Reveals control points via endpoint node selection, not edge selection. */
export const EditableViaNodeSelection: Story = {
  args: {
    edgeTypes: editableEdgeTypes,
    defaultNodes: simpleNodes.map((node) =>
      node.id === "1" ? { ...node, selected: true } : node,
    ),
    defaultEdges: [
      {
        id: "coverage-node-selected",
        source: "1",
        target: "2",
        type: "smartEditable",
        selected: false,
        data: {
          points: [{ id: "wp-node", x: 300, y: 210, active: true }],
        },
      },
    ],
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, TWO_NODE_GRAPH);
    await interactWithEditableEdge(canvasElement);
  }),
};

const hopEdgeTypes = {
  smartStepHop: createSmartEdge("step", { hops: true }),
};

/**
 * Tiny nodes so only the explicit blocker sits on the vertical corridor.
 * With `routeOnlyWhenBlocked`, the horizontal edge stays `clear` while the
 * vertical edge routes and hops over that clear native step polyline.
 */
const hopClearUnderneathNodes: Node[] = [
  {
    id: "h-top",
    data: { label: "T" },
    position: { x: 195, y: 0 },
    style: { width: 20, height: 20 },
  },
  {
    id: "h-bottom",
    data: { label: "B" },
    position: { x: 195, y: 380 },
    style: { width: 20, height: 20 },
  },
  {
    id: "h-left",
    data: { label: "L" },
    position: { x: 0, y: 190 },
    style: { width: 20, height: 20 },
  },
  {
    id: "h-right",
    data: { label: "R" },
    position: { x: 380, y: 190 },
    style: { width: 20, height: 20 },
  },
  {
    id: "coverage-blocker",
    data: { label: "X" },
    position: { x: 190, y: 40 },
    style: { width: 20, height: 40 },
  },
];

const hopClearUnderneathEdges: Edge[] = [
  {
    id: "coverage-hop-under",
    source: "h-left",
    target: "h-right",
    type: "smartStepHop",
  },
  {
    id: HOP_OVER_EDGE_ID,
    source: "h-top",
    target: "h-bottom",
    type: "smartStepHop",
  },
];

export const HopOverClearUnderneath: Story = {
  args: {
    edgeTypes: hopEdgeTypes,
    defaultNodes: hopClearUnderneathNodes,
    defaultEdges: hopClearUnderneathEdges,
    providerOptions: { routeOnlyWhenBlocked: true },
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 5 },
      edgeCount: { exact: 2 },
    });
    await waitForRoutedEdge(canvasElement, HOP_OVER_EDGE_ID, /A\s+\d/);
  }),
};

/** Flips provider options after mount so `setOptions` applies both a
 * presentation-only diff and a routing diff. */
function ProviderOptionsLiveUpdateDemo() {
  const [providerOptions, setProviderOptions] = useState({
    routeOnlyWhenBlocked: true,
    dragFallbackStyle: { strokeDasharray: "2 2" },
  });

  useEffect(() => {
    const presentation = window.setTimeout(() => {
      setProviderOptions({
        routeOnlyWhenBlocked: true,
        dragFallbackStyle: { strokeDasharray: "8 4" },
      });
    }, 40);
    const routing = window.setTimeout(() => {
      setProviderOptions({
        routeOnlyWhenBlocked: false,
        dragFallbackStyle: { strokeDasharray: "8 4" },
      });
    }, 80);
    return () => {
      window.clearTimeout(presentation);
      window.clearTimeout(routing);
    };
  }, []);

  return (
    <GraphWrapper
      edgeTypes={noFallbackEdgeTypes}
      defaultNodes={simpleNodes}
      defaultEdges={[
        {
          id: "coverage-options",
          source: "1",
          target: "2",
          type: SMART_NO_FALLBACK_TYPE,
        },
      ]}
      providerOptions={providerOptions}
    />
  );
}

export const ProviderOptionsLiveUpdate: Story = {
  render: () => <ProviderOptionsLiveUpdateDemo />,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, TWO_NODE_GRAPH);
    await waitForRoutedEdge(canvasElement, "coverage-options", /Q/i);
  }),
};

/**
 * Deletes `window.Worker` before the provider mounts so routing stays on the
 * main-thread async dispatch path. Uses a class gate so the deletion happens
 * in the constructor (not an effect setState).
 */
class WithoutWorkerGate extends Component<{ children: ReactNode }> {
  private readonly backup: typeof Worker;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.backup = window.Worker;
    // @ts-expect-error intentional coverage harness: force the no-Worker path
    delete window.Worker;
  }

  override componentWillUnmount(): void {
    window.Worker = this.backup;
  }

  override render(): ReactNode {
    return this.props.children;
  }
}

function MainThreadDispatchDemo() {
  return (
    <WithoutWorkerGate>
      <GraphWrapper
        edgeTypes={noFallbackEdgeTypes}
        defaultNodes={simpleNodes}
        defaultEdges={[
          {
            id: "coverage-main-thread",
            source: "1",
            target: "2",
            type: SMART_NO_FALLBACK_TYPE,
          },
        ]}
      />
    </WithoutWorkerGate>
  );
}

export const MainThreadDispatch: Story = {
  render: () => <MainThreadDispatchDemo />,
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, TWO_NODE_GRAPH);
    await waitForRoutedEdge(canvasElement, "coverage-main-thread", /Q/i);
    if (canvasElement.querySelector(CONTROL_POINT_SELECTOR)) {
      throw new Error("non-editable edge unexpectedly showed control points");
    }
  }),
};

const failingGeneratePath: PathFindingFunction = () => {
  throw new Error("forced connection-line pathfinding failure");
};

function FailingConnectionLine(
  props: ComponentProps<typeof SmartFloatingConnectionLine>,
) {
  return (
    <SmartFloatingConnectionLine
      {...props}
      options={{ generatePath: failingGeneratePath }}
    />
  );
}

/** Forces the connection-line Error fallback branch via a throwing generatePath. */
export const ConnectionLinePathfindingFallback: Story = {
  args: {
    edgeTypes: noFallbackEdgeTypes,
    defaultNodes: simpleNodes,
    defaultEdges: [
      {
        id: "coverage-connection-existing",
        source: "1",
        target: "2",
        type: SMART_NO_FALLBACK_TYPE,
      },
    ],
    connectionLineComponent: FailingConnectionLine,
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, TWO_NODE_GRAPH);
    await dragSmartConnectionPreview(canvasElement, "1");
    const path = canvasElement.querySelector(CONNECTION_PATH_SELECTOR);
    if (!path?.getAttribute("d")) {
      throw new Error("connection preview fallback path missing");
    }
  }),
};

/** Exercises `resolveHopConfig` object form with an explicit radius. */
const hopRadiusEdgeTypes = {
  smartStepHopRadius: createSmartEdge("step", {
    hops: { radius: 10, epsilon: 1 },
  }),
};

export const HopWithExplicitRadius: Story = {
  args: {
    edgeTypes: hopRadiusEdgeTypes,
    defaultNodes: hopClearUnderneathNodes,
    defaultEdges: hopClearUnderneathEdges.map((edge) => ({
      ...edge,
      type: "smartStepHopRadius",
    })),
    providerOptions: { routeOnlyWhenBlocked: true },
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 5 },
      edgeCount: { exact: 2 },
    });
    await waitForRoutedEdge(canvasElement, HOP_OVER_EDGE_ID, /A\s+10/);
  }),
};
