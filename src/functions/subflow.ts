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
 * Collect the ids of a node and all of its ancestors (its `parentId` chain).
 */
const collectAncestorIds = (
  nodeId: string,
  nodeMap: Map<string, Node>,
): Set<string> => {
  const ancestors = new Set<string>();
  let parentId = nodeMap.get(nodeId)?.parentId;

  while (parentId && !ancestors.has(parentId)) {
    ancestors.add(parentId);
    parentId = nodeMap.get(parentId)?.parentId;
  }

  return ancestors;
};

/**
 * Remove the container nodes that an edge lives inside from the obstacle set.
 *
 * An edge's own subflow container (and any node further up the chain) should
 * not be treated as a solid obstacle, otherwise the path is forced to route
 * around the container instead of within it. Sibling and unrelated group nodes
 * are kept so the edge still avoids them.
 */
export const excludeEdgeAncestorNodes = (
  nodes: Node[],
  sourceId: string,
  targetId: string,
): Node[] => {
  const nodeMap = toNodeMap(nodes);
  const ancestors = collectAncestorIds(sourceId, nodeMap);
  for (const ancestorId of collectAncestorIds(targetId, nodeMap)) {
    ancestors.add(ancestorId);
  }

  if (ancestors.size === 0) return nodes;

  return nodes.filter((node) => !ancestors.has(node.id));
};
