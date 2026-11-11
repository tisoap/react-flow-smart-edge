import type { Node, XYPosition } from "@xyflow/react";

/**
 * Build a lookup of nodes by id for parent-chain traversal.
 */
const toNodeMap = (nodes: Node[]): Map<string, Node> => {
  const map = new Map<string, Node>();
  for (const node of nodes) {
    map.set(node.id, node);
  }
  return map;
};

/**
 * Resolve a node's absolute position by walking up its `parentId` chain and
 * summing the relative offsets.
 *
 * React Flow stores a child node's `position` relative to its parent (see
 * https://reactflow.dev/examples/grouping/sub-flows), while edge handle
 * coordinates are always absolute. The pathfinding pipeline needs both in the
 * same (absolute) coordinate space, otherwise obstacles inside a subflow are
 * modeled in the wrong place. Assumes the default node `origin` of [0, 0].
 */
const getAbsolutePosition = (
  node: Node,
  nodeMap: Map<string, Node>,
): XYPosition => {
  let posX = node.position.x;
  let posY = node.position.y;

  let parentId = node.parentId;
  const visited = new Set<string>([node.id]);

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = nodeMap.get(parentId);
    if (!parent) break;
    posX += parent.position.x;
    posY += parent.position.y;
    parentId = parent.parentId;
  }

  return { x: posX, y: posY };
};

/**
 * Return a copy of the nodes where each `position` is its absolute coordinate
 * in the flow, resolving any `parentId` (subflow) offsets. Nodes without a
 * parent are returned unchanged (aside from being copied).
 */
export const getAbsoluteNodes = (nodes: Node[]): Node[] => {
  const nodeMap = toNodeMap(nodes);

  return nodes.map((node) => {
    if (!node.parentId) return node;
    return {
      ...node,
      position: getAbsolutePosition(node, nodeMap),
    };
  });
};

/**
 * A node id to `parentId` lookup. Built once per node list (see
 * `buildParentIdLookup`) so resolving an edge's ancestors costs one map read
 * per level of nesting instead of a scan over every node.
 */
export type ParentIdLookup = ReadonlyMap<string, string | undefined>;

export const buildParentIdLookup = (nodes: Node[]): ParentIdLookup =>
  new Map(nodes.map((node) => [node.id, node.parentId]));

/**
 * The ids of every container an edge lives inside: the `parentId` chains of
 * both endpoints, deduplicated, source chain first.
 *
 * This is the only definition of "an edge's ancestors" in the library. The
 * routing core uses it to drop those containers from the obstacle set (see
 * `excludeEdgeAncestorNodes`) and the scheduler uses it for its clearance
 * check, its per-edge signature, and its route-cache key. Both sides must
 * agree, otherwise an edge inside a subflow is judged against one obstacle
 * set and routed against another.
 */
export const getEdgeAncestorIds = (
  sourceId: string,
  targetId: string,
  parentIds: ParentIdLookup,
): string[] => {
  const ancestors = new Set<string>();

  // Stopping at an id that is already collected covers both a `parentId`
  // cycle and the two endpoints sharing a container: that container's own
  // chain was walked when it was first added.
  for (const endpointId of [sourceId, targetId]) {
    let parentId = parentIds.get(endpointId);
    while (parentId && !ancestors.has(parentId)) {
      ancestors.add(parentId);
      parentId = parentIds.get(parentId);
    }
  }

  return [...ancestors];
};

/**
 * Remove the container nodes that an edge lives inside from the obstacle set.
 *
 * An edge's own subflow container (and any node further up the chain) should
 * not be treated as a solid obstacle, otherwise the path is forced to route
 * around the container instead of within it. Sibling and unrelated group nodes
 * are kept so the edge still avoids them.
 *
 * `parentIds` is the lookup for `nodes`; callers that process many edges
 * against the same node list build it once and pass it to every call.
 */
export const excludeEdgeAncestorNodes = (
  nodes: Node[],
  sourceId: string,
  targetId: string,
  parentIds: ParentIdLookup,
): Node[] => {
  const ancestorIds = getEdgeAncestorIds(sourceId, targetId, parentIds);
  if (ancestorIds.length === 0) return nodes;

  const ancestors = new Set(ancestorIds);
  return nodes.filter((node) => !ancestors.has(node.id));
};
