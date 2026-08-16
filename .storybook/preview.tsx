import type { Preview } from "@storybook/react-vite";
import { configure } from "storybook/test";
import { PLAY_WAIT_TIMEOUT_MS } from "../src/stories/storyPlayHelpers";
import { resolveDecoratorColorMode } from "../src/stories/storyColorMode";
import "@xyflow/react/dist/style.css";

configure({ asyncUtilTimeout: PLAY_WAIT_TIMEOUT_MS });

const preview: Preview = {
  globalTypes: {
    colorMode: {
      description: "React Flow color mode for demos",
      toolbar: {
        title: "Color mode",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    colorMode: "light",
  },
  decorators: [
    (Story, context) => {
      const colorMode = resolveDecoratorColorMode(
        context.args,
        context.globals,
      );
      const args = {
        ...context.args,
        colorMode,
      };
      const fillHost = context.parameters["demoHostHeight"] !== "fullscreen";

      if (!fillHost) {
        return <Story args={args} />;
      }

      return (
        <div style={{ width: "100%", height: 500, position: "relative" }}>
          <Story args={args} />
        </div>
      );
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
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
