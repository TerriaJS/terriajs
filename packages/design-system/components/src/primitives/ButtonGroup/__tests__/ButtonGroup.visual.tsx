import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import {
  LineIcon,
  MinusIcon,
  PlusIcon,
  PolygonIcon,
  ShapeIcon
} from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Button, type ButtonVariant } from "../../Button";
import { ButtonGroup, type ButtonGroupProps } from "..";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
  "danger-soft"
];

const periods = (
  props: Omit<ButtonGroupProps, "children"> = {}
): React.ReactElement => (
  <ButtonGroup aria-label="Period" variant="secondary" {...props}>
    <Button>Day</Button>
    <ButtonGroup.Separator />
    <Button>Week</Button>
    <ButtonGroup.Separator />
    <Button>Month</Button>
  </ButtonGroup>
);

describe("ButtonGroup", () => {
  it.each(VARIANTS)("%s", async (variant) => {
    await render(periods({ variant }));
    await snap();
  });

  // md is the default, already shown
  it.each(["sm", "lg"] as const)("size %s", async (size) => {
    await render(periods({ size }));
    await snap();
  });

  it("with a button hovered", async () => {
    const screen = await render(periods());
    const button = screen.getByRole("button", { name: "Week" });
    await hover(button);
    await expect.element(button).toHaveAttribute("data-hovered");
    await snap();
  });

  it("with a button focused", async () => {
    const screen = await render(periods());
    const button = screen.getByRole("button", { name: "Week" });
    await focusVisible(button);
    await expect.element(button).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("with a button pressed", async () => {
    const screen = await render(periods());
    const button = screen.getByRole("button", { name: "Week" });
    await press(button);
    await expect.element(button).toHaveAttribute("data-pressed");
    await snap();
  });

  it("outline, with a button focused", async () => {
    const screen = await render(periods({ variant: "outline" }));
    const button = screen.getByRole("button", { name: "Week" });
    await focusVisible(button);
    await expect.element(button).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("disabled", async () => {
    await render(periods({ isDisabled: true }));
    await snap();
  });

  it("icon toolbar", async () => {
    await render(
      <ButtonGroup aria-label="Drawing tools" variant="secondary">
        <Button isIconOnly aria-label="Draw a line">
          <LineIcon size={16} />
        </Button>
        <ButtonGroup.Separator />
        <Button isIconOnly aria-label="Draw a polygon">
          <PolygonIcon size={16} />
        </Button>
        <ButtonGroup.Separator />
        <Button isIconOnly aria-label="Draw a shape">
          <ShapeIcon size={16} />
        </Button>
      </ButtonGroup>
    );
    await snap();
  });

  it.each(["secondary", "outline"] as const)(
    "vertical, %s",
    async (variant) => {
      await render(
        <ButtonGroup aria-label="Zoom" orientation="vertical" variant={variant}>
          <Button isIconOnly aria-label="Zoom in">
            <PlusIcon size={16} />
          </Button>
          <ButtonGroup.Separator />
          <Button isIconOnly aria-label="Zoom out">
            <MinusIcon size={16} />
          </Button>
        </ButtonGroup>
      );
      await snap();
    }
  );
});
