'use strict';

/*global require*/

var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var CatalogItem = require('./CatalogItem');
var inherit = require('../Core/inherit');


/**
 * A {@link CatalogItem} representing a layer from the Bing Maps server.
 *
 * @alias EmbeddedContentCatalogItem
 * @constructor
 * @extends CatalogItem
 *
 * @param {Terria} terria The Terria instance.
 */
var EmbeddedContentCatalogItem = function(terria) {
    CatalogItem.call(this, terria);

    /**
     * Gets or sets the url of the embedded content.
     * @type {String}
     */
    this.embedUrl = undefined;

    /**
     * Gets or sets a value indicating whether this data source is mappable and should therefore show a checkbox.
     * This property is observable.
     * @type {Boolean}
     */
    this.isMappable = false;


    knockout.track(this, ['embedUrl']);
};

inherit(CatalogItem, EmbeddedContentCatalogItem);

defineProperties(EmbeddedContentCatalogItem.prototype, {
    /**
     * Gets the type of data item represented by this instance.
     * @memberOf EmbeddedContentCatalogItem.prototype
     * @type {String}
     */
    type : {
        get : function() {
            return 'embed';
        }
    },

    /**
     * Gets a human-readable name for this type of data source, 'Bing Maps'.
     * @memberOf EmbeddedContentCatalogItem.prototype
     * @type {String}
     */
    typeName : {
        get : function() {
            return 'Embedded Content Item';
        }
    },

});

module.exports = EmbeddedContentCatalogItem;
