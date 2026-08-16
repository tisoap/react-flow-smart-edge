import { userEvent, waitFor } from "storybook/test";

export interface DemoStoryPlayContext {
  canvasElement: HTMLElement;
}

export const demoStoryPlay = (
  play: (canvasElement: HTMLElement) => Promise<void> | void,
) => {
  return ({ canvasElement }: DemoStoryPlayContext) => play(canvasElement);
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
      const pathData = path.getAttribute("d")?.trim();
      if (!pathData) throw new Error("edge path missing d attribute");
    }
    return paths;
  });
}

export async function expectEdgePathsMatch(
  canvasElement: HTMLElement,
  pattern: RegExp,
  count: CountExpectation = { min: 1 },
) {
  // v5 routes edges asynchronously through the provider, so the routed path
  // (with its bezier `Q` / hop-arc `A` commands) replaces the pending fallback
  // a few frames after mount. Poll until a matching routed path appears rather
  // than checking once against the first (fallback) render.
  return waitFor(async () => {
    const paths = await expectEdgePaths(canvasElement, count);
    const matching = paths.filter((path) =>
      pattern.test(path.getAttribute("d") ?? ""),
    );
    if (matching.length === 0) {
      throw new Error(`no edge path matched ${pattern.toString()}`);
    }
    return matching;
  });
}

export async function expectStraightOrStepPaths(canvasElement: HTMLElement) {
  const paths = await expectEdgePaths(canvasElement);
  for (const path of paths) {
    const pathData = path.getAttribute("d") ?? "";
    if (/C/i.test(pathData)) {
      throw new Error(
        `expected step/straight path without cubic curves: ${pathData}`,
      );
    }
  }
  return paths;
}

export async function expectBezierCurves(canvasElement: HTMLElement) {
  return expectEdgePathsMatch(canvasElement, /Q/i, { min: 1 });
}

export async function expectArcHops(canvasElement: HTMLElement) {
  return expectEdgePathsMatch(canvasElement, /A\s+\d/, { min: 1 });
}

export async function expectCubicBezierCurves(canvasElement: HTMLElement) {
  return expectEdgePathsMatch(canvasElement, /C/i, { min: 1 });
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

  // The pending fallback runs straight through the avoided rect; poll until the
  // asynchronously routed path (which detours around it) has been published.
  await waitFor(async () => {
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
  });
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
    const pathData = path?.getAttribute("d")?.trim();
    if (!pathData)
      throw new Error("smart connection preview path not rendered");
    return path;
  });
}

/**
 * Waits until the edge with the given id renders a path whose `d` matches
 * `pattern` — the asynchronously routed path, not the pending fallback
 * rendered synchronously before the provider's first batch flush. Addressed
 * directly by the edge's `rf__edge-${id}` test id rather than by scanning
 * every path on the canvas, so it stays precise in stories with more than
 * one edge, where a pattern shared by several edges' fallbacks (e.g. a
 * fallback `BezierEdge`'s cubic `C` segments can, for some presets, satisfy
 * the same pattern the routed path would) could otherwise match the wrong
 * one. A `pattern` argument is required rather than defaulted: unlike
 * `expectEdgePaths`, presence alone can't distinguish "routed" from
 * "fallback," since both render through the same `path.react-flow__edge-path`
 * element from the very first paint.
 */
export async function waitForRoutedEdge(
  canvasElement: HTMLElement,
  edgeId: string,
  pattern: RegExp,
): Promise<SVGPathElement> {
  return waitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      `[data-testid="rf__edge-${edgeId}"] path.react-flow__edge-path`,
    );
    if (!path) throw new Error(`edge ${edgeId} not rendered`);
    const pathData = path.getAttribute("d") ?? "";
    if (!pattern.test(pathData)) {
      throw new Error(
        `edge ${edgeId} path does not match ${pattern.toString()}: ${pathData}`,
      );
    }
    return path;
  });
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

export async function expectNodesFullyVisible(canvasElement: HTMLElement) {
  return waitFor(() => {
    const wrapper = canvasElement.querySelector(GRAPH_WRAPPER_SELECTOR);
    if (!wrapper) throw new Error("graph wrapper not rendered");

    const wrapperRect = wrapper.getBoundingClientRect();
    const nodes = [
      ...canvasElement.querySelectorAll<HTMLElement>(NODE_SELECTOR),
    ];
    if (nodes.length === 0) throw new Error("expected nodes in graph");

    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      const overflows =
        rect.top < wrapperRect.top - 1 ||
        rect.left < wrapperRect.left - 1 ||
        rect.bottom > wrapperRect.bottom + 1 ||
        rect.right > wrapperRect.right + 1;
      if (overflows) {
        throw new Error(
          `node "${node.getAttribute("data-id") ?? "?"}" overflows graph wrapper`,
        );
      }
    }

    return nodes;
  });
}
