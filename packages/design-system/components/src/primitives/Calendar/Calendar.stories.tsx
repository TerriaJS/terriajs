import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  getLocalTimeZone,
  isWeekend,
  parseDate,
  today,
  type DateValue
} from "@internationalized/date";
import { useLocale } from "react-aria-components/I18nProvider";
import { Calendar, type CalendarProps, type CalendarSelectionMode } from ".";
import { figmaDesign } from "../../figma";
import "./calendar.stories.css";

// Days with a dot under them, as in the design
const MARKED_DAYS = [2, 6, 14, 27, 28];

// The design's calendar: the month and year opening the year picker, the
// arrows, the days and the years. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const calendar = <M extends CalendarSelectionMode>(
  props: CalendarProps<DateValue, M>
): React.ReactElement => (
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
        {(date) => (
          <Calendar.Cell date={date}>
            {({ formattedDate, isOutsideMonth }) => (
              <>
                {formattedDate}
                {!isOutsideMonth && MARKED_DAYS.includes(date.day) && (
                  <Calendar.CellIndicator />
                )}
              </>
            )}
          </Calendar.Cell>
        )}
      </Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({ year }) => <Calendar.YearPickerCell year={year} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

const meta = {
  title: "Example/Date/Calendar",
  component: Calendar,
  parameters: {
    ...figmaDesign("Calendar"),
    docs: {
      description: {
        component:
          "A month of days to choose from, with the year chosen from its heading. Use it where seeing the days matters: the day of the week, dates that can't be chosen, dots on days with something on them. It sits inline, in a panel, or in a DatePicker's popover; several months can sit side by side. To type a date instead, use a DateField; for a time series' own dates, a DateTimeSelector. Values are @internationalized/date objects."
      }
    }
  },
  subcomponents: {
    "Calendar.Header": Calendar.Header,
    "Calendar.Heading": Calendar.Heading,
    "Calendar.NavButton": Calendar.NavButton,
    "Calendar.Grid": Calendar.Grid,
    "Calendar.Cell": Calendar.Cell,
    "Calendar.CellIndicator": Calendar.CellIndicator,
    "Calendar.YearPickerTrigger": Calendar.YearPickerTrigger,
    "Calendar.YearPickerGrid": Calendar.YearPickerGrid,
    "Calendar.YearPickerCell": Calendar.YearPickerCell
  },
  args: { defaultValue: parseDate("2025-12-16") },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    isDisabled: {
      control: "boolean",
      description: "Can't be changed or moved through",
      table: { type: { summary: "boolean" } }
    },
    isReadOnly: {
      control: "boolean",
      description: "Shows its value but can't be changed",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the day selected",
      table: { type: { summary: "(value: DateValue) => void" } }
    }
  },
  render: (args) => calendar(args)
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Press the month and year to choose a year; the arrows step months */
export const Default: Story = {};

export const Today: Story = {
  args: { defaultValue: today(getLocalTimeZone()) }
};

/** The year picker open over the days */
export const Years: Story = {
  args: { defaultYearPickerOpen: true }
};

/** Days before minValue or after maxValue are struck through; ones
 * isDateUnavailable picks, here weekends, are faded */
export const UnavailableDates: Story = {
  render: function Render(args) {
    const { locale } = useLocale();
    return calendar({
      ...args,
      minValue: parseDate("2025-12-05"),
      maxValue: parseDate("2026-01-20"),
      isDateUnavailable: (date) => isWeekend(date, locale)
    });
  }
};

/** Two months side by side, a heading and grid each; the second offset a
 * month on */
export const MultipleMonths: Story = {
  render: (args) => (
    <Calendar
      aria-label="Trip dates"
      className="calendar-stories-months"
      visibleDuration={{ months: 2 }}
      {...args}
    >
      {[0, 1].map((offset) => (
        <div key={offset} className="calendar-stories-month">
          <Calendar.Header>
            {offset === 0 ? (
              <Calendar.NavButton slot="previous" />
            ) : (
              <span className="calendar-stories-spacer" />
            )}
            <Calendar.Heading offset={{ months: offset }} />
            {offset === 1 ? (
              <Calendar.NavButton slot="next" />
            ) : (
              <span className="calendar-stories-spacer" />
            )}
          </Calendar.Header>
          <Calendar.Grid offset={{ months: offset }}>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </div>
      ))}
    </Calendar>
  )
};

export const Disabled: Story = {
  args: { isDisabled: true }
};

export const ReadOnly: Story = {
  args: { isReadOnly: true }
};
