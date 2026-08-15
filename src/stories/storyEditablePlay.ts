import { expect, userEvent, waitFor } from "storybook/test";
import {
  CONTROL_POINT_SELECTOR,
  EDGE_PATH_SELECTOR,
  expectGraphRendered,
} from "./storyPlayHelpers";

const ACTIVE_CONTROL_POINT_SELECTOR = `circle.active${CONTROL_POINT_SELECTOR}`;
const EDGE_PATH_NOT_RENDERED = "edge path not rendered";

/**
 * Exercises editable control-point keyboard, pointer, and context-menu paths
 * for Storybook UI-slice coverage.
 */
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
    ACTIVE_CONTROL_POINT_SELECTOR,
  );
  if (!activePoint) throw new Error("active control point not found");

  const edgePath =
    canvasElement.querySelector<SVGPathElement>(EDGE_PATH_SELECTOR);
  if (!edgePath) throw new Error(EDGE_PATH_NOT_RENDERED);
  const initialPath = edgePath.getAttribute("d");

  activePoint.focus();
  await userEvent.keyboard(
    "{ArrowRight}{ArrowRight}{ArrowLeft}{ArrowUp}{ArrowDown}{Enter}{a}",
  );

  await waitFor(() => {
    const path =
      canvasElement.querySelector<SVGPathElement>(EDGE_PATH_SELECTOR);
    if (!path) throw new Error(EDGE_PATH_NOT_RENDERED);
    if (path.getAttribute("d") === initialPath) {
      throw new Error("edge path did not change after moving the waypoint");
    }
  });

  const flowDom =
    canvasElement.querySelector<HTMLElement>(".react-flow") ?? canvasElement;

  const dragActivePoint = async (point: SVGCircleElement) => {
    const box = point.getBoundingClientRect();
    const startX = box.left + box.width / 2;
    const startY = box.top + box.height / 2;

    // userEvent flushes React state between steps so ControlPoint's drag
    // effect can attach move/up listeners to React Flow's domNode.
    await userEvent.pointer([
      {
        keys: "[MouseLeft>]",
        target: point,
        coords: { clientX: startX, clientY: startY },
      },
      {
        target: flowDom,
        coords: { clientX: startX + 20, clientY: startY + 12 },
      },
      {
        keys: "[/MouseLeft]",
        target: flowDom,
        coords: { clientX: startX + 20, clientY: startY + 12 },
      },
    ]);
    // Also fire the circle's own pointerup handler (setDragging(false)).
    point.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button: 0,
        clientX: startX + 20,
        clientY: startY + 12,
      }),
    );
  };

  await dragActivePoint(activePoint);

  // Right-button down is ignored (no promote / no drag).
  activePoint.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 2,
      clientX: 0,
      clientY: 0,
    }),
  );

  const inactivePoints = () => [
    ...canvasElement.querySelectorAll<SVGCircleElement>(
      `${CONTROL_POINT_SELECTOR}:not(.active)`,
    ),
  ];

  const leadingInactive = inactivePoints().at(0);
  if (leadingInactive === undefined) {
    throw new Error("leading inactive point missing");
  }

  // Context menu on an inactive point is a no-op (only actives delete).
  leadingInactive.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, button: 2 }),
  );

  // Pointer-down on inactive promotes without starting a drag (`active` false).
  const inactiveBox = leadingInactive.getBoundingClientRect();
  leadingInactive.dispatchEvent(
    new PointerEvent("pointerdown", {
      bubbles: true,
      button: 0,
      clientX: inactiveBox.left + inactiveBox.width / 2,
      clientY: inactiveBox.top + inactiveBox.height / 2,
    }),
  );

  // Promote the leading inactive slot via keyboard too (`index === 0` path).
  leadingInactive.focus();
  await userEvent.keyboard(" ");

  await waitFor(() => {
    if (inactivePoints().length < 1) {
      throw new Error("expected inactive slots after promoting the first");
    }
  });

  // Promote a later inactive slot (`index !== 0` insert-after path).
  const laterInactive = inactivePoints().at(-1);
  if (laterInactive === undefined) {
    throw new Error("later inactive point missing");
  }
  laterInactive.focus();
  await userEvent.keyboard("{Enter}");

  const promotedPoint = await waitFor(() => {
    const points = canvasElement.querySelectorAll<SVGCircleElement>(
      ACTIVE_CONTROL_POINT_SELECTOR,
    );
    if (points.length < 2) {
      throw new Error("expected a newly promoted active waypoint");
    }
    return points[points.length - 1];
  });

  await dragActivePoint(promotedPoint);

  promotedPoint.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, button: 2 }),
  );

  await waitFor(() => {
    const remaining = canvasElement.querySelectorAll(
      ACTIVE_CONTROL_POINT_SELECTOR,
    );
    if (remaining.length < 1) {
      throw new Error(
        "expected at least one active waypoint after context menu",
      );
    }
  });

  const leftoverActive = canvasElement.querySelector<SVGCircleElement>(
    ACTIVE_CONTROL_POINT_SELECTOR,
  );
  if (leftoverActive) {
    leftoverActive.focus();
    await userEvent.keyboard("{Backspace}");
  }
}
