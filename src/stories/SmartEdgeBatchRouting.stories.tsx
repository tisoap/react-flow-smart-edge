import {
  ReactFlow,
  ReactFlowProvider,
  BaseEdge,
  BezierEdge,
} from "@xyflow/react";
import { SmartEdgeBatchRoutingProvider } from "../batchRouting/SmartEdgeBatchRoutingProvider";
import { useSmartEdgeRoute } from "../batchRouting/useSmartEdgeRoute";
import { markerEndType } from "../demos/dummyData/shared";
import {
  demoStoryPlay,
  expectGraphRendered,
  EDGE_PATH_SELECTOR,
} from "./storyPlayHelpers";
import { waitFor } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { EdgeProps, Node, Edge } from "@xyflow/react";

const nodes: Node[] = [
  { id: "a", position: { x: 0, y: 0 }, data: { label: "A" } },
  { id: "b", position: { x: 250, y: 200 }, data: { label: "B" } },
  { id: "c", position: { x: 250, y: -150 }, data: { label: "C" } },
];

const edges: Edge[] = [
  {
    id: "a-b",
    source: "a",
    target: "b",
    type: "worker",
    markerEnd: { type: markerEndType },
  },
  {
    id: "a-c",
    source: "a",
    target: "c",
    type: "worker",
    markerEnd: { type: markerEndType },
  },
];

/** A custom edge that renders the worker-routed path, or a bezier fallback. */
function WorkerEdge(props: EdgeProps) {
  const routed = useSmartEdgeRoute(props);
  if (!routed) {
    return <BezierEdge {...props} />;
  }
  return (
    <BaseEdge
      id={props.id}
      path={routed.svgPathString}
      labelX={routed.edgeCenterX}
      labelY={routed.edgeCenterY}
      markerEnd={props.markerEnd}
    />
  );
}

const edgeTypes = { worker: WorkerEdge };

function WorkerRoutingDemo() {
  return (
    <ReactFlowProvider>
      <SmartEdgeBatchRoutingProvider
        nodes={nodes}
        options={{ preset: "bezier" }}
      >
        <div
          data-testid="graph-wrapper"
          style={{ background: "#fafafa", width: "100%", height: "500px" }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            edgeTypes={edgeTypes}
            fitView
          />
        </div>
      </SmartEdgeBatchRoutingProvider>
    </ReactFlowProvider>
  );
}

const meta = {
  title: "Smart Edge Batch Routing",
  component: WorkerRoutingDemo,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof WorkerRoutingDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WorkerBatchRouting: Story = {
  play: demoStoryPlay(async (canvasElement) => {
    await expectGraphRendered(canvasElement);
    // The worker routes with the smooth (quadratic) bezier drawer, so a routed
    // path contains "Q"; the pending fallback BezierEdge uses cubic "C". Poll
    // until the worker (or main-thread fallback) delivers routed paths.
    await waitFor(
      () => {
        const paths = [
          ...canvasElement.querySelectorAll<SVGPathElement>(EDGE_PATH_SELECTOR),
        ];
        const routed = paths.some((path) =>
          (path.getAttribute("d") ?? "").includes("Q"),
        );
        if (!routed) {
          throw new Error("routed paths not applied yet");
        }
      },
      { timeout: 10000 },
    );
  }),
};
