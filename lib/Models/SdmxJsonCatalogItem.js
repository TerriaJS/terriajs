"use strict";

/*global require*/
var Mustache = require("mustache");
var URI = require("urijs");
var naturalSort = require("javascript-natural-sort");
naturalSort.insensitive = true;

var clone = require("terriajs-cesium/Source/Core/clone").default;
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;
var defined = require("terriajs-cesium/Source/Core/defined").default;

var deprecationWarning = require("terriajs-cesium/Source/Core/deprecationWarning")
  .default;

var knockout = require("terriajs-cesium/Source/ThirdParty/knockout").default;
var loadJson = require("../Core/loadJson");
var loadSdmxStructureJson = require("../Core/loadSdmxStructureJson");
var loadSdmxDataJson = require("../Core/loadSdmxDataJson");
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var arrayProduct = require("../Core/arrayProduct");
var DisplayVariablesConcept = require("../Map/DisplayVariablesConcept");
var inherit = require("../Core/inherit");
var overrideProperty = require("../Core/overrideProperty");
var proxyCatalogItemUrl = require("./proxyCatalogItemUrl");
var RegionMapping = require("../Models/RegionMapping");
var runLater = require("../Core/runLater");
var sdmxJsonLib = require("../ThirdParty/sdmxjsonlib");
var SummaryConcept = require("../Map/SummaryConcept");
var TableCatalogItem = require("./TableCatalogItem");
var TableColumn = require("../Map/TableColumn");
var TableStructure = require("../Map/TableStructure");
var TerriaError = require("../Core/TerriaError");
var VariableConcept = require("../Map/VariableConcept");
var VarType = require("../Map/VarType");

/**
 * A {@link CatalogItem} representing region-mapped data obtained from SDMX-JSON format.
 *
 * Descriptions of this format are available at:
 * - https://data.oecd.org/api/sdmx-json-documentation/
 * - https://github.com/sdmx-twg/sdmx-json/tree/master/data-message/docs
 * - https://sdmx.org/
 * - http://stats.oecd.org/sdmx-json/ (hosts a handy query builder)
 *
 * The URL can be of two types, eg:
 * 1. http://example.com/sdmx-json/data/DATASETID/BD1+BD2.LGA.1+2.A/all?startTime=2013&endTime=2013
 * 2. http://example.com/sdmx-json/data/DATASETID
 *
 * For #2, the dimension names and codes come from (in json format):
 * http://example.com/sdmx-json/dataflow/DATASETID
 *
 * @alias SdmxJsonCatalogItem
 * @constructor
 * @extends TableCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var SdmxJsonCatalogItem = function(terria, url) {
  TableCatalogItem.call(this, terria, url);

  // We will override item.url to show a custom URL in About This Dataset.
  // So save the original URL here.
  this._originalUrl = url;

  // The options that should be passed to TableColumn when creating a new column.
  this._columnOptions = undefined;

  // Allows conversion between the dimensions and the table columns.
  this._allDimensions = undefined;
  this._loadedDimensions = undefined;

  // Keep track of whether how many columns appear before the value columns (typically a time and a region column).
  this._numberOfInitialColumns = undefined;

  // Holds the time_period and region ids, ie. by default ["TIME_PERIOD", "REGION"].
  this._suppressedIds = [];

  // This is set to the dataflow URL for this data, if relevant.
  this._dataflowUrl = undefined;

  // The array of Concepts to display in the NowViewing panel.
  this._concepts = [];

  // An object containing all the region totals (eg. populations) required, keyed by the dimensionIdsRequestString used.
  this._regionTotals = {};

  /**
   * Gets or sets the 'data' SDMX URL component, eg. 'data' in http://stats.oecd.org/sdmx-json/data/QNA.
   * Defaults to 'data'.
   * @type {String}
   */
  this.dataUrlComponent = undefined;

  /**
   * Gets or sets the SDMX version number
   * Defaults to 2.0.
   * @type {Number}
   */
  this.sdmxVersionNumber = undefined;

  /**
   * Gets or sets the measure dimension id
   * Defaults to 'MEASURE'.
   * @type {String}
   */
  this.measureDimensionId = undefined;

  /**
   * Gets or sets the 'dataflow' SDMX URL component, eg. 'dataflow' in http://stats.oecd.org/sdmx-json/dataflow/QNA.
   * Defaults to 'dataflow'.
   * @type {String}
   */
  this.dataflowUrlComponent = undefined;

  /**
   * Gets or sets the provider id in the SDMX URL, eg. the final 'all' in http://stats.oecd.org/sdmx-json/data/QNA/.../all.
   * Defaults to 'all'.
   * @type {String}
   */
  this.providerId = undefined;

  /**
   * Gets or sets the SDMX region-type dimension id used with the region code to set the region type.
   * Usually defaults to 'REGIONTYPE'.
   * @type {String}
   */
  this.regionTypeDimensionId = undefined;

  /**
   * Gets or sets the SDMX region dimension id, which is not displayed as a user-choosable dimension. Defaults to 'REGION'.
   * @type {String}
   */
  this.regionDimensionId = undefined;

  /**
   * Gets or sets the SDMX frequency dimension id. Defaults to 'FREQUENCY'.
   * @type {String}
   */
  this.frequencyDimensionId = undefined;

  /**
   * Gets or sets the SDMX time period dimension id, which is not displayed as a user-choosable dimension. Defaults to 'TIME_PERIOD'.
   * @type {String}
   */
  this.timePeriodDimensionId = undefined;

  /**
   * Gets or sets the regiontype directly, which is an alternative to including a regiontype in the data.
   * Eg. "cnt3" would tell us that we should use cnt3 as the table column name.
   * By default this is undefined.
   * @type {String}
   */
  this.regionType = undefined;

  /**
   * Gets or sets a Mustache template used to turn the name of the region provided in the "regionType" variable
   * into a csv-geo-au-compliant column name. The Mustache variable "{{name}}" holds the original name.
   * You can use this to specify a year in the name, even if it is absent on the server.
   * Eg. "{{name}}_code_2016" converts STE to STE_code_2016.
   * By default this is undefined. If it is undefined, the following rules are applied:
   *   - If there's a _, replace the last one with _code_; else append _code. So SA4 -> SA4_code; SA4_2011 -> SA4_code_2011.
   *   - If the name ends in 4 digits without an underscore, insert "_code_", eg. LGA2011 -> LGA_code_2011.
   * @type {String}
   */
  this.regionNameTemplate = undefined;

  /**
   * Gets or sets the concepts which are initially selected, eg. {"MEASURE": ["GDP", "GNP"], "FREQUENCY": ["A"]}.
   * Defaults to the first value in each dimension (when undefined).
   * @type {Object}
   */
  this.selectedInitially = undefined;

  /**
   * Gets or sets the dimensions for which you can only select a single value at a time.
   * The frequency and regiontype dimensions are added to this list in allSingleValuedDimensionIds.
   * @type {String[]}
   */
  this.singleValuedDimensionIds = [];

  /**
   * Gets or sets the startTime to use as part of the ?startTime=...&endTime=... query parameters.
   * Currently a string, but could be extended to be an object with frequency codes as keys.
   * By default this is undefined, and not used as part of the query.
   * @type {String}
   */
  this.startTime = undefined;

  /**
   * Gets or sets the endTime to use as part of the ?startTime=...&endTime=... query parameters.
   * Currently a string, but could be extended to be an object with frequency codes as keys.
   * By default this is undefined, and not used as part of the query.
   * @type {String}
   */
  this.endTime = undefined;

  /**
   * Gets or sets each dimension's allowed values, by id. Eg. {"SUBJECT": ["GDP", "GNP"], "FREQUENCY": ["A"]}.
   * If not defined, all values are allowed.
   * If a dimension is not present, all values for that dimension are allowed.
   * Note this will not be applied to regions or time periods.
   * The expression is first matched as a regular expression (sandwiched between ^ and &);
   * if that fails, it is matched as a literal string.  So eg. "[0-9]+" will match 015 but not A015.
   * @type {Object}
   */
  this.whitelist = {};

  /**
   * Gets or sets each dimension's non-allowed values, by id. Eg. {"COB": ["TOTAL", "1"], "FREQUENCY": ["Q"]}.
   * If not defined, all values are allowed (subject to the whitelist).
   * If a dimension is not present, all values for that dimension are allowed (subject to the whitelist).
   * Note this will not be applied to regions or time periods.
   * If the same value is in both the whitelist and the blacklist, the blacklist wins.
   * The expression is first matched as a regular expression (sandwiched between ^ and &);
   * if that fails, it is matched as a literal string.  So eg. "[0-9]+" will match 015 but not A015.
   * @type {Object}
   */
  this.blacklist = {};

  /**
   * Gets or sets an array of dimension ids whose values should not be shown in the Now Viewing panel;
   * instead, their values should be aggregated and treated as a single value.
   * Eg. useful if a dimension is repeated (eg. STATE and REGION).
   * NOTE: Currently only a single aggregatedDimensionId is supported.
   * This should not be applied to regions or time periods.
   * @type {Object}
   */
  this.aggregatedDimensionIds = [];

  /**
   * Gets or sets how to re-sort the values that appear in the SDMX-JSON response, in the Now Viewing panel.
   * The default is null, so that the order is maintained (except for totalValueIds, which are moved to the top).
   * By setting this to 'name' or 'id', the values are sorted into alphabetical and/or numerical order either by name or by id,
   * respectively.
   * @type {String}
   */
  this.sortValues = null;

  /**
   * Gets or sets value ids for each dimension which correspond to total values.
   * Place the grand total first.
   * If all dimensions (except region-type, region and frequency) have totals
   * available, then a "Display as a percentage of regional total" option becomes available.
   * Eg. Suppose AGE had "10" for 10 year olds, etc, plus "ALL" for all ages, "U21" and "21PLUS" for under and over 21 year olds.
   * Then you would want to specify {"AGE": ["ALL", "U21", "21PLUS"]}.
   * In this case, when the user selects one of these values, any other values will be unselected.
   * And when the user selects any other value (eg. "10"), if any of these values were selected, they will be unselected.
   * In addition, any values provided under a wildcard "*" key are used for _all_ dimensions, and are shown first in the list,
   * if present, eg. {"*": ["ALL"], "AGE": ["U21", "21PLUS"]}.
   * @type {Object}
   */
  this.totalValueIds = {};

  /**
   * Gets or sets whether to remove trailing "(x)"s from the values that appear in the SDMX-JSON response.
   * If true, for example, "Total responses(c)" would be replaced with "Total responses".
   * This is a workaround for an ABS-specific issue.
   * Default false.
   * @type {Boolean}
   */
  this.cleanFootnotes = false;

  /**
   * Gets or sets whether this item can show percentages instead of raw values.
   * This is set to true automatically if total value ids are available on all necessary columns.
   * This property is observable.
   * @type {Boolean}
   * @default false
   */
  this.canDisplayPercent = false;

  /**
   * Gets or sets whether to show percentages or raw values.  This property is observable.
   * @type {Boolean}
   * @default false
   */
  this.displayPercent = false;

  /**
   * Gets or sets a mapping of concept ids to arrays of values which, if selected, mean the results cannot be summed.
   * If one of these values is chosen:
   * - Does not show the "canDisplayPercent" option.
   * - Explains to the user that it can't show multiple values of concepts.
   * eg. {"MEASURE": ["rate"]}.
   * Can also be the boolean "true", if it should apply to all selections.
   * Defaults to none.
   * @type {Object|Boolean}
   */
  this.cannotSum = undefined;

  /**
   * Deprecated. Use cannotSum instead.
   * Defaults to none.
   * @type {Object}
   */
  this.cannotDisplayPercentMap = undefined;

  /**
   * Gets or sets a flag which determines whether the legend comes before (false) or after (true) the display variable choice.
   * Default true.
   * @type {Boolean}
   */
  this.displayChoicesBeforeLegend = true;

  /**
   * Gets or sets an array of dimension ids which, if present, should be shown to the user, even if there is only one value.
   * This is useful if the name of the dataset doesn't convey what is in it, but one of the dimension values does. Eg. ['MEASURE'].
   * Default [].
   * @type {Boolean}
   */
  this.forceShowDimensionIds = [];

  // Tracking _concepts makes this a circular object.
  // _concepts (via concepts) is both set and read in rebuildData.
  // A solution to this would be to make concepts a Promise, but that would require changing the UI side.
  knockout.track(this, ["_concepts", "displayPercent", "canDisplayPercent"]);

  overrideProperty(this, "concepts", {
    get: function() {
      return this._concepts;
    }
  });

  // See explanation in the comments for TableCatalogItem.
  overrideProperty(this, "dataViewId", {
    get: function() {
      // We need an id that depends on the selected concepts. Just use the dimensionRequestString.
      return calculateDimensionRequestString(
        this,
        calculateActiveConceptIds(this) || [],
        this._fullDimensions || []
      );
    }
  });

  knockout.defineProperty(this, "activeConcepts", {
    get: function() {
      const isActive = concept => concept.isActive;
      if (defined(this._concepts) && this._concepts.length > 0) {
        return this._concepts.map(concept => concept.getNodes(isActive));
      }
      return undefined;
    }
  });

  knockout.getObservable(this, "activeConcepts").subscribe(function() {
    if (!this.isLoading) {
      // Defer the execution of this so that other knockout observables are updated when we look at them.
      // In particular, DisplayVariablesConcept's activeItems.
      runLater(() => changedActiveItems(this));
    }
  }, this);

  knockout
    .getObservable(this, "canDisplayPercent")
    .subscribe(function(canDisplayPercent) {
      // If canDisplayPercent becomes false, must also turn off displayPercent.
      if (!canDisplayPercent) {
        this.displayPercent = false;
      }
    }, this);

  knockout
    .getObservable(this, "displayPercent")
    .subscribe(function(displayPercent) {
      var item = this;
      if (defined(item._tableStructure)) {
        item._tableStructure.columns.forEach(function(column) {
          if (displayPercent) {
            column.isActive = column.id === "region percent";
          } else {
            if (item._concepts.length > 0) {
              column.isActive = column.id === "total selected";
            }
            // An example without concepts can only display one thing, so cannot calculate any regional totals.
          }
        });
      }
    }, this);
};

inherit(TableCatalogItem, SdmxJsonCatalogItem);

Object.defineProperties(SdmxJsonCatalogItem.prototype, {
  /**
   * Gets the type of data member represented by this instance.
   * @memberOf SdmxJsonCatalogItem.prototype
   * @type {String}
   */
  type: {
    get: function() {
      return "sdmx-json";
    }
  },

  /**
   * Gets a human-readable name for this type of data source, 'SDMX-JSON'.
   * @memberOf SdmxJsonCatalogItem.prototype
   * @type {String}
   */
  typeName: {
    get: function() {
      return "SDMX-JSON";
    }
  },

  /**
   * Gets the set of names of the properties to be serialized for this object for a share link.
   * @memberOf ImageryLayerCatalogItem.prototype
   * @type {String[]}
   */
  propertiesForSharing: {
    get: function() {
      return SdmxJsonCatalogItem.defaultPropertiesForSharing;
    }
  },

  /**
   * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
   * When a property name on the model matches the name of a property in the serializers object literal,
   * the value will be called as a function and passed a reference to the model, a reference to the destination
   * JSON object literal, and the name of the property.
   * @memberOf SdmxJsonCatalogItem.prototype
   * @type {Object}
   */
  serializers: {
    get: function() {
      return SdmxJsonCatalogItem.defaultSerializers;
    }
  },

  /**
   * Gets the list of singleValuedDimensionIds with the frequency and region type included.
   * @memberOf SdmxJsonCatalogItem.prototype
   * @type {String[]}
   */
  allSingleValuedDimensionIds: {
    get: function() {
      return [this.regionTypeDimensionId, this.frequencyDimensionId].concat(
        this.singleValuedDimensionIds
      );
    }
  },

  /**
   * Gets the original URL of this item.
   * @memberOf SdmxJsonCatalogItem.prototype
   * @type {String}
   */
  originalUrl: {
    get: function() {
      return defaultValue(this._originalUrl, this.url);
    }
  }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
SdmxJsonCatalogItem.defaultPropertiesForSharing = clone(
  TableCatalogItem.defaultPropertiesForSharing
);
SdmxJsonCatalogItem.defaultPropertiesForSharing.push("selectedInitially");
SdmxJsonCatalogItem.defaultPropertiesForSharing.push("displayPercent");
Object.freeze(SdmxJsonCatalogItem.defaultPropertiesForSharing);

SdmxJsonCatalogItem.defaultSerializers = clone(
  TableCatalogItem.defaultSerializers
);
SdmxJsonCatalogItem.defaultSerializers.selectedInitially = function(
  item,
  json
) {
  // Create the 'selectedInitially' that would start us off with the same active items as are currently shown.
  json.selectedInitially = {};
  if (item._concepts.length === 0) {
    return;
  }
  item._concepts[0].items.forEach(function(displayConcept) {
    json.selectedInitially[displayConcept.id] = displayConcept.items
      .filter(function(concept) {
        return concept.isActive;
      })
      .map(function(concept) {
        return concept.id;
      });
  });
};
SdmxJsonCatalogItem.defaultSerializers.activeConcepts = function() {
  // Don't serialize.
};
SdmxJsonCatalogItem.defaultSerializers.url = function(item, json) {
  // Put the original URL back in as the url when serializing.
  json.url = item.originalUrl;
};
Object.freeze(SdmxJsonCatalogItem.defaultSerializers);

// Just the items that would influence the load from the server or the file
SdmxJsonCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
  // Reply with the item's url, which is saved into originalUrl during the load process, and overwritten.
  return [this.originalUrl];
};

// The URL can have two different forms, which require different handling.
// 1. http://stat.abs.gov.au/sdmx-json/data/ABS_REGIONAL_LGA/CABEE_2.LGA2013.1+.A/all?startTime=2013&endTime=2013
//    Read data from this URL directly and construct the table and concepts from it.
// 2. http://stat.abs.gov.au/sdmx-json/data/ABS_REGIONAL_LGA
//    Do not attempt to hit this URL directly.
//    Instead get the concepts from .../dataflow/ABS_REGIONAL_LGA, and then, whenever the active concepts are changed,
//    construct a specific URL like in #1 from those concepts, load the data from it, and construct a table.
//    If no 'dataflow' URL is recognizable, revert to #1 behaviour.
// If the URL fits neither form, assume it is a datafile to be handled like #1.
// You can also force the #1 behaviour by blanking out item.dataflowUrlComponent.
// This function returns undefined for #1, and the dataflow URL for #2.
function getDataflowUrl(item) {
  if (!item.dataflowUrlComponent) {
    return;
  }
  var dataUrlComponent = "/" + item.dataUrlComponent + "/";
  var dataUrlIndex = item._originalUrl.lastIndexOf(dataUrlComponent);
  // If the URL contains /data/, look for how many / terms come after it.
  if (dataUrlIndex >= 0) {
    var suffix = item._originalUrl.slice(
      dataUrlIndex + dataUrlComponent.length
    );
    // eg. suffix would be ABS_REGIONAL_LGA/CABEE_2.LGA2013.1+.A/all...
    // If it contains a /, and anything after the /, then treat it as #1.
    if (suffix.indexOf("/") >= 0 && suffix.indexOf("/") < suffix.length - 1) {
      return;
    } else if (item.sdmxVersionNumber !== 2.0) {
      return `${item.restEndpointRoot}${item.dataflowUrlComponent}/${
        item.agencyId
      }/${item.flowId}/${
        item.dataflowVersion
      }/?references=all&detail=referencepartial`;
    } else {
      // return the same URL but with /data/ replaced with /dataflow/.
      var dataflowUrlComponent = "/" + item.dataflowUrlComponent + "/";
      return item._originalUrl.replace(dataUrlComponent, dataflowUrlComponent);
    }
  }
}

// https://github.com/sdmx-twg/sdmx-rest/blob/master/v2_1/ws/rest/docs/4_4_data_queries.md#parameters-used-for-identifying-a-resource
function parseResourceComponents(item) {
  const uri = new URI(item.url);
  const segments = uri.segment();

  const flowRef = segments[segments.length - 1].split(",");
  if (flowRef.length === 1) {
    item.flowId = flowRef[0];
  } else if (flowRef.length === 1) {
    item.agencyId = flowRef[0];
    item.flowId = flowRef[1];
  } else {
    item.agencyId = flowRef[0];
    item.flowId = flowRef[1];
    item.dataflowVersion = flowRef[2];
  }
}

// return something like https://stats.spc.int/SeptemberDisseminateNSIService/Rest/
function parseEndpointRoot(item) {
  return item.url.split("Rest")[0].concat("Rest/");
}

/*
 * We access:
 *   - result.structure.dimensions.observation[k] for {keyPosition, id, name, values[]}
 *         to get the name & id of dimension keyPosition and its array of allowed values (with {id, name}).
 *   - result.structure.dimensions.attributes.dataSet
 *         can have units, unit multipliers, reference periods (eg. http://stats.oecd.org/sdmx-json/dataflow/QNA).
 *   - result.structure.dimensions.attributes.observation
 *         can have time formats and status (eg. estimated value, forecast value).
 *
 * (Alternatively, in xml format):
 * http://stats.oecd.org/restsdmx/sdmx.ashx/GetDataStructure/<dataset id> (eg. QNA).
 *
 * Data comes from:
 * http://example.com/sdmx-json/data/<dataset identifier>/<filter expression>/<agency name>[ ?<additional parameters>]
 *
 * Eg.
 * http://stats.oecd.org/sdmx-json/data/QNA/AUS+AUT.GDP+B1_GE.CUR+VOBARSA.Q/all?startTime=2009-Q2&endTime=2011-Q4
 *
 * An example from the ABS could be:
 * http://stat.abs.gov.au/sdmx-json/data/ABS_REGIONAL_LGA/CABEE_2.LGA2013.1+.A/all?startTime=2013&endTime=2013
 *
 * Then access:
 *   - result.structure.dimensions.series[i] for {keyPosition, id, name, values[]}
 *         to get the name & id of dimension keyPosition and its array of allowed values (with {id, name}).
 *   - result.structure.dimensions.observation[i] for {role, id, name, values[]}
 *         to get the name & id of the observations and its array of allowed values (with {id, name}).
 *   - result.dataSets[0].series[key].observations[t][0] with key = "xx:yy:zz"
 *         where xx is the index of a value from dimension 0, etc, and t is the time index (eg. 0 for a single time).
 *
 * Currently, we only parse the first "dataSet" object provided. (This covers all situations of interest to us so far.)
 *
 * Time seems to be handled specially, at least by the OECD.
 * Eg.
 *   http://stats.oecd.org/sdmx-json/dataflow/QNA shows there are 5 dimensions (result.structure.dimensions.observation): LOCATION, SUBJECT, MEASURE, FREQUENCY, TIME_PERIOD.
 *   But http://stats.oecd.org/sdmx-json/data/QNA/.B1_GE.VOBARSA.Q/all only returns 4 dimensions (result.structure.dimensions.series): TIME_PERIOD is gone.
 *   Instead, it has become an observation: result.structure.dimensions.observation[0] has property "values" with lots of {id, name} fields, eg. {id: "1960-Q1", name: "Q1-1960"}.
 *   And result.dataSets[0].series[key].observations[t] has lots of values for different t, not necessarily including t = 0. (eg. key = "21:0:0:0" starts at t = 140).
 */
SdmxJsonCatalogItem.prototype._load = function() {
  parseResourceComponents(this);

  this.restEndpointRoot = defaultValue(
    this.restEndpointRoot,
    parseEndpointRoot(this)
  );

  this.agencyId = defaultValue(this.agencyId, "all");
  this.dataflowVersion = defaultValue(this.dataflowVersion, "latest");

  // Set some defaults.
  this._originalUrl = this.originalUrl; // Since `this.url` is often set after initialization.

  this.sdmxVersionNumber = defaultValue(this.sdmxVersionNumber, 2.0);

  this._getData = this.sdmxVersionNumber === 2.1 ? loadSdmxDataJson : loadJson;
  this._getMetadata =
    this.sdmxVersionNumber === 2.1 ? loadSdmxStructureJson : loadJson;

  this.measureDimensionId = defaultValue(this.measureDimensionId, "MEASURE");
  this.regionTypeDimensionId = defaultValue(
    this.regionTypeDimensionId,
    "REGIONTYPE"
  );
  this.regionDimensionId = defaultValue(this.regionDimensionId, "REGION");
  this.frequencyDimensionId = defaultValue(
    this.frequencyDimensionId,
    "FREQUENCY"
  );
  this.timePeriodDimensionId = defaultValue(
    this.timePeriodDimensionId,
    "TIME_PERIOD"
  );
  this.providerId = defaultValue(this.providerId, "all");
  this.dataUrlComponent = defaultValue(this.dataUrlComponent, "data");
  this.dataflowUrlComponent = defaultValue(
    this.dataflowUrlComponent,
    "dataflow"
  );
  // cannotDisplayPercentMap is deprecated. Replace it with cannotSum.
  if (defined(this.cannotDisplayPercentMap)) {
    deprecationWarning(
      "cannotDisplayPercentMap is deprecated. Use cannotSum instead."
    );
    if (!defined(this.cannotSum)) {
      this.cannotSum = this.cannotDisplayPercentMap;
    }
  }

  this._suppressedIds = [this.regionDimensionId, this.timePeriodDimensionId];

  var tableStyle = this._tableStyle;
  this._columnOptions = {
    displayDuration: tableStyle.displayDuration,
    displayVariableTypes: TableStructure.defaultDisplayVariableTypes,
    replaceWithNullValues: tableStyle.replaceWithNullValues,
    replaceWithZeroValues: tableStyle.replaceWithZeroValues
  };

  // We pass column options to TableStructure too, but they only do anything if TableStructure itself (eg. via fromJson) adds the columns,
  // which is not the case here.  We will need to pass them to each call to new TableColumn as well.
  this._tableStructure = new TableStructure(this.name, this._columnOptions);
  this._regionMapping = new RegionMapping(
    this,
    this._tableStructure,
    tableStyle
  );

  this._dataflowUrl = getDataflowUrl(this);
  if (!defined(this.metadataUrl)) {
    this.metadataUrl = this._dataflowUrl; // So a link to the metadata appears in About This Dataset.
  }
  if (this._dataflowUrl) {
    return loadDataflow(this); // This eventually triggers loadAndBuildTable too, via changedActiveItem.
  } else {
    return loadAndBuildTable(this);
  }
};

// Sets the tableStructure's columns to the new columns, redraws the map, and closes the feature info panel.
function updateColumns(item, newColumns) {
  item._tableStructure.columns = newColumns;
  if (item._tableStructure.columns.length === 0) {
    // Nothing to show, so the attempt to redraw will fail; need to explicitly hide the existing regions.
    item._regionMapping.hideImageryLayer();
    item.terria.currentViewer.notifyRepaintRequired();
  }
  // Close any picked features, as the description of any associated with this catalog item may change.
  item.terria.pickedFeatures = undefined;
}

// Adds the wildcard's exclusive values to the front of those for this dimension id, if any.
function getTotalValueIdsForDimensionId(item, dimensionId) {
  return (item.totalValueIds["*"] || []).concat(
    item.totalValueIds[dimensionId] || []
  );
}

// Trims spaces off rawName
// If cleanFootnotes is true, also removes trailing (x)'s, eg. Total(c) => Total.
function renameValue(item, rawName) {
  var trimmedName = rawName.trim();
  if (item.cleanFootnotes) {
    var length = trimmedName.length;
    if (
      trimmedName.indexOf("(") === length - 3 &&
      trimmedName.indexOf(")") === length - 1
    ) {
      return trimmedName.slice(0, length - 3);
    }
  }
  return trimmedName;
}

/**
 * Returns an array whose elements are objects describing each dimension.
 * The array has length structureSeries.length (assuming the keyPositions are correct),
 * and the index of each element is its keyPosition.
 * Each element is an object with the properties:
 *   - dimensionId
 *   - dimensionName
 *   - values: An array whose elements describe each allowed value of the dimension (eg. countries, measurement types).
 *             Each element is an object with the properties:
 *             - id
 *             - name
 * If there is a whitelist, only the whitelisted values are included.
 * If there is a blacklist, blacklisted values are excluded.
 * @private
 * @param  {SdmxJsonCatalogItem} item The SDMX-JSON catalog item.
 * @param  {Array} structureSeries The structure's series property, json.structure.dimensions.series.
 * @return {Object[]} A description of the dimensions.
 */
function buildDimensions(item, structureSeries) {
  // getFilter returns a function which can be used in list.filter().
  // It tests if the value is in the given list, using regexps if possible.
  // filterList can be either item.whitelist or item.blacklist.
  // set isWhiteList false if is blacklist, so that the return values are negated (except for a missing list).
  function getFilter(filterList, dimensionId, isWhiteList) {
    var thisIdsFilterList = filterList[dimensionId];
    if (!defined(thisIdsFilterList)) {
      return function() {
        return true;
      };
    }
    try {
      var thisIdsRegExps = thisIdsFilterList.map(
        string => new RegExp("^" + string + "$")
      );
      return function(value) {
        // Test as a straight string, and if that fails, as a regular expression.
        var isPresent =
          thisIdsFilterList.indexOf(value.id) >= 0 ||
          thisIdsRegExps.map(regExp => value.id.match(regExp)).some(defined);
        if (isWhiteList) {
          return isPresent;
        }
        return !isPresent;
      };
    } catch (e) {
      // Cannot intepret as a regular expression.
      // Eg. "[" causes Uncaught SyntaxError: Invalid regular expression: /[/: Unterminated character class(…)),
      // So just test as a string.
      return function(value) {
        var isPresent = thisIdsFilterList.indexOf(value.id) >= 0;
        if (isWhiteList) {
          return isPresent;
        }
        return !isPresent;
      };
    }
  }
  var result = [];
  for (var i = 0; i < structureSeries.length; i++) {
    var thisSeries = structureSeries[i];
    var keyPosition = defined(thisSeries.keyPosition)
      ? thisSeries.keyPosition
      : i; // Since time_period can be an observation, without a keyPosition.
    var values = thisSeries.values
      .filter(getFilter(item.whitelist, thisSeries.id, true))
      .filter(getFilter(item.blacklist, thisSeries.id, false));
    if (item.sortValues === "id") {
      values = values.sort((a, b) => naturalSort(a.id, b.id));
    } else if (item.sortValues === "name" || item.sortValues === true) {
      values = values.sort((a, b) => naturalSort(a.name, b.name));
    }
    moveTotalValueIdsToFront(
      values,
      getTotalValueIdsForDimensionId(item, thisSeries.id)
    );
    result[keyPosition] = {
      id: thisSeries.id,
      name: thisSeries.name,
      // Eg. values: [{id: "BD_2", name: "Births"}, {id: "BD_4", name: "Deaths"}].
      values: values
    };
  }
  return result;
}

function getCodeListById(name, codelists) {
  for (var i = 0; i < codelists.length; i++) {
    if (codelists[i].id === "CL_" + name) return codelists[i];
  }
  return null;
}

function buildStructureSeriesForVersion21(dataflowJson) {
  const out = [];
  for (
    var i = 0;
    i <
    dataflowJson.dataStructures[0].dataStructureComponents.dimensionList
      .dimensions.length;
    i++
  ) {
    var dim =
      dataflowJson.dataStructures[0].dataStructureComponents.dimensionList
        .dimensions[i];
    const cl = getCodeListById(dim.id, dataflowJson.codelists);
    const dimObj = {
      keyPosition: dim.position,
      id: dim.id,
      name: cl.name.en
    };
    dimObj.values = cl.codes.map(function(code) {
      return {
        id: code.id,
        name: code.name.en
      };
    });
    out.push(dimObj);
  }
  return out;
}

function moveTotalValueIdsToFront(values, totalValueIds) {
  if (defined(totalValueIds)) {
    // Go in reverse order so the first one in the list ends up in the front at the end.
    // Not all exclusive values need be present.
    for (var j = totalValueIds.length - 1; j >= 0; j--) {
      var exclusiveValue = totalValueIds[j];
      var currentIndex = values.map(value => value.id).indexOf(exclusiveValue);
      if (currentIndex >= 0) {
        // Move it to the top.
        values.splice(0, 0, values.splice(currentIndex, 1)[0]);
      }
    }
  }
}

// Return dimensions, but removing:
//   - suppressed dimensions,
//   - dimensions with only one value in fullDimensions (unless they are in the force-show list)
//   - aggregated dimensions.
// Dimensions and fullDimensions must have the same ordering of dimensions.
function getShownDimensions(item, dimensions, fullDimensions) {
  return dimensions.filter(function(dimension, i) {
    return (
      item._suppressedIds.indexOf(dimension.id) === -1 &&
      // note the logic of the next line is repeated in calculateDimensionRequestString
      (fullDimensions[i].values.length > 1 ||
        item.forceShowDimensionIds.indexOf(dimension.id) >= 0) &&
      item.aggregatedDimensionIds.indexOf(dimension.id) === -1
    );
  });
}

/**
 * Calculates all the combinations of values that should appear as either:
 *   - columns in our table (by passing the "loadedDimensions" for a given dataset), or
 *   - concepts in the Now Viewing panel (by passing the "fullDimensions", ie. those from the dataflow.)
 * Does not include suppressed (ie. region or time_period) values.
 * Returns an object with properties:
 *   names: An array, each element of which is an array of the names of each relevant dimension value.
 *   ids:   An array, each element of which is an array of the ids of each relevant dimension value.
 * @private
 * @param  {SdmxJsonCatalogItem} item The catalog item.
 * @param {Object[]} dimensions The output of buildDimensions, either fullDimensions or loadedDimensions.
 * @param {Object[]} fullDimensions The output of buildDimensions on the dataflow result (or data if no dataflow). Defaults to dimensions.
 * @return {Object} The values and names of the dimensions to be shown.
 */
function calculateShownDimensionCombinations(item, dimensions, fullDimensions) {
  // Note we need to suppress the time dimension from the dimension list, if any; it appears as an observation instead.
  // We also need to suppress the regions.
  // Convert the values into all the combinations we'll need to load into columns,
  // eg. [[0], [0], [0, 1, 2], [0, 1]] => [[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 2, 0], [0, 0, 2, 1]].
  if (!defined(fullDimensions)) {
    fullDimensions = dimensions;
  }
  var valuesArrays = getShownDimensions(item, dimensions, fullDimensions).map(
    function(dimension) {
      return dimension.values;
    }
  );

  var idsArrays = valuesArrays.map(function(values) {
    return values.map(function(value) {
      return value.id;
    });
  });
  var namesArrays = valuesArrays.map(function(values) {
    return values.map(function(value) {
      return value.name;
    });
  });
  return {
    ids: arrayProduct(idsArrays),
    names: arrayProduct(namesArrays)
  };
}

function getDimensionById(dimensions, id) {
  var result;
  for (var i = 0; i < dimensions.length; i++) {
    if (dimensions[i].id === id) {
      result = dimensions[i];
    }
  }
  return result;
}

function getDimensionIndexById(dimensions, id) {
  var result;
  for (var i = 0; i < dimensions.length; i++) {
    if (dimensions[i].id === id) {
      result = i;
    }
  }
  return result;
}

function getRegionColumnName(item, dimensions, regionTypeIndex) {
  var regionTypeDimension = getDimensionById(
    dimensions,
    item.regionTypeDimensionId
  );
  var regionDimension = getDimensionById(dimensions, item.regionDimensionId);
  if (defined(regionTypeDimension)) {
    // If there is a REGIONTYPE dimension, use its id.
    var regionTypeId = regionTypeDimension.values[regionTypeIndex || 0].id;
    // If there is a regionNameTemplate, apply it to the id.
    if (defined(item.regionNameTemplate)) {
      return Mustache.render(item.regionNameTemplate, { name: regionTypeId });
    }
    // Fall back to this default approach to convert it to csv-geo-au:
    // Assume the raw data is just missing the word "code", eg. SA4 or SA4_2013 should be SA4_code or SA4_code_2013.
    // So, if there's a _, replace the last one with _code_; else append _code.
    // Also handle the case that the raw data ends in 4 digits without the underscore, eg. LGA2011 -> LGA_code_2011.
    var underscoreIndex = regionTypeId.lastIndexOf("_");
    if (underscoreIndex >= 0) {
      return (
        regionTypeId.slice(0, underscoreIndex) +
        "_code" +
        regionTypeId.slice(underscoreIndex)
      );
    } else {
      var fourDigitSuffixMatch = regionTypeId.match(/(.+)([0-9]{4})$/);
      if (defined(fourDigitSuffixMatch)) {
        return fourDigitSuffixMatch[1] + "_code_" + fourDigitSuffixMatch[2];
      }
      return regionTypeId + "_code";
    }
  } else if (defined(regionDimension)) {
    // Else, if there is a REGION dimension and item.regionType has been defined, return item.regionType (and don't append anything).
    if (defined(item.regionType) && defined(item.regionType)) {
      return item.regionType;
    }
    // Else, use the REGION dimension id, if present.
    return regionDimension.id;
  }
}

// If there are times 2010, 2011, and regions AUS, MEX,
// then the table has rows in this order:
// date, region, ...
// 2010, AUS
// 2010, MEX
// 2011, AUS ... etc.
function buildRegionAndTimeColumns(item, dimensions) {
  var regionDimension = getDimensionById(dimensions, item.regionDimensionId);
  var timePeriodDimension = getDimensionById(
    dimensions,
    item.timePeriodDimensionId
  );
  if (!defined(regionDimension) && !defined(timePeriodDimension)) {
    // No region dimension (with the actual region values in it) AND no time dimension - we're done.
    return [];
  }
  var regionValues = [];
  var timePeriodValues = [];
  var regionCount = defined(regionDimension)
    ? regionDimension.values.length
    : 1;
  var timePeriodCount = defined(timePeriodDimension)
    ? timePeriodDimension.values.length
    : 1;
  for (
    var timePeriodIndex = 0;
    timePeriodIndex < timePeriodCount;
    timePeriodIndex++
  ) {
    for (var regionIndex = 0; regionIndex < regionCount; regionIndex++) {
      if (defined(regionDimension)) {
        regionValues.push(regionDimension.values[regionIndex].id);
      }
      if (defined(timePeriodDimension)) {
        timePeriodValues.push(timePeriodDimension.values[timePeriodIndex].id);
      }
    }
  }
  var timePeriodColumn;
  if (defined(timePeriodDimension)) {
    var thisColumnOptions = clone(item._columnOptions);
    if (timePeriodCount === 1) {
      thisColumnOptions.type = VarType.ENUM; // Don't trigger timeline off a single-valued time dimension.
    }
    timePeriodColumn = new TableColumn(
      "date",
      timePeriodValues,
      thisColumnOptions
    );
  }
  if (!defined(regionDimension)) {
    return [timePeriodColumn];
  }
  // If there are multiple region types in the data, only use the first region type.
  var regionColumnName = getRegionColumnName(item, dimensions, 0);
  var regionColumn = new TableColumn(
    regionColumnName,
    regionValues,
    item._columnOptions
  );
  if (defined(timePeriodDimension) && defined(regionDimension)) {
    return [timePeriodColumn, regionColumn];
  } else {
    return [regionColumn];
  }
}

// Sums an array, treating undefined's as 0 in the sum, but leaving undefined + undefined = undefined.
// (Note the "defined" function catches null and defined.)
function sumArray(array) {
  return array.filter(defined).reduce((x, y) => x + y, null);
}

// Eg. ids = ['GDP', 'METHOD-B'].
// We want to map this to an array of ids, eg. ['GDP, 'METHOD-B', undefined, 'LGA', 'A'] for SUBJECT, METHOD, REGION, REGIONTYPE, FREQUENCY (for example),
// with undefined for any suppressed dimensions and values[0] for all single-valued dimensions.
// This can then easily be turned into a colon-separated key.
function mapDimensionValueIdsToKeyValues(item, loadedDimensions, ids) {
  var result = [];
  var shownDimensions = getShownDimensions(
    item,
    loadedDimensions,
    item._fullDimensions
  );
  var shownDimensionIds = shownDimensions.map(function(dimension) {
    return dimension.id;
  });
  for (
    var dimensionIndex = 0;
    dimensionIndex < loadedDimensions.length;
    dimensionIndex++
  ) {
    var outputDimension = loadedDimensions[dimensionIndex];
    var i = shownDimensionIds.indexOf(outputDimension.id);
    if (i >= 0) {
      result.push(ids[i]);
    } else if (item._suppressedIds.indexOf(outputDimension.id) >= 0) {
      result.push(undefined);
    } else {
      result.push(outputDimension.values[0].id);
    }
  }
  return result;
}

// Slightly generalise dataSets[key].obsValue to handle undefined data, and the
// possibility of aggregating across some dimensions.
function getObsValue(item, loadedDimensions, dimensionIndices, dataSets) {
  // Usually no dimensions need to be aggregated, so just return dataSets[key].obsValue.
  var key = dimensionIndices.join(":");
  var valueObject = dataSets[key];
  if (item.aggregatedDimensionIds.length === 0) {
    return defined(valueObject) ? valueObject.obsValue : null;
  }
  // This implementation can handle at most a single aggregated dimension id.
  if (item.aggregatedDimensionIds.length === 1) {
    var aggregatedDimensionId = item.aggregatedDimensionIds[0];
    var valuesToAggregate = [];
    var aggregatedDimensionIndex = getDimensionIndexById(
      loadedDimensions,
      aggregatedDimensionId
    );
    var dimension = getDimensionById(loadedDimensions, aggregatedDimensionId);
    if (!defined(dimension)) {
      console.warn(
        "Tried to aggregate on a dimension that doesn't exist, " +
          aggregatedDimensionId
      );
      return defined(valueObject) ? valueObject.obsValue : null;
    }
    dimension.values.forEach(function(thisValueObject) {
      dimensionIndices[aggregatedDimensionIndex] = thisValueObject.id;
      var thisKey = dimensionIndices.join(":");
      thisValueObject = dataSets[thisKey];
      if (defined(thisValueObject)) {
        valuesToAggregate.push(thisValueObject.obsValue);
      }
    });
    return sumArray(valuesToAggregate);
  }
  console.warn(
    "SDMX-JSON aggregatedDimensionIds - only a single dimension id is implemented."
  );
}

// Create a column for each combination of (non-region) dimension values.
// The column has values for each region.
function buildValueColumns(
  item,
  loadedDimensions,
  columnCombinations,
  dataSets
) {
  var thisColumnOptions = clone(item._columnOptions);
  thisColumnOptions.tableStructure = item._tableStructure;
  var columns = [];
  var hasNoConcepts = item._concepts.length === 0;
  var regionDimension = getDimensionById(
    loadedDimensions,
    item.regionDimensionId
  );
  var regionDimensionIndex = getDimensionIndexById(
    loadedDimensions,
    item.regionDimensionId
  );
  var timePeriodDimension = getDimensionById(
    loadedDimensions,
    item.timePeriodDimensionId
  );
  var timePeriodDimensionIndex = getDimensionIndexById(
    loadedDimensions,
    item.timePeriodDimensionId
  );

  var regionCount = defined(regionDimension)
    ? regionDimension.values.length
    : 1;
  var timePeriodCount = defined(timePeriodDimension)
    ? timePeriodDimension.values.length
    : 1;

  for (
    var combinationIndex = 0;
    combinationIndex < columnCombinations.ids.length;
    combinationIndex++
  ) {
    var ids = columnCombinations.ids[combinationIndex];
    var dimensionIndices = mapDimensionValueIdsToKeyValues(
      item,
      loadedDimensions,
      ids
    );
    // The name is just the joined names of all the columns involved, or 'value' if no columns still have names.
    var combinationName =
      columnCombinations.names[combinationIndex]
        .filter(function(name) {
          return !!name;
        })
        .join(" ") || "Value";
    var combinationId = ids.join(" ") || "Value";
    var values = [];
    for (
      var timePeriodIndex = 0;
      timePeriodIndex < timePeriodCount;
      timePeriodIndex++
    ) {
      for (var regionIndex = 0; regionIndex < regionCount; regionIndex++) {
        if (defined(regionDimensionIndex)) {
          dimensionIndices[regionDimensionIndex] =
            regionDimension.values[regionIndex].id;
        }
        if (defined(timePeriodDimensionIndex)) {
          dimensionIndices[timePeriodDimensionIndex] =
            timePeriodDimension.values[timePeriodIndex].id;
        }
        values.push(
          getObsValue(item, loadedDimensions, dimensionIndices, dataSets)
        );
      }
    }
    thisColumnOptions.id = combinationId; // So we can refer to the dimension in a template by a sequence of ids or names.
    var column = new TableColumn(combinationName, values, thisColumnOptions);
    if (hasNoConcepts) {
      // If there are no concepts displayed to the user, there is only one value column, and we won't add a "total" column.
      // So make this column active.
      column.isActive = true;
    }
    columns.push(column);
  }
  return columns;
}

// Map the active concepts into arrays of arrays of ids.
// Eg. Return [['GDP', 'GNP'], ['Q']].
function calculateActiveConceptIds(item) {
  if (item._concepts.length === 0) {
    return [];
  }
  var conceptItems = item._concepts[0].items;
  return conceptItems.map(parent =>
    // Note this wouldn't work whilst following through on the activeItems knockout subscription,
    // if we hadn't wrapped that in a runLater. You would have had to explicitly call
    // parent.items.filter(concept => concept.isActive).map(concept => concept.id)
    parent.activeItems.map(concept => concept.id)
  );
}

// Map the _total_ concept ids into arrays of (arrays of length 1).
// If a total is not available for a dimension, but it is in singleValuedDimensionIds,
// then use its current value instead - eg. region type, frequency, and some measure types.
// Returns undefined if any concepts do not have a total available.
// Eg. Return [['TOT'], ['3'], ['TOT']].
function calculateTotalConceptIds(item) {
  if (item._concepts.length === 0) {
    return [];
  }
  var conceptItems = item._concepts[0].items;
  var totalConceptIds = conceptItems.map(function(parent) {
    // Because any available totals are sorted to the top of the list of children,
    // and the grand total is always the first one, just check if the first child
    // is in the list of exclusiveChildIds for the parent, and return it if so.
    var firstChildId = parent.items[0].id;
    if (parent.exclusiveChildIds.indexOf(firstChildId) >= 0) {
      return [firstChildId];
    }
    // Dimensions in singleValuedDimensionIds became concepts with allowMultiple false.
    if (!parent.allowMultiple) {
      // Needs runLater for activeItems to work correctly - see comment above.
      return parent.activeItems.map(concept => concept.id);
    }
  });
  // totalConceptIds will have undefined elements if it couldn't find a total for a dimension.
  // Only return the array if every element is defined. Otherwise, return undefined.
  if (totalConceptIds.every(defined)) {
    return totalConceptIds;
  }
  return undefined;
}

// Check if item.selectedInitially has at least one value that exists in dimension.values,
// and if it doesn't, reset item.selectedInitially.
function fixSelectedInitially(item, conceptDimensions) {
  conceptDimensions.forEach(dimension => {
    if (defined(item.selectedInitially)) {
      var thisSelectedInitially = item.selectedInitially[dimension.id];
      if (thisSelectedInitially) {
        var valueIds = dimension.values.map(value => value.id);
        if (
          !thisSelectedInitially.some(
            initialValue => valueIds.indexOf(initialValue) >= 0
          )
        ) {
          console.warn(
            "Ignoring invalid initial selection " +
              thisSelectedInitially +
              " on " +
              dimension.name
          );
          item.selectedInitially[dimension.id] = undefined;
        }
      }
    }
  });
}

// Build out the concepts displayed in the NowViewing panel. Also fixes selectedInitially, if broken.
function buildConcepts(item, fullDimensions) {
  function isInitiallyActive(dimensionId, value, index) {
    if (!defined(item.selectedInitially)) {
      return index === 0;
    }
    var dimensionSelectedInitially = item.selectedInitially[dimensionId];
    if (!defined(dimensionSelectedInitially)) {
      return index === 0;
    }
    return dimensionSelectedInitially.indexOf(value.id) >= 0;
  }

  var conceptDimensions = getShownDimensions(
    item,
    fullDimensions,
    fullDimensions
  );
  fixSelectedInitially(item, conceptDimensions); // Note side-effect.
  var concepts = conceptDimensions.map(function(dimension, i) {
    var allowMultiple =
      item.allSingleValuedDimensionIds.indexOf(dimension.id) === -1;
    var concept = new DisplayVariablesConcept(dimension.name, {
      isOpen: false,
      allowMultiple: allowMultiple,
      requireSomeActive: true,
      exclusiveChildIds: getTotalValueIdsForDimensionId(item, dimension.id)
    });
    concept.id = dimension.id;
    concept.items = dimension.values.map(function(value, index) {
      return new VariableConcept(renameValue(item, value.name), {
        parent: concept,
        id: value.id,
        active: isInitiallyActive(concept.id, value, index)
      });
    });
    return concept;
  });
  if (concepts.length > 0) {
    return [new SummaryConcept(undefined, { items: concepts, isOpen: false })];
  }
  return [];
}

// Returns true if the results of this can be summed meaningfully.
// By default, we assume they can be. But if item.cannotSum is set, at least some selections
// may be rates or averages (rather than counts or totals), which cannot be summed.
function canResultsBeSummed(item) {
  var result = true;
  if (defined(item.cannotSum)) {
    if (typeof item.cannotSum === "object") {
      var conceptItems = item._concepts[0].items;
      conceptItems.forEach(concept => {
        var valuesThatCannotDisplayPercent = item.cannotSum[concept.id];
        if (defined(valuesThatCannotDisplayPercent)) {
          var activeValueIds = concept.activeItems.map(
            activeConcept => activeConcept.id
          );
          if (
            valuesThatCannotDisplayPercent.some(
              cannotValue => activeValueIds.indexOf(cannotValue) >= 0
            )
          ) {
            result = false;
          }
        }
      });
    } else {
      result = !item.cannotSum; // ie. if it is true or false.
    }
  }
  return result;
}

// Only show a warning if more than one value of a concept has been selected.
// Returns true if the user has been warned.
function canTotalBeCalculatedAndIfNotWarnUser(item) {
  if (canResultsBeSummed(item)) {
    return true;
  }
  var conceptItems = item._concepts[0].items;
  var changedActive = [];
  conceptItems.forEach(concept => {
    var numberActive = concept.items.filter(function(subconcept) {
      return subconcept.isActive;
    }).length;
    if (numberActive > 1) {
      changedActive.push('"' + concept.name + '"');
    }
  });
  if (changedActive.length > 0) {
    item.terria.error.raiseEvent(
      new TerriaError({
        sender: item,
        title: "Cannot calculate a total",
        message:
          "You have selected multiple values for " +
          changedActive.join(" and ") +
          ", but the measure you now have chosen cannot be totalled across them. \
            As a result, there is no obvious measure to use to shade the regions (although you can still choose a region to view its data).\
            To see the regions shaded again, please select only one value for " +
          changedActive.join(" and ") +
          ", or select a different measure."
      })
    );
    return false;
  }
  return true;
}

// Create columns for the total selected values.
// If <=1 active column, returns [].
function buildTotalSelectedColumn(item, columnCombinations) {
  // Build a total column equal to the sum of all the active concepts.
  if (!canTotalBeCalculatedAndIfNotWarnUser(item)) {
    return [];
  }
  var thisColumnOptions = clone(item._columnOptions);
  thisColumnOptions.tableStructure = item._tableStructure;
  thisColumnOptions.id = "total selected";
  var activeConceptIds = calculateActiveConceptIds(item);
  if (activeConceptIds.length === 0) {
    return [];
  }
  // Find all the combinations of active concepts.
  // Eg. [['GDP'], ['METHOD-A', 'METHOD-C'], ['Q']] => [['GDP', 'METHOD-A', 'Q'], ['GDP', 'METHOD-C', 'Q']]
  var activeCombinations = arrayProduct(activeConceptIds);
  // Look up which columns these correspond to.
  // Note we need to convert the arrays to strings for indexOf to work.
  // Join with + as we know it cannot appear in an id, since it's used in the URL.
  // (If this string appears in any id, it will confuse things.)
  var joinString = "+";
  var stringifiedCombinations = columnCombinations.ids.map(function(
    combination
  ) {
    return combination.join(joinString);
  });
  var indicesIntoCombinations = activeCombinations.map(function(
    activeCombination
  ) {
    var stringifiedActiveCombination = activeCombination.join(joinString);
    return stringifiedCombinations.indexOf(stringifiedActiveCombination);
  });
  // Slice off the initial region &/or time columns, and only keep the value columns (ignoring total columns which come at the end).
  var valueColumns = item._tableStructure.columns.slice(
    item._numberOfInitialColumns,
    columnCombinations.ids.length + item._numberOfInitialColumns
  );
  var includedColumns = valueColumns.filter(function(column, i) {
    return indicesIntoCombinations.indexOf(i) >= 0;
  });
  if (includedColumns.length === 0) {
    return [];
  }
  var totalColumn = new TableColumn(
    "Total selected",
    TableColumn.sumValues(includedColumns),
    thisColumnOptions
  );
  totalColumn.isActive = !item.displayPercent;
  return totalColumn;
}

function buildPercentColumn(item, totalSelectedColumn, regionTotalColumn) {
  var thisColumnOptions = clone(item._columnOptions);
  thisColumnOptions.tableStructure = item._tableStructure;
  thisColumnOptions.id = "region percent";
  var values = totalSelectedColumn.values.map((totalSelected, index) => {
    var regionTotal = regionTotalColumn.values[index];
    if (!regionTotal) {
      return null; // Return null if the denominator would be zero, null, undefined.
    }
    var fraction = totalSelected / regionTotal;
    return fraction < 0.01
      ? Math.round(fraction * 1000) / 10
      : Math.round(fraction * 10000) / 100;
  });
  var column = new TableColumn(
    "Percent selected in region",
    values,
    thisColumnOptions
  );
  column.isActive = item.displayPercent;
  return column;
}

// Returns the dimension request string, eg. "BD_2+BD_4.LGA_2013..A." appropriate for the active concept values.
// One trick is that the time dimension can appear in the dataflow, but should not be included in the data (or this request string).
// The dimension values need to be in the order of the original dimensions, not the concepts.
// Returns undefined if any dimension has no value selected.
// conceptIds should be the concept ids to load, eg. [['BD_2', 'BD_4'], ['A']].
function calculateDimensionRequestString(item, conceptIds, fullDimensions) {
  var hasAtLeastOneValuePerDimension = conceptIds.every(function(list) {
    return list.length > 0;
  });
  if (!hasAtLeastOneValuePerDimension) {
    return;
  }
  var nextConceptIndex = 0;
  var nonTimePeriodDimensions = fullDimensions.filter(function(dimension) {
    return item.timePeriodDimensionId !== dimension.id;
  });
  var dimensionRequestArrays = nonTimePeriodDimensions.map(function(
    dimension,
    dimensionIndex
  ) {
    if (dimension.id === item.regionDimensionId) {
      return [""]; // A missing id loads all ids.
    }
    if (item.aggregatedDimensionIds.indexOf(dimension.id) >= 0) {
      return [""]; // An aggregated dimension (eg. STATE when there's also LGA) loads all ids.
    }
    if (
      dimension.values.length === 1 &&
      item.forceShowDimensionIds.indexOf(dimension.id) === -1
    ) {
      // These do not appear as concepts - directly supply the only value's id.
      return [dimension.values[0].id];
    }
    return conceptIds[nextConceptIndex++];
  });
  if (dimensionRequestArrays.some(a => !defined(a))) {
    throw new TerriaError({
      sender: item,
      title: "Dimension has no allowed values",
      message:
        "One of this catalog item's dimensions has no allowed values. This can be caused by a badly-formed whitelist."
    });
  }
  return dimensionRequestArrays
    .map(function(values) {
      return values.join("+");
    })
    .join(".");
}

// Called when the active column changes.
// Returns a promise.
function changedActiveItems(item) {
  if (!defined(item._dataflowUrl)) {
    // All the data is already here, just update the total columns.
    var shownDimensionCombinations = calculateShownDimensionCombinations(
      item,
      item._fullDimensions
    );
    var columns = item._tableStructure.columns.slice(
      0,
      shownDimensionCombinations.ids.length + item._numberOfInitialColumns
    );
    if (columns.length > 0) {
      columns = columns.concat(
        buildTotalSelectedColumn(item, shownDimensionCombinations)
      );
      updateColumns(item, columns);
    }
    return when();
  } else {
    // Get the URL for the data request, and load & build the appropriate table.
    var activeConceptIds = calculateActiveConceptIds(item);
    var dimensionRequestString = calculateDimensionRequestString(
      item,
      activeConceptIds,
      item._fullDimensions
    );
    if (!defined(dimensionRequestString)) {
      return; // No value for a dimension, so ignore.
    }
    return loadAndBuildTable(item, dimensionRequestString);
  }
}

// Convert a dimension request string like "a+b+c.d.e+f.g" into a URL.
function getUrlFromDimensionRequestString(item, dimensionRequestString) {
  var url = item._originalUrl;
  if (url[url.length - 1] !== "/") {
    url += "/";
  }
  url +=
    item.sdmxVersionNumber === 2.1
      ? dimensionRequestString + "/"
      : dimensionRequestString + "/" + item.providerId;

  if (defined(item.startTime)) {
    url += "?startTime=" + item.startTime;
    if (defined(item.endTime)) {
      url += "&endTime=" + item.endTime;
    }
  } else if (defined(item.endTime)) {
    url += "?endTime=" + item.endTime;
  }
  return url;
}

// This is called when the URL gives a datasetId, but no specifics.
// We start by loading in the structure (without any data) from the dataflow URL.
function loadDataflow(item) {
  var dataflowUrl =
    item.sdmxVersionNumber === 2.1
      ? proxyCatalogItemUrl(item, item._dataflowUrl)
      : cleanAndProxyUrl(item, item._dataflowUrl);
  return item._getMetadata(dataflowUrl).then(function(json) {
    if (item.sdmxVersionNumber === 2.1) json = json.data;
    // Then access:
    //   - result.structure.dimensions.observation[k] for {keyPosition, id, name, values[]} to get the name & id of dimension keyPosition and its array of allowed values (with {id, name}).
    //   - result.structure.dimensions.attributes.dataSet has some potentially interesting things such as units, unit multipliers, reference periods (eg. http://stats.oecd.org/sdmx-json/dataflow/QNA).
    //   - result.structure.dimensions.attributes.observation has some potentially interesting things such as time formats and status (eg. estimated value, forecast value).
    var structureSeries =
      item.sdmxVersionNumber === 2.1
        ? buildStructureSeriesForVersion21(json)
        : json.structure.dimensions.observation;
    item._fullDimensions = buildDimensions(item, structureSeries);

    if (
      !defined(
        getDimensionIndexById(item._fullDimensions, item.regionDimensionId)
      )
    ) {
      throw noRegionsError(item);
    }
    item._concepts = buildConcepts(item, item._fullDimensions);
    // console.log('concepts', item._concepts);
    // The rest of the magic occurs because the concepts are made active.
    // So that the loading flow works properly, make that happen now.
    return changedActiveItems(item);
  });
}

function hasRegionDimension(item) {
  return defined(
    getDimensionIndexById(item._loadedDimensions, item.regionDimensionId)
  );
}

function mapComponentsIterator(obj, type) {
  // sdmxJsonLib.response.mapComponentsToArray combines observations and attributes.
  // We need to keep track of which is which.
  obj._type = type;
  return obj;
}

function mapDataSetsArrayToObject(dataSetsArray) {
  var obj = {};
  dataSetsArray.forEach(function(element) {
    obj[element._key] = element;
  });
  return obj;
}

function buildDataSetsFromPreparedJson(item, preparedJson) {
  var dataSetsArray = sdmxJsonLib.response.mapDataSetsToArray(preparedJson);
  return mapDataSetsArrayToObject(dataSetsArray);
}

function convertStructureSeriesFrom21(structureSeries) {
  for (var i = 0; i < structureSeries.length; i++) {
    const item = structureSeries[i];
    item.name = defined(item.name.en) ? item.name.en : item.name;
    for (var ii = 0; ii < item.values.length; ii++) {
      const val = item.values[ii];
      val.name = val.name.en;
    }
  }
  return structureSeries;
}

function buildDimensionsFromPreparedJson(item, preparedJson) {
  var structureDimensionsAndAttributes = sdmxJsonLib.response.mapComponentsToArray(
    preparedJson,
    mapComponentsIterator
  );
  var structureSeries = structureDimensionsAndAttributes.filter(function(s) {
    return s._type === "dimensions";
  });
  if (item.sdmxVersionNumber === 2.1)
    structureSeries = convertStructureSeriesFrom21(structureSeries);
  return buildDimensions(item, structureSeries);
}

function convertTotalsJson(json) {
  json.structure.name = json.structure.name.en;
  json.structure.dimensions.observation[0].name =
    json.structure.dimensions.observation[0].name.en;
  json.structure.dimensions.observation[0].values.forEach(function(val) {
    val.name = val.name.en;
  });
  json.structure.dimensions.series.forEach(function(series) {
    series.name = series.name.en;
    series.values.forEach(function(val) {
      val.name = val.name.en;
    });
  });
  return json;
}

// This is called with item._originalUrl when the URL is for a specific data file, ie. dataflow is not used.
// It is also called with a dimensionRequestString when dataflow is used.
// If we've been provided with a dimensionRequestString, then also try to load totals.
function loadAndBuildTable(item, dimensionRequestString) {
  var url;
  var totalsRequestString;
  var promises = [];
  if (defined(dimensionRequestString)) {
    url = getUrlFromDimensionRequestString(item, dimensionRequestString);
    item.url = url;
    var totalConceptIds = calculateTotalConceptIds(item);
    if (defined(totalConceptIds)) {
      totalsRequestString = calculateDimensionRequestString(
        item,
        totalConceptIds,
        item._fullDimensions
      );
      if (defined(totalsRequestString)) {
        if (!defined(item._regionTotals[totalsRequestString])) {
          var totalsUrl = getUrlFromDimensionRequestString(
            item,
            totalsRequestString
          );
          promises.push(item._getData(proxyCatalogItemUrl(item, totalsUrl)));
        }
      }
    }
  } else {
    url = item.originalUrl;
  }
  promises.push(item._getData(proxyCatalogItemUrl(item, url)));
  item.isLoading = true;
  return when
    .all(promises)
    .then(function(jsons) {
      // jsons is an array of length 1 or 2, with optional total data json first, then the specific data json.
      var json = jsons[jsons.length - 1]; // the specific json.

      // The structure of the SDMX 2.1 response is slightly different
      if (item.sdmxVersionNumber === 2.1) json = json.data;

      if (jsons.length === 2) {
        // Process and save the region totals as a datasets object.
        var totalsJson = jsons[0];
        if (item.sdmxVersionNumber === 2.1)
          totalsJson = convertTotalsJson(jsons[0].data);

        sdmxJsonLib.response.prepare(totalsJson);
        item._regionTotals[totalsRequestString] = {
          dataSets: buildDataSetsFromPreparedJson(item, totalsJson),
          dimensions: buildDimensionsFromPreparedJson(item, totalsJson)
        };
      }
      if (item.sdmxVersionNumber === 2.1) json = convertTotalsJson(json);

      var regionTotalsDataSets = item._regionTotals[totalsRequestString];
      // sdmxJsonLib.response.mapDataSetsToJsonStat might automate more of this?
      sdmxJsonLib.response.prepare(json);
      var dataSets = buildDataSetsFromPreparedJson(item, json);
      item._loadedDimensions = buildDimensionsFromPreparedJson(item, json);
      if (!hasRegionDimension(item)) {
        throw noRegionsError(item);
      }
      if (!defined(item._fullDimensions)) {
        // If we didn't come through the dataflow, ie. we've loaded this file directly, then we need to set the concepts now.
        // In this case, the loaded dimensions are the full set.
        item._fullDimensions = item._loadedDimensions;
        item._concepts = buildConcepts(item, item._fullDimensions);
      }

      var columnCombinations = calculateShownDimensionCombinations(
        item,
        item._loadedDimensions,
        item._fullDimensions
      );
      var regionAndTimeColumns = buildRegionAndTimeColumns(
        item,
        item._loadedDimensions
      );
      item._numberOfInitialColumns = regionAndTimeColumns.length;
      var valueColumns = buildValueColumns(
        item,
        item._loadedDimensions,
        columnCombinations,
        dataSets
      );
      // Build a regional total column, if possible.
      var regionTotalColumns = [];
      // Do not bother showing the region totals if the request itself is already for the region totals.
      // By not even putting the region total column into the table, canDisplayPercent is set to false,
      // so the user doesn't have the option to see meaningless 100%s everywhere.
      if (
        defined(regionTotalsDataSets) &&
        totalsRequestString !== dimensionRequestString
      ) {
        var regionTotalColumnCombinations = calculateShownDimensionCombinations(
          item,
          regionTotalsDataSets.dimensions,
          item._fullDimensions
        );
        regionTotalColumns = buildValueColumns(
          item,
          item._loadedDimensions,
          regionTotalColumnCombinations,
          regionTotalsDataSets.dataSets
        );
        regionTotalColumns.forEach((column, index) => {
          // Give it a simpler id. Should only be one region total column, but just in case.
          column.id = "region total" + (index > 0 ? "_" + index : "");
        });
      }
      // We want to update the columns, which can of course update the region column.
      // RegionMapping watches for changes in the active column and tries to redisplay it if so.
      // Set regionMapping.isLoading true to prevent this.
      // However it does not expect the region column to change - regionDetails does not auto-update its column.
      // Once _regionMapping.loadRegionDetails() is done, it updates regionDetails.
      // Setting _regionMapping.isLoading to false then triggers the changed-active-column event.
      item._regionMapping.isLoading = true;
      // Set the columns and the concepts before building the total column, because it uses them both.
      item._tableStructure.columns = regionAndTimeColumns.concat(valueColumns);
      var totalColumn = buildTotalSelectedColumn(item, columnCombinations); // The region column can't be active, so ok not to pass it.
      var percentColumn = [];
      if (defined(totalColumn) && regionTotalColumns.length > 0) {
        // Usually, this means canDisplayPercent should be set to True.
        // However, there are cases where a rate, or mean, is displayed, when it still doesn't make sense.
        item.canDisplayPercent = canResultsBeSummed(item);
        if (item.canDisplayPercent) {
          percentColumn = buildPercentColumn(
            item,
            totalColumn,
            regionTotalColumns[0]
          );
        }
      } else {
        item.canDisplayPercent = false;
      }
      var columns = item._tableStructure.columns
        .concat(totalColumn)
        .concat(regionTotalColumns)
        .concat(percentColumn);
      updateColumns(item, columns);
      item._tableStructure.setActiveTimeColumn(item._tableStyle.timeColumn);
      return item._regionMapping.loadRegionDetails();
    })
    .then(function(regionDetails) {
      if (regionDetails) {
        item._regionMapping.setRegionColumnType();
        if (item.sdmxVersionNumber === 2.1 && !item._regionMapping.enabled)
          item._regionMapping.enable();
        // Force a recalc of the imagery.
        // Required because we load the region details _after_ setting the active column.
        item._regionMapping.isLoading = false;
        item.isLoading = false;
      } else {
        throw noRegionsError(item);
        // item.setChartable();
      }
      return when();
    })
    .otherwise(function(e) {
      item._regionMapping.isLoading = false;
      item.isLoading = false;
      updateColumns(item, []); // Remove any data, but leave the concepts alone so the user can recover by choosing again.
      if (e.statusCode === 404) {
        // Sometimes if there is no data available, the SDMX-JSON server can reply with broken json and a 404 error.
        // In this case, we don't want to wipe out the displayed options.
        // In contrast, if the entire dataset is missing, it will return a 400 error.
        item.terria.error.raiseEvent(
          new TerriaError({
            sender: item,
            title: e.title || "No data",
            message:
              "There is no data available for this combination. Please choose again."
          })
        );
      } else {
        item.terria.error.raiseEvent(
          new TerriaError({
            sender: item,
            title: e.title || "No data available",
            message: e.message || e.response
          })
        );
      }
    });
}

function noRegionsError(item) {
  return new TerriaError({
    sender: item,
    title: "No regions recognized",
    message:
      '\
This dataset cannot be shown geographically, because no regions were recognized in it. \
Please report this issue by sending an email to <a href="mailto:' +
      item.terria.supportEmail +
      '">' +
      item.terria.supportEmail +
      "</a>.</p>"
  });
}

// cleanAndProxyUrl appears in a few catalog items - we should split it into its own Core file.

function cleanUrl(url) {
  // Strip off the search portion of the URL
  var uri = new URI(url);
  uri.search("");
  return uri.toString();
}

function cleanAndProxyUrl(catalogItem, url) {
  return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

module.exports = SdmxJsonCatalogItem;
