import { Position } from "@xyflow/react";
import { markerEndType } from "./shared";
import type { Node, Edge, Rect } from "@xyflow/react";

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
