import { mergeRefs } from "@react-aria/utils";
import { ChevronDownIcon, XIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type RefObject
} from "react";
import {
  Autocomplete as AriaAutocomplete,
  type AutocompleteProps as AriaAutocompleteProps
} from "react-aria-components/Autocomplete";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  Group as AriaGroup,
  type GroupProps as AriaGroupProps
} from "react-aria-components/Group";
import {
  Select as AriaSelect,
  SelectStateContext,
  type SelectProps as AriaSelectProps
} from "react-aria-components/Select";
import type { InputVariant } from "../Input";
import { PopoverContent, type PopoverContentProps } from "../Popover";
import { SelectValue } from "../Select";
import { dataAttr } from "../../utils/dataAttr";
import "../Input/Input.css";
import "./Autocomplete.css";

type AutocompleteContextValue = {
  onClear?: () => void;
  isDisabled?: boolean;
  triggerRef: RefObject<HTMLDivElement | null>;
  clearButtonRef: RefObject<HTMLButtonElement | null>;
};

const AutocompleteContext = createContext<AutocompleteContextValue>({
  triggerRef: { current: null },
  clearButtonRef: { current: null }
});

type AutocompleteRootProps<
  T extends object,
  M extends "single" | "multiple" = "single"
> = AriaSelectProps<T, M> & {
  variant?: InputVariant;
  fullWidth?: boolean;
  /** Called when the clear button clears the choice */
  onClear?: () => void;
};

// A Select whose popover holds a search field filtering its list: a Label,
// Autocomplete.Trigger with the Value, ClearButton and Indicator, and
// Autocomplete.Popover holding a Filter around a SearchField and a ListBox
const AutocompleteRoot = <
  T extends object,
  M extends "single" | "multiple" = "single"
>({
  variant = "primary",
  fullWidth,
  isDisabled,
  onClear,
  ...props
}: AutocompleteRootProps<T, M>): React.ReactElement => {
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const clearButtonRef = useRef<HTMLButtonElement | null>(null);
  const context = useMemo(
    () => ({ onClear, isDisabled, triggerRef, clearButtonRef }),
    [onClear, isDisabled]
  );

  return (
    <AutocompleteContext.Provider value={context}>
      <AriaSelect<T, M>
        {...props}
        isDisabled={isDisabled}
        data-tds="autocomplete"
        data-tds-variant={variant}
        data-tds-full-width={dataAttr(fullWidth)}
      />
    </AutocompleteContext.Provider>
  );
};

AutocompleteRoot.displayName = "Autocomplete";

type AutocompleteTriggerProps = AriaGroupProps;

// The field: pressing anywhere on it opens the list, but for the clear
// button. The Indicator inside is the button that opens it from the keyboard
const AutocompleteTrigger = forwardRef<
  HTMLDivElement,
  AutocompleteTriggerProps
>(({ onClick, isDisabled, ...props }, ref) => {
  const {
    clearButtonRef,
    isDisabled: rootDisabled,
    triggerRef
  } = useContext(AutocompleteContext);
  const state = useContext(SelectStateContext);
  const contextRef = useCallback(
    (node: HTMLDivElement | null) => {
      triggerRef.current = node;
    },
    [triggerRef]
  );
  const mergedRef = useMemo(
    () => mergeRefs(contextRef, ref),
    [contextRef, ref]
  );

  return (
    <AriaGroup
      {...props}
      ref={mergedRef}
      isDisabled={isDisabled ?? rootDisabled}
      data-tds="autocomplete-trigger"
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (clearButtonRef.current?.contains(event.target as Node)) return;
        onClick?.(event);
        // The select's toggle opens it even when disabled
        if (isDisabled ?? rootDisabled) return;
        state?.toggle();
      }}
    />
  );
});

AutocompleteTrigger.displayName = "Autocomplete.Trigger";

type AutocompleteIndicatorProps = Omit<AriaButtonProps, "children"> & {
  children?: React.ReactNode;
};

// The button that opens the list, named by the label and the value; a
// chevron that turns while it's open, unless children replace it
const AutocompleteIndicator = forwardRef<
  HTMLButtonElement,
  AutocompleteIndicatorProps
>(({ children, ...props }, ref) => {
  const state = useContext(SelectStateContext);

  return (
    <AriaButton
      {...props}
      ref={ref}
      data-tds="autocomplete-indicator"
      data-open={dataAttr(state?.isOpen)}
    >
      {children ?? <ChevronDownIcon aria-hidden />}
    </AriaButton>
  );
});

AutocompleteIndicator.displayName = "Autocomplete.Indicator";

type AutocompleteClearButtonProps = ComponentPropsWithoutRef<"button">;

// Clears the choice, without opening the list; hidden while there's none.
// Not a tab stop, as a select's isn't
const AutocompleteClearButton = forwardRef<
  HTMLButtonElement,
  AutocompleteClearButtonProps
>(({ children, onClick, ...props }, ref) => {
  const { clearButtonRef, isDisabled, onClear } =
    useContext(AutocompleteContext);
  const state = useContext(SelectStateContext);
  const contextRef = useCallback(
    (node: HTMLButtonElement | null) => {
      clearButtonRef.current = node;
    },
    [clearButtonRef]
  );
  const mergedRef = useMemo(
    () => mergeRefs(contextRef, ref),
    [contextRef, ref]
  );
  const isEmpty = (state?.selectionManager.selectedKeys.size ?? 0) === 0;

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Clear selection"
      aria-hidden={isEmpty || undefined}
      disabled={isDisabled}
      {...props}
      ref={mergedRef}
      data-tds="autocomplete-clear-button"
      data-empty={dataAttr(isEmpty)}
      onClick={(event) => {
        // A single select won't take an empty selection, so its value is
        // reset instead
        state?.setValue(
          state.selectionManager.selectionMode === "multiple" ? [] : null
        );
        onClear?.();
        onClick?.(event);
      }}
    >
      {children ?? <XIcon size={12} />}
    </button>
  );
});

AutocompleteClearButton.displayName = "Autocomplete.ClearButton";

type AutocompletePopoverProps = PopoverContentProps;

// Below the field, as wide as it
const AutocompletePopover = (
  props: AutocompletePopoverProps
): React.ReactElement => {
  const { triggerRef } = useContext(AutocompleteContext);

  return (
    <PopoverContent
      placement="bottom"
      {...props}
      triggerRef={triggerRef}
      data-tds-autocomplete=""
    />
  );
};

AutocompletePopover.displayName = "Autocomplete.Popover";

type AutocompleteFilterProps = AriaAutocompleteProps;

// Filters the ListBox by what's typed into the SearchField beside it
const AutocompleteFilter = (
  props: AutocompleteFilterProps
): React.ReactElement => {
  return <AriaAutocomplete {...props} />;
};

AutocompleteFilter.displayName = "Autocomplete.Filter";

export {
  AutocompleteRoot,
  AutocompleteTrigger,
  SelectValue as AutocompleteValue,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteFilter,
  AutocompleteClearButton
};
export type {
  AutocompleteRootProps,
  AutocompleteTriggerProps,
  AutocompleteIndicatorProps,
  AutocompletePopoverProps,
  AutocompleteFilterProps,
  AutocompleteClearButtonProps
};
