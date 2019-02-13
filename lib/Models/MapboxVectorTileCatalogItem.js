const MapboxVectorTileImageryProvider = require('../Map/MapboxVectorTileImageryProvider');
const clone = require('terriajs-cesium/Source/Core/clone');
const defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
const defined = require('terriajs-cesium/Source/Core/defined');
const defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
const ImageryLayerFeatureInfo = require('terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo');
const ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
const inherit = require('../Core/inherit');
const knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
const Legend = require('../Map/Legend');
const overrideProperty = require('../Core/overrideProperty');
const Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

/**
 * A {@link ImageryLayerCatalogItem} representing a rasterised Mapbox vector tile layer.
 *
 * @alias MapboxVectorTileCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
const MapboxVectorTileCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);
    this.lineColor = '#000000';
    this.fillColor = 'rgba(0,0,0,0)';
    this.layer = undefined;
    this.idProp = 'FID';
    this.nameProp = undefined;
    this._legendUrl = undefined;


    overrideProperty(this, 'legendUrl', {
        get: function() {
            if (defined(this._legendUrl)) {
                return this._legendUrl;
            } else {
                return new Legend({
                    items: [
                        {
                            color: this.fillColor,
                            lineColor: this.lineColor,
                            title: this.name
                        }
                    ]
                }).getLegendUrl();
            }
        },
        set: function(value) {
            this._legendUrl = value;
        }
    });
};

inherit(ImageryLayerCatalogItem, MapboxVectorTileCatalogItem);

defineProperties(MapboxVectorTileCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf MapboxVectorTileCatalogItem.prototype
     * @type {String}
     */
    type: {
        get: function() {
            return 'mvt';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Mapbox vector tile'.
     * @memberOf MapboxVectorTileCatalogItem.prototype
     * @type {String}
     */
    typeName: {
        get: function() {
            return 'Mapbox vector tile';
        }
    },
});

MapboxVectorTileCatalogItem.prototype._createImageryProvider = function() {

    return new MapboxVectorTileImageryProvider({
        url: this.url,
        layerName: this.layer,
        styleFunc: () => ({
            // color is an Array-like object (note: typed arrays don't have a 'join' method in IE10 & IE11)
            fillStyle: this.fillColor,
            strokeStyle: this.lineColor,
            lineWidth: 1
        }),
        rectangle: this.rectangle,
        minimumZoom: 0,
        maximumNativeZoom: 12,
        maximumZoom: 28,
        uniqueIdProp: undefined,
        featureInfoFunc: feature => featureInfoFromFeature(this, feature)
    });
};

function featureInfoFromFeature(mapboxVectorTileCatalogItem, feature) {
    const featureInfo = new ImageryLayerFeatureInfo();
    if (defined(mapboxVectorTileCatalogItem.nameProp)) {
        featureInfo.name = feature.properties[mapboxVectorTileCatalogItem.nameProp];
    }
    featureInfo.properties = clone(feature.properties);
    featureInfo.data = { id: feature.properties[mapboxVectorTileCatalogItem.idProp] }; // For highlight
    return featureInfo;
}

module.exports = MapboxVectorTileCatalogItem;
