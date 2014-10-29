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
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');

var corsProxy = require('../Core/corsProxy');
var MetadataViewModel = require('./MetadataViewModel');
var MetadataItemViewModel = require('./MetadataItemViewModel');
var CatalogItemViewModel = require('./CatalogItemViewModel');
var ImageryLayerItemViewModel = require('./ImageryLayerItemViewModel');
var inherit = require('../Core/inherit');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

/**
 * A {@link ImageryLayerItemViewModel} representing a layer from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceItemViewModel
 * @constructor
 * @extends ImageryLayerItemViewModel
 * 
 * @param {ApplicationViewModel} application The application for the group.
 */
var WebMapServiceItemViewModel = function(application) {
    ImageryLayerItemViewModel.call(this, application);

    this._metadata = undefined;
    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;
    this._legendUrl = undefined;

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
     * If this property is undefiend, {@link WebMapServiceItemViewModel.defaultParameters} is used.
     * @type {Object}
     */
    this.parameters = undefined;

    /**
     * Gets or sets a value indicating whether we should request information about individual features on click
     * as GeoJSON.  If getFeatureInfoAsXml is true as well, feature information will be requested first as GeoJSON,
     * and then as XML if the GeoJSON request fails.  If both are false, this data item will not support feature picking at all.
     * @type {Boolean}
     * @default true
     */
    this.getFeatureInfoAsGeoJson = true;

    /**
     * Gets or sets a value indicating whether we should request information about individual features on click
     * as XML.  If getFeatureInfoAsGeoJson is true as well, feature information will be requested first as GeoJSON,
     * and then as XML if the GeoJSON request fails.  If both are false, this data item will not support feature picking at all.
     * @type {Boolean}
     * @default true
     */
    this.getFeatureInfoAsXml = true;

    knockout.track(this, ['_dataUrl', '_dataUrlType', '_metadataUrl', '_legendUrl', 'url', 'layers', 'parameters', 'getFeatureInfoAsGeoJson', 'getFeatureInfoAsXml']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
    delete this.__knockoutObservables.dataUrl;
    knockout.defineProperty(this, 'dataUrl', {
        get : function() {
            var url = this._dataUrl;
            if (!defined(url)) {
                url = this.url;
            }

            if (this.dataUrlType === 'wfs') {
                url = cleanUrl(url) + '?service=WFS&version=1.1.0&request=GetFeature&typeName=' + this.layers + '&srsName=EPSG%3A4326&maxFeatures=1000';
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

            return cleanUrl(this.url) + '?service=WMS&version=1.3.0&request=GetCapabilities';
        },
        set : function(value) {
            this._metadataUrl = value;
        }
    });

    delete this.__knockoutObservables.legendUrl;
    knockout.defineProperty(this, 'legendUrl', {
        get : function() {
            if (defined(this._legendUrl)) {
                return this._legendUrl;
            }

            return cleanUrl(this.url) + '?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=' + this.layers;
        },
        set : function(value) {
            this._legendUrl = value;
        }
    });
};

inherit(ImageryLayerItemViewModel, WebMapServiceItemViewModel);

defineProperties(WebMapServiceItemViewModel.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf WebMapServiceItemViewModel.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wms';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Map Service (WMS)'.
     * @memberOf WebMapServiceItemViewModel.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Map Service (WMS)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf WebMapServiceItemViewModel.prototype
     * @type {MetadataViewModel}
     */
    metadata : {
        get : function() {
            if (!defined(this._metadata)) {
                this._metadata = requestMetadata(this);
            }
            return this._metadata;
        }
    },

    /**
     * Gets the set of functions used to update individual properties in {@link CatalogMemberViewModel#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf WebMapServiceItemViewModel.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return WebMapServiceItemViewModel.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMemberViewModel#serializeToJson}.
     * When a property name on the view-model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the view-model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebMapServiceItemViewModel.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebMapServiceItemViewModel.defaultSerializers;
        }
    }
});

WebMapServiceItemViewModel.defaultUpdaters = clone(ImageryLayerItemViewModel.defaultUpdaters);
freezeObject(WebMapServiceItemViewModel.defaultUpdaters);

WebMapServiceItemViewModel.defaultSerializers = clone(ImageryLayerItemViewModel.defaultSerializers);

// Serialize the underlying properties instead of the public views of them.
WebMapServiceItemViewModel.defaultSerializers.dataUrl = function(viewModel, json, propertyName) {
    json.dataUrl = viewModel._dataUrl;
};
WebMapServiceItemViewModel.defaultSerializers.dataUrlType = function(viewModel, json, propertyName) {
    json.dataUrlType = viewModel._dataUrlType;
};
WebMapServiceItemViewModel.defaultSerializers.metadataUrl = function(viewModel, json, propertyName) {
    json.metadataUrl = viewModel._metadataUrl;
};
WebMapServiceItemViewModel.defaultSerializers.legendUrl = function(viewModel, json, propertyName) {
    json.legendUrl = viewModel._legendUrl;
};

freezeObject(WebMapServiceItemViewModel.defaultSerializers);

WebMapServiceItemViewModel.prototype._enableInCesium = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var scene = this.application.cesium.scene;

    var imageryProvider = new WebMapServiceImageryProvider({
        url : cleanAndProxyUrl(this.application, this.url),
        layers : this.layers,
        getFeatureInfoAsGeoJson : this.getFeatureInfoAsGeoJson,
        getFeatureInfoAsXml : this.getFeatureInfoAsXml,
        parameters : defaultValue(this.parameters, WebMapServiceItemViewModel.defaultParameters)
    });

    this._imageryLayer = new ImageryLayer(imageryProvider, {
        show : false,
        alpha : this.opacity
        // Ideally we'd specify "rectangle : this.rectangle" here.
        // But lots of WMS data sources get the extent wrong, and even the ones that get it right
        // specify the extent of the geometry itself, not the representation of the geometry.  So that means,
        // for example, that if we clip the layer at the given extent, then a point centered on the edge of the
        // extent will only be half visible.
    });

    scene.imageryLayers.add(this._imageryLayer);
};

WebMapServiceItemViewModel.prototype._disableInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.application.cesium.scene;
    scene.imageryLayers.remove(this._imageryLayer);
    this._imageryLayer = undefined;
};

WebMapServiceItemViewModel.prototype._enableInLeaflet = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var map = this.application.leaflet.map;

    var options = {
        layers : this.layers,
        opacity : this.opacity
        // Ideally we'd specify "bounds : rectangleToLatLngBounds(this.rectangle)" here.
        // See comment in _enableInCesium for an explanation of why we don't.
    };

    options = combine(defaultValue(this.parameters, WebMapServiceItemViewModel.defaultParameters), options);

    this._imageryLayer = new L.tileLayer.wms(cleanAndProxyUrl(this.application, this.url), options);
};

WebMapServiceItemViewModel.prototype._disableInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer = undefined;
};

WebMapServiceItemViewModel.defaultParameters = {
    transparent: true,
    format: 'image/png',
    exceptions: 'application/vnd.ogc.se_xml',
    style: ''
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

function requestMetadata(viewModel) {
    var result = new MetadataViewModel();

    result.isLoading = true;

    result.promise = loadXML(proxyUrl(viewModel.application, viewModel.metadataUrl)).then(function(capabilities) {
        var json = $.xml2json(capabilities);

        if (json.Service) {
            populateMetadataGroup(result.serviceMetadata, json.Service);
        } else {
            result.serviceErrorMessage = 'Service information not found in GetCapabilities operation response.';
        }

        var layer;
        if (defined(json.Capability)) {
            layer = findLayer(json.Capability.Layer, viewModel.layers);
        }
        if (layer) {
            populateMetadataGroup(result.dataSourceMetadata, layer);
        } else {
            result.dataSourceErrorMessage = 'Layer information not found in GetCapabilities operation response.';
        }

        result.isLoading = false;
    }).otherwise(function() {
        result.dataSourceErrorMessage = 'An error occurred while invoking the GetCapabilities service.';
        result.serviceErrorMessage = 'An error occurred while invoking the GetCapabilities service.';
        result.isLoading = false;
    });

    return result;
}

function findLayer(startLayer, name) {
    if (startLayer.Name === name || startLayer.Title === name) {
        return startLayer;
    }

    var layers = startLayer.Layer;
    if (!defined(layers)) {
        return undefined;
    }

    var found = findLayer(layers, name);
    for (var i = 0; !found && i < layers.length; ++i) {
        var layer = layers[i];
        found = findLayer(layer, name);
    }

    return found;
}

function populateMetadataGroup(metadataGroup, sourceMetadata) {
    if (typeof sourceMetadata === 'string' || sourceMetadata instanceof Array) {
        return;
    }

    for (var name in sourceMetadata) {
        if (sourceMetadata.hasOwnProperty(name)) {
            var value = sourceMetadata[name];

            var dest;
            if (name === 'BoundingBox' && value instanceof Array) {
                for (var i = 0; i < value.length; ++i) {
                    var subValue = value[i];

                    dest = new MetadataItemViewModel();
                    dest.name = name + ' (' + subValue.CRS + ')';
                    dest.value = subValue;

                    populateMetadataGroup(dest, subValue);

                    metadataGroup.items.push(dest);
                }
            } else {
                dest = new MetadataItemViewModel();
                dest.name = name;
                dest.value = value;

                populateMetadataGroup(dest, value);

                metadataGroup.items.push(dest);
            }
        }
    }
}

module.exports = WebMapServiceItemViewModel;
