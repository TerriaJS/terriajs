'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');

var ColorMap = require('../Map/ColorMap');
var inherit = require('../Core/inherit');
var serializeToJson = require('../Core/serializeToJson');
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
    this.columns = undefined;
    if (defined(options.columns)) {
        this.columns = {};
        for (var propertyName in options.columns) {
            if (options.columns.hasOwnProperty(propertyName)) {
                this.columns[propertyName] = new TableColumnStyle(options.columns[propertyName]);
            }
        }
    }

};

inherit(TableColumnStyle, TableStyle);

module.exports = TableStyle;
