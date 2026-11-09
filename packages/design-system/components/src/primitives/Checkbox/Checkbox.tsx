import {
  forwardRef,
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps, ValidationResult } from "react-aria-components";
import {
  CheckboxButton as AriaCheckboxButton,
  CheckboxField as AriaCheckboxField,
  type CheckboxButtonProps as AriaCheckboxButtonProps,
  type CheckboxFieldProps as AriaCheckboxFieldProps,
  type CheckboxFieldRenderProps
} from "react-aria-components/Checkbox";
import { LabelContext } from "react-aria-components/Label";
import { CheckboxGroupContext } from "../CheckboxGroup/CheckboxGroupContext";
import { Description, FieldError } from "../Field";
import "./Checkbox.css";

type CheckboxVariant = "primary" | "secondary";

const CheckboxStateContext = createContext<CheckboxFieldRenderProps | null>(
  null
);

// The field: wraps Checkbox.Content and an optional Description or FieldError
type CheckboxRootProps = Omit<AriaCheckboxFieldProps, "children"> & {
  children: ReactNode | ((values: CheckboxFieldRenderProps) => ReactNode);
  /** Defaults to the CheckboxGroup's variant, then primary */
  variant?: CheckboxVariant;
};

const CheckboxRoot = ({
  variant,
  children,
  ...props
}: CheckboxRootProps): React.ReactElement => {
  const group = useContext(CheckboxGroupContext);

  return (
    <AriaCheckboxField
      {...props}
      data-tds="checkbox"
      data-tds-variant={variant ?? group?.variant ?? "primary"}
    >
      {(values) => (
        <CheckboxStateContext.Provider value={values}>
          {typeof children === "function" ? children(values) : children}
        </CheckboxStateContext.Provider>
      )}
    </AriaCheckboxField>
  );
};

CheckboxRoot.displayName = "Checkbox";

// A Label inside renders as a span: the content is already the <label>
const LABEL_SPAN_CONTEXT = { elementType: "span" };

type CheckboxContentProps = AriaCheckboxButtonProps & {
  children: ReactNode;
};

// The clickable label holding the control and the Label
const CheckboxContent = ({
  children,
  ...props
}: CheckboxContentProps): React.ReactElement => {
  return (
    <AriaCheckboxButton {...props} data-tds="checkbox-content">
      <LabelContext.Provider value={LABEL_SPAN_CONTEXT}>
        {children}
      </LabelContext.Provider>
    </AriaCheckboxButton>
  );
};

CheckboxContent.displayName = "Checkbox.Content";

type SpanProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined>;

type CheckboxControlProps = SpanProps & { children: ReactNode };

// The box
const CheckboxControl = forwardRef<HTMLSpanElement, CheckboxControlProps>(
  ({ render, ...props }, ref) => {
    const controlProps = { ...props, ref, "data-tds": "checkbox-control" };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
      render(controlProps, undefined)
    ) : (
      <span {...controlProps} />
    );
  }
);

CheckboxControl.displayName = "Checkbox.Control";

type CheckboxIndicatorProps = SpanProps;

// A checkmark, or a dash while indeterminate, unless children replace it
const CheckboxIndicator = forwardRef<HTMLSpanElement, CheckboxIndicatorProps>(
  ({ children, render, ...props }, ref) => {
    const state = useContext(CheckboxStateContext);
    const isSelected = state?.isSelected ?? false;
    const icon =
      children ??
      (state?.isIndeterminate ? (
        <svg
          data-tds="checkbox-indeterminate"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={3}
          viewBox="0 0 24 24"
        >
          <line x1="21" x2="3" y1="12" y2="12" />
        </svg>
      ) : (
        <svg
          data-tds="checkbox-checkmark"
          fill="none"
          stroke="currentColor"
          strokeDasharray={22}
          strokeDashoffset={isSelected ? 44 : 66}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 17 18"
        >
          <polyline points="1 9 7 14 15 4" />
        </svg>
      ));
    const indicatorProps = {
      "aria-hidden": true,
      ...props,
      ref,
      "data-tds": "checkbox-indicator"
    };

    return render ? (
      // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
      render({ ...indicatorProps, children: icon }, undefined)
    ) : (
      <span {...indicatorProps}>{icon}</span>
    );
  }
);

CheckboxIndicator.displayName = "Checkbox.Indicator";

type CheckboxProps = Omit<CheckboxRootProps, "children"> & {
  /** The label */
  children: ReactNode;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
};

// The everyday checkbox: box, label, and optional description and error
const Checkbox = ({
  children,
  description,
  errorMessage,
  ...props
}: CheckboxProps): React.ReactElement => {
  return (
    <CheckboxRoot {...props}>
      <CheckboxContent>
        <CheckboxControl>
          <CheckboxIndicator />
        </CheckboxControl>
        {children}
      </CheckboxContent>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </CheckboxRoot>
  );
};

export {
  CheckboxRoot,
  CheckboxContent,
  CheckboxControl,
  CheckboxIndicator,
  Checkbox
};
export type {
  CheckboxVariant,
  CheckboxRootProps,
  CheckboxContentProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxProps
};
