import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Switch, type SwitchProps, type SwitchSize } from ".";

const meta = {
  title: "Example/Switch/Default",
  component: Switch,
  args: { children: "Show labels", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] }
  }
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: "Draws place names on the map" }
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      <Switch {...args} defaultSelected={false}>
        Off
      </Switch>
      <Switch {...args} defaultSelected>
        On
      </Switch>
      <Switch {...args} isDisabled defaultSelected={false}>
        Disabled off
      </Switch>
      <Switch {...args} isDisabled defaultSelected>
        Disabled on
      </Switch>
      <Switch {...args} isReadOnly defaultSelected>
        Read only
      </Switch>
    </div>
  )
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["sm", "md", "lg"] as SwitchSize[]).map((size) => (
        <div key={size} style={{ display: "flex", gap: 24 }}>
          <Switch {...args} size={size} defaultSelected={false}>
            {size}: off
          </Switch>
          <Switch {...args} size={size} defaultSelected>
            {size}: on
          </Switch>
        </div>
      ))}
    </div>
  )
};

const ControlledSwitch = (props: SwitchProps): React.ReactElement => {
  const [isSelected, setIsSelected] = useState(false);
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Switch {...props} isSelected={isSelected} onChange={setIsSelected} />
      <p role="status">Labels are {isSelected ? "shown" : "hidden"}</p>
    </div>
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledSwitch {...args} />
};

export const Invalid: Story = {
  args: {
    isInvalid: true,
    errorMessage: "Enable labels to continue"
  }
};

export const LongLabel: Story = {
  args: {
    children:
      "Show place names and geographic labels on every visible map layer",
    description: "This setting applies to all maps in your workspace."
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 240 }}>
        <Story />
      </div>
    )
  ]
};

export const RightToLeft: Story = {
  args: {
    children: "إظهار التسميات",
    description: "عرض أسماء الأماكن على الخريطة"
  },
  decorators: [
    (Story) => (
      <div dir="rtl" lang="ar">
        <Story />
      </div>
    )
  ]
};
