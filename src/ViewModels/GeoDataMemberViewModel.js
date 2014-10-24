'use strict';

/*global require*/

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * A member of a {@link GeoDataGroupViewModel}.  A member may be a {@link GeoDataItemViewModel} or a
 * {@link GeoDataGroupViewModel}.
 *
 * @alias GeoDataMemberViewModel
 * @constructor
 * @abstract
 *
 * @param {GeoDataCatalogContext} context The context for the item.
 */
var GeoDataMemberViewModel = function(context) {
    if (!defined(context)) {
        throw new DeveloperError('context is required');
    }

    this._context = context;

    /**
     * Gets or sets the name of the item.  This property is observable.
     * @type {String}
     */
    this.name = 'Unnamed Item';

    /**
     * Gets or sets the description of the item.  This property is observable.
     * @type {String}
     */
    this.description = '';

    knockout.track(this, ['name', 'description']);
};

defineProperties(GeoDataMemberViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf GeoDataMemberViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            throw new DeveloperError('Types derived from GeoDataMemberViewModel must implement a "type" property.');
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @memberOf GeoDataMemberViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            throw new DeveloperError('Types derived from GeoDataMemberViewModel must implement a "typeName" property.');
        }
    },

    /**
     * Gets the context for this data item.
     * @memberOf GeoDataMemberViewModel.prototype
     * @type {GeoDataCatalogContext}
     */
    context : {
        get : function() {
            return this._context;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link GeoDataMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf GeoDataMemberViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return GeoDataMemberViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link GeoDataMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf GeoDataMemberViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return GeoDataMemberViewModel.defaultSerializers;
        }
    }
});

/**
 * Gets or sets the set of default updater functions to use in {@link GeoDataMemberViewModel#updateFromJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link GeoDataMemberViewModel#updaters} property.
 * @type {Object}
 */
GeoDataMemberViewModel.defaultUpdaters = {
};

freezeObject(GeoDataMemberViewModel.defaultUpdaters);

/**
 * Gets or sets the set of default serializer functions to use in {@link GeoDataMemberViewModel#serializeToJson}.  Types derived from this type
 * should expose this instance - cloned and modified if necesary - through their {@link GeoDataMemberViewModel#serializers} property.
 * @type {Object}
 */
GeoDataMemberViewModel.defaultSerializers = {
};

freezeObject(GeoDataMemberViewModel.defaultSerializers);

/**
 * Updates the data item from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
GeoDataMemberViewModel.prototype.updateFromJson = function(json) {
    for (var propertyName in this) {
        if (this.hasOwnProperty(propertyName) && defined(json[propertyName]) && propertyName.length > 0 && propertyName[0] !== '_') {
            if (this.updaters && this.updaters[propertyName]) {
                this.updaters[propertyName](this, json, propertyName);
            } else {
                this[propertyName] = json[propertyName];
            }
        }
    }
};

/**
 * Serializes the data item to JSON.
 *
 * @param {Object} [options] Object with the following properties:
 * @param {Boolean} [options.enabledItemsOnly=false] true if only enabled data items (and their groups) should be serialized,
 *                  or false if all data items should be serialized.
 * @param {GeoDataMemberViewModel[]} [options.itemsSkippedBecauseTheyAreNotEnabled] An array that, if provided, is populated on return with
 *        all of the data items that were not serialized because they were not enabled.  The array will be empty if
 *        options.enabledItemsOnly is false.
 * @param {Boolean} [options.skipItemsWithLocalData=false] true if items with a serializable 'data' property should be skipped entirely.
 *                  This is useful to avoid creating a JSON data structure with potentially very large embedded data.
 * @param {GeoDataMemberViewModel[]} [options.itemsSkippedBecauseTheyHaveLocalData] An array that, if provided, is populated on return
 *        with all of the data items that were not serialized because they have a serializable 'data' property.  The array will be empty
 *        if options.skipItemsWithLocalData is false.
 * @return {Object} The serialized JSON object-literal.
 */
GeoDataMemberViewModel.prototype.serializeToJson = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    if (defaultValue(options.enabledItemsOnly, false) && this.isEnabled === false) {
        if (defined(options.itemsSkippedBecauseTheyAreNotEnabled)) {
            options.itemsSkippedBecauseTheyAreNotEnabled.push(this);
        }
        return undefined;
    }

    if (defaultValue(options.skipItemsWithLocalData, false) && defined(this.data)) {
        if (defined(options.itemsSkippedBecauseTheyHaveLocalData)) {
            options.itemsSkippedBecauseTheyHaveLocalData.push(this);
        }
        return undefined;
    }

    var result = {
        type: this.type
    };

    for (var propertyName in this) {
        if (this.hasOwnProperty(propertyName) && propertyName.length > 0 && propertyName[0] !== '_') {
            if (this.serializers && this.serializers[propertyName]) {
                this.serializers[propertyName](this, result, propertyName, options);
            } else {
                result[propertyName] = this[propertyName];
            }
        }
    }

    // Only serialize a group if the group has items in it.
    if (!defined(this.isEnabled) && (!defined(result.items) || result.items.length === 0)) {
        return undefined;
    }

    return result;
};

module.exports = GeoDataMemberViewModel;
