import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef } from "react";
import { ColorField, type ColorFieldProps } from ".";
import { ColorArea } from "../ColorArea";
import { ColorPicker } from "../ColorPicker";
import { ColorSlider } from "../ColorSlider";
import { Description, FieldError, Label } from "../Field";
import { figmaDesign } from "../../figma";
import "./color-field.stories.css";

// The design's field: a label, the swatch and hex, and a description or
// error. Called as a function, not rendered as a component, so a story's
// code shows the markup it returns
const field = (props: ColorFieldProps): React.ReactElement => (
  <ColorField {...props}>
    <Label>Color</Label>
    <ColorField.Group>
      <ColorField.Swatch />
      <ColorField.Input placeholder="#" />
    </ColorField.Group>
    <Description>How your brand looks</Description>
    <FieldError>Please enter a valid color</FieldError>
  </ColorField>
);

const meta = {
  title: "Example/Color/ColorField",
  component: ColorField,
  parameters: figmaDesign("ColorField"),
  subcomponents: {
    "ColorField.Group": ColorField.Group,
    "ColorField.Swatch": ColorField.Swatch,
    "ColorField.Input": ColorField.Input
  },
  args: { defaultValue: "#0485f7", fullWidth: true },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    defaultValue: {
      control: "color",
      description: "The colour at first",
      table: { type: { summary: "string | Color" } }
    },
    isInvalid: {
      control: "boolean",
      description: "Shows the FieldError and marks the field invalid",
      table: { type: { summary: "boolean" } }
    },
    isDisabled: {
      control: "boolean",
      description: "Can't be changed",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the colour typed, as the field is left",
      table: { type: { summary: "(color: Color | null) => void" } }
    }
  },
  render: (args) => field(args),
  decorators: [
    (Story) => (
      <div className="color-field-story">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ColorField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type a colour as hex; it's taken as the field is left, and the swatch
 * shows it. Something that isn't a colour goes back to the last one */
export const Default: Story = {};

/** Empty, the swatch shows no colour */
export const Empty: Story = { args: { defaultValue: undefined } };

export const Invalid: Story = { args: { isInvalid: true } };

export const Disabled: Story = {
  parameters: {
    // Text in a disabled field has no contrast requirement (WCAG 1.4.3);
    // axe only knows that for labels, not descriptions or values
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } }
  },
  args: { isDisabled: true }
};

/** In a ColorPicker, the field changes the picker's colour. Its swatch, in
 * ColorPicker.Trigger, opens the picker below the whole field, its group
 * being the popover's triggerRef */
export const WithPicker: Story = {
  render: function Render(args) {
    const groupRef = useRef<HTMLDivElement>(null);

    return (
      <ColorPicker defaultValue="#0485f7">
        <ColorField {...args} defaultValue={undefined}>
          <Label>Color</Label>
          <ColorField.Group ref={groupRef}>
            <ColorPicker.Trigger aria-label="Pick a colour">
              <ColorField.Swatch />
            </ColorPicker.Trigger>
            <ColorField.Input placeholder="#" />
          </ColorField.Group>
        </ColorField>
        <ColorPicker.Popover triggerRef={groupRef}>
          <ColorArea aria-label="Saturation and brightness" />
          <ColorSlider
            aria-label="Hue"
            channel="hue"
            colorSpace="hsb"
            showValue={false}
          />
        </ColorPicker.Popover>
      </ColorPicker>
    );
  }
};
