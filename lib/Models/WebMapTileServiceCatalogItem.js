"use strict";

/*global require*/
var URI = require("urijs");
var i18next = require("i18next").default;

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var GeographicTilingScheme = require("terriajs-cesium/Source/Core/GeographicTilingScheme")
  .default;
var GetFeatureInfoFormat = require("terriajs-cesium/Source/Scene/GetFeatureInfoFormat")
  .default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadXML = require("../Core/loadXML");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var WebMapTileServiceImageryProvider = require("terriajs-cesium/Source/Scene/WebMapTileServiceImageryProvider")
  .default;
var WebMercatorTilingScheme = require("terriajs-cesium/Source/Core/WebMercatorTilingScheme")
  .default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var containsAny = require("../Core/containsAny");
var Metadata = require("./Metadata");
var MetadataItem = require("./MetadataItem");
var ImageryLayerCatalogItem = require("./ImageryLayerCatalogItem");
var inherit = require("../Core/inherit");
var overrideProperty = require("../Core/overrideProperty");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var xml2json = require("../ThirdParty/xml2json");
var LegendUrl = require("../Map/LegendUrl");

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from a Web Map Tile Service (WMTS) server.
 *
 * @alias WebMapTileServiceCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var WebMapTileServiceCatalogItem = function(terria) {
  ImageryLayerCatalogItem.call(this, terria);

  this._rawMetadata = undefined;
  this._metadata = undefined;
  this._dataUrl = undefined;
  this._dataUrlType = undefined;
  this._metadataUrl = undefined;
  this._legendUrl = undefined;
  this._rectangle = undefined;
  this._rectangleFromMetadata = undefined;
  this._intervalsFromMetadata = undefined;

  /**
   * Gets or sets the WMTS layer to use.  This property is observable.
   * @type {String}
   */
  this.layer = "";

  /**
   * Gets or sets the WMTS style to use.  This property is observable.
   * @type {String}
   */
  this.style = undefined;

  /**
   * Gets or sets the WMTS Tile Matrix Set ID to use.  This property is observable.
   * @type {String}
   */
  this.tileMatrixSetID = undefined;

  /**
   * Gets or sets the labels for each level in the matrix set.  This property is observable.
   * @type {Array}
   */
  this.tileMatrixSetLabels = undefined;

  /**
   * Gets or sets the maximum level in the matrix set.  This property is observable.
   * @type {Array}
   */
  this.tileMatrixMaximumLevel = undefined;

  /**
   * Gets or sets the tiling scheme to pass to the WMTS server when requesting images.
   * If this property is undefiend, the default tiling scheme of the provider is used.
   * @type {Object}
   */
  this.tilingScheme = undefined;

  /**
   * Gets or sets the formats in which to try WMTS GetFeatureInfo requests.  If this property is undefined, the `WebMapServiceImageryProvider` defaults
   * are used.  This property is observable.
   * @type {GetFeatureInfoFormat[]}
   */
  this.getFeatureInfoFormats = undefined;

  /**
   * Gets or sets a value indicating whether a time dimension, if it exists in GetCapabilities, should be used to populate
   * the {@link ImageryLayerCatalogItem#intervals}.  If the {@link ImageryLayerCatalogItem#intervals} property is set explicitly
   * on this catalog item, the value of this property is ignored.
   * @type {Boolean}
   * @default true
   */
  this.populateIntervalsFromTimeDimension = true;

  /**
   * Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing
   * a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property,
   * will be used and will simply get blurier as the user zooms in closer.
   * @type {Number}
   */
  this.minScaleDenominator = undefined;

  /**
   * Gets or sets the format in which to request tile images.  If not specified, 'image/png' is used.  This property is observable.
   * @type {String}
   */
  this.format = undefined;

  knockout.track(this, [
    "_dataUrl",
    "_dataUrlType",
    "_metadataUrl",
    "_legendUrl",
    "_rectangle",
    "_rectangleFromMetadata",
    "_intervalsFromMetadata",
    "layer",
    "style",
    "tileMatrixSetID",
    "tileMatrixMaximumLevel",
    "getFeatureInfoFormats",
    "tilingScheme",
    "populateIntervalsFromTimeDimension",
    "minScaleDenominator",
    "format"
  ]);

  // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
  overrideProperty(this, "metadataUrl", {
    get: function() {
      if (defined(this._metadataUrl)) {
        return this._metadataUrl;
      }

      return (
        cleanUrl(this.url) +
        "?service=WMTS&request=GetCapabilities&version=1.0.0"
      );
    },
    set: function(value) {
      this._metadataUrl = value;
    }
  });

  // The dataUrl must be explicitly specified.  Don't try to use `url` as the the dataUrl, because it won't work for a WMTS URL.
  overrideProperty(this, "dataUrl", {
    get: function() {
      return this._dataUrl;
    },
    set: function(value) {
      this._dataUrl = value;
    }
  });

  overrideProperty(this, "dataUrlType", {
    get: function() {
      if (defined(this._dataUrlType)) {
        return this._dataUrlType;
      } else {
        return "none";
      }
    },
    set: function(value) {
      this._dataUrlType = value;
    }
  });
};

inherit(ImageryLayerCatalogItem, WebMapTileServiceCatalogItem);

Object.defineProperties(WebMapTileServiceCatalogItem.prototype, {
  /**
   * Gets the type of data item represented by this instance.
   * @memberOf WebMapTileServiceCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "wmts";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'Web Map Tile Service (WMTS)'.
   * @memberOf WebMapTileServiceCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.webMapTileServiceCatalogItem.wmts");
    }
  },

  /**
   * Gets a value indicating whether this {@link ImageryLayerCatalogItem} supports the {@link ImageryLayerCatalogItem#intervals}
   * property for configuring time-dynamic imagery.
   * @type {Boolean}
   */
  supportsIntervals: {
    get: function() {
      return true;
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf WebMapTileServiceCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      if (!defined(this._metadata)) {
        this._metadata = requestMetadata(this);
      }
      return this._metadata;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf WebMapTileServiceCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return WebMapTileServiceCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf WebMapTileServiceCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return WebMapTileServiceCatalogItem.defaultSerializers;
    }
  }
});

WebMapTileServiceCatalogItem.defaultUpdaters = clone(
  ImageryLayerCatalogItem.defaultUpdaters
);

WebMapTileServiceCatalogItem.defaultUpdaters.tilingScheme = function(
  wmtsItem,
  json,
  propertyName,
  options
) {
  if (json.tilingScheme === "geographic") {
    wmtsItem.tilingScheme = new GeographicTilingScheme();
  } else if (json.tilingScheme === "web-mercator") {
    wmtsItem.tilingScheme = new WebMercatorTilingScheme();
  } else {
    wmtsItem.tilingScheme = json.tilingScheme;
  }
};

WebMapTileServiceCatalogItem.defaultUpdaters.getFeatureInfoFormats = function(
  wmtsItem,
  json,
  propertyName,
  options
) {
  var formats = [];

  for (var i = 0; i < json.getFeatureInfoFormats.length; ++i) {
    var format = json.getFeatureInfoFormats[i];
    formats.push(new GetFeatureInfoFormat(format.type, format.format));
  }

  wmtsItem.getFeatureInfoFormats = formats;
};

Object.freeze(WebMapTileServiceCatalogItem.defaultUpdaters);

WebMapTileServiceCatalogItem.defaultSerializers = clone(
  ImageryLayerCatalogItem.defaultSerializers
);

// Serialize the underlying properties instead of the public views of them.
WebMapTileServiceCatalogItem.defaultSerializers.dataUrl = function(
  wmtsItem,
  json,
  propertyName
) {
  json.dataUrl = wmtsItem._dataUrl;
};
WebMapTileServiceCatalogItem.defaultSerializers.dataUrlType = function(
  wmtsItem,
  json,
  propertyName
) {
  json.dataUrlType = wmtsItem._dataUrlType;
};
WebMapTileServiceCatalogItem.defaultSerializers.metadataUrl = function(
  wmtsItem,
  json,
  propertyName
) {
  json.metadataUrl = wmtsItem._metadataUrl;
};
WebMapTileServiceCatalogItem.defaultSerializers.legendUrl = function(
  wmtsItem,
  json,
  propertyName
) {
  json.legendUrl = wmtsItem._legendUrl;
};
WebMapTileServiceCatalogItem.defaultSerializers.tilingScheme = function(
  wmtsItem,
  json,
  propertyName
) {
  if (wmtsItem.tilingScheme instanceof GeographicTilingScheme) {
    json.tilingScheme = "geographic";
  } else if (wmtsItem.tilingScheme instanceof WebMercatorTilingScheme) {
    json.tilingScheme = "web-mercator";
  } else {
    json.tilingScheme = wmtsItem.tilingScheme;
  }
};
Object.freeze(WebMapTileServiceCatalogItem.defaultSerializers);

/**
 * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
 * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
 * Geoserver's "A compliant implementation of WMTS..." stock abstract.
 * @type {Array}
 */
WebMapTileServiceCatalogItem.abstractsToIgnore = [
  "A compliant implementation of WMTS"
];

/**
 * Updates this catalog item from a WMTS GetCapabilities document.
 * @param {Object|XMLDocument} capabilities The capabilities document.  This may be a JSON object or an XML document.  If it
 *                             is a JSON object, each layer is expected to have a `_parent` property with a reference to its
 *                             parent layer.
 * @param {Boolean} [overwrite=false] True to overwrite existing property values with data from the capabilities; false to
 *                  preserve any existing values.
 * @param {Object} [thisLayer] A reference to this layer within the JSON capabilities object.  If this parameter is not
 *                 specified or if `capabilities` is an XML document, the layer is found automatically based on this
 *                 catalog item's `layers` property.
 */
WebMapTileServiceCatalogItem.prototype.updateFromCapabilities = function(
  capabilities,
  overwrite,
  thisLayer
) {
  if (defined(capabilities.documentElement)) {
    capabilities = WebMapTileServiceCatalogItem.capabilitiesXmlToJson(
      capabilities
    );
    thisLayer = undefined;
  }

  if (!defined(thisLayer)) {
    thisLayer = findLayer(capabilities, this.layer);
    if (!defined(thisLayer)) {
      return;
    }
  }

  this._rawMetadata = capabilities;

  if (
    !containsAny(
      thisLayer.Abstract,
      WebMapTileServiceCatalogItem.abstractsToIgnore
    )
  ) {
    updateInfoSection(
      this,
      overwrite,
      i18next.t("models.webMapTileServiceCatalogItem.dataDescription"),
      thisLayer.Abstract
    );
  }

  var service = defined(capabilities.Service) ? capabilities.Service : {};

  // Show the service abstract if there is one, and if it isn't the Geoserver default "A compliant implementation..."
  if (
    !containsAny(
      service.Abstract,
      WebMapTileServiceCatalogItem.abstractsToIgnore
    ) &&
    service.Abstract !== thisLayer.Abstract
  ) {
    updateInfoSection(
      this,
      overwrite,
      i18next.t("models.webMapTileServiceCatalogItem.serviceDescription"),
      service.Abstract
    );
  }

  // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
  if (
    defined(service.AccessConstraints) &&
    !/^none$/i.test(service.AccessConstraints)
  ) {
    updateInfoSection(
      this,
      overwrite,
      i18next.t("models.webMapTileServiceCatalogItem.accessConstraints"),
      service.AccessConstraints
    );
  }

  updateValue(this, overwrite, "dataCustodian", getDataCustodian(capabilities));
  updateValue(
    this,
    overwrite,
    "minScaleDenominator",
    thisLayer.MinScaleDenominator
  );
  updateValue(
    this,
    overwrite,
    "getFeatureInfoFormats",
    getFeatureInfoFormats(thisLayer)
  );
  updateValue(this, overwrite, "rectangle", getRectangleFromLayer(thisLayer));

  // Find a suitable image format.  Prefer PNG but fall back on JPEG is necessary
  var formats = thisLayer.Format;
  if (defined(formats)) {
    if (!Array.isArray(formats)) {
      formats = [formats];
    }

    var format;
    if (formats.indexOf("image/png") >= 0) {
      format = "image/png";
    } else if (
      formats.indexOf("image/jpeg") >= 0 ||
      formats.indexOf("images/jpg") >= 0
    ) {
      format = "image/jpeg";
    }

    updateValue(this, overwrite, "format", format);
  }

  // Find a suitable tile matrix set.
  var tileMatrixSetID = "urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible";
  var tileMatrixSetLabels;

  var tileMatrixSetLinks = thisLayer.TileMatrixSetLink;
  if (!Array.isArray(tileMatrixSetLinks)) {
    tileMatrixSetLinks = [tileMatrixSetLinks];
  }

  var i;
  for (i = 0; i < tileMatrixSetLinks.length; ++i) {
    var link = tileMatrixSetLinks[i];
    var set = link.TileMatrixSet;
    if (capabilities.usableTileMatrixSets[set]) {
      tileMatrixSetID = set;
      tileMatrixSetLabels = capabilities.usableTileMatrixSets[set];
      break;
    }
  }

  if (Array.isArray(tileMatrixSetLabels)) {
    var maxLevel = tileMatrixSetLabels
      .map(label => Math.abs(Number(label)))
      .reduce((currentMaximum, level) => {
        return level > currentMaximum ? level : currentMaximum;
      }, 0);
  }

  updateValue(this, overwrite, "tileMatrixSetID", tileMatrixSetID);
  updateValue(this, overwrite, "tileMatrixSetLabels", tileMatrixSetLabels);
  updateValue(this, overwrite, "tileMatrixMaximumLevel", maxLevel);

  // Find the default style.
  var styles = thisLayer.Style;
  if (defined(styles)) {
    if (!Array.isArray(styles)) {
      styles = [styles];
    }

    var defaultStyle;

    for (i = 0; i < styles.length; ++i) {
      var style = styles[i];
      if (style.isDefault) {
        defaultStyle = style.Identifier;

        var legendData = style.legendURL;
        if (defined(legendData)) {
          // WMTS can specify multiple legends, where different legends are applicable to different zooms.
          // Since TerriaJS only supports showing a single legend currently, show the first one.
          if (Array.isArray(legendData)) {
            legendData = legendData[0];
          }

          this.legendUrl = new LegendUrl(legendData.href, legendData.format);
        }
        break;
      }
    }

    if (!defined(defaultStyle)) {
      defaultStyle = "";
    }

    updateValue(this, overwrite, "style", defaultStyle);
  }
};

WebMapTileServiceCatalogItem.prototype._load = function() {
  if (!defined(this._rawMetadata)) {
    var that = this;
    return loadXML(proxyCatalogItemUrl(this, this.metadataUrl)).then(function(
      xml
    ) {
      that._rawMetadata = WebMapTileServiceCatalogItem.capabilitiesXmlToJson(
        xml
      );
      that.updateFromCapabilities(that._rawMetadata, false);
      return that._rawMetadata;
    });
  }
};

WebMapTileServiceCatalogItem.prototype._createImageryProvider = function() {
  return new WebMapTileServiceImageryProvider({
    url: cleanAndProxyUrl(this, this.url),
    layer: this.layer,
    tileMatrixSetID: this.tileMatrixSetID,
    tileMatrixLabels: this.tileMatrixSetLabels,
    maximumLevel: this.tileMatrixMaximumLevel,
    style: this.style,
    getFeatureInfoFormats: this.getFeatureInfoFormats,
    tilingScheme: defined(this.tilingScheme)
      ? this.tilingScheme
      : new WebMercatorTilingScheme(),
    format: defaultValue(this.format, "image/png")
  });
};

WebMapTileServiceCatalogItem.capabilitiesXmlToJson = function(xml) {
  var json = xml2json(xml);

  json.usableTileMatrixSets = {
    "urn:ogc:def:wkss:OGC:1.0:GoogleMapsCompatible": true
  };

  var standardTilingScheme = new WebMercatorTilingScheme();

  var matrixSets = json.Contents.TileMatrixSet;
  for (var i = 0; i < matrixSets.length; ++i) {
    var matrixSet = matrixSets[i];

    // Usable tile matrix sets must use the Web Mercator projection.
    if (
      matrixSet.SupportedCRS !== "urn:ogc:def:crs:EPSG::900913" &&
      matrixSet.SupportedCRS !== "urn:ogc:def:crs:EPSG:6.18:3:3857"
    ) {
      continue;
    }

    // Usable tile matrix sets must have a single 256x256 tile at the root.
    var matrices = matrixSet.TileMatrix;
    if (!defined(matrices) || matrices.length < 1) {
      continue;
    }

    var levelZeroMatrix = matrices[0];
    if (
      (levelZeroMatrix.TileWidth | 0) !== 256 ||
      (levelZeroMatrix.TileHeight | 0) !== 256 ||
      (levelZeroMatrix.MatrixWidth | 0) !== 1 ||
      (levelZeroMatrix.MatrixHeight | 0) !== 1
    ) {
      continue;
    }

    var levelZeroScaleDenominator = 559082264.0287178; // from WMTS 1.0.0 spec section E.4.
    if (
      Math.abs(levelZeroMatrix.ScaleDenominator - levelZeroScaleDenominator) > 1
    ) {
      continue;
    }

    if (!defined(levelZeroMatrix.TopLeftCorner)) {
      continue;
    }

    var levelZeroTopLeftCorner = levelZeroMatrix.TopLeftCorner.split(" ");
    var startX = levelZeroTopLeftCorner[0];
    var startY = levelZeroTopLeftCorner[1];

    if (
      Math.abs(startX - standardTilingScheme._rectangleSouthwestInMeters.x) > 1
    ) {
      continue;
    }

    if (
      Math.abs(startY - standardTilingScheme._rectangleNortheastInMeters.y) > 1
    ) {
      continue;
    }

    json.usableTileMatrixSets[matrixSet.Identifier] = true;

    if (defined(matrixSet.TileMatrix) && matrixSet.TileMatrix.length > 0) {
      json.usableTileMatrixSets[
        matrixSet.Identifier
      ] = matrixSet.TileMatrix.map(function(item) {
        return item.Identifier;
      });
    }
  }

  return json;
};

function cleanAndProxyUrl(catalogItem, url) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function getRectangleFromLayer(layer) {
  // Unfortunately, WMTS 1.0 doesn't require WGS84BoundingBox (or any bounding box) to be specified.
  var bbox = layer.WGS84BoundingBox;
  if (!defined(bbox)) {
    return undefined;
  }

  var ll = bbox.LowerCorner;
  var ur = bbox.UpperCorner;

  if (!defined(ll) || !defined(ur)) {
    return undefined;
  }

  var llParts = ll.split(" ");
  var urParts = ur.split(" ");
  if (llParts.length !== 2 || urParts.length !== 2) {
    return undefined;
  }

  return Rectangle.fromDegrees(llParts[0], llParts[1], urParts[0], urParts[1]);
}

function getFeatureInfoFormats(layer) {
  var supportsJsonGetFeatureInfo = false;
  var supportsXmlGetFeatureInfo = false;
  var supportsHtmlGetFeatureInfo = false;
  var xmlContentType = "text/xml";

  var format = layer.InfoFormat;

  if (defined(format)) {
    if (format === "application/json") {
      supportsJsonGetFeatureInfo = true;
    } else if (
      defined(format.indexOf) &&
      format.indexOf("application/json") >= 0
    ) {
      supportsJsonGetFeatureInfo = true;
    }

    if (format === "text/xml" || format === "application/vnd.ogc.gml") {
      supportsXmlGetFeatureInfo = true;
      xmlContentType = format;
    } else if (defined(format.indexOf) && format.indexOf("text/xml") >= 0) {
      supportsXmlGetFeatureInfo = true;
      xmlContentType = "text/xml";
    } else if (
      defined(format.indexOf) &&
      format.indexOf("application/vnd.ogc.gml") >= 0
    ) {
      supportsXmlGetFeatureInfo = true;
      xmlContentType = "application/vnd.ogc.gml";
    } else if (defined(format.indexOf) && format.indexOf("text/html") >= 0) {
      supportsHtmlGetFeatureInfo = true;
    }
  }

  var result = [];

  if (supportsJsonGetFeatureInfo) {
    result.push(new GetFeatureInfoFormat("json"));
  }
  if (supportsXmlGetFeatureInfo) {
    result.push(new GetFeatureInfoFormat("xml", xmlContentType));
  }
  if (supportsHtmlGetFeatureInfo) {
    result.push(new GetFeatureInfoFormat("html"));
  }

  return result;
}

function requestMetadata(wmtsItem) {
  var result = new Metadata();

  result.isLoading = true;

  var metadata =
    wmtsItem._rawMetadata ||
    loadXML(proxyCatalogItemUrl(wmtsItem, wmtsItem.metadataUrl)).then(
      WebMapTileServiceCatalogItem.capabilitiesXmlToJson
    );

  result.promise = when(metadata, function(json) {
    if (json.ServiceIdentification || json.ServiceProvider) {
      populateMetadataGroup(result.serviceMetadata, {
        Identification: json.ServiceIdentification,
        Provider: json.ServiceProvider
      });
    } else {
      result.serviceErrorMessage =
        "Service information not found in GetCapabilities operation response.";
    }

    var layer = findLayer(json, wmtsItem.layer);
    if (layer) {
      populateMetadataGroup(result.dataSourceMetadata, layer);
    } else {
      result.dataSourceErrorMessage =
        "Layer information not found in GetCapabilities operation response.";
    }

    wmtsItem.updateFromCapabilities(json, false, layer);

    result.isLoading = false;
  }).otherwise(function() {
    result.dataSourceErrorMessage =
      "An error occurred while invoking the GetCapabilities service.";
    result.serviceErrorMessage =
      "An error occurred while invoking the GetCapabilities service.";
    result.isLoading = false;
  });

  return result;
}

function findLayer(json, name) {
  if (!defined(json.Contents) || !defined(json.Contents.Layer)) {
    return undefined;
  }

  var layers = json.Contents.Layer;
  for (var i = 0; i < layers.length; ++i) {
    var layer = layers[i];
    if (layer.Identifier === name || layer.Title === name) {
      return layer;
    }
  }

  return undefined;
}

function populateMetadataGroup(metadataGroup, sourceMetadata) {
  if (
    typeof sourceMetadata === "string" ||
    sourceMetadata instanceof String ||
    sourceMetadata instanceof Array
  ) {
    return;
  }

  for (var name in sourceMetadata) {
    if (sourceMetadata.hasOwnProperty(name) && name !== "_parent") {
      var value = sourceMetadata[name];

      var dest;
      if (name === "BoundingBox" && value instanceof Array) {
        for (var i = 0; i < value.length; ++i) {
          var subValue = value[i];

          dest = new MetadataItem();
          dest.name = name + " (" + subValue.CRS + ")";
          dest.value = subValue;

          populateMetadataGroup(dest, subValue);

          metadataGroup.items.push(dest);
        }
      } else {
        dest = new MetadataItem();
        dest.name = name;
        dest.value = value;

        populateMetadataGroup(dest, value);

        metadataGroup.items.push(dest);
      }
    }
  }
}

function updateInfoSection(item, overwrite, sectionName, sectionValue) {
  if (!defined(sectionValue) || sectionValue.length === 0) {
    return;
  }

  var section = item.findInfoSection(sectionName);
  if (!defined(section)) {
    item.info.push({
      name: sectionName,
      content: sectionValue
    });
  } else if (overwrite) {
    section.content = sectionValue;
  }
}

function updateValue(item, overwrite, propertyName, propertyValue) {
  if (!defined(propertyValue)) {
    return;
  }

  if (overwrite || !defined(item[propertyName])) {
    item[propertyName] = propertyValue;
  }
}

function getDataCustodian(json) {
  if (
    defined(json.ServiceProvider) &&
    defined(json.ServiceProvider.ProviderName)
  ) {
    var name = json.ServiceProvider.ProviderName;
    var web;
    var email;

    if (
      defined(json.ServiceProvider.ProviderSite) &&
      defined(json.ServiceProvider.ProviderSite["xlink:href"])
    ) {
      web = json.ServiceProvider.ProviderSite.href;
    }

    if (
      defined(json.ServiceProvider.ServiceContact) &&
      defined(json.ServiceProvider.ServiceContact.Address) &&
      defined(json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress)
    ) {
      email = json.ServiceProvider.ServiceContact.Address.ElectronicMailAddress;
    }

    var text = defined(web) ? "[" + name + "](" + web + ")" : name;
    if (defined(email)) {
      text += "<br/>";
      text += "[" + email + "](mailto:" + email + ")";
    }

    return text;
  } else {
    return undefined;
  }
}

module.exports = WebMapTileServiceCatalogItem;
