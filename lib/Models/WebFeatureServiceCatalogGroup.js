"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadXML = require("../Core/loadXML");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;

var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var unionRectangles = require("../Map/unionRectangles");
var WebFeatureServiceCatalogItem = require("./WebFeatureServiceCatalogItem");
var xml2json = require("../ThirdParty/xml2json");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of feature types from a Web Feature Service (WFS) server.
 *
 * @alias WebFeatureServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var WebFeatureServiceCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "wfs-getCapabilities");

  /**
   * Gets or sets the URL of the WFS server.  This property is observable.
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

  knockout.track(this, ["url", "dataCustodian", "blacklist"]);
};

inherit(CatalogGroup, WebFeatureServiceCatalogGroup);

Object.defineProperties(WebFeatureServiceCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf WebFeatureServiceCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wfs-getCapabilities";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Feature Service (WFS)'.
   * @memberOf WebFeatureServiceCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.webFeatureServiceCatalogGroup.wfsServer");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WebFeatureServiceCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return WebFeatureServiceCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WebFeatureServiceCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);

WebFeatureServiceCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

WebFeatureServiceCatalogGroup.defaultSerializers.isLoading = function(
  wfsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(WebFeatureServiceCatalogGroup.defaultSerializers);

WebFeatureServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist];
};

WebFeatureServiceCatalogGroup.prototype._load = function() {
  var url =
    cleanAndProxyUrl(this, this.url) +
    "?service=WFS&version=1.1.0&request=GetCapabilities";

  var that = this;
  return loadXML(url)
    .then(function(xml) {
      // Is this really a GetCapabilities response?
      if (
        !xml ||
        !xml.documentElement ||
        xml.documentElement.localName !== "WFS_Capabilities"
      ) {
        throw new TerriaError({
          title: i18next.t(
            "models.webFeatureServiceCatalogGroup.invalidWFSServerTitle"
          ),
          message: i18next.t(
            "models.webFeatureServiceCatalogGroup.invalidWFSServerMessage",
            {
              email:
                '<a href="mailto:' +
                that.terria.supportEmail +
                '">' +
                that.terria.supportEmail +
                "</a>."
            }
          )
        });
      }

      var json = xml2json(xml);

      var supportsJsonGetFeature = false;
      if (defined(json.ServiceIdentification)) {
        if (defined(json.ServiceIdentification.Title)) {
          if (that.name === that.url) {
            that.name = json.ServiceIdentification.Title;
          }
        }
      }
      if (defined(json.OperationsMetadata)) {
        var getFeatureOperation = findElementByName(
          json.OperationsMetadata.Operation,
          "GetFeature"
        );
        if (defined(getFeatureOperation)) {
          var outputFormatParameter = findElementByName(
            getFeatureOperation.Parameter,
            "outputFormat"
          );
          if (
            defined(outputFormatParameter) &&
            defined(outputFormatParameter.Value)
          ) {
            supportsJsonGetFeature =
              outputFormatParameter.Value.indexOf("json") >= 0 ||
              outputFormatParameter.Value.indexOf("JSON") >= 0 ||
              outputFormatParameter.Value.indexOf("application/json") >= 0;
          }
        }
      }

      var dataCustodian = that.dataCustodian;
      if (
        !defined(dataCustodian) &&
        defined(json.ServiceProvider) &&
        defined(json.ServiceProvider.ProviderName)
      ) {
        dataCustodian = json.ServiceProvider.ProviderName;

        if (
          defined(json.ServiceProvider.ProviderSite) &&
          defined(json.ServiceProvider.ProviderSite.href)
        ) {
          dataCustodian =
            "[" +
            dataCustodian +
            "](" +
            json.ServiceProvider.ProviderSite.href +
            ")";
        }

        if (
          defined(json.ServiceProvider.ServiceContact) &&
          defined(json.ServiceProvider.ServiceContact.Address) &&
          defined(
            json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress
          )
        ) {
          dataCustodian += "<br/>";
          dataCustodian +=
            "[" +
            json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress +
            "](mailto:" +
            json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress +
            ")<br/>";
        }
      }

      if (defined(json.FeatureTypeList)) {
        addFeatureTypes(
          that,
          json.FeatureTypeList.FeatureType,
          that.items,
          undefined,
          supportsJsonGetFeature,
          dataCustodian
        );
      }
    })
    .otherwise(function(e) {
      throw new TerriaError({
        title: i18next.t(
          "models.webFeatureServiceCatalogGroup.groupNotAvailableTitle"
        ),
        message: i18next.t(
          "models.webFeatureServiceCatalogGroup.groupNotAvailableMessage",
          {
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>.",
            appName: that.terria.appName
          }
        )
      });
    });
};

function findElementByName(list, name) {
  if (!defined(list)) {
    return undefined;
  }

  for (var i = 0; i < list.length; ++i) {
    if (list[i].name === name) {
      return list[i];
    }
  }

  return undefined;
}

function cleanAndProxyUrl(catalogGroup, url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");

  var cleanedUrl = uri.toString();
  return proxyCatalogItemUrl(catalogGroup, cleanedUrl, "1d");
}

function addFeatureTypes(
  wfsGroup,
  featureTypes,
  items,
  parent,
  supportsJsonGetFeature,
  dataCustodian
) {
  if (!defined(featureTypes)) {
    return;
  }
  if (!(featureTypes instanceof Array)) {
    featureTypes = [featureTypes];
  }

  for (var i = 0; i < featureTypes.length; ++i) {
    var featureType = featureTypes[i];

    if (wfsGroup.blacklist && wfsGroup.blacklist[featureType.Title]) {
      console.log(
        "Provider Feedback: Filtering out " +
          featureType.Title +
          " (" +
          featureType.Name +
          ") because it is blacklisted."
      );
      continue;
    }

    wfsGroup.add(
      createWfsDataSource(
        wfsGroup,
        featureType,
        supportsJsonGetFeature,
        dataCustodian
      )
    );
  }
}

function createWfsDataSource(
  wfsGroup,
  featureType,
  supportsJsonGetFeature,
  dataCustodian
) {
  var result = new WebFeatureServiceCatalogItem(wfsGroup.terria);

  result.name = featureType.Title;
  result.description =
    defined(featureType.Abstract) && featureType.Abstract.length > 0
      ? featureType.Abstract
      : wfsGroup.description;
  result.dataCustodian = dataCustodian;
  result.url = wfsGroup.url;
  result.typeNames = featureType.Name;

  result.description = "";

  var wfsGroupHasDescription =
    defined(wfsGroup.description) && wfsGroup.description.length > 0;
  var layerHasAbstract =
    defined(featureType.Abstract) && featureType.Abstract.length > 0;

  if (wfsGroupHasDescription) {
    result.description += wfsGroup.description;
  }

  if (wfsGroupHasDescription && layerHasAbstract) {
    result.description += "<br/>";
  }

  if (layerHasAbstract) {
    result.description += featureType.Abstract;
  }

  result.requestGeoJson = supportsJsonGetFeature;
  result.requestGml = true;

  var boundingBoxes = featureType.WGS84BoundingBox;

  var rectangle;
  if (boundingBoxes instanceof Array) {
    rectangle = wgs84BoundingBoxToRectangle(boundingBoxes[0]);
    for (var i = 1; i < boundingBoxes.length; ++i) {
      rectangle = unionRectangles(
        rectangle,
        wgs84BoundingBoxToRectangle(boundingBoxes[i])
      );
    }
  } else if (defined(boundingBoxes)) {
    rectangle = wgs84BoundingBoxToRectangle(boundingBoxes);
  } else {
    rectangle = Rectangle.MAX_VALUE;
  }

  result.rectangle = rectangle;

  return result;
}

function wgs84BoundingBoxToRectangle(boundingBox) {
  if (!defined(boundingBox)) {
    return Rectangle.MAX_VALUE;
  }

  var lowerCorner = boundingBox.LowerCorner;
  var upperCorner = boundingBox.UpperCorner;
  if (!defined(lowerCorner) || !defined(upperCorner)) {
    return Rectangle.MAX_VALUE;
  }

  var lowerCoordinates = lowerCorner.split(" ");
  var upperCoordinates = upperCorner.split(" ");
  if (lowerCoordinates.length !== 2 || upperCoordinates.length !== 2) {
    return Rectangle.MAX_VALUE;
  }

  return Rectangle.fromDegrees(
    lowerCoordinates[0],
    lowerCoordinates[1],
    upperCoordinates[0],
    upperCoordinates[1]
  );
}

module.exports = WebFeatureServiceCatalogGroup;
