import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders as a primary, medium button by default", async () => {
    const screen = await render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    await expect.element(button).toHaveAttribute("data-tds-variant", "primary");
    await expect.element(button).toHaveAttribute("data-tds-size", "md");
  });

  it.each([
    "secondary",
    "tertiary",
    "outline",
    "ghost",
    "danger",
    "danger-soft"
  ] as const)("renders the %s variant", async (variant) => {
    const screen = await render(<Button variant={variant}>Save</Button>);

    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-tds-variant", variant);
  });

  it("marks icon-only buttons so they render square", async () => {
    const screen = await render(
      <Button isIconOnly aria-label="Settings">
        <svg />
      </Button>
    );

    await expect
      .element(screen.getByRole("button", { name: "Settings" }))
      .toHaveAttribute("data-tds-icon-only");
  });

  it("marks full-width buttons", async () => {
    const screen = await render(<Button fullWidth>Save</Button>);

    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-tds-full-width");
  });

  it("calls onPress when pressed", async () => {
    const onPress = vi.fn();
    const screen = await render(<Button onPress={onPress}>Save</Button>);

    await screen.getByRole("button").click();

    expect(onPress).toHaveBeenCalledOnce();
  });

  it("shows a labelled spinner and ignores presses while pending", async () => {
    const onPress = vi.fn();
    const screen = await render(
      <Button isPending pendingLabel="Saving" onPress={onPress}>
        Save
      </Button>
    );

    // A pending button takes no pointer events, so press it from the keyboard
    screen.getByRole("button").element().focus();
    await userEvent.keyboard("{Enter}");

    await expect
      .element(screen.getByRole("progressbar", { name: "Saving" }))
      .toBeInTheDocument();
    expect(onPress).not.toHaveBeenCalled();
  });
});
