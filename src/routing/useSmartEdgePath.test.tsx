import { Position } from "@xyflow/react";
import { act, render } from "@testing-library/react";
import { useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { useSmartEdgePath } from "./useSmartEdgePath";
import { SmartEdgeProvider } from "./SmartEdgeProvider";
import { SmartEdgeRoutingContext } from "./routingContext";
import type {
  UseSmartEdgePathInput,
  UseSmartEdgePathResult,
} from "./useSmartEdgePath";
import type { SmartEdgeContextValue } from "./routingContext";
import type { Node } from "@xyflow/react";

const nodes: Node[] = [
  {
    id: "a",
    position: { x: 0, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "b",
    position: { x: 300, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
  {
    id: "wall",
    position: { x: 150, y: 0 },
    measured: { width: 50, height: 50 },
    data: {},
  },
];

const draggingNodes: Node[] = nodes.map((node) =>
  node.id === "a" ? { ...node, dragging: true } : node,
);

const edgeInput: UseSmartEdgePathInput = {
  id: "e1",
  source: "a",
  target: "b",
  sourceX: 50,
  sourceY: 25,
  targetX: 300,
  targetY: 25,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const flushDebounce = async (): Promise<void> => {
  await act(async () => {
    await vi.runAllTimersAsync();
  });
};

/** Renders the hook under test and reports its every result to `onResult`,
 * so the test always has the latest snapshot without needing
 * `@testing-library/react`'s `renderHook` to control a dynamic provider
 * tree (this file needs to vary both the provider's `nodes` prop and the
 * hook's own input across rerenders, which `renderHook`'s fixed `wrapper`
 * cannot do). */
function Probe({
  input,
  onResult,
}: Readonly<{
  input: UseSmartEdgePathInput;
  onResult: (result: UseSmartEdgePathResult) => void;
}>) {
  const result = useSmartEdgePath(input);
  onResult(result);
  return null;
}

/** Reports the resolved context so a test can inspect registrations
 * directly (e.g. to confirm an unmounted edge's registration is gone). */
function ContextCapture({
  onContext,
}: Readonly<{
  onContext: (context: SmartEdgeContextValue | null) => void;
}>) {
  const context = useContext(SmartEdgeRoutingContext);
  onContext(context);
  return null;
}

const createResultBox = (): { current: UseSmartEdgePathResult | null } => ({
  current: null,
});

const createContextBox = (): { current: SmartEdgeContextValue | null } => ({
  current: null,
});

describe("useSmartEdgePath", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns a routed result after the provider flushes", async () => {
    const resultBox = createResultBox();

    render(
      <SmartEdgeProvider nodes={nodes}>
        <Probe
          input={edgeInput}
          onResult={(result) => {
            resultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(resultBox.current?.route).toBeNull();
    expect(resultBox.current?.hasProvider).toBe(true);

    await flushDebounce();

    expect(resultBox.current?.route).toMatchObject({
      kind: "routed",
      wasRouted: true,
    });
  });

  it("re-registers and re-routes when the edge's endpoints change", async () => {
    const resultBox = createResultBox();

    const { rerender } = render(
      <SmartEdgeProvider nodes={nodes}>
        <Probe
          input={edgeInput}
          onResult={(result) => {
            resultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();
    const firstRoute = resultBox.current?.route;
    expect(firstRoute).toMatchObject({ kind: "routed" });

    rerender(
      <SmartEdgeProvider nodes={nodes}>
        <Probe
          input={{ ...edgeInput, sourceY: 40, targetY: 40 }}
          onResult={(result) => {
            resultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();
    const secondRoute = resultBox.current?.route;
    expect(secondRoute).toMatchObject({ kind: "routed" });
    expect(secondRoute).not.toEqual(firstRoute);
  });

  it("flips isDragging when the source node starts and stops dragging", async () => {
    const resultBox = createResultBox();

    const { rerender } = render(
      <SmartEdgeProvider nodes={nodes}>
        <Probe
          input={edgeInput}
          onResult={(result) => {
            resultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();
    expect(resultBox.current?.isDragging).toBe(false);

    rerender(
      <SmartEdgeProvider nodes={draggingNodes}>
        <Probe
          input={edgeInput}
          onResult={(result) => {
            resultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(resultBox.current?.isDragging).toBe(true);

    rerender(
      <SmartEdgeProvider nodes={nodes}>
        <Probe
          input={edgeInput}
          onResult={(result) => {
            resultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(resultBox.current?.isDragging).toBe(false);
  });

  it("returns an inert result with no crash outside a provider", () => {
    const resultBox = createResultBox();

    render(
      <Probe
        input={edgeInput}
        onResult={(result) => {
          resultBox.current = result;
        }}
      />,
    );

    expect(resultBox.current).toEqual({
      route: null,
      isDragging: false,
      hasProvider: false,
    });
  });

  it("unregisters on unmount, leaving the edge out of the provider's registrations", () => {
    const contextBox = createContextBox();

    const { rerender } = render(
      <SmartEdgeProvider nodes={nodes}>
        <ContextCapture
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
        <Probe input={edgeInput} onResult={() => undefined} />
      </SmartEdgeProvider>,
    );

    expect(
      contextBox.current?.getRegistrationsInOrder().map((edge) => edge.id),
    ).toEqual(["e1"]);

    rerender(
      <SmartEdgeProvider nodes={nodes}>
        <ContextCapture
          onContext={(context) => {
            contextBox.current = context;
          }}
        />
      </SmartEdgeProvider>,
    );

    expect(
      contextBox.current?.getRegistrationsInOrder().map((edge) => edge.id),
    ).toEqual([]);
  });

  it("applies the provider's default preset when input.preset is omitted", async () => {
    const defaultBox = createResultBox();
    const explicitBox = createResultBox();

    render(
      <SmartEdgeProvider nodes={nodes} options={{ preset: "straight" }}>
        <Probe
          input={edgeInput}
          onResult={(result) => {
            defaultBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    render(
      <SmartEdgeProvider nodes={nodes}>
        <Probe
          input={{ ...edgeInput, preset: "bezier" }}
          onResult={(result) => {
            explicitBox.current = result;
          }}
        />
      </SmartEdgeProvider>,
    );

    await flushDebounce();

    const defaultRoute = defaultBox.current?.route;
    const explicitRoute = explicitBox.current?.route;
    expect(defaultRoute).toMatchObject({ kind: "routed" });
    expect(explicitRoute).toMatchObject({ kind: "routed" });
    expect(defaultRoute).not.toEqual(explicitRoute);
  });

  it("resolves to the inert result on the server, via each store's server snapshot", () => {
    const resultBox = createResultBox();

    // Server rendering has no DOM and no effects: `useSyncExternalStore`
    // reads its `getServerSnapshot` argument instead of subscribing, which
    // is the only path that ever calls `getNullRoute`/`getIdleDragging` —
    // a client render (even outside a provider) never reaches them.
    renderToStaticMarkup(
      <Probe
        input={edgeInput}
        onResult={(result) => {
          resultBox.current = result;
        }}
      />,
    );

    expect(resultBox.current).toEqual({
      route: null,
      isDragging: false,
      hasProvider: false,
    });
  });
});
