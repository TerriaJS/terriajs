import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  getColorChannels,
  parseColor,
  type ColorChannel,
  type ColorSpace
} from "react-aria-components/ColorArea";
import { ColorArea } from ".";
import { ColorSwatch } from "../ColorSwatch";
import { Label } from "../Field";
import { ListBox } from "../ListBox";
import { Select } from "../Select";
import { figmaDesign } from "../../figma";
import "./color-area.stories.css";

const CHANNELS = ["hue", "saturation", "brightness", "lightness"] as const;

const meta = {
  title: "Example/Color/ColorArea",
  component: ColorArea,
  parameters: figmaDesign("ColorArea"),
  subcomponents: { "ColorArea.Thumb": ColorArea.Thumb },
  args: {
    "aria-label": "Layer colour",
    defaultValue: "hsb(219, 76%, 96%)",
    showDots: false,
    isDisabled: false
  },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    defaultValue: {
      control: "color",
      description: "The colour picked at first",
      table: { type: { summary: "string | Color" } }
    },
    xChannel: {
      control: "select",
      options: CHANNELS,
      description: "The channel across, saturation unless set",
      table: { type: { summary: "ColorChannel" } }
    },
    yChannel: {
      control: "select",
      options: CHANNELS,
      description: "The channel up, brightness unless set",
      table: { type: { summary: "ColorChannel" } }
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
      <div className="color-area-story">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ColorArea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Drag the thumb, or focus it and use the arrows: left and right change the
 * saturation, up and down the brightness. The hue stays as it is */
export const Default: Story = {};

/** showDots overlays a grid of faint dots */
export const WithDots: Story = { args: { showDots: true } };

/** value and onChange keep the colour outside, here shown beside it */
export const Controlled: Story = {
  render: function Render(args) {
    const [color, setColor] = useState(() => parseColor("hsb(160, 80%, 70%)"));

    return (
      <div className="tds-stack tds-flex-gap-md">
        <ColorArea {...args} value={color} onChange={setColor} />
        <div className="tds-cluster tds-flex-gap-sm tds-items-center">
          <ColorSwatch color={color} size="sm" />
          {color.toString("hex")}
        </div>
      </div>
    );
  }
};

export const Disabled: Story = { args: { isDisabled: true } };

const SPACES: ColorSpace[] = ["rgb", "hsb", "hsl"];

// An option as it shows: a space in capitals, a channel capitalised
const optionName = (option: string): string =>
  SPACES.some((space) => space === option)
    ? option.toUpperCase()
    : option.charAt(0).toUpperCase() + option.slice(1);

// A Select of options, named as they show. Called as a function, not
// rendered as a component, so a story's code shows the markup it returns
const optionSelect = <T extends string>(
  label: string,
  value: T,
  options: readonly T[],
  onChange: (value: T) => void
): React.ReactElement => (
  <Select
    value={value}
    onChange={(key) => {
      const option = options.find((option) => option === key);
      if (option) onChange(option);
    }}
  >
    <Label>{label}</Label>
    <Select.Trigger>
      <Select.Value />
      <Select.Indicator />
    </Select.Trigger>
    <Select.Popover>
      <ListBox>
        {options.map((option) => (
          <ListBox.Item key={option} id={option} textValue={optionName(option)}>
            {optionName(option)}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </ListBox>
    </Select.Popover>
  </Select>
);

/** colorSpace sets the space the colour is changed in, and xChannel and
 * yChannel the two of its channels the area changes, across and up; the
 * third stays as it is. Pick them here: the axes offer the space's channels,
 * and never the same one twice. HSB, saturation and brightness, as beside a
 * hue slider, is the default */
export const ColorSpaceAndChannels: Story = {
  render: function Render(args) {
    const [color, setColor] = useState(() => parseColor("hsb(219, 76%, 96%)"));
    const [colorSpace, setColorSpace] = useState<ColorSpace>("rgb");
    const [xChannel, setXChannel] = useState<ColorChannel>("blue");
    const [yChannel, setYChannel] = useState<ColorChannel>("green");
    const channels = getColorChannels(colorSpace);

    return (
      <div className="tds-stack tds-flex-gap-lg">
        <div className="color-area-story-selects">
          {optionSelect("Color Space", colorSpace, SPACES, (space) => {
            const [x, y] = getColorChannels(space);
            setColorSpace(space);
            setXChannel(x);
            setYChannel(y);
          })}
          {optionSelect("X Axis", xChannel, channels, (x) => {
            setXChannel(x);
            if (x === yChannel) {
              setYChannel(
                channels.find((channel) => channel !== x) ?? yChannel
              );
            }
          })}
          {optionSelect(
            "Y Axis",
            yChannel,
            channels.filter((channel) => channel !== xChannel),
            setYChannel
          )}
        </div>
        <ColorArea
          {...args}
          colorSpace={colorSpace}
          xChannel={xChannel}
          yChannel={yChannel}
          value={color}
          onChange={setColor}
        />
        <div className="tds-cluster tds-flex-gap-sm tds-items-center">
          <ColorSwatch color={color} size="sm" />
          {color.toString("hex")}
        </div>
      </div>
    );
  }
};
