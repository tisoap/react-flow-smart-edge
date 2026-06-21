import { MarkerType, Position } from "@xyflow/react";
import {
  SmartBezierEdge,
  SmartStraightEdge,
  SmartStepEdge,
  SmartSmoothStepEdge,
  SmartFloatingEdge,
  SmartEditableEdge,
  SmartCheckpointEdge,
} from "../index";
import { SmartEdgeCustomLabel } from "./CustomLabel";
import type { Node, Edge, Rect } from "@xyflow/react";

const markerEndType = MarkerType.Arrow;

export const edgeTypes = {
  smartBezier: SmartBezierEdge,
  smartStraight: SmartStraightEdge,
  smartStep: SmartStepEdge,
  smartSmoothStep: SmartSmoothStepEdge,
  smartFloating: SmartFloatingEdge,
  smartEditable: SmartEditableEdge,
  smartCheckpoint: SmartCheckpointEdge,
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

/**
 * A horizontal source -> target layout for the `avoidAreas` demo (issue #25).
 * The direct path between the two nodes is blocked by a consumer-provided
 * rectangle (see `demoAvoidAreas`), so the edge has to route around it just as
 * it would around a node. This is the recommended way to keep edges clear of
 * edge labels or any other arbitrary regions.
 */
export const avoidAreaNodes: Node[] = [
  {
    id: "aa-source",
    data: { label: "Source" },
    position: { x: 80, y: 200 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "aa-target",
    data: { label: "Target" },
    position: { x: 520, y: 200 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
];

export const avoidAreaEdgesBezier: Edge[] = [
  {
    id: "aa-e-source-target",
    source: "aa-source",
    target: "aa-target",
    type: "smartBezierAvoid",
    markerEnd: { type: markerEndType },
  },
];

/**
 * Rectangle (in graph coordinates) sitting on the direct path between the two
 * nodes above, forcing the edge to route around it.
 */
export const demoAvoidAreas: Rect[] = [
  { x: 260, y: 120, width: 150, height: 170 },
];

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

/**
 * A radial layout for the floating edge demo (issue #13). A central hub
 * connects to satellites placed in every direction. With fixed handles the
 * edges would all leave/enter the same side; floating edges instead attach to
 * the nearest border facing the other node, so each connection looks natural.
 */
export const floatingNodes: Node[] = [
  {
    id: "f-hub",
    data: { label: "Hub" },
    position: { x: 360, y: 230 },
  },
  {
    id: "f-top",
    data: { label: "Top" },
    position: { x: 360, y: 40 },
  },
  {
    id: "f-right",
    data: { label: "Right" },
    position: { x: 640, y: 230 },
  },
  {
    id: "f-bottom",
    data: { label: "Bottom" },
    position: { x: 360, y: 420 },
  },
  {
    id: "f-left",
    data: { label: "Left" },
    position: { x: 80, y: 230 },
  },
  {
    id: "f-top-right",
    data: { label: "Top Right" },
    position: { x: 620, y: 60 },
  },
  {
    id: "f-bottom-left",
    data: { label: "Bottom Left" },
    position: { x: 100, y: 410 },
  },
];

export const floatingEdges: Edge[] = [
  {
    id: "f-e-hub-top",
    source: "f-hub",
    target: "f-top",
    type: "smartFloating",
    markerEnd: { type: markerEndType },
  },
  {
    id: "f-e-hub-right",
    source: "f-hub",
    target: "f-right",
    type: "smartFloating",
    markerEnd: { type: markerEndType },
  },
  {
    id: "f-e-hub-bottom",
    source: "f-hub",
    target: "f-bottom",
    type: "smartFloating",
    markerEnd: { type: markerEndType },
  },
  {
    id: "f-e-hub-left",
    source: "f-hub",
    target: "f-left",
    type: "smartFloating",
    markerEnd: { type: markerEndType },
  },
  {
    id: "f-e-hub-top-right",
    source: "f-hub",
    target: "f-top-right",
    type: "smartFloating",
    markerEnd: { type: markerEndType },
  },
  {
    id: "f-e-hub-bottom-left",
    source: "f-hub",
    target: "f-bottom-left",
    type: "smartFloating",
    markerEnd: { type: markerEndType },
  },
];

/**
 * A layout for the editable edge demo (issue #36) with obstacle nodes sitting
 * directly between the source and target. The edge is routed through a
 * draggable waypoint (stored in `edge.data.points`); each segment still runs
 * the A* pathfinding, so the line keeps avoiding the obstacle nodes even as the
 * waypoint moves. Select the edge (or a connected node) to reveal the control
 * points, then drag a point, click an inactive point to add one, or press
 * Delete / right-click to remove one.
 */
export const editableNodes: Node[] = [
  {
    id: "ed-source",
    data: { label: "Source" },
    position: { x: 40, y: 240 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: "ed-target",
    data: { label: "Target" },
    position: { x: 620, y: 240 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  // A column of obstacles blocking the direct path between source and target.
  {
    id: "ed-obstacle-top",
    data: { label: "Obstacle 1" },
    position: { x: 320, y: 120 },
  },
  {
    id: "ed-obstacle-mid",
    data: { label: "Obstacle 2" },
    position: { x: 320, y: 240 },
  },
  {
    id: "ed-obstacle-bottom",
    data: { label: "Obstacle 3" },
    position: { x: 320, y: 360 },
  },
  // An offset obstacle the waypoint segments also have to route around.
  {
    id: "ed-obstacle-upper",
    data: { label: "Obstacle 4" },
    position: { x: 150, y: 60 },
  },
];

export const editableEdges: Edge[] = [
  {
    id: "ed-e-source-target",
    source: "ed-source",
    target: "ed-target",
    type: "smartEditable",
    selected: true,
    markerEnd: { type: markerEndType },
    data: {
      points: [{ id: "ed-wp-1", x: 360, y: 40, active: true }],
    },
  },
];

/** Same layout as the editable demo, but with fixed checkpoints instead of UI waypoints. */
export const checkpointNodes = editableNodes;

export const checkpointEdges: Edge[] = [
  {
    id: "cp-e-source-target",
    source: "ed-source",
    target: "ed-target",
    type: "smartCheckpoint",
    markerEnd: { type: markerEndType },
    data: {
      checkpoints: [{ x: 360, y: 40 }],
    },
  },
];
