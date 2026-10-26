import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShuffleIcon } from "@terria/design-system-icons";
import { useRef, useState } from "react";
import {
  getColorChannels,
  parseColor,
  type ColorSpace
} from "react-aria-components/ColorPicker";
import { ColorPicker } from ".";
import { Button } from "../Button";
import { ColorArea } from "../ColorArea";
import { ColorSlider } from "../ColorSlider";
import { ColorSwatch } from "../ColorSwatch";
import { ColorSwatchPicker } from "../ColorSwatchPicker";
import { Label, TextField } from "../Field";
import { InputGroup } from "../InputGroup";
import { ListBox } from "../ListBox";
import { Select } from "../Select";
import { figmaDesign } from "../../figma";
import "./color-picker.stories.css";

// The design's suggested colours
const SUGGESTED = [
  "#f43f5e",
  "#d946ef",
  "#8b5cf6",
  "#10b981",
  "#06b6d4",
  "#22c55e",
  "#84cc16",
  "#f59e0b",
  "#f97316"
];

// The suggested colours, small, as in the design. Called as a function, not
// rendered as a component, so a story's code shows the markup it returns
const suggestions = (): React.ReactElement => (
  <ColorSwatchPicker
    aria-label="Suggested colours"
    size="xs"
    className="color-picker-story-suggestions"
  >
    {SUGGESTED.map((color) => (
      <ColorSwatchPicker.Item key={color} color={color} />
    ))}
  </ColorSwatchPicker>
);

// A random, bright colour
const randomColor = (): ReturnType<typeof parseColor> =>
  parseColor(`hsb(${String(Math.round(Math.random() * 360))}, 70%, 90%)`);

// The hue slider, and a button picking a colour at random
const hueAndShuffle = (onShuffle: () => void): React.ReactElement => (
  <div className="color-picker-story-hue">
    <ColorSlider
      aria-label="Hue"
      channel="hue"
      colorSpace="hsb"
      showValue={false}
    />
    <Button
      size="sm"
      variant="tertiary"
      isIconOnly
      aria-label="Random colour"
      onPress={onShuffle}
    >
      <ShuffleIcon aria-hidden />
    </Button>
  </div>
);

const meta = {
  title: "Example/Color/ColorPicker",
  component: ColorPicker,
  parameters: figmaDesign("ColorPicker"),
  subcomponents: {
    "ColorPicker.Trigger": ColorPicker.Trigger,
    "ColorPicker.Indicator": ColorPicker.Indicator,
    "ColorPicker.Popover": ColorPicker.Popover
  },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    defaultValue: {
      control: "color",
      description: "The colour at first",
      table: { type: { summary: "string | Color" } }
    },
    onChange: {
      action: "change",
      description: "Called with the colour as it changes",
      table: { type: { summary: "(color: Color) => void" } }
    }
  },
  // The trigger is the story's own
  args: { children: null }
} satisfies Meta<typeof ColorPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As in the design: the trigger shows the colour, and the popover has the
 * suggested colours, the area, the hue slider and a button picking a colour
 * at random. Swatches, areas and sliders inside a ColorPicker show and change
 * its colour, with no value of their own */
export const Default: Story = {
  render: function Render(args) {
    const [color, setColor] = useState(() => parseColor("#e9b42f"));

    return (
      <ColorPicker {...args} value={color} onChange={setColor}>
        <ColorPicker.Trigger>
          <ColorPicker.Indicator />
          Color
        </ColorPicker.Trigger>
        <ColorPicker.Popover>
          {suggestions()}
          <ColorArea aria-label="Saturation and brightness" />
          {hueAndShuffle(() => {
            setColor(randomColor());
          })}
        </ColorPicker.Popover>
      </ColorPicker>
    );
  }
};

/** Before a colour is picked, ColorPicker.Indicator's isEmpty shows a
 * rainbow, and the trigger asks to pick one. A picker always holds a colour,
 * so whether one's been picked is the app's to keep */
export const Empty: Story = {
  render: function Render(args) {
    const [picked, setPicked] = useState(false);

    return (
      <ColorPicker
        {...args}
        defaultValue="#3b82f6"
        onChange={() => {
          setPicked(true);
        }}
      >
        <ColorPicker.Trigger>
          <ColorPicker.Indicator isEmpty={!picked} />
          {picked ? "Color" : "Pick a color"}
        </ColorPicker.Trigger>
        <ColorPicker.Popover>
          {suggestions()}
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

/** Any button with slot="trigger" opens the picker: here a Button with a
 * swatch of the colour, and an icon-only Button that's the swatch alone. A
 * ColorSwatch inside the picker shows its colour; buttons without the slot
 * stay buttons */
export const CustomTriggers: Story = {
  render: (args) => (
    <div className="tds-cluster tds-flex-gap-lg tds-items-center">
      <ColorPicker {...args} defaultValue="#10b981">
        <Button variant="secondary" slot="trigger">
          <ColorSwatch size="xs" />
          Fill colour
        </Button>
        <ColorPicker.Popover>{suggestions()}</ColorPicker.Popover>
      </ColorPicker>
      <ColorPicker {...args} defaultValue="#8b5cf6">
        <Button
          variant="tertiary"
          isIconOnly
          aria-label="Outline colour"
          slot="trigger"
        >
          <ColorSwatch size="sm" />
        </Button>
        <ColorPicker.Popover>
          {suggestions()}
          <ColorArea aria-label="Saturation and brightness" />
        </ColorPicker.Popover>
      </ColorPicker>
    </div>
  )
};

const SPACES: ColorSpace[] = ["rgb", "hsb", "hsl"];

/** As in the design's sliders: a colour space to pick, and a slider for each
 * of its channels and alpha */
export const Sliders: Story = {
  render: function Render(args) {
    const [colorSpace, setColorSpace] = useState<ColorSpace>("rgb");

    return (
      <ColorPicker {...args} defaultValue="hsla(33, 90%, 55%, 1)">
        <ColorPicker.Trigger>
          <ColorPicker.Indicator />
          Color
        </ColorPicker.Trigger>
        <ColorPicker.Popover>
          <Select
            aria-label="Color space"
            fullWidth
            value={colorSpace}
            onChange={(key) => {
              const space = SPACES.find((space) => space === key);
              if (space) setColorSpace(space);
            }}
          >
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
          {[...getColorChannels(colorSpace), "alpha" as const].map(
            (channel) => (
              <ColorSlider
                key={channel}
                label={channel.charAt(0).toUpperCase() + channel.slice(1)}
                channel={channel}
                colorSpace={colorSpace}
              />
            )
          )}
        </ColorPicker.Popover>
      </ColorPicker>
    );
  }
};

/** A colour marker inside a field opens the picker: the field's prefix is
 * ColorPicker.Trigger with a swatch, in the trigger slot, and the popover's
 * triggerRef is the field, so it opens below the whole field. The input
 * shows the colour as hex */
export const FieldMarker: Story = {
  render: function Render(args) {
    const fieldRef = useRef<HTMLDivElement>(null);
    const [color, setColor] = useState(() => parseColor("#0485f7"));

    return (
      <div className="color-picker-story-field">
        <ColorPicker {...args} value={color} onChange={setColor}>
          <TextField fullWidth isReadOnly value={color.toString("hex")}>
            <Label>Fill</Label>
            <InputGroup ref={fieldRef}>
              <InputGroup.Prefix>
                <ColorPicker.Trigger aria-label="Pick a colour">
                  <ColorSwatch size="xs" />
                </ColorPicker.Trigger>
              </InputGroup.Prefix>
              <InputGroup.Input />
            </InputGroup>
          </TextField>
          <ColorPicker.Popover triggerRef={fieldRef}>
            {suggestions()}
            <ColorArea aria-label="Saturation and brightness" />
            <ColorSlider
              aria-label="Hue"
              channel="hue"
              colorSpace="hsb"
              showValue={false}
            />
          </ColorPicker.Popover>
        </ColorPicker>
      </div>
    );
  }
};
