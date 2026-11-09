import {
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarRoot,
  ProgressBarTrack
} from "./ProgressBar";

// Compound component, assembled here so ProgressBar.tsx only exports components
export const ProgressBar = Object.assign(ProgressBarRoot, {
  Root: ProgressBarRoot,
  Output: ProgressBarOutput,
  Track: ProgressBarTrack,
  Fill: ProgressBarFill
});

export {
  ProgressBarFill,
  ProgressBarOutput,
  ProgressBarRoot,
  ProgressBarTrack
};
export type {
  ProgressBarColor,
  ProgressBarFillProps,
  ProgressBarOutputProps,
  ProgressBarProps,
  ProgressBarSize,
  ProgressBarTrackProps
} from "./ProgressBar";
