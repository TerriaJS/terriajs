import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextArea } from "./TextArea";

const meta = {
  title: "Example/TextArea",
  component: TextArea,
  args: {
    "aria-label": "Layer notes",
    placeholder: "Add notes about this layer"
  },
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
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" }
};

export const Filled: Story = {
  args: {
    defaultValue:
      "Population counts by suburb from the 2021 census, updated every five years."
  }
};

export const Rows: Story = {
  args: { rows: 5, fullWidth: true }
};

export const Invalid: Story = {
  args: { defaultValue: "Too short", "aria-invalid": true }
};

export const FullWidth: Story = {
  args: { fullWidth: true }
};

export const Disabled: Story = {
  args: { defaultValue: "Read-only notes", disabled: true }
};
