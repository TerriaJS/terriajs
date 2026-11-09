import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScrollShadow, type ScrollShadowProps } from ".";
import { Chip } from "../Chip";
import { Surface } from "../Surface";
import { figmaDesign } from "../../figma";
import "./scroll-shadow.stories.css";

const LAYERS = [
  "Suburbs 2021",
  "Population density",
  "Median household income",
  "Bushfire-prone land",
  "Flood planning area",
  "Heritage items",
  "Public transport stops",
  "Bike paths",
  "Schools",
  "Hospitals",
  "Parks and reserves",
  "Land zoning"
];

const meta = {
  title: "Example/ScrollShadow",
  component: ScrollShadow,
  parameters: {
    ...figmaDesign("ScrollShadow"),
    docs: {
      description: {
        component:
          "A scrolling area whose ends fade, or blur, where there's more to scroll to. When nothing inside it can take focus, such as a list of text, give it tabIndex={0} so it can be scrolled from the keyboard too; leave it out when its content has links, buttons or fields, which keyboard users tab to and the area scrolls to show."
      }
    }
  },
  args: {
    orientation: "vertical",
    variant: "fade",
    size: 40,
    offset: 0,
    hideScrollBar: false,
    visibility: "auto",
    isEnabled: true
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"]
    },
    variant: { control: "inline-radio", options: ["fade", "blur"] },
    size: { control: { type: "range", min: 0, max: 80, step: 4 } },
    offset: { control: { type: "range", min: 0, max: 80, step: 4 } },
    visibility: {
      control: "select",
      options: ["auto", "both", "top", "bottom", "left", "right", "none"]
    }
  }
} satisfies Meta<typeof ScrollShadow>;

export default meta;
type Story = StoryObj<typeof meta>;

// A list of map layers, taller than its box. Called as a function, not
// rendered as a component, so a story's code shows the markup it returns.
// Focusable, so it scrolls from the keyboard too: it holds nothing that is
const layers = (props: ScrollShadowProps, key?: string): React.ReactElement => (
  <ScrollShadow
    key={key}
    className="scroll-shadow-stories-list"
    tabIndex={0}
    {...props}
  >
    {LAYERS.map((layer) => (
      <p key={layer} className="scroll-shadow-stories-item">
        {layer}
      </p>
    ))}
  </ScrollShadow>
);

/** The ends fade where there's more to scroll to: neither at first, then the
 * start too once you've scrolled */
export const Default: Story = {
  render: (args) => layers(args)
};

/** Blurs what scrolls under the ends, rather than fading it out */
export const Blur: Story = {
  args: { variant: "blur" },
  render: (args) => layers(args)
};

/** Sideways, around content wider than it */
export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <ScrollShadow
      className="scroll-shadow-stories-strip"
      tabIndex={0}
      {...args}
    >
      <div className="scroll-shadow-stories-row">
        {LAYERS.map((layer) => (
          <Chip key={layer}>{layer}</Chip>
        ))}
      </div>
    </ScrollShadow>
  )
};

/** On a surface, the blur takes the surface's tint, not the page's */
export const OnSurface: Story = {
  args: { variant: "blur" },
  render: (args) => (
    <div className="scroll-shadow-stories-side-by-side">
      {layers(args, "page")}
      <Surface className="scroll-shadow-stories-surface">
        {layers(args, "surface")}
      </Surface>
    </div>
  )
};

/** Shadows set by visibility, not the scroll: here, only the bottom */
export const Controlled: Story = {
  args: { visibility: "bottom" },
  render: (args) => layers(args)
};

/** Without a scrollbar, the fades alone show there's more */
export const HiddenScrollBar: Story = {
  args: { hideScrollBar: true },
  render: (args) => layers(args)
};
