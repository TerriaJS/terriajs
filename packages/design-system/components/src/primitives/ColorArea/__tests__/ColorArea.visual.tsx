import { describe, expect, it } from "vitest";
import { page, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { focusVisible, hover, press, snap } from "../../../visual";
import { ColorArea, type ColorAreaProps } from "..";
import "../color-area.stories.css";

// At the stories' width, as in a picker's popover
const area = (props: ColorAreaProps = {}): React.ReactElement => (
  <div className="color-area-story">
    <ColorArea
      aria-label="Layer colour"
      defaultValue="hsb(219, 76%, 96%)"
      {...props}
    />
  </div>
);

// The thumb a person points at, not the hidden inputs inside it
const thumb = (): Locator =>
  page.elementLocator(
    document.querySelector('[data-tds="color-area-thumb"]') ?? document.body
  );

describe("ColorArea", () => {
  it("default", async () => {
    await render(area());
    await snap();
  });

  it("with dots", async () => {
    await render(area({ showDots: true }));
    await snap();
  });

  it("thumb hovered", async () => {
    await render(area());
    await hover(thumb());
    await snap();
  });

  it("thumb focused", async () => {
    const screen = await render(area());
    await focusVisible(screen.getByRole("slider").first());
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("thumb hovered and focused", async () => {
    const screen = await render(area());
    await focusVisible(screen.getByRole("slider").first());
    await hover(thumb());
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("thumb dragging", async () => {
    await render(area());
    await press(thumb());
    await expect.element(thumb()).toHaveAttribute("data-dragging");
    await snap();
  });

  it("disabled", async () => {
    await render(area({ isDisabled: true }));
    await snap();
  });

  // Red across, green up, blue as it is
  it("rgb channels", async () => {
    await render(
      area({ colorSpace: "rgb", xChannel: "red", yChannel: "green" })
    );
    await snap();
  });
});
