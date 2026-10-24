import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleDashedIcon, StackFrontIcon } from "@terria/design-system-icons";
import { Button } from "../Button";
import { Badge } from ".";
import { figmaDesign } from "../../figma";

const COLORS = ["accent", "default", "success", "warning", "danger"] as const;
const VARIANTS = ["primary", "secondary", "soft"] as const;
const SIZES = ["lg", "md", "sm"] as const;

// Something for a badge to sit on
const Swatch = (): React.ReactElement => (
  <span
    style={{
      display: "block",
      inlineSize: 40,
      blockSize: 40,
      borderRadius: 8,
      background: "var(--terria-ds-neutral)"
    }}
  />
);

const meta = {
  title: "Example/Badge",
  component: Badge,
  parameters: figmaDesign("Badge"),
  args: { children: "5", color: "danger", variant: "primary", size: "md" },
  argTypes: {
    color: { control: "inline-radio", options: COLORS },
    variant: { control: "inline-radio", options: VARIANTS },
    size: { control: "inline-radio", options: SIZES },
    placement: {
      control: "inline-radio",
      options: ["top-right", "top-left", "bottom-right", "bottom-left"]
    }
  }
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// On a corner of the element it describes
export const Default: Story = {
  args: { size: "sm" },
  render: (args) => (
    <Badge.Anchor>
      <Button variant="tertiary" isIconOnly aria-label="Layers">
        <StackFrontIcon size={16} />
      </Button>
      <Badge {...args} />
    </Badge.Anchor>
  )
};

export const Placements: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 32 }}>
      {(["top-right", "top-left", "bottom-right", "bottom-left"] as const).map(
        (placement) => (
          <Badge.Anchor key={placement}>
            <Swatch />
            <Badge {...args} size="sm" placement={placement} />
          </Badge.Anchor>
        )
      )}
    </div>
  )
};

// An empty small badge reads as a dot
export const Dot: Story = {
  args: { children: null, size: "sm" },
  render: Default.render
};

// Badges always sit on an anchor; this overview takes them off it to compare
// every variant, colour and size side by side, as laid out in the design
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
            <Badge
              color={color}
              variant={variant}
              size={size}
              key={`${size}-${variant}-${color}`}
            >
              <CircleDashedIcon />
              <Badge.Label>Label</Badge.Label>
              <CircleDashedIcon />
            </Badge>
          ))
        )
      )}
    </div>
  )
};
