import { forwardRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import { composeRenderProps } from "react-aria-components/composeRenderProps";
import "./Button.css";
import { ProgressCircle } from "../ProgressCircle";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-soft";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isIconOnly?: boolean;
  fullWidth?: boolean;
  pendingLabel?: string;
} & AriaButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isIconOnly,
      fullWidth,
      pendingLabel,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <AriaButton
        ref={ref}
        {...props}
        data-tds="button"
        data-tds-variant={variant}
        data-tds-size={size}
        data-tds-icon-only={isIconOnly ? true : undefined}
        data-tds-full-width={fullWidth ? true : undefined}
      >
        {composeRenderProps(children, (children, { isPending }) => (
          <>
            <span
              data-tds="button-label"
              aria-hidden={isPending && !!pendingLabel}
            >
              {children}
            </span>
            {isPending && (
              <span data-tds="button-loader">
                <ProgressCircle
                  aria-label={pendingLabel}
                  isIndeterminate
                  color="current"
                  size="sm"
                >
                  <ProgressCircle.Track>
                    <ProgressCircle.TrackCircle />
                    <ProgressCircle.FillCircle />
                  </ProgressCircle.Track>
                </ProgressCircle>
              </span>
            )}
          </>
        ))}
      </AriaButton>
    );
  }
);

Button.displayName = "Button";
