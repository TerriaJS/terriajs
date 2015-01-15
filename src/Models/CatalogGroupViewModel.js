'use strict';

/*global require*/

var clone = require('../../third_party/cesium/Source/Core/clone');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var RuntimeError = require('../../third_party/cesium/Source/Core/RuntimeError');
var when = require('../../third_party/cesium/Source/ThirdParty/when');

var arraysAreEqual = require('../Core/arraysAreEqual');
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var CatalogMemberViewModel = require('./CatalogMemberViewModel');
var inherit = require('../Core/inherit');
var raiseErrorOnRejectedPromise = require('./raiseErrorOnRejectedPromise');
var runLater = require('../Core/runLater');

var naturalSort = require('javascript-natural-sort');

/**
 * A group of data items and other groups in the {@link CatalogViewModel}.  A group can contain
 * {@link CatalogMemberViewModel|CatalogMemberViewModels} or other
 * {@link CatalogGroupViewModel|CatalogGroupViewModels}.
 *
 * @alias CatalogGroupViewModel
 * @constructor
 * @extends CatalogMemberViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var CatalogGroupViewModel = function(application) {
    CatalogMemberViewModel.call(this, application);

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
     * @type {CatalogMemberViewModel[]}
     */
    this.items = [];

    knockout.track(this, ['isOpen', 'isLoading', 'items']);

    var that = this;

    knockout.getObservable(this, 'isOpen').subscribe(function(newValue) {
        // Load this group's items (if we haven't already) when it is opened.
        if (newValue) {
            raiseErrorOnRejectedPromise(that.application, that.load());
        }
    });

    knockout.getObservable(this, 'isLoading').subscribe(function(newValue) {
        // Call load() again immediately after finishing loading, if the group is still open.  Normally this will do nothing,
        // but if the URL has changed since we started, it will kick off loading the new URL.
        // If this spins you into a stack overflow, verify that your derived-class load method only
        // loads when it actually needs to do so!
        if (newValue === false && that.isOpen) {
            raiseErrorOnRejectedPromise(that.application, that.load());
        }
    });
};

inherit(CatalogMemberViewModel, CatalogGroupViewModel);

defineProperties(CatalogGroupViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'group';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Group';
        }
    },

    /**
     * Gets a value indicating whether the items in this group (and their sub-items, if any) should be sorted when
     * {@link CatalogGroupViewModel#load} is complete.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {Boolean}
     */
    sortItemsOnLoad : {
        get : function() {
            return true;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return CatalogGroupViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return CatalogGroupViewModel.defaultSerializers;
        }
    },

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMemberViewModel#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf CatalogGroupViewModel.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return CatalogGroupViewModel.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link CatalogMemberViewModel#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#updaters} property.
 * @type {Object}
 */
CatalogGroupViewModel.defaultUpdaters = clone(CatalogMemberViewModel.defaultUpdaters);

CatalogGroupViewModel.defaultUpdaters.items = function(viewModel, json, propertyName, options) {
    // Let the group finish loading first.  Otherwise, these changes could get clobbered by the load.
    return when(viewModel.load(), function() {
        var promises = [];

        // TODO: allow JSON to update the order of items as well.

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var onlyUpdateExistingItems = defaultValue(options.onlyUpdateExistingItems, false);

        var items = json.items;
        for (var itemIndex = 0; itemIndex < items.length; ++itemIndex) {
            var item = items[itemIndex];

            // Find an existing item with the same name
            var existingItem = viewModel.findFirstItemByName(item.name);
            if (!defined(existingItem)) {
                // Skip this item entirely if we're not allowed to create it.
                if (onlyUpdateExistingItems) {
                    continue;
                }

                if (!defined(item.type)) {
                    throw new RuntimeError('An item must have a type.');
                }

                existingItem = createCatalogMemberFromType(item.type, viewModel.application);
                viewModel.add(existingItem);
            }

            promises.push(existingItem.updateFromJson(item, options));
        }

        return when.all(promises, function() {
            if (defaultValue(json.sortItemsOnLoad, true)) {
                viewModel.sortItems();
            }
        });
    });
};

CatalogGroupViewModel.defaultUpdaters.isLoading = function(viewModel, json, propertyName) {};

freezeObject(CatalogGroupViewModel.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link CatalogMemberViewModel#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link CatalogMemberViewModel#serializers} property.
 * @type {Object}
 */
CatalogGroupViewModel.defaultSerializers = clone(CatalogMemberViewModel.defaultSerializers);

CatalogGroupViewModel.defaultSerializers.items = function(viewModel, json, propertyName, options) {
    var items = json.items = [];

    for (var i = 0; i < viewModel.items.length; ++i) {
        var item = viewModel.items[i].serializeToJson(options);
        if (defined(item)) {
            items.push(item);
        }
    }
};

CatalogGroupViewModel.defaultSerializers.isLoading = function(viewModel, json, propertyName, options) {};

freezeObject(CatalogGroupViewModel.defaultSerializers);

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItemViewModel}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
CatalogGroupViewModel.defaultPropertiesForSharing = clone(CatalogMemberViewModel.defaultPropertiesForSharing);
CatalogGroupViewModel.defaultPropertiesForSharing.push('items');
CatalogGroupViewModel.defaultPropertiesForSharing.push('isOpened');

freezeObject(CatalogGroupViewModel.defaultPropertiesForSharing);

/**
 * Loads the contents of this group, if the contents are not already loaded.  It is safe to
 * call this method multiple times.  The {@link CatalogGroupViewModel#isLoading} flag will be set while the load is in progress.
 * Derived classes should implement {@link CatalogGroupViewModel#_load} to perform the actual loading for the group.
 * Derived classes may optionally implement {@link CatalogGroupViewModel#_getValuesThatInfluenceLoad} to provide an array containing
 * the current value of all properties that influence this group's load process.  Each time that {@link CatalogGroupViewModel#load}
 * is invoked, these values are checked against the list of values returned last time, and {@link CatalogGroupViewModel#_load} is
 * invoked again if they are different.  If {@link CatalogGroupViewModel#_getValuesThatInfluenceLoad} is undefined or returns an
 * empty array, {@link CatalogGroupViewModel#_load} will only be invoked once, no matter how many times
 * {@link CatalogGroupViewModel#load} is invoked.
 *
 * @returns {Promise} A promise that resolves when the load is complete, or undefined if the group is already loaded.
 * 
 */
CatalogGroupViewModel.prototype.load = function() {
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
        if (defaultValue(that.sortItemsOnLoad, true)) {
            that.sortItems(true);
        }
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
 * This method should not be called directly; call {@link CatalogGroupViewModel#load} instead.
 * @return {Promise} A promise that resolves when the load is complete.
 * @protected
 */
CatalogGroupViewModel.prototype._load = function() {
    return when();
};

var emptyArray = freezeObject([]);

/**
 * When implemented in a derived class, gets an array containing the current value of all properties that
 * influence this group's load process.  See {@link CatalogGroupViewModel#load} for more information on when and
 * how this is used.  The base class implementation returns an empty array.
 * @return {Array} The array of values that influence the load process.
 * @protected
 */
CatalogGroupViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return emptyArray;
};

/**
 * Adds an item or group to this group.
 * 
 * @param {CatalogMemberViewModel} item The item to add.
 */
CatalogGroupViewModel.prototype.add = function(item) {
    this.items.push(item);
};

/**
 * Removes an item or group from this group.
 * 
 * @param {CatalogMemberViewModel} item The item to remove.
 */
CatalogGroupViewModel.prototype.remove = function(item) {
    this.items.remove(item);
};

/**
 * Toggles the {@link CatalogGroupViewModel#isOpen} property of this group.  If it is open, calling this method
 * will close it.  If it is closed, calling this method will open it.
 */
CatalogGroupViewModel.prototype.toggleOpen = function() {
    this.isOpen = !this.isOpen;
};

/**
 * Finds the first item in this group that has the given name.  The search is case-sensitive.
 * 
 * @param {String} name The name of the item to find.
 * @return {CatalogMemberViewModel} The first item with the given name, or undefined if no item with that name exists.
 */
CatalogGroupViewModel.prototype.findFirstItemByName = function(name) {
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
CatalogGroupViewModel.prototype.sortItems = function(sortRecursively) {
    naturalSort.insensitive = true;
    this.items.sort(function(a, b) {
        return naturalSort(a.name, b.name);
    });

    if (defaultValue(sortRecursively, false)) {
        for (var i = 0; i < this.items.length; ++i) {
            var item = this.items[i];
            if (defined(item.sortItems)) {
                item.sortItems(sortRecursively);
            }
        }
    }
};

module.exports = CatalogGroupViewModel;
