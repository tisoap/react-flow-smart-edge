import { ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { edgeTypes } from "../demos/DummyData";
import { GraphWrapper } from "../demos/GraphWrapper";
import {
  demoStoryPlay,
  expectDemoGraph,
  waitForRoutedEdge,
} from "./storyPlayHelpers";
import { resolveStoryColorMode, type StoryColorMode } from "./storyColorMode";
import {
  beginNodeDrag,
  expectDragFallbackStyle,
  expectNoDragFallbackStyle,
  expectStaysUnrouted,
} from "./storyV5BehaviorHelpers";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { Node, Edge } from "@xyflow/react";

const meta = {
  title: "Smart Edge/V5 Behavior",
  component: GraphWrapper,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof GraphWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

const SMART_BEZIER_TYPE = "smartBezier";

const DRAG_SOURCE_ID = "drag-source";
const DRAG_OBSTACLE_ID = "drag-obstacle";
const DRAG_TARGET_ID = "drag-target";
const DRAG_EDGE_ID = "drag-edge";

// A source/target pair with an obstacle node sitting squarely between them,
// so the edge is genuinely routed through the grid (a `Q` quadratic-bezier
// path) rather than resolved as "clear" and handed off to the native
// fallback edge.
const dragFallbackNodes: Node[] = [
  {
    id: DRAG_SOURCE_ID,
    data: { label: "Source" },
    position: { x: 60, y: 220 },
  },
  {
    id: DRAG_OBSTACLE_ID,
    data: { label: "Obstacle" },
    position: { x: 280, y: 180 },
    style: { width: 140, height: 120 },
  },
  {
    id: DRAG_TARGET_ID,
    data: { label: "Target" },
    position: { x: 560, y: 220 },
  },
];

const dragFallbackEdges: Edge[] = [
  {
    id: DRAG_EDGE_ID,
    source: DRAG_SOURCE_ID,
    target: DRAG_TARGET_ID,
    type: SMART_BEZIER_TYPE,
  },
];

/**
 * Proves the v5 drag-fallback behavior end to end in a real browser: while a
 * smart edge's endpoint node is being dragged, the edge renders its native
 * (non-routed) variant inside a `react-flow__edge animated` wrapper instead
 * of the grid-routed path, then resumes routing once the drag ends. This is
 * the first story to drive a real node-body drag (via `d3-drag`'s
 * `mousedown`/`mousemove`/`mouseup`, dispatched here through
 * `userEvent.pointer`) rather than a handle drag. The dragging-flag
 * plumbing from `useNodes()` through `GraphWrapper` into `SmartEdgeProvider`
 * was previously verified only by reading the source; this story is the
 * empirical proof.
 */
export const DragFallback: Story = {
  args: {
    edgeTypes,
    defaultNodes: dragFallbackNodes,
    defaultEdges: dragFallbackEdges,
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 3 },
      edgeCount: { exact: 1 },
    });
    await waitForRoutedEdge(canvasElement, DRAG_EDGE_ID, /Q/i);

    // Move well past `nodeDragThreshold` (default 1px) so React Flow commits
    // to the drag rather than treating it as a click.
    const drag = await beginNodeDrag(canvasElement, DRAG_SOURCE_ID, {
      x: 40,
      y: 30,
    });
    await expectDragFallbackStyle(canvasElement, DRAG_EDGE_ID);
    await drag.end();

    await waitForRoutedEdge(canvasElement, DRAG_EDGE_ID, /Q/i);
    await expectNoDragFallbackStyle(canvasElement, DRAG_EDGE_ID);
  }),
};

const NO_PROVIDER_SOURCE_ID = "no-provider-source";
const NO_PROVIDER_TARGET_ID = "no-provider-target";
const NO_PROVIDER_EDGE_ID = "no-provider-edge";

// A single smart edge rendered with no `SmartEdgeProvider` ancestor at all —
// built by hand (bypassing `GraphWrapper`, which always wraps one) so the
// missing-provider fallback path can be exercised directly.
const noProviderNodes: Node[] = [
  {
    id: NO_PROVIDER_SOURCE_ID,
    data: { label: "Source" },
    position: { x: 80, y: 200 },
  },
  {
    id: NO_PROVIDER_TARGET_ID,
    data: { label: "Target" },
    position: { x: 420, y: 200 },
  },
];

const noProviderEdges: Edge[] = [
  {
    id: NO_PROVIDER_EDGE_ID,
    source: NO_PROVIDER_SOURCE_ID,
    target: NO_PROVIDER_TARGET_ID,
    type: SMART_BEZIER_TYPE,
  },
];

/**
 * Proves that a smart edge rendered without a `SmartEdgeProvider` ancestor
 * renders its native fallback edge (a cubic `C` bezier) and never becomes a
 * grid-routed path (a quadratic `Q`) — there is no provider to route it. The
 * `console.warn`-once assertion for this case already lives in a jsdom unit
 * test (`SmartEdge/index.test.tsx`); this story documents the rendered
 * behavior visually instead of re-asserting the console spy.
 */
function NoProviderDemo({
  colorMode,
}: Readonly<{ colorMode: StoryColorMode }>) {
  return (
    <ReactFlowProvider>
      <div
        data-testid="graph-wrapper"
        style={{ width: "100%", height: "100%" }}
      >
        <ReactFlow
          defaultNodes={noProviderNodes}
          defaultEdges={noProviderEdges}
          edgeTypes={edgeTypes}
          fitView
          colorMode={colorMode}
          proOptions={{ hideAttribution: true }}
        />
      </div>
    </ReactFlowProvider>
  );
}

export const NoProvider: Story = {
  render: ({ colorMode }) => (
    <NoProviderDemo colorMode={resolveStoryColorMode({ colorMode })} />
  ),
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });
    await expectStaysUnrouted(canvasElement, NO_PROVIDER_EDGE_ID);
  }),
};

const CLEAR_TOP_ID = "clear-top";
const CLEAR_BOTTOM_ID = "clear-bottom";
const CLEAR_EDGE_ID = "clear-edge";

// A pair with nothing between them: whether this renders the native fallback
// ("clear") or a grid-routed path depends entirely on `routeOnlyWhenBlocked`.
const clearCorridorNodes: Node[] = [
  { id: CLEAR_TOP_ID, data: { label: "Top" }, position: { x: 300, y: 60 } },
  {
    id: CLEAR_BOTTOM_ID,
    data: { label: "Bottom" },
    position: { x: 300, y: 380 },
  },
];

const clearCorridorEdges: Edge[] = [
  {
    id: CLEAR_EDGE_ID,
    source: CLEAR_TOP_ID,
    target: CLEAR_BOTTOM_ID,
    type: SMART_BEZIER_TYPE,
  },
];

/**
 * v5 default (`routeOnlyWhenBlocked: true`): over an unobstructed corridor,
 * the edge is never routed through the grid — it resolves as "clear" and
 * renders the native fallback edge (cubic `C`) instead of a grid-routed
 * quadratic `Q` path. Paired with {@link RouteIfClearAlways}, which renders
 * the identical corridor with `routeOnlyWhenBlocked: false` and does route
 * it, proving the option is what makes the difference here, not some
 * property of the corridor that keeps it from ever being routed. Two
 * separate stories (rather than one story with two flows side by side) so
 * each keeps the same simple `args`-driven `GraphWrapper` shape every other
 * story in this file uses.
 */
export const RouteIfClearWhenBlocked: Story = {
  args: {
    edgeTypes,
    defaultNodes: clearCorridorNodes,
    defaultEdges: clearCorridorEdges,
    providerOptions: { routeOnlyWhenBlocked: true },
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });
    await expectStaysUnrouted(canvasElement, CLEAR_EDGE_ID);
  }),
};

/** The `routeOnlyWhenBlocked: false` counterpart to
 * {@link RouteIfClearWhenBlocked}: the identical unobstructed corridor, but
 * routed anyway since always-route ignores clearance. */
export const RouteIfClearAlways: Story = {
  args: {
    edgeTypes,
    defaultNodes: clearCorridorNodes,
    defaultEdges: clearCorridorEdges,
    providerOptions: { routeOnlyWhenBlocked: false },
  },
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 2 },
      edgeCount: { exact: 1 },
    });
    await waitForRoutedEdge(canvasElement, CLEAR_EDGE_ID, /Q/i);
  }),
};
