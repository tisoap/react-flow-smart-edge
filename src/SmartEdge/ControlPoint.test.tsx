import { ReactFlowProvider } from "@xyflow/react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { SvgWrapper } from "../../vitest/svgWrapper";
import { ControlPoint } from "./ControlPoint";
import type { ControlPointData } from "./ControlPoint";

const screenToFlowPosition = vi.fn(({ x, y }: { x: number; y: number }) => ({
  x,
  y,
}));
const domNode = document.createElement("div");

vi.mock("@xyflow/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@xyflow/react")>();
  return {
    ...actual,
    useReactFlow: () => ({ screenToFlowPosition }),
    useStore: (selector: (store: { domNode: HTMLDivElement }) => unknown) =>
      selector({ domNode }),
  };
});

const renderPoint = (
  props: Partial<ComponentProps<typeof ControlPoint>> = {},
) => {
  const setControlPoints = vi.fn(
    (update: (points: ControlPointData[]) => ControlPointData[]) => {
      update([]);
    },
  );

  return {
    setControlPoints,
    ...render(
      <ReactFlowProvider>
        <SvgWrapper>
          <ControlPoint
            id={props.id ?? "cp-1"}
            index={props.index ?? 1}
            x={props.x ?? 50}
            y={props.y ?? 50}
            color={props.color ?? "#3367d9"}
            active={props.active}
            setControlPoints={setControlPoints}
          />
        </SvgWrapper>
      </ReactFlowProvider>,
    ),
  };
};

describe("ControlPoint", () => {
  it("promotes an inactive point at the first insert slot", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({ id: "__inactive-0", index: 0 });

    await user.click(screen.getByTestId("smart-edge-control-point"));

    expect(vi.mocked(setControlPoints)).toHaveBeenCalled();
    const updater = vi.mocked(setControlPoints).mock.calls[0][0];
    expect(updater([])).toEqual([
      expect.objectContaining({ active: true, x: 50, y: 50 }),
    ]);
  });

  it("inserts a promoted inactive point after an existing waypoint", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({ id: "__inactive-1", index: 2 });
    const existing: ControlPointData[] = [
      { id: "a", x: 10, y: 10, active: true },
    ];

    await user.click(screen.getByTestId("smart-edge-control-point"));

    expect(vi.mocked(setControlPoints)).toHaveBeenCalled();
    const updater = vi.mocked(setControlPoints).mock.calls[0][0];
    expect(updater(existing)).toHaveLength(2);
  });

  it("moves an active point with keyboard nudges and deletes it", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({
      id: "active-1",
      index: 1,
      active: true,
    });
    const circle = screen.getByTestId("smart-edge-control-point");

    circle.focus();
    await user.keyboard("{ArrowRight}{ArrowUp}{ArrowDown}{ArrowLeft}{Delete}");

    expect(
      vi.mocked(setControlPoints).mock.calls.length,
    ).toBeGreaterThanOrEqual(4);
  });

  it("updates position while dragging via pointer events", () => {
    document.body.append(domNode);
    const { setControlPoints } = renderPoint({
      id: "active-1",
      index: 1,
      active: true,
    });
    const circle = screen.getByTestId("smart-edge-control-point");

    act(() => {
      circle.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
      );
    });
    act(() => {
      domNode.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          clientX: 200,
          clientY: 180,
        }),
      );
      domNode.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          clientX: 200,
          clientY: 180,
        }),
      );
    });

    expect(setControlPoints).toHaveBeenCalled();
    expect(screenToFlowPosition).toHaveBeenCalled();
    domNode.remove();
  });

  it("activates an inactive point from the keyboard", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({ id: "__inactive-0", index: 0 });
    const circle = screen.getByTestId("smart-edge-control-point");

    circle.focus();
    await user.keyboard("{Enter}");

    expect(setControlPoints).toHaveBeenCalled();
  });

  it("drags an active point and deletes it from the context menu", async () => {
    const user = userEvent.setup();
    const container = document.createElement("div");
    document.body.append(container);

    const { setControlPoints } = renderPoint({
      id: "active-1",
      index: 1,
      active: true,
    });
    const circle = screen.getByTestId("smart-edge-control-point");

    await user.pointer([
      { keys: "[MouseLeft>]", target: circle },
      { coords: { clientX: 120, clientY: 140 } },
      { keys: "[/MouseLeft]" },
    ]);

    circle.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );

    expect(setControlPoints).toHaveBeenCalled();
    container.remove();
  });

  it("ignores right-button pointer down", () => {
    const { setControlPoints } = renderPoint({ active: true });
    const circle = screen.getByTestId("smart-edge-control-point");

    circle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 2 }),
    );

    expect(setControlPoints).not.toHaveBeenCalled();
  });

  it("ignores unhandled keys and inactive context-menu deletes", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({ id: "__inactive-0", index: 0 });
    const circle = screen.getByTestId("smart-edge-control-point");

    circle.focus();
    await user.keyboard("a");

    circle.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );

    expect(setControlPoints).not.toHaveBeenCalled();
  });

  it("activates an active point from the keyboard without preventing default", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({
      id: "active-1",
      index: 1,
      active: true,
    });
    const circle = screen.getByTestId("smart-edge-control-point");

    circle.focus();
    await user.keyboard(" ");

    expect(setControlPoints).toHaveBeenCalled();
  });

  it("deletes an active point with Backspace", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({
      id: "active-1",
      index: 1,
      active: true,
    });
    const circle = screen.getByTestId("smart-edge-control-point");

    circle.focus();
    await user.keyboard("{Backspace}");

    expect(setControlPoints).toHaveBeenCalled();
    const updater = vi.mocked(setControlPoints).mock.calls.at(-1)?.[0];
    expect(updater?.([{ id: "active-1", x: 50, y: 50, active: true }])).toEqual(
      [],
    );
  });

  it("updates only the matching active point when multiple waypoints exist", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({
      id: "active-2",
      index: 3,
      active: true,
      x: 80,
      y: 90,
    });
    const circle = screen.getByTestId("smart-edge-control-point");

    await user.click(circle);

    const updater = vi.mocked(setControlPoints).mock.calls.at(-1)?.[0];
    const result = updater?.([
      { id: "active-1", x: 10, y: 10, active: true },
      { id: "active-2", x: 80, y: 90, active: true },
    ]);

    expect(result).toEqual([
      { id: "active-1", x: 10, y: 10, active: true },
      expect.objectContaining({ id: "active-2", x: 80, y: 90, active: true }),
    ]);
  });

  it("skips unrelated points when inserting after an existing waypoint", async () => {
    const user = userEvent.setup();
    const { setControlPoints } = renderPoint({ id: "__inactive-1", index: 2 });
    const circle = screen.getByTestId("smart-edge-control-point");

    await user.click(circle);

    const updater = vi.mocked(setControlPoints).mock.calls.at(-1)?.[0];
    const result = updater?.([
      { id: "a", x: 10, y: 10, active: true },
      { id: "b", x: 20, y: 20, active: true },
    ]);

    expect(result).toHaveLength(3);
    expect(result?.[0]).toEqual({ id: "a", x: 10, y: 10, active: true });
  });
});
