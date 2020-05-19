"use strict";

/*global require*/
var ArcGisFeatureServerCatalogItem = require("terriajs/lib/Models/ArcGisFeatureServerCatalogItem");
var ArcGisMapServerCatalogItem = require("terriajs/lib/Models/ArcGisMapServerCatalogItem");
var CatalogItem = require("terriajs/lib/Models/CatalogItem");
var clone = require("terriajs-cesium/Source/Core/clone").default;
var createRegexDeserializer = require("terriajs/lib/Models/createRegexDeserializer");
var createRegexSerializer = require("terriajs/lib/Models/createRegexSerializer");
var CsvCatalogItem = require("terriajs/lib/Models/CsvCatalogItem");
var CzmlCatalogItem = require("terriajs/lib/Models/CzmlCatalogItem");
var defined = require("terriajs-cesium/Source/Core/defined").default;

var GeoJsonCatalogItem = require("terriajs/lib/Models/GeoJsonCatalogItem");
var inherit = require("terriajs/lib/Core/inherit");
var KmlCatalogItem = require("terriajs/lib/Models/KmlCatalogItem");
var loadJson = require("../Core/loadJson");
var Metadata = require("terriajs/lib/Models/Metadata");
var TerriaError = require("terriajs/lib/Core/TerriaError");
var proxyCatalogItemUrl = require("terriajs/lib/Models/proxyCatalogItemUrl");
// var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var URI = require("urijs");
var WebMapServiceCatalogGroup = require("terriajs/lib/Models/WebMapServiceCatalogGroup");
var WebMapServiceCatalogItem = require("terriajs/lib/Models/WebMapServiceCatalogItem");
var WebFeatureServiceCatalogGroup = require("terriajs/lib/Models/WebFeatureServiceCatalogGroup");
var WebFeatureServiceCatalogItem = require("terriajs/lib/Models/WebFeatureServiceCatalogItem");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var i18next = require("i18next").default;

/**
 * A {@link CatalogItem} that queries a MAGDA server for a dataset or distribution, and then accesses
 * that the as WMS, GeoJSON, etc. depending on what it finds.
 *
 * @alias MagdaCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function MagdaCatalogItem(terria) {
  CatalogItem.call(this, terria);

  /**
   * Gets or sets the ID of the MAGDA distribution referred to by this catalog item.  Either this property
   * or {@see MagdaCatalogItem#datasetId} must be specified.  If {@see MagdaCatalogItem#datasetId} is
   * specified too, and this distribution is not found, _any_ supported distribution may be used instead,
   * depending on the value of {@see MagdaCatalogItem#allowAnyDistributionIfDistributionIdNotFound}.
   * @type {String}
   */
  this.distributionId = undefined;

  /**
   * Gets or sets the ID of the MAGDA dataset referred to by this catalog item.  Either this property
   * is {@see MagdaCatalogItem#distributionId} must be specified.  The first distribution of a supported type
   * in this dataset will be used.
   * @type {String}
   */
  this.datasetId = undefined;

  /**
   * Gets or sets a value indicating whether any supported distribution may be used if both {@see MagdaCatalogItem#datasetId} and
   * {@see MagdaCatalogItem#distributionId} are specified and the {@see MagdaCatalogItem#distributionId} is not found.
   * @type {Boolean}
   * @default true
   */
  this.allowAnyDistributionIfDistributionIdNotFound = true;

  /**
   * Gets or sets a value indicating whether this may be a WMS distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowWms = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is a WMS distribution.
   * @type {RegExp}
   */
  this.wmsDistributionFormat = /^wms$/i;

  /**
   * Gets or sets a value indicating whether this may be a WFS distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowWfs = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is a WFS distribution.
   * @type {RegExp}
   */
  this.wfsDistributionFormat = /^wfs$/i;

  /**
   * Gets or sets a value indicating whether this may be a KML distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowKml = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is a KML distribution.
   * @type {RegExp}
   */
  this.kmlDistributionFormat = /^km[lz]$/i;

  /**
   * Gets or sets a value indicating whether this may be a CSV distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowCsv = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is a CSV distribution.
   * @type {RegExp}
   */
  this.csvDistributionFormat = /^csv(-geo-)?/i;

  /**
   * Gets or sets a value indicating whether this may be an Esri MapServer distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowEsriMapServer = true;

  /**
   * Gets or sets a value indicating whether this may be an Esri FeatureServer distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowEsriFeatureServer = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is an Esri MapServer distribution.
   * A valid MapServer distribution must also have `MapServer` in its URL.
   * @type {RegExp}
   */
  this.esriMapServerDistributionFormat = /^esri rest$/i;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is an Esri
   * MapServer or FeatureServer distribution.  A valid FeatureServer distribution must also have `FeatureServer` in its URL.
   * @type {RegExp}
   */
  this.esriFeatureServerDistributionFormat = /^esri rest$/i;

  /**
   * Gets or sets a value indicating whether this may be a GeoJSON distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowGeoJson = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is a GeoJSON distribution.
   * @type {RegExp}
   */
  this.geoJsonDistributionFormat = /^geojson$/i;

  /**
   * Gets or sets a value indicating whether this may be a CZML distribution.
   * @type {Boolean}
   * @default true
   */
  this.allowCzml = true;

  /**
   * Gets or sets a regular expression that, when it matches a distribution's format, indicates that the distribution is a CZML distribution.
   * @type {RegExp}
   */
  this.czmlDistributionFormat = /^czml$/i;

  /**
   * Gets or sets a hash of properties that will be set on the item created from the MAGDA distribution.
   * For example, { "treat404AsError": false }
   * @type {Object}
   */
  this.itemProperties = undefined;
}

inherit(CatalogItem, MagdaCatalogItem);

Object.defineProperties(MagdaCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf MagdaCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "magda-distribution";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'MAGDA Distribution'.
   * @memberOf MagdaCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.magda.name");
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf MagdaCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage = i18next.t(
        "models.magda.dataSourceErrorMessage"
      );
      result.serviceErrorMessage = i18next.t(
        "models.magda.serviceErrorMessage"
      );
      return result;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf MagdaCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return MagdaCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf MagdaCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return MagdaCatalogItem.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
MagdaCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

MagdaCatalogItem.defaultUpdaters.wmsDistributionFormat = createRegexDeserializer(
  "wmsDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.wfsDistributionFormat = createRegexDeserializer(
  "wfsDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.kmlDistributionFormat = createRegexDeserializer(
  "kmlDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.csvDistributionFormat = createRegexDeserializer(
  "csvDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.esriMapServerDistributionFormat = createRegexDeserializer(
  "esriMapServerDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.esriFeatureServerDistributionFormat = createRegexDeserializer(
  "esriFeatureServerDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.geoJsonDistributionFormat = createRegexDeserializer(
  "geoJsonDistributionFormat"
);
MagdaCatalogItem.defaultUpdaters.czmlDistributionFormat = createRegexDeserializer(
  "czmlDistributionFormat"
);

Object.freeze(MagdaCatalogItem.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
MagdaCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

MagdaCatalogItem.defaultSerializers.wmsDistributionFormat = createRegexSerializer(
  "wmsDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.wfsDistributionFormat = createRegexSerializer(
  "wfsDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.kmlDistributionFormat = createRegexSerializer(
  "kmlDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.csvDistributionFormat = createRegexSerializer(
  "csvDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.esriMapServerDistributionFormat = createRegexSerializer(
  "esriMapServerDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.esriFeatureServerDistributionFormat = createRegexSerializer(
  "esriFeatureServerDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.geoJsonDistributionFormat = createRegexSerializer(
  "geoJsonDistributionFormat"
);
MagdaCatalogItem.defaultSerializers.czmlDistributionFormat = createRegexSerializer(
  "czmlDistributionFormat"
);

Object.freeze(MagdaCatalogItem.defaultSerializers);

/**
 * Creates a catalog item from a MAGDA distribution.
 *
 * @param {Terria} options.terria The Terria instance.
 * @param {Object} options.distribution The MAGDA distribution JSON.
 * @param {String} options.magdaBaseUrl The base URL of the MAGDA server.
 * @param {String} [options.parent] The parent of this catalog item.
 * @param {RegExp} [options.wmsDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                             is a WMS distribution.  If undefined, WMS distributions will not be returned.
 * @param {RegExp} [options.wfsDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                             is a WFS distribution.  If undefined, WFS distributions will not be returned.
 * @param {RegExp} [options.esriMapServerDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                                       is an Esri MapServer distribution.  If undefined, Esri MapServer distributions will not be returned.
 * @param {RegExp} [options.esriFeatureServerDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                                           is an Esri FeatureServer distribution.  If undefined, Esri FeatureServer distributions will not be returned.
 * @param {RegExp} [options.kmlDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                             is a KML distribution.  If undefined, KML distributions will not be returned.
 * @param {RegExp} [options.geoJsonDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                                 is a GeoJSON distribution.  If undefined, GeoJSON distributions will not be returned.
 * @param {RegExp} [options.csvDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                             is a CSV distribution.  If undefined, CSV distributions will not be returned.
 * @param {RegExp} [options.czmlDistributionFormat] A regular expression that, when it matches a distribution's format, indicates that the distribution
 *                                              is a CZML distribution.  If undefined, CZML distributions will not be returned.
 * @param {Boolean} [options.allowWmsGroups=false] True to allow this function to return WMS groups in addition to items.  For example if the distribution
 *                                              refers to a WMS server but no layer is available, a {@see WebMapServiceCatalogGroup} for the
 *                                              server will be returned.
 * @param {Boolean} [options.allowWfsGroups=false] True to allow this function to return WFS groups in addition to items.  For example if the distribution
 *                                              refers to a WFS server but no layer is available, a {@see WebFeatureServiceCatalogGroup} for the
 *                                              server will be returned.
 * @param {Boolean} [options.useDistributionName=false] True to use the name of the distribution for the name of the catalog item; false to use the
 *                                                  name of the dataset.
 * @param {String} [options.dataCustodian] The data custodian to use, overriding any that might be inferred from the MAGDA dataset.
 * @param {Object} [options.itemProperties] Additional properties to apply to the item once created.
 * @return {Promise<CatalogMember>} A promise to the created catalog member, or a promise to undefined if no catalog member could be created from the distribution.
 */
MagdaCatalogItem.createCatalogItemFromDistribution = function(options) {
  var distribution = options.distribution;
  var parent = options.parent;

  var formats = [
    // Format Regex, Catalog Item, (optional) URL regex
    [options.wmsDistributionFormat, WebMapServiceCatalogItem],
    [options.wfsDistributionFormat, WebFeatureServiceCatalogItem],
    [
      options.esriMapServerDistributionFormat,
      ArcGisMapServerCatalogItem,
      /MapServer/
    ],
    [
      options.esriFeatureServerDistributionFormat,
      ArcGisFeatureServerCatalogItem,
      /FeatureServer/
    ],
    [options.kmlDistributionFormat, KmlCatalogItem],
    [options.geoJsonDistributionFormat, GeoJsonCatalogItem],
    [options.czmlDistributionFormat, CzmlCatalogItem],
    [options.csvDistributionFormat, CsvCatalogItem]
  ].filter(function(format) {
    return defined(format[0]);
  });

  var dcatJson = distribution.aspects["dcat-distribution-strings"];
  var datasetFormat = distribution.aspects["dataset-format"];
  let formatString = dcatJson.format;
  if (datasetFormat && datasetFormat.format) {
    formatString = datasetFormat.format;
  }

  var baseUrl = dcatJson.downloadURL;
  if (!defined(baseUrl)) {
    if (dcatJson.accessURL) {
      baseUrl = dcatJson.accessURL;
    } else {
      return when(undefined);
    }
  }

  var matchingFormats = formats.filter(function(format) {
    // Matching formats must match the format regex,
    // and also the URL regex if it exists.
    return (
      formatString.match(format[0]) &&
      (!defined(format[2]) || baseUrl.match(format[2]))
    );
  });
  if (matchingFormats.length === 0) {
    return when(undefined);
  }

  var isWms = matchingFormats[0][1] === WebMapServiceCatalogItem;
  var isWfs = matchingFormats[0][1] === WebFeatureServiceCatalogItem;

  // Extract the layer name from the URL.
  var uri = new URI(baseUrl);
  var params = uri.search(true);

  // Remove the query portion of the WMS URL.
  var url = baseUrl;

  var newItem;
  if (isWms || isWfs) {
    uri.search("");
    url = uri.toString();
    var layerName = params.LAYERS || params.layers || params.typeName;
    if (defined(layerName)) {
      newItem = isWms
        ? new WebMapServiceCatalogItem(options.terria)
        : new WebFeatureServiceCatalogItem(options.terria);
      newItem.layers = layerName;
      newItem.url = url;
    } else {
      // Construct a WMS/WFS CatalogGroup and return the first item
      var newGroup;
      if (isWms && options.allowWmsGroups) {
        newGroup = new WebMapServiceCatalogGroup(options.terria);
        newGroup.flatten = true;
      } else if (isWfs && options.allowWfsGroups) {
        newGroup = new WebFeatureServiceCatalogGroup(options.terria);
      } else {
        return when(undefined);
      }
      newGroup.url = url;
      newItem = newGroup.load().then(function() {
        if (newGroup.items.length === 0) {
          return undefined;
        } else {
          return newGroup.items[0];
        }
      });
    }
  } else {
    newItem = new matchingFormats[0][1](options.terria);
    newItem.url = url;
  }
  return when(newItem).then(function(newItem) {
    if (!newItem) {
      return undefined;
    }

    newItem.name = dcatJson.title;

    newItem.info.push({
      name: i18next.t("models.magda.distributionDesc"),
      content: dcatJson.description
    });

    // newItem.dataUrl = new URI(options.ckanBaseUrl).segment('dataset').segment(itemData.name).toString();
    // newItem.dataUrlType = 'direct';

    if (defined(options.dataCustodian)) {
      newItem.dataCustodian = options.dataCustodian;
    }

    if (typeof options.itemProperties === "object") {
      newItem.updateFromJson(options.itemProperties);
    }

    if (defined(parent)) {
      newItem.id = parent.uniqueId + "/" + distribution.id;
    }

    if (defined(options.zoomOnEnable)) {
      newItem.zoomOnEnable = options.zoomOnEnable;
    }

    knockout.getObservable(newItem, "isLoading").subscribe(function(value) {
      try {
        if (value === true) return;
        if (window.parent !== window) {
          window.parent.postMessage("loading complete", "*");
        }

        if (window.opener) {
          window.opener.postMessage("loading complete", "*");
        }
      } catch (e) {
        console.log(e);
      }
    });

    return newItem;
  });
};

/**
 * Maps catalog item `type` to a short, human-readable identifier of the
 * type of distribution accessed (e.g. `wms` maps to `WMS` and `esri-mapServer`
 * maps to `MapServer`).
 * @type {Object}
 */
MagdaCatalogItem.shortHumanReadableTypeNames = {
  wms: "WMS",
  "wms-getCapabilities": "WMS",
  wfs: "WFS",
  "wfs-getCapabilities": "WFS",
  "esri-mapServer": "MapServer",
  "esri-featureServer": "FeatureServer",
  kml: "KML",
  geojson: "GeoJSON",
  czml: "CZML",
  csv: "CSV"
};

MagdaCatalogItem.prototype._load = function() {
  var baseUri = new URI(this.url).segment("api/v0/registry");

  if (!defined(this.distributionId) && !defined(this.datasetId)) {
    throw new TerriaError({
      sender: this,
      title: i18next.t("models.magda.idsNotSpecifiedTitle"),
      message: i18next.t("models.magda.idsNotSpecifiedMessage")
    });
  }

  var that = this;

  // Construct an array of "previewable" distributions

  return when()
    .then(function() {
      if (defined(that.distributionId)) {
        var distributionUri = baseUri
          .clone()
          .segment(`records/${encodeURIComponent(that.distributionId)}`)
          .addQuery({
            aspect: "dcat-distribution-strings",
            optionalAspect: "dataset-format"
          });
        var distributionUrl = proxyCatalogItemUrl(
          that,
          distributionUri.toString(),
          "1d"
        );
        return loadJson(distributionUrl).then(function(distributionJson) {
          if (defined(distributionJson.id)) {
            // Success
            return [distributionJson];
          } else {
            return [];
          }
        });
      } else if (defined(that.datasetId)) {
        var datasetUri = baseUri
          .clone()
          .segment(`records/${encodeURIComponent(that.datasetId)}`)
          .addQuery({
            aspect: "dataset-distributions",
            optionalAspect: "dataset-format",
            dereference: true
          });
        var datasetUrl = proxyCatalogItemUrl(that, datasetUri.toString(), "1d");
        return loadJson(datasetUrl).then(function(datasetJson) {
          return datasetJson.aspects["dataset-distributions"].distributions;
        });
      } else {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.magda.retrieveErrorTitle"),
          message: i18next.t("models.magda.retrieveErrorMessage")
        });
      }
    })
    .then(function(distributionsToConsider) {
      var catalogItemCreatingAttempts = [];
      for (var i = 0; i < distributionsToConsider.length; ++i) {
        var catalogItemCreatingAttempt = MagdaCatalogItem.createCatalogItemFromDistribution(
          {
            terria: that.terria,
            distribution: distributionsToConsider[i],
            magdaBaseUrl: that.url,
            wmsDistributionFormat: that.allowWms
              ? that.wmsDistributionFormat
              : undefined,
            kmlDistributionFormat: that.allowKml
              ? that.kmlDistributionFormat
              : undefined,
            wfsDistributionFormat: that.allowWfs
              ? that.wfsDistributionFormat
              : undefined,
            csvDistributionFormat: that.allowCsv
              ? that.csvDistributionFormat
              : undefined,
            esriMapServerDistributionFormat: that.allowEsriMapServer
              ? that.esriMapServerDistributionFormat
              : undefined,
            geoJsonDistributionFormat: that.allowGeoJson
              ? that.geoJsonDistributionFormat
              : undefined,
            czmlDistributionFormat: that.allowCzml
              ? that.czmlDistributionFormat
              : undefined,
            dataCustodian: that.dataCustodian,
            itemProperties: that.itemProperties,
            allowWfsGroups: true,
            allowWmsGroups: true,
            zoomOnEnable: that.zoomOnEnable
          }
        ).then(function(catalogItem) {
          if (!defined(catalogItem)) {
            var e = new Error();
            e.ignore = true;
            throw e;
            //--- creation function may return undefined.
            //--- This should be considered as failed but not report to user.
          } else {
            catalogItem.name = that.name;
            return catalogItem;
          }
        });
        catalogItemCreatingAttempts.push(catalogItemCreatingAttempt);
      }

      return when.any(catalogItemCreatingAttempts).otherwise(function(e) {
        var genericError = new TerriaError({
          sender: that,
          title: i18next.t("models.magda.notCompatibleTitle"),
          message: defined(that.distributionId)
            ? i18next.t("models.magda.notCompatibleMessageI", {
                distributionId: that.distributionId
              })
            : i18next.t("models.magda.notCompatibleMessageII")
        });
        if (e instanceof RangeError || !e.length) {
          throw genericError;
        } else {
          for (var i = 0; i < e.length; i++) {
            if (e[i].ignore) continue;
            throw e[i];
          }
          throw genericError;
        }
      });
    });
};

module.exports = MagdaCatalogItem;
