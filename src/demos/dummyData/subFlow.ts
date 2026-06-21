import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

const subFlowChildOneId = "sf-child-1";
const subFlowChildTwoId = "sf-child-2";

/**
 * A subflow scenario based on
 * https://github.com/tisoap/react-flow-smart-edge/issues/32, extended with
 * nodes outside the container to exercise every interaction:
 *
 * - edges between two children inside the subflow,
 * - edges between nodes outside the subflow,
 * - edges from an outside node into a child of the subflow,
 * - edges from an outside node to the subflow container itself.
 *
 * Child positions are relative to the parent, so routing only works once they
 * are resolved to absolute coordinates and the edge's own container is excluded
 * from the obstacle set.
 *
 * The container ("sf-parent") is a regular node (not `type: "group"`) so it has
 * handles and can be the source/target of an edge.
 */
export const subFlowNodes: Node[] = [
  {
    id: "sf-parent",
    data: { label: "WHILE (subflow)" },
    position: { x: 260, y: 60 },
    style: { width: 480, height: 420 },
  },
  {
    id: subFlowChildOneId,
    data: { label: "Child 1" },
    position: { x: 60, y: 220 },
    parentId: "sf-parent",
    extent: "parent",
  },
  {
    id: subFlowChildTwoId,
    data: { label: "Child 2" },
    position: { x: 240, y: 320 },
    parentId: "sf-parent",
    extent: "parent",
  },
  {
    id: "sf-out-a",
    data: { label: "Outside A" },
    position: { x: 20, y: 60 },
  },
  {
    id: "sf-out-b",
    data: { label: "Outside B" },
    position: { x: 20, y: 220 },
  },
  {
    id: "sf-out-c",
    data: { label: "Outside C" },
    position: { x: 20, y: 380 },
  },
  {
    id: "sf-out-d",
    data: { label: "Outside D" },
    position: { x: 820, y: 120 },
  },
  {
    id: "sf-out-e",
    data: { label: "Outside E" },
    position: { x: 820, y: 320 },
  },
];

export const subFlowEdgesBezier: Edge[] = [
  // Inside the subflow
  {
    id: "sf-e-c1-c2",
    source: subFlowChildOneId,
    target: subFlowChildTwoId,
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  // Outside <-> outside
  {
    id: "sf-e-a-b",
    source: "sf-out-a",
    target: "sf-out-b",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "sf-e-b-c",
    source: "sf-out-b",
    target: "sf-out-c",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  // Outside -> child inside the subflow
  {
    id: "sf-e-c-child1",
    source: "sf-out-c",
    target: subFlowChildOneId,
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "sf-e-e-child2",
    source: "sf-out-e",
    target: subFlowChildTwoId,
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  // Outside -> the subflow container itself
  {
    id: "sf-e-a-parent",
    source: "sf-out-a",
    target: "sf-parent",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "sf-e-d-parent",
    source: "sf-out-d",
    target: "sf-parent",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
];

export const subFlowEdgesStep: Edge[] = subFlowEdgesBezier.map((edge) => ({
  ...edge,
  type: "smartStep",
}));

/**
 * The same scenario, but with the container rendered as a real React Flow
 * `type: "group"` node. Group nodes render without handles, so edges targeting
 * the container itself are omitted here; the remaining cases (inside the
 * subflow, outside <-> outside, and outside -> child) still apply.
 */
export const subFlowGroupNodes: Node[] = subFlowNodes.map((node) =>
  node.id === "sf-parent"
    ? { ...node, type: "group", data: { label: "" } }
    : node,
);

export const subFlowGroupEdgesBezier: Edge[] = subFlowEdgesBezier.filter(
  (edge) => edge.source !== "sf-parent" && edge.target !== "sf-parent",
);

export const subFlowGroupEdgesStep: Edge[] = subFlowGroupEdgesBezier.map(
  (edge) => ({
    ...edge,
    type: "smartStep",
  }),
);
