import { createContext } from "react";

export type ListBoxItemContextValue = { isSelected: boolean };

// What an item tells its indicator: a ListBox item, or a Dropdown item
export const ListBoxItemContext = createContext<ListBoxItemContextValue | null>(
  null
);
