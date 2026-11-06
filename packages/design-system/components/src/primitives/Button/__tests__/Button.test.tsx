import type { CSSProperties } from "react";
import { describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Button } from "../Button";

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

  // As the design has them: a nested blur, in a panel that blurs already,
  // would only see the panel and draw a disc behind the button
  it.each(["ghost", "outline"] as const)(
    "doesn't blur what's behind the %s button, at rest or on hover",
    async (variant) => {
      const screen = await render(<Button variant={variant}>Upload</Button>);
      const button = screen.getByRole("button", { name: "Upload" });
      expect(getComputedStyle(button.element()).backdropFilter).toBe("none");

      await userEvent.hover(button);

      await expect.element(button).toHaveAttribute("data-hovered", "true");
      expect(getComputedStyle(button.element()).backdropFilter).toBe("none");
    }
  );

  it("doesn't look pressable under the pointer while pending", async () => {
    const screen = await render(<Button isPending>Save</Button>);
    const button = screen.getByRole("button");
    const atRest = getComputedStyle(button.element()).backgroundColor;

    await userEvent.hover(button);

    expect(button.element()).not.toHaveAttribute("data-hovered");
    expect(getComputedStyle(button.element()).backgroundColor).toBe(atRest);
  });

  // A nested backdrop-filter only sees the surface it's in, so the button
  // would go dark: surfaces that blur already turn the buttons' blur off
  it("doesn't blur inside a surface that blurs already, at rest or on hover", async () => {
    const screen = await render(
      <div style={{ "--terria-ds-button-backdrop": "none" } as CSSProperties}>
        <Button variant="secondary">Settings</Button>
        <Button variant="tertiary">Upload</Button>
      </div>
    );
    const secondary = screen.getByRole("button", { name: "Settings" });
    const tertiary = screen.getByRole("button", { name: "Upload" });

    expect(getComputedStyle(secondary.element()).backdropFilter).toBe("none");
    await userEvent.hover(tertiary);
    await expect.element(tertiary).toHaveAttribute("data-hovered", "true");
    expect(getComputedStyle(tertiary.element()).backdropFilter).toBe("none");
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
