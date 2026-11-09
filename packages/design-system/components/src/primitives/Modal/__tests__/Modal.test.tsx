import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { UNSAFE_PortalProvider } from "react-aria/PortalProvider";
import { render } from "vitest-browser-react";
import { Button } from "../../Button";
import { Modal, type ModalBackdropProps, type ModalContainerProps } from "..";

const RemoveLayer = ({
  size,
  placement,
  scroll,
  variant,
  isDismissable,
  isKeyboardDismissDisabled
}: {
  size?: ModalContainerProps["size"];
  placement?: ModalContainerProps["placement"];
  scroll?: ModalContainerProps["scroll"];
  variant?: ModalBackdropProps["variant"];
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
}): React.ReactElement => (
  <Modal>
    <Button>Remove layer</Button>
    <Modal.Backdrop
      variant={variant}
      isDismissable={isDismissable}
      isKeyboardDismissDisabled={isKeyboardDismissDisabled}
    >
      <Modal.Container size={size} placement={placement} scroll={scroll}>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Remove layer?</Modal.Heading>
          </Modal.Header>
          <Modal.Body>It will be removed from the map.</Modal.Body>
          <Modal.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <Button slot="close">Remove</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);

const open = async (
  screen: Awaited<ReturnType<typeof render>>
): Promise<void> => {
  await screen.getByRole("button", { name: "Remove layer" }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Remove layer?" }))
    .toBeVisible();
};

describe("Modal", () => {
  it("opens a dialog named by its heading when the trigger is pressed", async () => {
    const screen = await render(<RemoveLayer />);

    await open(screen);
  });

  it("is modal: the rest of the page is inert while it's open", async () => {
    const screen = await render(<RemoveLayer />);
    const trigger = screen.getByRole("button", { name: "Remove layer" });
    await open(screen);

    expect(trigger.element().closest("[inert]")).not.toBeNull();
  });

  it("closes from the close button", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await page.getByRole("button", { name: "Close" }).click();

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes from a footer action", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await userEvent.keyboard("{Escape}");

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes through the dialog's render prop", async () => {
    const screen = await render(
      <Modal>
        <Button>Save view</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              {({ close }) => (
                <>
                  <Modal.Heading>Save view?</Modal.Heading>
                  <Button onPress={close}>Save</Button>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    );
    await screen.getByRole("button", { name: "Save view" }).click();

    await page.getByRole("button", { name: "Save" }).click();

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("can be opened and closed from outside, reporting each change", async () => {
    const onOpenChange = vi.fn();
    const Controlled = (): React.ReactElement => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <Button
            onPress={() => {
              setIsOpen(true);
            }}
          >
            Open settings
          </Button>
          <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
              onOpenChange(open);
              setIsOpen(open);
            }}
          >
            <Modal.Backdrop>
              <Modal.Container>
                <Modal.Dialog>
                  <Modal.CloseTrigger />
                  <Modal.Heading>Settings</Modal.Heading>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </>
      );
    };
    const screen = await render(<Controlled />);

    await screen.getByRole("button", { name: "Open settings" }).click();
    await expect
      .element(page.getByRole("dialog", { name: "Settings" }))
      .toBeVisible();

    await page.getByRole("button", { name: "Close" }).click();

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renders into a custom portal container", async () => {
    const panel = document.createElement("section");
    panel.setAttribute("aria-label", "Map panel");
    document.body.append(panel);
    const screen = await render(
      <UNSAFE_PortalProvider getContainer={() => panel}>
        <RemoveLayer />
      </UNSAFE_PortalProvider>
    );
    await open(screen);

    expect(panel.contains(page.getByRole("dialog").element())).toBe(true);
    panel.remove();
  });

  it("stays open on Escape if keyboard dismissal is disabled", async () => {
    const screen = await render(<RemoveLayer isKeyboardDismissDisabled />);
    await open(screen);

    await userEvent.keyboard("{Escape}");

    await expect.element(page.getByRole("dialog")).toBeVisible();
  });

  it("closes when the backdrop is pressed", async () => {
    const screen = await render(<RemoveLayer />);
    await open(screen);

    await userEvent.click(document.body, { position: { x: 4, y: 4 } });

    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open when the backdrop is pressed if it isn't dismissable", async () => {
    const screen = await render(<RemoveLayer isDismissable={false} />);
    await open(screen);

    await userEvent.click(document.body, { position: { x: 4, y: 4 } });

    await expect.element(page.getByRole("dialog")).toBeVisible();
  });

  it.each(["xs", "sm", "md", "lg", "cover", "full"] as const)(
    "renders the %s size",
    async (size) => {
      const screen = await render(<RemoveLayer size={size} />);
      await open(screen);

      expect(
        document.querySelector('[data-tds="modal-container"]')
      ).toHaveAttribute("data-tds-size", size);
    }
  );

  describe("placement", () => {
    const dialogBox = (): DOMRect =>
      page.getByRole("dialog").element().getBoundingClientRect();

    it.each(["inside", "outside"] as const)(
      "centres the dialog by default (%s)",
      async (scroll) => {
        const screen = await render(<RemoveLayer scroll={scroll} />);
        await open(screen);

        await expect
          .poll(() => {
            const { top, bottom } = dialogBox();
            return Math.abs(top - (window.innerHeight - bottom));
          })
          .toBeLessThanOrEqual(1);
      }
    );

    it.each(["inside", "outside"] as const)(
      "puts the dialog at the top (%s)",
      async (scroll) => {
        const screen = await render(
          <RemoveLayer scroll={scroll} placement="top" />
        );
        await open(screen);

        // Polls past the entrance animation, which scales the dialog in
        await expect.poll(() => dialogBox().top).toBe(16);
      }
    );

    it.each(["inside", "outside"] as const)(
      "puts the dialog at the bottom (%s)",
      async (scroll) => {
        const screen = await render(
          <RemoveLayer scroll={scroll} placement="bottom" />
        );
        await open(screen);

        await expect
          .poll(() => window.innerHeight - dialogBox().bottom)
          .toBe(16);
      }
    );
  });

  describe("auto placement", () => {
    const dialogBox = (): DOMRect =>
      page.getByRole("dialog").element().getBoundingClientRect();

    it.each(["inside", "outside"] as const)(
      "sits at the bottom on a phone (%s)",
      async (scroll) => {
        await page.viewport(390, 700);
        const screen = await render(
          <RemoveLayer scroll={scroll} placement="auto" />
        );
        await open(screen);

        await expect
          .poll(() => window.innerHeight - dialogBox().bottom)
          .toBe(16);
      }
    );

    it.each(["inside", "outside"] as const)(
      "is centred on a wider screen (%s)",
      async (scroll) => {
        await page.viewport(1024, 700);
        const screen = await render(
          <RemoveLayer scroll={scroll} placement="auto" />
        );
        await open(screen);

        await expect
          .poll(() => {
            const { top, bottom } = dialogBox();
            return Math.abs(top - (window.innerHeight - bottom));
          })
          .toBeLessThanOrEqual(1);
      }
    );
  });

  describe("backdrop", () => {
    const backdropStyle = (): CSSStyleDeclaration => {
      const backdrop = page
        .getByRole("dialog")
        .element()
        .closest('[data-tds="modal-backdrop"]');
      if (!backdrop) throw new Error("The dialog isn't in a backdrop");
      return getComputedStyle(backdrop);
    };

    it("is a plain tint by default", async () => {
      const screen = await render(<RemoveLayer />);
      await open(screen);

      expect(backdropStyle().backdropFilter).toBe("none");
    });

    it("blurs the page behind it with the blur variant", async () => {
      const screen = await render(<RemoveLayer variant="blur" />);
      await open(screen);

      expect(backdropStyle().backdropFilter).toMatch(/^blur\(/);
    });

    it("leaves the page untinted and unblurred with the transparent variant", async () => {
      const screen = await render(<RemoveLayer variant="transparent" />);
      await open(screen);

      expect(backdropStyle().backdropFilter).toBe("none");
      expect(backdropStyle().backgroundColor).toBe("rgba(0, 0, 0, 0)");
    });

    it("still keeps the page behind it inert when transparent", async () => {
      const screen = await render(<RemoveLayer variant="transparent" />);
      const trigger = screen.getByRole("button", { name: "Remove layer" });
      await open(screen);

      expect(trigger.element().closest("[inert]")).not.toBeNull();
    });
  });
});

const LongModal = ({
  scroll,
  size = "sm"
}: Pick<ModalContainerProps, "scroll" | "size">): React.ReactElement => (
  <Modal>
    <Button>Read details</Button>
    <Modal.Backdrop>
      <Modal.Container scroll={scroll} size={size}>
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Layer details</Modal.Heading>
          </Modal.Header>
          <Modal.Body role="region" aria-label="Details">
            {Array.from({ length: 60 }, (_, index) => (
              <p key={index}>Detail {index + 1}</p>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button slot="close">Done reading</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  </Modal>
);

describe("Modal scrolling", () => {
  it.each(["sm", "cover", "full"] as const)(
    "scrolls only the body by default (%s)",
    async (size) => {
      await page.viewport(800, 600);
      const screen = await render(<LongModal size={size} />);
      await screen.getByRole("button", { name: "Read details" }).click();
      const body = page.getByRole("region", { name: "Details" }).element();
      const heading = page
        .getByRole("heading", { name: "Layer details" })
        .element();
      const footer = page
        .getByRole("button", { name: "Done reading" })
        .element();
      await expect
        .poll(() => footer.getBoundingClientRect().bottom)
        .toBeLessThanOrEqual(600);
      expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      const headingTop = heading.getBoundingClientRect().top;
      body.scrollTop = body.scrollHeight;
      expect(body.scrollTop).toBeGreaterThan(0);
      expect(heading.getBoundingClientRect().top).toBeCloseTo(headingTop, 0);
      await page.getByRole("button", { name: "Done reading" }).click();
      await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    }
  );

  it.each(["sm", "cover", "full"] as const)(
    "scrolls the entire dialog outside (%s)",
    async (size) => {
      await page.viewport(800, 600);
      const screen = await render(<LongModal scroll="outside" size={size} />);
      await screen.getByRole("button", { name: "Read details" }).click();
      const dialog = page
        .getByRole("dialog", { name: "Layer details" })
        .element();
      const backdrop = dialog.closest('[data-tds="modal-backdrop"]');
      if (!backdrop) throw new Error("Missing modal backdrop");
      const body = page.getByRole("region", { name: "Details" }).element();
      await expect
        .poll(() => dialog.getBoundingClientRect().height)
        .toBeGreaterThan(600);
      expect(dialog.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
      expect(body.scrollHeight).toBe(body.clientHeight);
      backdrop.scrollTop = backdrop.scrollHeight;
      expect(backdrop.scrollTop).toBeGreaterThan(0);
      expect(dialog.getBoundingClientRect().top).toBeLessThan(0);
      const footer = page.getByRole("button", { name: "Done reading" });
      expect(
        footer.element().getBoundingClientRect().bottom
      ).toBeLessThanOrEqual(600);
      await footer.click();
      await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
    }
  );

  it("still dismisses on a backdrop click after outside scrolling", async () => {
    await page.viewport(800, 600);
    const screen = await render(<LongModal scroll="outside" />);
    await screen.getByRole("button", { name: "Read details" }).click();
    const backdrop = page
      .getByRole("dialog")
      .element()
      .closest('[data-tds="modal-backdrop"]');
    if (!backdrop) throw new Error("Missing modal backdrop");
    backdrop.scrollTop = backdrop.scrollHeight;
    await userEvent.click(document.body, { position: { x: 4, y: 4 } });
    await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("cover modal dismissal", () => {
  it.each(["inside", "outside"] as const)(
    "closes from the blurred gutter but not from the dialog (%s)",
    async (scroll) => {
      await page.viewport(800, 600);
      const screen = await render(
        <RemoveLayer size="cover" variant="blur" scroll={scroll} />
      );
      await open(screen);
      await page.getByRole("heading", { name: "Remove layer?" }).click();
      await expect.element(page.getByRole("dialog")).toBeVisible();

      // The cover container fills the viewport; (4, 4) is its empty padding.
      await userEvent.click(document.body, { position: { x: 4, y: 4 } });
      await expect.element(page.getByRole("dialog")).not.toBeInTheDocument();
      await expect
        .element(screen.getByRole("button", { name: "Remove layer" }))
        .toHaveFocus();
    }
  );

  it.each(["inside", "outside"] as const)(
    "respects isDismissable=false in the blurred gutter (%s)",
    async (scroll) => {
      await page.viewport(800, 600);
      const screen = await render(
        <RemoveLayer
          size="cover"
          variant="blur"
          scroll={scroll}
          isDismissable={false}
        />
      );
      await open(screen);
      await userEvent.click(document.body, { position: { x: 4, y: 4 } });
      await expect.element(page.getByRole("dialog")).toBeVisible();
    }
  );
});
