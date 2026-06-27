import { Position } from "@xyflow/react";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useSmartEdgeRoute } from "./useSmartEdgeRoute";
import type { EdgeRouteInput } from "./edgeOptions";

const edge: EdgeRouteInput = {
  id: "e1",
  source: "a",
  target: "b",
  sourceX: 0,
  sourceY: 0,
  targetX: 100,
  targetY: 0,
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

function Probe() {
  const routed = useSmartEdgeRoute(edge);
  return <span>{routed ? "routed" : "pending"}</span>;
}

describe("useSmartEdgeRoute", () => {
  it("returns null when used outside a provider", () => {
    render(<Probe />);
    expect(screen.getByText("pending")).toBeTruthy();
  });

  it("returns null during server rendering (server snapshot)", () => {
    expect(renderToStaticMarkup(<Probe />)).toContain("pending");
  });
});
