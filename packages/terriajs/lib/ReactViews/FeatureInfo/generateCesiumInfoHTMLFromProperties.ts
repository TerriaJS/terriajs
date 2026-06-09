import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import PropertyBag from "terriajs-cesium/Source/DataSources/PropertyBag";
import isDefined from "../../Core/isDefined";

const simpleStyleIdentifiers = [
  "title",
  "description",
  "marker-size",
  "marker-symbol",
  "marker-color",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "fill",
  "fill-opacity"
];

/**
 * A way to produce a description if properties are available but no template is given.
 * Derived from Cesium's geoJsonDataSource, but made to work with possibly time-varying properties.
 */
export function generateCesiumInfoHTMLFromProperties(
  properties: PropertyBag | undefined,
  time: JulianDate,
  showStringIfPropertyValueIsNull: string | undefined
) {
  let html = "";
  if (typeof properties?.getValue === "function") {
    properties = properties.getValue(time);
  }

  if (!isDefined(properties)) return undefined;

  if (typeof properties === "object") {
    for (const key in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        if (simpleStyleIdentifiers.indexOf(key) !== -1) {
          continue;
        }
        let value = properties[key];
        if (isDefined(showStringIfPropertyValueIsNull) && !isDefined(value)) {
          value = showStringIfPropertyValueIsNull;
        }
        if (isDefined(value)) {
          if (typeof value.getValue === "function") {
            value = value.getValue(time);
          }
          if (Array.isArray(properties)) {
            html +=
              "<tr><td>" +
              generateCesiumInfoHTMLFromProperties(
                value,
                time,
                showStringIfPropertyValueIsNull
              ) +
              "</td></tr>";
          } else if (typeof value === "object") {
            html +=
              "<tr><th>" +
              key +
              "</th><td>" +
              generateCesiumInfoHTMLFromProperties(
                value,
                time,
                showStringIfPropertyValueIsNull
              ) +
              "</td></tr>";
          } else {
            html += "<tr><th>" + key + "</th><td>" + value + "</td></tr>";
          }
        }
      }
    }
  } else {
    // properties is only a single value.
    html += "<tr><th>" + "</th><td>" + properties + "</td></tr>";
  }
  if (html.length > 0) {
    html =
      '<table class="cesium-infoBox-defaultTable"><tbody>' +
      html +
      "</tbody></table>";
  }
  return html;
}
