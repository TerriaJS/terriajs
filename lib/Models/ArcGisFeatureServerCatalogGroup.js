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
var ArcGisFeatureServerCatalogItem = require("./ArcGisFeatureServerCatalogItem");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of layers from an ArcGIS Feature Service.
 * Eg. https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer
 *
 * @alias ArcGisFeatureServerCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisFeatureServerCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "esri-featureServer-group");

  /**
   * Gets or sets the URL of the Feature Server.  This property is observable.
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

inherit(CatalogGroup, ArcGisFeatureServerCatalogGroup);

Object.defineProperties(ArcGisFeatureServerCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf ArcGisFeatureServerCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "esri-featureServer-group";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf ArcGisFeatureServerCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.arcGisFeatureServer.nameGroup");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object lieral,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf ArcGisFeatureServerCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return ArcGisFeatureServerCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ArcGisFeatureServerCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);

ArcGisFeatureServerCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

ArcGisFeatureServerCatalogGroup.defaultSerializers.isLoading = function(
  wmsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(ArcGisFeatureServerCatalogGroup.defaultSerializers);

ArcGisFeatureServerCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist];
};

ArcGisFeatureServerCatalogGroup.prototype._load = function() {
  return loadFeatureServer(this);
};

// loadFeatureServer is exposed so that ArcGisCatalogGroup can call it,
// to load a MapServer as if it were an ArcGisFeatureServerCatalogGroup.
ArcGisFeatureServerCatalogGroup.loadFeatureServer = function(catalogGroup) {
  return loadFeatureServer(catalogGroup);
};

function loadFeatureServer(catalogGroup) {
  var terria = catalogGroup.terria;
  var uri = new URI(catalogGroup.url).addQuery("f", "json");
  return when(loadJson(proxyCatalogItemUrl(catalogGroup, uri.toString(), "1d")))
    .then(function(result) {
      // Is this really a FeatureServer REST response?
      if (!result || !result.layers) {
        throw new TerriaError({
          title: i18next.t("models.arcGisFeatureServer.invalidServiceTitle"),
          message: i18next.t("models.arcGisFeatureServer.invalidServiceTitle", {
            email:
              '<a href="mailto:' +
              terria.supportEmail +
              '">' +
              terria.supportEmail +
              "</a>"
          })
        });
      }

      if (defined(result.documentInfo)) {
        var dataCustodian = catalogGroup.dataCustodian;
        if (!defined(dataCustodian) && defined(result.documentInfo.Author)) {
          dataCustodian = result.documentInfo.Author;
        }
        if (
          catalogGroup.name === "Unnamed Item" &&
          defined(result.documentInfo.Title) &&
          result.documentInfo.Title.length > 0
        ) {
          catalogGroup.name = result.documentInfo.Title;
        }
      }
      addLayers(catalogGroup, -1, result.layers, catalogGroup, dataCustodian);
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: catalogGroup,
        title: i18next.t("models.arcGisFeatureServer.groupNotAvailableTitle"),
        message: i18next.t(
          "models.arcGisFeatureServer.groupNotAvailableMessage",
          {
            cors: '<a href="http://enable-cors.org/" target="_blank">CORS</a>',
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

function addLayers(
  featureServerGroup,
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

    if (
      featureServerGroup.blacklist &&
      featureServerGroup.blacklist[layer.name]
    ) {
      console.log(
        "Provider Feedback: Filtering out " +
          layer.name +
          " (" +
          layer.id +
          ") because it is blacklisted."
      );
      continue;
    }

    thisGroup.add(createDataSource(featureServerGroup, layer, dataCustodian));
  }
}

function createDataSource(featureServerGroup, layer, dataCustodian) {
  var item = new ArcGisFeatureServerCatalogItem(featureServerGroup.terria);

  item.name = replaceUnderscores(layer.name);
  item.dataCustodian = dataCustodian;
  var uri = new URI(featureServerGroup.url).segment(layer.id + ""); // Convert layer id to string as segment(0) means sthg different.
  item.url = uri.toString();
  item.layers = layer.id.toString();
  item.maximumScale = layer.maxScale;

  if (typeof featureServerGroup.itemProperties === "object") {
    item.updateFromJson(featureServerGroup.itemProperties);
  }

  return item;
}

module.exports = ArcGisFeatureServerCatalogGroup;
