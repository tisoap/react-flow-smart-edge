import { Position } from "@xyflow/react";
import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

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
