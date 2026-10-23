import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import { LabelContext } from "react-aria-components/Label";
import {
  RadioButton as AriaRadioButton,
  RadioField as AriaRadioField,
  type RadioButtonProps as AriaRadioButtonProps,
  type RadioFieldProps as AriaRadioFieldProps
} from "react-aria-components/RadioGroup";
import { Description } from "../Field";
import "./Radio.css";

// The field: wraps Radio.Content and an optional Description. Must sit in a
// RadioGroup, which owns the value, validation and variant
type RadioRootProps = AriaRadioFieldProps;

const RadioRoot = (props: RadioRootProps): React.ReactElement => {
  return <AriaRadioField {...props} data-tds="radio" />;
};

RadioRoot.displayName = "Radio";

// A Label inside renders as a span: the content is already the <label>
const LABEL_SPAN_CONTEXT = { elementType: "span" };

type RadioContentProps = AriaRadioButtonProps & { children: ReactNode };

// The clickable label holding the control and the Label
const RadioContent = ({
  children,
  ...props
}: RadioContentProps): React.ReactElement => {
  return (
    <AriaRadioButton {...props} data-tds="radio-content">
      <LabelContext.Provider value={LABEL_SPAN_CONTEXT}>
        {children}
      </LabelContext.Provider>
    </AriaRadioButton>
  );
};

RadioContent.displayName = "Radio.Content";

type SpanProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined>;

type RadioControlProps = SpanProps & { children: ReactNode };

// The circle
const RadioControl = forwardRef<HTMLSpanElement, RadioControlProps>(
  ({ render, ...props }, ref) => {
    const controlProps = { ...props, ref, "data-tds": "radio-control" };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
      render(controlProps, undefined)
    ) : (
      <span {...controlProps} />
    );
  }
);

RadioControl.displayName = "Radio.Control";

type RadioIndicatorProps = SpanProps;

// The dot while selected, unless children replace it
const RadioIndicator = forwardRef<HTMLSpanElement, RadioIndicatorProps>(
  ({ render, ...props }, ref) => {
    const indicatorProps = {
      "aria-hidden": true,
      ...props,
      ref,
      "data-tds": "radio-indicator"
    };
    return render ? (
      // eslint-disable-next-line react-hooks/refs -- `render` must receive the ref, as in react-aria
      render(indicatorProps, undefined)
    ) : (
      <span {...indicatorProps} />
    );
  }
);

RadioIndicator.displayName = "Radio.Indicator";

type RadioProps = Omit<RadioRootProps, "children"> & {
  /** The label */
  children: ReactNode;
  description?: string;
};

// The everyday radio: circle, label and optional description
const Radio = ({
  children,
  description,
  ...props
}: RadioProps): React.ReactElement => {
  return (
    <RadioRoot {...props}>
      <RadioContent>
        <RadioControl>
          <RadioIndicator />
        </RadioControl>
        {children}
      </RadioContent>
      {description && <Description>{description}</Description>}
    </RadioRoot>
  );
};

export { RadioRoot, RadioContent, RadioControl, RadioIndicator, Radio };
export type {
  RadioRootProps,
  RadioContentProps,
  RadioControlProps,
  RadioIndicatorProps,
  RadioProps
};
