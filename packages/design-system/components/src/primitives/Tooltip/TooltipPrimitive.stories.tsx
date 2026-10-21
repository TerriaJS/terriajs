import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info } from "lucide-react";
import { Button } from "../Button";
import { TooltipPrimitive } from ".";

const meta = {
  title: "Example/Tooltip/Primitive",
  component: TooltipPrimitive,
  args: { delay: 0, children: null },
  decorators: [
    (Story) => (
      <div style={{ padding: 64 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof TooltipPrimitive>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <TooltipPrimitive {...args}>
      <Button>Zoom in</Button>
      <TooltipPrimitive.Content>Zoom in one level</TooltipPrimitive.Content>
    </TooltipPrimitive>
  )
};

export const WithArrow: Story = {
  render: (args) => (
    <TooltipPrimitive {...args}>
      <Button>Zoom in</Button>
      <TooltipPrimitive.Content showArrow>
        <TooltipPrimitive.Arrow />
        Zoom in one level
      </TooltipPrimitive.Content>
    </TooltipPrimitive>
  )
};

export const Inverse: Story = {
  render: (args) => (
    <TooltipPrimitive {...args}>
      <Button>Zoom in</Button>
      <TooltipPrimitive.Content isInverse showArrow>
        <TooltipPrimitive.Arrow />
        Zoom in one level
      </TooltipPrimitive.Content>
    </TooltipPrimitive>
  )
};

// Content that isn't a button, like an icon, made focusable to show a tooltip
export const CustomTrigger: Story = {
  render: (args) => (
    <TooltipPrimitive {...args}>
      <TooltipPrimitive.Trigger aria-label="About this layer">
        <Info size={16} />
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content showArrow>
        <TooltipPrimitive.Arrow />
        Data from the 2021 census
      </TooltipPrimitive.Content>
    </TooltipPrimitive>
  )
};
