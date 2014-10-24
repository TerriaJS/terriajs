'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');

var mapping = {};

/**
 * Creates a type derived from {@link CatalogMemberViewModel} based on a given type string.
 * 
 * @param {String} type The derived type name.
 * @param {ApplicationViewModel} context The context for the item.
 */
var createCatalogMemberFromType = function(type, context) {
    var Constructor = mapping[type];
    if (!defined(Constructor)) {
        throw new RuntimeError('Unsupported CatalogMemberViewModel type: ' + type);
    }

    return new Constructor(context);
};

/**
 * Registers a constructor for a given type of {@link CatalogMemberViewModel}.
 * 
 * @param {String} type The type name for which to register a constructor.
 * @param {Function} constructor The constructor for data items of this type.  The constructor is expected to take a
 *                               {@link ApplicationViewModel} as its first and only required parameter.
 */
createCatalogMemberFromType.register = function(type, constructor) {
    mapping[type] = constructor;
};

module.exports = createCatalogMemberFromType;