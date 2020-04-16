"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadXML = require("../Core/loadXML");

var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var WebMapServiceCatalogItem = require("./WebMapServiceCatalogItem");
var xml2json = require("../ThirdParty/xml2json");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of layers from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var WebMapServiceCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "wms-getCapabilities");

  /**
   * Gets or sets the URL of the WMS server.  This property is observable.
   * @type {String}
   */
  this.url = "";

  /**
   * Gets or sets a description of the custodian of the data sources in this group.
   * This property is an HTML string that must be sanitized before display to the user.
   * This property is observable.
   * @type {String}
   * @editorformat textarea
   */
  this.dataCustodian = undefined;

  /**
   * Gets or sets the additional parameters to pass to the WMS server when requesting images.
   * All parameter names must be entered in lowercase in order to be consistent with references in TerrisJS code.
   * If this property is undefiend, {@link WebMapServiceCatalogItem.defaultParameters} is used.
   * @type {Object}
   */
  this.parameters = undefined;

  /**
   * Gets or sets a hash of names of blacklisted data layers.  A layer that appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the Title of the layers to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.blacklist = undefined;

  /**
   * Gets or sets the field name to use as the primary title in the catalog view: each WMS layer's
   * "title" (default), "name", or "abstract".
   * @type {String}
   */
  this.titleField = "title";

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { 'treat404AsError': false }
   * @type {Object}
   */
  this.itemProperties = undefined;

  /**
   * Gets or sets a value indicating whether the list of layers queried from GetCapabilities should be
   * flattened into a list with no hierarchy.
   * @type {Boolean}
   * @default false
   */
  this.flatten = false;

  knockout.track(this, [
    "url",
    "dataCustodian",
    "parameters",
    "blacklist",
    "titleField",
    "itemProperties",
    "flatten"
  ]);
};

inherit(CatalogGroup, WebMapServiceCatalogGroup);

Object.defineProperties(WebMapServiceCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf WebMapServiceCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wms-getCapabilities";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf WebMapServiceCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.webMapServiceCatalogGroup.wmsServer");
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WebMapServiceCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return WebMapServiceCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
WebMapServiceCatalogGroup.defaultSerializers = clone(
  CatalogGroup.defaultSerializers
);

WebMapServiceCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

WebMapServiceCatalogGroup.defaultSerializers.isLoading = function(
  wmsGroup,
  json,
  propertyName,
  options
) {};

Object.freeze(WebMapServiceCatalogGroup.defaultSerializers);

WebMapServiceCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.blacklist, this.titleField];
};

WebMapServiceCatalogGroup.prototype._load = function() {
  var url =
    cleanAndProxyUrl(this, this.url) +
    "?service=WMS&request=GetCapabilities&version=1.3.0&tiled=true";

  var that = this;
  return loadXML(url)
    .then(function(xml) {
      // Is this really a GetCapabilities response?
      if (
        !xml ||
        !xml.documentElement ||
        (xml.documentElement.localName !== "WMS_Capabilities" &&
          xml.documentElement.localName !== "WMT_MS_Capabilities")
      ) {
        throw new TerriaError({
          title: i18next.t(
            "models.webMapServiceCatalogGroup.invalidWMSServerTitle"
          ),
          message: i18next.t(
            "models.webMapServiceCatalogGroup.invalidWMSServerMessage",
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

      // Skip the root layer, if there's only one.
      // But use it for the name of this catalog item if the item is currently named by the URL.
      var parentLayer;
      var rootLayers = json.Capability.Layer;
      if (rootLayers) {
        if (!(rootLayers instanceof Array)) {
          rootLayers = [rootLayers];
        }
        if (rootLayers.length === 1 && rootLayers[0].Layer) {
          var singleRoot = rootLayers[0];
          if (that.name === that.url) {
            that.name = getNameFromLayer(that, singleRoot);
          }
          parentLayer = singleRoot;
          rootLayers = singleRoot.Layer;
        }

        var infoDerivedFromCapabilities = {
          availableStyles: WebMapServiceCatalogItem.getAllAvailableStylesFromCapabilities(
            json
          ),
          availableDimensions: WebMapServiceCatalogItem.getAllAvailableDimensionsFromCapabilities(
            json
          )
        };

        addLayersRecursively(
          that,
          that,
          json,
          rootLayers,
          parentLayer,
          infoDerivedFromCapabilities
        );
      }
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: that,
        title: i18next.t(
          "models.webMapServiceCatalogGroup.groupNotAvailableTitle"
        ),
        message: i18next.t(
          "models.webMapServiceCatalogGroup.groupNotAvailableMessage",
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

function cleanAndProxyUrl(catalogGroup, url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");

  var cleanedUrl = uri.toString();
  return proxyCatalogItemUrl(catalogGroup, cleanedUrl, "1d");
}

function getNameFromLayer(wmsGroup, layer) {
  if (wmsGroup.titleField === "name") {
    return layer.Name;
  } else if (wmsGroup.titleField === "abstract") {
    return layer.Abstract;
  } else {
    return layer.Title;
  }
}

function addLayersRecursively(
  wmsGroup,
  parentGroup,
  capabilities,
  layers,
  parent,
  infoDerivedFromCapabilities
) {
  if (!(layers instanceof Array)) {
    layers = [layers];
  }

  for (var i = 0; i < layers.length; ++i) {
    var layer = layers[i];

    // Record this layer's parent, so we can walk up the layer hierarchy looking for inherited properties.
    layer._parent = parent;

    if (wmsGroup.blacklist && wmsGroup.blacklist[layer.Title]) {
      console.log(
        "Provider Feedback: Filtering out " +
          layer.Title +
          " (" +
          layer.Name +
          ") because it is blacklisted."
      );
      continue;
    }

    if (defined(layer.Layer)) {
      var group = parentGroup;
      if (!wmsGroup.flatten) {
        // Create a group for this layer
        group = createWmsSubGroup(wmsGroup, layer);
      }

      // WMS 1.1.1 spec section 7.1.4.5.2 says any layer with a Name property can be used
      // in the 'layers' parameter of a GetMap request.  This is true in 1.0.0 and 1.3.0 as well.
      var allName = "(All)";
      var originalNameForAll;
      if (defined(layer.Name) && layer.Name.length > 0) {
        var all = createWmsDataSource(
          wmsGroup,
          capabilities,
          layer,
          infoDerivedFromCapabilities
        );

        if (!wmsGroup.flatten) {
          originalNameForAll = all.name;
          all.name = allName + " " + all.name;
        }

        group.add(all);
      }

      addLayersRecursively(
        wmsGroup,
        group,
        capabilities,
        layer.Layer,
        layer,
        infoDerivedFromCapabilities
      );

      if (!wmsGroup.flatten) {
        if (
          group.items.length === 1 &&
          group.items[0].name.indexOf(allName) === 0
        ) {
          group.items[0].name = originalNameForAll;
          parentGroup.add(group.items[0]);
        } else if (group.items.length > 0) {
          parentGroup.add(group);
        }
      }
    } else {
      parentGroup.add(
        createWmsDataSource(
          wmsGroup,
          capabilities,
          layer,
          infoDerivedFromCapabilities
        )
      );
    }
  }
}

function createWmsDataSource(
  wmsGroup,
  capabilities,
  layer,
  infoDerivedFromCapabilities
) {
  var result = new WebMapServiceCatalogItem(wmsGroup.terria);

  result.name = getNameFromLayer(wmsGroup, layer);
  result.layers = layer.Name;
  result.url = wmsGroup.url;

  result.updateFromCapabilities(
    capabilities,
    false,
    layer,
    infoDerivedFromCapabilities
  );

  if (typeof wmsGroup.itemProperties === "object") {
    result.updateFromJson(wmsGroup.itemProperties);
  }

  return result;
}

function createWmsSubGroup(wmsGroup, layer) {
  var result = new CatalogGroup(wmsGroup.terria);

  if (wmsGroup.titleField === "name") {
    result.name = layer.Name;
  } else if (wmsGroup.titleField === "abstract") {
    result.name = layer.Abstract;
  } else {
    result.name = layer.Title;
  }

  return result;
}

module.exports = WebMapServiceCatalogGroup;
