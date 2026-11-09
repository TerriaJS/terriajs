import { MeterFill, MeterOutput, MeterRoot, MeterTrack } from "./Meter";

// Compound component, assembled here so Meter.tsx only exports components
export const Meter = Object.assign(MeterRoot, {
  Root: MeterRoot,
  Output: MeterOutput,
  Track: MeterTrack,
  Fill: MeterFill
});

export { MeterFill, MeterOutput, MeterRoot, MeterTrack };
export type {
  MeterColor,
  MeterFillProps,
  MeterOutputProps,
  MeterProps,
  MeterSize,
  MeterTrackProps
} from "./Meter";
