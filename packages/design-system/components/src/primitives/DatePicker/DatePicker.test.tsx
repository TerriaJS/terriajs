import { CalendarDate, parseDate } from "@internationalized/date";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { DatePicker, type DatePickerProps } from ".";
import { Calendar } from "../Calendar";
import { DateField } from "../DateField";
import { FieldError, Label } from "../Field";

// The usual composition: a DateField group with the trigger in its suffix,
// and a Calendar in the popover
const datePicker = (
  props: Partial<DatePickerProps<CalendarDate>> = {}
): React.ReactElement => (
  <DatePicker {...props}>
    <Label>Survey date</Label>
    <DateField.Group fullWidth>
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
      <DateField.Suffix>
        <DatePicker.Trigger>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
      </DateField.Suffix>
    </DateField.Group>
    <FieldError>Enter a date</FieldError>
    <DatePicker.Popover>
      <Calendar aria-label="Survey date">
        <Calendar.Header>
          <Calendar.Heading />
          <Calendar.NavButton slot="previous" />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>
            {(date) => <Calendar.Cell date={date} />}
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    </DatePicker.Popover>
  </DatePicker>
);

describe("DatePicker", () => {
  it("is a date field with a button that opens a calendar", async () => {
    const screen = await render(
      datePicker({ defaultValue: parseDate("2025-12-16") })
    );

    await userEvent.click(screen.getByRole("button", { name: /Calendar/ }));

    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await expect
      .element(screen.getByRole("grid"))
      .toHaveAccessibleName(/December 2025/);
  });

  it("takes the day picked, and closes", async () => {
    const onChange = vi.fn();
    const screen = await render(
      datePicker({ defaultValue: parseDate("2025-12-16"), onChange })
    );

    await userEvent.click(screen.getByRole("button", { name: /Calendar/ }));
    await userEvent.click(screen.getByRole("button", { name: /December 3,/ }));

    expect(onChange).toHaveBeenCalledWith(new CalendarDate(2025, 12, 3));
    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("spinbutton", { name: /day/i }))
      .toHaveTextContent("3");
  });

  it("can be typed into, too", async () => {
    const onChange = vi.fn();
    const screen = await render(datePicker({ onChange }));

    await userEvent.click(screen.getByRole("spinbutton", { name: /month/i }));
    await userEvent.keyboard("12162025");

    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2025, 12, 16));
  });

  it("returns focus to its button when closed with the keyboard", async () => {
    const screen = await render(datePicker());
    const trigger = screen.getByRole("button", { name: /Calendar/ });

    await userEvent.click(trigger);
    await expect.element(screen.getByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");

    await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();
  });

  it("calls onOpenChange as it opens and closes", async () => {
    const onOpenChange = vi.fn();
    const screen = await render(datePicker({ onOpenChange }));

    await userEvent.click(screen.getByRole("button", { name: /Calendar/ }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("shows a calendar icon in its button by default", async () => {
    const screen = await render(datePicker());

    const indicator = screen
      .getByRole("button", { name: /Calendar/ })
      .element()
      .querySelector('[data-tds="date-picker-trigger-indicator"]');
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(indicator?.querySelector("svg")).not.toBeNull();
  });

  it("shows its error while invalid", async () => {
    const screen = await render(datePicker({ isInvalid: true }));

    await expect.element(screen.getByText("Enter a date")).toBeVisible();
  });
});
