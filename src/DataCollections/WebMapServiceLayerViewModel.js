'use strict';

/*global require*/

var CzmlDataSource = require('../../third_party/cesium/Source/DataSources/CzmlDataSource');
var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var corsProxy = require('../corsProxy');
var GeoDataItemViewModel = require('./GeoDataItemViewModel');

/**
 * A Web Map Service (WMS) {@link GeoDataItemViewModel}.  This data item displays one or more layers
 * from a WMS server.
 *
 * @constructor
 * @extends GeoDataItemViewModel
 */
var WebMapServiceLayerViewModel = function() {
    /**
     * Gets or sets the base URL of the Web Map Service (WMS) server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the name of the WMS layer or layers, as specified in the WMS GetCapabilities document.
     * If this {@link GeoDataItemViewModel} corresponds to multiple layers, their names should be separated
     * by commas.
     * @type {String}
     */
    this.layers = '';

    this._dataSource = undefined;

    knockout.track(this, ['url', 'layers']);
};

WebMapServiceLayerViewModel.prototype = new GeoDataItemViewModel();
WebMapServiceLayerViewModel.prototype.constructor = WebMapServiceLayerViewModel;

WebMapServiceLayerViewModel.prototype.enable = function(dataSourceCollection) {
    if (defined(this._dataSource)) {
        throw new DeveloperError('WebMapServiceLayerViewModel is already enabled.');
    }

    var url = corsProxy.shouldUseProxy(this.url) ? corsProxy.getURL(this.url) : this.url;

    this._dataSource = new CzmlDataSource();
    dataSourceCollection.add(this._dataSource);

    this._dataSource.process([
        {
            id : 'document',
            version : '1.0'
        },
        {
            name : this.name,
            imageryLayer : {
                alpha : 0.5,
                zIndex : 10,
                webMapService : {
                    url : url,
                    layers : this.layers,
                    parameters : {
                        format : 'image/png',
                        transparent : true,
                        styles : ''
                    }
                }
            }
        }
    ]);

    this._isEnabled = true;
};

WebMapServiceLayerViewModel.prototype.disable = function(dataSourceCollection) {
    if (!defined(this._dataSource)) {
        throw new DeveloperError('WebMapServiceLayerViewModel is not enabled.');
    }

    dataSourceCollection.remove(this._dataSource, true);
    this._dataSource = undefined;

    this._isEnabled = false;
};