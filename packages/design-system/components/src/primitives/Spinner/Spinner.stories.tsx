import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner, type SpinnerColor, type SpinnerSize } from ".";
import { Button } from "../Button";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Spinner",
  component: Spinner,
  parameters: figmaDesign("Spinner"),
  args: { "aria-label": "Loading", color: "accent", size: "md" },
  argTypes: {
    color: {
      control: "inline-radio",
      options: ["accent", "current", "success", "warning", "danger"]
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] }
  }
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Loading with no known progress. It has no visible label, so it needs an
 * aria-label; for a known amount use ProgressBar or ProgressCircle */
export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="tds-row tds-items-center tds-flex-gap-lg">
      {(["sm", "md", "lg"] as SpinnerSize[]).map((size) => (
        <Spinner key={size} {...args} size={size} />
      ))}
    </div>
  )
};

/** `current` follows the surrounding text color */
export const Colors: Story = {
  render: (args) => (
    <div className="tds-row tds-flex-gap-lg">
      {(
        ["accent", "current", "success", "warning", "danger"] as SpinnerColor[]
      ).map((color) => (
        <Spinner key={color} {...args} color={color} />
      ))}
    </div>
  )
};

/** A pending Button shows a small Spinner in its text color in place of its
 * label */
export const InButton: Story = {
  render: () => (
    <Button isPending pendingLabel="Saving">
      Save
    </Button>
  )
};
