import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarIcon } from "@terria/design-system-icons";
import { useState } from "react";
import { DateTimeSelector } from ".";
import { Button } from "../Button";
import { Popover } from "../Popover";
import "./date-time-selector.stories.css";

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

const meta = {
  title: "Example/Date/DateTimeSelector",
  component: DateTimeSelector,
  parameters: {
    docs: {
      description: {
        component:
          "Picks one of a time series' own dates, the way TerriaJS's timeline does. Given the dates a dataset has data for, it narrows down by century, year, month, day and hour, each only when there are enough dates for it, then lists the times; year and month rows show where there's data, and days without any can't be picked. Use it to move a time-varying layer to one of its own times, where any other date would show nothing. To enter an arbitrary date, use a DatePicker. Its levels are TerriaJS's DateTimePicker's, and getView, defaultPath, parentPath and canGoBack expose them."
      }
    }
  },
  args: { dates: DECADES },
  argTypes: {
    onChange: {
      action: "change",
      description: "Called with the time picked"
    }
  }
} satisfies Meta<typeof DateTimeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dates across centuries start at the centuries; each choice narrows to
 * the next level, and back goes up one */
export const Centuries: Story = {};

/** One century, so it starts at the years, each row showing which months
 * have data */
export const Years: Story = {
  args: { dates: TWO_YEARS }
};

/** One month, so it starts at the days: only those with data can be picked.
 * A day has 48 times, so its hours come next */
export const DaysAndHours: Story = {
  args: { dates: HALF_HOURLY }
};

/** Too few to narrow down, so the times are listed at once */
export const FewTimes: Story = {
  args: { dates: FEW, value: FEW[2] }
};

/** As TerriaJS opens it from the timeline: in a popover, closing on a pick */
export const InPopover: Story = {
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(false);
    const [value, setValue] = useState<Date | undefined>();

    return (
      <div className="date-time-selector-stories-row">
        <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
          <Button isIconOnly aria-label="Pick a time" variant="secondary">
            <CalendarIcon />
          </Button>
          <Popover.Content placement="bottom start">
            <Popover.Dialog
              aria-label="Pick a time"
              className="date-time-selector-stories-dialog"
            >
              <DateTimeSelector
                {...args}
                value={value}
                onChange={(date) => {
                  setValue(date);
                  setIsOpen(false);
                  args.onChange?.(date);
                }}
              />
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
        <span>{value ? value.toLocaleString() : "No time picked"}</span>
      </div>
    );
  }
};
