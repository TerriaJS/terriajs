import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  DateInput as AriaDateInput,
  DateSegment as AriaDateSegment,
  type DateInputProps as AriaDateInputProps,
  type DateSegmentProps as AriaDateSegmentProps
} from "react-aria-components/DateField";
import {
  InputGroupPrefix,
  InputGroupRoot,
  InputGroupSuffix,
  type InputGroupAffixProps,
  type InputGroupProps
} from "../InputGroup";
import "./DateInputGroup.css";

// The field box a DateField,
// TimeField or DatePicker types into. Its root, prefix and suffix are the
// InputGroup's, so it looks and behaves as any other field; the input holds
// a segment for each part of the date or time in place of a text input

type DateInputGroupRootProps = InputGroupProps;
type DateInputGroupPrefixProps = InputGroupAffixProps;
type DateInputGroupSuffixProps = InputGroupAffixProps;

type DateInputGroupInputProps = AriaDateInputProps;

// Takes each segment of the value in turn: (segment) => <Segment segment={segment} />.
// It works in a TimeField as well, which reads the same contexts
const DateInputGroupInput = forwardRef<
  HTMLDivElement,
  DateInputGroupInputProps
>((props, ref) => {
  return <AriaDateInput {...props} ref={ref} data-tds="date-input" />;
});

DateInputGroupInput.displayName = "DateField.Input";

type DateInputGroupInputContainerProps = ComponentPropsWithoutRef<"div">;

// Scrolls the segments sideways when they don't fit, rather than wrapping
const DateInputGroupInputContainer = forwardRef<
  HTMLDivElement,
  DateInputGroupInputContainerProps
>((props, ref) => {
  return <div {...props} ref={ref} data-tds="date-input-container" />;
});

DateInputGroupInputContainer.displayName = "DateField.InputContainer";

type DateInputGroupSegmentProps = AriaDateSegmentProps;

// One part of the value, as a spinbutton: a month, a day, an hour. The
// separators between them are segments too, of the literal type
const DateInputGroupSegment = forwardRef<
  HTMLSpanElement,
  DateInputGroupSegmentProps
>((props, ref) => {
  return <AriaDateSegment {...props} ref={ref} data-tds="date-segment" />;
});

DateInputGroupSegment.displayName = "DateField.Segment";

export {
  InputGroupRoot as DateInputGroupRoot,
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupSegment,
  InputGroupPrefix as DateInputGroupPrefix,
  InputGroupSuffix as DateInputGroupSuffix
};
export type {
  DateInputGroupRootProps,
  DateInputGroupInputProps,
  DateInputGroupInputContainerProps,
  DateInputGroupSegmentProps,
  DateInputGroupPrefixProps,
  DateInputGroupSuffixProps
};
