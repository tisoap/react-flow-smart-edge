import path from "node:path";
import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

/** Storybook builds published by Chromatic CI (`.github/workflows/chromatic.yml`). */
const chromaticStorybookUrl =
  process.env.CHROMATIC_STORYBOOK_URL ??
  "https://www.chromatic.com/library?appId=625ade28911b53003a921739";

function includeParentSrcPlugin() {
  return {
    name: "include-parent-src",
    configureWebpack(
      _config: unknown,
      isServer: boolean,
      utils: { getJSLoader: (options: { isServer: boolean }) => unknown },
    ) {
      const { getJSLoader } = utils;
      return {
        resolve: {
          alias: {
            "@tisoap/react-flow-smart-edge": path.resolve(
              __dirname,
              "../src/index.tsx",
            ),
            "@demos": path.resolve(__dirname, "../src/demos"),
          },
        },
        module: {
          rules: [
            {
              test: /\.(tsx|ts|jsx|js)$/,
              include: [path.resolve(__dirname, "../src")],
              use: getJSLoader({ isServer }),
            },
          ],
        },
      };
    },
  };
}

/** GitHub Pages project site path; use `/` in development so `localhost:3000/docs` works. */
const baseUrl =
  process.env.DOCUSAURUS_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "/" : "/react-flow-smart-edge/");

const config: Config = {
  title: "React Flow Smart Edge",
  tagline: "Custom edges for React Flow that route around nodes",
  favicon: "img/logo.svg",
  url: "https://tisoap.github.io",
  baseUrl,
  organizationName: "tisoap",
  projectName: "react-flow-smart-edge",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  plugins: [includeParentSrcPlugin],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "docs",
          editUrl:
            "https://github.com/tisoap/react-flow-smart-edge/tree/main/website/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Smart Edge",
      logo: {
        alt: "React Flow Smart Edge",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        {
          href: chromaticStorybookUrl,
          label: "Storybook",
          position: "right",
        },
        {
          href: "https://github.com/tisoap/react-flow-smart-edge",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Introduction",
              to: "/docs",
            },
            {
              label: "Quick start",
              to: "/docs/getting-started/quick-start",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/tisoap/react-flow-smart-edge",
            },
            {
              label: "Storybook (Chromatic)",
              href: chromaticStorybookUrl,
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Tiso Alvarez Puccinelli. MIT License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
