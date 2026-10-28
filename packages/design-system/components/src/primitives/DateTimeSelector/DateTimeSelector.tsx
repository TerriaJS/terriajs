import { CalendarDate, DateFormatter } from "@internationalized/date";
import { ChevronLeftIcon } from "@terria/design-system-icons";
import {
  forwardRef,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import { useLocale } from "react-aria-components/I18nProvider";
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem
} from "react-aria-components/ListBox";
import { Calendar } from "../Calendar";
import { ScrollShadow } from "../ScrollShadow";
import {
  canGoBack,
  defaultPath,
  getView,
  parentPath,
  type DateTimePath
} from "./dateTimeSelectorModel";
import { dataAttr } from "../../utils/dataAttr";
import "./DateTimeSelector.css";

type DateTimeSelectorProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange" | "defaultValue"
> & {
  /** The dates there's data for: a time series' times */
  dates: Date[];
  /** The date chosen, marked among the times */
  value?: Date | null;
  /** Called with the time picked */
  onChange?: (date: Date) => void;
  /** How each time is labelled; by default the locale's date and time */
  formatTime?: (date: Date) => string;
};

const daysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const pad = (value: number): string => String(value).padStart(2, "0");

// TerriaJS's DateTimePicker: a time series' dates, picked by narrowing
// down. Centuries, then years, months, days and hours, each only when there
// are enough dates for it, then the times themselves. Year and month rows
// show which months and days have data. Levels with one option are skipped
const DateTimeSelector = forwardRef<HTMLDivElement, DateTimeSelectorProps>(
  ({ dates, value, onChange, formatTime, ...props }, ref) => {
    const { locale } = useLocale();
    const start = useMemo(() => defaultPath(dates), [dates]);
    const [path, setPath] = useState<DateTimePath>(start);
    // New dates start over: the old path may lead to levels they don't have
    const [pathStart, setPathStart] = useState(start);
    if (pathStart !== start) {
      setPathStart(start);
      setPath(start);
    }
    // Focus follows into the next level after a choice or going back, not on
    // first render, so the selector doesn't take focus as the page loads
    const [hasMoved, setHasMoved] = useState(false);
    // Into a list: its first option, or the selected one; with `true`, React
    // Aria focuses the list itself
    const focusList = hasMoved ? "first" : false;
    const view = useMemo(() => getView(dates, path), [dates, path]);
    const formats = useMemo(
      () => ({
        month: new DateFormatter(locale, { month: "long" }),
        // Short in the rows, as TerriaJS's, to leave a month's dots room
        monthShort: new DateFormatter(locale, { month: "short" }),
        day: new DateFormatter(locale, { dateStyle: "medium" }),
        time: new DateFormatter(locale, {
          dateStyle: "medium",
          timeStyle: "short"
        })
      }),
      [locale]
    );
    const labelTime = formatTime ?? ((date: Date) => formats.time.format(date));
    const go = (step: DateTimePath): void => {
      setPath({ ...path, ...step });
      setHasMoved(true);
    };

    const heading = {
      century: "Select a century",
      year: "Select a year",
      month: view.view === "month" ? String(view.year) : "",
      day: "",
      hour:
        view.view === "hour"
          ? `Select an hour on ${formats.day.format(
              new Date(view.year, view.month, view.day)
            )}`
          : "",
      time: "Select a time"
    }[view.view];

    const back = (
      <button
        type="button"
        aria-label="Back"
        disabled={!canGoBack(path, start)}
        data-tds="date-time-selector-back"
        onClick={() => {
          setPath(parentPath(path));
          setHasMoved(true);
        }}
      >
        <ChevronLeftIcon />
      </button>
    );

    // Each level's choices: one tab stop, moved through with the arrow keys,
    // Home and End, or by typing. The centuries are a grid; the rest a
    // scrolling list
    const level = ({
      label,
      isGrid = false,
      disabledKeys,
      selectedKeys,
      onAction,
      children
    }: {
      label: string;
      isGrid?: boolean;
      disabledKeys?: number[];
      selectedKeys?: number[];
      onAction: (key: number) => void;
      children: ReactNode;
    }): React.ReactElement => {
      const listBox = (
        <AriaListBox
          aria-label={label}
          layout={isGrid ? "grid" : "stack"}
          disabledKeys={disabledKeys}
          selectionMode={selectedKeys ? "single" : "none"}
          selectedKeys={selectedKeys}
          // eslint-disable-next-line jsx-a11y/no-autofocus -- Only after the user's own choice or Back, to carry focus into the level they moved to; never on first render
          autoFocus={focusList}
          data-tds={
            isGrid ? "date-time-selector-grid" : "date-time-selector-listbox"
          }
          onAction={(key) => {
            onAction(Number(key));
          }}
        >
          {children}
        </AriaListBox>
      );

      return isGrid ? (
        listBox
      ) : (
        <ScrollShadow data-tds-date-time-selector="">{listBox}</ScrollShadow>
      );
    };

    // A year's or month's row: its name, then a dot for each month or day,
    // filled where there's data
    const row = (
      id: number,
      name: string,
      dots: number,
      filled: number[],
      { firstDot = 0, shown = name }: { firstDot?: number; shown?: string } = {}
    ): React.ReactElement => (
      <AriaListBoxItem
        key={id}
        id={id}
        textValue={name}
        aria-label={name}
        data-tds="date-time-selector-row"
      >
        <span>{shown}</span>
        <span aria-hidden data-tds="date-time-selector-dots">
          {Array.from({ length: dots }, (_, index) => (
            <span
              key={index}
              data-tds="date-time-selector-dot"
              data-tds-filled={dataAttr(filled.includes(index + firstDot))}
            />
          ))}
        </span>
      </AriaListBoxItem>
    );

    return (
      <div
        {...props}
        ref={ref}
        data-tds="date-time-selector"
        data-tds-view={view.view}
      >
        {/* The day view's Calendar has a header of its own, which holds it */}
        {view.view !== "day" && (
          <div data-tds="date-time-selector-header">
            {back}
            {heading && (
              <span data-tds="date-time-selector-heading">{heading}</span>
            )}
          </div>
        )}

        {view.view === "century" &&
          level({
            label: "Centuries",
            isGrid: true,
            onAction: (century) => {
              go({ century });
            },
            children: view.centuries.map((century) => (
              <AriaListBoxItem
                key={century}
                id={century}
                textValue={`${String(century)}00`}
                data-tds="date-time-selector-option"
              >
                {century}00
              </AriaListBoxItem>
            ))
          })}

        {view.view === "year" &&
          level({
            label: "Years",
            onAction: (year) => {
              go({ year });
            },
            children: view.years.map(({ year, months }) =>
              row(year, String(year), 12, months)
            )
          })}

        {view.view === "month" &&
          level({
            label: "Months",
            disabledKeys: Array.from(
              { length: 12 },
              (_, month) => month
            ).filter(
              (month) => !view.months.some((entry) => entry.month === month)
            ),
            onAction: (month) => {
              go({ month });
            },
            children: Array.from({ length: 12 }, (_, month) =>
              row(
                month,
                formats.month.format(new Date(view.year, month, 1)),
                daysInMonth(view.year, month),
                view.months.find((entry) => entry.month === month)?.days ?? [],
                {
                  firstDot: 1,
                  shown: formats.monthShort.format(
                    new Date(view.year, month, 1)
                  )
                }
              )
            )
          })}

        {view.view === "day" && (
          <Calendar
            aria-label="Select a day"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- Only after the user's own choice or Back, as the lists
            autoFocus={hasMoved}
            focusedValue={new CalendarDate(view.year, view.month + 1, 1)}
            minValue={new CalendarDate(view.year, view.month + 1, 1)}
            maxValue={
              new CalendarDate(
                view.year,
                view.month + 1,
                daysInMonth(view.year, view.month)
              )
            }
            isDateUnavailable={(date) => !view.days.includes(date.day)}
            onChange={(date) => {
              go({ day: date.day });
            }}
          >
            <Calendar.Header data-tds-date-time-selector="">
              {back}
              <Calendar.Heading />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => <Calendar.Cell date={date} />}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        )}

        {view.view === "hour" &&
          level({
            label: "Hours",
            onAction: (hour) => {
              go({ hour });
            },
            children: view.hours.map(({ hour, count }) => {
              const range = `${pad(hour)}:00 – ${pad(hour + 1)}:00`;
              const options = `(${String(count)} ${count === 1 ? "option" : "options"})`;

              return (
                <AriaListBoxItem
                  key={hour}
                  id={hour}
                  textValue={`${range} ${options}`}
                  data-tds="date-time-selector-option"
                >
                  {/* One run of text, so the space is in its name too; the
                      count in brackets, as TerriaJS shows it */}
                  <span>
                    {`${range} `}
                    <span data-tds="date-time-selector-count">{options}</span>
                  </span>
                </AriaListBoxItem>
              );
            })
          })}

        {view.view === "time" &&
          level({
            label: "Times",
            selectedKeys: value ? [value.getTime()] : [],
            onAction: (time) => {
              const date = view.dates.find((entry) => entry.getTime() === time);
              if (date) onChange?.(date);
            },
            children: view.dates.map((date) => (
              <AriaListBoxItem
                key={date.getTime()}
                id={date.getTime()}
                textValue={labelTime(date)}
                data-tds="date-time-selector-option"
              >
                {labelTime(date)}
              </AriaListBoxItem>
            ))
          })}
      </div>
    );
  }
);

DateTimeSelector.displayName = "DateTimeSelector";

export { DateTimeSelector };
export type { DateTimeSelectorProps };
