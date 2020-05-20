"use strict";

/*global require*/
var ArcGisFeatureServerCatalogItem = require("./ArcGisFeatureServerCatalogItem");
var ArcGisMapServerCatalogItem = require("./ArcGisMapServerCatalogItem");
var CatalogItem = require("./CatalogItem");
var clone = require("terriajs-cesium/Source/Core/clone").default;
var createRegexDeserializer = require("./createRegexDeserializer");
var createRegexSerializer = require("./createRegexSerializer");
var CsvCatalogItem = require("./CsvCatalogItem");
var CzmlCatalogItem = require("./CzmlCatalogItem");
var defined = require("terriajs-cesium/Source/Core/defined").default;

var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var KmlCatalogItem = require("./KmlCatalogItem");
var loadJson = require("../Core/loadJson");
var Metadata = require("./Metadata");
var TerriaError = require("../Core/TerriaError");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var URI = require("urijs");
var WebMapServiceCatalogGroup = require("./WebMapServiceCatalogGroup");
var WebMapServiceCatalogItem = require("./WebMapServiceCatalogItem");
var WebFeatureServiceCatalogGroup = require("./WebFeatureServiceCatalogGroup");
var WebFeatureServiceCatalogItem = require("./WebFeatureServiceCatalogItem");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var i18next = require("i18next").default;

/**
 * A {@link CatalogItem} that queries a CKAN server for a resource, and then accesses
 * that resource as WMS, GeoJSON, etc. depending on what it finds.
 *
 * @alias CkanCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
function CkanCatalogItem(terria) {
  CatalogItem.call(this, terria);

  /**
   * Gets or sets the ID of the CKAN resource referred to by this catalog item.  Either this property
   * is {@see CkanCatalogItem#datasetId} must be specified.  If {@see CkanCatalogItem#datasetId} is
   * specified too, and this resource is not found, _any_ supported resource may be used instead,
   * depending on the value of {@see CkanCatalogItem#allowAnyResourceIfResourceIdNotFound}.
   * @type {String}
   */
  this.resourceId = undefined;

  /**
   * Gets or sets the ID of the CKAN dataset referred to by this catalog item.  Either this property
   * is {@see CkanCatalogItem#resourceId} must be specified.  The first resource of a supported type
   * in this dataset will be used.
   * @type {String}
   */
  this.datasetId = undefined;

  /**
   * Gets or sets a value indicating whether any supported resource may be used if both {@see CkanCatalogItem#datasetId} and
   * {@see CkanCatalogItem#resourceId} are specified and the {@see CkanCatalogItem#resourceId} is not found.
   * @type {Boolean}
   * @default true
   */
  this.allowAnyResourceIfResourceIdNotFound = true;

  /**
   * Gets or sets a value indicating whether this may be a WMS resource.
   * @type {Boolean}
   * @default true
   */
  this.allowWms = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WMS resource.
   * @type {RegExp}
   */
  this.wmsResourceFormat = /^wms$/i;

  /**
   * Gets or sets a value indicating whether this may be a WFS resource.
   * @type {Boolean}
   * @default true
   */
  this.allowWfs = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WFS resource.
   * @type {RegExp}
   */
  this.wfsResourceFormat = /^wfs$/i;

  /**
   * Gets or sets a value indicating whether this may be a KML resource.
   * @type {Boolean}
   * @default true
   */
  this.allowKml = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a KML resource.
   * @type {RegExp}
   */
  this.kmlResourceFormat = /^kml$/i;

  /**
   * Gets or sets a value indicating whether this may be a CSV resource.
   * @type {Boolean}
   * @default true
   */
  this.allowCsv = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CSV resource.
   * @type {RegExp}
   */
  this.csvResourceFormat = /^csv-geo-/i;

  /**
   * Gets or sets a value indicating whether this may be an Esri MapServer resource.
   * @type {Boolean}
   * @default true
   */
  this.allowEsriMapServer = true;

  /**
   * Gets or sets a value indicating whether this may be an Esri FeatureServer resource.
   * @type {Boolean}
   * @default true
   */
  this.allowEsriFeatureServer = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is an Esri MapServer resource.
   * A valid MapServer resource must also have `MapServer` in its URL.
   * @type {RegExp}
   */
  this.esriMapServerResourceFormat = /^esri rest$/i;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is an Esri
   * MapServer or FeatureServer resource.  A valid FeatureServer resource must also have `FeatureServer` in its URL.
   * @type {RegExp}
   */
  this.esriFeatureServerResourceFormat = /^esri rest$/i;

  /**
   * Gets or sets a value indicating whether this may be a GeoJSON resource.
   * @type {Boolean}
   * @default true
   */
  this.allowGeoJson = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a GeoJSON resource.
   * @type {RegExp}
   */
  this.geoJsonResourceFormat = /^geojson$/i;

  /**
   * Gets or sets a value indicating whether this may be a CZML resource.
   * @type {Boolean}
   * @default true
   */
  this.allowCzml = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CZML resource.
   * @type {RegExp}
   */
  this.czmlResourceFormat = /^czml$/i;

  /**
   * Gets or sets a hash of properties that will be set on the item created from the CKAN resource.
   * For example, { "treat404AsError": false }
   * @type {Object}
   */
  this.itemProperties = undefined;
}

inherit(CatalogItem, CkanCatalogItem);

Object.defineProperties(CkanCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CkanCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "ckan-resource";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'CKAN Resource'.
   * @memberOf CkanCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.ckan.name");
    }
  },

  /**
   * Gets the metadata associated with this data source and the server that provided it, if applicable.
   * @memberOf CkanCatalogItem.prototype
   * @type {Metadata}
   */
  metadata: {
    get: function() {
      var result = new Metadata();
      result.isLoading = false;
      result.dataSourceErrorMessage = i18next.t(
        "models.ckan.dataSourceErrorMessage"
      );
      result.serviceErrorMessage = i18next.t("models.ckan.serviceErrorMessage");
      return result;
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CkanCatalogItem.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CkanCatalogItem.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CkanCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CkanCatalogItem.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CkanCatalogItem.defaultUpdaters = clone(CatalogItem.defaultUpdaters);

CkanCatalogItem.defaultUpdaters.wmsResourceFormat = createRegexDeserializer(
  "wmsResourceFormat"
);
CkanCatalogItem.defaultUpdaters.wfsResourceFormat = createRegexDeserializer(
  "wfsResourceFormat"
);
CkanCatalogItem.defaultUpdaters.kmlResourceFormat = createRegexDeserializer(
  "kmlResourceFormat"
);
CkanCatalogItem.defaultUpdaters.csvResourceFormat = createRegexDeserializer(
  "csvResourceFormat"
);
CkanCatalogItem.defaultUpdaters.esriMapServerResourceFormat = createRegexDeserializer(
  "esriMapServerResourceFormat"
);
CkanCatalogItem.defaultUpdaters.esriFeatureServerResourceFormat = createRegexDeserializer(
  "esriFeatureServerResourceFormat"
);
CkanCatalogItem.defaultUpdaters.geoJsonResourceFormat = createRegexDeserializer(
  "geoJsonResourceFormat"
);
CkanCatalogItem.defaultUpdaters.czmlResourceFormat = createRegexDeserializer(
  "czmlResourceFormat"
);

Object.freeze(CkanCatalogItem.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CkanCatalogItem.defaultSerializers = clone(CatalogItem.defaultSerializers);

CkanCatalogItem.defaultSerializers.wmsResourceFormat = createRegexSerializer(
  "wmsResourceFormat"
);
CkanCatalogItem.defaultSerializers.wfsResourceFormat = createRegexSerializer(
  "wfsResourceFormat"
);
CkanCatalogItem.defaultSerializers.kmlResourceFormat = createRegexSerializer(
  "kmlResourceFormat"
);
CkanCatalogItem.defaultSerializers.csvResourceFormat = createRegexSerializer(
  "csvResourceFormat"
);
CkanCatalogItem.defaultSerializers.esriMapServerResourceFormat = createRegexSerializer(
  "esriMapServerResourceFormat"
);
CkanCatalogItem.defaultSerializers.esriFeatureServerResourceFormat = createRegexSerializer(
  "esriFeatureServerResourceFormat"
);
CkanCatalogItem.defaultSerializers.geoJsonResourceFormat = createRegexSerializer(
  "geoJsonResourceFormat"
);
CkanCatalogItem.defaultSerializers.czmlResourceFormat = createRegexSerializer(
  "czmlResourceFormat"
);

Object.freeze(CkanCatalogItem.defaultSerializers);

/**
 * Creates a catalog item from a CKAN resource.
 *
 * @param {Terria} options.terria The Terria instance.
 * @param {Object} options.resource The CKAN resource JSON.
 * @param {Object} options.itemData The CKAN dataset JSON.
 * @param {String} options.ckanBaseUrl The base URL of the CKAN server.
 * @param {Object} [options.extras] The parsed version of `options.itemData`, if available.  If not provided, it will be parsed as needed.
 * @param {String} [options.parent] The parent of this catalog item.
 * @param {RegExp} [options.wmsResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a WMS resource.  If undefined, WMS resources will not be returned.
 * @param {RegExp} [options.wfsResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a WFS resource.  If undefined, WFS resources will not be returned.
 * @param {RegExp} [options.esriMapServerResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                                       is an Esri MapServer resource.  If undefined, Esri MapServer resources will not be returned.
 * @param {RegExp} [options.esriFeatureServerResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                                           is an Esri FeatureServer resource.  If undefined, Esri FeatureServer resources will not be returned.
 * @param {RegExp} [options.kmlResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a KML resource.  If undefined, KML resources will not be returned.
 * @param {RegExp} [options.geoJsonResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                                 is a GeoJSON resource.  If undefined, GeoJSON resources will not be returned.
 * @param {RegExp} [options.csvResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                             is a CSV resource.  If undefined, CSV resources will not be returned.
 * @param {RegExp} [options.czmlResourceFormat] A regular expression that, when it matches a resource's format, indicates that the resource
 *                                              is a CZML resource.  If undefined, CZML resources will not be returned.
 * @param {Boolean} [options.allowWmsGroups=false] True to allow this function to return WMS groups in addition to items.  For example if the resource
 *                                              refers to a WMS server but no layer is available, a {@see WebMapServiceCatalogGroup} for the
 *                                              server will be returned.
 * @param {Boolean} [options.allowWfsGroups=false] True to allow this function to return WFS groups in addition to items.  For example if the resource
 *                                              refers to a WFS server but no layer is available, a {@see WebFeatureServiceCatalogGroup} for the
 *                                              server will be returned.
 * @param {Boolean} [options.useResourceName=false] True to use the name of the resource for the name of the catalog item; false to use the
 *                                                  name of the dataset.
 * @param {Boolean} [options.useCombinationNameWhereMultipleResources=true] Use a combination of the name and the resource and dataset where
                                                                            there are multiple resources for a single dataset.
 * @param {String} [options.dataCustodian] The data custodian to use, overriding any that might be inferred from the CKAN dataset.
 * @param {Object} [options.itemProperties] Additional properties to apply to the item once created.
 * @return {CatalogMember} The created catalog member, or undefined if no catalog member could be created from the resource.
 */
CkanCatalogItem.createCatalogItemFromResource = function(options) {
  var resource = options.resource;
  var itemData = options.itemData;
  var extras = options.extras;
  var parent = options.parent;

  if (resource.__filtered) {
    return;
  }

  if (!defined(extras)) {
    extras = {};
    if (defined(itemData.extras)) {
      for (var idx = 0; idx < itemData.extras.length; idx++) {
        extras[itemData.extras[idx].key] = itemData.extras[idx].value;
      }
    }
  }

  var formats = [
    // Format Regex, Catalog Item, (optional) URL regex
    [options.wmsResourceFormat, WebMapServiceCatalogItem],
    [options.wfsResourceFormat, WebFeatureServiceCatalogItem],
    [
      options.esriMapServerResourceFormat,
      ArcGisMapServerCatalogItem,
      /MapServer/
    ],
    [
      options.esriFeatureServerResourceFormat,
      ArcGisFeatureServerCatalogItem,
      /FeatureServer/
    ],
    [options.kmlResourceFormat, KmlCatalogItem, undefined, /\.zip$/],
    [options.geoJsonResourceFormat, GeoJsonCatalogItem],
    [options.czmlResourceFormat, CzmlCatalogItem],
    [options.csvResourceFormat, CsvCatalogItem]
  ].filter(function(format) {
    return defined(format[0]);
  });

  var baseUrl = resource.wms_url;
  if (!defined(baseUrl)) {
    baseUrl = resource.url;
    if (!defined(baseUrl)) {
      return undefined;
    }
  }

  var matchingFormats = formats.filter(function(format) {
    // Matching formats must match the format regex,
    // and also the URL regex if it exists and not the URL exclusion regex if it exists.
    return (
      resource.format.match(format[0]) &&
      (!defined(format[2]) || baseUrl.match(format[2])) &&
      (!defined(format[3]) || !baseUrl.match(format[3]))
    );
  });
  if (matchingFormats.length === 0) {
    return undefined;
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
    var layerName =
      resource.wms_layer || params.LAYERS || params.layers || params.typeName;
    if (defined(layerName)) {
      newItem = isWms
        ? new WebMapServiceCatalogItem(options.terria)
        : new WebFeatureServiceCatalogItem(options.terria);
      newItem.layers = layerName;
    } else {
      if (isWms && options.allowWmsGroups) {
        newItem = new WebMapServiceCatalogGroup(options.terria);
      } else if (isWfs && options.allowWfsGroups) {
        newItem = new WebFeatureServiceCatalogGroup(options.terria);
      } else {
        return undefined;
      }
    }
    uri.search("");
    url = uri.toString();
  } else {
    newItem = new matchingFormats[0][1](options.terria);
  }
  if (!newItem) {
    return undefined;
  }

  if (options.useResourceName) {
    newItem.name = resource.name;
  } else if (
    options.useCombinationNameWhereMultipleResources &&
    itemData.resources.length > 1
  ) {
    newItem.name = `${itemData.title} - ${resource.name}`;
  } else {
    newItem.name = itemData.title;
  }

  if (itemData.notes) {
    newItem.info.push({
      name: i18next.t("models.ckan.datasetDescription"),
      content: itemData.notes
    });

    // Prevent a description - often the same one - from also coming from the WMS server.
    newItem.info.push({
      name: i18next.t("models.ckan.datasetDescription"),
      content: ""
    });
  }

  if (defined(resource.description)) {
    newItem.info.push({
      name: i18next.t("models.ckan.resourceDescription"),
      content: resource.description
    });
  }

  if (defined(itemData.license_url)) {
    newItem.info.push({
      name: i18next.t("models.ckan.licence"),
      content:
        "[" +
        (itemData.license_title || itemData.license_url) +
        "](" +
        itemData.license_url +
        ")"
    });
  } else if (defined(itemData.license_title)) {
    newItem.info.push({
      name: i18next.t("models.ckan.licence"),
      content: itemData.license_title
    });
  }

  if (defined(itemData.author)) {
    newItem.info.push({
      name: i18next.t("models.ckan.author"),
      content: itemData.author
    });
  }

  if (defined(itemData.contact_point)) {
    newItem.info.push({
      name: i18next.t("models.ckan.contact_point"),
      content: itemData.c
    });
  }

  // If the date string is of format 'dddd-dd-dd*' extract the first part, otherwise we retain the entire date string.
  function prettifyDate(date) {
    if (date.match(/^\d\d\d\d-\d\d-\d\d.*/)) {
      return date.substr(0, 10);
    } else {
      return date;
    }
  }

  if (defined(itemData.metadata_created)) {
    newItem.info.push({
      name: i18next.t("models.ckan.metadata_created"),
      content: prettifyDate(itemData.metadata_created)
    });
  }

  if (defined(itemData.metadata_modified)) {
    newItem.info.push({
      name: i18next.t("models.ckan.metadata_modified"),
      content: prettifyDate(itemData.metadata_modified)
    });
  }

  if (defined(itemData.update_freq)) {
    newItem.info.push({
      name: i18next.t("models.ckan.update_freq"),
      content: itemData.update_freq
    });
  }

  newItem.url = url;

  var bboxString = itemData.geo_coverage || extras.geo_coverage;
  if (defined(bboxString)) {
    var parts = bboxString.split(",");
    if (parts.length === 4) {
      newItem.rectangle = Rectangle.fromDegrees(
        parts[0],
        parts[1],
        parts[2],
        parts[3]
      );
    }
  }
  newItem.dataUrl = new URI(options.ckanBaseUrl)
    .segment("dataset")
    .segment(itemData.name)
    .toString();
  newItem.dataUrlType = "direct";

  if (defined(options.dataCustodian)) {
    newItem.dataCustodian = options.dataCustodian;
  } else if (itemData.organization && itemData.organization.title) {
    newItem.dataCustodian =
      itemData.organization.description || itemData.organization.title;
  }

  if (typeof options.itemProperties === "object") {
    newItem.updateFromJson(options.itemProperties);
  }

  if (defined(parent)) {
    newItem.id = parent.uniqueId + "/" + resource.id;
  }

  return newItem;
};

/**
 * Maps catalog item `type` to a short, human-readable identifier of the
 * type of resource accessed (e.g. `wms` maps to `WMS` and `esri-mapServer`
 * maps to `MapServer`).
 * @type {Object}
 */
CkanCatalogItem.shortHumanReadableTypeNames = {
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

CkanCatalogItem.prototype._load = function() {
  var baseUri = new URI(this.url).segment("api/3/action");

  if (!defined(this.resourceId) && !defined(this.datasetId)) {
    throw new TerriaError({
      sender: this,
      title: i18next.t("models.ckan.idsNotSpecifiedTitle"),
      message: i18next.t("models.ckan.idsNotSpecifiedMessage")
    });
  }

  var that = this;

  var datasetIdPromise;

  // If we don't know the dataset ID, query the resource for it.
  if (defined(this.datasetId)) {
    datasetIdPromise = when(this.datasetId);
  } else {
    var resourceUri = baseUri
      .clone()
      .segment("resource_show")
      .addQuery({ id: this.resourceId });
    var resourceUrl = proxyCatalogItemUrl(this, resourceUri.toString(), "1d");
    datasetIdPromise = loadJson(resourceUrl).then(function(resourceJson) {
      if (!resourceJson.success) {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.ckan.errorRetrievingUrlTitle"),
          message: i18next.t("models.ckan.errorRetrievingUrlMessage", {
            url: that.url
          })
        });
      }

      if (
        !defined(resourceJson.result) ||
        !defined(resourceJson.result.package_id)
      ) {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.ckan.invalidCkanTitle"),
          message: i18next.t("models.ckan.invalidCkanMessage")
        });
      }

      return resourceJson.result.package_id;
    });
  }

  return datasetIdPromise.then(function(datasetId) {
    var datasetUri = baseUri
      .clone()
      .segment("package_show")
      .addQuery({ id: datasetId });
    var datasetUrl = proxyCatalogItemUrl(that, datasetUri.toString(), "1d");

    return loadJson(datasetUrl).then(function(json) {
      if (!json.success) {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.ckan.errorRetrievingUrlTitle"),
          message: i18next.t("models.ckan.errorRetrievingUrlMessage", {
            url: datasetUrl
          })
        });
      }

      var resources = json.result.resources;
      var resourcesToConsider = resources;

      // Prefer the specified resourceId, optionally allow any resourceId.
      if (defined(that.resourceId)) {
        resourcesToConsider = resources.filter(function(resource) {
          return resource.id === that.resourceId;
        });

        if (
          resourcesToConsider.length === 0 &&
          that.allowAnyResourceIfResourceIdNotFound
        ) {
          resourcesToConsider = resources;
        }
      }

      for (var i = 0; i < resourcesToConsider.length; ++i) {
        var catalogItem = CkanCatalogItem.createCatalogItemFromResource({
          terria: that.terria,
          resource: resourcesToConsider[i],
          itemData: json.result,
          ckanBaseUrl: that.url, // TODO
          wmsResourceFormat: that.allowWms ? that.wmsResourceFormat : undefined,
          kmlResourceFormat: that.allowKml ? that.kmlResourceFormat : undefined,
          csvResourceFormat: that.allowCsv ? that.csvResourceFormat : undefined,
          esriMapServerResourceFormat: that.allowEsriMapServer
            ? that.esriMapServerResourceFormat
            : undefined,
          geoJsonResourceFormat: that.allowGeoJson
            ? that.geoJsonResourceFormat
            : undefined,
          czmlResourceFormat: that.allowCzml
            ? that.czmlResourceFormat
            : undefined,
          dataCustodian: that.dataCustodian,
          itemProperties: that.itemProperties
        });

        if (defined(catalogItem)) {
          catalogItem.name = that.name;
          return catalogItem;
        }
      }

      throw new TerriaError({
        sender: that,
        title: i18next.t("models.ckan.notCompatibleTitle"),
        message: defined(that.resourceId)
          ? i18next.t("models.ckan.notCompatibleMessageI", {
              resourceId: that.resourceId
            })
          : i18next.t("models.ckan.notCompatibleMessageII")
      });
    });
  });
};

module.exports = CkanCatalogItem;
