import Terria from "../../../Models/Terria";

/**
 * Returns `true` if clipping box zooming and repositioning features are
 * enabled for this map.
 */
export function zoomAndRepositioningEnabled(terria: Terria) {
  const featureFlag = (terria.elements.get("clipping-box") as any)
    ?.zoomAndRepositioningEnabled;
  return featureFlag === true;
}
