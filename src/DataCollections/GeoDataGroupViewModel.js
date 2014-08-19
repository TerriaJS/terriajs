'use strict';

/*global require*/

var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var GeoDataItemViewModel = require('./GeoDataItemViewModel');

/**
 * A group of data in the {@link GeoDataCatalogViewModel}.  A group can contain
 * {@link GeoDataItemViewModel|GeoDataItemViewModels} or other
 * {@link GeoDataGroupViewModel|GeoDataGroupViewModels}.
 *
 * @extends GeoDataItemViewModel
 */
var GeoDataGroupViewModel = function() {
    /**
     * Gets or sets a value indicating whether the group is currently expanded and showing
     * its children.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = false;

    /**
     * Gets the collection of items in this group.  This property is observable.
     * @type {GeoDataItemViewModel[]}
     */
    this.items = [];

    knockout.track(this, ['isOpen', 'items']);
};

GeoDataGroupViewModel.prototype = new GeoDataItemViewModel();
GeoDataGroupViewModel.prototype.constructor = GeoDataGroupViewModel;

defineProperties(GeoDataGroupViewModel.prototype, {
    isGroup : {
        get : function() {
            return true;
        }
    }
});

/**
 * Adds an item or group to this group.
 * 
 * @param {GeoDataItemViewModel} item The item to add.
 */
GeoDataGroupViewModel.prototype.add = function(item) {
};

/**
 * Removes an item or group from this group.
 * 
 * @param {GeoDataItemViewModel} item The item to remove.
 */
GeoDataGroupViewModel.prototype.remove = function(item) {
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
 * Existing items with the same name as a collection in the JSON description are
 * updated.  If the description contains a collection with a name that does not yet exist,
 * it is created.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
GeoDataGroupViewModel.prototype.updateFromJson = function(json, replaceExisting) {
};

module.exports = GeoDataGroupViewModel;
