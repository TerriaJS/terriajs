'use strict';

/*global require*/

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * The view model for the geospatial data catalog.
 */
var GeoDataCatalogViewModel = function() {
    /**
     * The geospatial data collections in this catalog.  This property is observable.
     * @type {Array}
     */
    this.collections = [];

    knockout.track(this, ['collections']);
};

/**
 * Adds a group to the catalog.
 * 
 * @param {GeoDataGroupViewModel} group The group to add.
 */
GeoDataCatalogViewModel.prototype.addGroup = function(group) {
};

/**
 * Removes a group from the catalog.
 * 
 * @param  {GeoDataGroupViewModel} group The group to remove.
 */
GeoDataCatalogViewModel.prototype.removeGroup = function(group) {
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
};

module.exports = GeoDataCatalogViewModel;
