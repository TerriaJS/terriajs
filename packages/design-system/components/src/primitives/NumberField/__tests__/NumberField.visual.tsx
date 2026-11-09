import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { ZoomIcon, ZoomOutIcon } from "@terria/design-system-icons";
import { Description, FieldError, Label } from "../../Field";
import type { InputVariant } from "../../Input";
import { focusVisible, hover, press, snap } from "../../../visual";
import { NumberField, type NumberFieldProps } from "..";

const VARIANTS: InputVariant[] = ["primary", "secondary"];

const amount = (
  variant: InputVariant,
  props: NumberFieldProps = {}
): React.ReactElement => (
  <NumberField defaultValue={1} minValue={0} {...props}>
    <Label>Amount</Label>
    <NumberField.Group variant={variant}>
      <NumberField.DecrementButton />
      <NumberField.Input />
      <NumberField.IncrementButton />
    </NumberField.Group>
    <Description>Description text</Description>
    <FieldError>Only 10 left in stock</FieldError>
  </NumberField>
);

describe.each(VARIANTS)("NumberField %s", (variant) => {
  it("default", async () => {
    await render(amount(variant));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(amount(variant));
    await hover(screen.getByRole("textbox"));
    await snap();
  });

  it("focused", async () => {
    const screen = await render(amount(variant));
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("increment button hovered", async () => {
    const screen = await render(amount(variant));
    await hover(screen.getByRole("button", { name: /Increase/ }));
    await snap();
  });

  // Held, the button steps again and again: a value the field controls,
  // with no onChange, stays put
  it("increment button pressed", async () => {
    const screen = await render(amount(variant, { value: 1 }));
    await press(screen.getByRole("button", { name: /Increase/ }));
    await snap();
  });

  it("at its maximum", async () => {
    await render(amount(variant, { defaultValue: 10, maxValue: 10 }));
    await snap();
  });

  it("invalid", async () => {
    await render(amount(variant, { defaultValue: 100, isInvalid: true }));
    await snap();
  });

  it("invalid and focused", async () => {
    const screen = await render(
      amount(variant, { defaultValue: 100, isInvalid: true })
    );
    await focusVisible(screen.getByRole("textbox"));
    await snap();
  });

  it("disabled", async () => {
    await render(amount(variant, { isDisabled: true }));
    await snap();
  });
});

describe("NumberField", () => {
  it("formatted as a percentage", async () => {
    await render(
      amount("primary", {
        defaultValue: 0.25,
        step: 0.05,
        maxValue: 1,
        formatOptions: { style: "percent" }
      })
    );
    await snap();
  });

  it("custom icons", async () => {
    await render(
      <NumberField defaultValue={10} minValue={1} maxValue={20}>
        <Label>Zoom level</Label>
        <NumberField.Group>
          <NumberField.DecrementButton>
            <ZoomOutIcon aria-hidden size={16} />
          </NumberField.DecrementButton>
          <NumberField.Input />
          <NumberField.IncrementButton>
            <ZoomIcon aria-hidden size={16} />
          </NumberField.IncrementButton>
        </NumberField.Group>
      </NumberField>
    );
    await snap();
  });

  it("buttons after", async () => {
    await render(
      <NumberField defaultValue={1} minValue={0}>
        <Label>Opacity</Label>
        <NumberField.Group>
          <NumberField.Input />
          <NumberField.DecrementButton />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>
    );
    await snap();
  });
});
