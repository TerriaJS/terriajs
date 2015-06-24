'use strict';

/*global require*/

var OpenStreetMapImageryProvider = require('terriajs-cesium/Source/Scene/OpenStreetMapImageryProvider');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var ImageryLayerCatalogItem = require('./ImageryLayerCatalogItem');
var inherit = require('../Core/inherit');

/**
 * A {@link ImageryLayerCatalogItem} representing a layer from the Open Street Map server.
 *
 * @alias OpenStreetMapCatalogItem
 * @constructor
 * @extends ImageryLayerCatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var OpenStreetMapCatalogItem = function(terria) {
    ImageryLayerCatalogItem.call(this, terria);

    /**
     * Gets or sets the URL from which to retrieve Open Street Map data.
     * This property is observable.
     * @type {String}
     */
    this.url = '';

    /**
     * Gets or sets the file extension used to retrieve Open Street Map data
     * This property is observable.
     * @type {String}
     */
    this.fileExtension = 'png';

    /**
     * Gets or sets the maximum tile level to retrieve from Open Street Map data
     * This property is observable.
     * @type {String}
     */
    this.maximumLevel = 25;

    /**
     * Gets or sets the attribution to display with the data
     * This property is observable.
     * @type {String}
     */
    this.attribution = undefined;

    knockout.track(this, ['url', 'fileExtension', 'maximumLevel', 'attribution']);
};

inherit(ImageryLayerCatalogItem, OpenStreetMapCatalogItem);

defineProperties(OpenStreetMapCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf OpenStreetMapCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'open-street-map';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'OpenStreet Map'.
     * @memberOf OpenStreetMapCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Open Street Map';
        }
    }
});

OpenStreetMapCatalogItem.prototype._createImageryProvider = function() {
    return new OpenStreetMapImageryProvider({
        url: this.url,
        fileExtension: this.fileExtension,
        maximumLevel: this.maximumLevel,
        credit: this.attribution
    });
};

module.exports = OpenStreetMapCatalogItem;
