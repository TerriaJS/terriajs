import { describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { Color } from "react-aria-components/ColorSwatchPicker";
import { ColorSwatchPicker, type ColorSwatchPickerProps } from "..";

const COLORS = ["#ef4444", "#3b82f6", "#facc15", "#10b981"];

// The colour passed to onChange, as hex
const picked = (onChange: ReturnType<typeof vi.fn>): string | undefined =>
  (onChange.mock.calls[0] as [Color] | undefined)?.[0].toString("hex");

const renderPicker = (
  props: Partial<ColorSwatchPickerProps> = {}
): Promise<RenderResult> =>
  render(
    <ColorSwatchPicker aria-label="Layer colour" {...props}>
      {COLORS.map((color) => (
        <ColorSwatchPicker.Item key={color} color={color} />
      ))}
    </ColorSwatchPicker>
  );

describe("ColorSwatchPicker", () => {
  it("lists its colours as options named for them", async () => {
    const screen = await renderPicker();

    await expect
      .element(screen.getByRole("listbox", { name: "Layer colour" }))
      .toBeInTheDocument();
    expect(screen.getByRole("option").elements()).toHaveLength(4);
    await expect
      .element(screen.getByRole("option", { name: /blue/i }))
      .toBeInTheDocument();
  });

  it("picks the colour pressed", async () => {
    const onChange = vi.fn();
    const screen = await renderPicker({ onChange });

    await userEvent.click(screen.getByRole("option", { name: /blue/i }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(picked(onChange)).toBe("#3B82F6");
    await expect
      .element(screen.getByRole("option", { name: /blue/i }))
      .toHaveAttribute("aria-selected", "true");
  });

  it("picks from the keyboard: arrows move, Enter picks", async () => {
    const onChange = vi.fn();
    await renderPicker({ onChange });

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    await userEvent.keyboard("{Enter}");

    expect(picked(onChange)).toBe("#3B82F6");
  });

  it("marks the picked colour with a check that stands out from it", async () => {
    const screen = await render(
      <div>
        <ColorSwatchPicker aria-label="Light" defaultValue="#facc15">
          <ColorSwatchPicker.Item color="#facc15" />
        </ColorSwatchPicker>
        <ColorSwatchPicker aria-label="Dark" defaultValue="#111827">
          <ColorSwatchPicker.Item color="#111827" />
        </ColorSwatchPicker>
      </div>
    );
    const check = (name: string): Element | null =>
      screen
        .getByRole("listbox", { name })
        .element()
        .querySelector('[data-tds="color-swatch-picker-indicator"]');

    const onLight = check("Light");
    const onDark = check("Dark");
    if (!onLight || !onDark) throw new Error("no check on the picked colour");
    expect(getComputedStyle(onLight).visibility).toBe("visible");
    expect(getComputedStyle(onLight).color).not.toBe(
      getComputedStyle(onDark).color
    );
  });

  it("can't be picked from while disabled", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <ColorSwatchPicker aria-label="Layer colour" onChange={onChange}>
        <ColorSwatchPicker.Item color="#ef4444" isDisabled />
      </ColorSwatchPicker>
    );

    await userEvent.click(screen.getByRole("option"), { force: true });

    expect(onChange).not.toHaveBeenCalled();
    await expect
      .element(screen.getByRole("option"))
      .toHaveAttribute("aria-disabled", "true");
  });
});
