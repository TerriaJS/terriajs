"use strict";

/*global require*/

var defined = require("terriajs-cesium/Source/Core/defined");
var defineProperties = require("terriajs-cesium/Source/Core/defineProperties");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout");
var loadWithXhr = require("../Core/loadWithXhr");
var Uri = require("terriajs-cesium/Source/ThirdParty/Uri");
var when = require("terriajs-cesium/Source/ThirdParty/when");

var CatalogItem = require("./CatalogItem");
var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var Metadata = require("./Metadata");
var TerriaError = require("../Core/TerriaError");

/**
 * A {@link CatalogItem} representing ogr2ogr supported data formats.
 *
 * @alias OgrCatalogItem
 * @constructor
 * @extends GeoJsonCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the OGR data.
 */
var OgrCatalogItem = function(terria, url) {
  CatalogItem.call(this, terria);

  this._geoJsonItem = undefined;

  this.url = url;

  /**
   * Gets or sets the Ogr data, represented as a binary Blob, DOM Document, or a Promise for one of those things.
   * If this property is set, {@link CatalogItem#url} is ignored.
   * This property is observable.
   * @type {Blob|Document|Promise}
   */
  this.data = undefined;

  /**
   * Gets or sets the URL from which the {@link OgrCatalogItem#data} was obtained.  This may be used
   * to resolve any resources linked in the Ogr file, if any.
   * @type {String}
   */
  this.dataSourceUrl = undefined;

  knockout.track(this, ["data", "dataSourceUrl"]);
};

inherit(CatalogItem, OgrCatalogItem);

defineProperties(OgrCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf OgrCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "ogr";
    }
  },

  /**
   * Gets a human-readable name for this type of data source.
   * @memberOf OgrCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "Unknown / Converted to GeoJSON";
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf OgrCatalogItem.prototype
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
   * Gets the data source associated with this catalog item.
   * @memberOf OgrCatalogItem.prototype
   * @type {DataSource}
   */
  dataSource: {
    get: function() {
      return defined(this._geoJsonItem)
        ? this._geoJsonItem.dataSource
        : undefined;
    }
  },
  /**
   * Returns true if we can zoom to this item. Depends on observable properties, and so updates once loaded.
   * @memberOf DataSourceCatalogItem.prototype
   * @type {Boolean}
   */
  canZoomTo: {
    get: function() {
      return defined(this._geoJsonItem) ? this._geoJsonItem.canZoomTo : false;
    }
  }
});

OgrCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  return [this.url, this.data];
};

OgrCatalogItem.prototype._load = function() {
  if (typeof FormData === "undefined") {
    throw new TerriaError({
      sender: this,
      title: "Legacy browser not supported",
      message:
        '\
Your web browser does not support the "FormData" type, which is required by the ' +
        this.terria.appName +
        ' conversion service.  \
We recommend you upgrade to the latest version of <a href="http://www.google.com/chrome" target="_blank">Google Chrome</a>, \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>, \
<a href="https://www.apple.com/au/osx/how-to-upgrade/" target="_blank">Apple Safari</a>, or \
<a href="http://www.microsoft.com/ie" target="_blank">Microsoft Internet Explorer</a>.'
    });
  }
  if (this.terria.configParameters.conversionServiceBaseUrl === false) {
    // Don't allow conversion service. Duplicated in createCatalogItemFromFileOrUrl.js
    throw new TerriaError({
      title: "Unsupported file type",
      message:
        "This file format is not supported by " +
        this.terria.appName +
        ". Supported file formats include: " +
        '<ul><li>.geojson</li><li>.kml, .kmz</li><li>.csv (in <a href="https://github.com/TerriaJS/nationalmap/wiki/csv-geo-au">csv-geo-au format</a>)</li></ul>'
    });
  }

  this._geoJsonItem = new GeoJsonCatalogItem(this.terria);

  var that = this;

  if (defined(that.data)) {
    return when(that.data, function(data) {
      if (!(data instanceof Blob)) {
        //create a file blob
        data = new Blob([data], {
          type: "application/octet-stream",
          name: that.dataSourceUrl,
          lastModifiedDate: new Date()
        });
      }
      return loadOgrData(that, data);
    });
  } else {
    return loadOgrData(that, undefined, that.url);
  }
};

OgrCatalogItem.prototype._enable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._enable();
  }
};

OgrCatalogItem.prototype._disable = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._disable();
  }
};

OgrCatalogItem.prototype._show = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._show();
  }
};

OgrCatalogItem.prototype._hide = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem._hide();
  }
};

OgrCatalogItem.prototype.showOnSeparateMap = function(globeOrMap) {
  if (defined(this._geoJsonItem)) {
    return this._geoJsonItem.showOnSeparateMap(globeOrMap);
  }
};

OgrCatalogItem.prototype.zoomTo = function() {
  if (defined(this._geoJsonItem)) {
    this._geoJsonItem.zoomTo();
  }
};

function loadOgrData(ogrItem, file, url) {
  var terria = ogrItem.terria;
  // generate form to submit file for conversion
  var formData = new FormData();
  if (defined(file)) {
    var maxConversionSize = 1000000;
    if (
      defined(terria.serverConfig) &&
      defined(terria.serverConfig.config) &&
      defined(terria.serverConfig.config.maxConversionSize)
    ) {
      maxConversionSize = terria.serverConfig.config.maxConversionSize;
    }
    if (file.size > maxConversionSize) {
      var maxConversionSizeMB = maxConversionSize / 1000000;
      errorLoading(
        ogrItem,
        "The file size is greater than the " +
          maxConversionSizeMB +
          "MB limit of the " +
          terria.appName +
          " conversion service."
      );
      return;
    }
    formData.append("input_file", file);
  } else if (defined(url)) {
    url = new Uri(url).resolve(new Uri(document.location.href)).toString();
    formData.append("input_url", url);
  }

  console.log(
    "Attempting to convert file via the Terria-Server ogr2ogr web service"
  );

  return loadWithXhr({
    url: ogrItem.terria.configParameters.conversionServiceBaseUrl,
    method: "POST",
    data: formData
  })
    .then(function(response) {
      ogrItem._geoJsonItem.data = JSON.parse(response);

      return ogrItem._geoJsonItem.load().then(function() {
        ogrItem.clock = ogrItem._geoJsonItem.clock;
      });
    })
    .otherwise(function() {
      errorLoading(ogrItem);
    });
}

function errorLoading(ogrItem, msg) {
  var terria = ogrItem.terria;
  if (!defined(msg)) {
    msg =
      "This may indicate that the file is invalid or that it is not supported by the " +
      terria.appName +
      " conversion service.";
  }
  throw new TerriaError({
    sender: ogrItem,
    title: "Error converting file to GeoJson",
    message:
      "\
An error occurred while attempting to convert this file to GeoJson.  " +
      msg +
      '  If you would like assistance or further information, please email us \
at <a href="mailto:' +
      terria.supportEmail +
      '">' +
      terria.supportEmail +
      "</a>."
  });
}

module.exports = OgrCatalogItem;
