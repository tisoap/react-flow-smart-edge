import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-vitest"),
    getAbsolutePath("@storybook/addon-a11y"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },
  core: {
    disableTelemetry: true, // 👈 Disables telemetry
  },
  // Bake `CI` into the browser bundle so Storybook Vitest and Chromatic play
  // functions can soften performance budgets on shared runners. Without this,
  // `process.env.CI` is undefined in Chromium even when Actions sets it.
  viteFinal(viteConfig) {
    return {
      ...viteConfig,
      define: {
        ...viteConfig.define,
        "process.env.CI": JSON.stringify(process.env["CI"] ?? ""),
      },
    };
  },
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
