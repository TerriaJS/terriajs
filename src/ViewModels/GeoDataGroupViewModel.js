'use strict';

/*global require*/

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var createGeoDataItemFromType = require('./createGeoDataItemFromType');
var GeoDataItemViewModel = require('./GeoDataItemViewModel');
var inherit = require('../inherit');

/**
 * A group of data in the {@link GeoDataCatalogViewModel}.  A group can contain
 * {@link GeoDataItemViewModel|GeoDataItemViewModels} or other
 * {@link GeoDataGroupViewModel|GeoDataGroupViewModels}.
 *
 * @alias GeoDataGroupViewModel
 * @constructor
 * @extends GeoDataItemViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 */
var GeoDataGroupViewModel = function(context) {
    GeoDataItemViewModel.call(this, context);

    /**
     * Gets or sets a value indicating whether the group is currently expanded and showing
     * its children.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = false;

    /**
     * Gets or sets a value indicating whether the group is currently loading.  This property
     * is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

    /**
     * Gets the collection of items in this group.  This property is observable.
     * @type {GeoDataItemViewModel[]}
     */
    this.items = [];

    knockout.track(this, ['isOpen', 'isLoading', 'items']);
};

GeoDataGroupViewModel.prototype = inherit(GeoDataItemViewModel.prototype);

defineProperties(GeoDataGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @type {String}
     */
    type : {
        get : function() {
            return 'group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Group';
        }
    }
});

/**
 * Adds an item or group to this group.
 * 
 * @param {GeoDataItemViewModel} item The item to add.
 */
GeoDataGroupViewModel.prototype.add = function(item) {
    this.items.push(item);
};

/**
 * Removes an item or group from this group.
 * 
 * @param {GeoDataItemViewModel} item The item to remove.
 */
GeoDataGroupViewModel.prototype.remove = function(item) {
    this.items.remove(item);
};

/**
 * Toggles the {@link GeoDataGroupViewModel#isOpen} property of this group.  If it is open, calling this method
 * will close it.  If it is closed, calling this method will open it.
 */
GeoDataGroupViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

/**
 * Updates the group from a JSON object-literal description of the group.
 * Existing items with the same name as an item in the JSON description are
 * updated.  If the description contains an item with a name that does not yet exist,
 * it is created.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
GeoDataGroupViewModel.prototype.updateFromJson = function(json) {
    this.name = defaultValue(json.name, 'Unnamed Group');
    this.description = defaultValue(json.description, '');

    var existingItem;

    var items = json.items;
    for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
        var item = items[itemIndex];

        // Find an existing item with the same name
        existingItem = undefined;
        for (var existingItemIndex = 0; !defined(existingItem) && existingItemIndex < this.items.length; ++existingItemIndex) {
            if (this.items[existingItemIndex].name === item.name) {
                existingItem = this.items[existingItemIndex];
            }
        }

        if (!defined(existingItem) || existingItem.type !== item.type) {
            existingItem = createGeoDataItemFromType(item.type, this.context);
            this.add(existingItem);
        }

        existingItem.updateFromJson(item);
    }
};

module.exports = GeoDataGroupViewModel;
