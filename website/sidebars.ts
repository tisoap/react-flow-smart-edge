import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Getting started",
      items: ["getting-started/quick-start"],
    },
    {
      type: "category",
      label: "Edge types",
      items: [
        "edge-types/bezier",
        "edge-types/straight",
        "edge-types/step",
        "edge-types/smooth-step",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/configuring-options",
        "guides/floating-edges",
        "guides/editable-edges",
        "guides/checkpoint-edges",
        "guides/avoid-areas",
        "guides/custom-edges",
      ],
    },
    {
      type: "category",
      label: "API reference",
      items: [
        "api/get-smart-edge",
        "api/get-smart-edge-waypoints",
        "api/create-smart-edge",
        "api/smart-edge-presets",
        "api/get-floating-edge-params",
      ],
    },
    {
      type: "category",
      label: "Options",
      items: [
        "options/node-padding",
        "options/grid-ratio",
        "options/avoid-areas",
        "options/floating",
        "options/editable",
        "options/checkpoints",
        "options/control-point-color",
        "options/draw-edge",
        "options/generate-path",
      ],
    },
    {
      type: "category",
      label: "Types",
      items: ["types/exported-types"],
    },
  ],
};

export default sidebars;
