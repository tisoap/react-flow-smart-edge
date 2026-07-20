// A/B benchmarks between the legacy v4 object-grid engine (bench/legacy/,
// copied verbatim in Task 4) and the v5 flat-grid engine, on identical
// fixture inputs. Four groups: grid construction, A* (orthogonal + diagonal),
// jump-point search, and getSmartEdge's corridor ladder vs a full-grid pass.
import { bench, describe } from "vitest";
import {
  buildBaseGrid,
  createGrid,
  getBoundingBoxes,
  pathfindingAStarDiagonal,
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
import { createAStarFinder } from "./legacy/aStar";
import { createJumpPointFinder } from "./legacy/jumpPoint";
import { buildLegacyGridFromBoxes, buildRouteSetup } from "./legacyPipeline";
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

describe("grid build: legacy object grid vs v5 flat grid", () => {
  const boxes100 = getBoundingBoxes(graph100.nodes, NODE_PADDING, GRID_RATIO);
  const boxes750 = getBoundingBoxes(graph750.nodes, NODE_PADDING, GRID_RATIO);

  bench("legacy createGrid (100-node fixture)", () => {
    buildLegacyGridFromBoxes(boxes100.graphBox, boxes100.nodeBoxes, GRID_RATIO);
  });

  bench("flat buildBaseGrid (100-node fixture)", () => {
    buildBaseGrid(boxes100.graphBox, boxes100.nodeBoxes, GRID_RATIO);
  });

  bench("legacy createGrid (750-node fixture)", () => {
    buildLegacyGridFromBoxes(boxes750.graphBox, boxes750.nodeBoxes, GRID_RATIO);
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

describe("A* orthogonal: legacy vs flat (100-node fixture, 8 sampled edges)", () => {
  const legacyFinder = createAStarFinder({ diagonalMovement: "Never" });

  bench("legacy createAStarFinder (Never)", () => {
    for (const setup of sampledSetups) {
      legacyFinder.findPath(
        setup.start.x,
        setup.start.y,
        setup.end.x,
        setup.end.y,
        setup.legacyGrid.clone(),
      );
    }
  });

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

describe("A* diagonal: legacy vs flat (100-node fixture, 8 sampled edges)", () => {
  const legacyFinder = createAStarFinder({ diagonalMovement: "Always" });

  bench("legacy createAStarFinder (Always)", () => {
    for (const setup of sampledSetups) {
      legacyFinder.findPath(
        setup.start.x,
        setup.start.y,
        setup.end.x,
        setup.end.y,
        setup.legacyGrid.clone(),
      );
    }
  });

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

describe("JPS orthogonal: legacy vs flat (100-node fixture, 8 sampled edges)", () => {
  const legacyFinder = createJumpPointFinder();

  bench("legacy createJumpPointFinder", () => {
    for (const setup of sampledSetups) {
      legacyFinder.findPath(
        setup.start.x,
        setup.start.y,
        setup.end.x,
        setup.end.y,
        setup.legacyGrid.clone(),
      );
    }
  });

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

/** Replicates `getSmartEdge`'s final full-graph rung directly (see
 * `routeFullGraph` in `src/getSmartEdge/index.ts`), skipping the corridor
 * ladder entirely, so the comparison isolates the corridor's benefit on the
 * v5 engine rather than comparing two different engines. */
const routeFullGridNoCorridor = (params: GetSmartEdgeParams): number[][] => {
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
  return pathfindingAStarDiagonal(grid, start, end);
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
