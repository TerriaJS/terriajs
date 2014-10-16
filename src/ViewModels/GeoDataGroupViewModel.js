'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
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

    var that = this;
    knockout.getObservable(this, 'isOpen').subscribe(function(newValue) {
        // Load this group's items (if we haven't already) when it is opened.
        if (newValue) {
            that.load();
        }
    });
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
    },

    /**
     * Gets the set of functions used to update individual properties in {@link GeoDataItemViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @type {Object}
     */
    updaters : {
        get : function() {
            return GeoDataGroupViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link GeoDataItemViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @type {Object}
     */
    serializers : {
        get : function() {
            return GeoDataGroupViewModel.defaultSerializers;
        }
    }
});

GeoDataGroupViewModel.defaultUpdaters = clone(GeoDataItemViewModel.defaultUpdaters);

GeoDataGroupViewModel.defaultUpdaters.items = function(viewModel, json, propertyName) {
    if (!defined(json.items)) {
        return;
    }

    // Load the group's items first, if we haven't already.
    viewModel.load();

    // If the group is still loading, delay this operation until the loading is complete.
    // Otherwise, these changes could get clobbered by the load.
    if (viewModel.isLoading) {
        var subscription = knockout.getObservable(viewModel, 'isLoading').subscribe(function(newValue) {
            if (newValue === false) {
                // Done loading
                subscription.dispose();
                doUpdate();
            }
        });
    } else {
        doUpdate();
    }

    function doUpdate() {
        // TODO: allow JSON to update the order of items as well.

        var items = json.items;
        for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
            var item = items[itemIndex];

            // Find an existing item with the same name
            var existingItem = viewModel.findFirstItemByName(item.name);
            if (!defined(existingItem) || existingItem.type !== item.type) {
                existingItem = createGeoDataItemFromType(item.type, viewModel.context);
                viewModel.add(existingItem);
            }

            existingItem.updateFromJson(item);
        }
    }
};

GeoDataGroupViewModel.defaultUpdaters.isLoading = function(viewModel, json, propertyName) {};

GeoDataGroupViewModel.defaultSerializers = clone(GeoDataItemViewModel.defaultSerializers);

GeoDataGroupViewModel.defaultSerializers.items = function(viewModel, json, propertyName, enabledItemsOnly) {
    var items = json.items = [];

    for (var i = 0; i < viewModel.items.length; ++i) {
        var item = viewModel.items[i].serializeToJson(enabledItemsOnly);
        if (defined(item)) {
            items.push(item);
        }
    }
};

GeoDataGroupViewModel.defaultSerializers.isLoading = function(viewModel, json, propertyName, enabledItemsOnly) {};

/**
 * When implemented in a derived class, loads the contents of this group, if the contents are not already loaded.  It is safe to
 * call this method multiple times.  The {@link GeoDataGroupViewModel#isLoading} flag will be set while the load is in progress.
 * This base-class implementation of this method does nothing because {@link GeoDataGroupViewModel} does not do an lazy loading
 * of its content.
 */
GeoDataGroupViewModel.prototype.load = function() {
};

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
 * Finds the first item in this group that has the given name.  The search is case-sensitive.
 * 
 * @param {String} name The name of the item to find.
 * @return {GeoDataItemViewModel} The first item with the given name, or undefined if no item with that name exists.
 */
GeoDataGroupViewModel.prototype.findFirstItemByName = function(name) {
    for (var i = 0; i < this.items.length; ++i) {
        if (this.items[i].name === name) {
            return this.items[i];
        }
    }

    return undefined;
};

module.exports = GeoDataGroupViewModel;
