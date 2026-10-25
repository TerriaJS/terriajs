import type { Meta, StoryObj } from "@storybook/react-vite";
import { ColorSwatch } from ".";
import { figmaDesign } from "../../figma";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const SHAPES = ["circle", "square"] as const;

const meta = {
  title: "Example/Color/ColorSwatch",
  component: ColorSwatch,
  parameters: figmaDesign("ColorSwatch"),
  args: { color: "#3b82f6", shape: "circle", size: "md" },
  // Its props are React Aria's, which the docs don't list, so the controls
  // are listed here
  argTypes: {
    color: {
      control: "color",
      description: "The colour shown, as a string or a Color",
      table: { type: { summary: "string | Color" } }
    },
    colorName: {
      control: "text",
      description:
        "Names the colour for screen readers, instead of a description such as “vibrant blue”",
      table: { type: { summary: "string" } }
    },
    shape: { control: "inline-radio", options: SHAPES },
    size: { control: "inline-radio", options: SIZES }
  }
} satisfies Meta<typeof ColorSwatch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every size, round and square */
export const Sizes: Story = {
  render: (args) => (
    <div className="tds-stack tds-flex-gap-md">
      {SHAPES.map((shape) => (
        <div
          key={shape}
          className="tds-cluster tds-flex-gap-md tds-items-center"
        >
          {SIZES.map((size) => (
            <ColorSwatch key={size} {...args} shape={shape} size={size} />
          ))}
        </div>
      ))}
    </div>
  )
};

/** A transparent colour shows over a checkerboard */
export const Transparent: Story = {
  args: { color: "rgba(59, 130, 246, 0.4)", size: "xl" }
};

/** Swatches of different colours, each named for it unless colorName names
 * it otherwise, as for a layer's legend */
export const Colors: Story = {
  render: (args) => (
    <div className="tds-cluster tds-flex-gap-sm">
      <ColorSwatch {...args} color="#ef4444" colorName="Bushfire" />
      <ColorSwatch {...args} color="#f59e0b" colorName="Drought" />
      <ColorSwatch {...args} color="#10b981" colorName="Vegetation" />
      <ColorSwatch {...args} color="#3b82f6" colorName="Rivers" />
      <ColorSwatch {...args} color="#8b5cf6" colorName="Suburbs" />
      <ColorSwatch {...args} color="rgba(17, 24, 39, 0.5)" colorName="Shade" />
    </div>
  )
};
