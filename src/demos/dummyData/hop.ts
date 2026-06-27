import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

/**
 * A vertical edge (top -> bottom) and a horizontal edge (left -> right) routed
 * so they cross squarely in the middle, exercising the circuit-style "hop"
 * bridge where the top wire arcs over the bottom one. Node handles are React
 * Flow defaults (source on the bottom, target on the top).
 */
export const hopNodes: Node[] = [
  { id: "h-top", data: { label: "Top" }, position: { x: 250, y: 0 } },
  { id: "h-bottom", data: { label: "Bottom" }, position: { x: 250, y: 400 } },
  { id: "h-left", data: { label: "Left" }, position: { x: 0, y: 190 } },
  { id: "h-right", data: { label: "Right" }, position: { x: 520, y: 190 } },
];

export const hopEdgesStep: Edge[] = [
  {
    id: "h-vertical",
    source: "h-top",
    target: "h-bottom",
    type: "smartStepHop",
    markerEnd: { type: markerEndType },
  },
  {
    id: "h-horizontal",
    source: "h-left",
    target: "h-right",
    type: "smartStepHop",
    markerEnd: { type: markerEndType },
  },
];

export const hopEdgesSmoothStep: Edge[] = hopEdgesStep.map((edge) => ({
  ...edge,
  id: `${edge.id}-smooth`,
  type: "smartSmoothStepHop",
}));
