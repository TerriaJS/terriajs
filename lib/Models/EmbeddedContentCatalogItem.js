'use strict';

/*global require*/

var clone = require('terriajs-cesium/Source/Core/clone');
var defineProperties = require('terriajs-cesium/Source/Core/defineProperties');
var freezeObject = require('terriajs-cesium/Source/Core/freezeObject');
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
    this.url = undefined;

    this.isMappable = false;

    knockout.track(this, ['url']);
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

    /**
     * Gets the set of names of the properties to be serialized for this object when {@link CatalogMember#serializeToJson} is called
     * and the `serializeForSharing` flag is set in the options.
     * @memberOf EmbeddedContentCatalogItem.prototype
     * @type {String[]}
     */
    propertiesForSharing : {
        get : function() {
            return EmbeddedContentCatalogItem.defaultPropertiesForSharing;
        }
    }
});

/**
 * Gets or sets the default set of properties that are serialized when serializing a {@link CatalogItem}-derived object with the
 * `serializeForSharing` flag set in the options.
 * @type {String[]}
 */
EmbeddedContentCatalogItem.defaultPropertiesForSharing = clone(CatalogItem.defaultPropertiesForSharing);
EmbeddedContentCatalogItem.defaultPropertiesForSharing.push('url');
freezeObject(EmbeddedContentCatalogItem.defaultPropertiesForSharing);

module.exports = EmbeddedContentCatalogItem;
