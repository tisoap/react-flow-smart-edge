import { expect, userEvent, waitFor } from "storybook/test";

export interface DemoStoryPlayContext {
  canvasElement: HTMLElement;
}

export const demoStoryPlay = (
  fn: (canvasElement: HTMLElement) => Promise<void> | void,
) => {
  return ({ canvasElement }: DemoStoryPlayContext) => fn(canvasElement);
};

export const EDGE_PATH_SELECTOR = ".react-flow__edge-path";
export const GRAPH_WRAPPER_SELECTOR = '[data-testid="graph-wrapper"]';
export const NODE_SELECTOR = ".react-flow__node";
export const CONNECTION_PATH_SELECTOR = ".react-flow__connection-path";
export const CONTROL_POINT_SELECTOR =
  "[data-testid='smart-edge-control-point']";

interface CountExpectation {
  min?: number;
  exact?: number;
}

const resolveCount = (
  count: CountExpectation,
  found: number,
  label: string,
): void => {
  if (count.exact !== undefined && found !== count.exact) {
    throw new Error(
      `expected ${String(count.exact)} ${label}, got ${String(found)}`,
    );
  }
  if (count.min !== undefined && found < count.min) {
    throw new Error(
      `expected at least ${String(count.min)} ${label}, got ${String(found)}`,
    );
  }
};

export async function expectGraphRendered(canvasElement: HTMLElement) {
  return waitFor(() => {
    const wrapper = canvasElement.querySelector(GRAPH_WRAPPER_SELECTOR);
    if (!wrapper) throw new Error("graph wrapper not rendered");
    return wrapper;
  });
}

export async function expectNodeCount(
  canvasElement: HTMLElement,
  count: CountExpectation,
) {
  return waitFor(() => {
    const nodes = canvasElement.querySelectorAll(NODE_SELECTOR);
    resolveCount(count, nodes.length, "nodes");
    return nodes;
  });
}

export async function expectEdgePaths(
  canvasElement: HTMLElement,
  count: CountExpectation = { min: 1 },
) {
  return waitFor(() => {
    const paths = [
      ...canvasElement.querySelectorAll<SVGPathElement>(EDGE_PATH_SELECTOR),
    ];
    resolveCount(count, paths.length, "edge paths");
    for (const path of paths) {
      const d = path.getAttribute("d")?.trim();
      if (!d) throw new Error("edge path missing d attribute");
    }
    return paths;
  });
}

export async function expectEdgePathsMatch(
  canvasElement: HTMLElement,
  pattern: RegExp,
  count: CountExpectation = { min: 1 },
) {
  const paths = await expectEdgePaths(canvasElement, count);
  const matching = paths.filter((path) =>
    pattern.test(path.getAttribute("d") ?? ""),
  );
  if (matching.length === 0) {
    throw new Error(`no edge path matched ${pattern.toString()}`);
  }
  return matching;
}

export async function expectStraightOrStepPaths(canvasElement: HTMLElement) {
  const paths = await expectEdgePaths(canvasElement);
  for (const path of paths) {
    const d = path.getAttribute("d") ?? "";
    if (/C/i.test(d)) {
      throw new Error(`expected step/straight path without cubic curves: ${d}`);
    }
  }
  return paths;
}

export async function expectBezierCurves(canvasElement: HTMLElement) {
  return expectEdgePathsMatch(canvasElement, /Q/i, { min: 1 });
}

export async function expectCustomLabelButtons(
  canvasElement: HTMLElement,
  count: CountExpectation,
) {
  return waitFor(() => {
    const buttons = canvasElement.querySelectorAll("foreignObject button");
    resolveCount(count, buttons.length, "custom label buttons");
    return buttons;
  });
}

export async function expectPathAvoidsRect(
  canvasElement: HTMLElement,
  rect: { x: number; y: number; width: number; height: number },
  options: { maxInsideRatio?: number; samples?: number } = {},
) {
  const { maxInsideRatio = 0.2, samples = 24 } = options;
  const paths = await expectEdgePaths(canvasElement, { exact: 1 });
  const path = paths[0];
  const length = path.getTotalLength();
  let insideRect = 0;

  for (let index = 0; index <= samples; index += 1) {
    const point = path.getPointAtLength((length * index) / samples);
    const inside =
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height;
    if (inside) insideRect += 1;
  }

  const insideRatio = insideRect / (samples + 1);
  if (insideRatio > maxInsideRatio) {
    throw new Error(
      `expected path to mostly avoid rect, but ${String(insideRect)}/${String(samples + 1)} samples were inside`,
    );
  }
}

export async function dragSmartConnectionPreview(
  canvasElement: HTMLElement,
  sourceNodeId: string,
) {
  await expectGraphRendered(canvasElement);

  const handle = await waitFor(() => {
    const element = canvasElement.querySelector<HTMLElement>(
      `.react-flow__node[data-id="${sourceNodeId}"] .react-flow__handle.source`,
    );
    if (!element)
      throw new Error(`source handle not found for node ${sourceNodeId}`);
    return element;
  });

  const rect = handle.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  await userEvent.pointer([
    {
      keys: "[MouseLeft>]",
      target: handle,
      coords: { clientX: startX, clientY: startY },
    },
    { coords: { clientX: startX + 140, clientY: startY - 90 } },
  ]);

  return waitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      CONNECTION_PATH_SELECTOR,
    );
    const d = path?.getAttribute("d")?.trim();
    if (!d) throw new Error("smart connection preview path not rendered");
    return path;
  });
}

export async function interactWithEditableEdge(canvasElement: HTMLElement) {
  await expectGraphRendered(canvasElement);

  const controlPoints = await waitFor(() => {
    const circles = canvasElement.querySelectorAll<SVGCircleElement>(
      CONTROL_POINT_SELECTOR,
    );
    if (circles.length === 0) throw new Error("control points not rendered");
    return circles;
  });

  await expect(controlPoints.length).toBeGreaterThanOrEqual(3);

  const activePoint = canvasElement.querySelector<SVGCircleElement>(
    "circle.active[data-testid='smart-edge-control-point']",
  );
  if (!activePoint) throw new Error("active control point not found");

  const edgePath =
    canvasElement.querySelector<SVGPathElement>(EDGE_PATH_SELECTOR);
  if (!edgePath) throw new Error("edge path not rendered");
  const initialPath = edgePath.getAttribute("d");

  await userEvent.click(activePoint);
  await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");

  await waitFor(() => {
    const path =
      canvasElement.querySelector<SVGPathElement>(EDGE_PATH_SELECTOR);
    if (!path) throw new Error("edge path not rendered");
    if (path.getAttribute("d") === initialPath) {
      throw new Error("edge path did not change after moving the waypoint");
    }
  });

  const inactivePoint = canvasElement.querySelector<SVGCircleElement>(
    `${CONTROL_POINT_SELECTOR}:not(.active)`,
  );
  if (inactivePoint) {
    await userEvent.click(inactivePoint);
  }

  activePoint.focus();
  await userEvent.keyboard("{Delete}");
}

export async function expectDemoGraph(
  canvasElement: HTMLElement,
  options: {
    nodeCount: CountExpectation;
    edgeCount: CountExpectation;
  },
) {
  await expectGraphRendered(canvasElement);
  await expectNodeCount(canvasElement, options.nodeCount);
  return expectEdgePaths(canvasElement, options.edgeCount);
}
