/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const storybookBrowserProvider = playwright({});

/** Source files counted toward library coverage (excludes Storybook-only fixtures). */
const coverageInclude = ["src/**/*.{ts,tsx}"];
const coverageExclude = [
  "src/stories/**",
  "src/demos/**",
  "src/**/*.test.ts",
  "src/**/*.test.tsx",
  "src/**/*.worker.ts",
  "src/vite-env.d.ts",
];

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src",
      outDirs: "dist",
      include: ["src"],
      exclude: [
        "vite.config.ts",
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/stories/**",
        "src/**/*.worker.ts",
      ],
      tsconfigPath: "tsconfig.app.json",
      compilerOptions: {
        rootDir: "src",
      },
      insertTypesEntry: true,
      bundleTypes: true,
    }),
  ],
  worker: {
    format: "iife",
  },
  build: {
    lib: {
      entry: "src/index.tsx",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "@xyflow/react"],
      output: {
        exports: "named",
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@xyflow/react": "ReactFlow",
        },
      },
    },
  },
  test: {
    coverage: {
      provider: "v8",
      include: coverageInclude,
      exclude: coverageExclude,
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          // The heaviest interaction test (`LargeNetwork750`, a 750-node/
          // ~1,125-edge fixture) documents an intentional ~30s `waitFor`
          // budget for its routing batch (see its docstring in
          // `SmartEdgePerformance.stories.tsx`), on top of React Flow's own
          // render/measurement/`fitView` time. Vitest's default per-test
          // timeout is far short of that, so raise it repo-wide for this
          // project rather than leaving that documented budget unreachable.
          testTimeout: 45_000,
          browser: {
            enabled: true,
            headless: true,
            provider: storybookBrowserProvider,
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
