import { playWaitFor } from "./storyPlayHelpers";
import type { XYPosition } from "@xyflow/react";

const NUMBER_PATTERN = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

/** An SVG path reduced to what stays the same when it is moved around. */
export interface PathShape {
  /** The command letters in drawing order, e.g. `"MLQ"`. */
  commands: string;
  /** Every coordinate, relative to the path's first point. */
  offsets: number[];
  /** The path's first point, in flow coordinates. */
  origin: XYPosition;
}

/**
 * Splits a path's `d` into its position (`origin`) and its translation
 * independent shape (`commands` + `offsets`), so two paths can be compared
 * without caring where in the flow each one was drawn.
 *
 * Only valid for commands whose arguments are all coordinate pairs (`M`,
 * `L`, `Q`, `C`), which is everything a routed or native bezier/straight/step
 * edge draws. Arc commands (hops) mix radii and flags into their arguments
 * and are not supported.
 */
export const pathShapeOf = (pathData: string): PathShape => {
  const values = (pathData.match(NUMBER_PATTERN) ?? []).map(Number);
  if (values.length < 2) {
    throw new Error(`path has no starting point: "${pathData}"`);
  }

  const [originX, originY] = values;

  return {
    commands: pathData.replace(NUMBER_PATTERN, "").replace(/[^a-z]/gi, ""),
    offsets: values.map(
      (value, index) => value - (index % 2 === 0 ? originX : originY),
    ),
    origin: { x: originX, y: originY },
  };
};

const readEdgePath = (canvasElement: HTMLElement, edgeId: string): string => {
  const path = canvasElement.querySelector<SVGPathElement>(
    `[data-testid="rf__edge-${edgeId}"] path.react-flow__edge-path`,
  );
  if (!path) throw new Error(`edge ${edgeId} not rendered`);
  return path.getAttribute("d") ?? "";
};

const firstMismatch = (
  reference: number[],
  compared: number[],
  tolerance: number,
): number =>
  reference.findIndex(
    (value, index) => Math.abs(value - compared[index]) > tolerance,
  );

export interface SamePathShapeOptions {
  /** How far the compared path must start from the reference path. Pins
   * down where it was drawn, not only what it looks like. */
  translation?: XYPosition;
  /** Allowed difference per coordinate, in px. The default is far below the
   * one-grid-cell jump a real routing difference produces. */
  tolerance?: number;
}

/**
 * Throws unless two paths draw the same shape: the same commands, with every
 * coordinate at the same offset from each path's own first point.
 */
export const assertSamePathShape = (
  referenceData: string,
  comparedData: string,
  options: SamePathShapeOptions = {},
): void => {
  const { translation, tolerance = 0.5 } = options;
  const reference = pathShapeOf(referenceData);
  const compared = pathShapeOf(comparedData);
  const pair = `"${referenceData}" and "${comparedData}"`;

  if (
    reference.commands !== compared.commands ||
    reference.offsets.length !== compared.offsets.length
  ) {
    throw new Error(`paths ${pair} draw different commands`);
  }

  const mismatch = firstMismatch(
    reference.offsets,
    compared.offsets,
    tolerance,
  );
  if (mismatch !== -1) {
    throw new Error(`paths ${pair} diverge at coordinate ${String(mismatch)}`);
  }

  if (!translation) return;

  const shiftX = compared.origin.x - reference.origin.x;
  const shiftY = compared.origin.y - reference.origin.y;
  if (
    Math.abs(shiftX - translation.x) > tolerance ||
    Math.abs(shiftY - translation.y) > tolerance
  ) {
    throw new Error(
      `paths ${pair} are ${String(shiftX)},${String(shiftY)} apart, expected ${String(translation.x)},${String(translation.y)}`,
    );
  }
};

/**
 * Waits until two rendered edges pass `assertSamePathShape`.
 *
 * Both edges render the same pending fallback before their first routing
 * batch lands, so callers that care about the routed path must wait for it
 * first (see `waitForRoutedEdge`).
 */
export async function expectSamePathShape(
  canvasElement: HTMLElement,
  referenceEdgeId: string,
  comparedEdgeId: string,
  options: SamePathShapeOptions = {},
): Promise<void> {
  await playWaitFor(() => {
    assertSamePathShape(
      readEdgePath(canvasElement, referenceEdgeId),
      readEdgePath(canvasElement, comparedEdgeId),
      options,
    );
  });
}
