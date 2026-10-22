import type { Meta, StoryObj } from "@storybook/react-vite";

import { EyeClosedIcon, EyeIcon } from "@terria/design-system-icons";
import { Description, Label } from "../Field";
import {
  SwitchPrimitive,
  SwitchContent,
  SwitchControl,
  SwitchIcon,
  SwitchThumb,
  type SwitchSize
} from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Switch/Primitive",
  component: SwitchPrimitive,
  parameters: figmaDesign("Switch"),
  subcomponents: { SwitchContent, SwitchControl, SwitchThumb, SwitchIcon },
  args: { size: "md", children: null },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] }
  }
} satisfies Meta<typeof SwitchPrimitive>;

export default meta;
type Story = StoryObj<typeof meta>;

const control = (
  <SwitchPrimitive.Control>
    <SwitchPrimitive.Thumb />
  </SwitchPrimitive.Control>
);

export const Default: Story = {
  render: (args) => (
    <SwitchPrimitive {...args}>
      <SwitchPrimitive.Content>
        {control}
        <Label>Show labels</Label>
      </SwitchPrimitive.Content>
    </SwitchPrimitive>
  )
};

export const Selected: Story = {
  args: { defaultSelected: true },
  render: Default.render
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 16 }}>
      {(["sm", "md", "lg"] as SwitchSize[]).map((size) => (
        <SwitchPrimitive key={size} size={size} defaultSelected>
          <SwitchPrimitive.Content>
            {control}
            <Label>Switch label</Label>
          </SwitchPrimitive.Content>
        </SwitchPrimitive>
      ))}
    </div>
  )
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultSelected: true },
  render: Default.render
};

export const WithoutLabel: Story = {
  render: (args) => (
    <SwitchPrimitive {...args} aria-label="Show labels">
      <SwitchPrimitive.Content>{control}</SwitchPrimitive.Content>
    </SwitchPrimitive>
  )
};

export const WithDescription: Story = {
  render: (args) => (
    <SwitchPrimitive {...args}>
      <SwitchPrimitive.Content>
        {control}
        <Label>Show labels</Label>
      </SwitchPrimitive.Content>
      <Description>Draws place names on the map</Description>
    </SwitchPrimitive>
  )
};

export const WithIcon: Story = {
  render: (args) => (
    <SwitchPrimitive {...args}>
      {({ isSelected }) => (
        <SwitchPrimitive.Content>
          <SwitchPrimitive.Control>
            <SwitchPrimitive.Thumb>
              <SwitchPrimitive.Icon>
                {isSelected ? <EyeIcon /> : <EyeClosedIcon />}
              </SwitchPrimitive.Icon>
            </SwitchPrimitive.Thumb>
          </SwitchPrimitive.Control>
          <Label>Show layer</Label>
        </SwitchPrimitive.Content>
      )}
    </SwitchPrimitive>
  )
};

// Figma's SwitchGroup: a settings row with the switch at the end
export const SettingsRow: Story = {
  render: (args) => (
    <SwitchPrimitive {...args} style={{ inlineSize: 312 }}>
      <SwitchPrimitive.Content
        style={{
          display: "flex",
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          inlineSize: "100%"
        }}
      >
        {control}
        <span style={{ display: "flex", flexDirection: "column" }}>
          <Label>Allow notifications</Label>
          <Description>Receive push notifications on your device</Description>
        </span>
      </SwitchPrimitive.Content>
    </SwitchPrimitive>
  )
};
