import { SearchIcon, XIcon } from "@terria/design-system-icons";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps
} from "react-aria-components/Button";
import {
  SearchField as AriaSearchField,
  type SearchFieldProps as AriaSearchFieldProps
} from "react-aria-components/SearchField";
import {
  InputGroupInput,
  InputGroupRoot,
  type InputGroupProps
} from "../InputGroup";
import "../CloseButton/CloseButton.css";
import "../Field/Field.css";
import "./SearchField.css";

type SearchFieldProps = AriaSearchFieldProps & {
  /** Fill the container's width; otherwise the field hugs its group */
  fullWidth?: boolean;
};

// Stacks a Label, the Group with its Input, and a Description or FieldError,
// as a TextField does. Enter submits, Escape clears
const SearchFieldRoot = forwardRef<HTMLDivElement, SearchFieldProps>(
  ({ fullWidth, ...props }, ref) => {
    return (
      <AriaSearchField
        {...props}
        ref={ref}
        data-tds="search-field"
        data-tds-full-width={fullWidth ? true : undefined}
      />
    );
  }
);

SearchFieldRoot.displayName = "SearchField";

type SearchFieldGroupProps = InputGroupProps;

const SearchFieldGroup = forwardRef<HTMLDivElement, SearchFieldGroupProps>(
  (props, ref) => {
    return <InputGroupRoot {...props} ref={ref} />;
  }
);

SearchFieldGroup.displayName = "SearchField.Group";

type SearchFieldSearchIconProps = ComponentPropsWithoutRef<"span">;

// Decorative: the field's label says what it searches
const SearchFieldSearchIcon = forwardRef<
  HTMLSpanElement,
  SearchFieldSearchIconProps
>(({ children, ...props }, ref) => {
  return (
    <span {...props} ref={ref} aria-hidden data-tds="search-field-icon">
      {children ?? <SearchIcon size={16} />}
    </span>
  );
});

SearchFieldSearchIcon.displayName = "SearchField.SearchIcon";

type SearchFieldClearButtonProps = Omit<AriaButtonProps, "slot">;

// A CloseButton, shown once there's text. The field names it ("Clear
// search", translated), clears and refocuses the input on press, and keeps
// it out of the tab order, as Escape does the same
const SearchFieldClearButton = forwardRef<
  HTMLButtonElement,
  SearchFieldClearButtonProps
>(({ children, ...props }, ref) => {
  return (
    <AriaButton {...props} ref={ref} data-tds="close-button">
      {children ?? <XIcon aria-hidden />}
    </AriaButton>
  );
});

SearchFieldClearButton.displayName = "SearchField.ClearButton";

export {
  SearchFieldRoot,
  SearchFieldGroup,
  SearchFieldSearchIcon,
  InputGroupInput as SearchFieldInput,
  SearchFieldClearButton
};
export type {
  SearchFieldProps,
  SearchFieldGroupProps,
  SearchFieldSearchIconProps,
  SearchFieldClearButtonProps
};
