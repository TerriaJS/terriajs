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

var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var getUniqueValues = require('../Core/getUniqueValues');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var RegionMapping = require('../Models/RegionMapping');
var TableCatalogItem = require('./TableCatalogItem');
var TableColumn = require('../Map/TableColumn');
var TableColumnStyle = require('../Models/TableColumnStyle');
var TableStructure = require('../Map/TableStructure');
var VariableConcept = require('../Map/VariableConcept');
var VarType = require('../Map/VarType');

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

    // The fields available on this table.
    this._fields = undefined;

    // The unit of this table, eg. {singular: "person", plural: "people"}.
    this._unit = undefined;

    // The array of Concepts to display in the NowViewing panel.
    this._concepts = [];

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
    knockout.track(this, ['_concepts']);

    overrideProperty(this, 'concepts', {
        get: function() {
            return this._concepts;
        }
    });

    // For this catalog item, we override the concept's toggleActiveItem instead.
    // knockout.defineProperty(this, 'activeConcepts', {
    //     get: function() {
    //         if (defined(this._concepts) && this._concepts.length > 0) {
    //             // Drill down through all the layers of concepts
    //             var flatten = (concept) => defined(concept.items) ? concept.items.map(c => flatten(c)) : concept;
    //             var actives = flatten(this._concepts).filter(c => c.isActive);
    //             console.log('active', actives);
    //             return actives;
    //         }
    //     }
    // });

    // knockout.getObservable(this, 'activeConcepts').subscribe(function() {
    //     if (!this.isLoading) {
    //         changedActiveItems(this);
    //     }
    // }, this);

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
    }
    item.base_url = uri.segmentCoded(uriSegments).toString();

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

AggregatedDataAPICatalogItem.prototype.startPolling = function() {
    // Polling is not required.
};

// An event listened triggered whenever the dataSource or regionMapping changes.
// Used to know when to redraw the display.
function dataChanged(item) {
    item.terria.currentViewer.notifyRepaintRequired();
}

function loadItem(item) {
    var uri = new URI(item.base_url);
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
    var group_by = [];
    // Do we need to group by date?
    var dateFields = item.fields.filter(field => field.longitudinal);
    if (dateFields.length > 0) {
        group_by.push(dateFields[0].name);
    }
    // Find which region type to group by.
    var topLevelRegionTypeConcepts = item._concepts.filter(concept => concept.id === 'region_type');
    if (topLevelRegionTypeConcepts.length > 0) {
        // Find the (first) active region type.
        var activeRegionTypes = topLevelRegionTypeConcepts[0].items.filter(concept => concept.isActive);
        group_by.push(activeRegionTypes[0].id);
    } else {
        // No region type concepts. There must only be one available, so just use it.
        var regionTypeFields = item.fields.filter(field => defined(field.region_type));
        group_by.push(regionTypeFields[0].name);
    }
    // Find which concept is selected in each group.
    var topLevelTopicConcept = item._concepts.filter(concept => concept.id === 'topic')[0];
    var activeTopicCodes = topLevelTopicConcept.items.reduce((codesSoFar, topicConcept) =>
        codesSoFar.concat(topicConcept.items.filter(concept => concept.isActive).map(concept => concept.id)),
        []);
    group_by = group_by.concat(activeTopicCodes);

    var uri = new URI(item.base_url);
    uri.segmentCoded(uri.segmentCoded().concat([TABLES_URI_COMPONENT, item.tableCode, 'aggregation']));
    uri.query({
        where: 'YEAR=2006',  // TODO: just to get things working
        group_by: group_by.join(',')  // Note URI would turn an array into group_by=YEAR&group_by=AGE, not group_by=YEAR,AGE.
    });

    var proxiedUrl = proxyCatalogItemUrl(item, uri.toString(), {keyType: item.keyType});

    return loadJson(proxiedUrl).then(function(json) {
        setTableStructureFromDataFrameJson(item, json);
        item._regionMapping._tableStructure = item._tableStructure;
        item._regionMapping.isLoading = true;
        return item._regionMapping.loadRegionDetails();
    }).then(function(regionDetails) {
        if (regionDetails) {
            RegionMapping.setRegionColumnType(regionDetails);
            // Force a recalc of the imagery.
            // Required because we load the region details _after_ setting the active column.
            item._regionMapping.isLoading = false;
        }
        // } else {
        //     item.setChartable();
        // }
        return when();
    }).otherwise(function(e) {
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
    //if (regionTypeFields.length > 1) {
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
    //}
    // Group all the non-date, non-regiontype concepts by topic
    var allTopics = getUniqueValues(item._fields.map(field => field.topic));
    var topLevelTopicConcept = new DisplayVariablesConcept('Topic');
    topLevelTopicConcept.id = 'topic';
    // Override its toggleActive so it looks two levels deep, not just the default one.
    topLevelTopicConcept.toggleActiveItem = toggleActiveTopicItem.bind(null, item);
    var topicConcepts = allTopics.map((topicName, topicIndex) => {
        var concept = new DisplayVariablesConcept(topicName);
        concept.items = item.fields
            .filter(field => field.topic === topicName)
            .filter(field => !(defined(field.region_type) || field.longitudinal))
            .map((field, fieldIndex) =>
                new VariableConcept(field.title, {
                    // If we wanted one per topic, we would use parent=concept.
                    // But we want one for all topics.
                    parent: topLevelTopicConcept,
                    id: field.name,
                    active: topicIndex === 6 && fieldIndex === 5 // TODO: improve!
                })
            );
        return concept;
    });
    topLevelTopicConcept.items = topicConcepts.filter(concept => concept.items.length > 0);
    allConcepts.push(topLevelTopicConcept);
    // Set the item's concepts.  Add the table structure to the top.
    item._concepts = [item._tableStructure].concat(allConcepts);
}

function getIndexOfField(fields, field) {
    return fields.map(thisField => thisField.name).indexOf(field.name);
}

function setTableStructureFromDataFrameJson(item, json) {
    // json has the format:
    // {"fields": [{"name": "GENDER", "title": "Gender", "type": "integer"},
    //             {"calculated": true, "name": "perturbed count", "title": "perturbed count"}],
    //  "values": [[1, 136076], [2, 136814]]}
    // So convert from a dataframe format to a 2D csv format, by switching
    // each unique value of the calculated field to its own column.
    var columns = [];
    // Get the time dimension, if any, and rename it.
    var dateFields = json.fields.filter(field => field.longitudinal);
    var uniqueDates;
    var uniqueRegions;
    if (dateFields.length > 0) {
        var dateIndex = getIndexOfField(json.fields, dateFields[0]);
        uniqueDates = getUniqueValues(json.values.map(row => row[dateIndex]));
    }
    // Get the region dimension and rename it.
    var regionFields = json.fields.filter(field => defined(field.region_type));
    if (regionFields.length > 0) {
        var regionIndex = getIndexOfField(json.fields, regionFields[0]);
        json.fields[regionIndex].title = regionFields[0].region_type;
        uniqueRegions = getUniqueValues(json.values.map(row => row[regionIndex]));
    }
    // Find the calculated (result) column.
    var resultFields = json.fields.filter(field => field.calculated);
    if (resultFields.length === 0) {
        throw new TerriaError('No calculated field was returned.');
    }
    var resultIndex = getIndexOfField(json.fields, resultFields[0]);
    // Find the category field.
    var isCategoryField = (field) => !field.calculated && !field.longitudinal && !defined(field.region_type);
    var categoryFields = json.fields.filter(isCategoryField);
    var categoryField = categoryFields[0];
    var categoryIndex = getIndexOfField(json.fields, categoryField);
    var uniqueCategories = getUniqueValues(json.values.map(row => row[categoryIndex]));
    uniqueCategories.sort();
    // Make date and region columns with all the possible combinations of the two.
    var regionValues = [];
    var dateValues = [];
    var categoryValuesArrays = uniqueCategories.map(category => {
        var array = [];
        array.length = uniqueDates.length * uniqueRegions.length;
        return array;
    });
    for (var uniqueDateIndex = 0; uniqueDateIndex < uniqueDates.length; uniqueDateIndex++) {
        for (var uniqueRegionIndex = 0; uniqueRegionIndex < uniqueRegions.length; uniqueRegionIndex++) {
            dateValues.push(uniqueDates[uniqueDateIndex]);
            regionValues.push(uniqueRegions[uniqueRegionIndex]);
        }
    }
    for (var rowIndex = 0; rowIndex < json.values.length; rowIndex++) {
        var row = json.values[rowIndex];
        var dateValuesIndex = uniqueDates.indexOf(row[dateIndex]);
        var regionValuesIndex = uniqueRegions.indexOf(row[regionIndex]);
        var finalIndex = dateValuesIndex * uniqueRegions.length + regionValuesIndex;
        var categoryValuesIndex = uniqueCategories.indexOf(row[categoryIndex]);
        categoryValuesArrays[categoryValuesIndex][finalIndex] = row[resultIndex];
    }
    // TODO: what if no date column?
    var dateColumnOptions = clone(item._columnOptions);
    dateColumnOptions.type = VarType.HIDDEN; // Don't trigger timeline off the dates. Hide the date column.
    columns.push(new TableColumn(dateFields[0].title, dateValues, dateColumnOptions));
    columns.push(new TableColumn(regionFields[0].region_type, regionValues, item._columnOptions));
    columns = columns.concat(categoryValuesArrays.map((values, i) => {
        // If column values are available, replace the category codes with nice names.
        var originalFieldIndex = getIndexOfField(item._fields, categoryField);
        var originalField = (originalFieldIndex >= 0) ? item._fields[originalFieldIndex] : {};
        var categoryCode = uniqueCategories[i];
        var categoryName;
        if (defined(originalField.values) && defined(originalField.values[categoryCode])) {
            categoryName = defaultValue(originalField.values[categoryCode].title, categoryCode.toString());
        } else {
            categoryName = categoryCode.toString();
        }
        return new TableColumn(categoryName, values, item._columnOptions);
    }));
    columns[2].isActive = true;  // TODO: improve

    item._tableStructure.columns = columns;
    item._tableStructure.name = categoryField.title + ' (count)';
    // This would lead to the legend having unhelpful titles like 'Unstated' or 'Germany'.
    // Use regionMapping's tableStyle.columns[].legendName to give better titles.
    var updatedTableStyle = clone(item._tableStyle);
    if (!defined(updatedTableStyle.columns)) {
        updatedTableStyle.columns = {};
    }
    columns.forEach(column => {
        if (!defined(updatedTableStyle.columns[column.name])) {
            updatedTableStyle.columns[column.name] = new TableColumnStyle();
        }
        updatedTableStyle.columns[column.name].legendName = categoryField.title + ': ' + column.name + ' (count)';
    });
    item._regionMapping._tableStyle = updatedTableStyle;  // Ideally wouldn't use an underscored property.

    // var dateColumnOptions = clone(item._columnOptions);
    // // If it only has one unique value, don't trigger timeline
    // var dateValues = json.values.map(row => row[dateIndex]);
    // if (getUniqueValues(dateValues).length === 1) {
    //     dateColumnOptions.type = VarType.ENUM;
    // }
}

// Override DisplayVariable.prototype.toggleActive so it looks two levels deep,
// not just the default one.
function toggleActiveTopicItem(item, variable) {
    var parent = variable.parent;
    var hasChanged = false;
    for (var i = 0; i < parent.items.length; i++) {
        var topicConcept = parent.items[i];
        for (var j = 0; j < topicConcept.items.length; j++) {
            var target = topicConcept.items[j] === variable;
            if (topicConcept.items[j].isActive !== target) {
                topicConcept.items[j].isActive = target;
                hasChanged = true;
            }
        }
    }
    if (hasChanged) {
        loadData(item);
    }
}


// Called when the active column changes.
// Returns a promise.
// function changedActiveItems(item) {
//     console.log('changed active items');
// }

module.exports = AggregatedDataAPICatalogItem;
