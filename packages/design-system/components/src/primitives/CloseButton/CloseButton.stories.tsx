import type { Meta, StoryObj } from "@storybook/react-vite";
import { Minus } from "lucide-react";
import { CloseButton } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/CloseButton",
  component: CloseButton,
  parameters: figmaDesign("CloseButton")
} satisfies Meta<typeof CloseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Name what it closes when more than one thing on screen could be closed
export const WithLabel: Story = {
  args: { "aria-label": "Close layer details" }
};

export const CustomIcon: Story = {
  args: { "aria-label": "Minimise", children: <Minus /> }
};

export const Disabled: Story = {
  args: { isDisabled: true }
};
