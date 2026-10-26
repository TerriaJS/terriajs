import {
  DateField as AriaDateField,
  type DateFieldProps as AriaDateFieldProps,
  type DateValue
} from "react-aria-components/DateField";
import "../Field/Field.css";

type DateFieldRootProps<T extends DateValue> = AriaDateFieldProps<T> & {
  /** Fill the container's width; otherwise the field hugs its input */
  fullWidth?: boolean;
};

// Stacks a Label, a DateField.Group typed into a segment at a time, and a
// Description or FieldError. Values are @internationalized/date objects:
// CalendarDate, CalendarDateTime or ZonedDateTime
const DateFieldRoot = <T extends DateValue>({
  fullWidth,
  ...props
}: DateFieldRootProps<T>): React.ReactElement => {
  return (
    <AriaDateField
      {...props}
      data-tds="date-field"
      data-tds-full-width={fullWidth ? true : undefined}
    />
  );
};

DateFieldRoot.displayName = "DateField";

export { DateFieldRoot };
export type { DateFieldRootProps };
