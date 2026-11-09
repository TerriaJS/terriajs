// The levels of TerriaJS's DateTimePicker (ReactViews/BottomDock/Timeline),
// as pure functions of its dates and the path chosen so far. Dates are read
// in local time, as TerriaJS reads them: getFullYear, getMonth, getDate,
// getHours

type DateTimePath = {
  century?: number;
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
};

type DateTimeView =
  | { view: "century"; centuries: number[] }
  | { view: "year"; years: { year: number; months: number[] }[] }
  | {
      view: "month";
      year: number;
      months: { month: number; days: number[] }[];
    }
  | { view: "day"; year: number; month: number; days: number[] }
  | {
      view: "hour";
      year: number;
      month: number;
      day: number;
      hours: { hour: number; count: number }[];
    }
  | { view: "time"; dates: Date[] };

const LEVELS = ["century", "year", "month", "day", "hour"] as const;

const centuryOf = (date: Date): number => Math.floor(date.getFullYear() / 100);

// The distinct values of `key` over the dates, in the order they first occur
const distinct = (dates: Date[], key: (date: Date) => number): number[] => [
  ...new Set(dates.map(key))
];

// Each distinct value of `key`, with the distinct values of `sub` among the
// dates that have it
const grouped = (
  dates: Date[],
  key: (date: Date) => number,
  sub: (date: Date) => number
): [number, number[]][] =>
  distinct(dates, key).map((value) => [
    value,
    distinct(
      dates.filter((date) => key(date) === value),
      sub
    )
  ]);

// The dates on the path chosen so far
const datesOn = (dates: Date[], path: DateTimePath): Date[] =>
  dates.filter(
    (date) =>
      (path.century === undefined || centuryOf(date) === path.century) &&
      (path.year === undefined || date.getFullYear() === path.year) &&
      (path.month === undefined || date.getMonth() === path.month) &&
      (path.day === undefined || date.getDate() === path.day) &&
      (path.hour === undefined || date.getHours() === path.hour)
  );

/**
 * What to show next. Each level is only worth it for enough dates; with fewer
 * they're listed as times: centuries for 12 or more, years and months for
 * more than 12, days for more than 31, hours for more than 24. TerriaJS's
 * thresholds
 */
const getView = (dates: Date[], path: DateTimePath): DateTimeView => {
  const { century, year, month, day, hour } = path;
  const here = datesOn(dates, path);
  const time = { view: "time", dates: here } as const;

  if (century === undefined) {
    return here.length >= 12
      ? { view: "century", centuries: distinct(here, centuryOf) }
      : time;
  }

  if (year === undefined) {
    return here.length > 12
      ? {
          view: "year",
          years: grouped(
            here,
            (date) => date.getFullYear(),
            (date) => date.getMonth()
          ).map(([value, months]) => ({ year: value, months }))
        }
      : time;
  }

  if (month === undefined) {
    return here.length > 12
      ? {
          view: "month",
          year,
          months: grouped(
            here,
            (date) => date.getMonth(),
            (date) => date.getDate()
          ).map(([value, days]) => ({ month: value, days }))
        }
      : time;
  }

  if (day === undefined) {
    return here.length > 31
      ? {
          view: "day",
          year,
          month,
          days: distinct(here, (date) => date.getDate())
        }
      : time;
  }

  if (hour === undefined) {
    return here.length > 24
      ? {
          view: "hour",
          year,
          month,
          day,
          hours: distinct(here, (date) => date.getHours()).map((value) => ({
            hour: value,
            count: here.filter((date) => date.getHours() === value).length
          }))
        }
      : time;
  }

  return time;
};

/**
 * Where the selector starts: down past each level with only one option, as
 * TerriaJS's does, to the day at most
 */
const defaultPath = (dates: Date[]): DateTimePath => {
  const keys = {
    century: centuryOf,
    year: (date: Date) => date.getFullYear(),
    month: (date: Date) => date.getMonth(),
    day: (date: Date) => date.getDate()
  };
  let path: DateTimePath = {};

  for (const level of ["century", "year", "month", "day"] as const) {
    const values = distinct(datesOn(dates, path), keys[level]);
    const [only] = values;

    if (values.length !== 1 || only === undefined) break;

    path = { ...path, [level]: only };
  }

  return path;
};

const depth = (path: DateTimePath): number =>
  LEVELS.filter((level) => path[level] !== undefined).length;

/** The path a level up: the deepest level chosen, unchosen */
const parentPath = (path: DateTimePath): DateTimePath => {
  const deepest = [...LEVELS]
    .reverse()
    .find((level) => path[level] !== undefined);

  if (!deepest) return path;

  const { [deepest]: _dropped, ...rest } = path;
  return rest;
};

/** Whether there's a level to go back to, above where the selector started */
const canGoBack = (path: DateTimePath, start: DateTimePath): boolean =>
  depth(path) > depth(start);

export { canGoBack, defaultPath, getView, parentPath };
export type { DateTimePath, DateTimeView };
