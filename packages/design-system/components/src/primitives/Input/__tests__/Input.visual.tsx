import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { focusVisible, hover, snap } from "../../../visual";
import { Input, type InputVariant } from "../Input";

const VARIANTS: InputVariant[] = ["primary", "secondary"];

describe.each(VARIANTS)("Input %s", (variant) => {
  it("empty", async () => {
    await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        placeholder="Search layers"
      />
    );
    await snap();
  });

  it("filled", async () => {
    await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        defaultValue="Suburbs 2021"
      />
    );
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        placeholder="Search layers"
      />
    );
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        placeholder="Search layers"
      />
    );
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        placeholder="Search layers"
      />
    );
    await focusVisible(screen.getByRole("textbox"));
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("invalid", async () => {
    await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        defaultValue="Suburbs 2021"
        aria-invalid
      />
    );
    await snap();
  });

  it("invalid and focused", async () => {
    const screen = await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        defaultValue="Suburbs 2021"
        aria-invalid
      />
    );
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("disabled", async () => {
    await render(
      <Input
        variant={variant}
        aria-label="Layer name"
        defaultValue="Suburbs 2021"
        disabled
      />
    );
    await snap();
  });
});
