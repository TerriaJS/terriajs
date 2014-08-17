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

    var that = this;
    ko.getObservable(this, 'isEnabled').subscribe(this._isEnabledChanged, this);
};

WebMapServiceLayerViewModel.prototype = new GeoDataItemViewModel();
WebMapServiceLayerViewModel.prototype.constructor = WebMapServiceLayerViewModel;

WebMapServiceLayerViewModel.prototype._isEnabledChanged = function(newValue) {
    if (newValue === true && !defined(this._dataSource)) {
        // Enabling
        var url = corsProxy.shouldUseProxy(this.url) ? corsProxy.getURL(this.url) : this.url;

        this._dataSource = new CzmlDataSource(this.name);
        dataSourceCollection.add(this._dataSource);

        this._dataSource.process([
            {
                id : 'document',
                version : '1.0'
            },
            {
                name : this.name,
                imageryLayer : {
                    alpha : 0.6,
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
    } else if (newValue === false && defined(this._dataSource)) {
        // Disabling
        dataSourceCollection.remove(this._dataSource, true);
        this._dataSource = undefined;
    }
};
