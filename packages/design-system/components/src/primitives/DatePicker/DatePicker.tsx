import { mergeRefs } from "@react-aria/utils";
import { CalendarIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject
} from "react";
import type { DOMRenderProps } from "react-aria-components";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  DatePicker as AriaDatePicker,
  type DatePickerProps as AriaDatePickerProps,
  type DateValue
} from "react-aria-components/DatePicker";
import { Dialog } from "react-aria-components/Dialog";
import { PopoverContent, type PopoverContentProps } from "../Popover";
import "../Field/Field.css";
import "./DatePicker.css";

type DatePickerContextValue = {
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const DatePickerContext = createContext<DatePickerContextValue>({
  triggerRef: { current: null }
});

type DatePickerRootProps<T extends DateValue> = AriaDatePickerProps<T>;

// A DateField with a button that opens a Calendar in a popover: a Label, a
// DateField.Group with DatePicker.Trigger in its suffix, a Description or
// FieldError, and DatePicker.Popover holding the Calendar
const DatePickerRoot = <T extends DateValue>({
  onOpenChange,
  ...props
}: DatePickerRootProps<T>): React.ReactElement => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const shouldRestoreFocusToTriggerRef = useRef(false);

  // Closed with the keyboard, focus goes back to the trigger; React Aria
  // leaves it in the field otherwise
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (event: KeyboardEvent): void => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        shouldRestoreFocusToTriggerRef.current = true;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [isOpen]);

  const handleOpenChange = (nextIsOpen: boolean): void => {
    setIsOpen(nextIsOpen);

    if (!nextIsOpen && shouldRestoreFocusToTriggerRef.current) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }

    shouldRestoreFocusToTriggerRef.current = false;
    onOpenChange?.(nextIsOpen);
  };

  const contextValue = useMemo(() => ({ triggerRef }), []);

  return (
    <DatePickerContext.Provider value={contextValue}>
      <AriaDatePicker
        data-tds="date-picker"
        {...props}
        onOpenChange={handleOpenChange}
      />
    </DatePickerContext.Provider>
  );
};

DatePickerRoot.displayName = "DatePicker";

type DatePickerTriggerProps = AriaButtonProps;

// Opens the popover; put it in the DateField.Group's suffix
const DatePickerTrigger = forwardRef<HTMLButtonElement, DatePickerTriggerProps>(
  (props, ref) => {
    const { triggerRef } = useContext(DatePickerContext);
    const contextRef = useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node;
      },
      [triggerRef]
    );
    const mergedRef = useMemo(
      () => mergeRefs(contextRef, ref),
      [contextRef, ref]
    );

    return (
      <AriaButton {...props} ref={mergedRef} data-tds="date-picker-trigger" />
    );
  }
);

DatePickerTrigger.displayName = "DatePicker.Trigger";

type DatePickerTriggerIndicatorProps = ComponentPropsWithoutRef<"span"> &
  DOMRenderProps<"span", undefined> & { children?: ReactNode };

// The trigger's icon: a calendar unless given children
const DatePickerTriggerIndicator = forwardRef<
  HTMLSpanElement,
  DatePickerTriggerIndicatorProps
>(({ children, render, ...props }, ref) => {
  const indicatorProps = {
    ...props,
    ref,
    "aria-hidden": true,
    "data-tds": "date-picker-trigger-indicator"
  };
  const icon = children ?? <CalendarIcon />;

  return render ? (
    // eslint-disable-next-line react-hooks/refs -- render takes the ref to put on the element it returns, as React Aria's render props do
    render({ ...indicatorProps, children: icon }, undefined)
  ) : (
    <span {...indicatorProps}>{icon}</span>
  );
});

DatePickerTriggerIndicator.displayName = "DatePicker.TriggerIndicator";

type DatePickerPopoverProps = PopoverContentProps;

// Holds the Calendar, below the field unless placed elsewhere. The dialog
// inside takes its name from the field's label
const DatePickerPopover = ({
  children,
  ...props
}: DatePickerPopoverProps): React.ReactElement => {
  return (
    <PopoverContent placement="bottom" {...props}>
      {(values) => (
        <Dialog data-tds="date-picker-dialog">
          {typeof children === "function" ? children(values) : children}
        </Dialog>
      )}
    </PopoverContent>
  );
};

DatePickerPopover.displayName = "DatePicker.Popover";

export {
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
  DatePickerPopover
};
export type {
  DatePickerRootProps,
  DatePickerTriggerProps,
  DatePickerTriggerIndicatorProps,
  DatePickerPopoverProps
};
