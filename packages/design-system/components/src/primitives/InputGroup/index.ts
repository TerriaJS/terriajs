import {
  InputGroupInput,
  InputGroupPrefix,
  InputGroupRoot,
  InputGroupSuffix,
  InputGroupTextArea
} from "./InputGroup";

// Compound component, assembled here so InputGroup.tsx only exports components
export const InputGroup = Object.assign(InputGroupRoot, {
  Root: InputGroupRoot,
  Prefix: InputGroupPrefix,
  Input: InputGroupInput,
  TextArea: InputGroupTextArea,
  Suffix: InputGroupSuffix
});

export {
  InputGroupInput,
  InputGroupPrefix,
  InputGroupRoot,
  InputGroupSuffix,
  InputGroupTextArea
};
export type {
  InputGroupAffixProps,
  InputGroupInputProps,
  InputGroupProps,
  InputGroupTextAreaProps
} from "./InputGroup";
