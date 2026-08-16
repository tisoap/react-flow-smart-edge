import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [],
    benchmark: { include: ["bench/**/*.bench.ts"] },
    environment: "node",
  },
});
