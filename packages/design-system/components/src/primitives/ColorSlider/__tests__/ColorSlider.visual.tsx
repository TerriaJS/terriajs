import { describe, expect, it } from "vitest";
import { page, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import type { ColorChannel } from "react-aria-components/ColorSlider";
import { focusVisible, hover, press, snap } from "../../../visual";
import { ColorSlider, type ColorSliderProps } from "..";
import "../color-slider.stories.css";

type Props = Omit<ColorSliderProps, "channel"> & { channel?: ColorChannel };

// At the stories' width, as in a picker's popover
const slider = ({
  channel = "hue",
  ...props
}: Props = {}): React.ReactElement => (
  <div
    className={
      props.orientation === "vertical"
        ? "color-slider-story-upright"
        : "color-slider-story"
    }
  >
    <ColorSlider
      label="Hue"
      channel={channel}
      defaultValue="hsl(33, 90%, 55%)"
      {...props}
    />
  </div>
);

// The thumb a person points at, not the hidden input inside it
const thumb = (): Locator =>
  page.elementLocator(
    document.querySelector('[data-tds="color-slider-thumb"]') ?? document.body
  );

describe("ColorSlider", () => {
  it("default", async () => {
    await render(slider());
    await snap();
  });

  it("thumb hovered", async () => {
    await render(slider());
    await hover(thumb());
    await snap();
  });

  it("thumb focused", async () => {
    const screen = await render(slider());
    await focusVisible(screen.getByRole("slider"));
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("thumb hovered and focused", async () => {
    const screen = await render(slider());
    await focusVisible(screen.getByRole("slider"));
    await hover(thumb());
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("thumb dragging", async () => {
    await render(slider());
    await press(thumb());
    await expect.element(thumb()).toHaveAttribute("data-dragging");
    await snap();
  });

  it("disabled", async () => {
    await render(slider({ isDisabled: true }));
    await snap();
  });

  // Upright it's the track alone
  it("vertical", async () => {
    await render(slider({ orientation: "vertical", "aria-label": "Hue" }));
    await snap();
  });

  it("vertical, thumb focused", async () => {
    const screen = await render(
      slider({ orientation: "vertical", "aria-label": "Hue" })
    );
    await focusVisible(screen.getByRole("slider"));
    await expect.element(thumb()).toHaveAttribute("data-focus-visible");
    await snap();
  });

  // Each channel's gradient; alpha over the checkerboard
  it.each([
    ["Saturation", "saturation"],
    ["Lightness", "lightness"],
    ["Red", "red"],
    ["Alpha", "alpha"]
  ] as const)("channel %s", async (label, channel) => {
    await render(slider({ label, channel }));
    await snap();
  });
});
