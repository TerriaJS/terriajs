import { scaleDenominatorToLevel } from "./../../lib/Core/scaleToDenominator";
describe("scaleDenominatorToLevel", () => {
  it("returns undefined when scale negative", () => {
    const scale = -1;
    const zoomLevel = scaleDenominatorToLevel(scale);
    expect(zoomLevel).not.toBeDefined();
  });

  it("returns undefined when scale undefined", () => {
    const scale = undefined;
    const zoomLevel = scaleDenominatorToLevel(scale);
    expect(zoomLevel).not.toBeDefined();
  });

  describe("OWS", () => {
    it("properly convert min scale denominator to zoom level", () => {
      const scale = 1500000;
      const zoomLevel = scaleDenominatorToLevel(scale, true, true);
      expect(zoomLevel).toEqual(8);
    });

    it("properly convert max scale denominator to zoom level", () => {
      const scale = 5000000;
      const zoomLevel = scaleDenominatorToLevel(scale, false, true);
      expect(zoomLevel).toEqual(6);
    });
  });

  describe("esri", () => {
    it("properly convert min scale denominator to zoom level", () => {
      const scale = 1500000;
      const zoomLevel = scaleDenominatorToLevel(scale, true, false);
      expect(zoomLevel).toEqual(8);
    });

    it("properly convert max scale denominator to zoom level", () => {
      const scale = 5000000;
      const zoomLevel = scaleDenominatorToLevel(scale, false, false);
      expect(zoomLevel).toEqual(6);
    });
  });
});
