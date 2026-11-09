import { ColorAreaRoot, ColorAreaThumb } from "./ColorArea";

// Compound component, assembled here so ColorArea.tsx only exports components
export const ColorArea = Object.assign(ColorAreaRoot, {
  Root: ColorAreaRoot,
  Thumb: ColorAreaThumb
});

export { ColorAreaRoot, ColorAreaThumb };
export type { ColorAreaProps, ColorAreaThumbProps } from "./ColorArea";
