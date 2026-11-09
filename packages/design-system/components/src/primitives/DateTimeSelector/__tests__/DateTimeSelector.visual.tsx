import { describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { focusVisible, hover, snap } from "../../../visual";
import { DateTimeSelector } from "..";

// A time series: `count` dates from `start`, `stepHours` apart
const series = (start: string, count: number, stepHours: number): Date[] =>
  Array.from(
    { length: count },
    (_, i) => new Date(new Date(start).getTime() + i * stepHours * 3_600_000)
  );

// Yearly from 1950, then monthly from 2020: two centuries
const DECADES = [
  ...series("1950-01-01T00:00", 50, 24 * 365.25),
  ...series("2020-01-01T00:00", 60, 24 * 30.44)
];

// Every few days through 2024 and 2025, with a gap in the winter of 2024
const TWO_YEARS = series("2024-01-03T00:00", 240, 72).filter(
  (date) => !(date.getFullYear() === 2024 && date.getMonth() >= 5)
);

// Every half hour for a week of December 2025: the days, then the hours
const HALF_HOURLY = series("2025-12-15T00:00", 48 * 7, 0.5);

// Five dates: listed as times at once
const FEW = series("2025-06-01T09:00", 5, 24 * 9);

describe("DateTimeSelector", () => {
  it("centuries", async () => {
    await render(<DateTimeSelector dates={DECADES} />);
    await snap();
  });

  it("century hovered", async () => {
    const screen = await render(<DateTimeSelector dates={DECADES} />);
    await hover(screen.getByRole("option", { name: "1900" }));
    await snap();
  });

  it("century focused", async () => {
    const screen = await render(<DateTimeSelector dates={DECADES} />);
    const option = screen.getByRole("option", { name: "1900" });
    await focusVisible(option);
    await expect.element(option).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("years", async () => {
    await render(<DateTimeSelector dates={TWO_YEARS} />);
    await snap();
  });

  it("year hovered", async () => {
    const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);
    await hover(screen.getByRole("option", { name: "2025" }));
    await snap();
  });

  it("year focused", async () => {
    const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);
    const option = screen.getByRole("option", { name: "2024" });
    await focusVisible(option);
    await expect.element(option).toHaveAttribute("data-focus-visible");
    await snap();
  });

  it("months, some without data", async () => {
    const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);
    await userEvent.click(screen.getByRole("option", { name: "2024" }));
    await expect.element(screen.getByText("2024")).toBeVisible();
    // Off the row that took the year's place
    await commands.mouseAway();
    await snap();
  });

  it("back hovered", async () => {
    const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);
    await userEvent.click(screen.getByRole("option", { name: "2024" }));
    await hover(screen.getByRole("button", { name: "Back" }));
    await snap();
  });

  it("back focused", async () => {
    const screen = await render(<DateTimeSelector dates={TWO_YEARS} />);
    await userEvent.click(screen.getByRole("option", { name: "2024" }));
    await commands.mouseAway();
    const back = screen.getByRole("button", { name: "Back" });
    // A real key, as Back is a native button: :focus-visible doesn't follow
    // a script's focus. The months took focus, so back from there
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.element(back).toHaveFocus();
    await snap();
  });

  it("days", async () => {
    await render(<DateTimeSelector dates={HALF_HOURLY} />);
    await snap();
  });

  it("day hovered", async () => {
    const screen = await render(<DateTimeSelector dates={HALF_HOURLY} />);
    await hover(screen.getByRole("button", { name: /December 16, 2025/ }));
    await snap();
  });

  it("hours", async () => {
    const screen = await render(<DateTimeSelector dates={HALF_HOURLY} />);
    await userEvent.click(
      screen.getByRole("button", { name: /December 16, 2025/ })
    );
    await expect.element(screen.getByText(/Select an hour/)).toBeVisible();
    // Off the row that took the day's place
    await commands.mouseAway();
    await snap();
  });

  it("times, one chosen", async () => {
    await render(<DateTimeSelector dates={FEW} value={FEW[2]} />);
    await snap();
  });

  it("time hovered", async () => {
    const screen = await render(
      <DateTimeSelector dates={FEW} value={FEW[2]} />
    );
    await hover(screen.getByRole("option").first());
    await snap();
  });

  it("chosen time hovered", async () => {
    const screen = await render(
      <DateTimeSelector dates={FEW} value={FEW[2]} />
    );
    await hover(screen.getByRole("option", { selected: true }));
    await snap();
  });
});
