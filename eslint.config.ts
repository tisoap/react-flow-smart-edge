import storybook from "eslint-plugin-storybook";
import eslint from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores, defineConfig, type Config } from "eslint/config";
import { configs as sonarJsConfigs } from "eslint-plugin-sonarjs";
import prettier from "eslint-plugin-prettier/recommended";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";

export default defineConfig(
  globalIgnores(["dist", "storybook-static", "website", "bench"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      eslintReact.configs["recommended-type-checked"],
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
      sonarJsConfigs.recommended,
      comments.recommended,
      reactYouMightNotNeedAnEffect.configs.strict,
    ],
    languageOptions: {
      ecmaVersion: 2025,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disabled
      "react-refresh/only-export-components": "off",
      "@eslint-react/no-use-context": "off",
      "@eslint-react/no-context-provider": "off",
      // Errors
      "id-length": ["error", { min: 3, properties: "never" }],
      "react-hooks/exhaustive-deps": ["error"],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
      ],
      "@eslint-community/eslint-comments/no-restricted-disable": [
        "error",
        "react/*",
        "sonarjs/*",
        "react-hooks/*",
        "@eslint-react/*",
        "eslint-community/*",
        "@typescript-eslint/no-explicit-any",
      ],
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: [] },
      ],
      "sonarjs/cyclomatic-complexity": "error",
      "sonarjs/expression-complexity": "error",
      "sonarjs/nested-control-flow": "error",
      "sonarjs/too-many-break-or-continue-in-loop": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/elseif-without-else": "error",
      "sonarjs/no-inconsistent-returns": "error",
      "sonarjs/non-number-in-arithmetic-expression": "error",
      "sonarjs/operation-returning-nan": "error",
      "sonarjs/values-not-convertible-to-numbers": "error",
      "sonarjs/strings-comparison": "error",
      "sonarjs/array-constructor": "error",
      "sonarjs/no-duplicate-string": "error",
      "sonarjs/no-incorrect-string-concat": "error",
      "sonarjs/unicode-aware-regex": "error",
      "sonarjs/max-union-size": "error",
      "sonarjs/bool-param-default": "error",
      "sonarjs/no-implicit-dependencies": "error",
      "sonarjs/no-wildcard-import": "error",
      "sonarjs/no-unused-function-argument": "error",
      "sonarjs/no-return-type-any": "error",
      "sonarjs/prefer-immediate-return": "error",
      "sonarjs/no-undefined-assignment": "error",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.test.ts", "**/*.test.tsx", "**/*.stories.tsx"],
    rules: {
      "sonarjs/max-lines": ["error", { maximum: 300 }],
      "sonarjs/max-lines-per-function": "error",
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json"],
        projectService: false,
      },
    },
  },
  {
    files: ["src/**/*.stories.tsx", "eslint.config.ts"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    files: [".storybook/**"],
    rules: {
      "sonarjs/todo-tag": "off",
    },
  },
  ...(storybook.configs["flat/recommended"] as Config[]),
  prettier,
);
