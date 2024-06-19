import defined from "terriajs-cesium/Source/Core/defined";
import ImageryLayerFeatureInfo from "terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo";
import formatPropertyValue from "../../Core/formatPropertyValue";

/**
 * Configures the description of this feature by creating an HTML table of properties and their values.
 *
 * @param {Object} properties An object literal containing the properties of the feature.
 */
ImageryLayerFeatureInfo.prototype.configureDescriptionFromProperties =
  function (properties: any) {
    function describe(properties: any) {
      let html = '<table class="cesium-infoBox-defaultTable">';
      for (const key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          const value = properties[key];
          if (defined(value)) {
            if (typeof value === "object") {
              html +=
                "<tr><td>" + key + "</td><td>" + describe(value) + "</td></tr>";
            } else {
              html +=
                "<tr><td>" +
                key +
                "</td><td>" +
                formatPropertyValue(value) +
                "</td></tr>";
            }
          }
        }
      }
      html += "</table>";

      return html;
    }

    this.description = describe(properties);
  };
