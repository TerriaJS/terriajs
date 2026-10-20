import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import {
  type DOMRenderProps,
  type ValidationResult
} from "react-aria-components";
import { LabelContext } from "react-aria-components/Label";
import {
  SwitchButton as AriaSwitchButton,
  SwitchField as AriaSwitchField,
  type SwitchButtonProps as AriaSwitchButtonProps,
  type SwitchFieldProps as AriaSwitchFieldProps
} from "react-aria-components/Switch";
import { Description, FieldError } from "../Field";
import "./Switch.css";

export type SwitchSize = "sm" | "md" | "lg";

// The field: wraps Switch.Content and an optional Description or FieldError
export type SwitchRootProps = AriaSwitchFieldProps & {
  size?: SwitchSize;
};

export const SwitchRoot = ({
  size = "md",
  ...props
}: SwitchRootProps): React.ReactElement => {
  return <AriaSwitchField {...props} data-tds="switch" data-tds-size={size} />;
};

SwitchRoot.displayName = "Switch";

// A Label inside renders as a span: the content is already the <label>
const LABEL_SPAN_CONTEXT = { elementType: "span" };

export type SwitchContentProps = AriaSwitchButtonProps;

// The clickable label holding the control and the Label
export const SwitchContent = ({
  children,
  ...props
}: SwitchContentProps): React.ReactElement => {
  return (
    <AriaSwitchButton {...props} data-tds="switch-content">
      {(values) => (
        <LabelContext.Provider value={LABEL_SPAN_CONTEXT}>
          {typeof children === "function" ? children(values) : children}
        </LabelContext.Provider>
      )}
    </AriaSwitchButton>
  );
};

SwitchContent.displayName = "Switch.Content";

type SpanProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined>;

export type SwitchControlProps = SpanProps & { children: ReactNode };

// The track
export const SwitchControl = forwardRef<HTMLSpanElement, SwitchControlProps>(
  ({ render, ...props }, ref) => {
    const spanProps = { ...props, ref, "data-tds": "switch-control" };
    // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
    return render ? render(spanProps, undefined) : <span {...spanProps} />;
  }
);

SwitchControl.displayName = "Switch.Control";

export type SwitchThumbProps = SpanProps;

export const SwitchThumb = forwardRef<HTMLSpanElement, SwitchThumbProps>(
  ({ render, ...props }, ref) => {
    const spanProps = { ...props, ref, "data-tds": "switch-thumb" };
    // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
    return render ? render(spanProps, undefined) : <span {...spanProps} />;
  }
);

SwitchThumb.displayName = "Switch.Thumb";

export type SwitchIconProps = SpanProps & { children: ReactNode };

// An icon inside the thumb
export const SwitchIcon = forwardRef<HTMLSpanElement, SwitchIconProps>(
  ({ render, ...props }, ref) => {
    const spanProps = { ...props, ref, "data-tds": "switch-icon" };
    // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
    return render ? render(spanProps, undefined) : <span {...spanProps} />;
  }
);

SwitchIcon.displayName = "Switch.Icon";

export type SwitchProps = SwitchRootProps & {
  children: ReactNode;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
};

export const Switch = ({
  children,
  description,
  errorMessage,
  ...props
}: SwitchProps): React.ReactElement => {
  return (
    <SwitchRoot {...props}>
      <SwitchContent>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        {children}
      </SwitchContent>
      {description && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
    </SwitchRoot>
  );
};
