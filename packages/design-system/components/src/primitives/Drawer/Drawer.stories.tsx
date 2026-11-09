import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  type DrawerBackdropVariant,
  type DrawerContentProps,
  type DrawerPlacement
} from ".";
import { Button } from "../Button";
import { figmaDesign } from "../../figma";
import "./drawer.stories.css";

const PLACEMENTS: DrawerPlacement[] = ["bottom", "top", "left", "right"];
const BACKDROPS: DrawerBackdropVariant[] = ["opaque", "blur", "transparent"];

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

// The design's drawer: the close button, the handle on the edge it's dragged
// from, a heading, text and actions. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const drawer = (
  content: DrawerContentProps,
  {
    opener = "Layer details",
    variant,
    isDismissable,
    body = "Population counts by suburb from the 2021 census, coloured by density. Change the year or the measure in the layer's settings.",
    key
  }: {
    opener?: string;
    variant?: DrawerBackdropVariant;
    isDismissable?: boolean;
    body?: React.ReactNode;
    key?: string;
  } = {}
): React.ReactElement => {
  const placement = content.placement ?? "bottom";
  const handle = placement === "bottom" || placement === "top";

  return (
    <Drawer key={key}>
      <Button variant="secondary">{opener}</Button>
      <Drawer.Backdrop variant={variant} isDismissable={isDismissable}>
        <Drawer.Content {...content}>
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            {handle && <Drawer.Handle />}
            <Drawer.Header>
              <Drawer.Heading>Suburbs 2021</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>{body}</Drawer.Body>
            <Drawer.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button slot="close">Done</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
};

const meta = {
  title: "Example/Drawer",
  component: DrawerContent,
  parameters: {
    ...figmaDesign("Drawer"),
    docs: {
      description: {
        component:
          "A panel that slides in from an edge of the screen over the page, for content that belongs beside the map rather than in the way of it: a layer's details and settings, filters, or a list to pick from. It keeps the page in view behind it, unlike a Modal, which asks for an answer before anything else. From the bottom it suits phones, where it can be dragged down to close by its handle, header or footer; from the side it suits wider screens. Pressing outside it, its close button or Escape closes it too."
      }
    }
  },
  subcomponents: {
    "Drawer.Backdrop": Drawer.Backdrop,
    "Drawer.Dialog": Drawer.Dialog,
    "Drawer.CloseTrigger": Drawer.CloseTrigger,
    "Drawer.Handle": Drawer.Handle,
    "Drawer.Header": Drawer.Header,
    "Drawer.Heading": Drawer.Heading,
    "Drawer.Body": Drawer.Body,
    "Drawer.Footer": Drawer.Footer
  },
  args: { placement: "bottom" },
  argTypes: {
    placement: { control: "inline-radio", options: PLACEMENTS }
  },
  render: (args) => drawer(args)
} satisfies Meta<typeof DrawerContent>;

export default meta;
type Story = StoryObj<typeof meta>;

/** From the bottom, with a handle: drag it, the header or the footer down
 * to close it */
export const Default: Story = {};

/** From each edge: the top drawer's handle is at its bottom */
export const Placements: Story = {
  render: () => (
    <div className="drawer-stories-row">
      {PLACEMENTS.map((placement) =>
        drawer({ placement }, { opener: placement, key: placement })
      )}
    </div>
  )
};

/** The page behind dimmed, blurred, or left as it is */
export const BackdropVariants: Story = {
  render: () => (
    <div className="drawer-stories-row">
      {BACKDROPS.map((variant) =>
        drawer(
          { placement: "right" },
          { opener: variant, variant, key: variant }
        )
      )}
    </div>
  )
};

/** The body scrolls when it's taller than the drawer; the header and footer
 * stay in view */
export const ScrollingBody: Story = {
  args: { placement: "right" },
  render: (args) =>
    drawer(args, {
      opener: "All layers",
      body: (
        <ul className="drawer-stories-list">
          {[...LAYERS, ...LAYERS].map((layer, index) => (
            <li key={`${layer}-${String(index)}`}>{layer}</li>
          ))}
        </ul>
      )
    })
};

/** Closes only from its buttons: not by pressing outside or dragging it */
export const NonDismissable: Story = {
  render: (args) => drawer(args, { isDismissable: false })
};

/** Opened and closed from outside, through isOpen and onOpenChange */
export const Controlled: Story = {
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="drawer-stories-row">
        <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
          <Button variant="secondary">Layer details</Button>
          <Drawer.Backdrop>
            <Drawer.Content {...args}>
              <Drawer.Dialog>
                <Drawer.CloseTrigger />
                <Drawer.Handle />
                <Drawer.Header>
                  <Drawer.Heading>Suburbs 2021</Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body>
                  Population counts by suburb from the 2021 census.
                </Drawer.Body>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
        <span>{isOpen ? "Open" : "Closed"}</span>
      </div>
    );
  }
};
