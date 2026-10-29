import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Drawer, type DrawerBackdropProps, type DrawerPlacement } from "..";
import { Button } from "../../Button";

// The usual composition: a button that opens it, the backdrop, and the
// drawer's handle, header, body and footer
const drawer = ({
  placement,
  backdrop
}: {
  placement?: DrawerPlacement;
  backdrop?: DrawerBackdropProps;
} = {}): React.ReactElement => (
  <Drawer>
    <Button>Layer settings</Button>
    <Drawer.Backdrop {...backdrop}>
      <Drawer.Content placement={placement}>
        <Drawer.Dialog>
          <Drawer.CloseTrigger />
          <Drawer.Handle />
          <Drawer.Header>
            <Drawer.Heading>Suburbs 2021</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>
            <p>Population counts by suburb from the 2021 census.</p>
          </Drawer.Body>
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

const open = async (
  screen: Awaited<ReturnType<typeof render>>
): Promise<HTMLElement> => {
  await userEvent.click(screen.getByRole("button", { name: "Layer settings" }));
  const dialog = screen.getByRole("dialog", { name: "Suburbs 2021" });
  await expect.element(dialog).toBeVisible();
  return dialog.element() as HTMLElement;
};

// A pointer pressed on `target`, moved `distance` px down (or right) a frame
// at a time, and let go. Moves all at once would make the speed between two
// of them depend on whether a millisecond ticked over, and a fast one is a
// flick that closes the drawer. `back` ends it with a flick back to that
// offset; `end` is how the pointer goes
const drag = async (
  target: Element,
  dialog: Element,
  distance: number,
  axis: "x" | "y" = "y",
  {
    back,
    end = "pointerup"
  }: { back?: number; end?: "pointerup" | "pointercancel" } = {}
): Promise<void> => {
  const { left, top } = target.getBoundingClientRect();
  const at = (offset: number): PointerEventInit => ({
    bubbles: true,
    pointerId: 1,
    button: 0,
    clientX: left + 4 + (axis === "x" ? offset : 0),
    clientY: top + 4 + (axis === "y" ? offset : 0)
  });

  target.dispatchEvent(new PointerEvent("pointerdown", at(0)));
  for (let step = 1; step <= 10; step++) {
    await new Promise((resolve) => setTimeout(resolve, 16));
    dialog.dispatchEvent(
      new PointerEvent("pointermove", at((distance * step) / 10))
    );
  }
  if (back !== undefined) {
    await new Promise((resolve) => setTimeout(resolve, 16));
    dialog.dispatchEvent(new PointerEvent("pointermove", at(back)));
  }
  dialog.dispatchEvent(new PointerEvent(end, at(back ?? distance)));
};

// Long enough for a closing drawer to have gone
const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 400));

describe("Drawer", () => {
  it("opens as a dialog named by its heading", async () => {
    const screen = await render(drawer());

    await open(screen);
  });

  it("closes on Escape, its close button, or a close-slot button", async () => {
    const screen = await render(drawer());

    await open(screen);
    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

    await open(screen);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

    await open(screen);
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when pressed outside, unless not dismissable", async () => {
    const screen = await render(drawer({ placement: "right" }));

    await open(screen);
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

    await screen.rerender(
      drawer({ placement: "right", backdrop: { isDismissable: false } })
    );
    await open(screen);
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await expect.element(screen.getByRole("dialog")).toBeVisible();
  });

  it.each(["bottom", "top", "left", "right"] as const)(
    "slides from the %s",
    async (placement) => {
      const screen = await render(drawer({ placement }));

      const dialog = await open(screen);
      expect(dialog).toHaveAttribute("data-tds-placement", placement);
    }
  );

  it("comes from the bottom by default, over an opaque backdrop", async () => {
    const screen = await render(drawer());

    const dialog = await open(screen);
    expect(dialog).toHaveAttribute("data-tds-placement", "bottom");
    expect(
      document.querySelector('[data-tds="drawer-backdrop"]')
    ).toHaveAttribute("data-tds-variant", "opaque");
  });

  // React Aria keeps Content marked entering and exiting, and in the page,
  // only while Content itself animates, not what's in it
  it("slides in as it opens, and out as it closes", async () => {
    const screen = await render(drawer({ placement: "right" }));

    await userEvent.click(
      screen.getByRole("button", { name: "Layer settings" })
    );
    const dialog = screen.getByRole("dialog", { name: "Suburbs 2021" });
    const content = dialog.element().closest('[data-tds="drawer-content"]');
    if (!content) throw new Error("No content");
    const slides = (): string[] =>
      content
        .getAnimations()
        .map((animation) => (animation as CSSAnimation).animationName);
    expect(slides()).toContain("terria-ds-drawer-slide-in");

    await expect.poll(slides).toEqual([]);
    await userEvent.keyboard("{Escape}");
    expect(slides()).toContain("terria-ds-drawer-slide-out");
    await expect.element(dialog).not.toBeInTheDocument();
  });

  // The page behind fades as the drawer moves, neither finishing first
  it("fades its backdrop in step with the slide, opening and closing", async () => {
    const screen = await render(drawer({ placement: "right" }));
    const timing = (selector: string): number[] => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`No ${selector}`);
      return element
        .getAnimations()
        .map((animation) => Number(animation.effect?.getTiming().duration));
    };

    await userEvent.click(
      screen.getByRole("button", { name: "Layer settings" })
    );
    expect(timing('[data-tds="drawer-backdrop"]')).toEqual(
      timing('[data-tds="drawer-content"]')
    );

    await expect.poll(() => timing('[data-tds="drawer-content"]')).toEqual([]);
    await userEvent.keyboard("{Escape}");
    expect(timing('[data-tds="drawer-backdrop"]')).toEqual(
      timing('[data-tds="drawer-content"]')
    );
  });

  it("hides its handle from assistive tech", async () => {
    const screen = await render(drawer());

    const dialog = await open(screen);
    expect(dialog.querySelector('[data-tds="drawer-handle"]')).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  describe("dragged", () => {
    it("closes when dragged from its header past a third of its height", async () => {
      const screen = await render(drawer());
      const dialog = await open(screen);
      const header = dialog.querySelector('[data-tds="drawer-header"]');
      if (!header) throw new Error("No header");

      await drag(header, dialog, dialog.offsetHeight * 0.5);

      await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    });

    it("springs back when dragged only a little", async () => {
      const screen = await render(drawer());
      const dialog = await open(screen);
      const header = dialog.querySelector('[data-tds="drawer-header"]');
      if (!header) throw new Error("No header");

      await drag(header, dialog, 20);

      await expect.element(screen.getByRole("dialog")).toBeVisible();
      await expect.poll(() => dialog.style.transform).toBe("");
    });

    it("isn't dragged from its body, which scrolls", async () => {
      const screen = await render(drawer());
      const dialog = await open(screen);
      const body = dialog.querySelector('[data-tds="drawer-body"]');
      if (!body) throw new Error("No body");

      await drag(body, dialog, dialog.offsetHeight);
      await new Promise((resolve) => setTimeout(resolve, 100));

      await expect.element(screen.getByRole("dialog")).toBeVisible();
    });

    it("is dragged only towards the edge it came from", async () => {
      const screen = await render(drawer({ placement: "right" }));
      const dialog = await open(screen);
      const header = dialog.querySelector('[data-tds="drawer-header"]');
      if (!header) throw new Error("No header");

      await drag(header, dialog, -dialog.offsetWidth, "x");
      await settle();

      await expect.element(screen.getByRole("dialog")).toBeVisible();
    });

    it("stays open when flicked back the way it came", async () => {
      const screen = await render(drawer());
      const dialog = await open(screen);
      const header = dialog.querySelector('[data-tds="drawer-header"]');
      if (!header) throw new Error("No header");

      await drag(header, dialog, 60, "y", { back: 10 });
      await settle();

      await expect.element(screen.getByRole("dialog")).toBeVisible();
    });

    it("springs back when the browser takes the pointer", async () => {
      const screen = await render(drawer());
      const dialog = await open(screen);
      const header = dialog.querySelector('[data-tds="drawer-header"]');
      if (!header) throw new Error("No header");

      await drag(header, dialog, dialog.offsetHeight * 0.5, "y", {
        end: "pointercancel"
      });
      await settle();

      await expect.element(screen.getByRole("dialog")).toBeVisible();
      await expect.poll(() => dialog.style.transform).toBe("");
    });

    it("isn't dragged away when not dismissable", async () => {
      const screen = await render(
        drawer({ backdrop: { isDismissable: false } })
      );
      const dialog = await open(screen);
      const header = dialog.querySelector('[data-tds="drawer-header"]');
      if (!header) throw new Error("No header");

      await drag(header, dialog, dialog.offsetHeight);
      await new Promise((resolve) => setTimeout(resolve, 100));

      await expect.element(screen.getByRole("dialog")).toBeVisible();
    });
  });
});
