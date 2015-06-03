'use strict';

/*global require*/

var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var CatalogGroup = require('./CatalogGroup');

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
    if (!(json instanceof Array)) {
        throw new DeveloperError('JSON catalog description must be an array of groups.');
    }

    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    var onlyUpdateExistingItems = defaultValue(options.onlyUpdateExistingItems, false);

    var promises = [];

    for (var groupIndex = 0; groupIndex < json.length; ++groupIndex) {
        var group = json[groupIndex];

        if (!defined(group.name)) {
            throw new RuntimeError('A group must have a name.');
        }

        // Find an existing group with the same name, if any.
        var existingGroup = this.group.findFirstItemByName(group.name);
        if (!defined(existingGroup)) {
            // Skip this item entirely if we're not allowed to create it.
            if (onlyUpdateExistingItems) {
                continue;
            }

            if (!defined(group.type)) {
                throw new RuntimeError('A group must have a type.');
            }

            existingGroup = createCatalogMemberFromType(group.type,  this.terria);

            this.group.add(existingGroup);
        }

        promises.push(existingGroup.updateFromJson(group, options));
    }

    var that = this;
    return when.all(promises, function() {
        that.group.sortItems();
        that.terria.nowViewing.sortByNowViewingIndices();
    });
};

/**
 * Serializes the catalog to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.enabledItemsOnly=false] true if only enabled data items (and their groups) should be serialized,
 *                  or false if all data items should be serialized.
 * @param {CatalogMember[]} [options.itemsSkippedBecauseTheyAreNotEnabled] An array that, if provided, is populated on return with
 *        all of the data items that were not serialized because they were not enabled.  The array will be empty if
 *        options.enabledItemsOnly is false.
 * @param {Boolean} [options.skipItemsWithLocalData=false] true if items with a serializable 'data' property should be skipped entirely.
 *                  This is useful to avoid creating a JSON data structure with potentially very large embedded data.
 * @param {CatalogMember[]} [options.itemsSkippedBecauseTheyHaveLocalData] An array that, if provided, is populated on return
 *        with all of the data items that were not serialized because they have a serializable 'data' property.  The array will be empty
 *        if options.skipItemsWithLocalData is false.
 * @param {Boolean} [options.serializeForSharing=false] true to only serialize properties that are typically necessary for sharing this member
 *                                                      with other users, such as {@link CatalogGroup#isOpen}, {@link CatalogItem#isEnabled},
 *                                                      {@link CatalogItem#isLegendVisible}, and {@link ImageryLayerCatalogItem#opacity},
 *                                                      rather than serializing all properties needed to completely recreate the catalog.
 * @param {Boolean} [options.userSuppliedOnly=false] true to only serialize catalog members (and their containing groups) that have been identified as having been
 *                  supplied by the user ({@link CatalogMember#isUserSupplied} is true); false to serialize all catalog members.
 * @return {Object} The serialized JSON object-literal.
 */
Catalog.prototype.serializeToJson = function(options) {
     this.terria.nowViewing.recordNowViewingIndices();

    var json = {};
    CatalogGroup.defaultSerializers.items(this.group, json, 'items', options);
    return json.items;
};

module.exports = Catalog;
