"use strict";

/*global require*/
var URI = require("urijs");

var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var Color = require("terriajs-cesium/Source/Core/Color");
const HeightReference = require("terriajs-cesium/Source/Scene/HeightReference");
const Cartesian2 = require("terriajs-cesium/Source/Core/Cartesian2");
var loadJson = require("../Core/loadJson");

var CatalogItem = require("./CatalogItem");
var featureDataToGeoJson = require("../Map/featureDataToGeoJson");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");

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

      return that._geoJsonItem.load().then(function() {
        that.rectangle = that._geoJsonItem.rectangle;

        const entities = that.dataSource.entities;
        entities.suspendEvents();

        // A 'simple' renderer only applies a single style to all features
        if (that._metadata.drawingInfo.renderer.type === "simple") {
          entities.values.forEach(function(entity) {
            updateEntityWithEsriStyle(entity, renderer.symbol, that);
          });

          // For a 'uniqueValue' renderer symbology gets applied via feature properties.
        } else if (renderer.type === "uniqueValue") {
          const rendererObj = setupUniqueValRenderer(renderer);

          const primaryFieldForSymbology = renderer.field1;

          entities.values.forEach(function(entity) {
            let symbolName = entity.properties[
              primaryFieldForSymbology
            ].getValue();

            // accumulate values if there is more than one field defined
            if (renderer.fieldDelimiter && renderer.field2) {
              var val2 = entity.properties[renderer.field2].getValue();
              if (val2) {
                symbolName += renderer.fieldDelimiter + val2;
                var val3 = entity.properties[renderer.field3].getValue();
                if (val3) {
                  symbolName += renderer.fieldDelimiter + val3;
                }
              }
            }

            let rendererStyle = rendererObj[symbolName];
            if (rendererStyle === null) {
              rendererStyle = that._metadata.drawingInfo.renderer.defaultSymbol;
            }

            updateEntityWithEsriStyle(entity, rendererStyle.symbol, that);
          });
          // Because we're adding the styles after we've loaded the geojson we need to reload the CatalogItem
          // that._geoJsonItem.load();
        }
        entities.resumeEvents();
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

function updateEntityWithEsriStyle(entity, symbol, catalogItem) {
  function convertEsriColorToCesiumColor(esriColor) {
    return new Color.fromBytes(
      esriColor[0],
      esriColor[1],
      esriColor[2],
      esriColor[3]
    );
  }

  // We're going to replace a general Cesium Point with a billboard
  if (defined(entity.point) && defined(symbol.imageData)) {
    entity.billboard = {
      image: proxyCatalogItemUrl(
        catalogItem,
        `data:${symbol.contentType};base64,${symbol.imageData}`
      ),
      heightReference: HeightReference.RELATIVE_TO_GROUND,
      width: symbol.width,
      height: symbol.height,
      rotation: symbol.angle
    };

    if (defined(symbol.xoffset) || defined(symbol.yoffset)) {
      const x = defined(symbol.xoffset) ? symbol.xoffset : 0;
      const y = defined(symbol.yoffset) ? symbol.yoffset : 0;
      entity.billboard.pixelOffset = new Cartesian2(x, y);
    }
    entity.point = undefined;
  }

  // We're going to update the styling of the Cesium Polyline
  if (defined(entity.polyline)) {
    entity.polyline.material = convertEsriColorToCesiumColor(symbol.color);
    entity.polyline.width = symbol.width;
  }

  // We're going to update the styling of the Cesium Point
  if (defined(entity.point)) {
    entity.point.color = convertEsriColorToCesiumColor(symbol.color);
    entity.point.pixelSize = symbol.size;
    if (defined(symbol.outline)) {
      entity.point.outlineColor = convertEsriColorToCesiumColor(
        symbol.outline.color
      );
      entity.point.outlineWidth = symbol.outline.width;
    }
  }

  // We're going to update the styling of the Cesium Polygon
  if (defined(entity.polygon)) {
    entity.polygon.material = convertEsriColorToCesiumColor(symbol.color);
    if (defined(symbol.outline)) {
      entity.polygon.outlineColor = convertEsriColorToCesiumColor(
        symbol.outline.color
      );
      entity.polygon.outlineWidth = symbol.outline.width;
    }
  }
}

function loadGeoJson(item) {
  return loadJson(buildGeoJsonUrl(item)).then(function(json) {
    // console.log('Converting first element of', json.layers);
    return featureDataToGeoJson(json.layers[0]);
  });
}

function loadMetadata(item) {
  const metaUrl = buildMetdataUrl(item);
  return loadJson(metaUrl).then(function(json) {
    return json;
  });
}

function buildMetdataUrl(catalogItem) {
  return proxyCatalogItemUrl(
    catalogItem,
    new URI(catalogItem.url).addQuery("f", "json").toString()
  );
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
