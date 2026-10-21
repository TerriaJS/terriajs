import type { Meta, StoryObj } from "@storybook/react-vite";

import { Info } from "lucide-react";
import { Input } from "../Input";
import { TextArea } from "../TextArea";
import { Description, FieldError, Label, TextField } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Field",
  component: TextField,
  parameters: figmaDesign("TextField"),
  subcomponents: { Label, Description, FieldError },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 280 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <TextField {...args}>
      <Label>Your name</Label>
      <Input fullWidth placeholder="John" />
      <Description>We&apos;ll never share this with anyone else</Description>
    </TextField>
  )
};

export const Required: Story = {
  args: { isRequired: true },
  render: Default.render
};

export const WithInfoIcon: Story = {
  args: { isRequired: true },
  render: (args) => (
    <TextField {...args}>
      <Label>
        Your name
        <Info aria-hidden size={12} />
      </Label>
      <Input fullWidth placeholder="John" />
      <Description>We&apos;ll never share this with anyone else</Description>
    </TextField>
  )
};

export const Invalid: Story = {
  args: { isRequired: true, isInvalid: true, defaultValue: "Mary387" },
  render: (args) => (
    <TextField {...args}>
      <Label>Your name</Label>
      <Input fullWidth />
      <Description>We&apos;ll never share this with anyone else</Description>
      <FieldError>Please enter only letters</FieldError>
    </TextField>
  )
};

export const Disabled: Story = {
  args: { isRequired: true, isDisabled: true },
  render: Default.render
};

export const WithTextArea: Story = {
  render: (args) => (
    <TextField {...args}>
      <Label>Notes</Label>
      <TextArea fullWidth placeholder="Add notes about this layer" />
      <Description>Shown to everyone who opens the layer</Description>
    </TextField>
  )
};
