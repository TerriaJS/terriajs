import { ChevronDownIcon, XIcon } from "@terria/design-system-icons";
import {
  forwardRef,
  createContext,
  useContext,
  useMemo,
  type ComponentPropsWithoutRef
} from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  Select as AriaSelect,
  SelectStateContext,
  SelectValue as AriaSelectValue,
  type SelectProps as AriaSelectProps,
  type SelectValueProps as AriaSelectValueProps
} from "react-aria-components/Select";
import type { InputVariant } from "../Input";
import { PopoverContent, type PopoverContentProps } from "../Popover";
import { dataAttr } from "../../utils/dataAttr";
import "../Input/Input.css";
import "./Select.css";

type SelectProps<
  T extends object,
  M extends "single" | "multiple" = "single"
> = AriaSelectProps<T, M> & {
  variant?: InputVariant;
  fullWidth?: boolean;
  /** Called when the clear button or Backspace/Delete clears the choice */
  onClear?: () => void;
};

const SelectContext = createContext<{ onClear?: () => void }>({});

const SelectRoot = <
  T extends object,
  M extends "single" | "multiple" = "single"
>({
  variant = "primary",
  fullWidth,
  onClear,
  ...props
}: SelectProps<T, M>): React.ReactElement => {
  const context = useMemo(() => ({ onClear }), [onClear]);

  return (
    <SelectContext.Provider value={context}>
      <AriaSelect<T, M>
        {...props}
        data-tds="select"
        data-tds-variant={variant}
        data-tds-full-width={dataAttr(fullWidth)}
      />
    </SelectContext.Provider>
  );
};

SelectRoot.displayName = "Select";

// selectionManager.clearSelection() is a no-op here: a single select disallows
// an empty selection, so the value is reset instead
const useClear = (): (() => void) => {
  const state = useContext(SelectStateContext);
  const { onClear } = useContext(SelectContext);
  return () => {
    state?.setValue(
      state.selectionManager.selectionMode === "multiple" ? [] : null
    );
    onClear?.();
  };
};

type SelectTriggerProps = AriaButtonProps;

const SelectTrigger = ({
  onKeyDown,
  ...props
}: SelectTriggerProps): React.ReactElement => {
  const state = useContext(SelectStateContext);
  const clear = useClear();

  return (
    <AriaButton
      {...props}
      data-tds="select-trigger"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // Keyboard users can't reach the clear button inside the trigger, so a
        // clearable select also clears with Backspace or Delete
        const isClearKey = event.key === "Backspace" || event.key === "Delete";
        const target: unknown = event.currentTarget;
        const isClearable =
          target instanceof Element &&
          target.querySelector('[data-tds="select-clear-button"]') !== null;
        const isEmpty = (state?.selectionManager.selectedKeys.size ?? 0) === 0;
        if (isClearKey && isClearable && !isEmpty && !state?.isOpen) {
          clear();
          return;
        }
        // react-aria stops keydown propagation unless a handler opts back in
        event.continuePropagation();
      }}
    />
  );
};

SelectTrigger.displayName = "Select.Trigger";

type SelectValueProps<T extends object> = AriaSelectValueProps<T>;

// Shows the option's text only; an option's icon or description would stretch
// the trigger. Pass children to render something else.
const SelectValue = <T extends object>({
  children,
  ...props
}: SelectValueProps<T>): React.ReactElement => {
  return (
    <AriaSelectValue {...props} data-tds="select-value">
      {children ??
        (({ isPlaceholder, selectedText, defaultChildren }) =>
          isPlaceholder ? defaultChildren : selectedText)}
    </AriaSelectValue>
  );
};

SelectValue.displayName = "Select.Value";

type SelectIndicatorProps = ComponentPropsWithoutRef<"span">;

// A chevron that flips while the list is open, unless children replace it
const SelectIndicator = forwardRef<HTMLSpanElement, SelectIndicatorProps>(
  ({ children, ...props }, ref) => {
    return (
      <span aria-hidden="true" {...props} ref={ref} data-tds="select-indicator">
        {children ?? <ChevronDownIcon />}
      </span>
    );
  }
);

SelectIndicator.displayName = "Select.Indicator";

type SelectClearButtonProps = ComponentPropsWithoutRef<"span">;

// A span, not a button: buttons can't nest inside the trigger button
const SelectClearButton = forwardRef<HTMLSpanElement, SelectClearButtonProps>(
  ({ children, onClick, onPointerDown, ...props }, ref) => {
    const state = useContext(SelectStateContext);
    const clear = useClear();
    const isEmpty = (state?.selectionManager.selectedKeys.size ?? 0) === 0;

    return (
      <span
        aria-hidden="true"
        aria-label="Clear selection"
        aria-description="Press backspace or delete to clear value"
        {...props}
        ref={ref}
        data-tds="select-clear-button"
        data-empty={dataAttr(isEmpty)}
        onPointerDown={(event) => {
          // Keep the press from reaching the trigger, which would open the list
          event.stopPropagation();
          onPointerDown?.(event);
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          clear();
          onClick?.(event);
        }}
      >
        {children ?? <XIcon size={14} />}
      </span>
    );
  }
);

SelectClearButton.displayName = "Select.ClearButton";

type SelectPopoverProps = PopoverContentProps;

const SelectPopover = (props: SelectPopoverProps): React.ReactElement => {
  return <PopoverContent placement="bottom" {...props} />;
};

SelectPopover.displayName = "Select.Popover";

export {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIndicator,
  SelectClearButton,
  SelectPopover
};
export type {
  SelectProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIndicatorProps,
  SelectClearButtonProps,
  SelectPopoverProps
};
