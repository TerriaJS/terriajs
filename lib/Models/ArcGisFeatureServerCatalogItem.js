"use strict";

/*global require*/
var URI = require("urijs");

var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var loadJson = require("../Core/loadJson");

var CatalogItem = require("./CatalogItem");
var featureDataToGeoJson = require("../Map/featureDataToGeoJson");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");

import rgbToHex from "../Core/rgbToHex";

/**
 * A {@link CatalogItem} representing a layer from an Esri ArcGIS FeatureServer.
 *
 * @alias ArcGisFeatureServerCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisFeatureServerCatalogItem = function(terria) {
  CatalogItem.call(this, terria);

  this._geoJsonItem = undefined;

  /**
   * Gets or sets the 'layerDef' string to pass to the server when requesting geometry.
   * By default, we use a string that always evaluates to true: "1=1".
   * @type {String}
   */
  this.layerDef = "1=1";

  /**
   * If set to true attempts to symbolise the data using the drawingInfo
   * object available in the service endpoint. Defaults to false.
   * Currently supports getting fill-color, fill-opacity, stroke-color, stroke-width
   * from simple and uniqueVals renderers.
   * @type {Boolean}
   */
  this.inheritStyleInformation = false;
};

inherit(CatalogItem, ArcGisFeatureServerCatalogItem);

defineProperties(ArcGisFeatureServerCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf ArcGisFeatureServerCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "esri-featureServer";
    }
  },

  /**
   * Gets a human-readable name for this type of data source.
   * @memberOf ArcGisFeatureServerCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "ArcGIS Feature Server";
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf ArcGisFeatureServerCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return ArcGisFeatureServerCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object lieral,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf ArcGisFeatureServerCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return ArcGisFeatureServerCatalogItem.defaultSerializers;
    }
  },
  /**
   * Gets the data source associated with this catalog item.
   * @memberOf ArcGisFeatureServerCatalogItem.prototype
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

ArcGisFeatureServerCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.layerDef];
};

ArcGisFeatureServerCatalogItem.prototype._load = function() {
  var that = this;
  this._geoJsonItem = new GeoJsonCatalogItem(this.terria);
  that._geoJsonItem.data = loadGeoJson(that);

  if (this.inheritStyleInformation) {
    return loadMetadata(this).then(function(val) {
      that._metadata = val;

      const renderer = that._metadata.drawingInfo.renderer;

      if (!defined(that._geoJsonItem.style)) that._geoJsonItem.style = {};

      // A 'simple' renderer only applies a single style to all features
      if (that._metadata.drawingInfo.renderer.type === "simple") {
        const style = convertEsriRendererToStyle(renderer.symbol);
        const geojsonStyle = that._geoJsonItem.style;
        Object.assign(geojsonStyle, style);
      }

      return that._geoJsonItem.load().then(function() {
        that.rectangle = that._geoJsonItem.rectangle;

        // For a 'uniqueValue' renderer symbology gets applied via feature properties.
        if (renderer.type === "uniqueValue") {
          const rendererObj = setupUniqueValRenderer(renderer);

          const primaryFieldForSymbology = renderer.field1;

          that._geoJsonItem.data.features.forEach(function(f) {
            let symbolName = f.properties[primaryFieldForSymbology];

            // accumulate values if there is more than one field defined
            if (renderer.fieldDelimiter && renderer.field2) {
              var val2 = f.properties[renderer.field2];
              if (val2) {
                symbolName += renderer.fieldDelimiter + val2;
                var val3 = f.properties[renderer.field3];
                if (val3) {
                  symbolName += renderer.fieldDelimiter + val3;
                }
              }
            }

            let rendererStyle = rendererObj[symbolName];
            if (rendererStyle === null)
              rendererStyle = that._metadata.drawingInfo.renderer.defaultSymbol;
            Object.assign(
              f.properties,
              convertEsriRendererToStyle(rendererStyle.symbol)
            );
          });
          // Because we're adding the styles after we've loaded the geojson we need to reload the CatalogItem
          that._geoJsonItem.load();
        }
      });
    });
  } else {
    return that._geoJsonItem.load().then(function() {
      that.rectangle = that._geoJsonItem.rectangle;
    });
  }
};

ArcGisFeatureServerCatalogItem.prototype._enable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._enable();
  }
};

ArcGisFeatureServerCatalogItem.prototype._disable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._disable();
  }
};

ArcGisFeatureServerCatalogItem.prototype._show = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._show();
  }
};

ArcGisFeatureServerCatalogItem.prototype._hide = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._hide();
  }
};

ArcGisFeatureServerCatalogItem.prototype.showOnSeparateMap = function(
  globeOrMap
) {
  if (defined(this._geoJsonItem)) {
    return this._geoJsonItem.showOnSeparateMap(globeOrMap);
  }
};

function setupUniqueValRenderer(renderer) {
  const out = {};
  for (var i = 0; i < renderer.uniqueValueInfos.length; i++) {
    const val = renderer.uniqueValueInfos[i].value;
    out[val] = renderer.uniqueValueInfos[i];
  }
  return out;
}

function convertEsriRendererToStyle(symbol) {
  const styleObj = {};

  const fill = symbol.color;

  // Most things will have a fill but possibly not points that have an icon
  if (defined(fill)) {
    styleObj.fill = rgbToHex(fill[0], fill[1], fill[2]);
    styleObj["fill-opacity"] = convertAlphaRange(fill[3]);
  }

  if (defined(symbol.outline)) {
    const stroke = symbol.outline;
    styleObj["stroke"] = rgbToHex(
      stroke.color[0],
      stroke.color[1],
      stroke.color[2]
    );
    styleObj["stroke-opacity"] = convertAlphaRange(stroke.color[3]);
    styleObj["stroke-width"] = stroke.width;
  }

  return styleObj;
}

function convertAlphaRange(value) {
  return value / 255;
}

function loadGeoJson(item) {
  return loadJson(buildGeoJsonUrl(item)).then(function(json) {
    // console.log('Converting first element of', json.layers);
    return featureDataToGeoJson(json.layers[0]);
  });
}

function loadMetadata(item) {
  const metaUrl = buildMetdataUrl(item.url);
  return loadJson(metaUrl).then(function(json) {
    return json;
  });
}

function buildMetdataUrl(url) {
  return new URI(url).addQuery("f", "json").toString();
}

function buildGeoJsonUrl(item) {
  var url = cleanAndProxyUrl(item, item.url);
  var urlComponents = splitLayerIdFromPath(url);
  return new URI(urlComponents.urlWithoutLayerId)
    .segment("query")
    .addQuery("f", "json")
    .addQuery(
      "layerDefs",
      "{" + (urlComponents.layerId || 0) + ':"' + item.layerDef + '"}'
    )
    .toString();
}

function splitLayerIdFromPath(url) {
  var regex = /^(.*)\/(\d+)$/;
  var matches = url.match(regex);
  if (defined(matches) && matches.length > 2) {
    return {
      layerId: matches[2],
      urlWithoutLayerId: matches[1]
    };
  }
  return {
    urlWithoutLayerId: url
  };
}

function cleanAndProxyUrl(catalogItem, url) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

module.exports = ArcGisFeatureServerCatalogItem;
