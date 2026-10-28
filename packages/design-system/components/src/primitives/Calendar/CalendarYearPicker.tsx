import { ChevronRightIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode
} from "react";
import {
  useCalendarHeading,
  useCalendarYearPicker,
  type CalendarHeadingProps,
  type CalendarYearPickerProps
} from "react-aria/useCalendar";
import type { DOMRenderProps } from "react-aria-components";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import { getYearRange } from "./calendarUtils";
import { useCalendarOrRangeState, useYearPicker } from "./YearPickerContext";
import { dataAttr } from "../../utils/dataAttr";

// A heading that opens a grid of years over the day grid, and the grid. React Aria has no year
// picker component, only its hooks

/* -------------------------------------------------------------------------
 * Trigger: in place of Calendar.Heading, the month and year with a chevron
 * that turns while the year picker is open
 * ---------------------------------------------------------------------- */

type CalendarYearPickerTriggerRenderProps = {
  isOpen: boolean;
  monthYear: string;
  toggle: () => void;
};

type CalendarYearPickerTriggerProps = Omit<AriaButtonProps, "children"> & {
  children:
    | ReactNode
    | ((values: CalendarYearPickerTriggerRenderProps) => ReactNode);
};

const TriggerContext =
  createContext<CalendarYearPickerTriggerRenderProps | null>(null);

const useTriggerContext = (): CalendarYearPickerTriggerRenderProps => {
  const context = useContext(TriggerContext);

  if (!context) {
    throw new Error(
      "CalendarYearPicker trigger components must be used within <Calendar.YearPickerTrigger>."
    );
  }

  return context;
};

const CalendarYearPickerTrigger = forwardRef<
  HTMLButtonElement,
  CalendarYearPickerTriggerProps
>(({ children, onKeyDown, onPress, ...props }, ref) => {
  const { isYearPickerOpen, setIsYearPickerOpen } = useYearPicker();
  const state = useCalendarOrRangeState();
  const monthYear = useCalendarHeading({}, state);

  const handleToggle = useCallback(() => {
    setIsYearPickerOpen(!isYearPickerOpen);
  }, [isYearPickerOpen, setIsYearPickerOpen]);

  const values = useMemo(
    () => ({ isOpen: isYearPickerOpen, monthYear, toggle: handleToggle }),
    [handleToggle, isYearPickerOpen, monthYear]
  );

  return (
    <TriggerContext.Provider value={values}>
      <AriaButton
        ref={ref}
        aria-expanded={isYearPickerOpen}
        aria-label={`${monthYear}, year selector`}
        data-open={dataAttr(isYearPickerOpen)}
        data-tds="calendar-year-picker-trigger"
        // Not one of the Calendar's previous and next slots
        slot={null}
        onKeyDown={(event) => {
          onKeyDown?.(event);

          if (event.key === "Escape" && isYearPickerOpen) {
            setIsYearPickerOpen(false);
          } else {
            event.continuePropagation();
          }
        }}
        onPress={(event) => {
          onPress?.(event);
          handleToggle();
        }}
        {...props}
      >
        {typeof children === "function" ? children(values) : children}
      </AriaButton>
    </TriggerContext.Provider>
  );
});

CalendarYearPickerTrigger.displayName = "Calendar.YearPickerTrigger";

type CalendarYearPickerTriggerHeadingProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> &
  DOMRenderProps<"span", undefined> &
  Pick<CalendarHeadingProps, "offset" | "format"> & {
    children?:
      | ReactNode
      | ((values: CalendarYearPickerTriggerRenderProps) => ReactNode);
  };

const CalendarYearPickerTriggerHeading = forwardRef<
  HTMLSpanElement,
  CalendarYearPickerTriggerHeadingProps
>(({ children, format, offset, render, ...props }, ref) => {
  const values = useTriggerContext();
  const state = useCalendarOrRangeState();
  const heading = useCalendarHeading({ format, offset }, state);
  const headingProps = {
    ...props,
    ref,
    "data-tds": "calendar-year-picker-trigger-heading"
  };
  const content =
    typeof children === "function" ? children(values) : (children ?? heading);

  return render ? (
    // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
    render({ ...headingProps, children: content }, undefined)
  ) : (
    <span {...headingProps}>{content}</span>
  );
});

CalendarYearPickerTriggerHeading.displayName =
  "Calendar.YearPickerTriggerHeading";

type CalendarYearPickerTriggerIndicatorProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> &
  DOMRenderProps<"span", undefined> & {
    children?:
      | ReactNode
      | ((values: CalendarYearPickerTriggerRenderProps) => ReactNode);
  };

const CalendarYearPickerTriggerIndicator = forwardRef<
  HTMLSpanElement,
  CalendarYearPickerTriggerIndicatorProps
>(({ children, render, ...props }, ref) => {
  const values = useTriggerContext();
  const indicatorProps = {
    ...props,
    ref,
    "aria-hidden": true,
    "data-tds": "calendar-year-picker-trigger-indicator"
  };
  const icon =
    typeof children === "function"
      ? children(values)
      : (children ?? <ChevronRightIcon />);

  return render ? (
    // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
    render({ ...indicatorProps, children: icon }, undefined)
  ) : (
    <span {...indicatorProps}>{icon}</span>
  );
});

CalendarYearPickerTriggerIndicator.displayName =
  "Calendar.YearPickerTriggerIndicator";

/* -------------------------------------------------------------------------
 * Grid: three columns of years over the day grid, hidden until open. Only
 * the active year is a tab stop, and arrow keys move between years
 * ---------------------------------------------------------------------- */

type CalendarYearPickerCellRenderProps = {
  year: number;
  formattedYear: string;
  isSelected: boolean;
  isCurrentYear: boolean;
  isOpen: boolean;
  selectYear: () => void;
};

type GridContextValue = {
  isYearPickerOpen: boolean;
  activeYear: number;
  currentYear: number;
  focusedYear: number;
  years: number[];
  getFormattedYear: (year: number) => string;
  selectYear: (year: number) => void;
  setActiveYear: (year: number) => void;
};

const GridContext = createContext<GridContextValue | null>(null);

const useGridContext = (): GridContextValue => {
  const context = useContext(GridContext);

  if (!context) {
    throw new Error(
      "CalendarYearPicker components must be used within <Calendar.YearPickerGrid>."
    );
  }

  return context;
};

type CalendarYearPickerGridProps = ComponentPropsWithoutRef<"div"> &
  DOMRenderProps<"div", undefined> &
  Pick<CalendarYearPickerProps, "format" | "visibleYears">;

const CalendarYearPickerGrid = ({
  children,
  format,
  onKeyDown,
  render,
  visibleYears: visibleYearsProp,
  ...props
}: CalendarYearPickerGridProps): React.ReactElement => {
  const {
    calendarGridSlot,
    calendarRef,
    isYearPickerOpen,
    setIsYearPickerOpen
  } = useYearPicker();
  const state = useCalendarOrRangeState();
  const gridRef = useRef<HTMLDivElement>(null);

  const visibleYears = useMemo(() => {
    if (visibleYearsProp != null) {
      return visibleYearsProp;
    }

    return getYearRange(state.minValue, state.maxValue).length || 20;
  }, [state.maxValue, state.minValue, visibleYearsProp]);

  const {
    "aria-label": yearGridAriaLabel,
    items,
    onChange,
    value: focusedItemId
  } = useCalendarYearPicker({ format, visibleYears }, state);

  // useCalendarYearPicker returns a new `items` array every render; keys of
  // its content stay stable, so effects don't re-run and steal focus back to
  // the selected year. Labels have their own key, as they follow the locale
  // and `format`, which the years don't
  const itemsKey = items
    .map((item) => `${String(item.id)}:${String(item.date.year)}`)
    .join("|");
  const labelsKey = items.map((item) => item.formatted).join("|");

  // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- Keyed on the years, not the array that holds them
  const years = useMemo(() => items.map((item) => item.date.year), [itemsKey]);
  const itemByYear = useMemo(
    () => new Map(items.map((item) => [item.date.year, item])),
    // eslint-disable-next-line react-hooks/exhaustive-deps, @eslint-react/exhaustive-deps -- Keyed on the years and labels, not the array
    [itemsKey, labelsKey]
  );
  const focusedYear =
    items.find((item) => item.id === focusedItemId)?.date.year ??
    state.focusedDate.year;

  const getFormattedYear = useCallback(
    (year: number) => itemByYear.get(year)?.formatted ?? String(year),
    [itemByYear]
  );

  const [chosenActiveYear, setChosenActiveYear] = useState(focusedYear);
  // Back to the first year when the years change past the active one;
  // derived, not reset in an effect, which would render twice
  const activeYear = years.includes(chosenActiveYear)
    ? chosenActiveYear
    : (years[0] ?? chosenActiveYear);
  const wasYearPickerOpenRef = useRef(false);

  // Lie over the day grid: its top and height
  useEffect(() => {
    const yearGrid = gridRef.current;
    const calendarGrid = calendarRef.current?.querySelector<HTMLElement>(
      `[data-tds='${calendarGridSlot}']`
    );

    if (!yearGrid || !calendarGrid) return;

    yearGrid.style.top = `${String(calendarGrid.offsetTop)}px`;
    yearGrid.style.height = `${String(calendarGrid.offsetHeight)}px`;
  }, [calendarGridSlot, calendarRef, state.focusedDate]);

  const focusYearCell = useCallback((year: number) => {
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-year='${String(year)}']`)
      ?.focus();
  }, []);

  // Focus the selected year only as the picker opens, not on every render
  // while open
  useEffect(() => {
    const justOpened = isYearPickerOpen && !wasYearPickerOpenRef.current;

    wasYearPickerOpenRef.current = isYearPickerOpen;

    const [firstYear] = years;

    if (!justOpened || firstYear == null) return;

    const nextActiveYear = years.includes(focusedYear)
      ? focusedYear
      : firstYear;

    setChosenActiveYear(nextActiveYear);

    const rafId = requestAnimationFrame(() => {
      focusYearCell(nextActiveYear);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [focusYearCell, focusedYear, isYearPickerOpen, years]);

  const handleYearSelect = useCallback(
    (year: number) => {
      const item = itemByYear.get(year);

      if (item == null) return;

      setIsYearPickerOpen(false);
      onChange(item.id);
    },
    [itemByYear, onChange, setIsYearPickerOpen]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event);

    if (event.defaultPrevented) return;

    if (event.key === "Escape" && isYearPickerOpen) {
      event.preventDefault();
      setIsYearPickerOpen(false);
      return;
    }

    const currentIndex = years.indexOf(activeYear);

    if (!isYearPickerOpen || currentIndex === -1) return;

    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 3,
      ArrowUp: -3,
      Home: -currentIndex,
      End: years.length - 1 - currentIndex
    };
    const step = steps[event.key];

    if (step === undefined) return;

    const nextIndex = Math.min(
      Math.max(currentIndex + step, 0),
      years.length - 1
    );
    const nextYear = years[nextIndex];

    if (nextIndex !== currentIndex && nextYear != null) {
      event.preventDefault();
      setChosenActiveYear(nextYear);
      focusYearCell(nextYear);
    }
  };

  // Read per render, not memoized, so it stays right across midnight on
  // Dec 31; it's a number, so the context below compares it by value
  // eslint-disable-next-line @eslint-react/purity -- see above
  const currentYear = new Date().getFullYear();

  const contextValue = useMemo(
    () => ({
      activeYear,
      currentYear,
      focusedYear,
      getFormattedYear,
      isYearPickerOpen,
      selectYear: handleYearSelect,
      setActiveYear: setChosenActiveYear,
      years
    }),
    [
      activeYear,
      currentYear,
      focusedYear,
      getFormattedYear,
      handleYearSelect,
      isYearPickerOpen,
      years
    ]
  );

  const gridProps = {
    ...props,
    ref: gridRef,
    "aria-hidden": !isYearPickerOpen,
    "aria-label": yearGridAriaLabel,
    "data-open": isYearPickerOpen || undefined,
    "data-tds": "calendar-year-picker-grid",
    role: "group",
    tabIndex: -1,
    onKeyDown: handleKeyDown
  };

  return (
    <GridContext.Provider value={contextValue}>
      {render ? (
        // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
        render({ ...gridProps, children }, undefined)
      ) : (
        <div {...gridProps}>{children}</div>
      )}
    </GridContext.Provider>
  );
};

CalendarYearPickerGrid.displayName = "Calendar.YearPickerGrid";

type CalendarYearPickerGridBodyProps = {
  children?: (values: CalendarYearPickerCellRenderProps) => ReactNode;
};

// Renders each year, as a YearPickerCell unless given a function
const CalendarYearPickerGridBody = ({
  children
}: CalendarYearPickerGridBodyProps): React.ReactElement => {
  const {
    currentYear,
    focusedYear,
    getFormattedYear,
    isYearPickerOpen,
    selectYear,
    years
  } = useGridContext();

  return (
    <>
      {years.map((year) => (
        <Fragment key={year}>
          {children ? (
            children({
              formattedYear: getFormattedYear(year),
              isCurrentYear: year === currentYear,
              isOpen: isYearPickerOpen,
              isSelected: year === focusedYear,
              selectYear: () => {
                selectYear(year);
              },
              year
            })
          ) : (
            <CalendarYearPickerCell year={year} />
          )}
        </Fragment>
      ))}
    </>
  );
};

CalendarYearPickerGridBody.displayName = "Calendar.YearPickerGridBody";

type CalendarYearPickerCellProps = Omit<AriaButtonProps, "children"> & {
  year: number;
  children?:
    | ReactNode
    | ((values: CalendarYearPickerCellRenderProps) => ReactNode);
};

const CalendarYearPickerCell = forwardRef<
  HTMLButtonElement,
  CalendarYearPickerCellProps
>(
  (
    { children, excludeFromTabOrder, onFocus, onPress, year, ...props },
    ref
  ) => {
    const {
      activeYear,
      currentYear,
      focusedYear,
      getFormattedYear,
      isYearPickerOpen,
      selectYear,
      setActiveYear
    } = useGridContext();
    const isSelected = year === focusedYear;
    const formattedYear = getFormattedYear(year);
    const values: CalendarYearPickerCellRenderProps = {
      formattedYear,
      isCurrentYear: year === currentYear,
      isOpen: isYearPickerOpen,
      isSelected,
      selectYear: () => {
        selectYear(year);
      },
      year
    };

    return (
      <AriaButton
        ref={ref}
        aria-label={formattedYear}
        // The grid is a group of buttons, which can't be selected
        aria-current={isSelected || undefined}
        data-selected={dataAttr(isSelected)}
        data-tds="calendar-year-picker-cell"
        data-year={year}
        excludeFromTabOrder={
          excludeFromTabOrder ?? !(isYearPickerOpen && year === activeYear)
        }
        slot={null}
        onFocus={(event) => {
          onFocus?.(event);
          setActiveYear(year);
        }}
        onPress={(event) => {
          onPress?.(event);
          selectYear(year);
        }}
        {...props}
      >
        {typeof children === "function"
          ? children(values)
          : (children ?? formattedYear)}
      </AriaButton>
    );
  }
);

CalendarYearPickerCell.displayName = "Calendar.YearPickerCell";

export {
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerCell
};
export type {
  CalendarYearPickerTriggerProps,
  CalendarYearPickerTriggerHeadingProps,
  CalendarYearPickerTriggerIndicatorProps,
  CalendarYearPickerTriggerRenderProps,
  CalendarYearPickerGridProps,
  CalendarYearPickerGridBodyProps,
  CalendarYearPickerCellProps,
  CalendarYearPickerCellRenderProps
};
