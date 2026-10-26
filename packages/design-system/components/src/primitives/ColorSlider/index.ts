import {
  ColorSlider,
  ColorSliderOutput,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack
} from "./ColorSlider";

// The parts, assembled here so ColorSlider.tsx only exports components; for
// a slider laid out another way than ColorSlider's
export const ColorSliderPrimitive = Object.assign(ColorSliderRoot, {
  Root: ColorSliderRoot,
  Output: ColorSliderOutput,
  Track: ColorSliderTrack,
  Thumb: ColorSliderThumb
});

export {
  ColorSlider,
  ColorSliderOutput,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack
};
export type {
  ColorSliderOutputProps,
  ColorSliderProps,
  ColorSliderRootProps as ColorSliderPrimitiveProps,
  ColorSliderThumbProps,
  ColorSliderTrackProps
} from "./ColorSlider";
