import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ReactNode } from "react";
import { UNSAFE_PortalProvider } from "react-aria/PortalProvider";
import { hover, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import { Drawer, type DrawerBackdropVariant, type DrawerPlacement } from "..";
import "../drawer.stories.css";

// Done animating in: no data-entering left, every animation finished, and
// two frames drawn since, so nothing is caught on a layer of its own
const settled = async (): Promise<void> => {
  await expect.poll(() => document.querySelector("[data-entering]")).toBeNull();
  await Promise.all(
    document.getAnimations().map((animation) => animation.finished)
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

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

// The visual setup lays out each div in the body as a test's container, which
// would also catch the backdrop, rendered straight into the body: it would
// lose its layout and the drawer its edge. So it renders into the test's
// container instead; it's fixed to the viewport all the same
const inContainer = ({
  children
}: {
  children: ReactNode;
}): React.ReactElement => (
  <UNSAFE_PortalProvider
    getContainer={() =>
      document.querySelector<HTMLElement>(
        "body > div:not([data-react-aria-top-layer], [data-live-announcer])"
      )
    }
  >
    {children}
  </UNSAFE_PortalProvider>
);

// Opened from its trigger, done sliding in
const open = async (): Promise<void> => {
  await userEvent.click(page.getByRole("button", { name: "Layer details" }));
  await expect.element(page.getByRole("dialog")).toBeVisible();
  await settled();
};

const drawer = ({
  placement = "bottom",
  variant,
  body = "Population counts by suburb from the 2021 census, coloured by density. Change the year or the measure in the layer's settings."
}: {
  placement?: DrawerPlacement;
  variant?: DrawerBackdropVariant;
  body?: ReactNode;
} = {}): React.ReactElement =>
  inContainer({
    children: (
      <Drawer>
        <Button variant="secondary">Layer details</Button>
        <Drawer.Backdrop variant={variant}>
          <Drawer.Content placement={placement}>
            <Drawer.Dialog>
              <Drawer.CloseTrigger />
              {(placement === "bottom" || placement === "top") && (
                <Drawer.Handle />
              )}
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
    )
  });

describe("Drawer", () => {
  it.each(PLACEMENTS)("placed %s", async (placement) => {
    await render(drawer({ placement }));
    await open();
    await snap(viewport());
  });

  it.each(BACKDROPS)("backdrop %s", async (variant) => {
    await render(drawer({ placement: "right", variant }));
    await open();
    await snap(viewport());
  });

  it("close button hovered", async () => {
    await render(drawer());
    await open();
    await hover(page.getByRole("button", { name: /close/i }));
    await snap(viewport());
  });

  it("close button focused", async () => {
    await render(drawer());
    await open();
    await userEvent.tab();
    await expect
      .element(page.getByRole("button", { name: /close/i }))
      .toHaveFocus();
    await snap(viewport());
  });

  it("scrolling body", async () => {
    await render(
      drawer({
        placement: "right",
        body: (
          <ul className="drawer-stories-list">
            {[...LAYERS, ...LAYERS].map((layer, index) => (
              <li key={`${layer}-${String(index)}`}>{layer}</li>
            ))}
          </ul>
        )
      })
    );
    await open();
    await snap(viewport());
  });
});
