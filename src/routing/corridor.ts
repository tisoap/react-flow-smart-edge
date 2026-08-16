import { getBoundingBoxes } from "../functions";
import { buildObstacleBoxes, rectIntersectsBox } from "./obstacleIndex";
import type {
  GraphBoundingBox,
  NodeBoundingBox,
  PointInfo,
} from "../functions";
import type { ObstacleBox } from "./obstacleIndex";
import type { Node, Rect } from "@xyflow/react";

/**
 * Widening margins (in grid cells) tried before falling back to a full-graph
 * routing pass. `getSmartEdge` routes on a small sub-grid cropped to the
 * endpoints first (see `buildCorridorAttempt`), only paying for a bigger grid
 * when the narrower one has no path.
 */
export const CORRIDOR_MARGIN_CELLS = [8, 16, 32] as const;

/** Axis-aligned rect (graph coordinates) covering both routing endpoints. */
interface EndpointRect {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

/**
 * The endpoint bounding box inflated by `marginCells * gridRatio` plus
 * `nodePadding` on every side. Obstacles whose own padded rect intersects
 * this box are considered "local" to the corridor attempt.
 */
const buildCorridorRect = (
  source: PointInfo,
  target: PointInfo,
  nodePadding: number,
  gridRatio: number,
  marginCells: number,
): EndpointRect => {
  const inflate = marginCells * gridRatio + nodePadding;

  return {
    xMin: Math.min(source.x, target.x) - inflate,
    yMin: Math.min(source.y, target.y) - inflate,
    xMax: Math.max(source.x, target.x) + inflate,
    yMax: Math.max(source.y, target.y) + inflate,
  };
};

/**
 * Indexes of the items whose corresponding obstacle box (same index) falls
 * inside `rect`. `boxes` must be parallel to the item array (i.e. built from
 * it by `buildObstacleBoxes`).
 */
const selectIntersectingIndexes = (
  boxes: ObstacleBox[],
  rect: EndpointRect,
): number[] => {
  const indexes: number[] = [];

  boxes.forEach((box, index) => {
    if (rectIntersectsBox(rect.xMin, rect.yMin, rect.xMax, rect.yMax, box)) {
      indexes.push(index);
    }
  });

  return indexes;
};

/** Bounding-box output for a single corridor (or full-graph) routing attempt. */
export interface CorridorAttempt {
  graphBox: GraphBoundingBox;
  nodeBoxes: NodeBoundingBox[];
  avoidBoxes: NodeBoundingBox[];
}

/** Runs `getBoundingBoxes` over the nodes/areas at `nodeIndexes`/`areaIndexes`. */
const buildAttemptFromIndexes = (
  nodes: Node[],
  avoidAreas: Rect[],
  nodeIndexes: number[],
  areaIndexes: number[],
  nodePadding: number,
  gridRatio: number,
  source: PointInfo,
  target: PointInfo,
): CorridorAttempt => {
  const filteredNodes = nodeIndexes.map((index) => nodes[index]);
  const filteredAreas = areaIndexes.map((index) => avoidAreas[index]);

  const { graphBox, nodeBoxes, avoidBoxes } = getBoundingBoxes(
    filteredNodes,
    nodePadding,
    gridRatio,
    filteredAreas,
    [
      { x: source.x, y: source.y },
      { x: target.x, y: target.y },
    ],
  );

  return { graphBox, nodeBoxes, avoidBoxes };
};

/** Whether re-selecting against the latest graph box picked up no new
 * obstacles compared to the previous round, i.e. the selection has reached
 * a fixpoint. */
const isStableSelection = (
  previousNodeCount: number,
  previousAreaCount: number,
  nextNodeIndexes: number[],
  nextAreaIndexes: number[],
): boolean =>
  nextNodeIndexes.length === previousNodeCount &&
  nextAreaIndexes.length === previousAreaCount;

/**
 * Builds the bounding boxes for one rung of the corridor retry ladder: crop
 * `nodes` and `avoidAreas` down to whichever ones are local to the endpoints
 * at this margin, then hand the filtered sets to `getBoundingBoxes` so the
 * grid geometry, rounding, and border padding come out byte-identical to a
 * full-grid run over that same (smaller) obstacle set.
 *
 * A single corridor-rect filter pass is not enough: a large obstacle that
 * merely *touches* the corridor is included whole, which can stretch the
 * resulting graph box well past the corridor's own edge. A second obstacle
 * that didn't intersect the original (smaller) corridor rect can end up
 * sitting inside that stretched box — if it stayed excluded, the grid would
 * silently treat its space as walkable. So after computing the graph box, we
 * re-select every node/area against *that box* and rebuild; each round's
 * selection is always a superset of the previous one (a box built from a
 * given selection necessarily contains every member of it, so re-selecting
 * against that box re-includes them all), so the selected count only grows,
 * bounded by the total obstacle count — the loop always reaches a fixpoint
 * (no new obstacles picked up) within that many rounds, typically the very
 * first one.
 */
export const buildCorridorAttempt = (
  source: PointInfo,
  target: PointInfo,
  nodes: Node[],
  nodePadding: number,
  gridRatio: number,
  avoidAreas: Rect[],
  marginCells: number,
): CorridorAttempt => {
  const corridor = buildCorridorRect(
    source,
    target,
    nodePadding,
    gridRatio,
    marginCells,
  );

  const nodeObstacles = buildObstacleBoxes(nodes, nodePadding);
  const areaObstacles = buildObstacleBoxes([], nodePadding, avoidAreas);

  let nodeIndexes = selectIntersectingIndexes(nodeObstacles, corridor);
  let areaIndexes = selectIntersectingIndexes(areaObstacles, corridor);

  for (;;) {
    const attempt = buildAttemptFromIndexes(
      nodes,
      avoidAreas,
      nodeIndexes,
      areaIndexes,
      nodePadding,
      gridRatio,
      source,
      target,
    );

    const nextNodeIndexes = selectIntersectingIndexes(
      nodeObstacles,
      attempt.graphBox,
    );
    const nextAreaIndexes = selectIntersectingIndexes(
      areaObstacles,
      attempt.graphBox,
    );

    if (
      isStableSelection(
        nodeIndexes.length,
        areaIndexes.length,
        nextNodeIndexes,
        nextAreaIndexes,
      )
    ) {
      return attempt;
    }

    nodeIndexes = nextNodeIndexes;
    areaIndexes = nextAreaIndexes;
  }
};
