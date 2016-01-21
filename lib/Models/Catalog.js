'use strict';

/*global require*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var CatalogGroup = require('./CatalogGroup');
var when = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * The view model for the geospatial data catalog.
 *
 * @param {Terria} terria The Terria instance.
 *
 * @alias Catalog
 * @constructor
 */
var Catalog = function(terria) {
    if (!defined(terria)) {
        throw new DeveloperError('terria is required');
    }

    this._terria = terria;
    this._shareKeyIndex = {};

    this._group = new CatalogGroup(terria);
    this._group.name = 'Root Group';
    this._group.preserveOrder = true;

    /**
     * Gets or sets a flag indicating whether the catalog is currently loading.
     * @type {Boolean}
     */
    this.isLoading = false;

    knockout.track(this, ['isLoading']);

    knockout.defineProperty(this, 'userAddedDataGroup', {
        get : function() {
            var group;

            var groups = this.group.items;
            for (var i = 0; i < groups.length; ++i) {
                group = groups[i];
                if (group.name === 'User-Added Data') {
                    return group;
                }
            }

            group = new CatalogGroup( this.terria);
            group.name = 'User-Added Data';
            group.description = 'The group for data that was added by the user via the Add Data panel.';
            group.isUserSupplied = true;
            this.group.add(group);

            return group;
        }
    });
};

defineProperties(Catalog.prototype, {
    /**
      * Gets the Terria instance.
     * @memberOf Catalog.prototype
     * @type {Terria}
     */
    terria : {
        get : function() {
            return this._terria;
        }
    },

    /**
     * Gets the catalog's top-level group.
     * @memberOf Catalog.prototype
     * @type {CatalogGroup}
     */
    group : {
        get : function() {
            return this._group;
        }
    },

    /**
     * A flat index of all catalog member in this catalog by their share keys. Because items can have multiple share keys
     * to preserve backwards compatibility, multiple entries in this index will lead to the same catalog member.
     *
     * @type {Object}
     */
    shareKeyIndex : {
        get : function() {
            return this._shareKeyIndex;
        }
    }
});

/**
 * Updates the catalog from a JSON object-literal description of the available collections.
 * Existing collections with the same name as a collection in the JSON description are
 * updated.  If the description contains a collection with a name that does not yet exist,
 * it is created.  Because parts of the update may happen asynchronously, this method
 * returns at Promise that will resolve when the update is completely done.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.onlyUpdateExistingItems] true to only update existing items and never create new ones, or false is new items
 *                                                    may be created by this update.
 * @param {Boolean} [options.isUserSupplied] If specified, sets the {@link CatalogMember#isUserSupplied} property of updated catalog members
 *                                           to the given value.  If not specified, the property is left unchanged.
 * @returns {Promise} A promise that resolves when the update is complete.
 */
Catalog.prototype.updateFromJson = function(json, options) {
    var that = this;
    options = defaultValue(options, {});

    return CatalogGroup.updateItems(json, options, this.group).then(function () {
        that.terria.nowViewing.sortByNowViewingIndices();
    });
};

/**
 * Serializes the catalog to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Function} [options.propertyFilter] Filter function that will be executed to determine whether a property
 *          should be serialized.
 * @param {Function} [options.itemFilter] Filter function that will be executed for each item in a group to determine
 *          whether that item should be serialized.
 * @return {Object} The serialized JSON object-literal.
 */
Catalog.prototype.serializeToJson = function(options) {
    this.terria.nowViewing.recordNowViewingIndices();

    return this.group.serializeToJson(options).items;
};

/**
 * Resolves items in the catalog based on the share keys provided, and updates them with the passed info and
 * enables them along with all their ancestors in the catalog hierarchy. This is asynchronous as it may involve a number
 * of CatalogItem#load calls.
 *
 * Note that because of the lazily-loaded nature of the catalog, items within it may not be resolvable by shareKey until
 * their parents have loaded. As a result this loads sharedObjects in serial from left to right. If a catalog member is the
 * child of an asynchronously-loaded catalog group (like a ckan or socrata group), then that group's shareKey precede the
 * child member.
 *
 * @param {Object} sharedObjects A flat map of string-based share keys with data to update on the resolved object. It is
 *      possible to pass an empty object if nothing needs updating.
 * @returns {Promise} A promise that will resolve when all the items have been loaded and enabled.
 */
Catalog.prototype.updateByShareKeys = function (sharedObjects) {
    var shareKeyIndex = this.shareKeyIndex;

    return Object.keys(sharedObjects).reduce(function (aggregatedPromise, shareKey) {
        return aggregatedPromise.then(function() {
            var existingMember = shareKeyIndex[shareKey];

            if (existingMember) {
                return existingMember.updateFromJson(sharedObjects[shareKey])
                    .then(function () {
                        return when(existingMember.load());
                    }).then(function () {
                        existingMember.enableWithParents();
                    });
            }
        });
    }, when());
};


module.exports = Catalog;
