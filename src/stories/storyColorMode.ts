export type StoryColorMode = "light" | "dark";

export function isStoryColorMode(value: unknown): value is StoryColorMode {
  return value === "light" || value === "dark";
}

const colorModeFrom = (source: unknown): StoryColorMode | undefined => {
  if (source === null || typeof source !== "object") {
    return undefined;
  }

  if (!("colorMode" in source)) {
    return undefined;
  }

  return isStoryColorMode(source.colorMode) ? source.colorMode : undefined;
};

export function resolveStoryColorMode(globals: unknown): StoryColorMode {
  return colorModeFrom(globals) ?? "light";
}

export function resolveDecoratorColorMode(
  args: unknown,
  globals: unknown,
): StoryColorMode {
  return colorModeFrom(args) ?? resolveStoryColorMode(globals);
}
