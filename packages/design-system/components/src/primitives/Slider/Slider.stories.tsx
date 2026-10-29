import type { Meta, StoryObj } from "@storybook/react-vite";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { Slider } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Slider/Default",
  component: Slider,
  parameters: figmaDesign("Slider"),
  args: { label: "Opacity", defaultValue: 30, showValue: true },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 200 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: { label: "Price", defaultValue: [20, 60, 90] }
};

export const Disabled: Story = {
  parameters: {
    // Text in a disabled field has no contrast requirement (WCAG 1.4.3);
    // axe only knows that for labels, not descriptions or values
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } }
  },
  args: { label: "Price", defaultValue: [20, 60], isDisabled: true }
};

export const WithoutValue: Story = { args: { showValue: false } };

export const Percent: Story = {
  args: {
    defaultValue: 0.3,
    minValue: 0,
    maxValue: 1,
    step: 0.01,
    formatOptions: { style: "percent" }
  }
};

// As in the design: a tick for each step, lighter under the fill
export const Ticks: Story = {
  args: { label: "Price", defaultValue: [20, 60], step: 10, showSteps: true }
};

// As in the design: values labelled under the track, in the slider's format
export const Marks: Story = {
  args: {
    label: "Opacity",
    defaultValue: 0.5,
    maxValue: 1,
    step: 0.1,
    formatOptions: { style: "percent" },
    showSteps: true,
    marks: [0.2, 0.5, 0.8]
  }
};

export const MarkLabels: Story = {
  args: {
    label: "Zoom",
    defaultValue: 12,
    minValue: 0,
    maxValue: 20,
    marks: [
      { value: 2, label: "World" },
      { value: 10, label: "City" },
      { value: 18, label: "Street" }
    ]
  }
};

// Each thumb shows its value while hovered, dragged or focused
export const WithTooltip: Story = {
  args: {
    label: "Price",
    defaultValue: [20, 60],
    step: 10,
    showSteps: true,
    showTooltip: true,
    formatOptions: {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0
    }
  }
};

// A function decides each thumb's tooltip from its index and value
export const CustomTooltip: Story = {
  args: {
    label: "Year",
    defaultValue: [1990, 2020],
    minValue: 1950,
    maxValue: 2025,
    showTooltip: ({ index, value }) =>
      `${index === 0 ? "From" : "To"} ${String(value)}`
  }
};

export const Steps: Story = {
  args: {
    label: "Zoom level",
    defaultValue: 4,
    minValue: 1,
    maxValue: 10,
    showSteps: true
  }
};

export const Extremes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 16 }}>
      <Slider {...args} label="Minimum" defaultValue={0} />
      <Slider {...args} label="Maximum" defaultValue={100} />
      <Slider {...args} label="Full range" defaultValue={[0, 100]} />
    </div>
  )
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    step: 10,
    showSteps: true,
    marks: [0, 50, 100]
  },
  decorators: [
    (Story) => (
      <div style={{ blockSize: 200 }}>
        <Story />
      </div>
    )
  ]
};

// React Aria takes the direction from the locale, the page from dir
export const RightToLeft: Story = {
  args: {
    label: "Price",
    defaultValue: [20, 60],
    step: 10,
    showSteps: true,
    marks: [20, 50, 80]
  },
  decorators: [
    (Story) => (
      <I18nProvider locale="he-IL">
        <div dir="rtl">
          <Story />
        </div>
      </I18nProvider>
    )
  ]
};
