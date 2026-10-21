import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipRoot,
  TooltipTrigger
} from "./Tooltip";

// Compound component, assembled here so Tooltip.tsx only exports components
export const TooltipPrimitive = Object.assign(TooltipRoot, {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Arrow: TooltipArrow
});

export { Tooltip, TooltipArrow, TooltipContent, TooltipRoot, TooltipTrigger };
export type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipProps,
  TooltipRootProps as TooltipPrimitiveProps,
  TooltipTriggerProps
} from "./Tooltip";
