import {
  SwitchContent,
  SwitchControl,
  SwitchIcon,
  SwitchRoot,
  SwitchThumb,
  Switch
} from "./Switch";

// Compound component, assembled here so Switch.tsx only exports components
export const SwitchPrimitive = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Content: SwitchContent,
  Control: SwitchControl,
  Thumb: SwitchThumb,
  Icon: SwitchIcon
});

export {
  Switch,
  SwitchContent,
  SwitchControl,
  SwitchIcon,
  SwitchRoot,
  SwitchThumb
};
export type {
  SwitchProps,
  SwitchContentProps,
  SwitchControlProps,
  SwitchIconProps,
  SwitchRootProps as SwitchPrimitiveProps,
  SwitchSize,
  SwitchThumbProps
} from "./Switch";
