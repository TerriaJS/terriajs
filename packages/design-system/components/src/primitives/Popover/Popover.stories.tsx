import type { Meta, StoryObj } from "@storybook/react-vite";

import { Info, Settings2 } from "lucide-react";
import { Button } from "../Button";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverTrigger
} from ".";
import { figmaDesign } from "../../figma";

const meta = {
  title: "Example/Popover",
  component: Popover,
  parameters: figmaDesign("Popover"),
  subcomponents: {
    PopoverTrigger,
    PopoverContent,
    PopoverDialog,
    PopoverArrow,
    PopoverHeading
  },
  // Each story renders its own content; this only satisfies the required arg
  args: { children: null }
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const placements = ["top", "bottom", "left", "right"] as const;

const textStyle = { margin: 0, marginBlockStart: 4 } as const;

export const WithArrow: Story = {
  render: (args) => (
    <Popover {...args}>
      <Button isIconOnly aria-label="Map settings">
        <Settings2 size={20} />
      </Button>
      <Popover.Content>
        <Popover.Dialog>
          <Popover.Arrow />
          <Popover.Heading>Map settings</Popover.Heading>
          <p style={textStyle}>The arrow points at the trigger.</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
};

export const WithoutArrow: Story = {
  render: (args) => (
    <Popover {...args}>
      <Button isIconOnly aria-label="Map settings">
        <Settings2 size={20} />
      </Button>
      <Popover.Content>
        <Popover.Dialog>
          <Popover.Heading>Map settings</Popover.Heading>
          <p style={textStyle}>Leave out Popover.Arrow for a plain panel.</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
};

export const Placement: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: 24, padding: 64 }}>
      {[true, false].map((hasArrow) => (
        <div key={String(hasArrow)} style={{ display: "flex", gap: 12 }}>
          {placements.map((placement) => (
            <Popover key={placement} {...args}>
              <Button variant="secondary">
                {placement}
                {hasArrow ? "" : " (no arrow)"}
              </Button>
              <Popover.Content placement={placement}>
                <Popover.Dialog aria-label={`Placed ${placement}`}>
                  {hasArrow ? <Popover.Arrow /> : null}
                  Placed {placement}
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          ))}
        </div>
      ))}
    </div>
  )
};

export const InteractiveContent: Story = {
  render: (args) => (
    <Popover {...args}>
      <Button variant="danger-soft">Remove layer</Button>
      <Popover.Content>
        <Popover.Dialog style={{ maxInlineSize: 280 }}>
          {({ close }) => (
            <>
              <Popover.Arrow />
              <Popover.Heading>Remove Suburbs 2021?</Popover.Heading>
              <p style={textStyle}>
                The layer is removed from the workbench and the map.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginBlockStart: 12
                }}
              >
                <Button slot="close" size="sm" variant="ghost">
                  Cancel
                </Button>
                <Button size="sm" variant="danger" onPress={close}>
                  Remove
                </Button>
              </div>
            </>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
};

export const CustomTrigger: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Trigger aria-label="Layer info">
        <Info size={20} />
      </Popover.Trigger>
      <Popover.Content>
        <Popover.Dialog>
          <Popover.Arrow />
          <Popover.Heading>Layer info</Popover.Heading>
          <p style={textStyle}>
            Any content can open a popover through Popover.Trigger.
          </p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
};
