import { createContext, useContext, type RefObject } from "react";
import { CalendarStateContext } from "react-aria-components/Calendar";
import { RangeCalendarStateContext } from "react-aria-components/RangeCalendar";

// Provided by Calendar to show and hide its year picker; the year picker's
// parts read it, so the Calendar's own API needs no wrapper

type YearPickerContextValue = {
  isYearPickerOpen: boolean;
  setIsYearPickerOpen: (open: boolean) => void;
  calendarRef: RefObject<HTMLDivElement | null>;
  /** The day grid the year grid lies over */
  calendarGridSlot: "calendar-grid" | "range-calendar-grid";
};

const YearPickerContext = createContext<YearPickerContextValue | null>(null);

/** The year picker's state; only inside a Calendar */
const useYearPicker = (): YearPickerContextValue => {
  const context = useContext(YearPickerContext);

  if (!context) {
    throw new Error(
      "useYearPicker must be used within a <Calendar> or <RangeCalendar> component."
    );
  }

  return context;
};

/** The Calendar's or RangeCalendar's state from React Aria */
const useCalendarOrRangeState = (): NonNullable<
  | React.ContextType<typeof CalendarStateContext>
  | React.ContextType<typeof RangeCalendarStateContext>
> => {
  const calendarState = useContext(CalendarStateContext);
  const rangeCalendarState = useContext(RangeCalendarStateContext);
  const state = calendarState ?? rangeCalendarState;

  if (!state) {
    throw new Error(
      "useCalendarOrRangeState must be used within a <Calendar> or <RangeCalendar> component."
    );
  }

  return state;
};

export { YearPickerContext, useYearPicker, useCalendarOrRangeState };
export type { YearPickerContextValue };
