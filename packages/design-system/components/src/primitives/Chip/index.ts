import { ChipLabel, ChipRoot } from "./Chip";

// Compound component, assembled here so Chip.tsx only exports components
export const Chip = Object.assign(ChipRoot, {
  Root: ChipRoot,
  Label: ChipLabel
});

export { ChipLabel, ChipRoot };
export type {
  ChipColor,
  ChipLabelProps,
  ChipProps,
  ChipSize,
  ChipVariant
} from "./Chip";
