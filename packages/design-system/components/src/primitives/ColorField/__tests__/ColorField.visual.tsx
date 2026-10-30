import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { ColorPicker } from "../../ColorPicker";
import { Description, FieldError, Label } from "../../Field";
import type { InputVariant } from "../../Input";
import { focusVisible, hover, snap } from "../../../visual";
import { ColorField, type ColorFieldProps } from "..";

const VARIANTS: InputVariant[] = ["primary", "secondary"];

const field = (
  variant: InputVariant,
  props: ColorFieldProps = {}
): React.ReactElement => (
  <ColorField defaultValue="#0485f7" {...props}>
    <Label>Color</Label>
    <ColorField.Group variant={variant}>
      <ColorField.Swatch />
      <ColorField.Input placeholder="#" />
    </ColorField.Group>
    <Description>How your brand looks</Description>
    <FieldError>Please enter a valid color</FieldError>
  </ColorField>
);

const withPicker = (): React.ReactElement => (
  <ColorPicker defaultValue="#0485f7">
    <ColorField>
      <Label>Color</Label>
      <ColorField.Group>
        <ColorPicker.Trigger aria-label="Pick a colour">
          <ColorField.Swatch />
        </ColorPicker.Trigger>
        <ColorField.Input placeholder="#" />
      </ColorField.Group>
    </ColorField>
  </ColorPicker>
);

describe.each(VARIANTS)("ColorField %s", (variant) => {
  it("default", async () => {
    await render(field(variant));
    await snap();
  });

  it("empty", async () => {
    await render(field(variant, { defaultValue: undefined }));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(field(variant));
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(field(variant));
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("invalid", async () => {
    await render(field(variant, { isInvalid: true }));
    await snap();
  });

  it("invalid and focused", async () => {
    const screen = await render(field(variant, { isInvalid: true }));
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("disabled", async () => {
    await render(field(variant, { isDisabled: true }));
    await snap();
  });
});

describe("ColorField", () => {
  it("a colour typed in", async () => {
    const screen = await render(field("primary", { defaultValue: undefined }));
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "e5484d");
    await userEvent.tab();
    await expect.element(input).toHaveValue("#E5484D");
    await snap();
  });

  it("with a picker trigger", async () => {
    await render(withPicker());
    await snap();
  });

  it("picker trigger focused", async () => {
    const screen = await render(withPicker());
    await focusVisible(screen.getByRole("button", { name: "Pick a colour" }));
    await snap();
  });
});
