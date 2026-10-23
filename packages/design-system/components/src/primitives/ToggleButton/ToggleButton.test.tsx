import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ToggleButton } from ".";

// A token's colour as the browser computes it, to compare with a button's
const tokenColor = (token: string): string => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return color;
};

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

  it("shows it's on in the soft accent colour", async () => {
    const screen = await render(
      <ToggleButton defaultSelected>Labels</ToggleButton>
    );
    const button = screen.getByRole("button", { name: "Labels" }).element();

    // Colours ease in, so wait for them
    await expect
      .poll(() => getComputedStyle(button).backgroundColor)
      .toBe(tokenColor("--terria-ds-primary-soft"));
    await expect
      .poll(() => getComputedStyle(button).color)
      .toBe(tokenColor("--terria-ds-primary-soft-foreground"));
  });

  it("is filled when off, unless it's a ghost", async () => {
    const screen = await render(
      <>
        <ToggleButton>Filled</ToggleButton>
        <ToggleButton variant="ghost">Ghost</ToggleButton>
      </>
    );

    expect(
      getComputedStyle(screen.getByRole("button", { name: "Filled" }).element())
        .backgroundColor
    ).toBe(tokenColor("--terria-ds-neutral"));
    expect(
      getComputedStyle(screen.getByRole("button", { name: "Ghost" }).element())
        .backgroundColor
    ).toBe("rgba(0, 0, 0, 0)");
  });

  it.each([
    [32, "sm"],
    [36, "md"],
    [40, "lg"]
  ] as const)("is %ipx tall at size %s", async (height, size) => {
    const screen = await render(
      <ToggleButton size={size} isIconOnly aria-label="Bold">
        B
      </ToggleButton>
    );
    const rect = screen
      .getByRole("button", { name: "Bold" })
      .element()
      .getBoundingClientRect();

    expect(rect.height).toBe(height);
    // Icon-only buttons are square
    expect(rect.width).toBe(height);
  });

  it("can't be toggled when disabled", async () => {
    const screen = await render(<ToggleButton isDisabled>Labels</ToggleButton>);
    const button = screen.getByRole("button", { name: "Labels" });

    await expect.element(button).toBeDisabled();
    await userEvent.click(button, { force: true });
    await expect.element(button).toHaveAttribute("aria-pressed", "false");
  });
});
