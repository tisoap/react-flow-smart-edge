import type { Node } from "@xyflow/react";
import type { RegisteredSmartEdge } from "./scheduler";

export type ParentIdByNodeId = ReadonlyMap<string, string | undefined>;

export const buildParentIdLookup = (nodes: Node[]): ParentIdByNodeId =>
  new Map(nodes.map((node) => [node.id, node.parentId]));

/** Resolve both endpoints' ancestor ids from a lookup shared by the flush. */
export const ancestorIdsFor = (
  edge: RegisteredSmartEdge,
  parentIdByNodeId: ParentIdByNodeId,
): string[] => {
  const ancestors = new Set<string>();

  const collect = (nodeId: string): void => {
    let parentId = parentIdByNodeId.get(nodeId);
    while (parentId && !ancestors.has(parentId)) {
      ancestors.add(parentId);
      parentId = parentIdByNodeId.get(parentId);
    }
  };

  collect(edge.source);
  collect(edge.target);
  return [...ancestors];
};

/** Build one parent lookup and memoize endpoint ancestry for a routing flush. */
export const createAncestorIdResolver = (
  nodes: Node[],
): ((edge: RegisteredSmartEdge) => string[]) => {
  const parentIdByNodeId = buildParentIdLookup(nodes);
  const ancestorIdsByEdgeId = new Map<string, string[]>();

  return (edge) => {
    const cached = ancestorIdsByEdgeId.get(edge.id);
    if (cached) return cached;

    const resolved = ancestorIdsFor(edge, parentIdByNodeId);
    ancestorIdsByEdgeId.set(edge.id, resolved);
    return resolved;
  };
};

export const edgeSignature = (edge: RegisteredSmartEdge): string =>
  JSON.stringify({
    sourceX: edge.sourceX,
    sourceY: edge.sourceY,
    targetX: edge.targetX,
    targetY: edge.targetY,
    sourcePosition: edge.sourcePosition,
    targetPosition: edge.targetPosition,
    preset: edge.preset,
    options: edge.options,
    waypoints: edge.waypoints,
  });
