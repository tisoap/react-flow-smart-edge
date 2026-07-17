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
 * Keeps only the items whose corresponding obstacle box (same index) falls
 * inside the corridor rect. `boxes` must be parallel to `items` (i.e. built
 * from the same array by `buildObstacleBoxes`).
 */
const filterWithinCorridor = <Item>(
  items: Item[],
  boxes: ObstacleBox[],
  corridor: EndpointRect,
): Item[] =>
  items.filter((_item, index) =>
    rectIntersectsBox(
      corridor.xMin,
      corridor.yMin,
      corridor.xMax,
      corridor.yMax,
      boxes[index],
    ),
  );

/** Bounding-box output for a single corridor (or full-graph) routing attempt. */
export interface CorridorAttempt {
  graphBox: GraphBoundingBox;
  nodeBoxes: NodeBoundingBox[];
  avoidBoxes: NodeBoundingBox[];
}

/**
 * Builds the bounding boxes for one rung of the corridor retry ladder: crop
 * `nodes` and `avoidAreas` down to whichever ones are local to the endpoints
 * at this margin, then hand the filtered sets to `getBoundingBoxes` so the
 * grid geometry, rounding, and border padding come out byte-identical to a
 * full-grid run over that same (smaller) obstacle set.
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
  const filteredNodes = filterWithinCorridor(nodes, nodeObstacles, corridor);

  const areaObstacles = buildObstacleBoxes([], nodePadding, avoidAreas);
  const filteredAreas = filterWithinCorridor(
    avoidAreas,
    areaObstacles,
    corridor,
  );

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
