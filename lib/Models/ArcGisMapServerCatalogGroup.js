"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var replaceUnderscores = require("../Core/replaceUnderscores");
var ArcGisMapServerCatalogItem = require("./ArcGisMapServerCatalogItem");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of layers from an ArcGIS Map Service.
 * Eg. http://www.ga.gov.au/gis/rest/services/earth_observation/Landcover_WM/MapServer
 *
 * @alias ArcGisMapServerCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisMapServerCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "esri-mapServer-group");

  /**
   * Gets or sets the URL of the Map Server.  This property is observable.
   * @type {String}
   */
  this.url = "";

  /**
   * Gets or sets a description of the custodian of the data sources in this group.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.blacklist = undefined;

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { 'treat404AsError': false }
   */
  this.itemProperties = undefined;

  knockout.track(this, ["url", "dataCustodian", "blacklist", "itemProperties"]);
};

inherit(CatalogGroup, ArcGisMapServerCatalogGroup);

Object.defineProperties(ArcGisMapServerCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf ArcGisMapServerCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "esri-mapServer-group";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf ArcGisMapServerCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.arcGisMapServerCatalogGroup.name");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object lieral,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf ArcGisMapServerCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return ArcGisMapServerCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ArcGisMapServerCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);

ArcGisMapServerCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

ArcGisMapServerCatalogGroup.defaultSerializers.isLoading = function(
  wmsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(ArcGisMapServerCatalogGroup.defaultSerializers);

ArcGisMapServerCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist];
};

ArcGisMapServerCatalogGroup.prototype._load = function() {
  return loadMapServer(this);
};

// loadMapServer is exposed so that ArcGisCatalogGroup can call it,
// to load a MapServer as if it were an ArcGisMapServerCatalogGroup.
ArcGisMapServerCatalogGroup.loadMapServer = function(catalogGroup) {
  return loadMapServer(catalogGroup);
};

function loadMapServer(catalogGroup) {
  function getJson(segment) {
    var uri = new URI(catalogGroup.url).segment(segment).addQuery("f", "json");
    return loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString(), "1d"));
  }
  var terria = catalogGroup.terria;
  return when
    .all([getJson(""), getJson("layers"), getJson("legend")])
    .then(function(result) {
      var serviceJson = result[0];
      var layersJson = result[1];
      var legendJson = result[2];

      // Is this really a MapServer REST response?
      if (
        !serviceJson ||
        !serviceJson.layers ||
        !layersJson ||
        !layersJson.layers
      ) {
        throw new TerriaError({
          title: i18next.t(
            "models.arcGisMapServerCatalogGroup.invalidServiceTitle"
          ),
          message: i18next.t(
            "models.arcGisMapServerCatalogGroup.invalidServiceMessage",
            {
              email:
                '<a href="mailto:' +
                terria.supportEmail +
                '">' +
                terria.supportEmail +
                "</a>"
            }
          )
        });
      }

      var dataCustodian = catalogGroup.dataCustodian;
      if (
        !defined(dataCustodian) &&
        defined(serviceJson.documentInfo) &&
        defined(serviceJson.documentInfo.Author)
      ) {
        dataCustodian = serviceJson.documentInfo.Author;
      }
      if (
        (catalogGroup.name === "Unnamed Item" ||
          catalogGroup.name === catalogGroup.url) &&
        defined(serviceJson.mapName) &&
        serviceJson.mapName.length > 0
      ) {
        catalogGroup.name = serviceJson.mapName;
      }

      addLayersRecursively(
        catalogGroup,
        serviceJson,
        layersJson,
        legendJson,
        -1,
        layersJson.layers,
        catalogGroup,
        dataCustodian
      );
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: catalogGroup,
        title: i18next.t(
          "models.arcGisMapServerCatalogGroup.groupNotAvailableTitle"
        ),
        message: i18next.t(
          "models.arcGisMapServerCatalogGroup.groupNotAvailableMessage",
          {
            cors:
              '<a href="http://enable-cors.org/" target="_blank">' +
              i18next.t("models.arcGisMapServerCatalogGroup.cors") +
              "</a>",
            appName: terria.appName,
            email:
              '<a href="mailto:' +
              terria.supportEmail +
              '">' +
              terria.supportEmail +
              "</a>"
          }
        )
      });
    });
}

function addLayersRecursively(
  mapServiceGroup,
  topLevelJson,
  topLevelLayersJson,
  topLevelLegendJson,
  parentID,
  layers,
  thisGroup,
  dataCustodian
) {
  if (!(layers instanceof Array)) {
    layers = [layers];
  }

  for (var i = 0; i < layers.length; ++i) {
    var layer = layers[i];

    if (
      parentID === -1 &&
      layer.parentLayer !== null &&
      defined(layer.parentLayer)
    ) {
      continue;
    } else if (
      parentID !== -1 &&
      (!layer.parentLayer || layer.parentLayer.id !== parentID)
    ) {
      continue;
    }

    if (mapServiceGroup.blacklist && mapServiceGroup.blacklist[layer.name]) {
      console.log(
        "Provider Feedback: Filtering out " +
          layer.name +
          " (" +
          layer.id +
          ") because it is blacklisted."
      );
      continue;
    }

    if (layer.type === "Group Layer") {
      var subGroup = new CatalogGroup(mapServiceGroup.terria);
      subGroup.name = replaceUnderscores(layer.name);
      thisGroup.add(subGroup);
      addLayersRecursively(
        mapServiceGroup,
        topLevelJson,
        topLevelLayersJson,
        topLevelLegendJson,
        layer.id,
        layers,
        subGroup,
        dataCustodian
      );
    } else if (
      layer.type === "Feature Layer" ||
      layer.type === "Raster Layer" ||
      layer.type === "Mosaic Layer"
    ) {
      thisGroup.add(
        createDataSource(
          mapServiceGroup,
          topLevelJson,
          topLevelLayersJson,
          topLevelLegendJson,
          layer,
          dataCustodian
        )
      );
    }
  }
}

function createDataSource(
  mapServiceGroup,
  topLevelJson,
  topLevelLayersJson,
  topLevelLegendJson,
  layer,
  dataCustodian
) {
  var result = new ArcGisMapServerCatalogItem(mapServiceGroup.terria);

  result.name = replaceUnderscores(layer.name);
  result.dataCustodian = dataCustodian;
  result.url = mapServiceGroup.url;
  result.layers = layer.id.toString();
  result.maximumScale = layer.maxScale;

  result.updateFromMetadata(
    topLevelJson,
    topLevelLayersJson,
    topLevelLegendJson,
    true,
    layer
  );

  if (typeof mapServiceGroup.itemProperties === "object") {
    result.updateFromJson(mapServiceGroup.itemProperties);
  }

  return result;
}

module.exports = ArcGisMapServerCatalogGroup;
