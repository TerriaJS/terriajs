import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix
} from "../DateInputGroup";
import { TimeFieldRoot } from "./TimeField";

// Compound component, assembled here so TimeField.tsx only exports components
export const TimeField = Object.assign(TimeFieldRoot, {
  Root: TimeFieldRoot,
  Group: DateInputGroupRoot,
  Input: DateInputGroupInput,
  InputContainer: DateInputGroupInputContainer,
  Segment: DateInputGroupSegment,
  Prefix: DateInputGroupPrefix,
  Suffix: DateInputGroupSuffix
});

export { TimeFieldRoot };
export type {
  TimeFieldRootProps,
  TimeFieldRootProps as TimeFieldProps
} from "./TimeField";
