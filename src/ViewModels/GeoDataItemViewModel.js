'use strict';

/*global require,ga*/

var CameraFlightPath = require('../../third_party/cesium/Source/Scene/CameraFlightPath');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var Scene = require('../../third_party/cesium/Source/Scene/Scene');

var NowViewingViewModel = require('./NowViewingViewModel');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');

/**
 * A member of a {@link GeoDataGroupViewModel}.  An item may be a {@link GeoDataSourceViewModel} or a
 * {@link GeoDataGroupViewModel}.
 *
 * @alias GeoDataItemViewModel
 * @constructor
 * @abstract
 *
 * @param {GeoDataCatalogContext} context The context for the item.
 */
var GeoDataItemViewModel = function(context) {
    if (!defined(context)) {
        throw new DeveloperError('context is required');
    }

    this._context = context;

    /**
     * Gets or sets the name of the member.  This property is observable.
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

defineProperties(GeoDataItemViewModel.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @type {String}
     */
    type : {
        get : function() {
            throw new DeveloperError('Types derived from GeoDataItemViewModel must implement a "type" property.');
        }
    },

    /**
     * Gets a human-readable name for this type of data source, such as 'Web Map Service (WMS)'.
     * @type {String}
     */
    typeName : {
        get : function() {
            throw new DeveloperError('Types derived from GeoDataItemViewModel must implement a "typeName" property.');
        }
    },

    /**
     * Gets the context for this data item.
     * @type {GeoDataCatalogContext}
     */
    context : {
        get : function() {
            return this._context;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link GeoDataItemViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @type {Object}
     */
    updaters : {
        get : function() {
            return GeoDataItemViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link GeoDataItemViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @type {Object}
     */
    serializers : {
        get : function() {
            return GeoDataItemViewModel.defaultSerializers;
        }
    }
});

GeoDataItemViewModel.defaultUpdaters = {
};

GeoDataItemViewModel.defaultSerializers = {
};

/**
 * Updates the data item from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
GeoDataItemViewModel.prototype.updateFromJson = function(json) {
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

GeoDataItemViewModel.prototype.serializeToJson = function() {
    var result = {};

    for (var propertyName in this) {
        if (this.hasOwnProperty(propertyName)) {
            if (this.serializers && this.serializers[propertyName]) {
                this.serializers[propertyName](this, json, propertyName);
            } else {
                json[propertyName] = this[propertyName];
            }
        }
    }

    return result;
};

module.exports = GeoDataItemViewModel;
