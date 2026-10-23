import { forwardRef, useMemo } from "react";
import {
  ToggleButtonGroup as AriaToggleButtonGroup,
  type ToggleButtonGroupProps as AriaToggleButtonGroupProps
} from "react-aria-components/ToggleButtonGroup";
import type { ButtonSize } from "../Button/Button";
import "../ButtonGroup/ButtonGroup.css";
import { ButtonGroupContext } from "../ButtonGroup/ButtonGroupContext";
import "./ToggleButtonGroup.css";

type ToggleButtonGroupProps = AriaToggleButtonGroupProps & {
  /** Applied to every button that doesn't set its own */
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Spaces the buttons apart instead of joining them */
  isDetached?: boolean;
};

// Toggle buttons with one selection between them, or several with
// selectionMode="multiple". Laid out as a ButtonGroup: joined, unless detached
const ToggleButtonGroupRoot = forwardRef<
  HTMLDivElement,
  ToggleButtonGroupProps
>(
  (
    {
      size,
      fullWidth,
      isDetached,
      isDisabled,
      orientation = "horizontal",
      ...props
    },
    ref
  ) => {
    const context = useMemo(
      () => ({ size, isDisabled, fullWidth }),
      [size, isDisabled, fullWidth]
    );

    return (
      <ButtonGroupContext.Provider value={context}>
        <AriaToggleButtonGroup
          {...props}
          ref={ref}
          isDisabled={isDisabled}
          orientation={orientation}
          data-tds="button-group"
          data-tds-toggle
          data-tds-orientation={orientation}
          data-tds-full-width={fullWidth ? true : undefined}
          data-tds-detached={isDetached ? true : undefined}
        />
      </ButtonGroupContext.Provider>
    );
  }
);

ToggleButtonGroupRoot.displayName = "ToggleButtonGroup";

export { ToggleButtonGroupRoot };
export type { ToggleButtonGroupProps };
