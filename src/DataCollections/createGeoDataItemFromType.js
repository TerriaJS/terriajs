'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var mapping = {};

/**
 * Creates a type derived from {@link GeoDataItemViewModel} based on a given type string.
 * 
 * @param  {String} type The derived type name.
 * @param {DataSourceCollection} dataSourceCollection The collection of data sources to which the new item is added when it is enabled.
 */
var createGeoDataItemFromType = function(type, dataSourceCollection) {
    var Constructor = mapping[type];
    if (!defined(Constructor)) {
        throw new RuntimeError('Unsupported GeoDataItemViewModel type: ' + type);
    }

    return new Constructor(dataSourceCollection);
};

createGeoDataItemFromType.register = function(type, constructor) {
    mapping[type] = constructor;
};

module.exports = createGeoDataItemFromType;