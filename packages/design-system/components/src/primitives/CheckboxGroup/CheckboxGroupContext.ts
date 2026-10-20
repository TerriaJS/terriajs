import { createContext } from "react";
import type { CheckboxVariant } from "../Checkbox";

// Defaults the group passes to its checkboxes
export const CheckboxGroupContext = createContext<{
  variant?: CheckboxVariant;
} | null>(null);
