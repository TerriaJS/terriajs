import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { focusVisible, hover, snap } from "../../../visual";
import { Label } from "../../Field";
import { RadioGroup, type RadioGroupVariant } from "../../RadioGroup";
import { Radio, RadioPrimitive } from "..";

// Secondary only changes the unselected circle
const CASES: [RadioGroupVariant, "unselected" | "selected"][] = [
  ["primary", "unselected"],
  ["primary", "selected"],
  ["secondary", "unselected"]
];

// A radio only renders in a group, which holds its selection
describe.each(CASES)("Radio %s %s", (variant, selection) => {
  const radio = (
    props: { isDisabled?: boolean; isInvalid?: boolean } = {}
  ): React.ReactElement => (
    <RadioGroup
      aria-label="Base map"
      variant={variant}
      defaultValue={selection === "selected" ? "satellite" : null}
      isInvalid={props.isInvalid}
    >
      <Radio value="satellite" isDisabled={props.isDisabled}>
        Satellite
      </Radio>
    </RadioGroup>
  );

  it("default", async () => {
    await render(radio());
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(radio());
    const label = screen.getByText("Satellite");
    await hover(label);
    await expect.element(label).toHaveAttribute("data-hovered");
    await snap();
  });

  it("focused", async () => {
    const screen = await render(radio());
    await focusVisible(screen.getByRole("radio"));
    await expect
      .element(screen.getByText("Satellite"))
      .toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("hovered and focused", async () => {
    const screen = await render(radio());
    const label = screen.getByText("Satellite");
    await focusVisible(screen.getByRole("radio"));
    await hover(label);
    await expect.element(label).toHaveAttribute("data-focus-visible");
    await expect.element(label).toHaveAttribute("data-hovered");
    await snap();
  });

  it("disabled", async () => {
    await render(radio({ isDisabled: true }));
    await snap();
  });

  it("invalid", async () => {
    await render(radio({ isInvalid: true }));
    await snap();
  });
});

describe("Radio", () => {
  it("with a description", async () => {
    await render(
      <RadioGroup aria-label="Base map">
        <Radio value="satellite" description="Aerial imagery">
          Satellite
        </Radio>
      </RadioGroup>
    );
    await snap();
  });

  it("primitive with a custom indicator", async () => {
    await render(
      <RadioGroup aria-label="Labels" defaultValue="on">
        <RadioPrimitive value="on">
          <RadioPrimitive.Content>
            <RadioPrimitive.Control>
              <RadioPrimitive.Indicator>✓</RadioPrimitive.Indicator>
            </RadioPrimitive.Control>
            <Label>Show</Label>
          </RadioPrimitive.Content>
        </RadioPrimitive>
        <RadioPrimitive value="off">
          <RadioPrimitive.Content>
            <RadioPrimitive.Control>
              <RadioPrimitive.Indicator />
            </RadioPrimitive.Control>
            <Label>Hide</Label>
          </RadioPrimitive.Content>
        </RadioPrimitive>
      </RadioGroup>
    );
    await snap();
  });
});
