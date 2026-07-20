import {
  ReactFlow,
  ReactFlowProvider,
  BaseEdge,
  BezierEdge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { useMemo } from "react";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import { useSmartEdgePath } from "../routing/useSmartEdgePath";
import { SmartBezierEdge } from "../SmartBezierEdge";
import { demoStoryPlay, expectDemoGraph } from "./storyPlayHelpers";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { EdgeProps, Node, Edge } from "@xyflow/react";

const GAP_X = 220;
const GAP_Y = 160;

/**
 * Builds a grid of nodes wired with "skip a node" horizontal and vertical
 * edges, so every edge has to route around an obstacle. Returns a large,
 * routing-heavy graph for performance comparison.
 */
const makeGraph = (
  columns: number,
  rows: number,
  edgeType: string,
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nid = (row: number, col: number) => `n${String(row)}-${String(col)}`;
  const has = (row: number, col: number) =>
    row >= 0 && row < rows && col >= 0 && col < columns;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      nodes.push({
        id: nid(row, col),
        position: { x: col * GAP_X, y: row * GAP_Y },
        data: { label: nid(row, col) },
      });
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      if (has(row, col + 2)) {
        edges.push({
          id: `${nid(row, col)}-h-${nid(row, col + 2)}`,
          source: nid(row, col),
          target: nid(row, col + 2),
          type: edgeType,
          markerEnd: { type: MarkerType.Arrow },
        });
      }
      if (has(row + 2, col)) {
        edges.push({
          id: `${nid(row, col)}-v-${nid(row + 2, col)}`,
          source: nid(row, col),
          target: nid(row + 2, col),
          type: edgeType,
          markerEnd: { type: MarkerType.Arrow },
        });
      }
    }
  }

  return { nodes, edges };
};

/** Worker-routed edge: renders the routed path, or a bezier while pending. */
function WorkerEdge(props: EdgeProps) {
  const { route } = useSmartEdgePath({
    id: props.id,
    source: props.source,
    target: props.target,
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  });
  if (route?.kind !== "routed") {
    return <BezierEdge {...props} />;
  }
  return (
    <BaseEdge
      id={props.id}
      path={route.svgPathString}
      labelX={route.edgeCenterX}
      labelY={route.edgeCenterY}
      markerEnd={props.markerEnd}
    />
  );
}

const workerEdgeTypes = { worker: WorkerEdge };
const mainThreadEdgeTypes = { smart: SmartBezierEdge };

const wrapperStyle = {
  background: "#fafafa",
  width: "100%",
  height: "100vh",
} as const;

interface PerfArgs {
  columns: number;
  rows: number;
}

/** Large graph routed off the main thread via the Web Worker batch provider. */
function WorkerPerformanceDemo({ columns, rows }: Readonly<PerfArgs>) {
  const initial = useMemo(
    () => makeGraph(columns, rows, "worker"),
    [columns, rows],
  );
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);

  return (
    <ReactFlowProvider>
      <SmartEdgeProvider nodes={nodes} options={{ preset: "bezier" }}>
        <div data-testid="graph-wrapper" style={wrapperStyle}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            edgeTypes={workerEdgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            minZoom={0.05}
            fitView
          />
        </div>
      </SmartEdgeProvider>
    </ReactFlowProvider>
  );
}

/** The same large graph routed synchronously on the main thread, for contrast. */
function MainThreadPerformanceDemo({ columns, rows }: Readonly<PerfArgs>) {
  const initial = useMemo(
    () => makeGraph(columns, rows, "smart"),
    [columns, rows],
  );
  const [nodes, , onNodesChange] = useNodesState(initial.nodes);
  const [edges, , onEdgesChange] = useEdgesState(initial.edges);

  return (
    <ReactFlowProvider>
      <div data-testid="graph-wrapper" style={wrapperStyle}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          edgeTypes={mainThreadEdgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          minZoom={0.05}
          fitView
        />
      </div>
    </ReactFlowProvider>
  );
}

const meta = {
  title: "Smart Edge Performance",
  parameters: { layout: "fullscreen" },
  args: { columns: 8, rows: 6 },
  argTypes: {
    columns: { control: { type: "range", min: 3, max: 24, step: 1 } },
    rows: { control: { type: "range", min: 3, max: 24, step: 1 } },
  },
} satisfies Meta<PerfArgs>;

export default meta;

type Story = StoryObj<PerfArgs>;

const expectedCounts = (columns: number, rows: number) => {
  const nodeCount = columns * rows;
  const horizontal = rows * Math.max(columns - 2, 0);
  const vertical = Math.max(rows - 2, 0) * columns;
  return { nodeCount, edgeCount: horizontal + vertical };
};

/**
 * Large graph whose edges are routed in one batch on a background Web Worker.
 * Drag a node and the UI stays responsive while routing runs off-thread.
 * Increase the `columns`/`rows` controls to add load.
 */
export const WorkerRouting: Story = {
  render: ({ columns, rows }) => (
    <WorkerPerformanceDemo columns={columns} rows={rows} />
  ),
  play: demoStoryPlay(async (canvasElement) => {
    const { nodeCount, edgeCount } = expectedCounts(8, 6);
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: nodeCount },
      edgeCount: { exact: edgeCount },
    });
  }),
};

/**
 * The identical graph routed synchronously on the main thread (the regular
 * `SmartBezierEdge`). Drag a node here to feel the difference: routing every
 * edge on the main thread blocks rendering.
 */
export const MainThreadRouting: Story = {
  render: ({ columns, rows }) => (
    <MainThreadPerformanceDemo columns={columns} rows={rows} />
  ),
  play: demoStoryPlay(async (canvasElement) => {
    const { nodeCount, edgeCount } = expectedCounts(8, 6);
    await expectDemoGraph(canvasElement, {
      nodeCount: { exact: nodeCount },
      edgeCount: { exact: edgeCount },
    });
  }),
};
