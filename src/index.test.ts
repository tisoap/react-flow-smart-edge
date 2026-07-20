import { describe, expect, it } from "vitest";

// Loaded once via dynamic import (rather than `import * as pkg`, which
// SonarJS's `no-wildcard-import` rule forbids repo-wide) so this file can
// assert against the whole runtime export surface, including that removed
// names are actually absent.
const pkg = await import("./index");

describe("public export surface (v5)", () => {
  it("exports every component/factory value", () => {
    expect(typeof pkg.SmartBezierEdge).toBe("function");
    expect(typeof pkg.SmartStraightEdge).toBe("function");
    expect(typeof pkg.SmartStepEdge).toBe("function");
    expect(typeof pkg.SmartSmoothStepEdge).toBe("function");
    expect(typeof pkg.SmartSimpleBezierEdge).toBe("function");
    expect(typeof pkg.SmartEdge).toBe("function");
    expect(typeof pkg.SmartFloatingEdge).toBe("function");
    expect(typeof pkg.SmartEditableEdge).toBe("function");
    expect(typeof pkg.SmartCheckpointEdge).toBe("function");
    expect(typeof pkg.SmartFloatingConnectionLine).toBe("function");
    expect(typeof pkg.createSmartEdge).toBe("function");
    expect(typeof pkg.smartEdgePresets).toBe("object");
    expect(typeof pkg.SmartEdgeProvider).toBe("function");
  });

  it("exports the v5 routing hook and core functions", () => {
    expect(typeof pkg.useSmartEdgePath).toBe("function");
    expect(typeof pkg.getSmartEdge).toBe("function");
    expect(typeof pkg.getSmartEdgeWaypoints).toBe("function");
    expect(typeof pkg.isDirectPathBlocked).toBe("function");
    expect(typeof pkg.routeSmartEdgeBatch).toBe("function");
  });

  it("exports draw, pathfinding, and floating-edge helper functions", () => {
    expect(typeof pkg.svgDrawSmoothLinePath).toBe("function");
    expect(typeof pkg.svgDrawStraightLinePath).toBe("function");
    expect(typeof pkg.svgDrawSmoothStepLinePath).toBe("function");
    expect(typeof pkg.svgDrawSimpleBezierLinePath).toBe("function");
    expect(typeof pkg.pathfindingAStarDiagonal).toBe("function");
    expect(typeof pkg.pathfindingAStarNoDiagonal).toBe("function");
    expect(typeof pkg.pathfindingJumpPointNoDiagonal).toBe("function");
    expect(typeof pkg.getFloatingEdgeParams).toBe("function");
    expect(typeof pkg.getNodeIntersection).toBe("function");
    expect(typeof pkg.getEdgePosition).toBe("function");
  });

  it("no longer exports the retired 4.13 batch-routing API", () => {
    expect(pkg).not.toHaveProperty("SmartEdgeBatchRoutingProvider");
    expect(pkg).not.toHaveProperty("useSmartEdgeRoute");
    expect(pkg).not.toHaveProperty("routeSmartEdgesBatch");
  });

  // Type-only exports (SmartEdgeProviderProps, SmartEdgeProviderOptions,
  // SmartEdgeContextValue, ResolvedProviderOptions, SmartEdgeRouteResult,
  // SmartEdgeMetrics, SmartEdgeBatchItem, RegisteredSmartEdge,
  // UseSmartEdgePathInput, UseSmartEdgePathResult, FlatGrid, ObstacleBox,
  // Direction, and the removed batch-routing types) erase at compile time and
  // have no runtime presence to assert here. Their presence/absence is
  // verified against `dist/index.d.ts` by the build check instead.
});
