"use strict";

var ImageryLayerFeatureInfo =
  require("terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var formatPropertyValue = require("../../Core/formatPropertyValue");

/**
 * Configures the description of this feature by creating an HTML table of properties and their values.
 *
 * @param {Object} properties An object literal containing the properties of the feature.
 */
ImageryLayerFeatureInfo.prototype.configureDescriptionFromProperties =
  function (properties) {
    function describe(properties) {
      var html = '<table class="cesium-infoBox-defaultTable">';
      for (var key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          var value = properties[key];
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
