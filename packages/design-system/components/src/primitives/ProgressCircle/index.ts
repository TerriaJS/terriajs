import {
  ProgressCircleFillCircle,
  ProgressCircleRoot,
  ProgressCircleTrack,
  ProgressCircleTrackCircle
} from "./ProgressCircle";

// Compound component, assembled here so ProgressCircle.tsx only exports components
export const ProgressCircle = Object.assign(ProgressCircleRoot, {
  Root: ProgressCircleRoot,
  Track: ProgressCircleTrack,
  TrackCircle: ProgressCircleTrackCircle,
  FillCircle: ProgressCircleFillCircle
});

export {
  ProgressCircleFillCircle,
  ProgressCircleRoot,
  ProgressCircleTrack,
  ProgressCircleTrackCircle
};
export type {
  ProgressCircleColor,
  ProgressCircleFillCircleProps,
  ProgressCircleProps,
  ProgressCircleSize,
  ProgressCircleTrackCircleProps,
  ProgressCircleTrackProps
} from "./ProgressCircle";
