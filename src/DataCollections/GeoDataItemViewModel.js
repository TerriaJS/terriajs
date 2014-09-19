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
 * An member of a {@link GeoDataGroupViewModel}.  A member may be {@link GeoDataItemViewModel} or a
 * {@link GeoDataGroupViewModel}.
 *
 * @alias GeoDataItemViewModel
 * @constructor
 *
 * @param {String} type The type of data item represented by the new instance.
 */
var GeoDataItemViewModel = function(type) {
    if (!defined(type)) {
        throw new DeveloperError('type is required.');
    }

    this._type = type;

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
            return this._type;
        }
    }
});

module.exports = GeoDataItemViewModel;
