import {
  CalendarDate,
  GregorianCalendar,
  parseDate,
  toCalendar
} from "@internationalized/date";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "react-aria-components/I18nProvider";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { Calendar, type CalendarProps } from "..";

// The usual composition: a heading that opens the year picker, the arrows,
// the day grid and the year grid
const calendar = (props: Partial<CalendarProps> = {}): React.ReactElement => (
  <Calendar aria-label="Survey date" {...props}>
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
        {(date) => <Calendar.Cell date={date} />}
      </Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({ date }) => <Calendar.YearPickerCell date={date} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

const DECEMBER_16 = parseDate("2025-12-16");

describe("Calendar", () => {
  it("shows the month of its value as a grid of days", async () => {
    const screen = await render(calendar({ defaultValue: DECEMBER_16 }));

    await expect
      .element(screen.getByRole("grid"))
      .toHaveAccessibleName(/December 2025/);
    await expect
      .element(screen.getByRole("button", { name: /December 16, 2025/ }))
      .toHaveAttribute("data-selected");
  });

  it("selects a day pressed", async () => {
    const onChange = vi.fn();
    const screen = await render(
      calendar({ defaultFocusedValue: DECEMBER_16, onChange })
    );

    await userEvent.click(screen.getByRole("button", { name: /December 3,/ }));

    expect(onChange).toHaveBeenCalledWith(new CalendarDate(2025, 12, 3));
  });

  it("moves a month at a time with its arrows", async () => {
    const screen = await render(calendar({ defaultValue: DECEMBER_16 }));
    // React Aria adds hidden ones of the same name for screen readers
    const next = screen.getByRole("button", { name: "Next" }).first();
    const previous = screen.getByRole("button", { name: "Previous" }).first();

    await userEvent.click(next);
    await expect
      .element(screen.getByRole("grid"))
      .toHaveAccessibleName(/January 2026/);

    await userEvent.click(previous);
    await userEvent.click(previous);
    await expect
      .element(screen.getByRole("grid"))
      .toHaveAccessibleName(/November 2025/);
  });

  it("marks today", async () => {
    const screen = await render(calendar());

    // Only today's name starts so; the same day of the month either side
    // can be in view too
    const cell = screen.getByRole("button", { name: /^Today, / });
    await expect.element(cell).toHaveAttribute("data-today");
  });

  it("disables days outside its range, and marks unavailable ones", async () => {
    const screen = await render(
      calendar({
        defaultFocusedValue: DECEMBER_16,
        minValue: parseDate("2025-12-05"),
        isDateUnavailable: (date) => date.day === 20
      })
    );

    await expect
      .element(screen.getByRole("button", { name: /December 4,/ }))
      .toHaveAttribute("data-disabled");
    await expect
      .element(screen.getByRole("button", { name: /December 20,/ }))
      .toHaveAttribute("data-unavailable");
  });

  it("opens its year picker from the heading, and moves to a year chosen", async () => {
    const screen = await render(calendar({ defaultValue: DECEMBER_16 }));
    const trigger = screen.getByRole("button", { name: /year selector/ });

    await userEvent.click(trigger);
    await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
    await expect
      .element(screen.getByRole("group", { name: "year" }))
      .toHaveAttribute("data-open");

    await userEvent.click(screen.getByRole("button", { name: "2030" }));

    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
    await expect
      .element(screen.getByRole("grid"))
      .toHaveAccessibleName(/December 2030/);
  });

  it("tells apart years of different eras with the same number", async () => {
    const onFocusChange = vi.fn();
    const screen = await render(
      <I18nProvider locale="ja-JP-u-ca-japanese">
        {calendar({
          defaultFocusedValue: new CalendarDate(2023, 6, 15),
          onFocusChange
        })}
      </I18nProvider>
    );

    await userEvent.click(
      screen.getByRole("button", { name: /year selector/ })
    );

    // Reiwa 5 alone, not Taisho, Showa and Heisei 5 with it
    const cells = screen.container.querySelectorAll(
      '[data-tds="calendar-year-picker-cell"][data-selected]'
    );
    expect(cells).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: /^平成5年$/ }));

    const chosen = onFocusChange.mock.lastCall?.[0] as CalendarDate;
    expect(toCalendar(chosen, new GregorianCalendar()).year).toBe(1993);
  });

  it("closes its year picker on Escape", async () => {
    const screen = await render(calendar({ defaultValue: DECEMBER_16 }));
    const trigger = screen.getByRole("button", { name: /year selector/ });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    await expect.element(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("offers the years 1900 to 2099 by default", async () => {
    const screen = await render(calendar({ defaultValue: DECEMBER_16 }));

    await userEvent.click(
      screen.getByRole("button", { name: /year selector/ })
    );

    const years = screen
      .getByRole("group", { name: "year" })
      .getByRole("button");
    expect(years.elements()).toHaveLength(200);
    await expect.element(years.first()).toHaveTextContent("1900");
    await expect.element(years.last()).toHaveTextContent("2099");
  });

  it("offers the same years in the locale's own calendar", async () => {
    // Persian: 1900 AD falls in 1278 AP, and 2099 AD in 1478 AP
    const screen = await render(
      <I18nProvider locale="fa-IR-u-nu-latn">
        {calendar({ defaultValue: DECEMBER_16 })}
      </I18nProvider>
    );

    await userEvent.click(
      screen.getByRole("button", { name: /year selector/ })
    );

    const years = screen.getByRole("group").getByRole("button");
    await expect.element(years.first()).toHaveTextContent("1278");
    await expect.element(years.last()).toHaveTextContent("1478");
  });

  it("can open its year picker controlled", async () => {
    const onYearPickerOpenChange = vi.fn();
    const screen = await render(
      calendar({ isYearPickerOpen: true, onYearPickerOpenChange })
    );

    await expect
      .element(screen.getByRole("group", { name: "year" }))
      .toHaveAttribute("data-open");
    await userEvent.click(
      screen.getByRole("button", { name: /year selector/ })
    );
    expect(onYearPickerOpenChange).toHaveBeenCalledWith(false);
  });

  it("holds a dot under a day, hidden from assistive tech", async () => {
    const screen = await render(
      <Calendar aria-label="Survey date" defaultFocusedValue={DECEMBER_16}>
        <Calendar.Grid>
          <Calendar.GridBody>
            {(date) => (
              <Calendar.Cell date={date}>
                {({ formattedDate }) => (
                  <>
                    {formattedDate}
                    {date.day === 2 && <Calendar.CellIndicator />}
                  </>
                )}
              </Calendar.Cell>
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    );

    const dot = screen
      .getByRole("button", { name: /December 2,/ })
      .element()
      .querySelector('[data-tds="calendar-cell-indicator"]');
    expect(dot).toHaveAttribute("aria-hidden", "true");
  });

  // The foundations' numbers rule (tds-numeric): figures of equal width, so
  // the days and years line up in their columns
  it("sets its days and years in figures of equal width", async () => {
    const screen = await render(calendar({ defaultValue: DECEMBER_16 }));

    await userEvent.click(
      screen.getByRole("button", { name: /year selector/ })
    );

    for (const element of [
      screen.getByRole("button", { name: /December 16, 2025/ }).element(),
      screen.getByRole("button", { name: "2030" }).element()
    ]) {
      expect(getComputedStyle(element).fontVariantNumeric).toBe("tabular-nums");
    }
  });
});
