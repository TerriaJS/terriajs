'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');

/**
 * The view model for the geospatial data catalog.
 *
 * @param {GeoDataCatalogContext} context The context for the catalog.
 *
 * @alias GeoDataCatalogViewModel
 * @constructor
 */
var GeoDataCatalogViewModel = function(context) {
    if (!defined(context)) {
        throw new DeveloperError('context is required');
    }

    this._context = context;

    this._group = new GeoDataGroupViewModel(context);
    this._group.name = 'Root Group';

    /**
     * Gets or sets a flag indicating whether the catalog is currently loading.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['groups', 'isLoading']);

    knockout.defineProperty(this, 'userAddedDataGroup', {
        get : function() {
            var group;

            for (var i = 0; i < this.groups.length; ++i) {
                group = this.groups[i];
                if (group.name === 'User-Added Data') {
                    return group;
                }
            }

            group = new GeoDataGroupViewModel(this.context);
            group.name = 'User-Added Data';
            group.description = 'The group for data that was added by the user via the Add Data panel.';
            this.groups.push(group);
            return group;
        }
    });
};

defineProperties(GeoDataCatalogViewModel.prototype, {
    /**
     * Gets the context for this catalog.
     * @type {GeoDataCatalogContext}
     */
    context : {
        get : function() {
            return this._context;
        }
    },

    /**
     * Gets the catalog's top-level group.
     * @type {GeoDataGroupViewModel}
     */
    group : {
        get : function() {
            return this._group;
        }
    }
});

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

    for (var groupIndex = 0; groupIndex < json.length; ++groupIndex) {
        var group = json[groupIndex];

        if (group.type !== 'group') {
            throw new RuntimeError('Catalog items must be groups.');
        }

        if (!defined(group.name)) {
            throw new RuntimeError('A group must have a name.');
        }

        // Find an existing group with the same name, if any.
        var existingGroup = this.group.findFirstItemByName(group.name);
        if (!defined(existingGroup)) {
            existingGroup = new GeoDataGroupViewModel(this._context);
            this.group.add(existingGroup);
        }

        existingGroup.updateFromJson(group);
    }
};

/**
 * Serializes the catalog to JSON.
 *
 * @param {Boolean} enabledItemsOnly true if only enabled data items (and their groups) should be serialized,
 *                                   or false if all data items should be serialized.
 * @return {Object} The serialized JSON object-literal.
 */
GeoDataCatalogViewModel.prototype.serializeToJson = function(enabledItemsOnly) {
    var json = {};
    GeoDataGroupViewModel.defaultSerializers.items(this.group, json, 'items', true);
    return json.items;
};

module.exports = GeoDataCatalogViewModel;
