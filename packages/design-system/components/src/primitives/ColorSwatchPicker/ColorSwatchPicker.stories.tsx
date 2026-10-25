import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { parseColor } from "react-aria-components/ColorSwatchPicker";
import { ColorSwatchPicker } from ".";
import { figmaDesign } from "../../figma";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const SHAPES = ["circle", "square"] as const;

// The design's colours
const COLORS = [
  "#f43f5e",
  "#d946ef",
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316"
];

// The design's colours as items. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const items = (): React.ReactElement[] =>
  COLORS.map((color) => <ColorSwatchPicker.Item key={color} color={color} />);

const meta = {
  title: "Example/Color/ColorSwatchPicker",
  component: ColorSwatchPicker,
  parameters: figmaDesign("ColorSwatchPicker"),
  subcomponents: {
    "ColorSwatchPicker.Item": ColorSwatchPicker.Item,
    "ColorSwatchPicker.Swatch": ColorSwatchPicker.Swatch,
    "ColorSwatchPicker.Indicator": ColorSwatchPicker.Indicator
  },
  args: {
    "aria-label": "Layer colour",
    defaultValue: "#3b82f6",
    shape: "circle",
    size: "md"
  },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    shape: { control: "inline-radio", options: SHAPES },
    size: { control: "inline-radio", options: SIZES },
    layout: {
      control: "inline-radio",
      options: ["grid", "stack"],
      description: "A row that wraps (grid), or a column (stack)",
      table: { type: { summary: '"grid" | "stack"' } }
    },
    defaultValue: {
      control: "color",
      description: "The colour picked at first",
      table: { type: { summary: "string | Color" } }
    },
    onChange: {
      action: "change",
      description: "Called with the colour picked",
      table: { type: { summary: "(color: Color) => void" } }
    }
  },
  render: (args) => <ColorSwatchPicker {...args}>{items()}</ColorSwatchPicker>
} satisfies Meta<typeof ColorSwatchPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press a colour, or arrow to it and press Enter, to pick it. The picked one
 * shrinks inside a ring of its own colour, with a check that's dark on light
 * colours and light on dark ones */
export const Default: Story = {};

/** Every size, round and square */
export const Sizes: Story = {
  render: (args) => (
    <div className="tds-stack tds-flex-gap-lg">
      {SHAPES.flatMap((shape) =>
        SIZES.map((size) => (
          <ColorSwatchPicker
            key={`${shape}-${size}`}
            {...args}
            aria-label={`${shape} ${size}`}
            shape={shape}
            size={size}
          >
            {items()}
          </ColorSwatchPicker>
        ))
      )}
    </div>
  )
};

/** value and onChange keep the picked colour outside, here shown below */
export const Controlled: Story = {
  render: function Render(args) {
    const [color, setColor] = useState(() => parseColor("#10b981"));

    return (
      <div className="tds-stack tds-flex-gap-md">
        <ColorSwatchPicker {...args} value={color} onChange={setColor}>
          {items()}
        </ColorSwatchPicker>
        <p>Picked: {color.toString("hex")}</p>
      </div>
    );
  }
};

/** A colour can't be picked while its item is disabled */
export const DisabledItem: Story = {
  render: (args) => (
    <ColorSwatchPicker {...args}>
      {COLORS.map((color, index) => (
        <ColorSwatchPicker.Item
          key={color}
          color={color}
          isDisabled={index === 2}
        />
      ))}
    </ColorSwatchPicker>
  )
};
