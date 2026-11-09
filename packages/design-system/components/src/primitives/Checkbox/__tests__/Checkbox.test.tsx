import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { Description, FieldError, Label } from "../../Field";
import { Checkbox, CheckboxPrimitive, type CheckboxPrimitiveProps } from "..";

const renderCheckbox = (
  props: Partial<CheckboxPrimitiveProps> = {}
): ReturnType<typeof render> =>
  render(
    <CheckboxPrimitive {...props}>
      <CheckboxPrimitive.Content>
        <CheckboxPrimitive.Control>
          <CheckboxPrimitive.Indicator />
        </CheckboxPrimitive.Control>
        <Label>Show suburbs</Label>
      </CheckboxPrimitive.Content>
      <Description>Draws suburb boundaries</Description>
      <FieldError>Choose at least one layer</FieldError>
    </CheckboxPrimitive>
  );

describe("CheckboxPrimitive", () => {
  it("is a checkbox named by its label and described by its description", async () => {
    const screen = await renderCheckbox();

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .toHaveAccessibleDescription("Draws suburb boundaries");
  });

  it("checks and unchecks when its label is pressed", async () => {
    const screen = await renderCheckbox();
    const checkbox = screen.getByRole("checkbox", { name: "Show suburbs" });

    await screen.getByText("Show suburbs").click();
    await expect.element(checkbox).toBeChecked();

    await screen.getByText("Show suburbs").click();
    await expect.element(checkbox).not.toBeChecked();
  });

  it("animates the checkmark out when unchecked", async () => {
    const screen = await renderCheckbox({ defaultSelected: true });
    const checkmark = screen.container.querySelector(
      '[data-tds="checkbox-checkmark"]'
    );

    await screen.getByText("Show suburbs").click();

    expect(checkmark?.getAnimations()).not.toHaveLength(0);
  });

  it("is mixed while indeterminate", async () => {
    const screen = await renderCheckbox({ isIndeterminate: true });

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .toBePartiallyChecked();
  });

  it("shows its error while invalid", async () => {
    const screen = await renderCheckbox({ isInvalid: true });

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .toHaveAccessibleDescription(/Choose at least one layer/);
  });

  it("stays put while disabled", async () => {
    const screen = await renderCheckbox({ isDisabled: true });

    await screen.getByText("Show suburbs").click({ force: true });

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .not.toBeChecked();
  });
});

// React 18 drops `ref` from plain function components; each part forwards it
describe("CheckboxPrimitive refs", () => {
  it("reaches the control and indicator elements", async () => {
    const control = createRef<HTMLSpanElement>();
    const indicator = createRef<HTMLSpanElement>();
    await render(
      <CheckboxPrimitive>
        <CheckboxPrimitive.Content>
          <CheckboxPrimitive.Control ref={control}>
            <CheckboxPrimitive.Indicator ref={indicator} />
          </CheckboxPrimitive.Control>
          <Label>Show suburbs</Label>
        </CheckboxPrimitive.Content>
      </CheckboxPrimitive>
    );

    expect(control.current?.getAttribute("data-tds")).toBe("checkbox-control");
    expect(indicator.current?.getAttribute("data-tds")).toBe(
      "checkbox-indicator"
    );
  });
});

describe("Checkbox", () => {
  it("is named by its children and described by its description", async () => {
    const screen = await render(
      <Checkbox description="Draws suburb boundaries">Show suburbs</Checkbox>
    );

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .toHaveAccessibleDescription("Draws suburb boundaries");
  });

  it("checks when its label is pressed", async () => {
    const screen = await render(<Checkbox>Show suburbs</Checkbox>);

    await screen.getByText("Show suburbs").click();

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .toBeChecked();
  });

  it("shows its error message while invalid", async () => {
    const screen = await render(
      <Checkbox isInvalid errorMessage="Choose at least one layer">
        Show suburbs
      </Checkbox>
    );

    await expect
      .element(screen.getByRole("checkbox", { name: "Show suburbs" }))
      .toHaveAccessibleDescription("Choose at least one layer");
  });
});
