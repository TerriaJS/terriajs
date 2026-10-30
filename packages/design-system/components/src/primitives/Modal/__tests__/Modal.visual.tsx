import { describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { StackFrontIcon, TrashIcon } from "@terria/design-system-icons";
import type { ReactNode } from "react";
import { UNSAFE_PortalProvider } from "react-aria/PortalProvider";
import { focusVisible, hover, press, snap, viewport } from "../../../visual";
import { Button } from "../../Button";
import {
  Modal,
  type ModalBackdropVariant,
  type ModalContainerProps,
  type ModalPlacement,
  type ModalSize
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

const SIZES: ModalSize[] = ["xs", "sm", "md", "lg", "cover", "full"];
const BACKDROPS: ModalBackdropVariant[] = ["opaque", "blur", "transparent"];
const PLACEMENTS: ModalPlacement[] = ["auto", "center", "top", "bottom"];

// The visual setup lays out each div in the body as a test's container, which
// would also catch the backdrop, rendered straight into the body: it would
// lose its flex layout and the modal its place. So it renders into the test's
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

// Opened from its trigger, done animating in
const open = async (name = "Add data"): Promise<void> => {
  await userEvent.click(page.getByRole("button", { name }));
  await expect.element(page.getByRole("dialog")).toBeVisible();
  await settled();
};

const addData = ({
  backdrop = "opaque",
  body = "Browse the catalogue, or upload a file from your computer.",
  ...props
}: ModalContainerProps & {
  backdrop?: ModalBackdropVariant;
  body?: ReactNode;
} = {}): React.ReactElement => (
  <Modal>
    <Button>Add data</Button>
    <Modal.Backdrop variant={backdrop}>
      <Modal.Container {...props}>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon>
              <StackFrontIcon />
            </Modal.Icon>
            <Modal.Heading>Add data to the map</Modal.Heading>
          </Modal.Header>
          <Modal.Body>{body}</Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <Button slot="close">Browse catalogue</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);

const details = Array.from({ length: 12 }, (_, index) => (
  <p key={index}>
    Detail {index + 1}: This layer contains geographic data for the selected
    area. Review its coverage and source before adding it to the map.
  </p>
));

describe("Modal", () => {
  it("open", async () => {
    await render(inContainer({ children: addData() }));
    await open();
    await snap(viewport());
  });

  it("close button hovered", async () => {
    await render(inContainer({ children: addData() }));
    await open();
    await hover(page.getByRole("button", { name: /close/i }));
    await snap(viewport());
  });

  it("close button pressed", async () => {
    await render(inContainer({ children: addData() }));
    await open();
    await press(page.getByRole("button", { name: /close/i }));
    await snap(viewport());
  });

  it("close button focused", async () => {
    await render(inContainer({ children: addData() }));
    await focusVisible(page.getByRole("button", { name: "Add data" }));
    await userEvent.keyboard("{Enter}");
    await expect.element(page.getByRole("dialog")).toBeVisible();
    await settled();
    await userEvent.tab();
    await expect
      .element(page.getByRole("button", { name: /close/i }))
      .toHaveFocus();
    await snap(viewport());
  });

  it("footer button hovered", async () => {
    await render(inContainer({ children: addData() }));
    await open();
    await hover(page.getByRole("button", { name: "Browse catalogue" }));
    await snap(viewport());
  });

  it.each(SIZES)("size %s", async (size) => {
    await render(inContainer({ children: addData({ size }) }));
    await open();
    await snap(viewport());
  });

  it.each(BACKDROPS)("backdrop %s", async (backdrop) => {
    await render(inContainer({ children: addData({ backdrop }) }));
    await open();
    await snap(viewport());
  });

  it.each(PLACEMENTS)("placed %s", async (placement) => {
    await render(inContainer({ children: addData({ placement, size: "xs" }) }));
    await open();
    await snap(viewport());
  });

  it.each(["inside", "outside"] as const)("scrolling %s", async (scroll) => {
    await render(inContainer({ children: addData({ scroll, body: details }) }));
    await open();
    await snap(viewport());
  });

  it("centered header", async () => {
    await render(
      inContainer({
        children: (
          <Modal>
            <Button variant="danger">Remove layer</Button>
            <Modal.Backdrop isDismissable={false}>
              <Modal.Container>
                <Modal.Dialog role="alertdialog">
                  <Modal.Header align="center">
                    <Modal.Icon>
                      <TrashIcon />
                    </Modal.Icon>
                    <Modal.Heading>Remove “Flood extent 2022”?</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    The layer and its styling will be removed from the map.
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="tertiary">
                      Cancel
                    </Button>
                    <Button slot="close" variant="danger">
                      Remove
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )
      })
    );
    await userEvent.click(page.getByRole("button", { name: "Remove layer" }));
    await expect.element(page.getByRole("alertdialog")).toBeVisible();
    await settled();
    await snap(viewport());
  });

  it("without an icon or close button", async () => {
    await render(
      inContainer({
        children: (
          <Modal>
            <Button>Add data</Button>
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.Header>
                    <Modal.Heading>Add data to the map</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    Browse the catalogue, or upload a file from your computer.
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close">Done</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )
      })
    );
    await open();
    await snap(viewport());
  });
});
