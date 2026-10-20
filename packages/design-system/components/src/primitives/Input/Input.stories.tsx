import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./Input";

const meta = {
  title: "Example/Input",
  component: Input,
  args: { "aria-label": "Layer name", placeholder: "Search layers" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] }
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 291 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" }
};

export const Filled: Story = {
  args: { defaultValue: "Suburbs 2021" }
};

export const Invalid: Story = {
  args: { defaultValue: "Suburbs 2021", "aria-invalid": true }
};

export const FullWidth: Story = {
  args: { fullWidth: true }
};

export const Disabled: Story = {
  args: { defaultValue: "Suburbs 2021", disabled: true }
};
