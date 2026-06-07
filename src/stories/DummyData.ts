import { MarkerType, Position } from "@xyflow/react";
import {
  SmartBezierEdge,
  SmartStraightEdge,
  SmartStepEdge,
  SmartSmoothStepEdge,
} from "../index";
import { SmartEdgeCustomLabel } from "./CustomLabel";
import type { Node, Edge } from "@xyflow/react";

const markerEndType = MarkerType.Arrow;

export const edgeTypes = {
  smartBezier: SmartBezierEdge,
  smartStraight: SmartStraightEdge,
  smartStep: SmartStepEdge,
  smartSmoothStep: SmartSmoothStepEdge,
  smartBezierLabel: SmartEdgeCustomLabel,
};

export const nodes: Node[] = [
  {
    id: "1",
    data: {
      label: "Node 1",
    },
    position: {
      x: 490,
      y: 40,
    },
  },
  {
    id: "2",
    data: {
      label: "Node 2",
    },
    position: {
      x: 270,
      y: 130,
    },
  },
  {
    id: "3",
    data: {
      label: "Node 3",
    },
    position: {
      x: 40,
      y: 220,
    },
  },
  {
    id: "4",
    data: {
      label: "Node 4",
    },
    position: {
      x: 270,
      y: 220,
    },
  },
  {
    id: "5",
    data: {
      label: "Node 5",
    },
    position: {
      x: 470,
      y: 220,
    },
  },
  {
    id: "6",
    data: {
      label: "Node 6",
    },
    position: {
      x: 515,
      y: 310,
    },
  },
  {
    id: "7",
    data: {
      label: "Node 7",
    },
    position: {
      x: 470,
      y: 130,
    },
  },
];

export const edgesBezier: Edge[] = [
  {
    id: "e12",
    source: "1",
    target: "2",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
    label: "Edge Label",
  },
  {
    id: "e17",
    source: "1",
    target: "7",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "e23",
    source: "2",
    target: "3",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "e24",
    source: "2",
    target: "4",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "e25",
    source: "2",
    target: "5",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "e56",
    source: "5",
    target: "6",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
    data: {
      customField: "custom data",
    },
  },
  {
    id: "e65",
    source: "6",
    target: "5",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "e61",
    source: "6",
    target: "1",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "e3",
    source: "3",
    target: "3",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
];

export const edgesStraight: Edge[] = edgesBezier.map((edge) => ({
  ...edge,
  type: "smartStraight",
}));

export const edgesStep: Edge[] = edgesBezier.map((edge) => ({
  ...edge,
  type: "smartStep",
}));

export const edgesSmoothStep: Edge[] = edgesBezier.map((edge) => ({
  ...edge,
  type: "smartSmoothStep",
}));

export const edgesLabel: Edge[] = edgesBezier.map((edge) => ({
  ...edge,
  type: "smartBezierLabel",
}));

export const simpleNodes: Node[] = [
  {
    id: "1",
    data: { label: "Node 1 (Below)" },
    position: { x: 300, y: 300 },
  },
  {
    id: "2",
    data: { label: "Node 2 (Above)" },
    position: { x: 300, y: 120 },
  },
];

export const simpleEdgesBezier: Edge[] = [
  {
    id: "e1-2-simple",
    source: "1",
    target: "2",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
];

/**
 * Nodes whose x/y positions are intentionally off the default grid
 * (gridRatio = 10), to exercise the endpoint alignment fix from
 * https://github.com/tisoap/react-flow-smart-edge/issues/49.
 *
 * A "Timer" parent (top/bottom flow) connects down to three children whose
 * X positions don't align with multiples of 10, which previously produced
 * a small diagonal "kink" near each handle.
 */
export const unalignedNodes: Node[] = [
  {
    id: "u-timer",
    data: { label: "Timer (Source)" },
    position: { x: 303, y: 47 },
  },
  {
    id: "u-choice-1",
    data: { label: "Choice A" },
    position: { x: 88, y: 247 },
  },
  {
    id: "u-choice-2",
    data: { label: "Choice B" },
    position: { x: 297, y: 247 },
  },
  {
    id: "u-compare",
    data: { label: "Compare" },
    position: { x: 511, y: 247 },
  },
];

export const unalignedEdgesStep: Edge[] = [
  {
    id: "u-e-timer-choice-1",
    source: "u-timer",
    target: "u-choice-1",
    type: "smartStep",
    markerEnd: { type: markerEndType },
  },
  {
    id: "u-e-timer-choice-2",
    source: "u-timer",
    target: "u-choice-2",
    type: "smartStep",
    markerEnd: { type: markerEndType },
  },
  {
    id: "u-e-timer-compare",
    source: "u-timer",
    target: "u-compare",
    type: "smartStep",
    markerEnd: { type: markerEndType },
  },
];

/**
 * Nodes laid out left-to-right with the source handle on the right and the
 * target handle on the left. Mirrors the horizontal scenario from
 * https://github.com/tisoap/react-flow-smart-edge/issues/45 and exercises
 * the horizontal branch of the endpoint alignment fix.
 *
 * Y positions are deliberately off-grid so the previous diagonal kink
 * would be visible without the fix.
 */
export const horizontalNodes: Node[] = [
  {
    id: "h-source",
    data: { label: "Source" },
    position: { x: 60, y: 137 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "h-middle",
    data: { label: "Middle" },
    position: { x: 320, y: 247 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "h-target",
    data: { label: "Target" },
    position: { x: 580, y: 73 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

export const horizontalEdgesStep: Edge[] = [
  {
    id: "h-e-source-middle",
    source: "h-source",
    target: "h-middle",
    type: "smartStep",
    markerEnd: { type: markerEndType },
  },
  {
    id: "h-e-middle-target",
    source: "h-middle",
    target: "h-target",
    type: "smartStep",
    markerEnd: { type: markerEndType },
  },
];

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
    id: "sf-child-1",
    data: { label: "Child 1" },
    position: { x: 60, y: 220 },
    parentId: "sf-parent",
    extent: "parent",
  },
  {
    id: "sf-child-2",
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
    source: "sf-child-1",
    target: "sf-child-2",
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
    target: "sf-child-1",
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: "sf-e-e-child2",
    source: "sf-out-e",
    target: "sf-child-2",
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
