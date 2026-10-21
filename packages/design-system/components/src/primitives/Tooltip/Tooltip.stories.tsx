import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info } from "lucide-react";
import { Button } from "../Button";
import { Tooltip, TooltipTrigger } from ".";

const meta = {
  title: "Example/Tooltip/Default",
  component: Tooltip,
  args: {
    content: "Zoom in one level",
    delay: 0,
    showArrow: true,
    isInverse: false,
    children: <Button>Zoom in</Button>
  },
  argTypes: { children: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ padding: 64 }}>
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutArrow: Story = { args: { showArrow: false } };

export const Inverse: Story = { args: { isInverse: true } };

// Content that isn't a button, made focusable to show a tooltip
export const CustomTrigger: Story = {
  args: {
    content: "Data from the 2021 census",
    children: (
      <TooltipTrigger aria-label="About this layer">
        <Info size={16} />
      </TooltipTrigger>
    )
  }
};

export const LongContent: Story = {
  args: {
    content:
      "Population density per square kilometre, from the 2021 census, aggregated to statistical area level 2",
    children: <Button>Hover me</Button>
  }
};

// Every placement, held open to compare with the design. The arrow points at
// the trigger, so with an icon trigger start and end move it to the tooltip's ends
export const Placements: Story = {
  args: { isOpen: true, content: "I am a tooltip" },
  argTypes: { isOpen: { control: false } },
  render: (args) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, max-content)",
        gap: "64px 160px",
        padding: 48
      }}
    >
      {(
        [
          "top start",
          "top",
          "top end",
          "bottom start",
          "bottom",
          "bottom end",
          "left top",
          "left",
          "left bottom",
          "right top",
          "right",
          "right bottom"
        ] as const
      ).map((placement, index) => (
        <Tooltip
          key={placement}
          {...args}
          placement={placement}
          isInverse={index % 2 === 1}
        >
          <Button
            variant="tertiary"
            size="sm"
            isIconOnly
            aria-label={placement}
          >
            <Info size={16} />
          </Button>
        </Tooltip>
      ))}
    </div>
  )
};
