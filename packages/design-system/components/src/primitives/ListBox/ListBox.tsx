import {
  forwardRef,
  createContext,
  useContext,
  type ComponentPropsWithoutRef
} from "react";
import {
  ListBox as AriaListBox,
  ListBoxItem as AriaListBoxItem,
  ListBoxSection as AriaListBoxSection,
  type ListBoxItemProps as AriaListBoxItemProps,
  type ListBoxItemRenderProps,
  type ListBoxProps as AriaListBoxProps,
  type ListBoxSectionProps as AriaListBoxSectionProps
} from "react-aria-components/ListBox";
import "./ListBox.css";

export type ListBoxProps<T extends object> = AriaListBoxProps<T>;

export const ListBoxRoot = <T extends object>(
  props: ListBoxProps<T>
): React.ReactElement => {
  return <AriaListBox {...props} data-tds="list-box" />;
};

ListBoxRoot.displayName = "ListBox";

export type ListBoxItemVariant = "default" | "danger";

export type ListBoxItemProps<T extends object> = AriaListBoxItemProps<T> & {
  variant?: ListBoxItemVariant;
};

const ListBoxItemContext = createContext<ListBoxItemRenderProps | null>(null);

export const ListBoxItem = <T extends object>({
  variant = "default",
  children,
  ...props
}: ListBoxItemProps<T>): React.ReactElement => {
  return (
    <AriaListBoxItem
      {...props}
      data-tds="list-box-item"
      data-tds-variant={variant}
    >
      {(values) => (
        <ListBoxItemContext.Provider value={values}>
          {typeof children === "function" ? children(values) : children}
        </ListBoxItemContext.Provider>
      )}
    </AriaListBoxItem>
  );
};

ListBoxItem.displayName = "ListBox.Item";

export type ListBoxItemIndicatorProps = ComponentPropsWithoutRef<"span">;

// Shows whether its item is selected; a checkmark unless children replace it
export const ListBoxItemIndicator = forwardRef<
  HTMLSpanElement,
  ListBoxItemIndicatorProps
>(({ children, ...props }, ref) => {
  const isSelected = useContext(ListBoxItemContext)?.isSelected ?? false;

  return (
    <span
      aria-hidden="true"
      {...props}
      ref={ref}
      data-tds="list-box-item-indicator"
      data-visible={isSelected || undefined}
    >
      {children ?? (
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
      )}
    </span>
  );
});

ListBoxItemIndicator.displayName = "ListBox.ItemIndicator";

export type ListBoxSectionProps<T extends object> = AriaListBoxSectionProps<T>;

export const ListBoxSection = <T extends object>(
  props: ListBoxSectionProps<T>
): React.ReactElement => {
  return <AriaListBoxSection {...props} data-tds="list-box-section" />;
};

ListBoxSection.displayName = "ListBox.Section";
