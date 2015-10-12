'use strict';

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var QuadtreePrimitive = require('terriajs-cesium/Source/Scene/QuadtreePrimitive');

var WfsTileProvider = require("terriajs-cesium-buildings/lib/WfsTileProvider");

//var Metadata = require('./Metadata');
//var ModelError = require('./ModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');

/**
 * A {@link CatalogItem} representing WFS feature data that will be tiled.
 *
 * This uses Cesium.QuadtreePrimitive to display potentially massive datasets.
 *
 *
 * @alias TiledWebFeatureServiceCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 * @param {String} [url] The URL from which to retrieve the KML or KMZ data.
 */
var TiledWebFeatureServiceCatalogItem =  function(terria) {
     CatalogItem.call(this, terria);

    this._dataUrl = undefined;
    this._dataUrlType = undefined;
    this._metadataUrl = undefined;

    this._terria = terria;

    /**
     * Gets or sets the URL from which to retrieve data.
     * This property is observable.
     * @type {String}
     */
    this.url = '';
    this.typeNames = '';


    this._tileProvider = undefined;
    
    knockout.track(this, ['url']);
    console.log("TiledWebFeatureServiceCatalogItem", this.__dataUrl);
};

inherit(CatalogItem, TiledWebFeatureServiceCatalogItem);

defineProperties(TiledWebFeatureServiceCatalogItem.prototype, {
    /**
     * Gets the type of data member represented by this instance.
     * @memberOf TiledWebFeatureServiceCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'twfs';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'KML'.
     * @memberOf TiledWebFeatureServiceCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Tiled WFS';
        }
    },

});

TiledWebFeatureServiceCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
    return [this.url, this.typeNames];
};

/**
 * _load base implementation (do nothing) is sufficient
 * since the QuadtreePrimitive handles the actual loading depending on the camera
 * position
 */

TiledWebFeatureServiceCatalogItem.prototype._enable = function() {
};

TiledWebFeatureServiceCatalogItem.prototype._disable = function() {
};

TiledWebFeatureServiceCatalogItem.prototype._show = function() {
    if (!defined(this._tileProvider)) {
        this._tileProvider = new WfsTileProvider({
                           url: this.url,
                           layerName: this.typeNames,
                           zOffset: 30,
                           workerDir: 'build/TerriaJS/build'
                           });
        this._quadTreePrimitive = new QuadtreePrimitive({tileProvider : this._tileProvider});
    }

    var primitives = this._terria.cesium.scene.primitives;
    if (!primitives.contains(this._quadTreePrimitive)) {
        primitives.add(this._quadTreePrimitive);
    }

    this._tileProvider.show = true;
};

TiledWebFeatureServiceCatalogItem.prototype._hide = function() {
    if (!defined(this._quadTreePrimitive)) {
        throw new DeveloperError('This data source is not enabled.');
    }

    this._tileProvider.show = false;
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


module.exports = TiledWebFeatureServiceCatalogItem;
