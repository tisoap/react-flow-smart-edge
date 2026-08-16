import { describe, expect, it } from "vitest";
import {
  isStoryColorMode,
  resolveDecoratorColorMode,
  resolveStoryColorMode,
} from "./storyColorMode";

const LIGHT = "light";
const DARK = "dark";

describe("story color mode", () => {
  it("accepts only the two React Flow color modes", () => {
    expect(isStoryColorMode(LIGHT)).toBe(true);
    expect(isStoryColorMode(DARK)).toBe(true);
    expect(isStoryColorMode("system")).toBe(false);
    expect(isStoryColorMode(1)).toBe(false);
    expect(isStoryColorMode(undefined)).toBe(false);
  });

  it("reads a valid colorMode off globals and defaults everything else to light", () => {
    expect(resolveStoryColorMode({ colorMode: DARK })).toBe(DARK);
    expect(resolveStoryColorMode({ colorMode: LIGHT })).toBe(LIGHT);
    expect(resolveStoryColorMode({ colorMode: "system" })).toBe(LIGHT);
    expect(resolveStoryColorMode(undefined)).toBe(LIGHT);
    expect(resolveStoryColorMode(null)).toBe(LIGHT);
    expect(resolveStoryColorMode("dark")).toBe(LIGHT);
  });

  it("prefers a valid args colorMode over globals", () => {
    expect(
      resolveDecoratorColorMode({ colorMode: DARK }, { colorMode: LIGHT }),
    ).toBe(DARK);
    expect(
      resolveDecoratorColorMode({ colorMode: LIGHT }, { colorMode: DARK }),
    ).toBe(LIGHT);
  });

  it("falls back to globals when args colorMode is missing or invalid", () => {
    expect(resolveDecoratorColorMode({}, { colorMode: DARK })).toBe(DARK);
    expect(
      resolveDecoratorColorMode({ colorMode: 1 }, { colorMode: DARK }),
    ).toBe(DARK);
    expect(resolveDecoratorColorMode(null, { colorMode: DARK })).toBe(DARK);
  });
});
