import { isWeekend, parseDate } from "@internationalized/date";
import { describe, expect, it } from "vitest";
import { userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import { focusVisible, hover, press, snap } from "../../../visual";
import { Calendar, type CalendarProps } from "..";

// Days with a dot under them, as in the design
const MARKED_DAYS = [2, 6, 27];

// January 2026, the 20th chosen; today is the 15th, as visual-setup fixes it
const calendar = (props: Partial<CalendarProps> = {}): React.ReactElement => (
  <Calendar
    aria-label="Survey date"
    defaultValue={parseDate("2026-01-20")}
    {...props}
  >
    <Calendar.Header>
      <Calendar.YearPickerTrigger>
        <Calendar.YearPickerTriggerHeading />
        <Calendar.YearPickerTriggerIndicator />
      </Calendar.YearPickerTrigger>
      <Calendar.NavButton slot="previous" />
      <Calendar.NavButton slot="next" />
    </Calendar.Header>
    <Calendar.Grid>
      <Calendar.GridHeader>
        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
      </Calendar.GridHeader>
      <Calendar.GridBody>
        {(date) => (
          <Calendar.Cell date={date}>
            {({ formattedDate, isOutsideMonth }) => (
              <>
                {formattedDate}
                {!isOutsideMonth && MARKED_DAYS.includes(date.day) && (
                  <Calendar.CellIndicator />
                )}
              </>
            )}
          </Calendar.Cell>
        )}
      </Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({ date }) => <Calendar.YearPickerCell date={date} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

const day = (
  screen: Awaited<ReturnType<typeof render>>,
  date: number
): Locator =>
  screen.getByRole("button", {
    name: new RegExp(`January ${String(date)}, 2026`)
  });

describe("Calendar", () => {
  it("default", async () => {
    await render(calendar());
    await snap();
  });

  it("nothing selected", async () => {
    await render(calendar({ defaultValue: null }));
    await snap();
  });

  it("day hovered", async () => {
    const screen = await render(calendar());
    await hover(day(screen, 13));
    await snap();
  });

  it("today hovered", async () => {
    const screen = await render(calendar());
    await hover(day(screen, 15));
    await snap();
  });

  it("selected day hovered", async () => {
    const screen = await render(calendar());
    await hover(day(screen, 20));
    await snap();
  });

  it("day focused", async () => {
    const screen = await render(calendar());
    const cell = day(screen, 13);
    await focusVisible(cell);
    await expect.element(cell).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("selected day focused", async () => {
    const screen = await render(calendar());
    const cell = day(screen, 20);
    await focusVisible(cell);
    await expect.element(cell).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("day pressed", async () => {
    const screen = await render(calendar());
    const cell = day(screen, 13);
    await press(cell);
    await expect.element(cell).toHaveAttribute("data-pressed");
    await snap();
  });

  it("selected day pressed", async () => {
    const screen = await render(calendar());
    const cell = day(screen, 20);
    await press(cell);
    await expect.element(cell).toHaveAttribute("data-pressed");
    await snap();
  });

  it("day selected by pressing", async () => {
    const screen = await render(calendar());
    const cell = day(screen, 13);
    await userEvent.click(cell);
    await expect.element(cell).toHaveAttribute("data-selected");
    await snap();
  });

  it("today selected", async () => {
    await render(calendar({ defaultValue: parseDate("2026-01-15") }));
    await snap();
  });

  it("unavailable and out of range", async () => {
    await render(
      calendar({
        minValue: parseDate("2026-01-06"),
        maxValue: parseDate("2026-01-28"),
        isDateUnavailable: (date) => isWeekend(date, "en-US")
      })
    );
    await snap();
  });

  it("unavailable day hovered", async () => {
    const screen = await render(
      calendar({ isDateUnavailable: (date) => isWeekend(date, "en-US") })
    );
    await hover(day(screen, 17));
    await snap();
  });

  it("disabled", async () => {
    await render(calendar({ isDisabled: true }));
    await snap();
  });

  it("read only", async () => {
    await render(calendar({ isReadOnly: true }));
    await snap();
  });

  // The year picker has a Next of its own, after the header's
  it("next month hovered", async () => {
    const screen = await render(calendar());
    await hover(screen.getByRole("button", { name: "Next" }).first());
    await snap();
  });

  it("next month pressed", async () => {
    const screen = await render(calendar());
    const next = screen.getByRole("button", { name: "Next" }).first();
    await press(next);
    await expect.element(next).toHaveAttribute("data-pressed");
    await snap();
  });

  it("next month focused", async () => {
    const screen = await render(calendar());
    const next = screen.getByRole("button", { name: "Next" }).first();
    await focusVisible(next);
    await expect.element(next).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("next month disabled", async () => {
    await render(calendar({ maxValue: parseDate("2026-01-31") }));
    await snap();
  });

  it("year picker trigger focused", async () => {
    const screen = await render(calendar());
    const trigger = screen.getByRole("button", { name: /year selector/ });
    await focusVisible(trigger);
    await expect.element(trigger).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("year picker open", async () => {
    const screen = await render(calendar());
    await userEvent.click(
      screen.getByRole("button", { name: /year selector/ })
    );
    await expect
      .element(screen.getByRole("button", { name: "2026", exact: true }))
      .toBeVisible();
    await snap();
  });

  it("year hovered", async () => {
    const screen = await render(calendar({ defaultYearPickerOpen: true }));
    const year = screen.getByRole("button", { name: "2027", exact: true });
    await hover(year);
    await snap();
  });

  it("year focused", async () => {
    const screen = await render(calendar({ defaultYearPickerOpen: true }));
    const year = screen.getByRole("button", { name: "2027", exact: true });
    await focusVisible(year);
    await expect.element(year).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("year chosen", async () => {
    const screen = await render(calendar({ defaultYearPickerOpen: true }));
    await userEvent.click(
      screen.getByRole("button", { name: "2027", exact: true })
    );
    await expect
      .element(screen.getByRole("button", { name: /year selector/ }))
      .not.toHaveAttribute("data-open");
    await snap();
  });
});
