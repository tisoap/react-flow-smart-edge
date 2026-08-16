import { userEvent } from "storybook/test";
import { playWaitFor } from "./storyPlayHelpers";

/** Returned by {@link beginNodeDrag}: call `end()` to release the pointer
 * button and complete the drag. */
export interface NodeDragHandle {
  end: () => Promise<void>;
}

/**
 * Presses the (virtual) left mouse button down on a node's DOM element and
 * drags it by `delta` (client pixels), leaving the button held down —
 * mirrors how a real user drags a node. React Flow's node drag machinery
 * (`d3-drag`) listens for `mousedown`/`mousemove`/`mouseup`, not pointer
 * events; `userEvent.pointer` dispatches both, so this reaches it the same
 * way `dragSmartConnectionPreview` (in `storyPlayHelpers.ts`) reaches
 * handle-based connection dragging. Call the returned handle's `end()` once
 * the caller is done asserting on the in-progress drag.
 *
 * Uses a single `userEvent.setup()` instance for the whole gesture (held in
 * the returned handle's closure) rather than the bare `userEvent.pointer(…)`
 * static call. The static call is a "direct API" convenience that creates a
 * brand-new, throwaway pointer/button-state instance for every top-level
 * invocation — so a `mousedown` dispatched from one call and a `mouseup`
 * dispatched from a later, separate call share no state. The second call has
 * no memory that a button is down, its internal `Buttons.up()` bookkeeping
 * finds nothing to release, and the `mouseup` is silently never dispatched
 * at all (confirmed empirically: with two separate static calls, the node
 * never received any `mouseup`, at any DOM layer, and `dragging` stayed
 * `true` forever). `.setup()` gives one persistent instance whose button
 * state survives the awaited assertion in between the drag's start and end.
 *
 * Also sends the movement as two distinct `mousemove` steps, not one. React
 * Flow's `XYDrag` only starts dragging once cumulative movement clears
 * `nodeDragThreshold` (default `1`px), and the very `mousemove` event whose
 * distance crosses that threshold is also the one `startDrag()` uses to seed
 * its "last position" — so that first event never registers as an actual
 * position change (`lastPos` and the event's position are identical by
 * construction) and `node.dragging` stays `false` for it. A second, distinct
 * move is required for the drag to actually move the node and flip
 * `dragging` to `true`. The first step here only needs to clear the
 * threshold (a small nudge); the second carries the rest of `delta`.
 */
export async function beginNodeDrag(
  canvasElement: HTMLElement,
  nodeId: string,
  delta: { x: number; y: number },
): Promise<NodeDragHandle> {
  const node = await playWaitFor(() => {
    const element = canvasElement.querySelector<HTMLElement>(
      `.react-flow__node[data-id="${nodeId}"]`,
    );
    if (!element) throw new Error(`node ${nodeId} not rendered`);
    return element;
  });

  const rect = node.getBoundingClientRect();
  const startX = rect.left + rect.width / 2;
  const startY = rect.top + rect.height / 2;

  const user = userEvent.setup();

  await user.pointer([
    {
      keys: "[MouseLeft>]",
      target: node,
      coords: { clientX: startX, clientY: startY },
    },
    {
      coords: {
        clientX: startX + delta.x / 2,
        clientY: startY + delta.y / 2,
      },
    },
    {
      coords: {
        clientX: startX + delta.x,
        clientY: startY + delta.y,
      },
    },
  ]);

  return {
    end: async () => {
      await user.pointer([{ keys: "[/MouseLeft]" }]);
    },
  };
}

const placeholderAncestor = (path: SVGPathElement): Element | null =>
  path.closest("g.react-flow__edge.animated");

/**
 * Waits for the given edge's path to sit inside a `g.react-flow__edge.animated`
 * wrapper: the provider's dragging placeholder, not the routed grid path
 * and not first-paint pending (pending uses a static dash).
 */
export async function expectDragFallbackStyle(
  canvasElement: HTMLElement,
  edgeId: string,
): Promise<SVGPathElement> {
  return playWaitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      `[data-testid="rf__edge-${edgeId}"] path.react-flow__edge-path`,
    );
    if (!path) throw new Error(`edge ${edgeId} not rendered`);
    if (!placeholderAncestor(path)) {
      throw new Error(`edge ${edgeId} is missing the placeholder wrapper`);
    }
    return path;
  });
}

/** The inverse of {@link expectDragFallbackStyle}: waits until the given
 * edge's path is no longer inside `g.react-flow__edge.animated`, e.g. once a
 * drag has ended and the edge has resumed normal routing. */
export async function expectNoDragFallbackStyle(
  canvasElement: HTMLElement,
  edgeId: string,
): Promise<SVGPathElement> {
  return playWaitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      `[data-testid="rf__edge-${edgeId}"] path.react-flow__edge-path`,
    );
    if (!path) throw new Error(`edge ${edgeId} not rendered`);
    if (placeholderAncestor(path)) {
      throw new Error(`edge ${edgeId} still has the placeholder wrapper`);
    }
    return path;
  });
}

/**
 * Asserts that, after a fixed settle delay, the given edge's path still does
 * not match a routed pattern (default: the `Q` quadratic-bezier command a
 * grid-routed smart path draws, as opposed to the native fallback edge's
 * cubic `C`). Used where "never routes" is the behavior under test (no
 * provider, or a clear corridor with `routeOnlyWhenBlocked` on) — a one-shot
 * wait rather than `waitFor`'s poll-until-true, since there is no true
 * condition to poll for; the edge is expected to stay exactly as it started.
 */
export async function expectStaysUnrouted(
  canvasElement: HTMLElement,
  edgeId: string,
  routedPattern = /Q/i,
  settleMs = 1_000,
): Promise<SVGPathElement> {
  await new Promise((resolve) => {
    setTimeout(resolve, settleMs);
  });

  return playWaitFor(() => {
    const path = canvasElement.querySelector<SVGPathElement>(
      `[data-testid="rf__edge-${edgeId}"] path.react-flow__edge-path`,
    );
    if (!path) throw new Error(`edge ${edgeId} not rendered`);
    const pathData = path.getAttribute("d") ?? "";
    if (routedPattern.test(pathData)) {
      throw new Error(`edge ${edgeId} unexpectedly routed: ${pathData}`);
    }
    return path;
  });
}
