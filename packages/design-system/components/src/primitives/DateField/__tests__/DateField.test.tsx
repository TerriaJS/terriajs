import { CalendarDate, parseDate } from "@internationalized/date";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { DateField, type DateFieldProps } from "..";
import { Description, FieldError, Label, TextField } from "../../Field";
import { Input } from "../../Input";

// A date field with its label, segments and messages
const dateField = (
  props: Partial<DateFieldProps<CalendarDate>> = {}
): React.ReactElement => (
  <DateField {...props}>
    <Label>Survey date</Label>
    <DateField.Group>
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
    </DateField.Group>
    <Description>When the survey was flown</Description>
    <FieldError>Enter a date</FieldError>
  </DateField>
);

describe("DateField", () => {
  it("has a spinbutton for each part of the date, named by its label", async () => {
    const screen = await render(dateField());

    for (const part of ["month", "day", "year"]) {
      await expect
        .element(
          screen.getByRole("spinbutton", {
            name: new RegExp(`${part}, Survey date`, "i")
          })
        )
        .toBeVisible();
    }
  });

  it("shows placeholders while empty", async () => {
    const screen = await render(dateField());

    await expect
      .element(screen.getByRole("spinbutton", { name: /month/i }))
      .toHaveTextContent("mm");
  });

  it("shows its value", async () => {
    const screen = await render(
      dateField({ defaultValue: parseDate("2025-12-16") })
    );

    await expect
      .element(screen.getByRole("spinbutton", { name: /day/i }))
      .toHaveTextContent("16");
  });

  it("takes a date typed in", async () => {
    const onChange = vi.fn();
    const screen = await render(dateField({ onChange }));

    await userEvent.click(screen.getByRole("spinbutton", { name: /month/i }));
    await userEvent.keyboard("12162025");

    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2025, 12, 16));
  });

  it("is marked by data-tds, its group as a field input group", async () => {
    const screen = await render(dateField());
    const segment = screen.getByRole("spinbutton", { name: /month/i });
    const field = segment.element().closest('[data-tds="date-field"]');

    expect(field).not.toBeNull();
    expect(segment.element()).toHaveAttribute("data-tds", "date-segment");
    expect(
      segment.element().closest('[data-tds="input-group"]')
    ).toHaveAttribute("data-tds-variant", "primary");
  });

  it("shows its error, not its description, while invalid", async () => {
    const screen = await render(dateField({ isInvalid: true }));

    await expect.element(screen.getByText("Enter a date")).toBeVisible();
    await expect
      .element(screen.getByText("When the survey was flown"))
      .not.toBeVisible();
    const box = screen
      .getByRole("spinbutton", { name: /month/i })
      .element()
      .closest('[data-tds="input-group"]');
    expect(box).toHaveAttribute("data-invalid");
  });

  it("can't be changed when disabled", async () => {
    const screen = await render(dateField({ isDisabled: true }));

    await expect
      .element(screen.getByRole("spinbutton", { name: /month/i }))
      .toHaveAttribute("aria-disabled", "true");
  });

  it("can fill its container", async () => {
    const screen = await render(dateField({ fullWidth: true }));
    const field = screen
      .getByRole("spinbutton", { name: /month/i })
      .element()
      .closest('[data-tds="date-field"]');

    expect(field).toHaveAttribute("data-tds-full-width");
  });

  it("holds a prefix and a suffix around its input", async () => {
    const screen = await render(
      <DateField aria-label="Survey date">
        <DateField.Group>
          <DateField.Prefix>From</DateField.Prefix>
          <DateField.Input>
            {(segment) => <DateField.Segment segment={segment} />}
          </DateField.Input>
          <DateField.Suffix>UTC</DateField.Suffix>
        </DateField.Group>
      </DateField>
    );

    await expect.element(screen.getByText("From")).toBeVisible();
    await expect.element(screen.getByText("UTC")).toBeVisible();
  });

  // React Aria follows the input with a hidden one for forms, so its end
  // isn't the group's last child
  it("pads its input evenly at both ends", async () => {
    const screen = await render(dateField());
    const input = screen
      .getByRole("spinbutton", { name: /month/i })
      .element()
      .closest('[data-tds="date-input"]');
    if (!input) throw new Error("No date input");
    const { paddingInlineStart, paddingInlineEnd } = getComputedStyle(input);

    expect(paddingInlineEnd).toBe(paddingInlineStart);
    expect(parseFloat(paddingInlineEnd)).toBeGreaterThan(0);
  });

  it("fills a full-width field, as a text input does", async () => {
    const screen = await render(
      <div style={{ inlineSize: 500 }}>
        <TextField aria-label="Name" fullWidth>
          <Input />
        </TextField>
        {dateField({ fullWidth: true })}
      </div>
    );
    const input = screen.getByRole("textbox", { name: "Name" }).element();
    const box = screen
      .getByRole("spinbutton", { name: /month/i })
      .element()
      .closest('[data-tds="input-group"]');

    expect(input.getBoundingClientRect().width).toBe(500);
    expect(box?.getBoundingClientRect().width).toBe(500);
  });
});
