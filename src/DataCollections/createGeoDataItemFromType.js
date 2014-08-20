'use strict';

/*global require*/

var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var CzmlDataItemViewModel = require('./CzmlDataItemViewModel');
var GeoDataGroupViewModel = require('./GeoDataGroupViewModel');

/**
 * Creates a type derived from {@link GeoDataItemViewModel} based on a given type string.
 * 
 * @param  {String} type The derived type name.
 * @param {DataSourceCollection} dataSourceCollection The collection of data sources to which the new item is added when it is enabled.
 */
var createGeoDataItemFromType = function(type, dataSourceCollection) {
    switch (type) {
        case GeoDataGroupViewModel.type:
            return new GeoDataGroupViewModel(dataSourceCollection);
        case CzmlDataItemViewModel.type:
            return new CzmlDataItemViewModel(dataSourceCollection);
        default:
            throw new RuntimeError('Unsupported GeoDataItemViewModel type: ' + type);
    }
};

module.exports = createGeoDataItemFromType;