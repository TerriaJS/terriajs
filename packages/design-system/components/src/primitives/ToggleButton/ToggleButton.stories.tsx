import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  EyeClosedIcon,
  EyeIcon,
  StackFrontIcon
} from "@terria/design-system-icons";
import { ToggleButton } from ".";
import { figmaDesign } from "../../figma";
import "./toggle-button.stories.css";

const meta = {
  title: "Example/ToggleButton",
  component: ToggleButton,
  parameters: figmaDesign("ToggleButton"),
  args: { variant: "default", size: "md" },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "ghost"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] }
  }
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ToggleButton {...args}>
      <StackFrontIcon />
      Layers
    </ToggleButton>
  )
};

// Filled, or transparent until it's on; on, both are the soft accent
export const Variants: Story = {
  render: (args) => (
    <div className="toggle-stories-row">
      <ToggleButton {...args} variant="default">
        Default
      </ToggleButton>
      <ToggleButton {...args} variant="default" defaultSelected>
        Default, on
      </ToggleButton>
      <ToggleButton {...args} variant="ghost">
        Ghost
      </ToggleButton>
      <ToggleButton {...args} variant="ghost" defaultSelected>
        Ghost, on
      </ToggleButton>
    </div>
  )
};

export const Sizes: Story = {
  render: (args) => (
    <div className="toggle-stories-row">
      {(["sm", "md", "lg"] as const).map((size) => (
        <ToggleButton key={size} {...args} size={size}>
          <StackFrontIcon />
          {size}
        </ToggleButton>
      ))}
    </div>
  )
};

// Square, so it needs an aria-label
export const IconOnly: Story = {
  render: (args) => (
    <div className="toggle-stories-row">
      <ToggleButton {...args} isIconOnly aria-label="Layers">
        <StackFrontIcon />
      </ToggleButton>
      <ToggleButton {...args} isIconOnly aria-label="Layers" defaultSelected>
        <StackFrontIcon />
      </ToggleButton>
    </div>
  )
};

// The render prop's isSelected swaps the icon and label as it turns on
export const ChangingContent: Story = {
  render: (args) => (
    <ToggleButton {...args}>
      {({ isSelected }) => (
        <>
          {isSelected ? <EyeIcon /> : <EyeClosedIcon />}
          {isSelected ? "Labels shown" : "Labels hidden"}
        </>
      )}
    </ToggleButton>
  )
};

export const Disabled: Story = {
  render: (args) => (
    <div className="toggle-stories-row">
      <ToggleButton {...args} isDisabled>
        Off
      </ToggleButton>
      <ToggleButton {...args} isDisabled defaultSelected>
        On
      </ToggleButton>
    </div>
  )
};
