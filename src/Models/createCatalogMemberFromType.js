'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');

var ModelError = require('./ModelError');

var mapping = {};

/**
 * Creates a type derived from {@link CatalogMember} based on a given type string.
 * 
 * @param {String} type The derived type name.
 * @param {Application} application The application.
 */
var createCatalogMemberFromType = function(type, application) {
    var Constructor = mapping[type];
    if (!defined(Constructor)) {
        throw new ModelError({
            title: 'Unsupported catalogue item type',
            message: '\
Unknown catalogue item type: ' + type + '.  If you are loading your own catalogue, please verify that it is correct. \
This error may also indicate an attempt to load a newer catalogue file in an older version of National Map.'
        });
    }

    return new Constructor(application);
};

/**
 * Registers a constructor for a given type of {@link CatalogMember}.
 * 
 * @param {String} type The type name for which to register a constructor.
 * @param {Function} constructor The constructor for data items of this type.  The constructor is expected to take a
 *                               {@link Application} as its first and only required parameter.
 */
createCatalogMemberFromType.register = function(type, constructor) {
    mapping[type] = constructor;
};

module.exports = createCatalogMemberFromType;