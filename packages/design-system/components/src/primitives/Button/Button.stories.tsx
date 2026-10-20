import type { Meta, StoryObj } from "@storybook/react-vite";

import { fn } from "storybook/test";

import { Settings } from "lucide-react";

import { Button } from "./Button";

const meta = {
  title: "Example/Button",
  component: Button,
  args: {
    onPress: fn()
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button"
  }
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Button"
  }
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    children: "Button"
  }
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Button"
  }
};

export const DangerSoft: Story = {
  args: {
    variant: "danger-soft",
    children: "Button"
  }
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Button"
  }
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Button"
  }
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Button"
  }
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Button"
  }
};

export const IconOnly: Story = {
  args: {
    isIconOnly: true,
    "aria-label": "Settings",
    children: <Settings />
  }
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: "Button"
  }
};
