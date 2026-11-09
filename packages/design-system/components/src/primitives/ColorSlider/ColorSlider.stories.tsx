import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  getColorChannels,
  parseColor,
  type ColorSpace
} from "react-aria-components/ColorSlider";
import { ColorSlider, ColorSliderPrimitive } from ".";
import { ColorSwatch } from "../ColorSwatch";
import { Label } from "../Field";
import { ListBox } from "../ListBox";
import { Select } from "../Select";
import { figmaDesign } from "../../figma";
import "./color-slider.stories.css";

const CHANNELS = [
  "hue",
  "saturation",
  "brightness",
  "lightness",
  "red",
  "green",
  "blue",
  "alpha"
] as const;

const meta = {
  title: "Example/Color/ColorSlider",
  component: ColorSlider,
  parameters: figmaDesign("ColorSlider"),
  subcomponents: {
    "ColorSliderPrimitive.Output": ColorSliderPrimitive.Output,
    "ColorSliderPrimitive.Track": ColorSliderPrimitive.Track,
    "ColorSliderPrimitive.Thumb": ColorSliderPrimitive.Thumb
  },
  args: {
    label: "Hue",
    channel: "hue",
    defaultValue: "hsl(33, 90%, 55%)",
    showValue: true,
    isDisabled: false
  },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    channel: {
      control: "select",
      options: CHANNELS,
      description: "The channel the slider changes",
      table: { type: { summary: "ColorChannel" } }
    },
    colorSpace: {
      control: "inline-radio",
      options: ["rgb", "hsb", "hsl"],
      description:
        "The space the channel is in; the channel's own for red, green, blue, lightness and brightness",
      table: { type: { summary: "ColorSpace" } }
    },
    defaultValue: {
      control: "color",
      description: "The colour at first",
      table: { type: { summary: "string | Color" } }
    },
    isDisabled: {
      control: "boolean",
      description: "Can't be changed",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the colour as it changes",
      table: { type: { summary: "(color: Color) => void" } }
    }
  },
  decorators: [
    (Story) => (
      <div className="color-slider-story">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ColorSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drag the thumb, or focus it and use the arrows. The track shows the
 * channel's range for the colour as it is */
export const Default: Story = {};

const SPACES: ColorSpace[] = ["rgb", "hsb", "hsl"];

/** As in the design's sliders: a slider for each channel of the space
 * picked, and alpha, all changing one colour */
export const Channels: Story = {
  render: function Render(args) {
    const [color, setColor] = useState(() =>
      parseColor("hsla(33, 90%, 55%, 1)")
    );
    const [colorSpace, setColorSpace] = useState<ColorSpace>("rgb");

    return (
      <div className="tds-stack tds-flex-gap-md">
        <Select
          aria-label="Color space"
          value={colorSpace}
          onChange={(key) => {
            const space = SPACES.find((space) => space === key);
            if (space) setColorSpace(space);
          }}
        >
          <Label>Color space</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {SPACES.map((space) => (
                <ListBox.Item
                  key={space}
                  id={space}
                  textValue={space.toUpperCase()}
                >
                  {space.toUpperCase()}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {[...getColorChannels(colorSpace), "alpha" as const].map((channel) => (
          <ColorSlider
            key={channel}
            {...args}
            label={channel.charAt(0).toUpperCase() + channel.slice(1)}
            channel={channel}
            colorSpace={colorSpace}
            value={color}
            onChange={setColor}
          />
        ))}
        <div className="tds-cluster tds-flex-gap-sm tds-items-center">
          <ColorSwatch color={color} size="sm" />
          {color.toString("hexa")}
        </div>
      </div>
    );
  }
};

/** orientation="vertical" is the track alone, the channel running bottom to
 * top; name it with aria-label */
export const Vertical: Story = {
  args: { orientation: "vertical", "aria-label": "Hue", label: undefined },
  decorators: [
    (Story) => (
      <div className="color-slider-story-upright">
        <Story />
      </div>
    )
  ]
};

export const Disabled: Story = {
  parameters: {
    // Text in a disabled field has no contrast requirement (WCAG 1.4.3);
    // axe only knows that for labels, not descriptions or values
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } }
  },
  args: { isDisabled: true }
};
