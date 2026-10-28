import { describe, expect, it, vi } from "vitest";
import { render, type RenderResult } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { NumberField, type NumberFieldProps } from "..";
import { Description, FieldError, Label } from "../../Field";

const renderField = (props: NumberFieldProps = {}): Promise<RenderResult> =>
  render(
    <NumberField {...props}>
      <Label>Amount</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      <Description>How many to order</Description>
      <FieldError>Only 10 left in stock</FieldError>
    </NumberField>
  );

describe("NumberField width", () => {
  it("hugs its group, or fills its container with fullWidth", async () => {
    const field = (fullWidth: boolean): React.ReactElement => (
      <NumberField aria-label="Amount" fullWidth={fullWidth}>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>
    );
    const screen = await render(
      <div style={{ inlineSize: 600 }}>
        {field(false)}
        {field(true)}
      </div>
    );

    const [hug, fill] = [
      ...screen.container.querySelectorAll('[data-tds="number-field"]')
    ].map((element) => element.getBoundingClientRect().width);
    expect(hug).toBeLessThan(600);
    expect(fill).toBe(600);
  });
});

describe("NumberField", () => {
  it("labels its input and describes it", async () => {
    const screen = await renderField();

    const input = screen.getByRole("textbox", { name: "Amount" });
    await expect
      .element(input)
      .toHaveAccessibleDescription("How many to order");
  });

  it("steps the value with its buttons", async () => {
    const onChange = vi.fn();
    const screen = await renderField({ defaultValue: 5, onChange });

    await userEvent.click(screen.getByRole("button", { name: /^Increase/ }));
    expect(onChange).toHaveBeenLastCalledWith(6);

    await userEvent.click(screen.getByRole("button", { name: /^Decrease/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Decrease/ }));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it("steps with the arrow keys", async () => {
    const screen = await renderField({ defaultValue: 1 });

    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.keyboard("{ArrowUp}");

    await expect.element(screen.getByRole("textbox")).toHaveValue("2");
  });

  it("disables the button that would pass a limit", async () => {
    const screen = await renderField({ defaultValue: 0, minValue: 0 });

    await expect
      .element(screen.getByRole("button", { name: /^Decrease/ }))
      .toBeDisabled();
    await expect
      .element(screen.getByRole("button", { name: /^Increase/ }))
      .toBeEnabled();
  });

  it("formats the value", async () => {
    const screen = await renderField({
      defaultValue: 12.5,
      formatOptions: { style: "currency", currency: "AUD" }
    });

    await expect.element(screen.getByRole("textbox")).toHaveValue("A$12.50");
  });

  it("shows the error in place of the description while invalid", async () => {
    const screen = await renderField({ defaultValue: 100, isInvalid: true });

    await expect
      .element(screen.getByText("Only 10 left in stock"))
      .toBeVisible();
    await expect
      .element(screen.getByText("How many to order"))
      .not.toBeVisible();
    const group = screen.container.querySelector('[data-tds="input-group"]');
    expect(group?.hasAttribute("data-invalid")).toBe(true);
  });

  it("divides its buttons from the input", async () => {
    const screen = await renderField();

    const group = screen.container.querySelector('[data-tds="input-group"]');
    expect(group?.hasAttribute("data-tds-divided")).toBe(true);
  });

  it("draws minus and plus unless given other content", async () => {
    const screen = await render(
      <NumberField aria-label="Zoom">
        <NumberField.Group>
          <NumberField.DecrementButton>Out</NumberField.DecrementButton>
          <NumberField.Input />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>
    );

    await expect
      .element(screen.getByRole("button", { name: /^Decrease/ }))
      .toHaveTextContent("Out");
    expect(
      screen
        .getByRole("button", { name: /^Increase/ })
        .element()
        .querySelector("svg")
    ).not.toBeNull();
  });
});
