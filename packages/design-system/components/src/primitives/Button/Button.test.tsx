import type { CSSProperties } from "react";
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

  it.each(["ghost", "outline"] as const)(
    "blurs what's behind a %s button on hover, so its hover fill reads over busy content like a map",
    async (variant) => {
      const screen = await render(<Button variant={variant}>Upload</Button>);
      const button = screen.getByRole("button", { name: "Upload" });

      await userEvent.hover(button);

      await expect.element(button).toHaveAttribute("data-hovered", "true");
      // The blur fades in, so wait for the transition to end
      await expect
        .poll(() => getComputedStyle(button.element()).backdropFilter)
        .toMatch(/^blur\([1-9]/);
    }
  );

  // A nested backdrop-filter only sees the surface it's in, so the button
  // would go dark: surfaces that blur already turn the buttons' blur off
  it("doesn't blur inside a surface that blurs already, at rest or on hover", async () => {
    const screen = await render(
      <div style={{ "--terria-ds-button-backdrop": "none" } as CSSProperties}>
        <Button variant="secondary">Settings</Button>
        <Button variant="ghost">Upload</Button>
      </div>
    );
    const secondary = screen.getByRole("button", { name: "Settings" });
    const ghost = screen.getByRole("button", { name: "Upload" });

    expect(getComputedStyle(secondary.element()).backdropFilter).toBe("none");
    await userEvent.hover(ghost);
    await expect.element(ghost).toHaveAttribute("data-hovered", "true");
    expect(getComputedStyle(ghost.element()).backdropFilter).toBe("none");
  });

  it.each(["secondary", "ghost"] as const)(
    "keeps its resting background on keyboard focus (%s)",
    async (variant) => {
      const screen = await render(<Button variant={variant}>Save</Button>);
      const button = screen.getByRole("button", { name: "Save" }).element();
      const resting = getComputedStyle(button).backgroundColor;

      await userEvent.tab();

      await expect.element(button).toHaveAttribute("data-focus-visible");
      await expect
        .poll(() => getComputedStyle(button).backgroundColor)
        .toBe(resting);
    }
  );
});
