import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { Color } from "react-aria-components/ColorArea";
import { ColorArea } from "..";

describe("ColorArea", () => {
  it("is one 2D slider, saturation across and brightness up, describing both", async () => {
    const screen = await render(
      <ColorArea aria-label="Layer colour" defaultValue="hsb(220, 70%, 80%)" />
    );

    const slider = screen.getByRole("slider");
    await expect
      .element(slider)
      .toHaveAttribute("aria-roledescription", "2D slider");
    await expect
      .element(slider)
      .toHaveAttribute(
        "aria-valuetext",
        expect.stringMatching(/Saturation: 70%.*Brightness: 80%/)
      );
  });

  it("changes saturation with the left and right arrows, brightness with up and down", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <ColorArea
        aria-label="Layer colour"
        defaultValue="hsb(220, 70%, 80%)"
        onChange={onChange}
      />
    );
    const latest = (): Color => (onChange.mock.calls.at(-1) as [Color])[0];

    screen.getByRole("slider").element().focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(latest().getChannelValue("saturation")).toBe(71);
    await userEvent.keyboard("{ArrowUp}");
    expect(latest().getChannelValue("brightness")).toBe(81);
  });

  it("shows the colour picked on its thumb", async () => {
    const screen = await render(
      <ColorArea aria-label="Layer colour" defaultValue="#3b82f6" />
    );

    const thumb = screen.container.querySelector(
      '[data-tds="color-area-thumb"]'
    );
    if (!thumb) throw new Error("no thumb");
    expect(getComputedStyle(thumb).backgroundColor).toBe("rgb(59, 130, 246)");
  });

  it("can't be changed while disabled", async () => {
    const screen = await render(
      <ColorArea aria-label="Layer colour" isDisabled />
    );

    for (const slider of screen.getByRole("slider").elements()) {
      expect(slider).toBeDisabled();
    }
  });
});
