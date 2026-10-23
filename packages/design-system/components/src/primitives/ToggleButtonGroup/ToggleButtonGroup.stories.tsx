import type { Meta, StoryObj } from "@storybook/react-vite";
import { LineIcon, PolygonIcon, ShapeIcon } from "@terria/design-system-icons";
import { ToggleButton } from "../ToggleButton";
import { ToggleButtonGroup } from ".";
import { figmaDesign } from "../../figma";
import "../ToggleButton/toggle-button.stories.css";

const meta = {
  title: "Example/ToggleButtonGroup",
  component: ToggleButtonGroup,
  parameters: figmaDesign("ToggleButtonGroup"),
  args: { "aria-label": "Map view", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"]
    },
    selectionMode: { control: "inline-radio", options: ["single", "multiple"] }
  }
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

// A separator in each button but the first divides joined buttons
const views = (
  <>
    <ToggleButton id="2d">2D</ToggleButton>
    <ToggleButton id="3d">
      <ToggleButtonGroup.Separator />
      3D
    </ToggleButton>
    <ToggleButton id="3d-smooth">
      <ToggleButtonGroup.Separator />
      3D smooth
    </ToggleButton>
  </>
);

// One on at a time, as a radio group; disallowEmptySelection keeps one on
export const Default: Story = {
  args: { defaultSelectedKeys: ["2d"], disallowEmptySelection: true },
  render: (args) => <ToggleButtonGroup {...args}>{views}</ToggleButtonGroup>
};

// Several on at once, each a toggle button
export const Multiple: Story = {
  args: {
    "aria-label": "Drawing tools",
    selectionMode: "multiple",
    defaultSelectedKeys: ["line"]
  },
  render: (args) => (
    <ToggleButtonGroup {...args}>
      <ToggleButton id="line" isIconOnly aria-label="Line">
        <LineIcon />
      </ToggleButton>
      <ToggleButton id="polygon" isIconOnly aria-label="Polygon">
        <ToggleButtonGroup.Separator />
        <PolygonIcon />
      </ToggleButton>
      <ToggleButton id="shape" isIconOnly aria-label="Shape">
        <ToggleButtonGroup.Separator />
        <ShapeIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  )
};

// Spaced apart and each rounded; the separators hide
export const Detached: Story = {
  args: { isDetached: true, defaultSelectedKeys: ["2d"] },
  render: (args) => <ToggleButtonGroup {...args}>{views}</ToggleButtonGroup>
};

export const Vertical: Story = {
  args: { orientation: "vertical", defaultSelectedKeys: ["2d"] },
  render: (args) => <ToggleButtonGroup {...args}>{views}</ToggleButtonGroup>
};

// The buttons share the width
export const FullWidth: Story = {
  args: { fullWidth: true, defaultSelectedKeys: ["2d"] },
  render: (args) => (
    <div className="toggle-stories-fill">
      <ToggleButtonGroup {...args}>{views}</ToggleButtonGroup>
    </div>
  )
};

export const Sizes: Story = {
  args: { defaultSelectedKeys: ["2d"] },
  render: (args) => (
    <div className="toggle-stories-stack">
      {(["sm", "md", "lg"] as const).map((size) => (
        <ToggleButtonGroup key={size} {...args} size={size}>
          {views}
        </ToggleButtonGroup>
      ))}
    </div>
  )
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultSelectedKeys: ["2d"] },
  render: (args) => <ToggleButtonGroup {...args}>{views}</ToggleButtonGroup>
};
