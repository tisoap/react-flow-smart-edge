import { Position } from "@xyflow/react";
import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

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
