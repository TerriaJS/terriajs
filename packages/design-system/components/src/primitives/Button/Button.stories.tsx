import type { Meta, StoryObj } from "@storybook/react-vite";

import { fn } from "storybook/test";

import { SettingsIcon } from "@terria/design-system-icons";

import { useEffect } from "react";
import { useArgs } from "storybook/preview-api";
import { Button, type ButtonProps } from "./Button";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Button",
  component: Button,
  parameters: figmaDesign("Button"),
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
    children: <SettingsIcon />
  }
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: "Button"
  }
};

export const Pending: Story = {
  render: (args) => {
    const [{ isPending, onPress }, updateArgs] = useArgs<ButtonProps>();
    useEffect(() => {
      const timer = setTimeout(() => {
        updateArgs({ isPending: false });
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }, [isPending, updateArgs]);

    return (
      <div>
        <Button
          {...args}
          isPending={isPending}
          onPress={(ev) => {
            onPress?.(ev);
            updateArgs({ isPending: true });
          }}
          pendingLabel={args.pendingLabel}
        >
          Test async
        </Button>
      </div>
    );
  },
  args: {
    isPending: false,
    pendingLabel: "Async action in progres"
  }
};
