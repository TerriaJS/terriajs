import TimeVarying from "../ModelMixins/TimeVarying";
import TerriaFeature from "../Models/Feature/Feature";
import Terria from "../Models/Terria";
import { propertyGetTimeValues } from "../ReactViews/FeatureInfo/getFeatureProperties";
import hashFromString from "./hashFromString";

/**
 * Hashes a Cesium {@link Entity} (used by us for features) by stringifying its properties and name.
 *
 * @param feature The feature to hash
 * @param clock A clock that will be used to resolve the property values.
 * @returns {Number} the hash, as an integer.
 */
export default function hashEntity(feature: TerriaFeature, terria: Terria) {
  const catalogItemTime =
    feature._catalogItem && TimeVarying.is(feature._catalogItem)
      ? feature._catalogItem.currentTimeAsJulianDate
      : undefined;

  return hashFromString(
    (JSON.stringify(
      propertyGetTimeValues(
        feature,
        catalogItemTime ?? terria.timelineClock.currentTime
      )
    ) ?? "") + (feature.name ?? "")
  );
}
