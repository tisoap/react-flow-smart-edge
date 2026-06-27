import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useSmartEdgeRoute } from "./useSmartEdgeRoute";

function Probe() {
  const routed = useSmartEdgeRoute("e1");
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
