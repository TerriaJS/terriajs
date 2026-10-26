import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { Color } from "react-aria-components/ColorPicker";
import { ColorPicker } from ".";
import { Button } from "../Button";
import { ColorSwatch } from "../ColorSwatch";
import { ColorSwatchPicker } from "../ColorSwatchPicker";

const COLORS = ["#ef4444", "#3b82f6", "#10b981"];

// The colours to pick from, in the popover
const swatches = (): React.ReactElement => (
  <ColorSwatchPicker aria-label="Suggested colours">
    {COLORS.map((color) => (
      <ColorSwatchPicker.Item key={color} color={color} />
    ))}
  </ColorSwatchPicker>
);

describe("ColorPicker", () => {
  it("opens its content in a dialog from its trigger, and closes on Escape", async () => {
    const screen = await render(
      <ColorPicker defaultValue="#ef4444">
        <ColorPicker.Trigger>
          <ColorPicker.Indicator />
          Layer colour
        </ColorPicker.Trigger>
        <ColorPicker.Popover>{swatches()}</ColorPicker.Popover>
      </ColorPicker>
    );

    await userEvent.click(screen.getByRole("button", { name: /Layer colour/ }));
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await expect
      .element(screen.getByRole("listbox", { name: "Suggested colours" }))
      .toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  });

  it("changes its colour from its content, and shows it on its trigger", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <ColorPicker defaultValue="#ef4444" onChange={onChange}>
        <ColorPicker.Trigger>
          <ColorPicker.Indicator />
          Layer colour
        </ColorPicker.Trigger>
        <ColorPicker.Popover>{swatches()}</ColorPicker.Popover>
      </ColorPicker>
    );

    await userEvent.click(screen.getByRole("button", { name: /Layer colour/ }));
    await userEvent.click(screen.getByRole("option", { name: /blue/i }));

    const [color] = onChange.mock.calls[0] as [Color];
    expect(color.toString("hex")).toBe("#3B82F6");
    await expect
      .element(screen.getByRole("button", { name: /Layer colour/ }))
      .toHaveAccessibleName(/blue/i);
  });

  it("is opened by any button in its trigger slot, and only that one", async () => {
    const screen = await render(
      <ColorPicker defaultValue="#ef4444">
        <Button variant="secondary">Clear</Button>
        <Button variant="secondary" slot="trigger">
          Change colour
        </Button>
        <ColorPicker.Popover>{swatches()}</ColorPicker.Popover>
      </ColorPicker>
    );
    const trigger = screen.getByRole("button", { name: "Change colour" });

    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(trigger);
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens from a colour marker inside a field, anchored to the field", async () => {
    const Field = (): React.ReactElement => {
      const fieldRef = useRef<HTMLDivElement>(null);
      return (
        <ColorPicker defaultValue="#ef4444">
          <div
            ref={fieldRef}
            data-testid="field"
            style={{ display: "flex", marginInlineStart: 48 }}
          >
            <input aria-label="Hex" defaultValue="#EF4444" />
            <Button slot="trigger" isIconOnly aria-label="Pick a colour">
              <ColorSwatch size="xs" />
            </Button>
          </div>
          <ColorPicker.Popover triggerRef={fieldRef}>
            {swatches()}
          </ColorPicker.Popover>
        </ColorPicker>
      );
    };
    const screen = await render(<Field />);

    await userEvent.click(screen.getByRole("textbox", { name: "Hex" }));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Pick a colour/ })
    );
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    const field = screen.getByTestId("field").element().getBoundingClientRect();
    const popover = screen
      .getByRole("dialog")
      .element()
      .getBoundingClientRect();
    expect(Math.round(popover.left)).toBe(Math.round(field.left));
  });
});
