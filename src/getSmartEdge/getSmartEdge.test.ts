import { Position } from "@xyflow/react";
import { describe, expect, it, vi } from "vitest";
import { getSmartEdge } from "./index";
import { CORRIDOR_MARGIN_CELLS } from "../routing/corridor";
import {
  buildObstacleBoxes,
  isPolylineBlocked,
} from "../routing/obstacleIndex";
import {
  NO_PATH_FOUND_ERROR,
  pathfindingAStarNoDiagonal,
  svgDrawStraightLinePath,
} from "../functions";
import type { XYPosition, Node } from "@xyflow/react";
import type { FlatGrid } from "../pathfinding/flatGrid";

const testNode = (
  nodeId: string,
  posX: number,
  posY: number,
  width = 150,
  height = 40,
): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width, height },
  data: { label: nodeId },
});

describe("getSmartEdge", () => {
  it("returns an SVG path and center for a simple edge", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        gridRatio: 10,
        nodePadding: 10,
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingAStarNoDiagonal,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.svgPathString).toMatch(/^M /);
    expect(result.svgPathString).toContain("L");
    expect(result.points.length).toBeGreaterThan(0);
    expect(Number.isFinite(result.edgeCenterX)).toBe(true);
    expect(Number.isFinite(result.edgeCenterY)).toBe(true);
  });

  it("routes around a consumer-provided avoid area", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];
    const avoidAreas = [{ x: 260, y: 120, width: 150, height: 170 }];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        avoidAreas,
        gridRatio: 10,
        nodePadding: 10,
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingAStarNoDiagonal,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    // A straight horizontal line would stay near y=220; routing around the
    // obstacle should introduce at least one point off that line.
    const deviatesFromDirectPath = result.points.some(
      ([, posY]) => Math.abs(posY - 220) > 5,
    );
    expect(deviatesFromDirectPath).toBe(true);
  });

  it("returns an Error when pathfinding fails", () => {
    const failingPathfinder = () => {
      throw new Error(NO_PATH_FOUND_ERROR);
    };

    const result = getSmartEdge({
      nodes: [testNode("source", 0, 0), testNode("target", 200, 0)],
      sourceX: 50,
      sourceY: 20,
      targetX: 150,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        generatePath: failingPathfinder,
      },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe(NO_PATH_FOUND_ERROR);
    }
  });
});

describe("getSmartEdge wasRouted", () => {
  it("is true on a successful synchronous route", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {},
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;
    expect(result.wasRouted).toBe(true);
  });
});

describe("getSmartEdge corridor retry ladder", () => {
  it("exhausts every corridor margin then the full graph before returning an Error", () => {
    const generatePath = vi.fn(() => {
      throw new Error(NO_PATH_FOUND_ERROR);
    });

    const result = getSmartEdge({
      nodes: [testNode("source", 0, 0), testNode("target", 200, 0)],
      sourceX: 50,
      sourceY: 20,
      targetX: 150,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: { generatePath },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe(NO_PATH_FOUND_ERROR);
    }
    // One call per corridor margin, plus one final full-graph attempt.
    expect(generatePath).toHaveBeenCalledTimes(
      CORRIDOR_MARGIN_CELLS.length + 1,
    );
  });

  it("routes around a wall once the ladder reaches a rung wide enough, after narrower rungs report no path", () => {
    // A padded rectangular obstacle always carries a walkable fringe just
    // past its own edge (from `getBoundingBoxes`'s graph padding plus
    // `guaranteeWalkablePath`'s endpoint lane-carving), so a single wall
    // that merely crosses the direct source-target line is always
    // routable around by the smallest corridor already — there is no
    // "only visible from a wider corridor" opening to construct for a
    // lone obstacle. What genuinely varies rung to rung is which
    // obstacles the corridor filter *includes at all*, so this test
    // drives that with an instrumented `generatePath`: it reports no path
    // for every rung except the last (mirroring "narrower corridors keep
    // missing a real detour"), and on the rung that is allowed to run for
    // real, it hands off to the real A* against actual wall nodes —
    // proving the ladder's wiring (retry on `NO_PATH_FOUND_ERROR`, keep
    // widening, stop once a rung succeeds) drives a genuine routed result,
    // not a canned one.
    const nodes = [
      testNode("source", 0, 80, 20, 20),
      testNode("target", 400, 80, 20, 20),
      testNode("wall", 190, -300, 20, 505),
    ];

    let call = 0;
    const attemptsBeforeSuccess = CORRIDOR_MARGIN_CELLS.length;
    const generatePath = vi.fn(
      (grid: FlatGrid, start: XYPosition, end: XYPosition): number[][] => {
        call += 1;
        if (call <= attemptsBeforeSuccess) {
          throw new Error(NO_PATH_FOUND_ERROR);
        }
        return pathfindingAStarNoDiagonal(grid, start, end);
      },
    );

    const result = getSmartEdge({
      nodes,
      sourceX: 10,
      sourceY: 100,
      targetX: 400,
      targetY: 100,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        gridRatio: 10,
        nodePadding: 10,
        generatePath,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;
    expect(result.wasRouted).toBe(true);
    // Every corridor margin reported no path; only the final full-graph
    // attempt was allowed to run for real, and it found a genuine route
    // around the wall (deviating off the direct y=100 line).
    expect(call).toBe(attemptsBeforeSuccess + 1);
    const deviatesAroundWall = result.points.some(
      ([, posY]) => Math.abs(posY - 100) > 5,
    );
    expect(deviatesAroundWall).toBe(true);
  });

  it("surfaces a non-NO_PATH_FOUND error thrown from a corridor rung immediately, without retrying", () => {
    const generatePath = vi.fn(() => {
      throw new Error("boom from rung 0");
    });

    const result = getSmartEdge({
      nodes: [testNode("source", 0, 0), testNode("target", 200, 0)],
      sourceX: 50,
      sourceY: 20,
      targetX: 150,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: { generatePath },
    });

    expect(result).toBeInstanceOf(Error);
    if (result instanceof Error) {
      expect(result.message).toBe("boom from rung 0");
    }
    // The ladder must abort on the first non-NO_PATH_FOUND error instead of
    // continuing to widen the corridor.
    expect(generatePath).toHaveBeenCalledTimes(1);
  });

  it("stops the ladder as soon as the narrowest rung succeeds", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];
    const generatePath = vi.fn(pathfindingAStarNoDiagonal);

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        gridRatio: 10,
        nodePadding: 10,
        drawEdge: svgDrawStraightLinePath,
        generatePath,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    // Every obstacle is local, so rung 0 (margin 8) must succeed outright —
    // the ladder should not fall through to any wider rung.
    expect(generatePath).toHaveBeenCalledTimes(1);
  });
});

describe("getSmartEdge corridor obstacle re-selection", () => {
  it("re-selects an obstacle a large included wall's stretched graph box reaches, instead of silently routing through it", () => {
    // Regression: `buildCorridorAttempt` used to filter once against the
    // corridor rect only. A tall wall (`wallA`) merely touching the small
    // margin-8 corridor gets included whole and stretches the resulting
    // graph box far past the corridor's own edge; `nodeB` sits outside the
    // original corridor rect but inside that stretched box. A single filter
    // pass drops `nodeB`, and the router (finding its space "empty") could
    // route straight through it. `buildCorridorAttempt` now re-selects
    // against the box it just built until the selection stabilizes, so
    // `nodeB` is picked up too and the route goes around it.
    const wallA = testNode("wallA", 180, -200, 40, 2200);
    const nodeB = testNode("nodeB", 150, -240, 100, 30);
    const nodes = [wallA, nodeB];

    const result = getSmartEdge({
      nodes,
      sourceX: 0,
      sourceY: 100,
      targetX: 400,
      targetY: 100,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        gridRatio: 10,
        nodePadding: 10,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    // Check the routed polyline against the *full* obstacle set (both
    // nodes, regardless of what the corridor ladder selected), so this
    // assertion would fail if `nodeB` were ever silently skipped.
    //
    // Checked against each node's *unpadded* rect, not its padded one:
    // `segmentIntersectsBox` (which `isPolylineBlocked` uses) treats touching
    // an edge as blocked, and grid-based routing routinely hugs the padding
    // boundary exactly (the closest walkable cell to an obstacle) — even the
    // pre-existing, already-passing "fixture 3: wall obstacle" parity case
    // above touches its wall's *padded* box this way. That's expected
    // clearance-hugging, not the bug. What must never happen is the path
    // crossing into a node's real (unpadded) footprint — that's what a
    // silently-excluded obstacle would let through.
    const fullPath: XYPosition[] = [
      { x: 0, y: 100 },
      ...result.points.map(([posX, posY]) => ({ x: posX, y: posY })),
      { x: 400, y: 100 },
    ];
    const unpaddedBoxes = buildObstacleBoxes(nodes, 0);
    expect(isPolylineBlocked(fullPath, unpaddedBoxes)).toBe(false);
  });
});

describe("getSmartEdge corridor parity with the pre-corridor full-grid output", () => {
  // These exact strings were captured by running the pre-Task-6 `getSmartEdge`
  // (full-graph routing, no corridor cropping) against the fixtures below,
  // before the corridor ladder was introduced. Since every obstacle in each
  // fixture is local to the endpoints, the smallest corridor rung should
  // already find the same path, so corridor-cropped routing must reproduce
  // these strings byte-for-byte.

  it("fixture 1: simple two-node edge, straight line + no-diagonal A*", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        gridRatio: 10,
        nodePadding: 10,
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingAStarNoDiagonal,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.svgPathString).toBe(
      "M 230, 220 L 240, 220 L 250, 220 L 260, 220 L 270, 220 L 280, 220 L 290, 220 L 300, 220 L 310, 220 L 320, 220 L 330, 220 L 340, 220 L 350, 220 L 360, 220 L 370, 220 L 380, 220 L 390, 220 L 400, 220 L 410, 220 L 420, 220 L 430, 220 L 440, 220 L 450, 220 L 460, 220 L 470, 220 L 480, 220 L 490, 220 L 500, 220 L 510, 220 L 520, 220 ",
    );
    expect(result.edgeCenterX).toBe(380);
    expect(result.edgeCenterY).toBe(220);
  });

  it("fixture 2: two nodes plus a consumer avoid area, straight line + no-diagonal A*", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 200)];
    const avoidAreas = [{ x: 260, y: 120, width: 150, height: 170 }];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 220,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        avoidAreas,
        gridRatio: 10,
        nodePadding: 10,
        drawEdge: svgDrawStraightLinePath,
        generatePath: pathfindingAStarNoDiagonal,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.svgPathString).toBe(
      "M 230, 220 L 240, 220 L 240, 230 L 240, 240 L 240, 250 L 240, 260 L 240, 270 L 240, 280 L 240, 290 L 240, 300 L 250, 300 L 260, 300 L 270, 300 L 280, 300 L 290, 300 L 300, 300 L 310, 300 L 320, 300 L 330, 300 L 340, 300 L 350, 300 L 360, 300 L 370, 300 L 380, 300 L 390, 300 L 400, 300 L 410, 300 L 420, 300 L 420, 290 L 420, 280 L 420, 270 L 420, 260 L 420, 250 L 430, 250 L 440, 250 L 450, 250 L 460, 250 L 470, 250 L 480, 250 L 480, 240 L 490, 240 L 500, 240 L 500, 230 L 500, 220 L 510, 220 L 520, 220 ",
    );
    expect(result.edgeCenterX).toBe(380);
    expect(result.edgeCenterY).toBe(300);
  });

  it("fixture 3: wall obstacle, default draw + default diagonal A*", () => {
    const nodes = [
      testNode("source", 0, 0),
      testNode("target", 400, 0),
      testNode("wall", 180, -80, 40, 200),
    ];

    const result = getSmartEdge({
      nodes,
      sourceX: 150,
      sourceY: 20,
      targetX: 400,
      targetY: 20,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {
        gridRatio: 10,
        nodePadding: 10,
      },
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.svgPathString).toBe(
      "M150,20M 150,20Q150,20 155,20Q160,20 160,25Q160,30 160,35Q160,40 160,45Q160,50 160,55Q160,60 160,65Q160,70 160,75Q160,80 160,85Q160,90 160,95Q160,100 160,105Q160,110 160,115Q160,120 165,125Q170,130 175,130Q180,130 185,130Q190,130 195,130Q200,130 205,130Q210,130 215,130Q220,130 225,130Q230,130 235,130Q240,130 245,130Q250,130 255,130Q260,130 265,130Q270,130 275,125Q280,120 285,115Q290,110 295,105Q300,100 305,95Q310,90 315,85Q320,80 325,75Q330,70 335,65Q340,60 345,55Q350,50 355,45Q360,40 365,35Q370,30 375,30Q380,30 385,25Q390,20 395,20Q400,20 400,20",
    );
    expect(result.edgeCenterX).toBe(230);
    expect(result.edgeCenterY).toBe(130);
  });

  it("fixture 4: default options end-to-end (bezier draw + diagonal A*)", () => {
    const nodes = [testNode("source", 80, 200), testNode("target", 520, 260)];

    const result = getSmartEdge({
      nodes,
      sourceX: 230,
      sourceY: 220,
      targetX: 520,
      targetY: 280,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      options: {},
    });

    expect(result).not.toBeInstanceOf(Error);
    if (result instanceof Error) return;

    expect(result.svgPathString).toBe(
      "M230,220M 230,220Q230,220 235,220Q240,220 245,220Q250,220 255,225Q260,230 265,235Q270,240 275,240Q280,240 285,240Q290,240 295,245Q300,250 305,250Q310,250 315,250Q320,250 325,250Q330,250 335,250Q340,250 345,250Q350,250 355,250Q360,250 365,250Q370,250 375,250Q380,250 385,250Q390,250 395,250Q400,250 405,250Q410,250 415,250Q420,250 425,250Q430,250 435,250Q440,250 445,250Q450,250 455,250Q460,250 465,250Q470,250 475,250Q480,250 485,255Q490,260 495,265Q500,270 505,275Q510,280 515,280Q520,280 520,280",
    );
    expect(result.edgeCenterX).toBe(380);
    expect(result.edgeCenterY).toBe(250);
  });
});
