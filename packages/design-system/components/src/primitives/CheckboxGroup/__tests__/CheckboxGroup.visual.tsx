import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { focusVisible, hover, snap } from "../../../visual";
import { Checkbox } from "../../Checkbox";
import { Description, FieldError, Label } from "../../Field";
import { CheckboxGroup, type CheckboxGroupProps } from "..";

const vertical = (props: CheckboxGroupProps = {}): React.ReactElement => (
  <CheckboxGroup {...props}>
    <Label>Interests</Label>
    <Description>Choose all that apply</Description>
    <Checkbox value="travel" description="Exploring new places and cultures">
      Travel
    </Checkbox>
    <Checkbox value="music" description="Music in its various forms">
      Music
    </Checkbox>
    <Checkbox value="food" description="Cooking, tasting and eating out">
      Food
    </Checkbox>
    <FieldError>Choose at least one interest</FieldError>
  </CheckboxGroup>
);

const horizontal = (props: CheckboxGroupProps = {}): React.ReactElement => (
  <CheckboxGroup orientation="horizontal" {...props}>
    <Label>Layers</Label>
    <Description>Shown on the map</Description>
    <Checkbox value="suburbs">Suburbs</Checkbox>
    <Checkbox value="roads">Roads</Checkbox>
    <Checkbox value="rivers">Rivers</Checkbox>
    <FieldError>Choose at least one layer</FieldError>
  </CheckboxGroup>
);

describe.each([
  ["vertical", vertical, "Music"],
  ["horizontal", horizontal, "Roads"]
] as const)("CheckboxGroup %s", (_, group, option) => {
  it("default", async () => {
    await render(group());
    await snap();
  });

  it("with an option selected", async () => {
    await render(group({ defaultValue: [option.toLowerCase()] }));
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
    const screen = await render(group());
    await focusVisible(screen.getByRole("checkbox", { name: option }));
    await expect
      .element(screen.getByText(option, { exact: true }))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("invalid", async () => {
    await render(group({ isInvalid: true }));
    await snap();
  });

  it("disabled", async () => {
    await render(
      group({ isDisabled: true, defaultValue: [option.toLowerCase()] })
    );
    await snap();
  });

  it("secondary", async () => {
    await render(group({ variant: "secondary" }));
    await snap();
  });
});
