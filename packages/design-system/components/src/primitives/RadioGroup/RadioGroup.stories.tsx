import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../Button";
import { Description, FieldError, Label } from "../Field";
import { Radio, RadioPrimitive } from "../Radio";
import { RadioGroup } from ".";

const meta = {
  title: "Example/RadioGroup",
  component: RadioGroup,
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
    <RadioGroup {...args}>
      <Label>Base map</Label>
      <Description>Drawn under every layer</Description>
      <Radio value="streets" description="Roads and place names">
        Streets
      </Radio>
      <Radio value="satellite" description="Aerial imagery">
        Satellite
      </Radio>
      <Radio value="terrain" description="Elevation shading">
        Terrain
      </Radio>
      <FieldError>Choose a base map</FieldError>
    </RadioGroup>
  )
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = { args: { defaultValue: "satellite" } };

export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: "satellite" }
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: "satellite" }
};

export const Secondary: Story = {
  args: { variant: "secondary", defaultValue: "satellite" }
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
    <RadioGroup {...args}>
      <Label>Units</Label>
      <Description>Used for distances and areas</Description>
      <Radio value="metric">Metric</Radio>
      <Radio value="imperial">Imperial</Radio>
      <Radio value="nautical">Nautical</Radio>
      <FieldError>Choose a unit</FieldError>
    </RadioGroup>
  )
};

export const HorizontalInvalid: Story = {
  ...Horizontal,
  args: { orientation: "horizontal", isInvalid: true }
};

// Required: the browser's own validation blocks submit until one is chosen
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
    const [value, setValue] = useState("streets");
    return (
      <>
        {meta.render({ ...args, value, onChange: setValue })}
        <p>Selected: {value}</p>
      </>
    );
  }
};

// The parts, for a custom indicator in place of the dot
export const CustomIndicator: Story = {
  args: { defaultValue: "on" },
  render: (args) => (
    <RadioGroup {...args}>
      <Label>Labels</Label>
      {["on", "off"].map((value) => (
        <RadioPrimitive key={value} value={value}>
          <RadioPrimitive.Content>
            <RadioPrimitive.Control>
              <RadioPrimitive.Indicator>
                {value === args.defaultValue ? "✓" : null}
              </RadioPrimitive.Indicator>
            </RadioPrimitive.Control>
            <Label>{value === "on" ? "Show" : "Hide"}</Label>
          </RadioPrimitive.Content>
        </RadioPrimitive>
      ))}
    </RadioGroup>
  )
};
