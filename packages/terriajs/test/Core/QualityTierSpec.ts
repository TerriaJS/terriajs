import {
  getQualityTierFraction,
  isLowSpecQualityTier,
  LOW_SPEC_QUALITY_THRESHOLD
} from "../../lib/Core/QualityTier";

describe("QualityTier", function () {
  describe("getQualityTierFraction", function () {
    it("is 0 at max quality (slider value 1)", function () {
      expect(getQualityTierFraction(1)).toBe(0);
    });

    it("is 0 at the slider's own factory default (slider value 2), not partway degraded", function () {
      // Regression check: a fraction that ramped across the whole 1-3 range
      // would already be 0.5 here, silently changing default rendering for
      // every deployment that has never touched the slider.
      expect(getQualityTierFraction(2)).toBe(0);
    });

    it("ramps up only across the low-spec half of the range (2 -> 3)", function () {
      expect(getQualityTierFraction(2.5)).toBe(0.5);
    });

    it("is 1 at min quality/low-spec (slider value 3)", function () {
      expect(getQualityTierFraction(3)).toBe(1);
    });

    it("clamps below the slider's minimum", function () {
      expect(getQualityTierFraction(0)).toBe(0);
    });

    it("clamps above the slider's maximum", function () {
      expect(getQualityTierFraction(4)).toBe(1);
    });
  });

  describe("isLowSpecQualityTier", function () {
    it("is false at the slider's own factory default (slider value 2)", function () {
      expect(isLowSpecQualityTier(2)).toBe(false);
    });

    it("is false just below the threshold", function () {
      expect(isLowSpecQualityTier(LOW_SPEC_QUALITY_THRESHOLD - 0.1)).toBe(
        false
      );
    });

    it("is true at and above the threshold", function () {
      expect(isLowSpecQualityTier(LOW_SPEC_QUALITY_THRESHOLD)).toBe(true);
      expect(isLowSpecQualityTier(3)).toBe(true);
    });
  });
});
