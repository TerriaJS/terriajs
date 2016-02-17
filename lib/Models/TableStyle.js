'use strict';

/*global require*/
var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var inherit = require('../Core/inherit');
var TableColumnStyle = require('./TableColumnStyle');
var updateFromJson = require('../Core/updateFromJson');

/**
 * A set of properties that define how a table, such as a CSV file, should be displayed.
 * If not set explicitly, many of these properties will be given default or guessed values elsewhere,
 * such as in CsvCatalogItem.
 *
 * @alias TableStyle
 * @constructor
 * @extends TableColumnStyle
 *
 * @param {Object} [options] The values of the properties of the new instance.
 */
var TableStyle = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    TableColumnStyle.call(this, options);

    /**
     * The name of the variable (column) to be used for region mapping.
     * @type {String}
     */
    this.regionVariable = options.regionVariable;

    /**
     * The identifier of a region type, as used by RegionProviderList
     * @type {String}
     */
    this.regionType = options.regionType;

    /**
     * The name of the variable (column) containing data to be used for scaling and coloring.
     * @type {String}
     */
    this.dataVariable = options.dataVariable;

    /**
     * The column name or index to use as the time column. Defaults to the first one found. Pass null for none.
     * @type {String|Integer|null}
     */
    this.timeColumn = options.timeColumn;

    /**
     * Column-specific styling, with the format { columnIdentifier1: tableColumnStyle1, columnIdentifier2: tableColumnStyle2, ... },
     * where columnIdentifier is either the name or the column index (zero-based).
     * @type {Object}
     */
    this.columns = objectToTableColumnStyle(options, []);  // If any promises are created (thanks to colorPalette), they are lost here.

};

inherit(TableColumnStyle, TableStyle);

// When columns is updated via json, turn it into TableColumnStyle objects.
// Do this in updateFromJson so we can keep track of the promises required by the colorPalette option.
// This also has the advantage of not using the TableColumnStyle constructor to set the properties, which causes problems with colorPalette too.
TableStyle.prototype.updateFromJson = function(json, options) {
    var promises = [updateFromJson(this, json, options)];
    this.columns = objectToTableColumnStyle(json, promises, options);
    return when.all(promises);
};

TableStyle.prototype.updaters = clone(TableStyle.prototype.updaters);
TableStyle.prototype.updaters['columns'] = function(tableStyle, json, propertyName) {
    // Do not update columns here; do it directly in the updateFromJson function.
    // tableStyle.columns = objectToTableColumnStyle(json[propertyName]);
};
freezeObject(TableStyle.prototype.updaters);

function objectToTableColumnStyle(json, promises, options) {
    if (defined(json.columns)) {
        var columns = {};
        for (var propertyName in json.columns) {
            if (json.columns.hasOwnProperty(propertyName)) {
                columns[propertyName] = new TableColumnStyle();
                var thisPromise = columns[propertyName].updateFromJson(json.columns[propertyName], options);
                if (defined(thisPromise)) {
                    promises.push(thisPromise);
                }
            }
        }
        return columns;
    }

}

module.exports = TableStyle;
