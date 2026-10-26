import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  parseDate,
  parseDateTime,
  type CalendarDate,
  type CalendarDateTime,
  type DateValue
} from "@internationalized/date";
import { useState } from "react";
import { DatePicker, type DatePickerProps } from ".";
import { Calendar } from "../Calendar";
import { DateField } from "../DateField";
import { Description, FieldError, Label } from "../Field";
import { TimeField } from "../TimeField";
import { figmaDesign } from "../../figma";
import "./date-picker.stories.css";

// The design's popover calendar: the month and year opening the year picker,
// the arrows, the days and the years
const calendar = (): React.ReactElement => (
  <Calendar aria-label="Survey date">
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
        {(date) => <Calendar.Cell date={date} />}
      </Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({ year }) => <Calendar.YearPickerCell year={year} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

// The design's picker: the field with the trigger in its suffix, and the
// calendar in the popover. Called as a function, not rendered as a
// component, so a story's code shows the markup it returns
const picker = <T extends DateValue>(
  props: DatePickerProps<T>,
  popover: React.ReactNode = calendar()
): React.ReactElement => (
  <DatePicker {...props}>
    <Label>Survey date</Label>
    <DateField.Group fullWidth>
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
      <DateField.Suffix>
        <DatePicker.Trigger>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
      </DateField.Suffix>
    </DateField.Group>
    <Description>When the survey was flown</Description>
    <FieldError>Enter a date</FieldError>
    <DatePicker.Popover>{popover}</DatePicker.Popover>
  </DatePicker>
);

const meta = {
  title: "Example/Date/DatePicker",
  component: DatePicker,
  // At the top of the canvas, so the popover has room to open below
  parameters: {
    ...figmaDesign("DatePicker"),
    layout: "padded",
    docs: {
      description: {
        component:
          "A DateField with a button that opens a Calendar in a popover, so a date can be typed or picked. It's the usual way to ask for a date in a form when people may not know it offhand, such as the start of a range of interest. With a CalendarDateTime, a TimeField in the popover sets the time."
      }
    }
  },
  subcomponents: {
    "DatePicker.Trigger": DatePicker.Trigger,
    "DatePicker.TriggerIndicator": DatePicker.TriggerIndicator,
    "DatePicker.Popover": DatePicker.Popover
  },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    isInvalid: {
      control: "boolean",
      description: "Shows the FieldError and marks the field invalid",
      table: { type: { summary: "boolean" } }
    },
    isDisabled: {
      control: "boolean",
      description: "Can't be changed or opened",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the date typed or picked",
      table: { type: { summary: "(value: DateValue | null) => void" } }
    },
    onOpenChange: {
      action: "openChange",
      description: "Called as the popover opens and closes",
      table: { type: { summary: "(isOpen: boolean) => void" } }
    }
  },
  render: (args) => picker(args)
} satisfies Meta<typeof DatePicker<CalendarDate>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type a date, or press the calendar to pick one */
export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: parseDate("2025-12-16") }
};

export const Open: Story = {
  args: { defaultValue: parseDate("2025-12-16"), defaultOpen: true }
};

/** With a CalendarDateTime, the field has the time's segments too, and a
 * TimeField under the calendar sets them, as in the design. The two share
 * one value */
export const WithTime: Story = {
  render: function Render() {
    const [value, setValue] = useState<CalendarDateTime | null>(() =>
      parseDateTime("2025-12-16T10:30")
    );

    return picker(
      { value, onChange: setValue, granularity: "minute", defaultOpen: true },
      <div className="date-picker-stories-popover">
        {calendar()}
        <TimeField
          className="date-picker-stories-time"
          value={value}
          onChange={setValue}
        >
          <Label>Time</Label>
          <TimeField.Group variant="secondary">
            <TimeField.Input>
              {(segment) => <TimeField.Segment segment={segment} />}
            </TimeField.Input>
          </TimeField.Group>
        </TimeField>
      </div>
    );
  }
};

export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: parseDate("2025-12-16") }
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: parseDate("2025-12-16") }
};
