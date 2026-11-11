import { markerEndType } from "./shared";
import type { Node, Edge, XYPosition } from "@xyflow/react";

type Placement = "outside" | "inside";

const GROUP_ID = "gp-group";

/**
 * Where the group sits in the flow. Children are positioned relative to it,
 * so this is also the translation between the top-level copy of the scene
 * (laid out from the flow origin) and the copy inside the group. Both axes
 * are multiples of the default `gridRatio` (10), which keeps the two copies
 * on the same grid cells and makes their routed paths directly comparable.
 */
export const groupParityOffset: XYPosition = { x: 640, y: 0 };

const BLOCKED_EDGE = "blocked-edge";
const CLEAR_EDGE = "clear-edge";

const sceneId = (placement: Placement, name: string): string =>
  `gp-${placement}-${name}`;

/**
 * One copy of the scene: a source/target pair with an obstacle squarely
 * between them (the edge has to detour), next to a pair with nothing between
 * them (the edge is already clear).
 */
const sceneNodes = (placement: Placement): Node[] => {
  const parent = placement === "inside" ? { parentId: GROUP_ID } : {};

  return [
    {
      id: sceneId(placement, "source"),
      data: { label: "Source" },
      position: { x: 60, y: 40 },
      ...parent,
    },
    {
      id: sceneId(placement, "obstacle"),
      data: { label: "Obstacle" },
      position: { x: 60, y: 150 },
      style: { width: 150, height: 80 },
      ...parent,
    },
    {
      id: sceneId(placement, "target"),
      data: { label: "Target" },
      position: { x: 60, y: 300 },
      ...parent,
    },
    {
      id: sceneId(placement, "clear-source"),
      data: { label: "Clear source" },
      position: { x: 300, y: 40 },
      ...parent,
    },
    {
      id: sceneId(placement, "clear-target"),
      data: { label: "Clear target" },
      position: { x: 360, y: 300 },
      ...parent,
    },
  ];
};

const sceneEdges = (placement: Placement): Edge[] => [
  {
    id: sceneId(placement, BLOCKED_EDGE),
    source: sceneId(placement, "source"),
    target: sceneId(placement, "target"),
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
  {
    id: sceneId(placement, CLEAR_EDGE),
    source: sceneId(placement, "clear-source"),
    target: sceneId(placement, "clear-target"),
    type: "smartBezier",
    markerEnd: { type: markerEndType },
  },
];

/** Edge ids of both copies, for stories that compare them pair by pair. */
export const groupParityEdgeIds = {
  outside: {
    blocked: sceneId("outside", BLOCKED_EDGE),
    clear: sceneId("outside", CLEAR_EDGE),
  },
  inside: {
    blocked: sceneId("inside", BLOCKED_EDGE),
    clear: sceneId("inside", CLEAR_EDGE),
  },
};

/**
 * The same five-node scene twice: once as top-level nodes (left) and once as
 * children of a `type: "group"` node (right), translated by
 * `groupParityOffset` and otherwise identical.
 *
 * A group that contains an edge's endpoints is structure, not an obstacle, so
 * each edge on the right must come out exactly like its twin on the left: the
 * blocked pair takes the same detour around its obstacle, and the clear pair
 * keeps the same native path when `routeOnlyWhenBlocked` is on.
 */
export const groupParityNodes: Node[] = [
  ...sceneNodes("outside"),
  {
    id: GROUP_ID,
    type: "group",
    data: {},
    position: groupParityOffset,
    style: { width: 570, height: 400 },
  },
  ...sceneNodes("inside"),
];

export const groupParityEdgesBezier: Edge[] = [
  ...sceneEdges("outside"),
  ...sceneEdges("inside"),
];
