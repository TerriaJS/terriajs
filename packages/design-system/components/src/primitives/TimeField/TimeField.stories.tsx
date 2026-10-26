import type { Meta, StoryObj } from "@storybook/react-vite";
import { parseTime, type Time } from "@internationalized/date";
import type { TimeValue } from "react-aria-components/TimeField";
import { TimeField, type TimeFieldProps } from ".";
import { Description, FieldError, Label } from "../Field";
import type { InputVariant } from "../Input";
import { figmaDesign } from "../../figma";
import "../DateField/date-field.stories.css";

// The design's field: a label, the segments, and a description or error.
// Called as a function, not rendered as a component, so a story's code shows
// the markup it returns
const field = <T extends TimeValue>(
  props: TimeFieldProps<T>,
  variant: InputVariant = "primary"
): React.ReactElement => (
  <TimeField key={variant} {...props}>
    <Label>Capture time</Label>
    <TimeField.Group variant={variant}>
      <TimeField.Input>
        {(segment) => <TimeField.Segment segment={segment} />}
      </TimeField.Input>
    </TimeField.Group>
    <Description>Local time at the sensor</Description>
    <FieldError>Enter a time</FieldError>
  </TimeField>
);

const meta = {
  title: "Example/Date/TimeField",
  component: TimeField,
  parameters: {
    ...figmaDesign("TimeField"),
    docs: {
      description: {
        component:
          "A field to type a time into, a segment at a time: the hour, the minute and, in 12-hour locales, AM or PM; granularity adds seconds. Use it on its own for a time of day, such as when a scheduled update runs, or beside a Calendar for a date and time, as the DatePicker's popover does. Values are @internationalized/date objects."
      }
    }
  },
  subcomponents: {
    "TimeField.Group": TimeField.Group,
    "TimeField.Input": TimeField.Input,
    "TimeField.Segment": TimeField.Segment
  },
  // Its value props are React Aria's, which the docs don't list, so their
  // controls are listed here
  argTypes: {
    granularity: {
      control: "inline-radio",
      options: ["hour", "minute", "second"],
      description: "The smallest segment shown",
      table: { type: { summary: '"hour" | "minute" | "second"' } }
    },
    hourCycle: {
      control: "inline-radio",
      options: [12, 24],
      description: "12 or 24 hours; by default the locale's",
      table: { type: { summary: "12 | 24" } }
    },
    isInvalid: {
      control: "boolean",
      description: "Shows the FieldError and marks the field invalid",
      table: { type: { summary: "boolean" } }
    },
    isDisabled: {
      control: "boolean",
      description: "Can't be changed",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the time as each segment is typed",
      table: { type: { summary: "(value: TimeValue | null) => void" } }
    }
  },
  render: (args) => field(args)
} satisfies Meta<typeof TimeField<Time>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: parseTime("10:30") }
};

export const Variants: Story = {
  render: (args) => (
    <div className="date-field-stories-stack">
      {(["primary", "secondary"] as const).map((variant) =>
        field(args, variant)
      )}
    </div>
  )
};

export const TwentyFourHourWithSeconds: Story = {
  args: {
    defaultValue: parseTime("22:30:15"),
    granularity: "second",
    hourCycle: 24
  }
};

export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: parseTime("10:30") }
};

export const Disabled: Story = {
  args: { isDisabled: true, defaultValue: parseTime("10:30") }
};
