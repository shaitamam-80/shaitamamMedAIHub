import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css"; // Load Tailwind CSS and design tokens

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Dark Mode toggle in Storybook
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#020817" }, // Our dark background
      ],
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
  // Apply dark class when dark background is selected
  decorators: [
    (Story, context) => {
      const isDark = context.globals.backgrounds?.value === "#020817";
      return (
        <div className={isDark ? "dark" : ""}>
          <div className="bg-background text-foreground p-4 min-h-screen">
            <Story />
          </div>
        </div>
      );
    },
  ],
};

export default preview;