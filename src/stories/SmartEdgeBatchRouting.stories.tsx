import {
  ReactFlow,
  ReactFlowProvider,
  BaseEdge,
  BezierEdge,
} from "@xyflow/react";
import { SmartEdgeBatchRoutingProvider } from "../batchRouting/SmartEdgeBatchRoutingProvider";
import { useSmartEdgeRoute } from "../batchRouting/useSmartEdgeRoute";
import { markerEndType } from "../demos/dummyData/shared";
import { demoStoryPlay, expectDemoGraph } from "./storyPlayHelpers";
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
  const routed = useSmartEdgeRoute(props.id);
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
        edges={edges}
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
  // Real-browser integration smoke test: the provider mounts inside React Flow
  // context, the inline worker import builds, and the worker edge component +
  // useSmartEdgeRoute wire up and render edge paths without crashing. The
  // worker message protocol and the routed/fallback paths are covered by the
  // unit tests in src/batchRouting (blob Web Workers do not run in the headless
  // test sandbox, so routed output is asserted there instead).
  play: demoStoryPlay(async (canvasElement) => {
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: 3 },
      edgeCount: { exact: 2 },
    });
  }),
};
