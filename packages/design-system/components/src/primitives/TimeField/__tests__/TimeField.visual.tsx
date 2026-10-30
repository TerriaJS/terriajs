import { describe, it } from "vitest";
import { render } from "vitest-browser-react";
import { parseTime, type Time } from "@internationalized/date";
import { Description, FieldError, Label } from "../../Field";
import type { InputVariant } from "../../Input";
import { focusVisible, hover, snap } from "../../../visual";
import { TimeField, type TimeFieldProps } from "..";

const VARIANTS: InputVariant[] = ["primary", "secondary"];
const MORNING = parseTime("10:30");

const field = (
  variant: InputVariant,
  props: TimeFieldProps<Time> = {}
): React.ReactElement => (
  <TimeField {...props}>
    <Label>Capture time</Label>
    <TimeField.Group variant={variant}>
      <TimeField.Input>
        {(segment) => <TimeField.Segment segment={segment} />}
      </TimeField.Input>
    </TimeField.Group>
    <Description>Local time at the sensor</Description>
    <FieldError>Enter a time</FieldError>
  </TimeField>
);

describe.each(VARIANTS)("TimeField %s", (variant) => {
  it("empty", async () => {
    await render(field(variant));
    await snap();
  });

  it("filled", async () => {
    await render(field(variant, { defaultValue: MORNING }));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(field(variant, { defaultValue: MORNING }));
    await hover(screen.getByRole("spinbutton", { name: /hour/ }));
    await snap();
  });

  it("segment focused", async () => {
    const screen = await render(field(variant, { defaultValue: MORNING }));
    await focusVisible(screen.getByRole("spinbutton", { name: /minute/ }));
    await snap();
  });

  it("invalid", async () => {
    await render(field(variant, { defaultValue: MORNING, isInvalid: true }));
    await snap();
  });

  it("invalid segment focused", async () => {
    const screen = await render(
      field(variant, { defaultValue: MORNING, isInvalid: true })
    );
    await focusVisible(screen.getByRole("spinbutton", { name: /minute/ }));
    await snap();
  });

  it("disabled", async () => {
    await render(field(variant, { defaultValue: MORNING, isDisabled: true }));
    await snap();
  });
});

describe("TimeField", () => {
  it("24-hour with seconds", async () => {
    await render(
      field("primary", {
        defaultValue: parseTime("22:30:15"),
        granularity: "second",
        hourCycle: 24
      })
    );
    await snap();
  });
});
