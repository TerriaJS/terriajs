'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

/**
 * An item in a {@link GeoDataGroupViewModel}.
 * @alias GeoDataItemViewModel
 * @constructor
 *
 * @param {String} type The type of data item represented by the new instance.
 * @param {DataSourceCollection} dataSourceCollection The collection of data sources to which this item is added when it is enabled.
 */
var GeoDataItemViewModel = function(type, dataSourceCollection) {
    if (!defined(type)) {
        throw new DeveloperError('type is required.');
    }
    if (!defined(dataSourceCollection)) {
        throw new DeveloperError('dataSourceCollection is required.');
    }

    this._type = type;
    this._dataSourceCollection = dataSourceCollection;

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

    /**
     * Gets or sets a value indicating whether this data item is enabled.  An enabled data item
     * appears up in the "Now Viewing" pane, but is not necessarily shown on the map.
     * @type {Boolean}
     */
    this.isEnabled = false;

    knockout.track(this, ['name', 'description', 'isEnabled']);
};

defineProperties(GeoDataItemViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @type {String}
     */
    type : {
        get : function() {
            return this._type;
        }
    },

    /**
     * Gets the collection of data sources to which this item is added when it is enabled.
     * @type {DataSourceCollection}
     */
    dataSourceCollection: {
        get : function() {
            return this._dataSourceCollection;
        }
    }
});

/**
 * Toggles the {@link GeoDataItemViewModel#isEnabled} property of this item.  If it is enabled, calling this method
 * will disable it.  If it is disabled, calling this method will enable it.
 */
GeoDataItemViewModel.prototype.toggleEnabled = function() {
    this.isEnabled = !this.isEnabled;
};

module.exports = GeoDataItemViewModel;
