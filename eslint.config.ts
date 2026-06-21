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
  globalIgnores(["dist", "storybook-static", "website"]),
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
      ],
      "@eslint-community/eslint-comments/require-description": [
        "error",
        { ignore: [] },
      ],
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
