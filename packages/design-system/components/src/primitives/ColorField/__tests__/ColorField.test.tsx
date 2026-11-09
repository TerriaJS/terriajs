import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import type { Color } from "react-aria-components/ColorField";
import { ColorField, type ColorFieldProps } from "..";
import { ColorPicker } from "../../ColorPicker";
import { ColorSwatch } from "../../ColorSwatch";
import { FieldError, Label } from "../../Field";

// A colour field with its label, swatch and input
const colorField = (
  props: Partial<ColorFieldProps> = {}
): React.ReactElement => (
  <ColorField {...props}>
    <Label>Color</Label>
    <ColorField.Group>
      <ColorField.Swatch />
      <ColorField.Input />
    </ColorField.Group>
    <FieldError>Please enter a valid color</FieldError>
  </ColorField>
);

describe("ColorField", () => {
  it("is a textbox named by its label, with the colour as hex", async () => {
    const screen = await render(colorField({ defaultValue: "#0485f7" }));

    await expect
      .element(screen.getByRole("textbox", { name: "Color" }))
      .toHaveValue("#0485F7");
  });

  it("takes a colour typed in, as it's left, and shows it on its swatch", async () => {
    const onChange = vi.fn();
    const screen = await render(
      colorField({ defaultValue: "#0485f7", onChange })
    );
    const input = screen.getByRole("textbox", { name: "Color" });

    await userEvent.clear(input);
    await userEvent.type(input, "#ef4444");
    await userEvent.tab();

    const [color] = onChange.mock.calls.at(-1) as [Color];
    expect(color.toString("hex")).toBe("#EF4444");
    await expect.element(screen.getByRole("img")).toHaveAccessibleName(/red/i);
  });

  it("shows no colour on its swatch while empty", async () => {
    const screen = await render(colorField());

    const swatch = screen.getByRole("img").element();
    expect(getComputedStyle(swatch).backgroundImage).toContain(
      "rgba(0, 0, 0, 0)"
    );
  });

  it("shows its error while invalid", async () => {
    const screen = await render(colorField({ isInvalid: true }));

    await expect
      .element(screen.getByRole("textbox", { name: "Color" }))
      .toHaveAttribute("aria-invalid", "true");
    await expect
      .element(screen.getByText("Please enter a valid color"))
      .toBeVisible();
  });

  it("changes a ColorPicker's colour, and its swatch can open the picker", async () => {
    const screen = await render(
      <ColorPicker defaultValue="#0485f7">
        <ColorSwatch data-testid="picked" />
        <ColorField aria-label="Hex">
          <ColorField.Group>
            <ColorPicker.Trigger aria-label="Pick a colour">
              <ColorField.Swatch />
            </ColorPicker.Trigger>
            <ColorField.Input />
          </ColorField.Group>
        </ColorField>
        <ColorPicker.Popover>Picker</ColorPicker.Popover>
      </ColorPicker>
    );
    const input = screen.getByRole("textbox", { name: "Hex" });

    await userEvent.clear(input);
    await userEvent.type(input, "#10b981");
    await userEvent.tab();
    await expect
      .element(screen.getByTestId("picked"))
      .toHaveAccessibleName(/green/i);

    await userEvent.click(
      screen.getByRole("button", { name: /Pick a colour/ })
    );
    await expect.element(screen.getByRole("dialog")).toBeVisible();
  });
});
