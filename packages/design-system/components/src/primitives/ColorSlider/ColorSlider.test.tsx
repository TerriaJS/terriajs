import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { Color } from "react-aria-components/ColorSlider";
import { ColorSlider } from ".";

describe("ColorSlider", () => {
  it("is a slider for one channel, named by its label, with its value beside it", async () => {
    const screen = await render(
      <ColorSlider
        label="Hue"
        channel="hue"
        defaultValue="hsl(200, 100%, 50%)"
      />
    );

    await expect
      .element(screen.getByRole("slider", { name: "Hue" }))
      .toHaveValue("200");
    await expect.element(screen.getByText("200°")).toBeVisible();
  });

  it("changes its channel from the keyboard", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <ColorSlider
        label="Hue"
        channel="hue"
        defaultValue="hsl(200, 100%, 50%)"
        onChange={onChange}
      />
    );

    screen.getByRole("slider").element().focus();
    await userEvent.keyboard("{ArrowRight}");

    const [color] = onChange.mock.calls[0] as [Color];
    expect(color.getChannelValue("hue")).toBe(201);
  });

  it("shows the colour picked on its thumb", async () => {
    const screen = await render(
      <ColorSlider label="Red" channel="red" defaultValue="#3b82f6" />
    );

    const thumb = screen.container.querySelector(
      '[data-tds="color-slider-thumb"]'
    );
    if (!thumb) throw new Error("no thumb");
    expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(59, 130, 246)");
  });

  it("shows transparency over a checkerboard, for the alpha channel", async () => {
    const screen = await render(
      <ColorSlider label="Alpha" channel="alpha" defaultValue="#3b82f6" />
    );

    const track = screen.container.querySelector(
      '[data-tds="color-slider-track"]'
    );
    if (!track) throw new Error("no track");
    expect(getComputedStyle(track).backgroundImage).toContain(
      "repeating-conic-gradient"
    );
  });

  it("can stand upright", async () => {
    const screen = await render(
      <ColorSlider
        aria-label="Hue"
        channel="hue"
        orientation="vertical"
        defaultValue="hsl(200, 100%, 50%)"
      />
    );

    await expect
      .element(screen.getByRole("slider"))
      .toHaveAttribute("aria-orientation", "vertical");
  });

  it("can't be changed while disabled", async () => {
    const screen = await render(
      <ColorSlider
        label="Hue"
        channel="hue"
        defaultValue="hsl(200, 100%, 50%)"
        isDisabled
      />
    );

    await expect.element(screen.getByRole("slider")).toBeDisabled();
  });
});
