import { describe, expect, it } from "vitest";
import {
  canGoBack,
  defaultPath,
  getView,
  parentPath,
  type DateTimePath
} from "../dateTimeSelectorModel";

// `count` dates from `start`, `stepHours` apart, in local time as TerriaJS
// reads them
const dates = (start: string, count: number, stepHours = 24): Date[] =>
  Array.from(
    { length: count },
    (_, i) => new Date(new Date(start).getTime() + i * stepHours * 3_600_000)
  );

describe("getView", () => {
  it("shows centuries for 12 dates or more across them", () => {
    const series = [
      ...dates("1995-06-01T00:00", 6, 24 * 365),
      ...dates("2005-06-01T00:00", 6, 24 * 365)
    ];

    expect(getView(series, {})).toEqual({
      view: "century",
      centuries: [19, 20]
    });
  });

  it("lists fewer than 12 dates as times at once", () => {
    const series = dates("2025-01-01T10:00", 11, 24 * 40);

    expect(getView(series, {})).toEqual({ view: "time", dates: series });
  });

  it("shows a century's years with the months that have data", () => {
    const series = [
      ...dates("2024-03-01T00:00", 7, 24),
      ...dates("2025-11-01T00:00", 7, 24)
    ];

    expect(getView(series, { century: 20 })).toEqual({
      view: "year",
      years: [
        { year: 2024, months: [2] },
        { year: 2025, months: [10] }
      ]
    });
  });

  it("shows a year's months with the days that have data", () => {
    const series = dates("2025-01-30T00:00", 13, 24);

    const view = getView(series, { century: 20, year: 2025 });

    expect(view).toEqual({
      view: "month",
      year: 2025,
      months: [
        { month: 0, days: [30, 31] },
        { month: 1, days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
      ]
    });
  });

  it("shows a month's days with data, past 31 dates", () => {
    const series = dates("2025-12-01T00:00", 32, 12);

    expect(getView(series, { century: 20, year: 2025, month: 11 })).toEqual({
      view: "day",
      year: 2025,
      month: 11,
      days: Array.from({ length: 16 }, (_, i) => i + 1)
    });
  });

  it("lists a month's dates as times, up to 31", () => {
    const series = dates("2025-12-01T00:00", 31, 12);

    expect(getView(series, { century: 20, year: 2025, month: 11 })).toEqual({
      view: "time",
      dates: series
    });
  });

  it("shows a day's hours, with how many times each, past 24 dates", () => {
    const series = dates("2025-12-16T00:00", 25, 0.5);

    expect(
      getView(series, { century: 20, year: 2025, month: 11, day: 16 })
    ).toEqual({
      view: "hour",
      year: 2025,
      month: 11,
      day: 16,
      hours: Array.from({ length: 13 }, (_, hour) => ({
        hour,
        count: hour === 12 ? 1 : 2
      }))
    });
  });

  it("lists an hour's dates as times", () => {
    const series = dates("2025-12-16T00:00", 25, 0.5);

    expect(
      getView(series, { century: 20, year: 2025, month: 11, day: 16, hour: 3 })
    ).toEqual({ view: "time", dates: series.slice(6, 8) });
  });
});

describe("defaultPath", () => {
  it("starts at the top while there's more than one century", () => {
    expect(
      defaultPath([new Date("1999-01-01"), new Date("2001-01-01")])
    ).toEqual({});
  });

  it("skips each level with only one option", () => {
    const series = dates("2025-12-16T00:00", 25, 0.5);

    expect(defaultPath(series)).toEqual({
      century: 20,
      year: 2025,
      month: 11,
      day: 16
    });
  });

  it("stops at the first level with a choice", () => {
    const series = [new Date("2025-03-01"), new Date("2025-04-01")];

    expect(defaultPath(series)).toEqual({ century: 20, year: 2025 });
  });
});

describe("going back", () => {
  const path: DateTimePath = { century: 20, year: 2025, month: 11 };

  it("drops the deepest level", () => {
    expect(parentPath(path)).toEqual({ century: 20, year: 2025 });
    expect(parentPath({})).toEqual({});
  });

  it("can't go above where the selector started", () => {
    expect(canGoBack(path, { century: 20 })).toBe(true);
    expect(canGoBack({ century: 20 }, { century: 20 })).toBe(false);
  });
});
