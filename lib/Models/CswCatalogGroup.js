"use strict";

/*global require*/
var ArcGisMapServerCatalogItem = require("./ArcGisMapServerCatalogItem");
var CatalogGroup = require("./CatalogGroup");
var clone = require("terriajs-cesium/Source/Core/clone").default;
var CsvCatalogItem = require("./CsvCatalogItem");
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var formatError = require("terriajs-cesium/Source/Core/formatError").default;

var GeoJsonCatalogItem = require("./GeoJsonCatalogItem");
var inherit = require("../Core/inherit");
var KmlCatalogItem = require("./KmlCatalogItem");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var LegendUrl = require("../Map/LegendUrl");
var loadWithXhr = require("../Core/loadWithXhr");
var loadXML = require("../Core/loadXML");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var TerriaError = require("../Core/TerriaError");
var URI = require("urijs");
var WebMapServiceCatalogGroup = require("./WebMapServiceCatalogGroup");
var WebMapServiceCatalogItem = require("./WebMapServiceCatalogItem");
var WebProcessingServiceCatalogGroup = require("./WebProcessingServiceCatalogGroup");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;
var xml2json = require("../ThirdParty/xml2json");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of datasets queried from an OGC Catalog Service (CSW) server.
 *
 * @alias CswCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var CswCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "csw");

  /**
   * Gets or sets the URL of the CSW server.  This property is observable.
   * @type {String}
   */
  this.url = "";

  /**
   * Gets or sets the template XML string to POST to the CSW server to query for catalog items.  If this property is undefined,
   * {@link CswCatalogGroup.defaultGetRecordsTemplate} is used.  The XML string should have a `{startPosition}` placeholder to be
   * replaced with the next start position in order to allow incremental paging of results.
   * This property is observable.
   * @type {String}
   */
  this.getRecordsTemplate = undefined;

  /**
   * True to allow WMS resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default true
   */
  this.includeWms = true;

  /**
   * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the URI is a WMS resource.
   * @type {RegExp}
   */
  this.wmsResourceFormat = /\bwms\b/i;

  /**
   * True to allow KML resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeKml = false;

  /**
   * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a KML resource.
   * @type {RegExp}
   */
  this.kmlResourceFormat = /\bkml\b/i;

  /**
   * True to allow CSV resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   */
  this.includeCsv = false;

  /**
   * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a CSV resource.
   * @type {RegExp}
   */
  this.csvResourceFormat = /\bcsv-geo-/i;

  /**
   * True to allow ESRI Map resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeEsriMapServer = false;

  /**
   * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is an Esri MapServer resource.
   * @type {RegExp}
   */
  this.esriMapServerResourceFormat = /\besri rest\b/i;

  /**
   * True to allow GeoJSON resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeGeoJson = false;

  /**
   * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a GeoJSON resource.
   * @type {RegExp}
   */
  this.geoJsonResourceFormat = /\bgeojson\b/i;

  /**
   * Gets or sets a list of key value pairs that will be used to group resources returned from the catalog. The keys are used to match elements in the metadata and the values are used as names for the groups of resources to be created.
   * @type {RegExp}
   */
  this.metadataGroups = [];

  /**
   * Gets or sets a description of a domain that will be pulled from the CSW service and used to define the metadataGroups. The domain is obtained by querying the CSW server for a particular property - the values of the property form the domain, the values are assumed to define a hierarchy eg. Wave Models | Wave Energy Flux - which is a two level hierarchy of groups that will be used to classify metadata records.
   * @type {Object}
   */
  this.domainSpecification = undefined;

  /**
   * True to allow OGC:WPS service resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeWps = false;

  /**
   * Gets or sets a regular expression that, when it matches the protocol attribute of a URI element of a record, indicates that the resource is a WPS resource.
   * @type {RegExp}
   */
  this.wpsResourceFormat = /\bwps\b/i;

  /**
   * Gets or sets a hash of properties that will be set on the item created from the CKAN resource.
   * For example, { "treat404AsError": false }
   * @type {Object}
   */
  this.itemProperties = undefined;

  knockout.track(this, [
    "url",
    "getRecordsParameters",
    "includeWms",
    "includeKml",
    "includeCsv",
    "includeEsriMapServer",
    "includeGeoJson",
    "includeWps",
    "itemProperties"
  ]);
};

CswCatalogGroup.defaultGetRecordsTemplate = require("./CswGetRecordsTemplate.xml");
CswCatalogGroup.wpsGetRecordsTemplate = require("./CswGetRecordsWPSTemplate.xml");

inherit(CatalogGroup, CswCatalogGroup);

Object.defineProperties(CswCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CswCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "csw";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Catalogue Service (CSW)'.
   * @memberOf CswCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.csw.name");
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CswCatalogGroup.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CswCatalogGroup.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CswCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CswCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CswCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

/* Deserializes a regex like ".foo" into a case-insensitive regex /.foo/i  */
function regexDeserializer(fieldName) {
  return function(catalogGroup, json, propertyName, options) {
    if (defined(json[fieldName])) {
      catalogGroup[fieldName] = new RegExp(json[fieldName], "i");
    }
  };
}

CswCatalogGroup.defaultUpdaters.wmsResourceFormat = regexDeserializer(
  "wmsResourceFormat"
);
CswCatalogGroup.defaultUpdaters.kmlResourceFormat = regexDeserializer(
  "kmlResourceFormat"
);
CswCatalogGroup.defaultUpdaters.csvResourceFormat = regexDeserializer(
  "csvResourceFormat"
);
CswCatalogGroup.defaultUpdaters.esriMapServerResourceFormat = regexDeserializer(
  "esriMapServerResourceFormat"
);
CswCatalogGroup.defaultUpdaters.geoJsonResourceFormat = regexDeserializer(
  "geoJsonResourceFormat"
);
CswCatalogGroup.defaultUpdaters.wpsResourceFormat = regexDeserializer(
  "wpsResourceFormat"
);

Object.freeze(CswCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CswCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

CswCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

/* Serializes a regex like /.foo/i into ".foo"  */
function regexSerializer(fieldName) {
  return function(cswGroup, json, propertyName, options) {
    if (defined(cswGroup[fieldName])) {
      json[fieldName] = cswGroup[fieldName].source;
    }
  };
}

CswCatalogGroup.defaultSerializers.wmsResourceFormat = regexSerializer(
  "wmsResourceFormat"
);
CswCatalogGroup.defaultSerializers.kmlResourceFormat = regexSerializer(
  "kmlResourceFormat"
);
CswCatalogGroup.defaultSerializers.csvResourceFormat = regexSerializer(
  "csvResourceFormat"
);
CswCatalogGroup.defaultSerializers.esriMapServerResourceFormat = regexSerializer(
  "esriMapServerResourceFormat"
);
CswCatalogGroup.defaultSerializers.geoJsonResourceFormat = regexSerializer(
  "geoJsonResourceFormat"
);
CswCatalogGroup.defaultSerializers.wpsResourceFormat = regexSerializer(
  "wpsResourceFormat"
);

Object.freeze(CswCatalogGroup.defaultSerializers);

CswCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [
    this.url,
    this.filterQuery,
    this.blacklist,
    this.filterByWmsGetCapabilities,
    this.minimumMaxScaleDenominator,
    this.allowEntireWmsServers,
    this.includeKml,
    this.includeWms,
    this.includeCsv,
    this.includeEsriMapServer,
    this.includeWps
  ];
};

var resourceFormats = [
  ["wmsResourceFormat", "includeWms", WebMapServiceCatalogItem],
  [
    "esriMapServerResourceFormat",
    "includeEsriMapServer",
    ArcGisMapServerCatalogItem
  ],
  ["kmlResourceFormat", "includeKml", KmlCatalogItem],
  ["geoJsonResourceFormat", "includeGeoJson", GeoJsonCatalogItem],
  ["csvResourceFormat", "includeCsv", CsvCatalogItem],
  ["wpsResourceFormat", "includeWps", WebProcessingServiceCatalogGroup]
];

CswCatalogGroup.prototype._load = function() {
  var postDataTemplate;

  // if we are only searching for wps resources, then use a faster (narrower) csw search
  if (this.includeWps && !anyResourceFormatExceptWps(this)) {
    postDataTemplate = defaultValue(
      this.getRecordsTemplate,
      CswCatalogGroup.wpsGetRecordsTemplate
    );
  } else {
    postDataTemplate = defaultValue(
      this.getRecordsTemplate,
      CswCatalogGroup.defaultGetRecordsTemplate
    );
  }

  var that = this;
  var startPosition = 1;
  var lastPostData;

  function loadNextPage() {
    var postData = postDataTemplate.replace("{startPosition}", startPosition);

    // Don't page endlessly if there's no {startPosition} placeholder.
    if (postData === lastPostData) {
      return;
    }

    return loadWithXhr({
      url: proxyCatalogItemUrl(that, cleanUrl(that.url), "1d"),
      responseType: "document",
      method: "POST",
      overrideMimeType: "text/xml",
      data: postData,
      headers: {
        "Content-Type": "application/xml"
      }
    }).then(function(xml) {
      if (!defined(xml)) {
        return;
      }

      var json = xml2json(xml);

      if (json.Exception) {
        var errorMessage = i18next.t("models.csw.unknownError");
        if (json.Exception.ExceptionText) {
          errorMessage = i18next.t("models.csw.exceptionMessage", {
            exceptionText: json.Exception.ExceptionText
          });
        }
        throw new TerriaError({
          sender: that,
          title: that.name,
          message: errorMessage
        });
      }

      var searchResults = json.SearchResults;
      if (!defined(searchResults) || !defined(searchResults.Record)) {
        return;
      }

      var records = searchResults.Record;
      if (!Array.isArray(records)) {
        records = [records];
      }

      var downloadUrls, acceptableUrls, legendUrl;

      for (var i = 0; i < records.length; ++i) {
        var record = records[i];
        var uris = record.URI || record.references;
        if (!defined(uris)) {
          continue;
        }

        if (uris instanceof String || typeof uris === "string") {
          uris = [uris];
        }

        // maybe more than one url that results in a data layer here - so check for
        // the acceptable ones, store the others as downloadUrls that can be
        // displayed in the metadata summary for the layer
        downloadUrls = [];
        acceptableUrls = [];
        legendUrl = undefined;

        for (var m = 0; m < uris.length; m++) {
          var url = uris[m];
          var excludedProtocol = false;
          for (var l = 0; l < resourceFormats.length; l++) {
            var f = resourceFormats[l];
            var protocolOrScheme = url.protocol || url.scheme;
            if (protocolOrScheme && protocolOrScheme.match(that[f[0]])) {
              excludedProtocol = true;
              acceptableUrls.push(url);
            }
          }
          if (!excludedProtocol) {
            if (url.description === "LegendUrl") {
              legendUrl = url.toString();
            }
            downloadUrls.push({
              url: url.toString(),
              description: defined(url.description) ? url.description : url.name
            });
          }
        }

        // Now process the list of acceptable urls and hand the metadata
        // record and the downloadUrls to each data layer item we create
        for (var j = 0; j < acceptableUrls.length; ++j) {
          var uri = acceptableUrls[j];

          var group = that;
          if (that.metadataGroups.length > 0) {
            group = findGroup(that, that.metadataGroups, record);
          }

          if (defined(group)) {
            var catalogItem = createItemForUri(
              that,
              record,
              uri,
              downloadUrls,
              legendUrl
            );
            if (defined(catalogItem)) {
              group.items.push(catalogItem);
            }
          } else {
            //console.log("Failed to find a group match for "+JSON.stringify(record));
          }
        }
      }

      var nextRecord = parseInt(searchResults.nextRecord, 10);
      if (
        nextRecord !== 0 &&
        nextRecord < parseInt(searchResults.numberOfRecordsMatched, 10)
      ) {
        startPosition = nextRecord;
        lastPostData = postData;
        return loadNextPage();
      }
    });
  }

  function loadDomain() {
    var getDomainUrl =
      cleanUrl(that.url) +
      "?service=CSW&version=2.0.2&request=GetDomain&propertyname=" +
      that.domainSpecification.domainPropertyName;
    return loadXML(proxyCatalogItemUrl(that, getDomainUrl, "1d"))
      .then(function(xml) {
        if (
          !xml ||
          !xml.documentElement ||
          xml.documentElement.localName !== "GetDomainResponse"
        ) {
          throw new TerriaError({
            sender: that,
            title: i18next.t("models.csw.notUseableTitle"),
            message:
              i18next.t("models.csw.notUseableMessage") +
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          });
        }
        var json = xml2json(xml),
          listOfValues = json.DomainValues.ListOfValues.Value;
        for (var i = 0; i < listOfValues.length; i++) {
          var keys = listOfValues[i].split(
            that.domainSpecification.hierarchySeparator
          );
          // recursively find the group that the last key in keys should belong to and add that key
          findLevel(
            keys,
            0,
            that.metadataGroups,
            that.domainSpecification.hierarchySeparator,
            that.domainSpecification.queryPropertyName
          );
        }
      })
      .otherwise(function(e) {
        throw new TerriaError({
          sender: that,
          title: i18next.t("models.csw.notUseableTitle"),
          message: i18next.t("models.csw.notUseableMessage", {
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          })
        });
      });
  }

  var domainPromise = when();

  if (defined(that.domainSpecification)) {
    domainPromise = loadDomain().otherwise(function(e) {
      if (e instanceof TerriaError) {
        throw e;
      }
      throw new TerriaError({
        sender: that,
        title: that.name,
        message:
          i18next.t("models.csw.checkCORSDomain", {
            cors:
              '<a href="http://enable-cors.org/" target="_blank">' +
              i18next.t("models.csw.cors") +
              "</a>",
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          }) +
          "<br/><br/><pre>" +
          formatError(e) +
          "</pre>"
      });
    });
  }

  return when(domainPromise, function() {
    return loadNextPage().otherwise(function(e) {
      if (e instanceof TerriaError) {
        throw e;
      }
      throw new TerriaError({
        sender: that,
        title: that.name,
        message:
          i18next.t("models.csw.checkCORS", {
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          }) +
          "<br/><br/><pre>" +
          formatError(e) +
          "</pre>"
      });
    });
  });
};

function findLevel(keys, index, group, separator, queryField) {
  if (group.length === 0 || index === keys.length - 1) {
    addMetadataGroup(keys, index, group, separator, queryField);
    if (index === keys.length - 1) return;
  }

  var groupIndex = -1;
  for (var i = 0; i < group.length; i++) {
    if (group[i].group === keys[index]) {
      groupIndex = i;
      break;
    }
  }

  if (groupIndex === -1) {
    // not found so add it
    addMetadataGroup(keys, index, group, separator, queryField);
    groupIndex = group.length - 1;
  }
  if (!defined(group[groupIndex].children)) group[groupIndex].children = [];
  findLevel(keys, index + 1, group[groupIndex].children, separator, queryField);
}

function addMetadataGroup(keys, index, group, separator, queryField) {
  var value,
    regex = true;
  // if we aren't at the last key, use a regex and tack on another separator to avoid mismatches
  if (index + 1 !== keys.length) {
    var sepRegex = separator.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    value = "^" + keys.slice(0, index + 1).join(sepRegex) + sepRegex;
  } else {
    value = keys.slice(0, index + 1).join(separator);
    regex = false;
  }

  group.push({
    field: queryField,
    value: value,
    regex: regex,
    group: keys[index]
  });
}

// find groups that the record belongs to and create any that don't exist already
function findGroup(catalogGroup, keywordsGroups, record) {
  for (var i = 0; i < keywordsGroups.length; i++) {
    var kg = keywordsGroups[i];
    var fields = record[kg.field];
    var matched = false;
    if (defined(fields)) {
      if (fields instanceof String || typeof fields === "string") {
        fields = [fields];
      }
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        if (matchValue(kg.value, field, kg.regex)) {
          matched = true;
          break;
        }
      }
    }
    if (matched) {
      var newGroup = addGroupIfNotAlreadyPresent(
        kg.group ? kg.group : kg.value,
        catalogGroup
      );
      if (kg.children && defined(newGroup)) {
        // recurse to see if it fits into any of the children
        catalogGroup = findGroup(newGroup, kg.children, record);
        if (!defined(catalogGroup)) {
          //console.log("No match in children for record "+record.title+"::"+record.subject+"::"+record.title+", will assign to "+newGroup.name);
          catalogGroup = newGroup;
        }
      } else if (defined(newGroup)) {
        catalogGroup = newGroup;
      }
      return catalogGroup;
    }
  }
}

function matchValue(value, recordValue, regex) {
  if (defined(regex) && regex) {
    // regular expression so parse it and check string against it
    var regExp = new RegExp(value);
    return regExp.test(recordValue);
  } else {
    return value === recordValue;
  }
}

function addGroupIfNotAlreadyPresent(name, catalogGroup) {
  var item = catalogGroup.findFirstItemByName(name);
  if (!defined(item)) {
    item = new CatalogGroup(catalogGroup.terria);
    item.name = name;
    catalogGroup.items.push(item);
  }
  return item;
}

function createItemForUri(catalogGroup, record, uri, downloadUrls, legendUrl) {
  var layerName;
  if (defined(uri.name)) {
    layerName = uri.name;
  }

  var catalogItem;
  resourceFormats.forEach(function(f) {
    if (
      !defined(catalogItem) &&
      (uri.protocol || uri.scheme).match(catalogGroup[f[0]]) &&
      catalogGroup[f[1]]
    ) {
      if (f[2] === WebMapServiceCatalogItem && !defined(layerName)) {
        catalogItem = new WebMapServiceCatalogGroup(catalogGroup.terria);
      } else {
        catalogItem = new f[2](catalogGroup.terria);
      }
    }
  });

  if (defined(catalogItem)) {
    if (catalogItem instanceof WebProcessingServiceCatalogGroup) {
      // only a few things we care about here
      catalogItem.name = record.title;
      catalogItem.url = uri.toString();
    } else {
      catalogItem.name = record.title;
      catalogItem.description = record.description;
      catalogItem.url = uri.toString();
      catalogItem.dataCustodian = "";

      if (defined(record.contributor)) {
        catalogItem.info.push({
          name: i18next.t("models.csw.dataResponsibility"),
          content: record.contributor.toString()
        });
      }

      catalogItem.info.push({
        name: i18next.t("models.csw.links"),
        content: downloadUrls.reduce(function(previousValue, downloadUrl) {
          return (
            previousValue +
            "[" +
            downloadUrl.description +
            "](" +
            downloadUrl.url +
            ")\n\n"
          );
        }, "")
      });

      catalogItem.info.push({
        name: i18next.t("models.csw.metadataURL"),
        content:
          catalogGroup.url +
          "?&version=2.0.2&service=CSW&request=GetRecordById&outputSchema=http://www.opengis.net/cat/csw/2.0.2&ElementSetName=full&id=" +
          record.identifier
      });

      if (defined(legendUrl)) {
        catalogItem.legendUrl = new LegendUrl(legendUrl);
      }

      if (catalogItem.hasOwnProperty("layers") && defined(layerName)) {
        catalogItem.layers = layerName;
      }

      if (typeof catalogGroup.itemProperties === "object") {
        catalogItem.updateFromJson(catalogGroup.itemProperties);
      }
    }
  }

  return catalogItem;
}

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function anyResourceFormatExceptWps(cswGroup) {
  var result = false;
  for (var i = 0; i < resourceFormats.length; i++) {
    var rf = resourceFormats[i][1];
    if (defined(cswGroup[rf]) && cswGroup[rf] && rf !== "includeWps") {
      result = true;
    }
  }
  return result;
}

CswCatalogGroup._findLevel = findLevel;
module.exports = CswCatalogGroup;
