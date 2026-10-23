import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ToggleButton } from ".";

describe("ToggleButton", () => {
  it("turns on and off when pressed", async () => {
    const onChange = vi.fn();
    const screen = await render(
      <ToggleButton onChange={onChange}>Labels</ToggleButton>
    );
    const button = screen.getByRole("button", { name: "Labels" });

    await expect.element(button).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(button);
    await expect.element(button).toHaveAttribute("aria-pressed", "true");
    expect(onChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(button);
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
  });

  it("can't be toggled when disabled", async () => {
    const screen = await render(<ToggleButton isDisabled>Labels</ToggleButton>);
    const button = screen.getByRole("button", { name: "Labels" });

    await expect.element(button).toBeDisabled();
    await userEvent.click(button, { force: true });
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
  });
});
