import {
  isSameDay,
  startOfWeek,
  startOfYear,
  type DateValue
} from "@internationalized/date";

type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
type WeekdayStyle = "narrow" | "short" | "long";

/**
 * Iterates from `start` to `end` with calendar-aware arithmetic, so that
 * non-Gregorian calendars (e.g. Japanese, Hebrew) get correct year
 * boundaries.
 */
const getYearRange = (
  start?: DateValue | null,
  end?: DateValue | null
): DateValue[] => {
  const years: DateValue[] = [];

  if (!start || !end) return years;

  let current = startOfYear(start);

  while (current.compare(end) <= 0) {
    years.push(current);
    const next = startOfYear(current.add({ years: 1 }));
    // A year added to the calendar's last stays in it
    if (next.compare(current) <= 0) break;
    current = next;
  }

  return years;
};

const getDayViewWeekDayLabels = (
  start: DateValue,
  locale: string,
  firstDayOfWeek: DayOfWeek | undefined,
  weekdayStyle: WeekdayStyle = "short",
  timeZone = "UTC"
): string[] => {
  const formatter = new Intl.DateTimeFormat(locale, {
    weekday: weekdayStyle,
    timeZone
  });
  const weekStart = startOfWeek(start, locale, firstDayOfWeek);
  const labels: string[] = [];
  let date = weekStart;

  for (let index = 0; index < 7; index++) {
    labels.push(formatter.format(date.toDate(timeZone)));
    const next = date.add({ days: 1 });

    if (isSameDay(date, next)) {
      break;
    }

    date = next;
  }

  while (labels.length < 7) {
    labels.push("");
  }

  return labels;
};

const buildDayViewWeekRow = (
  rowStart: DateValue,
  end: DateValue
): (DateValue | null)[] => {
  const row: (DateValue | null)[] = [];
  let date = rowStart;

  for (let index = 0; index < 7; index++) {
    row.push(date.compare(end) > 0 ? null : date);

    const next = date.add({ days: 1 });

    if (isSameDay(date, next)) {
      while (row.length < 7) {
        row.push(null);
      }

      return row;
    }

    date = next;
  }

  return row;
};

/**
 * Week-aligned rows for day view. The first row starts at
 * `startOfWeek(start)` (leading dates before `start` are shown but disabled
 * by React Aria). Each later row starts on the next week boundary.
 */
const getDayViewGridRows = (
  start: DateValue,
  end: DateValue,
  locale: string,
  firstDayOfWeek?: DayOfWeek
): (DateValue | null)[][] => {
  const rows: (DateValue | null)[][] = [];
  let rowStart = startOfWeek(start, locale, firstDayOfWeek);

  rows.push(buildDayViewWeekRow(rowStart, end));

  rowStart = rowStart.add({ weeks: 1 });

  while (rowStart.compare(end) <= 0) {
    rows.push(buildDayViewWeekRow(rowStart, end));
    const nextWeek = rowStart.add({ weeks: 1 });

    if (isSameDay(rowStart, nextWeek)) {
      break;
    }

    rowStart = nextWeek;
  }

  return rows;
};

export { getYearRange, getDayViewWeekDayLabels, getDayViewGridRows };
export type { DayOfWeek, WeekdayStyle };
