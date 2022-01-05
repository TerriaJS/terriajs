import Ellipsoid from "terriajs-cesium/Source/Core/Ellipsoid";

export function scaleDenominatorToLevel(
  scaleDenominator: number | undefined,
  min: boolean = true,
  ows: boolean = true
): number | undefined {
  if (scaleDenominator == undefined || scaleDenominator <= 0.0) {
    return undefined;
  }

  const dpi = 96; // Esri default DPI, unless we specify otherwise.
  const centimetersPerInch = 2.54;
  const centimetersPerMeter = 100;
  let metersPerPixel = 0.00028;
  if (!ows) {
    metersPerPixel = centimetersPerInch / (dpi * centimetersPerMeter);
  }
  const tileWidth = 256;

  const circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
  const distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
  const level0ScaleDenominator = distancePerPixelAtLevel0 / metersPerPixel;

  // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
  if (min) {
    const ratio = level0ScaleDenominator / (scaleDenominator - 1e-6);
    const levelAtScaleDenominator = Math.log(ratio) / Math.log(2);
    return levelAtScaleDenominator | 0;
  } else {
    const ratio = level0ScaleDenominator / (scaleDenominator + 1e-6);
    const levelAtScaleDenominator = Math.log(ratio) / Math.log(2);
    return levelAtScaleDenominator | 0;
  }
}
