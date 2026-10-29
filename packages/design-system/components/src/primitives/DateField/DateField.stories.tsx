import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  now,
  parseDate,
  type CalendarDate,
  type DateValue
} from "@internationalized/date";
import { CalendarIcon } from "@terria/design-system-icons";
import { DateField, type DateFieldProps } from ".";
import { Description, FieldError, Label } from "../Field";
import type { InputVariant } from "../Input";
import { figmaDesign } from "../../figma";
import "./date-field.stories.css";

// The design's field: a label, the segments, and a description or error.
// Called as a function, not rendered as a component, so a story's code shows
// the markup it returns
const field = <T extends DateValue>(
  props: DateFieldProps<T>,
  variant: InputVariant = "primary"
): React.ReactElement => (
  <DateField key={variant} {...props}>
    <Label>Survey date</Label>
    <DateField.Group variant={variant}>
      <DateField.Input>
        {(segment) => <DateField.Segment segment={segment} />}
      </DateField.Input>
    </DateField.Group>
    <Description>When the survey was flown</Description>
    <FieldError>Enter a date</FieldError>
  </DateField>
);

const meta = {
  title: "Example/Date/DateField",
  component: DateField,
  parameters: {
    ...figmaDesign("DateField"),
    docs: {
      description: {
        component:
          "A field to type a date into, a part at a time: the month, day and year are each a segment, moved between with the arrow keys or as each fills, and stepped with the up and down arrows. Use it when the date is known and quicker typed than found, such as a date of birth or the date a survey was flown. Given a CalendarDateTime or ZonedDateTime it takes the time as well. When people need to see the days around a date, or browse to one, use a DatePicker. Values are @internationalized/date objects."
      }
    }
  },
  subcomponents: {
    "DateField.Group": DateField.Group,
    "DateField.Input": DateField.Input,
    "DateField.Segment": DateField.Segment,
    "DateField.Prefix": DateField.Prefix,
    "DateField.Suffix": DateField.Suffix
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
      description: "Can't be changed",
      table: { type: { summary: "boolean" } }
    },
    isRequired: {
      control: "boolean",
      description: "Marks the label, and is invalid while empty in a form",
      table: { type: { summary: "boolean" } }
    },
    onChange: {
      action: "change",
      description: "Called with the date as each segment is typed",
      table: { type: { summary: "(value: DateValue | null) => void" } }
    }
  },
  render: (args) => field(args)
} satisfies Meta<typeof DateField<CalendarDate>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Typed into a segment at a time: arrow keys step a segment, and typing
 * moves on once it's full */
export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: parseDate("2025-12-16") }
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

/** With a CalendarDateTime or ZonedDateTime, the time's segments follow the
 * date's; granularity sets the smallest */
export const WithTime: Story = {
  render: () => (
    <DateField
      defaultValue={now("America/New_York")}
      granularity="second"
      hideTimeZone={false}
    >
      <Label>Captured</Label>
      <DateField.Group>
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <CalendarIcon />
        </DateField.Suffix>
      </DateField.Group>
    </DateField>
  )
};

export const WithPrefixAndSuffix: Story = {
  args: { fullWidth: true },
  render: (args) => (
    <DateField {...args}>
      <Label>Survey date</Label>
      <DateField.Group fullWidth>
        <DateField.Prefix>
          <CalendarIcon />
        </DateField.Prefix>
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>UTC</DateField.Suffix>
      </DateField.Group>
    </DateField>
  )
};

export const Invalid: Story = {
  args: { isInvalid: true, defaultValue: parseDate("2025-12-16") }
};

export const Disabled: Story = {
  parameters: {
    // Text in a disabled field has no contrast requirement (WCAG 1.4.3);
    // axe only knows that for labels, not descriptions or values
    a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } }
  },
  args: { isDisabled: true, defaultValue: parseDate("2025-12-16") }
};
