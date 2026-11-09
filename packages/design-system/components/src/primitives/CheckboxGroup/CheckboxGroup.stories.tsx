import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../Button";
import { Checkbox } from "../Checkbox";
import { Description, FieldError, Label } from "../Field";
import { CheckboxGroup } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/CheckboxGroup",
  component: CheckboxGroup,
  parameters: figmaDesign("CheckboxGroup"),
  args: { orientation: "vertical", variant: "primary" },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"]
    },
    variant: { control: "inline-radio", options: ["primary", "secondary"] }
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 280 }}>
        <Story />
      </div>
    )
  ],
  render: (args) => (
    <CheckboxGroup {...args}>
      <Label>Interests</Label>
      <Description>Choose all that apply</Description>
      <Checkbox
        value="travel"
        description="Enthusiasm for exploring new places, cultures, and experiences"
      >
        Travel
      </Checkbox>
      <Checkbox
        value="music"
        description="Enthusiasm, curiosity, and passion for music in its various forms"
      >
        Music
      </Checkbox>
      <Checkbox
        value="food"
        description="Enthusiasm or curiosity about various aspects of food"
      >
        Food
      </Checkbox>
      <FieldError>Choose at least one interest</FieldError>
    </CheckboxGroup>
  )
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = { args: { isInvalid: true } };

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: ["music"] }
};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 460 }}>
        <Story />
      </div>
    )
  ],
  render: (args) => (
    <CheckboxGroup {...args}>
      <Label>Layers</Label>
      <Description>Shown on the map</Description>
      <Checkbox value="suburbs">Suburbs</Checkbox>
      <Checkbox value="roads">Roads</Checkbox>
      <Checkbox value="rivers">Rivers</Checkbox>
      <FieldError>Choose at least one layer</FieldError>
    </CheckboxGroup>
  )
};

export const HorizontalInvalid: Story = {
  ...Horizontal,
  args: { orientation: "horizontal", isInvalid: true }
};

// Required: the browser's own validation blocks submit until one is checked
export const Required: Story = {
  args: { isRequired: true },
  render: (args) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {meta.render(args)}
      <Button type="submit" style={{ marginBlockStart: 16 }}>
        Submit
      </Button>
    </form>
  )
};

export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState(["travel"]);
    return (
      <>
        {meta.render({ ...args, value, onChange: setValue })}
        <p>Selected: {value.join(", ") || "none"}</p>
      </>
    );
  }
};
