// v5 engine benchmarks: grid construction, A* (orthogonal + diagonal),
// jump-point search, and getSmartEdge's corridor ladder vs a full-grid pass.
// These ran alongside legacy v4 object-grid A/B comparisons through Task 21;
// the legacy engine (bench/legacy/) and its comparison lanes were removed at
// Task 22 (release preflight) once the final A/B numbers were recorded in
// bench/RESULTS.md. See that file for the historical legacy-vs-v5 figures.
import { bench, describe } from "vitest";
import {
  alignEndpoints,
  buildBaseGrid,
  createGrid,
  getBoundingBoxes,
  gridToGraphPoint,
  pathfindingAStarDiagonal,
  svgDrawSmoothLinePath,
} from "../src/functions";
import { getSmartEdge } from "../src/getSmartEdge";
import { findPathAStar } from "../src/pathfinding/flatAStar";
import { findPathJumpPoint } from "../src/pathfinding/flatJumpPoint";
import {
  edgeToSmartEdgeParams,
  graph100,
  graph750,
  sampleEdges,
} from "./fixtures";
import { buildRouteSetup } from "./routeSetup";
import type { PointInfo } from "../src/functions";
import type { GetSmartEdgeParams } from "../src/getSmartEdge";

const GRID_RATIO = 10;
const NODE_PADDING = 10;
const SAMPLE_SIZE = 8;
const CORRIDOR_SAMPLE_SIZE = 50;

const toPointInfo = (
  params: GetSmartEdgeParams,
): { source: PointInfo; target: PointInfo } => ({
  source: { x: params.sourceX, y: params.sourceY, position: "right" },
  target: { x: params.targetX, y: params.targetY, position: "left" },
});

// --- Grid construction ------------------------------------------------------

describe("grid build: v5 flat grid", () => {
  const boxes100 = getBoundingBoxes(graph100.nodes, NODE_PADDING, GRID_RATIO);
  const boxes750 = getBoundingBoxes(graph750.nodes, NODE_PADDING, GRID_RATIO);

  bench("flat buildBaseGrid (100-node fixture)", () => {
    buildBaseGrid(boxes100.graphBox, boxes100.nodeBoxes, GRID_RATIO);
  });

  bench("flat buildBaseGrid (750-node fixture)", () => {
    buildBaseGrid(boxes750.graphBox, boxes750.nodeBoxes, GRID_RATIO);
  });
});

// --- A* search ---------------------------------------------------------------

const sampledSetups = sampleEdges(graph100.edges, SAMPLE_SIZE).map((edge) => {
  const { source, target } = toPointInfo(
    edgeToSmartEdgeParams(graph100.nodes, edge),
  );
  return buildRouteSetup(graph100.nodes, source, target, NODE_PADDING, GRID_RATIO);
});

describe("A* orthogonal (100-node fixture, 8 sampled edges)", () => {
  bench("flat findPathAStar (orthogonal)", () => {
    for (const setup of sampledSetups) {
      findPathAStar(
        setup.flatGrid,
        setup.start.x,
        setup.start.y,
        setup.end.x,
        setup.end.y,
        false,
      );
    }
  });
});

describe("A* diagonal (100-node fixture, 8 sampled edges)", () => {
  bench("flat findPathAStar (diagonal)", () => {
    for (const setup of sampledSetups) {
      findPathAStar(
        setup.flatGrid,
        setup.start.x,
        setup.start.y,
        setup.end.x,
        setup.end.y,
        true,
      );
    }
  });
});

// --- Jump point search --------------------------------------------------------

describe("JPS orthogonal (100-node fixture, 8 sampled edges)", () => {
  bench("flat findPathJumpPoint", () => {
    for (const setup of sampledSetups) {
      findPathJumpPoint(
        setup.flatGrid,
        setup.start.x,
        setup.start.y,
        setup.end.x,
        setup.end.y,
      );
    }
  });
});

// --- getSmartEdge: corridor ladder vs full-grid -------------------------------

/**
 * Replicates `getSmartEdge`'s full pipeline end-to-end — route, then
 * `alignEndpoints`, `drawEdge` (the `bezier` preset's default
 * `svgDrawSmoothLinePath`, matching `getSmartEdge`'s own default when no
 * `drawEdge` option is passed), and the edge-center `gridToGraphPoint`
 * lookup — over the full 750-node graph instead of `routeWithCorridorLadder`
 * (see `src/getSmartEdge/index.ts`). Doing the *same* post-processing as the
 * corridor side keeps the comparison below a clean corridor-only toggle: the
 * only difference between `getSmartEdge(params)` and this function is
 * whether routing runs on a cropped sub-grid (widening on retry) or the
 * whole graph every time. Stopping at the raw grid path here would instead
 * credit the corridor ladder for skipping `alignEndpoints`/`drawEdge`/point
 * conversion too, work every route pays for regardless of corridor vs.
 * full-grid.
 */
const routeFullGridNoCorridor = (
  params: GetSmartEdgeParams,
): { svgPathString: string; edgeCenterX: number; edgeCenterY: number } => {
  const { source, target } = toPointInfo(params);
  const { graphBox, nodeBoxes } = getBoundingBoxes(
    params.nodes,
    NODE_PADDING,
    GRID_RATIO,
    [],
    [
      { x: source.x, y: source.y },
      { x: target.x, y: target.y },
    ],
  );
  const { grid, start, end } = createGrid(
    graphBox,
    nodeBoxes,
    source,
    target,
    GRID_RATIO,
  );
  const fullPath = pathfindingAStarDiagonal(grid, start, end);

  const graphPath = fullPath.map((gridPoint) => {
    const [posX, posY] = gridPoint;
    const graphPoint = gridToGraphPoint(
      { x: posX, y: posY },
      graphBox.xMin,
      graphBox.yMin,
      GRID_RATIO,
    );
    return [graphPoint.x, graphPoint.y];
  });

  const alignedPath = alignEndpoints(source, target, graphPath);
  const svgPathString = svgDrawSmoothLinePath(source, target, alignedPath);

  const index = Math.floor(fullPath.length / 2);
  const [middleX, middleY] = fullPath[index];
  const { x: edgeCenterX, y: edgeCenterY } = gridToGraphPoint(
    { x: middleX, y: middleY },
    graphBox.xMin,
    graphBox.yMin,
    GRID_RATIO,
  );

  return { svgPathString, edgeCenterX, edgeCenterY };
};

const corridorSampleParams = sampleEdges(
  graph750.edges,
  CORRIDOR_SAMPLE_SIZE,
).map((edge) => edgeToSmartEdgeParams(graph750.nodes, edge));

describe("getSmartEdge: corridor ladder vs full-grid (750-node fixture, 50 sampled edges)", () => {
  bench("getSmartEdge (corridor ladder, default options)", () => {
    for (const params of corridorSampleParams) {
      getSmartEdge(params);
    }
  });

  bench("full-grid pipeline (no corridor, all 750 nodes)", () => {
    for (const params of corridorSampleParams) {
      routeFullGridNoCorridor(params);
    }
  });
});
