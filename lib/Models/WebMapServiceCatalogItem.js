'use strict';

/*global require*/
var URI = require('urijs');

var clone = require('terriajs-cesium/Source/Core/clone');
var combine = require('terriajs-cesium/Source/Core/combine');
var defined = require('terriajs-cesium/Source/Core/defined');
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
var TerriaError = require('../Core/TerriaError');
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var overrideProperty = require('../Core/overrideProperty');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var unionRectangleArray = require('../Map/unionRectangleArray');
var xml2json = require('../ThirdParty/xml2json');
var LegendUrl = require('../Map/LegendUrl');

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
    this._getCapabilitiesUrl = undefined;
    this._legendUrl = undefined;
    this._rectangle = undefined;
    this._rectangleFromMetadata = undefined;
    this._intervalsFromMetadata = undefined;

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

    /**
     * Gets or sets the maximum number of intervals that can be created by a single
     * date range, when specified in the form time/time/periodicity.
     * eg. 2015-04-27T16:15:00/2015-04-27T18:45:00/PT15M has 11 intervals
     * @type {Number}
     */
    this.maxRefreshIntervals = 1000;

    /**
     * Gets or sets whether this WMS has been identified as being provided by a GeoServer.
     * @type {Boolean}
     */
    this.isGeoServer = undefined;

    /**
     * Gets or sets whether this WMS has been identified as being provided by an Esri ArcGIS MapServer. No assumption is made about where an ArcGIS MapServer endpoint also exists.
     * @type {Boolean}
     */
    this.isEsri = undefined;

    /**
     * Gets or sets how many seconds time-series data with a start date but no end date should last, in seconds.
     * @type {Number}
     */
    this.displayDuration = undefined;

    this._sourceInfoItemNames = ['GetCapabilities URL'];

    knockout.track(this, [
        '_getCapabilitiesUrl', '_legendUrl', '_rectangle', '_rectangleFromMetadata', '_intervalsFromMetadata',
        'layers', 'parameters', 'getFeatureInfoFormats',
        'tilingScheme', 'populateIntervalsFromTimeDimension', 'minScaleDenominator']);

    // getCapabilitiesUrl and legendUrl are derived from url if not explicitly specified.
    overrideProperty(this, 'getCapabilitiesUrl', {
        get: function() {
            if (defined(this._getCapabilitiesUrl)) {
                return this._getCapabilitiesUrl;
            }

            if (defined(this.metadataUrl)) {
                return this.metadataUrl;
            }

            if (!defined(this.url)) {
                return undefined;
            }

            return cleanUrl(this.url) + '?service=WMS&version=1.3.0&request=GetCapabilities';
        },
        set: function(value) {
            this._getCapabilitiesUrl = value;
        }
    });

    overrideProperty(this, 'legendUrl', {
        get : function() {
            if (defined(this._legendUrl)) {
                return this._legendUrl;
            }
            if (!defined(this.url)) {
                return undefined;
            }
            var layer = this.layers.split(',')[0];
            // This is a double fallback. Generally we get a legend URL from the getCapabilities, or it's not supplied in the init file.
            return new LegendUrl(cleanUrl(this.url) +
                '?service=WMS&version=1.1.0&request=GetLegendGraphic&format=image/png&transparent=True&layer=' + layer, 'image/png');
        },
        set : function(value) {
            this._legendUrl = value;
        }
    });

    // The dataUrl must be explicitly specified.  Don't try to use `url` as the the dataUrl, because it won't work for a WMS URL.
    overrideProperty(this, 'dataUrl', {
        get : function() {
            return this._dataUrl;
        },
        set : function(value) {
            this._dataUrl = value;
        }
    });

    overrideProperty(this, 'dataUrlType', {
        get : function() {
            return this._dataUrlType;
        },
        set : function(value) {
            this._dataUrlType = value;
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
WebMapServiceCatalogItem.defaultSerializers.getCapabilitiesUrl = function(wmsItem, json, propertyName) {
    json.getCapabilitiesUrl = wmsItem._getCapabilitiesUrl;
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

    if (!defined(this.isGeoServer) && capabilities && capabilities.Service && capabilities.Service.KeywordList && capabilities.Service.KeywordList.Keyword && capabilities.Service.KeywordList.Keyword.indexOf('GEOSERVER') >= 0) {
        this.isGeoServer = true;
    }

    if (!defined(this.isEsri) && defined(capabilities["xmlns:esri_wms"]) || this.url.match(/\/MapServer\//)) {
        this.isEsri = true;
    }

    if (!defined(thisLayer)) {
        thisLayer = findLayers(capabilities.Capability.Layer, this.layers);

        if (defined(this.layers)) {
            var layers = this.layers.split(',');
            for (var i = 0; i < thisLayer.length; ++i) {
                if (!defined(thisLayer[i])) {
                    if (thisLayer.length > 1) {
                        console.log('A layer with the name or ID \"' + layers[i] + '\" does not exist on the WMS Server - ignoring it.');
                        thisLayer.splice(i, 1);
                        layers.splice(i, 1);
                        --i;
                    } else {
                        var suggested = capabilities && capabilities.Capability && capabilities.Capability.Layer && capabilities.Capability.Layer.Layer && capabilities.Capability.Layer.Layer.Name;
                        suggested = suggested ? ' (Perhaps it should be "' + suggested + '").' : '';
                        throw new TerriaError({
                            title: 'No layer found',
                            message: 'The WMS dataset "' + this.name + '" has no layers matching "' + this.layers + '".' + suggested +
                            '\n\nEither the catalog file has been set up incorrectly, or the WMS server has changed.' +
                            '\n\nPlease report this error by sending an email to <a href="mailto:' + this.terria.supportEmail + '">' + this.terria.supportEmail + '</a>.'
                        });
                    }
                } else {
                    layers[i] = thisLayer[i].Name;
                }
            }

            this.layers = layers.join(',');
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

    var service = defined(capabilities.Service) ? capabilities.Service : {};

    // Show the service abstract if there is one, and if it isn't the Geoserver default "A compliant implementation..."
    if (!containsAny(service.Abstract, WebMapServiceCatalogItem.abstractsToIgnore) && service.Abstract !== thisLayer.Abstract) {
        updateInfoSection(this, overwrite, 'Service Description', service.Abstract);
    }

    var legendUri, legendMimeType;
    // If style is defined in parameters, use that, but only if a style with that name can be found.
    // Otherwise use first style in list.
    var style = Array.isArray(thisLayer.Style) ? thisLayer.Style[0] : thisLayer.Style;
    if (defined(this.parameters.styles)) {
        var styleName = this.parameters.styles;
        if (Array.isArray(thisLayer.Style)) {
            for (var ind=0; ind<thisLayer.Style.length; ind++) {
                if (thisLayer.Style[ind].Name === styleName) {
                    style = thisLayer.Style[ind];
                }
            }
        } else {
            if (thisLayer.style.styleName === styleName) {
                style = thisLayer.style;
            }
        }
    }

    if (defined(style) && defined(style.LegendURL)) {
        // According to the WMS schema, LegendURL is unbounded.
        var legendUrl = Array.isArray(style.LegendURL) ? style.LegendURL[0] : style.LegendURL;
        legendUri = new URI(decodeURIComponent(legendUrl.OnlineResource['xlink:href']));
        legendMimeType = legendUrl.Format;
    } else if (!defined(this._legendUrl)) {
        legendMimeType = this.legendUrl.mimeType;
        legendUri = new URI(this.legendUrl.url);
    }
    if (defined(legendUri)) {
        // We want to tweak either the URL we just picked up from GetCapabilities, or the default generated one. We leave any
        // catalog-provided URLs alone.
        if (legendUri.toString().match(/GetLegendGraphic/i)) {
            if (this.isGeoServer) {
                legendUri.setQuery('version', '1.1.0');
                var legendOptions = 'fontSize:14;forceLabels:on;fontAntiAliasing:true';
                legendUri.setQuery('transparent','True');       // remove if our background is no longer light
                // legendOptions += ';fontColor:0xDDDDDD' // enable if we can ensure a dark background
                // legendOptions += ';dpi:182';           // enable if we can scale the image back down by 50%.
                legendUri.setQuery('LEGEND_OPTIONS',legendOptions);
            } else if (this.isEsri) {
                // This sets the total dimensions of the legend, but if we don't know how many styles are included, we could make it worse
                // In some cases (eg few styles), we could increase the height to give them more room. But if we always force the height
                // and there are many styles, they'll end up very cramped. About the only solution would be to fetch the default legend, and then ask
                // for a legend that's a bit bigger than the default.
                // uri.setQuery('width', '300');
                // uri.setQuery('height', '300');

            }
            if (defined(this.parameters)) {
                for (var key in this.parameters) {
                  if (this.parameters.hasOwnProperty(key)) {
                    legendUri.setQuery(key,this.parameters[key]);
                  }
                }
            }

        }
        var legend = new LegendUrl(legendUri.toString(), legendMimeType);
        updateValue(this, overwrite, '_legendUrl', legend);
    }

    if (defined(style) && defined(style.MetadataURL)) {
        var metadataUrls = (Array.isArray(style.MetadataURL) ? style.MetadataURL : [style.MetadataURL])
            .map(function(metadataUrl) {
                return metadataUrl.OnlineResource['xlink:href'];
            })
            .join('<br>');

        updateInfoSection(this, overwrite, 'Metadata Links', metadataUrls);
    }

    // Show the Access Constraints if it isn't "none" (because that's the default, and usually a lie).
    if (defined(service.AccessConstraints) && !/^none$/i.test(service.AccessConstraints)) {
        updateInfoSection(this, overwrite, 'Access Constraints', service.AccessConstraints);
    }

    updateInfoSection(this, overwrite, 'Service Contact', getServiceContactInformation(capabilities));
    updateInfoSection(this, overwrite, 'GetCapabilities URL', this.getCapabilitiesUrl);

    updateValue(this, overwrite, 'minScaleDenominator', thisLayer.MinScaleDenominator);
    updateValue(this, overwrite, 'getFeatureInfoFormats', getFeatureInfoFormats(capabilities));
    updateValue(this, overwrite, 'rectangle', getRectangleFromLayers(this._allLayersInRawMetadata));
    updateValue(this, overwrite, 'intervals', getIntervalsFromLayer(this, thisLayer));

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
    var that = this;
    var promises = [];

    if (!defined(this._rawMetadata)) {
        promises.push(loadXML(proxyCatalogItemUrl(that, that.getCapabilitiesUrl, '1d')).then(function(xml) {
            var metadata = capabilitiesXmlToJson(xml);
            that.updateFromCapabilities(metadata, false);
        }));
    }

    // Query WMS for wfs or wcs URL if no dataUrl is present
    if (!defined(this.dataUrl)) {
        var describeLayersURL = cleanUrl(this.url) + '?service=WMS&version=1.1.1&sld_version=1.1.0&request=DescribeLayer&layers=' + encodeURIComponent(this.layers);

        promises.push(loadXML(proxyCatalogItemUrl(this, describeLayersURL, '1d')).then(function(xml) {
            var json = xml2json(xml);
            // LayerDescription could be an array. If so, only use the first element
            var LayerDescription = (json.LayerDescription instanceof Array) ? json.LayerDescription[0] : json.LayerDescription;
            if (defined(LayerDescription) && defined(LayerDescription.owsURL) && defined(LayerDescription.owsType)) {
                switch (LayerDescription.owsType.toLowerCase()) {
                    case 'wfs':
                        if (defined(LayerDescription.Query) && defined(LayerDescription.Query.typeName)) {
                            that.dataUrl = cleanUrl(LayerDescription.owsURL) + '?service=WFS&version=1.1.0&request=GetFeature&typeName=' + LayerDescription.Query.typeName + '&srsName=EPSG%3A4326&maxFeatures=1000';
                            that.dataUrlType = 'wfs-complete';
                        }
                        else {
                            that.dataUrl = cleanUrl(LayerDescription.owsURL);
                            that.dataUrlType = 'wfs';
                        }
                        break;
                    case 'wcs':
                        if (defined(LayerDescription.Query) && defined(LayerDescription.Query.typeName)) {
                            that.dataUrl = cleanUrl(LayerDescription.owsURL) + '?service=WCS&version=1.1.1&request=DescribeCoverage&identifiers=' + LayerDescription.Query.typeName;
                            that.dataUrlType = 'wcs-complete';
                        }
                        else {
                            that.dataUrl = cleanUrl(LayerDescription.owsURL);
                            that.dataUrlType = 'wcs';
                        }
                        break;
                }
            }
        }).otherwise(function(err) { })); // Catch potential XML error - doesn't matter if URL can't be retrieved
    }

    return when.all(promises);
};

WebMapServiceCatalogItem.prototype._createImageryProvider = function(time) {
    var parameters = objectToLowercase(this.parameters);
    if (defined(time)) {
        parameters = combine({ time: time }, parameters);
    }

    parameters = combine(parameters, WebMapServiceCatalogItem.defaultParameters);
    // request one more feature than we will show, so that we can tell the user if there are more not shown
    if (defined(parameters.feature_count)) {
        console.log(this.name + ': using parameters.feature_count (' + parameters.feature_count + ') to override maximumShownFeatureInfos (' + this.maximumShownFeatureInfos + ').');
        if (parameters.feature_count === 1) {
            this.maximumShownFeatureInfos = 1;
        } else {
            this.maximumShownFeatureInfos = parameters.feature_count - 1;
        }
    } else {
        parameters.feature_count = this.maximumShownFeatureInfos + 1;
    }

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
        url : cleanAndProxyUrl(this, this.url),
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

function cleanAndProxyUrl(catalogItem, url) {
    return proxyCatalogItemUrl(catalogItem, cleanUrl(url));
}

function cleanUrl(url) {
    // Strip off the search portion of the URL
    var uri = new URI(url);
    uri.search('');
    return uri.toString();
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

function addDurationFromString(start, durationString, wmsItem) {
    // given an ISO8601 duration string such as PT1H or PT30M or P1D
    // add this duration to the start date
    // NOTE start is a javascript date, as is the result
    // returns false if the durationString is badly formed
    var matches = durationString.match(/^P(([0-9]+)D)?T?(([0-9]+)H)?(([0-9]+)M)?(([0-9]+)S)?$/);
    var stop = JulianDate.clone(start);
    if (matches) {
        // use +matches[i] to force number addition instead of string concatenation
        if (matches[2]) {
            JulianDate.addDays(start, +matches[2], stop);
        }
        if (matches[4]) {
            JulianDate.addHours(start, +matches[4], stop);
        }
        if (matches[6]) {
            JulianDate.addMinutes(start, +matches[6], stop);
        }
        if (matches[8]) {
            JulianDate.addSeconds(start, +matches[8], stop);
        }
    } else {
        wmsItem.terria.error.raiseEvent(new TerriaError({
            title: 'Badly formatted periodicity',
            message: '\
The "' + wmsItem.name + '" dataset has a badly formed periodicity, "' + durationString +
            '".  Click the dataset\'s Info button for more information about the dataset and the data custodian.'
        }));
        return false;
    }
    return stop;
}

function updateIntervalsFromIsoSegments(intervals, isoSegments, time, wmsItem) {
    var start = JulianDate.fromIso8601(isoSegments[0]);
    var stop = JulianDate.fromIso8601(isoSegments[1]);
    if (isoSegments.length === 2) {
        intervals.addInterval(new TimeInterval({
            start: start,
            stop: stop,
            data: time // http://mapserver.org/ogc/wms_time.html#supported-time-requests
        }));
    } else {
        // Note WMS uses extension ISO19128 of ISO8601; ISO 19128 allows start/end/periodicity
        // and does not use the "R[n]/" prefix for repeated intervals
        // eg. Data refreshed every 30 min: 2000-06-18T14:30Z/2000-06-18T14:30Z/PT30M
        // See 06-042_OpenGIS_Web_Map_Service_WMS_Implementation_Specification.pdf section D.4
        var thisStop = start,
            prevStop = start,
            stopDate = stop,
            count = 0;

        // Add intervals starting at start until:
        //    we detect a bad periodicity (which sets thisStop to false), or
        //    we go past the stop date, or
        //    we go past the max limit
        while (thisStop && prevStop <= stopDate && count < wmsItem.maxRefreshIntervals) {
            thisStop = addDurationFromString(prevStop, isoSegments[2], wmsItem);
            intervals.addInterval(new TimeInterval({
                start: prevStop,
                stop: thisStop || prevStop, // if there was a bad periodicity, use prevStop
                data: JulianDate.toIso8601(prevStop) // used to form the web request
            }));
            prevStop = thisStop;
            count++;
        }
    }
}

function updateIntervalsFromTimes(result, times, index, defaultDuration) {
    var start = JulianDate.fromIso8601(times[index]);
    var stop;

    if (defaultDuration) {
        stop = JulianDate.addMinutes(start, defaultDuration, new JulianDate());
    } else if (index < times.length - 1) {
        // if the next date has a slash in it, just use the first part of it
        var nextTimeIsoSegments = times[index + 1].split('/');
        stop = JulianDate.fromIso8601(nextTimeIsoSegments[0]);
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
        data: times[index]
    }));

}

function getIntervalsFromLayer(wmsItem, layer) {
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
            // If there is a single Extent, then extentList will actually be a string
            if (extentList instanceof String || typeof extentList === 'string') {
                extent = extentList;
            } else {
                for (var extentIndex = 0; extentIndex < extentList.length; ++extentIndex) {
                    var candidate = extentList[extentIndex];
                    if (candidate.name === 'time') {
                        extent = candidate;
                        break;
                    }
                }
            }
        }

        if (!defined(extent)) {
            return undefined;
        }

        var times = extent.split(',');

        for (var j = 0; j < times.length; ++j) {
            var isoSegments = times[j].split('/');
            if (isoSegments.length > 1) {
                updateIntervalsFromIsoSegments(result, isoSegments, times[j], wmsItem);
            } else {
                updateIntervalsFromTimes(result, times, j, wmsItem.displayDuration);
            }
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
        return findLayer(startLayer, i, false) || findLayer(startLayer, i, true);
    });
}

function findLayer(startLayer, name, allowMatchByTitle) {
    if (startLayer.Name === name || (allowMatchByTitle && startLayer.Title === name && defined(startLayer.Name))) {
        return startLayer;
    }

    var layers = startLayer.Layer;
    if (!defined(layers)) {
        return undefined;
    }

    var found = findLayer(layers, name, allowMatchByTitle);
    for (var i = 0; !found && i < layers.length; ++i) {
        var layer = layers[i];
        found = findLayer(layer, name, allowMatchByTitle);
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
    if (!defined(sectionValue) || sectionValue.length === 0) {
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
    if (!defined(propertyValue)) {
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

function getServiceContactInformation(capabilities) {
    if (defined(capabilities.Service.ContactInformation)) {
        var contactInfo = capabilities.Service.ContactInformation;

        var text = '';

        var primary = contactInfo.ContactPersonPrimary;
        if (defined(primary)) {
            if (defined(primary.ContactOrganization) && primary.ContactOrganization.length > 0) {
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

// This is copied directly from Cesium's WebMapServiceImageryProvider.
function objectToLowercase(obj) {
    var result = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key.toLowerCase()] = obj[key];
        }
    }
    return result;
}


module.exports = WebMapServiceCatalogItem;
