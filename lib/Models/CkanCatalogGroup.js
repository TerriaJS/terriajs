"use strict";

/*global require*/
var URI = require("urijs");

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var formatError = require("terriajs-cesium/Source/Core/formatError").default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");
var loadText = require("../Core/loadText");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var CkanCatalogItem = require("./CkanCatalogItem");
var createRegexDeserializer = require("./createRegexDeserializer");
var createRegexSerializer = require("./createRegexSerializer");
var TerriaError = require("../Core/TerriaError");
var CatalogGroup = require("./CatalogGroup");
var inherit = require("../Core/inherit");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var xml2json = require("../ThirdParty/xml2json");
var i18next = require("i18next").default;

/**
 * A {@link CatalogGroup} representing a collection of layers from a [CKAN](http://ckan.org) server.
 *
 * @alias CkanCatalogGroup
 * @constructor
 * @extends CatalogGroup
 *
 * @param {Terria} terria The Terria instance.
 */
var CkanCatalogGroup = function(terria) {
  CatalogGroup.call(this, terria, "ckan");

  /**
   * Gets or sets the URL of the CKAN server.  This property is observable.
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
   * Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups. Each item in the
   * array causes an independent request to the CKAN, and the results are concatenated.  The
   * search string is equivalent to what would be in the parameters segment of the url calling the CKAN search api.
   * See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
   * Each item can be either a URL-encoded string ("fq=res_format%3awms") or an object ({ fq: 'res_format:wms' }). The latter
   * format is easier to work with.
   *   To get all the datasets with wms resources: [{ fq: 'res_format%3awms' }]
   *   To get all wms/WMS datasets in the Surface Water group: [{q: 'groups=Surface Water', fq: 'res_format:WMS' }]
   *   To get both wms and esri-mapService datasets: [{q: 'res_format:WMS'}, {q: 'res_format:"Esri REST"' }]
   *   To get all datasets with no filter, you can use ['']
   * This property is required.
   * This property is observable.
   * @type {String[]|Object[]}
   * @editoritemstitle Filter
   */
  this.filterQuery = undefined;

  /**
   * Gets or sets a hash of names of blacklisted groups and data sources.  A group or data source that appears in this hash
   * will not be shown to the user.  In this hash, the keys should be the names of the groups and data sources to blacklist,
   * and the values should be "true".  This property is observable.
   * @type {Object}
   */
  this.blacklist = undefined;

  /**
   * Gets or sets a value indicating whether the CKAN datasets should be filtered by querying GetCapabilities from each
   * referenced WMS server and excluding datasets not found therein.  This property is observable.
   * @type {Boolean}
   */
  this.filterByWmsGetCapabilities = false;

  /**
   * Gets or sets the minimum MaxScaleDenominator that is allowed for a WMS dataset to be included in this CKAN group.
   * If this property is undefined or if {@link CkanCatalogGroup#filterByWmsGetCapabilities} is false, no
   * filtering based on MaxScaleDenominator is performed.  This property is observable.
   * @type {Number}
   */
  this.minimumMaxScaleDenominator = undefined;

  /**
   * Gets or sets any extra wms parameters that should be added to the wms query urls in this CKAN group.
   * If this property is undefined then no extra parameters are added.
   * This property is observable.
   * @type {Object}
   */
  this.wmsParameters = undefined;

  /**
   * Gets or sets a value indicating how datasets should be grouped.  Valid values are:
   * * `none` - Datasets are put in a flat list; they are not grouped at all.
   * * `group` - Datasets are grouped according to their CKAN group.  Datasets that are not in any groups are put at the top level.
   * * `organization` - Datasets are grouped by their CKAN organization.  Datasets that are not associated with an organization are put at the top level.
   * @type {String}
   */
  this.groupBy = "group";

  /**
   * Gets or sets a title for the group holding all items that don't have a group in CKAN. If the value is a blank string or undefined,
   * these items will be left at the top level, not grouped.
   * @type {String}
   */
  this.ungroupedTitle = "No group";

  /**
   * Gets or sets a value indicating whether each catalog item's name should be populated from
   * individual resources instead of from the CKAN dataset.
   * @type {Boolean}
   */
  this.useResourceName = false;

  /**
   * Gets or sets a value indicating whether each catalog item's name should be populated from
   * individual resources and the CKAN dataset where the are multiple resources for a single dataset.
   * @type {Boolean}
   */
  this.useCombinationNameWhereMultipleResources = true;

  /**
   * True to allow entire WMS servers (that is, WMS resources without a clearly-defined layer) to be
   * added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.allowEntireWmsServers = false;

  /**
   * True to allow entire WFS servers (that is, WFS resources without a clearly-defined layer) to be
   * added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.allowEntireWfsServers = false;

  /**
   * True to allow WMS resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default true
   */
  this.includeWms = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WMS resource.
   * @type {RegExp}
   */
  this.wmsResourceFormat = /^wms$/i;

  /**
   * True to allow WFS resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default true
   */
  this.includeWfs = true;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a WMS resource.
   * @type {RegExp}
   */
  this.wfsResourceFormat = /^wfs$/i;

  /**
   * True to allow KML resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeKml = false;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a KML resource.
   * @type {RegExp}
   */
  this.kmlResourceFormat = /^km[lz]$/i;

  /**
   * True to allow CSV resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   */
  this.includeCsv = false;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CSV resource.
   * @type {RegExp}
   */
  this.csvResourceFormat = /^csv-geo-/i;

  /**
   * True to allow ESRI MapServer resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeEsriMapServer = false;

  /**
   * True to allow ESRI FeatureServer resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeEsriFeatureServer = false;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is an Esri MapServer resource.
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
   * True to allow GeoJSON resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeGeoJson = false;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a GeoJSON resource.
   * @type {RegExp}
   */
  this.geoJsonResourceFormat = /^geojson$/i;

  /**
   * True to allow CZML resources to be added to the catalog; otherwise, false.
   * @type {Boolean}
   * @default false
   */
  this.includeCzml = false;

  /**
   * Gets or sets a regular expression that, when it matches a resource's format, indicates that the resource is a CZML resource.
   * @type {RegExp}
   */
  this.czmlResourceFormat = /^czml$/i;

  /**
   * Gets or sets a hash of properties that will be set on each child item.
   * For example, { "treat404AsError": false }
   * @type {Object}
   */
  this.itemProperties = undefined;

  knockout.track(this, [
    "url",
    "dataCustodian",
    "filterQuery",
    "blacklist",
    "wmsParameters",
    "groupBy",
    "ungroupedTitle",
    "useResourceName",
    "allowEntireWmsServers",
    "allowEntireWfsServers",
    "includeWms",
    "includeWfs",
    "includeKml",
    "includeCsv",
    "includeEsriMapServer",
    "includeGeoJson",
    "includeCzml",
    "itemProperties"
  ]);
};

inherit(CatalogGroup, CkanCatalogGroup);

Object.defineProperties(CkanCatalogGroup.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf CkanCatalogGroup.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "ckan";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
   * @memberOf CkanCatalogGroup.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return i18next.t("models.ckan.nameServer");
    }
  },

  /**
   * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
   * When a property name in the returned object literal matches the name of a property on this instance, the value
   * will be called as a function and passed a reference to this instance, a reference to the source JSON object
   * literal, and the name of the property.
   * @memberOf CkanCatalogGroup.prototype
   * @type {Object}
   */
  updaters: {
    get: function() {
      return CkanCatalogGroup.defaultUpdaters;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf CkanCatalogGroup.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return CkanCatalogGroup.defaultSerializers;
    }
  }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CkanCatalogGroup.defaultUpdaters = clone(CatalogGroup.defaultUpdaters);

CkanCatalogGroup.defaultUpdaters.wmsResourceFormat = createRegexDeserializer(
  "wmsResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.wfsResourceFormat = createRegexDeserializer(
  "wfsResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.kmlResourceFormat = createRegexDeserializer(
  "kmlResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.csvResourceFormat = createRegexDeserializer(
  "csvResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.esriMapServerResourceFormat = createRegexDeserializer(
  "esriMapServerResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.esriFeatureServerResourceFormat = createRegexDeserializer(
  "esriFeatureServerResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.geoJsonResourceFormat = createRegexDeserializer(
  "geoJsonResourceFormat"
);
CkanCatalogGroup.defaultUpdaters.czmlResourceFormat = createRegexDeserializer(
  "czmlResourceFormat"
);

Object.freeze(CkanCatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CkanCatalogGroup.defaultSerializers = clone(CatalogGroup.defaultSerializers);

CkanCatalogGroup.defaultSerializers.items =
  CatalogGroup.enabledShareableItemsSerializer;

CkanCatalogGroup.defaultSerializers.wmsResourceFormat = createRegexSerializer(
  "wmsResourceFormat"
);
CkanCatalogGroup.defaultSerializers.wfsResourceFormat = createRegexSerializer(
  "wfsResourceFormat"
);
CkanCatalogGroup.defaultSerializers.kmlResourceFormat = createRegexSerializer(
  "kmlResourceFormat"
);
CkanCatalogGroup.defaultSerializers.csvResourceFormat = createRegexSerializer(
  "csvResourceFormat"
);
CkanCatalogGroup.defaultSerializers.esriMapServerResourceFormat = createRegexSerializer(
  "esriMapServerResourceFormat"
);
CkanCatalogGroup.defaultSerializers.esriFeatureServerResourceFormat = createRegexSerializer(
  "esriFeatureServerResourceFormat"
);
CkanCatalogGroup.defaultSerializers.geoJsonResourceFormat = createRegexSerializer(
  "geoJsonResourceFormat"
);
CkanCatalogGroup.defaultSerializers.czmlResourceFormat = createRegexSerializer(
  "czmlResourceFormat"
);

Object.freeze(CkanCatalogGroup.defaultSerializers);

CkanCatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
  return [
    this.url,
    this.filterQuery,
    this.blacklist,
    this.filterByWmsGetCapabilities,
    this.minimumMaxScaleDenominator,
    this.allowEntireWmsServers,
    this.allowEntireWfsServers,
    this.includeWms,
    this.includeWfs,
    this.includeKml,
    this.includeCsv,
    this.includeEsriMapServer,
    this.includeGeoJson,
    this.includeCzml,
    this.groupBy,
    this.ungroupedTitle
  ];
};

CkanCatalogGroup.prototype._load = function() {
  if (!defined(this.url) || this.url.length === 0) {
    return undefined;
  }

  var that = this;

  var promises = [];
  if (
    !(
      defined(this.filterQuery) &&
      Array.isArray(this.filterQuery) &&
      (typeof this.filterQuery[0] === "string" ||
        typeof this.filterQuery[0] === "object")
    )
  ) {
    throw new TerriaError({
      title: i18next.t("models.ckan.errorLoadingTitle"),
      message: i18next.t("models.ckan.errorLoadingMessage")
    });
  }

  const results = [];

  this.filterQuery.forEach(function(query) {
    var uri = new URI(that.url)
      .segment("api/3/action/package_search")
      .addQuery({ rows: 100000, sort: "metadata_created asc" });

    if (typeof query === "object") {
      // query is an object of non-encoded parameters, like { fq: "res_format:wms OR WMS" }
      Object.keys(query).forEach(key => uri.addQuery(key, query[key]));
    }

    let start = 0;

    function requestNext() {
      var nextUri = uri.clone().addQuery({ start: start });

      var uristring = nextUri.toString();

      if (typeof query === "string") {
        // query is expected to be URL-encoded and begin with a query like 'fq='
        uristring += "&" + query;
      }

      return loadJson(proxyCatalogItemUrl(that, uristring, "1d")).then(function(
        pageResults
      ) {
        if (pageResults && pageResults.result && pageResults.result.results) {
          const thisPage = pageResults.result.results;
          for (let i = 0; i < thisPage.length; ++i) {
            results.push(thisPage[i]);
          }

          start += thisPage.length;

          if (start < pageResults.result.count) {
            return requestNext();
          }
        }
      });
    }

    promises.push(
      requestNext().then(function() {
        return results;
      })
    );
  });

  return when
    .all(promises)
    .then(function(queryResults) {
      if (!defined(queryResults)) {
        return;
      }

      var allResults = [];

      for (var p = 0; p < queryResults.length; p++) {
        var queryResult = queryResults[p];
        for (var i = 0; i < queryResult.length; ++i) {
          allResults.push(queryResult[i]);
        }
      }

      if (that.filterByWmsGetCapabilities) {
        return when(
          filterResultsByGetCapabilities(that, allResults),
          function() {
            populateGroupFromResults(that, allResults);
          }
        );
      } else {
        populateGroupFromResults(that, allResults);
      }
    })
    .otherwise(function(e) {
      throw new TerriaError({
        sender: that,
        title: that.name,
        message:
          i18next.t("models.ckan.corsErrorMessage", {
            corsLink:
              '<a href="http://enable-cors.org/" target="_blank">CORS</a>',
            email:
              '<a href="mailto:' +
              that.terria.supportEmail +
              '">' +
              that.terria.supportEmail +
              "</a>."
          }) +
          "<pre>" +
          formatError(e) +
          "</pre>"
      });
    });
};

function filterResultsByGetCapabilities(ckanGroup, items) {
  var wmsServers = {};

  for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
    var item = items[itemIndex];

    var resources = item.resources;
    for (
      var resourceIndex = 0;
      resourceIndex < resources.length;
      ++resourceIndex
    ) {
      var resource = resources[resourceIndex];
      if (!resource.format.match(ckanGroup.wmsResourceFormat)) {
        continue;
      }

      var wmsUrl = resource.wms_url;
      if (!defined(wmsUrl)) {
        wmsUrl = resource.url;
        if (!defined(wmsUrl)) {
          continue;
        }
      }

      // Extract the layer name from the WMS URL.
      var uri = new URI(wmsUrl);
      var params = uri.search(true);
      var layerName = params.LAYERS;

      // Remove the query portion of the WMS URL.
      uri.search("");
      var url = uri.toString();

      if (!defined(wmsServers[url])) {
        wmsServers[url] = {};
      }

      wmsServers[url][layerName] = resource;
    }
  }

  var promises = [];

  for (var wmsServer in wmsServers) {
    if (wmsServers.hasOwnProperty(wmsServer)) {
      var getCapabilitiesUrl = ckanGroup.terria.corsProxy.getURLProxyIfNecessary(
        wmsServer + "?service=WMS&request=GetCapabilities",
        "1d"
      );

      promises.push(
        filterBasedOnGetCapabilities(
          ckanGroup,
          getCapabilitiesUrl,
          wmsServers[wmsServer]
        )
      );
    }
  }

  return when.all(promises);
}

function filterBasedOnGetCapabilities(
  ckanGroup,
  getCapabilitiesUrl,
  resources
) {
  // Initially assume all resources will be filtered.
  for (var name in resources) {
    if (resources.hasOwnProperty(name)) {
      resources[name].__filtered = true;
    }
  }

  return loadText(getCapabilitiesUrl)
    .then(function(getCapabilitiesXml) {
      var getCapabilitiesJson = xml2json(getCapabilitiesXml);
      filterBasedOnGetCapabilitiesResponse(
        ckanGroup,
        getCapabilitiesJson.Capability.Layer,
        resources
      );
    })
    .otherwise(function() {
      // Do nothing - all resources will be filtered.
    });
}

function filterBasedOnGetCapabilitiesResponse(
  ckanGroup,
  wmsLayersSource,
  resources
) {
  if (defined(wmsLayersSource) && !(wmsLayersSource instanceof Array)) {
    wmsLayersSource = [wmsLayersSource];
  }

  for (var i = 0; i < wmsLayersSource.length; ++i) {
    var layerSource = wmsLayersSource[i];

    if (layerSource.Name) {
      var resource = resources[layerSource.Name];
      if (resource) {
        if (
          !defined(ckanGroup.minimumMaxScaleDenominator) ||
          !defined(layerSource.MaxScaleDenominator) ||
          layerSource.MaxScaleDenominator >=
            ckanGroup.minimumMaxScaleDenominator
        ) {
          resource.__filtered = false;
        } else {
          console.log(
            "Provider Feedback: Filtering out " +
              layerSource.Title +
              " (" +
              layerSource.Name +
              ") because its MaxScaleDenominator is " +
              layerSource.MaxScaleDenominator
          );
        }
      }
    }

    if (layerSource.Layer) {
      filterBasedOnGetCapabilitiesResponse(
        ckanGroup,
        layerSource.Layer,
        resources
      );
    }
  }
}

function createItemFromResource(resource, ckanGroup, itemData, extras, parent) {
  return CkanCatalogItem.createCatalogItemFromResource({
    terria: ckanGroup.terria,
    itemData: itemData,
    resource: resource,
    extras: extras,
    parent: parent,
    ckanBaseUrl: ckanGroup.url,
    wmsResourceFormat: ckanGroup.includeWms
      ? ckanGroup.wmsResourceFormat
      : undefined,
    wfsResourceFormat: ckanGroup.includeWfs
      ? ckanGroup.wfsResourceFormat
      : undefined,
    kmlResourceFormat: ckanGroup.includeKml
      ? ckanGroup.kmlResourceFormat
      : undefined,
    csvResourceFormat: ckanGroup.includeCsv
      ? ckanGroup.csvResourceFormat
      : undefined,
    esriMapServerResourceFormat: ckanGroup.includeEsriMapServer
      ? ckanGroup.esriMapServerResourceFormat
      : undefined,
    esriFeatureServerResourceFormat: ckanGroup.includeEsriFeatureServer
      ? ckanGroup.esriFeatureServerResourceFormat
      : undefined,
    geoJsonResourceFormat: ckanGroup.includeGeoJson
      ? ckanGroup.geoJsonResourceFormat
      : undefined,
    czmlResourceFormat: ckanGroup.includeCzml
      ? ckanGroup.czmlResourceFormat
      : undefined,
    allowWmsGroups: ckanGroup.allowEntireWmsServers,
    allowWfsGroups: ckanGroup.allowEntireWfsServers,
    dataCustodian: ckanGroup.dataCustodian,
    itemProperties: ckanGroup.itemProperties,
    useResourceName: ckanGroup.useResourceName,
    useCombinationNameWhereMultipleResources:
      ckanGroup.useCombinationNameWhereMultipleResources
  });
}
function populateGroupFromResults(ckanGroup, items) {
  var ungrouped;

  for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
    var item = items[itemIndex];

    if (ckanGroup.blacklist && ckanGroup.blacklist[item.title]) {
      console.log(
        "Provider Feedback: Filtering out " +
          item.title +
          " (" +
          item.name +
          ") because it is blacklisted."
      );
      continue;
    }

    var extras = {};
    if (defined(item.extras)) {
      for (var idx = 0; idx < item.extras.length; idx++) {
        extras[item.extras[idx].key] = item.extras[idx].value;
      }
    }

    var resourceItems = [];

    var resources = item.resources;
    for (
      var resourceIndex = 0;
      resourceIndex < resources.length;
      ++resourceIndex
    ) {
      var resource = resources[resourceIndex];

      var groups;
      if (ckanGroup.groupBy === "group") {
        groups = item.groups;
      } else if (ckanGroup.groupBy === "organization" && item.organization) {
        // item.organization is sometimes null
        groups = [item.organization];
      } else {
        groups = undefined;
      }

      var addedItem;

      if (defined(groups) && groups.length > 0) {
        for (var groupIndex = 0; groupIndex < groups.length; ++groupIndex) {
          var group = groups[groupIndex];
          var groupName = group.display_name || group.title;
          var groupId = ckanGroup.uniqueId + "/" + group.id;

          if (ckanGroup.blacklist && ckanGroup.blacklist[groupName]) {
            continue;
          }

          var groupToAdd = ckanGroup.terria.catalog.shareKeyIndex[groupId];
          var updating = defined(groupToAdd);

          if (!defined(groupToAdd)) {
            groupToAdd = new CatalogGroup(ckanGroup.terria);
            groupToAdd.name = groupName;
            groupToAdd.id = groupId;
          }

          addedItem = addItem(resource, ckanGroup, item, extras, groupToAdd);

          if (!updating && groupToAdd.items.length) {
            ckanGroup.add(groupToAdd);
          }
        }
      } else {
        if (!ckanGroup.ungroupedTitle) {
          addedItem = addItem(resource, ckanGroup, item, extras, ckanGroup);
        } else {
          if (!defined(ungrouped)) {
            ungrouped = new CatalogGroup(ckanGroup.terria);
            ungrouped.name = ckanGroup.ungroupedTitle;
            ungrouped.id = ckanGroup.uniqueId + "/_ungrouped";
            ckanGroup.add(ungrouped);
          }
          addedItem = addItem(resource, ckanGroup, item, extras, ungrouped);
        }
      }

      if (defined(addedItem)) {
        resourceItems.push(addedItem);
      }
    }

    // If there's more than one resource item, and we're not using the resource name to name
    // our items, then they'll all have the same name.  Add the type to the name to help
    // distinguish them.
    if (resourceItems.length > 1 && !ckanGroup.useResourceName) {
      resourceItems.forEach(function(item) {
        var typeName =
          CkanCatalogItem.shortHumanReadableTypeNames[item.type] || "Other";
        item.name += " (" + typeName + ")";
      });
    }
  }

  function compareNames(a, b) {
    var aName = a.name.toLowerCase();
    var bName = b.name.toLowerCase();
    if (aName < bName) {
      return -1;
    } else if (aName > bName) {
      return 1;
    } else {
      return 0;
    }
  }

  ckanGroup.items.sort(compareNames);

  for (var i = 0; i < ckanGroup.items.length; ++i) {
    if (defined(ckanGroup.items[i].items)) {
      ckanGroup.items[i].items.sort(compareNames);
    }
  }
}

/**
 * Creates a catalog item from the supplied resource and adds it to the supplied parent if necessary..
 * @private
 * @param resource The Ckan resource
 * @param rootCkanGroup The root group of all items in this Ckan hierarchy
 * @param itemData The data of the item to build the catalog item from
 * @param extras
 * @param parent The parent group to add the item to once it's constructed - set this to rootCkanGroup for flat hierarchies.
 * @returns {CatalogItem} The catalog item added, or undefined if no catalog item was added.
 */
function addItem(resource, rootCkanGroup, itemData, extras, parent) {
  var item =
    rootCkanGroup.terria.catalog.shareKeyIndex[
      parent.uniqueId + "/" + resource.id
    ];
  var alreadyExists = defined(item);

  if (!alreadyExists) {
    item = createItemFromResource(
      resource,
      rootCkanGroup,
      itemData,
      extras,
      parent
    );

    if (item) {
      parent.add(item);
    }
  }

  return item;
}

module.exports = CkanCatalogGroup;
