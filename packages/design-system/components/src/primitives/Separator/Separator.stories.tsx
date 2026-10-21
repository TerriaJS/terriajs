import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "./Separator";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Separator",
  component: Separator,
  parameters: figmaDesign("Separator"),
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "tertiary"]
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"]
    }
  }
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div style={{ inlineSize: 333 }}>
      <span>Layers</span>
      <Separator {...args} />
      <span>Base maps</span>
    </div>
  )
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div style={{ display: "flex", blockSize: 24, alignItems: "center" }}>
      <span>Zoom</span>
      <Separator {...args} />
      <span>Measure</span>
      <Separator {...args} />
      <span>Share</span>
    </div>
  )
};

export const Variants: Story = {
  render: () => (
    <div style={{ inlineSize: 333 }}>
      <Separator variant="primary" />
      <Separator variant="secondary" />
      <Separator variant="tertiary" />
    </div>
  )
};
