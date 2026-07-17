import type { Node } from "@xyflow/react";

/**
 * A per-node snapshot of the state that can affect routing: absolute
 * position, measured size, and the dragging/selected flags. Absolute
 * positions are the caller's responsibility — this module only reads
 * `node.position` verbatim, so a provider resolving subflow offsets (see
 * `getAbsoluteNodes`) must do so before snapshotting.
 */
export interface NodeSnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  dragging: boolean;
  selected: boolean;
}

/**
 * Captures every node's routing-relevant state, using the same
 * measured-size floor as `getBoundingBoxes`/`buildObstacleBoxes` (missing
 * dimensions collapse to 1px) so a snapshot's rect lines up with the
 * obstacle boxes built from the same nodes.
 */
export const snapshotNodes = (nodes: Node[]): NodeSnapshot[] =>
  nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: Math.max(node.measured?.width ?? 0, 1),
    height: Math.max(node.measured?.height ?? 0, 1),
    dragging: node.dragging ?? false,
    selected: node.selected ?? false,
  }));

/** Axis-aligned rect in graph coordinates (an `ObstacleBox` minus its `id`:
 * a changed rect no longer needs to identify an owning node). */
interface ChangedRect {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

/**
 * Result of comparing two node snapshots: whether anything routing-relevant
 * changed, the padded rects touched by any moved/resized/added/removed node
 * (a moved/resized node contributes both its old and new rect, since a
 * cached route can be invalidated by either the space it vacated or the
 * space it now occupies), and the dragging/selected id sets read from
 * `next` — populated regardless of `changed`, so drag-preview fast paths
 * can key off them directly.
 */
export interface NodeDiff {
  changed: boolean;
  changedRects: ChangedRect[];
  draggingNodeIds: Set<string>;
  selectedNodeIds: Set<string>;
}

const paddedRect = (
  snapshot: NodeSnapshot,
  nodePadding: number,
): ChangedRect => ({
  xMin: snapshot.x - nodePadding,
  yMin: snapshot.y - nodePadding,
  xMax: snapshot.x + snapshot.width + nodePadding,
  yMax: snapshot.y + snapshot.height + nodePadding,
});

const hasMoved = (previous: NodeSnapshot, current: NodeSnapshot): boolean =>
  previous.x !== current.x ||
  previous.y !== current.y ||
  previous.width !== current.width ||
  previous.height !== current.height;

/**
 * Handles one previously-known node: pushes its old rect if it was removed,
 * both its old and new rect if it moved/resized, or nothing if it is still
 * present and unchanged. Returns whether this node contributed a change.
 */
const collectPreviousNodeRects = (
  previousSnapshot: NodeSnapshot,
  nextSnapshot: NodeSnapshot | undefined,
  nodePadding: number,
  changedRects: ChangedRect[],
): boolean => {
  if (nextSnapshot === undefined) {
    changedRects.push(paddedRect(previousSnapshot, nodePadding));
    return true;
  }

  if (hasMoved(previousSnapshot, nextSnapshot)) {
    changedRects.push(paddedRect(previousSnapshot, nodePadding));
    changedRects.push(paddedRect(nextSnapshot, nodePadding));
    return true;
  }

  return false;
};

/**
 * Compares two node snapshots (matched by id) and reports what changed. A
 * node that neither moved nor resized contributes no rects; a moved/resized
 * node contributes both its old and new padded rect; an added or removed
 * node contributes the one rect it has.
 */
export const diffNodeSnapshots = (
  previous: NodeSnapshot[],
  next: NodeSnapshot[],
  nodePadding: number,
): NodeDiff => {
  const previousById = new Map(
    previous.map((snapshot) => [snapshot.id, snapshot]),
  );
  const nextById = new Map(next.map((snapshot) => [snapshot.id, snapshot]));

  const changedRects: ChangedRect[] = [];
  let changed = false;

  previousById.forEach((previousSnapshot, nodeId) => {
    const contributed = collectPreviousNodeRects(
      previousSnapshot,
      nextById.get(nodeId),
      nodePadding,
      changedRects,
    );
    if (contributed) changed = true;
  });

  nextById.forEach((nextSnapshot, nodeId) => {
    if (previousById.has(nodeId)) return;
    changedRects.push(paddedRect(nextSnapshot, nodePadding));
    changed = true;
  });

  const draggingNodeIds = new Set<string>();
  const selectedNodeIds = new Set<string>();

  next.forEach((snapshot) => {
    if (snapshot.dragging) draggingNodeIds.add(snapshot.id);
    if (snapshot.selected) selectedNodeIds.add(snapshot.id);
  });

  return { changed, changedRects, draggingNodeIds, selectedNodeIds };
};

/**
 * Straightforward axis-aligned overlap test (exclusive bounds, same
 * convention as `rectIntersectsBox`) between a routing corridor and a
 * diff's changed rects: true as soon as any rect overlaps the corridor's
 * interior.
 */
export const corridorTouchesRects = (
  corridor: ChangedRect,
  rects: ChangedRect[],
): boolean =>
  rects.some(
    (rect) =>
      corridor.xMin < rect.xMax &&
      corridor.xMax > rect.xMin &&
      corridor.yMin < rect.yMax &&
      corridor.yMax > rect.yMin,
  );
