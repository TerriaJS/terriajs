import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../Field";
import {
  Meter,
  MeterFill,
  MeterOutput,
  MeterTrack,
  type MeterColor,
  type MeterProps,
  type MeterSize
} from ".";
import { figmaDesign } from "../../figma";
import "./meter.stories.css";

const meta = {
  title: "Example/Meter",
  component: Meter,
  parameters: {
    ...figmaDesign("Meter"),
    docs: {
      description: {
        component:
          "Shows an amount within a known range, such as storage used, a layer's opacity, or how much of an area a dataset covers. Its value is a measurement that can go up or down, not progress towards finishing something; for a task's progress, such as an upload or a layer loading, use a ProgressBar. A Label names it and its Output shows the value, as a percentage or in its own words."
      }
    }
  },
  subcomponents: { MeterOutput, MeterTrack, MeterFill },
  args: { value: 60, minValue: 0, maxValue: 100, color: "accent", size: "md" },
  argTypes: {
    value: { control: "number" },
    minValue: { control: "number" },
    maxValue: { control: "number" },
    // A few Intl.NumberFormat options to pick from; percent is the default
    formatOptions: {
      control: "select",
      options: ["percent", "decimal", "gigabytes", "currency"],
      mapping: {
        percent: { style: "percent" },
        decimal: { style: "decimal" },
        gigabytes: { style: "unit", unit: "gigabyte" },
        currency: { style: "currency", currency: "AUD" }
      }
    },
    valueLabel: { control: "text" },
    color: {
      control: "inline-radio",
      options: ["accent", "default", "success", "warning", "danger"]
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] }
  },
  decorators: [
    (Story) => (
      <div className="meter-stories-stack">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

// A labelled meter with its value. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const storage = (props: MeterProps, key?: string): React.ReactElement => (
  <Meter key={key} {...props}>
    <Label>Storage</Label>
    <Meter.Output />
    <Meter.Track>
      <Meter.Fill />
    </Meter.Track>
  </Meter>
);

/** A Label names it and its Output shows the value. Controls set the range,
 * how the value is formatted (formatOptions), or text to show instead of it
 * (valueLabel) */
export const Default: Story = {
  render: (args) => storage(args)
};

export const Sizes: Story = {
  render: (args) => (
    <>
      {(["sm", "md", "lg"] as MeterSize[]).map((size) =>
        storage({ ...args, size }, size)
      )}
    </>
  )
};

export const Colors: Story = {
  render: (args) => (
    <>
      {(
        ["accent", "default", "success", "warning", "danger"] as MeterColor[]
      ).map((color) => storage({ ...args, color }, color))}
    </>
  )
};

/** The value in its own words: valueLabel replaces the percentage. Here it
 * follows the value and maxValue controls */
export const CustomValue: Story = {
  args: { value: 6.2, maxValue: 10 },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 10, step: 0.1 } },
    maxValue: { control: { type: "number", min: 1 } },
    valueLabel: { control: false }
  },
  render: ({ value = 0, maxValue = 100, ...args }) =>
    storage({
      ...args,
      value,
      maxValue,
      valueLabel: `${String(value)} of ${String(maxValue)} GB`
    })
};

/** Without a visible label it needs an aria-label */
export const WithoutLabel: Story = {
  args: { "aria-label": "Storage used", value: 45 },
  render: (args) => (
    <Meter {...args}>
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  )
};
