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
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@eslint-react/no-use-context": "off",
      "@eslint-react/no-context-provider": "off",
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "never",
        },
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
  ...(storybook.configs["flat/recommended"] as Config[]),
  prettier,
);
