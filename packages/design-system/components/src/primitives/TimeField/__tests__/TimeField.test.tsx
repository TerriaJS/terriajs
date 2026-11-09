import { Time, parseTime } from "@internationalized/date";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { TimeField, type TimeFieldProps } from "..";
import { FieldError, Label } from "../../Field";

// A time field with its label, segments and error
const timeField = (
  props: Partial<TimeFieldProps<Time>> = {}
): React.ReactElement => (
  <TimeField {...props}>
    <Label>Capture time</Label>
    <TimeField.Group>
      <TimeField.Input>
        {(segment) => <TimeField.Segment segment={segment} />}
      </TimeField.Input>
    </TimeField.Group>
    <FieldError>Enter a time</FieldError>
  </TimeField>
);

describe("TimeField", () => {
  it("has a spinbutton for the hour, minute and AM/PM, named by its label", async () => {
    const screen = await render(timeField());

    for (const part of ["hour", "minute", "AM/PM"]) {
      await expect
        .element(
          screen.getByRole("spinbutton", {
            name: new RegExp(`${part}, Capture time`, "i")
          })
        )
        .toBeVisible();
    }
  });

  it("shows its value", async () => {
    const screen = await render(
      timeField({ defaultValue: parseTime("10:30") })
    );

    await expect
      .element(screen.getByRole("spinbutton", { name: /minute/i }))
      .toHaveTextContent("30");
  });

  it("takes a time typed in", async () => {
    const onChange = vi.fn();
    const screen = await render(timeField({ onChange }));

    await userEvent.click(screen.getByRole("spinbutton", { name: /hour/i }));
    await userEvent.keyboard("1030p");

    expect(onChange).toHaveBeenLastCalledWith(new Time(22, 30));
  });

  it("is marked by data-tds, and can fill its container", async () => {
    const screen = await render(timeField({ fullWidth: true }));
    const field = screen
      .getByRole("spinbutton", { name: /hour/i })
      .element()
      .closest('[data-tds="time-field"]');

    expect(field).toHaveAttribute("data-tds-full-width");
  });

  it("shows its error while invalid", async () => {
    const screen = await render(timeField({ isInvalid: true }));

    await expect.element(screen.getByText("Enter a time")).toBeVisible();
  });
});
