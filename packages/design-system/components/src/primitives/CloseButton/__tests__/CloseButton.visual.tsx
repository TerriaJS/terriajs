import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { MinusIcon } from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { CloseButton } from "..";

describe("CloseButton", () => {
  it("default", async () => {
    await render(<CloseButton />);
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(<CloseButton />);
    await hover(screen.getByRole("button"));
    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-hovered");
    await snap();
  });

  it("focused", async () => {
    const screen = await render(<CloseButton />);
    await focusVisible(screen.getByRole("button"));
    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("pressed", async () => {
    const screen = await render(<CloseButton />);
    await press(screen.getByRole("button"));
    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-pressed");
    await snap();
  });

  it("disabled", async () => {
    await render(<CloseButton isDisabled />);
    await snap();
  });

  it("with a custom icon", async () => {
    await render(
      <CloseButton aria-label="Minimise">
        <MinusIcon />
      </CloseButton>
    );
    await snap();
  });
});
