import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Description, FieldError, Label } from "../../Field";
import { Radio, RadioPrimitive } from "../../Radio";
import { RadioGroup, type RadioGroupProps } from "..";

const renderGroup = (
  props: Partial<RadioGroupProps> = {}
): ReturnType<typeof render> =>
  render(
    <RadioGroup {...props}>
      <Label>Base map</Label>
      <Description>Drawn under every layer</Description>
      <Radio value="streets" description="Roads and place names">
        Streets
      </Radio>
      <Radio value="satellite">Satellite</Radio>
      <FieldError>Choose a base map</FieldError>
    </RadioGroup>
  );

// The fill the variant gives the circle; not its background, which hovering
// or a transition would change too
const circleFill = (screen: Awaited<ReturnType<typeof render>>): string => {
  const circle = screen.container.querySelector('[data-tds="radio-control"]');
  if (!circle) throw new Error("No circle");
  return getComputedStyle(circle).getPropertyValue("--_radio-bg");
};

describe("RadioGroup", () => {
  it("keeps its own variant inside anything secondary", async () => {
    const plain = await renderGroup();
    const expected = circleFill(plain);
    expect(expected).not.toBe("");
    await plain.unmount();

    const screen = await render(
      <div data-tds-variant="secondary">
        <RadioGroup aria-label="Base map">
          <Radio value="streets">Streets</Radio>
        </RadioGroup>
      </div>
    );

    expect(circleFill(screen)).toBe(expected);
  });

  it("is a radio group named by its label and described by its description", async () => {
    const screen = await renderGroup();

    await expect
      .element(screen.getByRole("radiogroup", { name: "Base map" }))
      .toHaveAccessibleDescription("Drawn under every layer");
  });

  it("describes each radio by its own description", async () => {
    const screen = await renderGroup();

    await expect
      .element(screen.getByRole("radio", { name: "Streets" }))
      .toHaveAccessibleDescription(/^Roads and place names/);
  });

  it("selects one radio at a time when its label is pressed", async () => {
    const onChange = vi.fn();
    const screen = await renderGroup({ onChange });

    await screen.getByText("Streets").click();
    await screen.getByText("Satellite").click();

    expect(onChange).toHaveBeenLastCalledWith("satellite");
    await expect
      .element(screen.getByRole("radio", { name: "Streets" }))
      .not.toBeChecked();
  });

  it("marks every radio invalid and shows its error while invalid", async () => {
    const screen = await renderGroup({ isInvalid: true });

    await expect
      .element(screen.getByRole("radiogroup", { name: "Base map" }))
      .toHaveAccessibleDescription(/Choose a base map/);
    await expect
      .element(screen.getByRole("radio", { name: "Satellite" }))
      .toBeInvalid();
  });

  it("keeps its description visible next to the error while invalid", async () => {
    const screen = await renderGroup({ isInvalid: true });

    await expect
      .element(screen.getByText("Drawn under every layer"))
      .toBeVisible();
  });

  it("disables every radio while disabled", async () => {
    const screen = await renderGroup({ isDisabled: true });

    await expect
      .element(screen.getByRole("radio", { name: "Satellite" }))
      .toBeDisabled();
  });

  it("lays its radios out in a row when horizontal", async () => {
    const screen = await renderGroup({ orientation: "horizontal" });

    await expect
      .element(screen.getByRole("radiogroup", { name: "Base map" }))
      .toHaveAttribute("aria-orientation", "horizontal");
  });
});

describe("RadioPrimitive", () => {
  it("draws custom indicator content in place of the dot", async () => {
    const screen = await render(
      <RadioGroup aria-label="Base map">
        <RadioPrimitive value="streets">
          <RadioPrimitive.Content>
            <RadioPrimitive.Control>
              <RadioPrimitive.Indicator>★</RadioPrimitive.Indicator>
            </RadioPrimitive.Control>
            <Label>Streets</Label>
          </RadioPrimitive.Content>
        </RadioPrimitive>
      </RadioGroup>
    );

    await expect.element(screen.getByText("★")).toBeInTheDocument();
    await expect
      .element(screen.getByRole("radio", { name: "Streets" }))
      .toBeInTheDocument();
  });
});
