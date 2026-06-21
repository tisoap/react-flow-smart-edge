import { markerEndType } from "./shared";
import type { Node, Edge } from "@xyflow/react";

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
