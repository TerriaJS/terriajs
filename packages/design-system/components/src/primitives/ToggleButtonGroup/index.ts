import { ButtonGroupSeparator } from "../ButtonGroup/ButtonGroup";
import { ToggleButtonGroupRoot } from "./ToggleButtonGroup";

// Compound component; the separator is the ButtonGroup one
export const ToggleButtonGroup = Object.assign(ToggleButtonGroupRoot, {
  Root: ToggleButtonGroupRoot,
  Separator: ButtonGroupSeparator
});

export { ToggleButtonGroupRoot };
export type { ToggleButtonGroupProps } from "./ToggleButtonGroup";
