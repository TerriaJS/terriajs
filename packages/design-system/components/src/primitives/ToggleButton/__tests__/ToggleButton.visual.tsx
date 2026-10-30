import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { StackFrontIcon } from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { ToggleButton, type ToggleButtonVariant } from "..";

const VARIANTS: ToggleButtonVariant[] = ["default", "ghost"];

const CASES = VARIANTS.flatMap((variant) =>
  (["off", "on"] as const).map((state) => [variant, state] as const)
);

describe.each(CASES)("ToggleButton %s %s", (variant, state) => {
  const toggle = (props: { isDisabled?: boolean } = {}): React.ReactElement => (
    <ToggleButton variant={variant} defaultSelected={state === "on"} {...props}>
      <StackFrontIcon />
      Layers
    </ToggleButton>
  );

  it("default", async () => {
    await render(toggle());
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(toggle());
    await hover(screen.getByRole("button"));
    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-hovered");
    await snap();
  });

  it("focused", async () => {
    const screen = await render(toggle());
    await focusVisible(screen.getByRole("button"));
    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(toggle());
    const button = screen.getByRole("button");
    await focusVisible(button);
    await hover(button);
    await expect.element(button).toHaveAttribute("data-focus-visible");
    await expect.element(button).toHaveAttribute("data-hovered");
    await snap();
  });

  it("pressed", async () => {
    const screen = await render(toggle());
    await press(screen.getByRole("button"));
    await expect
      .element(screen.getByRole("button"))
      .toHaveAttribute("data-pressed");
    await snap();
  });

  it("disabled", async () => {
    await render(toggle({ isDisabled: true }));
    await snap();
  });
});

describe("ToggleButton", () => {
  // md is the default, already shown
  it.each(["sm", "lg"] as const)("size %s", async (size) => {
    await render(
      <ToggleButton size={size}>
        <StackFrontIcon />
        Layers
      </ToggleButton>
    );
    await snap();
  });

  it.each(["off", "on"] as const)("icon only, %s", async (state) => {
    await render(
      <ToggleButton
        isIconOnly
        aria-label="Layers"
        defaultSelected={state === "on"}
      >
        <StackFrontIcon />
      </ToggleButton>
    );
    await snap();
  });

  it("text only", async () => {
    await render(<ToggleButton>Layers</ToggleButton>);
    await snap();
  });
});
