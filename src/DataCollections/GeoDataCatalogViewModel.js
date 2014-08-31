'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');

/**
 * The view model for the geospatial data catalog.
 *
 * @alias GeoDataCatalogViewModel
 * @constructor
 */
var GeoDataCatalogViewModel = function() {
    /**
     * The geospatial data collections in this catalog.  This property is observable.
     * @type {Array}
     */
    this.groups = [];

    /**
     * Gets or sets a flag indicating whether the catalog is currently loading.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['groups', 'isLoading']);
};

/**
 * Adds a group to the catalog.
 * 
 * @param {GeoDataGroupViewModel} group The group to add.
 */
GeoDataCatalogViewModel.prototype.addGroup = function(group) {
    this.groups.push(group);
};

/**
 * Removes a group from the catalog.
 * 
 * @param  {GeoDataGroupViewModel} group The group to remove.
 */
GeoDataCatalogViewModel.prototype.removeGroup = function(group) {
    this.groups.remove(group);
};

/**
 * Updates the catalog from a JSON object-literal description of the available collections.
 * Existing collections with the same name as a collection in the JSON description are
 * updated.  If the description contains a collection with a name that does not yet exist,
 * it is created.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
GeoDataCatalogViewModel.prototype.updateFromJson = function(json) {
    if (!(json instanceof Array)) {
        throw new DeveloperError('JSON catalog description must be an array of groups.');
    }

    var existingGroup;

    for (var groupIndex = 0; groupIndex < json.length; ++groupIndex) {
        var group = json[groupIndex];

        if (group.type !== 'group') {
            throw new RuntimeError('Catalog items must be groups.');
        }

        if (!defined(group.name)) {
            throw new RuntimeError('A group must have a name.');
        }

        // Find an existing group with the same name, if any.
        existingGroup = undefined;
        for (var existingGroupIndex = 0; !defined(existingGroup) && existingGroupIndex < this.groups.length; ++existingGroupIndex) {
            if (this.groups[existingGroupIndex].name === group.name) {
                existingGroup = this.groups[existingGroupIndex];
            }
        }

        if (!defined(existingGroup)) {
            existingGroup = new GeoDataGroupViewModel();
            this.groups.push(existingGroup);
        }

        existingGroup.updateFromJson(group);
    }
};

module.exports = GeoDataCatalogViewModel;
