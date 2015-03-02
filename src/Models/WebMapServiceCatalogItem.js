'use strict';

/*global require,L,URI,$*/

var Cartesian2 = require('../../third_party/cesium/Source/Core/Cartesian2');
var CesiumMath = require('../../third_party/cesium/Source/Core/Math');
var clone = require('../../third_party/cesium/Source/Core/clone');
var combine = require('../../third_party/cesium/Source/Core/combine');
var defined = require('../../third_party/cesium/Source/Core/defined');
var defineProperties = require('../../third_party/cesium/Source/Core/defineProperties');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');
var freezeObject = require('../../third_party/cesium/Source/Core/freezeObject');
var GeographicTilingScheme = require('../../third_party/cesium/Source/Core/GeographicTilingScheme');
var ImageryLayer = require('../../third_party/cesium/Source/Scene/ImageryLayer');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');
var Rectangle = require('../../third_party/cesium/Source/Core/Rectangle');
var WebMapServiceImageryProvider = require('../../third_party/cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMercatorTilingScheme = require('../../third_party/cesium/Source/Core/WebMercatorTilingScheme');
var WebMercatorProjection = require('../../third_party/cesium/Source/Core/WebMercatorProjection');

var Metadata = require('./Metadata');
var MetadataItem = require('./MetadataItem');
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var rectangleToLatLngBounds = require('../Map/rectangleToLatLngBounds');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 * 
 * @param {Application} application The application for the group.
 */
var WebMapServiceCatalogItem = function(application) {
    ImageryLayerCatalogItem.call(this, application);

    this._metadata = undefined;
    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;
    this._legendUrl = undefined;
    this._rectangle = undefined;
    this._rectangleFromMetadata = undefined;

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
     * If this property is undefiend, {@link WebMapServiceCatalogItem.defaultParameters} is used.
     * @type {Object}
     */
    this.parameters = undefined;

    /**
     * Gets or sets the tiling scheme to pass to the WMS server when requesting images.
     * If this property is undefiend, the default tiling scheme of the provider is used.
     * @type {Object}
     */

    this.tilingScheme = undefined;
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

    this.getFeatureInfoXmlContentType = 'text/xml';

    /**
     * Gets or sets a value indicating whether this dataset should be clipped to the {@link WebMapServiceCatalogItem#rectangle}.
     * If true, no part of the dataset will be displayed outside the rectangle.  This property is false by default because it requires
     * that the rectangle be highly accurate.  Also, many WMS servers report an extent that does not take into account that the representation
     * of features sometimes require a larger spatial extent than the features themselves.  For example, if a point feature on the edge of
     * the extent is drawn as a circle with a radius of 5 pixels, half of that circle will be cut off.
     * @type {Boolean}
     * @default false
     */
    this.clipToRectangle = false;

    knockout.track(this, ['_dataUrl', '_dataUrlType', '_metadataUrl', '_legendUrl', '_rectangle', '_rectangleFromMetadata', 'url', 'layers', 'parameters', 'getFeatureInfoAsGeoJson', 'getFeatureInfoAsXml', 'tilingScheme', 'clipToRectangle']);

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
            var layer = this.layers.split(',')[0];
            return cleanUrl(this.url) + '?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=' + layer;
        },
        set : function(value) {
            this._legendUrl = value;
        }
    });

    // rectangle comes from metadata if not explicitly specified.
    delete this.__knockoutObservables.rectangle;
    knockout.defineProperty(this, 'rectangle', {
        get : function() {
            if (defined(this._rectangle)) {
                return this._rectangle;
            }
            return this._rectangleFromMetadata;
        },
        set : function(value) {
            this._rectangle = value;
        }
    });
};

inherit(ImageryLayerCatalogItem, WebMapServiceCatalogItem);

defineProperties(WebMapServiceCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf WebMapServiceCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'wms';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Web Map Service (WMS)'.
     * @memberOf WebMapServiceCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Web Map Service (WMS)';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf WebMapServiceCatalogItem.prototype
     * @type {Metadata}
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
     * Gets the set of functions used to update individual properties in {@link CatalogMember#updateFromJson}.
     * When a property name in the returned object literal matches the name of a property on this instance, the value
     * will be called as a function and passed a reference to this instance, a reference to the source JSON object
     * literal, and the name of the property.
     * @memberOf WebMapServiceCatalogItem.prototype
     * @type {Object}
     */
    updaters : {
        get : function() {
            return WebMapServiceCatalogItem.defaultUpdaters;
        }
    },

    /**
     * Gets the set of functions used to serialize individual properties in {@link CatalogMember#serializeToJson}.
     * When a property name on the model matches the name of a property in the serializers object lieral,
     * the value will be called as a function and passed a reference to the model, a reference to the destination
     * JSON object literal, and the name of the property.
     * @memberOf WebMapServiceCatalogItem.prototype
     * @type {Object}
     */
    serializers : {
        get : function() {
            return WebMapServiceCatalogItem.defaultSerializers;
        }
    }
});

WebMapServiceCatalogItem.defaultUpdaters = clone(ImageryLayerCatalogItem.defaultUpdaters);

WebMapServiceCatalogItem.defaultUpdaters.tilingScheme = function(wmsItem, json, propertyName, options) {
    if (json.tilingScheme === 'geographic') {
        wmsItem.tilingScheme = new GeographicTilingScheme();
    } else if (json.tilingScheme === 'web-mercator') {
        wmsItem.tilingScheme = new WebMercatorTilingScheme();
    } else {
        wmsItem.tilingScheme = json.tilingScheme;
    }
};

freezeObject(WebMapServiceCatalogItem.defaultUpdaters);

WebMapServiceCatalogItem.defaultSerializers = clone(ImageryLayerCatalogItem.defaultSerializers);

// Serialize the underlying properties instead of the public views of them.
WebMapServiceCatalogItem.defaultSerializers.dataUrl = function(wmsItem, json, propertyName) {
    json.dataUrl = wmsItem._dataUrl;
};
WebMapServiceCatalogItem.defaultSerializers.dataUrlType = function(wmsItem, json, propertyName) {
    json.dataUrlType = wmsItem._dataUrlType;
};
WebMapServiceCatalogItem.defaultSerializers.metadataUrl = function(wmsItem, json, propertyName) {
    json.metadataUrl = wmsItem._metadataUrl;
};
WebMapServiceCatalogItem.defaultSerializers.legendUrl = function(wmsItem, json, propertyName) {
    json.legendUrl = wmsItem._legendUrl;
};
WebMapServiceCatalogItem.defaultSerializers.tilingScheme = function(wmsItem, json, propertyName) {
    if (wmsItem.tilingScheme instanceof GeographicTilingScheme) {
        json.tilingScheme = 'geographic';
    } else if (wmsItem.tilingScheme instanceof WebMercatorTilingScheme) {
        json.tilingScheme = 'web-mercator';
    } else {
        json.tilingScheme = wmsItem.tilingScheme;
    }
};
freezeObject(WebMapServiceCatalogItem.defaultSerializers);

WebMapServiceCatalogItem.prototype._load = function() {
    this._metadata = requestMetadata(this);
    return this._metadata.promise;
};

WebMapServiceCatalogItem.prototype._enableInCesium = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var scene = this.application.cesium.scene;

    var imageryProvider = new WebMapServiceImageryProvider({
        url : cleanAndProxyUrl(this.application, this.url),
        layers : this.layers,
        getFeatureInfoAsGeoJson : this.getFeatureInfoAsGeoJson,
        getFeatureInfoAsXml : this.getFeatureInfoAsXml,
        parameters : combine(this.parameters, WebMapServiceCatalogItem.defaultParameters),
        tilingScheme : defined(this.tilingScheme) ? this.tilingScheme : new WebMercatorTilingScheme(),
        getFeatureInfoXmlContentType : this.getFeatureInfoXmlContentType
    });

    this._imageryLayer = new ImageryLayer(imageryProvider, {
        show : false,
        alpha : this.opacity,
        rectangle : this.clipToRectangle ? this.rectangle : undefined
    });

    scene.imageryLayers.add(this._imageryLayer);
};

WebMapServiceCatalogItem.prototype._disableInCesium = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    var scene = this.application.cesium.scene;
    scene.imageryLayers.remove(this._imageryLayer);
    this._imageryLayer = undefined;
};

WebMapServiceCatalogItem.prototype._enableInLeaflet = function() {
    if (defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is already enabled.');
    }

    var options = {
        layers : this.layers,
        opacity : this.opacity,
        bounds : this.clipToRectangle && this.rectangle ? rectangleToLatLngBounds(this.rectangle) : undefined
    };

    options = combine(combine(this.parameters, WebMapServiceCatalogItem.defaultParameters), options);

    this._imageryLayer = new L.tileLayer.wms(cleanAndProxyUrl(this.application, this.url), options);
};

WebMapServiceCatalogItem.prototype._disableInLeaflet = function() {
    if (!defined(this._imageryLayer)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._imageryLayer = undefined;
};

WebMapServiceCatalogItem.prototype.pickFeaturesInLeaflet = function(mapExtent, mapWidth, mapHeight, pickX, pickY) {
    var projection = new WebMercatorProjection();
    var sw = projection.project(Rectangle.southwest(mapExtent));
    var ne = projection.project(Rectangle.northeast(mapExtent));

    var tilingScheme = new WebMercatorTilingScheme({
        rectangleSouthwestInMeters: sw,
        rectangleNortheastInMeters: ne
    });

    // Compute the longitude and latitude of the pick location.
    var x = CesiumMath.lerp(sw.x, ne.x, pickX / (mapWidth - 1));
    var y = CesiumMath.lerp(ne.y, sw.y, pickY / (mapHeight - 1));

    var ll = projection.unproject(new Cartesian2(x, y));

    // Use a Cesium imagery provider to pick features.
    var imageryProvider = new WebMapServiceImageryProvider({
        url : cleanAndProxyUrl(this.application, this.url),
        layers : this.layers,
        getFeatureInfoAsGeoJson : this.getFeatureInfoAsGeoJson,
        getFeatureInfoAsXml : this.getFeatureInfoAsXml,
        parameters : combine(this.parameters, WebMapServiceCatalogItem.defaultParameters),
        tilingScheme : tilingScheme,
        getFeatureInfoXmlContentType : this.getFeatureInfoXmlContentType,
        tileWidth : mapWidth,
        tileHeight : mapHeight
    });

    return imageryProvider.pickFeatures(0, 0, 0, ll.longitude, ll.latitude);
};

WebMapServiceCatalogItem.defaultParameters = {
    transparent: true,
    format: 'image/png',
    exceptions: 'application/vnd.ogc.se_xml',
    styles: '',
    tiled: true
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

function getRectangleFromMetadata(layer) {
    var egbb = layer.EX_GeographicBoundingBox; // required in WMS 1.3.0
    if (defined(egbb)) {
        return Rectangle.fromDegrees(egbb.westBoundLongitude, egbb.southBoundLatitude, egbb.eastBoundLongitude, egbb.northBoundLatitude);
    } else {
        var llbb = layer.LatLonBoundingBox; // required in WMS 1.0.0 through 1.1.1
        if (defined(llbb)) {
            return Rectangle.fromDegrees(llbb.minx, llbb.miny, llbb.maxx, llbb.maxy);
        }
    }
    return undefined;
}

function requestMetadata(wmsItem) {
    var result = new Metadata();

    result.isLoading = true;

    result.promise = loadXML(proxyUrl(wmsItem.application, wmsItem.metadataUrl)).then(function(capabilities) {
        var json = $.xml2json(capabilities);

        if (json.Service) {
            populateMetadataGroup(result.serviceMetadata, json.Service);
        } else {
            result.serviceErrorMessage = 'Service information not found in GetCapabilities operation response.';
        }

        var layer;
        if (defined(json.Capability)) {
            layer = findLayer(json.Capability.Layer, wmsItem.layers);
        }
        if (layer) {
            populateMetadataGroup(result.dataSourceMetadata, layer);
            wmsItem._rectangleFromMetadata = getRectangleFromMetadata(layer);
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

                    dest = new MetadataItem();
                    dest.name = name + ' (' + subValue.CRS + ')';
                    dest.value = subValue;

                    populateMetadataGroup(dest, subValue);

                    metadataGroup.items.push(dest);
                }
            } else {
                dest = new MetadataItem();
                dest.name = name;
                dest.value = value;

                populateMetadataGroup(dest, value);

                metadataGroup.items.push(dest);
            }
        }
    }
}

module.exports = WebMapServiceCatalogItem;
