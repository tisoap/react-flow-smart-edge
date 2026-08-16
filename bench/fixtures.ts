// Shared fixtures for the vitest bench project: deterministic graphs built
// from the same `buildLargeNetwork` generator used by the Task 19 Storybook
// perf fixture, sized for the 10/100/750-node A/B comparisons.
import { Position } from "@xyflow/react";
import { buildLargeNetwork } from "../src/demos/dummyData/largeNetwork";
import type { GetSmartEdgeParams } from "../src/getSmartEdge";
import type { SmartEdgeBatchItem } from "../src/routing/routeBatch";
import type { Edge, Node } from "@xyflow/react";

/**
 * Default measured size stamped onto every fixture node. `buildLargeNetwork`
 * emits plain nodes sized by React Flow's runtime measurement pass, which
 * never runs in this Node-environment bench, so obstacle boxes would
 * otherwise collapse to 1x1px (see `getBoundingBoxes`'s fallback). Matches
 * the `measured` size the project's own unit tests use as a stand-in (e.g.
 * `createGrid.test.ts`, `workerDispatch.test.ts`).
 */
const FIXTURE_NODE_WIDTH = 100;
const FIXTURE_NODE_HEIGHT = 50;

export interface BenchGraph {
  nodes: Node[];
  edges: Edge[];
}

const withMeasuredSize = (nodes: Node[]): Node[] =>
  nodes.map((node) => ({
    ...node,
    measured: { width: FIXTURE_NODE_WIDTH, height: FIXTURE_NODE_HEIGHT },
  }));

/** Builds a deterministic `buildLargeNetwork` graph with `measured` sizes
 * stamped on, so it's directly usable with the grid/pathfinding primitives
 * outside a browser. */
export const buildBenchGraph = (nodeCount: number, seed = 1): BenchGraph => {
  const { nodes, edges } = buildLargeNetwork(nodeCount, seed);
  return { nodes: withMeasuredSize(nodes), edges };
};

export const graph10 = buildBenchGraph(10);
export const graph100 = buildBenchGraph(100);
export const graph750 = buildBenchGraph(750);

/** Every `step`-th edge of `edges`, up to `count` — a smaller deterministic
 * sample (e.g. ~50 edges out of a 750-node graph's ~1125) spread evenly
 * across the full edge list rather than clustered at the start. */
export const sampleEdges = (edges: Edge[], count: number): Edge[] => {
  const step = Math.max(1, Math.floor(edges.length / count));
  const sampled: Edge[] = [];
  for (
    let index = 0;
    index < edges.length && sampled.length < count;
    index += step
  ) {
    sampled.push(edges[index]);
  }
  return sampled;
};

const nodeById = (nodes: Node[], nodeId: string): Node => {
  const node = nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`bench fixture: node "${nodeId}" not found`);
  return node;
};

/**
 * Converts a fixture `edge` (plus its graph's `nodes`) into `getSmartEdge`
 * params: a right-side source handle and a left-side target handle, each at
 * its node's vertical center. The handle sides are a fixed convention here —
 * irrelevant to routing cost — they only need to be a valid, walkable pair of
 * positions for `guaranteeWalkablePath` to carve out from.
 */
export const edgeToSmartEdgeParams = (
  nodes: Node[],
  edge: Edge,
): GetSmartEdgeParams => {
  const source = nodeById(nodes, edge.source);
  const target = nodeById(nodes, edge.target);
  const sourceWidth = source.measured?.width ?? 0;
  const sourceHeight = source.measured?.height ?? 0;
  const targetHeight = target.measured?.height ?? 0;

  return {
    nodes,
    sourceX: source.position.x + sourceWidth,
    sourceY: source.position.y + sourceHeight / 2,
    targetX: target.position.x,
    targetY: target.position.y + targetHeight / 2,
    sourcePosition: "right",
    targetPosition: "left",
  };
};

/** Converts a fixture graph into `routeSmartEdgeBatch` input: every edge
 * resolved to endpoints/handle positions up front, using the `bezier`
 * preset (A* diagonal search + smooth-line draw). */
export const graphToBatchItems = (graph: BenchGraph): SmartEdgeBatchItem[] =>
  graph.edges.map((edge) => {
    const params = edgeToSmartEdgeParams(graph.nodes, edge);
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceX: params.sourceX,
      sourceY: params.sourceY,
      targetX: params.targetX,
      targetY: params.targetY,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      preset: "bezier",
    };
  });
