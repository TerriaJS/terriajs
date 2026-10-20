import {
  Radio,
  RadioContent,
  RadioControl,
  RadioIndicator,
  RadioRoot
} from "./Radio";

// Compound component, assembled here so Radio.tsx only exports components
export const RadioPrimitive = Object.assign(RadioRoot, {
  Root: RadioRoot,
  Content: RadioContent,
  Control: RadioControl,
  Indicator: RadioIndicator
});

export { Radio, RadioContent, RadioControl, RadioIndicator, RadioRoot };
export type {
  RadioProps,
  RadioContentProps,
  RadioControlProps,
  RadioIndicatorProps,
  RadioRootProps as RadioPrimitiveProps
} from "./Radio";
