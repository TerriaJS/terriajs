'use strict';

/*global require,Document*/

var defined = require('terriajs-cesium/Source/Core/defined');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var KmlDataSource = require('terriajs-cesium/Source/DataSources/KmlDataSource');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var PolygonHierarchy = require('terriajs-cesium/Source/Core/PolygonHierarchy');
var sampleTerrain = require('terriajs-cesium/Source/Core/sampleTerrain');
var when = require('terriajs-cesium/Source/ThirdParty/when');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var RectanglePrimitive = require('terriajs-cesium/Source/Scene/RectanglePrimitive');
var QuadtreePrimitive = require('terriajs-cesium/Source/Scene/QuadtreePrimitive');

var WfsTileProvider = require("cesium-buildings/lib/WfsTileProvider");

var Metadata = require('./Metadata');
var ModelError = require('./ModelError');
var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var readXml = require('../Core/readXml');

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
var TiledWebFeatureServiceCatalogItem =  function(terria, url) {
     CatalogItem.call(this, terria);

    this._kmlDataSource = undefined;
    this._terria = terria;

    /**
     * Gets or sets the URL from which to retrieve data.
     * This property is observable.
     * @type {String}
     */
    this.url = url;
    console.log("TiledWebFeatureServiceCatalogItem dataUrl", this.url);


    this._tileProvider = new WfsTileProvider({
                       url: 'http://37.187.164.233/cgi-bin/tinyows_australia',
                       layerName: 'tows:goldcoast',
                       zOffset: 30
                       });
    this._quadTreePrimitive = new QuadtreePrimitive({tileProvider : this._tileProvider});
    //this._quadTreePrimitive = new RectanglePrimitive({
    //        rectangle : Rectangle.fromDegrees(120, -30.0, 150.0, -15.0)
    //    });

    knockout.track(this, ['url']);
    console.log("TiledWebFeatureServiceCatalogItem dataUrl", this.url);
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
    return [this.url];
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
    if (!defined(this._quadTreePrimitive)) {
        throw new DeveloperError('This data source is not enabled.');
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

module.exports = TiledWebFeatureServiceCatalogItem;
