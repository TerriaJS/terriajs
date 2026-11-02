import { I18nProvider } from "react-aria-components/I18nProvider";
import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";
import { DateTimeSelector } from "..";

// `count` dates from `start`, `stepHours` apart
const dates = (start: string, count: number, stepHours = 24): Date[] =>
  Array.from(
    { length: count },
    (_, i) => new Date(new Date(start).getTime() + i * stepHours * 3_600_000)
  );

describe("DateTimeSelector", () => {
  it("starts at centuries when the dates span them, with nowhere to go back to", async () => {
    const screen = await render(
      <DateTimeSelector
        dates={[
          ...dates("1995-06-01T00:00", 6, 24 * 365),
          ...dates("2005-06-01T00:00", 6, 24 * 365)
        ]}
      />
    );

    await expect.element(screen.getByText("Select a century")).toBeVisible();
    await expect
      .element(screen.getByRole("option", { name: "1900" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();
  });

  it("goes down a level on a choice, and back up", async () => {
    const screen = await render(
      <DateTimeSelector
        dates={[
          ...dates("1995-06-01T00:00", 6, 24 * 365),
          // More than 12 in the 2000s, enough for a year view
          ...dates("2005-06-01T00:00", 13, 24 * 30)
        ]}
      />
    );

    await userEvent.click(screen.getByRole("option", { name: "2000" }));
    await expect.element(screen.getByText("Select a year")).toBeVisible();
    await expect
      .element(screen.getByRole("option", { name: /^2005/ }))
      .toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    await expect.element(screen.getByText("Select a century")).toBeVisible();
  });

  it("drills from the days with data to an hour, to a time", async () => {
    const onChange = vi.fn();
    // Every half hour across two days: a month of 96 dates
    const series = dates("2025-12-15T00:00", 96, 0.5);
    const screen = await render(
      <DateTimeSelector dates={series} onChange={onChange} />
    );

    // One century, year and month, so it starts at the days
    await expect
      .element(screen.getByRole("button", { name: /December 14,/ }))
      .toHaveAttribute("data-unavailable");
    await userEvent.click(screen.getByRole("button", { name: /December 16,/ }));

    await expect.element(screen.getByText(/Select an hour/)).toBeVisible();
    await userEvent.click(screen.getByRole("option", { name: /^10:00/ }));

    await expect.element(screen.getByText("Select a time")).toBeVisible();
    await userEvent.click(screen.getByRole("option", { name: /10:30/ }));

    expect(onChange).toHaveBeenCalledWith(new Date("2025-12-16T10:30"));
  });

  it("lists a few dates as times at once", async () => {
    const onChange = vi.fn();
    const series = dates("2025-01-01T10:00", 3, 24 * 40);
    const screen = await render(
      <DateTimeSelector dates={series} onChange={onChange} />
    );

    await expect.element(screen.getByText("Select a time")).toBeVisible();
    const times = screen.getByRole("listbox").getByRole("option");
    expect(times.elements()).toHaveLength(3);

    await userEvent.click(times.nth(1));
    expect(onChange).toHaveBeenCalledWith(series[1]);
  });

  it("marks the time it holds", async () => {
    const series = dates("2025-01-01T10:00", 3, 24 * 40);
    const screen = await render(
      <DateTimeSelector dates={series} value={series[2]} />
    );

    await expect
      .element(screen.getByRole("listbox").getByRole("option").nth(2))
      .toHaveAttribute("aria-selected", "true");
  });

  // Its dates are Gregorian: a locale with a calendar of its own keeps its
  // language, not its calendar, or days and months would be other ones
  describe("in a locale with another calendar", () => {
    it("offers the Gregorian days that have data", async () => {
      const screen = await render(
        <I18nProvider locale="fa-IR">
          <DateTimeSelector dates={dates("2025-12-15T00:00", 96, 0.5)} />
        </I18nProvider>
      );
      const december = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
        month: "long"
      }).format(new Date(2025, 11, 1));
      const figure = new Intl.NumberFormat("fa-IR");

      await expect.element(screen.getByRole("grid")).toBeInTheDocument();
      const available = [
        ...screen.container.querySelectorAll(
          '[data-tds="calendar-cell"]:not([data-unavailable]):not([data-disabled]):not([data-outside-month])'
        )
      ];
      expect(available.map((cell) => cell.textContent)).toEqual([
        figure.format(15),
        figure.format(16)
      ]);
      for (const cell of available) {
        expect(cell.getAttribute("aria-label")).toContain(december);
      }
    });

    it("names the Gregorian months, in its language", async () => {
      const screen = await render(
        <I18nProvider locale="fa-IR">
          <DateTimeSelector
            dates={[
              ...dates("2025-03-01T00:00", 7, 24),
              ...dates("2025-04-01T00:00", 7, 24)
            ]}
          />
        </I18nProvider>
      );
      const march = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
        month: "long"
      }).format(new Date(2025, 2, 1));

      await expect
        .element(screen.getByRole("option", { name: new RegExp(`^${march}`) }))
        .not.toHaveAttribute("aria-disabled");
    });
  });

  it("disables months with no data", async () => {
    const screen = await render(
      <DateTimeSelector
        dates={[
          ...dates("2025-03-01T00:00", 7, 24),
          ...dates("2025-04-01T00:00", 7, 24)
        ]}
      />
    );

    await expect
      .element(screen.getByRole("option", { name: /^March/ }))
      .not.toHaveAttribute("aria-disabled");
    await expect
      .element(screen.getByRole("option", { name: /^January/ }))
      .toHaveAttribute("aria-disabled", "true");
  });

  // The foundations' numbers rule (tds-numeric): figures of equal width, so
  // times stacked in a column line up
  it("scrolls a list longer than it shows", async () => {
    // Every half hour of one day: 24 hours to choose from
    const screen = await render(
      <DateTimeSelector dates={dates("2025-12-16T00:00", 48, 0.5)} />
    );

    const list = screen.getByRole("listbox").element().parentElement;
    if (!list) throw new Error("No list");
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
    list.scrollTop = 40;
    expect(list.scrollTop).toBe(40);
  });

  it("starts over when given other dates", async () => {
    const screen = await render(
      <DateTimeSelector
        dates={[
          ...dates("1995-06-01T00:00", 6, 24 * 365),
          ...dates("2005-06-01T00:00", 6, 24 * 365)
        ]}
      />
    );
    await userEvent.click(screen.getByRole("option", { name: "1900" }));

    // A few dates in the 2000s, listed as times
    await screen.rerender(
      <DateTimeSelector dates={dates("2025-01-01T10:00", 3, 24 * 40)} />
    );

    await expect.element(screen.getByText("Select a time")).toBeVisible();
    expect(screen.getByRole("option").elements()).toHaveLength(3);
  });

  it("sets its numbers in figures of equal width", async () => {
    const screen = await render(
      <DateTimeSelector dates={dates("2025-01-01T10:00", 3, 24 * 40)} />
    );

    const time = screen.getByRole("listbox").getByRole("option").first();
    expect(getComputedStyle(time.element()).fontVariantNumeric).toBe(
      "tabular-nums"
    );
  });

  // A list of choices is one tab stop, moved through with the arrow keys
  describe("by keyboard", () => {
    // One century, more than 12 dates: it starts at the years. 2025 has 13,
    // enough for its months
    const TWO_YEARS = [
      ...dates("2024-03-01T00:00", 7, 24),
      ...dates("2025-11-01T00:00", 13, 24)
    ];

    it("moves between years with the arrow keys, and opens one with Enter", async () => {
      const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);

      await userEvent.click(screen.getByRole("option", { name: /^2024/ }));
      await userEvent.click(screen.getByRole("button", { name: "Back" }));
      await expect
        .element(screen.getByRole("option", { name: /^2024/ }))
        .toHaveFocus();

      await userEvent.keyboard("{ArrowDown}");
      await expect
        .element(screen.getByRole("option", { name: /^2025/ }))
        .toHaveFocus();

      await userEvent.keyboard("{Enter}");
      await expect.element(screen.getByText("2025")).toBeVisible();
    });

    it("moves through the centuries as a grid", async () => {
      const screen = await render(
        <DateTimeSelector
          dates={[
            ...dates("1995-06-01T00:00", 6, 24 * 365),
            ...dates("2005-06-01T00:00", 6, 24 * 365)
          ]}
        />
      );

      await userEvent.tab();
      await expect
        .element(screen.getByRole("option", { name: "1900" }))
        .toHaveFocus();
      await userEvent.keyboard("{ArrowRight}");
      await expect
        .element(screen.getByRole("option", { name: "2000" }))
        .toHaveFocus();
    });

    it("takes focus into the next level's list on a choice", async () => {
      const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);

      await userEvent.click(screen.getByRole("option", { name: /^2025/ }));

      await expect
        .element(screen.getByRole("option", { name: /^November/ }))
        .toHaveFocus();
    });

    it("picks a time with Enter", async () => {
      const onChange = vi.fn();
      const series = dates("2025-01-01T10:00", 3, 24 * 40);
      await render(<DateTimeSelector dates={series} onChange={onChange} />);

      await userEvent.tab();
      await userEvent.keyboard("{ArrowDown}{Enter}");

      expect(onChange).toHaveBeenCalledWith(series[1]);
    });
  });
});
