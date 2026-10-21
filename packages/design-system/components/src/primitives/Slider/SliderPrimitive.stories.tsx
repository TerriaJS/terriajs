import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../Field";
import { SliderPrimitive } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Slider/Primitive",
  component: SliderPrimitive,
  parameters: figmaDesign("Slider"),
  args: { defaultValue: 30 },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 200 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof SliderPrimitive>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <SliderPrimitive {...args}>
      <Label>Opacity</Label>
      <SliderPrimitive.Output />
      <SliderPrimitive.Track>
        <SliderPrimitive.Fill />
        <SliderPrimitive.Thumb />
      </SliderPrimitive.Track>
    </SliderPrimitive>
  )
};

export const CustomOutput: Story = {
  render: (args) => (
    <SliderPrimitive {...args}>
      <Label>Opacity</Label>
      <SliderPrimitive.Output>
        {({ state }) => `${String(state.values[0])} of 100`}
      </SliderPrimitive.Output>
      <SliderPrimitive.Track>
        <SliderPrimitive.Fill />
        <SliderPrimitive.Thumb />
      </SliderPrimitive.Track>
    </SliderPrimitive>
  )
};

// Ticks sit above the fill and below the thumbs; marks label values under the track
export const WithTicks: Story = {
  args: { step: 10 },
  render: (args) => (
    <SliderPrimitive {...args}>
      <Label>Opacity</Label>
      <SliderPrimitive.Output />
      <SliderPrimitive.Track>
        <SliderPrimitive.Fill />
        <SliderPrimitive.Ticks />
        <SliderPrimitive.Thumb />
      </SliderPrimitive.Track>
      <SliderPrimitive.Marks marks={[0, 50, 100]} />
    </SliderPrimitive>
  )
};

// The fill grows from the offset, here the middle, towards the thumb. Ticks
// take the same offset to know which they sit under
export const FillFromCentre: Story = {
  args: { defaultValue: 20, minValue: -50, maxValue: 50, step: 10 },
  render: (args) => (
    <SliderPrimitive {...args}>
      <Label>Exaggeration</Label>
      <SliderPrimitive.Output />
      <SliderPrimitive.Track>
        <SliderPrimitive.Fill offset={0} />
        <SliderPrimitive.Ticks fillOffset={0} />
        <SliderPrimitive.Thumb />
      </SliderPrimitive.Track>
    </SliderPrimitive>
  )
};
