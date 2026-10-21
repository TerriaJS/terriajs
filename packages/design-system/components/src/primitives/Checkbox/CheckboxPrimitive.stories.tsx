import type { Meta, StoryObj } from "@storybook/react-vite";

import { X } from "lucide-react";
import { Description, Label } from "../Field";
import {
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxPrimitive
} from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Checkbox/Primitive",
  component: CheckboxPrimitive,
  parameters: figmaDesign("Checkbox"),
  subcomponents: { CheckboxContent, CheckboxControl, CheckboxIndicator },
  args: { children: null }
} satisfies Meta<typeof CheckboxPrimitive>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <CheckboxPrimitive {...args}>
      <CheckboxPrimitive.Content>
        <CheckboxPrimitive.Control>
          <CheckboxPrimitive.Indicator />
        </CheckboxPrimitive.Control>
        <Label>Show suburbs</Label>
      </CheckboxPrimitive.Content>
      <Description>Draws suburb boundaries on the map</Description>
    </CheckboxPrimitive>
  )
};

export const CustomIndicator: Story = {
  args: { defaultSelected: true },
  render: (args) => (
    <CheckboxPrimitive {...args}>
      {({ isSelected }) => (
        <CheckboxPrimitive.Content>
          <CheckboxPrimitive.Control>
            <CheckboxPrimitive.Indicator>
              {isSelected ? <X /> : null}
            </CheckboxPrimitive.Indicator>
          </CheckboxPrimitive.Control>
          <Label>Hide this layer</Label>
        </CheckboxPrimitive.Content>
      )}
    </CheckboxPrimitive>
  )
};
