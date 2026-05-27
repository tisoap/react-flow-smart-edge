import { MarkerType, Position } from "@xyflow/react";
import { SmartBezierEdge, SmartStraightEdge, SmartStepEdge } from "../index";
import { SmartEdgeCustomLabel } from "./CustomLabel";
import type { Node, Edge } from "@xyflow/react";

const markerEndType = MarkerType.Arrow;

export const edgeTypes = {
  smartBezier: SmartBezierEdge,
  smartStraight: SmartStraightEdge,
  smartStep: SmartStepEdge,
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
