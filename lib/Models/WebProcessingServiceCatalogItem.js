"use strict";

/*global require*/
var CatalogItem = require("./CatalogItem");
var createGuid = require("terriajs-cesium/Source/Core/createGuid").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadXML = require("../Core/loadXML");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var ShortReportSection = require("./ShortReportSection");
var URI = require("urijs");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var xml2json = require("../ThirdParty/xml2json");
var createCatalogMemberFromType = require("./createCatalogMemberFromType");
var i18next = require("i18next").default;

/**
 * A catalog item representing the result of invoking a web processing service (WPS).
 *
 * @alias WebProcessingServiceCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function WebProcessingServiceCatalogItem(terria) {
  CatalogItem.call(this, terria);

  this._geoJsonItem = undefined;

  /**
   * Gets or sets the parameters to the WPS function.
   * All parameter names must be entered in lowercase in order to be consistent with references in TerrisJS code.
   * @type {FunctionParameter[]}
   */
  this.parameters = undefined;

  /**
   * Gets or sets the values of the parameters that were used to invoke this function.
   * @type {Object}
   */
  this.parameterValues = undefined;

  /**
   * Gets or sets the URL of the WPS completed response.  This property is ignored if
   * {@link WebProcessingServiceCatalogItem#wpsResponse} is defined.  This property is observable.
   * @type {String}
   */
  this.wpsResponseUrl = undefined;

  /**
   * Gets or sets the completed WPS response, as either XML or the result of passing the
   * XML through {@link xml2json}.
   * @type {Object|Document}
   */
  this.wpsResponse = undefined;

  knockout.track(this, ["wpsResponseUrl", "wpsResponse"]);
}

inherit(CatalogItem, WebProcessingServiceCatalogItem);

Object.defineProperties(WebProcessingServiceCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf WebProcessingServiceCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wps-result";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Web Processing Service Result'.
   * @memberOf WebProcessingServiceCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.webProcessingService.wpsResult");
    }
  },

  /**
   * Gets the data source associated with this catalog item.
   * @memberOf WebProcessingServiceCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      return defined(this._geoJsonItem)
        ? this._geoJsonItem.dataSource
        : undefined;
    }
  }
});

WebProcessingServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.wpsResponseUrl, this.wpsResponse];
};

WebProcessingServiceCatalogItem.prototype._load = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._hide();
    this._geoJsonItem._disable();
    this._geoJsonItem = undefined;
  }

  var that = this;
  return getGeoJson(this).then(function(geojson) {
    var wpsResponsePromise;
    if (defined(that.wpsResponse)) {
      wpsResponsePromise = when(that.wpsResponse);
    } else {
      wpsResponsePromise = loadXML(
        proxyCatalogItemUrl(that, that.wpsResponseUrl, "0s")
      );
    }

    return wpsResponsePromise.then(function(xmlOrJson) {
      var json;
      if (xmlOrJson instanceof Document) {
        json = xml2json(xmlOrJson);
      } else {
        json = xmlOrJson;
      }

      var processOutputs = json.ProcessOutputs;

      if (!defined(processOutputs)) {
        return;
      }

      var outputs = processOutputs.Output;
      if (!defined(outputs)) {
        return;
      } else if (!Array.isArray(outputs)) {
        outputs = [outputs];
      }

      for (var i = 0; i < outputs.length; ++i) {
        if (!defined(outputs[i].Data)) {
          continue;
        }

        // skip process contexts
        if (
          defined(outputs[i].Identifier) &&
          outputs[i].Identifier === ".context"
        ) {
          continue;
        }

        if (defined(outputs[i].Data.LiteralData)) {
          that.shortReportSections.push(
            new ShortReportSection({
              name: outputs[i].Title,
              content: formatOutputValue(
                outputs[i].Title,
                outputs[i].Data.LiteralData
              )
            })
          );
        } else if (defined(outputs[i].Data.ComplexData)) {
          var content = outputs[i].Data.ComplexData;
          if (outputs[i].Data.ComplexData.mimeType === "text/csv") {
            content =
              '<collapsible title="' +
              outputs[i].Title +
              '" open="' +
              (i === 0 ? "true" : "false") +
              '">';
            content +=
              '<chart can-download="true" hide-buttons="false" title="' +
              outputs[i].Title +
              "\" data='" +
              outputs[i].Data.ComplexData +
              '\' styling="histogram"></chart>';
            content += "</collapsible>";
          } else if (
            outputs[i].Data.ComplexData.mimeType ===
            "application/vnd.terriajs.catalog-member+json"
          ) {
            content = "Chart " + outputs[i].Title + " generated.";
            var jsonCatalogItem = JSON.parse(outputs[i].Data.ComplexData.text);
            var catalogItem = createCatalogMemberFromType(
              jsonCatalogItem.type,
              that.terria
            );
            catalogItem.updateFromJson(jsonCatalogItem);
            // The server might return duplicate names and IDs derived from it will not be unique.
            // So we force the id to a GUID.
            catalogItem.id = createGuid();
          }

          that.shortReportSections.push(
            new ShortReportSection({
              content: content
            })
          );
        }
      }

      var inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        (that.parameters || []).reduce(function(previousValue, parameter) {
          return (
            previousValue +
            "<tr>" +
            '<td style="vertical-align: middle">' +
            parameter.name +
            "</td>" +
            '<td style="padding-left: 4px">' +
            parameter.formatValueAsString(that.parameterValues[parameter.id]) +
            "</td>" +
            "</tr>"
          );
        }, "") +
        "</table>";

      var outputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        (outputs || []).reduce(function(previousValue, output) {
          if (
            !defined(output.Data) ||
            (!defined(output.Data.LiteralData) &&
              !defined(output.Data.ComplexData))
          ) {
            return previousValue;
          }
          var content = "";
          if (defined(output.Data.LiteralData)) {
            content = formatOutputValue(output.Title, output.Data.LiteralData);
          } else if (defined(output.Data.ComplexData)) {
            if (output.Data.ComplexData.mimeType === "text/csv") {
              content =
                '<chart can-download="true" hide-buttons="false" title="' +
                output.Title +
                "\" data='" +
                output.Data.ComplexData +
                '\' styling: "feature-info">';
            } else if (
              output.Data.ComplexData.mimeType ===
              "application/vnd.terriajs.catalog-member+json"
            ) {
              content = "Chart " + output.Title + " generated.";
            }
            // Support other types of ComplexData here as it becomes necessary.
          }

          return (
            previousValue +
            "<tr>" +
            '<td style="vertical-align: middle">' +
            output.Title +
            "</td>" +
            "<td>" +
            content +
            "</td>" +
            "</tr>"
          );
        }, "") +
        "</table>";

      var section = that.findInfoSection("Inputs");
      if (!defined(section)) {
        that.info.push({
          name: "Inputs",
          content: inputsSection
        });
      }

      if (!defined(that.featureInfoTemplate)) {
        that.featureInfoTemplate =
          "#### Inputs\n\n" +
          inputsSection +
          "\n\n" +
          "#### Outputs\n\n" +
          outputsSection;
      }

      if (defined(geojson)) {
        that._geoJsonItem = new GeoJsonCatalogItem(that.terria);
        that._geoJsonItem.name = that.name;
        that._geoJsonItem.data = geojson;
        return that._geoJsonItem.load().then(function() {
          if (!defined(that.rectangle)) {
            that.rectangle = that._geoJsonItem.rectangle;
          }
        });
      }
    });
  });
};

WebProcessingServiceCatalogItem.prototype._enable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._enable();
  }
};

WebProcessingServiceCatalogItem.prototype._disable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._disable();
  }
};

WebProcessingServiceCatalogItem.prototype._show = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._show();
  }
};

WebProcessingServiceCatalogItem.prototype._hide = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._hide();
  }
};

function formatOutputValue(title, value) {
  if (!defined(value)) {
    return "";
  }

  var values = value.split(",");

  return values.reduce(function(previousValue, currentValue) {
    if (value.match(/[.\/](png|jpg|jpeg|gif|svg)/i)) {
      return (
        previousValue +
        '<a href="' +
        currentValue +
        '"><img src="' +
        currentValue +
        '" alt="' +
        title +
        '" /></a>'
      );
    } else if (
      currentValue.indexOf("http:") === 0 ||
      currentValue.indexOf("https:") === 0
    ) {
      var uri = new URI(currentValue);
      return (
        previousValue +
        '<a href="' +
        currentValue +
        '">' +
        uri.filename() +
        "</a>"
      );
    } else {
      return previousValue + currentValue;
    }
  }, "");
}

function getGeoJson(catalogItem) {
  if (
    !defined(catalogItem.parameters) ||
    !defined(catalogItem.parameterValues)
  ) {
    return when(undefined);
  }
  var features = [];

  for (var i = 0; i < catalogItem.parameters.length; i++) {
    if (typeof catalogItem.parameters[i].getGeoJsonFeature === "function") {
      var potentialFeature = catalogItem.parameters[i].getGeoJsonFeature(
        catalogItem.parameterValues[catalogItem.parameters[i].id]
      );
      if (defined(potentialFeature)) {
        if (potentialFeature instanceof Array) {
          features = features.concat(potentialFeature);
        } else {
          features.push(potentialFeature);
        }
      }
    }
  }
  return when.all(features).then(function(results) {
    var geojson = {
      type: "FeatureCollection",
      features: results,
      totalFeatures: results.length
    };
    return geojson;
  });
}

module.exports = WebProcessingServiceCatalogItem;
