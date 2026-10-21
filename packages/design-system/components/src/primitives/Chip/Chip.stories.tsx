import type { Meta, StoryObj } from "@storybook/react-vite";
import { Circle, Layers } from "lucide-react";
import { Chip } from ".";
import { figmaDesign } from "../../figma";

const COLORS = ["accent", "default", "success", "warning", "danger"] as const;
const VARIANTS = ["primary", "secondary", "tertiary", "soft"] as const;
const SIZES = ["lg", "md", "sm"] as const;

const meta = {
  title: "Example/Chip",
  component: Chip,
  parameters: figmaDesign("Chip"),
  args: {
    children: "Satellite",
    color: "default",
    variant: "secondary",
    size: "md"
  },
  argTypes: {
    color: { control: "inline-radio", options: COLORS },
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES }
  }
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: { color: "accent", variant: "soft" },
  render: (args) => (
    <Chip {...args}>
      <Layers />
      <Chip.Label>3 layers</Chip.Label>
    </Chip>
  )
};

// Next to text, like a count beside a heading or list item, centred on it
export const NextToText: Story = {
  args: { size: "sm" },
  render: (args) => (
    <div style={{ display: "grid", gap: 16, inlineSize: 240 }}>
      <h3 style={{ margin: 0 }}>
        Projects <Chip {...args}>12</Chip>
      </h3>
      <ul
        style={{
          display: "grid",
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: "none"
        }}
      >
        {[
          ["Bushfire risk", 4],
          ["Flood mapping", 7],
          ["Coastal erosion", 1]
        ].map(([name, count]) => (
          <li
            key={name}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            {name}
            <Chip {...args}>{count}</Chip>
          </li>
        ))}
      </ul>
      <p style={{ margin: 0 }}>
        Showing{" "}
        <Chip {...args} variant="soft" color="accent">
          3
        </Chip>{" "}
        of 12 projects
      </p>
    </div>
  )
};

// Every variant, colour and size, as laid out in the design
export const All: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, max-content)",
        gap: "16px 48px",
        alignItems: "center",
        justifyItems: "start"
      }}
    >
      {SIZES.flatMap((size) =>
        VARIANTS.flatMap((variant) =>
          COLORS.map((color) => (
            <Chip
              key={`${size}-${variant}-${color}`}
              color={color}
              variant={variant}
              size={size}
            >
              <Circle />
              <Chip.Label>Label</Chip.Label>
              <Circle />
            </Chip>
          ))
        )
      )}
    </div>
  )
};
