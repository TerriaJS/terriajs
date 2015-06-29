'use strict';

/*global require*/
var URI = require('URIjs');

var clone = require('terriajs-cesium/Source/Core/clone');
var combine = require('terriajs-cesium/Source/Core/combine');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
var GeographicTilingScheme = require('terriajs-cesium/Source/Core/GeographicTilingScheme');
var GetFeatureInfoFormat = require('terriajs-cesium/Source/Scene/GetFeatureInfoFormat');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var TimeInterval = require('terriajs-cesium/Source/Core/TimeInterval');
var TimeIntervalCollection = require('terriajs-cesium/Source/Core/TimeIntervalCollection');
var WebMapServiceImageryProvider = require('terriajs-cesium/Source/Scene/WebMapServiceImageryProvider');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var containsAny = require('../Core/containsAny');
var Metadata = require('./Metadata');
var MetadataItem = require('./MetadataItem');
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var overrideProperty = require('../Core/overrideProperty');
var unionRectangleArray = require('../Map/unionRectangleArray');
var xml2json = require('../ThirdParty/xml2json');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from a Web Map Service (WMS) server.
 *
 * @alias WebMapServiceCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var WebMapServiceCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);

    this._rawMetadata = undefined;
    this._thisLayerInRawMetadata = undefined;
    this._allLayersInRawMetadata = undefined;

    this._metadata = undefined;
    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;
    this._legendUrl = undefined;
    this._rectangle = undefined;
    this._rectangleFromMetadata = undefined;
    this._intervalsFromMetadata = undefined;

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
     * If this property is undefined, {@link WebMapServiceCatalogItem.defaultParameters} is used.
     * @type {Object}
     */
    this.parameters = {};

    /**
     * Gets or sets the tiling scheme to pass to the WMS server when requesting images.
     * If this property is undefiend, the default tiling scheme of the provider is used.
     * @type {Object}
     */
    this.tilingScheme = undefined;

    /**
     * Gets or sets the formats in which to try WMS GetFeatureInfo requests.  If this property is undefined, the `WebMapServiceImageryProvider` defaults
     * are used.  This property is observable.
     * @type {GetFeatureInfoFormat[]}
     */
    this.getFeatureInfoFormats = undefined;

    /**
     * Gets or sets a value indicating whether a time dimension, if it exists in GetCapabilities, should be used to populate
     * the {@link ImageryLayerCatalogItem#intervals}.  If the {@link ImageryLayerCatalogItem#intervals} property is set explicitly
     * on this catalog item, the value of this property is ignored.
     * @type {Boolean}
     * @default true
     */
    this.populateIntervalsFromTimeDimension = true;

    /**
     * Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing
     * a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property,
     * will be used and will simply get blurier as the user zooms in closer.
     * @type {Number}
     */
    this.minScaleDenominator = undefined;

    knockout.track(this, [
        '_dataUrl', '_dataUrlType', '_metadataUrl', '_legendUrl', '_rectangle', '_rectangleFromMetadata', '_intervalsFromMetadata', 'url',
        'layers', 'parameters', 'getFeatureInfoFormats',
        'tilingScheme', 'populateIntervalsFromTimeDimension', 'minScaleDenominator']);

    // dataUrl, metadataUrl, and legendUrl are derived from url if not explicitly specified.
    overrideProperty(this, 'metadataUrl', {
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

    overrideProperty(this, 'legendUrl', {
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
     * Gets a value indicating whether this {@link ImageryLayerCatalogItem} supports the {@link ImageryLayerCatalogItem#intervals}
     * property for configuring time-dynamic imagery.
     * @type {Boolean}
     */
    supportsIntervals : {
        get : function() {
            return true;
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

WebMapServiceCatalogItem.defaultUpdaters.getFeatureInfoFormats = function(wmsItem, json, propertyName, options) {
    var formats = [];

    for (var i = 0; i < json.getFeatureInfoFormats.length; ++i) {
        var format = json.getFeatureInfoFormats[i];
        formats.push(new GetFeatureInfoFormat(format.type, format.format));
    }

    wmsItem.getFeatureInfoFormats = formats;
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

/**
 * The collection of strings that indicate an Abstract property should be ignored.  If these strings occur anywhere
 * in the Abstract, the Abstract will not be used.  This makes it easy to filter out placeholder data like
 * Geoserver's "A compliant implementation of WMS..." stock abstract.
 * @type {Array}
 */
WebMapServiceCatalogItem.abstractsToIgnore = [
    'A compliant implementation of WMS'
];

/**
 * Updates this catalog item from a WMS GetCapabilities document.
 * @param {Object|XMLDocument} capabilities The capabilities document.  This may be a JSON object or an XML document.  If it
 *                             is a JSON object, each layer is expected to have a `_parent` property with a reference to its
 *                             parent layer.
 * @param {Boolean} [overwrite=false] True to overwrite existing property values with data from the capabilities; false to
 *                  preserve any existing values.
 * @param {Object} [thisLayer] A reference to this layer within the JSON capabilities object.  If this parameter is not
 *                 specified or if `capabilities` is an XML document, the layer is found automatically based on this
 *                 catalog item's `layers` property.
 */
WebMapServiceCatalogItem.prototype.updateFromCapabilities = function(capabilities, overwrite, thisLayer) {
    if (defined(capabilities.documentElement)) {
        capabilities = capabilitiesXmlToJson(capabilities);
        thisLayer = undefined;
    }

    if (!defined(thisLayer)) {
        thisLayer = findLayers(capabilities.Capability.Layer, this.layers);
        if (!defined(thisLayer)) {
            return;
        }

        if (defined(this.layers)) {
            var layers = this.layers.split(',');
            for (var i = 0; i < thisLayer.length; ++i) {
                if (!defined(thisLayer[i])) {
                    console.log('A layer with the name or ID \"' + layers[i] + '\" does not exist on the WMS Server - ignoring it.');
                    thisLayer.splice(i, 1);
                    layers.splice(i, 1);
                    --i;
                }
            }
        }

        if (thisLayer.length === 0) {
            return;
        }
    }

    this._rawMetadata = capabilities;

    if (Array.isArray(thisLayer)) {
        this._thisLayerInRawMetadata = thisLayer[0];
        this._allLayersInRawMetadata = thisLayer;
        thisLayer = this._thisLayerInRawMetadata;
    } else {
        this._thisLayerInRawMetadata = thisLayer;
        this._allLayersInRawMetadata = [thisLayer];
    }

    if (!containsAny(thisLayer.Abstract, WebMapServiceCatalogItem.abstractsToIgnore)) {
        updateInfoSection(this, overwrite, 'Data Description', thisLayer.Abstract);
    }

    var service = definedNotNull(capabilities.Service) ? capabilities.Service : {};

    // Show the service abstract if there is one, and if it isn't the Geoserver default "A compliant implementation..."
    if (!containsAny(service.Abstract, WebMapServiceCatalogItem.abstractsToIgnore) && service.Abstract !== thisLayer.Abstract) {
        updateInfoSection(this, overwrite, 'Service Description', service.Abstract);
    }

    // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
    if (definedNotNull(service.AccessConstraints) && !/^none$/i.test(service.AccessConstraints)) {
        updateInfoSection(this, overwrite, 'Access Constraints', service.AccessConstraints);
    }

    updateValue(this, overwrite, 'dataCustodian', getDataCustodian(capabilities));
    updateValue(this, overwrite, 'minScaleDenominator', thisLayer.MinScaleDenominator);
    updateValue(this, overwrite, 'getFeatureInfoFormats', getFeatureInfoFormats(capabilities));
    updateValue(this, overwrite, 'rectangle', getRectangleFromLayers(this._allLayersInRawMetadata));
    updateValue(this, overwrite, 'intervals', getIntervalsFromLayer(thisLayer));

    var crs;
    if (defined(thisLayer.CRS)) {
        crs = getInheritableProperty(thisLayer, 'CRS', true);
    } else {
        crs = getInheritableProperty(thisLayer, 'SRS', true);
    }

    var tilingScheme;
    var srs;

    if (defined(crs)) {
        if (crsIsMatch(crs, 'EPSG:3857')) {
            // Standard Web Mercator
            tilingScheme = new WebMercatorTilingScheme();
            srs = 'EPSG:3857';
        } else if (crsIsMatch(crs, 'EPSG:900913')) {
            // Older code for Web Mercator
            tilingScheme = new WebMercatorTilingScheme();
            srs = 'EPSG:900913';
        } else if (crsIsMatch(crs, 'EPSG:4326')) {
            // Standard Geographic
            tilingScheme = new GeographicTilingScheme();
            srs = 'EPSG:4326';
        } else if (crsIsMatch(crs, 'CRS:84')) {
            // Another name for EPSG:4326
            tilingScheme = new GeographicTilingScheme();
            srs = 'CRS:84';
        } else if (crsIsMatch(crs, 'EPSG:4283')) {
            // Australian system that is equivalent to EPSG:4326.
            tilingScheme = new GeographicTilingScheme();
            srs = 'EPSG:4283';
        } else {
            // No known supported CRS listed.  Try the default, EPSG:3857, and hope for the best.
            tilingScheme = new WebMercatorTilingScheme();
            srs = 'EPSG:3857';
        }
    }

    updateValue(this, overwrite, 'tilingScheme', tilingScheme);

    if (!defined(this.parameters)) {
        this.parameters = {};
    }
    updateValue(this.parameters, overwrite, 'srs', srs);
};

WebMapServiceCatalogItem.prototype._load = function() {
    if (!defined(this._rawMetadata)) {
        var that = this;
        return loadXML(proxyUrl(this.terria, this.metadataUrl)).then(function(xml) {
            var metadata = capabilitiesXmlToJson(xml);
            that.updateFromCapabilities(metadata, false);
        });
    }
};

WebMapServiceCatalogItem.prototype._createImageryProvider = function(time) {
    var parameters = this.parameters;
    if (defined(time)) {
        parameters = combine({ time: time }, parameters);
    }

    parameters = combine(parameters, WebMapServiceCatalogItem.defaultParameters);

    var maximumLevel;

    if (defined(this.minScaleDenominator)) {
        var metersPerPixel = 0.00028; // from WMS 1.3.0 spec section 7.2.4.6.9
        var tileWidth = 256;

        var circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
        var distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
        var level0ScaleDenominator = distancePerPixelAtLevel0 / metersPerPixel;

        // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
        var ratio = level0ScaleDenominator / (this.minScaleDenominator - 1e-6);
        var levelAtMinScaleDenominator = Math.log(ratio) / Math.log(2);
        maximumLevel = levelAtMinScaleDenominator | 0;
    }

    return new WebMapServiceImageryProvider({
        url : cleanAndProxyUrl( this.terria, this.url),
        layers : this.layers,
        getFeatureInfoFormats : this.getFeatureInfoFormats,
        parameters : parameters,
        getFeatureInfoParameters : parameters,
        tilingScheme : defined(this.tilingScheme) ? this.tilingScheme : new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel
    });
};

WebMapServiceCatalogItem.defaultParameters = {
    transparent: true,
    format: 'image/png',
    exceptions: 'application/vnd.ogc.se_xml',
    styles: '',
    tiled: true
};

function cleanAndProxyUrl(terria, url) {
    return proxyUrl(terria, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
}

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
        return terria.corsProxy.getURL(url);
    }

    return url;
}

function getRectangleFromLayer(layer) {
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

function getRectangleFromLayers(layers) {
    if (!Array.isArray(layers)) {
        return getRectangleFromLayer(layers);
    }

    return unionRectangleArray(layers.map(function(item) {
        return getRectangleFromLayer(item);
    }));
}

function getIntervalsFromLayer(layer) {
    var dimensions = layer.Dimension;

    if (!defined(dimensions)) {
        return undefined;
    }

    if (!(dimensions instanceof Array)) {
        dimensions = [dimensions];
    }

    var result = new TimeIntervalCollection();

    for (var i = 0; i < dimensions.length; ++i) {
        var dimension = dimensions[i];

        if (dimension.name !== 'time') {
            continue;
        }

        // WMS 1.3.0 GetCapabilities has the times embedded right in the Dimension element.
        // WMS 1.1.0 puts the time in an Extent element.
        var extent;
        if (dimension instanceof String || typeof dimension === 'string') {
            extent = dimension;
        } else {
            // Find the corresponding extent.
            var extentList = layer.Extent;
            if (!defined(extentList)) {
                return undefined;
            }

            for (var extentIndex = 0; extentIndex < extentList.length; ++extentIndex) {
                var candidate = extentList[extentIndex];
                if (candidate.name === 'time') {
                    extent = candidate;
                    break;
                }
            }
        }

        if (!defined(extent)) {
            return undefined;
        }

        var times = extent.split(',');

        for (var j = 0; j < times.length; ++j) {
            var start = JulianDate.fromIso8601(times[j]);
            var stop;
            if (j < times.length - 1) {
                stop = JulianDate.fromIso8601(times[j + 1]);
            } else if (result.length > 0) {
                var previousInterval = result.get(result.length - 1);
                var duration = JulianDate.secondsDifference(previousInterval.stop, previousInterval.start);
                stop = JulianDate.addSeconds(start, duration, new JulianDate());
            } else {
                // There's exactly one time, so treat this layer as if it is not time-varying.
                return undefined;
            }

            result.addInterval(new TimeInterval({
                start: start,
                stop: stop,
                data: times[j]
            }));
        }
    }

    return result;
}

function getFeatureInfoFormats(capabilities) {
    var supportsJsonGetFeatureInfo = false;
    var supportsXmlGetFeatureInfo = false;
    var supportsHtmlGetFeatureInfo = false;
    var xmlContentType = 'text/xml';

    if (defined(capabilities.Capability.Request) &&
        defined(capabilities.Capability.Request.GetFeatureInfo) &&
        defined(capabilities.Capability.Request.GetFeatureInfo.Format)) {

        var format = capabilities.Capability.Request.GetFeatureInfo.Format;
        if (format === 'application/json') {
            supportsJsonGetFeatureInfo = true;
        } else if (defined(format.indexOf) && format.indexOf('application/json') >= 0) {
            supportsJsonGetFeatureInfo = true;
        }

        if (format === 'text/xml' || format === 'application/vnd.ogc.gml') {
            supportsXmlGetFeatureInfo = true;
            xmlContentType = format;
        } else if (defined(format.indexOf) && format.indexOf('text/xml') >= 0) {
            supportsXmlGetFeatureInfo = true;
            xmlContentType = 'text/xml';
        } else if (defined(format.indexOf) && format.indexOf('application/vnd.ogc.gml') >= 0) {
            supportsXmlGetFeatureInfo = true;
            xmlContentType = 'application/vnd.ogc.gml';
        } else if (defined(format.indexOf) && format.indexOf('text/html') >= 0) {
            supportsHtmlGetFeatureInfo = true;
        }
    }

    var result = [];

    if (supportsJsonGetFeatureInfo) {
        result.push(new GetFeatureInfoFormat('json'));
    }
    if (supportsXmlGetFeatureInfo) {
        result.push(new GetFeatureInfoFormat('xml', xmlContentType));
    }
    if (supportsHtmlGetFeatureInfo) {
        result.push(new GetFeatureInfoFormat('html'));
    }

    return result;
}

function requestMetadata(wmsItem) {
    var result = new Metadata();

    result.isLoading = true;

    result.promise = when(wmsItem.load()).then(function() {
        var json = wmsItem._rawMetadata;
        if (json && json.Service) {
            populateMetadataGroup(result.serviceMetadata, json.Service);
        } else {
            result.serviceErrorMessage = 'Service information not found in GetCapabilities operation response.';
        }

        if (wmsItem._thisLayerInRawMetadata) {
            populateMetadataGroup(result.dataSourceMetadata, wmsItem._thisLayerInRawMetadata);
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

/* Given a comma-separated string of layer names, returns the layer objects corresponding to them. */
function findLayers(startLayer, names) {
    return names.split(',').map(function(i) {
        return findLayer(startLayer, i);
    });
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
    if (typeof sourceMetadata === 'string' || sourceMetadata instanceof String || sourceMetadata instanceof Array) {
        return;
    }

    for (var name in sourceMetadata) {
        if (sourceMetadata.hasOwnProperty(name) && name !== '_parent') {
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

function updateInfoSection(item, overwrite, sectionName, sectionValue) {
    if (!definedNotNull(sectionValue) || sectionValue.length === 0) {
        return;
    }

    var section = item.findInfoSection(sectionName);
    if (!defined(section)) {
        item.info.push({
            name: sectionName,
            content: sectionValue
        });
    } else if (overwrite) {
        section.content = sectionValue;
    }
}

function updateValue(item, overwrite, propertyName, propertyValue) {
    if (!definedNotNull(propertyValue)) {
        return;
    }

    if (overwrite || !defined(item[propertyName])) {
        item[propertyName] = propertyValue;
    }
}

function crsIsMatch(crs, matchValue) {
    if (crs === matchValue) {
        return true;
    }

    if (crs instanceof Array && crs.indexOf(matchValue) >= 0) {
        return true;
    }

     return false;
}

function getInheritableProperty(layer, name, appendValues) {
    var value = [];
    while (defined(layer)) {
        if (defined(layer[name])) {
            if (appendValues) {
                value = value.concat((layer[name] instanceof Array) ? layer[name] : [layer[name]]);
            } else {
                return layer[name];
            }
        }
        layer = layer._parent;
    }

    return value.length > 0 ? value : undefined;
}

function capabilitiesXmlToJson(capabilities) {
    var json = xml2json(capabilities);
    updateParentReference(json.Capability);
    return json;
}

function updateParentReference(capabilitiesJson, parent) {
    capabilitiesJson._parent = parent;

    var layers = capabilitiesJson.Layer;

    if (layers instanceof Array) {
        for (var i = 0; i < layers.length; ++i) {
            updateParentReference(layers[i], capabilitiesJson);
        }
    } else if (defined(layers)) {
        updateParentReference(layers, capabilitiesJson);
    }
}

function getDataCustodian(capabilities) {
    if (defined(capabilities.Service.ContactInformation)) {
        var contactInfo = capabilities.Service.ContactInformation;

        var text = '';

        var primary = contactInfo.ContactPersonPrimary;
        if (definedNotNull(primary)) {
            if (definedNotNull(primary.ContactOrganization) && primary.ContactOrganization.length > 0) {
                text += primary.ContactOrganization + '<br/>';
            }
        }

        if (defined(contactInfo.ContactElectronicMailAddress) && contactInfo.ContactElectronicMailAddress.length > 0) {
            text += '[' + contactInfo.ContactElectronicMailAddress + '](mailto:' + contactInfo.ContactElectronicMailAddress + ')';
        }

        return text;
    } else {
        return undefined;
    }
}

module.exports = WebMapServiceCatalogItem;
