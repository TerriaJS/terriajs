import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../Field";
import {
  ProgressBar,
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarTrack,
  type ProgressBarColor,
  type ProgressBarProps,
  type ProgressBarSize
} from ".";
import { figmaDesign } from "../../figma";
import "./progress-bar.stories.css";

const meta = {
  title: "Example/ProgressBar",
  component: ProgressBar,
  parameters: figmaDesign("ProgressBar"),
  subcomponents: { ProgressBarOutput, ProgressBarTrack, ProgressBarFill },
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
      <div className="progress-bar-stories-stack">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// A labelled bar with its value. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const storage = (props: ProgressBarProps, key?: string): React.ReactElement => (
  <ProgressBar key={key} {...props}>
    <Label>Storage</Label>
    <ProgressBar.Output />
    <ProgressBar.Track>
      <ProgressBar.Fill />
    </ProgressBar.Track>
  </ProgressBar>
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
      {(["sm", "md", "lg"] as ProgressBarSize[]).map((size) =>
        storage({ ...args, size }, size)
      )}
    </>
  )
};

export const Colors: Story = {
  render: (args) => (
    <>
      {(
        [
          "accent",
          "default",
          "success",
          "warning",
          "danger"
        ] as ProgressBarColor[]
      ).map((color) => storage({ ...args, color }, color))}
    </>
  )
};

/** While the amount isn't known: a part of the track slides along it */
export const Indeterminate: Story = {
  args: { isIndeterminate: true },
  render: (args) => (
    <ProgressBar {...args}>
      <Label>Loading layers</Label>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  )
};

/** Without a visible label it needs an aria-label */
export const TrackOnly: Story = {
  args: { "aria-label": "Upload progress" },
  render: (args) => (
    <ProgressBar {...args}>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
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
