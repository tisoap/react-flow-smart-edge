import type { Preview } from "@storybook/react-vite";
import "@xyflow/react/dist/style.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "error",
      // React Flow stacks edges over nodes, so axe cannot resolve contrast
      // for those elements and reports them as inconclusive (bgOverlap).
      context: {
        exclude: [
          ".react-flow__node",
          ".react-flow__edge-text",
          ".react-flow__edge-textwrapper",
          ".react-flow__edgelabel-renderer",
        ],
      },
    },
  },
};

export default preview;
