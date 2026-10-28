import {
  TimeField as AriaTimeField,
  type TimeFieldProps as AriaTimeFieldProps,
  type TimeValue
} from "react-aria-components/TimeField";
import { dataAttr } from "../../utils/dataAttr";
import "../Field/Field.css";

type TimeFieldRootProps<T extends TimeValue> = AriaTimeFieldProps<T> & {
  /** Fill the container's width; otherwise the field hugs its input */
  fullWidth?: boolean;
};

// Stacks a Label, a TimeField.Group typed into a segment at a time, and a
// Description or FieldError. Values are @internationalized/date objects:
// Time, CalendarDateTime or ZonedDateTime
const TimeFieldRoot = <T extends TimeValue>({
  fullWidth,
  ...props
}: TimeFieldRootProps<T>): React.ReactElement => {
  return (
    <AriaTimeField
      {...props}
      data-tds="time-field"
      data-tds-full-width={dataAttr(fullWidth)}
    />
  );
};

TimeFieldRoot.displayName = "TimeField";

export { TimeFieldRoot };
export type { TimeFieldRootProps };
