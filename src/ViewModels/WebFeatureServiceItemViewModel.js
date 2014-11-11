'use strict';

/*global require,L,URI,$*/

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
var loadJson = require('../../third_party/cesium/Source/Core/loadJson');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var objectToQuery = require('../../third_party/cesium/Source/Core/objectToQuery');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');

var corsProxy = require('../Core/corsProxy');
var GeoJsonItemViewModel = require('./GeoJsonItemViewModel');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var inherit = require('../Core/inherit');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');
var gmlToGeoJson = require('../Map/gmlToGeoJson');

/**
 * A {@link ImageryLayerItemViewModel} representing a layer from a Web Map Service (WMS) server.
 *
 * @alias WebFeatureServiceItemViewModel
 * @constructor
 * @extends CatalogItemViewModel
 * 
 * @param {ApplicationViewModel} application The application for the group.
 */
var WebFeatureServiceItemViewModel = function(application) {
    CatalogItemViewModel.call(this, application);

    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;
    this._geoJsonViewModel = undefined;

    /**
     * Gets or sets the URL of the WFS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the WFS feature type names.
     * @type {String}
     */
    this.typeNames = '';

    /**
     * Gets or sets a value indicating whether we should request GeoJSON from the WFS server.  If this property
     * and {@link WebFeatureServiceItemViewModel#requestGeoJson} are both true, we'll request GeoJSON first and
     * only fall back on trying GML if the GeoJSON request fails.
     * @type {Boolean}
     * @default true
     */
    this.requestGeoJson = true;

    /**
     * Gets or sets a value indicating whether we should request GML from the WFS server.  If this property
     * and {@link WebFeatureServiceItemViewModel#requestGeoJson} are both true, we'll request GeoJSON first and
     * only fall back on trying GML if the GeoJSON request fails.
     * @type {Boolean}
     * @default true
     */
    this.requestGml = true;

    knockout.track(this, ['_dataUrl', '_dataUrlType', '_metadataUrl', 'url', 'typeNames', 'requestGeoJson', 'requestGml']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
    delete this.__knockoutObservables.dataUrl;
    knockout.defineProperty(this, 'dataUrl', {
        get : function() {
            var url = this._dataUrl;
            if (!defined(url)) {
                url = this.url;
            }

            if (this.dataUrlType === 'wfs') {
                url = cleanUrl(url) + '?service=WFS&version=1.1.0&request=GetFeature&typeName=' + this.typeNames + '&srsName=EPSG%3A4326&maxFeatures=1000';
            }

            return url;
        },
        set : function(value) {
            this._dataUrl = value;
        }
    });

    delete this.__knockoutObservables.dataUrlType;
    knockout.defineProperty(this, 'dataUrlType', {
        get : function() {
            if (defined(this._dataUrlType)) {
                return this._dataUrlType;
            } else {
                return 'wfs';
            }
        },
        set : function(value) {
            this._dataUrlType = value;
        }
    });

    delete this.__knockoutObservables.metadataUrl;
    knockout.defineProperty(this, 'metadataUrl', {
        get : function() {
            if (defined(this._metadataUrl)) {
                return this._metadataUrl;
            }

            return cleanUrl(this.url) + '?service=WFS&version=1.1.0&request=GetCapabilities';
        },
        set : function(value) {
            this._metadataUrl = value;
        }
    });
};

inherit(CatalogItemViewModel, WebFeatureServiceItemViewModel);

defineProperties(WebFeatureServiceItemViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf WebFeatureServiceItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wfs';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Feature Service (WFS)'.
     * @memberOf WebFeatureServiceItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Feature Service (WFS)';
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf WebFeatureServiceItemViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return WebFeatureServiceItemViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebFeatureServiceItemViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebFeatureServiceItemViewModel.defaultSerializers;
        }
    }
});

WebFeatureServiceItemViewModel.defaultUpdaters = clone(CatalogItemViewModel.defaultUpdaters);
freezeObject(WebFeatureServiceItemViewModel.defaultUpdaters);

WebFeatureServiceItemViewModel.defaultSerializers = clone(CatalogItemViewModel.defaultSerializers);

// Serialize the underlying properties instead of the public views of them.
WebFeatureServiceItemViewModel.defaultSerializers.dataUrl = function(viewModel, json, propertyName) {
    json.dataUrl = viewModel._dataUrl;
};
WebFeatureServiceItemViewModel.defaultSerializers.dataUrlType = function(viewModel, json, propertyName) {
    json.dataUrlType = viewModel._dataUrlType;
};
WebFeatureServiceItemViewModel.defaultSerializers.metadataUrl = function(viewModel, json, propertyName) {
    json.metadataUrl = viewModel._metadataUrl;
};
freezeObject(WebFeatureServiceItemViewModel.defaultSerializers);

WebFeatureServiceItemViewModel.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.typeNames, this.requestGeoJson, this.requestGml];
};

WebFeatureServiceItemViewModel.prototype._load = function() {
    this._geoJsonViewModel = new GeoJsonItemViewModel(this.application);


    var promise;
    if (this.requestGeoJson) {
        promise = loadGeoJson(this);
    } else if (this.requestGml) {
        promise = loadGml(this);
    } else {
        return;
    }

    this._geoJsonViewModel.data = promise;

    var that = this;
    return that._geoJsonViewModel.load().then(function() {
        that.rectangle = that._geoJsonViewModel.rectangle;
    });
};

WebFeatureServiceItemViewModel.prototype._enable = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._enable();
    }
};

WebFeatureServiceItemViewModel.prototype._disable = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._disable();
    }
};

WebFeatureServiceItemViewModel.prototype._show = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._show();
    }
};

WebFeatureServiceItemViewModel.prototype._hide = function() {
    if (defined(this._geoJsonViewModel)) {
        this._geoJsonViewModel._hide();
    }
};

function loadGeoJson(viewModel) {
    var promise = loadJson(buildGeoJsonUrl(viewModel)).then(function(json) {
        return json;
    });

    if (viewModel.requestGml) {
        promise = promise.otherwise(function() {
            return loadGml(viewModel);
        });
    }

    return promise;
}

function loadGml(viewModel) {
    return loadXML(buildGmlUrl(viewModel)).then(function(xml) {
        return gmlToGeoJson(xml);
    });
}

function buildGeoJsonUrl(viewModel) {
    var url = cleanAndProxyUrl(viewModel.application, viewModel.url);
    return url + '?' + objectToQuery({
        service: 'WFS',
        request: 'GetFeature',
        typeName: viewModel.typeNames,
        version: '1.1.0',
        outputFormat: 'JSON',
        srsName: 'EPSG:4326'
    });
}

function buildGmlUrl(viewModel) {
    var url = cleanAndProxyUrl(viewModel.application, viewModel.url);
    return url + '?' + objectToQuery({
        service: 'WFS',
        request: 'GetFeature',
        typeName: viewModel.typeNames,
        version: '1.1.0',
        srsName: 'EPSG:4326'
    });
}

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

module.exports = WebFeatureServiceItemViewModel;
