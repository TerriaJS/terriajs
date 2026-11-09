import { ButtonGroupRoot, ButtonGroupSeparator } from "./ButtonGroup";

// Compound component, assembled here so ButtonGroup.tsx only exports components
export const ButtonGroup = Object.assign(ButtonGroupRoot, {
  Root: ButtonGroupRoot,
  Separator: ButtonGroupSeparator
});

export { ButtonGroupRoot, ButtonGroupSeparator };
export type {
  ButtonGroupOrientation,
  ButtonGroupProps,
  ButtonGroupSeparatorProps
} from "./ButtonGroup";
