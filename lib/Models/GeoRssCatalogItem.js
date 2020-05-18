"use strict";

/*global require*/
var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;
var RuntimeError = require("terriajs-cesium/Source/Core/RuntimeError").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var CatalogItem = require("./CatalogItem");
var inherit = require("../Core/inherit");
const loadXML = require("../Core/loadXML");
var Metadata = require("./Metadata");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var geoRssConvertor = require("../Map/geoRssConvertor");
var geoRss2Convertor = geoRssConvertor.geoRss2ToGeoJson;
var geoRssAtomConvertor = geoRssConvertor.geoRssAtomToGeoJson;

/**
 * A {@link CatalogItem} representing GeoRSS data.
 *
 * @alias GeoRssCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the CZML data.
 */
function GeoRssCatalogItem(terria) {
  CatalogItem.call(this, terria);

  this._geoJsonItem = undefined;
}

inherit(CatalogItem, GeoRssCatalogItem);

Object.defineProperties(GeoRssCatalogItem.prototype, {
  /**
   * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
   * @memberOf GeoRssCatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets the type of data member represented by this instance.
   * @memberOf GeoRssCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "georss";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'GeoRSS'.
   * @memberOf GeoRssCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "GeoRSS";
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf GeoRssCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage =
        "This data source does not have any details available.";
      result.serviceErrorMessage =
        "This service does not have any details available.";
      return result;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf GeoRssCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return GeoRssCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf GeoRssCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return GeoRssCatalogItem.defaultSerializers;
    }
  },

  /**
   * Gets the data source associated with this catalog item.
   * @memberOf GeoRssCatalogItem.prototype
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

GeoRssCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);
Object.freeze(GeoRssCatalogItem.defaultUpdaters);

GeoRssCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

GeoRssCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url];
};

GeoRssCatalogItem.prototype._load = function() {
  this._geoJsonItem = new GeoJsonCatalogItem(this.terria);
  this._geoJsonItem.data = loadGeoRss(this);
  this._geoJsonItem.name = this.name;
  var that = this;

  return this._geoJsonItem.load().then(function() {
    if (!defined(that.rectangle)) {
      that.rectangle = that._geoJsonItem.rectangle;
    }
  });
};

GeoRssCatalogItem.prototype._enable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._enable();
  }
};

GeoRssCatalogItem.prototype._disable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._disable();
  }
};

GeoRssCatalogItem.prototype._show = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._show();
  }
};

GeoRssCatalogItem.prototype._hide = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._hide();
  }
};

GeoRssCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
  if (defined(this._geoJsonItem)) {
    return this._geoJsonItem.showOnSeparateMap(globeOrMap);
  }
};
GeoRssCatalogItem.prototype.zoomTo = function() {
  var that = this;
  return when(this.load(), function() {
    if (defined(that.nowViewingCatalogItem)) {
      return that.nowViewingCatalogItem.zoomTo();
    }

    if (defined(that.rectangle)) {
      return CatalogItem.prototype.zoomTo.call(that);
    }

    if (!defined(that.dataSource)) {
      return;
    }

    return that.terria.currentViewer.zoomTo(that.dataSource);
  });
};

function loadGeoRss(geoRssItem) {
  return loadXML(proxyCatalogItemUrl(geoRssItem, geoRssItem.url)).then(function(
    xml
  ) {
    if (typeof xml === "string") {
      const parser = new DOMParser();
      xml = parser.parseFromString(xml, "text/xml");
    }
    var documentElement = xml.documentElement;
    var promise;
    if (documentElement.localName === "rss") {
      promise = geoRss2Convertor(xml);
      resolveCatalogMetaData(
        documentElement.getElementsByTagName("channel")[0],
        geoRssItem
      );
    } else if (documentElement.localName === "feed") {
      promise = geoRssAtomConvertor(xml);
      resolveCatalogMetaData(documentElement, geoRssItem);
    } else {
      throw new RuntimeError("document is not valid");
    }
    return promise;
  });
}

function resolveCatalogMetaData(documentElement, geoRssItem) {
  var childNodes = documentElement.childNodes;

  for (
    var childNodeIndex = 0;
    childNodeIndex < childNodes.length;
    ++childNodeIndex
  ) {
    var child = childNodes[childNodeIndex];
    if (
      child.nodeType !== 1 ||
      child.localName === "item" ||
      child.localName === "entry"
    ) {
      continue;
    }
    if (child.localName === "title") {
      geoRssItem.name = child.textContent;
    } else if (child.localName === "description") {
      geoRssItem.description = child.textContent;
    } else if (child.localName === "copyright") {
      geoRssItem.copyrightText = child.copyright;
    } else if (child.localName === "author") {
      var authorNode = child.childNodes;
      var name;
      var email;
      for (
        var authorIndex = 0;
        authorIndex < authorNode.length;
        ++authorIndex
      ) {
        var authorChild = authorNode[authorIndex];
        if (authorChild.nodeType === 1) {
          if (authorChild.localName === "name") {
            name = authorChild.textContent;
          } else if (authorChild.localName === "email") {
            email = authorChild.textContent;
          }
        }
      }
      //TODO: check if this can be dataCustodian or author of the item
      if (name === undefined && email === undefined) {
        geoRssItem.dataCustodian = child.textContent;
      } else {
        geoRssItem.dataCustodian = name + ", " + email;
      }
    }
  }
  if (
    !defined(geoRssItem.name) ||
    geoRssItem.name === geoRssItem.url ||
    geoRssItem.name === "Unnamed Item"
  ) {
    geoRssItem.name = cleanUrl(geoRssItem.url);
  }
}

function cleanUrl(url) {
  return url.substring(url.lastIndexOf("/") + 1);
}

module.exports = GeoRssCatalogItem;
