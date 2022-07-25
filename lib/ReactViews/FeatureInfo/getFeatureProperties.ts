import { runInAction } from "mobx";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import isDefined from "../../Core/isDefined";
import {
  isJsonNumber,
  isJsonObject,
  isJsonString,
  JsonObject
} from "../../Core/Json";
import propertyGetTimeValues from "../../Core/propertyGetTimeValues";
import Model from "../../Models/Definition/Model";
import Feature from "../../Models/Feature";
import {
  FeatureInfoFormat,
  FeatureInfoTemplateTraits
} from "../../Traits/TraitsClasses/FeatureInfoTraits";
import { formatDateTime } from "./mustacheExpressions";

/**
 *
 * If they require .getValue, apply that.
 * If they have bad keys, fix them.
 * If they have formatting, apply it.
 */
export default function getFeatureProperties(
  feature: Feature,
  currentTime?: JulianDate,
  featureInfoTemplate?: Model<FeatureInfoTemplateTraits>
) {
  const properties =
    feature.currentProperties ||
    propertyGetTimeValues(feature.properties, currentTime);

  // Try JSON.parse on values that look like JSON arrays or objects
  let result = parseValues(properties);
  result = replaceBadKeyCharacters(result);

  if (featureInfoTemplate?.formats) {
    applyFormatsInPlace(result, featureInfoTemplate.formats);
  }
  return result;
}

function parseValues(properties: JsonObject) {
  // JSON.parse property values that look like arrays or objects
  const result: JsonObject = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      let val = properties[key];
      if (
        val &&
        (typeof val === "string" || val instanceof String) &&
        /^\s*[[{]/.test(val as string)
      ) {
        try {
          val = JSON.parse(val as string);
        } catch (e) {}
      }
      result[key] = val;
    }
  }
  return result;
}

/**
 * Formats values in an object if their keys match the provided formats object.
 * @private
 * @param {Object} properties a map of property labels to property values.
 * @param {Object} formats A map of property labels to the number formats that should be applied for them.
 */
function applyFormatsInPlace(
  properties: JsonObject,
  formats: Record<string, FeatureInfoFormat>
) {
  // Optionally format each property. Updates properties in place, returning nothing.
  for (const key in formats) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      // Default type if not provided is number.
      const value = properties[key];
      if (
        isJsonNumber(value) &&
        (!isDefined(formats[key].type) ||
          (isDefined(formats[key].type) && formats[key].type === "number"))
      ) {
        runInAction(() => {
          // Note we default maximumFractionDigits to 20 (not 3).
          properties[key] = value.toLocaleString(undefined, {
            maximumFractionDigits: 20,
            useGrouping: true,
            ...formats[key]
          });
        });
      }
      if (isDefined(formats[key].type)) {
        if (formats[key].type === "dateTime" && isJsonString(value)) {
          runInAction(() => {
            properties[key] = formatDateTime(value, formats[key]);
          });
        }
      }
    }
  }
}

/**
 * Recursively replace '.' and '#' in property keys with _, since Mustache cannot reference keys with these characters.
 * @private
 */
function replaceBadKeyCharacters(properties: JsonObject) {
  const result: JsonObject = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const cleanKey = key.replace(/[.#]/g, "_");
      const value = properties[key];
      result[cleanKey] = isJsonObject(value)
        ? replaceBadKeyCharacters(value)
        : value;
    }
  }
  return result;
}
