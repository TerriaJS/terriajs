import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DotsIcon,
  LineIcon,
  MinusIcon,
  PlusIcon,
  PolygonIcon,
  RulerMeasureIcon,
  ShapeIcon
} from "@terria/design-system-icons";
import { Button, type ButtonVariant } from "../Button";
import { Popover } from "../Popover";
import { ButtonGroup, ButtonGroupSeparator } from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/ButtonGroup",
  component: ButtonGroup,
  parameters: figmaDesign("ButtonGroup"),
  subcomponents: { ButtonGroupSeparator },
  // Each story renders its own buttons; this only satisfies the required arg
  args: { "aria-label": "Map tools", children: null, variant: "secondary" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "secondary",
        "tertiary",
        "outline",
        "ghost",
        "danger",
        "danger-soft"
      ]
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"]
    }
  }
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button>Day</Button>
      <Button>Week</Button>
      <Button>Month</Button>
    </ButtonGroup>
  )
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
      {(
        [
          "primary",
          "secondary",
          "tertiary",
          "outline",
          "ghost"
        ] as ButtonVariant[]
      ).map((variant) => (
        <ButtonGroup key={variant} {...args} variant={variant}>
          <Button>Day</Button>
          <Button>Week</Button>
          <Button>Month</Button>
        </ButtonGroup>
      ))}
    </div>
  )
};

// Icon buttons with separators, as a map toolbar
export const IconToolbar: Story = {
  args: { "aria-label": "Drawing tools" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button isIconOnly aria-label="Draw a line">
        <LineIcon size={16} />
      </Button>
      <Button isIconOnly aria-label="Draw a polygon">
        <ButtonGroup.Separator />
        <PolygonIcon size={16} />
      </Button>
      <Button isIconOnly aria-label="Draw a shape">
        <ButtonGroup.Separator />
        <ShapeIcon size={16} />
      </Button>
    </ButtonGroup>
  )
};

export const Vertical: Story = {
  args: { orientation: "vertical", "aria-label": "Zoom" },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button isIconOnly aria-label="Zoom in">
        <PlusIcon size={16} />
      </Button>
      <Button isIconOnly aria-label="Zoom out">
        <ButtonGroup.Separator />
        <MinusIcon size={16} />
      </Button>
    </ButtonGroup>
  )
};

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: 320 }}>
        <Story />
      </div>
    )
  ],
  render: Default.render
};

export const Disabled: Story = {
  args: { isDisabled: true },
  render: Default.render
};

// Buttons inside the popover keep their own style, not the group's
export const WithPopover: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button>Zoom to</Button>
      <Button>Share</Button>
      <Popover>
        <Button isIconOnly aria-label="More tools">
          <DotsIcon size={16} />
        </Button>
        <Popover.Content>
          <Popover.Dialog aria-label="More tools">
            <Button size="sm">
              <RulerMeasureIcon size={16} />
              Measure
            </Button>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </ButtonGroup>
  )
};
