"use strict";

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

/**
 * Represents a CSV TableDataSource for the purposes on modifying it's appearance.
 * A CsvDataset contains an array one of more CsvVariables.
 *
 * @alias CsvDataset
 * @constructor
 */
var CsvDataset = function() {

    /**
     * Gets or sets the name of the concept item.  This property is observable.
     * @type {String}
     */
    this.name = 'Variables';

    /**
     * Gets the list of absCodes contained in this group.  This property is observable.
     * @type {CsvDataset[]}
     */
    this.items = [];

    /**
     * Gets or sets a value indicating whether this concept item is currently open.  When an
     * item is open, its child items (if any) are visible.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = true;

    /**
     * Flag to say if this if this node is selectable.  This property is observable.
     * @type {Boolean}
     */
    this.isSelectable = false;

    /**
     * Function to call if the currently active variable is changed.
     * This property is observable.
     * @type {Function}
     */
    this.updateFunction = undefined;

    knockout.track(this, ['name', 'items', 'isOpen', 'isSelectable', 'updateFunction']);
};

defineProperties(CsvDataset.prototype, {
    /**
     * Gets a value indicating whether this item has child items.
     * @type {Boolean}
     */
    hasChildren : {
        get : function() {
            return this.items.length > 0;
        }
    }
});

/**
 * Toggles the {@link CsvDataset#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
CsvDataset.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

/**
 * Toggles the {@link CsvDataset#isOpen} property.  If this item's list of children is open,
 * calling this method will close it.  If the list is closed, calling this method will open it.
 */
CsvDataset.prototype.setSelected = function(selectedVariable) {
    if (defined(this.updateFunction)) {
        this.updateFunction(selectedVariable);
    }
    this.items.forEach( function(item) {
        item.isActive = (item.name === selectedVariable);
    });
};

module.exports = CsvDataset;
