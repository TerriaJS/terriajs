/**
 * `Terria#baseMaximumScreenSpaceError` (the quality slider) ranges from 1
 * (max quality) to 3 (min quality/low-spec) - a *higher* value is
 * coarser/cheaper in Cesium, so the low-spec end is the numeric max, not
 * the min.
 */
export const LOW_SPEC_QUALITY_THRESHOLD = 2.5;

/**
 * 0 from max quality through the slider's own factory default (slider value
 * 2), ramping up to 1 at min quality/low-spec (slider value 3). Clamped so
 * an out-of-range `baseMaximumScreenSpaceError` (e.g. from a hand-edited
 * share link or stale localStorage value) can't produce a negative or
 * otherwise nonsensical scaled setting.
 *
 * Deliberately *not* a straight 1-3 ramp: the slider's default is 2, the
 * midpoint, not 1 - a fraction that started ramping at 1 would already be
 * partway degraded (e.g. resolutionScale at 0.875 instead of 1.0) at that
 * untouched default, silently changing every existing deployment's
 * rendering the moment a fraction-scaled setting shipped, without anyone
 * touching the slider.
 */
export function getQualityTierFraction(
  baseMaximumScreenSpaceError: number
): number {
  return Math.min(1, Math.max(0, baseMaximumScreenSpaceError - 2));
}

export function isLowSpecQualityTier(
  baseMaximumScreenSpaceError: number
): boolean {
  return baseMaximumScreenSpaceError >= LOW_SPEC_QUALITY_THRESHOLD;
}
