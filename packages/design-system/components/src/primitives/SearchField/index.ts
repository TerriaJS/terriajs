import {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon
} from "./SearchField";

// Compound component, assembled here so SearchField.tsx only exports components
export const SearchField = Object.assign(SearchFieldRoot, {
  Root: SearchFieldRoot,
  Group: SearchFieldGroup,
  SearchIcon: SearchFieldSearchIcon,
  Input: SearchFieldInput,
  ClearButton: SearchFieldClearButton
});

export {
  SearchFieldClearButton,
  SearchFieldGroup,
  SearchFieldInput,
  SearchFieldRoot,
  SearchFieldSearchIcon
};
export type {
  SearchFieldClearButtonProps,
  SearchFieldGroupProps,
  SearchFieldProps,
  SearchFieldSearchIconProps
} from "./SearchField";
