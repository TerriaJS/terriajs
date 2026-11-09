import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { PlusIcon } from "@terria/design-system-icons";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Button, type ButtonVariant } from "../Button";

const VARIANTS: ButtonVariant[] = [
  "primary",
  "secondary",
  "tertiary",
  "outline",
  "ghost",
  "danger",
  "danger-soft"
];

describe.each(VARIANTS)("Button %s", (variant) => {
  it("default", async () => {
    await render(<Button variant={variant}>Save</Button>);
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(<Button variant={variant}>Save</Button>);
    await hover(screen.getByRole("button"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(<Button variant={variant}>Save</Button>);
    await focusVisible(screen.getByRole("button"));
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(<Button variant={variant}>Save</Button>);
    await focusVisible(screen.getByRole("button"));
    await hover(screen.getByRole("button"));
    await snap();
  });

  it("pressed", async () => {
    const screen = await render(<Button variant={variant}>Save</Button>);
    await press(screen.getByRole("button"));
    await snap();
  });

  it("disabled", async () => {
    await render(
      <Button variant={variant} isDisabled>
        Save
      </Button>
    );
    await snap();
  });

  it("pending", async () => {
    await render(
      <Button variant={variant} isPending pendingLabel="Saving">
        Save
      </Button>
    );
    await snap();
  });
});

describe("Button", () => {
  it.each(["sm", "md", "lg"] as const)("size %s", async (size) => {
    await render(<Button size={size}>Save</Button>);
    await snap();
  });

  it.each(["sm", "md", "lg"] as const)("icon only, size %s", async (size) => {
    await render(
      <Button size={size} isIconOnly aria-label="Add">
        <PlusIcon />
      </Button>
    );
    await snap();
  });

  it("with an icon", async () => {
    await render(
      <Button>
        <PlusIcon />
        Add layer
      </Button>
    );
    await snap();
  });
});
