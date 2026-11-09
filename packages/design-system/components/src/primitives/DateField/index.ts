import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix
} from "../DateInputGroup";
import { DateFieldRoot } from "./DateField";

// Compound component, assembled here so DateField.tsx only exports components
export const DateField = Object.assign(DateFieldRoot, {
  Root: DateFieldRoot,
  Group: DateInputGroupRoot,
  Input: DateInputGroupInput,
  InputContainer: DateInputGroupInputContainer,
  Segment: DateInputGroupSegment,
  Prefix: DateInputGroupPrefix,
  Suffix: DateInputGroupSuffix
});

export { DateFieldRoot };
export type {
  DateFieldRootProps,
  DateFieldRootProps as DateFieldProps
} from "./DateField";
