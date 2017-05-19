'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
// var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var SummaryConcept = require('../Map/SummaryConcept');
var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var getUniqueValues = require('../Core/getUniqueValues');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var RegionMapping = require('../Models/RegionMapping');
var TableCatalogItem = require('./TableCatalogItem');
// var TableColumn = require('../Map/TableColumn');
// var TableColumnStyle = require('../Models/TableColumnStyle');
var TableStructure = require('../Map/TableStructure');
var VariableConcept = require('../Map/VariableConcept');
// var VarType = require('../Map/VarType');

var TABLES_URI_COMPONENT = 'tables';  // May also be present in registerCatalogMembers.js.

/**
 * A {@link CatalogItem} to select and display data from the Aggregated Data API.
 *
 * Eg. the service available at TBC.
 *
 * @alias AggregatedDataAPICatalogItem
 * @constructor
 * @extends TableCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The base URL from which to retrieve the data.
 */
var AggregatedDataAPICatalogItem = function(terria, url) {
    TableCatalogItem.call(this, terria, url);

    // The options that should be passed to TableColumn when creating a new column.
    this._columnOptions = undefined;

    // The fields available on this table, as an array of Objects, eg. [{name: "CANHP", title: , topic: , type: , values: [{<value>: {title: title}}, ...]}, ...].
    this._fields = undefined;

    // The unit of this table, eg. {singular: "person", plural: "people"}.
    this._unit = undefined;

    // The array of Concepts to display in the NowViewing panel.
    this._concepts = [];

    // An object containing all the region totals (eg. populations) required, keyed by the group_bys used.
    this._regionTotals = {};

    // An integer to store which column of this._tableStructure contains the results (as numbers, not as percentages).
    // If canDisplayPercent, the final column of the table contains the numbers as percentages.
    this._resultColumnIndex = undefined;

    /**
     * Gets or sets a flag which determines whether the legend comes before (false) or after (true) the conditions.
     * Default true.
     * @type {Boolean}
     */
    this.displayChoicesBeforeLegend = true;

    /**
     * Gets or sets whether this item can show percentages instead of raw values.  This property is observable.
     * @type {Boolean}
     * @default true
     */
    this.canDisplayPercent = true;

    /**
     * Gets or sets whether to show percentages or raw values.  This property is observable.
     * @type {Boolean}
     * @default true
     */
    this.displayPercent = false;

    /**
     * Gets or sets the key in the json result which provides the region-type.
     * Defaults to 'region_type'.
     * This property is observable.
     * @type {String}
     */
    this.regionTypeKey = undefined;

    /**
     * Gets or sets the base url of the API, ie. without the "tables" or other endpoints.
     * This is set based on this.url, assuming it is for a "tables" endpoint.
     * @type {String}
     */
    this.base_url = undefined;

    /**
     * Gets or sets the table code.
     * This is set based on this.url, assuming it includes the components "tables/{tableCode}".
     * @type {String}
     */
    this.tableCode = undefined;

    /**
     * Gets or sets the key type, which can be defined in the serverconfig via the 'keys' property.
     * @type {String}
     */
    this.keyType = undefined;

    // TODO: CHECK IF THIS IS TRUE HERE:
    // Tracking _concepts makes this a circular object.
    // _concepts (via concepts) is both set and read in rebuildData.
    // A solution to this would be to make concepts a Promise, but that would require changing the UI side.
    knockout.track(this, ['displayPercent', 'canDisplayPercent', '_concepts']);

    overrideProperty(this, 'concepts', {
        get: function() {
            return this._concepts;
        }
    });

    knockout.defineProperty(this, 'activeConcepts', {
        get: function() {
            if (defined(this._concepts) && this._concepts.length > 0) {
                var actives = this._concepts.map(concept => concept.leafNodes.filter(leaf => leaf.isActive));
                return actives;
            }
        }
    });

    knockout.getObservable(this, 'activeConcepts').subscribe(function() {
        changedActiveItems(this);
    }, this);

    knockout.getObservable(this, 'displayPercent').subscribe(setActiveColumnForDisplayPercent.bind(null, this), this);
};

inherit(TableCatalogItem, AggregatedDataAPICatalogItem);

defineProperties(AggregatedDataAPICatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf AggregatedDataAPICatalogItem.prototype
     * @type {String}
     */
    type: {
        get() { return 'aggregated-data-api'; }
    },

    /**
     * Gets a human-readable name for this type of data source, 'GPX'.
     * @memberOf AggregatedDataAPICatalogItem.prototype
     * @type {String}
     */
    typeName: {
        get() { return 'Aggregated Data API'; }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object for a share link.
     * @memberOf ImageryLayerCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing: {
        get() { return AggregatedDataAPICatalogItem.defaultPropertiesForSharing; }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object literal,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf AggregatedDataAPICatalogItem.prototype
     * @type {Object}
     */
    serializers: {
        get() { return AggregatedDataAPICatalogItem.defaultSerializers; }
    },

    /**
     * Gets the fields available for this catalog item.
     * @type {Object[]}
     */
    fields: {
        get() { return this._fields; }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived for a
 * share link.
 * @type {String[]}
 */
AggregatedDataAPICatalogItem.defaultPropertiesForSharing = clone(TableCatalogItem.defaultPropertiesForSharing);
freezeObject(AggregatedDataAPICatalogItem.defaultPropertiesForSharing);

AggregatedDataAPICatalogItem.defaultSerializers = clone(TableCatalogItem.defaultSerializers);
freezeObject(AggregatedDataAPICatalogItem.defaultSerializers);

// Just the items that would influence the load from the server or the file
AggregatedDataAPICatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url];
};

/**
 * Load the item from this.url.
 * @return {Promise} A promise that resolves when the load is complete.
 */
AggregatedDataAPICatalogItem.prototype._load = function() {
    var item = this;
    // Set some defaults.
    item.regionTypeKey = defaultValue(item.regionTypeKey, 'region_type');

    if (!defined(item.base_url) || !defined(item.tableCode)) {
        var uri = new URI(item.url).search(''); // search('') removes any trailing query parameters, eg. ?bar=baz&a=b.
        var uriSegments = uri.segmentCoded(); // eg. http://example.org/v0/tables/ABC -> ["v0", "tables", "ABC"].
        var tablesIndex = uriSegments.indexOf(TABLES_URI_COMPONENT);
        if (!defined(item.tableCode)) {
            if (tablesIndex === -1) {
                throw new TerriaError({
                    title: 'Invalid Aggregated Data API Server',
                    message: '\
An error occurred while invoking the Aggregated Data API.  The server\'s response does not appear to be valid.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, this error may indicate that the item you opened is temporarily unavailable or there is a \
problem with your internet connection.  Try opening it again, and if the problem persists, please report it by \
sending an email to <a href="mailto:' + item.terria.supportEmail + '">' + item.terria.supportEmail + '</a>.</p>'
                });
            }
            if (tablesIndex === uriSegments.length) {
                throw new TerriaError({
                    title: 'Please provide a table code to the Aggregated Data API',
                    message: 'Please append a table code to the end of the URL.'
                });
            }
            item.tableCode = uriSegments[tablesIndex + 1];
        }
        if (tablesIndex >= 0) {
            uriSegments = uriSegments.slice(0, tablesIndex);
        }
        item.base_url = uri.segmentCoded(uriSegments).toString();
    }

    var tableStyle = item._tableStyle;
    item._columnOptions = {
        displayDuration: tableStyle.displayDuration,
        displayVariableTypes: TableStructure.defaultDisplayVariableTypes,
        replaceWithNullValues: tableStyle.replaceWithNullValues,
        replaceWithZeroValues: tableStyle.replaceWithZeroValues,
        tableStructure: undefined
    };

    // We pass column options to TableStructure too, but they only do anything if TableStructure itself (eg. via fromJson) adds the columns,
    // which is not the case here.  We will need to pass them to each call to new TableColumn as well.
    item._tableStructure = new TableStructure(item.name, item._columnOptions);
    item._columnOptions.tableStructure = item._tableStructure;
    item._regionMapping = new RegionMapping(item, item._tableStructure, tableStyle);
    item._regionMapping.changedEvent.addEventListener(dataChanged.bind(null, item), item);  // TODO: not sure we need this.

    return loadItem(item);
};

// An event listened triggered whenever the dataSource or regionMapping changes.
// Used to know when to redraw the display.
function dataChanged(item) {
    item.terria.currentViewer.notifyRepaintRequired();
}

function loadItem(item) {
    var uri = new URI(item.base_url);
    uri = uri.addQuery("flatten", "all"); // Only shows a single level of hierarchy so far.
    var tableInfoUrl = uri.segmentCoded(uri.segmentCoded().concat([TABLES_URI_COMPONENT, item.tableCode])).toString();
    var proxiedTableInfoUrl = proxyCatalogItemUrl(item, tableInfoUrl.toString(), {keyType: item.keyType});

    return loadJson(proxiedTableInfoUrl).then(function(json) {
        // First improve the default name of this catalog item.
        if (item.name === item.url) {
            item.name = defaultValue(json.name, item.tableCode);
        }
        item.description = defaultValue(item.description, json.description);
        item._fields = json.fields;
        item._unit = json.unit;
        buildConcepts(item);
        return loadData(item);
    });
}

function loadData(item) {
    const group_bys = [];
    // The API automatically groups by date if needed.
    // const dateFields = item.fields.filter(field => field.is_longitudinal);
    // if (dateFields.length > 0) {
    //     group_bys.push(dateFields[0].name);
    // }
    // Find which region type to group by.
    const topLevelRegionTypeConcepts = item._concepts.filter(concept => concept.id === 'region_type');
    if (topLevelRegionTypeConcepts.length > 0) {
        // Find the (first) active region type.
        const activeRegionTypes = topLevelRegionTypeConcepts[0].items.filter(concept => concept.isActive);
        group_bys.push(activeRegionTypes[0].id);
    } else {
        // No region type concepts. There must only be one available, so just use it.
        const regionTypeFields = item.fields.filter(field => defined(field.region_type));
        group_bys.push(regionTypeFields[0].name);
    }
    // Find which concept is selected in each group.
    const selectedConditions = [];

    const topLevelTopicConceptIndex = item._concepts.map(concept => concept.id).indexOf('topic');
    const valuesKeyedByFieldId = {};
    item.activeConcepts[topLevelTopicConceptIndex].forEach(activeConcept => {
        if (!valuesKeyedByFieldId.hasOwnProperty(activeConcept.parent.id)) {
            valuesKeyedByFieldId[activeConcept.parent.id] = [];
        }
        valuesKeyedByFieldId[activeConcept.parent.id].push(activeConcept.id);
    });
    Object.keys(valuesKeyedByFieldId).forEach(activeFieldId => {
        selectedConditions.push(activeFieldId + '=' + valuesKeyedByFieldId[activeFieldId].join(';'));
    });
    // For now, add an arbitrary condition on the longitudinal field, if present.
    // TODO: Make it work with the timeslider instead.
    var longitudinal_fields = item._fields.filter(field => field.is_longitudinal);
    longitudinal_fields.forEach(field => {
        // Set the condition that it equals the last available value (eg. the last year in the list), skipping sentinels.
        var value = 2011;  // TODO: arbitrary default if no values specified...
        if (defined(field.values)) {
            var values = field.values.filter(value => !value.is_sentinel);
            if (values.length > 0) {
                value = values.slice(values.length - 1)[0].name;
            }
        }
        selectedConditions.push(field.name + '=' + value);
    });

    // const activeTopicCodes = topLevelTopicConcept.items.reduce((codesSoFar, topicConcept) =>
    //     codesSoFar.concat(topicConcept.items.filter(concept => concept.isActive).map(concept => concept.id)),
    //     []);
    // group_bys = group_bys.concat(activeTopicCodes);

    // We may need to make two different API calls, if we could show this as a percent of the region total:
    // one to get the number meeting the condition, one to get the total.
    const promises = [];
    const uri = new URI(item.base_url);
    uri.segmentCoded(uri.segmentCoded().concat([TABLES_URI_COMPONENT, item.tableCode, 'aggregation']));
    var query = {
        group_by: group_bys.join(',')  // Note URI would turn an array into group_by=YEAR&group_by=AGE, not group_by=YEAR,AGE.
    };
    if (selectedConditions.length > 0) {
        query['where'] = selectedConditions.join(',');
    }
    uri.query(query);
    const proxiedUrl = proxyCatalogItemUrl(item, uri.toString(), {keyType: item.keyType});
    promises.push(loadJson(proxiedUrl));

    if (!defined(item._regionTotals[JSON.stringify(group_bys)])) {
        const totalUri = new URI(item.base_url);
        totalUri.segmentCoded(totalUri.segmentCoded().concat([TABLES_URI_COMPONENT, item.tableCode, 'aggregation']));
        totalUri.query({
            where: 'Year=2011', // TODO: Year=2011 just to get things working.
            group_by: group_bys.join(',')  // Note URI would turn an array into group_by=YEAR&group_by=AGE, not group_by=YEAR,AGE.
        });
        const proxiedTotalUrl = proxyCatalogItemUrl(item, uri.toString(), {keyType: item.keyType});
        promises.push(loadJson(proxiedTotalUrl));
    }

    item.isLoading = true;
    return when.all(promises).then(function(jsons) {
        if (jsons.length > 1) {
            // We also have the regional totals.
            // Save these as an associative array (ie. object) so we can quickly look up totals and append them to the main table.
            const totalsJson = jsons[1];
            item._regionTotals[JSON.stringify(group_bys)] = createTotalsObject(totalsJson);
        }
        const json = jsons[0];  // The json of the request that meets the conditions.
        buildTableStructureWithTotals(item, json, selectedConditions.length, item._regionTotals[JSON.stringify(group_bys)]);
        item._regionMapping._tableStructure = item._tableStructure;
        item._regionMapping.isLoading = true;
        return item._regionMapping.loadRegionDetails();
    }).then(function(regionDetails) {
        if (regionDetails) {
            item._regionMapping.setRegionColumnType();
            // Force a recalc of the imagery.
            // Required because we load the region details _after_ setting the active column.
            item._regionMapping.isLoading = false;
            item.isLoading = false;
        }
        // } else {
        //     item.setChartable();
        // }
        return when();
    }).otherwise(function(e) {
        item._tableStructure.columns = [];
        item.isLoading = false;
        item._regionMapping.isLoading = false;
        if (defined(e.response)) {
            try {
                const errorJson = JSON.parse(e.response);
                item.terria.error.raiseEvent(new TerriaError({
                    sender: item,
                    title: errorJson.title,
                    message: errorJson.detail
                }));
                return;
            } catch (e2) {}
        }
        item.terria.error.raiseEvent(new TerriaError({
            sender: item,
            title: 'No data available',
            message: (e.message || e.response)
        }));
    });
}

function buildConcepts(item) {
    var allConcepts = [];
    // Get all the region-type concepts
    var regionTypeFields = item.fields.filter(field => defined(field.region_type));
    if (regionTypeFields.length === 0) {
        throw new TerriaError({
                    title: 'No region types found',
                    message: '\
An error occurred while invoking the Aggregated Data API.  No region data is available.  \
<p>If you entered the link manually, please verify that the link is correct.</p>\
<p>If you did not enter this link manually, please report it by \
sending an email to <a href="mailto:' + item.terria.supportEmail + '">' + item.terria.supportEmail + '</a>.</p>'
            });
    }
    item._regionTypeField = regionTypeFields[0];
    if (regionTypeFields.length > 1) {
        var topLevelRegionTypeConcept = new DisplayVariablesConcept('Region type');
        topLevelRegionTypeConcept.id = 'region_type';
        topLevelRegionTypeConcept.items = regionTypeFields.map((field, fieldIndex) =>
            new VariableConcept(field.title, {
                parent: topLevelRegionTypeConcept,
                id: field.name,
                active: fieldIndex === 0
            })
        );
        allConcepts.push(topLevelRegionTypeConcept);
    }
    // Group all the non-date, non-regiontype concepts by topic.
    // The advantage to nesting like this is that when items passed in as options,
    // DisplayVariablesConcept sets the parent on its items.
    // (Note SummaryConcept inherits from DisplayVariablesConcept.)
    var allTopics = getUniqueValues(item._fields.map(
        field => field.groups && field.groups.join(' ')
    ).filter(topic => defined(topic)));
    // The hierarchy may extend any amount above this (grouping fields into topics),
    // or below this (grouping field values into groups, eg. 0-4 years / 0,1,2,3,4.)
    // When we call the API, we ignore everything about the hierarchy except
    // the field id and the value ids it takes.
    // So given an active concept (which must therefore represent a value), its id is
    // easy, but we also need to get its field id.
    // The trick we will use is: Everywhere in the hierarchy from the field
    // to the parent of the value, we'll use the same concept id = the field's id.
    //
    // But for now, I'm assuming there are no layers of hierarchy between field & value.
    var topLevelTopicConcept = new SummaryConcept('Conditions', {
        id: 'topic',
        isOpen: false,
        allowMultiple: true,
        items: allTopics.map((topicName, topicIndex) => {
            var concept = new DisplayVariablesConcept(topicName, {
                isOpen: false,
                items: item.fields
                    .filter(field => field.groups && field.groups.join(' ') === topicName)
                    .filter(field => defined(field.values))
                    .filter(field => !(defined(field.region_type) || field.is_longitudinal))
                    .map((field, fieldIndex) => {
                        var fieldConcept = new DisplayVariablesConcept(field.title, {
                            id: field.name,
                            isOpen: false,
                            allowMultiple: true,
                            items: field.values.map(value => {
                                var variableConcept = new VariableConcept(value.title || value.name, {
                                    id: value.name,
                                    active: false  // Need to allow some to start active
                                });
                                // Override the usual boolean isActive with a version that remembers the display order.
                                variableConcept.toggleActive = function() {
                                    toggleActiveConceptStoringOrdering(this, item);
                                };
                                return variableConcept;
                            })
                        });
                        return fieldConcept;
                    })
            });
            return concept;
        }).filter(concept => concept.items.length > 0)
    });

    // Override its toggleActive so it looks two levels deep, not just the default one.
    // topLevelTopicConcept.toggleActiveItem = toggleActiveTopicItem.bind(null, item);
    allConcepts.push(topLevelTopicConcept);
    // Set the item's concepts.
    item._concepts = allConcepts;
    // In an earlier version, also added the table structure's columns at the top of the list.
    // [item._tableStructure].concat(allConcepts);
}

function buildTableStructureWithTotals(item, json, numberOfSelectedConditions, regionTotalsObject) {
    const fieldIndices = getJsonFieldIndices(json.fields);
    if (fieldIndices.result.length !== 1) {
        throw new TerriaError('Unexpected results were returned (' + fieldIndices.result.length + ' result fields).');
    }
    const resultIndex = fieldIndices.result[0];
    // Convert the json format to the format required by TableStructure.fromJson,
    // eg. [['date', 'lga', 'perturbed count'], [2015, 10111, 1405], ...].
    let tableStructureJson = [json.fields.map(field => getFieldName(item, field, numberOfSelectedConditions))].concat(json.values);
    // And add "columns" to this json for the totals.
    if (defined(regionTotalsObject)) {
        const keyElements = fieldIndices.is_longitudinal.concat(fieldIndices.region);
        tableStructureJson = tableStructureJson.map((row, rowNumber) => {
            if (rowNumber === 0) {
                return row.concat([getResultName(item, 0, true, false), // eg. "Number of people in the region"
                                   getResultName(item, numberOfSelectedConditions, true, true)]); // eg. "Percentage of people meeting the conditions in the region"
            } else {
                const totalKey = makeTotalsKey(keyElements.map(index => row[index]));
                const regionTotal = regionTotalsObject[totalKey] || null;
                let fraction = null;
                if (defined(regionTotal) && regionTotal !== 0) {
                    fraction = row[resultIndex] / regionTotal;
                    fraction = (fraction < 0.01) ? (Math.round(fraction * 1000) / 10) : (Math.round(fraction * 10000) / 100);
                }
                return row.concat([regionTotalsObject[totalKey], fraction]);
            }
        });
    }
    TableStructure.fromJson(tableStructureJson, item._tableStructure);
    item._resultColumnIndex = resultIndex;
    setActiveColumnForDisplayPercent(item);
}

function setActiveColumnForDisplayPercent(item) {
    item._tableStructure.columns[item._tableStructure.columns.length - 1].isActive = (item.displayPercent); // The final column is the percentage.
    item._tableStructure.columns[item._resultColumnIndex].isActive = (!item.displayPercent);
}

// function getIndexOfField(fields, field) {
//     return fields.map(thisField => thisField.name).indexOf(field.name);
// }

// function setTableStructureFromDataFrameJson(item, json) {
//     // json has the format:
//     // {"fields": [{"name": "GENDER", "title": "Gender", "type": "integer"},
//     //             {"is_calculated": true, "name": "perturbed count", "title": "perturbed count"}],
//     //  "values": [[1, 136076], [2, 136814]]}
//     // So convert from a dataframe format to a 2D csv format, by switching
//     // each unique value of the calculated field to its own column.
//     var columns = [];
//     // Get the time dimension, if any, and rename it.
//     var dateFields = json.fields.filter(field => field.is_longitudinal);
//     var uniqueDates;
//     var uniqueRegions;
//     if (dateFields.length > 0) {
//         var dateIndex = getIndexOfField(json.fields, dateFields[0]);
//         uniqueDates = getUniqueValues(json.values.map(row => row[dateIndex]));
//     }
//     // Get the region dimension and rename it.
//     var regionFields = json.fields.filter(field => defined(field.region_type));
//     if (regionFields.length > 0) {
//         var regionIndex = getIndexOfField(json.fields, regionFields[0]);
//         json.fields[regionIndex].title = regionFields[0].region_type;
//         uniqueRegions = getUniqueValues(json.values.map(row => row[regionIndex]));
//     }
//     // Find the calculated (result) column.
//     var resultFields = json.fields.filter(field => field.is_calculated);
//     if (resultFields.length === 0) {
//         throw new TerriaError('No calculated field was returned.');
//     }
//     var resultIndex = getIndexOfField(json.fields, resultFields[0]);
//     // Find the category field.
//     var isCategoryField = (field) => !field.is_calculated && !field.is_longitudinal && !defined(field.region_type);
//     var categoryFields = json.fields.filter(isCategoryField);
//     var categoryField = categoryFields[0];
//     var categoryIndex = getIndexOfField(json.fields, categoryField);
//     var uniqueCategories = getUniqueValues(json.values.map(row => row[categoryIndex]));
//     uniqueCategories.sort();
//     // Make date and region columns with all the possible combinations of the two.
//     var regionValues = [];
//     var dateValues = [];
//     var categoryValuesArrays = uniqueCategories.map(category => {
//         var array = [];
//         array.length = uniqueDates.length * uniqueRegions.length;
//         return array;
//     });
//     for (var uniqueDateIndex = 0; uniqueDateIndex < uniqueDates.length; uniqueDateIndex++) {
//         for (var uniqueRegionIndex = 0; uniqueRegionIndex < uniqueRegions.length; uniqueRegionIndex++) {
//             dateValues.push(uniqueDates[uniqueDateIndex]);
//             regionValues.push(uniqueRegions[uniqueRegionIndex]);
//         }
//     }
//     for (var rowIndex = 0; rowIndex < json.values.length; rowIndex++) {
//         var row = json.values[rowIndex];
//         var dateValuesIndex = uniqueDates.indexOf(row[dateIndex]);
//         var regionValuesIndex = uniqueRegions.indexOf(row[regionIndex]);
//         var finalIndex = dateValuesIndex * uniqueRegions.length + regionValuesIndex;
//         var categoryValuesIndex = uniqueCategories.indexOf(row[categoryIndex]);
//         categoryValuesArrays[categoryValuesIndex][finalIndex] = row[resultIndex];
//     }
//     // TODO: what if no date column?
//     var dateColumnOptions = clone(item._columnOptions);
//     dateColumnOptions.type = VarType.HIDDEN; // Don't trigger timeline off the dates. Hide the date column.
//     columns.push(new TableColumn(dateFields[0].title, dateValues, dateColumnOptions));
//     columns.push(new TableColumn(regionFields[0].region_type, regionValues, item._columnOptions));
//     columns = columns.concat(categoryValuesArrays.map((values, i) => {
//         // If column values are available, replace the category codes with nice names.
//         var originalFieldIndex = getIndexOfField(item._fields, categoryField);
//         var originalField = (originalFieldIndex >= 0) ? item._fields[originalFieldIndex] : {};
//         var categoryCode = uniqueCategories[i];
//         var categoryName;
//         if (defined(originalField.values) && defined(originalField.values[categoryCode])) {
//             categoryName = defaultValue(originalField.values[categoryCode].title, categoryCode.toString());
//         } else {
//             categoryName = categoryCode.toString();
//         }
//         return new TableColumn(categoryName, values, item._columnOptions);
//     }));
//     columns[2].isActive = true;  // TODO: improve

//     item._tableStructure.columns = columns;
//     item._tableStructure.name = categoryField.title + ' (count)';
//     // This would lead to the legend having unhelpful titles like 'Unstated' or 'Germany'.
//     // Use regionMapping's tableStyle.columns[].legendName to give better titles.
//     var updatedTableStyle = clone(item._tableStyle);
//     if (!defined(updatedTableStyle.columns)) {
//         updatedTableStyle.columns = {};
//     }
//     columns.forEach(column => {
//         if (!defined(updatedTableStyle.columns[column.name])) {
//             updatedTableStyle.columns[column.name] = new TableColumnStyle();
//         }
//         updatedTableStyle.columns[column.name].legendName = categoryField.title + ': ' + column.name + ' (count)';
//     });
//     item._regionMapping._tableStyle = updatedTableStyle;  // Ideally wouldn't use an underscored property.

//     // var dateColumnOptions = clone(item._columnOptions);
//     // // If it only has one unique value, don't trigger timeline
//     // var dateValues = json.values.map(row => row[dateIndex]);
//     // if (getUniqueValues(dateValues).length === 1) {
//     //     dateColumnOptions.type = VarType.ENUM;
//     // }
// }

function getResultName(item, numberOfSelectedConditions, isInRegion, isPercent) {
    const numberText = isPercent ? 'Percentage' : 'Number';
    const ofWhatText = defined(item._unit) ? (' of ' + item._unit.plural) : '';
    const conditionsText = numberOfSelectedConditions === 1 ? 'the condition' : 'all conditions';
    const meetingWhatText = numberOfSelectedConditions > 0 ? (' meeting ' + conditionsText) : '';
    const inRegionText = isInRegion ? ' in the region' : '';
    return numberText + ofWhatText + meetingWhatText + inRegionText;
}

// Rename any region dimension as the region type.
// Rename the calculated field to "Number of <units> meeting the conditions" or similar.
function getFieldName(item, field, numberOfSelectedConditions) {
    if (field.is_calculated) {
        return getResultName(item, numberOfSelectedConditions, false, false);
    }
    if (field.region_type) {
        return field.region_type;
    }
    return field.name;
}

/**
 * @param  {Array} array.
 * @param  {Function} condition A function(value, index) which returns a boolean.
 * @return {Integer[]} The indices of elements in the array for which the condition is true.
 * @private
 */
function getIndicesWhere(array, condition) {
    return array.map((value, index) => condition(value, index) ? index : null).filter(defined);
}

/**
 * @param  {Object[]} fields Typically from json.fields.
 * @return {Object} Returns an object containing four arrays of indices,
 *     testing for those fields with is_longitudinal=true, region_type defined, is_calculated=true, and none of the above.
 * @private
 */
function getJsonFieldIndices(fields) {
    // fields comes from json.fields, and has the format:
    // [{"name": "GENDER", "title": "Gender", "type": "integer"},
    //  {"is_calculated": true, "name": "perturbed count", "title": "perturbed count"}]
    return {
        is_longitudinal: getIndicesWhere(fields, field => field.is_longitudinal),
        region: getIndicesWhere(fields, field => defined(field.region_type)),
        result: getIndicesWhere(fields, field => field.is_calculated),
        category: getIndicesWhere(fields, field => !field.is_calculated && !field.is_longitudinal && !defined(field.region_type))
    };
}

function makeTotalsKey(elements) {
    return elements.join('^^^');
}

function createTotalsObject(totalsJson) {
    // There are three types of columns we need to identify here.
    // 1. Longitudinal columns (which have is_longitudinal=true; usually just "year", but there could in theory be > 1).
    // 2. Region column (which have a region_type).
    // 3. The result column (which will have is_calculated=true).
    // The first two are joined together in the order above to produce a key.
    // An object is created with these keys, and values equal to the results.
    const fieldIndices = getJsonFieldIndices(totalsJson.fields);
    if (fieldIndices.region.length === 0) {
        throw new TerriaError('No regional totals were returned (missing region field).');
    }
    if (fieldIndices.result.length !== 1) {
        throw new TerriaError('Unexpected regional totals were returned (' + fieldIndices.result.length + ' result fields).');
    }
    if (fieldIndices.category.length !== 0) {
        throw new TerriaError('Regional totals were returned with an unexpected category field.');
    }
    const keyIndices = fieldIndices.is_longitudinal.concat(fieldIndices.region);
    const resultIndex = fieldIndices.result[0];
    const totalsObject = {};
    totalsJson.values.forEach(rowValues => {
        const key = makeTotalsKey(keyIndices.map(i => rowValues[i]));
        totalsObject[key] = rowValues[resultIndex];
    });
    return totalsObject;
}

// Called when the active column changes.
// Swallows the resulting promise.
function changedActiveItems(item) {
    // Close any picked features, as the description of any associated with this catalog item may change.
    item.terria.pickedFeatures = undefined;
    loadData(item);
}

function toggleActiveConceptStoringOrdering(concept, item) {
    // When deactivating, easy - set isActive to false.
    // When activating:
    //   - If any other concepts in this field are already active, copy their isActive value.
    //   - If not, set isActive equal to the max of the existing isActive values + 1,
    //     so it will stay in the same place in the UI.
    if (concept.isActive) {
        concept.isActive = !concept.isActive;
    } else {
        const activeSiblings = concept.parent.items.filter(sibling => sibling.isActive);
        if (activeSiblings.length > 0) {
            concept.isActive = activeSiblings[0].isActive;
        } else {
            var topLevelTopicConceptIndex = item._concepts.map(concept => concept.id).indexOf('topic');
            const activeLeafNodes = item.concepts[topLevelTopicConceptIndex].leafNodes.filter(concept => concept.isActive);
            if (activeLeafNodes.length > 0) {
                const isActiveValues = activeLeafNodes.map(concept => concept.isActive);
                const maxIsActiveValue = Math.max.apply(null, isActiveValues);
                concept.isActive = maxIsActiveValue + 1;
            } else {
                concept.isActive = 1;
            }
        }
    }
}

module.exports = AggregatedDataAPICatalogItem;
