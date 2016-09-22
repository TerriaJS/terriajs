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
// var when = require('terriajs-cesium/Source/ThirdParty/when');

var DisplayVariablesConcept = require('../Map/DisplayVariablesConcept');
var getUniqueValues = require('../Core/getUniqueValues');
var inherit = require('../Core/inherit');
var TerriaError = require('../Core/TerriaError');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var RegionMapping = require('../Models/RegionMapping');
var TableCatalogItem = require('./TableCatalogItem');
// var TableColumn = require('../Map/TableColumn');
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

    // The fields available on this table.
    this._fields = undefined;

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
 * @return {[type]} [description]
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
        replaceWithZeroValues: tableStyle.replaceWithZeroValues
    };

    // We pass column options to TableStructure too, but they only do anything if TableStructure itself (eg. via fromJson) adds the columns,
    // which is not the case here.  We will need to pass them to each call to new TableColumn as well.
    item._tableStructure = new TableStructure(item.name, item._columnOptions);
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
    var proxiedTableInfoUrl = proxyCatalogItemUrl(item, tableInfoUrl.toString());

    return loadJson(proxiedTableInfoUrl).then(function(json) {
        // First improve the default name of this catalog item.
        if (item.name === item.url) {
            item.name = defaultValue(json.name, item.tableCode);
        }
        item.description = defaultValue(item.description, json.description);
        item._fields = json.fields;
        return buildConcepts(item);
    });
}

function buildConcepts(item) {
    var allTopics = getUniqueValues(item._fields.map(field => field.topic));
    var topicConcepts = allTopics.map((topicName, topicIndex) => {
        var concept = new DisplayVariablesConcept(topicName);
        concept.items = item.fields
            .filter(field => field.topic === topicName)
            .map((field, fieldIndex) =>
                new VariableConcept(field.name, {
                    parent: concept,
                    active: topicIndex === 0 && fieldIndex === 0
                })
            );
        return concept;
    });
    var topLevelConcept = new DisplayVariablesConcept('Topic');
    topLevelConcept.items = topicConcepts;
    item._concepts = [topLevelConcept];
}

// Called when the active column changes.
// Returns a promise.
function changedActiveItems(item) {
    console.log('changed active items');
}

module.exports = AggregatedDataAPICatalogItem;
