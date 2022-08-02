import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import Feature from "../Models/Feature/Feature";
import { propertyGetTimeValues } from "../ReactViews/FeatureInfo/getFeatureProperties";
import hashFromString from "./hashFromString";

/**
 * Hashes a Cesium {@link Entity} (used by us for features) by stringifying its properties and name.
 *
 * @param feature The feature to hash
 * @param clock A clock that will be used to resolve the property values.
 * @returns {Number} the hash, as an integer.
 */
export default function hashEntity(feature: Feature, clock: JulianDate) {
  return hashFromString(
    JSON.stringify(propertyGetTimeValues(feature, clock)) + feature.name
  );
}
