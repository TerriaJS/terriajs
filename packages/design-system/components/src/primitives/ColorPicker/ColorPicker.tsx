import { CheckIcon } from "@terria/design-system-icons";
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject
} from "react";
import {
  Button as AriaButton,
  ButtonContext,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  ColorPicker as AriaColorPicker,
  type ColorPickerProps as AriaColorPickerProps
} from "react-aria-components/ColorPicker";
import { DEFAULT_SLOT } from "react-aria-components/slots";
import { useId } from "react-aria/useId";
import { ColorSwatch } from "../ColorSwatch";
import { Popover, type PopoverContentProps } from "../Popover";
import { dataAttr } from "../../utils/dataAttr";
import "./ColorPicker.css";
import { useLocalizedStrings } from "../../i18n/useLocalizedStrings";

type ColorPickerProps = Omit<AriaColorPickerProps, "children"> & {
  /** A trigger, any button with slot="trigger", and ColorPicker.Popover with
   * what changes the colour */
  children: ReactNode;
};

// Whether the popover is open, the trigger it opens next to, and the ids
// that tie the two together
const PopoverStateContext = createContext<{
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  triggerId: string;
  dialogId: string;
} | null>(null);

// Holds a colour, which what's inside it shows and changes: a swatch shows
// it, and a swatch picker, area, slider or field in the popover changes it.
// The button in the trigger slot opens the popover: ColorPicker.Trigger, or
// any button with slot="trigger", such as a colour marker in a field. Other
// buttons inside stay buttons
const ColorPickerRoot = ({
  children,
  ...props
}: ColorPickerProps): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // React Aria's, so a trigger given an id of its own keeps them in step
  const triggerId = useId();
  const dialogId = useId();
  const popoverState = useMemo(
    () => ({ isOpen, setOpen: setIsOpen, triggerRef, triggerId, dialogId }),
    [isOpen, triggerId, dialogId]
  );
  const buttons = useMemo(
    () => ({
      slots: {
        [DEFAULT_SLOT]: {},
        // As React Aria's DialogTrigger wires its trigger, pointing at the
        // dialog while it's open
        trigger: {
          ref: triggerRef,
          id: triggerId,
          onPress: () => {
            setIsOpen((open) => !open);
          },
          "aria-expanded": isOpen,
          "aria-haspopup": "dialog" as const,
          "aria-controls": isOpen ? dialogId : undefined
        }
      }
    }),
    [isOpen, triggerId, dialogId]
  );

  return (
    <AriaColorPicker {...props}>
      <PopoverStateContext.Provider value={popoverState}>
        <ButtonContext.Provider value={buttons}>
          {children}
        </ButtonContext.Provider>
      </PopoverStateContext.Provider>
    </AriaColorPicker>
  );
};

ColorPickerRoot.displayName = "ColorPicker";

type ColorPickerTriggerProps = Omit<AriaButtonProps, "slot">;

// A plain button laying out a swatch and a label, as in the design, in the
// trigger slot. Any other button with slot="trigger" opens the popover too
const ColorPickerTrigger = forwardRef<
  HTMLButtonElement,
  ColorPickerTriggerProps
>((props, ref) => {
  return (
    <AriaButton
      {...props}
      ref={ref}
      slot="trigger"
      data-tds="color-picker-trigger"
    />
  );
});

ColorPickerTrigger.displayName = "ColorPicker.Trigger";

type ColorPickerIndicatorProps = ComponentPropsWithoutRef<"span"> & {
  /** Shows a rainbow, for no colour picked yet */
  isEmpty?: boolean;
};

// The trigger's swatch: the colour, ringed and checked, or with isEmpty a
// rainbow, before one is picked
const ColorPickerIndicator = forwardRef<
  HTMLSpanElement,
  ColorPickerIndicatorProps
>(({ isEmpty, ...props }, ref) => {
  return (
    <span
      {...props}
      ref={ref}
      data-tds="color-picker-indicator"
      data-tds-empty={dataAttr(isEmpty)}
    >
      {!isEmpty && (
        <>
          <ColorSwatch />
          <CheckIcon aria-hidden />
        </>
      )}
    </span>
  );
});

ColorPickerIndicator.displayName = "ColorPicker.Indicator";

type ColorPickerPopoverProps = Omit<PopoverContentProps, "children"> & {
  children: ReactNode;
  /** Names the dialog the content is in */
  "aria-label"?: string;
};

// The content that changes the colour, in a dialog: focus moves in, and
// Escape or a press outside closes it. It opens next to the trigger, or
// triggerRef, such as the whole field the trigger is in
const ColorPickerPopover = ({
  children,
  placement = "bottom start",
  "aria-label": ariaLabel,
  ...props
}: ColorPickerPopoverProps): React.ReactElement => {
  const state = useContext(PopoverStateContext);
  const strings = useLocalizedStrings();

  return (
    <Popover.Content
      triggerRef={state?.triggerRef}
      isOpen={state?.isOpen}
      onOpenChange={state?.setOpen}
      {...props}
      placement={placement}
    >
      {/* Named by its trigger, as React Aria's DialogTrigger names it,
          unless given a name of its own */}
      <Popover.Dialog
        id={state?.dialogId}
        aria-labelledby={ariaLabel ? undefined : state?.triggerId}
        aria-label={
          ariaLabel ?? (state ? undefined : strings.format("colorPicker.label"))
        }
      >
        <div data-tds="color-picker-content">{children}</div>
      </Popover.Dialog>
    </Popover.Content>
  );
};

ColorPickerPopover.displayName = "ColorPicker.Popover";

export {
  ColorPickerRoot,
  ColorPickerTrigger,
  ColorPickerIndicator,
  ColorPickerPopover
};
export type {
  ColorPickerProps,
  ColorPickerTriggerProps,
  ColorPickerIndicatorProps,
  ColorPickerPopoverProps
};
