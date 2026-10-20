import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from ".";

const meta = {
  title: "Example/Checkbox/Default",
  component: Checkbox,
  args: { children: "Show suburbs", variant: "primary" },
  argTypes: {
    variant: { control: "inline-radio", options: ["primary", "secondary"] }
  }
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: "Draws suburb boundaries on the map" }
};

export const Invalid: Story = {
  args: {
    isInvalid: true,
    description: "Draws suburb boundaries on the map",
    errorMessage: "Choose at least one layer"
  }
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      <Checkbox {...args}>Unchecked</Checkbox>
      <Checkbox {...args} defaultSelected>
        Checked
      </Checkbox>
      <Checkbox {...args} isIndeterminate>
        Indeterminate
      </Checkbox>
      <Checkbox {...args} isInvalid>
        Invalid
      </Checkbox>
      <Checkbox {...args} isInvalid defaultSelected>
        Invalid checked
      </Checkbox>
      <Checkbox {...args} isDisabled>
        Disabled
      </Checkbox>
      <Checkbox {...args} isDisabled defaultSelected>
        Disabled checked
      </Checkbox>
      <Checkbox {...args} isReadOnly defaultSelected>
        Read only
      </Checkbox>
    </div>
  )
};

export const Secondary: Story = {
  args: { variant: "secondary" },
  render: States.render
};

// The box stays on the first line when the label wraps
export const LongLabel: Story = {
  args: {
    children:
      "Show suburb boundaries, including the names of every suburb at this zoom level",
    description: "Turning this off speeds up the map on slow connections"
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 240 }}>
        <Story />
      </div>
    )
  ]
};
