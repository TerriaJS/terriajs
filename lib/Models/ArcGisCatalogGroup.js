"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");

var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var replaceUnderscores = require("../Core/replaceUnderscores");
var ArcGisFeatureServerCatalogGroup = require("./ArcGisFeatureServerCatalogGroup");
var ArcGisMapServerCatalogGroup = require("./ArcGisMapServerCatalogGroup");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of ArcGIS Services,
 * eg. http://www.ga.gov.au/gis/rest/services/
 *
 * @alias ArcGisCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "esri-group");

  /**
   * Gets or sets the URL of the services.  This property is observable.
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

inherit(CatalogGroup, ArcGisCatalogGroup);

Object.defineProperties(ArcGisCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf ArcGisCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "esri-group";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf ArcGisCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.arcGisService.name");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf ArcGisCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return ArcGisCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
ArcGisCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

ArcGisCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

ArcGisCatalogGroup.defaultSerializers.isLoading = function(
  wmsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(ArcGisCatalogGroup.defaultSerializers);

ArcGisCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist];
};

ArcGisCatalogGroup.prototype._load = function() {
  // Allow ArcGisCatalogGroup to function like an ArcGisMapServerCatalogGroup or an ArcGisFeatureServerCatalogGroup.
  if (/\/MapServer\/?$/i.test(this.url)) {
    return ArcGisMapServerCatalogGroup.loadMapServer(this);
  } else if (/\/FeatureServer\/?$/i.test(this.url)) {
    return ArcGisFeatureServerCatalogGroup.loadFeatureServer(this);
  } else {
    return loadRest(this);
  }
};

function loadRest(catalogGroup) {
  // Load as a generic REST endpoint.
  var serviceUrl = cleanAndProxyUrl(catalogGroup, catalogGroup.url) + "?f=json";

  var terria = catalogGroup.terria;

  return loadJson(serviceUrl)
    .then(function(serviceJson) {
      // Is this really a MapServer REST response?
      if (!serviceJson || (!serviceJson.folders && !serviceJson.services)) {
        throw new TerriaError({
          title: i18next.t("models.arcGisService.invalidServerTitle"),
          message: i18next.t("models.arcGisService.invalidServerMessage", {
            email:
              '<a href="mailto:' +
              terria.supportEmail +
              '">' +
              terria.supportEmail +
              "</a>"
          })
        });
      }

      var basePath = getBasePath(catalogGroup);

      var i;

      var folders = serviceJson.folders;
      if (defined(folders)) {
        for (i = 0; i < folders.length; ++i) {
          createGroup(catalogGroup, basePath, folders[i]);
        }
      }

      var services = serviceJson.services;
      if (defined(services)) {
        for (i = 0; i < services.length; ++i) {
          createMapOrFeatureServer(catalogGroup, basePath, services[i]);
        }
      }
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: catalogGroup,
        title: i18next.t("models.arcGisService.groupNotAvailableTitle"),
        message: i18next.t("models.arcGisService.groupNotAvailableMessage", {
          cors: '<a href="http://enable-cors.org/" target="_blank">CORS</a>',
          appName: terria.appName,
          email:
            '<a href="mailto:' +
            terria.supportEmail +
            '">' +
            terria.supportEmail +
            "</a>"
        })
      });
    });
}

function cleanAndProxyUrl(catalogGroup, url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");

  var cleanedUrl = uri.toString();
  return proxyCatalogItemUrl(catalogGroup, cleanedUrl, "1d");
}

function createGroup(catalogGroup, basePath, folderJson) {
  var localName = removePathFromName(basePath, folderJson);

  var newGroup = new ArcGisCatalogGroup(catalogGroup.terria);
  newGroup.name = replaceUnderscores(localName);
  newGroup.url = new URI(catalogGroup.url).segment(localName).toString();
  newGroup.dataCustodian = catalogGroup.dataCustodian;
  newGroup.blacklist = catalogGroup.blacklist;

  if (defined(catalogGroup.itemProperties)) {
    newGroup.updateFromJson(catalogGroup.itemProperties);
  }

  catalogGroup.add(newGroup);

  return newGroup;
}

var validServerTypes = ["MapServer", "FeatureServer"];

function createMapOrFeatureServer(catalogGroup, basePath, serviceJson) {
  var serverTypeIndex = validServerTypes.indexOf(serviceJson.type);
  if (serverTypeIndex < 0) {
    return;
  }

  var localName = removePathFromName(basePath, serviceJson.name);
  var group;
  if (serverTypeIndex === 0) {
    group = new ArcGisMapServerCatalogGroup(catalogGroup.terria);
  } else {
    group = new ArcGisFeatureServerCatalogGroup(catalogGroup.terria);
  }
  group.name = replaceUnderscores(localName);
  group.url = new URI(catalogGroup.url)
    .segment(localName)
    .segment(serviceJson.type)
    .toString();
  group.dataCustodian = catalogGroup.dataCustodian;
  group.blacklist = catalogGroup.blacklist;

  if (defined(catalogGroup.itemProperties)) {
    for (var propertyName in catalogGroup.itemProperties) {
      if (catalogGroup.itemProperties.hasOwnProperty(propertyName)) {
        group[propertyName] = catalogGroup.itemProperties[propertyName];
      }
    }
  }

  catalogGroup.add(group);

  return group;
}

function getBasePath(catalogGroup) {
  var match = /rest\/services\/(.*)/i.exec(catalogGroup.url);
  if (match && match.length > 1) {
    return match[1];
  } else {
    return "";
  }
}

function removePathFromName(basePath, name) {
  if (!basePath && basePath.length === 0) {
    return name;
  }

  var index = name.indexOf(basePath);
  if (index === 0) {
    return name.substring(basePath.length + 1);
  } else {
    return name;
  }
}

module.exports = ArcGisCatalogGroup;
