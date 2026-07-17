import { describe, expect, it } from "vitest";
import { Position } from "@xyflow/react";
import { CORRIDOR_MARGIN_CELLS, buildCorridorAttempt } from "./corridor";
import type { PointInfo } from "../functions";
import type { Node } from "@xyflow/react";

const testNode = (
  nodeId: string,
  posX: number,
  posY: number,
  width = 20,
  height = 20,
): Node => ({
  id: nodeId,
  position: { x: posX, y: posY },
  measured: { width, height },
  data: {},
});

const point = (posX: number, posY: number): PointInfo => ({
  x: posX,
  y: posY,
  position: Position.Right,
});

describe("CORRIDOR_MARGIN_CELLS", () => {
  it("is the widening ladder tried before the full graph", () => {
    expect(CORRIDOR_MARGIN_CELLS).toEqual([8, 16, 32]);
  });
});

describe("buildCorridorAttempt", () => {
  const gridRatio = 10;
  const nodePadding = 10;
  const source = point(0, 0);
  const target = point(200, 0);

  it("filters obstacles to the set local to the endpoints, dropping far ones", () => {
    const nearA = testNode("near-a", 40, 0);
    const nearB = testNode("near-b", 160, 0);
    const farNode = testNode("far", 10000, 10000);

    const attempt = buildCorridorAttempt(
      source,
      target,
      [nearA, nearB, farNode],
      nodePadding,
      gridRatio,
      [],
      8,
    );

    const includedIds = attempt.nodeBoxes.map((box) => box.id);
    expect(includedIds).toEqual(["near-a", "near-b"]);
  });

  it("filters avoidAreas the same way as nodes", () => {
    const nearArea = { x: 100, y: 0, width: 10, height: 10 };
    const farArea = { x: 9000, y: 9000, width: 10, height: 10 };

    const attempt = buildCorridorAttempt(
      source,
      target,
      [],
      nodePadding,
      gridRatio,
      [nearArea, farArea],
      8,
    );

    expect(attempt.avoidBoxes).toHaveLength(1);
  });

  it("grows the included obstacle set as marginCells widens", () => {
    // At marginCells=8 the corridor's x reach is 200 + (8*10 + 10) = 290, so
    // this node's padded box (xMin=330) sits just outside it and is dropped.
    // At marginCells=16 the reach is 200 + (16*10 + 10) = 370, so the same
    // node's padded box (xMin=330 < 370) now falls inside and is kept — the
    // only change between the two calls is `marginCells`.
    const edgeNode = testNode("edge", 340, 0, 10, 10);

    const narrow = buildCorridorAttempt(
      source,
      target,
      [edgeNode],
      nodePadding,
      gridRatio,
      [],
      8,
    );
    const wide = buildCorridorAttempt(
      source,
      target,
      [edgeNode],
      nodePadding,
      gridRatio,
      [],
      16,
    );

    expect(narrow.nodeBoxes).toHaveLength(0);
    expect(wide.nodeBoxes.map((box) => box.id)).toEqual(["edge"]);
  });

  it("still covers both endpoints via getBoundingBoxes's extraPoints, even with no obstacles", () => {
    const attempt = buildCorridorAttempt(
      source,
      target,
      [],
      nodePadding,
      gridRatio,
      [],
      8,
    );

    expect(attempt.graphBox.xMin).toBeLessThanOrEqual(source.x);
    expect(attempt.graphBox.xMax).toBeGreaterThanOrEqual(target.x);
  });
});
