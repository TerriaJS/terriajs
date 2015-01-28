'use strict';

/*global require*/
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var ModelError = require('./ModelError');

/**
 * Adds a user's catalog item or group to the catalog.
 * 
 * @param {Application} application The application containing the catalog member.
 * @param {CatalogItem|Promise} newCatalogItemOrPromise The catalog member to add, or a promise for a catalog member.
 * @param {Object} [options] An object with the following members:
 * @param {Boolean} [options.enable=true] True to enable the newly-added member if it is an item; otherwise, false.
 * @param {Boolean} [options.open=true] True to open the newly-added member if it is a group; otherwise, false.
 * @param {Boolean} [options.zoomTo=true] True to zoom and use the clock of the newly-added member if it is an item; otherwise, false.
 * @return {Promise} A promise that resolves when the catalog member has been added successfully.
 */
var addUserCatalogMember = function(application, newCatalogMemberOrPromise, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    return when(newCatalogMemberOrPromise, function(newCatalogItem) {
        if (!defined(newCatalogItem)) {
            return;
        }

        application.catalog.userAddedDataGroup.items.push(newCatalogItem);

        if (defaultValue(options.open, true) && defined(newCatalogItem.isOpen)) {
            newCatalogItem.isOpen = true;
        }

        if (defaultValue(options.enable, true) && defined(newCatalogItem.isEnabled)) {
            newCatalogItem.isEnabled = true;
        }

        if (defaultValue(options.zoomTo, true) && defined(newCatalogItem.zoomToAndUseClock)) {
            newCatalogItem.zoomToAndUseClock();
        }

        application.catalog.userAddedDataGroup.isOpen = true;
    }).otherwise(function(e) {
        if (!(e instanceof ModelError)) {
            e = new ModelError({
                title: 'Data could not be added',
                message: 'The specified data could not be added because it is invalid or does not have the expected format.'
            });
        }

        application.error.raiseEvent(e);

        return when.reject(e);
    });
};

module.exports = addUserCatalogMember;
