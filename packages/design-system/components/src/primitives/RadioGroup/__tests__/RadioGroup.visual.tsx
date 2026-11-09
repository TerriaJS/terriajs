import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { focusVisible, hover, snap } from "../../../visual";
import { Description, FieldError, Label } from "../../Field";
import { Radio } from "../../Radio";
import { RadioGroup, type RadioGroupProps } from "..";

const vertical = (props: RadioGroupProps = {}): React.ReactElement => (
  <RadioGroup {...props}>
    <Label>Base map</Label>
    <Description>Drawn under every layer</Description>
    <Radio value="streets" description="Roads and place names">
      Streets
    </Radio>
    <Radio value="satellite" description="Aerial imagery">
      Satellite
    </Radio>
    <Radio value="terrain" description="Elevation shading">
      Terrain
    </Radio>
    <FieldError>Choose a base map</FieldError>
  </RadioGroup>
);

const horizontal = (props: RadioGroupProps = {}): React.ReactElement => (
  <RadioGroup orientation="horizontal" {...props}>
    <Label>Units</Label>
    <Description>Used for distances and areas</Description>
    <Radio value="metric">Metric</Radio>
    <Radio value="imperial">Imperial</Radio>
    <Radio value="nautical">Nautical</Radio>
    <FieldError>Choose a unit</FieldError>
  </RadioGroup>
);

describe.each([
  ["vertical", vertical, "Satellite"],
  ["horizontal", horizontal, "Imperial"]
] as const)("RadioGroup %s", (_, group, option) => {
  const value = option.toLowerCase();

  it("default", async () => {
    await render(group());
    await snap();
  });

  it("with an option selected", async () => {
    await render(group({ defaultValue: value }));
    await snap();
  });

  it("with an option hovered", async () => {
    const screen = await render(group());
    const label = screen.getByText(option, { exact: true });
    await hover(label);
    await expect.element(label).toHaveAttribute("data-hovered");
    await snap();
  });

  it("with an option focused", async () => {
    const screen = await render(group({ defaultValue: value }));
    await focusVisible(screen.getByRole("radio", { name: option }));
    await expect
      .element(screen.getByText(option, { exact: true }))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("invalid", async () => {
    await render(group({ isInvalid: true, defaultValue: value }));
    await snap();
  });

  it("disabled", async () => {
    await render(group({ isDisabled: true, defaultValue: value }));
    await snap();
  });

  it("secondary", async () => {
    await render(group({ variant: "secondary", defaultValue: value }));
    await snap();
  });
});
