import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { DownloadOffIcon, TrashIcon } from "@terria/design-system-icons";
import type { ReactNode } from "react";
import { UNSAFE_PortalProvider } from "react-aria/PortalProvider";
import { hover, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import {
  AlertDialog,
  type AlertDialogBackdropVariant,
  type AlertDialogPlacement,
  type AlertDialogSize
} from "..";

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

const SIZES: AlertDialogSize[] = ["xs", "sm", "md", "lg"];
const BACKDROPS: AlertDialogBackdropVariant[] = [
  "opaque",
  "blur",
  "transparent"
];
const PLACEMENTS: AlertDialogPlacement[] = ["auto", "center", "top", "bottom"];

// The visual setup lays out each div in the body as a test's container, which
// would also catch the backdrop, rendered straight into the body: it would
// lose its flex layout and the dialog its place. So it renders into the
// test's container instead; it's fixed to the viewport all the same
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

// Opened from its trigger, done animating in
const open = async (name = "Remove layer"): Promise<void> => {
  await userEvent.click(page.getByRole("button", { name }));
  await expect.element(page.getByRole("alertdialog")).toBeVisible();
  await settled();
};

const removeLayer = ({
  size,
  placement,
  backdrop
}: {
  size?: AlertDialogSize;
  placement?: AlertDialogPlacement;
  backdrop?: AlertDialogBackdropVariant;
} = {}): React.ReactElement =>
  inContainer({
    children: (
      <AlertDialog>
        <Button variant="danger">Remove layer</Button>
        <AlertDialog.Backdrop variant={backdrop}>
          <AlertDialog.Container size={size} placement={placement}>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon>
                  <TrashIcon />
                </AlertDialog.Icon>
                <AlertDialog.Heading>
                  Remove “Flood extent 2022”?
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                The layer and its styling will be removed from the map. You can
                add it again from the catalogue.
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary">
                  Cancel
                </Button>
                <Button slot="close" variant="danger">
                  Remove
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    )
  });

describe("AlertDialog", () => {
  it("open", async () => {
    await render(removeLayer());
    await open();
    await snap(viewport());
  });

  it("close button hovered", async () => {
    await render(removeLayer());
    await open();
    await hover(page.getByRole("button", { name: /close/i }));
    await snap(viewport());
  });

  it("close button focused", async () => {
    await render(removeLayer());
    await open();
    await userEvent.tab();
    await expect
      .element(page.getByRole("button", { name: /close/i }))
      .toHaveFocus();
    await snap(viewport());
  });

  it("danger action hovered", async () => {
    await render(removeLayer());
    await open();
    await hover(page.getByRole("button", { name: "Remove", exact: true }));
    await snap(viewport());
  });

  it.each(SIZES)("size %s", async (size) => {
    await render(removeLayer({ size }));
    await open();
    await snap(viewport());
  });

  it.each(BACKDROPS)("backdrop %s", async (backdrop) => {
    await render(removeLayer({ backdrop }));
    await open();
    await snap(viewport());
  });

  it.each(PLACEMENTS)("placed %s", async (placement) => {
    await render(removeLayer({ placement }));
    await open();
    await snap(viewport());
  });

  it("centered header", async () => {
    await render(
      inContainer({
        children: (
          <AlertDialog>
            <Button>Go offline</Button>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.Header align="center">
                    <AlertDialog.Icon>
                      <DownloadOffIcon />
                    </AlertDialog.Icon>
                    <AlertDialog.Heading>Work offline?</AlertDialog.Heading>
                  </AlertDialog.Header>
                  <AlertDialog.Body>
                    Layers that need a connection will stop updating until you
                    are back online.
                  </AlertDialog.Body>
                  <AlertDialog.Footer>
                    <Button slot="close" variant="tertiary">
                      Stay online
                    </Button>
                    <Button slot="close">Go offline</Button>
                  </AlertDialog.Footer>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        )
      })
    );
    await open("Go offline");
    await snap(viewport());
  });
});
