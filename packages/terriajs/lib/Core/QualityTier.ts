/**
 * `Terria#baseMaximumScreenSpaceError` (the quality slider) ranges from 1
 * (max quality) to 3 (min quality/low-spec) - a *higher* value is
 * coarser/cheaper in Cesium, so the low-spec end is the numeric max, not
 * the min.
 */
export const LOW_SPEC_QUALITY_THRESHOLD = 2.5;

/**
 * 0 at max quality (slider value 1), 1 at min quality/low-spec (slider
 * value 3). Clamped so an out-of-range `baseMaximumScreenSpaceError` (e.g.
 * from a hand-edited share link or stale localStorage value) can't produce
 * a negative or otherwise nonsensical scaled setting.
 */
export function getQualityTierFraction(
  baseMaximumScreenSpaceError: number
): number {
  return Math.min(1, Math.max(0, (baseMaximumScreenSpaceError - 1) / 2));
}

export function isLowSpecQualityTier(
  baseMaximumScreenSpaceError: number
): boolean {
  return baseMaximumScreenSpaceError >= LOW_SPEC_QUALITY_THRESHOLD;
}
