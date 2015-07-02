'use strict';

/*global require*/
var URI = require('URIjs');

var ArcGisMapServerImageryProvider = require('terriajs-cesium/Source/Scene/ArcGisMapServerImageryProvider');
var Cartesian3 = require('terriajs-cesium/Source/Core/Cartesian3');
var defined = require('terriajs-cesium/Source/Core/defined');
var definedNotNull = require('terriajs-cesium/Source/Core/definedNotNull');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var WebMercatorProjection = require('terriajs-cesium/Source/Core/WebMercatorProjection');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');
var Metadata = require('./Metadata');
var MetadataItem = require('./MetadataItem');
var overrideProperty = require('../Core/overrideProperty');
var unionRectangleArray = require('../Map/unionRectangleArray');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from an Esri ArcGIS MapServer.
 *
 * @alias ArcGisMapServerCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var ArcGisMapServerCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);

    this._legendUrl = undefined;
    this._mapServerData = undefined;
    this._layersData = undefined;
    this._thisLayerInLayersData = undefined;
    this._allLayersInLayersData = undefined;

    /**
     * Gets or sets the URL of the WMS server.  This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the comma-separated list of layer IDs to show.  If this property is undefined,
     * all layers are shown.
     * @type {String}
     */
    this.layers = undefined;

    /**
     * Gets or sets the denominator of the largest scale (smallest denominator) for which tiles should be requested.  For example, if this value is 1000, then tiles representing
     * a scale larger than 1:1000 (i.e. numerically smaller denominator, when zooming in closer) will not be requested.  Instead, tiles of the largest-available scale, as specified by this property,
     * will be used and will simply get blurier as the user zooms in closer.
     * @type {Number}
     */
    this.maximumScale = undefined;

    knockout.track(this, ['url', 'layers', 'maximumScale', '_legendUrl']);

    // metadataUrl and legendUrl are derived from url if not explicitly specified.
    overrideProperty(this, 'metadataUrl', {
        get : function() {
            if (defined(this._metadataUrl)) {
                return this._metadataUrl;
            }

            return cleanUrl(this.url);
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
            return cleanUrl(this.url) + '/legend';
        },
        set : function(value) {
            this._legendUrl = value;
        }
    });

};

inherit(ImageryLayerCatalogItem, ArcGisMapServerCatalogItem);

defineProperties(ArcGisMapServerCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf ArcGisMapServerCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'esri-mapServer';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Esri ArcGIS MapServer'.
     * @memberOf ArcGisMapServerCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Esri ArcGIS MapServer';
        }
    },

    /**
     * Gets the metadata associated with this data source and the server that provided it, if applicable.
     * @memberOf ArcGisMapServerCatalogItem.prototype
     * @type {Metadata}
     */
    metadata : {
        get : function() {
            if (!defined(this._metadata)) {
                this._metadata = requestMetadata(this);
            }
            return this._metadata;
        }
    }
});

ArcGisMapServerCatalogItem.prototype._load = function() {
    if (!defined(this._mapServerData) || !defined(this._layersData)) {
        var terria = this.terria;
        var serviceUrl = cleanAndProxyUrl(terria, this.url) + '?f=json';
        var layersUrl = cleanAndProxyUrl(terria, this.url) + '/layers?f=json';

        var serviceMetadata = this.mapServerData || loadJson(serviceUrl);
        var layersMetadata = this.mapServerLayersData || loadJson(layersUrl);

        var that = this;
        return when.all([serviceMetadata, layersMetadata]).then(function(results) {
            that.updateFromMetadata(results[0], results[1], false);
        });
    }
};

ArcGisMapServerCatalogItem.prototype._createImageryProvider = function() {
    var maximumLevel;

    if (defined(this.maximumScale) && this.maximumScale > 0.0) {
        var dpi = 96; // Esri default DPI, unless we specify otherwise.
        var centimetersPerInch = 2.54;
        var centimetersPerMeter = 100;
        var dotsPerMeter = dpi * centimetersPerMeter / centimetersPerInch;
        var tileWidth = 256;

        var circumferenceAtEquator = 2 * Math.PI * Ellipsoid.WGS84.maximumRadius;
        var distancePerPixelAtLevel0 = circumferenceAtEquator / tileWidth;
        var level0ScaleDenominator = distancePerPixelAtLevel0 * dotsPerMeter;

        // 1e-6 epsilon from WMS 1.3.0 spec, section 7.2.4.6.9.
        var ratio = level0ScaleDenominator / (this.maximumScale - 1e-6);
        var levelAtMinScaleDenominator = Math.log(ratio) / Math.log(2);
        maximumLevel = levelAtMinScaleDenominator | 0;
    }

    return new ArcGisMapServerImageryProvider({
        url: cleanAndProxyUrl( this.terria, this.url),
        layers: getLayerList(this),
        tilingScheme: new WebMercatorTilingScheme(),
        maximumLevel: maximumLevel,
        mapServerData: this.mapServerData
    });
};

/**
 * Updates this catalog item from a the MapServer metadata and the MapServer/layers metadata.
 * @param {Object} mapServerJson The JSON metadata found at the /MapServer URL.
 * @param {Object} layersJson The JSON metadata found at the /MapServer/layers URL.
 * @param {Boolean} [overwrite=false] True to overwrite existing property values with data from the metadata; false to
 *                  preserve any existing values.
 * @param {Object} [thisLayerJson] A reference to this layer within the `layersJson` object.  If this parameter is not
 *                 specified, the layer is found automatically based on this catalog item's `layers` property.
 */
ArcGisMapServerCatalogItem.prototype.updateFromMetadata = function(mapServerJson, layersJson, overwrite, thisLayerJson) {
    if (!defined(thisLayerJson)) {
        thisLayerJson = findLayers(layersJson.layers, this.layers);
        if (!defined(thisLayerJson)) {
            return;
        }

        if (defined(this.layers)) {
            var layers = this.layers.split(',');
            for (var i = 0; i < thisLayerJson.length; ++i) {
                if (!defined(thisLayerJson[i])) {
                    console.log('A layer with the name or ID \"' + layers[i] + '\" does not exist on the ArcGIS MapServer - ignoring it.');
                    thisLayerJson.splice(i, 1);
                    layers.splice(i, 1);
                    --i;
                }
            }
        }

        if (thisLayerJson.length === 0) {
            return;
        }
    }

    this._mapServerData = mapServerJson;
    this._layersData = layersJson;

    if (Array.isArray(thisLayerJson)) {
        this._thisLayerInLayersData = thisLayerJson[0];
        this._allLayersInLayersData = thisLayerJson;
        thisLayerJson = this._thisLayerInLayersData;
    } else {
        this._thisLayerInLayersData = thisLayerJson;
        this._allLayersInLayersData = [thisLayerJson];
    }

    this.mapServerData = mapServerJson;

    updateValue(this, overwrite, 'dataCustodian', getDataCustodian(mapServerJson));
    updateValue(this, overwrite, 'maximumScale', thisLayerJson.maxScale);
    updateValue(this, overwrite, 'rectangle', getRectangleFromLayers(this._allLayersInLayersData));

    updateInfoSection(this, overwrite, 'Data Description', thisLayerJson.description);
    updateInfoSection(this, overwrite, 'Service Description', mapServerJson.serviceDescription);
    updateInfoSection(this, overwrite, 'Service Description', mapServerJson.description);
};

function getRectangleFromLayer(thisLayerJson) {
    var extent = thisLayerJson.extent;
    if (defined(extent) && extent.spatialReference && extent.spatialReference.wkid) {
        var wkid = extent.spatialReference.wkid;
        if (wkid === 4326 || wkid === 4283) {
            return Rectangle.fromDegrees(extent.xmin, extent.ymin, extent.xmax, extent.ymax);
        } else if (wkid === 3857 || wkid === 900913 || wkid === 102100 || wkid === 102113) {
            var projection = new WebMercatorProjection();
            var sw = projection.unproject(new Cartesian3(Math.max(extent.xmin, -Ellipsoid.WGS84.maximumRadius * Math.PI), Math.max(extent.ymin, -Ellipsoid.WGS84.maximumRadius * Math.PI), 0.0));
            var ne = projection.unproject(new Cartesian3(Math.min(extent.xmax, Ellipsoid.WGS84.maximumRadius * Math.PI), Math.min(extent.ymax, Ellipsoid.WGS84.maximumRadius * Math.PI), 0.0));
            return new Rectangle(Math.max(sw.longitude, -Math.PI), Math.max(sw.latitude, -WebMercatorProjection.MaximumLatitude), Math.min(ne.longitude, Math.PI), Math.min(ne.latitude, WebMercatorProjection.MaximumLatitude));
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

function getDataCustodian(mapServerJson) {
    if (mapServerJson && mapServerJson.documentInfo && mapServerJson.documentInfo.Author && mapServerJson.documentInfo.Author.length > 0) {
        return mapServerJson.documentInfo.Author;
    }
    return undefined;
}

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

function requestMetadata(item) {
    var result = new Metadata();

    result.isLoading = true;

    result.promise = when(item.load()).then(function() {
        populateMetadataGroup(result.serviceMetadata, item.mapServerData);

        if (!defined(item.layers)) {
            result.dataSourceErrorMessage = 'Using all layers from this service that are visible by default.  See the Service Details below.';
        } else if (defined(item._thisLayerInLayersData)) {
            populateMetadataGroup(result.dataSourceMetadata, item._thisLayerInLayersData);
        } else {
            result.dataSourceErrorMessage = 'No details are available.';
        }

        result.isLoading = false;
    }).otherwise(function() {
        result.dataSourceErrorMessage = 'An error occurred while invoking the ArcGIS map service.';
        result.serviceErrorMessage = 'An error occurred while invoking the ArcGIS map service.';
        result.isLoading = false;
    });

    return result;
}

function populateMetadataGroup(metadataGroup, sourceMetadata) {
    if (typeof sourceMetadata === 'string' || sourceMetadata instanceof String) {
        return;
    }

    if (sourceMetadata instanceof Array && (sourceMetadata.length === 0 || typeof sourceMetadata[0] !== 'object')) {
        return;
    }

    for (var name in sourceMetadata) {
        if (sourceMetadata.hasOwnProperty(name)) {
            var value = sourceMetadata[name];

            var dest = new MetadataItem();
            dest.name = name;
            dest.value = value;

            populateMetadataGroup(dest, value);

            metadataGroup.items.push(dest);
        }
    }
}

function findLayer(layers, id) {
    id = id.toString();
    var idLowerCase = id.toLowerCase();
    var foundByName;
    for (var i = 0; i < layers.length; ++i) {
        var layer = layers[i];
        if (layer.id.toString() === id) {
            return layer;
        } else if (layer.name.toLowerCase() === idLowerCase) {
            foundByName = layer;
        }
    }
    return foundByName;
}

/* Given a comma-separated string of layer names, returns the layer objects corresponding to them. */
function findLayers(layers, names) {
    if (!defined(names)) {
        // If a list of layers is not specified, we're using all layers.
        return layers;
    }
    return names.split(',').map(function(id) {
        return findLayer(layers, id);
    });
}

function getLayerList(catalogItem) {
    if (catalogItem._allLayersInLayersData && catalogItem._allLayersInLayersData.length > 0) {
        var layers = [];
        for (var i = 0; i < catalogItem._allLayersInLayersData.length; ++i) {
            if (defined(catalogItem._allLayersInLayersData[i]) && defined(catalogItem._allLayersInLayersData[i].id)) {
                layers.push(catalogItem._allLayersInLayersData[i].id.toString());
            }
        }
        return layers.join(',');
    } else {
        return catalogItem.layers;
    }
}

module.exports = ArcGisMapServerCatalogItem;
