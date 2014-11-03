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

var corsProxy = require('../Core/corsProxy');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var ImageryLayerItemViewModel = require('./ImageryLayerItemViewModel');
var inherit = require('../Core/inherit');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

/**
 * A {@link ImageryLayerItemViewModel} representing a layer from an Esri ArcGIS MapServer.
 *
 * @alias ArcGisMapServerItemViewModel
 * @constructor
 * @extends ImageryLayerItemViewModel
 * 
 * @param {ApplicationViewModel} application The application.
 */
var ArcGisMapServerItemViewModel = function(application) {
    ImageryLayerItemViewModel.call(this, application);

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    knockout.track(this, ['url']);
};

inherit(ImageryLayerItemViewModel, ArcGisMapServerItemViewModel);

defineProperties(ArcGisMapServerItemViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf ArcGisMapServerItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'esri-mapServer';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Esri ArcGIS MapServer'.
     * @memberOf ArcGisMapServerItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Esri ArcGIS MapServer';
        }
    }
});

ArcGisMapServerItemViewModel.prototype._enableInCesium = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var scene = this.application.cesium.scene;

    var imageryProvider = new ArcGisMapServerImageryProvider({
        url : cleanAndProxyUrl(this.application, this.url)
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

ArcGisMapServerItemViewModel.prototype._disableInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.application.cesium.scene;

    scene.imageryLayers.remove(this._imageryLayer);
    this._imageryLayer = undefined;
};

ArcGisMapServerItemViewModel.prototype._enableInLeaflet = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var map = this.application.leaflet.map;

    var options = {
        opacity : 0.0
        // Ideally we'd specify "bounds : rectangleToLatLngBounds(this.rectangle)" here.
        // See comment in _enableInCesium for an explanation of why we don't.
    };

    this._imageryLayer = new L.esri.tiledMapLayer(cleanAndProxyUrl(this.application, this.url), options);
    map.addLayer(this._imageryLayer);
};

ArcGisMapServerItemViewModel.prototype._disableInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var map = this.application.leaflet.map;

    map.removeLayer(this._imageryLayer);
    this._imageryLayer = undefined;
};

function cleanAndProxyUrl(application, url) {
    return proxyUrl(application, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(application, url) {
    if (defined(application.corsProxy) && application.corsProxy.shouldUseProxy(url)) {
        return application.corsProxy.getURL(url);
    }

    return url;
}

module.exports = ArcGisMapServerItemViewModel;
