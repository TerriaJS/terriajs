import {
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ReactNode
} from "react";
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxProps as AriaListBoxProps,
  type ListBoxSectionProps as AriaListBoxSectionProps
} from "react-aria-components/ListBox";
import { ItemLabelSlot } from "./ItemLabelSlot";
import { ListBoxItemContext } from "./ListBoxItemContext";
import { plainText } from "../../utils/plainText";
import { dataAttr } from "../../utils/dataAttr";
import "./ListBox.css";

type ListBoxProps<T extends object> = AriaListBoxProps<T>;

const ListBoxRoot = <T extends object>(
  props: ListBoxProps<T>
): React.ReactElement => {
  return <AriaListBox {...props} data-tds="list-box" />;
};

ListBoxRoot.displayName = "ListBox";

type ListBoxItemVariant = "default" | "danger";

type ListBoxItemProps<T extends object> = AriaListBoxItemProps<T> & {
  variant?: ListBoxItemVariant;
};

const ListBoxItem = <T extends object>({
  variant = "default",
  children,
  textValue,
  ...props
}: ListBoxItemProps<T>): React.ReactElement => {
  return (
    <AriaListBoxItem
      // The children are wrapped below, so react-aria can't read plain text
      // children as the item's text for typeahead or a Select's value
      textValue={textValue ?? plainText(children)}
      {...props}
      data-tds="list-box-item"
      data-tds-variant={variant}
    >
      {(values) => (
        <ListBoxItemContext.Provider value={values}>
          <ItemLabelSlot>
            {typeof children === "function" ? children(values) : children}
          </ItemLabelSlot>
        </ListBoxItemContext.Provider>
      )}
    </AriaListBoxItem>
  );
};

ListBoxItem.displayName = "ListBox.Item";

type ListBoxItemIndicatorType = "checkmark" | "dot";

type ListBoxItemIndicatorProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> & {
  /** The default mark: a checkmark, or a dot for one choice among several */
  type?: ListBoxItemIndicatorType;
  /** Replaces the default mark; a function is told whether its item is selected */
  children?: ReactNode | ((values: { isSelected: boolean }) => ReactNode);
};

// Shows whether its item is selected: a checkmark or a dot, unless children
// replace it
const ListBoxItemIndicator = forwardRef<
  HTMLSpanElement,
  ListBoxItemIndicatorProps
>(({ type = "checkmark", children, ...props }, ref) => {
  const isSelected = useContext(ListBoxItemContext)?.isSelected ?? false;
  const mark =
    type === "dot" ? (
      <span data-tds="list-box-item-dot" />
    ) : (
      <svg
        data-tds="list-box-item-checkmark"
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
    );

  return (
    <span
      aria-hidden="true"
      {...props}
      ref={ref}
      data-tds="list-box-item-indicator"
      data-tds-type={type}
      data-visible={dataAttr(isSelected)}
    >
      {typeof children === "function"
        ? children({ isSelected })
        : (children ?? mark)}
    </span>
  );
});

ListBoxItemIndicator.displayName = "ListBox.ItemIndicator";

type ListBoxSectionProps<T extends object> = AriaListBoxSectionProps<T>;

const ListBoxSection = <T extends object>(
  props: ListBoxSectionProps<T>
): React.ReactElement => {
  return <AriaListBoxSection {...props} data-tds="list-box-section" />;
};

ListBoxSection.displayName = "ListBox.Section";

export { ListBoxRoot, ListBoxItem, ListBoxItemIndicator, ListBoxSection };
export type {
  ListBoxProps,
  ListBoxItemVariant,
  ListBoxItemProps,
  ListBoxItemIndicatorType,
  ListBoxItemIndicatorProps,
  ListBoxSectionProps
};
