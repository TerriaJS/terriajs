import type { Meta, StoryObj } from "@storybook/react-vite";
import { Surface, type SurfaceProps, type SurfaceVariant } from ".";
import { Button } from "../Button";
import { figmaDesign } from "../../figma";
import "./surface.stories.css";

const meta = {
  title: "Example/Surface",
  component: Surface,
  parameters: figmaDesign("Surface"),
  args: { variant: "default" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["default", "secondary", "tertiary", "transparent"]
    }
  }
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

// A surface holding a title, text and a button. Called as a function, not
// rendered as a component, so a story's code shows the markup it returns
const card = (props: SurfaceProps, title: string): React.ReactElement => (
  <Surface key={title} {...props}>
    <div className="surface-stories-content">
      <strong>{title}</strong>
      <p>Population counts by suburb from the 2021 census.</p>
      <Button size="sm" variant="secondary">
        Add to the map
      </Button>
    </div>
  </Surface>
);

/** A rounded background for grouped content. It has no padding of its own:
 * what it holds sets that */
export const Default: Story = {
  render: (args) => card(args, "Suburbs 2021")
};

export const Variants: Story = {
  render: (args) => (
    <div className="surface-stories-row">
      {(
        ["default", "secondary", "tertiary", "transparent"] as SurfaceVariant[]
      ).map((variant) => card({ ...args, variant }, variant))}
    </div>
  )
};

/** Over a busy background, like the map: the surface blurs what's behind it,
 * and the buttons on it don't blur again */
export const OverTheMap: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="surface-stories-map surface-stories-row">
      {(["default", "secondary", "tertiary"] as SurfaceVariant[]).map(
        (variant) => card({ ...args, variant }, variant)
      )}
    </div>
  )
};
