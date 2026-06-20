/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
  "src/internal/**",
  "src/**/*.test.ts",
  "src/**/*.test.tsx",
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
      ],
      tsconfigPath: "tsconfig.app.json",
      compilerOptions: {
        rootDir: "src",
      },
      insertTypesEntry: true,
      bundleTypes: true,
    }),
  ],
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
      // Baseline (Mar 2026): ~91% stmts/lines, ~78% branches, ~89% funcs.
      // Thresholds sit a few points below so minor drift does not fail CI.
      thresholds: {
        statements: 88,
        branches: 72,
        functions: 85,
        lines: 88,
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
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
