'use strict';

/*global require*/

var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var corsProxy = require('../corsProxy');
var GeoDataItemViewModel = require('./GeoDataItemViewModel');
var inherit = require('../inherit');

/**
 * A {@link GeoDataItemViewModel} representing a layer from a Web Map Service (WMS) server.
 *
 * @param {DataSourceCollection} dataSourceCollection The collection of data sources to which this item is added when it is enabled.
 *
 * @constructor
 * @extends GeoDataItemViewModel
 */
var WebMapServiceDataItemViewModel = function(dataSourceCollection) {
    GeoDataItemViewModel.call(this, 'wms', dataSourceCollection);

    this._dataSource = undefined;

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the WMS layers to include.  To specify multiple layers, separate them
     * with a commas.  This property is observable.
     * @type {String}
     */
    this.layers = '';

    /**
     * Gets or sets the additional parameters to pass to the WMS server when requesting images.
     * @type {Object}
     */
    this.parameters = {
        transparent: true,
        format: 'image/png'
    };

    /**
     * Gets or sets the alpha (opacity) of the data item, where 0.0 is fully transparent and 1.0 is
     * fully opaque.
     * @type {Number}
     */
    this.alpha = 0.6;

    knockout.track(this, ['url', 'layers', 'parameters', 'alpha']);

    knockout.getObservable(this, 'isEnabled').subscribe(this._isEnabledChanged, this);
};

WebMapServiceDataItemViewModel.prototype = inherit(GeoDataItemViewModel.prototype);

/**
 * Updates the WMS data item from a JSON object-literal description of it.
 *
 * @param {Object} json The JSON description.  The JSON should be in the form of an object literal, not a string.
 */
 WebMapServiceDataItemViewModel.prototype.updateFromJson = function(json) {
    this.name = defaultValue(json.name, 'Unnamed Item');
    this.description = defaultValue(json.description, '');
    this.url = defaultValue(json.url, '');
    this.layers = defaultValue(json.layers, '');

    if (defined(json.rectangle)) {
        this.rectangle = Rectangle.fromDegrees(json.rectangle[0], json.rectangle[1], json.rectangle[2], json.rectangle[3]);
    } else {
        this.rectangle = Rectangle.MAX_VALUE;
    }

    if (defined(json.parameters)) {
        this.parameters = clone(json.parameters);
    } else {
        this.parameters = {};
    }
};

WebMapServiceDataItemViewModel.prototype._isEnabledChanged = function(newValue) {
    if (newValue === true && !defined(this._dataSource)) {
        // Enabling
        this._dataSource = new CzmlDataSource(this.name);
        this.dataSourceCollection.add(this._dataSource);

        this._dataSource.process([
            {
                id: 'document',
                version: '1.0'
            },
            {
                imageryLayer: {
                    alpha: this.alpha,
                    rectangle : {
                        wsenDegrees : [
                            CesiumMath.toDegrees(this.rectangle.west),
                            CesiumMath.toDegrees(this.rectangle.south),
                            CesiumMath.toDegrees(this.rectangle.east),
                            CesiumMath.toDegrees(this.rectangle.north)
                        ]
                    },
                    webMapService: {
                        url : this.url,
                        layers : this.layers,
                        parameters : this.parameters
                    }
                }
            }
        ]);
    } else if (newValue === false && defined(this._dataSource)) {
        // Disabling
        this.dataSourceCollection.remove(this._dataSource, true);
        this._dataSource = undefined;
    }
};

module.exports = WebMapServiceDataItemViewModel;
