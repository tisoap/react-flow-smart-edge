import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

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
