import { describe, expect, it } from "vitest";
import { resolveProviderOptions } from "./routingContext";

describe("resolveProviderOptions", () => {
  it("applies every default when called with no options", () => {
    expect(resolveProviderOptions()).toEqual({
      preset: "bezier",
      gridRatio: 10,
      nodePadding: 10,
      avoidAreas: [],
      routeOnlyWhenBlocked: true,
      routeWhileDragging: false,
      dragFallbackStyle: { strokeDasharray: "5 5" },
      debounceMs: 16,
      cacheSize: 500,
    });
    expect(resolveProviderOptions().borderRadius).toBeUndefined();
  });

  it("applies every default when called with an empty options object", () => {
    expect(resolveProviderOptions({})).toEqual(resolveProviderOptions());
  });

  it("preserves every explicitly provided option", () => {
    const overrides = {
      preset: "step" as const,
      gridRatio: 5,
      nodePadding: 4,
      avoidAreas: [{ x: 0, y: 0, width: 10, height: 10 }],
      borderRadius: 12,
      routeOnlyWhenBlocked: false,
      routeWhileDragging: true,
      dragFallbackStyle: { opacity: 0.5 },
      debounceMs: 32,
      cacheSize: 100,
    };

    expect(resolveProviderOptions(overrides)).toEqual(overrides);
  });
});
