import {
  Slider,
  SliderFill,
  SliderMarks,
  SliderOutput,
  SliderRoot,
  SliderThumb,
  SliderTicks,
  SliderTrack
} from "./Slider";

// Compound component, assembled here so Slider.tsx only exports components
export const SliderPrimitive = Object.assign(SliderRoot, {
  Root: SliderRoot,
  Output: SliderOutput,
  Track: SliderTrack,
  Fill: SliderFill,
  Ticks: SliderTicks,
  Marks: SliderMarks,
  Thumb: SliderThumb
});

export {
  Slider,
  SliderFill,
  SliderMarks,
  SliderOutput,
  SliderRoot,
  SliderThumb,
  SliderTicks,
  SliderTrack
};
export type {
  SliderFillProps,
  SliderMark,
  SliderMarksProps,
  SliderOutputProps,
  SliderProps,
  SliderRootProps as SliderPrimitiveProps,
  SliderThumbProps,
  SliderTicksProps,
  SliderTooltipContent,
  SliderTrackProps
} from "./Slider";
