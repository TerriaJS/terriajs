import {
  forwardRef,
  useMemo,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import { Group, type GroupProps } from "react-aria-components/Group";
import type { ButtonSize, ButtonVariant } from "../Button/Button";
import { ButtonGroupContext } from "./ButtonGroupContext";
import "./ButtonGroup.css";

type ButtonGroupOrientation = "horizontal" | "vertical";

type ButtonGroupProps = Omit<GroupProps, "children"> & {
  children: ReactNode;
  /** Applied to every button that doesn't set its own */
  size?: ButtonSize;
  /** Applied to every button that doesn't set its own */
  variant?: ButtonVariant;
  orientation?: ButtonGroupOrientation;
  fullWidth?: boolean;
};

// Related buttons joined into one control
const ButtonGroupRoot = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      size,
      variant,
      isDisabled,
      fullWidth,
      orientation = "horizontal",
      ...props
    },
    ref
  ) => {
    const context = useMemo(
      () => ({ size, variant, isDisabled, fullWidth }),
      [size, variant, isDisabled, fullWidth]
    );

    return (
      <ButtonGroupContext.Provider value={context}>
        <Group
          {...props}
          ref={ref}
          isDisabled={isDisabled}
          data-tds="button-group"
          data-tds-orientation={orientation}
          data-tds-full-width={fullWidth ? true : undefined}
        />
      </ButtonGroupContext.Provider>
    );
  }
);

ButtonGroupRoot.displayName = "ButtonGroup";

type ButtonGroupSeparatorProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined>;

// A divider at the start of a button, between it and the one before
const ButtonGroupSeparator = forwardRef<
  HTMLSpanElement,
  ButtonGroupSeparatorProps
>(({ render, ...props }, ref) => {
  const separatorProps = {
    "aria-hidden": true,
    ...props,
    ref,
    "data-tds": "button-group-separator"
  };
  return render ? (
    render(separatorProps, undefined)
  ) : (
    <span {...separatorProps} />
  );
});

ButtonGroupSeparator.displayName = "ButtonGroup.Separator";

export { ButtonGroupRoot, ButtonGroupSeparator };
export type {
  ButtonGroupOrientation,
  ButtonGroupProps,
  ButtonGroupSeparatorProps
};
