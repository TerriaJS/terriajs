import {
  CalendarDate,
  createCalendar,
  DateFormatter,
  toCalendar,
  type CalendarIdentifier,
  type DateValue
} from "@internationalized/date";
import { ChevronLeftIcon, ChevronRightIcon } from "@terria/design-system-icons";
import {
  Fragment,
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  CalendarHeading as AriaCalendarHeading,
  type CalendarCellProps as AriaCalendarCellProps,
  type CalendarGridBodyProps as AriaCalendarGridBodyProps,
  type CalendarGridHeaderProps as AriaCalendarGridHeaderProps,
  type CalendarGridProps as AriaCalendarGridProps,
  type CalendarHeaderCellProps as AriaCalendarHeaderCellProps,
  type CalendarHeadingProps as AriaCalendarHeadingProps,
  type CalendarProps as AriaCalendarProps,
  type CalendarSelectionMode
} from "react-aria-components/Calendar";
import { useLocale } from "react-aria-components/I18nProvider";
import { useControlledState } from "react-stately/useControlledState";
import {
  getDayViewGridRows,
  getDayViewWeekDayLabels,
  type DayOfWeek,
  type WeekdayStyle
} from "./calendarUtils";
import { YearPickerContext } from "./YearPickerContext";
import "./Calendar.css";

type DayView = {
  days: number;
  firstDayOfWeek?: DayOfWeek;
  timeZone: string;
  visibleRange: { end: DateValue; start: DateValue };
  weekdayStyle?: WeekdayStyle;
};

// The day view's range, for its grid header and body, which React Aria's
// month-based grid can't lay out
const DayViewContext = createContext<DayView | undefined>(undefined);

type CalendarRootProps<
  T extends DateValue = DateValue,
  M extends CalendarSelectionMode = "single"
> = AriaCalendarProps<T, M> & {
  isYearPickerOpen?: boolean;
  onYearPickerOpenChange?: (isYearPickerOpen: boolean) => void;
  defaultYearPickerOpen?: boolean;
};

// A month of days to pick from, laid out with its parts: a Header holding a
// Heading (or YearPickerTrigger) and NavButtons, and a Grid of Cells. A
// YearPickerGrid lies over the day grid while the year picker is open.
// Without minValue and maxValue it spans 1900 to 2099
const CalendarRoot = <
  T extends DateValue = DateValue,
  M extends CalendarSelectionMode = "single"
>({
  children,
  defaultYearPickerOpen = false,
  firstDayOfWeek,
  isYearPickerOpen: isYearPickerOpenProp,
  maxValue: maxValueProp,
  minValue: minValueProp,
  onYearPickerOpenChange,
  visibleDuration,
  ...props
}: CalendarRootProps<T, M>): React.ReactElement => {
  const visibleDays = visibleDuration?.days;
  const view =
    visibleDuration?.weeks != null
      ? "week"
      : visibleDays != null
        ? "day"
        : undefined;
  const { locale } = useLocale();
  const calendarRef = useRef<HTMLDivElement>(null);
  const [isYearPickerOpen, setIsYearPickerOpen] = useControlledState(
    isYearPickerOpenProp,
    defaultYearPickerOpen,
    onYearPickerOpenChange
  );
  const calendar = useMemo(() => {
    // Intl names the calendar systems @internationalized/date knows
    const identifier = new DateFormatter(locale).resolvedOptions()
      .calendar as CalendarIdentifier;

    return createCalendar(identifier);
  }, [locale]);
  // React Aria memoizes its state on these bounds' identity, so they stay
  // stable across renders. Converted into the locale's calendar, not offset
  // by a number of years: eras and lunar years don't shift by a constant. A
  // CalendarDate is a DateValue, which T extends only by the caller's choice
  // of value type
  const minValue = useMemo(
    () =>
      minValueProp ??
      (toCalendar(new CalendarDate(1900, 1, 1), calendar) as unknown as T),
    [minValueProp, calendar]
  );
  const maxValue = useMemo(
    () =>
      maxValueProp ??
      (toCalendar(new CalendarDate(2099, 12, 31), calendar) as unknown as T),
    [maxValueProp, calendar]
  );
  const yearPickerContext = useMemo(
    () => ({
      calendarGridSlot: "calendar-grid" as const,
      isYearPickerOpen,
      setIsYearPickerOpen,
      calendarRef
    }),
    [isYearPickerOpen, setIsYearPickerOpen]
  );

  return (
    <YearPickerContext.Provider value={yearPickerContext}>
      <AriaCalendar
        ref={calendarRef}
        data-tds="calendar"
        data-tds-view={view}
        firstDayOfWeek={firstDayOfWeek}
        maxValue={maxValue}
        minValue={minValue}
        visibleDuration={visibleDuration}
        {...props}
      >
        {(values) => (
          <DayViewContext.Provider
            value={
              visibleDays == null
                ? undefined
                : {
                    days: visibleDays,
                    firstDayOfWeek,
                    timeZone: values.state.timeZone,
                    visibleRange: values.state.visibleRange
                  }
            }
          >
            {typeof children === "function" ? children(values) : children}
          </DayViewContext.Provider>
        )}
      </AriaCalendar>
    </YearPickerContext.Provider>
  );
};

CalendarRoot.displayName = "Calendar";

type CalendarHeaderProps = ComponentPropsWithoutRef<"div"> &
  DOMRenderProps<"div", undefined>;

// The heading and arrows above the grid. A div: a header outside a section
// is the page's banner landmark
const CalendarHeader = forwardRef<HTMLDivElement, CalendarHeaderProps>(
  ({ render, ...props }, ref) => {
    const headerProps = { ...props, ref, "data-tds": "calendar-header" };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
      render(headerProps, undefined)
    ) : (
      <div {...headerProps} />
    );
  }
);

CalendarHeader.displayName = "Calendar.Header";

type CalendarHeadingProps = AriaCalendarHeadingProps;

// The month and year shown
const CalendarHeading = forwardRef<HTMLHeadingElement, CalendarHeadingProps>(
  (props, ref) => {
    return (
      <AriaCalendarHeading {...props} ref={ref} data-tds="calendar-heading" />
    );
  }
);

CalendarHeading.displayName = "Calendar.Heading";

type CalendarNavButtonProps = AriaButtonProps & {
  slot?: "previous" | "next";
};

// Moves a month back or on; a chevron unless given children
const CalendarNavButton = forwardRef<HTMLButtonElement, CalendarNavButtonProps>(
  ({ children, slot, ...props }, ref) => {
    return (
      <AriaButton
        {...props}
        ref={ref}
        slot={slot}
        data-tds="calendar-nav-button"
      >
        {children ??
          (slot === "previous" ? (
            <ChevronLeftIcon data-tds="calendar-nav-button-icon" />
          ) : (
            <ChevronRightIcon data-tds="calendar-nav-button-icon" />
          ))}
      </AriaButton>
    );
  }
);

CalendarNavButton.displayName = "Calendar.NavButton";

type CalendarGridProps = AriaCalendarGridProps;

// A month of days; `offset` shows a later month beside it
const CalendarGrid = forwardRef<HTMLTableElement, CalendarGridProps>(
  ({ weekdayStyle = "short", ...props }, ref) => {
    const dayView = useContext(DayViewContext);

    return (
      <DayViewContext.Provider
        value={dayView ? { ...dayView, weekdayStyle } : undefined}
      >
        <AriaCalendarGrid
          {...props}
          ref={ref}
          weekdayStyle={weekdayStyle}
          data-tds="calendar-grid"
        />
      </DayViewContext.Provider>
    );
  }
);

CalendarGrid.displayName = "Calendar.Grid";

type CalendarGridHeaderProps = AriaCalendarGridHeaderProps;

// The weekdays' row; each day's name goes through children
const CalendarGridHeader = ({
  children,
  ...props
}: CalendarGridHeaderProps): React.ReactElement => {
  const dayView = useContext(DayViewContext);
  const { locale } = useLocale();

  if (dayView && dayView.days >= 7) {
    const weekDays = getDayViewWeekDayLabels(
      dayView.visibleRange.start,
      locale,
      dayView.firstDayOfWeek,
      dayView.weekdayStyle,
      dayView.timeZone
    );

    return (
      <thead aria-hidden data-tds="calendar-grid-header">
        <tr>
          {weekDays.map((day, index) => (
            // eslint-disable-next-line @eslint-react/no-array-index-key -- A fixed week of columns: the position is the column
            <Fragment key={index}>{children(day)}</Fragment>
          ))}
        </tr>
      </thead>
    );
  }

  return (
    <AriaCalendarGridHeader {...props} data-tds="calendar-grid-header">
      {children}
    </AriaCalendarGridHeader>
  );
};

CalendarGridHeader.displayName = "Calendar.GridHeader";

type CalendarGridBodyProps = AriaCalendarGridBodyProps;

// The weeks; each date goes through children, as a Cell
const CalendarGridBody = ({
  children,
  ...props
}: CalendarGridBodyProps): React.ReactElement => {
  const dayView = useContext(DayViewContext);
  const { locale } = useLocale();

  if (dayView && dayView.days >= 7) {
    const rows = getDayViewGridRows(
      dayView.visibleRange.start,
      dayView.visibleRange.end,
      locale,
      dayView.firstDayOfWeek
    );

    return (
      <tbody data-tds="calendar-grid-body">
        {rows.map((row, weekIndex) => (
          // The grid is fixed weeks of fixed days, so positions are the keys
          // eslint-disable-next-line @eslint-react/no-array-index-key -- see above
          <tr key={weekIndex}>
            {row.map((date, dayIndex) =>
              date ? (
                // eslint-disable-next-line @eslint-react/no-array-index-key -- see above
                <Fragment key={dayIndex}>
                  {/* React Aria's grid body hands CalendarDates to children too */}
                  {children(date as CalendarDate)}
                </Fragment>
              ) : (
                // eslint-disable-next-line @eslint-react/no-array-index-key -- see above
                <td key={dayIndex} />
              )
            )}
          </tr>
        ))}
      </tbody>
    );
  }

  return (
    <AriaCalendarGridBody {...props} data-tds="calendar-grid-body">
      {children}
    </AriaCalendarGridBody>
  );
};

CalendarGridBody.displayName = "Calendar.GridBody";

type CalendarHeaderCellProps = AriaCalendarHeaderCellProps;

// A weekday's name
const CalendarHeaderCell = forwardRef<
  HTMLTableCellElement,
  CalendarHeaderCellProps
>((props, ref) => {
  return (
    <AriaCalendarHeaderCell
      {...props}
      ref={ref}
      data-tds="calendar-header-cell"
    />
  );
});

CalendarHeaderCell.displayName = "Calendar.HeaderCell";

type CalendarCellProps = AriaCalendarCellProps;

// A day; its number unless given children
const CalendarCell = forwardRef<HTMLTableCellElement, CalendarCellProps>(
  ({ children, ...props }, ref) => {
    return (
      <AriaCalendarCell {...props} ref={ref} data-tds="calendar-cell">
        {(values) =>
          typeof children === "function"
            ? children(values)
            : (children ?? values.formattedDate)
        }
      </AriaCalendarCell>
    );
  }
);

CalendarCell.displayName = "Calendar.Cell";

type CalendarCellIndicatorProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined> & { children?: ReactNode };

// A dot under a day, to mark something on it; decorative, so say what it
// marks some other way
const CalendarCellIndicator = forwardRef<
  HTMLSpanElement,
  CalendarCellIndicatorProps
>(({ render, ...props }, ref) => {
  const indicatorProps = {
    ...props,
    ref,
    "aria-hidden": true,
    "data-tds": "calendar-cell-indicator"
  };
  return render ? (
    // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
    render(indicatorProps, undefined)
  ) : (
    <span {...indicatorProps} />
  );
});

CalendarCellIndicator.displayName = "Calendar.CellIndicator";

export {
  CalendarRoot,
  CalendarHeader,
  CalendarHeading,
  CalendarNavButton,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarHeaderCell,
  CalendarCell,
  CalendarCellIndicator
};
export type {
  CalendarRootProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarNavButtonProps,
  CalendarGridProps,
  CalendarGridHeaderProps,
  CalendarGridBodyProps,
  CalendarHeaderCellProps,
  CalendarCellProps,
  CalendarCellIndicatorProps
};
