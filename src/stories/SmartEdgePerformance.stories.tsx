import {
  ReactFlow,
  ReactFlowProvider,
  BaseEdge,
  BezierEdge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import { useMemo, useState } from "react";
import { expect, waitFor } from "storybook/test";
import { buildLargeNetwork } from "../demos/dummyData/largeNetwork";
import { edgeTypes as smartEdgeTypes } from "../demos/DummyData";
import { GraphWrapper } from "../demos/GraphWrapper";
import { SmartEdgeProvider } from "../routing/SmartEdgeProvider";
import { useSmartEdgePath } from "../routing/useSmartEdgePath";
import { SmartBezierEdge } from "../SmartBezierEdge";
import {
  demoStoryPlay,
  expectDemoGraph,
  NODE_SELECTOR,
} from "./storyPlayHelpers";
import type { SmartEdgeMetrics } from "../routing/scheduler";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { EdgeProps, Node, Edge } from "@xyflow/react";
import type { CSSProperties } from "react";

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

// --- 750-node (#69) train-network fixture ---------------------------------

const metricsOverlayContainerStyle: CSSProperties = { position: "relative" };

const metricsOverlayStyle: CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  zIndex: 10,
  margin: 0,
  padding: "8px 12px",
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #ccc",
  borderRadius: 4,
  fontSize: 12,
  maxWidth: 360,
  maxHeight: 260,
  overflow: "auto",
  pointerEvents: "none",
};

interface LargeNetworkArgs {
  nodeCount: number;
  seed: number;
}

/**
 * Renders a `buildLargeNetwork` graph through `GraphWrapper` (v5 defaults,
 * `routeOnlyWhenBlocked: true` — passed explicitly since `GraphWrapper`
 * itself defaults it `false` for other demos), reporting every completed
 * routing batch's `SmartEdgeMetrics` into a visible
 * `<pre data-testid="metrics">` overlay so a story's play function can
 * assert on real batch latency and routing outcomes instead of only
 * checking that nodes rendered.
 */
function LargeNetworkDemo({ nodeCount, seed }: Readonly<LargeNetworkArgs>) {
  const { nodes, edges } = useMemo(
    () => buildLargeNetwork(nodeCount, seed),
    [nodeCount, seed],
  );
  const [metrics, setMetrics] = useState<SmartEdgeMetrics | null>(null);

  return (
    <div style={metricsOverlayContainerStyle}>
      <GraphWrapper
        defaultNodes={nodes}
        defaultEdges={edges}
        edgeTypes={smartEdgeTypes}
        providerOptions={{ routeOnlyWhenBlocked: true }}
        onMetrics={setMetrics}
        minZoom={0.02}
        fitView
      />
      <pre data-testid="metrics" style={metricsOverlayStyle}>
        {JSON.stringify(metrics)}
      </pre>
    </div>
  );
}

/** Reads the `data-testid="metrics"` overlay's latest reported
 * `SmartEdgeMetrics`, throwing until at least one batch has been reported. */
const readLatestMetrics = (canvasElement: HTMLElement): SmartEdgeMetrics => {
  const element = canvasElement.querySelector('[data-testid="metrics"]');
  if (!element) throw new Error("metrics overlay not rendered");
  const parsed: unknown = JSON.parse(element.textContent);
  if (parsed === null) throw new Error("no routing batch reported yet");
  return parsed as SmartEdgeMetrics;
};

/** Local machines measure ~2.2s batch latency; GitHub Actions has measured
 * ~6.5s for the same 750-node fixture. Keep a tight local ceiling and give
 * shared CI runners a wider one. `process.env.CI` is baked in via
 * `.storybook/main.ts` `viteFinal` so it is available in Chromium. */
const BATCH_LATENCY_MS_BUDGET = process.env["CI"] ? 10_000 : 5_000;

/** Asserts the routing-batch budget the brief calls for: at least one batch
 * reported some routed/cleared/cache-hit outcome, and that batch completed
 * under the environment's latency ceiling. Deliberately checks sums and
 * bounds only (never exact counts), since the mix of routed/cleared/
 * deferred/cache-hit edges is sensitive to timing and CI hardware. */
const expectMetricsBudget = async (
  canvasElement: HTMLElement,
  timeout: number,
) => {
  await waitFor(
    async () => {
      const metrics = readLatestMetrics(canvasElement);
      await expect(
        metrics.routed + metrics.clear + metrics.cacheHits,
      ).toBeGreaterThan(0);
      await expect(metrics.batchLatencyMs).toBeLessThan(
        BATCH_LATENCY_MS_BUDGET,
      );
    },
    { timeout },
  );
};

const largeNetworkMeta = { nodeCount: 750, seed: 1 };

/**
 * The #69-style 750-node "train network" fixture (`buildLargeNetwork`),
 * routed through the real worker pipeline. Proves three things end to end in
 * a real browser: (1) React Flow paints every node immediately on mount —
 * before any routing batch has run — since smart edges fall back to their
 * native path until routed; (2) the first completed batch reports some
 * routed/cleared/cache-hit outcome within a generous 30s wait budget, and
 * that batch's own `batchLatencyMs` stays under 5s locally / 10s on CI; (3)
 * `buildLargeNetwork` is deterministic — building the same `(nodeCount,
 * seed)` twice yields identical graphs.
 *
 * Kept as a real interaction test (not render-only): measured locally in the
 * Storybook Vitest browser runner, the 750-node/~1125-edge batch reports
 * `batchLatencyMs` around 2.2s (roughly 336 routed, 789 clear, 0 deferred),
 * and the whole play function — including React Flow's initial render,
 * measurement, and `fitView` — finishes in around 11-12s. Shared CI runners
 * have measured ~6.5s batch latency for the same fixture, so the per-batch
 * ceiling is 10s when `process.env.CI` is set. See
 * `.superpowers/sdd/task-19-report.md` for the full observed numbers.
 */
export const LargeNetwork750: Story = {
  render: () => (
    <LargeNetworkDemo
      nodeCount={largeNetworkMeta.nodeCount}
      seed={largeNetworkMeta.seed}
    />
  ),
  play: demoStoryPlay(async (canvasElement) => {
    // Fallback-first paint: every node is already in the DOM the instant the
    // story mounts, before the provider's first routing batch has even been
    // scheduled (registration → microtask → rAF → debounce timer → worker).
    const paintedNodes = canvasElement.querySelectorAll(NODE_SELECTOR);
    await expect(paintedNodes.length).toBe(largeNetworkMeta.nodeCount);

    await expectMetricsBudget(canvasElement, 30_000);

    // Determinism: the same (nodeCount, seed) always produces the same graph.
    const first = buildLargeNetwork(
      largeNetworkMeta.nodeCount,
      largeNetworkMeta.seed,
    );
    const second = buildLargeNetwork(
      largeNetworkMeta.nodeCount,
      largeNetworkMeta.seed,
    );
    await expect(second).toEqual(first);
  }),
};
