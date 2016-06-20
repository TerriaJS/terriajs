'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
// var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
// var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var arrayProduct = require('../Core/arrayProduct');
// var arraysAreEqual = require('../Core/arraysAreEqual');
var CsvCatalogItem = require('./CsvCatalogItem');
var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var RegionMapping = require('../Models/RegionMapping');
var TableColumn = require('../Map/TableColumn');
var TableStructure = require('../Map/TableStructure');
var VariableConcept = require('../Map/VariableConcept');

/*
    The SDMX-JSON format.
    Descriptions of this format are available at:
    - https://data.oecd.org/api/sdmx-json-documentation/
    - https://github.com/sdmx-twg/sdmx-json/tree/master/data-message/docs
    - https://sdmx.org/
    - http://stats.oecd.org/sdmx-json/ (hosts a handy query builder)

    The URL can be of two types, eg:
    1. http://stat.abs.gov.au/sdmx-json/data/ABS_REGIONAL_LGA/CABEE_2.LGA2013.1+.A/all?startTime=2013&endTime=2013
    2. http://stat.abs.gov.au/sdmx-json/data/ABS_REGIONAL_LGA

    For #2, the dimension names and codes come from (in json format):
    http://stats.oecd.org/sdmx-json/dataflow/<dataset id> (eg. QNA).

    Then access:
      - result.structure.dimensions.observation[k] for {keyPosition, id, name, values[]} to get the name & id of dimension keyPosition and its array of allowed values (with {id, name}).
      - result.structure.dimensions.attributes.dataSet has some potentially interesting things such as units, unit multipliers, reference periods (eg. http://stats.oecd.org/sdmx-json/dataflow/QNA).
      - result.structure.dimensions.attributes.observation has some potentially interesting things such as time formats and status (eg. estimated value, forecast value).

    (Alternatively, in xml format):
    http://stats.oecd.org/restsdmx/sdmx.ashx/GetDataStructure/<dataset id> (eg. QNA).

    Data comes from:
    http://stats.oecd.org/sdmx-json/data/<dataset identifier>/<filter expression>/<agency name>[ ?<additional parameters>]

    Eg.
    http://stats.oecd.org/sdmx-json/data/QNA/AUS+AUT.GDP+B1_GE.CUR+VOBARSA.Q/all?startTime=2009-Q2&endTime=2011-Q4

    An example from the ABS:
    http://stat.abs.gov.au/sdmx-json/data/ABS_REGIONAL_LGA/CABEE_2.LGA2013.1+.A/all?startTime=2013&endTime=2013

    Then access:
      - result.structure.dimensions.series[i] for {keyPosition, id, name, values[]} to get the name & id of dimension keyPosition and its array of allowed values (with {id, name}).
      - result.structure.dimensions.observation[i] for {role, id, name, values[]} to get the name & id of the observations and its array of allowed values (with {id, name}).
      - result.dataSets[0].series[key].observations[t][0] with key = "xx.yy.zz" where xx is the id of a value from dimension 0, etc, and t is the time index (eg. 0 for a single time).

    Currently, we only parse the first "dataSet" object provided. (This covers all situations of interest to us so far.)

    Time seems to be handled specially, at least by the OECD.
    Eg.
      http://stats.oecd.org/sdmx-json/dataflow/QNA shows there are 5 dimensions (result.structure.dimensions.observation): LOCATION, SUBJECT, MEASURE, FREQUENCY, TIME_PERIOD.
      But http://stats.oecd.org/sdmx-json/data/QNA/.B1_GE.VOBARSA.Q/all only returns 4 dimensions (result.structure.dimensions.series): TIME_PERIOD is gone.
      Instead, it has become an observation: result.structure.dimensions.observation[0] has property "values" with lots of {id, name} fields, eg. {id: "1960-Q1", name: "Q1-1960"}.
      And result.dataSets[0].series[key].observations[t] has lots of values for different t, not necessarily including t = 0. (eg. key = "21:0:0:0" starts at t = 140).
 */

/**
 * A {@link CatalogItem} representing region-mapped data obtained from SDMX-JSON format.
 *
 * @alias SdmxJsonCatalogItem
 * @constructor
 * @extends CsvCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var SdmxJsonCatalogItem = function(terria, url) {
    CsvCatalogItem.call(this, terria, url);

    // The options that should be passed to TableColumn when creating a new column.
    this._columnOptions = undefined;

    // Allows conversion between the dimensions and the table columns.
    this._allDimensions = undefined;
    this._loadedDimensions = undefined;

    // Keep track of whether how many columns appear before the value columns (typically a time and a region column).
    this._numberOfInitialColumns = undefined;

    // Holds the time_period and region ids, ie. by default ["TIME_PERIOD", "REGION"].
    this._suppressedIds = [];

    // You cannot select multiple values of the frequency and regiontype ids, ie. by default ["FREQUENCY", "REGIONTYPE"].
    this._singleValuedIds = [];

    // This is set to the dataflow URL for this data, if relevant.
    this._dataflowUrl = undefined;

    // The array of Concepts to display in the NowViewing panel.
    this._concepts = [];

    /**
     * Gets or sets the 'data' SDMX URL component, eg. 'data' in http://stats.oecd.org/sdmx-json/data/QNA.
     * Defaults to 'data'.
     * This property is observable.
     * @type {String}
     */
    this.dataUrlComponent = undefined;

    /**
     * Gets or sets the 'dataflow' SDMX URL component, eg. 'dataflow' in http://stats.oecd.org/sdmx-json/dataflow/QNA.
     * Defaults to 'dataflow'.
     * This property is observable.
     * @type {String}
     */
    this.dataflowUrlComponent = undefined;

    /**
     * Gets or sets the provider id in the SDMX URL, eg. the final 'all' in http://stats.oecd.org/sdmx-json/data/QNA/.../all.
     * Defaults to 'all'.
     * This property is observable.
     * @type {String}
     */
    this.providerId = undefined;

    /**
     * Gets or sets the SDMX region-type dimension id used with the region code to set the region type.
     * Usually defaults to 'REGIONTYPE'.
     * This property is observable.
     * @type {String}
     */
    this.regionTypeDimensionId = undefined;

    /**
     * Gets or sets the SDMX region dimension id, which is not displayed as a user-choosable dimension. Defaults to 'REGION'.
     * This property is observable.
     * @type {String}
     */
    this.regionDimensionId = undefined;

    /**
     * Gets or sets the SDMX frequency dimension id. Defaults to 'FREQUENCY'.
     * This property is observable.
     * @type {String}
     */
    this.frequencyDimensionId = undefined;

    /**
     * Gets or sets the SDMX time period dimension id, which is not displayed as a user-choosable dimension. Defaults to 'TIME_PERIOD'.
     * This property is observable.
     * @type {String}
     */
    this.timePeriodDimensionId = undefined;

    /**
     * Gets or sets the regiontype directly, which is an alternative to including a regiontype in the data.
     * Eg. "cnt3" would tell us that we should use cnt3 as the table column name.
     * By default this is undefined.
     * This property is observable.
     * @type {String}
     */
    this.regionType = undefined;

    /**
     * Gets or sets the concepts which are initially selected, eg. {"MEASURE": ["GDP", "GNP"], "FREQUENCY": ["A"]}.
     * Defaults to the first value in each dimension (when undefined).
     * This property is observable.
     * @type {Object}
     */
    this.selectedInitially = undefined;

    /**
     * Gets or sets the startTime to use as part of the ?startTime=...&endTime=... query parameters.
     * Currently a string, but could be extended to be an object with frequency codes as keys.
     * By default this is undefined, and not used as part of the query.
     * This property is observable.
     * @type {String}
     */
    this.startTime = undefined;

    /**
     * Gets or sets the endTime to use as part of the ?startTime=...&endTime=... query parameters.
     * Currently a string, but could be extended to be an object with frequency codes as keys.
     * By default this is undefined, and not used as part of the query.
     * This property is observable.
     * @type {String}
     */
    this.endTime = undefined;

    /**
     * Gets or sets each dimension's allowed values, by id. Eg. {"SUBJECT": ["GDP", "GNP"], "FREQUENCY": ["A"]}.
     * If not defined, all values are allowed.
     * If a dimension is not present, all values for that dimension are allowed.
     * Note this will not be applied to regions or time periods.
     * This property is observable.
     * @type {Object}
     */
    this.whitelist = {};

    // Tracking _concepts makes this a circular object.
    // _concepts (via concepts) is both set and read in rebuildData.
    // A solution to this would be to make concepts a Promise, but that would require changing the UI side.
    knockout.track(this, ['_concepts']);

    overrideProperty(this, 'concepts', {
        get: function() {
            return this._concepts;
        }
    });

    knockout.defineProperty(this, 'activeConcepts', {
        get: function() {
            if (defined(this._concepts) && this._concepts.length > 0) {
                return this._concepts.map(function(parent) {
                    return parent.items.filter(function(concept) { return concept.isActive; });
                });
            }
        }
    });

    knockout.getObservable(this, 'activeConcepts').subscribe(function() {
        if (!this.isLoading) {
            changedActiveItems(this);
        }
    }, this);

    // knockout.getObservable(this, 'displayPercent').subscribe(rebuildData.bind(null, this), this);

};

inherit(CsvCatalogItem, SdmxJsonCatalogItem);

defineProperties(SdmxJsonCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf SdmxJsonCatalogItem.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'sdmx-json';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf SdmxJsonCatalogItem.prototype
     * @type {String}
     */
    typeName: {
        get: function() {
            return 'SDMX JSON';
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
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf SdmxJsonCatalogItem.prototype
     * @type {Object}
     */
    serializers: {
        get: function() {
            return SdmxJsonCatalogItem.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
SdmxJsonCatalogItem.defaultPropertiesForSharing = clone(CsvCatalogItem.defaultPropertiesForSharing); // TODO: do we need to add dataUrlComponent etc to this list?
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('regionDimensionId');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('regionTypeDimensionId');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('frequencyDimensionId');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('timePeriodDimensionId');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('whitelist');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('regionType');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('startTime');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('endTime');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('dataUrlComponent');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('dataflowUrlComponent');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('providerId');
SdmxJsonCatalogItem.defaultPropertiesForSharing.push('selectedInitially');
freezeObject(SdmxJsonCatalogItem.defaultPropertiesForSharing);

SdmxJsonCatalogItem.defaultSerializers = clone(CsvCatalogItem.defaultSerializers);
freezeObject(SdmxJsonCatalogItem.defaultSerializers);

// Just the items that would influence the load from the abs server or the file
SdmxJsonCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
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
    var dataUrlComponent = '/' + item.dataUrlComponent + '/';
    var dataUrlIndex = (item.url.lastIndexOf(dataUrlComponent));
    // If the URL contains /data/, look for how many / terms come after it.
    if (dataUrlIndex >= 0) {
        var suffix = item.url.slice(dataUrlIndex + dataUrlComponent.length);
        // eg. suffix would be ABS_REGIONAL_LGA/CABEE_2.LGA2013.1+.A/all...
        // If it contains a /, and anything after the /, then treat it as #1.
        if (suffix.indexOf('/') >= 0 && suffix.indexOf('/') < suffix.length - 1) {
            return;
        } else {
            // return the same URL but with /data/ replaced with /dataflow/.
            var dataflowUrlComponent = '/' + item.dataflowUrlComponent + '/';
            return item.url.replace(dataUrlComponent, dataflowUrlComponent);
        }
    }
}

SdmxJsonCatalogItem.prototype._load = function() {
    // Set some defaults.
    this.regionTypeDimensionId = defaultValue(this.regionTypeDimensionId, 'REGIONTYPE');
    this.regionDimensionId = defaultValue(this.regionDimensionId, 'REGION');
    this.frequencyDimensionId = defaultValue(this.frequencyDimensionId, 'FREQUENCY');
    this.timePeriodDimensionId = defaultValue(this.timePeriodDimensionId, 'TIME_PERIOD');
    this.providerId = defaultValue(this.providerId, 'all');
    this.dataUrlComponent = defaultValue(this.dataUrlComponent, 'data');
    this.dataflowUrlComponent = defaultValue(this.dataflowUrlComponent, 'dataflow');

    this._suppressedIds = [this.regionDimensionId, this.timePeriodDimensionId];
    this._singleValuedIds = [this.regionTypeDimensionId, this.frequencyDimensionId];

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

    this._dataflowUrl = getDataflowUrl(this);
    if (this._dataflowUrl) {
        return loadDataflow(this);
    } else {
        return loadAndBuildTable(this);
    }
};

// An event listened triggered whenever the dataSource or regionMapping changes.
// Used to know when to redraw the display.
function dataChanged(item) {
    item.terria.currentViewer.notifyRepaintRequired();
}

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

// // eg. range(5) returns [0, 1, 2, 3, 4].
// function range(length) {
//     return Array.apply(null, Array(length)).map(function(x, i) { return i; });
// }

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
 * @private
 * @param  {SdmxJsonCatalogItem} item The SDMX-JSON catalog item.
 * @param  {Array} structureSeries The structure's series property, json.structure.dimensions.series.
 * @return {Object[]} A description of the dimensions.
 */
function buildDimensions(item, structureSeries) {
    // Store the length of each dimension, in the correct keyPosition.
    function getWhitelistFilter(dimensionId) {
        var thisIdsWhitelist = item.whitelist[dimensionId];
        return function(value) {
            return !defined(thisIdsWhitelist) || (thisIdsWhitelist.indexOf(value.id) >= 0);
        };
    }
    var result = [];
    for (var i = 0; i < structureSeries.length; i++) {
        var thisSeries = structureSeries[i];
        var keyPosition = defined(thisSeries.keyPosition) ? thisSeries.keyPosition : i; // Since time_period can be an observation, without a keyPosition.
        result[keyPosition] = {
            id: thisSeries.id,
            name: thisSeries.name,
            // Eg. values: [{id: "BD_2", name: "Births"}, {id: "BD_4", name: "Deaths"}].
            values: thisSeries.values.filter(getWhitelistFilter(thisSeries.id))
        };
    }
    return result;
}

// Return dimensions, but removing suppressed dimensions, and dimensions with only one value IN FULLDIMENSIONS.
// Dimensions and fullDimensions must have the same ordering of dimensions.
function getShownDimensions(item, dimensions, fullDimensions) {
    return dimensions.filter(function(dimension, i) {
        return (item._suppressedIds.indexOf(dimension.id) === -1) && (fullDimensions[i].values.length > 1);
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
    var valuesArrays = getShownDimensions(item, dimensions, fullDimensions).map(function(dimension) {
        return dimension.values;
    });

    var idsArrays = valuesArrays.map(function(values) { return values.map(function(value) { return value.id; }); });
    var namesArrays = valuesArrays.map(function(values) { return values.map(function(value) { return value.name; }); });
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

function getRegionColumnName(item, dimensions) {
    var regionTypeDimension = getDimensionById(dimensions, item.regionTypeDimensionId);
    var regionDimension = getDimensionById(dimensions, item.regionDimensionId);
    if (defined(regionTypeDimension)) {
        // If there is a REGIONTYPE dimension, use its id, but add modify it using the principles of csv-geo-au:
        // Assume the raw data is just missing the word "code", eg. LGA or LGA_2013 should be lga_code or lga_code_2013.
        // So, if there's a _, replace the last one with _code_; else append _code.
        var regionTypeId = regionTypeDimension.values[0].id;
        var underscoreIndex = regionTypeId.lastIndexOf('_');
        if (underscoreIndex >= 0) {
            return regionTypeId.slice(0, underscoreIndex) + '_code' + regionTypeId.slice(underscoreIndex);
        } else {
            return regionTypeId + '_code';
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
    var timePeriodDimension = getDimensionById(dimensions, item.timePeriodDimensionId);
    if (!defined(regionDimension)) {
        // No region dimension (with the actual region values in it).
        return;
    }
    var regionValues = [];
    var timePeriodValues = [];
    var regionCount = regionDimension.values.length;
    var timePeriodCount = defined(timePeriodDimension) ? timePeriodDimension.values.length : 1;
    for (var timePeriodIndex = 0; timePeriodIndex < timePeriodCount; timePeriodIndex++) {
        for (var regionIndex = 0; regionIndex < regionCount; regionIndex++) {
            regionValues.push(regionDimension.values[regionIndex].id);
            if (timePeriodCount > 1) {
                timePeriodValues.push(timePeriodDimension.values[timePeriodIndex].id);
            }
        }
    }
    // TODO: for now, only implements the first region type.
    var regionColumnName = getRegionColumnName(item, dimensions);
    var regionColumn = new TableColumn(regionColumnName, regionValues, item._columnOptions);
    if (timePeriodCount > 1) {
        var timePeriodColumn = new TableColumn('date', timePeriodValues, item._columnOptions);
        return [timePeriodColumn, regionColumn];
    } else {
        return [regionColumn];
    }
}

function getIndexOfDimensionValueId(dimension, valueId) {
    var result;
    for (var i = 0; i < dimension.values.length; i++) {
        if (dimension.values[i].id === valueId) {
            result = i;
        }
    }
    return result;
}

// Eg. ids = ['GDP', 'METHOD-B'].
// We want to map this to an array of indices, eg. [12, 1, undefined, 0, 0] for SUBJECT, METHOD, REGION, REGIONTYPE, FREQUENCY (for example),
// with undefined for any suppressed dimensions and 0 for all single-valued dimensions.
// This can then easily be turned into the key "12:1:undefined:0:0".
// The main trick here is we need to suppress time_period from the final array - it is an 'observation' not a dimension.
function mapDimensionValueIdsToKeyValues(item, loadedDimensions, ids) {
    var result = [];
    var nonTimePeriodDimensions = loadedDimensions.filter(function(dimension) {
        return (item.timePeriodDimensionId !== dimension.id);
    });
    var shownDimensions = getShownDimensions(item, loadedDimensions, item._fullDimensions);
    var shownDimensionIds = shownDimensions.map(function(dimension) { return dimension.id; });
    for (var dimensionIndex = 0; dimensionIndex < nonTimePeriodDimensions.length; dimensionIndex++) {
        var outputDimension = nonTimePeriodDimensions[dimensionIndex];
        var i = shownDimensionIds.indexOf(outputDimension.id);
        if (i >= 0) {
            result.push(getIndexOfDimensionValueId(shownDimensions[i], ids[i]));
        } else if (item._suppressedIds.indexOf(outputDimension.id) >= 0) {
            result.push(undefined);
        } else {
            result.push(0);
        }
    }
    return result;
}

// Create a column for each combination of (non-region) dimension values.
// TODO: If we are using the dataflow approach, only create columns for the active concepts (since that's all we'll have data for). (Currently it shows null in those columns.)
// The column has values for each region.
function buildValueColumns(item, loadedDimensions, columnCombinations, structureSeries, series) {
    var thisColumnOptions = clone(item._columnOptions);
    thisColumnOptions.tableStructure = item._tableStructure;
    var columns = [];
    var uniqueValue = (columnCombinations.ids.length <= 1);
    var regionDimension = getDimensionById(loadedDimensions, item.regionDimensionId);
    var regionDimensionIndex = getDimensionIndexById(loadedDimensions, item.regionDimensionId);
    var timePeriodDimension = getDimensionById(loadedDimensions, item.timePeriodDimensionId);

    var regionCount = regionDimension.values.length;
    var timePeriodCount = defined(timePeriodDimension) ? timePeriodDimension.values.length : 1;

    for (var combinationIndex = 0; combinationIndex < columnCombinations.ids.length; combinationIndex++) {
        var ids = columnCombinations.ids[combinationIndex];
        var dimensionIndices = mapDimensionValueIdsToKeyValues(item, loadedDimensions, ids);
        // The name is just the joined names of all the columns involved, or 'value' if no columns still have names.
        var combinationName = columnCombinations.names[combinationIndex].filter(function(name) {return !!name; }).join(' ') || 'Value';
        var combinationId = ids.join(' ') || 'Value';
        var values = [];
        for (var timePeriodIndex = 0; timePeriodIndex < timePeriodCount; timePeriodIndex++) {
            for (var regionIndex = 0; regionIndex < regionCount; regionIndex++) {
                dimensionIndices[regionDimensionIndex] = regionIndex;
                var key = dimensionIndices.join(':');
                if (defined(series[key]) && defined(series[key].observations[timePeriodIndex])) {
                    values.push(series[key].observations[timePeriodIndex][0]);
                } else {
                    values.push(null);
                }
            }
        }
        thisColumnOptions.id = combinationId; // So we can refer to the dimension in a template by a sequence of ids or names.
        var column = new TableColumn(combinationName, values, thisColumnOptions);
        if (uniqueValue) {
            column.isActive = true;
        }
        columns.push(column);
    }
    return columns;
}

// Map the active concepts into arrays of arrays of ids.
// Eg. Return [['GDP', 'GNP'], ['Q']].
function calculateActiveConceptIds(concepts) {
    return concepts.map(function(parent) {
        return parent.items.filter(function(concept) {
            return concept.isActive;
        }).map(function(concept) {
            return concept.id;
        });
    });
}

// Build out the concepts displayed in the NowViewing panel.
function buildConcepts(item, fullDimensions, shownDimensionCombinations) {
    // Only store the combinations as they relate the concepts.
    // Ie. Drop the trivial (single-valued) dimensions from shownDimensionCombinations.keyValues .
    // Eg. [[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0], [0, 0, 1, 1], [0, 0, 2, 0], [0, 0, 2, 1]]
    // should become [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]], as the first two indices are single-valued.

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

    var conceptDimensions = getShownDimensions(item, fullDimensions, fullDimensions);
    return conceptDimensions.map(function(dimension, i) {
        var allowMultiple = item._singleValuedIds.indexOf(dimension.id) === -1;
        var concept = new DisplayVariablesConcept(dimension.name, allowMultiple);
        concept.id = dimension.id;
        concept.items = dimension.values.map(function(value, index) {
            return new VariableConcept(value.name, {
                parent: concept,
                id: value.id,
                active: isInitiallyActive(concept.id, value, index)
            });
        });
        return concept;
    });
}

// Create columns for the total (and possibly total percentage) values.
// If <=1 active column, returns [].
function buildTotalColumns(item, columnCombinations) {
    // Build a total column equal to the sum of all the active concepts.
    var thisColumnOptions = clone(item._columnOptions);
    thisColumnOptions.tableStructure = item._tableStructure;
    thisColumnOptions.id = 'total selected';
    var activeConceptIds = calculateActiveConceptIds(item._concepts);
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
    var joinString = '+';
    var stringifiedCombinations = columnCombinations.ids.map(function(combination) { return combination.join(joinString); });
    var indicesIntoCombinations = activeCombinations.map(function(activeCombination) {
        var stringifiedActiveCombination = activeCombination.join(joinString);
        return stringifiedCombinations.indexOf(stringifiedActiveCombination);
    });
    // Slice off the initial region &/or time columns, and only keep the value columns (ignoring total columns which come at the end).
    var valueColumns = item._tableStructure.columns.slice(item._numberOfInitialColumns, columnCombinations.ids.length + item._numberOfInitialColumns);
    var includedColumns = valueColumns.filter(function(column, i) { return indicesIntoCombinations.indexOf(i) >= 0; });
    var totalColumn = new TableColumn('Total selected', TableColumn.sumValues(includedColumns), thisColumnOptions);
    totalColumn.isActive = true;
    return [totalColumn];
}

// Returns the dimension request string, eg. "BD_2+BD_4.LGA_2013..A." appropriate for the active concept values.
// One trick is that the time dimension can appear in the dataflow, but should not be included in the data (or this request string).
// Returns undefined if any dimension has no value selected.
function calculateDimensionRequestString(item, fullDimensions) {
    var activeConceptIds = calculateActiveConceptIds(item._concepts);
    var hasAtLeastOneValuePerDimension = activeConceptIds.every(function(list) { return list.length > 0; });
    if (!hasAtLeastOneValuePerDimension) {
        return;
    }
    var nextConceptIndex = 0;
    var nonTimePeriodDimensions = fullDimensions.filter(function(dimension) {
        return (item.timePeriodDimensionId !== dimension.id);
    });
    var dimensionRequestArrays = nonTimePeriodDimensions.map(function(dimension, dimensionIndex) {
        if (dimension.id === item.regionDimensionId) {
            return ['']; // A missing id loads all ids.
        }
        if (dimension.values.length === 1) { // These do not appear as concepts - directly supply the only value's id.
            return [dimension.values[0].id];
        } else {
            return activeConceptIds[nextConceptIndex++];
        }
    });
    return dimensionRequestArrays.map(function(values) {
        return values.join('+');
    }).join('.');
}

// Called when the active column changes.
// Returns a promise.
function changedActiveItems(item) {
    if (!defined(item._dataflowUrl)) {
        // All the data is already here, just update the total columns.
        var shownDimensionCombinations = calculateShownDimensionCombinations(item, item._fullDimensions);
        var columns = item._tableStructure.columns.slice(0, shownDimensionCombinations.ids.length + item._numberOfInitialColumns);
        if (columns.length > 0) {
            // TODO: If all the values for a single dimension are deselected, handle it specially.
            columns = columns.concat(buildTotalColumns(item, shownDimensionCombinations));
            updateColumns(item, columns);
        }
        return when();
    } else {
        // Download the data and build the appropriate table.
        // Eg. by appending /a+b+c.d.e+f.g/all to the url.
        // These need to be in the order of the original dimensions, not the concepts.
        var dimensionRequestString = calculateDimensionRequestString(item, item._fullDimensions);
        if (!defined(dimensionRequestString)) {
            return; // No value for a dimension, so ignore.
        }
        var url = item.url;
        if (url[url.length - 1] !== '/') {
            url += '/';
        }
        url += dimensionRequestString + '/' + item.providerId;
        if (defined(item.startTime)) {
            url += '?startTime=' + item.startTime;
            if (defined(item.endTime)) {
                url += '&endTime=' + item.endTime;
            }
        } else if (defined(item.endTime)) {
            url += '?endTime=' + item.endTime;
        }
        return loadAndBuildTable(item, url);
    }
}

// This is called when the URL gives a datasetId, but no specifics.
// We start by loading in the structure (without any data) from the dataflow URL.
function loadDataflow(item) {
    var dataflowUrl = cleanAndProxyUrl(item, item._dataflowUrl);
    return loadJson(dataflowUrl).then(function(json) {
        // Then access:
        //   - result.structure.dimensions.observation[k] for {keyPosition, id, name, values[]} to get the name & id of dimension keyPosition and its array of allowed values (with {id, name}).
        //   - result.structure.dimensions.attributes.dataSet has some potentially interesting things such as units, unit multipliers, reference periods (eg. http://stats.oecd.org/sdmx-json/dataflow/QNA).
        //   - result.structure.dimensions.attributes.observation has some potentially interesting things such as time formats and status (eg. estimated value, forecast value).
        var structureSeries = json.structure.dimensions.observation;

        item._fullDimensions = buildDimensions(item, structureSeries);
        if (!defined(getDimensionIndexById(item._fullDimensions, item.regionDimensionId))) {
            // TODO: Raise an error, or handle case when there are no regions.
            console.log('No regions defined.');
            return;
        }
        var shownDimensionCombinations = calculateShownDimensionCombinations(item, item._fullDimensions);
        item._concepts = buildConcepts(item, item._fullDimensions, shownDimensionCombinations);
        // console.log('concepts', item._concepts);
        // The rest of the magic occurs because the concepts are made active.
        // So that the loading flow works properly, make that happen now.
        return changedActiveItems(item);
    });
}

// Return json.structure.dimensions.series, augmented by json.structure.dimensions.observation
// (because time periods are an observation, not a series.)
function getStructureSeries(json) {
    return json.structure.dimensions.series.concat(json.structure.dimensions.observation);
}

// This is called with item.url when the URL is for a specific data file, ie. dataflow is not used.
// It is also called with a calculated url when dataflow is used.
function loadAndBuildTable(item, url) {
    if (!defined(url)) {
        url = item.url;
    }
    item._regionMapping = new RegionMapping(item, item._tableStructure, item._tableStyle);
    item._regionMapping.isLoading = true;
    item._regionMapping.changedEvent.addEventListener(dataChanged.bind(null, item), item);
    console.log('Downloading', url, 'as', proxyCatalogItemUrl(item, url));
    return loadJson(proxyCatalogItemUrl(item, url)).then(function(json) {
        var structureSeries = getStructureSeries(json);
        var series = json.dataSets[0].series;

        item._loadedDimensions = buildDimensions(item, structureSeries);
        if (!defined(getDimensionIndexById(item._loadedDimensions, item.regionDimensionId))) {
            // TODO: Raise an error, or handle case when there are no regions.
            console.log('No regions defined.');
            return;
        }
        if (!defined(item._fullDimensions)) {
            // If we didn't come through the dataflow, ie. we've loaded this file directly, then we need to set the concepts now.
            // In this case, the loaded dimensions are the full set.
            item._fullDimensions = item._loadedDimensions;
            var shownDimensionCombinations = calculateShownDimensionCombinations(item, item._fullDimensions);
            item._concepts = buildConcepts(item, item._fullDimensions, shownDimensionCombinations);
        }

        var columnCombinations = calculateShownDimensionCombinations(item, item._loadedDimensions, item._fullDimensions);
        var regionAndTimeColumns = buildRegionAndTimeColumns(item, item._loadedDimensions);
        item._numberOfInitialColumns = regionAndTimeColumns.length;
        var valueColumns = buildValueColumns(item, item._loadedDimensions, columnCombinations, structureSeries, series);
        item._tableStructure.columns = regionAndTimeColumns.concat(valueColumns);
        // Set the columns and the concepts before building the total column, because it uses them both.
        var totalColumns = buildTotalColumns(item, columnCombinations); // The region column can't be active, so ok not to pass it.
        var columns = item._tableStructure.columns.concat(totalColumns);
        CsvCatalogItem.setActiveTimeColumn(item._tableStructure, item._tableStyle);
        updateColumns(item, columns);
        console.log('SDMX-JSON data as a table:', item._tableStructure);
        return item._regionMapping.loadRegionDetails();
    }).then(function(regionDetails) {
        // Can get here with undefined region column name, hence no regionDetails.
        if (regionDetails) {
            RegionMapping.setRegionColumnType(regionDetails);
            // Force a recalc of the imagery.
            // Required because we load the region details _after_ setting the active column.
            item._regionMapping.isLoading = false;
        }
        return when();
    }).otherwise(function(e) {
        item.terria.error.raiseEvent(new TerriaError({
            sender: item,
            title: 'No data available',
            message: (e.message || e.response)
        }));
    });
}

// cleanAndProxyUrl appears in a few catalog items - we should split it into its own Core file.

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function cleanAndProxyUrl(catalogItem, url) {
    return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}


module.exports = SdmxJsonCatalogItem;
