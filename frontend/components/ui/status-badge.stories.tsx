import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "./status-badge";

/**
 * StatusBadge displays the screening status of an abstract.
 * It's used throughout the Review Tool to indicate inclusion/exclusion decisions.
 */
const meta: Meta<typeof StatusBadge> = {
  title: "Atoms/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: ["include", "exclude", "maybe", "pending", "analyzing"],
      description: "The status to display",
    },
    size: {
      control: "select",
      options: ["sm", "md"],
      description: "Badge size variant",
    },
    showIcon: {
      control: "boolean",
      description: "Whether to show the status icon",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "A visual indicator for abstract screening status. Used in AbstractCard and screening workflows.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

// Default states
export const Include: Story = {
  args: {
    status: "include",
  },
};

export const Exclude: Story = {
  args: {
    status: "exclude",
  },
};

export const Maybe: Story = {
  args: {
    status: "maybe",
  },
};

export const Pending: Story = {
  args: {
    status: "pending",
  },
};

export const Analyzing: Story = {
  args: {
    status: "analyzing",
  },
};

// Size variants
export const SmallSize: Story = {
  args: {
    status: "include",
    size: "sm",
  },
};

export const MediumSize: Story = {
  args: {
    status: "include",
    size: "md",
  },
};

// Without icon
export const NoIcon: Story = {
  args: {
    status: "include",
    showIcon: false,
  },
};

// All statuses side by side
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="include" />
      <StatusBadge status="exclude" />
      <StatusBadge status="maybe" />
      <StatusBadge status="pending" />
      <StatusBadge status="analyzing" />
    </div>
  ),
};

// All sizes comparison
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">Small</p>
        <StatusBadge status="include" size="sm" />
      </div>
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">Medium</p>
        <StatusBadge status="include" size="md" />
      </div>
    </div>
  ),
};
