export type StoryColorMode = "light" | "dark";

export function resolveStoryColorMode(
  globals: Record<string, unknown> | undefined,
): StoryColorMode {
  return globals?.["colorMode"] === "dark" ? "dark" : "light";
}
