'use strict';

/*global require,L,URI,$*/

var ArcGisMapServerImageryProvider = require('../../third_party/cesium/Source/Scene/ArcGisMapServerImageryProvider');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');

var corsProxy = require('../corsProxy');
var DataSourceMetadataViewModel = require('./DataSourceMetadataViewModel');
var DataSourceMetadataItemViewModel = require('./DataSourceMetadataItemViewModel');
var GeoDataSourceViewModel = require('./GeoDataSourceViewModel');
var ImageryLayerDataSourceViewModel = require('./ImageryLayerDataSourceViewModel');
var inherit = require('../inherit');
var rectangleToLatLngBounds = require('../rectangleToLatLngBounds');

/**
 * A {@link ImageryLayerDataSourceViewModel} representing a layer from an Esri ArcGIS MapServer.
 *
 * @alias ArcGisMapServerDataSourceViewModel
 * @constructor
 * @extends ImageryLayerDataSourceViewModel
 * 
 * @param {GeoDataCatalogContext} context The context for the group.
 */
var ArcGisMapServerDataSourceViewModel = function(context) {
    ImageryLayerDataSourceViewModel.call(this, context);

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    knockout.track(this, ['url']);
};

ArcGisMapServerDataSourceViewModel.prototype = inherit(ImageryLayerDataSourceViewModel.prototype);

defineProperties(ArcGisMapServerDataSourceViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf ArcGisMapServerDataSourceViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'esri-mapServer';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Esri ArcGIS MapServer'.
     * @memberOf ArcGisMapServerDataSourceViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Esri ArcGIS MapServer';
        }
    }
});

ArcGisMapServerDataSourceViewModel.prototype._enableInCesium = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var scene = this.context.cesiumScene;

    var imageryProvider = new ArcGisMapServerImageryProvider({
        url : cleanAndProxyUrl(this.context, this.url)
    });

    this._imageryLayer = new ImageryLayer(imageryProvider, {
        alpha : 0.0
        // Ideally we'd specify "rectangle : this.rectangle" here.
        // But lots of data sources get the extent wrong, and even the ones that get it right
        // specify the extent of the geometry itself, not the representation of the geometry.  So that means,
        // for example, that if we clip the layer at the given extent, then a point centered on the edge of the
        // extent will only be half visible.
    });

    scene.imageryLayers.add(this._imageryLayer);
};

ArcGisMapServerDataSourceViewModel.prototype._disableInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.context.cesiumScene;

    scene.imageryLayers.remove(this._imageryLayer);
    this._imageryLayer = undefined;
};

ArcGisMapServerDataSourceViewModel.prototype._enableInLeaflet = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var map = this.context.leafletMap;

    var options = {
        opacity : 0.0
        // Ideally we'd specify "bounds : rectangleToLatLngBounds(this.rectangle)" here.
        // See comment in _enableInCesium for an explanation of why we don't.
    };

    //this._imageryLayer = new L.tileLayer.wms(cleanAndProxyUrl(this.context, this.url), options);
    this._imageryLayer = new L.esri.tiledMapLayer(cleanAndProxyUrl(this.context, this.url), options);
    map.addLayer(this._imageryLayer);
};

ArcGisMapServerDataSourceViewModel.prototype._disableInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var map = this.context.leafletMap;

    map.removeLayer(this._imageryLayer);
    this._imageryLayer = undefined;
};

function cleanAndProxyUrl(context, url) {
    return proxyUrl(context, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(context, url) {
    if (defined(context.corsProxy) && context.corsProxy.shouldUseProxy(url)) {
        return context.corsProxy.getURL(url);
    }

    return url;
}

module.exports = ArcGisMapServerDataSourceViewModel;
