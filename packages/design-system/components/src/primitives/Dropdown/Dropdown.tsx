import { ChevronRightIcon } from "@terria/design-system-icons";
import {
  Children,
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuSection as AriaMenuSection,
  MenuTrigger as AriaMenuTrigger,
  SubmenuTrigger as AriaSubmenuTrigger,
  type MenuItemProps as AriaMenuItemProps,
  type MenuProps as AriaMenuProps,
  type MenuSectionProps as AriaMenuSectionProps,
  type MenuTriggerProps as AriaMenuTriggerProps,
  type SubmenuTriggerProps as AriaSubmenuTriggerProps
} from "react-aria-components/Menu";
import { Text } from "react-aria-components/Text";
import type { ListBoxItemVariant } from "../ListBox";
import { ItemLabelSlot } from "../ListBox/ItemLabelSlot";
import { ListBoxItemContext } from "../ListBox/ListBoxItemContext";
import { PopoverContent, type PopoverContentProps } from "../Popover";
import "../ListBox/ListBox.css";
import "./Dropdown.css";

type DropdownProps = AriaMenuTriggerProps;

// Opens its menu from its first child: a Button, or a Dropdown.Trigger
const DropdownRoot = (props: DropdownProps): React.ReactElement => {
  return <AriaMenuTrigger {...props} />;
};

DropdownRoot.displayName = "Dropdown";

type DropdownPopoverProps = PopoverContentProps;

// react-aria places it: below the trigger's start for the menu, beside its
// item for a submenu
const DropdownPopover = (props: DropdownPopoverProps): React.ReactElement => {
  return <PopoverContent {...props} />;
};

DropdownPopover.displayName = "Dropdown.Popover";

type DropdownMenuProps<T extends object> = AriaMenuProps<T>;

const DropdownMenu = <T extends object>(
  props: DropdownMenuProps<T>
): React.ReactElement => {
  return <AriaMenu {...props} data-tds="dropdown-menu" />;
};

DropdownMenu.displayName = "Dropdown.Menu";

type DropdownItemProps<T extends object> = AriaMenuItemProps<T> & {
  variant?: ListBoxItemVariant;
};

// Plain text is the item's label, so the item is named by it alone and not
// by its shortcut or indicator too
const labelPlainText = (children: ReactNode): ReactNode =>
  // eslint-disable-next-line @eslint-react/no-children-map -- Only plain-text children are wrapped; elements, like icons and indicators, pass through untouched
  Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <Text slot="label">{child}</Text>
    ) : (
      child
    )
  );

// Styled as a ListBox item, so a menu and a list look alike
const DropdownItem = <T extends object>({
  variant = "default",
  children,
  textValue,
  ...props
}: DropdownItemProps<T>): React.ReactElement => {
  return (
    <AriaMenuItem
      // The children are wrapped below, so react-aria can't read plain text
      // children as the item's text for typeahead
      textValue={
        textValue ?? (typeof children === "string" ? children : undefined)
      }
      {...props}
      data-tds="list-box-item"
      data-tds-variant={variant}
    >
      {(values) => (
        <ListBoxItemContext.Provider value={values}>
          <ItemLabelSlot>
            {labelPlainText(
              typeof children === "function" ? children(values) : children
            )}
          </ItemLabelSlot>
        </ListBoxItemContext.Provider>
      )}
    </AriaMenuItem>
  );
};

DropdownItem.displayName = "Dropdown.Item";

type DropdownSectionProps<T extends object> = AriaMenuSectionProps<T>;

const DropdownSection = <T extends object>(
  props: DropdownSectionProps<T>
): React.ReactElement => {
  return <AriaMenuSection {...props} data-tds="list-box-section" />;
};

DropdownSection.displayName = "Dropdown.Section";

type DropdownSubmenuTriggerProps = AriaSubmenuTriggerProps;

// An item that opens the Dropdown.Popover after it, as a submenu
const DropdownSubmenuTrigger = (
  props: DropdownSubmenuTriggerProps
): React.ReactElement => {
  return <AriaSubmenuTrigger {...props} />;
};

DropdownSubmenuTrigger.displayName = "Dropdown.SubmenuTrigger";

type DropdownSubmenuIndicatorProps = ComponentPropsWithoutRef<"span">;

// Marks an item that opens a submenu; a chevron unless children replace it
const DropdownSubmenuIndicator = forwardRef<
  HTMLSpanElement,
  DropdownSubmenuIndicatorProps
>(({ children, ...props }, ref) => {
  return (
    <span
      aria-hidden="true"
      {...props}
      ref={ref}
      data-tds="dropdown-submenu-indicator"
    >
      {children ?? <ChevronRightIcon size={16} />}
    </span>
  );
});

DropdownSubmenuIndicator.displayName = "Dropdown.SubmenuIndicator";

export {
  DropdownRoot,
  DropdownPopover,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  DropdownSubmenuTrigger,
  DropdownSubmenuIndicator
};
export type {
  DropdownProps,
  DropdownPopoverProps,
  DropdownMenuProps,
  DropdownItemProps,
  DropdownSectionProps,
  DropdownSubmenuTriggerProps,
  DropdownSubmenuIndicatorProps
};
