'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var mapping = {};

/**
 * Creates a type derived from {@link GeoDataMemberViewModel} based on a given type string.
 * 
 * @param {String} type The derived type name.
 * @param {GeoDataCatalogContext} context The context for the item.
 */
var createGeoDataItemFromType = function(type, context) {
    var Constructor = mapping[type];
    if (!defined(Constructor)) {
        throw new RuntimeError('Unsupported GeoDataMemberViewModel type: ' + type);
    }

    return new Constructor(context);
};

/**
 * Registers a constructor for a given type of {@link GeoDataMemberViewModel}.
 * 
 * @param {String} type The type name for which to register a constructor.
 * @param {Function} constructor The constructor for data items of this type.  The constructor is expected to take a
 *                               {@link GeoDataCatalogContext} as its first and only required parameter.
 */
createGeoDataItemFromType.register = function(type, constructor) {
    mapping[type] = constructor;
};

module.exports = createGeoDataItemFromType;