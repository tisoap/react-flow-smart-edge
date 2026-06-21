import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

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
