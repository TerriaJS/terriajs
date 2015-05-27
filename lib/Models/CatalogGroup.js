'use strict';

/*global require*/

var clone = require('terriajs-cesium/Source/Core/clone');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var arraysAreEqual = require('../Core/arraysAreEqual');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var CatalogMember = require('./CatalogMember');
var inherit = require('../Core/inherit');
var raiseErrorOnRejectedPromise = require('./raiseErrorOnRejectedPromise');
var runLater = require('../Core/runLater');

var naturalSort = require('javascript-natural-sort');

/**
 * A group of data items and other groups in the {@link Catalog}.  A group can contain
 * {@link CatalogMember|CatalogMembers} or other
 * {@link CatalogGroup|CatalogGroups}.
 *
 * @alias CatalogGroup
 * @constructor
 * @extends CatalogMember
 *
 * @param {Terria} terria The Terria instance.
 */
var CatalogGroup = function(terria) {
     CatalogMember.call(this, terria);

    this._loadingPromise = undefined;
    this._lastLoadInfluencingValues = undefined;

    /**
     * Gets or sets a value indicating whether the group is currently expanded and showing
     * its children.  This property is observable.
     * @type {Boolean}
     */
    this.isOpen = false;

    /**
     * Gets or sets a value indicating whether the group is currently loading.  This property
     * is observable.
     * @type {Boolean}
     */
    this.isLoading = false;

    /**
     * Gets the collection of items in this group.  This property is observable.
     * @type {CatalogMember[]}
     */
    this.items = [];

    /**
     * Gets or sets flag to prevent items in group being sorted. Subgroups will still sort unless their own preserveOrder flag is set.  The value
     * of this property only has an effect during {@CatalogGroup#load} and {@CatalogItem#updateFromJson}.
     */
    this.preserveOrder = false;

    knockout.track(this, ['isOpen', 'isLoading', 'items']);

    var that = this;

    knockout.getObservable(this, 'isOpen').subscribe(function(newValue) {
        // Load this group's items (if we haven't already) when it is opened.
        if (newValue) {
            raiseErrorOnRejectedPromise( that.terria, that.load());
        }
    });

    knockout.getObservable(this, 'isLoading').subscribe(function(newValue) {
        // Call load() again immediately after finishing loading, if the group is still open.  Normally this will do nothing,
        // but if the URL has changed since we started, it will kick off loading the new URL.
        // If this spins you into a stack overflow, verify that your derived-class load method only
        // loads when it actually needs to do so!
        if (newValue === false && that.isOpen) {
            raiseErrorOnRejectedPromise( that.terria, that.load());
        }
    });
};

inherit(CatalogMember, CatalogGroup);

defineProperties(CatalogGroup.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CatalogGroup.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CatalogGroup.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Group';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CatalogGroup.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CatalogGroup.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogGroup.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CatalogGroup.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CatalogGroup.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return CatalogGroup.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMember#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#updaters} property.
 * @type {Object}
 */
CatalogGroup.defaultUpdaters = clone(CatalogMember.defaultUpdaters);

CatalogGroup.defaultUpdaters.items = function(catalogGroup, json, propertyName, options) {
    // Let the group finish loading first.  Otherwise, these changes could get clobbered by the load.
    return when(catalogGroup.load(), function() {
        var promises = [];

        // TODO: allow JSON to update the order of items as well.

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var onlyUpdateExistingItems = defaultValue(options.onlyUpdateExistingItems, false);

        var items = json.items;
        for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
            var item = items[itemIndex];

            // Find an existing item with the same name
            var existingItem = catalogGroup.findFirstItemByName(item.name);
            if (!defined(existingItem)) {
                // Skip this item entirely if we're not allowed to create it.
                if (onlyUpdateExistingItems) {
                    continue;
                }

                if (!defined(item.type)) {
                    throw new RuntimeError('An item must have a type.');
                }

                existingItem = createCatalogMemberFromType(item.type, catalogGroup.terria);
                catalogGroup.add(existingItem);
            }

            promises.push(existingItem.updateFromJson(item, options));
        }

        return when.all(promises, function() {
            catalogGroup.sortItems();
        });
    });
};

CatalogGroup.defaultUpdaters.isLoading = function(catalogGroup, json, propertyName) {};

freezeObject(CatalogGroup.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMember#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMember#serializers} property.
 * @type {Object}
 */
CatalogGroup.defaultSerializers = clone(CatalogMember.defaultSerializers);

CatalogGroup.defaultSerializers.items = function(catalogGroup, json, propertyName, options) {
    var items = json.items = [];

    for (var i = 0; i < catalogGroup.items.length; ++i) {
        var item = catalogGroup.items[i].serializeToJson(options);
        if (defined(item)) {
            items.push(item);
        }
    }
};

CatalogGroup.defaultSerializers.isLoading = function(catalogGroup, json, propertyName, options) {};

freezeObject(CatalogGroup.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CatalogGroup.defaultPropertiesForSharing = clone(CatalogMember.defaultPropertiesForSharing);
CatalogGroup.defaultPropertiesForSharing.push('items');
CatalogGroup.defaultPropertiesForSharing.push('isOpened');

freezeObject(CatalogGroup.defaultPropertiesForSharing);

/**
 * Loads the contents of this group, if the contents are not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogGroup#isLoading} flag will be set while the load is in progress.
 * Derived classes should implement {@link CatalogGroup#_load} to perform the actual loading for the group.
 * Derived classes may optionally implement {@link CatalogGroup#_getValuesThatInfluenceLoad} to provide an array containing
 * the current value of all properties that influence this group's load process.  Each time that {@link CatalogGroup#load}
 * is invoked, these values are checked against the list of values returned last time, and {@link CatalogGroup#_load} is
 * invoked again if they are different.  If {@link CatalogGroup#_getValuesThatInfluenceLoad} is undefined or returns an
 * empty array, {@link CatalogGroup#_load} will only be invoked once, no matter how many times
 * {@link CatalogGroup#load} is invoked.
 *
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the group is already loaded.
 *
 */
CatalogGroup.prototype.load = function() {
    if (defined(this._loadingPromise)) {
        // Load already in progress.
        return this._loadingPromise;
    }

    var loadInfluencingValues = [];
    if (defined(this._getValuesThatInfluenceLoad)) {
        loadInfluencingValues = this._getValuesThatInfluenceLoad();
    }

    if (arraysAreEqual(loadInfluencingValues, this._lastLoadInfluencingValues)) {
        // Already loaded, and nothing has changed to force a re-load.
        return undefined;
    }

    this.isLoading = true;

    var that = this;
    this._loadingPromise = runLater(function() {
        that._lastLoadInfluencingValues = [];
        if (defined(that._getValuesThatInfluenceLoad)) {
            that._lastLoadInfluencingValues = that._getValuesThatInfluenceLoad();
        }

        return that._load();
    }).then(function() {
        that.sortItems(true);
        that._loadingPromise = undefined;
        that.isLoading = false;
    }).otherwise(function(e) {
        that._lastLoadInfluencingValues = undefined;
        that._loadingPromise = undefined;
        that.isOpen = false;
        that.isLoading = false;
        throw e;
    });

    return this._loadingPromise;
};

/**
 * When implemented in a derived class, this method loads the group.  The base class implementation does nothing.
 * This method should not be called directly; call {@link CatalogGroup#load} instead.
 * @return {Promise} A promise that resolves when the load is complete.
 * @protected
 */
CatalogGroup.prototype._load = function() {
    return when();
};

var emptyArray = freezeObject([]);

/**
 * When implemented in a derived class, gets an array containing the current value of all properties that
 * influence this group's load process.  See {@link CatalogGroup#load} for more information on when and
 * how this is used.  The base class implementation returns an empty array.
 * @return {Array} The array of values that influence the load process.
 * @protected
 */
CatalogGroup.prototype._getValuesThatInfluenceLoad = function() {
    return emptyArray;
};

/**
 * Adds an item or group to this group.
 *
 * @param {CatalogMember} item The item to add.
 */
CatalogGroup.prototype.add = function(item) {
    this.items.push(item);
};

/**
 * Removes an item or group from this group.
 *
 * @param {CatalogMember} item The item to remove.
 */
CatalogGroup.prototype.remove = function(item) {
    this.items.remove(item);
};

/**
 * Toggles the {@link CatalogGroup#isOpen} property of this group.  If it is open, calling this method
 * will close it.  If it is closed, calling this method will open it.
 */
CatalogGroup.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

/**
 * Finds the first item in this group that has the given name.  The search is case-sensitive.
 *
 * @param {String} name The name of the item to find.
 * @return {CatalogMember} The first item with the given name, or undefined if no item with that name exists.
 */
CatalogGroup.prototype.findFirstItemByName = function(name) {
    for (var i = 0; i < this.items.length; ++i) {
        if (this.items[i].name === name) {
            return this.items[i];
        }
    }

    return undefined;
};

/**
 * Sorts the items in this group.
 *
 * @param {Boolean} [sortRecursively=false] true to sort the items in sub-groups as well; false to sort only the items in this group.
 */
CatalogGroup.prototype.sortItems = function(sortRecursively) {
    naturalSort.insensitive = true;
    // Allow a group to be non-sorted, while still containing sorted groups.
    if (this.preserveOrder) {
        // Bubble promoted items to the top without changing their relative order.
        var promoted = this.items.filter(function(item) { return item.isPromoted; });
        var nonPromoted = this.items.filter(function(item) { return !item.isPromoted; });

        if (promoted.length > 0 && nonPromoted.length > 0) {
            this.items = promoted.concat(nonPromoted);
        }
    } else {
        this.items.sort(function(a, b) {
            if (a.isPromoted && !b.isPromoted) {
                return -1;
            } else if (!a.isPromoted && b.isPromoted) {
                return 1;
            } else {
                return naturalSort(a.name, b.name);
            }
        });
    }

    if (defaultValue(sortRecursively, false)) {
        for (var i = 0; i < this.items.length; ++i) {
            var item = this.items[i];
            if (defined(item.sortItems)) {
                item.sortItems(sortRecursively);
            }
        }
    }
};

module.exports = CatalogGroup;
