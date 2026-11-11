import type { RegisteredSmartEdge } from "./scheduler";

/** The subset of an edge's registration that determines its route, plus the
 * ids of the containers it lives inside (`getEdgeAncestorIds`): reparenting
 * an endpoint changes the obstacle set even when no coordinate moves.
 * Distinct from `routeCacheKey`'s (rounded, obstacle-hashed) key: this is an
 * exact comparison used only to detect "nothing changed since last
 * processed". */
export const edgeSignature = (
  edge: RegisteredSmartEdge,
  ancestorIds: readonly string[],
): string =>
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
    ancestorIds,
  });
