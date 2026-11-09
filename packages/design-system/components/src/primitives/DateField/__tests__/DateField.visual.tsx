import { describe, it } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  parseDate,
  parseZonedDateTime,
  type CalendarDate
} from "@internationalized/date";
import { CalendarIcon } from "@terria/design-system-icons";
import { Description, FieldError, Label } from "../../Field";
import type { InputVariant } from "../../Input";
import { focusVisible, hover, snap } from "../../../visual";
import { DateField, type DateFieldProps } from "..";

const VARIANTS: InputVariant[] = ["primary", "secondary"];
const SURVEYED = parseDate("2025-12-16");

const field = (
  variant: InputVariant,
  props: DateFieldProps<CalendarDate> = {}
): React.ReactElement => (
  <DateField {...props}>
    <Label>Survey date</Label>
    <DateField.Group variant={variant}>
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
    </DateField.Group>
    <Description>When the survey was flown</Description>
    <FieldError>Enter a date</FieldError>
  </DateField>
);

describe.each(VARIANTS)("DateField %s", (variant) => {
  it("empty", async () => {
    await render(field(variant));
    await snap();
  });

  it("filled", async () => {
    await render(field(variant, { defaultValue: SURVEYED }));
    await snap();
  });

  it("hovered", async () => {
    const screen = await render(field(variant, { defaultValue: SURVEYED }));
    await hover(screen.getByRole("spinbutton", { name: /day/ }));
    await snap();
  });

  it("segment focused", async () => {
    const screen = await render(field(variant, { defaultValue: SURVEYED }));
    await focusVisible(screen.getByRole("spinbutton", { name: /day/ }));
    await snap();
  });

  it("empty segment focused", async () => {
    const screen = await render(field(variant));
    await focusVisible(screen.getByRole("spinbutton", { name: /month/ }));
    await snap();
  });

  it("invalid", async () => {
    await render(field(variant, { defaultValue: SURVEYED, isInvalid: true }));
    await snap();
  });

  it("invalid segment focused", async () => {
    const screen = await render(
      field(variant, { defaultValue: SURVEYED, isInvalid: true })
    );
    await focusVisible(screen.getByRole("spinbutton", { name: /day/ }));
    await snap();
  });

  it("disabled", async () => {
    await render(field(variant, { defaultValue: SURVEYED, isDisabled: true }));
    await snap();
  });
});

describe("DateField", () => {
  it("partly typed in", async () => {
    const screen = await render(field("primary"));
    await userEvent.click(screen.getByRole("spinbutton", { name: /month/ }));
    await userEvent.keyboard("12");
    await snap();
  });

  it("required", async () => {
    await render(field("primary", { isRequired: true }));
    await snap();
  });

  it("with time", async () => {
    await render(
      <DateField
        defaultValue={parseZonedDateTime(
          "2026-01-15T04:30:15[America/New_York]"
        )}
        granularity="second"
        hideTimeZone={false}
      >
        <Label>Captured</Label>
        <DateField.Group>
          <DateField.Input>
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateField.Suffix>
            <CalendarIcon />
          </DateField.Suffix>
        </DateField.Group>
      </DateField>
    );
    await snap();
  });
});
